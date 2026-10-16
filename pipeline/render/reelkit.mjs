// Reelkit (HyperFrames) — combines and renders a project locally.
//
// Every shot of the film is drawn in code (no stock footage): a shot is either a React component written
// with the reelkit skill (projects/<name>/shots/<Name>.tsx, built from the shared components in
// pipeline/render/reelkit/) or a Canvas 2D film written with the animate-in-code skill, rendered to a clip
// by pipeline/render/canvas.mjs. This module builds the Reelkit project in projects/<name>/reelkit/:
//
//   assets/   hard links to the prepared media (canvas clips, images, voice, music, sfx, overlays)
//   plan.json a voiceless plan (our own voice is a plain audio track) whose scenes are ≤ 15 s
//             chunks of the shot list — Reelkit's scene limit
//   src/      Video.tsx (this episode's data baked in) + the shared components + the episode's shots
//
// then `reelkit check` → `reelkit lint --no-video` → `reelkit render` → `reelkit export` locally.
// A film longer than one Reelkit project allows (16 scenes × 15 s = 4 min) is cut into parts at scene
// boundaries — reelkit-p1/, reelkit-p2/, … each with its own slice of the voice and music — rendered one
// after the other and joined with ffmpeg.
// No uploads, no hosting, no render credits.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, linkSync, rmSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ROOT, config, language, readJson, readJsonIfExists, writeJson, round } from '../lib.mjs';
import { readOverlays, validateOverlays, IMAGE_TYPES } from '../assets/overlays.mjs';
import { captionOptions, resolveShots } from '../video/slots.mjs';
import { readShots } from '../assets/images.mjs';
import { renderCanvasShots } from './canvas.mjs';
import { sfxFor } from '../assets/audio.mjs';
import { placeOverlays, resolveOverlayConflicts, overlayConflicts } from '../video/timeline.mjs';
import { segmentWords } from '../audio/align.mjs';

const TEMPLATES = join(ROOT, 'pipeline/render/reelkit');
export const MAX_SCENE_SECONDS = 15; // Reelkit's plan schema: a voiceless scene lasts 0.3–15 s
const MAX_SCENES = 16;

export const reelkitSettings = () => {
  const r = config.video().reelkit ?? {};
  return {
    version: r.version ?? '0.19.1',
    exportPreset: r.exportPreset ?? 'iphone',
    previewPreset: r.previewPreset ?? 'chat',
  };
};

export const projectDir = (ep, part = 0) => join(ep.dir, part ? `reelkit-p${part}` : 'reelkit');

// The kit's font names (reelkit/kit → font("…")), read from the installed reelkit-cli.
let kitFontCache = null;
export function kitFonts() {
  if (kitFontCache) return kitFontCache;
  try {
    const root = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    const src = readFileSync(join(root, 'reelkit-cli/src/hyperframes/kit/theme.ts'), 'utf8');
    const body = src.slice(src.indexOf('const loaders = {'), src.indexOf('export type KitFont'));
    kitFontCache = new Set([...body.matchAll(/^\s+([a-zA-Z]+): \(\) =>/gm)].map((m) => m[1]));
  } catch { kitFontCache = new Set(['heebo', 'rubik', 'montserrat', 'bebasNeue', 'roboto']); }
  return kitFontCache;
}

// ---------- the reelkit binary ----------

// Reelkit downloads its own Chrome headless shell (~150 MB, once, from storage.googleapis.com)
// on the first render. Playwright's preinstalled Chromium can't be used: it has no H.264
// decoder, so every stock clip fails to load. Nothing is shared with the Reelkit library.
export function reelkitEnv() {
  return { ...process.env, REELKIT_NO_SHARE: '1', REELKIT_NO_UPDATE_CHECK: '1', REELKIT_NO_AUTO_INSTALL: '1' };
}

