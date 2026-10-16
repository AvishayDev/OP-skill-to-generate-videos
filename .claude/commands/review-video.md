---
description: Review mode — plan a video and stop for approval at the plan (with the voiceover) and the preview
argument-hint: "<the idea, plus language / length / shape / style if you care>"
---

Plan this video and stop for my approval: $ARGUMENTS

Follow CLAUDE.md (review mode) and the `video-studio` skill:
1. `doctor`; brief → `init`; research if factual; script → `voice`; concept; shots (+ `shots`, `elements`,
   `clips`, `canvas --grid-only`); audio.json.
2. **Gate 1**: SendUserFile `audio/voice.mp3`, then the Gate 1 message from prompts/visuals.md. Wait.
3. After my clear yes: `approve <p> plan` → `frames` (Read the sheet) → `produce <p>` in the background.
4. **Gate 2**: SendUserFile `output/<name>/preview.mp4` + the Gate 2 message (prompts/editing.md). Wait.
5. After my yes: `approve <p> preview` → `final <p>` → SendUserFile the final + the post description block →
   `cleanup <p>` → commit the project's text files.
