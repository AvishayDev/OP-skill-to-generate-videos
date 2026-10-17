# toykit.props — the Rainbow Bus, stop signs, balloons, puddles, buckets, rainbows and pop-in 3D words.
import bpy, math
from .shapes import sphere, box, cylinder, cone, torus, text, empty, mat, boolean_cut, star
from .core import clamp, spring, lerp

RAINBOW = ['#FF4D4D', '#FF9A1F', '#FFD21A', '#3DCC5B', '#3D8BFF', '#9B5DE5']


class Bus:
    """A cream toy bus with rainbow stripes, real window openings and spinning wheels. Faces +X, wheels on z=0.
    Seats: bus.seat(i) → local position for a passenger in window i (0 = back … 3 = front), bus.driver_seat()."""
    WINDOWS = [-1.6, -.75, .1, .95]

    def __init__(self, k, loc=(0, 0, 0), size=1.0, name='bus', mirror=False):
        """mirror=True: the bus faces -X (drives left) with its near side still towards the camera."""
        self.k, self.mirror = k, mirror
        self.root = empty(name, loc); self.root.scale = (-size if mirror else size, size, size)
        self.body = empty(f'{name}_body', (0, 0, 0), self.root)
        cream, red = mat('#FFF1D2', 'paint'), mat('#FF5A5A', 'paint')
        shell = box(f'{name}_shell', (0, 0, 1.38), (4.6, 1.9, 1.85), cream, self.body, bevel=.38, seg=6)
        for i, x in enumerate(self.WINDOWS):
            boolean_cut(shell, box(f'{name}_cut{i}', (x, 0, 1.62), (.68, 3, .62), None, self.body, bevel=.14, seg=3))
        boolean_cut(shell, box(f'{name}_cutD', (1.78, 0, 1.62), (.5, 3, .62), None, self.body, bevel=.12, seg=3))
        boolean_cut(shell, box(f'{name}_cutW', (2.4, 0, 1.6), (.6, 1.45, .7), None, self.body, bevel=.14, seg=3))
        # interior: a far wall + floor so the window openings frame the passengers on a calm dark ground
        box(f'{name}_wall', (0, .62, 1.55), (4.3, .1, 1.1), mat('#4A4F86', 'matte', rough=.7), self.body, bevel=.03)
        box(f'{name}_floor', (0, 0, 1.0), (4.3, 1.5, .12), mat('#C9A876', 'matte'), self.body, bevel=.03)
        for x in self.WINDOWS + [1.78]:
            box(f'{name}_seat', (x - .22, .25, 1.25), (.12, .9, .55), mat('#FF6B6B', 'plastic'), self.body, bevel=.05)
        box(f'{name}_roof', (0, 0, 2.3), (4.5, 1.8, .14), red, self.body, bevel=.07, seg=3)
        for i, col in enumerate(RAINBOW):
            box(f'{name}_stripe{i}', (0, 0, .62 + i * .085), (4.64, 1.94, .085), mat(col, 'paint'), self.body, bevel=.04, seg=2)
        # face: headlights, grille smile, bumpers
        glow = mat('#FFF27A', 'glow', strength=3)
        for sy in (-.6, .6): sphere(f'{name}_light', (2.28, sy, .95), (.06, .16, .14), glow, self.body)
        torus(f'{name}_smile', (2.31, 0, 1.0), .3, .035, mat('#7A3030', 'plastic'), self.body, rot=(-math.pi / 2, 0, math.pi / 2), seg=24, rseg=8, arc=math.pi)
        grey = mat('#A7B0C2', 'metal', rough=.3)
        box(f'{name}_bumpF', (2.33, 0, .55), (.16, 1.85, .18), grey, self.body, bevel=.07)
        box(f'{name}_bumpB', (-2.33, 0, .55), (.16, 1.85, .18), grey, self.body, bevel=.07)
        sphere(f'{name}_mirror', (2.25, -1.02, 1.55), (.06, .05, .1), grey, self.body)
        # a soft light on the near side so the passengers in the windows read clearly
        import bpy
        L = bpy.data.lights.new(f'{name}_winLight', 'AREA'); L.energy = 220; L.shape = 'RECTANGLE'; L.size = 4.8; L.size_y = 1.0; L.color = (1, .95, .88)
        lo = bpy.data.objects.new(f'{name}_winLight', L); bpy.context.scene.collection.objects.link(lo)
        lo.parent = self.body; lo.location = (0, -2.6, 2.3); lo.rotation_euler = (math.radians(68), 0, 0)
        # wheels (spin about local Y)
        self.wheels = []
        rub, hub, cap = mat('#2A2B38', 'rubber'), mat('#D5DCEA', 'plastic'), mat('#FF5A5A', 'plastic')
        for x in (-1.45, 1.45):
            for y in (-.92, .92):
                w = empty(f'{name}_wheel', (x, y, .45), self.root)
                torus(f'{name}_tyre', (0, 0, 0), .3, .15, rub, w, rot=(math.pi / 2, 0, 0), seg=32, rseg=12)
                cylinder(f'{name}_hub', (0, 0, 0), .22, .2, hub, w, rot=(math.pi / 2, 0, 0), seg=24)
                for a in range(3):
                    box(f'{name}_spoke', (0, -.11 if y < 0 else .11, 0), (.4, .02, .05), mat('#8C96AA', 'plastic'), w, rot=(0, a * math.pi / 3, 0), bevel=.01, seg=1)
                sphere(f'{name}_cap', (0, -.12 if y < 0 else .12, 0), (.07, .04, .07), cap, w)
                self.wheels.append(w)

    def seat(self, i): return (self.WINDOWS[i], .05, .95)
    def driver_seat(self): return (1.78, .05, .95)

    def animate(self, pos, bounce=None, face=0.0):
        """pos: function of t → (x, y, z). Wheels spin with the distance travelled; bounce: function of t → 0..1."""
        k = self.k
        k.drive(self.root, 'location', lambda t: tuple(pos(t)))
        k.drive(self.root, 'rotation_euler', (lambda t: face) if not callable(face) else face, 2)
        x0 = pos(0)[0]
        for w in self.wheels: k.drive(w, 'rotation_euler', lambda t: -(pos(t)[0] - x0) / .45, 1)
        bf = bounce or (lambda t: 0)
        k.drive(self.body, 'location', lambda t: (0, 0, .035 * bf(t) * abs(math.sin(t * 9))))
        k.drive(self.body, 'rotation_euler', lambda t: (0, .012 * bf(t) * math.sin(t * 7), 0))


