// When and where the optional overlays (overlays.json: logos, numbers, titles laid over the shots)
// appear: anchored on their spoken word, kept inside their story, same-zone overlaps fixed.
import { anchorTime } from './captions.mjs';

const TRANSITION = /^(none|fade|reveal|wipe(Left|Right)|slide(Left|Right|Up|Down)|carousel(Left|Right|Up|Down)|shuffle(TopRight|RightTop|RightBottom|BottomRight|BottomLeft|LeftBottom|LeftTop|TopLeft)|zoom)(Fast|Slow)?$/;

// When and where each overlay shows: starts `leadSeconds` before its anchor word is
// spoken, lasts `length` (default 2.5 s) and never runs past its segment.
export function placeOverlays(overlays, script, timing, cfg, captionOpts) {
  const segs = timing.segments;
  return (overlays.overlays ?? []).map((o) => {
    const seg = script.segments.find((s) => s.id === o.segment);
    const i = segs.findIndex((s) => s.id === o.segment);
    const t = segs[i];
    let at = t.start + (o.delay ?? 0);
    if (o.anchor) {
      at = anchorTime(seg, t, o.anchor, captionOpts);
      if (at === null) throw new Error(`overlay ${o.id}: anchor "${o.anchor}" is not in segment ${o.segment}'s text`);
      at += o.delay ?? 0;
    }
    const spanEnd = segs[i + 1]?.start ?? timing.totalDuration;
    const start = Math.max(t.start, Math.min(at - cfg.leadSeconds, spanEnd - 1));
    const length = Math.max(0.8, Math.min(o.length ?? cfg.defaultLength, spanEnd - start));
    const d = cfg.defaults[o.type] ?? {};
    const zone = o.zone ?? d.zone ?? 'upper';
    if (!cfg.zones[zone]) throw new Error(`overlay ${o.id}: unknown zone "${zone}" (${Object.keys(cfg.zones).join(', ')})`);
    const transition = { in: o.in ?? d.in ?? 'fade', out: o.out ?? d.out ?? 'fade' };
    for (const v of Object.values(transition)) if (!TRANSITION.test(v)) throw new Error(`overlay ${o.id}: unknown transition "${v}"`);
    return { o, start: round3(start), length: round3(length), zone, transition };
  });
}

const round3 = (n) => Math.round(n * 1000) / 1000;

// Overlays in the same zone must not overlap in time — they'd sit on top of each other.
export function overlayConflicts(placed, minGap = 0) {
  const out = [];
  for (let a = 0; a < placed.length; a++) {
    for (let b = a + 1; b < placed.length; b++) {
      const [p, q] = [placed[a], placed[b]];
      if (p.zone === q.zone && p.start < q.start + q.length + minGap && q.start < p.start + p.length + minGap) {
        out.push(`${p.o.id} and ${q.o.id} overlap in zone "${p.zone}"`);
      }
    }
  }
  return out;
}

// Fix same-zone overlaps automatically: shorten the earlier overlay so it leaves `minGap`
// before the next one (if it still shows ≥ `minLength` s), otherwise move the later one
// to a free zone. Returns the notes of what changed.
export function resolveOverlayConflicts(placed, cfg, { minLength = 1.2 } = {}) {
  const gap = cfg.minGapSeconds ?? 0;
  const notes = [];
  const order = [...placed].sort((a, b) => a.start - b.start);
  const busy = (zone, p) => order.some((q) => q !== p && q.zone === zone && q.start < p.start + p.length + gap && p.start < q.start + q.length + gap);
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      const [p, q] = [order[i], order[j]];
      if (p.zone !== q.zone || q.start >= p.start + p.length + gap) continue;
      const shorter = round3(q.start - gap - p.start);
      if (shorter >= minLength) {
        notes.push(`${p.o.id} shortened to ${shorter}s so ${q.o.id} has the "${p.zone}" zone to itself`);
        p.length = shorter;
        continue;
      }
      const free = ['upper', 'middle', 'upperLeft', 'upperRight'].find((z) => z !== q.zone && cfg.zones[z] && !busy(z, q));
      if (free) { notes.push(`${q.o.id} moved from "${q.zone}" to "${free}" (it overlapped ${p.o.id})`); q.zone = free; }
    }
  }
  return notes;
}
