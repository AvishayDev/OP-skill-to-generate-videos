// Shared helpers for the pipeline. No npm dependencies — Node 20+ only.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Load .env (if present) without overriding real environment variables.
const envFile = join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export function requireEnv(...names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    throw new Error(`Missing environment variable(s): ${missing.join(', ')}. See .env.example.`);
  }
  return Object.fromEntries(names.map((n) => [n, process.env[n]]));
}

export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
export const readJsonIfExists = (p, fallback) => (existsSync(p) ? readJson(p) : fallback);
export function writeJson(p, data) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

// ---------- config: repo defaults, overridden per project ----------
// config/*.json hold the studio defaults. Each project may carry its own project.json:
//   { "language": "en", "aspect": "16:9", "durationSeconds": 90, "fps": 30,
//     "voice": { "voiceName": "Kore", "style": "…" } | "none",
//     "brand": { …brand.json keys }, "video": { …video.json keys (deep-merged) } }
// The CLI calls setProject(ep) once, so every module reads the merged config.
let current = null;
export function setProject(ep) { current = ep; }
export const project = () => (current && existsSync(current.project) ? readJson(current.project) : {});

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
export function deepMerge(a, b) {
  if (!isObj(a) || !isObj(b)) return b === undefined ? a : b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = isObj(v) && isObj(a[k]) ? deepMerge(a[k], v) : v;
  return out;
}

// Frame size for an aspect ratio, 1080 on the short side.
export const ASPECTS = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] };
export function frameSize(aspect = '9:16') {
  const wh = ASPECTS[aspect];
  if (!wh) throw new Error(`aspect "${aspect}" — use one of ${Object.keys(ASPECTS).join(', ')}`);
  return wh;
}

export const languages = () => readJson(join(ROOT, 'config/languages.json'));
// Language settings (TTS locale, Whisper model, direction, default font) for a code like "he" or "pt-BR".
export function language(code) {
  const all = languages();
  const key = code in all ? code : code?.split('-')[0];
  const base = all[key] ?? { name: code, languageCode: code, rtl: false, whisperModel: all._default.whisperModel, font: all._default.font };
  return { code: key ?? code, ...all._default, ...base };
}

export const config = {
  brand: () => {
    const p = project();
    const b = deepMerge(readJson(join(ROOT, 'config/brand.json')), p.brand ?? {});
    for (const k of ['language', 'aspect', 'durationSeconds', 'fps', 'title']) if (p[k] !== undefined) b[k] = p[k];
    [b.width, b.height] = frameSize(b.aspect ?? '9:16');
    b.rtl = language(b.language ?? 'en').rtl;
    return b;
  },
  // The voice: repo defaults + the language's locale/Whisper model + the project's choices.
  // { none: true } when the film has no narrator (project.json → "voice": "none").
  voice: () => {
    const p = project();
    const lang = language(p.language ?? readJson(join(ROOT, 'config/brand.json')).language ?? 'en');
    if (p.voice === 'none' || p.voice === false) return { none: true, languageCode: lang.languageCode };
    const base = readJson(join(ROOT, 'config/voice.json'));
    return { ...base, languageCode: lang.languageCode, alignLanguage: lang.whisperLanguage ?? lang.code, alignModel: lang.whisperModel, style: lang.voiceStyle ?? base.style, ...(isObj(p.voice) ? p.voice : {}) };
  },
  video: () => deepMerge(readJson(join(ROOT, 'config/video.json')), project().video ?? {}),
};

export function episodePaths(dir) {
  const d = resolve(ROOT, dir);
  return {
    dir: d,
    date: d.split('/').pop(), // the project's folder name (a slug); kept as `date` for older callers
    name: d.split('/').pop(),
    project: join(d, 'project.json'),
    research: join(d, 'research.md'),
    script: join(d, 'script.json'),
    concept: join(d, 'concept.json'),
    shots: join(d, 'shots.json'),
    overlays: join(d, 'overlays.json'),
    audio: join(d, 'audio.json'),
    credits: join(d, 'credits.txt'),
    approvals: join(d, 'approvals.json'),
    timing: join(d, 'timing.json'),
    assets: join(d, 'assets.json'),
    renders: join(d, 'renders.json'),
    audioDir: join(d, 'audio'),
    clipsDir: join(d, 'clips'),
    elementsDir: join(d, 'elements'),
    framesDir: join(d, 'frames'),
    overlaysDir: join(d, 'overlays'),
  };
}

// Approval gates: approvals.json is only ever flipped after the human says yes.
export function requireApproval(ep, gate) {
  const approvals = readJsonIfExists(ep.approvals, {});
  if (!approvals[gate]?.approved) {
    throw new Error(
      `Approval gate "${gate}" is not approved for ${ep.name}. ` +
        `Show the user the plan/preview and run "approve <ep> ${gate}" only after they confirm.`,
    );
  }
}

export function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', ...opts });
}

// faster-whisper gives the voiceover its exact word timing (captions, cuts, overlays).
// Installed by the SessionStart hook; installed on demand otherwise.
let whisperReady = false;
export function ensureWhisper() {
  if (whisperReady) return true;
  const has = () => { try { execFileSync('python3', ['-c', 'import faster_whisper, numpy'], { stdio: 'ignore' }); return true; } catch { return false; } };
  if (!has()) {
    console.log('Installing faster-whisper (word timing)…');
    for (const args of [['-m', 'pip', 'install', '-q', '--break-system-packages', 'faster-whisper'], ['-m', 'pip', 'install', '-q', '--user', 'faster-whisper']]) {
      try { execFileSync('python3', args, { stdio: 'ignore', timeout: 900_000 }); } catch { continue; }
      if (has()) break;
    }
  }
  return (whisperReady = has());
}

export function probeDuration(file) {
  const out = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  return Number.parseFloat(out.trim());
}

export const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
