'use strict';
// "The Rainbow Bus": one glossy toy-town scene file for every shot. The shot id (SHOT.id) picks the scene:
//   hook-a/b/c  intro (bus rolls in, Milo at the wheel, wave)      red|yellow|green|blue -a/b/c/d  one colour stop each
//   count-a/b/c counting the five friends in the bus                rainbow-a/b/c  the rainbow     end-a/b  sunset → night
// Everything is a pure function of t. Cues name the words that trigger pops (see shots.json).

const TAU2 = Math.PI * 2;
const FONT = () => FACE.display;
const hasCue = (n) => SHOT.cue[n] !== undefined;
const cueT = (n, d = 0) => (hasCue(n) ? SHOT.cue[n] : d);
const pp = (t, n, len = .4, d = 0) => prog(t, cueT(n, d), cueT(n, d) + len);

// ---------- colour + glossy shapes ----------
const hexRgb = (h) => {
  if (h.startsWith('rgb')) return h.match(/[\d.]+/g).slice(0, 3).map(Number);
  h = h.replace('#', ''); if (h.length === 3) h = [...h].map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
};
const shade = (h, f) => { const [r, g, b] = hexRgb(h), t = f < 0 ? 0 : 255, k = Math.abs(f); return `rgb(${Math.round(r + (t - r) * k)},${Math.round(g + (t - g) * k)},${Math.round(b + (t - b) * k)})`; };
const mixc = (a, b, k) => { const A = hexRgb(a), B = hexRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };

function ball(c, x, y, rx, ry, col, o = {}) {
  const g = c.createRadialGradient(x - rx * .35, y - ry * .4, Math.min(rx, ry) * .08, x, y, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, shade(col, .45)); g.addColorStop(.45, col); g.addColorStop(1, shade(col, -.3));
  c.save(); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, o.rot || 0, 0, TAU2); c.fill();
  if (o.shine !== false) { c.globalAlpha = .38; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x - rx * .32, y - ry * .5, rx * .32, ry * .17, -.5 + (o.rot || 0), 0, TAU2); c.fill(); }
  c.restore();
}
function oval(c, x, y, rx, ry, col, rot = 0) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU2); c.fill(); }
function pill(c, x, y, w, h, r, col, o = {}) {
  c.save(); const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, shade(col, .38)); g.addColorStop(.35, col); g.addColorStop(1, shade(col, -.28));
  c.fillStyle = g; rr(c, x, y, w, h, Math.min(r, w / 2, h / 2)); c.fill();
  if (o.shine !== false) { c.globalAlpha = .3; c.fillStyle = '#fff'; rr(c, x + w * .06, y + h * .07, w * .88, Math.max(4, h * .16), Math.min(r, h * .08)); c.fill(); }
  c.restore();
}
function star4(c, x, y, r, col, a = 0) {
  c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 8; i++) { const rad = i % 2 ? r * .28 : r, an = i * Math.PI / 4; c.lineTo(Math.cos(an) * rad, Math.sin(an) * rad); }
  c.closePath(); c.fill(); c.restore();
}
function heart(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath();
  c.moveTo(0, 30); c.bezierCurveTo(-60, -10, -30, -50, 0, -20); c.bezierCurveTo(30, -50, 60, -10, 0, 30); c.fill(); c.restore();
}
function note(c, x, y, s, col, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.ellipse(0, 0, 17, 13, -.4, 0, TAU2); c.fill(); c.beginPath(); c.moveTo(14, -3); c.lineTo(14, -52); c.quadraticCurveTo(34, -44, 36, -26); c.stroke(); c.restore();
}

