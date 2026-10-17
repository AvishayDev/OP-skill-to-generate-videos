#!/usr/bin/env node
// Video Studio CLI. Usage: node pipeline/cli.mjs <command> [projectDir] [args]
// Run with no arguments for help.
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, config, episodePaths, readJson, readJsonIfExists, writeJson, requireApproval, ensureWhisper, setProject, languages, language, frameSize } from './lib.mjs';
import { generateVoice } from './audio/tts.mjs';
import { searchPhotos, searchPexelsPhotos, searchPixabayImages, searchCommonsImages, prepareElements, readShots, downloadHttp } from './assets/images.mjs';
import { computeSlots, captionOptions, resolveShots } from './video/slots.mjs';
import { prepareOverlays, readOverlays } from './assets/overlays.mjs';
import { searchFreesound, prepareAudio, audioCreditItems, sfxFor, processMusic } from './assets/audio.mjs';
import { buildCredits } from './credits.mjs';
import { searchIcons } from './assets/icons.mjs';
import { renderReelkit, previewFrames, buildReelkitProject, ensureReelkit, reelkitVersion, reelkitSettings } from './render/reelkit.mjs';
import { renderCanvasShots } from './render/canvas.mjs';
import { renderBlenderShots, findBlender, blenderConfig } from './render/blender.mjs';
import { prepareClips, searchVideos } from './render/clips.mjs';
import { prepareFonts, findGoogleFont } from './assets/fonts.mjs';
import { prepareSource } from './video/source.mjs';

const HELP = `
Video Studio — run from the repo root. One project = projects/<name>/. Any idea, language, length and shape:
shots drawn in code (reelkit components shots/<Name>.tsx, animate-in-code canvas films shots/<id>.js), stock
footage (Pexels / Pixabay video) or clips rendered by any library skill (Manim, HyperFrames, Remotion, Lottie…).

  doctor                         Check API keys, tools and network access — run first
  init <name> [--lang en] [--aspect 9:16|16:9|1:1|4:5] [--seconds 60] [--voice none|source] [--title "…"]
                                 Create projects/<name>/ with project.json + templates
                                 (--voice source = footage mode: the user's own video + voice, no TTS)
  source <p> <file> [--max-pause 0.35] [--keep-pauses] [--rewrite-script]
                                 Footage mode: transcribe the upload, cut dead air (+ project.json → source.remove),
                                 crop to the frame, colour + voice cleanup → source/edit.mp4 + audio/voice.wav,
                                 transcript → script.json. Shots then use "video": "source" / "under": "source"
  status <p>                     What exists for the project and which gates are approved
  approve <p> <plan|preview>     Record the human's approval (ONLY after they said yes)
  approve <p> auto "<request>"   One-shot mode: the user asked for a finished video in one prompt
  languages                      Languages with their TTS locale, Whisper model, direction and default font
  voices                         The TTS voices (config/voice.json → voices)

  search-photos "<query>"        Stills for elements: Pexels + Pixabay + Wikimedia Commons at once
  search-pexels "<query>"        Pexels photos only;  search-pixabay "<query>" [photo|illustration|vector]
  search-logo "<company>"        Logos on Wikimedia Commons (PNG renders of SVGs, transparent)
  search-images "<query>"        Still images on Commons (products, places, public-domain engravings)
  search-icons "<query>"         Flat icons (Flaticon with FREEPIK_API_KEY, else Iconify open-licence sets)
  search-videos "<query>"        Stock footage: Pexels + Pixabay videos (for "footage" shots)
  search-music "<query>"         Background music on Freesound (CC0 / CC BY)
  search-sfx "<query>"           Short sound effects on Freesound (CC0 / CC BY) — whoosh, pop, click…
  search-font "<Family>"         Check a Google Fonts family exists (any script: Arabic, CJK, Cyrillic…)

  voice <p> [--force]            Gemini TTS, whole script in one request → audio/voice.mp3 + timing.json
                                 (project voice "none": a silent clock from each segment's "seconds")
  shots <p>                      When each shot plays (from the real voice) + its words and cue times
  fonts <p>                      Download the concept's Google Fonts faces the kit lacks → fonts/
  elements <p> [--only <id>]     Download shots.json → images, apply the concept's treatment → elements/<id>.png
  clips <p> [--only <id>]        Footage shots (download + trim + crop) and clip shots (conform clips-src/<id>.mp4)
  canvas <p> [--only <id>] [--grid-only]
                                 Render the canvas shots → clips/<id>.mp4 + frames/<id>-grid.jpg (Read it!)
  blender <p> [--only <id>] [--grid-only] [--quality final|preview]
                                 Render the blender-3d shots (real 3D, Cycles on the CPU, resumable) → clips/<id>.mp4;
                                 --grid-only = a few stills → frames/<id>-grid.jpg (Read it before the long render)
  overlays <p> [--only <id>]     Optional overlays.json images → overlays/<id>.png
  audio <p>                      Music + sound effects from audio.json (missing ones auto-picked on Freesound)
  credits <p>                    Credits for the post description → credits.txt

  -- requires "plan" approval --
  music <p> <file|https-url>     Force a music track, overriding audio.json
  timeline <p>                   Build the Reelkit project(s) projects/<name>/reelkit/ (parts for films > 4 min)
  frames <p>                     Prepare everything, then check + lint + labelled stills of every scene
                                 (~2 min, no render) → reelkit/out/preview/sheet.jpg (Read it!)
  preview <p>                    Full local render → output/<name>/preview.mp4 (small chat copy)
  produce <p> [--final]          voice → fonts → elements → clips → canvas → blender → overlays → audio → timeline → preview (or final)

  -- requires "preview" approval --
  final <p>                      Phone export (reuses the preview's master if nothing changed) → output/<name>/final.mp4
  cleanup <p>                    After the video is sent: remove the project's temporary render files

Rendering is local (~20 min per minute of film in the cloud container — run produce/preview/final in the background).
<p> is a project folder, e.g. projects/coffee-history
`;

