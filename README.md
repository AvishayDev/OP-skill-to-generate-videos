# OP-skill-to-generate-videos — Video Studio

Many skills combined so Claude can make **any video idea → a finished mp4, sent back in the chat**:
any language, 15 s – 10 min, 9:16 / 16:9 / 1:1 / 4:5, in ~80 visual styles, with its own script, voiceover,
word-timed captions, elements, fonts, music and sound effects.

## Use it
Open a Claude Code session on this repo (Claude app → Code, or claude.ai/code) and just ask:
```
/make-video a 45-second explainer on why the sky is blue, playful, for kids
/make-video צור סרטון של דקה על ההיסטוריה של הקפה, בסגנון יומן מסע
/make-video 30s launch film for my app (link), no narrator, bold poster style, 16:9
```
(or just "make a video about …"). Want to approve the plan and a preview first? `/review-video …`.

## How it works
```
brief (format · language · length · shape · voice) → research (factual topics) → script (hook → sections → CTA)
→ Gemini voice + Whisper word timing → concept (palette, fonts, ground, motif — one look per film)
→ shots, each from the best engine, elements landing on the words that name them:
     reelkit (React motion graphics) · animate-in-code (Canvas 2D hand-made looks)
     stock footage (Pexels / Pixabay) · clips from library skills (HyperFrames, Remotion, Manim, Lottie, 80+ styles)
→ Freesound music + SFX → Reelkit local render (HyperFrames) → phone export → mp4 in the chat
```

| Path | What |
|---|---|
| `CLAUDE.md` | The producer brain: modes, pipeline, rules, data formats |
| `.claude/skills/video-studio/` | **The director skill**: routing, style menu (`references/styles.md`), skill catalog, sound, formats |
| `.claude/skills/reelkit/`, `.claude/skills/animate-in-code/` | The two built-in shot engines |
| `library/` | Third-party video skills (HyperFrames, Remotion, Manim, motion-graphics, iart packs, sound design, Lottie, anidoodle, lemo-opuscar…): `sources.json` + `fetch.sh` |
| `.claude/commands/` | `/make-video` (one-shot), `/review-video` (approval gates) |
| `config/` | defaults: `brand.json`, `voice.json` (Gemini voices), `video.json`, `languages.json` |
| `prompts/` | stage instructions: brief, research, script, concept, visuals, overlays, audio, editing |
| `pipeline/` | the CLI (`node pipeline/cli.mjs`), voice + timing, assets, fonts, clips, Reelkit timeline/render |
| `projects/<name>/` | one video's text files (media is never committed) |

## One-time setup
1. **Keys** (environment settings → environment variables): `GEMINI_API_KEY` (required — aistudio.google.com/apikey),
   `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `FREESOUND_API_KEY` (recommended), `FREEPIK_API_KEY` (optional).
2. **Network access** → Custom, keep the defaults and add: `registry.npmjs.org`, `storage.googleapis.com`,
   `huggingface.co`, `generativelanguage.googleapis.com`, `api.pexels.com`, `images.pexels.com`, `videos.pexels.com`,
   `pixabay.com`, `cdn.pixabay.com`, `commons.wikimedia.org`, `upload.wikimedia.org`, `thumb.wikimedia.org`,
   `freesound.org`, `cdn.freesound.org`, `api.iconify.design`, `fonts.googleapis.com`, `fonts.gstatic.com`.
3. Library skills are fetched when needed (~1–2 min): `library/fetch.sh` (all packs) or `library/fetch.sh hyperframes manim` — pinned commits, each
   pack keeps its own licence.

Check any time: `node pipeline/cli.mjs doctor`. Tests: `npm test`.
