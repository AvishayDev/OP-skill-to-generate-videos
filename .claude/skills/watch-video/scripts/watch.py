#!/usr/bin/env python3
"""Watch a video from a link (or a local file) so Claude can see and hear it.

Downloads it with yt-dlp (YouTube, Instagram, TikTok, X, Facebook, Vimeo, direct .mp4 links… whatever yt-dlp
supports), samples frames into labelled contact sheets, transcribes the speech with faster-whisper and writes a
report.md that points at everything. Claude then Reads the sheets (images) and the transcript.

Usage: python3 watch.py <url-or-file> [--out DIR] [--frames N] [--every S] [--scenes] [--start S] [--end S]
                        [--model M] [--lang CODE] [--no-transcript] [--keep-video] [--cookies FILE]
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
COLS, ROWS, THUMB_W = 3, 3, 480


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kw)


def slug(text):
    s = re.sub(r"[^\w-]+", "-", text, flags=re.UNICODE).strip("-").lower()
    return (s or "video")[:60]


def clock(t):
    t = int(round(t))
    return f"{t // 3600}:{t // 60 % 60:02d}:{t % 60:02d}" if t >= 3600 else f"{t // 60}:{t % 60:02d}"


def ensure_ytdlp():
    try:
        import yt_dlp  # noqa: F401
    except ImportError:
        print("installing yt-dlp…", file=sys.stderr)
        pkg = "yt-dlp[default]"  # [default] brings the YouTube challenge solver
        if subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--break-system-packages", pkg],
                          capture_output=True).returncode:
            subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--user", pkg], capture_output=True)
    import yt_dlp
    return yt_dlp


def ydl_opts(out, cookies):
    opts = {
        "format": "bv*[height<=720]+ba/b[height<=720]/bv*+ba/b",
        "merge_output_format": "mp4",
        "outtmpl": str(out / "video.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "noprogress": True,
        "no_warnings": True,
        "js_runtimes": {"node": {}, "deno": {}},
    }
    if cookies:
        opts["cookiefile"] = cookies
    return opts


def download(url, out, cookies):
    """→ (video file or None, info). None when the stream is blocked but the page could still be read."""
    yt_dlp = ensure_ytdlp()
    opts = ydl_opts(out, cookies)
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except Exception as e:  # noqa: BLE001
        print(f"⚠ video download failed ({str(e).splitlines()[0][:160]}) — trying page info only", file=sys.stderr)
        with yt_dlp.YoutubeDL({**opts, "skip_download": True}) as ydl:
            return None, ydl.extract_info(url, download=False)
    files = [p for p in out.glob("video.*") if p.suffix not in (".part", ".ytdl", ".json")]
    return (files[0] if files else None), info


def page_meta(info):
    keep = ("title", "uploader", "channel", "upload_date", "duration", "view_count", "like_count",
            "description", "webpage_url", "extractor_key", "tags", "chapters", "width", "height", "fps", "language")
    return {k: info.get(k) for k in keep if info.get(k) is not None}


def fetch(url, headers=None):
    import urllib.request
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def storyboard_frames(info, times, folder):
    """Frames from the site's storyboard (YouTube's seek-preview tiles) when the video itself can't be fetched."""
    import io
    from PIL import Image
    boards = [f for f in info.get("formats") or [] if f.get("format_note") == "storyboard" and f.get("fragments")]
    if not boards:
        return []
    sb = max(boards, key=lambda f: f.get("width") or 0)
    cols, rows, fps = sb.get("columns") or 1, sb.get("rows") or 1, sb.get("fps") or 0.5
    per = cols * rows
    folder.mkdir(parents=True, exist_ok=True)
    cache, shots = {}, []
    for i, t in enumerate(times):
        tile = int(t * fps)
        frag, k = divmod(tile, per)
        if frag >= len(sb["fragments"]):
            continue
        if frag not in cache:
            try:
                cache[frag] = Image.open(io.BytesIO(fetch(sb["fragments"][frag]["url"], sb.get("http_headers"))))
            except Exception:  # noqa: BLE001
                cache[frag] = None
        grid = cache[frag]
        if grid is None:
            continue
        w, h = grid.width // cols, grid.height // rows
        x, y = (k % cols) * w, (k // cols) * h
        if y + h > grid.height:
            continue
        img = folder / f"f{i + 1:04d}_{t:08.2f}s.jpg"
        crop = grid.crop((x, y, x + w, y + h)).convert("RGB")
        crop.resize((THUMB_W, round(THUMB_W * h / w))).save(img, quality=85)
        shots.append((tile / fps, img))
    return shots


def captions(info, out, start, end, lang):
    """Site captions (manual first, then automatic) → transcript files. → language or None."""
    want = [lang] if lang else []
    want += [info.get("language"), "en", "he"]
    for pool in (info.get("subtitles") or {}, info.get("automatic_captions") or {}):
        keys = [k for w in want if w for k in (f"{w}-orig", w) if k in pool]
        keys += [k for k in pool if k.endswith("-orig")]
        if not keys and pool is info.get("subtitles") and pool:
            keys = [k for k in pool if k != "live_chat"]
        for key in keys:
            track = next((f for f in pool[key] if f.get("ext") == "json3"), None)
            if not track:
                continue
            try:
                data = json.loads(fetch(track["url"]))
            except Exception:  # noqa: BLE001
                continue
            segs = []
            for ev in data.get("events", []):
                text = "".join(s.get("utf8", "") for s in ev.get("segs") or []).strip()
                a = ev.get("tStartMs", 0) / 1000
                if text and start <= a <= end:
                    segs.append({"start": round(a, 2), "end": round(a + ev.get("dDurationMs", 0) / 1000, 2),
                                 "text": text.replace("\n", " ")})
            if not segs:
                continue
            code = key.removesuffix("-orig")
            (out / "transcript.txt").write_text("\n".join(f"[{clock(s['start'])}] {s['text']}" for s in segs) + "\n",
                                                encoding="utf-8")
            (out / "transcript.json").write_text(json.dumps({"language": code, "source": f"site captions ({key})",
                                                             "segments": segs}, ensure_ascii=False, indent=1),
                                                 encoding="utf-8")
            return code
    return None


def probe(path):
    data = json.loads(run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)]).stdout)
    v = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in data["streams"] if s["codec_type"] == "audio"), None)
    return float(data["format"].get("duration") or 0), v, a


