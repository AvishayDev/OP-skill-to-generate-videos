'use strict';
// ============================================================
// doodle-kit.js · brush-pen doodles for drawing ON TOP of real photos and video.
// Near-black brush-pen line that swells and tapers, opaque white/colour gouache bodies (so a doodle
// reads on a busy photo), watercolour wash a few units off the line, handwriting that writes itself.
// Every line takes p = 0..1 (draw-on). BOIL (set once per frame) re-seeds the hand wobble: boil on twos.
// halo: a light stroke under the ink line, so ink also reads on dark footage.
// Adapted from the hand-drawn-canvas-animation skill (core.js brush/wash/gouache), no libraries.
// ============================================================
const INK = '#1b1622', PAPER = '#fffaf0';
const CO = { coral: '#ff7a5c', coralD: '#e0573c', blush: '#ff5f86', yellow: '#FFC93C', yellowD: '#f0a018', blue: '#004AAD', sky: '#94cbef',
  green: '#72c46e', pink: '#ffa3b5', white: '#fffdf6', red: '#f0443a', dirt: '#8a5a3c' };
let BOIL = 0;                                  // film sets: BOIL = Math.floor(i / 2)  -> line re-drawn on twos
const setBoil = i => { BOIL = Math.floor(i / 2); };

// Catmull-Rom through knots, resampled every `step` units
function spline(pts, step = 5, close = false) {
  if (pts.length < 3 && !close) { const [a, b] = pts, n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); return Array.from({ length: n + 1 }, (_, k) => [lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); }
  const P = i => close ? pts[(i + pts.length) % pts.length] : pts[clamp(i, 0, pts.length - 1)], out = [], segs = close ? pts.length : pts.length - 1;
  for (let i = 0; i < segs; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), n = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  out.push(close ? out[0] : pts[pts.length - 1]); return out;
}
function polyPath(q, close = true) { const p = new Path2D(); p.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) p.lineTo(q[i][0], q[i][1]); if (close) p.closePath(); return p; }
const splinePath = (pts, close = true) => polyPath(spline(pts, 5, close), close);
const xf = (pts, x, y, s = 1, rot = 0) => pts.map(([a, b]) => { const c = Math.cos(rot), n = Math.sin(rot); return [x + (a * c - b * n) * s, y + (a * n + b * c) * s]; });
function ellPts(rx, ry, n = 14, seed = 1, amp = .05) { const r = rng(seed), ph = r() * TAU; return Array.from({ length: n }, (_, i) => { const a = i / n * TAU, m = 1 + amp * Math.sin(a * 3 + ph) + amp * .6 * (r() - .5); return [Math.cos(a) * rx * m, Math.sin(a) * ry * m]; }); }

