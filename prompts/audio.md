# Stage 3c — Music & sound effects

Write `audio.json` after the overlays (or first, for a film without a narrator). Everything comes from **Freesound** (`FREESOUND_API_KEY`),
CC0 or CC BY only — the search already drops NC / Sampling+ sounds.

## Music — one track under the whole video
- Match the film's mood and concept (the genre map in `.claude/skills/video-studio/references/sound.md`):
  a launch → `"upbeat electronic energetic"`; history → `"cinematic orchestral documentary"`; a kids' story →
  `"gentle music box lullaby"`; a tense story → `"tense electronic pulse"`; lo-fi tips → `"lofi chill hip hop"`;
  8-bit look → `"chiptune"`. Set the default in `project.json → video.music.query`.
- A film without a narrator lives on its music: pick it **first**, find its beat (`ffmpeg … -af ebur128` or the
  sound-effects library skill), and give the segments `seconds` that land on bars.
- `node pipeline/cli.mjs search-music "<query>"` → pick an instrumental (no vocals — they fight the voice),
  ideally ≥ the voice length (shorter tracks are looped). Prefer high `downloads` / `rating`.
- The pipeline loops/trims it to the video length, fades it in/out and evens the loudness;
  the mix level is `config/video.json` → `music.volume` (low, under the voice).

## Sound effects — only when an element pops onto the screen
- One short sound when an overlay appears (it starts with the overlay's in-transition): a hit for a **logo** or
  **image**, a short counter tick/riser for a **stat** (it counts up), a whoosh for a **title**. Never for icons or captions.
- Default sounds by name, one per overlay type (`config/video.json` → `sfx.byType`): `logo` (a soft pop /
  click), `image` (a short whoosh/swoosh), `stat` (digital counter ticks, ≤ 1.2 s) and `title` (a cinematic whoosh). `node pipeline/cli.mjs search-sfx "<query>"` — pick ones
  under ~1.5 s with the hit at the very start; clean, modern, not cartoonish.
- Per overlay in `overlays.json`: `"sfx": "<name>"` to use another sound from `audio.json`,
  `"sfx": false` for silence, optional `sfxVolume` (default `sfx.volume`) and `sfxOffset` (s).
- Keep it subtle: at most one hit per overlay, ~3–6 per video.

## Format
```json
{
  "music": { "query": "upbeat electronic energetic",
    "source": { "type": "freesound", "id": 612345, "url": "https://cdn.freesound.org/previews/612/612345_123-hq.mp3" },
    "name": "Future Drive", "duration": 94.2,
    "license": "CC0", "credit": "\"Future Drive\" by someone / Freesound", "page": "https://freesound.org/people/someone/sounds/612345/" },
  "sfx": {
    "logo":  { "query": "pop ui", "source": { "type": "freesound", "id": 1, "url": "…-hq.mp3" }, "license": "CC BY 4.0", "credit": "…", "page": "…" },
    "image": { "query": "whoosh short", "source": { "type": "freesound", "id": 2, "url": "…-hq.mp3" }, "license": "CC0", "credit": "…", "page": "…" }
  }
}
```
- Copy `source`, `license`, `credit`, `page` straight from the search result.
- Anything missing (no `music`, or no sound for a type) is **auto-picked** by `audio` / `produce` from the
  queries in `config/video.json` — so one-shot runs still get music and SFX, but a hand pick fits better.
- A local file works too: `"source": { "type": "local", "path": "projects/<name>/raw/x.mp3" }` (never committed).
- `node pipeline/cli.mjs audio <p>` downloads + processes everything into `audio/` (free) and prints the
  durations. CC BY sounds land in `credits.txt` automatically — they **must** go in the post description.

In the Gate 1 message add one line: `🎵 Music: <name> · 🔊 SFX: logo pop, image whoosh, stat ticks, title whoosh`.
