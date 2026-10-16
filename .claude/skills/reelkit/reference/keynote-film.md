---
name: keynote-film
description: Use when the launch film should be the long, calm keynote kind - 45 to 120 seconds of large centred words on a pale dotted ground, dark "New ___" dividers that roll like a slot machine, the real interface with a camera push, glass cards on a landscape photograph and a "One more thing" reveal, cut to a steady beat.
---

# A keynote launch film

`reference/launch-film.md` is the short, dense launch film: 15 to 45 seconds, an object in space, a sound on almost every change. This file is the other kind: the film a company plays when it announces a whole release. It is longer and calmer, it is made mostly of words, and it has chapters. Everything in `reference/launch-film.md` about the plan (`"voice": "none"`, `seconds` on every scene), the sound report and the checks still applies; this file changes the shape, the type and the density.

The grammar below was adapted from a style study of one 166-second agent-product launch film (see `THIRD_PARTY.md`). It describes a kind of film, not a film to copy: never use another company's footage, music, characters or logo, and never name the film it was measured from in the video.

## When to choose it

- A release with three to five things to announce, each worth a chapter, and one surprise worth saving for the end.
- The user says "keynote", "launch video like the big AI companies", "kinetic type on white", "New ___ dividers", "one more thing".
- The product has real screens, a site or a terminal to show. With nothing real to show, make the short launch film instead.

It is 16:9 first. On 9:16 the same grammar holds with two-line sentences and smaller words (see Sizes).

## Research before writing

The film is only as true as the material. Before the plan:

1. Read the product's own site or README as a marketer would: headings in order, then the cards, the pricing and the questions. Rotating headlines and card copy are the best source lines. Use the browser you have; take screenshots of the exact parts you will show, at twice the size they will be drawn (three times when the camera pushes far in), and register each with `reelkit assets upload <file> --describe "<what it shows>"`. Hide a cookie banner; never accept one.
2. Write down, from that material only: the name, the one-line promise, the version if there is one, the accent colour (sample it from the primary button or the logo), three to five pillars as one noun each, the proof for each pillar (a screen, a command, a number that is on the site), and the one more thing.
3. Characters: the product's own mascot, avatars or icon tiles. Without them, plain shapes with two dots for eyes. Never another product's.
4. For someone else's product, say so: the result is a concept edit built from public pages, not official material (`reference/rights.md`).

## Colour and type

| Part | Value | Where |
|---|---|---|
| Canvas | `#f5f5f5` with a fine dot grid | the default ground |
| Ink | `#222222` | settled words |
| Muted | `#a9a9a9` | words still arriving |
| Accent | one bright hue, the brand's (`#27aef5` when there is none) | one to three payoff words a sentence, the divider's lead word, arrows |
| Night | `#060708` with a soft lighter middle | dividers, the cold open |
| White | `#ffffff` over a darkening gradient | words on a photograph |

