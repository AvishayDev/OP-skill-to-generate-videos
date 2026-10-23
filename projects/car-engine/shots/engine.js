'use strict';
// One engine cylinder in cutaway, shared by all four shots. theta = crank angle in degrees (0 = piston at top):
// 0-180 intake, 180-360 compression, 360-540 power, 540-720 exhaust. Each shot only decides how theta runs with t.
const CX = 540, BORE = 340, CEIL = 500, R = 85, L = 260, CRANK_Y = 915, PH = 70;
const STAGES = ['שאיבה', 'דחיסה', 'הצתה', 'פליטה'];
const N = 70;

function thetaFor(t) {
  const id = SHOT.id, d = SHOT.dur;
  if (id === 'hook') return 720 * eIO(prog(t, 0.3, d - 0.2));
  if (id === 'squeeze') {
    const a = cue('up');
    return t < a ? 180 * eIO(prog(t, 0.2, a)) : 180 + 180 * eIO(prog(t, a, d - 0.4));
  }
  if (id === 'bang') {
    const s = cue('spark');
    return 360 + 180 * eIn(prog(t, s + 0.12, d - 0.5)) ** 0.8;
  }
  const o = cue('out'), ag = cue('again');           // exhaust
  const ex = 540 + 180 * eIO(prog(t, o - 0.2, o + 1.8));
  return ex + 180 * eIO(prog(t, ag, d - 0.2));
}
const pistonPinY = th => { const a = th * Math.PI / 180; return CRANK_Y - (R * Math.cos(a) + Math.sqrt(L * L - (R * Math.sin(a)) ** 2)); };
const stageOf = th => Math.floor((((th % 720) + 720) % 720) / 180);
const smoothOpen = (th, a, b) => { const k = (th - a) / (b - a); return k <= 0 || k >= 1 ? 0 : Math.sin(k * Math.PI) ** 0.5; };

function line(c, x1, y1, x2, y2, w = 6, col = PAL.ink) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }

function valve(c, x, open) {
  const y = CEIL + open * 30;
  line(c, x, 360, x, y, 10, PAL.ink);
  c.fillStyle = PAL.ink; c.beginPath(); c.moveTo(x - 38, y); c.lineTo(x + 38, y); c.lineTo(x + 12, y - 14); c.lineTo(x - 12, y - 14); c.closePath(); c.fill();
}

