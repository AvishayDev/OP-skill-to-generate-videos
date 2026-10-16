// Music + sound effects from Freesound (https://freesound.org/docs/api/).
// Only CC0 and CC BY sounds are used — never NC (we monetize) or Sampling+.
// CC BY sounds need a creator mention, which credits.txt picks up from audio.json.
//
// audio.json → {
//   "music": { query, source: { type: "freesound", id, url }, license, credit, page },
//   "sfx":   { "<name>": { query, source, license, credit, page }, ... }
// }
// Overlays play the sound named after their type (config video.json → sfx.byType),
// or the one in their own `sfx` field; `"sfx": false` keeps an overlay silent.
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { config, readJsonIfExists, writeJson, requireEnv, run, probeDuration, round, ROOT } from '../lib.mjs';
import { downloadHttp } from './images.mjs';

const FIELDS = 'id,name,username,license,duration,previews,url,tags,avg_rating,num_downloads';
const LICENSE_FILTER = 'license:("Creative Commons 0" OR "Attribution")';

// Freesound licence (name or URL) → our short name, or null when we can't use it.
export function freesoundLicense(raw = '') {
  const s = raw.toLowerCase();
  if (/(^|[^a-z])nc([^a-z]|$)|noncommercial|sampling/.test(s) || /licenses\/by-nc/.test(s)) return null;
  if (/publicdomain\/zero|creative commons 0|^cc0/.test(s)) return 'CC0';
  const v = s.match(/licenses\/by\/(\d\.\d)/);
  if (v) return `CC BY ${v[1]}`;
  if (/^attribution$/.test(s.trim())) return 'CC BY';
  return null;
}

export function toResult(s) {
  const license = freesoundLicense(s.license);
  if (!license) return null;
  return {
    type: 'freesound', id: s.id, name: s.name, duration: round(s.duration ?? 0, 2),
    url: s.previews?.['preview-hq-mp3'], page: s.url, tags: (s.tags ?? []).slice(0, 8).join(', '),
    rating: s.avg_rating, downloads: s.num_downloads,
    license, attribution: license !== 'CC0', credit: `"${s.name}" by ${s.username} / Freesound`,
  };
}