// Chunky outlined bubble word that springs in at `k` (0..1).
function bubble(c, str, x, y, size, col, k, o = {}) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); const sc = eBack(clamp(k)); c.rotate((o.rot || 0) + Math.sin(k * 9) * .03 * (1 - k)); c.scale(sc, sc);
  c.font = `800 ${size}px "${FONT()}"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = size * .22; c.strokeStyle = '#fff'; c.shadowColor = 'rgba(30,20,80,.35)'; c.shadowBlur = 0; c.shadowOffsetY = size * .08;
  c.strokeText(str, 0, 0); c.shadowColor = 'transparent';
  c.lineWidth = size * .1; c.strokeStyle = shade(col, -.35); c.strokeText(str, 0, 0);
  c.fillStyle = col; c.fillText(str, 0, 0);
  c.globalAlpha = .35; c.fillStyle = '#fff'; c.save(); c.beginPath(); c.rect(-size * 6, -size * .55, size * 12, size * .42); c.clip(); c.fillText(str, 0, 0); c.restore();
  c.restore();
}
// A rainbow-lettered title.
function rainbowTitle(c, str, x, y, size, k, t) {
  if (k <= 0) return;
  const cols = [PAL.red, '#FF9A1F', PAL.yellow, PAL.green, PAL.blue, PAL.purple];
  c.save(); c.font = `800 ${size}px "${FONT()}"`;
  const ws = [...str].map((ch) => c.measureText(ch).width); const total = ws.reduce((a, b) => a + b, 0); c.restore();
  let cx = x - total / 2, li = 0;
  [...str].forEach((ch, i) => {
    const lk = clamp(k * 1.8 - i * .09);
    if (ch !== ' ' && lk > 0) bubble(c, ch, cx + ws[i] / 2, y + Math.sin(t * 5 + i * .6) * 7 - (1 - eOut(lk)) * 60, size, cols[li++ % cols.length], lk);
    else if (ch !== ' ') li++;
    cx += ws[i];
  });
}

// ---------- characters ----------
const KIND = {
  milo:   { skin: '#FFD3AA', body: '#4DA3FF', eye: '#5A3A22' },
  bella:  { skin: '#FFF1F5', body: '#FF8FB5', eye: '#7A3B6B' },
  duckie: { skin: '#FFD93B', body: '#FFD93B', eye: '#3A2A12' },
  fred:   { skin: '#7ED957', body: '#7ED957', eye: '#1F3D1A' },
  bear:   { skin: '#B9814F', body: '#FFB347', eye: '#2D1B0F' },
};
function eye(c, x, y, r, col, blink, look) {
  c.save(); c.translate(x, y); c.scale(1, blink ? .12 : 1);
  oval(c, 0, 0, r * .85, r, '#fff');
  const lx = look[0] * r * .22, ly = look[1] * r * .2;
  ball(c, lx, ly + r * .05, r * .6, r * .66, col, { shine: false });
  oval(c, lx, ly + r * .05, r * .3, r * .34, '#140C08');
  oval(c, lx - r * .22, ly - r * .22, r * .2, r * .22, '#fff'); oval(c, lx + r * .2, ly + r * .22, r * .09, r * .1, 'rgba(255,255,255,.9)');
  c.restore();
}
function mouthD(c, w, open) {
  const h = open * w * .85 + 2;
  c.save(); c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(0, -w * .12, w, 0); c.quadraticCurveTo(w * .85, h * 1.3, 0, h * 1.35); c.quadraticCurveTo(-w * .85, h * 1.3, -w, 0); c.closePath();
  c.fillStyle = '#7A1E2E'; c.fill(); c.clip(); oval(c, 0, h * 1.25, w * .6, h * .6, '#FF7C8E'); c.restore();
}
function smile(c, w, lw) { c.save(); c.strokeStyle = '#7A3030'; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.arc(0, -w * .35, w, .18 * Math.PI, .82 * Math.PI); c.stroke(); c.restore(); }

// kind at head-centre (x,y), scale s (head radius 100*s). o: sing (0/1), open (0..1), wave, look, body (default true)
function char(c, kind, x, y, s, t, o = {}) {
  const K = KIND[kind], r = 100;
  const open = o.open !== undefined ? o.open : o.sing ? clamp(Math.abs(Math.sin(t * 11 + (kind.length * 1.7))) * 1.1 - .12) : 0;
  const blink = (t * .9 + kind.length * .37) % 3.1 < .12;
  const look = o.look || [Math.sin(t * .8) * .6, .1];
  c.save(); c.translate(x, y); c.scale(s * (o.sx || 1), s * (o.sy || 1)); if (o.rot) c.rotate(o.rot);
  const withBody = o.body !== false;
  if (withBody) {
    // shoes, torso, arms
    ball(c, -r * .38, r * 2.2, r * .34, r * .2, kind === 'bear' ? '#5B3A2A' : kind === 'duckie' ? '#FF9A1F' : '#fff'); ball(c, r * .38, r * 2.2, r * .34, r * .2, kind === 'bear' ? '#5B3A2A' : kind === 'duckie' ? '#FF9A1F' : '#fff');
    pill(c, -r * .72, r * .78, r * 1.44, r * 1.4, r * .55, K.body);
    if (kind === 'milo') star4(c, 0, r * 1.45, r * .26, '#FFE066');
    if (kind === 'fred' || kind === 'duckie') oval(c, 0, r * 1.5, r * .42, r * .5, kind === 'fred' ? '#D8F8B5' : '#FFF3B8');
    if (kind === 'duckie') { // blue bow
      c.fillStyle = '#4DA3FF'; c.beginPath(); c.moveTo(0, r * .88); c.lineTo(-r * .3, r * .72); c.lineTo(-r * .3, r * 1.04); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, r * .88); c.lineTo(r * .3, r * .72); c.lineTo(r * .3, r * 1.04); c.closePath(); c.fill(); ball(c, 0, r * .88, r * .1, r * .1, '#2F7FE0');
    }
    // arms
    const aw = o.wave ? -1.15 + Math.sin(t * 9) * .4 : .55, al = r * .62;
    c.save(); c.lineCap = 'round'; c.strokeStyle = shade(K.body, -.05); c.lineWidth = r * .3;
    c.beginPath(); c.moveTo(-r * .66, r * 1.05); c.lineTo(-r * .66 - r * .12, r * 1.05 + al); c.stroke(); ball(c, -r * .8, r * 1.05 + al, r * .17, r * .17, K.skin);
    const sx = r * .66, sy = r * 1.05, hx = sx + Math.sin(aw) * al * (o.wave ? 1.2 : .3) + (o.wave ? 0 : r * .12), hy = sy + (o.wave ? -Math.cos(aw) * al * -0.6 - al * .55 : al);
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke(); ball(c, hx, hy, r * .17, r * .17, K.skin); c.restore();
  }
  // ears / back features
  if (kind === 'bella') for (const sg of [-1, 1]) { const rot = sg * (.12 + Math.sin(t * 3 + sg) * .03 + (o.earUp || 0)); ball(c, sg * r * .42, -r * 1.3, r * .26, r * .78, K.skin, { rot }); oval(c, sg * r * .42, -r * 1.25, r * .14, r * .55, '#FFB3C8', rot); }
  if (kind === 'bear') for (const sg of [-1, 1]) { ball(c, sg * r * .74, -r * .74, r * .32, r * .32, K.skin); ball(c, sg * r * .74, -r * .72, r * .17, r * .17, '#E6B88A', { shine: false }); }
  if (kind === 'milo') for (const sg of [-1, 1]) ball(c, sg * r * .98, r * .06, r * .17, r * .2, K.skin);
  // head
  if (kind === 'fred') { ball(c, 0, 0, r * 1.08, r * .84, K.skin); for (const sg of [-1, 1]) { ball(c, sg * r * .55, -r * .72, r * .36, r * .36, K.skin); eye(c, sg * r * .55, -r * .72, r * .26, K.eye, blink, look); } }
  else ball(c, 0, 0, r, r * .95, K.skin);
  // face
  const ey = -r * .04, es = r * .33;
  if (kind === 'milo') { // hair cap + tuft
    c.save(); c.beginPath(); c.ellipse(0, -r * .3, r * .99, r * .78, 0, Math.PI, TAU2); c.closePath();
    const g = c.createRadialGradient(-r * .3, -r * .9, r * .1, 0, -r * .4, r * 1.1); g.addColorStop(0, '#FFC46B'); g.addColorStop(.6, '#FF9F2E'); g.addColorStop(1, '#D9731A'); c.fillStyle = g; c.fill(); c.restore();
    ball(c, r * .1, -r * 1.05, r * .26, r * .3, '#FF9F2E', { rot: .5 }); ball(c, -r * .12, -r * 1.12, r * .2, r * .24, '#FF9F2E', { rot: -.4 });
    eye(c, -es, ey + r * .06, r * .24, K.eye, blink, look); eye(c, es, ey + r * .06, r * .24, K.eye, blink, look);
  } else if (kind === 'fred') { /* eyes already on the bumps */ }
  else { eye(c, -es, ey, r * .24, K.eye, blink, look); eye(c, es, ey, r * .24, K.eye, blink, look); }
  // cheeks
  const cheeks = kind === 'fred' ? 'rgba(255,140,120,.45)' : 'rgba(255,110,140,.5)';
  oval(c, -r * .62, r * .26, r * .15, r * .1, cheeks); oval(c, r * .62, r * .26, r * .15, r * .1, cheeks);
  // muzzle / beak / nose / mouth
  if (kind === 'bear') { ball(c, 0, r * .28, r * .46, r * .36, '#E6BD92'); ball(c, 0, r * .12, r * .15, r * .1, '#3B2418'); c.save(); c.translate(0, r * .32); open > .12 ? mouthD(c, r * .2, open) : smile(c, r * .2, r * .045); c.restore(); }
  else if (kind === 'duckie') {
    const gap = open * r * .22;
    ball(c, 0, r * .22 + gap * .5, r * .36, r * .13, '#FF8A1F'); ball(c, 0, r * .12 - gap * .3, r * .38, r * .14, '#FFAA33');
    oval(c, -r * .12, r * .08 - gap * .3, r * .03, r * .02, '#C45E00'); oval(c, r * .12, r * .08 - gap * .3, r * .03, r * .02, '#C45E00');
    for (let i = -1; i <= 1; i++) ball(c, i * r * .1, -r * .98 - Math.abs(i) * -r * .04, r * .1, r * .17, K.skin, { rot: i * .5 });
  } else if (kind === 'fred') { c.save(); c.translate(0, r * .3); open > .12 ? mouthD(c, r * .5, open * .9) : smile(c, r * .5, r * .05); c.restore(); oval(c, -r * .12, r * .02, r * .03, r * .02, '#3A7A2A'); oval(c, r * .12, r * .02, r * .03, r * .02, '#3A7A2A'); }
  else if (kind === 'bella') {
    ball(c, 0, r * .16, r * .09, r * .07, '#FF7FA8'); c.save(); c.translate(0, r * .36); open > .12 ? mouthD(c, r * .2, open) : smile(c, r * .2, r * .045); c.restore();
    c.fillStyle = '#fff'; rr(c, -r * .09, r * .38, r * .08, r * .13, r * .03); c.fill(); rr(c, r * .01, r * .38, r * .08, r * .13, r * .03); c.fill();
  } else { c.save(); c.translate(0, r * .4); open > .12 ? mouthD(c, r * .24, open) : smile(c, r * .24, r * .05); c.restore(); }
  c.restore();
}

// ---------- the bus (origin = bottom centre between the wheels, faces right, base width 760) ----------
const SLOTS = [-300, -160, -20, 120];
const SLOT_ORDER = ['bear', 'fred', 'duckie', 'bella']; // slot index → who sits there (bella took the front seat first)
function windowRect(i) { return [SLOTS[i] - 57, -285, 114, 118]; }
function bus(c, x, y, s, t, o = {}) {
  const passengers = o.passengers || [], driver = o.driver !== false, dist = o.dist || 0, bounce = o.bounce || 0, flip = o.flip ? -1 : 1;
  c.save(); c.translate(x, y + Math.sin(t * 14) * bounce); c.scale(s * flip, s);
  c.globalAlpha *= (o.alpha ?? 1);
  oval(c, 0, 8, 430, 24, 'rgba(30,20,70,.28)');
  // body
  pill(c, -385, -318, 770, 268, 74, '#FFF3DA');
  pill(c, -385, -318, 770, 60, 40, '#FF6B6B', { shine: false }); // roof band
  c.save(); rr(c, -385, -318, 770, 268, 74); c.clip();
  const bands = [PAL.red, '#FF9A1F', PAL.yellow, PAL.green, PAL.blue, PAL.purple];
  bands.forEach((b, i) => { c.fillStyle = b; c.fillRect(-390, -150 + i * 15, 780, 15); });
  c.globalAlpha = .25; c.fillStyle = '#fff'; c.fillRect(-390, -150, 780, 6); c.restore();
  // windows
  for (let i = 0; i < SLOTS.length; i++) {
    const [wx, wy, ww, wh] = windowRect(i);
    c.save(); rr(c, wx - 7, wy - 7, ww + 14, wh + 14, 30); c.fillStyle = '#FF9A1F'; c.fill(); rr(c, wx, wy, ww, wh, 24); c.clip();
    const g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#BFEAFF'); g.addColorStop(1, '#7CC8F5'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    const who = passengers.includes(SLOT_ORDER[i]) ? SLOT_ORDER[i] : null;
    if (who) { const k = o.popped?.[who] ?? 1; if (k > 0) char(c, who, SLOTS[i], wy + wh * .52 + (1 - eOut(clamp(k))) * 90, .5, t + i, { sing: o.sing, body: true, look: [0.8, 0] }); }
    c.globalAlpha = .35; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(wx + 8, wy + wh); c.lineTo(wx + 38, wy); c.lineTo(wx + 56, wy); c.lineTo(wx + 26, wy + wh); c.fill();
    c.restore();
  }
  // windshield with the driver
  c.save(); rr(c, 231, -299, 128, 144, 30); c.fillStyle = '#FF9A1F'; c.fill(); rr(c, 238, -292, 114, 130, 24); c.clip();
  const g2 = c.createLinearGradient(0, -292, 0, -162); g2.addColorStop(0, '#BFEAFF'); g2.addColorStop(1, '#7CC8F5'); c.fillStyle = g2; c.fillRect(238, -292, 114, 130);
  if (driver) char(c, 'milo', 295, -205 + (o.driverDy || 0), .5, t, { sing: o.sing, wave: o.driverWave, body: true, look: [.9, 0] });
  c.globalAlpha = .35; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(246, -162); c.lineTo(276, -292); c.lineTo(294, -292); c.lineTo(264, -162); c.fill(); c.restore();
  // front: bumper, headlight, smile grille
  pill(c, 330, -98, 82, 34, 16, '#9AA3B5'); ball(c, 372, -128, 22, 22, '#FFF27A');
  c.save(); c.strokeStyle = '#7A3030'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.arc(340, -118, 30, .25 * Math.PI, .85 * Math.PI); c.stroke(); c.restore();
  // wheels
  for (const wx of [-235, 235]) {
    ball(c, wx, -52, 62, 62, '#2B2B3F', { shine: false });
    c.save(); c.translate(wx, -52); c.rotate(dist / 62); oval(c, 0, 0, 36, 36, '#C9D2E3');
    c.strokeStyle = '#8A93A8'; c.lineWidth = 7; for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-34, 0); c.lineTo(34, 0); c.stroke(); }
    ball(c, 0, 0, 12, 12, '#FF6B6B'); c.restore();
  }
  c.restore();
}

// ---------- backgrounds ----------
function sky(c, t, mode, tintK) {
  const stops = mode === 'night' ? ['#0E1B4D', '#27368F', '#5B5BBF'] : mode === 'sunset' ? ['#5B4B9A', '#FF8A65', '#FFD59A'] : ['#55B8FF', '#9EDCFF', '#E3F6FF'];
  if (mode === 'mix') { const k = tintK; const A = ['#5B4B9A', '#FF8A65', '#FFD59A'], B = ['#0E1B4D', '#27368F', '#5B5BBF']; stops[0] = mixc(A[0], B[0], k); stops[1] = mixc(A[1], B[1], k); stops[2] = mixc(A[2], B[2], k); }
  const g = c.createLinearGradient(0, 0, 0, 650); stops.forEach((s, i) => g.addColorStop(i / 2, s)); c.fillStyle = g; c.fillRect(0, 0, W, 700);
}
function cloud(c, x, y, s, col = '#fff') { ball(c, x, y, 120 * s, 62 * s, col, { shine: false }); ball(c, x - 90 * s, y + 18 * s, 80 * s, 46 * s, col, { shine: false }); ball(c, x + 95 * s, y + 20 * s, 90 * s, 48 * s, col, { shine: false }); ball(c, x + 10 * s, y - 36 * s, 70 * s, 54 * s, col, { shine: false }); }
function clouds(c, t, dim) { for (let i = 0; i < 5; i++) { const sp = 14 + i * 4, x = ((i * 480 + t * sp) % (W + 500)) - 250; cloud(c, x, 120 + (i % 3) * 90, .8 + (i % 2) * .35, dim ? shade('#FFFFFF', -dim) : '#fff'); } }
function sunBall(c, x, y, r, t) {
  const g = c.createRadialGradient(x, y, r * .3, x, y, r * 2.6); g.addColorStop(0, 'rgba(255,240,150,.8)'); g.addColorStop(1, 'rgba(255,240,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.6, 0, TAU2); c.fill();
  c.save(); c.translate(x, y); c.rotate(t * .2); for (let i = 0; i < 12; i++) { c.rotate(TAU2 / 12); pill(c, r * 1.2, -9, r * .5, 18, 9, '#FFD43B', { shine: false }); } c.restore();
  ball(c, x, y, r, r, '#FFD43B');
}
function hills(c, scroll, dim, theme) {
  const dark = dim || 0;
  const layer1 = (off, amp, base, col) => { c.fillStyle = shade(col, -dark); c.beginPath(); c.moveTo(0, 700); for (let x = 0; x <= W; x += 20) c.lineTo(x, base - amp * Math.sin((x + off) / 260) - amp * .5 * Math.sin((x + off) / 110)); c.lineTo(W, 700); c.closePath(); c.fill(); };
  layer1(scroll * .15, 60, 560, '#8ED98A'); layer1(scroll * .3 + 300, 46, 610, '#5FC56A');
  if (theme === 'hill') { const hx = W * .78, g = c.createRadialGradient(hx - 120, 420, 40, hx, 520, 520); g.addColorStop(0, shade('#7EE08A', -dark)); g.addColorStop(1, shade('#3FAE55', -dark)); c.fillStyle = g; c.beginPath(); c.ellipse(hx, 700, 560, 330, 0, Math.PI, TAU2); c.fill(); }
}
function trees(c, scroll, dim) {
  for (let i = -1; i < 6; i++) { const x = ((i * 430 - scroll * .6) % (W + 430) + (W + 430)) % (W + 430) - 150, y = 640, sc = .9 + (i % 3) * .15;
    pill(c, x - 14 * sc, y - 90 * sc, 28 * sc, 100 * sc, 10, shade('#9B6A3C', -dim), { shine: false }); ball(c, x, y - 140 * sc, 74 * sc, 70 * sc, shade('#3FBF63', -dim)); ball(c, x - 40 * sc, y - 110 * sc, 46 * sc, 44 * sc, shade('#4FD173', -dim)); }
}
function ground(c, scroll, dim, theme, t) {
  const d = dim || 0;
  if (theme === 'sea') {
    const g = c.createLinearGradient(0, 480, 0, 720); g.addColorStop(0, shade('#4FB3FF', -d)); g.addColorStop(1, shade('#1E7FE0', -d)); c.fillStyle = g; c.fillRect(0, 480, W, 240);
    c.strokeStyle = `rgba(255,255,255,${.7 - d})`; c.lineWidth = 6; c.lineCap = 'round';
    for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) { const x = i * 180 + (r % 2) * 90 + Math.sin(t * 1.5 + i + r) * 18, y = 520 + r * 50; c.beginPath(); c.arc(x, y, 34, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); }
    c.fillStyle = shade('#FFE2A8', -d); c.fillRect(0, 700, W, 90);
  } else {
    const g = c.createLinearGradient(0, 600, 0, 800); g.addColorStop(0, shade('#6BD37A', -d)); g.addColorStop(1, shade('#3FB35C', -d)); c.fillStyle = g; c.fillRect(0, 600, W, 200);
  }
  // road
  const rg = c.createLinearGradient(0, 790, 0, 1010); rg.addColorStop(0, shade('#6B7287', -d)); rg.addColorStop(1, shade('#4B5166', -d)); c.fillStyle = rg; c.fillRect(0, 790, W, 220);
  c.fillStyle = shade('#FFFFFF', -d); c.fillRect(0, 797, W, 8); c.fillRect(0, 996, W, 8);
  c.fillStyle = shade('#FFD43B', -d); for (let i = -1; i < 12; i++) { const x = ((i * 190 - scroll) % (W + 190) + (W + 190)) % (W + 190) - 190; rr(c, x, 892, 110, 16, 8); c.fill(); }
  c.fillStyle = shade('#4FC66A', -d); c.fillRect(0, 1004, W, 80);
  // theme dressing along the verge
  const flower = (x, y, col) => { pill(c, x - 3, y - 4, 6, 40, 3, shade('#2E9B4D', -d), { shine: false }); for (let a = 0; a < 5; a++) ball(c, x + Math.cos(a * 1.257) * 11, y - 8 + Math.sin(a * 1.257) * 11, 9, 9, shade(col, -d), { shine: false }); ball(c, x, y - 8, 7, 7, shade('#FFE066', -d), { shine: false }); };
  if (theme === 'meadow' || theme === 'puddle' || theme === 'hill') for (let i = 0; i < 14; i++) { const x = ((i * 150 + 40 - scroll * .9) % (W + 150) + (W + 150)) % (W + 150) - 75; flower(x, 1032 + (i % 3) * 12, [PAL.red, '#FF8FB5', '#fff', PAL.yellow][i % 4]); }
}
function stars(c, t, k, dimY = 520) {
  const r = rng(11); for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * dimY, ph = r() * 6, s = 4 + r() * 8; const show = clamp(k * 1.4 - r() * .4); if (show <= 0) continue; c.globalAlpha = show * (.55 + .45 * Math.sin(t * 3 + ph)); star4(c, x, y, s, '#FFF6C2', t * .3 + ph); } c.globalAlpha = 1;
}
function moon(c, x, y, r) { const g = c.createRadialGradient(x, y, r * .4, x, y, r * 2.4); g.addColorStop(0, 'rgba(255,250,210,.5)'); g.addColorStop(1, 'rgba(255,250,210,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.4, 0, TAU2); c.fill(); ball(c, x, y, r, r, '#FFF6D0'); oval(c, x - r * .3, y + r * .1, r * .18, r * .18, 'rgba(230,215,160,.7)'); oval(c, x + r * .25, y - r * .25, r * .12, r * .12, 'rgba(230,215,160,.7)'); }
function particles(c, t, t0, n, fn) { for (let i = 0; i < n; i++) fn(i, t - t0 - i * .12); }

// full backdrop. mode: day|sunset|night|mix. scroll: px the world has travelled.
function backdrop(c, t, o = {}) {
  const mode = o.mode || 'day', dim = o.dim || (mode === 'night' ? .55 : mode === 'sunset' || mode === 'mix' ? .18 : 0);
  sky(c, t, mode, o.mixK || 0);
  if (mode === 'day') { sunBall(c, o.sunX ?? 1580, o.sunY ?? 170, 78, t); clouds(c, t, 0); }
  if (mode === 'night') { stars(c, t, 1); moon(c, 1560, 190, 80); clouds(c, t, .5); }
  hills(c, o.scroll || 0, dim, o.theme); if (o.theme !== 'sea') trees(c, o.scroll || 0, dim); ground(c, o.scroll || 0, dim, o.theme, t);
}

// ---------- scene helpers ----------
const STOPS = {
  red:    { i: 0, col: PAL.red,    kind: 'bella',  word: 'RED',    name: 'Bella Bunny', theme: 'meadow' },
  yellow: { i: 1, col: PAL.yellow, kind: 'duckie', word: 'YELLOW', name: 'Duckie',      theme: 'puddle' },
  green:  { i: 2, col: PAL.green,  kind: 'fred',   word: 'GREEN',  name: 'Froggy Fred', theme: 'hill' },
  blue:   { i: 3, col: PAL.blue,   kind: 'bear',   word: 'BLUE',   name: 'Little Bear', theme: 'sea' },
};
const ORDER = ['bella', 'duckie', 'fred', 'bear'];
const PARK_X = 560, BUS_S = 1.08, BUS_Y = 960, FEET_Y = 940;
const decelScroll = (t, T, v0) => (t < T ? v0 * (t - t * t / (2 * T)) : v0 * T / 2);

function stopSign(c, x, y, col, word, k, t) {
  if (k <= 0) return; c.save(); c.translate(x, y); const sc = eBack(clamp(k)); c.scale(sc, sc);
  pill(c, -14, -330, 28, 340, 12, '#B8BFD0'); ball(c, 0, -400, 130, 130, col); ball(c, 0, -400, 104, 104, shade(col, .12), { shine: false });
  c.font = `800 ${word.length > 4 ? 52 : 74}px "${FONT()}"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowOffsetY = 4; c.fillText(word, 0, -396);
  c.restore();
}
function nameTag(c, str, x, y, k, col) {
  if (k <= 0) return; c.save(); c.translate(x, y); const sc = eBack(clamp(k)); c.scale(sc, sc); c.font = `800 54px "${FONT()}"`; const w = c.measureText(str).width + 70;
  c.shadowColor = 'rgba(30,20,80,.3)'; c.shadowOffsetY = 8; pill(c, -w / 2, -42, w, 84, 42, '#fff', { shine: false }); c.shadowColor = 'transparent';
  c.fillStyle = shade(col, -.2); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(str, 0, 3); c.restore();
}
function balloon(c, x, y, t, col = PAL.red) {
  const sw = Math.sin(t * 2.2) * 10; c.strokeStyle = 'rgba(70,60,110,.7)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + sw, y + 150); c.quadraticCurveTo(x + sw * 2, y + 230, x + sw * .3, y + 330); c.stroke();
  ball(c, x + sw, y, 78, 96, col, { rot: sw * .006 }); c.fillStyle = shade(col, -.25); c.beginPath(); c.moveTo(x + sw, y + 98); c.lineTo(x + sw - 14, y + 120); c.lineTo(x + sw + 14, y + 120); c.fill();
}
function puddle(c, x, y, rx, t, k = 1) {
  oval(c, x, y, rx * 1.06, rx * .27, '#3A6FB5'); const g = c.createLinearGradient(0, y - rx * .25, 0, y + rx * .25); g.addColorStop(0, '#8FD0FF'); g.addColorStop(1, '#4FA8F0'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, rx * .24, 0, 0, TAU2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 5; for (let i = 0; i < 3; i++) { const q = ((t * .8 + i / 3) % 1); c.globalAlpha = (1 - q) * k; c.beginPath(); c.ellipse(x, y, rx * (.25 + q * .7), rx * (.07 + q * .17), 0, 0, TAU2); c.stroke(); } c.globalAlpha = 1;
}
function droplets(c, x, y, tt, n = 14, power = 330) {
  if (tt < 0 || tt > 1.3) return; const r = rng(5);
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (r() - .5) * 2.2, v = power * (.5 + r() * .7), px = x + Math.cos(a) * v * tt, py = y + Math.sin(a) * v * tt + 520 * tt * tt; c.globalAlpha = clamp(1 - tt / 1.3); ball(c, px, py, 10 - tt * 4, 13 - tt * 5, '#7CCBFF', { shine: false }); } c.globalAlpha = 1;
}
function bucket(c, x, y, k, t) {
  c.save(); c.translate(x, y); c.scale(eBack(clamp(k)), eBack(clamp(k))); c.fillStyle = '#2E6FD6'; c.beginPath(); c.moveTo(-60, -70); c.lineTo(60, -70); c.lineTo(46, 40); c.lineTo(-46, 40); c.closePath();
  const g = c.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, '#5AA2FF'); g.addColorStop(.5, '#3D8BFF'); g.addColorStop(1, '#2A68C8'); c.fillStyle = g; c.fill(); oval(c, 0, -70, 60, 14, '#2A68C8');
  c.strokeStyle = '#E8EEFF'; c.lineWidth = 7; c.beginPath(); c.arc(0, -70, 52, Math.PI, TAU2); c.stroke();
  const cols = ['#FF9EC4', '#FFE4A3', '#fff', '#FFB38A']; for (let i = 0; i < 5; i++) { const px = -42 + i * 21, py = -86 - (i % 2) * 8; ball(c, px, py, 17, 13, cols[i % 4]); }
  c.restore();
}
function shellPop(c, x, y, tt) { // shells arcing out of the bucket
  for (let i = 0; i < 5; i++) { const q = tt - i * .13; if (q < 0 || q > 1.4) continue; const a = -2.1 + i * .5, v = 360; const px = x + Math.cos(a) * v * q * .5, py = y + Math.sin(a) * v * q + 560 * q * q * .6; c.save(); c.translate(px, py); c.rotate(q * 6); ball(c, 0, 0, 22, 17, ['#FF9EC4', '#FFE4A3', '#fff', '#FFB38A', '#E8B7FF'][i]); c.strokeStyle = 'rgba(160,90,100,.5)'; c.lineWidth = 3; for (let j = -1; j <= 1; j++) { c.beginPath(); c.moveTo(0, 10); c.lineTo(j * 11, -10); c.stroke(); } c.restore(); }
}
function floatingNotes(c, t, t0, n = 6, x0 = 960, y0 = 500, spread = 500) {
  const cols = [PAL.red, PAL.yellow, PAL.green, PAL.blue, PAL.purple, '#FF8FB5'];
  particles(c, t, t0, n, (i, q) => { if (q < 0) return; const life = 3.2, k = (q % life) / life; if (q > life * 2.2) return; c.globalAlpha = Math.sin(k * Math.PI); note(c, x0 + (i - n / 2) * spread / n + Math.sin(q * 2 + i) * 40, y0 - k * 360, .9, cols[i % 6], Math.sin(q * 2 + i) * .3); }); c.globalAlpha = 1;
}
function sparkles(c, t, cx, cy, rx, ry, n = 16, sp = 1) {
  const r = rng(21); for (let i = 0; i < n; i++) { const ph = r() * 6.28, x = cx + (r() - .5) * 2 * rx, y = cy + (r() - .5) * 2 * ry, k = .5 + .5 * Math.sin(t * 3 * sp + ph); c.globalAlpha = k; star4(c, x, y, 10 + r() * 18 * k, ['#fff', '#FFF27A', '#FFD1F0'][i % 3], t + ph); } c.globalAlpha = 1;
}
const CAM = (c, t, amp = 0) => { if (amp) c.translate(Math.sin(t * 13) * amp, Math.cos(t * 17) * amp * .7); };