export function reelkitVersion() {
  try { return execFileSync('reelkit', ['--version'], { encoding: 'utf8', env: reelkitEnv(), stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; }
}

// Installed by the SessionStart hook; installed on demand otherwise (npm registry).
export function ensureReelkit() {
  const want = reelkitSettings().version;
  const have = reelkitVersion();
  if (have === want) return have;
  console.log(`Installing reelkit-cli@${want}${have ? ` (found ${have})` : ''}…`);
  execFileSync('npm', ['install', '-g', `reelkit-cli@${want}`], { stdio: 'inherit', timeout: 600_000 });
  return reelkitVersion();
}

function reelkit(dir, args, { capture = false } = {}) {
  const res = spawnSync('reelkit', args, { cwd: dir, env: reelkitEnv(), encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', maxBuffer: 64 << 20 });
  if (res.error) throw new Error(`reelkit ${args[0]}: ${res.error.message}`);
  if (res.status !== 0) {
    const out = capture ? `\n${(res.stdout ?? '').slice(-3000)}${(res.stderr ?? '').slice(-3000)}` : '';
    throw new Error(`reelkit ${args.join(' ')} failed (exit ${res.status})${out}`);
  }
  return res.stdout ?? '';
}

// ---------- timeline math (pure, unit-tested) ----------

export const toFrame = (t, fps) => Math.round(t * fps);

// Splits the film into Reelkit scenes of at most `max` seconds. A scene starts at every
// story (segment) start and otherwise only on a shot cut, so a shot is never split unless it
// is longer than `max` on its own. Returns frame ranges [{ id, segment, from, frames }].
export function sceneChunks(shots, { fps, max = MAX_SCENE_SECONDS } = {}) {
  const maxF = Math.floor(max * fps);
  const cuts = shots.map((s) => ({ f: s.from, segment: s.segment }));
  const end = Math.max(...shots.map((s) => s.from + s.frames));
  const scenes = [];
  let start = 0;
  let segment = shots[0].segment;
  const push = (to) => { scenes.push({ segment, from: start, frames: to - start }); start = to; };
  for (let i = 1; i <= cuts.length; i++) {
    const cut = cuts[i] ?? { f: end, segment: null };
    // A cut that would make the scene too long: close it at the last cut that fits.
    while (cut.f - start > maxF) {
      const fits = cuts.filter((c) => c.f > start && c.f - start <= maxF && c.f < cut.f).at(-1);
      push(fits ? fits.f : start + maxF);
    }
    if (cut.segment !== segment || !cuts[i]) { if (cut.f > start) push(cut.f); segment = cut.segment; }
  }
  return scenes.map((s, i) => ({ id: `${s.segment ?? 'end'}-${i + 1}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'), ...s }));
}

// Script words with their spoken times, as the kit's <Captions> wants them:
// [{ word, startSec, endSec }]. Tags and *markup* never reach the screen; when a segment
// has `captionText` (e.g. an English name spelled out in the voice), its words take the
// spoken words' times proportionally — the same mapping the Shotstack captions use.
export function captionWords(script, timing) {
  const out = [];
  for (const seg of script.segments) {
    const spoken = (timing.words ?? []).filter((w) => w.seg === seg.id);
    if (!spoken.length) continue;
    const shown = segmentWords(seg.captionText ?? seg.text).map((w) => w.replace(/\*/g, '')).filter(Boolean);
    const n = shown.length;
    const at = (k) => spoken[n === spoken.length ? k : Math.min(spoken.length - 1, Math.round((k * spoken.length) / Math.max(1, n)))];
    shown.forEach((word, k) => {
      const a = at(k);
      const next = k + 1 < n ? at(k + 1) : null;
      const startSec = round(a.start, 3);
      const endSec = round(Math.max(a.start + 0.05, next && next !== a ? Math.min(a.end, next.start) : a.end), 3);
      out.push({ word, startSec, endSec });
    });
  }
  // Monotonic and non-overlapping, or the kit's grouping gets confused.
  for (let i = 1; i < out.length; i++) {
    if (out[i].startSec < out[i - 1].startSec) out[i].startSec = out[i - 1].startSec;
    if (out[i - 1].endSec > out[i].startSec) out[i - 1].endSec = Math.max(out[i - 1].startSec, out[i].startSec);
    if (out[i].endSec < out[i].startSec) out[i].endSec = out[i].startSec;
  }
  return out;
}

// A Shotstack-style zone offset ({ x, y } from the centre, y up) → the overlay's centre as
// fractions of the frame (y down), which is how the components place things.
export const zoneCenter = (zone) => ({ x: round(0.5 + zone.x, 4), y: round(0.5 - zone.y, 4) });

// "3.6 GW" → { prefix: "", value: 3.6, decimals: 1, suffix: " GW" } so the number can count up.
// Returns null for text that isn't a plain number (it is then shown as is).
export function parseStat(text) {
  const m = String(text).match(/^(\D*?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(.*)$/);
  if (!m) return null;
  const grouped = m[2].includes(',');
  const value = Number(`${m[2].replace(/,/g, '')}${m[3] ? `.${m[3]}` : ''}`);
  return { prefix: m[1], value, decimals: m[3]?.length ?? 0, grouped, suffix: m[4] };
}

// ---------- the episode → Reelkit data ----------

const ext = (file) => extname(file).toLowerCase() || '.bin';

// Caption groups, a few words at a time, the way the kit's "phrase" captions group them: at most
// `maxWords` words and `maxChars` characters, ending at a sentence end, at a comma once the group
// has 2+ words, or at a pause. Frames are on the film's grid; a group stays until the next one starts
// (or `hold` frames after its last word, in a long silence).
export function captionGroups(words, { fps, maxWords = 3, maxChars = 24, pause = 0.35, hold = 0.6 } = {}) {
  const groups = [];
  let cur = [];
  const close = () => { if (cur.length) groups.push(cur); cur = []; };
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const chars = cur.reduce((n, x) => n + x.word.length + 1, 0);
    const end = /[.!?…]$/.test(w.word);
    const comma = /[,;:–—]$/.test(w.word) && cur.length >= 2;
    const gap = next ? next.startSec - w.endSec : Infinity;
    const full = cur.length >= maxWords || (next && chars + next.word.length > maxChars);
    if (!next || end || comma || gap > pause || full) close();
  });
  const f = (t) => Math.round(t * fps);
  return groups.map((g, i) => {
    const next = groups[i + 1];
    const from = f(g[0].startSec);
    const to = Math.max(from + 1, next ? Math.min(f(next[0].startSec), f(g.at(-1).endSec + hold)) : f(g.at(-1).endSec + hold));
    return { from, to, words: g.map((w) => ({ w: w.word.replace(/[.,;:!?…]+$/, '').replace(/^["“”]+|["“”]+$/g, '') || w.word, f: f(w.startSec) })) };
  });
}

// Loudness of the voice per film frame, 0..1 (RMS, normalised to the loud end of the take) — drives
// the VoiceLine motif. Reads 8 kHz mono PCM from ffmpeg; no files written.
export function voiceLevels(file, { fps, frames }) {
  const rate = 8000;
  const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(rate), '-f', 's16le', '-'], { maxBuffer: 256 << 20 });
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const per = rate / fps;
  const rms = Array.from({ length: frames }, (_, i) => {
    let sum = 0; let n = 0;
    for (let j = Math.floor(i * per); j < Math.min(samples.length, Math.floor((i + 1) * per)); j++) { sum += samples[j] * samples[j]; n++; }
    return n ? Math.sqrt(sum / n) / 32768 : 0;
  });
  const sorted = [...rms].sort((a, b) => a - b);
  const ref = sorted[Math.floor(sorted.length * 0.95)] || 1;
  // A little attack/release smoothing so the line breathes instead of flickering.
  let prev = 0;
  return rms.map((v) => { const x = Math.min(1, v / ref); prev = x > prev ? prev + (x - prev) * 0.6 : prev + (x - prev) * 0.25; return round(prev, 2); });
}

const COMPONENT = /^[A-Z][A-Za-z0-9]*$/;
export const libraryComponents = () => readdirSync(TEMPLATES).filter((f) => f.endsWith('.tsx')).map((f) => f.slice(0, -4));

// Everything Video.tsx needs, in frames, with media as project paths (assets/…).
// `files` maps each project path to the local file it links to.
export function buildEpisodeData({ brand, video, script, plan, timing, assets, overlays, concept, levels }) {
  const fps = brand.fps;
  const files = {};
  const add = (path, file) => { files[path] = file; return path; };
  const pal = concept.palette ?? {};
  const palette = {
    bg: pal.bg ?? brand.colors.background, ink: pal.ink ?? brand.colors.primary, accent: pal.accent ?? brand.colors.accent,
    muted: pal.muted ?? '#8a877c', paper: pal.paper ?? '#ffffff', ...pal,
  };
  palette.accentInk ??= palette.ink;

  const images = {};
  for (const [id, a] of Object.entries(assets.elements ?? {})) {
    if (!(plan.images ?? []).some((i) => i.id === id)) continue;
    images[id] = { src: add(`assets/elements/${id}${ext(a.file)}`, a.file), w: a.w, h: a.h };
  }

  const resolved = resolveShots(plan, { script, timing, fps });
  const shots = resolved.map((s) => {
    for (const id of s.images ?? []) if (!images[id]) throw new Error(`shot ${s.id}: image "${id}" is not prepared — list it in shots.json → images and run "elements"`);
    const base = {
      id: s.id, from: s.from, frames: s.frames, images: s.images ?? [], motif: s.motif !== false,
      cue: Object.fromEntries(Object.entries(s.cues).map(([k, c]) => [k, c.f])),
      words: s.words.map(({ word, f, end }) => ({ word, f, end: Math.round(end * fps) })),
    };
    if (s.skill === 'canvas') {
      const a = assets.canvas?.[s.id];
      if (!a?.file || !existsSync(a.file)) throw new Error(`canvas shot ${s.id} is not rendered — run "canvas" first`);
      if (a.frames !== s.frames) throw new Error(`canvas shot ${s.id} was rendered for ${a.frames} frames, the slot now has ${s.frames} — run "canvas" again`);
      return { ...base, kind: 'clip', src: add(`assets/shots/${s.id}.mp4`, a.file) };
    }
    if (s.skill === 'footage' || s.skill === 'clip') {
      const a = assets.clips?.[s.id];
      if (!a?.file || !existsSync(a.file)) throw new Error(`${s.skill} shot ${s.id} is not prepared — run "clips" first`);
      if (a.frames !== s.frames) throw new Error(`${s.skill} shot ${s.id} was conformed for ${a.frames} frames, the slot now has ${s.frames} — run "clips" again`);
      return { ...base, kind: 'clip', src: add(`assets/shots/${s.id}.mp4`, a.file) };
    }
    if (s.skill !== 'reelkit') throw new Error(`shot ${s.id}: "skill" must be "reelkit", "canvas", "footage" or "clip"`);
    if (!COMPONENT.test(s.component ?? '')) throw new Error(`shot ${s.id}: "component" must be a PascalCase component name (episodes/<date>/shots/<Name>.tsx)`);
    return { ...base, kind: 'component', component: s.component };
  });
  const totalFrames = shots.at(-1).from + shots.at(-1).frames;

  // Reelkit's plan wants scenes of ≤ 15 s: the shot list cut at story changes and between shots.
  const scenes = sceneChunks(shots.map((s) => ({ ...s, segment: resolved.find((r) => r.id === s.id).segment })), { fps });

  // Overlays (optional): same placement, zones, lengths and conflict fixes as before.
  const ov = video.overlays;
  const captionOpts = { ...captionOptions(), pauses: timing.pauses, words: timing.words };
  let placed = [];
  if (ov?.enabled && overlays.overlays?.length) {
    validateOverlays(overlays, script);
    placed = placeOverlays(overlays, script, timing, ov, captionOpts);
    for (const n of resolveOverlayConflicts(placed, ov)) console.log(`overlay fix: ${n}`);
    for (const c of overlayConflicts(placed, ov.minGapSeconds)) console.warn(`⚠ ${c} — move one to another zone or anchor`);
  }
  const overlayData = placed.map((p) => {
    const o = p.o;
    const from = toFrame(p.start, fps);
    const base = { id: o.id, type: o.type, from, frames: Math.max(1, Math.min(totalFrames - from, toFrame(p.length, fps))), in: p.transition.in, out: p.transition.out, ...zoneCenter(ov.zones[p.zone]) };
    if (IMAGE_TYPES.has(o.type)) {
      const a = assets.overlays?.[o.id];
      if (!a?.file) throw new Error(`Overlay ${o.id} is not prepared — run "overlays" first`);
      return { ...base, src: add(`assets/overlays/${o.id}${ext(a.file)}`, a.file), w: a.width, h: a.height };
    }
    if (o.type === 'stat') return { ...base, focus: true, text: o.text, count: parseStat(o.text), label: o.label ?? null, size: ov.stat.fontSize, labelSize: ov.stat.labelFontSize };
    return { ...base, focus: true, text: o.text, subtitle: o.subtitle ?? null, size: ov.title.fontSize, labelSize: ov.title.subtitleFontSize ?? ov.stat.labelFontSize };
  });

  // Sound: our voice, our (already faded + levelled) music, a hit per popping overlay and per cue with `sfx`.
  if (!timing.voiceFile || !existsSync(timing.voiceFile)) throw new Error('No voice track — run "voice" first (it writes a silent track for a film without a narrator)');
  const voice = add(`assets/voice${ext(timing.voiceFile)}`, timing.voiceFile);
  const music = assets.musicFile && existsSync(assets.musicFile) ? add(`assets/music${ext(assets.musicFile)}`, assets.musicFile) : null;
  const sfx = [];
  const hit = (name, at, volume, who) => {
    const s = assets.sfx?.[name];
    if (!s?.file) { console.warn(`⚠ ${who}: sound effect "${name}" not prepared (audio.json → "audio") — silent`); return; }
    sfx.push({ src: add(`assets/sfx/${name}${ext(s.file)}`, s.file), at: Math.max(0, at), frames: Math.max(1, toFrame(s.duration, fps)), volume: volume ?? video.sfx.volume });
  };
  for (const p of placed) {
    const name = sfxFor(p.o, video.sfx);
    if (name) hit(name, toFrame(Math.max(0, p.start + (p.o.sfxOffset ?? video.sfx.offsetSeconds ?? 0)), fps), p.o.sfxVolume, `overlay ${p.o.id}`);
  }
  if (video.sfx.enabled) {
    for (const s of resolved) for (const [name, c] of Object.entries(s.cues)) if (c.sfx) hit(c.sfx, s.from + c.f, c.volume, `shot ${s.id} cue ${name}`);
  }

  // Captions in the concept's colours, grouped from the real word times.
  const cap = { maxWords: 3, bottom: 0.2, size: 64, ...(video.reelkit?.captions ?? {}), ...(concept.captions ?? {}) };
  const captions = video.captions.enabled ? {
    groups: captionGroups(captionWords(script, timing), { fps, maxWords: cap.maxWords }),
    size: cap.size, bottom: cap.bottom, ink: cap.ink ?? palette.ink, chip: cap.chip ?? palette.accent, chipInk: cap.chipInk ?? palette.accentInk,
    plate: cap.plate ?? null, halo: cap.halo ?? null,
  } : null;

  // The motif runs through the film except during shots that switch it off (`"motif": false`).
  const m = { type: 'voiceline', y: 0.69, amp: 70, ...(concept.motif ?? {}) };
  const spans = [];
  let open = null;
  for (const s of shots) {
    if (s.motif && open === null) open = s.from;
    if (!s.motif && open !== null) { spans.push({ from: open, to: s.from }); open = null; }
  }
  if (open !== null) spans.push({ from: open, to: totalFrames });
  const motif = {
    type: m.type, y: m.y, amp: m.amp, color: palette[m.color] ?? m.color ?? palette.accent, outline: palette[m.outline] ?? m.outline ?? palette.ink,
    levels: m.type === 'voiceline' ? (levels ?? new Array(totalFrames).fill(0)) : [], spans: m.type === 'voiceline' ? spans : [],
  };

  const ground = { grain: 0.06, pattern: 'none', patternColor: 'rgba(0,0,0,0.07)', ...(concept.ground ?? {}) };

  // Faces: a kit font name, or a Google Fonts family the `fonts` step downloaded (assets.fonts).
  const fontName = (f) => (typeof f === 'object' && f ? f.google : f);
  const faces = { display: fontName(concept.font) ?? fontName(language(brand.language ?? 'en').font) ?? 'heebo' };
  faces.body = fontName(concept.bodyFont) ?? faces.display;
  const customFonts = [];
  for (const fam of new Set([faces.display, faces.body])) {
    const a = assets.fonts?.[fam];
    if (a?.files?.length) for (const x of a.files) customFonts.push({ family: fam, weight: String(x.weight), src: add(`assets/fonts/${fam.replace(/[^A-Za-z0-9]+/g, '-')}-${x.weight}${ext(x.file)}`, x.file) });
    else if (!kitFonts().has(fam)) throw new Error(`font "${fam}" is neither a kit font nor downloaded — run "fonts" (it fetches Google Fonts families)`);
  }
  return {
    data: {
      fps, width: brand.width, height: brand.height, totalFrames, palette,
      faces, customFonts,
      ground, motif, shots, images, overlays: overlayData, captions,
      audio: { voice, music, musicVolume: video.music.volume, sfx },
      look: { focusBlur: video.reelkit?.focus?.blur ?? 14, focusDim: video.reelkit?.focus?.dim ?? 0.55 },
    },
    files,
    scenes,
    plan: {
      title: script.title || brand.title || 'Video',
      aspect: brand.aspect ?? '9:16',
      mode: 'motion',
      voice: 'none',
      captions: video.captions.enabled ? 'phrase' : 'none', // drawn by Video.tsx from our Whisper word timings
      pace: 'normal',
      gap: 'normal',
      scenes: scenes.map((s, i) => ({
        id: s.id,
        narration: '',
        seconds: round(s.frames / fps, 4),
        treatment: 'motion-graphic',
        onScreenText: [],
        imagePrompt: null,
        clipPrompt: null,
        shareable: false,
        imageTags: [],
        userAssetIds: [],
        notes: i === 0
          ? `Video Studio film, concept "${concept.name ?? 'untitled'}": ${concept.look ?? ''} Shots are drawn in code (reelkit components, animate-in-code canvas clips) or are prepared clips (footage, Manim, HyperFrames, Remotion…) on the concept's ground; elements land on the words that name them; Whisper-timed captions, our own voice, Freesound music + SFX.`.replace(/\s+/g, ' ')
          : `${s.segment}: shots ${shots.filter((x) => x.from < s.from + s.frames && x.from + x.frames > s.from).map((x) => x.id).join(', ')}`,
      })),
    },
  };
}

// ASSET_SOURCES.md: every file in the project that we did not make (Reelkit's rights rule).
function assetSources({ plan, overlays, audio }) {
  const rows = [];
  for (const i of plan.images ?? []) rows.push([`elements/${i.id}`, i.source?.type ?? '', i.page ?? i.source?.url ?? i.source?.path ?? '', i.license ?? '', i.credit ?? '']);
  for (const o of overlays.overlays ?? []) if (IMAGE_TYPES.has(o.type)) rows.push([`overlays/${o.id}`, o.source?.type ?? '', o.page ?? o.source?.url ?? '', o.license ?? '', o.credit ?? '']);
  if (audio?.music) rows.push(['music', 'freesound', audio.music.page ?? audio.music.source?.url ?? '', audio.music.license ?? '', audio.music.credit ?? '']);
  for (const [name, s] of Object.entries(audio?.sfx ?? {})) rows.push([`sfx/${name}`, 'freesound', s.page ?? s.source?.url ?? '', s.license ?? '', s.credit ?? '']);
  const esc = (v) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return `# Asset sources\n\nGenerated from shots.json, overlays.json and audio.json. Shots are drawn in code; the voiceover is our own (Gemini TTS).\n\n| file | source | page | licence | credit |\n|---|---|---|---|---|\n${rows.map((r) => `| ${r.map(esc).join(' | ')} |`).join('\n')}\n`;
}

// Hard link (same disk, no copy) or copy. Reelkit serves only regular files under assets/.
function linkInto(dest, src) {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) {
    const [a, b] = [statSync(dest), statSync(src)];
    if (a.ino === b.ino || (a.size === b.size && a.mtimeMs >= b.mtimeMs)) return;
    rmSync(dest);
  }
  try { linkSync(src, dest); } catch { copyFileSync(src, dest); }
}

// The episode's own shot components: episodes/<date>/shots/<Name>.tsx, each exporting `Name`.
// Checks names, that every cue a component reads exists on the shots that use it, and imports.
export function episodeComponents(ep, plan) {
  const dir = join(ep.dir, 'shots');
  const lib = new Set(libraryComponents());
  const used = new Set(plan.shots.filter((s) => s.skill === 'reelkit').map((s) => s.component));
  const out = {};
  for (const name of used) {
    const file = join(dir, `${name}.tsx`);
    if (!existsSync(file)) throw new Error(`component ${name}: ${file} not found`);
    if (lib.has(name)) throw new Error(`component ${name}: the name is taken by the shared library (pipeline/render/reelkit/${name}.tsx) — rename it`);
    const code = readFileSync(file, 'utf8');
    if (!new RegExp(`export const ${name}\\b`).test(code)) throw new Error(`component ${name}: ${file} must export const ${name}`);
    // Reelkit's rule: only Video.tsx may import sibling files; a shot gets the shared components as its `ui` prop.
    for (const m of code.matchAll(/from "([^"]+)"/g)) {
      if (!['react', 'reelkit/frame', 'reelkit/kit'].includes(m[1])) throw new Error(`component ${name}: imports "${m[1]}" — a shot may import only react, reelkit/frame and reelkit/kit (shared components arrive as the \`ui\` prop)`);
    }
    const reads = new Set([...code.matchAll(/\bcue(?:\.([A-Za-z_]\w*)|\[["']([^"']+)["']\])/g)].map((x) => x[1] ?? x[2]));
    for (const s of plan.shots.filter((x) => x.component === name)) {
      const missing = [...reads].filter((r) => !(r in (s.cues ?? {})));
      if (missing.length) throw new Error(`shot ${s.id}: component ${name} reads cue ${missing.map((x) => `"${x}"`).join(', ')} — add it to the shot's cues in shots.json`);
    }
    out[name] = code;
  }
  return out;
}

