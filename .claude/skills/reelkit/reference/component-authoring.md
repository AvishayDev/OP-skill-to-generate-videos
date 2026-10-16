---
name: component-authoring
description: Use when writing a new reusable component file for a video's src/ folder.
---

# Authoring reusable components

## First, do not write one
Run `reelkit assets search "<description>" --kind component`. If a library component does the job with different props, `reelkit assets pull <id>` it (it lands in `src/`) and use it. Write a new component only when nothing fits.

Use `reference/style-components.md` to choose the role and `reference/style-recipes.md` for the shot's motion and proof. A catalog name does not mean a built-in kit export or a currently published asset; search, pull and inspect the actual source first.

## Split the film into parts
Searching first is about not writing a part twice. It is not a reason to write everything inside `Video.tsx`: a film whose whole picture lives in one file leaves nothing to reuse, shares nothing, and shows as one block when it is saved as a template.

Before writing `Video.tsx`, list the parts the film draws and decide where each one lives:

| It is | It goes | Example |
|---|---|---|
| A drawn thing with no words of its own | Its own file in `src/`, all values as props | `MaskRise` (a line that rises from behind a mask), `Blob`, `EyedCharacter`, `ChartCard`, `TabChip`, `DrawnCheck` |
| A way of placing or timing other things | Its own file, taking `children` | `Pin` (centre children on a point), `Shake`, `Orbit` |
| This film's scene: which parts, which words, which frames | `Video.tsx` | the `hook` shot: a `ChartCard` at frame 4, "Great month." at 53, the slam at 98 |
| The palette, the sound list, the frame numbers | `Video.tsx`, passed down as props | the blob gets `color={c.hero}` |

Rules of thumb:
- A function in `Video.tsx` that returns JSX and holds none of this film's words is a part. Move it to a file.
- A scene function may stay in `Video.tsx`, named after its scene id (`Hook` for `hook`, `OneNumber` for `one-number`), and should be mostly a list of parts with props. If it is long because it draws shapes itself, the shapes are parts.
- One part needs another (a monster has eyes): pass it in as `children` or a prop, since a component file imports no other component file.
- The same thing lives through several scenes (one ball that changes shape): one part with the values as props (`x`, `y`, `radius`, `morph`), and `Video.tsx` owns the keyframes.
- Do not split for its own sake: a two-line wrapper used once is not a part.

## Rules for a component file
- One component per file. File `NumberBadge.tsx` exports `export const NumberBadge: React.FC<NumberBadgeProps>`.
- Imports only from `react`, `reelkit/frame` and `reelkit/kit`. A component never imports another component file.
- Everything specific comes in through props: text, numbers, colours, timing. No baked-in copy, brand names, user details or asset paths.
- Give every visual prop a sensible default so `<NumberBadge value={1} />` works on its own.
- Size relative to `useVideoConfig()`, never fixed pixels.
- Animate from the local `useCurrentFrame()`, and accept an optional `delay` prop in frames.
- Declare the props type in the same file and export it.
- Start every new component with a comment of one or two sentences directly above `export const Name`, saying what it shows and when to use it. It becomes the library description when the component is shared, so it must make sense without this video: "A ring that fills to a percentage with a label in the middle. Use it for one big stat."

## Keep it reusable
Write each component so it would suit a video on an unrelated topic:
- **Generic** - nothing in it is specific to this video.
- **Structural** - a badge, checklist, chart, progress bar, callout, quote card, icon animation, transition.
- **Passing** - `reelkit check` passes with it in use.

Avoid one-off layouts, anything with content baked in, or a near-duplicate of a library component.

## Sharing
After a successful `reelkit render`, every new component written in the project is sent to the library for review (its source, the comment above it as the description, and an example taken from `Video.tsx`; nothing else), and only the owner publishes it. Make that work:
- Use the component in `Video.tsx` with plain values where you can (`<NumberBadge value={42} label="users" />`). The example is the first use there; if its props are variables or `urls[...]` or `s.words`, the component is skipped and `reelkit components share NumberBadge --example '<NumberBadge value={42} label="users" />'` sends it with an example you give.
- Keep the text out of the file: nothing from the user's script, no `assets/user/...` path, and not the video's title. A component that has any is refused.
- `reelkit components share [name...]` sends by hand (`--describe`, `--example`, `--tags` for one name); it does not wait for a render.
- The user may say no: `reelkit init <name> --private` for the project, `reelkit render --no-share` for one render, or `REELKIT_NO_SHARE=1`.

## What keeps a component from being shared
A component is shared only when nothing of this video is written into it. It is skipped when it uses one of the user's files, contains the plan's title, contains any run of eight or more characters that also appears in the narration or the on-screen text, or has a whole sentence written into its code. Pass every word in as a prop, with a short neutral default ("Label", "42"), and the component is both reusable and shareable.
