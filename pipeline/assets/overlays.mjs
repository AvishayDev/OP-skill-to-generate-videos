// Overlays: logos, product/gadget images, numbers and titles that pop in over the
// footage exactly when the voice mentions them. This module prepares the image
// overlays (download → clean PNG at exact pixel size); timeline.mjs places them.
//
// overlays.json → { "overlays": [ { id, segment, anchor, type: logo|image|icon|stat|title, ... } ] }
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { config, readJsonIfExists, writeJson, run, ROOT } from '../lib.mjs';
import { downloadHttp } from './images.mjs';

export const IMAGE_TYPES = new Set(['logo', 'image', 'icon']);
export const TEXT_TYPES = new Set(['stat', 'title']);

export const readOverlays = (ep) => readJsonIfExists(ep.overlays, { overlays: [] });

export function validateOverlays(overlays, script) {
  const segIds = new Set(script.segments.map((s) => s.id));
  const ids = new Set();
  const errors = [];
  for (const o of overlays.overlays ?? []) {
    const where = `overlay ${o.id ?? '(no id)'}`;
    if (!o.id) errors.push(`${where}: missing id`);
    else if (ids.has(o.id)) errors.push(`${where}: duplicate id`);
    ids.add(o.id);
    if (!segIds.has(o.segment)) errors.push(`${where}: unknown segment "${o.segment}"`);
    if (!IMAGE_TYPES.has(o.type) && !TEXT_TYPES.has(o.type)) errors.push(`${where}: type must be logo, image, icon, stat or title`);
    if (IMAGE_TYPES.has(o.type) && !o.source?.url && !o.source?.path) errors.push(`${where}: needs source.url or source.path`);
    if (TEXT_TYPES.has(o.type) && !o.text) errors.push(`${where}: needs text`);
    if (IMAGE_TYPES.has(o.type) && !o.license) errors.push(`${where}: needs license (and credit)`);
  }
  if (errors.length) throw new Error(`overlays.json:\n  ${errors.join('\n  ')}`);
}

function probeSize(file) {
  const out = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]);
  const [w, h] = out.trim().split(',').map(Number);
  return { w, h };
}

// Fit (w, h) inside (maxW, maxH), keeping the aspect ratio; even pixel sizes.
export function fitBox(w, h, maxW, maxH) {
  const s = Math.min(maxW / w, maxH / h);
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  return { w: even(w * s), h: even(h * s) };
}

// Logos default to a white rounded card (dark logos stay readable on any footage);
// images and icons default to "plain" (transparent PNGs keep their shape).
export function renderOverlayPng(rawFile, outFile, { style, maxW, maxH, padding, radius, cardColor }) {
  const isSvg = extname(rawFile).toLowerCase() === '.svg';
  const input = isSvg ? ['-width', '1600', '-keep_ar', '1', '-i', rawFile] : ['-i', rawFile];
  const src = probeSize(rawFile);
  let filter;
  let size;
  if (style === 'card') {
    const logo = fitBox(src.w, src.h, maxW - 2 * padding, maxH - 2 * padding);
    size = { w: logo.w + 2 * padding, h: logo.h + 2 * padding };
    const R = Math.min(radius, Math.floor(size.h / 2));
    const outside = `gt(hypot(max(max(${R}-X,X-(W-1-${R})),0),max(max(${R}-Y,Y-(H-1-${R})),0)),${R})`;
    filter = `[0:v]scale=${logo.w}:${logo.h}:flags=lanczos,format=rgba[l];` +
      `color=c=${cardColor}:s=${size.w}x${size.h}:d=1,format=rgba[bg];` +
      `[bg][l]overlay=(W-w)/2:(H-h)/2:format=auto,` +
      `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(${outside},0,255)'`;
  } else {
    size = fitBox(src.w, src.h, maxW, maxH);
    filter = `[0:v]scale=${size.w}:${size.h}:flags=lanczos,format=rgba`;
  }
  run('ffmpeg', ['-y', ...input, '-filter_complex', filter, '-frames:v', '1', outFile]);
  return size;
}

export async function prepareOverlays(ep, { only } = {}) {
  const data = readOverlays(ep);
  const list = (data.overlays ?? []).filter((o) => IMAGE_TYPES.has(o.type) && (!only || o.id === only));
  const assets = readJsonIfExists(ep.assets, { shots: {} });
  assets.overlays ??= {};
  if (!list.length) return assets;
  const c = config.video().overlays;
  mkdirSync(ep.overlaysDir, { recursive: true });

  for (const o of list) {
    const { url, path } = o.source;
    let raw;
    if (path) {
      const src = resolve(ROOT, path);
      raw = join(ep.overlaysDir, `${o.id}.src${extname(src)}`);
      copyFileSync(src, raw);
    } else {
      const ext = extname(new URL(url).pathname).toLowerCase() || '.png';
      raw = join(ep.overlaysDir, `${o.id}.src${ext}`);
      if (!existsSync(raw) || assets.overlays[o.id]?.src !== url) await downloadHttp(url, raw);
    }
    const box = c.box[o.type];
    const scale = o.scale ?? 1;
    const out = join(ep.overlaysDir, `${o.id}.png`);
    const size = renderOverlayPng(raw, out, {
      style: o.style ?? (o.type === 'logo' ? 'card' : 'plain'),
      maxW: Math.round(box.width * scale), maxH: Math.round(box.height * scale),
      padding: c.card.padding, radius: c.card.radius, cardColor: c.card.color,
    });
    console.log(`Overlay ${o.id} (${o.type}) → ${out} ${size.w}x${size.h}`);
    assets.overlays[o.id] = { file: out, width: size.w, height: size.h, src: url ?? path };
  }
  writeJson(ep.assets, assets);
  return assets;
}
