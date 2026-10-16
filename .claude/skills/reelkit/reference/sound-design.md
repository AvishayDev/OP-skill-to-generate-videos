---
name: sound-design
description: Use when adding sound effects to a video - which moments get a sound, how to search the shared sound library, timing against the visual, and volume under the voiceover.
---

# Sound design

Sound gives selected actions weight and shapes the story. Density follows the material: calm speech may need almost no effects; an energetic graphic sequence may use many small cues. Spoken words take priority whenever speech is present.

## What gets a sound
- **Entrances that matter:** the hook's first hit, each numbered point arriving, the payoff. A whoosh, swipe or soft impact.
- **Scene changes:** a short transition sound across the cut.
- **Interface moments:** a notification arriving, a button tap, a tick appearing. A click, pop or chime.
- **Build-ups:** a riser into the payoff or the final call to action.
- Choose the important actions rather than sounding every decorative element. A dense interface sequence can use quiet ticks; a personal story can rely on voice and silence.
- Keep a family of sounds and reserve the strongest hits for the main moments. Whooshes support movement; they should not cover its landing or a spoken word.
- Use a boom when the reveal needs weight, not at every cut. A deliberate quiet beat can make the next arrival stronger.

## Finding sounds
1. `reelkit assets search "<description>" --kind sfx` with what you want to hear: "whoosh", "soft click", "notification pop", "riser", "camera shutter", "bass impact". Add "one-shot" or "short" to the query for one-shots.
2. Prefer short sounds (under two seconds) for motion. Use longer ones for risers and long transitions. Use an ambience or drone bed only when the video has no other background and the mood calls for it, at very low volume.
3. `reelkit assets pull <id>` with the id you picked. It lands in `assets/lib/<id>/` and the command prints the `urls[...]` path to use; place it with `<Sfx>`.
4. Reuse one whoosh and one click across the video rather than a different sound each time. Consistency sounds designed.

## Timing
- Align the audible peak with the visual landing. A short UI whoosh may need a 2 to 3 frame lead; a reverse swell may need much more. Inspect the actual file's attack and tail rather than using one lead for every sound.
- Put impacts and clicks on the exact frame the visual hits.
- Start a riser so that it **ends** on the reveal: `at = revealFrame - durationSec * fps`.
- Use the word timings in `s.words` when a sound belongs to a spoken word.

## Volume
- The voiceover plays at 1. While narration is heard, sound effects stay at 0.3 or below. Without narration, effects can sit between 0.2 and 0.45 and a chosen hook impact can reach 0.6.
- Ambience and drone beds: 0.06 to 0.12.
- Overlap only deliberately; avoid summed peaks that clip or mask the speech. Lower competing layers before mastering.
- When the same kind of sound repeats, grade it: the first at full level, the rest quieter.

## Background music
- Choose music from the story's tone and pace; a personal or documentary moment can work with no music. Search by genre, mood and use, usually with English library terms. Decide a fitting track and explain the reason rather than requiring the user to choose a playlist.
- `reelkit assets pull <id> --music` records the selected track and its beat grid. Place `<Music src={urls[manifest.music.key]} />` once outside the scenes. It applies the measured gain, ducks under speech, loops when needed, and fades at the end. Do not manually repeat the track with `Sfx`.
- Leave `Music` at its defaults initially; adjust `volume`, `duckTo` or a planned `dips` interval only after listening to the rendered mix. The music should support the brand reveal without covering its lock sound.
- One track is usually enough for a short film. Pick its tempo before beat-led scene timing, and read `reference/beat-sync.md`. Align the peak with the reveal, allow a rest before it, and give the ending a musical resolution. Under speech prefer instrumental passages; avoid lyrics competing with the message. The current `Music` component loops from the supplied file's start, so trim a derived copy if a different loop section or entry point is needed.
- Never use the music of a reference or of any video the user points at. Describe its mood and tempo and search the library with that.

## Music direction by material

| Material | Starting search direction | What to listen for |
|---|---|---|
| Tech demo or energetic explainer | `minimal tech instrumental`, `tech house instrumental`, `glitch hop` | Clear rhythm, room for words, no long empty intro |
| Tutorial or calm routine | `chillhop instrumental`, `deep house soft`, `light acoustic` | Steady support without a melody fighting the explanation |
| Premium product or brand | `cinematic minimal`, `dark downtempo`, `luxury deep house` | Restraint and a reveal that earns its weight |
| Montage or fashion | `fashion house`, `UK garage instrumental`, `nu disco` | Phrases that match changes of action and framing |
| Personal story | `felt piano`, `documentary acoustic`, or silence | Emotional fit without over-scoring a small moment |
| Humor or playful graphics | `quirky funk`, `chiptune`, `comedy pizzicato` | Timing that supports the joke without dictating it |

These are starting terms, not required genres or BPM ranges. A supplied track takes precedence when the user wants it. Do not infer commercial rights from a song being downloadable or present in an editor; verify a relevant license if the destination requires it.

## Phone playback and verification

Do not judge music by its sub-bass alone. A track with audible percussion, melodic content or bass harmonics can survive small speakers better than a sub-only bed. Check speech intelligibility and whether the intended music still contributes with reduced bass or actual phone playback. Adjust relative levels and arrangement, not just the final loudness.

Verify the finished export for present stems, cue alignment, clipping and truncated tails (`reference/delivery-review.md`). Measurements can locate a problem but cannot prove emotional fit. Do not impose a universal frequency-energy percentage, hit count or volume ratio. If playback is unavailable, report the checks you performed without claiming to have listened.

## The interface pack
The library holds a matched set made for interface motion; search these words with `--kind sfx`: "soft ui whoosh" and "fast whip" for moves, "bubble pop" and "glass tap" for things appearing and being pressed, "keyboard typing" under a typed field, "toggle switch", "message sent", "notification ping", "success chime" on a tick, "sparkle shimmer" on an AI result, "counter ticks" under a number counting up, "soft impact" and "sub bass drop" for the landing and the payoff, "short riser" into a reveal, "camera shutter" on a freeze. Sounds from one set sit together; mix sets only when one is missing what you need.

## Fit
- Match the sound to the look: soft pops and gentle whooshes for calm, friendly videos; glitches and bass hits for tech and high energy; camera and tape sounds for retro.
- Skip anything startling (gunshots, screams, alarms) unless the topic is literally about it.
- Do not use a sound that names a brand or device the video is not about.

## Placing
```tsx
<Sfx src={urls["assets/lib/<id>/clip.mp3"]} at={12} volume={0.35} />
```
Inside a SceneFrame, `at` counts from the start of that scene.

## Branded transformations

Read `reference/brand-motion.md` when the move reveals a brand, carries an object, or turns the product toward the viewer. Use `brandTransformFrames` and `cuesFor([start, settle], "transform", { offset: scene.startFrame, voice: true, sweepFrames: 10 })` for one sweep and one lock. Adjust the sweep lead to the actual sound file. Keep sounds outside `Scene3D`, and add the scene offset once. Listen to the final video; a high hit count is not a quality target by itself.
