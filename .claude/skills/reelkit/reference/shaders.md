---
name: shaders
description: Use when a shot wants a GPU-drawn ground, light, texture, stylize pass or wipe - an aurora, a mesh gradient, film grain, glass, halftone, a glitch - through the kit's ShaderLayer and the open-source `shaders` library.
---

# Shader layers

`ShaderLayer` draws layers of the `shaders` library (https://github.com/shader-effects-inc/shaders, MIT) on the GPU, one film frame at a time. It is for the things CSS and SVG do badly: light that moves like light, real grain, glass, noise fields, optical blur, a wipe with texture.

## Decide first whether the shot needs one
- A flat colour, a soft CSS gradient, or the kit's `BgMesh` and `GlowBackdrop` are cheaper and render everywhere. Use them when they are enough.
- A shader earns its place when the ground is the look of the film (an aurora behind a title, liquid metal behind a logo), when a stylize pass ties the whole frame together (grain, halftone, VHS), or when a scene change is the event.
- One shader idea per film. A second, unrelated one reads as a different film.
- Text and interface stay in ordinary elements over the layer. Do not put anything a viewer must read inside a shader.

## Using it
```tsx
import { ShaderLayer } from "reelkit/kit";

// A moving ground under the scene's content, with grain over the ground.
<ShaderLayer layers={[{ type: "Aurora" }, { type: "FilmGrain" }]} />

// A softer, cheaper ground: half the pixels, half the speed.
<ShaderLayer layers={[{ type: "MeshGradient" }]} resolution={0.5} speed={0.5} />
```
- `layers` is the library's own component tree as data: each entry is `{ type, props?, children? }`, drawn bottom first. A layer that works on what is under it (a blur, a distortion, a stylize pass) comes after the layers it changes, or takes them as `children`.
- `speed` is the shader's clock against the film's (1 is real time, 0 holds it still). `delay` is in frames. `resolution` is the share of the frame's pixels that is drawn, from 0.25 to 1.
- It fills its parent. Place it inside a `SceneFrame` for one scene, or once at the top of the film for a ground that never cuts.
- Props may change from frame to frame (a colour that follows the beat): pass new values and the layer updates. Changing which layers there are starts the shader again from its first frame, so keep the list of types the same through a shot.

## Choosing layers
The names are the library's. The full list with one line each is at https://shaders.com/llms.txt, and a component's exact props, defaults and ranges are on its page at https://shaders.com/docs/components. Read the page before setting a prop: a wrong name is ignored without an error.

| The shot wants | Reach for |
|---|---|
| A ground that breathes | Aurora, MeshGradient, FlowingGradient, Plasma, Satin, StudioBackground |
| A plain ground with direction | LinearGradient, RadialGradient, ConicGradient, MultiPointGradient |
| Texture and pattern | DotGrid, Grid, HexGrid, Stripes, Voronoi, Truchet, PerlinNoise, FractalNoise |
| Light | Godrays, Beam, LensFlare, LightLeak, Glow, SunBurst |
| Material behind a logo or a shape | LiquidMetal, Chrome, Glass, Holographic, ThinFilm, Neon |
| One finish over everything | FilmGrain, Vignette, Halftone, Dither, CRTScreen, VHS, ChromaticAberration, Paper |
| Softness and depth | Blur, ProgressiveBlur, TiltShift, BokehBlur, ZoomBlur |
| A bend in the picture | WaveDistortion, Bulge, Twirl, Kaleidoscope, FlutedGlass, GlassTiles |

Leave these out of a film: everything the library lists as Interactive and the cursor effects (they follow a pointer, and a film has none), `WebcamTexture`, `VideoTexture` and `HTMLInCanvas`. For footage or a picture under a shader, draw the footage with the kit and lay the stylize layer over it.

## What it costs and where it fails
- The shader engine is not installed with Reelkit. The first `reelkit check`, `preview` or `render` of a project that uses `ShaderLayer` downloads it once (about 30 MB) and says so. It needs a connection that one time.
- It needs WebGPU in the rendering browser. Chrome on a Mac has it. Where it is missing the layer draws nothing and the rest of the film renders, so always put a plain background colour behind a `ShaderLayer`, and look at the preview frames: an empty ground there means no WebGPU on this machine.
- The engine only runs forward. A preview frame late in a long layer replays the shader from its start to get there, so previews of long shader shots are slower than the render, which goes in order. Keep a shader shot to the scene it belongs to instead of one layer for a whole long film when previews get slow.
- Full-frame layers at 1080x1920 are heavy. Blurred or soft grounds look the same at `resolution={0.5}`.
- Two renders of the same film give the same frames. Effects that build on their own last frame (smoke, fluids, trails) are replayed step by step for that reason; they are the slowest to preview.

## Checks before delivery
- The preview's early and late frame of each shader scene both show the ground, and they differ (it is moving).
- The first frame after each scene change shows the new scene's ground, not an empty one.
- Text over the layer passes the same contrast and size checks as on a flat ground; grain and light move under it without touching its edges.
