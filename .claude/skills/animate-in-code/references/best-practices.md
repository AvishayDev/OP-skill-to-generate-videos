# Best practices (learned making 10 films)

## Story
- One character, one wish, one obstacle, one payoff. The example: a creature wants a star, falls, every fall drops a block labelled "נפילה", the blocks become stairs.
- Turn the theme into an OBJECT the viewer can watch change (falls → blocks → stairs). A metaphor you can see beats a sentence you read.
- 8 s holds 5-6 beats. Give a fall ~1 s, a reveal ~0.5 s, the final title ≥1.2 s.
- Squash and stretch sell weight: squat before a jump, stretch while rising, pancake on a splat, overshoot when getting up.
- Keep the whole story a pure function of time. Any frame must render correctly on its own.

## Look
- Frame 0 is the thumbnail. The world and the main prop are visible from the first frame.
- The material must be readable from ONE still: texture on every surface, never a flat vector with a filter on top.
- Hand-made motion: hold drawings on twos (12 fps) or threes (8 fps); keep camera shake and particles on ones so it still feels alive.
- "Boil" (tiny re-drawing jitter) must step at a fixed rate (e.g. 8 fps) and be seeded - never random per frame.
- Pre-render anything static in `setup()`. Cache generated shapes by seed.
- Big readable eyes and a blush make any character lovable in any medium.

## Sound
- Everything is synthesized: a chord plan (`CHORDS`) and a cue sheet (`CUES`). A style changes the instruments, not the timing.
- Every visual event has a sound, and the sound belongs to the material: chalk squeaks, typewriter clacks, needle ticks, sand hiss, square-wave jumps.
- Comic ducking: drop the music for half a second on a splat - it reads as a joke.
- Render normalizes to -14 LUFS (Instagram/TikTok level). Raw WebAudio mixes are around -25 dB - too quiet without it.
- You cannot hear the result. Check levels with ffmpeg `volumedetect` and say that you did not listen.

## Text (Hebrew)
- Set `direction = 'rtl'` on every text draw; reveal handwriting right to left.
- Digits and Latin in Heebo. Handwriting fonts hide letter traps (see SKILL.md). Check every word visually at phone size.
- Keep the title off the busiest part of the frame, or give it a band/halo of the medium (painted band, cleaned chalk, paper chip).

## QA loop that works
1. `--grid 24` → look at the whole film at thumbnail size (legibility test).
2. `--only` a few frames at full size → material quality.
3. `--strip` around fast actions → spacing, contacts, nothing popping.
4. Fix, repeat at least twice. Then the full render, then `ffprobe`.

## Scale up
The nine example films were built in parallel by nine agents from one shared `story.js` + `STYLE_BRIEF.md`. Same trick for a series: one story file, many looks - or one look, many stories.
