---
name: reference-recreation
description: Use when the user wants a film that follows an existing video closely (a recreation in another language, "exactly like this one") - measuring the reference frame by frame, keeping two clocks straight, scoring each scene, and taking clean shots from source footage.
---

# Following a reference closely

`reference/references.md` covers learning from a video's structure. This file is for the harder brief: the user wants the same moves, cut for cut, with their own words. The right to use any of the reference's footage, music or words is theirs to settle; see `reference/rights.md`.

## Measure, do not guess
Every move you rebuild from memory of how it "looks" comes back as a revision. Before writing a shot:
1. Extract every frame of the stretch (`ffmpeg -i ref.mp4 -vf "select='between(n,232,245)'" -vsync 0 f_%04d.png`) and lay them on one sheet.
2. Write down, per frame: what is on screen, where (as a share of the width and height), how big, and what changed since the frame before. Hard cut or blend? One fat frame, a blurred frame, a flash?
3. For a move, measure the quantity that moves on every frame and normalise it to 0..1. That list is the easing; use it as written rather than naming a curve. Example, a word whose letters spread: the glyph size was constant, only the gap grew, with progress 0, .26, .45, .60, .72, .81, .89, .94, .97, 1 over ten frames, a heavy blurred frame before and a heavy frame after.
4. Compare your render to the reference on the same sheet, same frames, before showing anyone.

What looked like "the word scales up" was letter spacing; what looked like "bars close" was bars closing part-way and then a cut. The frames say which.

## Two clocks
If your film is shorter than the reference, it has two clocks: the reference's frames, where every shot was measured, and the film's frames, where the sound sits. Mixing them puts things a hundred frames out.
- Keep one table of the reference ranges the film keeps, in the composition (`const SEGS = [[152, 653], [782, 1028]]`, with `const HOOK_END = 179` if the opening has its own clock) or in `clock.json`: `{ "opening": 179, "keep": [[152, 653], [782, 1028]] }`.
- `reelkit clock 802 1581` prints where reference frames land in the film; `reelkit clock --film 623` goes the other way. Use it every time; do not do the subtraction in your head.
- Write shots on the reference clock and let one helper place them. A shot that lies in a cut range, or in the wrong scene section, is silently never drawn: `reelkit lint --no-video` lists both.
- Audio is placed in film seconds. A caption frame in the code and a word time in the voice are on different clocks until you convert one.

## Score every scene
After each preview, score each scene out of 100 against the reference on the same things every time: timing (cuts and entrances within a frame or two), layout (position and size), type (face, weight, direction), motion (the measured curve), and legibility. Keep the table in the project. A scene under 80 is not done; say which part is short and by how much. Have a separate reviewer score from the frames alone when you can: whoever built a scene scores it high.

## Clean shots from source footage
When the user supplies footage to cut from (their own, or footage they have cleared):
1. Detect the cuts (`reelkit ref analyze`, or ffmpeg's scene filter) and make a contact sheet with one frame per shot, labelled with frame ranges.
2. Reject frames with burned-in captions, handles or logos; crop the rest to the clean part and note the crop. A shot that is clean for five frames is a five-frame clip; play it slowly rather than use dirty frames.
3. Write a `SHOTS.md` beside the clips: file, source frames, crop, what it shows, where it may be used. Write the source and licence into the asset log the moment the file enters the project.
