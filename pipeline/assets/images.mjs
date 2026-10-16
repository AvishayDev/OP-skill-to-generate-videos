// Still images for the shots' elements: search (Pexels photos, Pixabay photos/illustrations/vectors,
// Wikimedia Commons), licence checks, download, and the concept's treatment (black & white, duotone…).
// No video footage is collected any more — every shot is drawn in code (prompts/visuals.md); these
// pictures are only *elements* inside a drawn shot (a framed photo, a logo, a product cut-out).
import { mkdirSync, existsSync, copyFileSync, writeFileSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { config, readJson, readJsonIfExists, writeJson, requireEnv, run, ROOT } from '../lib.mjs';

// ---------- licences ----------
// Allowed: licences free for commercial use, including ones that only ask for a creator mention
// (CC BY, CC BY-SA) — those end up in credits.txt. Never NC (we monetize) or ND (we edit).

// Classifies a licence name → { ok, attribution, shareAlike }. `attribution` = the
// licence requires crediting the creator in the post. Unknown licences are rejected.
export function licenseInfo(name = '', { allowShareAlike = true } = {}) {
  const n = name.toLowerCase().replace(/[-_]/g, ' ');
  const shareAlike = /\bsa\b|share ?alike/.test(n);
  if (!n.trim() || /\b(nc|nd)\b|non ?commercial|no ?deriv|fair use|copyrighted|all rights reserved|gfdl/.test(n)) {
    return { ok: false, attribution: false, shareAlike };
  }
  if (shareAlike && !allowShareAlike) return { ok: false, attribution: true, shareAlike };
  if (/pexels|pixabay|cc0|public domain|^pd\b|\bpd |ai generated|ai image|drawn in code|our own/.test(n)) return { ok: true, attribution: false, shareAlike: false };
  if (/cc by|creative commons|^attribution|official|press|courtesy|screenshot/.test(n)) return { ok: true, attribution: true, shareAlike };
  return { ok: false, attribution: true, shareAlike };
}

// Short licence names from Commons' extmetadata → allowed or not for our use.
export function commonsLicenseOk(shortName = '', opts = {}) {
  return licenseInfo(shortName, opts).ok && !/official|press|courtesy|screenshot|ai /i.test(shortName);
}

const allowShareAlike = () => config.video().licenses?.allowShareAlike ?? true;
const UA = { 'user-agent': 'video-studio/1.0 (code-made short videos)' };
const stripHtml = (s = '') => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// ---------- search ----------
// Every result carries `source`, `license`, `credit` and `page`, ready to paste into shots.json → images.

export async function searchPexelsPhotos(query, { perPage = 10, orientation = 'any' } = {}) {
  const { PEXELS_API_KEY } = requireEnv('PEXELS_API_KEY');
  const params = { query, per_page: perPage };
  if (orientation !== 'any') params.orientation = orientation;
  const res = await fetch(`https://api.pexels.com/v1/search?${new URLSearchParams(params)}`, { headers: { authorization: PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const { photos } = await res.json();
  return photos.map((p) => ({
    source: { type: 'pexels', url: p.src.large2x ?? p.src.original }, width: p.width, height: p.height, alt: p.alt,
    page: p.url, license: 'Pexels licence', credit: `${p.photographer ?? 'Unknown'} / Pexels`,
  }));
}

// kind: photo | illustration | vector (Pixabay's vectors/illustrations are good flat elements).
export async function searchPixabayImages(query, { perPage = 10, kind = 'all' } = {}) {
  const { PIXABAY_API_KEY } = requireEnv('PIXABAY_API_KEY');
  const params = new URLSearchParams({ key: PIXABAY_API_KEY, q: query.slice(0, 100), per_page: String(Math.max(3, perPage)), safesearch: 'true', image_type: kind });
  const res = await fetch(`https://pixabay.com/api/?${params}`);
  if (!res.ok) throw new Error(`Pixabay ${res.status}: ${await res.text()}`);
  const { hits } = await res.json();
  return hits.map((h) => ({
    source: { type: 'pixabay', url: h.largeImageURL ?? h.webformatURL }, width: h.imageWidth, height: h.imageHeight, alt: h.tags, kind: h.type,
    page: h.pageURL, license: 'Pixabay Content License', credit: `${h.user} / Pixabay`,
  }));
}

function commonsRights(page, meta, license) {
  const artist = stripHtml(meta.Artist?.value) || 'Unknown';
  return {
    license, licenseUrl: meta.LicenseUrl?.value, attribution: licenseInfo(license).attribution,
    credit: `"${page.title.replace(/^File:/, '').replace(/\.\w+$/, '')}" by ${artist} / Wikimedia Commons`,
  };
}

// Still images on Commons — logos (`logo: true`, SVGs come back as a PNG render with transparency)
// and photos of products, places, historic objects (public-domain engravings are great elements).
export async function searchCommonsImages(query, { limit = 15, logo = false, width = 1200 } = {}) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: String(limit),
    gsrsearch: `${logo ? 'filetype:drawing|bitmap' : 'filetype:bitmap|drawing'} ${query}${logo ? ' logo' : ''}`,
    prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: String(width),
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: UA });
  if (!res.ok) throw new Error(`Wikimedia Commons ${res.status}: ${await res.text()}`);
  const pages = Object.values((await res.json()).query?.pages ?? {}).sort((a, b) => a.index - b.index);
  return pages.flatMap((p) => {
    const info = p.imageinfo?.[0];
    const meta = info?.extmetadata ?? {};
    const license = meta.LicenseShortName?.value ?? '';
    if (!info || !commonsLicenseOk(license, { allowShareAlike: allowShareAlike() })) return [];
    return [{
      source: { type: 'commons', url: (info.thumburl ?? info.url).replace(/\?utm_.*$/, '') }, title: p.title, mime: info.mime,
      width: info.thumbwidth ?? info.width, height: info.thumbheight ?? info.height, page: info.descriptionurl,
      ...commonsRights(p, meta, license),
    }];
  });
}

// All image libraries at once. A library whose key is missing or whose host is blocked is
// reported in `skipped` instead of failing the whole search.
export async function searchPhotos(query, { perPage = 6 } = {}) {
  const out = { results: [], skipped: {} };
  const libs = {
    pexels: () => searchPexelsPhotos(query, { perPage }),
    pixabay: () => searchPixabayImages(query, { perPage }),
    commons: () => searchCommonsImages(query, { limit: perPage }),
  };
  await Promise.all(Object.entries(libs).map(async ([name, fn]) => {
    try { out.results.push(...(await fn()).map((r) => ({ library: name, ...r }))); } catch (e) { out.skipped[name] = e.message.slice(0, 160); }
  }));
  return out;
}

// ---------- download + treatment ----------

export async function downloadHttp(url, dest) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`Download ${url} failed: ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

export function probeSize(file) {
  const out = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]);
  const [w, h] = out.trim().split(',').map(Number);
  return { w, h };
}

const hex = (c) => {
  const m = String(c).replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) throw new Error(`Not a #rrggbb colour: ${c}`);
  return m.slice(1).map((v) => parseInt(v, 16));
};

