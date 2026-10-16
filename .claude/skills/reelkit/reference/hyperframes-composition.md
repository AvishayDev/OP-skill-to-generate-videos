---
name: hyperframes-composition
description: Use when writing Video.tsx - the file rules, timing model and media rules every composition must follow.
---

# Writing the composition

Reelkit uses HyperFrames with a seekable React adapter. Author TSX in `src/Video.tsx`; `reelkit/frame` supplies the frame clock, sequences, media, and animation math. The generated HTML exposes HyperFrames' seek protocol for capture and rendering.

## Files
- `Video.tsx` is required and must contain `export const Video: React.FC<VideoProps> = ({ manifest, urls }) => ...`.
- Extra component files are flat siblings, PascalCase, one component per file: `NumberBadge.tsx` exports `NumberBadge`. Import them in Video.tsx as `./NumberBadge`.
- Video.tsx may import only `react`, `reelkit/frame`, `reelkit/kit` and sibling components. No other packages, no network, no file access, no `process`.

## What the composition receives
`Video` gets two props, `{ manifest, urls }` (type `VideoProps`, exported by `reelkit/kit`). `manifest` is the content of `manifest.json` in the project, rewritten by `reelkit assets voiceover`, `check`, `preview` and `render` from `plan.json` and the recorded voiceovers. It is not hand-edited. `urls` is separate: it is built at render time and is not in `manifest.json`.

`manifest`:
- `fps`: frames per second (30).
- `width`, `height`: pixels. 1080x1920 for 9:16, 1920x1080 for 16:9, 1080x1080 for 1:1; in footage mode the footage's own size, scaled down to at most 1920 on its long side.
- `totalFrames`: the length of the video in frames. Seconds are `totalFrames / fps`.
- `footageKey`: only in footage mode, the project path of the footage; look it up as `urls[manifest.footageKey]`.
- `scenes`: one entry per plan scene, in plan order, laid end to end.

Each `scenes` entry:
- `id`: the scene id from `plan.json`.
- `startFrame`, `durationFrames`: frames on the whole video's timeline. A scene lasts until its last word has ended plus the plan's `gap` (0.3 s by default; the next scene's voice starts on the scene's first frame), rounded up to a whole frame; the last scene keeps 0.7 s. A change may move up to 4 frames to reach a beat.
- `voiceoverKey`: the project path of the narration audio.
- `words`: one entry per spoken word, `{ word, startSec, endSec }`, in seconds from the start of that scene (not of the video, and not frames). Do not convert them yourself: `wordFrame(s, "word")` and `onWord(s, "word")` give the frame inside the scene (reference/voice-sync.md); `<Captions words={s.words} />` takes them as they are.
- `imageKey`: only on an illustration scene that has its image; the project path of the image.
- `userAssetKeys`: project paths of the user's own files that the plan assigned to this scene (an empty array when none).

`urls` maps a project path (every file under `assets/`, except `.json` files) to the address HyperFrames can load it from. Pass paths from the manifest, or one you pulled, such as `urls["assets/lib/<id>/clip.mp3"]`; never build an address yourself.

```json
{
  "fps": 30, "width": 1080, "height": 1920, "totalFrames": 150,
  "scenes": [
    { "id": "a", "startFrame": 0, "durationFrames": 75, "voiceoverKey": "assets/vo-a.mp3",
      "words": [{ "word": "Hello", "startSec": 0, "endSec": 0.4 }, { "word": "there", "startSec": 0.4, "endSec": 0.9 }],
      "userAssetKeys": [] },
    { "id": "b", "startFrame": 75, "durationFrames": 75, "voiceoverKey": "assets/vo-b.mp3", "words": [], "userAssetKeys": [] }
  ]
}
```

## Timing
- All timing comes from the manifest. Each scene has `startFrame` and `durationFrames`; wrap each scene's content in `<SceneFrame from={s.startFrame} durationInFrames={s.durationFrames}>`.
- Inside a SceneFrame, `useCurrentFrame()` starts at 0 for that scene.
- Never hard-code a duration that the manifest already gives. Look scenes up by id when a scene needs bespoke content.

## Media
- Reference media only as `urls[path]`, where `path` is the file's project path, using the paths in the manifest: `s.voiceoverKey`, `s.imageKey`, `s.clipKey`, `s.clipKeyedKey`, `s.userAssetKeys`, `manifest.footageKey`. Never hard-code a URL.
- A scene with narration has `s.voiceoverKey`: give it exactly one `<Voiceover src={urls[s.voiceoverKey]} />` inside its SceneFrame, and `<Captions words={s.words} />` unless the notes say otherwise. In a plan with `voice: "none"` no scene has a `voiceoverKey` and `s.words` is empty, so render no `<Voiceover>` and no `<Captions>` (`manifest.captions` is `"none"`); keep the guard `s.voiceoverKey ? ... : null` so the same code works either way.
- Footage mode (`manifest.footageKey` is set): one `<FootageLayer>` at the bottom, outside the scenes.
- User images: `<Img src={urls[key]} />` from reelkit/frame.
- Write a media path as one plain string, so that `reelkit check` can verify the file exists. A path built with a template string or by joining parts (`` `assets/lib/${id}/hit.mp3` ``) cannot be checked and is reported as missing. Write `"assets/lib/sfx-ab12/hit.mp3"` in full, or read the key from the manifest.