// kind "music" = tracks long enough to sit under the whole video; "sfx" = short hits.
export async function searchFreesound(query, { kind = 'sfx', limit = 12, minDuration, maxDuration } = {}) {
  const { FREESOUND_API_KEY } = requireEnv('FREESOUND_API_KEY');
  const c = config.video();
  const [lo, hi] = kind === 'music'
    ? [minDuration ?? c.music.minSeconds ?? 45, maxDuration ?? 600]
    : [minDuration ?? 0.1, maxDuration ?? c.sfx.maxSourceSeconds ?? 4];
  const params = new URLSearchParams({
    query, token: FREESOUND_API_KEY, fields: FIELDS, page_size: String(limit),
    filter: `duration:[${lo} TO ${hi}] ${LICENSE_FILTER}`,
    sort: kind === 'music' ? 'downloads_desc' : 'score',
  });
  const res = await fetch(`https://freesound.org/apiv2/search/text/?${params}`);
  if (!res.ok) throw new Error(`Freesound ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const { results = [] } = await res.json();
  return results.map(toResult).filter((r) => r?.url);
}

// Automatic pick when audio.json doesn't name a sound: the best-rated of the
// top results, preferring music that covers the whole video without looping.
export function pickBest(results, { kind, needSeconds = 0 }) {
  const covers = (r) => (kind === 'music' && r.duration >= needSeconds ? 1 : 0);
  const popularity = (r) => Math.log10(1 + (r.downloads ?? 0)) * (r.rating || 3);
  return [...results].sort((a, b) => covers(b) - covers(a) || popularity(b) - popularity(a))[0] ?? null;
}

const entryOf = (r, query) => ({
  query, source: { type: 'freesound', id: r.id, url: r.url }, name: r.name, duration: r.duration,
  license: r.license, credit: r.credit, page: r.page,
});

// A Freesound outage must not stop a render — it just goes out without that sound.
async function searchSafe(query, kind) {
  try { return await searchFreesound(query, { kind }); } catch (err) { console.warn(`⚠ ${err.message.split('\n')[0]}`); return []; }
}

// Fills in whatever audio.json is missing (music, one sound per overlay type and per cue sound name)
// with automatic Freesound picks from the queries in config/video.json.
export async function planAudio(ep, { needSeconds } = {}) {
  const c = config.video();
  const plan = readJsonIfExists(ep.audio, {});
  plan.sfx ??= {};
  if (!process.env.FREESOUND_API_KEY) {
    if (!plan.music || !Object.keys(plan.sfx).length) console.warn('⚠ FREESOUND_API_KEY not set — no automatic music / sound effects');
    return plan;
  }
  if (!plan.music && c.music.query !== false) {
    // The project's query, then shorter forms of it, then the studio defaults — a film is never left silent by a too-specific query.
    const first = c.music.query || config.brand().musicStyle;
    const words = first.split(/\s+/);
    const queries = [...new Set([first, words.slice(0, 2).join(' '), words.slice(-2).join(' '), config.brand().musicStyle, 'upbeat background music'].filter(Boolean))];
    for (const query of queries) {
      const r = pickBest(await searchSafe(query, 'music'), { kind: 'music', needSeconds });
      if (r) { plan.music = entryOf(r, query); if (query !== first) console.log(`Music: nothing for "${first}", used "${query}"`); break; }
      console.warn(`⚠ No music found on Freesound for "${query}"`);
    }
  }
  if (c.sfx.enabled) {
    // One sound per overlay type, plus every sound a shot cue asks for (shots.json → cues → sfx).
    const cueSounds = readJsonIfExists(ep.shots, { shots: [] }).shots.flatMap((s) => Object.values(s.cues ?? {}).map((x) => x?.sfx).filter((x) => typeof x === 'string'));
    for (const name of new Set([...Object.values(c.sfx.byType ?? {}), ...cueSounds])) {
      if (plan.sfx[name]) continue;
      const query = c.sfx.queries?.[name] ?? name;
      const r = pickBest(await searchSafe(query, 'sfx'), { kind: 'sfx' });
      if (r) plan.sfx[name] = entryOf(r, query); else console.warn(`⚠ No sound effect found on Freesound for "${query}"`);
    }
  }
  writeJson(ep.audio, plan);
  return plan;
}

async function fetchRaw(item, dest) {
  const { url, path } = item.source ?? {};
  if (path) { copyFileSync(resolve(ROOT, path), dest); return dest; }
  if (!url) throw new Error(`audio.json: "${item.name ?? item.query}" needs source.url or source.path`);
  await downloadHttp(url, dest);
  return dest;
}

const rawName = (item, base) => `${base}.src${extname(item.source?.path ?? new URL(item.source?.url ?? 'file:///x.mp3').pathname) || '.mp3'}`;

// Music is looped (if shorter) and trimmed to the video length, with a fade in/out
// and loudness-normalized so `music.volume` means the same for every track.
export function processMusic(rawFile, outFile, length, { fadeIn = 1, fadeOut = 2.5 } = {}) {
  run('ffmpeg', [
    '-y', '-stream_loop', '-1', '-i', rawFile, '-t', String(length), '-vn',
    '-af', `afade=t=in:d=${fadeIn},afade=t=out:st=${round(Math.max(0, length - fadeOut), 2)}:d=${fadeOut},loudnorm=I=-16:TP=-1.5`,
    '-ar', '44100', '-ac', '2', '-b:a', '192k', outFile,
  ]);
  return outFile;
}

// A sound effect starts right on its hit (leading silence removed), is capped at
// `maxSeconds` with a short fade-out, and is peak-normalized.
export function processSfx(rawFile, outFile, { maxSeconds = 1.5 } = {}) {
  const fade = Math.min(0.3, maxSeconds / 4);
  run('ffmpeg', [
    '-y', '-i', rawFile, '-vn',
    '-af', `silenceremove=start_periods=1:start_threshold=-45dB,atrim=0:${maxSeconds},` +
      `afade=t=out:st=${round(maxSeconds - fade, 2)}:d=${fade},dynaudnorm=p=0.9:m=10`,
    '-ar', '44100', '-ac', '2', '-b:a', '192k', outFile,
  ]);
  return outFile;
}

// Downloads + processes the episode's music and sound effects into audio/.
export async function prepareAudio(ep) {
  const c = config.video();
  const timing = readJsonIfExists(ep.timing, null);
  const length = round((timing?.totalDuration ?? config.brand().durationSeconds) + (c.music.tailSeconds ?? 1), 2);
  const plan = await planAudio(ep, { needSeconds: length });
  const assets = readJsonIfExists(ep.assets, { shots: {} });
  mkdirSync(ep.audioDir, { recursive: true });

  if (plan.music && !assets.musicManual) {
    const raw = join(ep.audioDir, rawName(plan.music, 'music'));
    if (!existsSync(raw) || assets.musicSrc !== (plan.music.source.url ?? plan.music.source.path)) await fetchRaw(plan.music, raw);
    const out = processMusic(raw, join(ep.audioDir, 'music.mp3'), length, c.music);
    assets.musicFile = out;
    assets.musicSrc = plan.music.source.url ?? plan.music.source.path;
    delete assets.musicUrl;
    console.log(`Music "${plan.music.name ?? plan.music.query ?? plan.music.source.path ?? 'track'}" (${plan.music.license}) → ${out} ${length}s`);
  }

  const before = assets.sfx ?? {};
  assets.sfx = {};
  if (c.sfx.enabled) {
    for (const [name, item] of Object.entries(plan.sfx ?? {})) {
      const src = item.source?.url ?? item.source?.path;
      const raw = join(ep.audioDir, rawName(item, `sfx-${name}`));
      if (!existsSync(raw) || before[name]?.src !== src) await fetchRaw(item, raw);
      const out = processSfx(raw, join(ep.audioDir, `sfx-${name}.mp3`), { maxSeconds: item.maxSeconds ?? c.sfx.maxSeconds });
      assets.sfx[name] = { file: out, duration: round(probeDuration(out), 3), src };
      console.log(`SFX ${name} "${item.name ?? item.query ?? item.source?.path}" (${item.license}) → ${out} ${assets.sfx[name].duration}s`);
    }
  }
  writeJson(ep.assets, assets);
  return assets;
}

// Which sound an overlay plays: its own `sfx` (a name, or false for none),
// else the one configured for its type. Text overlays (stat/title) stay silent by default.
export function sfxFor(overlay, cfg) {
  if (!cfg?.enabled || overlay.sfx === false) return null;
  if (typeof overlay.sfx === 'string') return overlay.sfx;
  return cfg.byType?.[overlay.type] ?? null;
}

// Audio items with licence info, for credits.txt.
export function audioCreditItems(plan, usedSfx) {
  const items = [];
  if (plan?.music) items.push(plan.music);
  for (const [name, item] of Object.entries(plan?.sfx ?? {})) if (!usedSfx || usedSfx.has(name)) items.push(item);
  return items;
}
