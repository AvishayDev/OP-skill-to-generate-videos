// Prepared clips: shots whose picture is a video file rather than code drawn by the pipeline.
//
//   "skill": "footage"  a stock video (Pexels / Pixabay / any https URL with a free licence), downloaded,
//                       trimmed from `video.start`, cropped to the frame and treated like the concept's images.
//                       The source is looped when it is shorter than the shot.
//   "skill": "clip"     a video another skill rendered (Manim, HyperFrames, Remotion, Lottie, Blender, ffmpeg…)
//                       at `file` (default clips-src/<id>.mp4). `shots` prints each shot's exact frames/seconds:
//                       render it to that length. A shorter clip holds its last frame, a longer one is cut.
//
// Both are conformed to the film's size, frame rate and the shot's exact frame count, silent, →
// projects/<name>/clips/<id>.mp4, and play in the shot's slot under the captions, motif and sound.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { config, readJson, readJsonIfExists, writeJson, run, requireEnv, probeDuration } from '../lib.mjs';
import { readShots, downloadHttp } from '../assets/images.mjs';
import { resolveShots } from '../video/slots.mjs';

// ---------- search ----------

export async function searchPexelsVideos(query, { perPage = 8, orientation } = {}) {
  const { PEXELS_API_KEY } = requireEnv('PEXELS_API_KEY');
  const params = { query, per_page: perPage, ...(orientation ? { orientation } : {}) };
  const res = await fetch(`https://api.pexels.com/videos/search?${new URLSearchParams(params)}`, { headers: { authorization: PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels videos ${res.status}: ${await res.text()}`);
  const { videos } = await res.json();
  return videos.map((v) => {
    const files = (v.video_files ?? []).filter((f) => f.file_type === 'video/mp4').sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const pick = files.find((f) => Math.max(f.width, f.height) <= 1920) ?? files[0];
    return {
      source: { type: 'pexels', url: pick?.link }, width: pick?.width, height: pick?.height, duration: v.duration,
      page: v.url, license: 'Pexels licence', credit: `${v.user?.name ?? 'Unknown'} / Pexels`,
    };
  });
}

export async function searchPixabayVideos(query, { perPage = 8 } = {}) {
  const { PIXABAY_API_KEY } = requireEnv('PIXABAY_API_KEY');
  const params = new URLSearchParams({ key: PIXABAY_API_KEY, q: query.slice(0, 100), per_page: String(Math.max(3, perPage)), safesearch: 'true' });
  const res = await fetch(`https://pixabay.com/api/videos/?${params}`);
  if (!res.ok) throw new Error(`Pixabay videos ${res.status}: ${await res.text()}`);
  const { hits } = await res.json();
  return hits.map((h) => {
    const v = h.videos?.large?.url ? h.videos.large : h.videos?.medium ?? h.videos?.small;
    return {
      source: { type: 'pixabay', url: v?.url }, width: v?.width, height: v?.height, duration: h.duration, alt: h.tags,
      page: h.pageURL, license: 'Pixabay licence', credit: `${h.user ?? 'Unknown'} / Pixabay`,
    };
  });
}

// Both libraries at once (whichever keys are set).
export async function searchVideos(query, opts = {}) {
  const out = [];
  for (const [name, fn] of [['pexels', searchPexelsVideos], ['pixabay', searchPixabayVideos]]) {
    try { out.push(...await fn(query, opts)); } catch (e) { console.warn(`(${name}: ${e.message.split('\n')[0]})`); }
  }
  return out.filter((v) => v.source.url);
}

// ---------- conform ----------

// ffmpeg filter for the concept's image treatment, applied to moving pictures.
export function videoTreatment(treat = 'none') {
  switch (treat) {
    case 'bw': return 'hue=s=0,eq=contrast=1.12';
    case 'warm': return 'colorbalance=rs=0.08:gs=0.02:bs=-0.08,eq=saturation=0.9';
    case 'cool': return 'colorbalance=rs=-0.06:bs=0.08,eq=saturation=0.9';
    case 'muted': return 'eq=saturation=0.55:contrast=1.05';
    case 'grain': return 'noise=alls=14:allf=t';
    default: return null;
  }
}

// The ffmpeg arguments that turn `src` into exactly `frames` frames of width×height at fps.
// fit "cover" crops to fill; "contain" letterboxes on `pad` (the concept's ground colour).
export function conformArgs(src, out, { width, height, fps, frames, start = 0, loop = false, fit = 'cover', pad = '#000000', treat = 'none' }) {
  const scale = fit === 'contain'
    ? `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${pad.replace('#', '0x')}`
    : `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
  const filters = [scale, 'setsar=1', `fps=${fps}`, videoTreatment(treat), `tpad=stop_mode=clone:stop=-1`].filter(Boolean).join(',');
  return ['-y', '-v', 'error', ...(loop ? ['-stream_loop', '-1'] : []), ...(start ? ['-ss', String(start)] : []), '-i', src,
    '-vf', filters, '-frames:v', String(frames), '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'veryfast', '-r', String(fps), out];
}

const hashOf = (...parts) => createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 16);

// Downloads + conforms every footage/clip shot (or `only`), skipping unchanged ones.
export async function prepareClips(ep, { only } = {}) {
  const plan = readShots(ep);
  const brand = config.brand();
  const concept = readJsonIfExists(ep.concept, {});
  const assets = readJsonIfExists(ep.assets, {});
  assets.clips ??= {};
  const shots = resolveShots(plan, { script: readJson(ep.script), timing: readJson(ep.timing), fps: brand.fps })
    .filter((s) => (s.skill === 'footage' || s.skill === 'clip') && (!only || s.id === only));
  if (!shots.length) return assets;
  mkdirSync(ep.clipsDir, { recursive: true });
  const videos = Object.fromEntries((plan.videos ?? []).map((v) => [v.id, v]));
  for (const shot of shots) {
    let src;
    let opts = { width: brand.width, height: brand.height, fps: brand.fps, frames: shot.frames, fit: shot.fit ?? 'cover', pad: concept.palette?.bg ?? '#000000' };
    if (shot.skill === 'footage') {
      const v = typeof shot.video === 'string' ? videos[shot.video] : shot.video;
      if (!v?.source?.url) throw new Error(`footage shot ${shot.id}: "video" must name an entry of shots.json → videos (or be { source: { url } })`);
      if (!v.license) throw new Error(`footage shot ${shot.id}: record the video's licence, credit and page`);
      const dir = join(ep.dir, 'footage');
      mkdirSync(dir, { recursive: true });
      src = join(dir, `${hashOf(v.source.url)}${extname(new URL(v.source.url).pathname) || '.mp4'}`);
      if (!existsSync(src)) { console.log(`Footage ${shot.id}: downloading ${v.source.url}`); await downloadHttp(v.source.url, src); }
      opts = { ...opts, start: v.start ?? shot.start ?? 0, loop: true, treat: shot.treat ?? v.treat ?? concept.imageTreatment ?? 'none' };
    } else {
      src = resolve(ep.dir, shot.file ?? `clips-src/${shot.id}.mp4`);
      if (!existsSync(src)) throw new Error(`clip shot ${shot.id}: ${src} not found — render it first (its length: ${(shot.frames / brand.fps).toFixed(2)} s = ${shot.frames} frames at ${brand.fps} fps, ${brand.width}×${brand.height})`);
      opts = { ...opts, start: shot.start ?? 0, treat: shot.treat ?? 'none' };
      const have = probeDuration(src);
      if (have + 0.05 < shot.frames / brand.fps) console.warn(`⚠ clip ${shot.id}: ${have.toFixed(2)}s, the slot is ${(shot.frames / brand.fps).toFixed(2)}s — its last frame is held`);
    }
    const out = join(ep.clipsDir, `${shot.id}.mp4`);
    const hash = hashOf(opts, src, shot.skill === 'clip' ? readFileSync(src).length : 0);
    if (assets.clips[shot.id]?.hash === hash && existsSync(out)) { console.log(`Clip ${shot.id}: unchanged → ${out}`); continue; }
    run('ffmpeg', conformArgs(src, out, opts));
    assets.clips[shot.id] = { file: out, frames: shot.frames, hash };
    console.log(`Clip ${shot.id} (${shot.skill}): ${shot.frames} frames → ${out}`);
  }
  writeJson(ep.assets, assets);
  return assets;
}
