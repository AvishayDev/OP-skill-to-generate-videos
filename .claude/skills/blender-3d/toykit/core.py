# toykit.core — the shot context `k`: timing (seconds ↔ frames, cues), procedural animation (functions of t baked
# into keyframes), the voice envelope for lip sync, render settings, camera. Everything a shot animates is a pure
# function of t (seconds into the shot), sampled once per frame by k.bake().
import bpy, math, os, wave, array
from mathutils import Vector


def clamp(v, a=0.0, b=1.0): return max(a, min(b, v))
def lerp(a, b, k): return a + (b - a) * k
def prog(t, a, b): return clamp((t - a) / (b - a)) if b != a else (1.0 if t >= a else 0.0)
def ease_out(k): return 1 - (1 - k) ** 3
def ease_in(k): return k * k * k
def ease_io(k): return 4 * k ** 3 if k < .5 else 1 - (-2 * k + 2) ** 3 / 2
def ease_back(k, s=1.9): k -= 1; return 1 + k * k * ((s + 1) * k + s)
def spring(k, f=3.2, d=5.0):
    """0→1 with an overshoot wobble (a pop)."""
    if k <= 0: return 0.0
    return 1 - math.exp(-d * k) * math.cos(f * math.pi * k)
def hop(t, rate=2.0):
    """|sin| bounce, 0..1, `rate` hops per second."""
    return abs(math.sin(t * math.pi * rate))
def lerp3(a, b, k): return tuple(lerp(x, y, k) for x, y in zip(a, b))


