---
name: revisions
description: Use for every change to a film that has already been shown to the user - how to change only what was asked, prove it with a frame diff, and keep each version recoverable.
---

# Revising a film

After the first render the user reads every later version against the one before. Their request is a list; anything else that moves is a defect, even if you think it is better. "Change only what I asked" is the default contract of every revision, whether or not they say it.

## Before touching anything
1. Restate the request as a numbered list of changes, each with the frames it may touch. If an item is ambiguous or two items conflict (a demo they approved shows one thing, the written instruction another), build what is written and say so in the report; do not pick silently.
2. Save the state you are leaving: copy `src/Video.tsx` (and any file you will edit) to a `backup/` folder under a version name, and keep the current render. `reelkit render` copies the render it replaces to `out/previous.mp4`; copy that somewhere with a version name if you need more than one step back.
3. Work out the allowed frames. A change to a shot is its frames; a change to a voice line is its seconds; a retimed caption is a few frames either side. For a film on a reference clock, `reelkit clock <frames>` converts (see `reference/reference-recreation.md`).

## Making the change
- Edit the smallest thing that does it. A wrapper that returns its children untouched when it has nothing to do (scale 1, blur 0) keeps every other frame identical; a restructure does not.
- Do not tidy, retime, recolour or "also fix" anything outside the list. Write what you noticed into the report instead and let the user decide.
- If the user limits renders ("render once"), do every check you can before it: `reelkit check`, `reelkit lint --no-video`, the arithmetic of positions and frames. Removing something can expose what it hid (a flash that covered a caption drifting off the edge): look at what becomes visible.

## Proving it
```
reelkit render --no-share --allow 623-679,1637-1644 --allow-audio 8.4s-10.5s
```
`--allow` compares the new render with the one it replaced and fails when a frame outside the ranges changed (mean grey difference above 1.0 at 320x180), or when the sound's level changed outside them. Or after the fact: `reelkit diff out/previous.mp4 out/video.mp4 --allow ...`.

Read the result:
- **Changed outside the allowed ranges**: you broke the contract. Find the cause before anything else.
- **Allowed but identical**: a change that was asked for is not in the film.
- **Largest difference on an unchanged frame**: small values next to a changed range (0.2 to 0.6) are the video codec carrying the change into neighbouring frames, not your code. State the number in the report.
- A changed range wider than you expected is information, not noise (a word that used to linger changes every frame it lingered on). Report it with the reason.

## Reporting
Lead with whether every change is in and whether anything else moved. Then one line per requested change with the frames you checked, then the diff result, then anything you saw and did not touch. Say plainly what you did not do and why.

## Versions
Name outputs by version and never overwrite a delivered file without keeping it (`*_prev`). Keep, per version: the composition source, the render, the voice track if it changed, and one line in a log saying what went in. A box can reboot mid-render: after writing anything that matters, check the file exists and reads back (`reelkit render` and `reelkit export` do this for their own output).
