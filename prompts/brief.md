# Stage 0 — The brief

Turn the user's request into `projects/<name>/project.json` + a one-paragraph brief at the top of `research.md`.
Infer everything you can; ask only when a missing answer would change the film (in review mode bundle those
questions into one message; in one-shot mode decide and say what you decided).

| Decide | Default when the user doesn't say | Notes |
|---|---|---|
| **Format** | from the idea (see table below) | explainer, story, listicle, news, promo, tutorial, quote/poem, music/lyric, data, recap, meme |
| **Language** | the language the user wrote in | `languages` lists the tuned ones; any ISO code works (Gemini TTS + Whisper) |
| **Length** | 30–60 s for social; what the content needs otherwise | 15 s – 10 min; > 4 min renders in parts automatically |
| **Shape** | 9:16 (Reels / TikTok / Shorts) | 16:9 YouTube / presentation, 1:1 or 4:5 feed |
| **Narrator** | yes (Gemini voice) | `--voice none` for music-driven films: launch films, lyric videos, loops, mood pieces |
| **Voice** | by tone: Puck upbeat, Charon informative, Kore firm, Zephyr bright, Sulafat warm… | `voices` lists them; `project.json → voice.voiceName` |
| **Captions** | on, word-timed, a few words at a time | off for a film without a narrator unless lyrics |
| **Look** | chosen in Stage 3a from the content | the user's named style always wins |
| **Audience / goal** | curious general public, keep watching to the end | a business promo wants a clear CTA |

## Formats → structure (pick one, adapt freely)
| Format | Structure | Typical length |
|---|---|---|
| Explainer / "how X works" | hook question → 3–5 steps or ideas → aha → soft CTA | 45–90 s |
| Story / history / biography | hook → setting → turn → climax → what it means | 60–180 s |
| Listicle ("5 things…") | hook → N items (each: title line → fact → punch) → CTA | 30–60 s |
| News / update | hook → 1–3 stories (title → facts → punchline) → CTA | 45–60 s |
| Promo / launch / ad | problem → product → proof → offer → CTA (often no narrator, beat-cut) | 15–45 s |
| Tutorial / tips | promise → steps on screen → result → CTA | 30–90 s |
| Quote / poem / motivational | one line at a time, kinetic type, music-led | 15–40 s |
| Lyric / music video | the music is the clock; words on beats (`voice none`, timed segments) | track length |
| Data story | the number → why → comparison → so what (charts land on words) | 30–60 s |
| Kids / bedtime story | gentle narrator, illustrated scenes, slow pace (`pace` via style) | 1–5 min |

## project.json
```json
{ "title": "Why the Sky Is Blue", "language": "en", "aspect": "9:16", "durationSeconds": 45, "fps": 30,
  "voice": { "voiceName": "Charon", "style": "Calm, curious science teacher, warm, unhurried." },
  "video": { "music": { "volume": 0.14 }, "captions": { "enabled": true } } }
```
`init <name> --lang en --aspect 9:16 --seconds 45 [--voice none] [--title "…"]` writes it; edit it after.
`voice` may be `"none"`. `video` deep-merges over `config/video.json` (music volume/query, sfx, captions…).
