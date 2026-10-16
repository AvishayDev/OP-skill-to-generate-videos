---
name: launch-film
description: Use when the video is a product, feature or brand reveal with no narrator - a short launch film carried by music and sound effects alone: the plan with voice none, the shape of the film, the pictures, and a full section on scoring it with sound.
---

# A launch film with no voice

The short films that studios post when a product launches have no narrator. The words are on the screen, and the sound (a music track and a great many small effects) does the work a voice would. This file is how to make one. Read `reference/continuity.md` too: the shots must grow out of each other.

## When to choose it

Choose it for a product, a feature or a brand reveal where nobody needs to explain anything out loud. If the user wants a person to talk, or a story told in sentences, it is the wrong tool: write a narrated video instead. Use the requested format; ask about narration only if that decision is still consequential and unclear. Skip the voice and caption steps.

For a whole release told in chapters over 45 to 120 seconds (large centred words, dark "New ___" dividers, the interface with a camera push, a "one more thing"), this file still gives the plan, the sound report and the checks, and `reference/keynote-film.md` gives the shape, the type and the parts.

## What good ones measured

Four previously measured launch films of 15 to 55 seconds provide examples of one energetic style. Their ranges are context, not targets for every brand or edit; a calm reveal can use fewer sounds and longer holds.

- No speech at all. Loudness between -14.1 and -14.8 LUFS in every one.
- 2.0 to 3.0 sound hits a second over the whole film (music beats and effects together), 1.5 to 2.8 of them low, and a whoosh-like swell every one to two seconds (0.5 to 1.3 a second).
- A hit lands within a tenth of a second of 55 to 75 percent of the big changes in the picture.
- Sound starts in the first 0.05 seconds in three of the four. The first big change in the picture comes between 0.7 and 3.8 seconds.
- Shots average 2.2 to 5.2 seconds; the shortest is 0.4 to 1.0 and the longest 6.5 to 12.7. The lengths vary by 0.64 to 0.77 (spread over average). The picture is still for 11 to 35 percent of the time.
- A third to a half of the cuts land on the music's beat. The tempo, where there was a clear beat, was 107 to 145 BPM.
- The look: one calm ground (near-white with a soft colour wash, near-black, or a warm photographic set), one accent colour, the product's logo tile at the start or the end, and a line of type under the object rather than over it.

## The plan

Write `plan.json` with `"voice": "none"`. Every scene then has `seconds` (a number from 0.3 to 15) and `narration` may be an empty string; `voiceId` is not needed, and `captions` is `none` unless you set it. Up to 16 scenes are allowed in this mode.

- A common short launch film is 15 to 45 seconds with 6 to 14 shots; adapt to the requested duration and reading time.
- Lengths vary at least fourfold: one or two shots under a second, one long hold, the rest in between.
- On-screen text carries every word the viewer will read, so each scene has `onScreenText` or `notes` saying what is on screen (`reelkit plan check` flags a scene with neither).
- The product's logo comes first or last.
- One calm ground and one accent colour for the whole film; write both into the first scene's `notes` with the look from `reference/styles.md` ("Launch film").

`reelkit plan check` prints `Length: 24.5s over 9 scenes.` and notes a film under 10 or over 60 seconds, and one with no scene under a second. `reelkit assets voiceover` says there is nothing to record. Build the composition from `manifest.scenes` as usual: no scene has a `voiceoverKey` and `s.words` is empty, so place no `<Voiceover>` and no `<Captions>`.

## The shape

1. Open on motion and sound at once, in the first frame.
2. One line of type that sets up the product.
3. The product's interface, as an object in space.
4. Three to five feature beats, each with a pointer or a change that has a visible cause.
5. A quick burst of short shots.
6. A rest: one calm shot, and near silence before the biggest moment.
7. The name and one action.

## Structure and briefing

What the strongest short launch films have in common, in rules a plan can follow:

- **Act each claim out.** A claim is performed in a small believable interface, never stated: a speed claim is a `CounterRoll`, an agent or tool a `TerminalLog`, an assistant a `PromptBox` with a reply, a web product a `BrowserFrame` with the user's own screenshot, collaboration a `NamedCursor`. Choose which claims are highlighted and which are merely mentioned: at most three highlighted in 30 seconds.
- **One grammar.** Either every scene is a `ChapterFrame` (the same slots: "03 / 07", a ghost word, one hero, up to three badges, one caption, a progress rule) or none is. Write a colour script into the plan notes: one accent colour, and for each scene whether its ground is dark or light, so the grounds alternate on purpose.
- **One hero object carried across cuts**, changing pose or scale: a `Hero3D` or `Screen3D` with `poses`, a `GlassPanel`, or a `Carry`.
- **Type with a voice.** A headline is two to five words with one emphasised keyword (`Headline`); never plain centred fade-in lines.
- **Open on the question.** When the product is an assistant or a tool, the first scene is the user's own question typed into a `PromptBox`. Always end on an end card: the wordmark, one line, one call to action, with a clear second before it (`clearBefore`).
- **Ask for the real material before writing**: screenshots, the real numbers, the logo, the exact product name; and use it. No third-party brand marks.
- **Know the product before the first line.** From the user's own material only (their site, their screenshots, what they told you), write down: the name and its promise in one line; three to five things it does, one noun each; for each of those, the proof that can be SHOWN (a real screen, a real number, a real example); and the one true thing about it that would most surprise a stranger. A thing with no showable proof is mentioned, not highlighted. The surprising one is the film's turn or its last beat before the name.
- **Give every line of type a slot with a size.** Before writing the words, list the film's text slots and the characters each can hold at the size it will be set: a hero word up to 10, a headline up to 34, a line under an object up to 44, a button or a chip up to 16, the closing line up to 34. Write the copy into the slots; a line that does not fit is rewritten, never set smaller. `reelkit plan check` notes an item over 44 characters.
- **Build the riskiest shot first, alone.** One shot carries the idea of the film: the morph, the reveal, the scroll, the joke. Write that one, preview it, and look at it before any other scene exists. If it does not work by itself, change the concept now; eight good scenes round a shot that fails do not save it.
- **Pin two or three moments to the music.** Listen for where the track drops out and where it comes back. The rest before the biggest moment sits in the quiet bar, the reveal on the bar where the track returns, and the end card on its last hit. When the track has no such place, make one with `Music`'s `dips`. Every other cut can fall on any beat; these few are what make the film sound edited.
- **A film can be one device.** "Now in twelve languages" is a `LanguageWheel` (the product name still, each language naming itself in its own script beside it) over a row of drawn faces and the product's real offerings, a count line and the logo: 6 to 20 seconds, one scene of `wheelFrames(...)` frames, nothing else. Only languages the product really has, in the order the user gives, the site's main language first.
- **Length.** 15 to 40 seconds; state it in the plan. Over 60 seconds the same effect repeats.
- **Review.** Inspect the preview for phone readability, demonstrated claims, planned grounds and the hero object where it belongs. Fix observed problems and recheck changed shots. Finish with `reference/delivery-review.md`.

## The pictures

- Use the user's real screens (`reelkit assets upload`), never an invented interface. Put each in a device or browser frame from the library (`reelkit assets search "device frame" --kind component`), tilted in space and settling as it arrives.
- Type goes under or beside the object, with one coloured word. Keep each line to a few words.
- Use `Carry` and `Camera` from `reference/continuity.md` so that each shot grows out of the one before: the screen that settled is the card that the next shot opens on.
- A pointer that clicks, a card that lands, a tile that opens: every change on screen has a cause you can see, and the cause has a sound.

## Sound

With no voice the sound is half of the film. Plan it as you plan the picture.