## Layer stack (every video, bottom to top)
1. Background: a chosen field, picture, `<BgMesh>` or `<FootageLayer>` in footage mode. A flat colour is valid when it serves the design.
2. Images: `<KenBurnsImage>` when a camera move helps, or a stable image for reading and comparison. Keep important details in frame.
3. Clips: `<ClipLayer>` inside its scene (a clip scene's picture); a green-screen `<KeyedClip>` above the scene's background and below its type and captions. See `reference/clips.md`.
4. Graphics and type, inside each scene's SceneFrame.
5. Anything that must survive a scene change: a `<Carry>` layer beside the scenes and above them (outside the SceneFrame fades), and `<Camera>` around the scenes when one camera moves through all of them. See `reference/continuity.md`.
6. `<Grade>`, then `<Grain>`, then `<Vignette>`, once, at the very top of the video outside the scenes. In footage mode skip Grade.

## Shared overlays (optional)
- The library has ready-made overlay clips (`reelkit assets search "<description>" --kind overlay`): film marks, HUD frames, corner marks. They are white on black and are laid over the video with `<ScreenOverlay>`.
- Most videos need none. Use one only when the topic or look calls for it (film, tech, editorial), on a dark theme, at low opacity (0.3 to 0.6).
- At most one overlay per video, placed above the scenes and below Grade, kept clear of captions and headlines.
- Only use kind "frame". Kind "badge" overlays are labels and ratings (4K, HDR, age ratings, "Coming Soon", "Directed by"): they make a claim about the video, so use one only if the narration literally says it.
- Run `reelkit assets pull <id>` before referencing an overlay. It lands in `assets/lib/<id>/`; reference it as `urls["assets/lib/<id>/<file>"]`, and read its duration from `assets/library.json`.

## Animation rules
- Choose easing or a spring to fit the move; linear interpolation is valid for steady motion. Clamp finite interpolation ranges with `extrapolateLeft: "clamp"` and `extrapolateRight: "clamp"` so elements do not drift beyond their intended pose.
- **Entrances move two or three properties together** (opacity, position, scale). Wrap content in `<Entrance>` rather than fading alone.
- Stagger related items when that improves hierarchy; simultaneous motion is valid for one coordinated action. Spoken words follow their real timestamps rather than a fixed stagger.
- **Exits exist and are faster than entrances** (about 10 frames against 20). Use `<Entrance exitAt={...}>` or the SceneFrame fade.
- **A missing clamp shows elements before their entrance or after their exit.** Check for it.
- Derive timing from `fps` in `useVideoConfig()`, not bare frame counts, when you express a duration in seconds.

## Theme
- Declare one palette object at the top of Video.tsx (a kit `palettes` entry or your own `Palette`) and take every colour from it. No stray hex values inside components; components receive colours as props.
- Use `fonts.display` at weight 600 to 800 for headlines and numbers and `fonts.body` for supporting text.
- Use pixel values, not `em`, for gaps and margins around large type: `em` resolves against the parent's font size and collapses next to big text.
- No emoji as icons. They ignore the palette. For a platform logo use the kit's `<Icon name="instagram" ... />`; never draw a logo yourself or stand a letter in for it. For anything else draw a simple glyph with SVG in palette colours, or use one of the Icon glyphs.

## Content
- The plan is not available at render time. Bake each scene's on-screen text and direction into the code.
- Size everything relative to `useVideoConfig()` width and height, never fixed pixels, so it works at any aspect.

## Workflow
1. `reelkit assets search "<description>" --kind component`, and `reelkit assets pull <id>` for any you plan to use (it lands in `src/`).
2. Write each new component in `src/`, then `src/Video.tsx`.
3. `reelkit check`. Fix every error it reports and check again until it passes.

## Revising a shot in HyperFrames

Every pose must be computable from the current frame, including a direct seek to the landing or held state. Use `reelkit/frame` timing helpers; avoid CSS animations, wall-clock timers, and state accumulated by previous frames. Derive sound from the same event frames as the visual. Inside a `SceneFrame` timing is local; outside it add `startFrame` once. For a branded arrival use `BrandTransform3D` and `brandTransformFrames` (`reference/brand-motion.md`). Preview early, middle and held states after retiming, and listen to the rendered file after changing sound.