// ---------- long films: parts ----------

// Groups the film's scenes into parts of at most `maxScenes` scenes (Reelkit's project limit). Returns
// [{ from, to, scenes }] in film frames; a single part when the film fits.
export function partRanges(scenes, maxScenes = MAX_SCENES) {
  const parts = [];
  for (let i = 0; i < scenes.length; i += maxScenes) {
    const group = scenes.slice(i, i + maxScenes);
    parts.push({ from: group[0].from, to: group.at(-1).from + group.at(-1).frames, scenes: group });
  }
  return parts;
}

// The slice [from, to) of the film's data, rebased to start at frame 0. `audio` gives the part's own
// voice/music files (already trimmed to the slice).
export function sliceEpisodeData(data, { from, to }, audio) {
  const inside = (f) => f >= from && f < to;
  const len = to - from;
  const shots = data.shots.filter((s) => inside(s.from)).map((s) => ({ ...s, from: s.from - from, frames: Math.min(s.frames, to - s.from) }));
  const groups = (data.captions?.groups ?? []).filter((g) => inside(g.from)).map((g) => ({ ...g, from: g.from - from, to: Math.min(g.to, to) - from, words: g.words.map((w) => ({ ...w, f: w.f - from })) }));
  return {
    ...data,
    totalFrames: len,
    shots,
    overlays: data.overlays.filter((o) => inside(o.from)).map((o) => ({ ...o, from: o.from - from, frames: Math.min(o.frames, to - o.from) })),
    captions: data.captions ? { ...data.captions, groups } : null,
    motif: {
      ...data.motif,
      levels: data.motif.levels.slice(from, to),
      spans: data.motif.spans.filter((sp) => sp.to > from && sp.from < to).map((sp) => ({ from: Math.max(0, sp.from - from), to: Math.min(len, sp.to - from) })),
    },
    audio: { ...data.audio, ...audio, sfx: data.audio.sfx.filter((x) => inside(x.at)).map((x) => ({ ...x, at: x.at - from })) },
  };
}

