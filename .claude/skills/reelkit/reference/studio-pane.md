# The studio pane

The skill folder is also a Claude Code mod: `.claude-plugin/plugin.json` names it, `hooks/hooks.json` names its one hooks module, and Claude Code 2.1.287 or newer loads it from the installed skill folder. Older versions and other agents ignore these files.

## Files

| File | What it holds |
|---|---|
| `hooks/register.tsx` | The hooks: the `/reelkit-studio` command, the pane's drawing, the refresh after a `reelkit` command or an edit inside a project. The only file that touches the engine (`$`). |
| `hooks/project.ts` | Reads a project into one `Film` value: `plan.json`, `manifest.json`, `assets/music.json`, `assets/library.json`, `assets/index.json`, `src/*.tsx`, `out/video.mp4`, `out/preview/`. |
| `hooks/timeline.ts` | Draws the timeline: one SVG for the desktop app, the editor and mobile; rows of character cells for the terminal. |
| `hooks/player.ts` | Builds `out/studio.html`, the page **Play with timeline** opens. |
| `types/index.d.ts` | The state the pane keeps (`tab`, `film`, `projects`, `scene`, `component`, `search`). |
| `tests/studio.test.ts` | Run with `claude plugin test <skill folder>`. |

## What it reads and writes

- Timings come from `manifest.json`. Before the voice is recorded there is none, so scene lengths are estimated from the plan and the pane marks them `est.`.
- The filmstrip is cut from `out/preview/NN-<scene>-late.jpg` (or `-early.jpg`) into `out/.studio/<scene>.jpg` with ffmpeg, or `sips` where there is no ffmpeg. No preview frames, no filmstrip: the clips are plain colour.
- It writes only `out/.studio/` and `out/studio.html`. The plan, the composition and the assets are never written by the pane.
- The Browser tab runs `reelkit assets search "<query>" --kind <kind> --json` in the project, so it needs the CLI on the PATH and a login, and it counts against the search throttle like any search.

## Limits

- A pane cannot hold a video or a web page. Playback is the browser page; the pane's timeline shows the selected scene, not a moving playhead.
- Sound effects have no lane: their timing lives in `src/Video.tsx`, not in a file the pane reads. The Music tab lists the ones pulled.
- Up to 24 scenes, 24 components and 12 projects are shown.

## Changing it

Keep every `$` call in `register.tsx`: the engine does not follow `$` into another file, so `project.ts` takes plain functions (`Host`). Draw one string per `Text`. Branch on `e.surface` to know which elements a surface draws (the terminal has no `Svg`, mobile no `Input` or `Select`). After a change run `claude plugin validate` and `claude plugin test` on the skill folder, and `pnpm test` for the drawing and loader tests.