shotFilm({
  draw: (c, t) => {
    paper(c);
    const th = thetaFor(t), st = stageOf(th), tm = ((th % 720) + 720) % 720;
    const pin = pistonPinY(th), top = pin - 40;
    const left = CX - BORE / 2, right = CX + BORE / 2;

    // Title + four pips (the thread through every shot).
    const pipsK = SHOT.id === 'hook' ? p(t, 'four', 0.35) : 1;
    text(c, STAGES[st], CX, 190, { size: 150, weight: 900, color: st === 2 ? PAL.accent : PAL.ink });
    for (let i = 0; i < 4; i++) {
      const x = CX + (1.5 - i) * 120, on = i === st, k = eBack(clamp(pipsK * 1.2 - i * 0.12));
      c.save(); c.translate(x, 310); c.scale(Math.max(k, 0), Math.max(k, 0));
      c.fillStyle = on ? PAL.accent : 'rgba(0,0,0,0)'; c.strokeStyle = on ? PAL.accent : PAL.muted; c.lineWidth = 5;
      c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill(); c.stroke();
      text(c, String(i + 1), 0, 2, { size: 38, weight: 800, color: on ? PAL.accentInk : PAL.muted, face: 'Heebo' });
      c.restore();
    }

    c.save(); c.translate(CX, 330); c.scale(1.3, 1.3); c.translate(-CX, -330);
    // Chamber fill: air-fuel cloud, hot gas, exhaust.
    const kIn = clamp(tm / 180), kEx = clamp((tm - 540) / 180), kC = clamp((tm - 180) / 180), kP = clamp((tm - 360) / 180);
    const sparked = SHOT.id === 'bang' ? t > cue('spark') : (SHOT.id === 'hook' ? st >= 2 : true);
    const r = rng(11), PORT_IN = [CX - 100, CEIL - 70], PORT_EX = [CX + 100, CEIL - 70];
    for (let i = 0; i < N; i++) {
      const u = r(), v = r(), f = i / N;
      const hx = left + 14 + u * (BORE - 28), hy = CEIL + 14 + v * Math.max(4, top - CEIL - 28);
      let x = hx, y = hy, a = 1, col;
      if (st === 0) { const k = clamp((kIn - f * 0.85) * 5); a = k > 0 ? 1 : 0; x = lerp(PORT_IN[0], hx, eOut(k)); y = lerp(PORT_IN[1], hy, eOut(k)); col = PAL.blue; }
      else if (st === 1) col = `rgb(${Math.round(lerp(95, 255, kC))},${Math.round(lerp(184, 150, kC))},${Math.round(lerp(255, 60, kC))})`;
      else if (st === 2) col = sparked ? `rgb(255,${Math.round(lerp(210, 120, kP))},40)` : '#FF963C';
      else { const k = clamp((kEx - f * 0.85) * 5); a = 1 - k; x = lerp(hx, PORT_EX[0], eIn(k)); y = lerp(hy, PORT_EX[1], eIn(k)); col = '#9AA7BA'; }
      if (a <= 0) continue;
      const jx = Math.sin(onTwos(t) * 9 + i) * 4, jy = Math.cos(onTwos(t) * 11 + i * 2) * 4;
      c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x + jx, y + jy, 9, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    // Flash on ignition.
    if (SHOT.id === 'bang' || SHOT.id === 'hook') {
      const f = SHOT.id === 'bang' ? clamp(1 - (t - cue('spark')) / 0.9) * (t > cue('spark') ? 1 : 0) : (st === 2 ? clamp(1 - (tm - 360) / 60) : 0);
      if (f > 0) { const g = c.createRadialGradient(CX, CEIL + 30, 0, CX, CEIL + 30, 260); g.addColorStop(0, 'rgba(255,230,150,0.95)'); g.addColorStop(1, 'rgba(255,122,26,0)'); c.globalAlpha = f; c.fillStyle = g; c.fillRect(left, CEIL, BORE, 300); c.globalAlpha = 1; }
    }

    // Cylinder block, head, ports.
    c.fillStyle = PAL.paper; c.globalAlpha = 0.55; c.fillRect(left - 40, CEIL - 140, 40, 330); c.fillRect(right, CEIL - 140, 40, 330); c.globalAlpha = 1;
    line(c, left, CEIL - 120, left, 790, 8); line(c, right, CEIL - 120, right, 790, 8);
    line(c, left - 40, CEIL - 140, right + 40, CEIL - 140, 8); line(c, left, CEIL, right, CEIL, 8);
    line(c, left - 40, CEIL - 140, left - 40, 790, 5, PAL.muted); line(c, right + 40, CEIL - 140, right + 40, 790, 5, PAL.muted);
    // Valves + spark plug.
    valve(c, CX - 100, smoothOpen(tm, 0, 180)); valve(c, CX + 100, smoothOpen(tm, 540, 720));
    c.fillStyle = PAL.ink; c.fillRect(CX - 14, CEIL - 120, 28, 110); line(c, CX, CEIL - 10, CX, CEIL + 14, 6);
    if (SHOT.id === 'bang') {
      const s = since(t, 'spark');
      if (s > 0 && s < 0.35 && Math.floor(s * 30) % 2 === 0) { c.strokeStyle = '#FFF2B0'; c.lineWidth = 9; c.lineJoin = 'round'; c.beginPath(); c.moveTo(CX, CEIL - 30); c.lineTo(CX - 26, CEIL + 24); c.lineTo(CX + 16, CEIL + 30); c.lineTo(CX - 10, CEIL + 90); c.stroke(); }
    }
    // Piston, rod, crank.
    const a = th * Math.PI / 180, cpx = CX + R * Math.sin(a), cpy = CRANK_Y - R * Math.cos(a);
    line(c, CX, pin, cpx, cpy, 16, PAL.muted);
    c.fillStyle = PAL.paper; c.strokeStyle = PAL.ink; c.lineWidth = 7; c.fillRect(left + 4, top, BORE - 8, PH); c.strokeRect(left + 4, top, BORE - 8, PH);
    for (const dy of [14, 28]) line(c, left + 4, top + dy, right - 4, top + dy, 4, PAL.muted);
    c.fillStyle = PAL.ink; c.beginPath(); c.arc(CX, pin, 11, 0, TAU); c.fill();
    c.strokeStyle = PAL.ink; c.lineWidth = 7; c.beginPath(); c.arc(CX, CRANK_Y, R, 0, TAU); c.stroke();
    c.fillStyle = PAL.accent; c.beginPath(); c.arc(cpx, cpy, 17, 0, TAU); c.fill();
    c.fillStyle = PAL.ink; c.beginPath(); c.arc(CX, CRANK_Y, 14, 0, TAU); c.fill();

    // Drive shaft to a wheel; the wheel lights on its word.
    const wx = 860, wy = CRANK_Y, wk = SHOT.id === 'bang' ? p(t, 'wheels', 0.4) : 0;
    line(c, CX + R, CRANK_Y, wx - 80, wy, 10, wk > 0 ? PAL.accent : PAL.muted);
    c.save(); c.translate(wx, wy); c.rotate(a); c.strokeStyle = wk > 0 ? PAL.accent : PAL.muted; c.lineWidth = 12; c.beginPath(); c.arc(0, 0, 72, 0, TAU); c.stroke();
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 4); line(c, -60, 0, 60, 0, 6, c.strokeStyle); }
    c.restore();
    if (wk > 0) text(c, 'גלגלים', wx, wy + 120, { size: 52, weight: 800, color: PAL.accent, alpha: wk });

    c.restore();

    // Words that land on their cue (screen space, beside the engine).
    if (SHOT.id === 'squeeze') {
      const k = p(t, 'suck', 0.35); if (k > 0) text(c, 'אוויר + דלק', 150, 600, { size: 44, weight: 800, color: PAL.blue, alpha: k });
    }
    if (SHOT.id === 'exhaust') {
      const k = p(t, 'out', 0.35) * (1 - p(t, 'again', 0.3)); if (k > 0) text(c, 'גזי פליטה', 930, 600, { size: 54, weight: 800, color: '#9AA7BA', alpha: k });
    }
  },
});
