'use strict';
// ============================================================
// audio.js · WebAudio toolkit + the shared score for the style pack. No samples, no libraries.
// storyScore(ac, t0, dest, makeVoice) plays CHORDS + CUES from story.js.
// A style re-voices the film by passing makeVoice(K) => { groove, cues: {type: fn}, motif, setup }.
// Anything it leaves out falls back to the default "cute paper" voice below.
// Works in AudioContext (live player) and OfflineAudioContext (render), t0 = start offset.
// ============================================================
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const _NN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const nm = s => 12 * (+s.slice(-1) + 1) + _NN[s[0]] + (s[1] === '#' ? 1 : s[1] === 'b' ? -1 : 0);
const CHORD_NOTES = { C: [48, [60, 64, 67]], F: [41, [60, 65, 69]], G: [43, [59, 62, 67]], Am: [45, [60, 64, 69]], Dm: [38, [62, 65, 69]], Em: [40, [59, 64, 67]] };

function audioKit(ac, t0, dest, o = {}) {
  const { reverb = .28, musicGain = .55, sfxGain = .8, revSec = 1.6 } = o;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3.5; comp.attack.value = .004; comp.release.value = .2; comp.connect(dest);
  const master = ac.createGain(); master.gain.value = .9; master.connect(comp);
  const rv = ac.createConvolver(), ir = ac.createBuffer(2, Math.ceil(ac.sampleRate * revSec), ac.sampleRate), rr = rng(3);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let k = 0; k < d.length; k++) d[k] = (rr() * 2 - 1) * Math.pow(1 - k / d.length, 3); }
  rv.buffer = ir; const rvG = ac.createGain(); rvG.gain.value = reverb; rv.connect(rvG); rvG.connect(master);
  const music = ac.createGain(); music.gain.value = musicGain; music.connect(master); music.connect(rv);
  const sfx = ac.createGain(); sfx.gain.value = sfxGain; sfx.connect(master);
  const sfxW = ac.createGain(); sfxW.gain.value = .35; sfxW.connect(rv); sfx.connect(sfxW);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0), nr = rng(9); for (let k = 0; k < nd.length; k++) nd[k] = nr() * 2 - 1;
  const at = t => t0 + t;
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, at(t)); g.gain.linearRampToValueAtTime(peak, at(t + a)); g.gain.exponentialRampToValueAtTime(.0005, at(t + a + d)); };
  // osc(type, freq, t, dur, out, peak, attack, decay, lowpassHz) -> OscillatorNode (ramp its .frequency for slides)
  const osc = (type, f, t, dur, out = music, peak = .2, a = .005, d = null, filt = null) => {
    const n = ac.createOscillator(), g = ac.createGain(); n.type = type; n.frequency.setValueAtTime(f, at(t));
    env(g, t, a, peak, d ?? dur); let src = n; if (filt) { const bq = ac.createBiquadFilter(); bq.type = 'lowpass'; bq.frequency.value = filt; n.connect(bq); src = bq; }
    src.connect(g); g.connect(out); n.start(at(t)); n.stop(at(t + a + (d ?? dur) + .05)); return n;
  };
  // noise(t, dur, out, peak, filterType, freq, Q, attack) -> BiquadFilterNode
  const noise = (t, dur, out = sfx, peak = .1, type = 'lowpass', f = 1000, q = 1, a = .003) => {
    const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const bq = ac.createBiquadFilter(); bq.type = type; bq.frequency.value = f; bq.Q.value = q;
    const g = ac.createGain(); env(g, t, a, peak, dur); s.connect(bq); bq.connect(g); g.connect(out); s.start(at(t)); s.stop(at(t + a + dur + .05)); return bq;
  };
  const K = { ac, t0, at, mf, nm, env, osc, noise, music, sfx, master, rev: rv };
  // --- instruments ---
  K.glock = (t, m, v = .12, d = 1.2, out = music) => { osc('sine', mf(m), t, d, out, v); osc('sine', mf(m) * 2.76, t, d * .25, out, v * .25); osc('triangle', mf(m) * 2, t, d * .12, out, v * .08); };
  K.pluck = (t, m, v = .06, bright = 2600) => { osc('triangle', mf(m), t, .45, music, v, .003, .45, bright); osc('sawtooth', mf(m), t, .18, music, v * .25, .003, .18, bright * .7); };
  K.strum = (t, notes, v = .055, up = 12) => notes.forEach((m, j) => K.pluck(t + j * .014, m + up, v));
  K.bass = (t, m, v = .22, d = .35) => { osc('sine', mf(m), t, d, music, v); osc('triangle', mf(m), t, d * .6, music, v * .35, .004, d * .6, 900); };
  K.kick = (t, v = .3, out = music) => { const o2 = osc('sine', 130, t, .16, out, v); o2.frequency.exponentialRampToValueAtTime(45, at(t + .14)); };
  K.hat = (t, v = .03, out = music) => noise(t, .045, out, v, 'highpass', 6500);
  K.clap = (t, v = .06) => { noise(t, .09, music, v, 'bandpass', 1600, 1.2); noise(t + .012, .07, music, v * .7, 'bandpass', 1900, 1.2); };
  K.pad = (t, dur, notes, v = .025, type = 'triangle', lp = 1400) => notes.forEach(m => { const n = ac.createOscillator(), g = ac.createGain(), bq = ac.createBiquadFilter(); n.type = type; n.frequency.value = mf(m); bq.type = 'lowpass'; bq.frequency.value = lp;
    g.gain.setValueAtTime(0, at(t)); g.gain.linearRampToValueAtTime(v, at(t + Math.min(.4, dur / 3))); g.gain.setValueAtTime(v, at(t + dur - .2)); g.gain.linearRampToValueAtTime(0, at(t + dur + .2)); n.connect(bq); bq.connect(g); g.connect(music); n.start(at(t)); n.stop(at(t + dur + .3)); });
  // --- sfx ---
  K.boing = (t, f0, f1, d = .35, v = .16, type = 'sine') => { const o2 = osc(type, f0, t, d, sfx, v, .004); o2.frequency.exponentialRampToValueAtTime(f1, at(t + d * .7));
    const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 22; lg.gain.value = f1 * .05; l.connect(lg); lg.connect(o2.frequency); l.start(at(t)); l.stop(at(t + d + .1)); };
  K.slide = (t, f0, f1, d, v = .09, type = 'sine') => { const o2 = osc(type, f0, t, d, sfx, v, .03, d); o2.frequency.exponentialRampToValueAtTime(f1, at(t + d)); };
  K.splat = (t, v = .5) => { noise(t, .28, sfx, v, 'lowpass', 900, .8); const o2 = osc('sine', 160, t, .2, sfx, v * .7); o2.frequency.exponentialRampToValueAtTime(50, at(t + .18)); noise(t + .02, .12, sfx, v * .25, 'bandpass', 2400, 2); };
  K.thud = (t, v = .7) => { const o2 = osc('sine', 110, t, .45, sfx, v); o2.frequency.exponentialRampToValueAtTime(34, at(t + .4)); noise(t, .3, sfx, v * .5, 'lowpass', 420, .7); noise(t, .06, sfx, v * .2, 'bandpass', 3000, 1); };
  K.pop = (t, v = .08) => { const o2 = osc('sine', 520, t, .07, sfx, v, .002); o2.frequency.exponentialRampToValueAtTime(1100, at(t + .05)); };
  K.swish = (t, d = .4, v = .12) => { const f = noise(t, d, sfx, v, 'bandpass', 600, 1.4, d * .5); f.frequency.exponentialRampToValueAtTime(4200, at(t + d)); };
  K.tweet = t => { for (let k = 0; k < 3; k++) { const o2 = osc('sine', 2400, t + k * .13, .08, sfx, .03, .005); o2.frequency.exponentialRampToValueAtTime(3400, at(t + k * .13 + .06)); } };
  K.sparkle = (t, base = 84, n = 7, step = .05, v = .06) => { for (let k = 0; k < n; k++) K.glock(t + k * step, base + [0, 4, 7, 12, 16, 19, 24, 28][k % 8], v, .9, sfx); };
  // comic duck: music trips at each splat
  K.duck = (times, low = .08, base = musicGain) => { music.gain.setValueAtTime(base, t0); for (const te of times) { music.gain.setValueAtTime(base, at(te - .01)); music.gain.linearRampToValueAtTime(low, at(te + .03)); music.gain.setValueAtTime(low, at(te + .35)); music.gain.linearRampToValueAtTime(base, at(te + .8)); } };
  return K;
}

