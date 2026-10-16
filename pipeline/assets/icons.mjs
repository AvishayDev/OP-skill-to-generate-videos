// Small flat icons for overlays (type "icon") — a robot, a chip, a lock… next to the words.
// Default source: Iconify (api.iconify.design) — 200k+ open-licence icons, no key, rendered as
// white SVGs. Flaticon: its API is served by Freepik and needs FREEPIK_API_KEY (flaticon.com
// itself blocks automated access); when that key is set, Flaticon results come first.
import { requireEnv } from '../lib.mjs';

// Icon sets whose licence allows commercial use with (at most) a credit line.
const OK_LICENSES = /^(MIT|Apache-2\.0|ISC|CC0-1\.0|CC-BY-[34]\.0|BSD-[23]-Clause|OFL-1\.1|Unlicense)$/i;

export async function searchIconify(query, { limit = 12, color = '#ffffff' } = {}) {
  const res = await fetch(`https://api.iconify.design/search?${new URLSearchParams({ query, limit: '64' })}`);
  if (!res.ok) throw new Error(`Iconify ${res.status}: ${await res.text()}`);
  const { icons = [], collections = {} } = await res.json();
  const out = [];
  for (const full of icons) {
    const [prefix, name] = full.split(':');
    const set = collections[prefix];
    const spdx = set?.license?.spdx ?? '';
    if (!OK_LICENSES.test(spdx)) continue;
    const license = spdx.startsWith('CC-BY') ? spdx.replace(/^CC-BY-/, 'CC BY ') : spdx;
    out.push({
      type: 'iconify', icon: full, set: set.name,
      url: `https://api.iconify.design/${prefix}/${name}.svg?${new URLSearchParams({ color, height: '512' })}`,
      page: `https://icon-sets.iconify.design/${prefix}/${name}/`,
      license, credit: `"${name}" icon — ${set.name} by ${set.author?.name ?? 'unknown'}`,
    });
    if (out.length >= limit) break;
  }
  return out;
}

// Flaticon through the Freepik API (free icons only; credit "Icon by <author> / Flaticon").
export async function searchFlaticon(query, { limit = 12 } = {}) {
  const { FREEPIK_API_KEY } = requireEnv('FREEPIK_API_KEY');
  const params = new URLSearchParams({ term: query, per_page: String(limit), 'filters[free_svg]': 'free' });
  const res = await fetch(`https://api.freepik.com/v1/icons?${params}`, { headers: { 'x-freepik-api-key': FREEPIK_API_KEY } });
  if (!res.ok) throw new Error(`Freepik/Flaticon ${res.status}: ${await res.text()}`);
  const { data = [] } = await res.json();
  return data.map((i) => ({
    type: 'flaticon', id: i.id, name: i.name,
    url: i.thumbnails?.at(-1)?.url ?? i.thumbnails?.[0]?.url,
    page: i.url ?? `https://www.flaticon.com/free-icon/${i.slug ?? i.id}`,
    license: 'Flaticon free licence (attribution)', attribution: true,
    credit: `Icon by ${i.author?.name ?? 'unknown'} / Flaticon`,
  })).filter((i) => i.url);
}

export async function searchIcons(query) {
  const results = [];
  if (process.env.FREEPIK_API_KEY) {
    results.push(...await searchFlaticon(query).catch((e) => (console.warn(`⚠ Flaticon: ${e.message}`), [])));
  }
  results.push(...await searchIconify(query));
  return results;
}