def scene_times(path, start, end, threshold=0.3):
    cmd = ["ffmpeg", "-hide_banner", "-ss", str(start), "-to", str(end), "-i", str(path),
           "-vf", f"select='gt(scene,{threshold})',showinfo", "-an", "-f", "null", "-"]
    err = subprocess.run(cmd, text=True, capture_output=True).stderr
    return [start + float(m) for m in re.findall(r"pts_time:([\d.]+)", err)]


def pick_times(path, start, end, frames, every, scenes):
    span = max(end - start, 0.1)
    step = every or span / frames
    times = [start + step * (i + 0.5) for i in range(max(1, math.floor(span / step)))]
    if scenes:
        # the regular samples plus a frame just after every cut, near-duplicates dropped, at most 2× the samples
        merged, times = sorted(times + [c + 0.15 for c in scene_times(path, start, end)]), []
        for t in merged:
            if not times or t - times[-1] >= min(1.0, step / 2):
                times.append(t)
        cap = 2 * max(1, math.floor(span / step))
        if len(times) > cap:
            times = times[:: math.ceil(len(times) / cap)]
    return [t for t in times if t < end]


def grab_frames(path, times, folder):
    folder.mkdir(parents=True, exist_ok=True)
    shots = []
    for i, t in enumerate(times):
        img = folder / f"f{i + 1:04d}_{t:08.2f}s.jpg"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", str(path),
                        "-frames:v", "1", "-vf", f"scale={THUMB_W}:-2", "-q:v", "4", str(img)], check=False)
        if img.exists():
            shots.append((t, img))
    return shots


