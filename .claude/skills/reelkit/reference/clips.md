---
name: clips
description: Use when a scene might be a generated or reused video clip - B-roll that shows what the narration says, or a green-screen subject placed over your own graphics - including how to write the prompt, what a clip costs and how to layer it.
---

# Video clips

A clip is a few seconds of generated video. It is the most expensive thing Reelkit makes: it takes minutes and each one uses part of a small monthly allowance. Use it where nothing else carries the point.

## Is a clip worth it?
- Use a clip when the sentence is about something that moves and cannot be drawn well in code or as one still: a person doing something, an animal, weather, a crowd, water, a place seen from a moving camera.
- Do not use a clip for numbers, lists, steps, UI or anything with text (motion graphics do that better and cost nothing), nor for a concept one illustration shows (a still costs far less).
- Most videos need none, or one or two. Plan a clip scene with `"treatment": "clip"` and a `clipPrompt`; give it `imageTags` (3 to 6) like an illustration, and set `shareable` by the same rule as images.
- Check what is left before planning more: `reelkit whoami` shows `Clips: used/limit`, and when it resets. Clips are limited per month. If the allowance is gone, say so to the user and use an illustration or a motion graphic instead; do not work around it.

## Search first
`reelkit assets search "<what the clip shows>" --kind clip`. Each result starts with a match percentage. Pull the best one (`reelkit assets pull <id> --scene <sceneId>`) when it is 60% or more and its description fits the sentence; it is free and instant. Otherwise generate: `reelkit assets gen clip --scene <sceneId>`. Never give two scenes the same clip.

## Writing a clip prompt
- One subject, one action. "A fisherman pulls a net from a grey sea" is a clip; "a fisherman, his family at home, and the market" is three.
- Say the camera: "slow push-in", "handheld tracking shot", "static wide shot", "slow pan left".
- Say the light and the mood: "low golden sun", "overcast, soft light", "neon night".
- No text, letters, logos, signs or screens with content in the picture: the generator draws them wrong. Add the words yourself in the composition.
- It is 5 seconds by default (`--seconds 10` doubles the cost to the allowance only when the action truly needs it). Describe what happens in 5 seconds, not a story.
- The scene runs as long as its narration. A clip shorter than the scene holds its last frame, so end the action on a moment that can sit still.
- Generation takes up to several minutes. The command waits and prints a line every 30 seconds. If it gives up after ten minutes it prints the id and a `reelkit assets gen clip --resume <id> --scene <sceneId>` line: run it; it does not charge again.

## B-roll rules
- The clip shows exactly what the sentence says, at the moment it says it. If the sentence is abstract, the clip is the wrong tool.
- Never the same clip twice in a video, and no two clip scenes in a row that look alike.
- Hold a clip while its action or emotion carries the speech. Add another visual when meaning or readability needs it; do not interrupt a useful hold to satisfy a change quota.
- Text over a clip must stay legible. Use `<ClipLayer src={urls[s.clipKey]} dim={0.25} />` to darken it, keep headlines in the calm part of the picture, and look at the preview frames for contrast on both the early and the late frame.

## Green screen
A green-screen clip is a subject filmed on a flat pure green background. It is for a person or an object that you place over something of your own: a presenter pointing at the user's screenshot, a character beside your title, a product over a gradient.
- Generate it with `reelkit assets gen clip --scene <sceneId> --green`. The original is saved as `assets/clip-<sceneId>.mp4` and the green is keyed out locally into `assets/clip-<sceneId>.webm`, a video with a transparent background. The manifest has both: `s.clipKey` and `s.clipKeyedKey`. Use the `.webm`.
- Prompt it as a subject, not a scene: "A woman in a blue jacket, waist up, waves and then points to her left. Flat, evenly lit, pure green background (#00FF00)." Keep the whole subject inside the frame with room around it; no green anywhere on the subject (clothes, props, eyes); no shadows, floor or reflections on the background; no camera move, because keying a moving frame edge flickers.
- A video model rarely produces a true chroma green; it usually gives a soft sage. When the green is too dull to key cleanly, the command does not key it: it cuts the subject out on the server instead (see "No green screen" below), says so, and uses cutout seconds from the quota. The result is used the same way.
- If the keyed edges look green or ragged in the preview, the prompt was at fault: regenerate once with a flatter green and an evenly lit subject, using `--redo`. A clip left unkeyed (the command says so) is keyed again for free by running the same command again.
- Layer it above the scene's background and below the captions:

