// Footage mode: the user's own video is the film's base (a talking head, a vlog, a screen recording).
// `source <p> <file>` replaces CapCut's first pass in code:
//   transcribe (Whisper, word times) → cut dead air between words (+ any `remove` ranges) → one constant-fps
//   picture cropped to the frame (source/edit.mp4, colour fix optional) + the cleaned voice (audio/voice.wav)
//   → script.json written from the transcript (proofread it: brand names, numbers — keep the same words).
// After that the film runs like any other: `voice` word-times the real voice (no TTS), shots play the source
// (`"skill": "footage", "video": "source"`, optional punch-in `"zoom": 1.15`) or put graphics over it
// (`"skill": "reelkit", "under": "source"`), b-roll / canvas / clips cut away while the voice keeps going.
//
// project.json → "voice": "source", "source": { "file", "maxPause", "cutPauses", "remove": [[s, e]…] (source seconds), "silenceDb" (-35),
//   "color": { contrast, brightness, saturation, gamma, temperature }, "voiceClean": false | "<ffmpeg audio filter>" }
import { existsSync, mkdirSync, copyFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, extname, relative } from 'node:path';
import { config, project, readJson, writeJson, run, probeDuration, round } from '../lib.mjs';
import { transcribeWords } from '../audio/align.mjs';
import { parseSilences } from '../audio/tts.mjs';
import { spawnSync } from 'node:child_process';

// Ranges of the source to keep: every word, padded, with pauses longer than `maxPause` removed and the
// `remove` ranges (false starts, repeats, chosen by the director) cut out. Ranges snap to the frame grid
// so picture and sound cut on the same frame.
// Whisper often stretches a word over the pause after it, so measured silences (`silences`, from ffmpeg
// silencedetect) longer than `maxPause` are cut too, keeping the pads around the speech.
export function keepRanges(words, duration, { maxPause = 0.35, padBefore = 0.08, padAfter = 0.15, remove = [], silences = [], fps = 30 } = {}) {
  remove = [...remove, ...silences
    .map((q) => [q.start + padAfter, q.end - padBefore])
    .filter(([a, b]) => b - a > maxPause)];
  const snap = (t) => Math.round(t * fps) / fps;
  const out = [];
  for (const w of words) {
    const s = Math.max(0, w.start - padBefore);
    const e = Math.min(duration, w.end + padAfter);
    const last = out.at(-1);
    if (last && s - last[1] <= maxPause) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  let ranges = out;
  for (const [rs, re] of remove) {
    ranges = ranges.flatMap(([s, e]) => {
      if (re <= s || rs >= e) return [[s, e]];
      return [[s, rs], [re, e]].filter(([a, b]) => b - a > 0.05);
    });
  }
  return ranges.map(([s, e]) => [snap(s), snap(e)]).filter(([s, e]) => e - s >= 1 / fps);
}

// A time in the source → the same moment in the edit. A time that was cut out snaps to the next kept
// moment (`snap: 'next'`, for a word's start), the previous one (`'prev'`, for its end), or is null.
export function remapTime(t, ranges, { snap } = {}) {
  let acc = 0;
  for (const [s, e] of ranges) {
    if (t < s) return snap === 'next' ? round(acc) : snap === 'prev' && acc > 0 ? round(acc) : null;
    if (t <= e) return round(acc + t - s);
    acc += e - s;
  }
  return snap === 'prev' && acc > 0 ? round(acc) : null;
}

// Whisper words in source time → edit time; a word entirely inside a cut is dropped.
export function remapWords(words, ranges) {
  const kept = (a, b) => ranges.some(([s, e]) => a < e && b > s);
  return words.filter((w) => kept(w.start, w.end))
    .map((w) => ({ ...w, start: remapTime(w.start, ranges, { snap: 'next' }), end: remapTime(w.end, ranges, { snap: 'prev' }) }))
    .map((w) => ({ ...w, end: Math.max(w.start, w.end) }));
}

// The transcript (words already in edit time) → script segments of ~`target` seconds, cut at sentence ends
// (else at the longest pause) so each segment is one idea the shots can follow.
export function transcriptSegments(words, { target } = {}) {
  // Short clips get shorter segments (≈ 4 per film), long ones ≈ 10 s each.
  target ??= Math.min(10, Math.max(3, ((words.at(-1)?.end ?? 0) - (words[0]?.start ?? 0)) / 4));
  const segs = [];
  let cur = [];
  const flush = () => { if (cur.length) segs.push(cur); cur = []; };
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]);
    const len = words[i].end - cur[0].start;
    const sentenceEnd = /[.!?…]$/.test(words[i].w);
    const gap = (words[i + 1]?.start ?? Infinity) - words[i].end;
    if ((sentenceEnd && len >= target * 0.6) || (len >= target * 1.6 && /[,;:]$/.test(words[i].w)) || len >= target * 2.5 || (gap > 0.6 && len >= target * 0.8)) flush();
  }
  flush();
  // A tiny last segment joins the one before it.
  if (segs.length > 1 && segs.at(-1).at(-1).end - segs.at(-1)[0].start < Math.min(2.5, target / 2)) segs.at(-2).push(...segs.pop());
  return segs.map((ws, i) => ({ id: `s${i + 1}`, text: ws.map((w) => w.w).join(' '), sources: [] }));
}

