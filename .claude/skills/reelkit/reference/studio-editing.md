---
name: studio-editing
description: Choose an editing approach from the actual material: footage, screen recordings, graphics, mixed media, pacing, inserts and sound. Read for an open brief or an existing-video edit.
---

# Choose the edit from the material

Understand the message, audience, intended action, emotional tone and strongest source moments before adding effects. Watch supplied footage when playback is available; otherwise inspect sampled frames, metadata and an accurate transcript and state that limitation. Read the entire transcript in context, including pauses and emphasis. Do not infer spoken words from a few stills.

Choose the direction and explain it briefly. Ask about a missing fact, audience or goal only if it changes the edit. A request to improve a particular shot should produce that revision, not a new briefing or an unsolicited replacement concept.

## Choose the mode

| Material and purpose | Starting approach | What would weaken it |
|---|---|---|
| Personal or calm talking head | Preserve expression and useful pauses; clean captions; occasional motivated punch-in; quiet music or none | Constant zooms, whooshes and cuts that remove emotional timing |
| Energetic explanation or opinion | Strong opening claim supported by evidence; emphasis cuts; a few illustrative inserts | Effects that obscure the argument or alter its meaning |
| Tutorial or screen recording | Real screen, callout on the relevant control, step tracker, readable hold after the action | Camera moves or captions covering the control being taught |
| Product or premium brand | Supplied identity, consistent type and materials, restrained object motion, purposeful sound | Generic fabricated UI, conflicting styles or perpetual logo spin |
| Narration carried by graphics | A visual metaphor per idea; word-timed emphasis; continuity through a recurring object, type or accent | Repeating one flat layout or animating every word equally |
| Fashion, montage or reveal without speech | Cut by action and musical phrasing; minimal text; peak on the reveal | Adding explanatory captions or a narrator without a reason |

These are starting points, not templates. Mixed media can change visual worlds at a change of meaning while retaining a thread. A consistent brand system can vary framing, depth and scale without changing its identity.

## Build the edit map

For a substantial new film, keep a compact table in the project notes: source time or scene, purpose, visible action, spoken trigger or beat, text and sound. Each insert needs a reason: explain a step, demonstrate a claim, reveal the result, or make an abstract idea visible. The first few seconds should make the premise clear; a hook can be a strong image or a question, not necessarily a loud effect. End with an action only when the video's goal calls for one.

Use real footage, screens and logos first. Use code for exact type, numbers, diagrams, UI interactions and brand motion. Generate imagery only when an illustrative or filmed subject is missing. Search the shared library before generation, check the allowance with `reelkit whoami`, and use an alternative when the allowance is exhausted or a result cannot be used. Do not repeatedly regenerate an asset to chase minor taste differences.

For a new concept, show the essential direction if the user needs to choose it. Earlier approval and an explicit instruction to edit or render remain valid. A routine fix does not restart approval.

## Footage in this CLI

Reelkit overlays graphics on registered footage; it is not a CapCut draft editor or an automatic transcript-based jump-cut tool. It does not provide a CapCut JSON writer, original-speech transcription import, or an edit-decision-list command. Do not invent those commands or replace someone's recorded speech with generated narration.

Register a derived working copy with `reelkit assets upload ./working.mp4 --footage --describe "what the footage shows"`. Preserve the original. The plan then uses `mode: "footage"` and every scene uses `treatment: "footage-overlay"`. The manifest uses the footage's dimensions, capped at 1920 on the long side, and its full duration. Use one `FootageLayer` below the graphics; its `muted` default is true. Set `muted={false}` when the original audio is wanted, and do not duplicate that audio as another track. For existing speech use `voice: "none"` to avoid generating a second voice; that setting means no generated narration, not that the source audio must be silent.

If the requested edit needs cuts, normalization or reframing, make a separate derived clip with available local video tools, verify its new source timing, and register that copy. If a needed operation is unavailable, identify the missing capability. Do not install or automate another editor merely because the inspiration skill uses one. Keep media paths stable and the sources reproducible.

Original-speech captions need accurate timestamps from the supplied transcript or an available transcription tool authorized to process that recording. The standard manifest's `s.words` comes from generated voiceovers; uploading footage does not populate it. Keep original-speech timings in a separate local source and explicitly implement and validate their use in the composition. Do not hand-edit the generated manifest or use generated narration timings for the speaker. If timings cannot be obtained, complete the feasible edit and report the caption limitation. Music ducking also needs these real speech spans: pass `Music` a `scenes` array of `{ startFrame, words }` using scene-local word seconds, or keep the music conservatively low through the recording. With empty manifest words the default music cannot detect source speech.

## Inserts and pacing

Prioritize the moments where the viewer needs help. A number pop should show the real number as it is said; a callout should point at the actual control; a step tracker should advance with the step. Avoid unrelated B-roll that merely looks attractive. Align narrated visuals with the actual word onset, not the nearest clip boundary (`reference/voice-sync.md`). Keep captions and inserts clear of faces and controls.

Cut dead air, false starts and repeats only when it preserves meaning and cadence. Do not remove all pauses. Use a punch-in for emphasis or reframing, not on every sentence. Do not stack it on a screen recording that already zooms. Reduce travel or lengthen a move if it smears or ghosts; a held frame is valid when the viewer needs to read, compare or feel the moment.

When source speed changes, update the entire clock. At speed factor r, source time t maps to output time t/r. For a trimmed segment beginning at source time a and output time b, map t to b + (t-a)/r. Recompute word events, inserts and SFX from the edited timeline; regenerate narration timings if generated narration changed. Choose music phrasing separately rather than stretching the finished mix to repair sync.

## Design and sound references

Read only what the edit needs: `reference/styles.md` for visual techniques, `reference/motion-design.md` for staging, `reference/brand-motion.md` for transformations, `reference/three-d.md` for depth, `reference/hebrew-rtl.md` for Hebrew, `reference/captions.md` for generated-speech captions, and `reference/sound-design.md` for scoring. These are choices that serve the video, not requirements to use every technique.

Useful transformations include a field becoming its result, a sketch resolving into a product, a number joining its chart, or a product turning to expose its relevant face. Use particles, text rings, a comic or a 3D environment only when that metaphor fits the message and chosen style. Keep the identity recognizable after the transformation and give it a readable hold.
