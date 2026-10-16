---
name: voice-sync
description: Use when writing the composition of a narrated video - how to fit the picture to the voice, so that what a word names is on screen on that word.
---

# Fitting the picture to the voice

In a narrated film the voice is the clock. The words are the only thing the viewer is sure to follow, so anything that shows or names a word has to be on screen when that word is said: not a beat earlier, not a second later. The music is the clock for scene changes and for decoration (`reference/beat-sync.md`).

## Order of work

1. Write the narration first (`reference/scriptwriting.md`). Do not design pictures for words that are not written yet.
2. Record it: `reelkit assets voiceover --all`. It prints the real length and the real silence between the sentences. The word times are in `manifest.json` (`scenes[i].words`, in seconds from the scene's start).
3. Only now place the visuals, from the real word times, with `onWord`. Never from a guess, and never by counting words by hand: the kit finds the word.
4. `reelkit check` fails on a word the scene never says. `reelkit preview` then shows one frame 4 frames after each word you timed something to, in a row of its own on the contact sheet: look at it.

If you change the narration, record again and place the visuals again: the times moved.

## The rules

- **One visual event per stressed word.** Pick the words that carry the meaning (a noun, a number, a verb that changes something) and give each one thing to show. Not every word. At most one event every 0.5 s: more is noise, and the viewer cannot follow it.
- **On the word.** What a word names is on screen within 3 frames of the word starting: `onWord(s, "tasks")` is the frame to START its entrance, 3 frames before the word, so that it is seen landing on it. Never earlier than the word, and never before the previous sentence has ended. Nothing appears for a word that has not been said.
- **Numbers count up to finish on their word.** Start the count `durationFrames` before the word, so it is whole when the word is said: `<Sequence from={wordFrame(s, "thousand") - 24}><Counter to={10000} durationFrames={24} /></Sequence>`.
- **Lists tick on each item's word.** One entrance per item, each on its own word (`onWord(s, "tasks")`, then `"deadlines"`, then `"energy"`), not one animation for the whole list on the first word.
- **A phrase starts on its first word.** `onWord(s, "whole week")` takes the start of "whole". Use `{ edge: "end" }` for something that must land when a word has been said, and `{ nth: 2 }` for the second time a word is said.
- **Scene changes fall in the gap between sentences, never inside one.** The CLI lays the scenes out that way: a scene lasts until its last word ends plus the plan's `gap`. Do not make a scene break inside a sentence by cutting the voice, and do not hold a picture for a word that belongs to the next scene.
- **The last word of a sentence gets a hold of the gap's length, not more.** The thing it names stays for the gap (0.2 to 0.5 s) and then the scene changes. Do not add `exitAt` or padding that keeps a picture on after its sentence for a second: that is dead air.
- **The beat never overrides the word.** `onWordBeat(s, "builds", manifest.music)` lets the entrance land on a beat only when one falls within 3 frames after the word; otherwise the word wins. It is never earlier than `onWord`.

## Sound effects under a voice

A sound for a word's visual goes at that visual's frame (`wordFrame(s, "tasks")`, or 2 frames before it for a soft click). Under the voice it sits lower than in a film with no voice: `volume` 0.15 to 0.3, and never above 0.3 while the voice speaks (a film with no voice uses 0.35 to 0.6; `reference/launch-film.md`). Sounds are levelled when they are pulled, so the same number is equally loud for every file. One effect per visual event, and none under a word that carries no picture. The music under the voice is `Music`'s default (`duckTo` 0.18) and stays steady through the sentences.

After a render, `reelkit sound --detail` says how the voice sits against the music (estimated from the mix) and how many times the music pumped; the voice should be at least 10 dB above the music under it, and a pump count above 2 in 30 s means something is lifting the music between sentences.

## An example

The plan (three scenes; only what the example needs is shown):

```json
{
  "gap": "tight",
  "scenes": [
    { "id": "hook", "narration": "Every single week, ten thousand teams plan with Tempo." },
    { "id": "list", "narration": "It reads your tasks, your deadlines and your energy." },
    { "id": "close", "narration": "Tempo. Your week, in rhythm." }
  ]
}
```

The composition. The number finishes counting as "thousand" is said, and each row of the list lands on its own word, with a soft click under it:

```tsx
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "reelkit/frame";
import { Captions, Counter, Entrance, Music, onWord, SceneFrame, sceneById, Sfx, Voiceover, wordFrame } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";

const POP = "assets/lib/sfx-ui-bubble-pop/clip.mp3";
const ink = "#1E2A55", hero = "#E8604C";

// One row of the list (a local component): a coloured bar with its label.
const Card: React.FC<{ label: string; top: number }> = ({ label, top }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: "10%", top: height * top, width: "80%", height: height * 0.1, background: hero, borderRadius: width * 0.03, color: "#ffffff", fontSize: width * 0.06, fontWeight: 800, display: "flex", alignItems: "center", paddingLeft: width * 0.05 }}>{label}</div>
  );
};

export const Video: React.FC<VideoProps> = ({ manifest, urls }) => {
  const hook = sceneById(manifest, "hook");
  const list = sceneById(manifest, "list");
  const close = sceneById(manifest, "close");
  // Captions and the voice, in every scene.
  const voice = (s: typeof hook) => (
    <>
      <Captions words={s.words} group={manifest.captions} highlight={hero} />
      {s.voiceoverKey ? <Voiceover src={urls[s.voiceoverKey]} /> : null}
    </>
  );
  return (
    <AbsoluteFill style={{ background: "#FBF3EA" }}>
      <SceneFrame from={hook.startFrame} durationInFrames={hook.durationFrames}>
        {/* 24 frames of counting, whole on "thousand" */}
        <Sequence from={Math.max(0, wordFrame(hook, "thousand") - 24)}>
          <Counter to={10000} durationFrames={24} color={ink} />
        </Sequence>
        {voice(hook)}
      </SceneFrame>
      <SceneFrame from={list.startFrame} durationInFrames={list.durationFrames}>
        <Entrance delay={onWord(list, "tasks")}><Card label="Tasks" top={0.2} /></Entrance>
        <Entrance delay={onWord(list, "deadlines")}><Card label="Deadlines" top={0.34} /></Entrance>
        <Entrance delay={onWord(list, "energy")}><Card label="Energy" top={0.48} /></Entrance>
        <Sfx src={urls[POP]} at={wordFrame(list, "tasks")} volume={0.25} />
        <Sfx src={urls[POP]} at={wordFrame(list, "deadlines")} volume={0.22} />
        <Sfx src={urls[POP]} at={wordFrame(list, "energy")} volume={0.22} />
        {voice(list)}
      </SceneFrame>
      <SceneFrame from={close.startFrame} durationInFrames={close.durationFrames}>
        {voice(close)}
      </SceneFrame>
      {manifest.music ? <Music src={urls[manifest.music.key]} /> : null}
    </AbsoluteFill>
  );
};
```

`reelkit preview` then shows, for this film, four word frames (`thousand ▸ hook`, `tasks ▸ list`, `deadlines ▸ list`, `energy ▸ list`): the number is whole in the first, and each row is already on screen in the others.

## Measured onsets

Word times in `manifest.json` come from the recording that was made for the plan. After a line is replaced, those times are no longer the file. `reelkit tools` prints the folder of `onsets.py`, which measures where a word now starts in the new take. Place the caption one or two frames before that onset, and move a caption only when its word moved, by the same number of frames. A film that also follows a reference has two clocks: convert with `reelkit clock` before writing the frame (`reference/reference-recreation.md`). Finish with `reelkit diff old new --allow <frames>` so only that caption, and that stretch of sound, changed (`reference/revisions.md`).