// Cover-crop to the frame, constant fps, optional colour fix ({ contrast, brightness, saturation, gamma,
// temperature } — ffmpeg eq / colortemperature values).
export function sourceVideoFilter({ width, height, fps, color = {} }) {
  const eq = ['contrast', 'brightness', 'saturation', 'gamma'].filter((k) => color[k] !== undefined).map((k) => `${k}=${color[k]}`);
  return [
    // light denoise first (chat-compressed uploads carry blocks), Lanczos upscale, then a gentle sharpen to win the edges back
    'hqdn3d=1.5:1.2:3:3', `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`, `crop=${width}:${height}`, 'unsharp=5:5:0.7:5:5:0.0', 'setsar=1', `fps=${fps}`,
    eq.length ? `eq=${eq.join(':')}` : null,
    color.temperature ? `colortemperature=temperature=${color.temperature}` : null,
  ].filter(Boolean).join(',');
}

// The voice cleanup (CapCut's Enhance voice / Reduce noise / Normalize): rumble cut, denoise, gentle
// compression, a little warmth, loudness evened.
export const VOICE_CLEAN = 'highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=10:release=200,bass=g=2:f=110,loudnorm=I=-16:TP=-1.5:LRA=11';

export function editFilterGraph(ranges, { videoFilter, voiceFilter = VOICE_CLEAN }) {
  const fade = 0.012; // a few ms fade on every cut: no clicks
  const parts = ranges.map(([s, e], i) => [
    `[0:v]trim=start=${s}:end=${e},setpts=PTS-STARTPTS[v${i}]`,
    `[0:a]atrim=start=${s}:end=${e},asetpts=PTS-STARTPTS,afade=t=in:d=${fade},afade=t=out:st=${round(Math.max(0, e - s - fade), 4)}:d=${fade}[a${i}]`,
  ].join(';'));
  const inputs = ranges.map((_, i) => `[v${i}][a${i}]`).join('');
  return `${parts.join(';')};${inputs}concat=n=${ranges.length}:v=1:a=1[vc][ac];[vc]${videoFilter},setpts=N/FRAME_RATE/TB[v];[ac]${voiceFilter || 'anull'}[a]`;
}

export const sourcePaths = (ep) => ({ dir: join(ep.dir, 'source'), edit: join(ep.dir, 'source', 'edit.mp4'), voice: join(ep.audioDir, 'voice.wav') });

