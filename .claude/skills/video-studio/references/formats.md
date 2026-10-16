# Formats, languages, delivery

## Shapes
| `aspect` | Size | For | Safe area |
|---|---|---|---|
| `9:16` | 1080×1920 | Reels, TikTok, Shorts, Stories | keep text between y 140–1240 (top UI and the bottom caption/button zone are covered) |
| `16:9` | 1920×1080 | YouTube, presentations, LinkedIn | 5 % margin; captions low-centre |
| `1:1` | 1080×1080 | feed posts | 6 % margin |
| `4:5` | 1080×1350 | Instagram / Facebook feed | 6 % margin |
One project = one shape. For several shapes, make a project per shape (copy the script/shots, adjust layout).

## Length
- 15–30 s: one idea, 3–6 shots. 30–60 s: 8–15 shots. 60–180 s: sections of 20–40 s each.
- Shots last 3–7 s (`config/video.json → clips`; a calmer long film may set `maxShotSeconds` 9 in project.json).
- Over 4 min: the render splits into parts (16 Reelkit scenes × 15 s each) and joins them — automatic. Render time
  ≈ 20 min per minute of film in the cloud container; tell the user before a long one.

## Languages
`node pipeline/cli.mjs languages` lists the tuned ones (TTS locale, Whisper model, direction, default font).
Any other language: set `project.json → language` to its ISO code and `voice.languageCode`; pick a Google font
that covers its script (`concept.font`). Gemini TTS and Whisper large-v3-turbo cover ~70 languages.
- RTL (he, ar, fa, ur): handled by the components (direction, bidi isolation of Latin names/numbers). No vowel
  points / tashkeel in on-screen text.
- CJK / Thai: captions and word timing split on spaces — put a space between short phrases in `text`.
- Hebrew uses the ivrit-ai Whisper model (best timing).
- A bilingual film: write captions in the second language with `captionText` per segment.

## Voices (Gemini TTS)
`voices` lists them. Male: Puck (upbeat), Charon (informative), Fenrir (excitable), Orus (firm), Iapetus (clear),
Algieba (smooth), Sadachbia (lively)… Female: Kore (firm), Zephyr (bright), Leda (youthful), Aoede (breezy),
Sulafat (warm), Vindemiatrix (gentle), Achernar (soft)… Set `project.json → voice.voiceName` and `voice.style`
(one sentence: who is speaking, how, how fast). A dialogue film: two segments styles can't change the voice — use
one narrator, or render the second voice separately (library/toolkit/elevenlabs, ask first).

## Delivery
- `final` = H.264 High, yuv420p, AAC 48 kHz, bt709, faststart — uploads cleanly to every platform.
- Send with SendUserFile, then the post description block (prompts/editing.md), then `cleanup`.
- Platform notes: TikTok/Reels ≤ 90 s performs best; Shorts ≤ 60 s (≤ 3 min allowed); YouTube 16:9 any length.
