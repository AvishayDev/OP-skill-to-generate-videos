# toykit.characters — chubby toy characters (big glossy eyes, soft skin, round bodies) built from smooth primitives,
# with pivots for animation. Faces -Y (towards a camera placed at -Y). Height ≈ 1.1 units at size 1, feet at z=0.
#   c = Char(k, 'milo', loc=(0,0,0), size=1.0)
#   c.animate(pos=lambda t: (x, y, 0), hop=lambda t: .3*hop(t), talk='voice', wave=lambda t: 1, look=(0.3, 0))
# Kinds: milo (toddler), bella (bunny), duckie (duckling), fred (frog), bear (teddy). Add a kind = add to KINDS +
# a branch in _features().
import math
from .shapes import sphere, box, cylinder, star, empty, mat, torus
from .core import clamp, lerp

KINDS = {
    #          skin       body        eye iris    extra
    'milo':  dict(skin='#FFC79E', body='#3D8BFF', iris='#6B3E1E', shoe='#FFFFFF', head=1.0),
    'bella': dict(skin='#FFF4F6', body='#FF8FB5', iris='#8A3D7A', shoe='#FF8FB5', head=.95),
    'duckie': dict(skin='#FFD43B', body='#FFD43B', iris='#3A2A12', shoe='#FF9A1F', head=.92),
    'fred':  dict(skin='#6FD34E', body='#6FD34E', iris='#22401A', shoe='#4FB33A', head=.95),
    'bear':  dict(skin='#B5793F', body='#FF9A3D', iris='#2D1B0F', shoe='#6B4226', head=.95),
}


def _const(v): return v if callable(v) else (lambda t: v)


