// node render-ov.mjs <overlay.html> <outdir> <nframes> [fps] [only=t1,t2,...]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
let pw;
try { pw = require('playwright'); } catch { pw = (await import('playwright')).default; }
const [html, out, n, fpsArg, only] = process.argv.slice(2);
const fps = Number(fpsArg || 30);
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + path.resolve(html));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
for (const L of ['B', 'F']) fs.mkdirSync(path.join(out, L), { recursive: true });
const blank = path.join(out, 'blank.png');
await page.evaluate(() => render(-1, 'X'));
await page.screenshot({ path: blank, omitBackground: true });
const times = only ? only.split(',').map(Number) : [...Array(Number(n)).keys()].map(i => i / fps);
let k = 0;
for (const t of times) {
  k++;
  for (const L of ['B', 'F']) {
    const f = path.join(out, L, (only ? `t${t}` : String(k).padStart(4, '0')) + '.png');
    const any = await page.evaluate(([t, L]) => render(t, L), [t, L]);
    if (any) await page.screenshot({ path: f, omitBackground: true });
    else { try { fs.unlinkSync(f); } catch {} fs.linkSync(blank, f); }
  }
  if (k % 100 === 0) console.log(k);
}
await browser.close();
