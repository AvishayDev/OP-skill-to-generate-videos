'use strict';
// ============================================================
// helpers.js · what a canvas shot (the animate-in-code skill) can use besides runtime.js.
// Loaded after the generated globals (W, H, FPS, DUR, NDRAW, SHOT, PAL, IMAGE_DATA) and before
// runtime.js, so a shot reads like one of the skill's films. A shot file calls:
//
//   shotFilm({ setup: async () => {...}, draw: (c, t, i) => {...} })
//
// SHOT  = { id, dur, frames, cue: { name: seconds }, words: [{ word, t, end }], concept }
// PAL   = the concept palette { bg, ink, accent, muted, paper, ... }
// IMG   = { id: HTMLImageElement } — the shot's prepared images (shots.json → images), loaded before setup
// FACE  = { display, body } font families ("Heebo" is always loaded; the skill's "OHRonShemer" too)
// Everything stays a pure function of t: no state carried between frames (the skill's rule).
// ============================================================
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const eOut = k => 1 - (1 - k) * (1 - k), eIn = k => k * k, eIO = k => k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
const eOut3 = k => 1 - Math.pow(1 - k, 3);
const eBack = k => { const s = 1.9; k -= 1; return 1 + k * k * ((s + 1) * k + s); };
const prog = (t, a, b) => clamp((t - a) / (b - a));
function rng(s) { s = (s * 2654435761) >>> 0 || 1; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// The moment a cue lands (seconds into the shot); `p(name, len)` = 0..1 progress of an entrance that
// starts on that word, `since(name)` = seconds since it (negative before).
const cue = name => { const v = SHOT.cue[name]; if (v === undefined) throw new Error(`no cue "${name}" in shots.json`); return v; };
const since = (t, name) => t - cue(name);
const p = (t, name, len = .35) => prog(t, cue(name), cue(name) + len);
// Hand-made motion: hold drawings on twos (12 fps) or threes (8 fps) — the skill's texture.
const onTwos = t => Math.floor(t * 12) / 12, onThrees = t => Math.floor(t * 8) / 8;

const FACE = { display: SHOT.concept?.canvasFont || SHOT.concept?.font || 'Heebo', body: SHOT.concept?.bodyFont || SHOT.concept?.canvasFont || SHOT.concept?.font || 'Heebo' };
// The project's downloaded fonts (Google Fonts for Arabic, CJK, Cyrillic…), loaded before the first frame.
async function loadFonts() {
  await Promise.all((typeof CUSTOM_FONTS === 'undefined' ? [] : CUSTOM_FONTS).map(async (f) => { const ff = new FontFace(f.family, `url(${f.data})`, { weight: f.weight || '400' }); document.fonts.add(await ff.load()); }));
}
const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const IMG = {};
async function loadImages() {
  await Promise.all(Object.entries(IMAGE_DATA).map(([id, src]) => new Promise((ok, bad) => {
    const im = new Image(); im.onload = () => { IMG[id] = im; ok(); }; im.onerror = () => bad(new Error(`image ${id} failed to load`)); im.src = src;
  })));
}

// Text, never wrapped; right to left for Hebrew / Arabic / Persian. size in world px. Returns its width.
function text(c, s, x, y, { size = 80, weight = 800, color = PAL.ink, align = 'center', face = FACE.display, base = 'middle', alpha = 1 } = {}) {
  c.save(); c.globalAlpha *= alpha; c.direction = RTL_RE.test(s) ? 'rtl' : 'ltr'; c.textAlign = align; c.textBaseline = base;
  c.font = `${weight} ${size}px "${face}"`; c.fillStyle = color; c.fillText(s, x, y); const w = c.measureText(s).width; c.restore(); return w;
}
// A highlighter block behind a word: grows from the right (where Hebrew / Arabic start reading).
function marker(c, x, y, w, h, k, color = PAL.accent) {
  if (k <= 0) return; c.save(); c.fillStyle = color; const ww = w * eOut(clamp(k)); c.fillRect(x + w / 2 - ww, y - h / 2, ww, h); c.restore();
}
// Photo inside a frame (cover-fit), optional selection box with handles in the accent colour.
function photo(c, im, x, y, w, h, { k = 1, box = true, radius = 0 } = {}) {
  if (!im || k <= 0) return; c.save(); c.globalAlpha *= clamp(k * 1.6);
  const s = Math.max(w / im.width, h / im.height), iw = im.width * s, ih = im.height * s;
  c.beginPath(); c.roundRect ? c.roundRect(x - w / 2, y - h / 2, w, h, radius) : c.rect(x - w / 2, y - h / 2, w, h); c.clip();
  c.drawImage(im, x - iw / 2, y - ih / 2, iw, ih); c.restore();
  if (box) selectBox(c, x, y, w + 16, h + 16, k);
}
function selectBox(c, x, y, w, h, k = 1, color = PAL.accent) {
  if (k <= 0) return; c.save(); c.strokeStyle = color; c.lineWidth = 6; const q = eOut(clamp(k));
  c.globalAlpha *= clamp(k * 3); c.strokeRect(x - w / 2 * q, y - h / 2 * q, w * q, h * q);
  c.fillStyle = color; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.fillRect(x + sx * w / 2 * q - 9, y + sy * h / 2 * q - 9, 18, 18); c.restore();
}

// The skill's film() with the shot's images loaded first.
function shotFilm({ setup = null, draw }) {
  return film({ setup: async () => { await loadFonts(); await loadImages(); if (setup) await setup(); }, draw });
}

// The concept's ground (paper colour, dot/grid pattern, grain), pre-rendered once and drawn first in every frame,
// lined up with the Reelkit <Paper> so a cut from a component shot to a canvas shot keeps the same desk.
let _paper = null;
function paper(c) {
  if (!_paper) _paper = layer(g => {
    const gr = SHOT.concept.ground || {};
    g.fillStyle = PAL.bg; g.fillRect(0, 0, W, H);
    g.fillStyle = gr.patternColor || 'rgba(0,0,0,0.07)';
    if (gr.pattern === 'dots') for (let y = 42; y < H; y += 54) for (let x = 0; x <= W; x += 54) { g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); }
    if (gr.pattern === 'grid' || gr.pattern === 'lines') for (let y = 42; y < H; y += 54) g.fillRect(0, y, W, 1.5);
    if (gr.pattern === 'grid') for (let x = 0; x <= W; x += 54) g.fillRect(x, 0, 1.5, H);
    const r = rng(7), n = gr.grain ?? 0.06;
    for (let i = 0; i < 90000; i++) { g.fillStyle = `rgba(0,0,0,${(r() * n * 0.9).toFixed(3)})`; g.fillRect(r() * W, r() * H, 1.6, 1.6); }
  });
  c.drawImage(_paper, 0, 0, W, H);
}
// A rounded rectangle path.
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
