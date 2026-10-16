'use strict';
// ============================================================
// story.js · the shared 8-second story of the style pack. DATA + TIMING ONLY, no drawing.
// Every style film draws the same beats, so the styles can be compared side by side.
//
//  0.00  reveal   the world appears; the star drops on its string; פיצי pops up
//  0.80  try 1    squat, jump, miss, fall, SPLAT (1.85), dizzy
//  2.30  block 1  "נפילה 1" drops beside it, THUD (2.55); פיצי gets up (2.70)
//  3.00  try 2    higher; the star DODGES; fall, SPLAT (4.05)
//  4.35  block 2  "נפילה 2" lands on block 1 (4.60)
//  4.70  idea     "!" - it sees the stairs; gets up
//  5.05  climb    hop onto block 1, hop onto block 2
//  5.95  leap     leap to the star, GRAB (6.40): the star lights up, celebration
//  6.70  title    "ממשיכים לקום." , held to 8.00
//
// World: 1080x1920 portrait. Ground line GY. The character's pose is described by
// feet position + squash + expression; each style decides how to DRAW that.
// ============================================================
const W = 1080, H = 1920, FPS = 24, DUR = 8, NDRAW = DUR * FPS;
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const eOut = k => 1 - (1 - k) * (1 - k), eIn = k => k * k, eIO = k => k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
const eBack = k => { const s = 1.9; k -= 1; return 1 + k * k * ((s + 1) * k + s); };
const prog = (t, a, b) => clamp((t - a) / (b - a));
function rng(s) { s = (s * 2654435761) >>> 0 || 1; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- layout ----------
const GY = 1580, HX = 380;                       // ground line, home x
const PIV = [540, -60], SLEN = 680;              // star string pivot + length (star rests near 540,620)
const STAR_R = 100;                              // star outer radius (inner = R/2)
const BODY = { rx: 102, ry: 94, cy: -128 };      // character body blob, relative to feet; full height ~225
const TOWER = { x: 800, w: 260, h: 250 };
const BLOCKS = [
  { t: 2.30, land: 2.55, dx: -8, rot: .035, label: 'נפילה', n: '1' },
  { t: 4.35, land: 4.60, dx: 12, rot: -.03, label: 'נפילה', n: '2' },
];
const blockTop = i => GY - TOWER.h * (i + 1);    // 1330, 1080
const TRIES = [
  { T0: .80, apex: 1200, getup: 2.70 },
  { T0: 3.00, apex: 1020, getup: 4.75 },
];
const SPLATS = TRIES.map(r => r.T0 + 1.05);      // 1.85, 4.05
const IDEA = { t0: 4.62, t1: 5.10 };
const HOPS = [
  { t0: 5.05, t1: 5.40, to: [770, blockTop(0)] },
  { t0: 5.50, t1: 5.85, to: [795, blockTop(1)] },
];
const LEAP = { t0: 5.95, t1: 6.40 };
const GRAB_OFF = 290;                            // feet sit this far below the star centre while hanging
const TITLE = { t0: 6.70, text: 'ממשיכים לקום.', words: ['ממשיכים', 'לקום.'], y: 300 };

// ---------- the star ----------
function starAng(t) {
  let a = .06 * Math.sin(t * 2.2);
  if (t > 3.45) { const d = t - 3.45; a += .32 * Math.exp(-d * 1.6) * Math.sin(d * 5); }   // it dodges try 2
  if (t > LEAP.t1) { const d = t - LEAP.t1; a += .28 * Math.exp(-d * .8) * Math.sin(d * 3.4); }  // swinging with פיצי
  return a;
}
function starState(t) {
  const L = SLEN * eBack(prog(t, .1, .6)), a = starAng(t);
  return { visible: t >= .1, x: PIV[0] + L * Math.sin(a), y: PIV[1] + L * Math.cos(a), ang: a, pivot: PIV,
    lit: prog(t, LEAP.t1, LEAP.t1 + .2), grabbed: t >= LEAP.t1, dodge: t > 3.45 && t < 4.3 };
}

// ---------- blocks ("every fall drops one") ----------
function blockState(i, t) {
  const b = BLOCKS[i];
  if (t < b.t) return { visible: false };
  const restY = blockTop(i), k = prog(t, b.t, b.land), d = t - b.land;
  const top = lerp(-TOWER.h - 200, restY, eIn(k));
  const sq = d > 0 ? .14 * Math.exp(-d * 9) * Math.cos(d * 34) : -.06 * k;     // squash after landing
  return { visible: true, x: TOWER.x + b.dx, top, bottom: top + TOWER.h, w: TOWER.w, h: TOWER.h,
    rot: b.rot * (d > 0 ? 1 : 3 * (1 - k)), sq, landed: d >= 0, label: b.label, n: b.n };
}

// ---------- the character ----------
// Returns feet position + deformation + acting. arms: 0 = hanging down, PI = straight up.
// eyes: norm | big | x | happy | spark ; mouth: smile | flat | open | ouch | tiny | wow ; brow: null | det
// phase names let a style swap whole drawings (e.g. pixel sprites) instead of deforming one.
function tryPose(t, tr) {
  const r = t - tr.T0, X1 = HX + 45;
  const s = { phase: 'set', x: HX, y: GY, sx: 1, sy: 1, rot: 0, sc: 1, eyes: 'norm', mouth: 'flat', brow: 'det', look: [.4, -1], armL: .35, armR: .35, legs: 0, jig: 0, dizzy: 0 };
  if (r < 0) return s;
  if (r < .25) { const k = eOut(r / .25); s.phase = 'squat'; s.sy = 1 - .24 * k; s.sx = 1 + .16 * k; s.armL = s.armR = .35 - .5 * k; }
  else if (r < .65) { const k = eOut((r - .25) / .4); s.phase = 'rise'; s.x = lerp(HX, X1, k); s.y = lerp(GY, tr.apex, k); s.sy = lerp(1.24, 1, k); s.sx = lerp(.86, 1, k);
    s.mouth = 'open'; s.eyes = 'big'; s.brow = null; s.armL = 2.5; s.armR = 2.95; s.legs = r * 20; }
  else if (r < .8) { s.phase = 'apex'; s.x = X1; s.y = tr.apex - 10 * Math.sin((r - .65) / .15 * Math.PI); s.mouth = 'open'; s.eyes = 'big'; s.brow = null; s.look = [.7, -1];
    s.armL = 2.4 + Math.sin(r * 40) * .4; s.armR = 3.0; s.legs = r * 30; }
  else if (r < 1.05) { const k = eIn((r - .8) / .25); s.phase = 'fall'; s.x = lerp(X1, HX, k); s.y = lerp(tr.apex, GY, k); s.sy = 1 + .14 * k; s.sx = 1 - .08 * k;
    s.eyes = 'big'; s.mouth = 'ouch'; s.brow = null; s.look = [0, -1]; s.armL = 2.2 + Math.sin(r * 45) * .6; s.armR = 2.3 + Math.cos(r * 43) * .6; s.jig = .6; }
  else {
    const r2 = r - 1.05, w = Math.exp(-r2 * 7) * Math.cos(r2 * 38);
    s.phase = 'splat'; s.sy = .44 + .12 * w; s.sx = 1.5 - .1 * w; s.eyes = 'x'; s.mouth = 'ouch'; s.brow = null; s.armL = 1.5; s.armR = 1.5;
    s.dizzy = clamp(r2 / .12) * (1 - prog(t, tr.getup - .2, tr.getup)); s.jig = Math.exp(-r2 * 4);
    if (r2 > .6) { s.phase = 'down'; s.eyes = 'norm'; s.look = [1, 0]; s.mouth = 'tiny'; }            // looks at the block that landed
    if (t >= tr.getup) { const k = eBack(prog(t, tr.getup, tr.getup + .25)); s.phase = 'getup'; s.sy = lerp(.44, 1, k); s.sx = lerp(1.5, 1, k);
      s.eyes = 'norm'; s.mouth = 'flat'; s.brow = 'det'; s.look = [.4, -1]; s.armL = lerp(1.5, .35, k); s.armR = lerp(1.5, .35, k); s.dizzy = 0; }
  }
  return s;
}
function pose(t) {
  let s;
  if (t < TRIES[0].T0) {                                           // intro pop
    const k = prog(t, .3, .6);
    s = { phase: 'intro', x: HX, y: GY, sx: 1, sy: 1 + .03 * Math.sin(t * 6), rot: 0, sc: eBack(k), eyes: t > .55 ? 'spark' : 'norm', mouth: 'smile', brow: null,
      look: t > .45 ? [.35, -1] : [0, 0], armL: .35, armR: .35, legs: 0, jig: 0, dizzy: 0 };
  } else if (t < TRIES[1].T0) s = tryPose(t, TRIES[0]);
  else if (t < HOPS[0].t0) {
    s = tryPose(t, TRIES[1]);
    if (t >= IDEA.t0 && t < TRIES[1].getup) { s.eyes = 'spark'; s.mouth = 'wow'; s.look = [1, -.6]; }
    if (t >= TRIES[1].getup) { s.eyes = 'spark'; s.mouth = 'smile'; s.look = [1, -.6]; }
  } else if (t < LEAP.t0) {                                         // climb the failure tower
    let from = [HX, GY], at = [HX, GY], hop = null;
    for (const h of HOPS) if (t >= h.t0) { from = at; at = h.to; hop = h; }
    s = { phase: 'perch', x: at[0], y: at[1], sx: 1, sy: 1, rot: 0, sc: 1, eyes: 'norm', mouth: 'smile', brow: 'det', look: [-.4, -1], armL: .35, armR: .35, legs: 0, jig: 0, dizzy: 0 };
    if (t < hop.t1) { const k = prog(t, hop.t0, hop.t1); s.phase = 'hop'; s.x = lerp(from[0], at[0], eIO(k)); s.y = lerp(from[1], at[1], k) - 170 * Math.sin(k * Math.PI);
      s.sy = 1.12 - .12 * k; s.sx = .92 + .08 * k; s.mouth = 'open'; s.armL = s.armR = 2.4; s.legs = k * 12; }
    else { const d = t - hop.t1; if (d < .2) { s.phase = 'land'; s.sy = 1 - .2 * Math.sin(d / .2 * Math.PI); s.sx = 1 + .12 * Math.sin(d / .2 * Math.PI); } }
    if (t > 5.8 && t >= HOPS[1].t1) { const k = eOut(prog(t, 5.8, 5.95)); s.phase = 'squat'; s.sy = 1 - .22 * k; s.sx = 1 + .14 * k; s.look = [-.6, -1]; s.armL = s.armR = .35 - .5 * k; }
  } else if (t < LEAP.t1) {                                         // leap
    const k = prog(t, LEAP.t0, LEAP.t1), st = starState(LEAP.t1), to = [st.x, st.y + GRAB_OFF], from = HOPS[1].to;
    s = { phase: 'leap', x: lerp(from[0], to[0], eIO(k)), y: lerp(from[1], to[1], eOut(k)) - 140 * Math.sin(k * Math.PI), sx: .88 + .12 * k, sy: 1.2 - .2 * k,
      rot: -.15 * Math.sin(k * Math.PI), sc: 1, eyes: 'big', mouth: 'wow', brow: null, look: [-.5, -1], armL: 2.9, armR: 3.0, legs: k * 16, jig: 0, dizzy: 0 };
  } else {                                                          // hanging from the lit star
    const st = starState(t);
    s = { phase: 'hang', x: st.x + GRAB_OFF * Math.sin(st.ang), y: st.y + GRAB_OFF * Math.cos(st.ang), sx: 1, sy: 1, rot: -st.ang, sc: 1,
      eyes: t > LEAP.t1 + .35 ? 'happy' : 'spark', mouth: 'wow', brow: null, look: [0, -1], armL: 2.95, armR: 3.0, legs: t * 9, jig: .4, dizzy: 0 };
  }
  s.band = t > SPLATS[1] + .5 ? 1 : 0;        // band-aid after the second fall (optional prop)
  return s;
}

// ---------- camera ----------
function shake(t) {
  let v = 0; const ev = [[SPLATS[0], 10], [SPLATS[1], 12], [BLOCKS[0].land, 16], [BLOCKS[1].land, 20], [LEAP.t1, 8]];
  for (const [te, a] of ev) { const d = t - te; if (d >= 0 && d < .5) v += a * Math.exp(-d * 9) * Math.sin(d * 75); }
  return v;
}
function zoom(t) { return 1 + .08 * eIO(prog(t, 6.2, 6.8)); }      // gentle push-in on the grab, held (about point [540, 760])

// ---------- sound cue sheet (the score in audio.js plays these; each style re-voices them) ----------
const CUES = [
  { t: 0, type: 'reveal' }, { t: .1, type: 'star' }, { t: .3, type: 'pop' },
  ...TRIES.flatMap((tr, n) => [
    { t: tr.T0 + .25, type: 'jump', n }, { t: tr.T0 + .8, type: 'fall', n }, { t: tr.T0 + 1.05, type: 'splat', n },
    { t: tr.T0 + 1.15, type: 'dizzy', n }, { t: tr.getup, type: 'getup', n }]),
  ...BLOCKS.flatMap((b, n) => [{ t: b.t, type: 'drop', n }, { t: b.land, type: 'thud', n }]),
  { t: IDEA.t0, type: 'idea' },
  ...HOPS.flatMap((h, n) => [{ t: h.t0, type: 'hop', n }, { t: h.t1, type: 'land', n }]),
  { t: LEAP.t0, type: 'leap' }, { t: LEAP.t1, type: 'grab' }, { t: TITLE.t0, type: 'title' },
].sort((a, b) => a.t - b.t);
// harmony at 120 bpm (beat .5 s): hopeful C, bruised Am, F, the turn to G, home on C
const CHORDS = [[0, 1.85, 'C'], [1.85, 3.0, 'Am'], [3.0, 4.05, 'F'], [4.05, 4.75, 'Am'], [4.75, 6.4, 'G'], [6.4, 8.0, 'C']];