// The default voice: ukulele + glockenspiel + soft kit, cartoon sfx.
function defaultVoice(K) {
  return {
    groove(a, b, root, tri, name) {
      for (let t = a, beat = 0; t < b - .01; t += .5, beat++) {
        if (beat % 2 === 0) { K.bass(t, root); K.kick(t, .24); } else K.bass(t, root + 7, .15, .25);
        K.strum(t + .25, tri, .055); K.hat(t + .25); K.hat(t + .375, .015);
      }
    },
    motif(t) { [[0, 'E5'], [.25, 'G5'], [.5, 'C6'], [1.0, 'B5'], [1.25, 'G5'], [1.5, 'C6']].forEach(([d, n]) => K.glock(t + d, nm(n), .08, 1.2)); },
    ending(t) { K.pad(t, 1.5, [60, 64, 67, 72], .03); K.strum(t, [48, 55, 60, 64], .07, 12); K.glock(t, nm('C6'), .08, 1.8); },
    cues: {
      reveal: t => K.swish(t, .45, .14),
      star: t => { K.slide(t, 2400, 900, .45, .04); K.glock(t + .45, 96, .05, 1); },
      pop: t => K.pop(t, .12),
      jump: (t, n) => K.boing(t, 200, n ? 760 : 620, .42, .14),
      fall: (t, n) => K.slide(t, n ? 1700 : 1400, 260, .25, .07),
      splat: t => K.splat(t, .55),
      dizzy: t => K.tweet(t),
      getup: t => K.boing(t, 260, 520, .28, .1),
      drop: t => K.slide(t, 1900, 500, .25, .05),
      thud: (t, n) => K.thud(t, .6 + n * .1),
      idea: t => K.sparkle(t, 84, 6, .045, .06),
      hop: (t, n) => K.boing(t, 300 + n * 90, 640 + n * 180, .3, .13),
      land: t => K.kick(t, .2, K.sfx),
      leap: t => { K.slide(t, 500, 2400, .45, .08); K.boing(t, 260, 900, .45, .1); },
      grab: t => { K.noise(t, 1.4, K.sfx, .16, 'highpass', 5000, .5, .005); K.kick(t, .4, K.sfx); K.sparkle(t + .05, 84, 8, .06, .07); for (let k = 0; k < 8; k++) K.noise(t + .1 + k * .07, .05, K.sfx, .03, 'highpass', 7000); },
      title: t => K.swish(t, .35, .06),
    },
  };
}

