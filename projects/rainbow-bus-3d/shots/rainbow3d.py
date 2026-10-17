# "The Rainbow Bus" in real 3D — one scene file for all 26 shots (the shot id picks the scene).
#   hook-a/b/c   the bus rolls in · Milo at the wheel · rolling by, waving
#   <colour>-a/b/c/d   red / yellow / green / blue stop: arrive · meet the friend · their action · they hop aboard
#   count-a/b/c  counting the five friends · rainbow-a/b/c the rainbow · end-a sunset · end-b goodnight
# Words land on their cue words (shots.json → cues); the featured character lip-syncs to the voice.
import math
from toykit import *

PARK = -1.3                                     # bus x when parked at a stop
FRIEND = (2.45, -3.0, .08)                      # where the friend waits on the sidewalk
SIGN = (3.75, -2.0, .08)
ORDER = ['bella', 'duckie', 'fred', 'bear']     # boarding order
SEAT = {'bella': 3, 'duckie': 2, 'fred': 1, 'bear': 0}
STOPS = {
    'red':    dict(col='#FF3B4D', kind='bella',  word='RED',    name='BELLA BUNNY', theme='meadow'),
    'yellow': dict(col='#FFC21A', kind='duckie', word='YELLOW', name='DUCKIE',      theme='meadow'),
    'green':  dict(col='#2FBF4F', kind='fred',   word='GREEN',  name='FROGGY FRED', theme='hill'),
    'blue':   dict(col='#2F7FFF', kind='bear',   word='BLUE',   name='LITTLE BEAR', theme='sea'),
}
CAM = ((1.0, -8.4, 1.55), (1.0, 0, 1.45), 34)     # the standard stop framing


def font(k): return k.fonts.get('Fredoka')


def title(k, s, loc, size, t_in, t_out=None):
    """Rainbow-lettered 3D title: each letter its own colour, springing in one after another."""
    w = size * .62
    letters = [ch for ch in s]
    x0 = loc[0] - w * (len(letters) - 1) / 2
    ci = 0
    for i, ch in enumerate(letters):
        if ch == ' ': continue
        word(k, ch, (x0 + i * w, loc[1], loc[2]), size, RAINBOW[ci % 6], t_in + i * .06, t_out, font=font(k))
        ci += 1


def bus_with(k, pos, riders=(), bounce=None, mirror=False, driver_talk='voice', wave=None, cheer=None, size=1.0):
    """The bus + Milo driving + seated riders. pos: function of t. Riders sit inside (parented to the bus)."""
    bus = Bus(k, pos(0), size, mirror=mirror)
    bus.animate(pos, bounce=bounce)
    back = 0.0
    m = Char(k, 'milo', bus.driver_seat(), .8, face=back); m.root.parent = bus.root
    m.animate(pos=bus.driver_seat(), talk=driver_talk, wave=wave, arms_up=cheer, face=back, look=(-.4 if mirror else .4, -.1))
    for r in riders:
        c = Char(k, r, bus.seat(SEAT[r]), .8, face=back); c.root.parent = bus.root
        c.animate(pos=bus.seat(SEAT[r]), talk='voice' if cheer or wave else None, wave=wave, arms_up=cheer, face=back, look=(0, -.1))
    return bus


def arrive(t, T=2.6, x0=-16.0, x1=PARK):
    k = clamp(t / T); return x0 + (x1 - x0) * ease_out(k)


def leave(t, t0, x0=PARK):
    q = max(0.0, t - t0); return x0 + 4.0 * q * q


def build(k):
    key, ph = k.id.split('-')
    globals()['scene_' + key](k, ph)


# ---------------------------------------------------------------- hook
def scene_hook(k, ph):
    sky(k, 'day'); sun_disc(k); town(k, 'meadow')
    if ph == 'a':
        x = lambda t: arrive(t, 3.0, -15, -.4)
        bus_with(k, lambda t: (x(t), 0, 0), bounce=lambda t: 1 - clamp(t / 3))
        k.camera(lambda t: (x(t) * .6 + .8, -8.6, 1.7), lambda t: (x(t) * .6 + .8, 0, 1.5), 32)
        word(k, 'BEEP BEEP!', (.6, -1.8, 3.2), .62, '#FF3B4D', .15, 2.3, font=font(k))
        title(k, 'RAINBOW BUS', (.4, -1.8, 3.15), .62, k.cue('title'))
    elif ph == 'b':
        x = lambda t: -2 + 2.4 * t
        bus = bus_with(k, lambda t: (x(t), 0, 0), bounce=lambda t: .6)
        dx, dz = 1.78, .95 + .8 * .82
        k.camera(lambda t: (x(t) + dx + .75, -3.7, dz + .05), lambda t: (x(t) + dx + .12, 0, dz - .12), 40)
        word(k, 'MILO', (0, 0, 0), .3, '#3D8BFF', k.cue('milo'), font=font(k))
        _follow_last_word(k, lambda t: (x(t) + dx + 1.0, -1.6, dz + .55))
    else:
        x = lambda t: -5.5 + 3.2 * t
        bus_with(k, lambda t: (x(t), 0, 0), bounce=lambda t: .8, wave=1)
        k.camera((1.5, -9.0, 1.7), (1.5, 0, 1.5), 30)
        word(k, 'HOP ON!', (-.5, -1.8, 3.25), .7, '#2FBF4F', k.cue('hop') + .05, k.cue('ride') - .2, font=font(k))
        title(k, 'COME RIDE WITH US', (1.5, -1.8, 3.25), .42, k.cue('ride'))