const today = () => new Date().toISOString().slice(0, 10);

const slugify = (x) => String(x).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 48) || `video-${today()}`;

function init(name, opts = {}) {
  const ep = episodePaths(join('projects', slugify(name ?? `video-${today()}`)));
  if (existsSync(ep.script)) throw new Error(`${ep.dir} already exists`);
  const lang = language(opts.lang ?? 'en');
  const aspect = opts.aspect ?? '9:16';
  frameSize(aspect);
  const seconds = Number(opts.seconds ?? 60);
  mkdirSync(join(ep.dir, 'shots'), { recursive: true });
  const project = { title: opts.title ?? '', language: lang.code, aspect, durationSeconds: seconds, fps: 30, ...(['none', 'source'].includes(opts.voice) ? { voice: opts.voice } : {}) };
  writeJson(ep.project, project);
  writeFileSync(ep.research, `# Research — ${name}\n\nOnly for factual topics (news, history, science, products): sources and checked facts.\n`);
  const words = Math.round(seconds * (lang.wordsPerSecond ?? 2.5));
  writeJson(ep.script, {
    title: opts.title ?? '',
    date: today(),
    segments: [
      { id: 'hook', text: '', sources: [], ...(opts.voice === 'none' ? { seconds: 3 } : {}) },
      { id: 'body', text: '', sources: [], ...(opts.voice === 'none' ? { seconds: Math.max(3, seconds - 6) } : {}) },
      { id: 'outro', text: '', sources: [], ...(opts.voice === 'none' ? { seconds: 3 } : {}) },
    ],
  });
  writeJson(ep.concept, {
    name: '', why: '', look: '',
    palette: { bg: '#F2F0E9', ink: '#111111', accent: '#D7FF3A', accentInk: '#111111', muted: '#8A877C', paper: '#FFFFFF' },
    font: lang.font, imageTreatment: 'none', ground: { grain: 0.06, pattern: 'none' }, motif: { type: opts.voice === 'none' || opts.voice === 'source' ? 'none' : 'voiceline' },
    elements: [], motion: '',
  });
  writeJson(ep.shots, {
    images: [],
    videos: [],
    shots: [
      { id: 'hook-a', segment: 'hook', skill: 'reelkit', component: 'HookTitle', cues: {}, images: [], intent: '', description: '' },
    ],
  });
  writeJson(ep.approvals, {});
  console.log(`Created ${ep.dir}\n  ${lang.name} (${lang.rtl ? 'right to left' : 'left to right'}), ${aspect} ${frameSize(aspect).join('×')}, ~${seconds}s${opts.voice === 'none' ? ', no narrator' : opts.voice === 'source' ? ', footage mode — next: source <p> <file>' : ` ≈ ${words} spoken words`}`);
}

