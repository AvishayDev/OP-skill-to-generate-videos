'use strict';
// ============================================================
// runtime.js · canvas, fonts, player and the render hooks render.mjs expects.
// A film calls:
//   film({ setup: async () => {...}, draw: (c, t, i) => {...}, voice: K => ({...}), kit: {...} })
// draw() receives the 2D context already scaled to world units (1080x1920) and continuous t (s).
// Quantize t yourself if the style animates on twos (collage, stop-motion) or on threes.
// Globals available to films: W, H, S (world->pixel scale), OUT_W, OUT_H, cv, mkCanvas, layer.
// ============================================================
const _qs = new URLSearchParams(location.search);
const OUT_W = +_qs.get('w') || 1080, S = OUT_W / W, OUT_H = Math.round(H * S);
document.head.insertAdjacentHTML('beforeend', `<style>
  body{margin:0;background:#15131c;color:#ddd;font:13px/1.4 ui-monospace,Menlo,monospace;display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px}
  canvas#c{width:min(46vw,420px);height:auto;background:#000;border-radius:6px;box-shadow:0 0 0 1px #333}
  .bar{display:flex;gap:8px;align-items:center} button{background:#222;color:#eee;border:1px solid #444;padding:6px 14px;cursor:pointer;font:inherit;border-radius:4px}
  input[type=range]{width:300px} body.bare{padding:0;background:#000} body.bare .bar{display:none} body.bare canvas#c{width:auto;border-radius:0;box-shadow:none}</style>`);
const cv = document.createElement('canvas'); cv.id = 'c'; cv.width = OUT_W; cv.height = OUT_H;
const ctx = cv.getContext('2d');
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// layer(draw): a full-frame offscreen canvas at output resolution, drawn in world units
function layer(draw, w = W, h = H) { const c = mkCanvas(Math.round(w * S), Math.round(h * S)), g = c.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); draw(g); return c; }

function film({ setup = null, draw, voice = null, kit = {} }) {
  const mount = () => {
    document.body.appendChild(cv);
    document.body.insertAdjacentHTML('beforeend', `<div class="bar"><button id="play">▶ play with sound</button><input id="scrub" type="range" min="0" value="0"><span id="tc">0.0s</span></div>`);
    if (_qs.has('bare')) document.body.classList.add('bare');
  };
  const frame = i => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, OUT_W, OUT_H); ctx.setTransform(S, 0, 0, S, 0, 0); ctx.save(); draw(ctx, i / FPS, i); ctx.restore(); };
  const sheet = (idx, cw) => {
    const ch = Math.round(cw * H / W), cols = Math.min(6, idx.length), rows = Math.ceil(idx.length / cols), g = mkCanvas(cols * cw, rows * ch), q = g.getContext('2d');
    idx.forEach((f, k) => { frame(f); const x = (k % cols) * cw, y = Math.floor(k / cols) * ch; q.drawImage(cv, x, y, cw, ch); q.fillStyle = '#000a'; q.fillRect(x, y, 58, 18); q.fillStyle = '#fff'; q.font = '12px monospace'; q.fillText((f / FPS).toFixed(2) + 's', x + 4, y + 13); });
    return g;
  };
  (async () => {
    mount();
    for (const f of EY_FONT_FACES) { const ff = new FontFace(f.family, `url(${f.dataUrl})`, f.family === 'Heebo' ? { weight: '100 900' } : {}); await ff.load(); document.fonts.add(ff); }
    if (setup) await setup();
    window.__NDRAW = NDRAW; window.__fps = FPS; window.__size = { w: OUT_W, h: OUT_H, W, H, S };
    window.__frame = i => { frame(i); return cv.toDataURL('image/png'); };
    window.__grid = (n = 24, cw = 240) => sheet(Array.from({ length: n }, (_, k) => Math.round(k * (NDRAW - 1) / (n - 1))), cw).toDataURL('image/jpeg', .9);
    window.__strip = (a, n = 12, cw = 240) => sheet(Array.from({ length: n }, (_, k) => a + k), cw).toDataURL('image/jpeg', .92);
    window.__wav = async () => { const oac = new OfflineAudioContext(2, Math.ceil(48000 * DUR), 48000); storyScore(oac, 0, oac.destination, voice, kit); return wavB64(await oac.startRendering()); };
    const scrub = document.getElementById('scrub'), tc = document.getElementById('tc'), btn = document.getElementById('play');
    scrub.max = NDRAW - 1; let ac = null, raf = 0;
    const stop = () => { if (ac) { ac.close(); ac = null; } cancelAnimationFrame(raf); btn.textContent = '▶ play with sound'; };
    scrub.oninput = () => { stop(); frame(+scrub.value); tc.textContent = (scrub.value / FPS).toFixed(2) + 's'; };
    btn.onclick = () => {
      if (ac) return stop();
      ac = new AudioContext(); const t0 = ac.currentTime + .15; storyScore(ac, t0, ac.destination, voice, kit); btn.textContent = '■ stop';
      const tick = () => { if (!ac) return; const f = Math.floor((ac.currentTime - t0) * FPS); if (f >= NDRAW) return stop(); if (f >= 0) { frame(f); scrub.value = f; tc.textContent = (f / FPS).toFixed(2) + 's'; } raf = requestAnimationFrame(tick); };
      tick();
    };
    frame(_qs.has('frame') ? +_qs.get('frame') : 0);
    window.__ready = true;
  })().catch(e => { window.__error = String(e && e.stack || e); console.error(e); });
}
