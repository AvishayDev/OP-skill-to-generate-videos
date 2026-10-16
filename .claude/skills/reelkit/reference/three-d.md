---
name: three-d
description: Use when a shot needs real depth - extruded type, a screen floating in space, a ring of cards, a camera that orbits or pulls back - and for deciding whether 3D earns its place at all.
---

# 3D shots

The kit has a 3D layer on three.js: `Scene3D`, `Text3D`, `Card3D` and `Orbit3D`, and elements for the moments in a film that earn them: `Assemble3D`, `BrandTransform3D`, `Particles3D`, `Hero3D`, `Screen3D` and `Warp3D`. Everything is deterministic and driven by the frame. You import only from `reelkit/kit`; three itself is not importable from the composition.

## When 3D earns its place

One hero moment in a film: the product's name landing as thick letters, a screen floating in space and turning to face the viewer, a ring of features that the camera pushes through. That is what the extra depth is for.

It reads as a template when everything spins, when several objects each get their own 3D entrance, or when body text is extruded. Type that is read in a sentence stays 2D. One or two 3D shots usually provide enough contrast. A requested brand film or showreel can use more when each has a distinct purpose; keep sentences and detailed screens readable.

## Which element earns its place

Choose by what the moment has to say. For a brand transformation and its matching sound, read `reference/brand-motion.md`:

| The moment | Reach for | Why |
|---|---|---|
| A reveal: the name, a logo, a number of things arriving | `Assemble3D` (`shape="text"` for a word, `"grid"`, `"sphere"`, `"wall"`, `"ring"`) | Hundreds of blocks build into the thing; the piece counter (`assembledCount`) and the lock sound (`assembleEnd`) come with it |
| A brand or product arriving in its readable pose | `BrandTransform3D` (`mode="turn"`, `"arc"`, `"launch"`) | One deterministic arrival that holds neutral; `brandTransformFrames` gives the exact sound landing |
| An abstract idea: intelligence, flow, a network, "everything in one place" | `Particles3D` (`from` and `to` shapes, or `"text"`) | Light that changes shape reads as thought, and costs no artwork |
| The product itself | `Hero3D` (`kind="device"` with a screenshot, `"logo"`, `"coin"`, `"box"`) | A studio-lit object with clearcoat, two coloured rim lights and a soft floor |
| An interface carried across scenes | `Screen3D` with `poses` | One screen, re-posed at each scene, instead of a new mock each time |
| A fast change of place or a hyperspace beat | `Warp3D` as a ground, or `burst` as a 12 to 20 frame transition | Streaks from the vanishing point, additive |

Set the mood once on the `Scene3D` (`mood="studio"`, `"night"`, `"sunset"` or `"neon"`): it chooses the light colours, their intensities and the fog tint together, so nobody tunes lights by hand. Everything fits a 9:16 frame by default (`fit`, the share of the width at the closest the camera comes), and everything is a pure function of the frame and a `seed`.

HyperFrames captures 3D through software GL for consistent output. Render cost depends on the browser, resolution, geometry and other jobs on the machine; measure the actual shot instead of relying on timings from a previous renderer. Start with the count the picture needs and raise it only when the preview improves.

## How to layer it

Put a `Scene3D` inside a `SceneFrame`, over the 2D ground. Its background is transparent by default, so the `BgMesh` or flat colour behind shows through. Captions, small labels and logos stay 2D, in front of it. If the 3D shot is the whole scene, `Scene3D` is the only thing in the `SceneFrame` besides those labels.

## What the camera sees, in numbers

The default camera has a 50 degree field of view. At distance `d` from the object it sees `0.93 * d` units tall, and that times the frame's width over height across:

| Frame | Width seen at z 6 | At z 9 | At z 5.5 |
|---|---|---|---|
| 9:16 phone (aspect 0.5625) | 3.1 | 4.7 | 2.9 |
| 1:1 | 5.6 | 8.4 | 5.1 |
| 16:9 | 9.9 | 14.9 | 9.1 |

So on a phone frame the camera sees about 3 units across at z 6, not 5.5; a card 3 wide fills the whole frame, and a word at size 1.1 is cut off. You do not have to do this arithmetic: leave the sizes out and the kit does it. Distances count from the object, so an object at z 2 with the camera at z 8 is 6 away. The kit exports the same numbers as `visibleWidth(distance, aspect, fov?)` and `visibleHeight(distance, fov?)`.

## Sizes: leave them out

`Text3D` without `size` is sized from the measured width of its own letters so that it fills `fit` of the frame's width (default 0.8) at the closest the camera comes to it. "Closest" is read from the `Scene3D` camera keys: the key where it sees the least. A word is therefore whole at every moment, on any aspect, and exactly as big as it can be. A line break makes a second line: write `text={"Hyper\nFrames"}` in JSX, since `text="Hyper\nFrames"` passes a literal backslash and n; its height is held to `fit` of the frame's height. Giving `size` turns this off and you are back to doing the arithmetic yourself.