function status(ep) {
  const approvals = readJsonIfExists(ep.approvals, {});
  const assets = readJsonIfExists(ep.assets, {});
  const has = (p) => (existsSync(p) ? '✔' : '·');
  const plan = readShots(ep);
  const canvas = plan.shots.filter((s) => s.skill === 'canvas');
  const blender3d = plan.shots.filter((s) => s.skill === 'blender');
  const clipShots = plan.shots.filter((s) => s.skill === 'footage' || s.skill === 'clip');
  const p = readJsonIfExists(ep.project, {});
  console.log(`Project ${ep.name}  (${p.language ?? 'en'} · ${p.aspect ?? '9:16'} · ~${p.durationSeconds ?? '?'}s${p.voice === 'none' ? ' · no narrator' : p.voice === 'source' ? ` · footage mode${existsSync(join(ep.dir, 'source', 'edit.mp4')) ? ' (source cut ✔)' : ' (run source)'}` : ''})
  ${has(ep.research)} research.md     ${has(ep.script)} script.json     ${has(ep.concept)} concept.json     ${has(ep.shots)} shots.json (${plan.shots.length} shots)
  ${has(ep.timing)} timing.json      ${has(ep.audio)} audio.json       ${has(ep.overlays)} overlays.json
  images prepared: ${Object.keys(assets.elements ?? {}).length}/${(plan.images ?? []).length}   canvas clips: ${canvas.filter((s) => assets.canvas?.[s.id]).length}/${canvas.length}   blender: ${blender3d.filter((s) => assets.blender?.[s.id]).length}/${blender3d.length}   footage/clips: ${clipShots.filter((s) => assets.clips?.[s.id]).length}/${clipShots.length}   sfx: ${Object.keys(assets.sfx ?? {}).join(', ') || '·'}
  reelkit project: ${existsSync(join(ep.dir, 'reelkit', 'src', 'Video.tsx')) || existsSync(join(ep.dir, 'reelkit-p1', 'src', 'Video.tsx')) ? '✔' : '·'}
  gate plan:    ${approvals.plan?.approved ? `✔ ${approvals.plan.at}` : '✗ not approved'}
  gate preview: ${approvals.preview?.approved ? `✔ ${approvals.preview.at}` : '✗ not approved'}`);
  for (const r of readJsonIfExists(ep.renders, [])) console.log(`  render ${r.kind} ${r.at}: ${r.file}`);
}

function approve(ep, gate, note = '') {
  if (gate === 'auto') {
    if (!note) throw new Error('auto approval needs the user\'s request text as the note');
    const at = new Date().toISOString();
    const entry = { approved: true, at, note: `one-shot request: ${note}` };
    writeJson(ep.approvals, { plan: entry, preview: entry, auto: entry });
    return console.log(`Auto mode for ${ep.name}: plan + final render approved by the user's one-shot request`);
  }
  if (!['plan', 'preview'].includes(gate)) throw new Error('Gate must be "plan", "preview" or "auto"');
  if (gate === 'preview' && !readJsonIfExists(ep.renders, []).some((r) => r.kind === 'preview')) {
    throw new Error('No preview has been rendered yet');
  }
  const approvals = readJsonIfExists(ep.approvals, {});
  approvals[gate] = { approved: true, at: new Date().toISOString(), note };
  writeJson(ep.approvals, approvals);
  console.log(`Approved "${gate}" for ${ep.name}`);
}

