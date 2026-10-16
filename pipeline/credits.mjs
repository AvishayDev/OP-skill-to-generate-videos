// Credits for the post description (Instagram / YouTube). Images used in the shots, overlays, music and sound
// effects whose licence asks for a creator mention (CC BY, CC BY-SA, official company material) are listed one
// per line with source link + licence — that's what the licences require. Pexels / Pixabay / Freesound CC0 /
// public-domain items get a short thank-you line. The shots themselves are drawn in code (no credit needed).
import { licenseInfo } from './assets/images.mjs';

const CC_URLS = {
  'by': 'https://creativecommons.org/licenses/by/{v}/',
  'by-sa': 'https://creativecommons.org/licenses/by-sa/{v}/',
};

// "CC BY-SA 4.0" → https://creativecommons.org/licenses/by-sa/4.0/
export function ccLicenseUrl(license = '') {
  const m = license.match(/cc by(-sa)?\s*(\d\.\d)/i);
  if (!m) return undefined;
  return CC_URLS[m[1] ? 'by-sa' : 'by'].replace('{v}', m[2]);
}

const pageOf = (item) => item.page ?? (/youtube\.com|youtu\.be/.test(item.source?.url ?? '') ? item.source.url : undefined);

const LIBRARY = /pexels|pixabay|freesound/i;
const LIBRARY_NAMES = { pexels: 'Pexels', pixabay: 'Pixabay', freesound: 'Freesound' };

export function buildCredits({ images = [], overlays = { overlays: [] }, audio = [] } = {}) {
  const items = [...images, ...(overlays.overlays ?? []), ...audio].filter((i) => i.credit || i.license);
  const required = [];
  const thanks = new Map(); // library → Set(names)
  const seen = new Set();

  for (const item of items) {
    const info = licenseInfo(item.license ?? '');
    const needsCredit = item.attribution ?? (info.attribution || !info.ok);
    if (needsCredit) {
      const licenseUrl = item.licenseUrl ?? ccLicenseUrl(item.license);
      const line = [item.credit, item.license && (licenseUrl ? `${item.license} (${licenseUrl})` : item.license), pageOf(item)]
        .filter(Boolean).join(' — ');
      if (!seen.has(line)) { seen.add(line); required.push({ line, shareAlike: info.shareAlike }); }
      continue;
    }
    const lib = ((item.license ?? '').match(LIBRARY) ?? (item.credit ?? '').match(/\/\s*(freesound)$/i))?.at(-1);
    if (lib) {
      const name = LIBRARY_NAMES[lib.toLowerCase()];
      if (!thanks.has(name)) thanks.set(name, new Set());
      const who = (item.credit ?? '').replace(/\s*\/\s*(pexels|pixabay|freesound)$/i, '').replace(/^".*" by /, '').trim();
      if (who && who.toLowerCase() !== lib.toLowerCase()) thanks.get(name).add(who);
    }
  }

  const lines = ['🎬 קרדיטים / Credits'];
  for (const r of required) lines.push(`• ${r.line}`);
  const thanksLine = (libs) => libs.map(([lib, names]) => (names.size ? `${lib} — ${[...names].join(', ')}` : lib)).join(' · ');
  const stock = [...thanks].filter(([lib]) => lib !== 'Freesound');
  if (stock.length) lines.push(`Stock images: ${thanksLine(stock)}`);
  if (thanks.has('Freesound')) lines.push(`Music & sound effects: ${thanksLine([['Freesound', thanks.get('Freesound')]])}`);
  if (required.some((r) => r.shareAlike)) {
    lines.push('Parts of this video use CC BY-SA material and are shared under CC BY-SA 4.0.');
  }
  return { text: `${lines.join('\n')}\n`, requiredCount: required.length, total: items.length };
}