// brush: a brush-pen line. o.p draws it on; o.halo = width of a light under-stroke; o.dash = [on, off] for dashed trails
function brush(c, pts, o = {}) {
  const { w = 5, color = INK, p = 1, seed = 1, amp = 1.8, taper = 1, close = false, smooth = true, al = 1, halo = 0, haloColor = PAPER, haloAl = .92, boil = true, dash = null } = o;
  if (p <= 0 || pts.length < 2) return;
  const q = smooth ? spline(pts, 5, close) : pts, r = rng(seed + (boil ? BOIL * 17 : 0)), ph = [r() * TAU, r() * TAU, r() * TAU], f1 = .011 + r() * .008, f2 = .037 + r() * .02;
  let L = 0; const s = [0]; for (let i = 1; i < q.length; i++) { L += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); s.push(L); }
  const end = L * clamp(p), tl = Math.max(1, Math.min(L * .42, w * 10)) * taper;
  const pt = i => [q[i][0] + amp * (Math.sin(s[i] * f1 + ph[0]) + .5 * Math.sin(s[i] * f2 + ph[1])), q[i][1] + amp * (Math.cos(s[i] * f1 * 1.3 + ph[1]) + .5 * Math.sin(s[i] * f2 * .8 + ph[2]))];
  const on = m => !dash || (m % (dash[0] + dash[1])) < dash[0];
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const segs = []; let a = pt(0);
  for (let i = 1; i < q.length && s[i - 1] < end; i++) { let b = pt(i); if (s[i] > end) { const t = (end - s[i - 1]) / (s[i] - s[i - 1]); b = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
    const m = (s[i - 1] + Math.min(s[i], end)) / 2, e = taper ? Math.min(1, m / tl, (L - m) / tl) : 1;
    if (on(m)) segs.push([a, b, Math.max(.6, w * (.3 + .7 * Math.sin(clamp(e) * Math.PI / 2)) * (1 + .2 * Math.sin(m * f2 * 1.7 + ph[2])))]); a = b; }
  if (halo) { c.strokeStyle = haloColor; c.globalAlpha = al * haloAl; for (const [a2, b2, lw] of segs) { c.lineWidth = lw + halo * 2; c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); } }
  c.strokeStyle = color; c.globalAlpha = al; for (const [a2, b2, lw] of segs) { c.lineWidth = lw; c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
  c.restore();
}
// wash: watercolour, off-register from the line, soft edge, darker rim
function wash(c, path, color, o = {}) {
  const { al = .55, off = 5, seed = 1, blend = 'multiply' } = o; if (al <= 0) return;
  const r = rng(seed), dx = (r() - .5) * 2 * off, dy = (r() - .5) * 2 * off;
  c.save(); c.globalCompositeOperation = blend; c.translate(dx, dy); c.fillStyle = color;
  c.globalAlpha = al * .6; c.fill(path); c.globalAlpha = al * .16; for (let k = 0; k < 4; k++) { c.save(); c.translate((r() - .5) * 7, (r() - .5) * 7); c.fill(path); c.restore(); }
  c.globalAlpha = al * .35; c.strokeStyle = color; c.lineWidth = 2.4; c.stroke(path); c.restore();
}
// gouache: opaque body colour so the doodle reads on the photo
function gouache(c, path, color = CO.white, al = .97) { if (al <= 0) return; c.save(); c.globalAlpha = al; c.fillStyle = color; c.fill(path); c.restore(); }
// a closed shape: gouache body + wash + outline, all revealed by k (0..1): body fades in behind the pen
function shape(c, knots, o = {}) {
  const { k = 1, fill = CO.white, washC = null, washAl = .5, w = 5, seed = 1, halo = 0, al = 1 } = o; if (k <= 0) return;
  const path = splinePath(knots, true);
  gouache(c, path, fill, .97 * clamp(k * 2.2 - .9) * al);
  if (washC) wash(c, path, washC, { al: washAl * clamp(k * 2 - 1) * al, seed });
  brush(c, knots, { close: true, p: clamp(k * 1.25), w, seed, halo, al });
}

// handwriting that writes itself right to left (Hebrew). k = 0..1. halo = light outline for dark footage.
function handText(c, str, x, y, size, o = {}) {
  const { k = 1, color = INK, halo = 0, haloColor = PAPER, font = 'OHRonShemer', weight = '', align = 'center', rot = 0, al = 1 } = o; if (k <= 0) return 0;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = al; c.font = `${weight} ${size}px ${font}`; c.direction = 'rtl'; c.textAlign = align; c.textBaseline = 'middle';
  const w = c.measureText(str).width, x0 = align === 'center' ? w / 2 : align === 'right' ? 0 : w;
  if (k < 1) { c.beginPath(); c.rect(x0 + 30 - (w + 60) * k, -size * 1.2, (w + 60) * k, size * 2.4); c.clip(); }
  const jx = Math.sin(BOIL * 1.7) * .8, jy = Math.cos(BOIL * 2.3) * .8;       // lettering boils too, gently
  if (halo) { c.lineJoin = 'round'; c.strokeStyle = haloColor; c.lineWidth = halo * 2; c.strokeText(str, jx, jy); }
  c.fillStyle = color; c.fillText(str, jx, jy); c.restore(); return w;
}