function music(ep, src, { manual = true } = {}) {
  const assets = readJsonIfExists(ep.assets, {});
  if (/^https:\/\//.test(src)) {
    assets.musicUrl = src;
    delete assets.musicFile;
  } else {
    assets.musicFile = src;
    delete assets.musicUrl;
  }
  assets.musicManual = manual; // a manual pick wins over audio.json
  writeJson(ep.assets, assets);
  console.log('Music registered');
}

// Last-resort music when audio.json has none (e.g. no FREESOUND_API_KEY).
// Audio is never committed, so the default tracks are https URLs listed in
// assets/music/tracks.txt (one per line, # comments). Local files dropped into
// assets/music/ during a session are used too (they are git-ignored).
function defaultMusic(ep) {
  const assets = readJsonIfExists(ep.assets, {});
  if (assets.musicUrl || assets.musicFile) return;
  const dir = join(ROOT, 'assets/music');
  const list = join(dir, 'tracks.txt');
  const urls = existsSync(list) ? readFileSync(list, 'utf8').split('\n').map((l) => l.trim()).filter((l) => /^https:\/\//.test(l)) : [];
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.(mp3|m4a|wav)$/i.test(f)).map((f) => join(dir, f)) : [];
  const tracks = [...urls, ...files];
  if (!tracks.length) return console.warn('⚠ No music registered and assets/music/tracks.txt is empty — rendering without music.');
  music(ep, tracks[Math.floor(Math.random() * tracks.length)], { manual: false });
}

// Reelkit renders from local files only: a music URL (assets/music/tracks.txt or `music <url>`)
// is downloaded and processed like a Freesound track.
async function localMusic(ep) {
  const assets = readJsonIfExists(ep.assets, {});
  if (!assets.musicUrl || (assets.musicFile && existsSync(assets.musicFile))) return;
  mkdirSync(ep.audioDir, { recursive: true });
  const raw = join(ep.audioDir, `music.src${extname(new URL(assets.musicUrl).pathname) || '.mp3'}`);
  await downloadHttp(assets.musicUrl, raw);
  const v = config.video();
  const length = readJson(ep.timing).totalDuration + (v.music.tailSeconds ?? 1);
  assets.musicFile = processMusic(raw, join(ep.audioDir, 'music.mp3'), length, v.music);
  writeJson(ep.assets, assets);
  console.log(`Music ${assets.musicUrl} → ${assets.musicFile}`);
}

// The shot list against the real voice: when every shot plays, how long, which words, and when each cue lands.
function shots(ep) {
  const plan = readShots(ep);
  const timing = readJson(ep.timing);
  const { minShotSeconds: min, maxShotSeconds: max } = config.video().clips;
  const fps = config.brand().fps;
  const list = resolveShots(plan, { script: readJson(ep.script), timing, fps });
  let bad = 0;
  for (const s of list) {
    const len = s.frames / fps;
    const flag = len > max + 0.05 ? `  ⚠ > ${max}s — split it` : len < min - 0.05 ? `  ⚠ < ${min}s` : '';
    if (flag) bad++;
    const who = s.skill === 'canvas' ? `canvas ${s.file ?? `shots/${s.id}.js`}` : s.skill === 'blender' ? `blender ${s.file ?? `shots/${s.id}.py`}` : s.skill === 'footage' ? `footage ${typeof s.video === 'string' ? s.video : s.video?.source?.url ?? '?'}` : s.skill === 'clip' ? `clip ${s.file ?? `clips-src/${s.id}.mp4`} (render ${s.frames} frames)` : `reelkit ${s.component}`;
    console.log(`${s.id.padEnd(11)} ${(s.from / fps).toFixed(2).padStart(6)}s  ${len.toFixed(1).padStart(4)}s  ${who}${flag}`);
    console.log(`            “${s.words.map((w) => w.word).join(' ')}”`);
    for (const [name, c] of Object.entries(s.cues)) console.log(`            cue ${name.padEnd(12)} +${c.t.toFixed(2)}s (frame ${c.f})${c.sfx ? ` ♪ ${c.sfx}` : ''}`);
  }
  console.log(`\n${list.length} shots · voice ${timing.totalDuration}s${bad ? ` · ⚠ ${bad} shot(s) outside ${min}–${max}s` : ''}`);
}

