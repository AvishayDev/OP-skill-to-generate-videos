# Style pack · 9 styles, one 8-second story

Same story, same timing, same sound cues. Only the LOOK, the MOTION TEXTURE and the VOICE of the sound change.
The pack proves one thing: pure JavaScript + Canvas 2D + WebAudio can produce very different films. No libraries, no images, no samples, no AI generation.

## The story (all films)
A little round creature (פיצי) wants a star that hangs on a string. It jumps, misses, falls (SPLAT). A block labelled "נפילה 1" drops beside it. It jumps higher, the star dodges, it falls again. Block "נפילה 2" lands on top of block 1. "!" - it sees that its failures form stairs. It climbs them, leaps, grabs the star, the star lights up. Title: **ממשיכים לקום.**

All timing and poses live in `story.js`. Read its header. Key API:
- `pose(t)` → `{phase, x, y (FEET), sx, sy, rot, sc, eyes, mouth, brow, look:[dx,dy], armL, armR (0=down, PI=up), legs, jig, dizzy, band}`
- `starState(t)` → `{visible, x, y, ang, pivot, lit, grabbed, dodge}` (star outer radius `STAR_R`=100)
- `blockState(i, t)` → `{visible, x (centre), top, bottom, w, h, rot, sq, landed, label:'נפילה', n:'1'|'2'}`
- `shake(t)`, `zoom(t)` (push-in about point [540,760]), `TITLE {t0, text, words, y}`, `IDEA {t0,t1}` (the "!" moment), `SPLATS`, `BLOCKS`, `HOPS`, `LEAP`, `GY` (ground line y=1580), `HX`, `BODY`, `CUES`, `CHORDS`.
- helpers: `clamp lerp prog eOut eIn eIO eBack rng(seed) TAU`

Poses are expressed as squash + expression on ONE body. Your style may re-interpret (pixel sprites per `phase`, stitches, sand silhouettes), but keep the beats and positions so films line up.

## The contract (every film)
- File: `NN_name.html` in this folder, same header as `07_sticker.html`:
  `fonts-data.js`, `story.js`, `audio.js`, `runtime.js`, then ONE inline script that calls `film({ setup, draw, voice, kit })`.
- Do NOT edit `story.js`, `audio.js`, `runtime.js`, `render.mjs` or other films. Shared bugs → report them, don't fix.
- All drawing code for the style lives inside your film file (copy helpers from `07_sticker.html` freely). No external libraries, no network, no image files. Procedural textures only.
- `draw(c, t, i)`: `c` is already scaled to world units 1080x1920. Must be deterministic and seekable (frame N rendered alone = same pixels). For simulations use fixed-step state with checkpoints/caching keyed by frame, and make sure a cold seek produces the same frame as sequential rendering.
- Performance: each frame < ~400 ms at 1080x1920. Pre-render static layers in `setup()` with `layer(g => ...)`.
- Frame 0 is the thumbnail: it must already show the world + star (not empty).
- Hebrew text: handwriting font `OHRonShemer`, clean sans `Heebo` (weights 100-900). Always `c.direction='rtl'`. OHRonShemer traps: ז reads as כ, double yod reads as quotes, final ץ reads as ל, digits are ambiguous (2 looks like ב). Put digits in Heebo. The title "ממשיכים לקום." must be clearly legible at phone size and hold on screen until 8.0 s.
- Sound: `voice: K => ({ groove, motif, ending, cues: {...}, setup })` re-voices the shared score (see `audio.js` `defaultVoice` + `audioKit` primitives: osc, noise, glock, pluck, bass, kick, hat, clap, pad, boing, slide, splat, thud, pop, swish, sparkle, duck). Give the style its OWN instruments and sfx that belong to its material (e.g. chalk squeaks, square-wave jumps). `kit` = `{reverb, musicGain, sfxGain, revSec}`. Every cue in `CUES` should make a sound in your voice.

## Workflow + QA (required)
1. `node render.mjs NN_name.html --grid 24` → read `out/NN_name-grid.jpg` with the Read tool. Look hard.
2. Spot-check at full size: `node render.mjs NN_name.html --only 0,45,100,160,190 --out /tmp/<something>` and Read the PNGs.
3. Fast actions: `--strip 40,12` (splat) and `--strip 140,12` (leap/grab).
4. Iterate at least 2 rounds on what you see: legibility, charm, silhouette clarity, the style actually reading as its medium (not "a flat vector with a filter").
5. Full render: `node render.mjs NN_name.html` → `out/NN_name-final.mp4` (192 frames, 8 s, with score). Verify with ffprobe.
6. Report: file path, what makes the style convincing (the 2-3 key techniques), known limitations, render time per frame. Keep it short.

## Quality bar
Cute, funny, readable in the first second. The medium must be unmistakable from a single still: someone scrolling Instagram should think "how is this code?". The character is lovable in every style (big eyes, blush, clear expressions). Splats are funny, not violent. The grab is a payoff: light, particles, motion.

## Styles
| # | file | medium | motion texture | voice |
|---|---|---|---|---|
| 01 | `01_brush.html` | thick painterly brush strokes (gouache/oil impasto, Loving-Vincent energy) | strokes re-painted on twos, flow-field sky | warm piano + soft strings pad + brushed snare |
| 02 | `02_collage.html` | editorial magazine/zine collage: newsprint, scissor-cut edges, B/W halftone, red accent, ransom letters | stop-motion on threes with paper jitter | lo-fi zine: detuned toy piano, tape hiss, scissor snips, paper rustle, typewriter |
| 03 | `03_pixel.html` | 8-bit pixel art on a low-res buffer, nearest-neighbour upscale, 16-colour palette | 12 fps, positions snapped to the pixel grid, sprite swaps per phase | chiptune: pulse lead, triangle bass, noise drums, classic jump/coin/bump sfx |
| 04 | `04_riso.html` | risograph print: 2-3 fluorescent inks as separate plates, multiply overprint, misregistration, grain | plates jitter slightly per frame | lo-fi hip-hop: dusty keys, vinyl crackle, soft boom-bap |
| 05 | `05_chalk.html` | chalk on a blackboard: dusty broken strokes, eraser ghosts, coloured chalk | redrawn chalk boil; moving things leave faint smears | classroom: nylon guitar picking, claps, chalk squeaks, book-slam thud |
| 06 | `06_sketchbook.html` | graphite pencil in a sketchbook: blue construction lines under graphite, hatching, eraser marks, spiral binding | pencil-test boil on twos | solo piano, pencil scratches, page-flip reveal |
| 07 | `07_sticker.html` | (DONE, reference) colourful paper stickers | on twos | ukulele + glock |
| 08 | `08_sand.html` | sand animation on a backlit lightbox: amber glow through thin sand, dark grains where thick | sand FLOWS between shapes (density field relaxing toward target shapes), pours and wipes | ambient kalimba/hang drum, sand hiss on movement, soft deep thuds |
| 09 | `09_stitch.html` | cross-stitch embroidery on Aida cloth: every pixel an X stitch with thread sheen, backstitch outlines, hoop | re-stitched on threes; opening "stitches itself" row by row | music box, needle ticks, thread-pull swishes |