Change only the accent for a brand. One sans face for the whole film at a medium weight (the kit's `fonts.body` at 500, 600 on a photograph); the look depends on large, light, centred words, not on heavy ones.

Sizes, as a fraction of the frame's width at 16:9 (the `size` prop of `KineticSentence`): a statement 0.044 to 0.052, a hero word 0.22 to 0.25, "One More Thing" 0.07, a divider 0.078, a caption under a dock 0.042, a headline on a photograph 0.05. On 9:16 multiply by 1.7 and break sentences into two or three lines with `|`.

## The parts

Seven components carry the look. Search and pull each (`reelkit assets search "<words>" --kind component`, then `reelkit assets pull <id>`), and read the pulled source for its props. When a search does not find one (a component is in the library only after review), write it from its row here, following `reference/component-authoring.md`. The repository's `examples/keynote-launch` is a 48-second film made from them, with their source in its `src/`.

| Part | Search words | What it does |
|---|---|---|
| `KineticSentence` | "kinetic sentence steps" | A sentence that grows in steps: a new word drops in small, soft and grey and settles into ink, the words already there glide to their new centred places. `[words]` take the accent, `|` starts a line, a step may have its own `size` (a giant word that shrinks into a sentence), and `marks` draws a hand circle, underline or strike on one word. |
| `SlotDivider` | "slot divider chapter" | One fixed word and a column of chapter words that rolls to this chapter's. Give every divider in a film the same list. |
| `DotCanvas` | "dot canvas ground" | The porcelain ground, and the night one with a `glow`. |
| `DockLaunch` | "dock launch tiles" | A row of app tiles on a shelf; the product's mark bounces twice like an app opening. |
| `GlassPairs` | "glass pairs cards" | Frosted cards over a photograph: a cause, an arrow, what follows; each pair sinks behind the next. |
| `PillBurst` | "pill burst reveal" | A pill of text that grows word by word, leans and turns dark while coloured shapes spring out around it. |
| `EndMark` | "end mark card" | A dot grows into the mark, the name wipes in and settles from accent to ink, a line fades in under it. |

From the kit: `BrowserFrame` with `tilt={0}` or `TerminalLog` with `theme="light"` for the interface, inside a `Camera` that glides from zoom 1 to 1.2 to 2 on the one detail that matters; `NamedCursor` for a click; `KenBurnsImage` for the photograph (zoom 1.03 to 1.10); `SceneFrame` with `enter="cut"` and `exit="cut"`.

All motion eases out softly and nothing bounces except the dock tile and the burst's shapes. A sentence step needs 18 frames to settle before the next one starts.

## The shape

Each row is one plan scene; a 60-second film is 14 to 16 of them, which is the plan's limit, so a longer film puts several sentences into one scene as steps rather than adding scenes. Lengths are in beats of the track (at 112 BPM a beat is 0.54 seconds).

| Scene | Beats | Ground | What is on screen |
|---|---|---|---|
| Cold open | 4 | night | the mark, then the name (and the version if it has one) |
| Introducing | 3 to 4 | canvas | "Introducing {Product}", the name in the accent |
| Hero word | 5 to 8 | canvas | one verb at hero size, which shrinks into the promise: "{Verb} ... [{the promise}]" |
| Divider | 3 | night | "New {Chapter}" |
| Chapter (two to five scenes) | 4 to 18 each | canvas or photograph | a statement, the interface with a camera push, a dock, a photograph with glass cards |
| ... two to four more chapters, each behind its divider | | | |
| One more thing | 6 | canvas | "One" at hero size, then "One More Thing". The music dips here. |
| Divider | 3 | night | "New {Thing}" |
| Burst | 8 | canvas | "Meet" then "Meet {Thing}!", then the shapes |
| Close | 8 | canvas | a short line that hands the choice to the viewer, with a circle on "You" |
| End card | 8 to 12 | canvas | the mark, the name, the address. Held three seconds or more. |

`reelkit plan check` will say that no scene is under a second. In this film that is right: the shortest scene is a divider of three beats. Say so and move on.

## The words

The words are the narration, so write them as lines to be read once.

- Plain verbs, concrete nouns, present tense. No "revolutionary", "seamless", "next-level".
- Two to seven words a line and two lines at most; three for a list ("Install one. | Run it. | Keep what it makes.").
- One payoff a sentence, in the accent, and the payoff is the benefit, not the product's name.
- The product's own vocabulary: if its site says "Bots", the film says "Bots".
- Divider words are one noun each, from one list that never changes during the film.
- A list that collapses into a claim reads well under a dock: "Plan. Check. Preview. Render." then "One CLI for [all of it.]".
- Cards over a photograph are real pairs: a real command, trigger or schedule on the left and what it really does on the right.
- Every number, label and feature is on the product's site today. What the site calls "coming soon" is called that or left out. No customer or partner is named unless the site names them and the user wants them in.
- What is typed into an interface on screen is a request the product really handles, taken from its own examples.

## Photographs

The calm chapters sit on a bright, wide, empty landscape: a salt flat, a glacier, dunes meeting the sea, an alpine lake, soft clouds. No people, no readable text. Search first (`reelkit assets search "<the place>" --kind image`), pull at 60 percent or more, and give the scene `treatment: "illustration"` so the picture is its image; generate only when nothing fits. Put a darkening gradient over the top third and set the headline in white on it; `reelkit check` will suggest `TextOnImage`, which is the other correct way. Glass cards go over the bright lower half. Add the photograph's row to `ASSET_SOURCES.md` when it has an author.

## Sound

Quieter than the short launch film: this one is carried by the track.

- A steady instrumental at 110 to 130 BPM with a quiet opening and a lift at the end (`reelkit assets search "clean airy electronic product launch" --kind music`). Every scene change is a hard cut on a beat, which the CLI does when the scene lengths are whole beats.
- A low hit on each divider and a tap when its column stops (17 frames in); a pop on the dock's bounce and on each glass pair; a tap on the pen mark.
- **The dip.** From the first frame of "One more thing" to just before the burst, `Music` gets a `dips` entry at 0.1. A reverse whoosh that ends on the burst frame leads back in (give `cueBefore` its real length), then an impact and a shimmer on the burst.
- A shimmer where the name lands on the end card, and nothing else in its last second.
- The sound report will show fewer hits a second than the short film's targets. That is the style; check instead that each divider and the burst has its hit.

## Check before you show it

- Every sentence is whole and inside the frame at its last step, and no step starts before the one before it has settled.
- One accent in the whole film: the same hue on the payoff words, the divider's lead and the arrows.
- The camera's last pose in an interface shot shows the detail whole, with nothing cut by the frame edge.
- Words on a photograph sit on the gradient, not on a bright patch.
- The dividers show the same list each time and stop on the right word.
- The end card is held for three seconds, and its address is the real one.
