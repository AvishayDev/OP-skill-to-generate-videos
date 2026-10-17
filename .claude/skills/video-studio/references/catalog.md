# Skill catalog

Built in (always here): **reelkit** and **animate-in-code** in `.claude/skills/`. Library packs live in
`library/<pack>/` (`library/fetch.sh <pack>` fetches one at its pinned commit; `library/sources.json` lists
repo, commit, licence). Read the skill's SKILL.md before using it. Library skills render to a clip
(`clip` shot) or teach a technique you rebuild in a reelkit/canvas shot. Their own "make the whole video"
flows are *not* used end to end — this studio keeps the voice, captions, music, SFX and the final render.

## Built in
| Skill | Best for |
|---|---|
| `reelkit` | React motion graphics + the final render. Kit: Headline, WordReveal, CounterRoll, BarChart, TrendLine, DonutStat, CompareTable, FlowDiagram, ChatStack, CopyCorrection, Callout, PromptBox, TerminalLog, BrowserFrame, NamedCursor, HudOverlay, ShaderLayer (aurora, liquid metal, grain, halftone), 3D; references: styles, art-styles, motion-design, beat-sync, brand-motion, explain-graphics, launch-film, keynote-film, sound-design, hebrew-rtl. Studio kit (`pipeline/render/reelkit/`): Pop, At, BigText, Tag, SelectBox, Photo, Stamp, Bubble, Card, Window, Phone, Toggle, TypeField, CountUp, Progress, TickGrid, Doodle, Bot. |
| `animate-in-code` | Canvas 2D hand-made films: brush strokes, zine collage, 8-bit pixel art, risograph, chalkboard, pencil sketchbook, paper stickers, sand animation, cross-stitch; doodles over a real photo or video. |