async function final(ep) {
  requireApproval(ep, 'preview');
  const result = await renderReelkit(ep, { kind: 'final' });
  console.log(`FINAL_VIDEO=${result.file}`);
  return result;
}

// Run after the mp4 was sent: nothing is hosted anywhere (Reelkit renders locally), so this only
// removes the episode's temporary render files. The final mp4 in output/ stays.
function cleanup(ep) {
  let n = 0;
  const parts = existsSync(ep.dir) ? readdirSync(ep.dir).filter((d) => /^reelkit(-p\d+)?$/.test(d)) : [];
  for (const dir of [join(ep.dir, 'canvas'), join(ep.dir, 'footage'), join(ep.audioDir, 'parts'), join(ROOT, 'output', ep.name, 'master.mp4'), ...parts.map((d) => join(ep.dir, d, 'out', 'chunks'))]) {
    if (existsSync(dir)) { rmSync(dir, { recursive: true, force: true }); n++; }
  }
  console.log(`✔ Nothing hosted: everything rendered locally. Removed ${n} temporary folder(s); the final mp4 is in output/${ep.name}/.`);
}

// Credits for the post description. Anything whose licence asks for a creator
// mention (CC BY / BY-SA / official material) is listed with its link.
function credits(ep) {
  const overlays = readOverlays(ep);
  const plan = readShots(ep);
  const sfxCfg = config.video().sfx;
  const usedSfx = new Set((overlays.overlays ?? []).map((o) => sfxFor(o, sfxCfg)).filter(Boolean));
  for (const s of plan.shots) for (const c of Object.values(s.cues ?? {})) if (c && typeof c === 'object' && c.sfx) usedSfx.add(c.sfx);
  const assets = readJsonIfExists(ep.assets, {});
  const audio = readJsonIfExists(ep.audio, {});
  // A manually forced track isn't in audio.json — don't credit the unused one.
  if (assets.musicManual) delete audio.music;
  const usedImages = new Set(plan.shots.flatMap((s) => s.images ?? []));
  const videos = Object.fromEntries((plan.videos ?? []).map((v) => [v.id, v]));
  const footage = plan.shots.filter((s) => s.skill === 'footage').map((s) => (typeof s.video === 'string' ? videos[s.video] : s.video)).filter(Boolean);
  const clipCredits = plan.shots.filter((s) => s.skill === 'clip' && (s.license || s.credit)).map((s) => ({ license: s.license, credit: s.credit, page: s.page }));
  const { text, requiredCount } = buildCredits({ images: [...(plan.images ?? []).filter((i) => usedImages.has(i.id)), ...footage, ...clipCredits], overlays, audio: audioCreditItems(audio, usedSfx) });
  writeFileSync(ep.credits, text);
  console.log(`${text}\n${requiredCount ? `⚠ ${requiredCount} item(s) REQUIRE this credit in the post description` : 'No mandatory credits (courtesy only)'} → ${ep.credits}`);
}

// Everything produce/frames need before the timeline: cheap and cached.
async function prepare(ep) {
  await generateVoice(ep);
  await prepareFonts(ep);
  await prepareElements(ep);
  await prepareClips(ep);
  await renderCanvasShots(ep);
  await renderBlenderShots(ep);
  await prepareOverlays(ep);
  await prepareAudio(ep);
  defaultMusic(ep);
  await localMusic(ep);
}

// [host, purpose, required]
const HOSTS = [
  ['huggingface.co', 'Whisper model download (word timing)', true],
  ['download.blender.org', 'Blender download (blender-3d shots, optional)', false],
  ['generativelanguage.googleapis.com', 'Gemini TTS', true],
  ['storage.googleapis.com', 'Reelkit render browser (downloaded once, ~150 MB)', true],
  ['api.pexels.com', 'Pexels photo search', false],
  ['images.pexels.com', 'Pexels photo downloads', false],
  ['pixabay.com', 'Pixabay image search + downloads', false],
  ['commons.wikimedia.org', 'Wikimedia Commons search', false],
  ['upload.wikimedia.org', 'Wikimedia Commons downloads', false],
  ['thumb.wikimedia.org', 'Wikimedia Commons logo/image renders', false],
  ['api.iconify.design', 'Iconify icons', false],
  ['videos.pexels.com', 'Pexels video downloads (footage shots)', false],
  ['cdn.pixabay.com', 'Pixabay downloads (images + footage)', false],
  ['fonts.googleapis.com', 'Google Fonts lookup (non-Latin scripts, any family)', false],
  ['fonts.gstatic.com', 'Google Fonts downloads', false],
  ['freesound.org', 'Freesound search (music + sound effects)', false],
  ['cdn.freesound.org', 'Freesound downloads (music + sound effects)', false],
];

