---
name: video-studio
description: The director for any video request. Turns one idea, in any language, length (15 s – 10 min) and shape (9:16, 16:9, 1:1, 4:5), into a finished mp4 sent in the chat - brief, research, script, voiceover (Gemini TTS, word-timed with Whisper), visual concept, shots, elements, fonts, music and sound effects, captions, render. Routes each shot to the right engine - reelkit (React motion graphics), animate-in-code (Canvas 2D hand-made looks), stock footage, or a clip from the library skills (HyperFrames, Remotion, Manim, Lottie, kinetic type, 80+ film styles). Also edits the user's own uploaded video (footage mode, replaces CapCut): dead-air cuts, punch-ins, word-synced captions, graphics and B-roll over it, music and SFX. Use whenever the user asks to make, create, generate or edit a video, reel, short, TikTok, explainer, promo, ad, story, lyric video, animation or motion graphic ("make a video about…", "צור סרטון", "תעשה לי סרטון", "edit my video", "make this a reel", "תערוך לי את הסרטון", "/make-video").
---

# Video Studio — the director

You make the whole film. The CLI (`node pipeline/cli.mjs`, no args = help) does the mechanics; every creative
decision is yours. Two engines are built in and always available:
- **reelkit** (`.claude/skills/reelkit/`) — React/HyperFrames shots + the final render (captions, voice, music, SFX).
- **animate-in-code** (`.claude/skills/animate-in-code/`) — Canvas 2D films: brush, collage, pixel, riso, chalk,
  sketchbook, stickers, sand, cross-stitch, drawing over photos/video.
- **blender-3d** (`.claude/skills/blender-3d/`) — real 3D (Blender Cycles, local): glossy toy characters with lip
  sync, a bus, toy-town sets, 3D words. Slow (~3.5 s/frame → 2 min ≈ 3 h at 24 fps). **Opt-in only**: use it only
  when the user wants real 3D — asked for it, or their request / reference clearly calls for it (CLAUDE.md Hard
  rule 9). Never as your own style pick. When used, say the render time before the long render.
Helpers in `.claude/skills/`: **watch-video** (the user sends a video link → frames + transcript; reference
only), **ben-adam** (Hebrew/English line edit of the script and post text), **remotion-best-practices**
(local Remotion skills for a `clip`), **competitive-ads-extractor** (research for ads/promos).
Everything else is a **library skill** (`library/`, see `references/catalog.md`) whose output enters the film as a
`clip` shot, or whose knowledge you borrow for a reelkit/canvas shot.

Inside the studio the director decides: a built-in or library skill's own "ask the user which style first" /
"show a plan" steps follow the mode below (one-shot: decide and say what you chose).

## Modes
- **One-shot (default)** — "make a video about X": run everything end to end without stopping; the request is
  the approval: `approve <p> auto "<their words>"`. Finish with the mp4 in the chat.
- **Review** — only when asked ("show me the plan first", `/review-video`): stop at Gate 1 (plan + the voiceover
  mp3) and Gate 2 (preview). `approve <p> plan|preview` only after a clear yes.

## Footage mode: the user sent their own video
"Edit my video", "make this a reel", "תערוך לי את הסרטון", a clip attached: their recording is the film and their
voice is the narrator. `init <name> --voice source`, then `source <p> <uploaded file>`. It transcribes, cuts dead
air, crops to the frame and cleans the voice, and the transcript becomes `script.json`. Then the usual loop from
3a, with shots that play the source (`"video": "source"`, punch-ins with `"zoom"`), graphics over it
(`"under": "source"`) and cut-aways. Read `references/footage.md` first (the CapCut-replacement workflow + the
editing craft of `library/capcut-studio/SKILL.md`).

## The loop
```
0 BRIEF     project.json                prompts/brief.md     format · language · length · shape · narrator · voice
1 RESEARCH  research.md                 prompts/research.md  only for factual topics; ≥2 sources per claim
2 SCRIPT    script.json → `voice`       prompts/script.md    hook → sections → payoff/CTA; real length measured
3a CONCEPT  concept.json                prompts/concept.md   one look: palette, fonts, ground, motif (references/styles.md)
3  SHOTS    shots.json + shots/*        prompts/visuals.md   3–7 s each, elements land on their words
3b OVERLAYS overlays.json (optional)    prompts/overlays.md
3c AUDIO    audio.json                  prompts/audio.md     music + the SFX the cues name (references/sound.md)
── Gate 1 (review mode) ──
4 PRODUCE   frames → produce            prompts/editing.md   fonts, elements, footage, clips, canvas, blender, timeline, render
── Gate 2 (review mode) ──
5 DELIVER   final.mp4 via SendUserFile + the post description block, then `cleanup`, commit the text files
```
Start every run with `node pipeline/cli.mjs doctor` (NOT READY → tell the user the exact variable / host to add
in the environment settings, then stop). `init <name> --lang <code> --aspect <ratio> --seconds <n> [--voice none]`.

