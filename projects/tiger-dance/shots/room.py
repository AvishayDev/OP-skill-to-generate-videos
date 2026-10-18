import math, bpy
from toykit import *
from toykit.characters import KINDS
from toykit.shapes import sphere, box, plane, mat, empty, cylinder, torus, srgb


def striped(c1, c2, scale=7):
    m = bpy.data.materials.new('stripes'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = .75
    w = nt.nodes.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = 'Z'
    w.inputs['Scale'].default_value = scale; w.inputs['Distortion'].default_value = 0; w.wave_profile = 'SAW'
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(tc.outputs['Generated'], w.inputs['Vector'])
    r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'
    r.color_ramp.elements[0].color = srgb(c1); r.color_ramp.elements[1].position = .5; r.color_ramp.elements[1].color = srgb(c2)
    nt.links.new(w.outputs['Fac'], r.inputs['Fac']); nt.links.new(r.outputs['Color'], b.inputs['Base Color'])
    return m


def tiles(c1, c2):
    m = bpy.data.materials.new('floor'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = .35
    t = nt.nodes.new('ShaderNodeTexBrick'); t.inputs['Scale'].default_value = 33
    t.inputs['Color1'].default_value = srgb(c1); t.inputs['Color2'].default_value = srgb(c2); t.inputs['Mortar'].default_value = srgb('#A8916A')
    t.inputs['Mortar Size'].default_value = .012; t.inputs['Brick Width'].default_value = 1.0; t.inputs['Row Height'].default_value = 1.0
    t.offset = 0
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    return m


def build(k):
    sc = k.scene
    # world + lights
    w = bpy.data.worlds.new('W'); w.use_nodes = True; sc.world = w
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = srgb('#CFE3F5'); bg.inputs['Strength'].default_value = .65
    for nm, loc, e, size, col in (('key', (-4, -5, 5.5), 520, 4, '#FFF1DC'), ('fill', (5, -5, 2.5), 250, 5, '#CFE0FF')):
        ld = bpy.data.lights.new(nm, 'AREA'); ld.energy = e; ld.size = size; ld.color = srgb(col)[:3]
        lo = bpy.data.objects.new(nm, ld); lo.location = loc; sc.collection.objects.link(lo)
        tg = bpy.data.objects.new(nm + 't', None); tg.location = (0, 0, 1); sc.collection.objects.link(tg)
        c = lo.constraints.new('TRACK_TO'); c.target = tg; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    # room
    plane('floor', (0, 0, 0), (30, 30), tiles('#D8BF94', '#CFB488'))
    plane('wall', (0, 3.4, 5), (30, 12), mat('#76B4E0', 'matte', rough=.9, bump=.05, bump_scale=200), rot=(math.pi / 2, 0, 0))
    sofa = mat('#3F7BBF', 'matte', rough=.85, bump=.18, bump_scale=120)
    box('sofaBack', (0, 2.35, .85), (5.4, .75, 1.7), sofa, bevel=.25)
    box('sofaSeat', (0, 1.75, .4), (5.4, 1.4, .8), mat('#4A87CB', 'matte', rough=.85, bump=.18, bump_scale=120), bevel=.2)
    for sx in (-1, 1): box('sofaArm', (sx * 2.85, 1.8, .55), (.7, 1.7, 1.1), sofa, bevel=.25)
    for sx in (-.95, .95): box('cushion', (sx * 1.1, 1.9, .95), (1.6, .45, .9), mat('#6A9FD6', 'matte', rough=.85), bevel=.2, parent=None)
    # little tiger-face decals on the wall (like the duck decals)
    org, cream, dark = mat('#FFA21F', 'plastic', rough=.4), mat('#FFF1D2', 'plastic'), mat('#2A140A', 'plastic')
    for i, (x, z, s) in enumerate(((-2.6, 3.4, .5), (-1.2, 4.0, .45), (.9, 4.3, .5), (2.7, 3.5, .45), (-3.0, 1.6, .4), (3.1, 2.1, .4), (-.2, 3.1, .35))):
        e = empty('decal', (x, 3.3, z)); e.rotation_euler = (0, 0, 0)
        sphere('df', (0, 0, 0), (s * .8, s * .1, s * .8), org, e)
        for sx in (-1, 1): sphere('de', (sx * s * .62, 0, s * .66), (s * .27, s * .1, s * .27), org, e)
        sphere('dm', (0, -.05, -s * .22), (s * .42, s * .07, s * .3), cream, e)
        for sx in (-1, 1): sphere('dy', (sx * s * .28, -.08, s * .12), (s * .07, s * .04, s * .09), dark, e)
        sphere('dn', (0, -.11, -s * .08), (s * .1, s * .04, s * .06), dark, e)

    # characters
    KINDS['tiger'] = dict(skin='#FF9A1F', body='#FF9A1F', iris='#6B3A12', shoe='#FFF1D2', head=1.12)
    baby = Char(k, 'milo', (-.7, -.2, 0), 1.4, face=.25, name='baby', hair='#6B4226', body='#FFFFFF', skin='#FFC79E',
                shirt=striped('#FFFFFF', '#26335E', 3.2), legs='#3F73B0', nostar=True, shoe='#F5F5F8', iris='#6B3E1E')
    tiger = Char(k, 'tiger', (.65, .5, 0), 2.0, face=-.3, name='tiger')
    H, B = tiger.head, tiger.body
    pinkm = mat('#FF8FA8', 'skin')
    for sx in (-1, 1):
        sphere('t_ear', (sx * .22, .02, .24), (.1, .06, .1), org, H)
        sphere('t_earIn', (sx * .22, -.025, .24), (.06, .03, .06), pinkm, H)
        sphere('t_cheek', (sx * .2, -.2, -.1), (.09, .06, .07), cream, H)
        for z, l in ((.02, .06), (-.07, .05)):
            sphere('t_cs', (sx * .3, -.1, z), (.022, l * 1.5, .02), dark, H, rot=(0, 0, 0))
        sphere('t_fs', (sx * .1, -.235, .2), (.014, .012, .055), dark, H, rot=(-.7, sx * .4, 0))
    sphere('t_fs', (0, -.235, .21), (.016, .012, .065), dark, H, rot=(-.7, 0, 0))
    sphere('t_muzzle', (0, -.26, -.1), (.14, .09, .1), cream, H)
    sphere('t_nose', (0, -.335, -.06), (.045, .03, .032), mat('#E86A86', 'plastic', rough=.2), H)
    tiger._mouth('tiger', z=-.15, w=.06, y=-.325)
    sphere('t_belly', (0, -.1, .32), (.15, .1, .17), cream, B)
    for zz in (.22, .3, .38, .46):
        r = .22 * math.sqrt(max(0, 1 - ((zz - .34) / .24) ** 2))
        for sx in (-1, 1): sphere('t_bs', (sx * r * .97, -.03, zz), (.03, .09, .022), dark, B)
    for i, (x, y, z, r) in enumerate(((.16, .2, .17, .05), (.26, .27, .27, .05), (.3, .27, .39, .05))):
        sphere('t_tail', (x, y, z), r, org, B)
    sphere('t_tip', (.3, .27, .45), .056, dark, B)

    baby.animate(talk=.4, hop=lambda t: .06 * abs(math.sin(2 * math.pi * t)), wave=lambda t: .55 + .45 * math.sin(2 * math.pi * t + 1), tilt=lambda t: .08 * math.sin(2 * math.pi * t), look=(.8, .1))
    tiger.animate(talk=lambda t: .5 + .5 * math.sin(4 * math.pi * t), hop=lambda t: .05 * abs(math.sin(2 * math.pi * t + .6)), wave_l=lambda t: .6 + .4 * math.sin(2 * math.pi * t + 2), tilt=lambda t: .08 * math.sin(2 * math.pi * t + 1.5), look=(-.8, .1))
    k.camera((0, -6.1, 1.5), (0, 0, 1.2), 38)
