'use strict';
// Pencil sketchbook (animate-in-code look 06): ruled notebook paper on a spiral. Each spoken word is written in
// graphite on the lines as it is said ("transcribes"); a waveform is drawn in pencil under it; on "cuts" its flat
// stretch is circled in red pencil and labelled "dead air"; on "air" it is snipped out and the halves close up.
// Lines boil on twos (12 fps) like a pencil test; the camera moves on ones.

const INK = '#3b3a40', RED = '#d8322a', BLUE_RULE = 'rgba(70,110,200,.28)';
const BARS = 30, GAP = [12, 18], X0 = 170, X1 = 930, WY = 1080;
const amp = i => (i >= GAP[0] && i < GAP[1] ? 0.05 : 0.25 + 0.75 * Math.abs(Math.sin(i * 1.9) * Math.cos(i * 0.55)));

// One pencil line: two jittered passes, re-jittered every boil frame; `k` draws only the first part.
function pencil(c, pts, { w = 4, col = INK, a = .85, seed = 1, k = 1, bf = 0 } = {}) {
  if (k <= 0) return;
  for (let pass = 0; pass < 2; pass++) {
    const r = rng(seed * 7919 + bf * 104729 + pass * 613);
    let q = pts.map(([x, y]) => [x + (r() - .5) * 2.4, y + (r() - .5) * 2.4]);
    if (k < 1) q = q.slice(0, Math.max(2, Math.ceil(q.length * k)));
    c.save(); c.strokeStyle = col; c.globalAlpha = a * (pass ? .45 : 1); c.lineWidth = w * (pass ? .6 : 1); c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); q.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.restore();
  }
}
const ellipsePts = (cx, cy, rx, ry, n = 40, turns = 1.12) => Array.from({ length: n + 1 }, (_, i) => { const a = -2.2 + (i / n) * turns * TAU; return [cx + Math.cos(a) * rx * (1 + .03 * Math.sin(i)), cy + Math.sin(a) * ry]; });

