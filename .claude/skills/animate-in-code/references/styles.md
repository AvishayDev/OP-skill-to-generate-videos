# The nine looks (+ overlay)

Each entry: what sells the medium (the 2-4 techniques that matter), the motion texture, the voice, use cases, and traps. Source of truth for the code: the matching `studio/NN_*.html`.

## 01 · Brush strokes
- **Sells it:** ONE brush function builds everything. A stroke = tapered ribbon filled with 3-14 thin bristle lines of slightly varied colour/alpha, dry-brush breakup at the tail, a light impasto edge on one side and a darker edge on the other. Sky = thousands of strokes following a swirling flow field. The character is painted with strokes that wrap its round form, with a painted outline.
- **Motion:** figures repainted on twos with small jitter; background pre-painted in 3 variants swapped every 3 frames (shimmer without cost).
- **Voice:** felt piano, soft strings pad, brushed snare; wet slap, deep tom, harp gliss.
- **Use cases:** emotional stories, quotes, "a life lesson", gratitude, art-world content.
- **Traps:** strokes in concentric rings read as a target - vary direction. Put the title on a dark painted band so it stays readable.

## 02 · Zine collage
- **Sells it:** a real set: a newspaper page (masthead, fake text columns, halftone photo boxes, fold crease). Every piece scissor-cut (straight angled cuts, not torn), hard offset shadows, B/W halftone with dot size following a light gradient, one loud red. Googly eyes glued on (pupils sag with gravity). Pasted sound-words ("פלאף!", "בום!").
- **Motion:** stop-motion on threes (8 fps) with per-pose hand-placement jitter; camera shake on ones.
- **Voice:** detuned toy piano, tape hiss, scissor snips, paper rustle, typewriter clacks on each title letter, kazoo slides.
- **Use cases:** news and opinion, humour, "breaking", editorial reels, announcements.
- **Traps:** ransom letters in mixed fonts - test each letter's legibility; digits in Heebo.

## 03 · 8-bit pixel art
- **Sells it:** a real low-res screen (e.g. 180x320) with integer rects only, scaled up with `imageSmoothingEnabled = false`; a strict 16-colour palette; dithering for gradients. Hand-made sprites per action (string maps), swapped rather than deformed. Hebrew text: render Heebo 900 to a tiny canvas and threshold it to pixels.
- **Motion:** 12 fps, positions snapped to the pixel grid, shake in whole pixels. Game flavour: HUD hearts, score, "LEVEL CLEAR!".
- **Voice:** square lead, triangle bass, noise drums, arpeggios; jump sweep, coin, 1-up, bump. Very little reverb.
- **Use cases:** tech and gaming, progress/levels metaphors, retro nostalgia, "level up" stories.
- **Traps:** no smooth zoom or rotation (sprites break) - cut or swap instead.

## 04 · Risograph
- **Sells it:** each ink (e.g. fluorescent pink #ff48b0, blue #0078bf, yellow #ffe800) is its own offscreen PLATE, composited with `multiply` so overlaps make true overprint colours. Halftone screens fixed to the page (objects move through them). A grain mask eats ink (thin patches, roller streaks). Knock-outs for text.
- **Motion:** plates misregister a few px and jitter on twos; they knock apart on impacts and snap back into register.
- **Voice:** lo-fi hip-hop: dusty keys with wow/flutter, soft boom-bap, vinyl crackle.
- **Use cases:** design-minded audiences, posters, calm aesthetic reels, event promos.
- **Traps:** fade by lowering halftone density, never with alpha (it looks digital).

## 05 · Chalkboard
- **Sells it:** everything drawn into one chalk layer (broken dab strokes, side-of-chalk hatching), then masked by a board-grain texture so the chalk "skips". Dark details are ERASED, not painted. The board has a history: smudges, eraser swipes, ghosts of a previous lesson, frame and tray.
- **Motion:** chalk boil on twos; fast movers leave fading smears; impacts puff chalk dust. Opening draws itself on.
- **Voice:** nylon guitar, claps; chalk squeaks for jumps, eraser rub for falls, book-slam thud, school-bell ding.
- **Use cases:** explainers, teaching, "here's the lesson", workshops and lectures.
- **Traps:** grain eats small whites (eyes) - keep a faint clean copy under the text.

## 06 · Pencil sketchbook
- **Sells it:** graphite = several thin passes with pressure varying along the stroke, overshooting ends, paper tooth breaking the line. Light BLUE construction lines under every figure (circles, line of action). Form-following hatching. Eraser ghosts. Sketchbook props: spiral binding, coffee ring, frame counter, margin notes.
- **Motion:** pencil-test boil on twos, faint ghost of the previous drawing on fast moves.
- **Voice:** solo felt piano, pencil scratches, eraser rubs, page flips.
- **Use cases:** process and behind-the-scenes, "how an idea is born", creators and designers.
- **Traps:** too faint at phone size - the final contour needs a dark core line; keep construction and hatching light for hierarchy.

## 07 · Colourful paper stickers
- **Sells it:** torn-paper cutouts with a white sticker edge and a soft drop shadow, paper fibre texture (multiply), halftone accents, masking tape, boiling crayon outlines, ransom-note word chips.
- **Motion:** on twos (stop-motion cutouts); collage assembles in the first frames.
- **Voice:** ukulele strums, glockenspiel motif, soft kit; boings, splats, sparkle.
- **Use cases:** cute and friendly brands, kids, education, positive messages.
- **Traps:** shadow blur and offsets do not scale with the transform - multiply by the render scale.

## 08 · Sand on a lightbox
- **Sells it:** a density grid (e.g. 360x640). Each step the story draws its TARGET picture into a hidden grid; the real sand relaxes toward it at slightly different speeds per cell and spills into neighbours - shapes flow instead of cutting. Light = exp(-k·density) through a warm ramp; stable per-grain speckle. Details (eyes, text) wiped with a "finger" as clear lines.
- **Motion:** 3 fixed sim steps per frame, snapshots every 8 frames so any frame can be rendered cold and match the sequential render. Grains spray on impacts.
- **Voice:** kalimba / hang drum, deep pads, sand hiss whenever sand moves.
- **Use cases:** memory and transformation stories, weddings/tributes, "wow, that's code?" moments.
- **Traps:** dark-on-dark beats disappear - carve a glowing outline around the character.

## 09 · Cross-stitch embroidery
- **Sells it:** draw the scene flat into a coarse grid (e.g. 60x107 cells), quantize to a thread palette, then draw each cell as a real X: two strands of twisted plies narrowing into the holes, top leg last with its own shadow. Dark backstitch outlines and features on hole positions; French knots for dots; metallic thread with glints for the star. Aida cloth, hoop, loose threads, a needle.
- **Motion:** re-stitched on threes; the opening sews itself row by row over a faint printed pattern; the title sews in with the needle.
- **Voice:** music box, felt bass, needle ticks, thread-pull swishes, padded thuds.
- **Use cases:** warm family moments, gifts and greetings, craft brands, holidays.
- **Traps:** Hebrew is illegible at full cell size - stitch text at half-cell size.

## 10 · Over a real photo or video
See `overlay.md`. Brush-pen lines and white gouache doodles drawn onto a real picture or clip.
- **Use cases:** personal-brand reels, annotating yourself talking, product shots that come alive, "a doodle friend lives on my shoulder".
