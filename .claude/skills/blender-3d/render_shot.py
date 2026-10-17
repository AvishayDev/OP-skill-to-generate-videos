# Runs inside Blender: renders one shot from a spec JSON written by pipeline/render/blender.mjs.
#   blender -b --factory-startup -P render_shot.py -- <spec.json>
# The shot file (projects/<name>/shots/<id>.py) defines build(k): it builds the scene with toykit and registers
# animation as functions of t; this script bakes it and renders PNG frames (resumable: existing frames are kept)
# or, in grid mode, a few stills for a contact sheet.
import bpy, sys, os, json, time, runpy, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
spec = json.load(open(sys.argv[sys.argv.index('--') + 1]))
bpy.ops.wm.read_factory_settings(use_empty=True)
from toykit import Kit
k = Kit(spec)
k.setup_render(spec['width'], spec['height'], spec.get('engine', 'cycles'), spec.get('samples', 6))
t0 = time.time()
mod = runpy.run_path(spec['shotFile'], run_name='shot')
if 'build' not in mod: raise SystemExit(f"{spec['shotFile']}: define build(k)")
mod['build'](k)
if not k.scene.camera: raise SystemExit(f"{spec['shotFile']}: build(k) must set a camera (k.camera(...))")
k.bake()
print(f"BUILD {time.time() - t0:.1f}s · {len(bpy.data.objects)} objects", flush=True)
out = spec['out']; os.makedirs(out, exist_ok=True)
step = max(1, int(spec.get('step', 1)))
if spec.get('mode') == 'grid':
    n = spec.get('stills', 6)
    frames = sorted({min(spec['frames'], 1 + round(i * (spec['frames'] - 1) / max(1, n - 1))) for i in range(n)})
else:
    frames = list(range(1, spec['frames'] + 1, step))
todo = [f for f in frames if not os.path.exists(os.path.join(out, f'{f:05d}.png'))]
print(f"FRAMES {len(frames)} · {len(frames) - len(todo)} already rendered", flush=True)
for i, f in enumerate(todo):
    k.scene.frame_set(f)
    tmp = os.path.join(out, f'.{f:05d}.png')
    k.scene.render.filepath = tmp
    t = time.time(); bpy.ops.render.render(write_still=True)
    os.replace(tmp, os.path.join(out, f'{f:05d}.png'))
    print(f"FRAME {f} {i + 1}/{len(todo)} {time.time() - t:.1f}s", flush=True)
print("DONE", flush=True)