1. **Choose the track first and let the beat set the cuts.** Search for 107 to 145 BPM (`reelkit assets search "driving clean product launch, 120 BPM" --kind music`), pull it with `reelkit assets pull <id> --music`, and read `reference/beat-sync.md`. The CLI holds each scene to the next beat, so every cut lands on the beat, a little more than the films did. Let the effects fill the places between.
2. **Sound from the first frame.** A cue at frame 0 and the music running from frame 0. `reelkit check` notes a film with nothing placed in the first half second.
3. **Score meaningful changes on the frame where the eye sees them.** A press clicks, a card arriving pops, a move whooshes, a scene change lands on a low hit, and a reveal is led in by a riser that ends on it (`cueBefore`). Two things the measurement showed:
   - A `SceneFrame` transition is complete on the boundary, but the picture changes most in the middle of it: for a zoom-through, blur, push or whip exit that is half the transition's frames before the boundary (4 frames for the default 8, 3 for `transitionFrames={6}`). A hit on the boundary frame lands after the change and does not register against it. Use `cuesOnChanges(scenes, { impact, whoosh })`: it puts the impact on the visual peak and the whoosh so that it ENDS there. Give each scene the same `exit` and `transitionFrames` you give its `SceneFrame` (one array for both, so they cannot disagree).
   - A camera zoom, `zoomTo` or punch is a picture change too and needs its own hit. `cueOnCamera(frame)` gives the frame where a `Camera` key's move is fastest (about 9 frames before the key's frame, because the move starts 12 frames early); `cueOnCamera(frame, { punch: true })` gives it for a punch (just after its frame). Inside a `SceneFrame` the Camera counts frames from the start of the scene: add the scene's `startFrame` for an absolute cue.
4. **Density.** An energetic burst may use frequent effects; a restrained film may need only the main actions and reveal. Allow deliberate silence. The measured 2 to 3 hits a second describes examples, not a quality threshold. `reelkit check` counts what the code places and says when it is under one per two seconds; that is a count of the code, not a listening test. Its sound-count notes stay silent when the cues are computed (built by a loop, a helper such as `cuesOnBeats`, or a variable that is not a plain list), so their absence proves nothing: use the render's sound report to see what the film really has.
5. **One family of sounds.** Take them from the interface pack in `reference/sound-design.md`, and mix families only when one is missing what you need. For the music, see "Background music" there.
6. **Levels.** For a film with no voice these are starting levels for the example style, rather than universal overrides of `reference/sound-design.md` and the narrated range in `reference/beat-sync.md`:

   | What | `volume` |
   |---|---|
   | Music | 0.4 (0.5 at most) |
   | Effects: pops, taps, clicks, chimes, ticks | 0.35 to 0.5 |
   | Impacts and drops on a scene change | 0.5 to 0.6 |
   | Swells: whooshes that rise, risers | 0.25 to 0.35 |

   Every pulled sound is levelled on the way in (the interface effects got a gain of 0.7 to 0.8), and `reelkit render` then masters the whole film to -14 LUFS, so only the balance between these matters. At 0.2 to 0.3 an effect sits 6 dB or more under the music, which the tester of 0.8.0 found too quiet to register against the picture; a swell above about 0.35 hides the impact that ends it (the impact no longer rises out of what came before, and the report counts a change with no hit: on a test film, whooshes at 0.2 left 5 of 6 changes with a hit and at 0.35 or more only 2 of 6). Read the report and audition the mix when possible; change levels for an audible balance or timing problem, not merely to increase a measured count.
   - **Which sounds swell.** The library's own "UI" pack (`sfx-ui-soft-whoosh`, `sfx-ui-fast-whip`) is made of short bursts that start at full level and fall away: they are hits to a listener and to the report, not swells. A swell that carries rises for half a second or more and cuts off on the change. Search for these words: `reelkit assets search "reverse whoosh" --kind sfx` (the reverse whooshes of the Quantum Motion pack, 1.7 to 2.3 seconds, with energy between 2 and 10 kHz), `"whoosh sweep"` and `"wind sweep"` for longer air, and `"riser building up"` or `"riser tension"` for a lead into a reveal. Their length is at the end of the search line: give it to `cueBefore` or `cuesOnChanges` (`whoosh: { frames }`), minus the tail after the peak. Measured on a test film, seven reverse whooshes at 0.2 gave six swells where they stand, while the film's UI whooshes gave three at the same places.