// ---------- the scenes ----------
const [KEY, PH] = SHOT.id.split('-');
const R = {};

R.hook = (c, t) => {
  if (PH === 'a') {
    const bx = lerp(-520, 700, eOut3(prog(t, 0, 3.2)));
    backdrop(c, t, { scroll: decelScroll(t, 3.2, 900), theme: 'meadow' });
    const q = prog(t, 0, 3.2);
    bus(c, bx, BUS_Y, 1.1, t, { dist: decelScroll(t, 3.2, 900), bounce: (1 - q) * 3.5 + 1, sing: 1, driverWave: false });
    bubble(c, 'BEEP BEEP!', 1360, 260, 120, PAL.red, pp(t, 'beep', .5) * (1 - prog(t, 2.1, 2.5)), { rot: -.06 });
    rainbowTitle(c, 'RAINBOW BUS', W / 2 + 120, 270, 150, pp(t, 'title', .9), t);
  } else if (PH === 'b') {
    backdrop(c, t, { scroll: t * 500, theme: 'meadow' });
    // close up in the cab: big Milo, a steering wheel, the road streaming behind
    c.save(); CAM(c, t, 2);
    rr(c, 360, 150, 1200, 800, 90); c.fillStyle = '#FFF3DA'; c.fill(); rr(c, 400, 190, 1120, 720, 70); const g = c.createLinearGradient(0, 190, 0, 910); g.addColorStop(0, '#A8E1FF'); g.addColorStop(1, '#E3F6FF'); c.fillStyle = g; c.fill();
    c.save(); rr(c, 400, 190, 1120, 720, 70); c.clip(); backdrop(c, t, { scroll: t * 700, theme: 'meadow' }); c.restore();
    const sq = 1 + Math.sin(t * 6) * .015;
    char(c, 'milo', 960, 480 + Math.sin(t * 3) * 8, 2.3, t, { sing: 1, sy: sq, look: [Math.sin(t) * .5, .2] });
    // wheel
    c.save(); c.translate(960, 900); c.rotate(Math.sin(t * 2) * .25); c.strokeStyle = '#2E3A5F'; c.lineWidth = 34; c.beginPath(); c.arc(0, 0, 150, 0, TAU2); c.stroke(); c.lineWidth = 22; for (let i = 0; i < 3; i++) { c.rotate(TAU2 / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(150, 0); c.stroke(); } ball(c, 0, 0, 40, 40, '#FF6B6B'); c.restore();
    c.restore();
    nameTag(c, 'Milo', 1380, 300, pp(t, 'milo', .4), PAL.blue);
    floatingNotes(c, t, cueT('drive'), 6, 960, 140, 1300);
  } else {
    const sc = t * 450;
    backdrop(c, t, { scroll: sc, theme: 'meadow' });
    const bx = lerp(-400, W + 450, prog(t, 0, DUR));
    bus(c, bx, BUS_Y, 1.1, t, { dist: sc, bounce: 3, sing: 1, driverWave: true, driverDy: 0 });
    floatingNotes(c, t, 0.1, 7, bx + 100, 640, 700);
    bubble(c, 'HOP ON!', 1180, 260, 130, PAL.green, pp(t, 'hop', .5) * (1 - prog(t, 2.2, 2.6)), { rot: .05 });
    rainbowTitle(c, 'COME RIDE WITH US', W / 2, 190, 100, pp(t, 'ride', .9), t);
  }
};

function stopScene(c, t, st) {
  const S = STOPS[KEY], prev = ORDER.slice(0, S.i);
  const parked = PH !== 'a';
  // phase timing
  let busX = PARK_X, scroll = 0, dist = 0, bounce = 0;
  if (PH === 'a') { const T = Math.min(DUR - .4, 2.6), k = prog(t, 0, T); busX = lerp(-480, PARK_X, eOut(k)); scroll = decelScroll(t, T, 900); dist = scroll; bounce = (1 - k) * 3; }
  const leaveAt = PH === 'd' || (KEY === 'blue' && PH === 'c') ? DUR - 1.5 : 1e9;
  if (t > leaveAt) { const k = prog(t, leaveAt, DUR); busX = PARK_X + eIn(k) * 1500; scroll = 900 * eIn(k) * (DUR - leaveAt) / 2; dist = scroll + 100 * t; bounce = k * 3; }
  backdrop(c, t, { scroll: scroll + 0, theme: S.theme });
  const flyAt = KEY === 'blue' ? cueT('blue', 2.8) : .6, flyLen = 1.5;
  const fk = prog(t, flyAt, flyAt + flyLen);
  const boards = (PH === 'd' || (KEY === 'blue' && PH === 'c'));
  const seated = boards && fk >= 1;
  const passengers = seated ? [...prev, S.kind] : prev;
  const popped = {}; if (seated) popped[S.kind] = prog(t, flyAt + flyLen, flyAt + flyLen + .3);
  bus(c, busX, BUS_Y, BUS_S, t, { passengers, dist, bounce, sing: 1, popped, driverWave: boards && fk > .4 && fk < 1.1 });

  // the sign
  if (PH === 'a') stopSign(c, 1470, 960, S.col, S.word, pp(t, 'stop', .5, 0.3), t);
  else if (!(t > leaveAt)) stopSign(c, 1700, 940, S.col, S.word, 1, t);

  // the friend
  const fx0 = 1330, fs = 1.55, fy = FEET_Y - 2.3 * 100 * fs;
  if (PH !== 'a') {
    let x = fx0, y = fy, sx = 1, sy = 1, s = fs, rot = 0, open = undefined, wave = false, earUp = 0;
    const enter = PH === 'b' || (KEY === 'blue' && PH === 'b') ? eBack(prog(t, 0, .7)) : 1;
    x = lerp(W + 250, fx0, enter);
    if (KEY === 'red') {
      if (PH === 'c') { const hop = Math.abs(Math.sin(t * 5.5)); y -= hop * 150 * (1 - prog(t, 3.2, DUR) * .3); sy = 1 + (1 - hop) * .04; earUp = hop * .25; }
      if (PH === 'b') y -= Math.abs(Math.sin(t * 3.4)) * 14;
      if (PH === 'd') { y -= Math.abs(Math.sin(t * 4)) * 24; wave = fk < 0.01; }
    }
    if (KEY === 'yellow') {
      const sp = cueT('splash', 99);
      if (PH === 'b') { const jump = Math.max(0, Math.sin((t - sp) * 7)) * (t > sp ? 130 : 0); y -= jump; }
      if (PH === 'c') { y -= Math.abs(Math.sin(t * 4)) * 24; }
      if (PH === 'd') { y -= Math.abs(Math.sin(t * 4)) * 24; }
    }
    if (KEY === 'green') {
      if (PH === 'b') { wave = t > cueT('wave', 0) - .8 && t < cueT('ribbit', 99) + .01 || true; wave = true; }
      if (PH === 'c') { const hop = Math.abs(Math.sin(t * 4.2)); y -= hop * 190; sy = 1 + (1 - hop) * .08; sx = 1 - (1 - hop) * .05; }
      if (PH === 'd') { y -= Math.abs(Math.sin(t * 4)) * 24; }
    }
    if (KEY === 'blue') {
      if (PH === 'b') y -= Math.abs(Math.sin(t * 3.4)) * 16;
      if (PH === 'c') { const sp = Math.abs(Math.sin(t * 4.6)); y -= sp * 60; }
    }
    // props at the feet
    if (KEY === 'yellow') puddle(c, fx0, FEET_Y + 22, 330, t);
    if (KEY === 'blue') { /* shore */ }
    const boardingNow = boards && fk > 0;
    if (!boardingNow) {
      if (KEY === 'red') { const bk = PH === 'b' ? prog(t, cueT('balloon', 0), cueT('balloon', 0) + .6) : 1; balloon(c, x + 190 + Math.sin(t) * 6, y - 260 * eOut(bk) - 20 + (1 - bk) * 300, t); }
      if (KEY === 'blue' && PH !== 'a') bucket(c, x + 230, FEET_Y - 20, PH === 'b' ? prog(t, 0, .5) : 1, t);
      char(c, S.kind, x, y, s, t, { sing: 1, sx, sy, rot, wave, earUp });
    } else {
      // hop into the bus along an arc, shrinking into the right window
      const slot = ORDER.indexOf(S.kind), wi = 3 - slot;
      const tx = busX + SLOTS[wi] * BUS_S, ty = BUS_Y - 225 * BUS_S;
      const k = eIO(fk); const ax = lerp(fx0, tx, k), ay = lerp(y + 0, ty, k) - Math.sin(k * Math.PI) * 330;
      if (fk < 1) char(c, S.kind, ax, ay, lerp(fs, .5 * BUS_S, k), t, { sing: 1, rot: lerp(0, .2, Math.sin(k * Math.PI)) });
      if (KEY === 'red' && fk < 1) balloon(c, ax + 120 * (1 - k), ay - 220 * (1 - k * .8), t);
    }
    // water splashes / shells / hearts
    if (KEY === 'yellow' && PH === 'b') droplets(c, fx0, FEET_Y, t - sp0('splash') , 16, 380);
    if (KEY === 'yellow' && PH === 'b') { droplets(c, fx0 - 120, FEET_Y, t - sp0('splash') - .35, 10, 300); }
    if (KEY === 'yellow' && PH === 'c') { const j = Math.sin(t * 4); if (j > .9) droplets(c, fx0, FEET_Y, (j - .9) * 4, 8, 260); }
    if (KEY === 'blue' && PH === 'b') shellPop(c, x + 230, FEET_Y - 110, t - cueT('shells', 99));
    if (KEY === 'blue' && PH === 'c') { droplets(c, x - 330, 760, ((t * 1.1) % 1.3), 10, 250); droplets(c, x - 100, 780, (((t + .6) * 1.1) % 1.3), 10, 250); }
    if (KEY === 'green' && PH === 'c') { const hop = Math.abs(Math.sin(t * 4.2)); if (hop < .12) { c.globalAlpha = (.12 - hop) * 6; oval(c, x, FEET_Y + 10, 150, 20, 'rgba(255,255,255,.5)'); c.globalAlpha = 1; } }
    // names + words
    if (PH === 'b') nameTag(c, S.name, x, 190, pp(t, 'name', .4), S.col);
    if (KEY === 'red' && PH === 'c') bubble(c, 'BOUNCE!', 960, 190, 150, PAL.red, pp(t, 'bounce', .4), { rot: -.05 });
    if (KEY === 'red' && PH === 'c' && hasCue('up')) bubble(c, 'UP!', 1500, 330, 120, PAL.purple, pp(t, 'up', .4), { rot: .08 });
    if (KEY === 'red' && PH === 'd') { bubble(c, 'RED!', 960, 190, 170, PAL.red, pp(t, 'red', .4)); particles(c, t, cueT('hello'), 5, (i, q) => { if (q > 0 && q < 2) { c.globalAlpha = 1 - q / 2; heart(c, fx0 - 200 + i * 100, 560 - q * 150, .8, '#FF6B8A'); } }); c.globalAlpha = 1; }
    if (KEY === 'yellow' && PH === 'b') bubble(c, 'SPLASH!', 1100, 190, 150, '#3D8BFF', pp(t, 'splash', .4), { rot: .04 });
    if (KEY === 'yellow' && PH === 'c') { bubble(c, 'QUACK!', 960, 190, 160, PAL.yellow, pp(t, 'quack', .4), { rot: -.04 }); bubble(c, 'QUACK!', 1500, 330, 90, '#FF9A1F', pp(t, 'quack', .4, .5) , { rot: .1 }); }
    if (KEY === 'yellow' && PH === 'd') { bubble(c, 'YELLOW!', 960, 190, 170, PAL.yellow, pp(t, 'yellow', .4)); sparkles(c, t, 1330, 560, 400, 250, 12); }
    if (KEY === 'green' && PH === 'b') { c.save(); }
    if (KEY === 'green' && PH === 'b') { c.restore(); bubble(c, 'RIBBIT!', 1000, 190, 150, PAL.green, pp(t, 'ribbit', .4, 0), { rot: -.04 }); }
    if (KEY === 'green' && PH === 'c') bubble(c, 'JUMP! JUMP!', 960, 190, 140, PAL.green, pp(t, 'jump', .4), { rot: .04 });
    if (KEY === 'green' && PH === 'd') { bubble(c, 'GREEN!', 960, 190, 170, PAL.green, pp(t, 'green', .4)); if (hasCue('bump')) bubble(c, 'bump bump!', 500, 330, 80, '#2E9B4D', pp(t, 'bump', .4), { rot: -.08 }); }
    if (KEY === 'blue' && PH === 'c') { bubble(c, 'SPLASH!', 1000, 190, 150, PAL.blue, pp(t, 'splash', .4), { rot: -.04 }); bubble(c, 'BLUE!', 1150, 330, 130, '#2E6FD6', pp(t, 'blue', .4), { rot: .05 }); if (hasCue('sit')) sparkles(c, t, 600, 560, 400, 200, 10); }
  } else {
    // arrive shot: the word
    bubble(c, S.word + ' STOP!', 1100, 190, 150, S.col, pp(t, 'stop', .5, .3), { rot: -.04 });
    if (KEY !== 'red' && KEY !== 'blue') { /* nothing else */ }
  }
  void parked;
}
const sp0 = (n) => cueT(n, 99);
for (const k of ['red', 'yellow', 'green', 'blue']) R[k] = (c, t) => stopScene(c, t, STOPS[k]);

R.count = (c, t) => {
  backdrop(c, t, { scroll: 0, theme: 'meadow' });
  const pass = ['bella', 'duckie', 'fred', 'bear'];
  const cuesOrder = PH === 'a' ? ['one', 'two'] : PH === 'b' ? ['three', 'four', 'five'] : [];
  // who has been counted so far: a = Milo, Bella ; b = Duckie, Fred, Bear ; c = all
  const shownKinds = PH === 'a' ? ['bella'] : PH === 'b' ? ['bella', 'duckie', 'fred', 'bear'] : pass;
  const BX = 960, BS = 1.95;
  const popped = {};
  pass.forEach((k) => { popped[k] = PH === 'c' ? 1 : PH === 'a' ? (k === 'bella' ? pp(t, 'two', .4) : 0) : (k === 'bella' ? 1 : k === 'duckie' ? pp(t, 'three', .4) : k === 'fred' ? pp(t, 'four', .4) : pp(t, 'five', .4)); });
  c.save(); c.translate(0, -36 + Math.sin(t * 3.5) * (PH === 'c' ? 8 : 2.5));
  bus(c, BX, 940, BS, t, { flip: true, passengers: pass, popped, sing: 1, dist: t * 40, driverWave: PH === 'c', bounce: PH === 'c' ? 3 : 0 });
  c.restore();
  // number badges over each seat (bus is mirrored: front at the left)
  const seatX = (kind) => kind === 'milo' ? BX - 295 * BS : BX - SLOTS[3 - pass.indexOf(kind)] * BS;
  const badge = (n, kind, k, col) => { if (k <= 0) return; const x = seatX(kind), y = 250; c.save(); c.translate(x, y + Math.sin(t * 4 + n) * 6); c.scale(eBack(clamp(k)), eBack(clamp(k))); ball(c, 0, 0, 78, 78, col); c.font = `800 100px "${FONT()}"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowOffsetY = 5; c.fillText(String(n), 0, 6); c.restore(); };
  const cols = [PAL.red, '#FF9A1F', PAL.yellow, PAL.green, PAL.blue];
  if (PH === 'a') { badge(1, 'milo', pp(t, 'one', .4), cols[0]); badge(2, 'bella', pp(t, 'two', .4), cols[1]); }
  if (PH === 'b') { badge(1, 'milo', 1, cols[0]); badge(2, 'bella', 1, cols[1]); badge(3, 'duckie', pp(t, 'three', .4), cols[2]); badge(4, 'fred', pp(t, 'four', .4), cols[3]); badge(5, 'bear', pp(t, 'five', .4), cols[4]); }
  if (PH === 'c') { [['milo', 1], ['bella', 2], ['duckie', 3], ['fred', 4], ['bear', 5]].forEach(([k, n]) => badge(n, k, 1, cols[n - 1])); rainbowTitle(c, 'RAINBOW BUS', W / 2, 120, 110, pp(t, 'rainbow', .9, 3.4), t); heartsRow(c, t); }
  void shownKinds; void cuesOrder;
};
function heartsRow(c, t) { for (let i = 0; i < 7; i++) { c.globalAlpha = .5 + .5 * Math.sin(t * 3 + i); heart(c, 260 + i * 230, 1010 + Math.sin(t * 2 + i) * 10, .6, ['#FF6B8A', '#FFD43B', '#7ED957', '#5AA2FF', '#B07BFF'][i % 5]); } c.globalAlpha = 1; }

function rainbowArc(c, cx, cy, R0, bw, k, sparkleT) {
  const cols = [PAL.red, '#FF9A1F', PAL.yellow, PAL.green, PAL.blue, PAL.purple];
  c.save(); c.lineCap = 'butt';
  cols.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = bw + 1; c.beginPath(); c.arc(cx, cy, R0 - i * bw, Math.PI, Math.PI + Math.PI * eIO(clamp(k))); c.stroke(); });
  c.globalAlpha = .22; c.strokeStyle = '#fff'; c.lineWidth = 10; c.beginPath(); c.arc(cx, cy, R0 + bw * .35, Math.PI, Math.PI + Math.PI * eIO(clamp(k))); c.stroke(); c.restore();
}
R.rainbow = (c, t) => {
  backdrop(c, t, { scroll: PH === 'c' ? t * 260 : 0, theme: 'meadow', sunX: 300, sunY: 160 });
  const cx = W / 2, cy = 830, R0 = 770, bw = 56;
  const k = PH === 'a' ? prog(t, 0.2, cueT('look', 2.3) + .9) : 1;
  rainbowArc(c, cx, cy, R0, bw, k);
  // clouds at the arc feet
  if (k > 0) { cloud(c, cx - R0 + 10, cy + 10, .9); cloud(c, cx + R0 - 10, cy + 10, .9); }
  if (PH === 'a') { bubble(c, 'LOOK UP HIGH!', W / 2, 520, 130, PAL.purple, prog(t, 0, .6), { rot: -.03 }); bubble(c, 'A RAINBOW!', W / 2, 680, 140, PAL.red, pp(t, 'look', .5, 2.2), { rot: .03 }); }
  if (PH === 'b') {
    const names = [['red', 'RED', PAL.red, 'Red'], ['yellow', 'YELLOW', PAL.yellow, 'yellow'], ['green', 'GREEN', PAL.green, 'green'], ['blue', 'BLUE', PAL.blue, 'blue']];
    names.forEach(([cn, word, col], i) => { const x = 740 + (i % 2) * 440, y = 520 + Math.floor(i / 2) * 150; bubble(c, word, x, y, 112, col, pp(t, cn, .4), { rot: (i % 2 ? .05 : -.05) }); sparkles(c, t - cueT(cn), x, y, 150, 60, 4); });
  }
  if (PH === 'c') {
    const bx = lerp(-300, W + 400, prog(t, 0, DUR));
    bus(c, bx, 960, .95, t, { dist: t * 260, bounce: 3, sing: 1, passengers: ORDER, driverWave: true });
    sparkles(c, t, cx, 380, 700, 300, 26, 1.3);
    rainbowTitle(c, 'JUST FOR YOU!', W / 2, 560, 120, pp(t, 'you', .9), t);
  }
};

R.end = (c, t) => {
  if (PH === 'a') {
    const k = prog(t, 0, DUR);
    backdrop(c, t, { mode: 'mix', mixK: k * .8, scroll: 0, theme: 'meadow', dim: .2 + k * .2 });
    // sun sinks, stars fade in, glow
    const sy = lerp(300, 660, eIO(prog(t, 0, DUR - .3)));
    // redraw sun over sky: place behind hills by drawing early? keep simple: draw sun over sky then hills again over its lower part
    c.save(); c.beginPath(); c.rect(0, 0, W, 610); c.clip(); sunBall(c, 560, sy, 90, t); c.restore();
    stars(c, t, pp(t, 'star', 2, .5), 420);
    // redraw hills silhouette portion over the sun's lower edge
    c.save(); c.beginPath(); c.rect(0, 560, W, 120); c.clip(); hills(c, 0, .2 + k * .2, 'meadow'); c.restore();
    ground(c, 0, .2 + k * .2, 'meadow', t);
    bus(c, 1180, BUS_Y, 1.0, t, { passengers: ORDER, sing: 0, dist: 0, bounce: 0, driverDy: 0 });
    bubble(c, 'DOWN, DOWN, DOWN', W / 2, 150, 110, '#FFE9A8', pp(t, 'sun', .5), { rot: -.03 });
    c.fillStyle = 'rgba(40,20,90,.15)'; c.fillRect(0, 0, W, H);
  } else {
    const wk = cueT('wave', 0);
    backdrop(c, t, { mode: 'night', scroll: 0, theme: 'meadow' });
    const leave = prog(t, cueT('night', 4.8) - .2, DUR);
    const bx = lerp(900, W + 500, eIn(leave));
    // lit windows glow
    c.save(); c.translate(0, 0);
    bus(c, bx, BUS_Y, 1.25, t, { passengers: ORDER, sing: 0, dist: leave * 900, bounce: leave * 3, driverWave: true });
    c.restore();
    // everybody waves: floating hands above bus
    bubble(c, 'WAVE GOODBYE!', 760, 190, 120, '#FFE9A8', pp(t, 'wave', .5), { rot: -.03 });
    bubble(c, 'GOODNIGHT!', W / 2, 380, 150, '#fff', pp(t, 'night', .6), { rot: .02 });
    particles(c, t, cueT('night'), 6, (i, q) => { if (q > 0 && q < 1.6) { c.globalAlpha = 1 - q / 1.6; heart(c, 400 + i * 220, 500 - q * 120, .8, '#FF8FB5'); } }); c.globalAlpha = 1;
    // fade to deep blue at the very end
    const fe = prog(t, DUR - .6, DUR); if (fe > 0) { c.fillStyle = `rgba(14,27,77,${fe * .6})`; c.fillRect(0, 0, W, H); }
  }
};

shotFilm({ draw: (c, t) => { if (!R[KEY]) throw new Error('no scene for ' + SHOT.id); R[KEY](c, t); } });
