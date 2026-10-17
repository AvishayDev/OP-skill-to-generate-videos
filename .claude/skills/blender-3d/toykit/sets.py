# toykit.sets — toy-town environments. World axes: the road runs along X (traffic drives +X) at y≈0, the sidewalk
# is on the camera side (y≈-2.2), the camera sits at -Y looking +Y. Everything is placed for x in [-60, 140].
#   sky(k, 'day'|'sunset'|'night'); town(k, theme='meadow'|'sea'|'hill', seed=1)
import bpy, math, random
from .shapes import sphere, box, cylinder, cone, plane, mat, srgb, empty
from .core import lerp

SKIES = {
    #        horizon     zenith      sun colour    sun energy  world  sun elevation (deg)
    'day':    ('#DDF3FF', '#4AA8F5', '#FFF4E0', 3.6, 1.0, 52),
    'sunset': ('#FFC48A', '#6A5BC2', '#FFB070', 2.6, .8, 14),
    'night':  ('#2E3A8C', '#0B1440', '#AFC4FF', .55, .35, 40),
}
ROAD_Y, ROAD_W, WALK_Y, WALK_W = 0.0, 3.6, -2.45, 1.3


def sky(k, mode='day', sun_az=-35):
    hz, zn, sc, se, ws, el = SKIES[mode]
    w = bpy.data.worlds.new('Sky'); k.scene.world = w; w.use_nodes = True
    nt = w.node_tree; bg = nt.nodes['Background']
    tc = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ')
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -.02; mr.inputs['From Max'].default_value = .55
    ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = srgb(hz); ramp.color_ramp.elements[1].color = srgb(zn)
    nt.links.new(tc.outputs['Generated'], sp.inputs[0]); nt.links.new(sp.outputs['Z'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = ws
    # key sun + soft fill (no shadow) from the camera side
    key = bpy.data.lights.new('Key', 'SUN'); key.energy = se; key.angle = math.radians(14); key.color = srgb(sc)[:3]
    ko = bpy.data.objects.new('Key', key); k.scene.collection.objects.link(ko)
    ko.rotation_euler = (math.radians(90 - el), 0, math.radians(sun_az))
    fill = bpy.data.lights.new('Fill', 'SUN'); fill.energy = se * .28; fill.angle = math.radians(40); fill.color = srgb(hz)[:3]
    try: fill.use_shadow = False
    except AttributeError: pass
    fo = bpy.data.objects.new('Fill', fill); k.scene.collection.objects.link(fo)
    fo.rotation_euler = (math.radians(70), 0, math.radians(sun_az + 160))
    if mode == 'night': _night(k)
    k.sky_mode = mode
    return ko


def _night(k):
    rnd = random.Random(7); glow = mat('#FFF6C2', 'glow', strength=8)
    for i in range(160):
        a = rnd.uniform(-1.1, 1.1); el = rnd.uniform(.12, .9); d = 160
        sphere('star', (math.sin(a) * d, math.cos(a) * d, math.sin(el) * d * .7 + 8), rnd.uniform(.25, .6), glow, seg=8, rings=4)
    sphere('moon', (60, 150, 70), 9, mat('#FFF4CF', 'glow', strength=3.5), seg=32, rings=16)


def sun_disc(k, loc=(-40, 160, 60), r=10):
    return sphere('SunDisc', loc, r, mat('#FFE45C', 'glow', strength=4), seg=32, rings=16)


def cloud(loc, s=1.0, m=None, rnd=None):
    rnd = rnd or random.Random(int(loc[0] * 13 + loc[1]))
    m = m or mat('#FFFFFF', 'matte', rough=.9)
    root = empty('cloud', loc)
    for i in range(6):
        x = (i - 2.5) * 1.1 * s; z = rnd.uniform(-.2, .7) * s * (1 - abs(i - 2.5) / 3)
        r = s * rnd.uniform(1.1, 1.7) * (1 - abs(i - 2.5) / 5)
        sphere('puff', (x, rnd.uniform(-.3, .3), z), (r, r * .8, r * .78), m, root, seg=20, rings=10)
    return root


def tree(loc, s=1.0, rnd=None, leaf='#3FBF5A'):
    rnd = rnd or random.Random(int(loc[0] * 7 + loc[1] * 3))
    root = empty('tree', loc)
    cylinder('trunk', (0, 0, .7 * s), .14 * s, 1.4 * s, mat('#9A6638', 'plastic', rough=.6), root, seg=16)
    lm = mat(leaf, 'plastic', rough=.5)
    for (x, y, z, r) in ((0, 0, 1.9, .95), (-.55, .1, 1.55, .62), (.55, -.05, 1.6, .66), (.1, .2, 2.5, .6)):
        sphere('leaf', (x * s, y * s, z * s), r * s * rnd.uniform(.92, 1.08), lm, root, seg=24, rings=12)
    return root


def flower(loc, col, s=1.0):
    root = empty('flower', loc)
    cylinder('stem', (0, 0, .12 * s), .015 * s, .24 * s, mat('#2E9B4D', 'plastic'), root, seg=8)
    pm = mat(col, 'plastic', rough=.35)
    for i in range(5):
        a = i * 2 * math.pi / 5
        sphere('petal', (math.cos(a) * .055 * s, 0, .26 * s + math.sin(a) * .055 * s), (.045 * s, .02 * s, .045 * s), pm, root, seg=12, rings=6)
    sphere('centre', (0, -.012 * s, .26 * s), .03 * s, mat('#FFD43B', 'plastic'), root, seg=12, rings=6)
    return root


def town(k, theme='meadow', seed=1, x0=-60, x1=140, dashes=True, trees=True):
    rnd = random.Random(seed)
    night = getattr(k, 'sky_mode', 'day') == 'night'
    grass = mat('#5CC85A', 'matte', rough=.85, vary=('#4DB84E', '#74D867'), vary_scale=.15, name='grass')
    plane('ground', ((x0 + x1) / 2, 40, 0), (x1 - x0 + 200, 260), grass)
    plane('road', ((x0 + x1) / 2, ROAD_Y, .006), (x1 - x0 + 80, ROAD_W), mat('#5A6075', 'matte', rough=.75, name='asphalt'))
    for y in (ROAD_Y - ROAD_W / 2 + .12, ROAD_Y + ROAD_W / 2 - .12):
        plane('edge', ((x0 + x1) / 2, y, .009), (x1 - x0 + 80, .1), mat('#FFFFFF', 'matte', rough=.6))
    box('walk', ((x0 + x1) / 2, WALK_Y, .04), (x1 - x0 + 80, WALK_W, .08), mat('#E9E1D3', 'matte', rough=.7, name='walk'), bevel=.03, seg=2)
    if dashes:
        dm = mat('#FFD43B', 'plastic', rough=.4)
        for x in range(int(x0 - 20), int(x1 + 20), 3):
            box('dash', (x, ROAD_Y, .012), (1.4, .14, .012), dm, bevel=.005, seg=1)
    # flowers along the verge behind the sidewalk
    cols = ['#FF4D6D', '#FF8FB5', '#FFFFFF', '#FFC61A', '#B07BFF']
    for i, x in enumerate(range(int(x0), int(x1), 2)):
        flower((x + rnd.uniform(-.6, .6), WALK_Y - WALK_W / 2 - .35 - rnd.uniform(0, .5), 0), cols[i % 5], 1.3)
    hill = lambda col: mat(col, 'matte', rough=.8, vary=(col, '#8EDB7E'), vary_scale=.05)
    if theme == 'sea':
        plane('sand', ((x0 + x1) / 2, ROAD_Y + ROAD_W / 2 + 2.6, .004), (x1 - x0 + 80, 5.2), mat('#FFE1A6', 'matte', rough=.9, name='sand'))
        plane('sea', ((x0 + x1) / 2, 90, .02), (x1 - x0 + 300, 170), mat('#2F8FE8', 'water', rough=.08, bump=.25, bump_scale=6, name='sea'))
        for i in range(8):
            sphere('island', (x0 + i * 30 + rnd.uniform(-5, 5), 150, -6), (22, 14, 12), hill('#58BD62'), seg=24, rings=12)
    else:
        for i in range(10):
            sphere('hill', (x0 + i * 22 + rnd.uniform(-6, 6), 70 + rnd.uniform(0, 30), -10), (30 + rnd.uniform(0, 14), 18, 18 + rnd.uniform(0, 6)), hill(['#6DD56E', '#55C45F', '#7EDC78'][i % 3]), seg=32, rings=16)
        if theme == 'hill':
            sphere('bighill', (8, 22, -5), (16, 9, 9), hill('#5ECB61'), seg=40, rings=20)
        if trees:
            for x in range(int(x0), int(x1), 5):
                tree((x + rnd.uniform(-1.5, 1.5), ROAD_Y + ROAD_W / 2 + 2.5 + rnd.uniform(0, 6), 0), rnd.uniform(.85, 1.2), rnd, ['#3FBF5A', '#4CCB55', '#35B04E'][rnd.randrange(3)])
    cm = mat('#FFFFFF' if not night else '#8C96C8', 'matte', rough=.9, name='cloudmat' + ('n' if night else ''))
    for i in range(12):
        cloud((x0 + i * 18 + rnd.uniform(-5, 5), 70 + rnd.uniform(0, 30), 16 + rnd.uniform(0, 10)), rnd.uniform(2.2, 3.4), cm, rnd)