7. **Silence.** Before the biggest moment, drop the effects, or the music, for a beat or two. The hit that follows then lands. Give `Music` a `dips` entry for the rest, in absolute frames: `dips={[{ from: reveal.startFrame - 24, to: reveal.startFrame, volume: 0.05 }]}` brings the track down for the last moments before the reveal and back up after it.

Place all the cues once, outside the scenes, with `SoundCues`; use `cuesOnBeats` for a pulse on the beat, `cuesOnChanges` for the sounds of the scene changes, `cueOnCamera` for a camera move or punch, and `cueBefore` for a sound that must end on a frame (give it the length of the sound in frames).

```tsx
import React from "react";
import { AbsoluteFill } from "reelkit/frame";
import { Music, SceneFrame, SoundCues, cueBefore, cuesOnBeats, cuesOnChanges } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";

export const Video: React.FC<VideoProps> = ({ manifest, urls }) => {
  const beats = manifest.music?.beatFrames ?? [];
  const [, product, , burst, reveal] = manifest.scenes;
  const sounds = {
    whoosh: urls["assets/lib/<whoosh id>/clip.mp3"],
    click: urls["assets/lib/<click id>/clip.mp3"],
    pop: urls["assets/lib/<pop id>/clip.mp3"],
    thud: urls["assets/lib/<impact id>/clip.mp3"],
    riser: urls["assets/lib/<riser id>/clip.mp3"],
  };
  // The same exit and transitionFrames as the SceneFrames below, so the cues and the picture agree.
  const exits = [{ exit: "zoom-through" as const }, {}, { exit: "whip-left" as const, transitionFrames: 6 }, {}, {}];
  const cues = [
    { at: 0, sound: "whoosh", volume: 0.3 },
    { at: product.startFrame + 6, sound: "pop", volume: 0.4 },
    ...cuesOnBeats(beats, { from: burst.startFrame, to: reveal.startFrame, every: 1, sound: "click", volume: 0.4 }),
    // An impact on the visual peak of every scene change and a whoosh that ends on it. frames is the whoosh's length: its duration from the search line times 30.
    ...cuesOnChanges(manifest.scenes.map((s, i) => ({ ...s, ...exits[i] })), { impact: { sound: "thud", volume: 0.55 }, whoosh: { sound: "whoosh", frames: 24, volume: 0.3 } }),
    // The riser's length in frames is its duration from the search line (`(0.8s)`), times 30. Do not assume a length.
    { at: cueBefore(reveal.startFrame, 24), sound: "riser", volume: 0.3 },
  ];
  return (
    <AbsoluteFill>
      {manifest.music ? <Music src={urls[manifest.music.key]} volume={0.5} dips={[{ from: reveal.startFrame - 24, to: reveal.startFrame, volume: 0.05 }]} /> : null}
      {manifest.scenes.map((s) => (
        <SceneFrame key={s.id} from={s.startFrame} durationInFrames={s.durationFrames} {...exits[manifest.scenes.indexOf(s)]}>
          {null}
        </SceneFrame>
      ))}
      <SoundCues cues={cues} sounds={sounds} />
    </AbsoluteFill>
  );
};
```

The riser in this example is 0.8 seconds long, which is 24 frames, so `cueBefore(reveal.startFrame, 24)` starts it 24 frames before the reveal and it ends on it. The whooshes of `cuesOnChanges` are 24 frames too. Take that length from the pulled file: `reelkit assets search` prints each sound's duration at the end of its line (for example `(0.8s)`), so a 1.5-second riser needs 45 frames. The whoosh at frame 0 opens the film with sound; the dip gives the reveal its rest.

For the one hero moment (the name landing, a screen floating in space) the kit has a 3D layer: see `reference/three-d.md`.

For the ground behind the film, an animated ground or a dimmed video is an option: see `reference/backgrounds.md`.

## Size and typeface of library interface pieces

