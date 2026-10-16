---
name: continuity
description: Use before the plan and again when writing the composition - how to keep a video from feeling like a slideshow, with concepts chosen from the brief, what to carry across every scene change, how to vary rhythm, and how to read the continuity and rhythm numbers the CLI reports.
---

# Continuity and rhythm

A slideshow is a row of separate pictures: each scene replaces the one before it, and every scene lasts about the same time. Two things cure it. Continuity means that at every scene change something on screen survives and visibly moves, grows or turns into the next scene. Rhythm means shot lengths differ a lot, the picture sometimes rests, and not everything moves all the time.

## A concept before a new plan

A concept is one sentence about the picture, not about the product. Before a new `plan.json`, recommend the strongest concept that fits the brief; offer alternatives if the user wants a comparison. Keep an already chosen concept for revisions. For each one say the opening frame, what carries each scene change, and what it rules out.

Ideas to draw from (invent your own when the topic asks for it):

- **One element that transforms through the whole video.** A single card is the opening frame; it becomes the list, then the chart, then the button. Rules out unrelated pictures per scene.
- **One continuous camera move through scale.** The opening frame is a whole screen; the camera pushes into one detail until that detail is the next scene, and so on. Rules out cuts and flat full-frame layouts.
- **A chain of cause and effect.** Each event starts the next: a tap sends a message, the message lands as a notification, the notification opens the app. Rules out scenes that merely follow each other in a list.
- **One surface the whole video lives on.** A desk, a phone screen, a page, a map. Everything is placed on it and the camera or the objects move across it. Rules out backgrounds that change per scene.
- **A before-and-after split.** The frame is divided from the start; the dividing line moves, and what was on one side becomes the other. Rules out stories that have no contrast to show.

Write each concept as: "Opens on a plain card with the price. The card slides up and becomes the header of the comparison; the comparison's winning row grows into the call to action. No stock backgrounds." Honor the chosen direction; write it into the first scene's `notes`, next to the look.

## Carry at every scene change

For each boundary between two scenes, write down in that scene's `notes` what survives and how it moves. "Scene 2 to 3: the price card shrinks to the top-left and stays as the badge." If you cannot name it, the change is a cut.

Ways to do it with the kit:

- An element held in a `Carry` layer outside the scenes. It is drawn once, above the `SceneFrame`s, so it does not fade with them, and its keys say where it must be at which frame.
- A `Camera` pushing into an element until it fills the frame. The next scene starts with that element as its whole picture.
- A container that grows into the next scene's background. The card of one scene becomes the full-frame ground of the next.
- A shared colour field that one scene's object expands into. The new scene is the colour the old object grew to.

A hard cut is a choice. Use it for a burst of fast hits, or for the end card, and know that you are doing it. It is not the default. Say so in the plan: give the scene that begins on the cut `"cutIn": true`. `reelkit preview` then reports that change as `cut (intended)` and leaves it out of the score.

`SceneFrame` fades each scene in and out over its first and last few frames. Anything that must stay on screen through a change therefore lives outside it, in a `Carry` layer (or inside a `Camera` that wraps all the scenes). This example holds a price card through two scenes: it is large in the first, then shrinks into a badge that the second scene is built around.

```tsx
import React from "react";
import { AbsoluteFill } from "reelkit/frame";
import { BgMesh, Carry, Entrance, fonts, palettes, SceneFrame } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";

export const Video: React.FC<VideoProps> = ({ manifest }) => {
  const palette = palettes.darkTech;
  const [a, b] = manifest.scenes;
  return (
    <AbsoluteFill>
      <BgMesh bg={palette.bg} hero={palette.hero} accent={palette.accent} />
      <SceneFrame from={a.startFrame} durationInFrames={a.durationFrames}>
        <Entrance delay={4}><div style={{ color: palette.dim, fontFamily: fonts.body, fontSize: 48 }}>Today only</div></Entrance>
      </SceneFrame>
      <SceneFrame from={b.startFrame} durationInFrames={b.durationFrames}>
        <Entrance delay={10}><div style={{ color: palette.ink, fontFamily: fonts.display, fontSize: 96, fontWeight: 800, marginTop: 360 }}>Half the price</div></Entrance>
      </SceneFrame>
      <Carry
        keys={[
          { frame: 6, x: 0.5, y: 0.45, width: 0.7, height: 0.22, radius: 0.03, opacity: 1 },
          { frame: b.startFrame + 6, x: 0.25, y: 0.12, width: 0.3, height: 0.08, radius: 0.02 },
        ]}
      >
        {(box) => (
          <div style={{ width: "100%", height: "100%", background: palette.hero, display: "flex", alignItems: "center", justifyContent: "center", color: palette.ink, fontFamily: fonts.display, fontWeight: 800, fontSize: box.heightPx * 0.5 }}>
            $49
          </div>
        )}
      </Carry>
    </AbsoluteFill>
  );
};
```

The move toward a key starts 12 frames before the key's frame and lands on it; give the card a key early enough in the first scene that it has settled before the change, and a key just after the change for where the next scene wants it.

## Write the seams down before the code

A film with more than three scene changes gets a seam ledger: one line per change, written into the notes of the scene that begins there, before any of the composition is written. Each line names four things:

- **What joins them:** a carried element, a camera push into a detail, a container that grows into the next ground, a transition from the list below, or a cut.
- **What is moving at the change, on each side.** The strongest joins have motion on both sides of the boundary: the old scene is already leaving as the new one is still arriving. A scene that comes to rest, waits, and is then replaced reads as a slide.
- **The direction, on each side, and they match.** If the old scene leaves upward, the new one arrives from below and travels upward too. A change whose two sides move in different directions is a collision, however smooth each half is.
- **The frame it happens on,** from the voice or the beat.