class Char:
    def __init__(self, k, kind, loc=(0, 0, 0), size=1.0, face=0.0, name=None):
        self.k, self.kind, self.K = k, kind, KINDS[kind]
        n = name or kind
        self.root = empty(f'{n}_root', loc); self.root.scale = (size,) * 3; self.root.rotation_euler = (0, 0, face)
        self.base_loc, self.size = tuple(loc), size
        self.body = empty(f'{n}_body', (0, 0, 0), self.root)          # squash pivot at the feet
        K = self.K
        skin, cloth = mat(K['skin'], 'skin'), mat(K['body'], 'plastic' if kind != 'milo' else 'matte', rough=.55 if kind == 'milo' else None)
        fur = mat(K['skin'], 'skin' if kind == 'milo' else 'plastic', rough=.5)
        # legs + shoes
        for sx in (-1, 1):
            sphere(f'{n}_leg', (sx * .085, 0, .13), (.075, .075, .1), fur if kind != 'milo' else skin, self.body)
            sphere(f'{n}_shoe', (sx * .088, -.03, .045), (.088, .115, .055), mat(K['shoe'], 'plastic'), self.body)
        # torso
        sphere(f'{n}_torso', (0, 0, .34), (.22, .19, .24), cloth if kind in ('milo', 'bella', 'bear') else fur, self.body, seg=40, rings=20)
        if kind in ('duckie', 'fred'):
            sphere(f'{n}_belly', (0, -.1, .32), (.15, .1, .17), mat('#FFF6C9' if kind == 'duckie' else '#CFF5A8', 'plastic'), self.body)
        if kind == 'milo':
            star(f'{n}_star', (0, -.185, .37), .075, .45, .02, mat('#FFE04A', 'plastic'), self.body, rot=(math.pi / 2, 0, 0))
        if kind == 'bear':
            for z in (.24, .3): torus(f'{n}_stripe', (0, 0, z), .205, .012, mat('#FFD08A', 'plastic'), self.body)
        # arms (pivots at the shoulders)
        self.arms = {}
        for side, sx in (('l', -1), ('r', 1)):
            p = empty(f'{n}_arm{side}', (sx * .19, 0, .49), self.body)
            sphere(f'{n}_arm', (0, 0, -.1), (.062, .062, .12), cloth if kind in ('milo', 'bella', 'bear') else fur, p)
            sphere(f'{n}_hand', (0, 0, -.21), .058 if kind != 'duckie' else .065, skin if kind != 'duckie' else fur, p)
            self.arms[side] = p
        # head
        self.neck = empty(f'{n}_neck', (0, 0, .52), self.body)
        self.head = empty(f'{n}_head', (0, 0, .27), self.neck)
        hs = K['head']; self.head.scale = (hs, hs, hs)
        hscale = (1.18, 1.0, .82) if kind == 'fred' else (1.0, .96, .95)
        sphere(f'{n}_skull', (0, 0, 0), tuple(.32 * s for s in hscale), skin if kind == 'milo' else fur, self.head, seg=56, rings=28)
        self.eyes, self.irises = [], []
        self.mouth = self.jaw = None
        self._features(n, skin, fur)

    # ---------- faces ----------
    def _eye(self, n, x, z, y, s=1.0, parent=None):
        e = empty(f'{n}_eye', (x, y, z), parent or self.head)
        sphere(f'{n}_white', (0, 0, 0), (.085 * s, .05 * s, .102 * s), mat('#FFFFFF', 'plastic', rough=.15), e)
        ir = empty(f'{n}_irisP', (0, 0, 0), e)
        sphere(f'{n}_iris', (0, -.036 * s, -.004 * s), (.063 * s, .022 * s, .074 * s), mat(self.K['iris'], 'plastic', rough=.1), ir)
        sphere(f'{n}_pupil', (0, -.05 * s, -.004 * s), (.036 * s, .014 * s, .044 * s), mat('#120A06', 'plastic', rough=.08), ir)
        sphere(f'{n}_hl1', (-.022 * s, -.062 * s, .028 * s), .017 * s, mat('#FFFFFF', 'glow', strength=6), ir)
        sphere(f'{n}_hl2', (.022 * s, -.06 * s, -.026 * s), .008 * s, mat('#FFFFFF', 'glow', strength=6), ir)
        self.eyes.append(e); self.irises.append(ir)

    def _mouth(self, n, z=-.12, w=.075, y=-.285, parent=None):
        self.mouth = sphere(f'{n}_mouth', (0, y, z), (w, .045, .02), mat('#7A1E2E', 'plastic', rough=.4), parent or self.head)
        torus(f'{n}_smile', (0, y - .004, z + w * .45), w * .85, .011, mat('#8A2A34', 'plastic', rough=.4), parent or self.head, rot=(-math.pi / 2, 0, 0), seg=24, rseg=8, arc=math.pi)
        sphere(f'{n}_tongue', (0, -.25, -.45), (.62, .55, .5), mat('#FF7C8E', 'plastic'), self.mouth)

    def _features(self, n, skin, fur):
        kind, H = self.kind, self.head
        pink = mat('#FF8FA8', 'skin')
        if kind == 'fred':
            for sx in (-1, 1):
                sphere(f'{n}_bump', (sx * .14, -.08, .2), .12, fur, H)
                self._eye(n, sx * .14, .22, -.17, s=1.05)
            self._mouth(n, z=-.08, w=.17, y=-.27)
            for sx in (-1, 1): sphere(f'{n}_cheek', (sx * .25, -.2, -.05), (.05, .02, .035), pink, H)
            return
        for sx in (-1, 1):
            self._eye(n, sx * .12, .03, -.268)
            sphere(f'{n}_cheek', (sx * .2, -.225, -.075), (.058, .02, .04), pink, H)
        if kind == 'milo':
            hair = mat('#FF9A2E', 'plastic', rough=.45)
            sphere(f'{n}_hair', (0, .085, .165), (.336, .315, .215), hair, H, seg=48, rings=24)
            for (x, y, z, sx, sz, rx) in ((.0, -.06, .33, .1, .13, -.5), (.07, -.02, .34, .08, .1, -.2), (-.06, .0, .34, .075, .1, -.1)):
                sphere(f'{n}_tuft', (x, y, z), (sx, .075, sz), hair, H, rot=(rx, 0, x * 3))
            for sx in (-1, 1): sphere(f'{n}_ear', (sx * .315, 0, -.01), (.045, .04, .07), skin, H)
            sphere(f'{n}_nose', (0, -.318, -.05), (.03, .02, .024), skin, H)
            self._mouth(n)
        elif kind == 'bella':
            for sx in (-1, 1):
                e = empty(f'{n}_earP', (sx * .11, .02, .26), H, rot=(0, sx * .18, 0))
                sphere(f'{n}_ear', (0, 0, .2), (.07, .04, .22), fur, e)
                sphere(f'{n}_earIn', (0, -.022, .2), (.042, .02, .17), pink, e)
                self.arms.setdefault('ears', []).append(e)
            sphere(f'{n}_nose', (0, -.318, -.055), (.032, .022, .024), mat('#FF6F9C', 'plastic'), H)
            self._mouth(n, z=-.13, w=.06)
            box(f'{n}_teeth', (0, -.3, -.165), (.05, .02, .04), mat('#FFFFFF', 'plastic', rough=.2), H, bevel=.008)
        elif kind == 'duckie':
            orange = mat('#FF9A1F', 'plastic', rough=.3)
            sphere(f'{n}_beakTop', (0, -.33, -.07), (.11, .085, .032), orange, H)
            self.jaw = empty(f'{n}_jaw', (0, -.27, -.095), H)
            sphere(f'{n}_beakBot', (0, -.05, -.012), (.095, .075, .026), mat('#F07C10', 'plastic', rough=.3), self.jaw)
            for i, (x, rz) in enumerate(((-.03, .4), (0, 0), (.03, -.4))):
                sphere(f'{n}_tuft', (x, -.02, .32), (.025, .02, .075), fur, H, rot=(-.3, rz, 0))
            bow = mat('#3D8BFF', 'plastic')
            for sx in (-1, 1): sphere(f'{n}_bow', (sx * .055, -.17, .5), (.06, .025, .04), bow, self.body, rot=(0, sx * .3, 0))
            sphere(f'{n}_knot', (0, -.185, .5), .025, bow, self.body)
        elif kind == 'bear':
            for sx in (-1, 1):
                sphere(f'{n}_ear', (sx * .22, .02, .22), (.1, .06, .1), fur, H)
                sphere(f'{n}_earIn', (sx * .22, -.02, .22), (.06, .03, .06), mat('#E8B98A', 'plastic'), H)
            sphere(f'{n}_muzzle', (0, -.26, -.1), (.13, .08, .1), mat('#EBC39A', 'plastic', rough=.5), H)
            sphere(f'{n}_nose', (0, -.335, -.06), (.045, .03, .032), mat('#2B1A12', 'plastic', rough=.15), H)
            self._mouth(n, z=-.15, w=.05, y=-.325)

    # ---------- animation ----------
    def animate(self, pos=None, face=None, hop=None, squash=None, talk=None, wave=None, wave_l=None, look=None,
                nod=None, tilt=None, turn=None, size=None, blink=True, breathe=True, arms_up=None, hide=None):
        """Each argument: a constant or a function of t. talk='voice' = lip-sync to the voice track.
        hop: height (units) the character is lifted; squash: 1 = rest, <1 squashed, >1 stretched."""
        k, n = self.k, self.kind
        seed = sum(map(ord, n)) * .37
        pos, hop_f = _const(pos if pos is not None else self.base_loc), _const(hop or 0)
        k.drive(self.root, 'location', lambda t: (pos(t)[0], pos(t)[1], pos(t)[2] + hop_f(t) * self.size))
        if face is not None: f = _const(face); k.drive(self.root, 'rotation_euler', f, 2)
        if size is not None: s = _const(size); k.drive(self.root, 'scale', lambda t: (s(t),) * 3)
        if hide is not None: h = _const(hide); k.drive(self.root, 'scale', lambda t: (0.0001,) * 3 if h(t) else (self.size,) * 3)
        sq = _const(squash or 1.0)
        def body_scale(t):
            b = 1 + (.018 * math.sin(t * 2.6 + seed) if breathe else 0)
            z = sq(t) * b; x = 1 / math.sqrt(max(.2, z))
            return (x, x, z)
        k.drive(self.body, 'scale', body_scale)
        nod_f, tilt_f, turn_f = _const(nod or 0), _const(tilt or 0), _const(turn or 0)
        k.drive(self.neck, 'rotation_euler', lambda t: (nod_f(t) + .04 * math.sin(t * 1.7 + seed), tilt_f(t) + .05 * math.sin(t * 1.3 + seed), turn_f(t) + .06 * math.sin(t * .9 + seed)))
        # mouth / beak
        if talk is not None:
            tk = (lambda t: k.voice(t)) if talk == 'voice' else _const(talk)
            if self.jaw is not None: k.drive(self.jaw, 'rotation_euler', lambda t: .55 * clamp(tk(t)), 0)
            elif self.mouth is not None:
                base = self.mouth.scale.copy()
                k.drive(self.mouth, 'scale', lambda t: (base[0] * (1 - .15 * clamp(tk(t))), base[1], .02 + .075 * clamp(tk(t))))
        # arms: rest hang slightly out; wave = raise + swing; arms_up = both up (cheer)
        wr, wl, up = _const(wave or 0), _const(wave_l or 0), _const(arms_up or 0)
        def arm(side):
            sgn = 1 if side == 'r' else -1
            def f(t):
                rest = .22 + .04 * math.sin(t * 2.6 + seed)
                w = clamp((wr if side == 'r' else wl)(t)); u = clamp(up(t))
                wav = 2.25 + .35 * math.sin(t * 10 + seed)
                cheer = 2.7 + .12 * math.sin(t * 7 + seed + (0 if side == 'r' else 1.5))
                a = lerp(lerp(rest, wav, w), cheer, u * (1 - w))
                return (-.35 * max(w, u), -sgn * a, 0)
            return f
        for side in ('l', 'r'): k.drive(self.arms[side], 'rotation_euler', arm(side))
        if 'ears' in self.arms:
            for i, e in enumerate(self.arms['ears']):
                sx = -1 if i == 0 else 1
                k.drive(e, 'rotation_euler', lambda t, sx=sx: (.12 * math.sin(t * 3 + sx), sx * (.18 + .08 * math.sin(t * 2.2 + sx)), 0))
        # eyes: look + blink
        lk = _const(look or (0, 0))
        def look_f(t):
            dx, dz = lk(t)
            return (dx * .022 + .006 * math.sin(t * .7 + seed), 0, dz * .02)
        for ir in self.irises: k.drive(ir, 'location', look_f)
        if blink:
            def bl(t):
                ph = (t + seed) % 3.4
                return (1, 1, .12) if ph < .11 else (1, 1, 1)
            for e in self.eyes: k.drive(e, 'scale', bl)