def _follow_last_word(k, fn):
    import bpy
    w = [o for o in bpy.data.objects if o.name.startswith('word') and o.parent is None][-1]
    k._drives = [d for d in k._drives if not (d[0] is w and d[1] == 'location')]
    k.drive(w, 'location', lambda t: tuple(fn(t)))


# ---------------------------------------------------------------- the four stops
def stop_scene(k, colour, ph):
    S = STOPS[colour]; kind = S['kind']
    before = ORDER[:ORDER.index(kind)]
    sky(k, 'day'); sun_disc(k); town(k, S['theme'], seed=ORDER.index(kind) + 2)
    boards = ph == 'd' or (colour == 'blue' and ph == 'c')
    fly_at = (k.cue('blue') if colour == 'blue' else .45) if boards else 1e9
    fly_len = 1.25
    leave_at = k.dur - 1.6 if boards else 1e9
    if ph == 'a': bx = lambda t: arrive(t, min(2.6, k.dur - .3))
    else: bx = lambda t: leave(t, leave_at)
    riders = list(before) + ([kind] if boards else [])
    bus = bus_with(k, lambda t: (bx(t), 0, 0), riders=before, bounce=lambda t: (1 - clamp(t / 2.6)) if ph == 'a' else clamp((t - leave_at) * 2),
                   driver_talk=None if ph != 'a' else 'voice', wave=(lambda t: 1 if fly_at - .2 < t < fly_at + fly_len + .4 else 0) if boards else None)
    stop_sign(k, SIGN, S['col'], S['word'], font=font(k), pop=(k.cue('stop') - .1) if ph == 'a' else None, size=.78)
    k.camera(*CAM)
    if ph == 'a':
        word(k, S['word'] + ' STOP!', (1.0, -2.2, 2.95), .62, S['col'], k.cue('stop'), font=font(k))
        return
    # the friend
    fx, fy, fz = FRIEND
    seat = bus.seat(SEAT[kind])
    def friend_pos(t):
        if ph == 'b': x = fx + 7 * (1 - ease_out(clamp(t / .9)))
        else: x = fx
        if t < fly_at: return (x, fy, fz)
        q = ease_io(clamp((t - fly_at) / fly_len))
        tx, ty, tz = bx(t) + seat[0], seat[1], seat[2]
        return (lerp(x, tx, q), lerp(fy, ty, q), lerp(fz, tz, q) + math.sin(q * math.pi) * 1.9)
    def friend_hop(t):
        if t >= fly_at: return 0
        if colour == 'red' and ph == 'c': return .55 * hop(t, 1.6)
        if colour == 'green' and ph == 'c': return .8 * hop(t, 1.25)
        if colour == 'yellow' and ph == 'b': return .5 * hop(max(0, t - k.cue('splash')), 1.8) if t > k.cue('splash') else 0
        if ph == 'b' and t < .9: return .25 * hop(t, 2.2)
        return .06 * hop(t, 2)
    def friend_squash(t):
        if t >= fly_at: return 1
        h = friend_hop(t); return 1 + (.12 if h > .05 else -.08 * (1 - h / .06 if h < .06 else 0)) * (1 if colour in ('red', 'green') and ph == 'c' else .4)
    friend = Char(k, kind, (fx, fy, fz), 1.25)
    size = lambda t: lerp(1.25, .8, ease_io(clamp((t - fly_at) / fly_len))) if t >= fly_at else 1.25
    friend.animate(pos=friend_pos, hop=friend_hop, squash=friend_squash, size=size, talk='voice',
                   wave=(lambda t: 1 if t > k.cue('wave') - .3 else 0) if (colour == 'green' and ph == 'b') else (lambda t: 1 if ph == 'd' and t < fly_at else 0),
                   face=lambda t: -.35 if t < fly_at else 0, look=(-.5, 0))
    # props
    if colour == 'red' and not (boards and False):
        t_b = k.cue('balloon') if ph == 'b' else -1
        b = balloon(k, (0, 0, 0))
        k.drive(b, 'location', lambda t: (friend_pos(t)[0] + .5 * size(t) / 1.25, friend_pos(t)[1] - .05, friend_pos(t)[2] + friend_hop(t) * size(t) + 1.75 * size(t) / 1.25))
        k.drive(b, 'scale', lambda t: (max(1e-4, spring(clamp((t - t_b) / .8)) * size(t) / 1.25),) * 3)
    if colour == 'yellow':
        puddle((fx, fy + .05, .085), .85)
        if ph == 'b':
            for d, off in ((0, 0), (.45, .3)): burst(k, (fx, fy, .2), k.cue('splash') + d, 16, '#7CCBFF', 2.2, 3.8, seed=4 + off * 10)
        if ph == 'c':
            for i in range(3): burst(k, (fx, fy, .2), .3 + i * 1.1, 10, '#7CCBFF', 1.8, 3.0, seed=9 + i)
    if colour == 'blue':
        bk = bucket((fx + .75, fy - .1, .08))
        if ph == 'b':
            k.drive(bk, 'scale', lambda t: (max(1e-4, spring(clamp(t / .7))),) * 3)
            burst(k, (fx + .75, fy - .1, .55), k.cue('shells'), 6, '#FFB3D0', 1.4, 3.5, r=.07, life=1.4, seed=21)
        if ph == 'c': burst(k, (fx - 1.2, -1.0, .1), k.cue('splash'), 18, '#7CCBFF', 2.4, 4.0, seed=6)
    # words
    W = lambda s, col, t, size=.62, x=.9, z=2.95, out=None: word(k, s, (x, -2.2, z), size, col, t, out, font=font(k))
    if ph == 'b':
        W(S['name'], S['col'], k.cue('name'), .42, x=fx - .9, z=2.95)
        if colour == 'yellow': W('SPLASH!', '#2F7FFF', k.cue('splash'), .6, x=-1.0, z=3.0)
        if colour == 'green': W('RIBBIT!', '#2FBF4F', k.cue('ribbit'), .6, x=-1.0, z=3.0)
    if ph == 'c':
        if colour == 'red': W('BOUNCE!', '#FF3B4D', k.cue('bounce'), .8, x=-.6); W('UP!', '#9B5DE5', k.cue('up'), .6, x=2.9, z=3.05)
        if colour == 'yellow': W('QUACK!', '#FFC21A', k.cue('quack'), .8, x=-.6); W('QUACK!', '#FF9A1F', k.cue('quack') + .55, .5, x=2.9, z=3.05)
        if colour == 'green': W('JUMP! JUMP!', '#2FBF4F', k.cue('jump'), .7, x=0)
        if colour == 'blue': W('SPLASH!', '#2F7FFF', k.cue('splash'), .75, x=-.8); W('BLUE!', '#2F7FFF', k.cue('blue'), .65, x=2.9, z=3.05)
    if ph == 'd':
        W(S['word'] + '!', S['col'], k.cue(colour), .9)
        if colour == 'green': W('BUMP BUMP!', '#2E9B4D', k.cue('bump'), .4, x=-.4, z=2.4)
        if colour == 'red': twinkles(k, (fx, -2.2, 2.2), (.8, .2, .6), 10, ('#FF8FB5', '#FFFFFF'), .1, t0=k.cue('hello'))
    if boards: twinkles(k, (bx(0) + seat[0], -1.2, 1.7), (.6, .2, .4), 8, t0=fly_at + fly_len)


