---
name: delivery-review
description: Verify a finished Reelkit export: layout, word and sound timing, phone playback, platform margins, media integrity and honest delivery reporting.
---

# Verify the deliverable

Review against the original request and actual source material. A render completing proves that a file was encoded; it does not prove that the edit works. Fix observed defects and inspect the changed moments. Stop when the requested result is achieved, without mandatory review rounds or a made-up quality score.

## Before a full render

Run `reelkit check` and `reelkit preview`. Inspect `out/preview/sheet.jpg`, then the important individual frames: opening, both sides of cuts, spoken triggers, transformation landing, readable hold and ending. The normal early and late samples can miss a brief overlap, so inspect the moving export or extract additional frames around a suspicious event. Do not invent a preview timestamp flag.

- Does each moment have a clear focal point and a reason to be there?
- Are text, captions and supplied logos readable, correctly spelled and clear of faces or controls?
- Does each claim match the user's facts and source? Are illustrative surfaces distinguishable from the real product?
- Do objects settle when their words or events happen? Do old labels leave before the replacement is readable?
- Does each chart, diagram or table show the user's numbers exactly, finish drawing, and then hold still long enough to read (`reference/explain-graphics.md`, "Review at four moments")?
- Are empty states, media edges and transparency intentional? Is the ending held long enough to read?

Preview holds as well as entrances. For a loop, compare the first frame with the loop boundary and check audio continuity; matching stills alone does not prove a seamless moving loop.

## Phone and destination layout

Default a new short-form video to 9:16 unless the destination or user specifies otherwise. Keep critical content clear of likely platform chrome. For 1080x1920, a conservative working region leaves about 250px at the top, 350px at the bottom, 80px on the sides and extra room on the lower right. These are starting margins, not a guarantee for every app, device or caption expansion. Scale with the output dimensions and inspect the named destination when available. Do not add two platform versions automatically.

If variants are requested, change the layout in the source and render each variant; moving a finished frame can crop another element. Keep filenames explicit and retain earlier deliverables when revising. Do not publish or upload the result as part of a local export request.

## Check the finished file

Confirm the file exists. Use `ffprobe` when available to check actual codecs, dimensions, frame rate and duration against the requested result; decode with `ffmpeg` when corruption or missing media is suspected. Reelkit normally renders H.264/AAC MP4 and masters the mix near -14 LUFS. Inspect the reported result before applying another loudness pass. A duration mismatch may be a short audio tail; investigate before changing scene timing.

Play the export when playback is available, and listen to its speech, music and effects. Speech must be intelligible; intended music and cues must actually be present. Check the first hit, a middle word, the reveal landing and the ending for sync, unexpected silence, truncated tails and clipping. Check the final mix, not only the source stems. Avoid certifying subjective audio quality when you only ran measurements; state what was verified and what could not be auditioned.

`reelkit sound --detail` reports measurable hits, swells and nearby picture changes. Use it to locate a suspected mismatch, not to fill a quota. A calm hold can have no effect, and repeated music beats can inflate hit counts. Audition a small-speaker or reduced-bass mix when available; if only analysis is possible, look for music that vanishes without its bass and report the limitation. Do not treat a fixed energy percentage or a stem-correlation threshold as proof that the mix sounds good.

If a speed change or cut shifted timing, correct the source event map and rerender. Do not offset the whole audio track to repair one bad cue. If clipping exists before mastering, lower overlapping source levels; loudness normalization cannot restore an already clipped waveform.

## Deliver

Link or display the final video and give its project path. Briefly explain the main creative choices and why they fit, including the music when used. Report checks actually performed, material limitations and generator usage only when known. Do not claim credits were measured when the provider only exposes a remaining allowance. Keep the plan, source and media together so the edit can be revised.
