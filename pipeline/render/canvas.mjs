// Canvas shots — the animate-in-code skill (.claude/skills/animate-in-code). A shot with
// `"skill": "canvas"` is a Canvas 2D film file (projects/<name>/shots/<id>.js) that calls
// shotFilm({ setup, draw }). This module wraps it in a page with the skill's runtime.js and fonts,
// the shot's timing (its length, word cues, words), the concept palette and its images, renders every
// frame in headless Chrome and encodes a silent clip of exactly the shot's frames →
// projects/<name>/clips/<id>.mp4. The Reelkit timeline then plays that clip in the shot's slot,
// under the same captions, motif and sound as every other shot.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { ROOT, config, readJson, readJsonIfExists, writeJson, run } from '../lib.mjs';
import { readShots } from '../assets/images.mjs';
import { resolveShots } from '../video/slots.mjs';

const SKILL = join(ROOT, '.claude/skills/animate-in-code/studio');
const HELPERS = join(ROOT, 'pipeline/render/canvas/helpers.js');

// puppeteer-core ships with reelkit-cli (already installed for the render), so the pipeline
// needs no npm dependency of its own.
async function puppeteer() {
  const tries = [join(ROOT, 'package.json')];
  try { tries.push(join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'reelkit-cli', 'package.json')); } catch { /* no npm */ }
  for (const base of tries) {
    try { return (await import(pathToFileURL(createRequire(base).resolve('puppeteer-core')).href)).default; } catch { /* next */ }
  }
  throw new Error('puppeteer-core not found — install reelkit-cli (it ships it) or run: npm i puppeteer-core');
}

// Any Chrome works for Canvas 2D (no video decoding needed): $CHROME, Reelkit's headless shell,
// or the container's preinstalled Playwright Chromium.
export function findChrome() {
  if (process.env.CHROME && existsSync(process.env.CHROME)) return process.env.CHROME;
  const found = [];
  const scan = (dir, rel) => { if (!existsSync(dir)) return; for (const v of readdirSync(dir).sort().reverse()) found.push(join(dir, v, rel)); };
  scan(join(homedir(), '.cache/puppeteer/chrome-headless-shell'), 'chrome-headless-shell-linux64/chrome-headless-shell');
  scan(join(homedir(), '.cache/puppeteer/chrome'), 'chrome-linux64/chrome');
  for (const v of existsSync('/opt/pw-browsers') ? readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium')).sort().reverse() : []) {
    found.push(join('/opt/pw-browsers', v, 'chrome-linux/chrome'), join('/opt/pw-browsers', v, 'chrome-linux/headless_shell'));
  }
  found.push('/usr/bin/google-chrome', '/usr/bin/chromium');
  const hit = found.find((f) => existsSync(f));
  if (!hit) throw new Error('No Chrome found for canvas shots — set CHROME=/path/to/chrome');
  return hit;
}

const fam = (f) => (typeof f === 'object' && f ? f.google : f);
const dataUrl = (file) => `data:image/png;base64,${readFileSync(file).toString('base64')}`;

// The page for one shot: fonts → globals → helpers → the skill's runtime → the shot's film code.
export function shotPage(ep, shot, { fps, concept, assets, width = 1080, height = 1920, rtl = false }) {
  const file = resolve(ep.dir, shot.file ?? `shots/${shot.id}.js`);
  if (!existsSync(file)) throw new Error(`canvas shot ${shot.id}: ${file} not found`);
  const images = {};
  for (const id of shot.images ?? []) {
    const a = assets.elements?.[id];
    if (!a?.file) throw new Error(`canvas shot ${shot.id}: image "${id}" is not prepared — run "elements" first`);
    images[id] = dataUrl(a.file);
  }
  const SHOT = {
    id: shot.id, dur: shot.frames / fps, frames: shot.frames, concept: { name: concept.name, canvasFont: concept.canvasFont, font: fam(concept.font), bodyFont: fam(concept.bodyFont), ground: concept.ground ?? {} },
    cue: Object.fromEntries(Object.entries(shot.cues).map(([k, c]) => [k, c.f / fps])),
    words: shot.words.map(({ word, t, end }) => ({ word, t, end })),
  };
  const globals = `const W = ${width}, H = ${height}, RTL = ${rtl}, FPS = ${fps}, DUR = ${shot.frames / fps}, NDRAW = ${shot.frames};
const SHOT = ${JSON.stringify(SHOT)};
const PAL = ${JSON.stringify(concept.palette ?? {})};
const IMAGE_DATA = ${JSON.stringify(images)};
const CUSTOM_FONTS = ${JSON.stringify(Object.entries(assets.fonts ?? {}).flatMap(([family, a]) => (a.files ?? []).map((x) => ({ family, weight: String(x.weight), data: `data:font/ttf;base64,${readFileSync(x.file).toString('base64')}` }))))};`;
  const src = (f) => `<script src="${pathToFileURL(f).href}"></script>`;
  return {
    file,
    html: `<!doctype html><html><head><meta charset="utf-8"><title>${shot.id}</title></head><body>
${src(join(SKILL, 'fonts-data.js'))}
<script>${globals}</script>
${src(HELPERS)}
${src(join(SKILL, 'runtime.js'))}
${(shot.kits ?? []).map((k) => src(join(SKILL, k))).join('\n')}
${src(file)}
</body></html>`,
  };
}