def scene_red(k, ph): stop_scene(k, 'red', ph)
def scene_yellow(k, ph): stop_scene(k, 'yellow', ph)
def scene_green(k, ph): stop_scene(k, 'green', ph)
def scene_blue(k, ph): stop_scene(k, 'blue', ph)


# ---------------------------------------------------------------- counting
def scene_count(k, ph):
    sky(k, 'day'); sun_disc(k); town(k, 'meadow', seed=9)
    cheer = 1 if ph == 'c' else None
    bus = bus_with(k, lambda t: (0, 0, 0), riders=ORDER, mirror=True, bounce=lambda t: .35 if ph != 'c' else .9, cheer=cheer, wave=None)
    k.camera((0, -6.4, 1.7), (0, 0, 1.75), 31)
    # number badges over each window, left → right: Milo, Bella, Duckie, Fred, Bear (the bus faces left)
    xs = {'milo': -1.78, 'bella': -.95, 'duckie': -.1, 'fred': .75, 'bear': 1.6}
    cols = ['#FF3B4D', '#FF9A1F', '#FFC21A', '#2FBF4F', '#2F7FFF']
    cue_of = {'milo': 'one', 'bella': 'two', 'duckie': 'three', 'fred': 'four', 'bear': 'five'}
    for i, who in enumerate(['milo', 'bella', 'duckie', 'fred', 'bear']):
        c = cue_of[who]
        t_in = k.cue(c) if k.has(c) else (-1 if (ph == 'b' and i < 2) or ph == 'c' else None)
        if t_in is None: continue
        word(k, str(i + 1), (xs[who], -1.2, 2.62), .5, cols[i], t_in, font=font(k))
    if ph == 'c':
        title(k, 'RAINBOW BUS', (0, -1.3, 3.02), .4, k.cue('rainbow'))
        twinkles(k, (0, -1.5, 2.2), (3, .3, 1.2), 22, t0=0)