class Kit:
    def __init__(self, spec):
        self.spec = spec
        self.fps = spec['fps']
        self.frames = spec['frames']
        self.dur = self.frames / self.fps
        self.cues = spec.get('cues', {})
        self.words = spec.get('words', [])
        self.start = spec.get('start', 0.0)          # where the shot starts in the film (s) — for the voice envelope
        self.id = spec.get('id', 'shot')
        self.palette = spec.get('palette', {})
        self.fonts = spec.get('fonts', {})           # family → ttf path
        self._drives = []
        self._voice = None
        self.scene = bpy.context.scene

    # ---- timing ----
    def cue(self, name, default=None):
        if name in self.cues: return self.cues[name]
        if default is None: raise KeyError(f'no cue "{name}" in shots.json for {self.id}')
        return default
    def has(self, name): return name in self.cues
    def p(self, t, name, length=.4, default=None):
        c = self.cue(name, default); return prog(t, c, c + length)
    def since(self, t, name, default=None): return t - self.cue(name, default)

    # ---- voice envelope (0..1 loudness at shot time t), for lip sync ----
    def voice(self, t):
        if self._voice is None: self._voice = self._load_voice()
        if not self._voice: return 0.0
        i = int((self.start + t) * 100)
        return self._voice[i] if 0 <= i < len(self._voice) else 0.0
    def _load_voice(self):
        path = self.spec.get('voiceWav')
        if not path or not os.path.exists(path): return []
        with wave.open(path, 'rb') as w:
            n, ch, sw, rate = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
            if sw != 2: return []
            data = array.array('h', w.readframes(n))
        if ch > 1: data = data[::ch]
        hopn = rate // 100                       # 10 ms windows
        env = []
        for i in range(0, len(data) - hopn, hopn):
            seg = data[i:i + hopn]
            env.append(math.sqrt(sum(x * x for x in seg[::4]) / max(1, len(seg[::4]))))
        top = sorted(env)[int(len(env) * .97)] or 1
        sm, out = 0.0, []
        for v in env:                            # normalise + quick attack / slower release
            v = clamp(v / top); sm = v if v > sm else sm * .82 + v * .18; out.append(sm)
        return out

    # ---- procedural animation ----
    def drive(self, obj, path, fn, index=-1):
        """Animate obj.<path>[index] (or the whole vector when index=-1 and fn returns a tuple) with fn(t)."""
        self._drives.append((obj, path, index, fn))
    def freeze(self):
        """Apply every modifier (bevels, booleans, subdivision) into plain meshes, so nothing is re-evaluated per frame."""
        dg = bpy.context.evaluated_depsgraph_get()
        for o in list(bpy.data.objects):
            if o.type != 'MESH' or not o.modifiers or o.hide_render: continue
            me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=False, depsgraph=dg)
            old = o.data; o.modifiers.clear(); o.data = me
            if old.users == 0: bpy.data.meshes.remove(old)
        for o in [o for o in bpy.data.objects if o.hide_render and o.type == 'MESH']:
            bpy.data.objects.remove(o, do_unlink=True)          # boolean cutters

    def bake(self):
        self.freeze()
        sc = self.scene
        for f in range(self.frames):
            t = f / self.fps
            for obj, path, index, fn in self._drives:
                v = fn(t)
                if index == -1 and isinstance(v, (tuple, list, Vector)):
                    setattr(obj, path, v)
                    obj.keyframe_insert(path, frame=f + 1)
                elif index == -1:
                    setattr(obj, path, v)
                    obj.keyframe_insert(path, frame=f + 1)
                else:
                    getattr(obj, path)[index] = v
                    obj.keyframe_insert(path, index=index, frame=f + 1)
        for obj in {d[0] for d in self._drives}:
            ad = obj.animation_data
            if ad and ad.action:
                for fc in ad.action.fcurves:
                    for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
        sc.frame_set(1)

    # ---- render settings ----
    def setup_render(self, width, height, engine='cycles', samples=16):
        sc = self.scene
        sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = width, height, 100
        sc.render.fps = self.fps
        sc.frame_start, sc.frame_end = 1, self.frames
        sc.render.image_settings.file_format = 'PNG'
        sc.render.image_settings.color_mode = 'RGB'
        sc.render.use_persistent_data = True
        vs = sc.view_settings
        vs.view_transform = 'Standard'; vs.look = 'None'; vs.exposure = 0.0; vs.gamma = 1.0
        if engine == 'eevee':
            sc.render.engine = 'BLENDER_EEVEE_NEXT'
            sc.eevee.taa_render_samples = samples
            try: sc.eevee.use_shadows = True
            except AttributeError: pass
        else:
            sc.render.engine = 'CYCLES'
            cy = sc.cycles
            cy.device = 'CPU'; cy.samples = samples; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.05
            cy.use_denoising = True
            try:
                cy.denoiser = 'OPENIMAGEDENOISE'; cy.denoising_quality = 'BALANCED'; cy.denoising_prefilter = 'FAST'
            except (TypeError, AttributeError): pass
            cy.max_bounces, cy.diffuse_bounces, cy.glossy_bounces, cy.transmission_bounces = 4, 2, 2, 2
            cy.transparent_max_bounces = 4
            cy.caustics_reflective = cy.caustics_refractive = False
            cy.blur_glossy = 1.0
            sc.render.film_transparent = False

    # ---- camera ----
    def camera(self, pos, target, lens=35):
        """pos/target: tuples or functions of t. Returns the camera object (tracks an empty)."""
        cam_data = bpy.data.cameras.new('Cam'); cam_data.lens = lens if not callable(lens) else lens(0)
        cam = bpy.data.objects.new('Cam', cam_data); self.scene.collection.objects.link(cam)
        tgt = bpy.data.objects.new('CamTarget', None); self.scene.collection.objects.link(tgt)
        c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
        self.scene.camera = cam
        if callable(pos): self.drive(cam, 'location', lambda t: tuple(pos(t)))
        else: cam.location = pos
        if callable(target): self.drive(tgt, 'location', lambda t: tuple(target(t)))
        else: tgt.location = target
        if callable(lens): self.drive(cam_data, 'lens', lens)
        cam_data.clip_start, cam_data.clip_end = 0.05, 600
        return cam
