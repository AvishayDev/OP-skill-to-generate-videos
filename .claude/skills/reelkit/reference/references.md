---
name: references
description: Use when the user says "make one like this" or gives a link or file of an existing video to match - how to bring it in, measure it, look at it, and turn how it is built into a plan, without copying anything from it.
---

# References: "make one like this"

A reference is an existing video the user wants the new one to feel like. You learn how it is built (its structure, pace and motion) and make something new in that spirit. Nothing of it is ever reused.

## Bring it in
1. Ask for the video as a file if the user has it. A file on this machine is the clean path: `reelkit ref download ./example.mp4` copies it. A link works too, but it is fetched on the user's machine with yt-dlp (which they must have installed; the command says how if not), and the user is responsible for having the right to download that video. Say so in one sentence when you use a link. A reference is at most 10 minutes.
2. `reelkit ref analyze <id>` measures it on this machine: scenes, cut times, pace, colours, loudness and tempo. It writes `refs/<id>/breakdown.json` and two sample frames per scene in `refs/<id>/frames/`. `reelkit ref list` shows what is in the project.
3. Ask before it sends anything. The transcript is made on the Reelkit server, so the reference's audio (never the video) leaves the user's machine and is deleted there when the job ends. Ask "I can also transcribe its audio on the Reelkit server to understand the structure: OK?" and run `reelkit ref analyze <id> --no-transcript` if they say no. `reelkit whoami` shows the monthly transcription seconds left. If the transcript is refused (quota, not logged in), the breakdown is still saved; `reelkit ref analyze <id> --redo` adds the transcript later.

## Look, then read
Open the frames in `refs/<id>/frames/` and look at them one scene after another: how big the type is, where it sits, how much of the screen is picture and how much is colour, how busy each scene is. Then read `breakdown.json`: `pacing.averageShotSec`, `pacing.firstCutSec`, `pacing.cutsPerSecond`, the `palette`, and the `transcript` if there is one.

## What to take, and what never to
Take:
- the structure: how it opens, how many beats it has, how it ends
- the pace and the cut rhythm
- how type and layout are used (big words on colour, small captions over footage, one idea per screen)
- the kind of motion (snappy, floaty, hard cuts, slow pushes)
- the mood of its music, as a description to search the library with

Never take its footage, its music, its exact words, its logos or its faces. The transcript is for understanding the structure (where the hook ends, where the point lands), never for copying the script: write your own words about the user's subject.

## Several references from one maker
When the user points at an account or a handful of videos rather than one, bring in three to six of them and look for what repeats, because that is the style; what appears once is only that video.
- **The ground:** what is behind everything (white, near-black, a colour field, footage) and whether it ever changes inside a video.
- **How full the frame is:** one small object in a lot of space, or type edge to edge. Measure it roughly: the main object's width as a share of the frame.
- **The order of shots:** most makers have one. Write it as a line, such as "a line of type, the logo, a field being typed into, three interface shots, a number, the logo".
- **How things arrive and leave:** on a spring, with a blur, with a hard cut, by changing shape. Step through a transition a frame at a time in the saved frames.
- **How long a shot holds,** from `pacing.averageShotSec` across the set, and how long the last one does.
- **Type:** how many sizes, how many weights, whether one word is coloured, and how words enter.
- **Sound:** whether the music runs without a break, and whether moves have their own sounds.
Write those seven lines down and match them to the nearest look in `reference/styles.md`; they become the plan's `reference.take` notes. The maker's subjects, logos, screens and layouts stay theirs: build the user's video from the library's components and the user's own material.

## Turn the pace into the plan
- Scene count and length come from `pacing.averageShotSec`: a video of 30 seconds with shots of about 1.5 seconds is many quick scenes; since a plan has 3 to 8 scenes, group several reference shots into one scene that changes its picture inside (stacked text, quick swaps) rather than stretching it.
- The hook's length comes from `pacing.firstCutSec`: if the reference holds its first shot for 1.2 seconds, your first scene is one short line.
- Write the plan's `reference`: `{ "id": "<id>", "take": ["fast cuts every ~1.2s", "big type on colour fields"] }`, one to six short notes of what you took. `reelkit plan check` needs the analysis to exist and says when your scenes are much slower or faster than the reference.
- When the reference cuts on the beat (`pacing.cutsOnBeat` high, say 0.7 or more, with `audio.tempoBpm`), plan the new video's scene changes on a regular grid at a similar tempo, and search the library for music of a similar tempo and mood. The reference's own music is never used.
