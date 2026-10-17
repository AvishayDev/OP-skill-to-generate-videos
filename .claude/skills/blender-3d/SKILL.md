---
name: blender-3d
description: Real 3D shots rendered with Blender (Cycles, CPU, headless) for the video studio - glossy toy-style characters (toddler, bunny, duckling, frog, bear) with lip sync to the voiceover, a rainbow bus, toy-town sets (road, trees, hills, sea, sunset, night), stop signs, balloons, rainbows, pop-in 3D words, sparkles and splashes. Use when a video should look like a 3D animated kids' show / nursery-rhyme channel / Pixar-style toy world, or the user asks for "real 3D", "3D render", "Blender", "תלת מימד", "אנימציה בתלת מימד". Shots are Python files using the bundled toykit library; the pipeline renders them as `"skill": "blender"` shots.
---

# Blender 3D — real 3D shots for the studio

A `"skill": "blender"` shot is a Python file (`projects/<name>/shots/<id>.py`, or `"file"` — one file may serve many
shots and branch on `k.id`) that defines `build(k)`. It builds a scene with **toykit** (this folder) and animates
it as functions of `t` (seconds into the shot); the pipeline renders it in Blender and the clip plays in the
shot's slot under the captions, voice, music and SFX like any other shot.

```
node pipeline/cli.mjs blender <p> --grid-only [--only <id>]   # 6 stills per shot → frames/<id>-grid.jpg — Read them
node pipeline/cli.mjs blender <p> [--only <id>]               # the real render (long: run_in_background) → clips/<id>.mp4
```
`frames` / `produce` call it too (cached by code + timing + settings). Blender (pinned LTS, `config/video.json →
blender.version`) installs itself on first use (`install.sh`, ~380 MB, seconds).

## Render cost — plan for it
4 CPUs, no GPU. Defaults (`config/video.json → blender.quality.final`): 960×540, Cycles 6 samples + OpenImageDenoise
(BALANCED), upscaled to the film size → **≈ 3.5–4 s per frame**. Set `project.json → fps: 24` for 3D films
(20 % fewer frames). So a 30 s film ≈ 45 min, 1 min ≈ 1.5 h, 2 min ≈ 3 h. Tell the user before a long render.
Frames go to `projects/<name>/blender/<id>-<hash>/`; an interrupted render continues where it stopped (rerun the
same command). Faster when needed: `quality.final.step: 2` (renders every 2nd frame, holds it — choppier),
`width: 854`, fewer objects on screen, `samples: 4`. Never `engine: eevee` here (software GL is slower and noisy).

## The shot file
```python
import math
from toykit import *

def build(k):                       # k: timing, cues, voice envelope, camera, drives
    sky(k, 'day'); sun_disc(k); town(k, 'meadow')              # world: road along X, sidewalk at y≈-2.45
    bus = Bus(k, (-1.3, 0, 0))
    bus.animate(lambda t: (-16 + 14.7 * ease_out(clamp(t / 2.6)), 0, 0), bounce=lambda t: 1 - clamp(t / 2.6))
    milo = Char(k, 'milo', bus.driver_seat(), .8); milo.root.parent = bus.root
    milo.animate(pos=bus.driver_seat(), talk='voice', wave=lambda t: 1 if t > k.cue('hello') else 0)
    bella = Char(k, 'bella', (2.45, -3.0, .08), 1.25)
    bella.animate(talk='voice', hop=lambda t: .5 * hop(t, 1.6), look=(-.5, 0), face=-.35)
    stop_sign(k, (3.75, -2.0, .08), '#FF3B4D', 'RED', font=k.fonts.get('Fredoka'), pop=k.cue('stop'), size=.78)
    k.camera((1.0, -8.4, 1.55), (1.0, 0, 1.45), 34)            # pos, target (tuples or functions of t), lens mm
    word(k, 'RED STOP!', (1.0, -2.2, 2.95), .62, '#FF3B4D', k.cue('stop'), font=k.fonts.get('Fredoka'))
```
- **k**: `k.id`, `k.dur`, `k.fps`, `k.cue(name)` (s), `k.has(name)`, `k.p(t, name, len)`, `k.voice(t)` (0..1 loudness
  of the narrator at that moment — lip sync), `k.drive(obj, 'location'|'rotation_euler'|'scale'|…, fn, index)`,
  `k.camera(pos, target, lens)` (create it **before** `word()` so words face it), `k.fonts` (project fonts),
  `k.palette`. Easing: `clamp lerp prog ease_out ease_in ease_io ease_back spring hop`.
- **Char(k, kind, loc, size, face)** — kinds `milo bella duckie fred bear` (≈1.1 units tall at size 1, faces -Y).
  `animate(pos, hop, squash, talk='voice'|fn, wave, wave_l, arms_up, look=(dx,dz), nod, tilt, turn, face, size)`;
  idle breathing, blinking and head sway are automatic. New kinds: `toykit/characters.py → KINDS` + `_features()`.
- **Props**: `Bus(k, loc, size, mirror)` (+ `seat(i)`, `driver_seat()`, `animate(pos, bounce)`; riders are parented
  to `bus.root`), `stop_sign`, `balloon`, `puddle`, `bucket`, `rainbow`, `word` (3D letters that spring in on a
  cue and face the camera), `burst` (splashes/confetti), `twinkles` (sparkles).
- **Sets**: `sky(k, 'day'|'sunset'|'night')`, `sun_disc`, `town(k, 'meadow'|'hill'|'sea', seed)`, `tree`, `cloud`,
  `flower`. Primitives/materials for anything new: `sphere box cylinder cone torus star plane text empty mat`
  (`mat(col, 'plastic'|'skin'|'paint'|'matte'|'glow'|'rubber'|'metal'|'water')`).

## Directing 3D shots (what makes it read like a kids' 3D show)
- **Close and low.** Characters fill a third to half of the frame height; camera at about their eye height (z 1.4–1.8),
  6–9 units away, 30–40 mm. Wide shots only for arrivals and the rainbow.
- **Everything moves a little all the time** (idle is built in) and **big moves land on words** (`k.cue`).
- **The featured character sings** (`talk='voice'`) — everyone else keeps their mouth still or sings in chorus.
- **One new thing every ~1 s**: a word, a hop, a prop, a sparkle burst.
- Keep text in the top third (captions sit low), 3D words 0.4–0.8 units tall, 2–3 words max.
- **Look before the long render**: `--grid-only` for every shot, Read the sheets, fix, then render.

## Rules
- Free and local: no paid AI, nothing uploaded. Fonts from the project (`fonts <p>`, Google Fonts).
- Never commit renders (`blender/`, `clips/`, mp4/png are ignored). Commit the shot `.py` files.
