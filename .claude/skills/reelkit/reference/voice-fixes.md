---
name: voice-fixes
description: Use when a narration line is wrong (a mispronounced word, the wrong stress, an odd melody) or the user wants a different take - checking takes by phonemes and pitch, letting the user choose from a numbered options video, splicing, and replacing one line inside the voice track.
---

# Fixing a line of narration

`reelkit assets voiceover` records a film's narration. This file is for what happens after: one word is wrong, and the rest must not move. The scripts ship with the package: `reelkit tools` prints their folder and each one's `--help` line (the folder's `README.md` gives the order). They are plain Python and generate nothing themselves.

## Find out what is wrong, in sounds
Speech-to-text writes the word it expects, so a transcript that reads correctly proves little. Check what was said:
- `phonemes.py take.wav --want "m e a f j e n i m"`: the phonemes of the take, and whether the wanted ones are there.
- `pitch_check.py take.wav`: the range, the largest step between frames (a ratio near 2 is an octave jump) and the pitch over the last 0.6 s (rising: it sounds like a question).
- Duration: a word that takes 0.8 s when it is naturally 0.45 s has been stretched.
Check the clean voice, and say so if you could only check the mix: music degrades all three.

## Get better takes
1. `credits.py --takes 6 --chars 28 --check` first. If the balance is short, stop and tell the user; half a set of takes is worse than none.
2. Change the spelling, not just the seed. For Hebrew: pointed text (niqqud, from a pointing tool, hand-checked), unpointed, a hyphen at the syllable break, a different letter with the same sound. Pointing a whole sentence can change its neighbours; sometimes the unpointed line is the one that reads right. Two or three spellings, two takes each.
3. Run the checks on every take and drop the failures before anyone listens.
4. Speech-to-speech from the user's own recording gives their stress and melody in the film's voice. Use it as recorded: speeding it up or shifting its pitch afterwards is audible, and the phoneme and duration checks show it.

## Let the user choose
`ab_video.py --title "<the line>" --out options.mp4 current.mp3:"in the film now" a.mp3:"new spelling, take 1" ...` makes one phone-safe video that plays each take under a big number with 0.7 s between them, and a key file. Put the take in use first. Send the video; wait for a number. Never pick for them when they asked to hear options, and never regenerate a voice they did not ask you to touch.

## Put the choice in
- If only part of a take is wanted, `splice.py`: it cuts at the quietest point near where you ask (a pause, the closure of a stop, just before a fricative), at a zero crossing, with a 10 ms crossfade, and reports the level and pitch either side and the exact length.
- The film's voice track is rarely the line files laid end to end. `place_line.py locate track.wav line.mp3 --near <seconds>` shows where each part of the line sits; pauses were often shortened when the track was built, so one line can be in two pieces with different offsets.
- `place_line.py replace ... --at --until --from --match-old`: overwrite only the stretch that changed, matched to the level of what it replaces, every other sample identical. It reports the margin to the next line. If the new take is longer than its slot, trim a pause inside the take; never move later lines.
- Update the line's record (which take, where it sits, the margin) and keep the old file.

## Then the captions
Measure where the changed word now starts (`onsets.py`, see `reference/voice-sync.md`). Move a caption only if its word moved, and by the same number of frames. Finish with `reelkit diff old new --allow <caption frames> --allow-audio <the line's seconds>`.