def stop_sign(k, loc, col, word, font=None, pop=None, size=1.0):
    root = empty('sign', loc); root.scale = (size,) * 3
    cylinder('pole', (0, 0, 1.2), .06, 2.4, mat('#C3CAD8', 'metal', rough=.3), root, seg=16)
    disk = empty('signDisk', (0, 0, 2.75), root)
    cylinder('disk', (0, 0, 0), .62, .12, mat(col, 'paint'), disk, rot=(math.pi / 2, 0, 0), seg=48)
    torus('ring', (0, -.065, 0), .55, .035, mat('#FFFFFF', 'plastic'), disk, rot=(math.pi / 2, 0, 0), seg=48, rseg=8)
    size = .36 if len(word) <= 3 else .25 if len(word) <= 5 else .2
    text('signText', word, (0, -.1, -.01), size, mat('#FFFFFF', 'plastic', rough=.3), disk, font=font, extrude=.025, bevel=.008)
    if pop is not None:
        k.drive(root, 'scale', lambda t: (max(1e-4, spring(clamp((t - pop) / .9))) * size,) * 3)
    return root


def balloon(k, loc, col='#FF3B4D', parent=None, sway=1.0):
    root = empty('balloon', loc, parent)
    b = empty('balloonBob', (0, 0, 0), root)
    sphere('balloonSkin', (0, 0, 0), (.32, .32, .4), mat(col, 'paint', rough=.12), b, seg=40, rings=20)
    cone('knot', (0, 0, -.42), .06, .0, .08, mat(col, 'paint'), b, rot=(math.pi, 0, 0))
    cylinder('string', (0, 0, -.95), .006, 1.0, mat('#FFFFFF', 'plastic'), b, seg=6)
    k.drive(b, 'rotation_euler', lambda t: (.08 * sway * math.sin(t * 1.7), .1 * sway * math.sin(t * 1.3 + 1), 0))
    return root


def puddle(loc, r=1.0):
    root = empty('puddle', loc)
    cylinder('puddle', (0, 0, .012), r, .02, mat('#5BB8FF', 'paint', rough=.03), root, scale=(1, .55, 1), seg=48)
    cylinder('puddleRim', (0, 0, .006), r * 1.06, .01, mat('#3A7FCC', 'plastic'), root, scale=(1, .55, 1), seg=48)
    return root


