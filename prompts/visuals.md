# Stage 3 — Shot plan

Every shot is a ground + **elements that animate in on the words that name them**, all in the film's concept
(prompts/concept.md). The voice is already recorded, so you plan against the **real** word timing. Output:
`shots.json` + one code file (or clip source) per shot in `projects/<name>/shots/`.

Four kinds of shot — mix them freely, the concept keeps them one film:
| `skill` | What | Made by |
|---|---|---|
| `reelkit` | a React component `shots/<Name>.tsx` (type, cards, UI, phones, charts, photos, counters) | the reelkit skill + the shared kit |
| `canvas` | a Canvas 2D film `shots/<id>.js` (procedural, hand-made, particles, ink, sand, pixels, sketch) | the animate-in-code skill |
| `footage` | a real stock video (Pexels / Pixabay), trimmed, cropped, treated | `search-videos` → `shots.json → videos` |
| `clip` | any video another skill renders: Manim (maths), HyperFrames (400+ registry blocks, GSAP, Three.js, Lottie, shaders), Remotion, Lottie, Blender, p5.js, ffmpeg | the library skills (`.claude/skills/video-studio/references/catalog.md`) → `clips-src/<id>.mp4` |

## 1. Cut the script into shots — 3 to 7 seconds each
Cut wherever the idea changes (typically 4–6 shots per story, ~15 total). For each shot:
- `words` — the exact spoken words where it **starts** (copied from `text`, no tags); omit on a story's first shot.
- `cues` — the beats inside the shot: `{ "name": "word" }` or `{ "name": { "word": "…", "sfx": "pop", "delay": 0.1 } }`.
  Each cue is the frame the word is spoken; the code makes its element land there. **One new element every
  0.7–1.5 s, each on the word that names it** ("Chrome" → the Chrome mark, "250 אלף" → the count lands, "תוקנו" →
  a stamp). `sfx` names a sound in audio.json (pop, whoosh, click, tick, ding, stamp, glass, type… — missing
  ones are auto-picked on Freesound from `config/video.json → sfx.queries`, else add them by hand).
- `intent` — what the viewer must get; `description` — what we see.
- `skill` — `reelkit`, `canvas`, `footage` or `clip` (table above).
- No narrator: cut with `at` (seconds into the segment) or `weight`; cues are seconds (`{ "name": 1.2 }`).
- `images` — ids from the top-level `images` list the shot uses.
`node pipeline/cli.mjs shots <p>` prints every shot's start, length, words and cue times. Fix every ⚠ and every
error (a cue whose word is spoken outside its shot is refused).

## 2. Pick the skill per shot
- **reelkit** (`.claude/skills/reelkit/`, HyperFrames React): layout-heavy shots — type, cards, UI, phones,
  dialogs, counters, grids, photos with selection boxes. Fast to write, crisp, uses the shared kit.
- **canvas** (`.claude/skills/animate-in-code/`, Canvas 2D): anything procedural or hand-made — cracks, particles,
  paper falling, ink, drawing-on lines, charts racing, simulations. Read its `SKILL.md` and
  `references/best-practices.md`; borrow drawing techniques from its `studio/NN_*.html` films, but draw in
  **today's palette** (`PAL`), on today's ground (`paper(c)`).
- **footage**: when real-world motion carries the point (a city, an animal, cooking, sport, nature) and no drawing
  would beat it. `search-videos "<query>" [portrait|landscape]` → add to `shots.json → videos`:
  `{ "id": "waves", "source": { "type": "pexels", "url": "…mp4" }, "start": 2.0, "license": "Pexels licence", "credit": "…", "page": "…" }`
  and the shot `{ "id": "s3-a", "segment": "s3", "skill": "footage", "video": "waves", "treat": "bw" }`. Elements and
  type still land on words — put them in an `overlays.json` entry or follow with a reelkit shot. Footage reads best
  under captions with `concept.captions.plate`.
- **clip**: when a library skill is the best tool for that shot (a Manim proof, a HyperFrames 3D title, a Lottie
  icon animation, a Remotion map). `shots <p>` prints the clip's exact length in frames and seconds and the frame
  size: render exactly that (shorter = last frame held, longer = cut) to `clips-src/<id>.mp4` (or set `"file"`), in
  the concept's palette and font, then `clips <p>`. Commit the clip's *source* (scene .py / index.html) next to it.
Aim for variety: e.g. 60 % reelkit, 2–4 canvas shots, footage/clips where they clearly win.