# ---------------------------------------------------------------- rainbow
def scene_rainbow(k, ph):
    sky(k, 'day'); sun_disc(k, (-60, 160, 45)); town(k, 'meadow', seed=11)
    rise = (lambda t: -16 + 16 * ease_out(clamp((t - .2) / (k.cue('look') + .8)))) if ph == 'a' else (lambda t: 0)
    rb = rainbow((1, 26, 0), R=15, band=.95)
    k.drive(rb, 'location', lambda t: (1, 26, rise(t)))
    if ph == 'c':
        x = lambda t: -10 + 5.2 * t
        bus_with(k, lambda t: (x(t), 0, 0), riders=ORDER, bounce=lambda t: .8, wave=1)
    else:
        bus_with(k, lambda t: (-2.4, 0, 0), riders=ORDER, cheer=1 if ph == 'b' else None, wave=None)
    k.camera((1, -12.5, 1.4), (1, 0, 3.6), 27)
    if ph == 'a':
        word(k, 'LOOK UP HIGH!', (1, -1.5, 5.2), .75, '#9B5DE5', .1, font=font(k))
        word(k, 'A RAINBOW!', (1, -1.5, 4.1), .85, '#FF3B4D', k.cue('look'), font=font(k))
    if ph == 'b':
        for i, (c, s, col) in enumerate((('red', 'RED', '#FF3B4D'), ('yellow', 'YELLOW', '#FFC21A'), ('green', 'GREEN', '#2FBF4F'), ('blue', 'BLUE', '#2F7FFF'))):
            word(k, s, (-2.6 + i * 2.4, -1.5, 4.9 - (i % 2) * .7), .65, col, k.cue(c), font=font(k))
            twinkles(k, (-2.6 + i * 2.4, -1.4, 4.6), (.7, .2, .4), 4, seed=30 + i, t0=k.cue(c))
    if ph == 'c':
        title(k, 'JUST FOR YOU!', (1, -1.5, 4.6), .75, k.cue('you'))
        twinkles(k, (1, 6, 7), (9, 2, 4), 36, t0=0)


# ---------------------------------------------------------------- the end
def scene_end(k, ph):
    if ph == 'a':
        sky(k, 'sunset', sun_az=-20)
        sun = sun_disc(k, (-25, 160, 30), 11)
        k.drive(sun, 'location', lambda t: (-25, 160, 30 - 34 * ease_io(clamp(t / k.dur))))
        town(k, 'meadow', seed=12)
        bus_with(k, lambda t: (-.4, 0, 0), riders=ORDER)
        k.camera((-.4, -10.5, 1.7), (-.4, 0, 2.2), 30)
        word(k, 'DOWN, DOWN, DOWN', (-.4, -1.5, 4.0), .6, '#FFB347', k.cue('sun'), font=font(k))
    else:
        sky(k, 'night'); town(k, 'meadow', seed=13)
        x = lambda t: -1.2 + (2.2 * max(0, t - k.cue('night')) ** 2)
        bus_with(k, lambda t: (x(t), 0, 0), riders=ORDER, wave=1, bounce=lambda t: clamp((t - k.cue('night')) * 2))
        k.camera((-.2, -10.5, 1.8), (-.2, 0, 2.0), 30)
        word(k, 'WAVE GOODBYE!', (-.2, -1.5, 4.0), .7, '#FFE08A', k.cue('wave'), k.cue('night') - .15, font=font(k))
        word(k, 'GOODNIGHT!', (-.2, -1.5, 3.7), .9, '#FFFFFF', k.cue('night'), font=font(k))
        twinkles(k, (-.2, 2, 5), (7, 2, 2), 26, ('#FFF6C2', '#FFFFFF'), .14)
