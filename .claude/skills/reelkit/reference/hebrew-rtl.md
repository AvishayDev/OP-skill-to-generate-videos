---
name: hebrew-rtl
description: Use whenever any text on screen is Hebrew - which faces to use, direction, how words may enter, punctuation and hyphens, line breaks, and what to check in the preview frames.
---

# Hebrew on screen

Most broken Hebrew videos break in the same few ways. These rules are for text drawn by the composition; the narration and captions follow them too.

## Faces
- Set Hebrew in a Hebrew face from the kit (see `reference/kit.md`): `heebo`, `rubik`, `notoSansHebrew`, `assistant` and the display faces listed there. A Latin-only face silently falls back and the weights stop matching.
- One Hebrew family for the whole video, two weights. Heavy weights (800, 900) for headlines; 500 to 700 for labels.
- No faces that look antique, and no hollow outlined words: Hebrew letterforms lose their shape as outlines.
- Small technical labels that are only Latin letters and digits ("W 612", "v2") may use a mono Latin face. Never set Hebrew in it.

## Direction
- Give every Hebrew text container `direction: "rtl"`. Without it the full stop, comma and exclamation mark jump to the wrong end of the line.
- Isolate Latin terms, URLs and technical identifiers in their own LTR span or bidi-isolated element inside the RTL container. A label that is entirely Latin or digits gets `direction: "ltr"`. Check numbers and punctuation in the rendered sentence, not just the source.
- Everything laid out in reading order runs right to left: the first word on the right, the first list item on the right or top, tabs, chat bubbles, steps, and charts over time (the first day on the right).
- **The exception:** progress bars, sliders, loading bars and media timelines still fill left to right, as every player does.
- A typing effect adds characters in reading order; the caret sits at the left end of the text, where it grows.
- Captions: pass `rtl` and a Hebrew `face` to the kit's captions.

## How words enter
- **No masked reveals.** A Hebrew word uncovered by a moving edge (a clip, a wipe, an overflow-hidden box it rises out of) reads for a moment as a row of dashes or as a different word, because so much of the letter's identity is in its top. The frame edge counts as a mask too: a word sliding in from off screen shows a lone letter first.
- Enter whole words instead: a short rise (1 to 2 percent of the frame height) with opacity reaching 1 within two frames, or a scale down from slightly larger (at most 1.25 times) onto its place.
- At most one word in three gets the big scale entrance. The rest rise, or widen by spacing the letters (one span each; see below), or slide a short distance from inside the frame.
- Letter by letter: each letter appears whole, starting from the rightmost (the first one read).
- This overrides the masked rise that `reference/motion-design.md` recommends for Latin headlines.

## Letter spacing that moves
CSS `letter-spacing` on right-to-left text reorders glyphs or clips the last one. Spread a word with one span per letter and grow the gap from the right, which is the first letter read. Do this only for a script whose letters do not join (Hebrew, not Arabic). When a reference shows the spread, measure the gap on every frame and use that list, normalised from 0 to 1. One measured curve is 0, .26, .45, .60, .72, .81, .89, .94, .97, 1 over ten frames.

## Vowel points
Niqqud is for the voice request, never for text on screen. A pointed word is a different picture from the one the user wrote, and `reelkit lint --no-video` reports it. Keep the user's wording unpointed in the composition.

## Edges
Check lettering on the rendered film, not only on the two preview frames. A title's words leave the frame together; one letter left behind reads as a fragment. A flash of a few frames can hide a caption that is already drifting off an edge: `reelkit lint` reports the cut lettering and the flash, with the frame numbers to open.

## Hyphens and punctuation
- For newly written display copy, prefer clear punctuation and breaks rather than joining words with decorative dashes. Preserve the user's exact supplied wording; do not silently remove a hyphen or punctuation from a quote.
- A prefix letter before a number or a Latin word ("ב-2026") is correct Hebrew, but on screen prefer wording that avoids it.
- Quote the user's text exactly, letter for letter. Never "fix" spelling, add vowel points or swap a final letter.

## Lines
- Never let the renderer wrap a Hebrew line. Break lines yourself, by meaning, and give each line its own element with `whiteSpace: "nowrap"`.
- In a stacked headline keep every line the same size; shrink the whole stack rather than one line.
- Leave room: a word that fills the width should use about 90 percent of the safe width, so a camera push or a shake cannot push a letter out.

## Text on a path or in a drawing
- Text inside a scaled drawing blurs and distorts when the camera zooms. Keep labels in a layer above the drawing and compute their position from the camera.
- Text on a curve or ring: render a preview frame and read it. Path text in RTL starts from the other end of the path than Latin text does, and a wrong offset makes it vanish rather than look wrong.

## Check before you show
1. Every word in the right order, right to left, spelled exactly as given.
2. Punctuation matches the supplied wording and renders at the correct end of the phrase.
3. No letter cut by the frame edge or by a mask, in the early frame or the late one.
4. Progress bars fill left to right; everything else runs right to left.
5. The full stop and exclamation mark sit at the left end of the last word.