function trimAudio(src, dest, startSec, lenSec) {
  mkdirSync(dirname(dest), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-t', String(lenSec), '-i', src, '-c:a', 'libmp3lame', '-b:a', '192k', dest]);
  return dest;
}

function writeProject(ep, dir, { data, files, plan: rkPlan, components, aspect, assetSourcesMd }) {
  if (!existsSync(join(dir, 'reelkit.json'))) {
    mkdirSync(dirname(dir), { recursive: true });
    const name = dir.split('/').pop();
    rmSync(dir, { recursive: true, force: true });
    reelkit(dirname(dir), ['init', name, '--aspect', aspect, '--private'], { capture: true });
  }
  // Fresh assets/ and src/ every time, so nothing stale from an earlier version renders.
  for (const sub of ['shots', 'overlays', 'sfx', 'elements', 'fonts']) rmSync(join(dir, 'assets', sub), { recursive: true, force: true });
  for (const f of readdirSync(join(dir, 'assets'))) if (/^(voice|music)\./.test(f)) rmSync(join(dir, 'assets', f));
  for (const [path, file] of Object.entries(files)) linkInto(join(dir, path), file);

  rmSync(join(dir, 'src'), { recursive: true, force: true });
  mkdirSync(join(dir, 'src'), { recursive: true });
  const used = [...new Set(data.shots.filter((s) => s.component).map((s) => s.component))];
  for (const f of readdirSync(TEMPLATES).filter((f) => f.endsWith('.tsx'))) {
    let code = readFileSync(join(TEMPLATES, f), 'utf8');
    if (f === 'Video.tsx') {
      const markers = [
        ['const EPISODE: Episode = {} as Episode; // filled in by pipeline/render/reelkit.mjs', `const EPISODE: Episode = ${JSON.stringify(data, null, 2)};`],
        ['const SHOTS: Record<string, React.FC<ShotProps>> = {}; // @shots (filled in by pipeline/render/reelkit.mjs)', `const SHOTS: Record<string, React.FC<ShotProps>> = { ${used.join(', ')} };`],
        ['// @shot-imports (filled in by pipeline/render/reelkit.mjs)', used.map((n) => `import { ${n} } from "./${n}";`).join('\n')],
      ];
      for (const [marker, value] of markers) {
        if (!code.includes(marker)) throw new Error(`Video.tsx template lost its marker: ${marker}`);
        code = code.replace(marker, () => value);
      }
    }
    writeFileSync(join(dir, 'src', f), code);
  }
  for (const name of used) writeFileSync(join(dir, 'src', `${name}.tsx`), components[name]);
  writeJson(join(dir, 'plan.json'), rkPlan);
  writeFileSync(join(dir, 'ASSET_SOURCES.md'), assetSourcesMd);
}

// Writes / refreshes the Reelkit project(s) for the project. Safe to run again after any fix.
// Returns { dirs, data, plan } — one dir, or one per part for a film longer than ~4 minutes.
export function buildReelkitProject(ep) {
  const brand = config.brand();
  const video = config.video();
  const plan = readShots(ep);
  const overlays = readOverlays(ep);
  const audio = readJsonIfExists(ep.audio, {});
  const timing = readJson(ep.timing);
  const concept = readJsonIfExists(ep.concept, {});
  const totalFrames = Math.ceil((timing.totalDuration + 0.6) * brand.fps);
  const levels = (concept.motif?.type ?? 'voiceline') === 'voiceline' && timing.voiceFile && existsSync(timing.voiceFile) && !timing.silent
    ? voiceLevels(timing.voiceFile, { fps: brand.fps, frames: totalFrames }) : null;
  const assets = readJsonIfExists(ep.assets, { shots: {} });
  const { data, files, scenes, plan: rkPlan } = buildEpisodeData({
    brand, video, script: readJson(ep.script), plan, timing, assets, overlays, concept, levels,
  });
  const components = episodeComponents(ep, plan);
  const assetSourcesMd = assetSources({ plan, overlays, audio });
  const aspect = brand.aspect ?? '9:16';
  const parts = partRanges(scenes);
  const dirs = [];

  if (parts.length === 1) {
    const dir = projectDir(ep);
    writeProject(ep, dir, { data, files, plan: rkPlan, components, aspect, assetSourcesMd });
    dirs.push(dir);
  } else {
    const fps = data.fps;
    parts.forEach((part, i) => {
      const n = i + 1;
      const startSec = part.from / fps;
      const lenSec = (part.to - part.from) / fps;
      const partFiles = Object.fromEntries(Object.entries(files).filter(([path]) => !/^assets\/(voice|music)\./.test(path)));
      const voice = `assets/voice.mp3`;
      partFiles[voice] = trimAudio(files[data.audio.voice], join(ep.audioDir, 'parts', `voice-p${n}.mp3`), startSec, lenSec);
      let music = null;
      if (data.audio.music) {
        music = 'assets/music.mp3';
        partFiles[music] = trimAudio(files[data.audio.music], join(ep.audioDir, 'parts', `music-p${n}.mp3`), startSec, lenSec);
      }
      const partData = sliceEpisodeData(data, part, { voice, music });
      const partPlan = {
        ...rkPlan,
        title: `${rkPlan.title} (part ${n}/${parts.length})`,
        scenes: part.scenes.map((sc) => rkPlan.scenes[scenes.indexOf(sc)]),
      };
      const dir = projectDir(ep, n);
      writeProject(ep, dir, { data: partData, files: partFiles, plan: partPlan, components, aspect, assetSourcesMd });
      dirs.push(dir);
    });
    // A single-part project left over from an earlier, shorter cut would be stale.
    rmSync(projectDir(ep), { recursive: true, force: true });
  }
  for (const d of readdirSync(ep.dir)) {
    const m = d.match(/^reelkit-p(\d+)$/);
    if (m && (parts.length === 1 || Number(m[1]) > parts.length)) rmSync(join(ep.dir, d), { recursive: true, force: true });
  }
  const kinds = data.shots.reduce((n, s) => ({ ...n, [s.kind]: (n[s.kind] ?? 0) + 1 }), {});
  console.log(`Reelkit project → ${dirs.join(', ')}\n  ${rkPlan.scenes.length} scenes${parts.length > 1 ? ` in ${parts.length} parts` : ''} · ${data.shots.length} shots (${kinds.component ?? 0} reelkit components, ${kinds.clip ?? 0} clips) · ${Object.keys(data.images).length} images · ${data.overlays.length} overlays · ${data.audio.sfx.length} sfx · ${(data.totalFrames / data.fps).toFixed(2)}s`);
  return { dirs, dir: dirs[0], data, plan: rkPlan };
}

// Hash of everything that decides the picture and the sound: a final can reuse the
// preview's master when nothing changed since.
function projectHash(dirs) {
  const h = createHash('sha256');
  const walk = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, f.name);
      if (f.isDirectory()) walk(p);
      else { const s = statSync(p); h.update(`${p}:${s.size}:${s.mtimeMs}\n`); }
    }
  };
  for (const dir of dirs) {
    for (const sub of ['src', 'assets']) if (existsSync(join(dir, sub))) walk(join(dir, sub));
    if (existsSync(join(dir, 'plan.json'))) h.update(readFileSync(join(dir, 'plan.json')));
  }
  return h.digest('hex').slice(0, 16);
}

