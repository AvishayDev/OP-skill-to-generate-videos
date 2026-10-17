// Blender shots — the blender-3d skill (.claude/skills/blender-3d). A shot with `"skill": "blender"` is a Python
// file (projects/<name>/shots/<id>.py, or `file`) defining build(k) with the skill's toykit (glossy toy characters,
// the bus, toy-town sets, camera, 3D words). This module writes the shot's spec (length, fps, cues, words, its
// start in the voice track for lip sync, palette, fonts), runs Blender headless (Cycles on the CPU), and encodes a
// silent clip of exactly the shot's frames → projects/<name>/clips/<id>.mp4, played by the Reelkit timeline in the
// shot's slot like a canvas clip. Frames render into projects/<name>/blender/<id>-<hash>/ and an interrupted render
// continues where it stopped. `--grid-only` renders a few stills → frames/<id>-grid.jpg (Read it before the long render).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ROOT, config, readJson, readJsonIfExists, writeJson, run } from '../lib.mjs';
import { readShots } from '../assets/images.mjs';
import { resolveShots } from '../video/slots.mjs';

const SKILL = join(ROOT, '.claude/skills/blender-3d');

export function blenderConfig() {
  const b = config.video().blender ?? {};
  return { version: b.version ?? '4.5.14', engine: b.engine ?? 'cycles', fps: b.fps, quality: b.quality ?? {} };
}

export function findBlender({ install = true } = {}) {
  if (process.env.BLENDER && existsSync(process.env.BLENDER)) return process.env.BLENDER;
  const bin = `/opt/blender-${blenderConfig().version}-linux-x64/blender`;
  if (existsSync(bin)) return bin;
  if (!install) return null;
  console.log('Blender is not installed — installing the pinned LTS…');
  execFileSync('bash', [join(SKILL, 'install.sh')], { stdio: 'inherit' });
  if (!existsSync(bin)) throw new Error(`Blender install failed (${bin} missing) — see ${join(SKILL, 'install.sh')}`);
  return bin;
}

function skillSources() {
  const h = createHash('sha256');
  for (const f of ['render_shot.py', ...readdirSync(join(SKILL, 'toykit')).filter((x) => x.endsWith('.py')).sort().map((x) => `toykit/${x}`)]) {
    h.update(f).update(readFileSync(join(SKILL, f)));
  }
  return h.digest('hex');
}

// Runs Blender, echoing only the useful lines (build, progress every ~5 %, errors).
function runBlender(bin, specFile, label) {
  return new Promise((ok, bad) => {
    const p = spawn(bin, ['-b', '--factory-startup', '-noaudio', '-P', join(SKILL, 'render_shot.py'), '--', specFile], { stdio: ['ignore', 'pipe', 'pipe'] });
    let total = 0, tail = [], t0 = Date.now(), last = 0;
    const onLine = (line) => {
      tail.push(line); if (tail.length > 40) tail.shift();
      let m;
      if (/^BUILD|^FRAMES/.test(line)) { console.log(`Blender ${label}: ${line}`); m = line.match(/^FRAMES (\d+) · (\d+)/); if (m) total = +m[1] - +m[2]; }
      else if ((m = line.match(/^FRAME \d+ (\d+)\/(\d+) ([\d.]+)s/))) {
        const i = +m[1], n = +m[2];
        if (i === 1 || i === n || i - last >= Math.max(1, Math.round(n / 20))) {
          last = i; const per = (Date.now() - t0) / 1000 / i;
          console.log(`Blender ${label}: frame ${i}/${n} · ${m[3]}s · ~${Math.round(per * (n - i) / 60)} min left`);
        }
      } else if (/Error|Traceback|SystemExit/.test(line)) console.log(`Blender ${label}: ${line}`);
    };
    for (const s of [p.stdout, p.stderr]) {
      let buf = '';
      s.on('data', (d) => { buf += d; const lines = buf.split('\n'); buf = lines.pop(); lines.forEach(onLine); });
    }
    p.on('close', (code) => (code === 0 && tail.some((l) => l.startsWith('DONE'))
      ? ok(total) : bad(new Error(`blender shot ${label} failed (exit ${code}):\n${tail.slice(-15).join('\n')}`))));
  });
}

