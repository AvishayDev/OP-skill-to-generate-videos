'use strict';
// "9 brains": a hand-drawn octopus on the lab grid, wiggling on twos. A big 9 lands on "nine", the head brain glows
// on "head", then a mini brain lights in each arm from "mini" to "arm".
const HEAD = { x: 540, y: 600, r: 190 };
const ARM_N = 8;
// Arm i: a curve from under the head out and down; returns points along it at time t.
function armPoints(i, t) {
  // Fan the arms from down-right (0.12π) to down-left (0.88π); each curls and wiggles along its length.
  const a0 = Math.PI * (0.1 + 0.8 * (i / (ARM_N - 1)));
  const bx = HEAD.x + Math.cos(a0) * HEAD.r * 0.55, by = HEAD.y + HEAD.r * 0.85;
  const pts = [];
  for (let k = 0; k <= 70; k++) {
    const s = k / 70;
    const ang = a0 + (i % 2 ? 1 : -1) * 0.5 * s * s + Math.sin(t * 1.6 + i) * 0.1 * s;
    const len = 560 * s;
    const wig = Math.sin(t * 2.4 + i * 1.3 + s * 6) * 34 * s;
    pts.push([bx + Math.cos(ang) * len - Math.sin(ang) * wig, by + Math.sin(ang) * len * 0.9 + Math.cos(ang) * wig, 30 * (1 - s) + 6]);
  }
  return pts;
}
function drawArm(c, pts) {
  // Tapered stroke: thick filled discs along the curve, ink outline first, then paper fill.
  for (const pass of [0, 1]) {
    c.fillStyle = pass ? PAL.paper : PAL.ink;
    for (const [x, y, w] of pts) { c.beginPath(); c.arc(x, y, w + (pass ? 0 : 5), 0, TAU); c.fill(); }
  }
}
function glow(c, x, y, r, k, color) {
  if (k <= 0) return;
  c.save();
  const g = c.createRadialGradient(x, y, 0, x, y, r * 2.4);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,107,74,0)');
  c.globalAlpha = 0.55 * k; c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.4, 0, TAU); c.fill();
  c.globalAlpha = 1; c.fillStyle = color; c.strokeStyle = PAL.ink; c.lineWidth = 5;
  c.beginPath(); c.arc(x, y, r * eBack(clamp(k)), 0, TAU); c.fill(); c.stroke();
  c.restore();
}
shotFilm({
  draw: (c, t) => {
    paper(c);
    const tt = onTwos(t);
    // The big count, top left of the head.
    const kn = p(t, 'nine', 0.4);
    if (kn > 0) {
      c.save(); c.translate(540, 250); c.scale(eBack(kn), eBack(kn));
      text(c, '9 BRAINS', 0, 0, { size: 150, weight: 900, color: PAL.ink, face: 'Heebo' });
      c.restore();
    }
    const arms = Array.from({ length: ARM_N }, (_, i) => armPoints(i, tt));
    arms.forEach((pts) => drawArm(c, pts));
    // Head (mantle) with eyes.
    c.save(); c.fillStyle = PAL.paper; c.strokeStyle = PAL.ink; c.lineWidth = 10;
    c.beginPath(); c.ellipse(HEAD.x, HEAD.y + Math.sin(tt * 2) * 6, HEAD.r, HEAD.r * 1.12, 0, 0, TAU); c.fill(); c.stroke();
    for (const ex of [-70, 70]) { c.fillStyle = PAL.ink; c.beginPath(); c.arc(HEAD.x + ex, HEAD.y + 70, 22, 0, TAU); c.fill(); c.fillStyle = PAL.paper; c.beginPath(); c.arc(HEAD.x + ex + 7, HEAD.y + 63, 7, 0, TAU); c.fill(); }
    c.restore();
    // Head brain on "head".
    glow(c, HEAD.x, HEAD.y - 50, 46, p(t, 'head', 0.3), PAL.accent);
    // Mini brains, one per arm, lighting one after another from "mini" to "arm".
    const span = Math.max(0.4, cue('arm') - cue('mini'));
    arms.forEach((pts, i) => {
      const at = cue('mini') + (span * i) / (ARM_N - 1);
      const [x, y] = pts[38];
      glow(c, x, y, 24, prog(t, at, at + 0.25), PAL.accent);
    });
  },
});
