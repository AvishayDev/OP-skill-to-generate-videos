# Animating over a real photo or video

Two working examples in `studio/overlay/`: `photo_doodle.html` (doodles on a photo) and `video_overlay.html` (doodles composited over a real clip). Shared kit: `doodle-kit.js` (brush-pen line that draws itself, white gouache fills, stars, arrows, hearts, speech bubbles, a tiny character), `timing.js` (story-free timing: `FILM_DUR`), `runtime-overlay.js` (runtime.js + `film({ score })` for a custom score).

## Photo
1. Put the photo next to the film and run `python3 make_photo_data.py photo.jpg` → `photo-data.js` (the photo as a data URL). **Why:** a file:// image taints the canvas and frame export fails; a data URL does not. PNG with transparency is kept as PNG (cutouts look great on a pastel backdrop).
2. Look at the photo first. Find the story in it: where the person points, looks, what their hands hold. The doodles should USE the photo (a character walks down the arm and jumps off the fingertip), not just decorate it.
3. Brush-pen line (near-black, swelling/tapering), opaque white gouache for bodies so they read on a busy photo, watercolour-ish colour. Lines draw on progressively and boil on twos.
4. Never cover the face. Keep text in clear areas.

## Video
1. Trim the clip and look at it: extract frames every 0.25-0.5 s with ffmpeg and view them. Transcribe the speech with word timings if there is speech (any Whisper).
2. Write two or three **tracks** by eye (head, hands) as `[t, x, y]` points; a small `track(t)` helper interpolates. Expect ±30 px - fine for doodles, not for precise tracking.
3. Time each doodle to a WORD and a GESTURE: an arrow on "me", a target around an OK-sign on "spot on", hearts from open palms on "enjoy".
4. The film draws ONLY the overlay - never fill the background - so frames are transparent:
   `node ../render.mjs video_overlay.html --keep-frames`
5. Composite + mix: `./composite.sh my_clip.mp4` → `out/video_overlay_final.mp4`. The clip is cover-cropped to 1080x1920 @ 24 fps; speech stays on top and the doodle sounds are ducked under it (sidechain).
6. Legibility on real footage: give ink lines a light halo, and write titles as light letters with an ink outline so they read on dark walls and light shirts alike.

## Traps
- Low-resolution photos look soft next to sharp doodles - ask for the largest original.
- Handwriting fonts and Hebrew: the same letter traps as everywhere (see SKILL.md); titles over video are safer in Heebo 800 with a hand-drawn underline.
- Doodles that trail a fast hand look sloppy: add more track points around fast moves, or anchor the doodle to a slower body part.
