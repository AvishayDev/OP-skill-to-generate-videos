// render.mjs · turns one film HTML into an MP4 with its synthesized score.
// E.Y. AI · animate-in-code. Needs Node 22+, Google Chrome and ffmpeg.
//
//   node render.mjs film.html                 full render → out/<name>.mp4 (+ loudness-normalized audio)
//   node render.mjs film.html --grid 24       contact sheet of 24 evenly spaced frames → out/<name>-grid.jpg
//   node render.mjs film.html --only 0,90     just those frames as PNG → out/<name>-frames/
//   node render.mjs film.html --strip 40,12   12 consecutive frames from 40 → out/<name>-strip-40.jpg
//   options: --out DIR  --width 540 (faster drafts)  --keep-frames (keep PNGs with alpha, for overlays)
//
// The film page must expose: __ready, __NDRAW, __fps, __size, __frame(i) → PNG data URL,
// __grid(n), __strip(a, n), __wav() → base64 WAV. runtime.js provides all of them.
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const file = argv.find(a => a.endsWith('.html'));
if (!file) { console.error('usage: node render.mjs film.html [--grid N | --only a,b | --strip a,n] [--out dir] [--width W] [--keep-frames]'); process.exit(1); }
const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const name = path.basename(file, '.html');
const out = path.resolve(opt('--out') || path.join(path.dirname(file), 'out'));
const framesDir = path.join(out, `${name}-frames`);
mkdirSync(out, { recursive: true });

const chrome = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!chrome) { console.error('Chrome not found. Set CHROME=/path/to/chrome'); process.exit(1); }
const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const b64 = (f, dataUrl) => writeFileSync(f, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));

const url = pathToFileURL(path.resolve(file)); url.searchParams.set('bare', '1');
if (opt('--width')) url.searchParams.set('w', opt('--width'));

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const errors = [];
let meta;
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url.href, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true || !!window.__error', { timeout: 120000 });
  meta = await page.evaluate(() => ({ N: window.__NDRAW, fps: window.__fps, size: window.__size, err: window.__error }));
  if (meta.err || errors.length) throw new Error(meta.err || errors.join('\n'));
  console.log(`${name}: ${meta.N} frames @ ${meta.fps} fps, ${meta.size.w}x${meta.size.h}`);

  if (opt('--grid')) { b64(path.join(out, `${name}-grid.jpg`), await page.evaluate(n => window.__grid(n), +opt('--grid'))); console.log(`→ ${name}-grid.jpg`); }
  else if (opt('--strip')) { const [a, n] = opt('--strip').split(',').map(Number); b64(path.join(out, `${name}-strip-${a}.jpg`), await page.evaluate((a, n) => window.__strip(a, n), a, n)); console.log(`→ ${name}-strip-${a}.jpg`); }
  else {
    const list = opt('--only') ? opt('--only').split(',').map(Number) : [...Array(meta.N).keys()];
    rmSync(framesDir, { recursive: true, force: true }); mkdirSync(framesDir, { recursive: true });
    const t0 = Date.now();
    for (const [k, i] of list.entries()) {
      b64(path.join(framesDir, String(i).padStart(5, '0') + '.png'), await page.evaluate(i => window.__frame(i), i));
      if (errors.length) throw new Error(`frame ${i}: ${errors.join('\n')}`);
      if ((k + 1) % 48 === 0) process.stdout.write(`  ${k + 1}/${list.length}\r`);
    }
    console.log(`  ${list.length} frames, ${((Date.now() - t0) / list.length).toFixed(0)} ms/frame`);
    if (!opt('--only')) {
      const wav = await page.evaluate(async () => window.__wav ? await window.__wav() : null);
      if (wav) writeFileSync(path.join(out, `${name}.wav`), Buffer.from(wav, 'base64'));
    }
  }
} finally { await browser.close(); }

if (!opt('--grid') && !opt('--strip') && !opt('--only')) {
  const mp4 = path.join(out, `${name}.mp4`), wav = path.join(out, `${name}.wav`), dur = String(meta.N / meta.fps);
  const video = ['-framerate', String(meta.fps), '-i', path.join(framesDir, '%05d.png')];
  if (existsSync(wav)) ff([...video, '-i', wav, '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-t', dur, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', mp4]);
  else ff([...video, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', mp4]);
  if (!argv.includes('--keep-frames')) rmSync(framesDir, { recursive: true, force: true });
  console.log(`→ ${mp4}`);
}