## 3. Write the shots
### reelkit — `shots/<Name>.tsx`
```tsx
// One line: what this shot shows and on which words things land.
import React from "react";
import { Img, useCurrentFrame } from "reelkit/frame";

// The props every shot gets — fully typed as ShotProps in pipeline/render/reelkit/Video.tsx (a shot may import
// only react and reelkit, so the shared components arrive as `ui`).
type ShotProps = any;

export const Name = ({ cue, c, face, body, img, words, frames, fps, ui }: ShotProps) => {
  const { Pop, BigText, SelectBox, Photo } = ui;
  return (
    <>
      <Pop at={0} from="rise" x={540} y={240}>
        <BigText text="בבית המשפט" color={c.ink} face={face} size={128} mark={[0]} markAt={cue.court} markColor={c.accent} />
      </Pop>
      <Pop at={cue.logo} from="scale" feel="bouncy" x={760} y={960}>
        <SelectBox w={250} h={250} at={cue.logo} color={c.accent} tag="נתבע" tagInk={c.accentInk} face={body}>
          <Img src={img.chatgpt.src} style={{ width: "100%", height: "100%" }} />
        </SelectBox>
      </Pop>
    </>
  );
};
```
- Reelkit rule: a shot imports only `react`, `reelkit/frame`, `reelkit/kit`. The shared kit comes in `ui`:
  `Pop` (whole-element entrance on a cue: rise/scale/drop/left/right/spin, `out` to leave), `At` (place by centre),
  `BigText` (heavy RTL headline lines + marker block), `Tag`, `SelectBox`, `Photo`, `Stamp`, `Bubble`, `Card`,
  `Window`, `Phone`, `Toggle`, `TypeField`, `CountUp`, `Progress`, `TickGrid`, `Doodle` (circle/underline/arrow/
  cross/check drawing itself), `Bot`, `Img`, `KineticLine` (the spoken words 1–2 at a time, each on its frame, sized
  to the width, key words slamming in the accent: kinetic typography), `Push` (camera push + shake on hit frames),
  `chunkAt(words, frame)` (which word group is on screen, e.g. to hard-cut the ground), `prog(frame, at, len)`, `bidi(text)`. Sources and props:
  `pipeline/render/reelkit/*.tsx`. Kit components from `reelkit/kit` (BarChart, DonutStat, Icon…) work too.
- A new reusable element goes into `pipeline/render/reelkit/<Name>.tsx` (self-contained, props-driven, starts with a
  comment) and into the `UI` object in `Video.tsx`; episode-only details stay in the shot file.
- Units: the frame's **short side is 1080 units** — 9:16 = 1080×1920, 16:9 = 1920×1080, 1:1 = 1080×1080, 4:5 =
  1080×1350 (`At`/`Pop` x, y and all sizes in these units). Portrait: keep content between y≈140 and y≈1240 (the
  voice line sits at ~0.69 of the height, captions at ~0.81). Landscape: content in the upper ~70 %, captions low.
- Right-to-left languages (Hebrew, Arabic, Persian): the kit's text components set the direction themselves
  (`BigText`, `Tag`, `Card`…); in your own markup set `direction: "rtl"`; never wrap a line, no masked reveals, no
  vowel points / tashkeel in on-screen text; Latin names and numbers stay LTR (`bidi`). Left-to-right languages
  need nothing special. CJK/Thai: keep lines short, sizes ~15 % smaller.
- TypeScript is checked (no implicit `any` in callbacks — type the parameters).
- `frames`/`fps` = the shot's length; `words` = its spoken words with frames; images arrive as `img.<id>.src`.

### canvas — `shots/<id>.js` (+ `"file": "shots/<id>.js"`)
```js
'use strict';
shotFilm({
  setup: async () => { /* precompute shapes, caches */ },
  draw: (c, t, i) => {                       // c in world units W×H (the film's frame), t = seconds into the shot
    paper(c);                                 // today's ground
    text(c, 'מדד הקולות', 540, 235, { size: 120, weight: 900 });
    marker(c, 540, 238, 560, 120, p(t, 'index', .25));   // grows on the cue "index"
    if (IMG.logo) c.drawImage(IMG.logo, 400, 600, 280, 280);
  },
});
```
Globals: `W H RTL FPS DUR NDRAW`, `SHOT` (`cue`, `words`, `dur`), `PAL` (palette), `IMG` (images), `cue(name)` (s),
`p(t, name, len)`, `since(t, name)`, `onTwos/onThrees`, easing (`eOut eIn eIO eBack prog clamp lerp rng`),
`text`, `marker`, `photo`, `selectBox`, `rr`, `paper`, plus the skill's `layer()`/`mkCanvas()`. Optional skill
kits: `"kits": ["overlay/doodle-kit.js"]` for brush-pen doodles. Pure function of `t`; draw on twos where the
medium wants it. `node pipeline/cli.mjs canvas <p> --grid-only` → Read `frames/<id>-grid.jpg`; the full render
(`canvas <p>`) makes `clips/<id>.mp4`, cached until the code or timing changes.

## 4. Images for elements (free stock only)
`search-photos "<query>"` (Pexels + Pixabay + Commons), `search-pixabay "<q>" vector|illustration`,
`search-logo "<company>"`, `search-images "<q>"`, `search-icons "<q>"`. Add to `shots.json → images`:
```json
{ "id": "gavel", "source": { "type": "pixabay", "url": "…" }, "treat": "bw", "license": "Pixabay Content License", "credit": "qimono / Pixabay", "page": "…" }
```
Then `node pipeline/cli.mjs elements <p>` downloads + treats them (`elements/<id>.png`) — **look at them** (a
wrong photo behind a right title is common). Pixabay URLs expire within a day: run `elements` right after picking.
Logos: Commons PNG renders keep transparency. Real people only from official/press material of that event.
Allowed licences as always (no NC/ND); every image needs `license`, `credit`, `page`.

## 5. Look before you render
`frames <p>` (Reelkit check + lint + stills) → Read `reelkit/out/preview/sheet.jpg`: ground and palette identical
across shots, nothing over the captions, text inside the frame, elements present on their words.

## Gate 1 message (review mode — phone-sized)
Send `audio/voice.mp3` first (caption: "🎙 The voiceover — Xs"). Then:
```
🎯 Brief: <format> · <language> · <aspect> · ~Xs
🎨 Concept: <name> — <why>
🎙 Script (~N words · Xs): <script>
🎬 Shots: N (reelkit a / canvas b / footage c / clips d)
1. 0:00 story1-a — <description>
…
🎵 Music: <name> · 🔊 SFX: pop, stamp, …
Approve? (yes / changes)
```
