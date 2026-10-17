# Footage mode: editing the user's own video

When the user sends a video they shot (talking head, vlog, tutorial, screen recording, a walk-and-talk) and asks
to "edit it", "make it a reel", "תערוך לי את הסרטון", that video is the film and its voice is the narrator. No TTS,
no script writing. This is the studio's replacement for CapCut. The editing craft comes from the CapCut Video
Studio skill (`library/capcut-studio/SKILL.md`, read it for depth). Everything it does in CapCut is done here in
code, and the parts that need the CapCut app (its UI, project JSON, library, export) don't apply. Its "show a
plan first" step follows our modes: one-shot by default, review mode only when asked.

## The loop
```
init <name> --voice source --lang <code> --aspect 9:16 --seconds <length of the upload>
source <p> <uploaded file>        Whisper → cut dead air → crop to the frame, constant fps → voice cleanup
                                  → source/edit.mp4 + audio/voice.wav + script.json (the transcript)
  watch it: Read the transcript; ffmpeg -i source/edit.mp4 -vf fps=1/2,scale=270:-2,tile=6x3 sheet.jpg → Read
  false starts / repeats / off-topic → project.json → source.remove [[start, end], …] (seconds in the ORIGINAL,
  from the transcript printout) → source <p> --rewrite-script
  proofread script.json: fix spelling of names/brands/numbers. Keep the spoken words (the captions show them).
voice <p>                         re-times every word on the edited voice (no TTS, no key needed)
concept → shots → audio → approve → frames → produce, as for any film
```
The uploaded file's path is in the user's message (the uploads folder). `source` copies it into the project and
never changes the original. Media stays out of git (`projects/**/source/` is ignored).

`project.json → source`: `maxPause` (0.35 s: longest pause kept; 0.2 for a fast hot take, 0.6 for a calm
story), `cutPauses: false` (keep the timing as shot, e.g. a scripted piece or music), `remove`, `silenceDb` (-35;
raise to -30 in a noisy room if pauses survive), `color` ({ contrast 1.08, saturation 1.05, brightness 0.01,
gamma, temperature 5600 for a too-warm indoor shot }), `voiceClean` (false for a pro mic; or your own ffmpeg chain).

## Shots over the footage
| Shot | `shots.json` | Use |
|---|---|---|
| The speaker | `{ "skill": "footage", "video": "source" }` | the base; it plays the moment of the source that matches the slot, so lips stay in sync |
| Punch-in | `+ "zoom": 1.15` (`"focusY": 0.4`, 0 top … 1 bottom, keeps the face in frame) | on emphasis; alternate 1 / 1.15 / 1.3 between consecutive shots to hide jump cuts |
| Graphics on the speaker | `{ "skill": "reelkit", "component": "X", "under": "source", "zoom"?: 1.1 }` | number pops, a logo on its mention, callouts, lower thirds, a keyword stamp, an emoji, a CTA card; keep the face clear (graphics in the top third or beside the face) |
| Cut-away | any `reelkit` / `canvas` / `footage` (stock) / `clip` shot | B-roll for a claim, a full-screen graphic, a split screen (draw the source half in a reelkit shot `under` it with a panel) |
The voice keeps playing through the cut-aways (it is its own track), so B-roll never breaks the sentence.
Shots are still 3–7 s; a talking head takes punch-in changes every 2–4 s in an energetic edit. Set
`concept.motif.type` to `"none"` (init does it) and give captions a plate (`concept.captions.plate`) so they read
over the footage.

## Craft rules (from the CapCut skill, apply to every footage edit)
- **Read the video first**: message, audience, tone, pace, key moments. Then decide the cut, hook, inserts, text,
  colour, music and SFX yourself. Don't offer the user a menu.
- **Hook in 1–3 s**: the strongest moment of the take may move to the front (a `remove` range can't reorder.
  Make a reelkit hook shot with that line as kinetic type, or a punch-in + headline over the first sentence).
- **Word sync**: anything that carries speech lands on the word timestamps (cues on the words, never on cuts).
- **Retention**: no dead stretch. Something changes on screen as often as the energy of the video asks.
- **By video type**:
  | Video | Usually works | Usually wrong |
  |---|---|---|
  | calm / personal talking head | clean cuts, gentle punch-ins, clean captions, soft music or none, few SFX | busy effects, aggressive music |
  | energetic talking head (news, opinion, hot take) | tight jump cuts (`maxPause` 0.2), punch-ins on emphasis, kinetic hook, B-roll or split screen on claims, numbers popping, SFX on hits | long static shots, inaudible music |
  | tutorial / screen recording | zooms + callouts on the screen (`under` + `zoom`), step tracker, steady music, click/typing SFX | visuals fighting the screen content |
  | product / brand / luxury | one design system, restrained motion, premium music, subtle SFX | mixed styles, cartoon energy |
- **Captions**: 1–3 words at a time for energetic talking heads (`project.json → video.reelkit.captions.maxWords`),
  brand names in their real spelling, never two languages in one caption.
- **Sound for phones**: the voice is clear first. Music lives above 150 Hz (phone speakers drop the sub). Choose
  tracks with mids (claps, hats, guitars, piano, supersaws), not sub-only 808s or pads. Music sits about 8–12 dB
  under the voice. SFX are short, under the voice, never on a word. Search terms by video type:
  `library/capcut-studio/SKILL.md` §5b (Freesound, CC0 / CC BY only).
- **Safe zone 9:16**: 250 px top, 350 px bottom, 80 px sides, 140 px right in the lower half (Instagram buttons).
  TikTok tabs cover ~200 px at the top.
- **Hebrew / Arabic graphics**: each word enters whole (rise + fade), never revealed from behind a mask line.
  No hyphen between two words. Fonts loaded before frame 0.
- **CTA at the end** when the video has a goal (comment-keyword DM flows work on Instagram/Facebook, TikTok and
  YouTube need link-in-bio or a pinned comment).

## Check before sending
`frames` → Read the sheet: the face isn't cut off by a punch-in, graphics don't cover the face or the captions.
After the render: `ffmpeg -i final.mp4 -af ebur128 -f null -`, the voice dominates. Spot-check lip sync on a
frame sheet around 2–3 cuts. Then deliver as usual (mp4 + post description). The upload's own content needs no
credit line.