A push-in makes the word smaller at the start in proportion: from z 9 to z 6 it begins at two thirds of its final width. A start at about 25 percent further away than the end (z 7.5 to 6) reads as a gentle push; a larger one begins as a small word. Camera sideways moves (`x`) are not counted, so keep the word near the middle when you orbit.

`Orbit3D` without `radius` sizes the ring from its cards (the radius at which they stand side by side) and then scales the whole ring, radius and cards together, so that it lies inside `fit` of the frame (default 0.85) at the closest key, however it has turned and on any aspect. Set the cards' proportions with `width` and `height` and leave the rest. A `radius` you give wins and nothing is scaled. Pass `position` to move the ring's middle: it is part of the fit.

`Card3D` alone has no camera to fit to: size it with `width` from the table above (a card in a phone frame at z 6 is 2.2 wide at most).

## What a ring of cards carries

A ring of empty coloured cards reads as placeholders. Every card carries something: a `label` (a word, large, in the film's font), an `icon` (an image or svg from the project, drawn above the label), or a picture (`src`). Use `accent` for the rim, and keep the cards' `color` to the film's palette: one hero colour, its darker and lighter neighbours. A card face is drawn with a soft gradient, a highlight and a rim, so a flat `color` is enough.

## Camera moves

`camera.keys` move the camera with the same timing rule as the 2D `Camera`: a spring that starts 12 frames before the key's frame and lands on it. Three moves cover most needs:

- Push in: `z` from 7.5 to 6 over the shot (a word fitted at its closest, so it never leaves the frame). A bigger push from 9 to 5.5 works for a ring or a card, which are fine small at the start.
- Orbit a quarter turn: move `x` from -4 to 4 with `z` around 6, and keep `lookAt` on the object.
- Pull back to reveal: begin close on one card (`z` 3) and end wide (`z` 9) as the others arrive.

Keep a held word still for at least 1.5 seconds before the camera moves again.

## Keeping type readable

`Text3D` that must be read faces the camera: rotation near 0 and the camera in front of it. A word that turns in (`enter="turn"`) must finish turning, and then stay, for 1.5 seconds. Latin text only: Hebrew and other scripts stay 2D (see `reference/hebrew-rtl.md`, which is unchanged). Use the film's one accent colour for the extruded word.

## Cost

A 3D scene renders slower than 2D, and the first 3D render in a project bundles three. Use it for the shots that need it, not for every scene.

## Example: a portrait scene, verified by a render test

A word and a ring of labelled cards on a phone frame. Nothing is sized by hand, and a test renders this exact block on 9:16 and checks that nothing touches the edges.

```tsx
import React from "react";
import { AbsoluteFill } from "reelkit/frame";
import { Card3D, Orbit3D, Scene3D, SceneFrame, Text3D, palettes } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";

export const Video: React.FC<VideoProps> = ({ manifest }) => {
  const palette = palettes.darkTech;
  const s = manifest.scenes[0];
  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg }}>
      <SceneFrame from={s.startFrame} durationInFrames={s.durationFrames} enter="cut" exit="cut">
        <Scene3D camera={{ keys: [{ frame: 0, z: 7.5, y: 0 }, { frame: 40, z: 6 }] }}>
          <Text3D text="Plan it." color={palette.ink} position={[0, 1.2, 0]} enter="rise" />
          <Orbit3D position={[0, -0.6, 0]} speed={1.2} tiltDeg={10}>
            <Card3D color={palette.hero} width={1.2} height={1.6} label="Plan" />
            <Card3D color="#2563EB" width={1.2} height={1.6} label="Focus" />
            <Card3D color="#059669" width={1.2} height={1.6} label="Ship" />
            <Card3D color="#D97706" width={1.2} height={1.6} label="Rest" />
          </Orbit3D>
        </Scene3D>
      </SceneFrame>
    </AbsoluteFill>
  );
};
```

## Example: a reveal that builds itself, verified by a render test

The name arrives as blocks that fly out of a cloud and settle into the letters, under a neon light, with the camera pushing in. Nothing is sized by hand: the word fills 80 percent of the width at its closest, and a test renders this exact block on 9:16 and checks that it is whole and clear of the edges.

```tsx
import React from "react";
import { AbsoluteFill } from "reelkit/frame";
import { Assemble3D, Scene3D, SceneFrame, palettes } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";

export const Video: React.FC<VideoProps> = ({ manifest }) => {
  const palette = palettes.darkTech;
  const s = manifest.scenes[0];
  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg }}>
      <SceneFrame from={s.startFrame} durationInFrames={s.durationFrames} enter="cut" exit="cut">
        <Scene3D mood="neon" camera={{ keys: [{ frame: 0, z: 7.5 }, { frame: 70, z: 6 }] }}>
          <Assemble3D shape="text" text="Relay" count={700} frames={50} order="x" colors={[palette.hero, palette.accent]} />
        </Scene3D>
      </SceneFrame>
    </AbsoluteFill>
  );
};
```