// Renders every canvas shot (or `only`) to clips/<id>.mp4, skipping shots whose code, timing,
// palette and images did not change. `grid` = also (or only, with gridOnly) a contact sheet of n frames
// → frames/<id>-grid.jpg to Read.
export async function renderCanvasShots(ep, { only, grid = 12, gridOnly = false } = {}) {
  const plan = readShots(ep);
  const brand = config.brand();
  const fps = brand.fps;
  const concept = readJsonIfExists(ep.concept, {});
  const assets = readJsonIfExists(ep.assets, { shots: {} });
  const shots = resolveShots(plan, { script: readJson(ep.script), timing: readJson(ep.timing), fps })
    .filter((s) => s.skill === 'canvas' && (!only || s.id === only));
  assets.canvas ??= {};
  if (!shots.length) return assets;
  const pageDir = join(ep.dir, 'canvas');
  mkdirSync(pageDir, { recursive: true });
  mkdirSync(ep.clipsDir, { recursive: true });
  mkdirSync(ep.framesDir, { recursive: true });
  const pptr = await puppeteer();
  const browser = await pptr.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-web-security'] });
  try {
    for (const shot of shots) {
      const { file, html } = shotPage(ep, shot, { fps, concept, assets, width: brand.width, height: brand.height, rtl: brand.rtl });
      const hash = createHash('sha256').update(html).update(readFileSync(file)).update(readFileSync(HELPERS)).digest('hex').slice(0, 16);
      const out = join(ep.clipsDir, `${shot.id}.mp4`);
      const page = join(pageDir, `${shot.id}.html`);
      writeFileSync(page, html);
      const fresh = assets.canvas[shot.id]?.hash === hash && existsSync(out);
      if (fresh && !gridOnly) { console.log(`Canvas ${shot.id}: unchanged → ${out}`); continue; }

      const tab = await browser.newPage();
      const errors = [];
      tab.on('pageerror', (e) => errors.push(String(e)));
      tab.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      const url = pathToFileURL(page); url.searchParams.set('bare', '1');
      await tab.goto(url.href, { waitUntil: 'load' });
      await tab.waitForFunction('window.__ready === true || !!window.__error', { timeout: 120_000 });
      const err = await tab.evaluate(() => window.__error);
      if (err || errors.length) throw new Error(`canvas shot ${shot.id}: ${err || errors.join('\n')}`);
      if (grid) {
        const sheet = join(ep.framesDir, `${shot.id}-grid.jpg`);
        const jpg = await tab.evaluate((n) => window.__grid(n), Math.min(grid, shot.frames));
        writeFileSync(sheet, Buffer.from(jpg.slice(jpg.indexOf(',') + 1), 'base64'));
        console.log(`Canvas ${shot.id}: contact sheet → ${sheet}`);
      }
      if (!gridOnly) {
        const dir = join(pageDir, `${shot.id}-frames`);
        rmSync(dir, { recursive: true, force: true });
        mkdirSync(dir, { recursive: true });
        const t0 = Date.now();
        for (let i = 0; i < shot.frames; i++) {
          const png = await tab.evaluate((k) => window.__frame(k), i);
          writeFileSync(join(dir, `${String(i).padStart(5, '0')}.png`), Buffer.from(png.slice(png.indexOf(',') + 1), 'base64'));
          if (errors.length) throw new Error(`canvas shot ${shot.id} frame ${i}: ${errors.join('\n')}`);
        }
        run('ffmpeg', ['-y', '-v', 'error', '-framerate', String(fps), '-i', join(dir, '%05d.png'), '-frames:v', String(shot.frames),
          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'veryfast', '-r', String(fps), '-an', out]);
        rmSync(dir, { recursive: true, force: true });
        assets.canvas[shot.id] = { file: out, frames: shot.frames, hash };
        console.log(`Canvas ${shot.id}: ${shot.frames} frames (${((Date.now() - t0) / shot.frames).toFixed(0)} ms/frame) → ${out}`);
      }
      await tab.close();
    }
  } finally { await browser.close(); }
  writeJson(ep.assets, assets);
  return assets;
}