// Joins the parts' masters into one film (stream copy; re-encoded when the copy fails).
function joinParts(masters, out) {
  const list = `${out}.txt`;
  writeFileSync(list, masters.map((m) => `file '${m.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  try {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
  } catch {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c:v', 'libx264', '-crf', '16', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', out]);
  }
  rmSync(list, { force: true });
  return out;
}

// Phone export of a joined multi-part master (a single project uses `reelkit export`).
function exportJoined(master, out, kind) {
  const small = kind !== 'final';
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', master, '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', small ? '26' : '19', '-preset', 'medium',
    ...(small ? ['-vf', 'scale=trunc(iw/2/2)*2:trunc(ih/2/2)*2'] : []), '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', small ? '128k' : '192k', '-ar', '48000', '-movflags', '+faststart', out]);
  return out;
}

// check → lint → render → lint → export. kind "preview" = full local render, exported as a
// small chat copy; kind "final" = the phone-quality export (reuses an unchanged preview master).
export async function renderReelkit(ep, { kind }) {
  ensureReelkit();
  const s = reelkitSettings();
  await renderCanvasShots(ep, { grid: 0 });
  const { dirs } = buildReelkitProject(ep);
  for (const dir of dirs) { reelkit(dir, ['check']); reelkit(dir, ['lint', '--no-video']); }
  const hash = projectHash(dirs);
  const renders = readJsonIfExists(ep.renders, []);
  const masters = dirs.map((dir) => join(dir, 'out', 'video.mp4'));
  const reuse = kind === 'final' && masters.every((m) => existsSync(m)) && renders.at(-1)?.engine === 'reelkit' && renders.at(-1)?.hash === hash;
  if (reuse) console.log('Nothing changed since the last render — exporting its master.');
  else {
    for (const [i, dir] of dirs.entries()) {
      console.log(`Rendering locally with Reelkit (HyperFrames)${dirs.length > 1 ? ` — part ${i + 1}/${dirs.length}` : ''}…`);
      reelkit(dir, ['render', '--no-share', '--chunk']); // pieces are kept: rerunning continues an interrupted render
      try { reelkit(dir, ['lint']); } catch (e) { console.warn(`⚠ ${e.message}`); }
    }
  }
  const outDir = join(ROOT, 'output', ep.name);
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, kind === 'final' ? 'final.mp4' : 'preview.mp4');
  if (dirs.length === 1) reelkit(dirs[0], ['export', '--preset', kind === 'final' ? s.exportPreset : s.previewPreset, '--out', outFile]);
  else exportJoined(joinParts(masters, join(outDir, 'master.mp4')), outFile, kind);
  renders.push({ kind, engine: 'reelkit', parts: dirs.length, hash, file: outFile, at: new Date().toISOString() });
  writeJson(ep.renders, renders);
  const mb = Math.round(statSync(outFile).size / 1e5) / 10;
  console.log(`✔ ${kind} → ${outFile} (${mb} MB)`);
  return { file: outFile };
}

// `reelkit preview`: labelled stills of every scene (out/preview/sheet.jpg) without a render.
export async function previewFrames(ep) {
  ensureReelkit();
  await renderCanvasShots(ep, { grid: 0 });
  const { dirs } = buildReelkitProject(ep);
  const sheets = [];
  for (const dir of dirs) {
    reelkit(dir, ['check']);
    reelkit(dir, ['lint', '--no-video']);
    reelkit(dir, ['preview']);
    const sheet = join(dir, 'out', 'preview', 'sheet.jpg');
    if (existsSync(sheet)) sheets.push(sheet);
  }
  console.log(`Preview frames → ${dirs.map((d) => join(d, 'out', 'preview')).join(', ')}${sheets.length ? `\n  contact sheet${sheets.length > 1 ? 's' : ''}: ${sheets.join(', ')}` : ''}`);
  return sheets[0];
}