export async function prepareSource(ep, file, { maxPause, keepPauses = false, rewriteScript } = {}) {
  const p = project();
  const opts = { ...(p.source ?? {}) };
  if (maxPause !== undefined) opts.maxPause = Number(maxPause);
  if (keepPauses) opts.cutPauses = false;
  const paths = sourcePaths(ep);
  mkdirSync(paths.dir, { recursive: true });
  mkdirSync(ep.audioDir, { recursive: true });
  // The original is copied in and never touched.
  if (file) {
    const src = resolve(file);
    if (!existsSync(src)) throw new Error(`${src} not found`);
    const raw = join(paths.dir, `raw${extname(src).toLowerCase() || '.mp4'}`);
    if (resolve(raw) !== src) copyFileSync(src, raw);
    opts.file = relative(ep.dir, raw);
  }
  if (!opts.file) throw new Error('source: give the uploaded video file (source <p> <file>)');
  const raw = resolve(ep.dir, opts.file);
  if (!existsSync(raw)) throw new Error(`${raw} not found — run "source <p> <file>" with the upload again`);
  const brand = config.brand();
  const voice = config.voice();
  const duration = probeDuration(raw);

  console.log(`Source: ${raw} (${duration.toFixed(1)}s) — transcribing with Whisper (${voice.alignModel})…`);
  const wav16 = join(paths.dir, 'raw-16k.wav');
  run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vn', '-ac', '1', '-ar', '16000', wav16]);
  const asr = transcribeWords(wav16, { model: voice.alignModel, language: voice.alignLanguage ?? 'en' });
  rmSync(wav16, { force: true });
  if (!asr.length) throw new Error('No speech found in the video — for footage without speech use it as a "footage" shot in a no-narrator film');

  const maxP = opts.maxPause ?? 0.35;
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-i', raw, '-vn', '-af', `silencedetect=noise=${opts.silenceDb ?? -35}dB:d=${maxP}`, '-f', 'null', '-'], { encoding: 'utf8' });
  const ranges = opts.cutPauses !== false
    ? keepRanges(asr, duration, { maxPause: maxP, remove: opts.remove ?? [], silences: parseSilences(stderr ?? ''), fps: brand.fps })
    : keepRanges([{ start: 0, end: duration }], duration, { maxPause: 0, padBefore: 0, padAfter: 0, remove: opts.remove ?? [], fps: brand.fps });
  const kept = ranges.reduce((a, [s, e]) => a + e - s, 0);
  console.log(`Cut: ${ranges.length} pieces kept, ${(duration - kept).toFixed(1)}s of dead air${opts.remove?.length ? ' + chosen cuts' : ''} removed → ${kept.toFixed(1)}s`);

  const graph = editFilterGraph(ranges, {
    videoFilter: sourceVideoFilter({ width: brand.width, height: brand.height, fps: brand.fps, color: opts.color }),
    voiceFilter: opts.voiceClean === false ? null : (typeof opts.voiceClean === 'string' ? opts.voiceClean : VOICE_CLEAN),
  });
  const graphFile = join(paths.dir, 'edit.filtergraph');
  writeFileSync(graphFile, graph);
  run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-filter_complex_script', graphFile, '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'veryfast', '-bf', '0', '-r', String(brand.fps), '-an', paths.edit,
    '-map', '[a]', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', paths.voice], { maxBuffer: 64 * 1024 * 1024 });
  console.log(`→ ${paths.edit} (${brand.width}×${brand.height} @ ${brand.fps}) + ${paths.voice}`);

  // The transcript in edit time → script.json (only when the script is still empty, or asked).
  const script = readJson(ep.script);
  const empty = !script.segments?.some((s) => s.text?.trim());
  if (rewriteScript || empty) {
    script.segments = transcriptSegments(remapWords(asr, ranges));
    writeJson(ep.script, script);
    console.log(`script.json ← the transcript, ${script.segments.length} segments. Proofread it (names, numbers) — keep the spoken words.`);
  } else {
    console.log('script.json kept (it already has text) — use --rewrite-script to replace it with the new transcript');
  }
  writeJson(ep.project, { ...readJson(ep.project), voice: 'source', source: opts });
  rmSync(ep.timing, { force: true }); // `voice` re-times the words on the edited voice
  return { ranges, duration: kept };
}