"Scene 3 to 4: push-up. The receipt card is rising out as the total rises in from below; both travel up; on the beat at frame 212."

Three rules make a ledger hold together:

- **Leaving is faster than arriving.** What exits accelerates away (`ease.in`) in about three quarters of the time the next thing takes to arrive and settle (`ease.out`). Equal times on both sides feel like a crossfade.
- **Give the film one direction of travel and spend the others once.** Most changes move the same way, which is what makes a film feel like it is going somewhere. Into the screen, back out of it, and against the usual direction are each kept for one named moment: entering the product, the pull back to the whole picture, the turn in the story.
- **Ration the punctuation.** A flash, a colour inversion, a glitch or a whip is used once in a film, on the moment it was saved for. Used twice it is a habit; used on every change it is noise.

After `reelkit preview`, read the ledger against the boundary frames: each line should be visible in its pair of pictures. A line you cannot see in the frames was not built.

## Rhythm

- Vary shot length at least fourfold: a hit of a quarter of a second beside a hold of two seconds or more. A plan whose scenes all last about the same time is a slideshow.
- Put a rest before the biggest moment: for about a second little or nothing moves, so that the moment lands.
- Never the same exit twice in a row. If one scene's content slides out to the left, the next one scales or wipes.
- Fewer sounds than changes. Sound a change that matters; leave the others silent.

## The cause is visible

When something reacts, show what caused it: a pointer that presses before the button changes, an object that lands before the splash, a word that is spoken before the number appears. A result with no visible cause looks like a cut, even when everything is moving.

## Small elements, big ground

For product pictures, the default is a small element on a big ground: the card, phone or button takes a third of the frame and the ground (a colour field, a surface, a blurred scene) fills the rest. A full-frame screenshot is for a held shot, where the viewer needs time to read it. Small elements are what a `Carry` or a `Camera` can move; full-frame pictures can only be replaced.

## Reading the numbers

`reelkit preview` also saves the two frames around each scene change (`b01-end-<scene>.jpg`, then `b01-start-<scene>.jpg`, and so on) and prints a continuity report: a line such as "3 of 5 scene changes carry something across", and a line for each change where nothing does. The frames are the last and first ones at full strength, because `SceneFrame` fades the very last and first. The measure compares edges, the outlines of what is on screen: when at least a quarter of the earlier frame's outlines are still there, nearby, in the later frame, the change is `carried`; otherwise it is a `cut`. A change where the earlier frame is nearly empty is not counted. The later scene is sampled twice, at its first fully visible frame and about six frames on, and the better of the two is taken, so a plate that settles into a card is not called a cut. A scene with `cutIn: true` is reported as `cut (intended)` and not counted.

Read it as a smoke alarm, not a grade. A `cut` is a prompt to fix the change or to say in the notes why it is a cut. A `carried` change can still be wrong (an element that stays but means nothing), so look at the pair of frames. The report is advice and never makes `preview` fail. Aim for most changes carried, with the cuts that remain on purpose.

`reelkit plan check` reads the rhythm from the narration: with four scenes or more, it adds a line under "Worth improving" when the scenes are about equally long, or when none is shorter than half the average. It quotes the shortest and the longest. Its data holds `sceneSeconds` for each scene and `lengthVariation`, the spread of the lengths over their mean; below 0.25 is too even. The cure is in the line itself: make one or two scenes much shorter, a hit of a few words, and let one run long.

When the video follows a reference, `reelkit ref analyze` gives targets to match. `pacing.shotLengthVariation` is the same spread for the reference's shots (left out when it has fewer than three), and `stillness` holds `share`, the part of the time in which the picture barely changes from frame to frame, and `longestSec`, the longest such hold. If the reference's shots vary by 0.8 and it is still a third of the time, plan scene lengths that vary about that much, and let the picture rest about that often. A video that moves every frame, against a reference that holds, will feel busier than the reference, whatever else you copy.

## Transitions

`SceneFrame` fades by default. Choose another transition with `enter` and `exit` (the same kind on both sides of a change), `transitionFrames` (8 by default, at most 20) and, for a zoom, `origin` (where it aims, as fractions of the frame). Each is complete exactly at the scene boundary, so the cut stays on the beat. A transition is a choice with a meaning:

- `zoom-through`: going INTO something. The old scene rushes toward a point and the new one arrives from there: into a screen, a detail, a product.
- `push-left`, `push-right`, `push-up`, `push-down`: moving along a sequence, such as the next step or the next card in a row.
- `whip-left`, `whip-right`: a quick list, one item after another, with a smear that carries the eye.
- `turn`: a before and after, or two sides of the same thing.
- `zoom-in`, `zoom-out`, `blur`: a soft change of subject or mood.
- `cut`: a burst of hits, where speed matters more than smoothness (mark it with `cutIn` in the plan).
- `fade`: the default, for a calm change.

Rules: use at most two kinds in one video. Never the same exit twice in a row for different meanings: a push that always means "next" is a rhythm, but a push for one thing and a push for another is noise. A carried element (`Carry`, `Camera`) beats any transition: if something stays on screen and moves into the next scene, the change needs no transition at all, so leave it `fade` or `cut`. `reelkit preview` takes its boundary frames clear of a literal `transitionFrames={N}` in the code.

```tsx
<SceneFrame from={a.startFrame} durationInFrames={a.durationFrames} exit="zoom-through" origin={{ x: 0.5, y: 0.45 }}>...</SceneFrame>
<SceneFrame from={b.startFrame} durationInFrames={b.durationFrames} enter="zoom-through" origin={{ x: 0.5, y: 0.45 }}>...</SceneFrame>
```
