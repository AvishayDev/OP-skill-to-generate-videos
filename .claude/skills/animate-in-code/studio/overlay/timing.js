'use strict';
// timing.js · story-free replacement for ../story.js in the overlay demos.
// Set `var FILM_DUR = 9.5;` in the page BEFORE this script to change the length (default 8 s).
const W = 1080, H = 1920, FPS = 24;
const DUR = (typeof FILM_DUR !== 'undefined') ? FILM_DUR : 8, NDRAW = Math.round(DUR * FPS);
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const eOut = k => 1 - (1 - k) * (1 - k), eIn = k => k * k, eIO = k => k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
const eBack = k => { const s = 1.9; k -= 1; return 1 + k * k * ((s + 1) * k + s); };
const prog = (t, a, b) => clamp((t - a) / (b - a));
function rng(s) { s = (s * 2654435761) >>> 0 || 1; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// audio.js' storyScore() reads these; the overlay films pass their own score() instead, so they stay empty.
const SPLATS = [], CUES = [], CHORDS = [], LEAP = { t0: 99, t1: 99 };