function storyScore(ac, t0, dest, makeVoice = null, kitOpts = {}) {
  const K = audioKit(ac, t0, dest, kitOpts);
  const base = defaultVoice(K), v = makeVoice ? makeVoice(K) : {};
  const V = { ...base, ...v, cues: { ...base.cues, ...(v.cues || {}) } };
  if (V.setup) V.setup(K);
  if (V.duck !== false) K.duck(SPLATS);
  for (const [a, b, name] of CHORDS) {
    const [root, tri] = CHORD_NOTES[name];
    if (a >= LEAP.t1 && V.ending) { V.ending(a, root, tri, name); continue; }
    V.groove(a, b, root, tri, name);
  }
  V.motif(.35); V.motif(LEAP.t1 + .05);
  for (const c of CUES) { const f = V.cues[c.type]; if (f) f(c.t, c.n || 0); }
}

// 16-bit stereo WAV as base64 (render.mjs reads window.__wav)
function wavB64(buf) {
  const n = buf.length, sr = buf.sampleRate, ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab);
  const ws = (o, s) => { for (let k = 0; k < s.length; k++) v.setUint8(o + k, s.charCodeAt(k)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 4, true);
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let k = 0, o = 44; k < n; k++, o += 4) { v.setInt16(o, clamp(L[k], -1, 1) * 32767, true); v.setInt16(o + 2, clamp(R[k], -1, 1) * 32767, true); }
  const u = new Uint8Array(ab); let b = ''; for (let k = 0; k < u.length; k += 32768) b += String.fromCharCode.apply(null, u.subarray(k, k + 32768)); return btoa(b);
}