```tsx
import { Img } from "reelkit/frame";
import { Captions, KeyedClip, SceneFrame } from "reelkit/kit";

<SceneFrame from={s.startFrame} durationInFrames={s.durationFrames}>
  <Img src={urls[s.userAssetKeys[0]]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  {s.clipKeyedKey ? <KeyedClip src={urls[s.clipKeyedKey]} x={0.72} y={1} scale={0.7} /> : null}
  <Captions words={s.words} />
</SceneFrame>
```

- A green-screen scene still has a `clip` treatment and a `clipPrompt`, with the background and the type in the composition. A library clip with the same use comes keyed too: `reelkit assets pull <id> --scene <sceneId>` writes the `.webm` beside the `.mp4` when the clip is marked green screen.
- It costs the same as any clip and is harder to get right: at most one or two green-screen clips per video.

## Your own green-screen footage
If the user filmed themselves or a product in front of a green background, register it with `reelkit assets upload ./me.mp4 --green --describe "what it shows"`. The original is kept and a copy with the green made transparent, sound included, is written beside it; the command prints the `urls[...]` path of that copy. The key colour is read from the corners of the frame, so the green does not have to be perfect, but it does have to fill the corners: a video whose corners are not green is refused. For a talking presenter, leave the copy's sound on (`muted={false}`) and do not also play the original.

## No green screen: cut the subject out
Use this when the footage or the clip is not on a green background but the subject has to be layered over something else.
- If the background is green, use `--green` instead: it is free and runs on this machine. A cutout is the fallback.
- `reelkit assets upload ./me.mp4 --cutout --describe "what it shows"` sends the video to the Reelkit server, where a GPU model separates the subject, and writes a transparent `.webm` (sound kept) beside the original; the command prints its `urls[...]` path. It takes about a minute. If it times out, the command prints the line that continues it (`--resume <id>`); that neither uploads nor charges again.
- The video leaves the user's machine, so ask the user before cutting out their footage.
- At most 20 seconds of video per cutout, counted in whole seconds against a monthly quota; `reelkit whoami` shows what is left.
- Use the result exactly like a keyed clip: `KeyedClip` with the `.webm`, and the Layers section below applies.
- Edges are best when the subject is well lit and clearly different from the background. Hair and fast motion can shimmer: check both preview frames.
- A generated clip can be cut out in one step: `reelkit assets gen clip --scene <sceneId> --cutout` makes the clip as usual, then cuts it out and records it as `s.clipKeyedKey`. If only the cutout fails, run the same command again: it does the cutout without paying for a new clip.

## Layers
A keyed clip is what makes real depth possible: things can sit behind the subject as well as in front. Build every such scene bottom to top, in this order, and keep to it:

1. **Background**: a mesh, a picture, the user's screenshot, a clip.
2. **Behind the subject**: the big title, a chart, a logo. The subject will cover part of it, which is the point: a headline that a person stands in front of reads as being in the room.
3. **The subject**: the keyed clip.
4. **In front of the subject**: small labels, a lower third, a callout pointing at what the subject holds.
5. **Captions**, always last.

- Text behind the subject must stay readable with part of it hidden: make it large, keep it to one to three words, and place it so the subject covers the middle or one end, never the first letters of a word.
- Give the subject a soft contact shadow or a slightly darker patch on the background where it stands, or it floats.
- Light direction should agree: if the clip is lit from the left, put the brighter side of the background on the left.
- Keep the subject's size steady across the scene. Move the layers around it, a slow push on the background and a smaller one on the subject, to get depth.
- Check both preview frames for a green fringe on the edges and for the subject hiding something that must be read.

```tsx
import { AbsoluteFill } from "reelkit/frame";
import { BgMesh, Captions, KeyedClip, SceneFrame, fonts } from "reelkit/kit";

<SceneFrame from={s.startFrame} durationInFrames={s.durationFrames}>
  <BgMesh bg="#101014" hero="#C6F135" />
  <AbsoluteFill style={{ alignItems: "center", paddingTop: "18%", fontFamily: fonts.display, fontWeight: 900, fontSize: 260, color: "#ffffff" }}>LAUNCH</AbsoluteFill>
  {s.clipKeyedKey ? <KeyedClip src={urls[s.clipKeyedKey]} x={0.5} y={1} scale={0.85} /> : null}
  <Captions words={s.words} />
</SceneFrame>
```

## Rules
- Search before generating, and generate once per scene. Do not regenerate to chase small improvements.
- `--share` only for a generic clip with nothing specific to this user; the user's own files stay private.
- Never claim a clip shows something it does not: look at the frames.