// The ffmpeg filter for a treatment. `none` keeps colour; `bw` = high-contrast black & white
// (the vintage-engraving / press-photo look); `duotone` maps dark→ink and light→paper (the
// concept's palette), so every photo of the video shares the same two colours.
export function treatmentFilter(treat = 'none', { ink = '#111111', paper = '#f2efe6', maxSide = 1400, alpha = false } = {}) {
  const scale = `scale='min(${maxSide},iw)':'min(${maxSide},ih)':force_original_aspect_ratio=decrease:flags=lanczos`;
  const fmt = alpha ? 'rgba' : 'rgb24';
  if (treat === 'none') return `${scale},format=${fmt}`;
  if (treat === 'bw') return `${scale},format=${alpha ? 'ya8' : 'gray'},eq=contrast=1.35:brightness=0.03:gamma=0.95,format=${fmt}`;
  if (treat === 'duotone') {
    const [a, b] = [hex(ink), hex(paper)];
    const ch = (i, v) => `${a[i]}+(${b[i] - a[i]})*${v}(X,Y)/255`;
    return `${scale},format=gray,eq=contrast=1.3,format=${fmt},geq=r='${ch(0, 'r')}':g='${ch(1, 'g')}':b='${ch(2, 'b')}'${alpha ? `:a='alpha(X,Y)'` : ''}`;
  }
  throw new Error(`Unknown image treatment "${treat}" (none | bw | duotone)`);
}

export const readShots = (ep) => readJsonIfExists(ep.shots, { images: [], shots: [] });

// Downloads every image in shots.json → images, applies its treatment (default: the concept's
// `imageTreatment`), and records the prepared file + pixel size in assets.json → elements.
export async function prepareElements(ep, { only } = {}) {
  const { images = [] } = readShots(ep);
  const concept = readJsonIfExists(ep.concept, {});
  const assets = readJsonIfExists(ep.assets, { shots: {} });
  assets.elements ??= {};
  mkdirSync(ep.elementsDir, { recursive: true });
  for (const img of images) {
    if (only && img.id !== only) continue;
    const { url, path } = img.source ?? {};
    if (!url && !path) throw new Error(`image ${img.id}: needs source.url or source.path`);
    const srcExt = extname(path ?? new URL(url).pathname).toLowerCase() || '.jpg';
    const raw = join(ep.elementsDir, `${img.id}.src${srcExt}`);
    if (path) copyFileSync(resolve(ROOT, path), raw);
    else if (!existsSync(raw) || assets.elements[img.id]?.src !== url) await downloadHttp(url, raw);
    const treat = img.treat ?? concept.imageTreatment ?? 'none';
    const alpha = img.alpha ?? /\.(png|svg|webp)$/.test(srcExt);
    const out = join(ep.elementsDir, `${img.id}.png`);
    const input = srcExt === '.svg' ? ['-width', '1600', '-keep_ar', '1', '-i', raw] : ['-i', raw];
    run('ffmpeg', ['-y', ...input, '-vf', treatmentFilter(treat, { ink: concept.palette?.ink, paper: concept.palette?.bg, alpha }), '-frames:v', '1', out]);
    const { w, h } = probeSize(out);
    assets.elements[img.id] = { file: out, w, h, src: url ?? path, treat };
    console.log(`Image ${img.id} (${treat}) → ${out} ${w}x${h}`);
  }
  writeJson(ep.assets, assets);
  return assets;
}

export { readJson };