// Renders every blender shot (or `only`) → clips/<id>.mp4, skipping shots whose code, timing and settings did
// not change. quality: config/video.json → blender.quality.<final|preview|grid> ({ width, samples, step, stills }).
// Blender renders at blender.fps (default 24 — 20 % fewer frames) and each clip is conformed to the film's fps.
// adopt: after an fps/timing change, re-conform the existing clips instead of re-rendering (shot code unchanged).
export async function renderBlenderShots(ep, { only, gridOnly = false, quality = 'final', adopt = false } = {}) {
  const plan = readShots(ep);
  const brand = config.brand();
  const fps = brand.fps;
  const concept = readJsonIfExists(ep.concept, {});
  const assets = readJsonIfExists(ep.assets, { shots: {} });
  const shots = resolveShots(plan, { script: readJson(ep.script), timing: readJson(ep.timing), fps })
    .filter((s) => s.skill === 'blender' && (!only || s.id === only));
  assets.blender ??= {};
  if (!shots.length) return assets;
  const bin = findBlender();
  const cfg = blenderConfig();
  const q = { width: 960, samples: 6, step: 1, stills: 6, ...(cfg.quality[gridOnly ? 'grid' : quality] ?? {}) };
  const width = Math.round(q.width / 2) * 2, height = Math.round((q.width * brand.height) / brand.width / 2) * 2;
  const fonts = Object.fromEntries(Object.entries(assets.fonts ?? {}).map(([fam, a]) => [fam, [...(a.files ?? [{ file: a.file, weight: 400 }])].sort((x, y) => (y.weight ?? 0) - (x.weight ?? 0))[0].file]));
  const voiceWav = join(ep.audioDir, 'voice.wav');
  const root = join(ep.dir, 'blender');
  mkdirSync(root, { recursive: true }); mkdirSync(ep.clipsDir, { recursive: true }); mkdirSync(ep.framesDir, { recursive: true });
  const src = skillSources();
  const renderFps = cfg.fps ?? fps;
  for (const shot of shots) {
    const shotFile = resolve(ep.dir, shot.file ?? `shots/${shot.id}.py`);
    if (!existsSync(shotFile)) throw new Error(`blender shot ${shot.id}: ${shotFile} not found`);
    const spec = {
      id: shot.id, shotFile, fps: renderFps, frames: Math.max(1, Math.round((shot.frames / fps) * renderFps)), start: shot.from / fps, width, height,
      engine: cfg.engine, samples: q.samples, step: gridOnly ? 1 : q.step, stills: q.stills,
      cues: Object.fromEntries(Object.entries(shot.cues).map(([k, c]) => [k, c.f / fps])),
      words: shot.words.map(({ word, t, end }) => ({ word, t, end })),
      palette: concept.palette ?? {}, fonts, voiceWav: existsSync(voiceWav) ? voiceWav : null,
      params: shot.params ?? {},
    };
    const hash = createHash('sha256').update(JSON.stringify(spec)).update(readFileSync(shotFile)).update(src).digest('hex').slice(0, 12);
    const out = join(ep.clipsDir, `${shot.id}.mp4`);
    const raw = join(ep.clipsDir, `${shot.id}.raw.mp4`);
    const conform = (input, inputArgs) => run('ffmpeg', ['-y', '-v', 'error', ...inputArgs, '-i', input,
      '-vf', `scale=${brand.width}:${brand.height}:flags=lanczos,fps=${fps},tpad=stop_mode=clone:stop_duration=2`, '-frames:v', String(shot.frames),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', '-r', String(fps), '-an', out]);
    if (!gridOnly && assets.blender[shot.id]?.hash === hash && existsSync(out)) { console.log(`Blender ${shot.id}: unchanged → ${out}`); continue; }
    if (!gridOnly && adopt && (existsSync(raw) || existsSync(out))) {
      if (!existsSync(raw)) run('mv', [out, raw]);
      conform(raw, []);
      assets.blender[shot.id] = { file: out, frames: shot.frames, hash, raw };
      writeJson(ep.assets, assets);
      console.log(`Blender ${shot.id}: adopted the existing render → ${out}`);
      continue;
    }
    const dir = join(root, `${shot.id}-${gridOnly ? 'grid-' : ''}${hash}`);
    for (const d of readdirSync(root)) if (d.startsWith(`${shot.id}-${gridOnly ? 'grid-' : ''}`) && d !== `${shot.id}-${gridOnly ? 'grid-' : ''}${hash}` && !(!gridOnly && d.startsWith(`${shot.id}-grid-`))) rmSync(join(root, d), { recursive: true, force: true });
    const specFile = join(root, `${shot.id}${gridOnly ? '-grid' : ''}.json`);
    writeJson(specFile, { ...spec, mode: gridOnly ? 'grid' : 'frames', out: dir });
    await runBlender(bin, specFile, shot.id);
    if (gridOnly) {
      const sheet = join(ep.framesDir, `${shot.id}-grid.jpg`);
      const n = readdirSync(dir).filter((f) => /^\d+\.png$/.test(f)).length;
      run('ffmpeg', ['-y', '-v', 'error', '-pattern_type', 'glob', '-i', join(dir, '[0-9]*.png'), '-vf', `scale=480:-2,tile=3x${Math.ceil(n / 3)}:padding=4`, '-frames:v', '1', sheet]);
      console.log(`Blender ${shot.id}: contact sheet → ${sheet}`);
      continue;
    }
    // keep the render at its own fps (raw), then conform it to the film's fps and exact frame count
    run('ffmpeg', ['-y', '-v', 'error', '-framerate', String(renderFps / spec.step), '-pattern_type', 'glob', '-i', join(dir, '[0-9]*.png'),
      '-vf', `fps=${renderFps}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '14', '-preset', 'medium', '-an', raw]);
    conform(raw, []);
    assets.blender[shot.id] = { file: out, frames: shot.frames, hash, raw };
    writeJson(ep.assets, assets);
    rmSync(dir, { recursive: true, force: true });
    console.log(`Blender ${shot.id}: ${shot.frames} frames → ${out}`);
  }
  writeJson(ep.assets, assets);
  return assets;
}
