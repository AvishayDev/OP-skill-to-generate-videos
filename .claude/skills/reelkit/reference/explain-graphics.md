---
name: explain-graphics
description: Use when a scene has to explain something - a number, a comparison, a process, a correction, a detail of a screenshot. How to choose the graphic by what changes on screen, the eight kit components that draw it, the limits they enforce, how they are timed to the voice and to sound, and how to review them.
---

# Explain with a picture

A sentence that states a number or a process is the weakest way to make the point. A graphic that draws it in the order it is understood is the strongest. This file is how to choose that graphic and how to keep several of them reading as one film.

## Mark the lines first

Go through the script line by line and mark only the lines where a picture makes something understood that the words alone do not: a quantity, a difference, an order of steps, a change of wording, a detail. Most lines get no mark. A film where every line has a chart is a slide deck; two to four explaining graphics in thirty seconds is a lot.

For each marked line write one sentence that begins "The viewer sees ...": "The viewer sees the third bar pass the goal line." If the sentence describes a finished layout ("the viewer sees a table") and not a change, the line is not ready: decide what moves.

## Choose by what changes, not by how it ends

Two graphics can end on frames that look alike and still say different things. Choose by the change you wrote down.

| What changes on screen | Component | Not this, when |
|---|---|---|
| A few quantities grow side by side at one moment | `BarChart` | it is one quantity over time: `TrendLine` |
| One quantity moves through time | `TrendLine` | there are only two points: `BarChart`, or `CounterRoll` from one to the other |
| One share of a whole fills | `DonutStat` | several shares are compared: `BarChart` |
| A single number is the whole point | `CounterRoll` | it needs something to stand against: `BarChart` with a `target` |
| Two options are judged point by point | `CompareTable` | the points are quantities: `BarChart`; it is one sentence against another: `CopyCorrection` |
| Parts connect in an order | `FlowDiagram` chain | the last step feeds the first: cycle; one thing serves many: hub |
| People exchange messages | `ChatStack` | someone asks the product and it answers: `PromptBox` |
| One wording replaces another | `CopyCorrection` | several points change: `CompareTable` |
| One detail of a picture already on screen becomes the point | `Callout` | the picture is not on screen yet: show it first, call out second |

Use the name the table gives. Do not replace one of these with a card that fades in: the order of the drawing is the explanation.

## One grammar

The eight components share rules, so unrelated graphics feel like one hand drew them. Follow the same rules in anything you draw yourself beside them.

- **Nothing moves on frame 0.** The first thing starts five frames after `delay`, so the cut into the scene is seen before the graphic begins.
- **Draw before label, evidence before verdict, move before resolve.** The connector draws and then its node appears; the rows fill and then the winner is marked; the wrong line is struck and then the right one lands.
- **A figure and its shape share one progress.** The number over a bar counts on the bar's own curve and they land on the same frame. Never animate a number and its shape on two timers.
- **What has landed stays still.** Earlier bars, rows, nodes and messages do not shift when the next one arrives. No idle float is added to fill a hold.
- **One accent, on the thing that is changing.** The growing bar, the newest node, the correction. When the graphic settles, the accent rests on the point of it and nowhere else. Pass the film's one `hero` colour to every graphic.
- **End still, and hold it.** `readFrames(text)` gives the frames a settled state needs (three words a second, never under 1.2 seconds). The scene lasts at least the component's `done` frame plus that hold. A graphic that finishes drawing as the scene cuts was not read.

## Content limits are part of the design

Each component refuses more than it can show legibly, and says what fits:

| Component | Holds |
|---|---|
| `BarChart` | 2 to 6 bars, labels up to 14 characters (fewer under six bars) |
| `TrendLine` | 3 to 12 values, a note up to 40 characters |
| `DonutStat` | one value, a label up to 28 characters, up to 3 tags of 16 |
| `CompareTable` | exactly 2 columns, 2 to 5 rows, cells up to 16 characters |
| `FlowDiagram` | chain 2 to 5 nodes, cycle 3 to 5, hub 3 to 6; labels up to 16 characters |
| `ChatStack` | 1 to 4 messages of up to 90 characters |
| `CopyCorrection` | two lines of up to 60 characters |
| `Callout` | one region, a note up to 44 characters |

