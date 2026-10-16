---
name: animate-in-code
description: >-
  Turn an idea into a short hand-made-looking animated video (with its own music and sound effects) written entirely in JavaScript - Canvas 2D + WebAudio, no libraries, no AI image/video generation. Nine proven looks: brush strokes, zine collage, 8-bit pixel art, risograph, chalkboard, pencil sketchbook, colourful paper stickers, sand animation, cross-stitch embroidery - plus animating ON TOP of a real photo or video. Use when the user says "תעשה לי אנימציה", "אנימציה מקוד", "סרטון מקוד", "animate this idea", "code animation", "make a short animated video", "draw on my photo/video", "doodle over my video", or gives a story idea and wants it animated. Always ask which style before building.
---

# Animate in code

The user brings an idea. You ask which look. You build a short film where every frame and every sound is written in code, render it to MP4, and hand it back.

Everything you need is in `studio/`:
- `runtime.js` - canvas, fonts, player, render hooks. A film calls `film({ setup, draw, voice, kit })`.
- `audio.js` - WebAudio kit (oscillators, noise, glock, pluck, bass, kick, pads, boing, splat, thud, sparkle...) + a score that plays a chord plan and a cue sheet. A style re-voices it.
- `story.js` - an example story (8 s, "keep getting up"): layout, character pose over time, props, sound cues, chords. **This is the pattern for writing a new story.**
- `01_brush.html` ... `09_stitch.html` - nine complete films of the SAME story in nine looks. Each is a working drawing kit for its look.
- `render.mjs` - renders a film to MP4 (frames through headless Chrome, score through OfflineAudioContext, loudness-normalized to -14 LUFS).
- `STYLE_BRIEF.md` - the contract every film follows.
- `overlay/` - animating over a real photo (`photo_doodle.html`) and over real video (`video_overlay.html` + `composite.sh`). Read `references/overlay.md`.

Read `references/styles.md` (what makes each look convincing + best use cases) and `references/best-practices.md` before building.

## Workflow

### 1. Get the idea, then ask the style (always)
If the user gave only an idea, ask ONE question with the options (use the ask-question tool if available). Recommend one based on the idea:

| # | look | best for |
|---|---|---|
| 01 | Brush strokes (painterly, Van Gogh energy) | emotional, poetic, "big feelings" |
| 02 | Zine collage (newsprint, halftone, ransom letters) | news, opinion, humour, "breaking" |
| 03 | 8-bit pixel art (chiptune) | tech, gaming, levels/progress, nostalgia |
| 04 | Risograph (2-3 inks, misregistration) | design audiences, posters, calm lo-fi |
| 05 | Chalkboard | explaining, teaching, "lesson" |
| 06 | Pencil sketchbook | process, ideas, behind the scenes |
| 07 | Colourful paper stickers | cute, kids, brands, friendly |
| 08 | Sand on a lightbox | stories, memory, transformation, wow factor |
| 09 | Cross-stitch embroidery | warm, family, craft, gifts, wow factor |
| 10 | Over a real photo / video | personal brand, reels, annotating real footage |

Also confirm only if unclear: length (default 8-15 s), format (default 9:16 1080x1920), the on-screen text (Hebrew or English), and whether the ending shows a title or a logo.

### 2. Write the story as beats (before any drawing)
One line per beat: time, what the viewer notices, what moves, what sound. A short film is 4-7 beats. Give each action time to read (a fall needs ~1 s, a title needs ≥1.2 s on screen). Put the payoff near the end and hold the final frame.

Create the project: copy the whole `studio/` folder to the project location, then `npm i` inside it (needs Node 22+, Google Chrome, ffmpeg).

Write `story.js` for the new idea, following the example's shape: constants (`W, H, FPS, DUR, NDRAW`), easing helpers (keep them), layout, and functions that return the state of each actor at time `t` (`pose(t)`, `propState(t)`...), a `CUES` list (`{t, type}`) and a `CHORDS` plan (`[start, end, 'C'|'F'|'G'|'Am'|'Dm'|'Em']`). Keep everything a pure function of `t` - no state carried between frames.

### 3. Build the film in the chosen look
Start from the example film of that look (`NN_*.html`): keep its drawing kit (textures, stroke/stitch/sand functions, character drawing, sound voice) and replace the scene code with the new story. The character, props and text change; the medium's techniques stay. For a photo/video, read `references/overlay.md`.

Rules that matter (details in best-practices):
- Frame 0 is the thumbnail: never empty.
- The look must be unmistakable from one still. Material first: paper, pigment, chalk, grain, thread.
- Hand-made motion: hold drawings on twos or threes (12 or 8 fps) where the medium wants it; shake and camera on ones.
- Every cue makes a sound that belongs to the material.
- Text: `Heebo` for clean text and ALL digits; `OHRonShemer` handwriting only after checking the letters (see traps).

### 4. Look at it, fix it (at least two rounds)
```
node render.mjs film.html --grid 24          # overview
node render.mjs film.html --only 0,60,120    # full-size frames in out/film-frames/
node render.mjs film.html --strip 40,12      # a fast action, frame by frame
```
Open the images and look. Check: legibility at phone size (the 240px grid cells are a good proxy), silhouettes, faces never covered, text never cut, the payoff lands, the last frame holds.

### 5. Render and deliver
```
node render.mjs film.html                    # → out/film.mp4 with sound, -14 LUFS
```
Verify with `ffprobe` (duration, 1080x1920, audio stream). Deliver the MP4 and the HTML (it plays live in a browser with a ▶ button). Say honestly what you did not check (you cannot hear the audio - say so).

## When something breaks
- `__error` / blank frames → open the HTML in a browser, read the console.
- Font boxes or wrong letters → fonts-data.js missing next to the film, or a letter trap (below).
- Slow render (>400 ms/frame) → pre-render static layers in `setup()` with `layer(g => ...)`; cache shapes by seed.
- A simulation (sand, particles) differs between preview and full render → it is not seekable. Step it at a fixed rate from cached checkpoints keyed by frame.

## Hebrew letter traps in OHRonShemer (paid for)
ז reads as כ ("זה" → "כה"), a double yod reads as quotation marks, final ץ reads as ל, cursive מ can read as א, digits are ambiguous (2 ≈ ב). Rephrase, or set that word in Heebo. Always put digits in Heebo.
