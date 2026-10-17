---
name: watch-video
description: Watch a video from a link the user sends (YouTube, Shorts, Instagram Reels, TikTok, X/Twitter, Facebook, Vimeo, a direct .mp4 link…) or a video file they uploaded - downloads it, samples frames into timestamped contact sheets you Read, and transcribes the speech (faster-whisper, any language; falls back to the site's captions). Use whenever the user shares a video link and wants you to watch, see, summarise, review, analyse, transcribe, copy the style of, or answer questions about it ("watch this", "תראה את הסרטון הזה", "תצפה בזה", "מה יש בסרטון", "make one like this", "תעשה סרטון כמו זה").
---

# Watch a video

You can't stream video, but you can look at its frames and read what is said. One command does the work:

```bash
python3 .claude/skills/watch-video/scripts/watch.py "<url or file>"
```
It prints the report path, the contact sheets and the transcript. Then:
1. **Read `report.md`** — title, channel, length, size, chapters, description.
2. **Read every `sheet-NN.jpg` in order** — 3×3 frames each, every frame stamped `#n m:ss`.
3. **Read `transcript.txt`** — `[m:ss] text` lines (Whisper, or the site's captions as a fallback).
4. Answer from what you saw and heard. Cite moments by timestamp ("at 0:42 the logo slams in").

## Options
| Need | Flag |
|---|---|
| more / fewer frames (default 36 across the range) | `--frames 60` |
| a fixed rhythm instead (dense look at a short reel) | `--every 1` |
| a frame at every cut (editing pace, shot list) | `--scenes` |
| only part of a long video | `--start 120 --end 300` (seconds) |
| better speech accuracy | `--model large-v3-turbo`; Hebrew: `--model ivrit-ai/whisper-large-v3-turbo-ct2` |
| force the speech language | `--lang he` |
| frames only | `--no-transcript` |
| keep the mp4 (to look closer with ffmpeg) | `--keep-video` |
| login-only / private video | `--cookies cookies.txt` (only if the user provides one) |

Output: `tmp/watch/<title>/` (gitignored). The video file is deleted after processing unless `--keep-video`.
To zoom in on a moment, `--keep-video` then `ffmpeg -ss <t> -i video.mp4 -frames:v 1 x.jpg` and Read it.

## Pick the depth for the question
- "What is this about / summarise" → defaults.
- "How is it edited / make one like this" → `--scenes` (cuts), and for a short reel `--every 0.5`. Note:
  pace (cuts per 10 s), shot types, caption style (font, size, position, colour, animation), colour palette,
  transitions, on-screen text, hook in the first 2 s, music/SFX moments, length, aspect, CTA.
- Long videos (> 15 min) → chapters first, then `--start/--end` on the parts that matter.
- A file the user uploaded to the chat → pass its path instead of a URL.

## When the link won't open
- Some sites block cloud servers (YouTube sometimes answers 403 / "confirm you're not a bot"). The script then
  falls back automatically to the site's **storyboard** (low-res seek-preview tiles) and **captions**; the report
  says so. Tell the user it was a low-res look, and that uploading the file to the chat gives full quality.
- Instagram / TikTok / Facebook may need a login → ask the user to upload the video file instead.
- A host blocked by the network policy → tell the user which host to allow in the environment's network settings.
- Never ask the user for passwords; cookies only if they offer a file.

## Using what you watched in the studio
Watching is for **reference**: analysing style, structure, pacing and ideas, or answering questions. The rights
rule still holds: never put frames, audio or footage from someone else's video into a film, and don't copy it
shot-for-shot. For "make a video like this", turn the analysis into a brief + concept (`video-studio`) in our own
look, voice and free-library assets.