async function doctor() {
  let ok = true;
  const line = (good, msg) => { console.log(`${good ? '✔' : '✖'} ${msg}`); };
  const vars = [
    ['GEMINI_API_KEY', true, 'voiceover (Gemini TTS)'],
    ['PEXELS_API_KEY', false, 'photos + stock footage (recommended)'],
    ['PIXABAY_API_KEY', false, 'photos, illustrations and vectors for shot elements (recommended)'],
    ['FREESOUND_API_KEY', false, 'background music + sound effects (recommended)'],
    ['FREEPIK_API_KEY', false, 'Flaticon icons (else free Iconify icons are used)'],
  ];
  for (const [name, required, why] of vars) {
    const has = Boolean(process.env[name]);
    if (required && !has) ok = false;
    line(has, `${name} ${has ? 'set' : required ? 'MISSING' : 'not set (optional)'} — ${why}`);
  }
  {
    const has = ensureWhisper();
    if (!has) ok = false;
    line(has, `faster-whisper${has ? '' : ' not installed (pip install faster-whisper)'} — exact word timing for captions, cuts and cues`);
  }
  let v = reelkitVersion();
  if (v !== reelkitSettings().version) { try { v = ensureReelkit(); } catch { v = null; } }
  if (!v) ok = false;
  line(Boolean(v), `reelkit-cli ${v ?? 'not installed (npm install -g reelkit-cli@' + reelkitSettings().version + ')'} — renders the shots, captions + sound locally`);
  const bl = findBlender({ install: false });
  line(Boolean(bl), `blender ${bl ? blenderConfig().version : `not installed (optional) — "blender <p>" installs it on first use (.claude/skills/blender-3d/install.sh)`} — real 3D shots (blender-3d skill)`);
  for (const skill of ['video-studio', 'reelkit', 'animate-in-code']) {
    const has = existsSync(join(ROOT, '.claude/skills', skill, 'SKILL.md'));
    if (!has) ok = false;
    line(has, `skill ${skill}${has ? '' : ' missing in .claude/skills/'} — ${{ 'video-studio': 'the director (routes every video request)', reelkit: 'shot components + the render', 'animate-in-code': 'canvas films' }[skill]}`);
  }
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); line(true, 'ffmpeg'); } catch { ok = false; line(false, 'ffmpeg not found'); }
  const hosts = [...HOSTS, ['registry.npmjs.org', 'npm: installs reelkit-cli', !reelkitVersion()]];
  await Promise.all(hosts.map(async ([host, why, required]) => {
    // The cloud egress proxy answers blocked hosts itself with 403 + x-deny-reason.
    const reachable = await fetch(`https://${host}/`, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
      .then((r) => !r.headers.get('x-deny-reason'), () => false);
    if (!reachable && required) ok = false;
    line(reachable, `${host} ${reachable ? 'reachable' : `BLOCKED by network policy${required ? '' : ' (optional)'}`} — ${why}`);
  }));
  console.log(ok ? '\nREADY' : '\nNOT READY — fix the ✖ items above (environment settings → Edit)');
  if (!ok) process.exitCode = 2;
}

const NO_EP = ['init', 'doctor', 'languages', 'voices', 'search-videos', 'search-font', 'search-photos', 'search-pexels', 'search-pixabay', 'search-logo', 'search-images', 'search-icons', 'search-music', 'search-sfx'];