Library components (widgets, banners, lists) come small by default, sized for a page and not a phone. An interface piece fills at least 70 percent of the frame's width: scale it with a wrapper (`transform: scale(...)` with a `transformOrigin`) or with its `size` prop if it has one. One typeface for the film: pass the film's font (`font("outfit")`, for example) to every component that takes one, and prefer the components that do. `Camera` frames: a `Camera` inside a `SceneFrame` counts frames from the start of that scene (frame 0 is the scene's first frame, because a `SceneFrame` is a Sequence), so `zoomTo(44, ...)` is 44 frames into the scene; a `Camera` outside every `SceneFrame`, around all of them, counts the video's absolute frames.

## No screenshots

When the user has no real screens to show, build the interface pieces from library components and plain cards, inside a device or card frame, and mark nothing as the user's real app: no real-looking logo, no invented numbers presented as true. The library's components have different defaults for colour and typeface, so pass the film's one accent colour and one typeface to EVERY library component through its props, or the film will show three accents and three typefaces. With real screens, use them instead (see "The pictures").

## Sound for interface events

A product surface (`PromptBox`, `TerminalLog`, `NamedCursor`, `GlassPanel`, `ChapterFrame`, `CounterRoll`) is performed on screen, so its sounds are small and exact. Every such component has a companion function that returns the frames of its events (`promptFrames`, `terminalFrames`, `clickFrames`, `panelSettleFrame`, `chapterFrames`, `settleFrame`), and `cuesFor(events, kind, { offset })` turns those frames into cues. The rule: the sound sits on the frame the picture settles, the frame the companion function gives, not on the beat grid and not on the start of the move. Add the scene's `startFrame` as `offset`; the frames come out in the scene's own clock.

| Event | `cuesFor` kind and roles | Search words for the file | Length | Level without / under a voice | How many per 10 s |
|---|---|---|---|---|---|
| Typed text | `type`: `type-tick`, then `type-return` one frame after the last character | `mouse click`, `glass tap` | 0.2 s, 0.5 s | 0.2 and 0.4 / 0.1 and 0.2 | 6 to 12 ticks in 1 to 3 runs; never over 12 a second |
| Cursor click, send button | `click`: `click` | `mouse click` | 0.2 s | 0.4 / 0.22 | 1 to 3 |
| Card or panel lands | `snap`: `snap` | `soft impact` | 0.7 s | 0.45 / 0.25 | 2 to 5 |
| Badge or chip appears | `pop`: `pop` | `bubble pop` | 0.5 s | 0.4 / 0.22 | 3 to 6 |
| Number counting | `count`: `count-tick` train, `count-settle` on `settleFrame` | `counter ticks`, `success chime` | 0.1 s each, 1 s | 0.2 and 0.45 / 0.1 and 0.25 | 0 to 2 trains |
| Terminal lines | `stream`: `stream`, one per line | `glass tap` | 0.5 s | 0.18 / 0.1 | 5 to 15; never over 6 a second |
| Pieces assemble | `assemble`: `assemble-run` rising, `assemble-lock` on the last piece | `counter ticks`, `soft impact` | 0.1 s each, 0.7 s | 0.25 rising to 0.5, and 0.55 / 0.12 and 0.3 | 0 to 1 per film |
| Logo or end card | `resolve`: `resolve-riser` ending on `resolve-chime` | `whoosh buildup`, `sparkle shimmer` | 1.2 s, 1.5 s | 0.35 and 0.55 / 0.2 and 0.3 | once, at the end |

The names are the roles: map each to a pulled file in the `sounds` object of `SoundCues` (the interface pack's files are named `sfx-ui-...`: `sfx-ui-key-clicks`, `sfx-ui-glass-tap`, `sfx-ui-bubble-pop`, `sfx-ui-soft-impact`, `sfx-ui-count-ticks`, `sfx-ui-success-chime`, `sfx-ui-sparkle-shimmer`; search first with `reelkit assets search "<words>" --kind sfx` and read each file's length). A film with a narrator passes `voice: true` for the quieter column: nothing is ever over 0.3 while the voice speaks. Scene changes keep `cuesOnChanges`; a `color-push`, `flash`, `ring` or `flip` change peaks on the boundary frame itself, and `changeFrame` knows it.

Give the end card a clear second: `clearBefore(cues, chimeFrame)` removes every other cue in the second before the riser, and a `Music` dip over the same span leaves the riser alone with the picture. `cuesFor` is checked by tests: counts, the caps above, no two cues of one role on one frame, and the same cues every time.

```tsx
const q = promptFrames({ text: question, reply }, manifest.fps);
const cues = [
  ...cuesFor(q.type, "type", { offset: ask.startFrame }),
  ...cuesFor([q.send], "click", { offset: ask.startFrame }),
  ...cuesFor([settleFrame({ delay: 8, frames: 40 })], "count", { offset: stat.startFrame }),
];
```

## Read the sound report

`reelkit render` measures the finished file and prints one line for a film with no voice; `reelkit sound [file]` prints it again for `out/video.mp4` or any file, and `reelkit sound --detail` lists every event the counts were made from: each picture change (time, frame, strength) with the nearest hit and its distance, each swell (start, peak, length) and the first sound; with `--json` the same as arrays. It is a measurement of the audio and the picture, not a judgement of how the film sounds: listen to it as well. What the numbers mean:

- **Hits a second** (`hitsPerSecond`): sudden rises in the loudness (8 dB or more over the sound 48 milliseconds before, whatever else the film holds), over the whole sound. Targets: 2 to 3. Low: add clicks, pops and a thud on the scene changes. High: some moves can stay silent.
- **Swells** (`swellsPerSecond`): a rise of the band between 0.5 and 10 kHz, the air of a whoosh or a riser, of 4 dB or more above its own level over the second and a half around it, building over at least a tenth of a second. The level is local, so one loud riser does not hide the quiet whooshes around it, and steady music gives none. Targets: one every 1 to 2 seconds, so 0.5 to 1.3 a second. Low: put a whoosh that rises on each move and a riser before each reveal (a burst that starts at full level is a hit, not a swell; see "Which sounds swell" above). The targets come from the four measured films, with the detector the owner used then; this one counts about the same sounds, but treat the target as a direction.
- **Picture changes with a hit** (`changesWithHit` of `pictureChanges`): how many of the big changes in the picture have a hit within a tenth of a second. A transition is a span of frames, not one frame: the hit is measured to the nearest point of the span that changes (the run of frames above the change threshold around the peak), so a hit on the boundary at the end of a five-frame transition counts. Camera zooms and punches are picture changes too. The films had 55 to 75 percent. Low: a hit on each change that matters, on the visual peak (`cuesOnChanges`, `cueOnCamera`); `--detail` shows which changes have none and how far the nearest hit is.
- **First sound** (`firstSoundSec`): the films began within 0.05 seconds. Later: add a cue at frame 0.

The same numbers are in the render's `data.sound`. A measurement that cannot be made never fails the render.

## Check before you show it

`reelkit preview` shows two frames per scene and prints a continuity line and a beat line (how many scene changes carry something across and land on the beat). It prints no rhythm line: the rhythm of the scene lengths is `reelkit plan check`'s. Look for a shot that holds still for long (the films were still for 11 to 35 percent of the time and no more), a shot whose type is over the object, and a second accent colour. Then show the user the frames, as in the main steps.

## Brand reveals and transformations

For a brand-led shot, consult `reference/brand-motion.md`. Choose `BrandTransform3D` turn, arc or launch by the idea it connects; use the supplied identity, finish in a readable neutral pose, and place the sweep and lock from `brandTransformFrames` with `cuesFor(..., "transform")`. Several 3D shots are appropriate for a requested brand film when they each have a different purpose. Map the `transform-sweep` and `transform-lock` roles to the chosen whoosh and impact files. Treat the sound report as evidence to investigate, not a quota to fill with extra hits. Existing approval to edit or render carries through to the requested revision.
