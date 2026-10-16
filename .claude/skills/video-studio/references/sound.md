# Sound

Music and SFX come from Freesound (CC0 / CC BY only; `search-music`, `search-sfx`). Mixing is automatic: music
looped/trimmed to the film, faded and loudness-evened under the voice (`video.music.volume`, default 0.17);
SFX trimmed to their hit. For a deeper pass read `library/barty/sound-effects/SKILL.md` (beat grid, cue
lists) and reelkit's `reference/sound-design.md` / `reference/beat-sync.md`.

## Music by mood (Freesound queries)
| Film | Query ideas |
|---|---|
| Tech / news / launch | `upbeat electronic energetic`, `future bass corporate`, `minimal tech pulse` |
| Explainer / science | `curious playful pizzicato`, `light electronic background`, `ambient documentary` |
| History / epic | `cinematic orchestral documentary`, `epic drums strings`, `medieval lute` |
| Inspirational / quote | `inspiring piano strings`, `uplifting ambient` |
| Lo-fi / tips / study | `lofi chill hip hop`, `chill beat jazzy` |
| Kids / bedtime | `music box lullaby`, `gentle ukulele happy`, `soft celesta` |
| Comedy / meme | `quirky comedy`, `funky groove`, `cartoon bassoon` |
| Tense / mystery / true crime | `tense dark pulse`, `suspense drone`, `mystery piano` |
| Horror | `horror drone`, `creepy ambience` |
| Fashion / sport / hype | `trap beat hard`, `phonk`, `drum and bass energetic` |
| Luxury / premium | `deep house minimal elegant`, `smooth jazz lounge` |
| 8-bit / retro game | `chiptune`, `8 bit game loop` |
| Travel / food | `acoustic guitar upbeat`, `latin acoustic`, `bossa nova` |
| Nature / calm | `ambient pads nature`, `soft piano calm` |
| Country / place flavour | add the place: `japanese koto`, `arabic oud`, `irish folk`, `bollywood`, `afrobeat`, `klezmer` |
Instrumental only under narration (vocals fight the voice). ≥ the film's length or a clean loop.

## The SFX vocabulary (cue `sfx` names → `config/video.json → sfx.queries`)
`pop` (element appears), `whoosh` (slide / cut), `click` (UI, cursor), `tick` (counter), `ding` (correct, done),
`stamp` (verdict), `glass` (break, shock), `type` (keyboard). Add any name you need to `audio.json → sfx` or
`project.json → video.sfx.queries`: `swoosh-paper`, `camera-shutter`, `cash-register`, `notification`,
`riser`, `impact`, `bubble`, `chalk`, `pencil`, `page-turn`, `coin`, `8bit-jump`, `heartbeat`, `crowd-gasp`…
Rules: one sound per landing element at most, ~3–8 per minute, short (≤ 1.2 s), the hit at the very start,
quieter than the voice (`sfx.volume` 0.5–0.8). Match the concept (paper look → paper sounds; pixel look → 8-bit).

## No narrator
Music first. Segment `seconds` and shot `at` times on bars (120 BPM → a bar = 2 s); cues on beats. Captions off
unless they are lyrics or the words of the piece.

## Paid / generated audio (only when the user allows)
ElevenLabs (voices, SFX from text, music) — `library/toolkit/elevenlabs`; ACE-Step music generation (GPU) —
`library/toolkit/acestep`. The configured Gemini voice is free to use.
