---
name: captions
description: Use when choosing and placing the spoken-word captions for a video - which caption style fits, how many words per screen, timing, position, contrast and accessibility limits.
---

# Captions

Most short video is watched with the sound off, so the captions carry the message. Captions are drawn by the kit's `<Captions>` component from the scene's word timings (`s.words`); nothing is burned in afterwards.

## First: does the video have captions?

The plan's `captions` field says: `"none"`, `"word"` (one word at a time) or `"phrase"` (a phrase at a time, the default when the field is absent). The user chose it at the Look step. It is in the manifest as `manifest.captions`, so pass it straight through and the composition follows the plan:

```tsx
<Captions words={s.words} group={manifest.captions} mode="pop" highlight={palette.hero} />
```

With `"none"` the component draws nothing; better still, leave `<Captions>` out of the composition altogether. `reelkit check` notes a composition that renders `<Captions>` when the plan says `"none"`, and one that renders none when the plan asks for words.

## What the user's answer means

- "No subtitles": `"none"`.
- "A few words at a time", "a phrase at a time", "a line", or no preference: `"phrase"` (the default). This is the group mode: a few words, never a whole sentence, never one word.
- "One word at a time", "word by word", "like the big pop captions": `"word"`. Only then is a single word shown. Do not pick `"word"` for "a few words": one word at a time is hard to read on a busy picture and the user did not ask for it.

## How words are grouped (`group`)
- `"word"`: exactly one word on screen at a time. Larger text, the most energy.
- `"phrase"`: words are grouped the way they are spoken. A group ends at the end of a sentence (`.`, `?` or `!`: a group never spans two sentences), at a comma or a dash once it has three words, and at a pause of 0.35 s or more between words. It holds at most 3 words by default (`maxWords={4}` for more, up to 6) and about 32 characters; when it must break it does so after a comma or before a short joining word ("and", "of", "to") where it can. Hebrew and Arabic sentence marks work the same way.
- Without `group` (and without `perLine`) the groups are the same as `"phrase"`: 3 words, never one. Only `group="word"` (the plan's `"captions": "word"`) shows one word. `perLine` alone counts the words as it always did; use `group` for every new video.
- `mode` (below) still decides how the words inside the group look.

## Pick one style for the whole video

| mode | What it does | Use for |
|---|---|---|
| `highlight` (default) | A line of words; the spoken one takes the highlight colour | Calm, educational, professional |
| `pop` | One to three words at a time, each popping in as it is spoken | High energy, hooks, punchy lists |
| `karaoke` | A line that fills with colour as it is spoken | Voiceover-led, music, storytelling |

```tsx
<Captions words={s.words} mode="pop" highlight={palette.hero} uppercase />
```

Do not mix modes between scenes. Set `highlight` to the palette's hero colour (captions are the one exception to the one-hero-element rule): any accent works, because the word is on a chip with its own ink; leave it out for a yellow.

## Words per screen
- With `group="phrase"` (or no `group`) the groups are at most 3 words, and about 32 characters, by themselves; `maxWords` raises it to at most 6. With `group="word"` it is one.
- With `perLine` instead: `pop` 1 to 3 words; `highlight` and `karaoke` 3 to 5 words for vertical video, up to 6 for landscape; in Hebrew at most 4.
- Never show a full sentence at once. Word-level timing reads better than sentence captions.

## Timing
- A word lights on the frame it starts, never before. The component does this from the word timings; do not offset it.
- Entrance of a popped word: roughly 80 to 250 ms. A small overshoot is fine for captions; keep it under about 110 percent.
- Reading speed: no more than about 3.3 words per second on screen. If the narration is faster than that, use fewer words per screen rather than smaller text.
- No caption group should flash by in under about 0.25 seconds.

## Position and safe zone
- Vertical video (1080 by 1920): keep captions at least 200 to 300 px above the bottom edge and inside pixels 140 to 940 across (tall phones crop about 100 px from each side); platform buttons and descriptions cover the rest. The component's `bottom` prop (a fraction of the height, default 0.16) controls this.
- Keep the top 150 to 200 px clear as well.
- Captions must never overlap other on-screen text. If a scene has a low headline or a lower-third, raise `bottom` or move the graphic.
- In footage mode, do not cover the subject's face.

## Read them before you show them
- Read every caption as part of its whole sentence, not word by word. A word that is spelled right but is the wrong word ("on" for "an", one Hebrew homophone for another) only shows up in context.
- The captions must say what the narration says, letter for letter. Never tidy a user's wording in the caption alone.
- A number, name or unusual word is where mistakes hide: check each one against the plan.

## Legibility
- Heavy sans-serif weight, large: about 5.5 percent of the width for line captions, 7.5 percent for pop. The component sets these.
- Contrast of at least 4.5 to 1 against whatever is behind, on any ground, with no colour chosen by you: the component puts the words on a dark rounded plate (about 58% opaque) in white, and the spoken word sits on a chip of `highlight` (the accent) with white or dark ink, whichever reads better on it (a `karaoke` fill has no chip: it uses the accent mixed toward white until it reads on the plate). Measured on the render: white ink on the plate is about 5:1 over a cream ground, 5:1 over a bright busy picture and 20:1 over a dark one. Do not set `color` to anything but white, and do not draw your own outline or box.
- `uppercase` suits `pop` and short hooks; avoid it for long lines.

## Emphasis effects, with limits
- Shake: only on a single impact word, amplitude under about 10 px and under 15 percent of the font size, decaying within 0.3 seconds.
- Pulse: scale between 100 and at most 108 percent.
- Never flash anything more than three times a second, and no rapid colour strobing. This is an accessibility limit, not a style choice.

## Hebrew
For Hebrew narration pass `face={font("heebo")}` (or `assistant`, `rubik`) and `rtl` to `<Captions>`. Do not use `uppercase`; Hebrew has no capitals.

## Do not
- Do not add emoji to captions; they ignore the palette and render differently per platform.
- Do not write your own caption component unless the kit one cannot do what the scene needs.
- Do not re-time or paraphrase the words: captions show exactly what is spoken.
