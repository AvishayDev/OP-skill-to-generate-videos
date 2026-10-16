---
name: backgrounds
description: Use when choosing what sits behind the whole film - a flat or mesh ground, an animated ground drawn in code, a looping video, a picture, or pictures that change from scene to scene - and how to get and use one.
---

# Grounds

The ground is what is under everything. Choose one for the whole film and keep it: a film with a new look in every scene reads as a collage.

## Which ground

- A flat colour or `BgMesh`: for interface and data films, where the product is the picture and the ground must stay out of the way.
- An animated ground drawn in code (`BgAurora`, `BgBeams`, and for a technical film `BgGrid`; `BgGrain` for a still, filmic ground): when the frame would otherwise be empty. No media is needed and they are cheap to render.
- A video ground (`BgVideo`): for mood and brand films. Always dim it (0.3 to 0.5) or blur it, and never put small text over it.
- Pictures that change (`BgSequence`): a set of related pictures that change on scene starts, never in the middle of a sentence and no more than once every few seconds. Keep one `dim` and one `tint` across all of them so the film stays one film. Use "fade" by default and "zoom" or "blur" for an energetic film.

## Grade and Vignette darken a ground

`Grade` and `Vignette` laid over the film darken everything under them, and a ground drawn in code loses the most: a ground that looked right alone can go muddy under them, and on a near-black base it can all but vanish. `BgAurora`, `BgBeams`, `BgGrid` and `BgGrain` take `intensity` (0 to 1, default 0.6, which reads on a phone on its own). Raise it to 0.8 when Grade and Vignette sit on top, or when the base is near-black; lower it to 0.3 to 0.4 when type sits right on the colour fields and has to stay readable. Look at a preview frame with the whole film's layers on, not the ground alone.

## Getting one

Search the library first: `reelkit assets search "<mood> abstract background" --kind clip`, and also `--kind overlay` and `--kind image`. Pull a good fit as the film's ground with `reelkit assets pull <id> --background`; for a picture that is one scene's ground, add `--scene <id>`. A video is only ever the ground of the whole film.

Generate only when nothing fits, because a clip uses the clip quota: `reelkit assets gen clip --background "<look>"` makes an abstract, slow, seamless clip with no people or text, and `reelkit assets gen image --background --scene <id>` a picture. For a set of pictures, give every prompt the same style sentence so that they look related. The user's own file: `reelkit assets upload <file> --background`.

All of these record the ground in `assets/background.json`. The composition reads it as `manifest.background` (`key` and, for a video, `durationSec`) and `manifest.scenes[i].background` (`key`).

## Keeping the accent

Tint the ground with the film's one accent colour (`tint={palette.hero}`), so that a clip you did not make still belongs to the film.

## Readable type

`reelkit check` notes a `BgVideo` with a `dim` under 0.2 when the plan has on-screen text, and a recorded ground the composition never draws. Preview the frames: if type is hard to read anywhere, raise `dim`, add `blur`, or move the type.

## Example

```tsx
import React from "react";
import { AbsoluteFill } from "reelkit/frame";
import { BgImage, BgSequence, BgVideo, SceneFrame, bgPerScene, palettes } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";

export const Video: React.FC<VideoProps> = ({ manifest, urls }) => {
  const palette = palettes.darkTech;
  const scenesWithPictures = manifest.scenes.some((s) => s.background);
  return (
    <AbsoluteFill>
      {scenesWithPictures ? (
        <BgSequence items={bgPerScene(manifest.scenes, manifest.scenes.map((s) => (s.background ? urls[s.background.key] : undefined)))} tint={palette.hero} dim={0.4} />
      ) : manifest.background ? (
        <BgVideo src={urls[manifest.background.key]} durationSec={manifest.background.durationSec} dim={0.4} tint={palette.hero} />
      ) : (
        <BgImage src={urls["assets/bg-film.png"]} dim={0.4} drift="left" />
      )}
      {manifest.scenes.map((s) => (
        <SceneFrame key={s.id} from={s.startFrame} durationInFrames={s.durationFrames}>{null}</SceneFrame>
      ))}
    </AbsoluteFill>
  );
};
```
