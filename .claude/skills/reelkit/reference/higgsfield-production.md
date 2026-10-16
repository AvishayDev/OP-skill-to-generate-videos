---
name: higgsfield-production
description: Choose optional Higgsfield cutout, Blender, hosted 3D or native motion workflows and hand their inspected output to a Reelkit composition.
---

# External media and motion production

Read this when a shot needs a clean cutout, an editable product model, custom lighting, character rigging or compositing beyond the Reelkit kit. Use the smallest workflow that serves the shot. A skill teaches a workflow; loading one does not establish an editor connection or add a CLI capability.

## Choose by the deliverable

| Need | Candidate | What comes back |
|---|---|---|
| Put a supplied product photo over graphics | Higgsfield Background Remover | A transparent PNG; inspect the edges and original identity |
| Put a moving subject over graphics | Reelkit green key or video cutout, `reference/clips.md` | A keyed WebM; check the matte over time |
| Show how a product comes apart and assembles | Higgsfield `/exploded-view` in local Blender | Editable parts, camera and animation; requires the local Blender connection |
| Establish a stylized 3D look | `/cartoon-shaders` in local Blender | Editable materials; verify them from the delivery camera |
| Build a new set, prop layout or camera blockout | Hosted `/3d-jutsu` | A separate revisioned scene with render, `.blend` and GLB export paths |
| Compose supplied footage into a VFX shot | `/shot-composer` in local After Effects | An editable AE project; requires the AE connection |
| Coordinate editable logo, type and graphic motion | `/motion-bundle`, `/logo-animation`, `/kinetic-typography` | Local After Effects workflows; resolve the selected command's current instructions |
| Author native Higgsedit motion | Installed `motion-craft` and `video-editing` skills | Native composition tracks and keyframes, rather than Reelkit TSX |

Higgsfield's connected preset-instructions lookup resolves these commands without running them. Read the exact selected workflow and its required references before editing. Check available tools and runtime versions; a web feature, command listing or model recommendation is not evidence that its tool is connected. Background Remover exists on the website, but this research did not find a dedicated Higgsfield background-removal tool in the current connector. Preserve that distinction when reporting availability.

## Three different Blender connections

- **Local background MCP:** `/use-blender` starts its own Blender session. It can open saved local `.blend` files; it does not attach to unsaved work in an open window. Verify with the workflow's health and scene-summary tools, render appearance checks, and explicitly save the source.
- **Desktop add-on and Bridge:** the official add-on operates in the open scene and provides scene building, 3D models, character animation, image/video and camera tools. Its published requirement is Blender 5.1 or later. Check the current requirement before setup. The separate Bridge connects an agent to this add-on.
- **Hosted 3D Jutsu:** no local installation; edits use service-side Blender Python. The current instructions allow curated asset imports, not arbitrary user model or texture files. Recheck those restrictions before selecting it for a supplied product. A local project cannot silently become a hosted one.

An account connection, editor installation and generated asset are separate steps. Use existing authorization and working connections. A documentation search does not authorize a new editor setup or a paid generation.

## Cutout quality

Keep the original alongside the processed output. A transparent PNG proves image isolation, not video matting or recovered hidden geometry. Inspect hair, fingers, handles, thin straps, glass, holes and the product outline against light and dark backgrounds at delivery scale. Check brand lettering against the source. Add a contact shadow and agree on light direction when placing the subject in a new setting.

For a moving subject inspect opening, fastest motion, overlap, landing and ending for edge shimmer, missing parts and spill. Verify transparency in the actual Reelkit preview; an ordinary H.264 MP4 does not carry an alpha channel. Follow `reference/clips.md` for the supported keyed-media path. Do not promise a lossless subject merely because a provider advertises pixel-perfect removal.

## Editable 3D and handoff

Start from the delivery camera, subject silhouette, real dimensions and a simple motivated light rig. Keep named parts and materials editable. For assembly, move semantic parts along plausible paths and verify contact, intersections, camera clearance and the final assembled pose. For materials, inspect roughness, highlight continuity and silhouette under the actual shot lighting before adding surface detail.

Hosted 3D has bounded execution time: keyframe first, prove critical states with low-cost stills, then render the requested motion. A generated video from one scene render is a new AI interpretation; it is not proof of the keyed Blender animation. Preserve exact geometry, logos and mechanics through an authored render when those are the point.

Retain `.blend` or `.aep` as editable source. GLB may omit procedural materials and lighting. Reelkit's composition allowlist does not provide a general GLB or Lottie loader: use supported local image/video output, or explicitly implement and validate a new kit capability. Check dimensions, fps, duration, alpha, color and source audio before ingesting the inspected file as a user asset. Register it with a truthful description; choose the supported image, clip or footage layer and use `urls[path]` inside the composition.

## Additional motion skills

Prefer the official HyperFrames domain skills as sources:

- `hyperframes-animation`: choreography, transitions, runtime adapters and scene recipes.
- `hyperframes-keyframes`: visible poses, subject continuity, masks, camera moves and motion diagnostics.
- `hyperframes-creative`: brand tokens, typography, visual hierarchy and beat planning.
- `hyperframes-audio`: mixing placed tracks, envelopes and speech/music relationships.
- `media-use`: sourcing, reuse and media operations, with provider-specific setup.

Their native authoring surface is HTML with registered seekable runtimes. This Reelkit version uses the adapter described in `reference/hyperframes-composition.md`: translate applicable craft into frame-driven kit code rather than pasting GSAP, shader, bus or media attributes into `Video.tsx`. Preserve the pinned engine and import allowlist. Installing every external workflow would not make its APIs available in Reelkit.

Review rest, peak, landing, readable hold and final frames. Keep one subject continuous when it moves between layouts; use a dissolve for replacement. Make the visual landing and sound cue share one event frame. Test a direct seek to important states and the loop seam when relevant; inspect rendered pixels, not only numeric keyframes. For source speech, derive music ducking from the actual speech spans, as explained in `reference/studio-editing.md`.

## Sources and freshness

Reviewed 2026-10-06. Re-resolve runtime-dependent workflows when using them.

- [Higgsfield skill hub](https://higgsfield.ai/skills)
- [Background Remover: supported image input and transparent PNG output](https://higgsfield.ai/apps/image-background-remover)
- [Blender add-on, version requirements and Bridge](https://higgsfield.ai/plugins/blender)
- [Official HyperFrames skills](https://github.com/heygen-com/hyperframes/tree/main/skills)

The connected Higgsfield instructions for `/use-blender`, `/exploded-view`, `/cartoon-shaders`, `/shot-composer`, `/motion-bundle` and `/3d-jutsu` supply the editor-specific rules. Keep those live lookups authoritative instead of copying a full manual into this reference.