// ---------- props ----------
function starKnots(R, r = R * .48) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? r : R; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; }
function starShape(c, x, y, R, o = {}) {       // o: k, rot, lit, face
  const { k = 1, rot = 0, seed = 11, halo = 0, face = true, lit = 0 } = o; if (k <= 0) return;
  const pts = xf(starKnots(R), x, y, 1, rot);
  c.save(); const path = polyPath(pts, true);
  gouache(c, path, lit > 0 ? '#ffe27a' : CO.yellow, .97 * clamp(k * 2.2 - .9));
  wash(c, polyPath(xf(starKnots(R * .7), x + R * .08, y + R * .1, 1, rot), true), CO.yellowD, { al: .45 * clamp(k * 2 - 1), seed });
  brush(c, pts, { close: true, smooth: false, p: clamp(k * 1.25), w: 5, seed, halo });
  if (face && k > .8) { const e = R * .2;
    if (lit > 0) { brush(c, xf([[-e * 1.3, 0], [-e * .8, -e * .6], [-e * .3, 0]], x, y, 1, rot), { w: 3.6, seed: seed + 3 }); brush(c, xf([[e * .3, 0], [e * .8, -e * .6], [e * 1.3, 0]], x, y, 1, rot), { w: 3.6, seed: seed + 4 });
      c.save(); c.fillStyle = '#3a1522'; c.beginPath(); const m = xf([[0, e * .9]], x, y, 1, rot)[0]; c.arc(m[0], m[1], e * .6, 0, Math.PI); c.fill(); c.restore(); }
    else { c.fillStyle = INK; for (const sd of [-1, 1]) { const q = xf([[sd * e * .8, -e * .1]], x, y, 1, rot)[0]; c.beginPath(); c.arc(q[0], q[1], e * .28, 0, TAU); c.fill(); }
      brush(c, xf([[-e * .45, e * .6], [0, e * .9], [e * .45, e * .6]], x, y, 1, rot), { w: 3, seed: seed + 5 }); }
    c.globalAlpha = .55; c.fillStyle = CO.blush; for (const sd of [-1, 1]) { const q = xf([[sd * e * 1.6, e * .55]], x, y, 1, rot)[0]; c.beginPath(); c.ellipse(q[0], q[1], e * .45, e * .28, rot, 0, TAU); c.fill(); } c.globalAlpha = 1; }
  c.restore();
}
function scribbleStar(c, x, y, s, o = {}) { const { k = 1, seed = 1, w = 4, color = INK, halo = 0 } = o; const p = []; for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; p.push([x + Math.cos(a) * s, y + Math.sin(a) * s]); } brush(c, p, { smooth: false, p: k, w, seed, color, halo }); }
function sparkBurst(c, x, y, r0, r1, n, o = {}) {  // radial dashes, k 0..1 grows then fades
  const { k = 1, seed = 1, w = 5, color = INK, halo = 0, haloColor = PAPER, rot = 0 } = o; if (k <= 0 || k >= 1) return;
  const g = eOut(k), fade = 1 - clamp((k - .6) / .4);
  for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, a0 = r0 + (r1 - r0) * g * .35, a1 = r0 + (r1 - r0) * g;
    brush(c, [[x + Math.cos(a) * a0, y + Math.sin(a) * a0], [x + Math.cos(a) * a1, y + Math.sin(a) * a1]], { w: w * (i % 2 ? .7 : 1), seed: seed + i, color, halo, haloColor, al: fade, taper: 1 }); }
}
function heartKnots(s) { return [[0, s * .9], [-s * .75, s * .2], [-s * .9, -s * .35], [-s * .5, -s * .8], [0, -s * .4], [s * .5, -s * .8], [s * .9, -s * .35], [s * .75, s * .2]]; }
function arrow(c, knots, o = {}) {             // curved line + arrowhead at the last knot
  const { k = 1, w = 5, seed = 1, halo = 0, haloColor = PAPER, color = INK, head = 34, dash = null } = o; if (k <= 0) return;
  brush(c, knots, { p: clamp(k * 1.15), w, seed, halo, haloColor, color, dash });
  if (k > .85) { const q = spline(knots, 5), b = q[q.length - 1], a = q[Math.max(0, q.length - 6)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hk = clamp((k - .85) / .15);
    for (const sd of [-1, 1]) brush(c, [b, [b[0] - Math.cos(ang + sd * .5) * head, b[1] - Math.sin(ang + sd * .5) * head]], { p: hk, w, seed: seed + 7 + sd, halo, haloColor, color }); }
}
// speech bubble: centre, size, tail tip
function bubbleKnots(cx, cy, w, h, tip, seed = 1) {
  const r = rng(seed), pts = [], n = 16, ta = Math.atan2(tip[1] - cy, tip[0] - cx);
  for (let i = 0; i < n; i++) { const a = ta + .22 + i / n * (TAU - .44), m = 1 + (r() - .5) * .06; pts.push([cx + Math.cos(a) * w / 2 * m, cy + Math.sin(a) * h / 2 * m]); }
  pts.push(tip); return pts;
}

// ---------- פיצי in brush pen: coral gouache body, ink line, feet at (x, y), s = scale (1 = style-pack size) ----------
// st: { sx, sy, rot, eyes: norm|big|happy|spark, mouth: smile|open|wow|flat, look:[dx,dy], armL, armR (0 down, PI up), legs (walk phase), dir (1 right, -1 left), wave }
function pitzi(c, x, y, s, st = {}, seed = 500, halo = 0) {
  const { sx = 1, sy = 1, rot = 0, eyes = 'norm', mouth = 'smile', look = [0, 0], armL = .4, armR = .4, legs = null, dir = 1 } = st;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * sx * dir, s * sy);
  const lw = 7 / Math.max(.4, s) * .75 + 3;            // keep the line visible when small
  // legs
  [-1, 1].forEach((sd, n) => { const sw = legs === null ? 0 : Math.sin(legs + n * Math.PI) * 22, hip = [sd * 34, -40], ft = [sd * 40 + sw, -4 + (legs === null ? 0 : Math.max(0, -Math.cos(legs + n * Math.PI)) * -14)];
    brush(c, [hip, [lerp(hip[0], ft[0], .5) + sd * 5, -22], ft], { w: lw, seed: seed + n, halo: halo / s });
    const fp = splinePath(xf(ellPts(24, 12, 10, seed + 3 + n), ft[0] + sd * 8, ft[1]), true); gouache(c, fp, CO.coralD); brush(c, xf(ellPts(24, 12, 10, seed + 3 + n), ft[0] + sd * 8, ft[1]), { close: true, w: lw * .8, seed: seed + 5 + n }); });
  // arms (behind body)
  [[-1, armL], [1, armR]].forEach(([sd, a], n) => { const sh = [sd * 76, -120], hd = [sh[0] + sd * Math.sin(a) * 92, sh[1] + Math.cos(a) * 92];
    brush(c, [sh, [lerp(sh[0], hd[0], .5) + sd * 8, lerp(sh[1], hd[1], .5) + 6], hd], { w: lw, seed: seed + 10 + n, halo: halo / s });
    const hp = xf(ellPts(17, 16, 10, seed + 12 + n), hd[0], hd[1]); gouache(c, splinePath(hp), CO.coral); brush(c, hp, { close: true, w: lw * .8, seed: seed + 14 + n }); });
  // body
  const body = xf(ellPts(102, 94, 16, seed + 20, .04), 0, -128), bp = splinePath(body);
  if (halo) { c.save(); c.lineWidth = halo * 2 / s + lw; c.strokeStyle = PAPER; c.lineJoin = 'round'; c.stroke(bp); c.restore(); }
  gouache(c, bp, CO.coral, 1);
  c.save(); c.clip(bp); wash(c, splinePath(xf(ellPts(80, 58, 12, seed + 21, .08), 34, -84)), CO.coralD, { al: .55, seed: seed + 22, off: 3 }); c.restore();
  brush(c, body, { close: true, w: lw * 1.15, seed: seed + 23 });
  c.globalAlpha = .6; c.fillStyle = CO.blush; c.beginPath(); c.ellipse(-64, -104, 17, 10, 0, 0, TAU); c.ellipse(64, -104, 17, 10, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
  // eyes
  [-1, 1].forEach((sd, n) => { const ex = sd * 38, ey = -152;
    if (eyes === 'happy') { brush(c, [[ex - 17, ey + 6], [ex, ey - 12], [ex + 17, ey + 6]], { w: lw * .95, seed: seed + 30 + n }); return; }
    const R = eyes === 'big' || eyes === 'spark' ? 32 : 28, ep = xf(ellPts(R, R * 1.06, 12, seed + 32 + n, .03), ex, ey);
    gouache(c, splinePath(ep), '#fffdf6', 1); brush(c, ep, { close: true, w: lw * .7, seed: seed + 34 + n });
    const px = ex + clamp(look[0] * 10, -11, 11), py = ey + clamp(look[1] * 10, -11, 11), pr = eyes === 'spark' ? 18 : eyes === 'big' ? 12 : 14;
    c.fillStyle = INK; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(px + 5, py - 6, eyes === 'spark' ? 6 : 4.5, 0, TAU); c.fill(); });
  // mouth
  const my = -100;
  if (mouth === 'smile') brush(c, [[-24, my - 4], [0, my + 12], [24, my - 4]], { w: lw * .85, seed: seed + 40 });
  else if (mouth === 'flat') brush(c, [[-16, my + 2], [16, my]], { w: lw * .85, seed: seed + 41 });
  else { const wm = mouth === 'wow' ? 28 : 16, hm = mouth === 'wow' ? 26 : 18; c.fillStyle = '#3a1522'; c.beginPath();
    if (mouth === 'wow') { c.moveTo(-wm, my - 6); c.quadraticCurveTo(0, my + hm * 1.6, wm, my - 6); c.closePath(); } else c.ellipse(0, my + 4, wm, hm, 0, 0, TAU); c.fill(); }
  c.restore();
}

// ---------- tracking: keyframed points follow the footage ----------
// track([[t, x, y], ...]) -> t => [x, y], Catmull-Rom between keys (smooth, passes through every key)
function track(keys) {
  return t => { if (t <= keys[0][0]) return [keys[0][1], keys[0][2]]; const n = keys.length; if (t >= keys[n - 1][0]) return [keys[n - 1][1], keys[n - 1][2]];
    let i = 0; while (keys[i + 1][0] < t) i++;
    const P = j => keys[clamp(j, 0, n - 1)], k = (t - P(i)[0]) / (P(i + 1)[0] - P(i)[0]), k2 = k * k, k3 = k2 * k;
    const cr = d => .5 * (2 * P(i)[d] + (P(i + 1)[d] - P(i - 1)[d]) * k + (2 * P(i - 1)[d] - 5 * P(i)[d] + 4 * P(i + 1)[d] - P(i + 2)[d]) * k2 + (3 * P(i)[d] - P(i - 1)[d] - 3 * P(i + 1)[d] + P(i + 2)[d]) * k3);
    return [cr(1), cr(2)]; };
}

// ---------- sound helpers (use with audio.js audioKit) ----------
// marker/pencil scratch: a burst train of band-passed noise, the rhythm of a hand drawing
function scratch(K, t, dur, v = .06, seed = 1, f = 3200) {
  const r = rng(seed); let tt = t;
  while (tt < t + dur) { const d = .035 + r() * .07; K.noise(tt, d, K.sfx, v * (.5 + r() * .6), 'bandpass', f * (.75 + r() * .6), 1.6, .006); tt += d * (.7 + r() * .6); }
}
const tick = (K, t, v = .05, f = 2600) => { const o = K.osc('triangle', f, t, .03, K.sfx, v, .001); o.frequency.exponentialRampToValueAtTime(f * .6, K.at(t + .03)); };
