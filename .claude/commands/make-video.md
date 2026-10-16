---
description: One-shot — turn an idea into a finished video (any language, length, shape, style) and send it here
argument-hint: "<the idea, plus anything you care about: language, length, shape, style, voice>"
---

Make this video end to end without stopping for approval, and give me the final mp4 in this chat:
$ARGUMENTS

Follow CLAUDE.md (one-shot mode) and the `video-studio` skill:
1. `node pipeline/cli.mjs doctor` — NOT READY → tell me exactly what to add/allow, nothing else.
2. Brief (prompts/brief.md): decide format, language (the one I wrote in unless I said otherwise), length, shape,
   narrator/voice; `init <name> …` (or resume with `status`).
3. Research if the topic is factual (prompts/research.md).
4. Script (prompts/script.md) → `voice`; fix the length (cut words, `voice --force`).
5. Concept (prompts/concept.md + references/styles.md) → shots (prompts/visuals.md): `shots`, fix every ⚠;
   `fonts`, `elements` (look at them), `clips` for footage/clip shots, `canvas --grid-only` (Read each grid);
   music + SFX (prompts/audio.md).
6. `approve <p> auto "<my request>"` → `frames <p>` → Read the contact sheet, fix what's broken →
   `produce <p> --final` in the background (wait for it).
7. Self-review the final (prompts/editing.md); if something is clearly broken, fix and re-render once.
8. SendUserFile `output/<name>/final.mp4` + a 3-line summary + the post description as ONE copyable block
   (say if a credit is required). Then `cleanup <p>`, commit the project's text files and push.