def contact_sheets(shots, folder):
    from PIL import Image, ImageDraw, ImageFont
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    per = COLS * ROWS
    sheets = []
    for n in range(0, len(shots), per):
        group = shots[n:n + per]
        imgs = [Image.open(p).convert("RGB") for _, p in group]
        h = max(im.height for im in imgs)
        rows = math.ceil(len(imgs) / COLS)
        sheet = Image.new("RGB", (COLS * THUMB_W + (COLS + 1) * 6, rows * h + (rows + 1) * 6), (20, 20, 20))
        draw = ImageDraw.Draw(sheet)
        for i, ((t, _), im) in enumerate(zip(group, imgs)):
            x, y = 6 + (i % COLS) * (THUMB_W + 6), 6 + (i // COLS) * (h + 6)
            sheet.paste(im, (x, y))
            label = f"#{n + i + 1}  {clock(t)}"
            box = draw.textbbox((x + 8, y + 8), label, font=font)
            draw.rectangle((box[0] - 5, box[1] - 4, box[2] + 5, box[3] + 4), fill=(0, 0, 0))
            draw.text((x + 8, y + 8), label, fill=(255, 220, 0), font=font)
        out = folder / f"sheet-{len(sheets) + 1:02d}.jpg"
        sheet.save(out, quality=82)
        sheets.append((group[0][0], group[-1][0], out))
    return sheets


def transcribe(path, out, start, end, model_name, lang):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None, "faster-whisper is not installed (pip install faster-whisper)"
    import numpy as np
    # Decode with ffmpeg (16 kHz mono float), as pipeline/audio/whisper_words.py does: avoids PyAV version issues.
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", str(start), "-to", str(end), "-i", str(path),
                          "-vn", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], check=True, capture_output=True).stdout
    samples = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    lines, data = [], []
    for vad in (True, False):  # the voice filter can drop singing over music: retry without it
        segments, info = model.transcribe(samples, language=lang, vad_filter=vad, beam_size=1)
        for s in segments:
            a, b = s.start + start, s.end + start
            if s.text.strip():
                lines.append(f"[{clock(a)}] {s.text.strip()}")
                data.append({"start": round(a, 2), "end": round(b, 2), "text": s.text.strip()})
        if lines:
            break
    if not lines:
        return None, "no speech heard"
    (out / "transcript.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (out / "transcript.json").write_text(json.dumps({"language": info.language, "segments": data},
                                                    ensure_ascii=False, indent=1), encoding="utf-8")
    note = None if vad else "voice filter off (music or singing): lines may be partly invented over music-only parts"
    return info.language, note


