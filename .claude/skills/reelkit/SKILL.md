---
name: reelkit
description: Produce short-form and explainer videos from an idea plus the user's own screenshots, logo, clips or footage. Searches a shared asset library first, generates only what is missing, and renders locally with HyperFrames. Use when the user wants to create, edit or assemble a video, turn an app or idea into a demo, or make a promo.
---

# Reelkit

You make the video. The `reelkit` CLI gives you the tools: it holds no model and makes no creative decisions. You write the plan and the motion code yourself and check them with the CLI. Show the plan and preview for approval when those decisions are still open; an explicit request to render, or approval already given in the conversation, authorizes that work. For a scoped edit or integration test, continue from the existing project instead of restarting the creative briefing.

Read the material before choosing a treatment. Own routine editing decisions and explain the few that matter: the hook, visual thread, pacing and music direction. Ask only when missing information would materially change the result. Respect the user's chosen style and message; quality comes from a purposeful edit, not a quota of cuts, animations or effects.

For footage, talking heads, screen recordings, mixed media, or an open creative brief, read `reference/studio-editing.md`. It explains how to choose the approach and what this CLI can actually edit. For final verification and platform variants, read `reference/delivery-review.md`.

For image or video cutouts, editable Blender product shots, custom 3D materials, or native Higgsfield motion workflows beyond the kit, read `reference/higgsfield-production.md`. It maps the external tools, their connection requirements and the inspected media handoff back to Reelkit.

To implement a chosen style, read its row in `reference/style-recipes.md` for action, timing, sound and proof. `reference/style-components.md` maps the shared components and built-in kit to shot roles; inspect the selected source before using its props.

This skill targets `reelkit-cli` 0.18.3 and its HyperFrames kit. **Start every session with `reelkit update`.** When it says a newer version is published, run the command it prints (`npm install -g reelkit-cli@latest && reelkit install`) before anything else, then read this skill again: it changed with the CLI. Any other command that ends with a line saying a newer version is published means the same: update, then continue. If the update cannot be installed, tell the user and continue with the installed version. Check the installed version with `reelkit --version`; in a source checkout, invoke its `bin/reelkit.mjs` with Node. Use the matching CLI before authoring with `reelkit/frame`.

## What decides whether the film is accepted

A render that looks finished can still be refused. These are the checks that decide it:

1. A close recreation is measured from the reference's frames, not from memory (`reference/reference-recreation.md`). The reference and the film are different clocks: `reelkit clock` converts one into the other.
2. What a word names is on screen when that word is said. After a line is replaced, measure the new onset (`reference/voice-sync.md`) and move only that caption.
3. `reelkit lint`, and `reelkit lint --no-video` before a render, reports lettering cut by the frame, a flash that hides a held shot, a shot that is never drawn, Hebrew with no direction, and vowel points in on-screen text. Open the frames it names. Lettering that sits on a photograph is a blind spot of the edge check.
4. After the first render, a revision changes only what was asked. `reelkit render --allow <frames>` fails when anything else moved (`reference/revisions.md`). `reelkit diff old new --allow <frames>` is the same check after the fact.
5. The file you send is an export, not the master. Use `reelkit export --preset iphone`, `reelkit export --preset phone-720` or `reelkit export --preset chat`, and only when every row of the table passes (`reference/delivery.md`).
6. A wrong word in the narration is fixed in that line, not by recording the film again (`reference/voice-fixes.md`). `reelkit tools` prints the voice scripts, and the image scripts of `reference/image-sets.md`.
7. A file you did not make gets a row in `ASSET_SOURCES.md` when it enters the project (`reference/rights.md`).

`reelkit render --chunk` keeps finished pieces of a long film and continues from them. `reelkit render --guard previous` compares the new render with the one it replaced.

Every command takes `--json` for machine-readable output and exits non-zero with a one-line reason when something is wrong. Read the reason and act on it.

## Setup (once per machine, then once per video)

Local checks, previews and renders need no account.