## capcut-studio: `library/capcut-studio/SKILL.md` (shared with the user by its author; lives in this repo, no upstream)
A pro editor's playbook for Reels/TikTok, written for CapCut desktop. Here it is **knowledge only**: footage mode
(`references/footage.md`) does its CapCut steps in code. Worth reading for: reading a video by type (§1b),
word-synced captions, punch-ins, B-roll and split-screen inserts (§4, §7), phone-speaker music rules and a search
table by video type (§5a–5b), SFX palette (§5c), RTL motion-graphics pitfalls and safe zones (§5), 10 reference
styles (§6: morphing UI, kinetic type, particle word, 3D cube world, text rings, doodle character,
children's-book explainer, neon branches, blueprint-to-3D, mixed-media narration), and the checks before export
(§10). Ignore its CapCut UI/JSON/export steps, its computer-use notes, and its "one check-in" rule (our modes
decide).

## hyperframes — `library/hyperframes/` (Apache-2.0, HeyGen)
HTML + GSAP compositions rendered with `npx hyperframes render` (needs Node + Chrome; downloads its engine).
| Skill | Use for |
|---|---|
| `hyperframes`, `hyperframes-core`, `hyperframes-cli` | the composition contract (data-* timing, tracks, deterministic render) and the CLI loop (init, lint, snapshot, render) |
| `hyperframes-animation` | atomic motion rules, scene blueprints, transitions, **24 named text effects**, runtimes: GSAP, Lottie, Three.js, Anime.js, CSS, WAAPI, TypeGPU |
| `hyperframes-keyframes` | punch-ins, Ken Burns, camera moves, whip/match handoffs, 2D/3D keyframes |
| `hyperframes-registry` | **~400 ready blocks**: CRT, glitch, chromatic aberration, film grain, shimmer, charts, code/terminal windows, maps, confetti, 3D titles (glass-shard, wireframe portal, cuboid carousel, orbit card…) — search before hand-building any named effect |
| `hyperframes-creative` | design specs, palettes, typography, beat planning, audio-reactive visuals |
| `hyperframes-audio` | fades, ducking, voice carve, track gain |
| `motion-graphics` | short design-led pieces: kinetic type, stat count-up, chart hit, logo sting, lower third, animated map |
| `music-to-video` | beat-synced lyric video / slideshow / kinetic promo driven by a track |
| `faceless-explainer`, `general-video`, `slideshow`, `product-launch-video`, `pr-to-video` | whole-video flows — borrow their scene ideas |
| `embedded-captions`, `talking-head-recut` | captions behind a subject, graphic overlays on talking-head footage |
| `media-use`, `figma`, `remotion-to-hyperframes` | media resolving (needs HeyGen CLI), Figma import, porting |
| `motion-doctrine`, `seam-craft`, `cut-the-curve`, `captions-overlay`, `oversized-cursor` | the HyperFrames team's own craft notes: motion principles, seamless transitions, easing curves, caption overlays, cursor demos |

## remotion — `library/remotion/` (Remotion licence: free for individuals / small teams)
React video framework (`npx create-video`, `npx remotion render`). `remotion-best-practices` (router),
`remotion-create`, `remotion-markup` (animation + effects), `remotion-captions`, `remotion-maps` (map
animations), `remotion-multimedia`, `remotion-render`, `remotion-studio`, `remotion-interactivity`, `remotion-docs`.
Use for a shot that needs a Remotion-only package (maps, @remotion/three, transitions) — reelkit covers most.

## manim — `library/manim/` (MIT)
`manim-composer` (plan a 3b1b-style explainer), `manimce-best-practices` (Manim Community: `pip install --user
manim`, needs Cairo/Pango; `manim -qh --fps 30 -r 1080,1920 scene.py Name`), `manimgl-best-practices`.
Best for equations, geometry, graphs, physics, algorithms.

## motion-graphics — `library/motion-graphics/` (MIT, Charlie Hills)
`motion-effects` (**16 premium effects**: button→player, search→results, card→workspace, tabs→panels, chart
morph, dashboard zoom, spring stack, magnetic dock, masked type, elastic type, text→layout, image reveal,
perspective shift, glass focus, flowing paths, particle logo), `animated-chart`, `milestone-reveal` (particles
form a number), `title-sequence-3d` (Three.js neon street), `apple-launch-film`, `launch-video`, `vox-explainer`
(torn paper, halftone), `loop-cover`, `newsletter-promo`, `model-showdown`, `reference-to-motion`,
`motion-brief-writer`, `motion-prompt-writer`, `brand-intake`, `reel-export` (platform-safe export).
Each builds an HTML file with `window.seek(t)` → render frame-exact to a clip.

## iart packs — `library/iart-*/` (MIT, iart.ai)
| Pack | Skills |
|---|---|
| `iart-tiktok` | `short-form-video` (hooks, retention, pattern interrupts, loops), `caption-animation` (karaoke / word-by-word / TikTok styles), `lower-thirds`, `countdown-video` |
| `iart-explainer` | `explainer-video`, `whiteboard-animation` (VideoScribe draw-on), `isometric-animation` (2.5D, exploded stacks), `diagram-animation`, `wrapped-video` (Spotify-Wrapped recap) |
| `iart-data` | `chart-animation` (bar-chart race, CSV → video, counters), `animated-infographic`, `presentation-video` |
| `iart-ads` | `ad-creative-video` (UGC/performance ads, A/B variants), `launch-video` (hype/teaser/trailer), `testimonial-video` |
| `iart-type` | `kinetic-typography` (split-text, stagger, lyric video, variable-font weight, beat-synced) |
| `iart-youtube` | `youtube-intro-outro` (stings, end screens), `audiogram` (podcast waveform video) |

## barty — `library/barty/` (MIT)
`sound-effects` (**a measured sound pass**: cue list, the music's beat grid vs. kick drums, cuts on beats, SFX
levels), `motion-broll` (one morphing shape timed to a talking head's words), `explainer-default` /
`explainer-engaging` / `explainer-high-energy` (three energies of product explainer), `object-separation` (SAM 2
subject cut-out from video, local).

## toolkit — `library/toolkit/` (MIT, Digital Samba)
`ffmpeg` (conversion, resize, compress, speed, GIF, concat recipes), `moviepy` (text over video, compositing),
`elevenlabs` (voice, SFX and music generation — needs `ELEVENLABS_API_KEY`, paid: ask first), `acestep` (ACE-Step
music generation on a GPU), `playwright-recording` (record a real website as footage).

## Style libraries
| Pack | What | Notes |
|---|---|---|
| `anidoodle` (Apache-2.0) | code-drawn films, loops, explainers, drawing timelapses in **32 styles** with composed scores; character consistency; teach-drawing | its `references/styles.md` lists the styles |
| `lemo-opuscar` (MIT) | **43+ film styles**: impasto, watercolor, ink wash, ukiyo-e, stained glass, engraving, silent film, cel-anime-80s, rubber-hose, midcentury-toon, scifi-toon, pixel-rpg, hd-2d, lowpoly-island, brick-toy, paper-popup, papercut-red, shadow-puppet, paper-lantern, crayon-book, urban-sketch, one-line, art-deco, swiss-motion, silkscreen-poster, risograph, halftone-dossier, spy-titles, game-show, dark-keynote, glass-product, hologram-hud, ascii-crt, backrooms, blueprint, teardown, iso-infographic, dataviz, data-physical, pictogram-motion, satellite-briefing, lidar-survey, microscope, archive-lighttable, tilt-shift, briefing-board, living-screencast, microgame | each style has a `styles/<slug>/STYLE.md`; tools need `npm i` + Python inside its folder |
| `opus-video` (MIT) | `kinetic-reel` (bold condensed type, HUD micro-type, three.js), `painted-animation` (p5.brush watercolour-and-ink cartoons) | |
| `lottie` (MIT) | `text-to-lottie`: Lottie JSON for logos, type, icons, loaders, lower thirds, charts | render with its Skia player or the HyperFrames Lottie adapter |
| `explainroo` (MIT) | explainers with a local Kokoro voice (no key) and a canvas renderer | an offline voice alternative |
| `vox-director` (MIT) | Vox paper-collage explainers | needs an Atlas Cloud key (paid AI keyframes) — ask first |

## Not included
- `calesthio/OpenMontage` — AGPL-3.0 (would change this repo's licence); clone it separately if wanted.
- `vibe-motion/skills` — no licence (all rights reserved).
