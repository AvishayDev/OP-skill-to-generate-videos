---
name: image-sets
description: Use when a film needs more than one generated picture, or one picture that must carry a concept - how to make four to eight generated images read as one hand, how to turn an idea into a picture, what to reject, and the local image tools (cut out from white, place a real screenshot in a photograph, palette check and flatten).
---

# A set of pictures that reads as one look

One generated picture is easy. Six that look like the same illustrator drew them on the same afternoon is the hard part of an illustrated film, and a style name ("flat vector", "editorial") does not get you there: the model reads it differently every time. What does is a written contract of visible facts, repeated word for word.

## Write the style contract first

Before the first `imagePrompt`, write the look down once, in the first scene's `notes`, as facts a person could check by looking. Not a style name, not an artist, not a company.

| Field | Write it as | Example |
|---|---|---|
| Medium | the tool and the surface | "black felt-tip line on warm off-white paper" |
| Line | weight, ends, steadiness, and what it never is | "one weight, rounded ends, a slight wobble; never a thick comic outline" |
| Fill | flat, scribbled or hatched; hard or soft edges | "flat, hard-edged, no shading" |
| Palette | a hex for each role and how much of the picture it takes | "ground #F4EEE1 most of the frame, ink #1C1B19, one accent #D24E2A on 5 to 12 percent" |
| Light | none, or one direction | "no light, no shadow" |
| Composition | empty space, margin, how many things | "at least 45 percent empty, a 7 percent margin, one action, at most three supporting objects" |
| People | how drawn, how many | "simple figures, no detailed faces, at most two" |
| Text | none, and where the film's words will go | "no lettering; the top third stays empty for the headline" |
| Never | the neighbouring looks the model slides into | "no gradients, no glow, no 3D, no photorealism, no glossy vector polish" |

Take the palette from the film: a kit look (`looks.warmEditorial.palette`) or the user's brand. The ground of the picture is the ground of the scene it sits on, by its exact hex, so the picture has no visible edge when it is laid on that ground.

## Every prompt is the contract plus one subject

Each scene's `imagePrompt` has two parts:

1. **The subject of this scene**, written for this scene only: what is there, what it is doing, where the empty space is.
2. **The contract, word for word.** The same sentences in every prompt, in the same order. Do not paraphrase it between scenes; a reworded contract is a different style.

What varies between scenes is the subject and the layout, never the facts of the look. Say so in the prompt when a set starts to repeat itself: "a new composition; keep only the line, the paper, the palette and the amount of empty space".

Write the prompt for the frame's shape. A picture composed for 16:9 and cropped to 9:16 loses its subject; for a tall frame say where the subject sits and that the upper or lower third is empty. When the same film is made in two shapes, the pictures are written twice.

## From an idea to a picture

A scene's narration is a sentence; a picture needs a thing doing something.

- **Reduce the line to a noun and an action.** "We keep your data safe" is a hand closing round a key. One anchor object, at most two supporting shapes.
- **Give the action a physical verb:** hold, point, connect, choose, reveal, balance, place, pull, protect, grow, open. An idea with no verb becomes a picture of nothing happening.
- **One metaphor a picture.** When it is unclear, take things out; do not add a label to explain it.
- **For a diagram, name the one relationship** (a chain of causes, a loop, a comparison, a hierarchy, steps in order) and count the parts: three to seven. Then draw it with the kit (`reference/explain-graphics.md`), not with an image model: a generated diagram misspells its labels and miscounts its arrows.
- **For anything with parts in an order** (an exploded view, a cutaway, layers): list the parts and their order first, and reject any picture that changes the count or the order.

## Words are never in the picture

Generate without lettering and leave the place for it empty; the film sets the words (`reference/scene-treatments.md`, "An image scene is built in layers"). A picture with wrong or invented lettering is rejected, never cropped to hide it and never excused as part of the style. The same for a logo or an interface: the user's real logo and real screenshot are laid in afterwards, unchanged.

To show the user's real screen inside a photographed or generated scene, ask for the scene with the screen blank and place the screenshot yourself:

```bash
python3 <tools/image>/place_on_plate.py desk.jpg inbox.png shot.jpg --quad "412,188 1310,204 1296,842 398,820"
```

`reelkit tools` prints where `tools/image` is on this machine; its `README.md` says when to use each script. `--quad` is the four corners of the blank screen in the photograph's pixels, clockwise from the top left.

## Recurring characters and objects

- Ask for each on a pure white ground and cut it out locally: `cutout_white.py head.png head-cut.png --square`. It is free, and the cut-outs can then be placed, moved and re-posed separately on any ground. Register each with `reelkit assets upload`.
- When the ground is pale and flat, a subject on white needs no cut-out at all: lay the picture over the ground with `mixBlendMode: "multiply"` and the white disappears. On a dark ground, ask for the subject on pure black and lay it with `mixBlendMode: "screen"`. Either way the picture's own ground is asked for by exact hex or as pure white or black.
- A set of faces or objects that must share light and style is one picture of all of them in a grid, cut into cells, not six separate generations.
- A row of drawings that should feel hand-made gets the kit's `Boil` round each one (a different `seed` each), not a camera shake.

## Check the set, then look at it

After generating, before writing the composition:

1. **Measure.** `palette.py check picture.png --ratio 9:16 --palette "<the contract's hex list>"` for every picture. It fails a picture whose proportions are off or that has a large area far from the palette, and prints the colours it found.
2. **Flatten a flat style.** When the look is two or three flat colours, `palette.py flatten` redraws each picture in exactly those colours, so the set matches to the pixel. Never on a photograph or a painted look.
3. **Look at them side by side, small.** Put all of them in one row at thumbnail size. The one that does not belong is obvious at that size and invisible one at a time. Then look at each at full size.

Reject a picture, and say which of these it is, when it has:

- lettering, pseudo-writing, a logo, a watermark or an interface nobody asked for;
- several pictures in one (a grid, a collage, a split screen) when one was asked for, or a frame or caption round it;
- a different look from the set: shading, gradient, glow or 3D in a flat set; a different line; a new colour over a real area; a tinted ground where it should be flat;
- more things than the contract allows, or a metaphor that cannot be read in two seconds;
- broken hands or faces, or more people than asked for;
- its subject cut by the frame, or sitting where the film's words must go.

Regenerate for one reason at a time: name the single worst fault, change only that in the prompt, keep every other word. Changing three things at once produces a fourth problem. Do not regenerate to chase a small improvement (`reference/asset-reuse.md`); each picture counts against the quota.

## Keep a ledger

In the project, beside the plan, keep one line a picture: the scene, what it must show, the proportions, the exact prompt, and the file it produced. When a picture is regenerated the line changes. It is what lets a later revision change one picture without disturbing the look of the others, and it is where the next film of the same series starts.

## Whose style

Describe the medium; never name a living artist, a studio or a company as a shortcut to a look, and never ask for a recognisable character or mark. A reference picture the user gives is evidence for line, colour and proportion only; its subject, pose and layout are not copied (`reference/rights.md`).