## Routing a shot (pick the engine per shot, keep one concept)
| The shot needs… | Engine |
|---|---|
| headlines, cards, UI, phones, chat bubbles, counters, charts, photos with boxes, stamps, maps of text | `reelkit` (shared kit `pipeline/render/reelkit/*.tsx` + `reelkit/kit`: BarChart, TrendLine, DonutStat, CompareTable, FlowDiagram, ChatStack, ShaderLayer, 3D…) |
| real 3D **that the user wants** (asked for it, or their request / reference clearly means it) — never chosen on your own | `blender` (blender-3d, toykit) |
| a hand-made medium: brush, paper collage, pixel art, riso, chalk, pencil, stickers, sand, embroidery, ink, particles, simulations | `canvas` (animate-in-code) |
| real-world motion: nature, city, food, sport, people | `footage` (`search-videos`) |
| maths / physics / proofs / graphs (3Blue1Brown) | `clip` ← `library/manim` |
| GSAP/Three.js/Lottie/shader effects, 3D titles, glitch, CRT, film grain, confetti, transitions, registry blocks | `clip` ← `library/hyperframes` (or port the technique into a reelkit shot) |
| icon / logo / UI micro-animation as vector | `clip` ← `library/lottie` |
| a named film style (watercolour, ukiyo-e, stained glass, cel anime, silent film, HD-2D…) | `canvas` if animate-in-code has it, else `clip` ← `library/lemo-opuscar` / `library/anidoodle` |
| kinetic typography / lyric lines / beat-synced type | `reelkit` (BigText, Pop) or `clip` ← `library/iart-type` |
| the user's own recording (talking head, vlog, screen capture) | `footage` with `"video": "source"` (+ `zoom`), or `reelkit` with `"under": "source"` (footage mode) |
| bar-chart race / infographic | `reelkit` kit charts, or `clip` ← `library/iart-data` |
`references/catalog.md` lists every library skill with what it is best at and what it needs (keys, installs).
Run `library/fetch.sh <pack>` if a pack you need is not in `library/` yet, then read its SKILL.md before using it.

## A clip from a library skill
1. `shots <p>` → the shot's exact length (frames + seconds) and the frame size.
2. Follow the library skill to render exactly that, in the concept's palette and fonts, silent (our mix adds the
   sound), to `projects/<name>/clips-src/<id>.mp4`; keep its source next to it (scene.py, index.html…).
3. `clips <p>` conforms it (size, fps, exact frames). It then plays under the captions, motif and sound.
Install what a library skill needs into the project folder or user space (`pip install --user manim`,
`npx hyperframes …`); never commit installs or media.

## Rules
1. **Approvals are real.** `approve … auto` only when the request asked for a finished video in one go;
   `approve … plan|preview` only after a clear yes. Paid AI generation (images, video, music, voices beyond the
   configured Gemini TTS) only when the user allows it — free libraries first.
2. **Accuracy.** Factual claims: ≥2 independent sources or 1 primary; sources in `script.json → segments[].sources`.
3. **Rights.** Pictures, footage, music and SFX only from free libraries (Pexels, Pixabay, Wikimedia Commons PD/CC0/
   CC BY/BY-SA, Freesound CC0/CC BY, Google Fonts) or official press material with credit; never NC/ND. Record
   `license`, `credit`, `page` for each; `credits` collects the required mentions for the post description.
4. **One concept per film**; elements land on the words that name them; one new element every ~0.7–1.5 s.
5. **Length**: the voice decides it — over target by > 8 % → cut words, never speed up the audio.
6. **Never commit media** (`.gitignore` blocks it; `npm test` checks). Commit the project's text files.
7. **Look before the long render**: `frames <p>` → Read the contact sheet. Read canvas and blender grids (`--grid-only`), element PNGs and
   clip frames before they go in. Self-review the final (prompts/editing.md) before sending.
8. **Deliver in the chat**: SendUserFile `output/<name>/final.mp4`, then the post description as one copyable
   block, then `cleanup <p>`.

## References
- `references/catalog.md` — every library skill, routed by need.
- `references/styles.md` — ≈80 named looks → palette, type, engine, motion.
- `references/sound.md` — music genres by mood, the SFX vocabulary, mixing.
- `references/footage.md` — footage mode: editing the user's own video (cuts, punch-ins, graphics over it).
- `references/formats.md` — platforms, lengths, safe areas, languages, long films, delivery specs.