let PAGE = null;
shotFilm({
  setup: async () => {
    PAGE = layer(g => {
      g.fillStyle = '#3d4a5c'; g.fillRect(0, 0, W, H);                         // desk
      g.fillStyle = '#FBF6EA'; g.fillRect(70, 0, W - 70, H);                     // page
      g.fillStyle = BLUE_RULE; for (let y = 300; y < H; y += 72) g.fillRect(70, y, W, 2);
      g.fillStyle = 'rgba(216,50,42,.45)'; g.fillRect(160, 0, 3, H);             // margin
      const r = rng(9);
      for (let i = 0; i < 70000; i++) { g.fillStyle = `rgba(60,50,30,${(r() * .05).toFixed(3)})`; g.fillRect(70 + r() * (W - 70), r() * H, 1.6, 1.6); }
      for (let y = 40; y < H; y += 72) {                                           // spiral
        g.fillStyle = '#3d4a5c'; g.beginPath(); g.ellipse(100, y, 11, 14, 0, 0, TAU); g.fill();
        g.strokeStyle = '#c9ccd2'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(100, y); g.bezierCurveTo(80, y - 32, 40, y - 26, 34, y + 14); g.stroke();
      }
    });
  },
  draw: (c, t) => {
    const bt = onTwos(t), bf = Math.floor(t * 12);
    // camera: slow push, a nudge on the snip
    const snip = since(t, 'air');
    const nudge = snip > 0 && snip < .3 ? Math.sin(snip * 60) * 6 * (1 - snip / .3) : 0;
    c.save(); c.translate(W / 2 + nudge, H / 2); c.scale(1 + .04 * (t / DUR), 1 + .04 * (t / DUR)); c.translate(-W / 2, -H / 2);
    c.drawImage(PAGE, 0, 0, W, H);

    // heading
    pencil(c, [[200, 205], [560, 200]], { w: 3, seed: 3, bf, k: prog(bt, 0, .4) });
    c.save(); c.font = 'italic 900 64px Heebo'; c.fillStyle = INK; c.globalAlpha = .9; c.fillText('transcript', 205, 180); c.restore();

    // the words, written as they are spoken, flowing over the ruled lines
    c.save(); c.font = 'italic 700 74px Heebo'; c.fillStyle = INK; c.textBaseline = 'alphabetic';
    let x = 200, y = 446;
    for (const w of SHOT.words) {
      const wd = c.measureText(w.word + ' ').width;
      if (x + wd > 1010) { x = 200; y += 144; }
      if (t >= w.t) {
        const r = rng(Math.round(w.t * 100) + bf * 7);
        c.globalAlpha = .9 * clamp((t - w.t) / .08); c.fillText(w.word, x + (r() - .5) * 1.5, y + (r() - .5) * 1.5);
      }
      x += wd;
    }
    c.restore();

    // the waveform, drawn left to right; after the snip the gap is gone and the halves slide together
    const draw = prog(t, cue('transcribes'), cue('cuts'));
    const close = eOut(prog(t, cue('air') + .08, cue('air') + .4));
    const step = (X1 - X0) / BARS, gapW = (GAP[1] - GAP[0]) * step;
    for (let i = 0; i < BARS; i++) {
      const inGap = i >= GAP[0] && i < GAP[1];
      if (i / BARS > draw) break;
      if (inGap && close > 0) continue;
      const shift = i < GAP[0] ? gapW / 2 * close : i >= GAP[1] ? -gapW / 2 * close : 0;
      const bx = X0 + i * step + step / 2 + shift, h = 30 + amp(i) * 300;
      pencil(c, [[bx, WY - h / 2], [bx, WY + h / 2]], { w: 9, seed: 100 + i, bf, col: INK });
    }
    pencil(c, [[X0 - 20, WY], [X1 + 20, WY]], { w: 2, a: .35, seed: 99, bf });

    // red circle + label on "cuts", gone with the gap
    const gx = X0 + (GAP[0] + GAP[1]) / 2 * step;
    if (close < .5) {
      pencil(c, ellipsePts(gx, WY, gapW / 2 + 40, 120), { w: 6, col: RED, seed: 7, bf, k: eOut(prog(t, cue('cuts'), cue('cuts') + .4)), a: .9 * (1 - close * 2) });
      if (t >= cue('cuts') + .25) { c.save(); c.font = 'italic 900 64px Heebo'; c.fillStyle = RED; c.textAlign = 'center'; c.globalAlpha = 1 - close * 2; c.fillText('dead air', gx, WY - 175); c.restore(); }
    }
    // the snip: two dashed cut lines and a pair of scissors closing
    if (snip > -.15 && close < 1) {
      const sp = clamp((snip + .15) / .15);
      c.save(); c.setLineDash([18, 14]); c.strokeStyle = RED; c.lineWidth = 5; c.globalAlpha = 1 - close;
      for (const sx of [gx - gapW / 2, gx + gapW / 2]) { c.beginPath(); c.moveTo(sx, WY - 220); c.lineTo(sx, WY - 220 + 440 * sp); c.stroke(); }
      c.restore();
      const open = snip < 0 ? .5 : .5 * (1 - clamp(snip / .12));
      c.save(); c.translate(gx, WY + 330); c.fillStyle = RED; c.strokeStyle = RED; c.lineWidth = 10;
      for (const s of [-1, 1]) {
        c.save(); c.rotate(s * open);
        c.beginPath(); c.moveTo(-s * 6, 10); c.lineTo(s * 26, 10); c.lineTo(0, -230); c.closePath(); c.fill();   // blade
        c.lineWidth = 12; c.beginPath(); c.ellipse(-s * 40, 80, 34, 48, s * .5, 0, TAU); c.stroke();               // handle
        c.restore();
      }
      c.fillStyle = INK; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
      c.restore();
    }
    // margin note after the cut
    if (close > .6) { c.save(); c.font = 'italic 800 52px Heebo'; c.fillStyle = RED; c.globalAlpha = clamp((close - .6) / .3); c.fillText('cut ✓', 700, 1400); c.restore(); }
    c.restore();
  },
});
