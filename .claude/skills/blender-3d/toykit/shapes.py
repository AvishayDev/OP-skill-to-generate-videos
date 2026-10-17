# toykit.shapes — materials (toy plastic, soft skin, car paint, glow, ground) and smooth primitives with parenting.
# Colours are '#RRGGBB' (sRGB) and are converted to linear for Blender. Children are placed in their parent's space.
import bpy, bmesh, math
from mathutils import Vector

_MATS = {}


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + .055) / 1.055) ** 2.4 if x > .04045 else x / 12.92 for x in c) + (1.0,)


def mat(col, kind='plastic', rough=None, name=None, **kw):
    """kind: plastic | skin | paint | matte | glow | rubber | metal | glass | water."""
    key = name or f'{kind}:{col}:{rough}:{sorted(kw.items())}'
    if key in _MATS: return _MATS[key]
    m = bpy.data.materials.new(key); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(col)
    R = {'plastic': .32, 'skin': .45, 'paint': .22, 'matte': .8, 'glow': .5, 'rubber': .7, 'metal': .25, 'glass': .05, 'water': .04}
    b.inputs['Roughness'].default_value = rough if rough is not None else R.get(kind, .4)
    if kind == 'plastic': b.inputs['Coat Weight'].default_value = .35; b.inputs['Coat Roughness'].default_value = .15
    if kind == 'paint': b.inputs['Coat Weight'].default_value = 1.0; b.inputs['Coat Roughness'].default_value = .05
    if kind == 'skin':
        b.inputs['Subsurface Weight'].default_value = .25
        b.inputs['Subsurface Radius'].default_value = (1.0, .45, .3)
        b.inputs['Subsurface Scale'].default_value = .03
        b.inputs['Coat Weight'].default_value = .12
        b.inputs['Sheen Weight'].default_value = .2
    if kind == 'metal': b.inputs['Metallic'].default_value = 1.0
    if kind == 'glow':
        b.inputs['Emission Color'].default_value = srgb(col)
        b.inputs['Emission Strength'].default_value = kw.get('strength', 3.0)
    if kind in ('glass', 'water'):
        b.inputs['Transmission Weight'].default_value = .85 if kind == 'water' else .95
        b.inputs['IOR'].default_value = 1.33 if kind == 'water' else 1.45
    if kw.get('bump'):
        tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = kw.get('bump_scale', 40)
        bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = kw['bump']
        nt.links.new(tex.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    if kw.get('vary'):            # subtle colour variation (grass, hills)
        tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = kw.get('vary_scale', 3)
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color = srgb(kw['vary'][0]); ramp.color_ramp.elements[1].color = srgb(kw['vary'][1])
        nt.links.new(tex.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    _MATS[key] = m
    return m


def _link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def empty(name='Empty', loc=(0, 0, 0), parent=None, rot=(0, 0, 0)):
    o = _link(bpy.data.objects.new(name, None))
    o.empty_display_size = .2
    if parent: o.parent = parent
    o.location = loc; o.rotation_euler = rot
    return o


def _finish(o, m, parent, loc, rot, scale, smooth=True, subsurf=0):
    if parent: o.parent = parent
    o.location, o.rotation_euler, o.scale = loc, rot, scale
    if m: o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    if subsurf:
        s = o.modifiers.new('Sub', 'SUBSURF'); s.levels = s.render_levels = subsurf
    return o


def _mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return _link(bpy.data.objects.new(name, me))


def sphere(name, loc=(0, 0, 0), scale=(1, 1, 1), m=None, parent=None, rot=(0, 0, 0), r=1.0, seg=32, rings=16):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    if isinstance(scale, (int, float)): scale = (scale,) * 3
    return _finish(_mesh_from_bm(name, bm), m, parent, loc, rot, scale)


def box(name, loc=(0, 0, 0), size=(1, 1, 1), m=None, parent=None, rot=(0, 0, 0), bevel=0.1, seg=4):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    o = _finish(_mesh_from_bm(name, bm), m, parent, loc, rot, (1, 1, 1), smooth=True)
    if bevel:
        b = o.modifiers.new('Bevel', 'BEVEL'); b.width = min(bevel, min(size) / 2 - 1e-3); b.segments = seg; b.limit_method = 'NONE'
        b.harden_normals = False
    return o


def cylinder(name, loc=(0, 0, 0), r=1.0, depth=1.0, m=None, parent=None, rot=(0, 0, 0), seg=40, bevel=0.0, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=depth)
    o = _finish(_mesh_from_bm(name, bm), m, parent, loc, rot, scale)
    if bevel:
        b = o.modifiers.new('Bevel', 'BEVEL'); b.width = bevel; b.segments = 4; b.limit_method = 'ANGLE'
    for p in o.data.polygons:                # flat caps, smooth sides
        p.use_smooth = abs(p.normal.z) < .5
    return o


def cone(name, loc=(0, 0, 0), r1=1.0, r2=0.0, depth=1.0, m=None, parent=None, rot=(0, 0, 0), seg=32):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=seg, radius1=r1, radius2=r2, depth=depth)
    return _finish(_mesh_from_bm(name, bm), m, parent, loc, rot, (1, 1, 1))


def torus(name, loc=(0, 0, 0), R=1.0, r=.25, m=None, parent=None, rot=(0, 0, 0), seg=64, rseg=16, arc=2 * math.pi):
    """A torus (or an arc of one, `arc` radians starting on +X, in the XZ plane when rot=(pi/2,0,0))."""
    bm = bmesh.new()
    full = abs(arc - 2 * math.pi) < 1e-6
    rings = []
    n = seg if full else seg + 1
    for i in range(n):
        a = arc * i / seg
        c = Vector((math.cos(a) * R, math.sin(a) * R, 0))
        out = Vector((math.cos(a), math.sin(a), 0))
        ring = []
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            ring.append(bm.verts.new(c + out * (math.cos(b) * r) + Vector((0, 0, math.sin(b) * r))))
        rings.append(ring)
    for i in range(seg if full else seg):
        a, b2 = rings[i], rings[(i + 1) % n]
        for j in range(rseg):
            bm.faces.new((a[j], a[(j + 1) % rseg], b2[(j + 1) % rseg], b2[j]))
    if not full:
        for ring in (rings[0], rings[-1]):
            try: bm.faces.new(ring)
            except ValueError: pass
    bm.normal_update()
    return _finish(_mesh_from_bm(name, bm), m, parent, loc, rot, (1, 1, 1))


def star(name, loc=(0, 0, 0), r=1.0, inner=.45, depth=.2, m=None, parent=None, rot=(0, 0, 0), points=5):
    bm = bmesh.new(); top, bot = [], []
    for i in range(points * 2):
        a = math.pi / 2 + i * math.pi / points; rad = r if i % 2 == 0 else r * inner
        top.append(bm.verts.new((math.cos(a) * rad, math.sin(a) * rad, depth / 2)))
        bot.append(bm.verts.new((math.cos(a) * rad, math.sin(a) * rad, -depth / 2)))
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(len(top)):
        j = (i + 1) % len(top); bm.faces.new((top[i], bot[i], bot[j], top[j]))
    bm.normal_update()
    o = _finish(_mesh_from_bm(name, bm), m, parent, loc, rot, (1, 1, 1), smooth=False)
    b = o.modifiers.new('Bevel', 'BEVEL'); b.width = depth * .4; b.segments = 3; b.limit_method = 'ANGLE'
    return o


def plane(name, loc=(0, 0, 0), size=(10, 10), m=None, parent=None, rot=(0, 0, 0)):
    bm = bmesh.new(); hx, hy = size[0] / 2, size[1] / 2
    bm.faces.new([bm.verts.new(p) for p in ((-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0))])
    o = _finish(_mesh_from_bm(name, bm), m, parent, loc, rot, (1, 1, 1), smooth=False)
    return o


def text(name, s, loc=(0, 0, 0), size=1.0, m=None, parent=None, rot=(math.pi / 2, 0, 0), font=None, extrude=.12, bevel=.04, align='CENTER'):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = s
    if font:
        try: cu.font = bpy.data.fonts.load(font, check_existing=True)
        except RuntimeError: pass
    cu.size = size; cu.extrude = extrude; cu.bevel_depth = bevel; cu.bevel_resolution = 3
    cu.align_x = align; cu.align_y = 'CENTER'
    o = _link(bpy.data.objects.new(name, cu))
    if parent: o.parent = parent
    o.location, o.rotation_euler = loc, rot
    if m: o.data.materials.append(m)
    return o


def boolean_cut(target, cutter):
    mod = target.modifiers.new('Cut', 'BOOLEAN'); mod.operation = 'DIFFERENCE'; mod.object = cutter; mod.solver = 'EXACT'
    cutter.hide_render = True; cutter.hide_viewport = True
    return mod