1. For work that searches or pulls the shared library, generates media, or records voiceover, run `reelkit whoami`. If it says you are not logged in, run `reelkit auth login --start` (it returns at once and never opens a browser; plain `reelkit auth login` would wait for a person and block you). Show the user the link it prints (the code is already in it) and wait for them to say they have approved it, then run `reelkit auth login --finish`. If that says it is not approved yet, ask the user again and re-run it. (Plain `reelkit auth login` opens a browser on the user's machine when run in a terminal; `--no-browser` stops that. Still prefer `--start`.)
2. Run `reelkit init <project-name> --aspect 9:16` (`16:9` or `1:1` for other shapes), then work in the folder it prints.

The folder holds everything: `plan.json`, `assets/`, `src/` (your composition and any components you pull), `out/`.

## The loop

### 1. Inputs
Find out what the video is about and collect what the user has. Ask for nothing you can infer. On a machine you have not made a video on before, or when a command fails in a way that is not about your code, run `reelkit doctor`: it says what is missing (ffmpeg, a browser, a sign-in, disk space) and changes nothing.

When the video is about a product that has a public page, the real product is the subject: capture it instead of redrawing it. `reelkit assets shot <url>` saves the page as a sharp picture in the project (`--scroll 0 900 1800` for several places down the page, `--full` for all of it, `--mobile` for the phone layout, `--dark`, `--hide "<css selector>"` for a cookie banner or a chat bubble). Look at each picture before using it. A page behind a sign-in needs the user: `reelkit assets shot <url> --login` opens a window for them to sign in themselves, and you never type a password. Capture only pages the user has the right to show, and first check on the product's own site that what you were told exists and is released: a feature that is only rumoured is not shown as real.

For each file the user gives, look at it, then register it with a description of what it shows:
`reelkit assets upload ./logo.png --describe "Acme logo, white wordmark on blue"`
Add `--footage` for a video the motion design should be laid over. User files stay on this machine. A video of someone or something on a plain background can be made transparent: `--green` keys a green background locally for free, and `--cutout` removes any background on the server (the video is sent to Reelkit, so ask first; see `reference/clips.md`).

If the user points at an existing video ("make one like this", a link or a file), it is a reference: you learn how it is built and make something new in that spirit. Read `reference/references.md`, then `reelkit ref download <url-or-file>` and `reelkit ref analyze <id>`, and look at the frames it saves. Take its structure, pace and motion; never its footage, music or words. A link is fetched on the user's machine and they are responsible for the right to download it; ask before running `reelkit ref analyze` without `--no-transcript`, because the audio (never the video) is sent to Reelkit to be transcribed. When the brief is to follow that video cut for cut, also read `reference/reference-recreation.md` and keep the two clocks apart with `reelkit clock`.

When a file that neither you nor the user made enters the project (a clip, a photo, a logo, music), add its row to `ASSET_SOURCES.md` then, not at the end (`reference/rights.md`).

### 2. Look
Read `reference/styles.md` for techniques that fit the material (its "Locked looks" give a ready palette and headline face when the user has no brand colours), and `reference/art-styles.md` when the picture should be drawn. Recommend a direction with a short reason; present a catalogue only if the user asks to compare looks. If they already described what they want, use it. Bundle only consequential open questions. If any on-screen text will be Hebrew, read `reference/hebrew-rtl.md` now: it changes how words may enter and how lines are written.

Infer whether the video needs a narrator from the request and source. Ask only if that choice is consequential and still unclear. For a product, feature or brand launch carried by music and sound effects, follow `reference/launch-film.md` and write `"voice": "none"` in the plan; skip voice generation. When that film is the long keynote kind (a whole release in chapters, large centred words on a pale ground, "New ___" dividers, a "one more thing"), read `reference/keynote-film.md` as well. Existing recorded speech needs the footage workflow in `reference/studio-editing.md`, not a replacement narrator.

Honor the requested captions: none, one word at a time (`word`), or a few words at a time (`phrase`, the default for generated narration). "A few words at a time" is `phrase`, never `word`; see `reference/captions.md`. Use no speech captions in a silent film. Write the choice into the plan as `captions`.

When the central visual idea is still open, read `reference/continuity.md` and propose the strongest fitting concept. If the user wants alternatives, offer up to three concepts, each one sentence about the picture and what carries the changes. If they already chose a concept or asked for a scoped revision, use that direction. Write the chosen idea into the first scene's `notes` beside the look.

When the look is open and the film matters (a launch, a brand film, anything the user will pay attention to), show the choice instead of describing it: build the film's strongest frame in three clearly different directions, one of them unexpected for this product, as one still each (a throwaway scene, `reelkit preview`, keep the frame), and put them side by side for the user to pick. Three near-identical frames are not a choice. Skip this when the user named the look, when it is a revision, or when they said to decide for them.

### 3. Plan
For a film with no narrator, write the plan in the launch-film shape (`"voice": "none"` and a `seconds` for every scene, see `reference/launch-film.md`) and skip the voice choice below.

Read `reference/scriptwriting.md` and `reference/scene-treatments.md` (and `reference/clips.md` if a scene needs a video clip). Write the chosen look into the first scene's `notes`. For generated narration, run `reelkit assets voices` and choose a voice that fits the language, tone and user's preference. Reuse an already chosen voice. Offer a short comparison only when the user asks or the voice is a consequential open decision; do not require a gender mix. For Hebrew, consider voices marked `he` first.

Use the real material already supplied: screenshots, footage, numbers, logo and exact names. Ask for a missing item only when the shot depends on it. Demonstrate product claims with real screens and interactions (`reference/kit.md`, "Act the product out"); a personal story or documentary does not need an invented product surface. Keep a small number of main ideas, state the intended duration and visual thread in the first scene's `notes`, and choose grounds by meaning and contrast. A short promo often fits 15 to 40 seconds; honor a different requested length. A film with a narrator-less launch shape also follows `reference/launch-film.md`.

Write `plan.json`:

```json
{
  "title": "string",
  "aspect": "9:16",
  "mode": "motion",
  "voiceId": "an id from reelkit assets voices",
  "pace": "normal",
  "gap": "normal",
  "scenes": [
    {
      "id": "hook",
      "narration": "the words spoken in this scene",
      "treatment": "motion-graphic",
      "onScreenText": ["up to three short items"],
      "imagePrompt": null,
      "clipPrompt": null,
      "shareable": false,
      "imageTags": [],
      "userAssetIds": [],
      "notes": "visual direction for yourself when you write the code"
    }
  ]
}
```

- 3 to 8 scenes with generated narration; 3 to 16 with `voice: "none"`. These are current plan-schema limits, not an ideal number of edits. Scene ids are short, unique, lowercase with dashes.
- `treatment` is `motion-graphic`, `illustration`, `clip` or `footage-overlay`. With footage, `mode` is `"footage"` and every scene is `footage-overlay`; otherwise `mode` is `"motion"` and no scene is.
- `imagePrompt` is set only for `illustration` scenes, with 3 to 6 `imageTags`. Set `shareable` to true only when the prompt is fully generic: no brand, product, person or detail specific to this user.
- `clipPrompt` is set only for `clip` scenes (a generated or reused video clip is the scene's picture; the rest of the scene uses `imageTags` and `shareable` as an illustration does). Clips are scarce: most videos have none or one or two.
- `userAssetIds` lists the ids of the user's files shown in that scene.
- `pace` is `slow`, `normal` or `fast`: how fast the voice speaks.
- `gap` is the silence between one sentence and the next: `tight` (0.2 s, for a promo), `normal` (0.3 s, the default) or `relaxed` (0.5 s, for a calm or emotional film). The film's length follows from it: `plan check` estimates it and `reelkit assets voiceover` prints the real one.
- `captions` is `none`, `word` or `phrase` (a few words, up to 3, never spanning two sentences), as the user chose; leave it out for `phrase`. The manifest carries it: `<Captions group={manifest.captions} />`.
- When the video follows a reference, add `"reference": { "id": "<id>", "take": ["fast cuts every ~1.2s"] }` (1 to 6 notes on what you took).

Run `reelkit plan check`; it prints the estimated length to tell the user. Fix everything under "Fix these". Act on "Worth improving" unless you have a good reason not to.

**Checkpoint.** Tell the user, in one sentence, that new components you write are shared with the Reelkit library for review after the render (their code, a description and an example, nothing else), and that they can say no: then use `reelkit init <name> --private` (it also keeps the images, clips and graphics generated for the video out of the library, whatever `shareable` says) or `reelkit render --no-share`, or set REELKIT_NO_SHARE=1. Show the user the look, the title, the estimated length, and each scene's narration, the exact on-screen text and one line on the visual, in plain words about what they will see. If the plan is not already approved, wait for a clear yes. A question or a comment is not approval; answer it without treating it as permission to render.

### 4. Voice
For generated narration only, run `reelkit assets voiceover --all`. It records each scene and prints the real length of the video. If the user wants a different voice, change `voiceId` in `plan.json` and run it again with `--redo`.

### 5. Images and clips
Read `reference/asset-reuse.md`, and `reference/image-sets.md` when the film has two or more generated pictures or needs the user's real screen placed in a photograph. For each illustration scene, search first:
`reelkit assets search "<what the scene needs>" --kind image`
Each result starts with a match percentage: how likely it is good enough to reuse. Pull the best result (`reelkit assets pull <id> --scene <sceneId>`) when its match is 60% or more and, reading its description, it fits the scene. Otherwise generate: `reelkit assets gen image --scene <sceneId>`. Never give two scenes the same image. For an icon, a mark or a diagram that must stay sharp, `reelkit assets gen svg "<prompt>"` makes a vector graphic instead (see `reference/asset-reuse.md`).

For each clip scene, read `reference/clips.md`, then search `reelkit assets search "<what the clip shows>" --kind clip` and pull a 60% match (`reelkit assets pull <id> --scene <sceneId>`), or generate: `reelkit assets gen clip --scene <sceneId>` (add `--green` for a green-screen subject). It waits for the clip, which takes minutes; check what is left with `reelkit whoami`.

### 6. Composition
Read `reference/hyperframes-composition.md` for the seekable HyperFrames timing and media rules. Consult `reference/kit.md` for the components you need, `reference/motion-design.md` and `reference/continuity.md` for new shots (write the seam ledger it describes before the code), `reference/captions.md` when adding captions, `reference/beat-sync.md` for music timing, and `reference/voice-sync.md` for narrated visuals.

- **Fit the picture to the voice** (narrated films; the whole method is in `reference/voice-sync.md`). The voice is the clock: write the narration first, record it (step 4), and only then place visuals from the real word times with `onWord(s, "word")` (the frame to start an entrance so it lands on its word; `wordFrame` is the word's own frame, `onWordBeat` lets it land on a beat only within 3 frames after the word). Never count words by hand. One visual event per stressed word and at most one every 0.5 s; the thing a word names is on screen within 3 frames of the word starting, never before the previous sentence ends; numbers count up to finish on their word; a list ticks on each item's word; scene changes fall in the gaps between sentences, never inside one; the last word of a sentence is held for the gap, not longer; sound effects for a word's visual sit under the voice at 0.3 or less. `reelkit check` fails on a word the scene never says, and `reelkit preview` renders a frame 4 frames after each word you timed: each of those should already show the thing that word names.
- Choose the music before you write the composition, and read `reference/beat-sync.md`: `reelkit assets search "<mood and tempo>" --kind music`, then `reelkit assets pull <id> --music`. Scene changes then land on its beat by themselves; bring each element in on a beat inside a scene as that file shows.
- Search the library before writing a component: `reelkit assets search "<what it shows>" --kind component`. To use one, `reelkit assets pull <id>`: it lands in `src/` and the command prints the import line and an example.
- When the brief is open ("make it impressive", a launch film, a showreel) and you want to see how others asked for such a video, search the prompt gallery: `reelkit assets search "<kind of video>" --kind prompt`, then `reelkit assets pull <id>` to read the whole prompt in `prompts/`. These are other people's prompts with their author and source: borrow the structure (what they specified: length, beats, style, constraints), never the wording, and never show one in the film. Prompts appear only with `--kind prompt`.
- Read `reference/sound-design.md`, then find the few sounds the video needs: `reelkit assets search "whoosh" --kind sfx`, `reelkit assets pull <id>`. The pull prints how to reference the file.
- When a scene has to make a number, a comparison, a process, a correction or one detail of a screenshot understood, read `reference/explain-graphics.md` and use the kit's `BarChart`, `TrendLine`, `DonutStat`, `CompareTable`, `FlowDiagram`, `ChatStack`, `CopyCorrection` or `Callout`. Choose by what changes on screen; they refuse more content than can be read and say what fits.
- For a brand reveal, a transformation, or a shot with real depth, read `reference/brand-motion.md` and `reference/three-d.md`. Choose the move by what it explains, preserve the supplied identity, and share its event frames with the sound cues. Keep reading-heavy shots in 2D; a requested brand film or showreel may use several purposeful 3D moments.
- For what sits behind the whole film (a video, a picture that changes, or an animated ground), read `reference/backgrounds.md`; pick one ground and keep it.
- For a ground, a light, a texture, a stylize pass or a wipe drawn on the GPU (an aurora, liquid metal, real film grain, halftone), read `reference/shaders.md` and use the kit's `ShaderLayer`. It downloads its engine on first use and needs WebGPU, so keep a plain colour behind it and check the preview frames.
- Before writing a new component, read `reference/component-authoring.md`.
- **Build the film from component files, not one long `Video.tsx`.** Every drawn part that could appear in another film (a text reveal, a card, a character, a chart, a cursor, a shape that morphs, a field of particles) is its own file in `src/`, driven by props, with the comment that describes it. `Video.tsx` keeps only what belongs to this film: the palette, the words, the frame numbers, where each part sits in each scene, and the sound. A helper declared inside `Video.tsx` that returns JSX and holds none of this film's words is a component that was not split out; move it. A film of several scenes should end with several component files, and they are what the user reuses in the next video and what a template shows as its parts.
- Write `src/Video.tsx` and any component files beside it. `Video.tsx` may import only `react`, `reelkit/frame`, `reelkit/kit` and sibling components (`./Name`).
- Run `reelkit lint --no-video` together with `reelkit check`. It reads the source: right-to-left text with no direction, vowel points in on-screen text, a sequence that starts after its parent ends, and a shot written on a range the film never draws.
- `manifest.json` is the exact object passed to `Video` as the `manifest` prop. Media is referenced as `urls[path]`, where `path` is the file's path in the project, such as `urls[scene.voiceoverKey]` or `urls["assets/lib/<id>/clip.mp3"]`.

Run `reelkit check` and fix every error. Treat "Worth improving" notes as diagnostics: a deliberate cut or a calm shot can be correct. Run `reelkit preview` (the first preview on a machine may download a browser), inspect the contact sheet and each scene's early, late, word-timed and boundary frames. Check cropped or overlapping text, phone readability, missing media, hidden layers, false claims and identity changes. A mid-animation frame is not a defect by itself; inspect the landing and hold. Fix observed problems, then recheck changed shots. Repeat only for a change or unresolved defect; finish with `reference/delivery-review.md`. Continuity notes should prompt a reason for a cut, not force every shot to morph.

Use frames to inspect layout and the moving video to judge timing and sound when playback is available. `reelkit preview` writes `out/preview/sheet.jpg`, one labelled picture of all of them: look at it first, then at every frame singly. And whoever built a video is the worst judge of it. If independent review is available and authorized, give the reviewer the original request and the preview frames without your explanations. Ask for observable defects and concrete fixes: a cropped logo, unreadable label, missed landing or unintended empty state. Fix those defects and recheck the changed shots; stop iterating when the requested result is achieved.

For a close recreation, score each scene against the reference on timing, layout, type, motion and legibility, and keep that table in the project. A scene under 80 is not finished: say which part is short (`reference/reference-recreation.md`). That score is the recreation habit. It is not a quota for an ordinary film (`reference/delivery-review.md`).

**Checkpoint.** Show the preview frames when the user is choosing the final treatment. If they have already approved rendering or explicitly requested this edit and render, continue within that scope. For requested changes, edit the code, run `reelkit check` and `reelkit preview`, and inspect the updated frames.

### 7. Render
`reelkit render`. A browser that fails to start or drops its connection is tried again; an error in the composition is not. The render counts as done only when the file is on disk, decodes from end to end and holds every frame. For a film of about a minute or longer, `reelkit render --chunk` renders in pieces of 300 frames (pass a number to change the size). Finished pieces are kept: run the same command again to continue. The render this one replaces is kept as `out/previous.mp4`.

Run a long render as one background job and stop that job by its process id. Do not use `pkill -f`, which also kills the shell that started it.

Then `reelkit lint` on the finished film and open every frame it names. It does not see lettering that sits on a photograph: look at those shots yourself.

If the render fails, read the error, fix the composition, and run `reelkit check` before rendering again. Give the user the path it prints.

Verify the finished film using `reference/delivery-review.md`; previews alone do not prove audio presence or synchronization. Report the deliverable path, the main creative choices and any verification limitation. Create extra platform variants only when requested or necessary for the stated destinations.

### 8. Deliver
`out/video.mp4` is the master. HyperFrames already writes it as `yuv420p` in TV range, tagged BT.709. It is still not the file to send: the profile and level are not pinned, and the size is not a chat copy. `reelkit export --preset iphone` is the full-quality phone copy, `reelkit export --preset phone-720` a lighter one, `reelkit export --preset chat` a small one. Send a file only when every row of its table passes. The checks are in `reference/delivery.md`. What to look at in the picture and the sound stays in `reference/delivery-review.md`.

## After the first render
A later version is read against the one before it. Restate the request as the frames it may touch, then `reelkit render --allow <frames>` (`reference/revisions.md`). A narration line that is wrong is replaced in that line only (`reference/voice-fixes.md`): do not record the rest of the film again, and do not pick a take the user asked to hear.

## The studio pane

In Claude Code 2.1.287 or newer this skill also loads a mod (`hooks/register.tsx`, read `reference/studio-pane.md` before changing it). It opens a Reelkit pane beside the conversation whenever a project is in reach, and `/reelkit-studio [project folder]` opens it by hand. The pane reads the project's files and follows your `reelkit` commands and edits, so it is current after each step:

- **Timeline**: the film as an editor's timeline (scene clips with a filmstrip from the preview frames, on-screen text, the voice with a mark per word, the music with its beats) and the selected scene's narration. **Play with timeline** writes `out/studio.html` and opens it in the browser: the render playing over the same timeline, with a playhead to drag, zoom, and frame and scene keys. Before a render it steps through the preview frames.
- **Plan**, **Music**, **Components**: the plan as written, the track, voice and sound effects, and each component in `src/` with its description and source.
- **Browser**: searches the shared library by kind.

The pane never changes the project by itself. Its buttons (Edit this scene, Change the plan, Use, Render) write a request into the prompt for the user to finish or send; treat such a request as any other from the user. After a preview or a render, tell the user in one line that the pane shows it and that **Play with timeline** plays it.

## Rules

- Search before generating. Reuse beats regenerate.
- Never generate app UI. Use the user's real screenshots.
- The user's own files (images, footage, sounds) stay private: pass `--share` only when they ask you to contribute a file. Components are the opposite, by default: new components you write are sent to the library for review after the render (source, description and example only), unless the user says no; then use `reelkit init <name> --private` or `reelkit render --no-share` (or REELKIT_NO_SHARE=1).
- Pass the user's facts through unchanged. Never invent a number, statistic, price or quote.
- Keep components driven by props, not hardcoded, so they can be reused: nothing of this user's text in them, and every new component starts with a one or two sentence comment saying what it shows and when to use it (`reference/component-authoring.md`).
- Resolve open creative decisions before committing to them. Preserve earlier approvals and explicit requests to edit or render; do not add a new approval step for work already authorized.
- Never say a video is done without having looked at its frames and checked that the file exists.
- Report what the checks actually said: the lint frames, the diff result, the export table. A command that exited is not the same as a check that passed.
- A revision changes only what was asked. `reelkit render --allow <frames>` is how that is proved. Do not tidy, retime or recolour anything outside the list.
- Never regenerate a voice the user did not ask you to touch, and never pick a take when they asked to hear the options.
- On-screen text never has vowel points. Pointing belongs in the voice request only.
- `reelkit template push` saves the whole project in the user's private files: the plan, the composition, everything under `assets/` (their own pictures, footage and recorded voice too) and the rendered video. Run it only when the user asks to save, back up or reuse the project, and say in one sentence what it sends. Only they can see it, on their templates page and with `reelkit template list`. `reelkit template clone <id> [folder]` unpacks one into a new project to continue or remix; `reelkit template delete <id>` removes it and `reelkit template rename <id> <name>` renames it. `reelkit template share <id>` makes one public, so anyone can see it and any signed-in user can clone the whole project, the user's own files under `assets/` included: run it only when the user asks to share that template with everyone, and say first what it hands out. `reelkit template unshare <id>` takes it back. `reelkit template list --community` lists what others shared; `reelkit template clone <id>` works on those too, and a shared template is someone else's work: start from its structure, and do not present its pictures, footage or voice as the user's own.
- A private project means `reelkit render --no-share` on every render, and neither `reelkit components share` nor `reelkit assets upload --share`.
- Never print an API key, a token, or the contents of a credentials file.
- If a command reports that a quota is used up, tell the user what ran out and when it resets. Do not work around it. A message that says to wait a minute or an hour ("Too many searches", "Too many uploads started") is a throttle, not a used-up quota: wait and retry once instead of stopping.
- Reply in the user's language.