def main():
    ap = argparse.ArgumentParser(description="Watch a video from a link or file: frames + transcript + report.")
    ap.add_argument("source", help="URL (YouTube, Instagram, TikTok, X, … or a direct video link) or a local file")
    ap.add_argument("--out", help="output folder (default tmp/watch/<title>)")
    ap.add_argument("--frames", type=int, default=36, help="frames to sample across the range (default 36)")
    ap.add_argument("--every", type=float, help="sample one frame every S seconds instead of --frames")
    ap.add_argument("--scenes", action="store_true", help="also grab a frame at every cut (scene change)")
    ap.add_argument("--start", type=float, default=0, help="start of the range to watch, seconds")
    ap.add_argument("--end", type=float, help="end of the range to watch, seconds")
    ap.add_argument("--model", default="small", help="faster-whisper model (default small; large-v3-turbo is "
                    "more accurate; Hebrew: ivrit-ai/whisper-large-v3-turbo-ct2)")
    ap.add_argument("--lang", help="speech language code (default: auto-detect)")
    ap.add_argument("--no-transcript", action="store_true", help="skip speech transcription")
    ap.add_argument("--keep-video", action="store_true", help="keep the downloaded video file")
    ap.add_argument("--cookies", help="Netscape cookies.txt for sites that need a login")
    args = ap.parse_args()

    local = Path(args.source).expanduser()
    is_file = local.is_file()
    info, video = {}, None
    tmp_out = Path(args.out) if args.out else ROOT / "tmp" / "watch" / "_incoming"
    if tmp_out.exists() and not args.out:
        shutil.rmtree(tmp_out)
    tmp_out.mkdir(parents=True, exist_ok=True)

    if is_file:
        video = local.resolve()
        info = {"title": local.stem}
    else:
        print(f"⬇ downloading {args.source}", file=sys.stderr)
        try:
            video, info = download(args.source, tmp_out, args.cookies)
        except Exception as e:  # noqa: BLE001
            raise SystemExit(f"✖ could not open the link: {str(e).splitlines()[0]}\n  Private / login-only videos "
                             f"need --cookies cookies.txt; a blocked host must be allowed in the environment's "
                             f"network settings.")
    meta = page_meta(info)
    meta.setdefault("webpage_url", args.source)

    out = tmp_out
    if not args.out:
        out = ROOT / "tmp" / "watch" / slug(meta.get("title") or "video")
        if out.exists():
            shutil.rmtree(out)
        tmp_out.rename(out)
        if video and not is_file:
            video = out / video.name

    if video:
        duration, vstream, astream = probe(video)
    else:
        duration, vstream, astream = float(info.get("duration") or 0), None, None
    start = max(0.0, args.start)
    end = min(args.end or duration, duration) if duration else (args.end or 0)
    if end <= start:
        raise SystemExit(f"✖ empty range: start {start}s, end {end}s (video is {duration:.1f}s)")

    print(f"🎞 {clock(duration)} long, sampling {clock(start)}–{clock(end)}", file=sys.stderr)
    if vstream:
        times = pick_times(video, start, end, max(1, args.frames), args.every, args.scenes)
        shots = grab_frames(video, times, out / "frames")
    else:
        times = pick_times(None, start, end, max(1, args.frames), args.every, False)
        shots = storyboard_frames(info, times, out / "frames") if not video else []
    sheets = contact_sheets(shots, out) if shots else []

    lang, why, src = None, "skipped (--no-transcript)", "faster-whisper"
    if not args.no_transcript:
        if astream:
            print(f"🎙 transcribing with faster-whisper ({args.model})…", file=sys.stderr)
            lang, why = transcribe(video, out, start, end, args.model, args.lang)
        else:
            why = "the video has no audio track" if video else "no captions on the page and the audio was blocked"
        if not lang and info:
            lang = captions(info, out, start, end, args.lang)
            if lang:
                why, src = None, "the site's captions"

    lines = [f"# {meta.get('title', 'video')}", ""]
    for key, label in (("webpage_url", "Link"), ("uploader", "By"), ("upload_date", "Uploaded"),
                       ("view_count", "Views"), ("like_count", "Likes")):
        if meta.get(key) is not None:
            lines.append(f"- {label}: {meta[key]}")
    size = f"{vstream['width']}×{vstream['height']}" if vstream else "no video stream"
    fps = vstream.get("avg_frame_rate", "?") if vstream else "-"
    lines += [f"- Length: {clock(duration)} ({duration:.1f}s) · {size} · fps {fps} · "
              f"audio: {'yes' if astream else 'no'}",
              f"- Watched range: {clock(start)}–{clock(end)} · {len(shots)} frames"]
    if not video and shots:
        lines += ["- ⚠ The site blocked the video stream here, so the frames are the site's low-res storyboard "
                  "(seek-preview) tiles and the speech is the site's captions. Faces, small text and fast action "
                  "may be unreadable; for full quality ask the user to upload the file to the chat."]
    if meta.get("chapters"):
        lines += ["", "## Chapters"] + [f"- {clock(c['start_time'])} {c.get('title', '')}" for c in meta["chapters"]]
    lines += ["", "## Contact sheets (Read each one, in order)"]
    lines += [f"- `{s.relative_to(ROOT) if s.is_relative_to(ROOT) else s}` — {clock(a)}–{clock(b)}" for a, b, s in sheets]
    lines += ["", "## Speech"]
    if lang:
        lines += [f"- Language: {lang} ({src}) · `transcript.txt` (timestamped lines) · `transcript.json`"]
        if why:
            lines += [f"- ⚠ {why}"]
    else:
        lines += [f"- No transcript: {why}"]
    if meta.get("description"):
        lines += ["", "## Description", meta["description"].strip()[:3000]]
    (out / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (out / "meta.json").write_text(json.dumps({**meta, "duration": duration, "language": lang,
                                               "frames": [{"t": round(t, 2), "file": p.name} for t, p in shots]},
                                              ensure_ascii=False, indent=1), encoding="utf-8")

    if video and not is_file and not args.keep_video:
        video.unlink(missing_ok=True)
    elif video:
        print(f"🎬 video: {video}", file=sys.stderr)
    print(f"✔ {out}/report.md")
    for _, _, s in sheets:
        print(f"  sheet  {s}")
    if lang:
        print(f"  speech {out}/transcript.txt ({lang})")
    elif not args.no_transcript:
        print(f"  speech none: {why}")


if __name__ == "__main__":
    main()
