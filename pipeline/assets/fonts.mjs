// Fonts beyond the Reelkit kit. The kit sets Latin and Hebrew (reelkit/kit → font("…")); any other script
// (Arabic, Cyrillic, Greek, Devanagari, Thai, Japanese, Korean, Chinese…) or any other Google Fonts family is
// downloaded from the Google Fonts repository (OFL / Apache — free to embed, via the Google Fonts CSS API) into fonts/ and loaded
// by Video.tsx with FontFace before the first frame.
//
// concept.json → "font": "bebasNeue" (kit) | "Cairo" (Google family) | { "google": "Noto Sans JP" }
// Without a concept font the language's default from config/languages.json is used.
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { config, language, readJsonIfExists, writeJson } from '../lib.mjs';
import { downloadHttp } from './images.mjs';
import { kitFonts } from '../render/reelkit.mjs';

const CSS = 'https://fonts.googleapis.com/css2';
const WEIGHTS = [400, 700, 900];
const fontName = (f) => (typeof f === 'object' && f ? f.google : f);

// The family's TrueType files from the Google Fonts CSS API (one per weight it has, full character set).
export async function findGoogleFont(family) {
  const files = [];
  for (const weight of WEIGHTS) {
    const res = await fetch(`${CSS}?family=${encodeURIComponent(family)}:wght@${weight}`);
    if (!res.ok) continue; // that weight doesn't exist
    const url = (await res.text()).match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1];
    if (url && !files.some((f) => f.url === url)) files.push({ weight, url });
  }
  if (!files.length) {
    const res = await fetch(`${CSS}?family=${encodeURIComponent(family)}`);
    const url = res.ok ? (await res.text()).match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1] : null;
    if (url) files.push({ weight: 400, url });
  }
  if (!files.length) throw new Error(`Google font "${family}" not found (check the exact family name on fonts.google.com; hosts fonts.googleapis.com + fonts.gstatic.com must be allowed)`);
  return { family, files, license: 'SIL Open Font License / Apache 2.0 (Google Fonts)', page: `https://fonts.google.com/specimen/${family.replace(/ /g, '+')}` };
}

// Downloads every face the concept needs that the kit lacks → assets.fonts[family] = { file }.
export async function prepareFonts(ep) {
  const concept = readJsonIfExists(ep.concept, {});
  const brand = config.brand();
  const lang = language(brand.language ?? 'en');
  const wanted = new Set([fontName(concept.font) ?? fontName(lang.font), fontName(concept.bodyFont)].filter(Boolean));
  const kit = kitFonts();
  const assets = readJsonIfExists(ep.assets, {});
  assets.fonts ??= {};
  for (const family of wanted) {
    if (kit.has(family)) continue;
    const a = assets.fonts[family];
    if (a?.files?.every((x) => existsSync(x.file))) continue;
    const f = await findGoogleFont(family);
    const dir = join(ep.dir, 'fonts');
    mkdirSync(dir, { recursive: true });
    const files = [];
    for (const x of f.files) {
      const file = join(dir, `${family.replace(/[^A-Za-z0-9]+/g, '-')}-${x.weight}.ttf`);
      await downloadHttp(x.url, file);
      files.push({ file, weight: x.weight });
    }
    assets.fonts[family] = { file: files[0].file, files, license: f.license, page: f.page };
    console.log(`Font ${family}: weights ${files.map((x) => x.weight).join(', ')} → ${dir}`);
  }
  writeJson(ep.assets, assets);
  return assets;
}
