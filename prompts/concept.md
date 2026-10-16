# Stage 3a — The concept (the look of this one film)

Every film gets **one visual concept** chosen from its content. It is the style of *every* shot — one ground,
one palette, one family of elements, one type family, one way of moving. Output: `projects/<name>/concept.json`.
The user's named style always wins ("make it like a Vox video", "pixel art", "Apple keynote").

## 1. Find the picture
Ask: *what is this film, as a picture?* One idea in one sentence. A concept that fits any topic
("modern", "futuristic", "tech") is not a concept. Examples:
- A story about hackers → **Terminal**: green-on-black console, typing, glitch cuts, ASCII art.
- The history of coffee → **Travel journal**: sepia paper, stamps, hand-drawn maps, engraving-style photos.
- A fitness tip → **Bold poster**: tall condensed type, one hot colour, hard cuts on the beat.
- A kids' bedtime story → **Watercolour picture book**: soft paper, painted shapes, slow drifts.
- A product launch → **Keynote**: big centred words on a pale ground, product shots with slow camera moves.
- Space facts → **Mission control / blueprint**: navy grid, white line art drawing itself, telemetry counters.
Pick from the style menu in `.claude/skills/video-studio/references/styles.md` (≈80 named looks, each mapped to
the skill that draws it best) or invent one.

## 2. Write concept.json
```json
{
  "name": "Travel Journal",
  "why": "one sentence: why this picture fits this content",
  "look": "the ground, the type, the accent, how photos are treated — two sentences",
  "palette": { "bg": "#EFE6D2", "ink": "#2B2118", "accent": "#C0392B", "accentInk": "#FFF8EC", "muted": "#8C7B66", "paper": "#FBF6EA" },
  "font": "playfairDisplay",
  "bodyFont": "montserrat",
  "imageTreatment": "duotone",
  "ground": { "grain": 0.08, "pattern": "none" },
  "motif": { "type": "voiceline", "y": 0.69, "amp": 62, "color": "accent", "outline": "ink" },
  "captions": { "size": 62, "bottom": 0.19 },
  "elements": ["the 4–7 kinds of element every shot draws from"],
  "motion": "how things enter and leave — one sentence"
}
```
- **palette** — a ground, an ink, ONE accent for whatever must be noticed (markers, boxes, the active caption
  word), `accentInk` = the ink that reads on the accent. Ink on ground ≥ 7:1 contrast. Extra named colours are
  fine (`soft`, `good`, `bad`); shots read them as `c.<name>`.
- **font** / **bodyFont** — at most two families. Either a kit font (`reelkit fonts <mood>` lists them):
  Latin `montserrat bebasNeue unbounded syne outfit playfairDisplay cinzel orbitron jetbrainsMono permanentMarker
  kaushanScript yellowtail lilitaOne modak rye creepster roboto robotoSlab…`; Hebrew (+Latin) `heebo rubik
  secularOne suezOne assistant frankRuhlLibre karantina fredoka varelaRound amaticSC…` — or **any Google Fonts
  family by name** (`"Cairo"`, `"Noto Sans JP"`, `"Russo One"`): `fonts <p>` downloads it. Use a font that
  covers the script: Arabic / Persian → Cairo, Vazirmatn, Tajawal, Noto Kufi Arabic; Cyrillic → Rubik, Montserrat
  (Google), Russo One; Greek → Noto Sans; Devanagari → Noto Sans Devanagari, Hind; CJK → Noto Sans JP / KR / SC;
  Thai → Noto Sans Thai, Kanit (Google). The language default (config/languages.json) is used when `font` is empty.
  Canvas shots read `canvasFont` (a CSS family the canvas page has: the custom font family, or Heebo).
- **imageTreatment** — `bw` (high-contrast black & white, the safe unifier), `duotone` (ink → ground), `none`.
  Footage shots take the same treatment (`bw warm cool muted grain none`).
- **ground** — `grain` 0–0.1, `pattern` `none | dots | grid | lines`.
- **motif** — the thread through every shot: `voiceline` (a live waveform moving with the narrator's voice) or
  `none` (the concept carries its own thread — a recurring shape, a camera path, a character). Off per shot with
  `"motif": false`. Use `none` for films without a narrator.
- **captions** — size (in 1080 units) and position (fraction from the bottom); `plate` (a colour) behind them
  when shots are busy footage; `halo` for a glow.

## 3. The grammar (keep it whatever the look)
Every 0.7–1.5 s a **new element lands on the exact word that names it** — a headline with a marker behind the key
word, a framed photo with a selection box, a counter that ticks to its number, a chart bar, a map pin, a
character's gesture. One recurring thread ties the shots. Hard cuts (or one consistent transition) between shots.
The concept decides the *look*; the grammar decides the *rhythm*.

## Gate 1 line
`🎨 Concept: <name> — <why> · palette ● ● ● · <font>`
