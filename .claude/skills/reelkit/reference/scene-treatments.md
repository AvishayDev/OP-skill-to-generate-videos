---
name: scene-treatments
description: Use when choosing each scene's visual treatment and writing image prompts, shareable flags and direction notes.
---

# Choosing scene treatments

## The four treatments
- **motion-graphic** - animated text, numbers, shapes and icons drawn in code. The default. Best for hooks, lists, statistics, steps and calls to action.
- **illustration** - one generated picture behind the text. Use when a concrete image carries the point better than type (an object, a place, a mood). Plan a picture or a clip for a third to half of the scenes, the opening first: a video of only text and shapes reads as a slideshow. Search the library before generating, since a reused picture costs nothing.
- **clip** - a few seconds of generated or reused video as the scene's picture (B-roll), or a green-screen subject over your own graphics. Needs a `clipPrompt`. Rare and costly: see `reference/clips.md` before using it.
- **footage-overlay** - text and graphics over the user's own video. Required for every scene when footage was supplied, and never used otherwise.

## Image prompts (illustration scenes only)
- Describe subject, setting, style and mood in one or two sentences. Keep one consistent style across the video: with two or more illustration scenes, write the style contract of `reference/image-sets.md` first and repeat it word for word in every prompt.
- Never ask for text, letters, logos or UI inside the picture.
- Leave clear space where on-screen text will sit.
- Before writing a new prompt, run `reelkit assets search "<description>" --kind image`: if a suitable shared image exists, word the prompt to match it so you can reuse it.

## shareable and imageTags
- shareable is true only when the picture is generic stock-style imagery any other video could use. Write shareable prompts in generic terms.
- shareable is false when the prompt depends on the user's brand, product, name, place or uploads, and whenever imagePrompt is null.
- imageTags: 3 to 6 short lowercase tags (subject, style, mood). Empty when imagePrompt is null.

## An image scene is built in layers

A picture with words on it is built in layers, not as a flat picture with a caption somewhere over it: the picture at the back, the words in the middle, and the subject of the picture in front when it has one. Then the headline can pass behind the person or the object, and everything drifts a little at its own rate.

- Put the words in the picture's calm zone with `TextOnImage` inside `ImageLayers`. Never on a flat card beside the picture and never over its busiest part. The calm zone, how light it is and how busy it is are measured on this machine for free whenever a picture is registered (generated, pulled or uploaded) and are in the manifest scene as `imageLayers.textZone`.
- For the one or two hero pictures that carry the film, run `reelkit assets layers --scene <id>` (or add `--layers` to `assets gen image` or `assets pull --scene`). It cuts the subject out as `<name>.subject.png` and puts it in `imageLayers`. It sends the picture to the server as a one-second video and uses about one second of the monthly cutout quota, so it is not for every picture. A picture with no clear subject (the cut-out covers under 3 percent or over 85 percent) stays flat and the command still succeeds: the words still go in its calm zone.
- When the scene has on-screen text, the image prompt gets one fixed sentence appended for you: one clear subject, with calm empty space on one side where words can sit. Write prompts that ask for a single subject too.

```tsx
<SceneFrame from={s.startFrame} durationInFrames={s.durationFrames}>
  <ImageLayers layers={s.imageLayers} back={urls[s.imageKey!]}>
    <TextOnImage layers={s.imageLayers}>
      <Headline text="Take a breath" keyword="breath" emphasis="highlight" hero={palette.hero} />
    </TextOnImage>
  </ImageLayers>
</SceneFrame>
```

`ImageLayers` works without a subject layer (one flat picture with the words over it), `behindSubject` on `TextOnImage` is chosen for you, and `reelkit check` says "the text is not a layer of the picture" when a scene has an image and words and the composition uses neither component.

## User assets
- Only reference assets listed in `assets/index.json`, by id, in userAssetIds.
- Put a logo in the first or last scene. Put a screenshot in the scene that talks about what it shows.

## One idea, one look
- One idea per scene, and one visual per idea. If a scene needs two visuals, it is two scenes.
- Describe the real object the narration is about (the phone, the receipt, the glass, the chart), not an abstract shape.
- Plan a visual thread that runs through every scene, and say what it is in the first scene's notes.

## Notes for the composition
- One or two sentences per scene: layout, what animates, emphasis, colour mood.
- Name library components found with `reelkit assets search "<description>" --kind component` when one fits.
