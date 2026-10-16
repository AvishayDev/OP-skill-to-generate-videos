# Stage 4 — Produce, review, deliver

Only after Gate 1 (`approve <p> plan`) — or `approve <p> auto "<request>"` in one-shot mode, where you run
`produce <p> --final` instead of the preview and skip Gate 2 (still do the self-review on the final).

1. **Prepare + look** — `frames <p>` (~2 min): voice (reused) → fonts → elements → footage/clips → canvas →
   overlays → music + sfx → Reelkit check + lint + stills → Read `reelkit/out/preview/sheet.jpg`
   (`reelkit-p1/…` for a film in parts). Fix every `check`/`lint` error.
2. **Render** — `node pipeline/cli.mjs produce <p>` (or `--final`), with Bash `run_in_background`; wait for the
   notification, never kill it (~20 min per minute of film; rerunning continues an interrupted render).
3. Voice too long → shorten the script, `voice --force`, re-check `shots` (cue words move), `canvas`/`clips`
   (timing changed), then render again.
4. **Self-review before sending** — frames: `ffmpeg -i <mp4> -vf fps=1/4,scale=270:-2,tile=5x3 -frames:v 1 sheet.jpg`
   and Read it: one concept throughout? every element on its word? captions readable, inside the safe area, not
   covered? right script direction, no □□□ boxes (missing font)? no black frames? Sound:
   `ffmpeg -i <mp4> -af ebur128 -f null -` — the voice must dominate the music. Fix and re-render before bothering
   the user.

## Gate 2 message (review mode)
Send `output/<name>/preview.mp4` with SendUserFile, then:
```
🎬 Preview ↑
⏱ 0:45 · 12 shots (8 reelkit / 2 canvas / 1 footage / 1 clip) · concept: <name>
Approve final?
```

## Stage 5 — Final + delivery
After `approve <p> preview` (or in one-shot mode): `final <p>` exports the phone copy (reusing the master).
Send `output/<name>/final.mp4` with SendUserFile. Then the **post description** as ONE copyable code block:
```
<TITLE IN CAPS — or the series name and today's date for a recurring show>

<1–3 short lines in the film's language: the hook + what they'll learn/see, emoji welcome>

<3–6 hashtags>

<the full content of projects/<name>/credits.txt>
```
If credits.txt lists required credits, say clearly (outside the block) that they **must** stay in the description.
Then `cleanup <p>` (nothing is hosted; it removes temporary render files) and commit the project's text files.
