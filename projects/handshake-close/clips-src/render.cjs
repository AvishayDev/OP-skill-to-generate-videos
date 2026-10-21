// node render.cjs <out.mp4> [--frames t1,t2,…  → PNG stills next to out]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  const out = process.argv[2] ?? 'handshake.mp4';
  const stillsArg = process.argv.indexOf('--frames');
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'handshake.html'));
  await page.evaluate(() => window.ready);
  // --debug: ghost the icon over the hands · --rig: hands only (no tile, no icon)
  await page.evaluate(([d, r]) => { window.DEBUG_OVERLAY = d; window.DEBUG_RIG = r; }, [process.argv.includes('--debug'), process.argv.includes('--rig')]);
  const grab = (t) => page.evaluate((t) => { window.frame(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);

  if (stillsArg > 0) {
    const fs = require('fs');
    for (const t of process.argv[stillsArg + 1].split(',').map(Number)) fs.writeFileSync(`${out}-${t.toFixed(2)}.png`, Buffer.from(await grab(t), 'base64'));
  } else {
    const fps = 60, n = Math.round((await page.evaluate(() => window.DURATION)) * fps);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) ff.stdin.write(Buffer.from(await grab(i / fps), 'base64'));
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }
  await browser.close();
})();