def bucket(loc, parent=None):
    root = empty('bucket', loc, parent)
    cone('pail', (0, 0, .2), .18, .25, .4, mat('#3D8BFF', 'plastic'), root, rot=(0, 0, 0))
    torus('handle', (0, 0, .4), .23, .015, mat('#E8EEFF', 'plastic'), root, rot=(math.pi / 2, 0, 0), seg=24, rseg=6, arc=math.pi)
    for i, (x, y, c) in enumerate(((-.1, -.05, '#FF9EC4'), (.05, -.1, '#FFE4A3'), (.1, .05, '#FFFFFF'), (-.03, .08, '#FFB38A'), (0, -.02, '#E8B7FF'))):
        sphere('shell', (x, y, .42 + (i % 2) * .03), (.07, .055, .04), mat(c, 'plastic', rough=.2), root, rot=(.4, 0, i))
    return root


def rainbow(loc, R=12.0, band=.75, parent=None):
    root = empty('rainbow', loc, parent)
    for i, col in enumerate(RAINBOW):
        torus('band', (0, 0, 0), R - i * band, band * .52, mat(col, 'glow', strength=1.6), root, rot=(math.pi / 2, 0, 0), seg=96, rseg=12, arc=math.pi)
    return root


def word(k, s, loc, size, col, t_in, t_out=None, font=None, face_cam=True, spin=0.0):
    """A chunky 3D word (colour on a white backing) that springs in at t_in (and shrinks away at t_out)."""
    root = empty('word', loc)
    piv = empty('wordPiv', (0, 0, 0), root)
    text('wordFront', s, (0, 0, .05 * size), size, mat(col, 'plastic', rough=.25), piv, rot=(0, 0, 0), font=font, extrude=.09 * size, bevel=.03 * size)
    back = text('wordBack', s, (0, 0, -.15 * size), size, mat('#FFFFFF', 'plastic', rough=.4), piv, rot=(0, 0, 0), font=font, extrude=.05 * size, bevel=.09 * size)
    piv.rotation_euler = (math.pi / 2, 0, 0)
    if face_cam and k.scene.camera:
        c = root.constraints.new('DAMPED_TRACK'); c.target = k.scene.camera; c.track_axis = 'TRACK_NEGATIVE_Y'
    def sc(t):
        a = spring(clamp((t - t_in) / .7))
        if t_out is not None: a *= 1 - clamp((t - t_out) / .25)
        return (max(1e-4, a),) * 3
    k.drive(piv, 'scale', sc)
    k.drive(root, 'location', lambda t: (loc[0], loc[1], loc[2] + .06 * size * math.sin(t * 3)))
    if spin: k.drive(piv, 'rotation_euler', lambda t: (math.pi / 2, 0, spin * math.sin(t * 2)))
    return root


def burst(k, loc, t0, n=14, col='#7CCBFF', speed=3.0, up=4.0, gravity=9.0, r=.06, life=1.2, seed=3):
    """n droplets/confetti thrown from loc at t0, falling under gravity, shrinking away."""
    import random
    rnd = random.Random(seed); m = mat(col, 'plastic', rough=.1)
    for i in range(n):
        a = rnd.uniform(0, 2 * math.pi); v = rnd.uniform(.4, 1) * speed; vu = rnd.uniform(.6, 1.1) * up
        o = sphere('drop', loc, r * rnd.uniform(.7, 1.3), m, seg=12, rings=6)
        def f(t, a=a, v=v, vu=vu):
            q = t - t0
            if q < 0 or q > life: return (loc[0], loc[1], -5)
            return (loc[0] + math.cos(a) * v * q, loc[1] + math.sin(a) * v * q * .5, loc[2] + vu * q - gravity * q * q / 2)
        k.drive(o, 'location', f)
        k.drive(o, 'scale', lambda t, t0=t0: (max(1e-4, 1 - clamp((t - t0) / life)),) * 3)


def twinkles(k, center, extent, n=24, cols=('#FFFFFF', '#FFF27A', '#FFD1F0'), size=.12, seed=5, t0=0.0):
    """Little glowing stars that twinkle around center (extent = half sizes x, y, z), visible from t0."""
    import random
    rnd = random.Random(seed)
    for i in range(n):
        p = tuple(c + rnd.uniform(-e, e) for c, e in zip(center, extent))
        o = star('twinkle', p, size * rnd.uniform(.6, 1.3), .4, size * .3, mat(cols[i % len(cols)], 'glow', strength=4), rot=(math.pi / 2, 0, 0))
        ph = rnd.uniform(0, 6.28)
        k.drive(o, 'scale', lambda t, ph=ph: (max(1e-4, (0 if t < t0 else min(1, (t - t0) * 3)) * (.5 + .5 * math.sin(t * 4 + ph))),) * 3)
        k.drive(o, 'rotation_euler', lambda t, ph=ph: (math.pi / 2, t * 1.5 + ph, 0))