async function main() {
  const [cmd, a, ...rest] = process.argv.slice(2);
  const ep = a && !NO_EP.includes(cmd) ? episodePaths(a) : null;
  if (ep && cmd !== 'init') {
    if (!existsSync(ep.dir)) throw new Error(`${ep.dir} not found — "init <name>" creates a project`);
    setProject(ep);
  }
  const flag = (name) => rest.includes(name);
  const opt = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined);
  const json = (x) => console.log(JSON.stringify(x, null, 2));

  switch (cmd) {
    case 'doctor': return doctor();
    case 'init': return init(a, { lang: opt('--lang'), aspect: opt('--aspect'), seconds: opt('--seconds'), voice: opt('--voice'), title: opt('--title') });
    case 'languages':
      for (const [code, l] of Object.entries(languages())) if (code !== '_default') console.log(`${code.padEnd(3)} ${l.name.padEnd(20)} ${l.languageCode.padEnd(7)} ${l.rtl ? 'RTL' : 'LTR'}  font ${typeof l.font === 'object' ? `${l.font.google} (Google)` : l.font ?? 'montserrat'}  whisper ${l.whisperModel ?? languages()._default.whisperModel}`);
      return console.log('Any other language: use its ISO code — Gemini TTS + Whisper large-v3-turbo cover ~70 languages; set project.json → voice.languageCode and concept.font (a Google family for its script).');
    case 'voices': return json(config.voice().voices ?? readJson(join(ROOT, 'config/voice.json')).voices);
    case 'search-videos': return json(await searchVideos(a, { orientation: rest[0] }));
    case 'search-font': return json(await findGoogleFont(a));
    case 'fonts': return prepareFonts(ep);
    case 'clips': return prepareClips(ep, { only: opt('--only') });
    case 'status': return status(ep);
    case 'approve': return approve(ep, rest[0], rest.slice(1).join(' '));
    case 'search-photos': return json(await searchPhotos(a));
    case 'search-pexels': return json(await searchPexelsPhotos(a));
    case 'search-pixabay': return json(await searchPixabayImages(a, { kind: rest[0] ?? 'all' }));
    case 'search-logo': return json(await searchCommonsImages(a, { logo: true }));
    case 'search-images': return json(await searchCommonsImages(a));
    case 'search-icons': return json(await searchIcons(a));
    case 'search-music': return json(await searchFreesound(a, { kind: 'music' }));
    case 'search-sfx': return json(await searchFreesound(a, { kind: 'sfx' }));
    case 'voice': return generateVoice(ep, { force: flag('--force') });
    case 'source': return prepareSource(ep, rest[0]?.startsWith('--') ? undefined : rest[0], { maxPause: opt('--max-pause'), keepPauses: flag('--keep-pauses'), rewriteScript: flag('--rewrite-script') });
    case 'shots': return shots(ep);
    case 'elements': return prepareElements(ep, { only: opt('--only') });
    case 'canvas': return renderCanvasShots(ep, { only: opt('--only'), gridOnly: flag('--grid-only') });
    case 'blender': return renderBlenderShots(ep, { only: opt('--only'), gridOnly: flag('--grid-only'), quality: opt('--quality') ?? 'final' });
    case 'overlays': return prepareOverlays(ep, { only: opt('--only') });
    case 'audio': return prepareAudio(ep);
    case 'credits': return credits(ep);
    case 'music': requireApproval(ep, 'plan'); return music(ep, rest[0]);
    case 'timeline': return buildReelkitProject(ep);
    case 'frames':
      // Prepares everything produce would (cheap, cached), then only stills — no full render.
      requireApproval(ep, 'plan');
      await prepare(ep);
      return previewFrames(ep);
    case 'preview': requireApproval(ep, 'plan'); await localMusic(ep); return renderReelkit(ep, { kind: 'preview' });
    case 'produce':
      requireApproval(ep, 'plan');
      if (flag('--final')) requireApproval(ep, 'preview');
      await prepare(ep);
      credits(ep);
      return flag('--final') ? final(ep) : renderReelkit(ep, { kind: 'preview' });
    case 'final': return final(ep);
    case 'cleanup': return cleanup(ep);
    default: console.log(HELP);
  }
}

main().catch((err) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
