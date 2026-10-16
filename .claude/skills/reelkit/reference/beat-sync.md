# Putting the video on the beat

A video with music feels edited when things happen on the beat. The CLI puts the scene changes on the beat for you; inside a scene it is your job.

## 1. Choose the track before the composition

`reelkit assets search "<mood and tempo>" --kind music`, for example "calm warm piano, slow" or "driving electronic, 120 BPM". Pull the best fit with `reelkit assets pull <id> --music`. That makes it the video's one track (a second `--music` replaces the first), measures its tempo here, and writes `assets/music.json`. Never use a reference video's own music; it is not yours to use.

Then `manifest.json` has `music: { key, bpm, beatFrames }`. `beatFrames` are the beats as composition frames. If a track has no clear tempo there is no `bpm`, `beatFrames` is empty, and nothing below applies: the scenes stay where the narration puts them.

## 2. Scene changes: the voice first, the beat when it is close

With a narrator, the narration sets where a scene ends: the next scene starts after the plan's `gap` of silence (`tight` 0.2 s, `normal` 0.3 s, `relaxed` 0.5 s; the last scene keeps 0.7 s after its last word). When the track has a tempo, a scene change moves to the nearest beat only if that is at most 4 frames away either way and leaves at least 2 frames after the last word; the next scene's voice starts with it. Every other change stays where the voice puts it. `reelkit assets voiceover` and `reelkit preview` say how many changes are on the beat ("3 of 5 scene changes land on the beat; the others follow the voice"): that is the truth, not a fault to fix. Do not shift `startFrame` yourself, and do not pad a scene to reach a beat: that is dead air. A film with no voice puts its cuts on the beat (`reference/launch-film.md`).

## 3. Inside a scene: the voice is the clock, the beat is for decoration

With a narrator, anything that shows or names a word goes on that word: a number, an icon, a list item, a headline, a banner. The voice is the clock for it, and a beat never moves it more than a few frames. The beat is the clock for what has no word: scene changes, a decorative pulse, a sound under a move, and every element of a film with no voice. Do not count words by hand and do not write your own index helper: the kit finds the word for you (`reference/voice-sync.md` has the whole method).

- `wordFrame(s, "tasks")` is the frame inside the scene where the word starts (a phrase such as "whole week" gives its first word; `{ nth: 2 }` the second time it is said; `{ edge: "end" }` where it ends; `{ absolute: true }` adds `s.startFrame`). A word the scene does not say throws and lists the scene's words, so a typo stops the render and `reelkit check` reports it before then.
- `onWord(s, "tasks")` is the frame to START an entrance so that it is seen landing on the word: `wordFrame` minus 3 (`lead`), never below 0.
- `onWordBeat(s, "tasks", manifest.music)` is the same, with one rule for beat and word together: the entrance lands on a beat only if a beat falls within 3 frames AFTER the word starts (`window`); otherwise the word wins. It is never earlier than `onWord`, so a thing is never on screen more than 3 frames before the word that names it. Use it for the hero element when a track is set; use plain `onWord` for everything that must be exact.

Nearest-beat snapping is wrong for an element that illustrates a word: the nearest beat is as often before the word as after it, and a banner that appears before "meeting" is said is a mistake. `nearestBeat`, `nextBeat` and `beatPulse` stay for the things the beat owns: `beatPulse(beatFrames, frame)` is 1 on a beat and falls to 0; use it sparingly, for a small scale or glow on the hero element only, never on everything. Put a decorative move on a strong beat (every fourth beat counts from the scene's first beat).

Sound effects: the `at` of an `Sfx` is a frame from the scene start. A sound for a word's visual goes at that visual's frame (`onWord(s, "tasks") + 2`), under the voice at 0.3 or less (see "Sound levels" below).

```tsx
import { Entrance, Music, onWord, onWordBeat, SceneFrame, sceneById, Voiceover } from "reelkit/kit";

const s = sceneById(manifest, "meet");

<SceneFrame from={s.startFrame} durationInFrames={s.durationFrames}>
  {/* exact: the list item lands on its word */}
  <Entrance delay={onWord(s, "tasks")}><Card /></Entrance>
  {/* the hero: lands on a beat when one is within 3 frames after the word, otherwise on the word */}
  <Entrance delay={onWordBeat(s, "builds", manifest.music)}><Card /></Entrance>
  {s.voiceoverKey ? <Voiceover src={urls[s.voiceoverKey]} /> : null}
</SceneFrame>
// Once, outside the scenes:
{manifest.music ? <Music src={urls[manifest.music.key]} /> : null}
```

`onBeat(s, i)` with a hand-counted word index (the old way: `nearestBeat` of the word at index `i`) still works if you wrote it yourself, but do not start new work with it.

`Music` ducks under the voice by itself and fades out over the last second; do not set its volume per scene.

## Hits go where the eye sees the change

A `SceneFrame` transition (a zoom-through, blur, push or whip) is complete on the scene boundary, but the picture changes most half the transition's frames earlier: 4 frames before the boundary for the default 8, 3 for `transitionFrames={6}`. A hit on the boundary lands after the change and reads as late; the sound report measures it as a miss. Put the hit on the visual peak: `cuesOnChanges(scenes, { impact, whoosh })` does it for every change (the impact on the peak, the whoosh so that it ends there), and `changeFrame(scene)` gives the peak for one. The scene's `startFrame` still sits on the beat, so a hit 3 or 4 frames before it is within a tenth of a second of the beat too.

A camera zoom, a `zoomTo` and a punch are picture changes as well: put a hit on each with `cueOnCamera(frame)` (for a key: about 9 frames before the key's frame) or `cueOnCamera(frame, { punch: true })` (just after the punch's frame). A `Camera` inside a `SceneFrame` counts frames from the scene's start, so add the scene's `startFrame` for the absolute frame a cue needs.

## Sound levels

Every sound you pull (`sfx` and `music`) is measured when it is pulled and levelled: a sound effect shorter than 3 seconds to a peak of -3 dBFS, a longer sound and the music to about -18 LUFS, never more than 18 dB either way. The gain is in `assets/library.json` (`gainDb`) and in the manifest's `soundGain`, and `Sfx` and `Music` apply it by themselves, so the same `volume` number sounds equally loud for every file. Then:

- the voiceover is `1` (the default);
- a sound effect is `0.2` to `0.45`; the default `0.35` is right for most, and a small tick can go lower (a film with no voice uses the levels in `reference/launch-film.md` instead);
- the music is `0.5` when it plays alone and sits at `0.18` under the voice by itself (`volume` and `duckTo` on `Music`). It stays steady across the 0.2 to 0.5 s between sentences and comes up only in a real pause of 1.2 s or more (rising over 0.4 s, back down 0.25 s before the next word), so it does not pump; leave both alone unless `reelkit sound` says the music under the voice is outside 10 to 22 dB below it;
- the render is mastered at the end to -14 LUFS with peaks under -1 dBTP, so do not try to make the whole video louder: balance the parts against each other.