When the content is over a limit, do not look for a way round it. Cut to the items that make the point, or split the graphic into two shots. The letters are never made smaller to fit more: a label the viewer cannot read on a phone is not there.

## The numbers are the user's

- Every value, label and quote comes from the user's material, unchanged. If a chart needs a number the user did not give, ask for it or make the point without a chart.
- An example with invented values is allowed only when the user asked for an illustration, and then the scene says so on screen ("Example").
- The scale starts at zero. `TrendLine` takes `fromZero={false}` for a series that would be a flat line otherwise; when you use it, the note or the narration names the range, because a cut-off axis makes a small change look large.
- Show the unit: `prefix="$"`, `suffix="%"`, `suffix=" ms"`.

## Timing to the voice

With a narrator the voice is the clock (`reference/voice-sync.md`). Every component has a function with the same props that returns its event frames, in the scene's own clock. Use it backwards: decide the word the main change must land on, then set `delay` so it does.

```tsx
import React from "react";
import { BarChart, SceneFrame, barFrames, onWord, sceneById } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";

const BARS = [{ label: "By hand", value: 12 }, { label: "Templates", value: 31 }, { label: "Relay", value: 94 }];

export const Proof: React.FC<VideoProps> = ({ manifest }) => {
  const s = sceneById(manifest, "proof");
  // The last bar lands as the narrator says "ninety-four": find where it lands with no delay, then shift the whole chart by the difference.
  const landsAt = barFrames({ count: BARS.length }).land[BARS.length - 1]!;
  const delay = Math.max(0, onWord(s, "ninety-four", { lead: 0 }) - landsAt);
  return (
    <SceneFrame from={s.startFrame} durationInFrames={s.durationFrames}>
      <BarChart bars={BARS} delay={delay} hero="#FF7A45" />
    </SceneFrame>
  );
};
```

The same works for every one of them: `trendFrames(...).drawn` on the word that names the result, `donutFrames(...).land` on the percentage, `tableFrames(...).verdict` on the name of the winner, `flowFrames(...).nodes[i]` on each step's word (set `per` to the gap between the words), `correctionFrames(...).replace` on the corrected phrase, `calloutFrames(...).note` on the word that names the detail.

With no narrator, land the main change on a beat (`reference/beat-sync.md`) in the same way.

## Sound

These are small, exact sounds, under the music and under any voice (`reference/sound-design.md`):

- A soft tick as each bar, row, node or message starts; nothing on every frame of a count.
- One fuller hit on the main change: the last bar landing, the line whole, the ring closed, the verdict, the cycle closing, the replacement landing, the callout's note.
- Nothing during the reading hold. The quiet is what lets the number be read.

Take the frames from the same function that timed the picture, so the sound cannot drift from it.

## Around the graphic

- Give it the frame. One explaining graphic per scene, with at most a `Headline` or one line of type; not beside a second graphic.
- Put it on the film's ground with the film's `hero` colour and `font`. Use `theme="light"` on a light ground and the default on a dark one (`themeFor(bg)` chooses).
- In a tall frame a chain runs top to bottom and a ring stays near round; in a wide one a chain runs left to right. You do not lay these out by hand.
- Hebrew labels are set right to left by the components themselves; read `reference/hebrew-rtl.md` for the lines you write around them.
- A screenshot under a `Callout` is the user's real screen, never a drawn imitation.

## Review at four moments

`reelkit preview` gives early, late and boundary frames. For each explaining graphic look at four moments, and fix what you see before anything else:

1. **The opening.** The scene's first frames show the ground and nothing half-drawn.
2. **The main change.** The frame where the bar lands, the line closes or the replacement arrives shows that and only that in the accent colour.
3. **The settled state.** Everything is inside the frame, no label touches another, every word can be read at phone size, and the figure equals the user's number exactly.
4. **The last frame before the cut.** It is the same picture as the settled state: the graphic finished and was held, it is not still moving.

A graphic that passes `reelkit check` and fails one of these is not finished.
