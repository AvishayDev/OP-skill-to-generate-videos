// Shot timing against the real voice: when each shot plays (computeSlots), and when each of a
// shot's word cues lands inside it (shotCues) — so an element appears on the word that names it.
import { config, round } from '../lib.mjs';
import { anchorTime } from './captions.mjs';

// Caption split settings — the same ones the captions use, so cuts land with captions.
export function captionOptions() {
  const c = config.video().captions;
  return { minWords: c.minWords, maxWords: c.maxWords, maxChars: c.maxChars };
}

// Every shot's { start, length } in seconds. A segment's first shot starts with the segment;
// a later shot starts when its `words` are spoken; shots without `words` share the remaining
// time by `weight`. The last segment runs `tail` seconds past the voice.
export function computeSlots(plan, timing, { tail = 0.5, script, captionOpts = {} } = {}) {
  const slots = {};
  const opts = { ...captionOpts, pauses: captionOpts.pauses ?? timing.pauses, words: captionOpts.words ?? timing.words };
  timing.segments.forEach((seg, i) => {
    const next = timing.segments[i + 1];
    const spanEnd = next ? next.start : timing.totalDuration + tail;
    const shots = plan.shots.filter((s) => s.segment === seg.id);
    if (!shots.length) throw new Error(`No shot planned for segment "${seg.id}"`);
    const scriptSeg = script?.segments.find((s) => s.id === seg.id);
    // Fixed cut points: the segment start, plus every shot whose words we can find.
    const fixed = shots.map((shot, j) => {
      if (j === 0) return seg.start;
      // A cut at a time (seconds into the segment) — films without a narrator, or a beat between words.
      if (typeof shot.at === 'number') return seg.start + shot.at;
      if (!shot.words || !scriptSeg) return null;
      const at = anchorTime(scriptSeg, seg, shot.words, opts);
      if (at === null) throw new Error(`shot ${shot.id}: words "${shot.words}" are not in segment ${seg.id}'s text`);
      return Math.max(seg.start, at - 0.05);
    });
    for (let k = 0; k < shots.length;) {
      let m = k + 1;
      while (m < shots.length && fixed[m] === null) m++;
      const from = fixed[k];
      const to = m < shots.length ? fixed[m] : spanEnd;
      if (to <= from) throw new Error(`shot ${shots[m]?.id ?? shots[k].id}: its words come before the previous shot's — keep shots in spoken order`);
      const group = shots.slice(k, m);
      const totalWeight = group.reduce((sum, s) => sum + (s.weight ?? 1), 0);
      let t = from;
      group.forEach((shot, j) => {
        const end = j === group.length - 1 ? to : t + ((to - from) * (shot.weight ?? 1)) / totalWeight;
        slots[shot.id] = { start: round(t), length: round(end - t) };
        t = end;
      });
      k = m;
    }
  });
  return slots;
}

// A shot's cues: { name: "word" } or { name: { word, delay, sfx, nth } } → seconds from the shot's
// start (the moment that word is spoken). `delay` shifts it (s). A cue may also be a plain number of
// seconds into the shot ({ name: 1.2 } or { at: 1.2 }) for a beat that isn't on a word.
// Throws when the word isn't spoken inside the shot: an element must land on its own word.
export function shotCues(shot, slot, { script, timing, captionOpts = {} }) {
  const out = {};
  const seg = script.segments.find((s) => s.id === shot.segment);
  const segTiming = timing.segments.find((s) => s.id === shot.segment);
  const opts = { ...captionOpts, pauses: timing.pauses, words: timing.words };
  for (const [name, raw] of Object.entries(shot.cues ?? {})) {
    const c = typeof raw === 'object' && raw !== null ? raw : (typeof raw === 'number' ? { at: raw } : { word: raw });
    let t;
    if (c.word) {
      const at = anchorTime(seg, segTiming, c.word, opts);
      if (at === null) throw new Error(`shot ${shot.id}: cue "${name}" — "${c.word}" is not in segment ${shot.segment}'s text`);
      t = at - slot.start;
      if (t < -0.06 || t > slot.length + 0.01) throw new Error(`shot ${shot.id}: cue "${name}" — "${c.word}" is spoken at ${round(at, 2)}s, outside the shot (${slot.start}–${round(slot.start + slot.length, 2)}s)`);
    } else if (typeof c.at === 'number') t = c.at;
    else throw new Error(`shot ${shot.id}: cue "${name}" needs a word or a time`);
    out[name] = { t: round(Math.max(0, Math.min(slot.length, t + (c.delay ?? 0))), 3), sfx: c.sfx ?? null, volume: c.volume };
  }
  return out;
}

// The spoken words inside one slot, relative to its start: [{ word, t, end }] (seconds).
export function slotWords(words, slot) {
  return (words ?? [])
    .filter((w) => w.start >= slot.start - 0.05 && w.start < slot.start + slot.length)
    .map((w) => ({ word: (w.w ?? w.word ?? '').replace(/\*/g, ''), t: round(Math.max(0, w.start - slot.start), 3), end: round(Math.max(0, w.end - slot.start), 3) }));
}

// Every shot of shots.json with its timing on the film's frame grid: { ...shot, start, length,
// from, frames, cues: { name: { t, f, sfx } }, words: [{ word, t, end, f }] }. Frames are cut so
// that shots lie end to end with no gap; the canvas renderer and the Reelkit timeline share it.
export function resolveShots(plan, { script, timing, fps, captionOpts = captionOptions() }) {
  const slots = computeSlots(plan, timing, { script, captionOpts });
  const toF = (t) => Math.round(t * fps);
  const list = plan.shots.map((shot) => {
    const slot = slots[shot.id];
    const from = toF(slot.start);
    const frames = Math.max(1, toF(slot.start + slot.length) - from);
    const cues = shotCues(shot, slot, { script, timing, captionOpts });
    for (const c of Object.values(cues)) c.f = Math.min(frames - 1, toF(c.t));
    const words = slotWords(timing.words, slot).map((w) => ({ ...w, f: toF(w.t) }));
    return { ...shot, start: slot.start, length: slot.length, from, frames, cues, words };
  });
  // Close any rounding gap so every frame has a picture.
  if (list.length && list[0].from !== 0) { list[0].frames += list[0].from; list[0].from = 0; }
  for (let i = 1; i < list.length; i++) {
    const prevEnd = list[i - 1].from + list[i - 1].frames;
    if (list[i].from !== prevEnd) { list[i].frames += list[i].from - prevEnd; list[i].from = prevEnd; }
  }
  return list;
}
