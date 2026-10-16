// Turns script segments into subtitle cues: one full sentence on screen while it is
// spoken (long sentences are split at a comma / colon / dash into balanced halves),
// timed against the real pauses in the voiceover.
import { findBoundaries } from '../audio/tts.mjs';

const SENTENCE_END = /[.!?…]["'”)]*$/;
const CLAUSE_END = /[,;:—–]["'”)]*$/;

// Sound tags take time in the audio (a laugh, a pause) — count them as extra characters
// of the cue they fall in, so the timing estimate stays close to the real speech.
const SOUND = /^(<[^>]*>|\[(chuckles?|laugh(s|ing)?|giggles?|snickers?|sighs?|gasps?|breath|inhales|exhales|cheers?|(brief |short )?pause)\])$/i;
const TAG_CHARS = 12;

function words(text) {
  const out = [];
  let extra = 0;
  for (const tok of text.replace(/(<[^>]*>|\[[^\]]*\])/g, ' $1 ').trim().split(/\s+/).filter(Boolean)) {
    if (/^(<[^>]*>|\[[^\]]*\])$/.test(tok)) { if (SOUND.test(tok)) extra += TAG_CHARS; continue; }
    out.push({ w: tok, extra });
    extra = 0;
  }
  return out;
}
const join = (ws) => ws.map((x) => x.w).join(' ');
const bare = (ws) => join(ws).replace(/\*/g, '');
const fits = (ws, o) => ws.length <= o.maxWords && bare(ws).length <= o.maxChars;

// Split a too-long sentence into balanced parts, preferring clause punctuation and never
// leaving a single word on its own.
function splitLong(ws, o) {
  if (fits(ws, o) || ws.length < 4) return [ws];
  const total = bare(ws).length;
  let best = null;
  for (let i = 2; i <= ws.length - 2; i++) {
    const left = bare(ws.slice(0, i)).length;
    const cost = Math.abs(2 * left - total) / total + (CLAUSE_END.test(ws[i - 1].w.replace(/\*/g, '')) ? 0 : 0.6);
    if (!best || cost < best.cost) best = { i, cost };
  }
  return [...splitLong(ws.slice(0, best.i), o), ...splitLong(ws.slice(best.i), o)];
}

// text → [{ text, highlight }]. Words wrapped in *asterisks* are keywords; a cue
// containing one is highlighted. <tags> and [tags] are voice directions, never shown.
export function splitCaptions(text, { minWords = 2, maxWords = 9, maxChars = 52 } = {}) {
  const o = { maxWords, maxChars };
  const sentences = [];
  let current = [];
  for (const x of words(text)) {
    current.push(x);
    if (SENTENCE_END.test(x.w.replace(/\*/g, ''))) { sentences.push(current); current = []; }
  }
  if (current.length) sentences.push(current);

  const parts = sentences.flatMap((s) => splitLong(s, o));
  // A tiny sentence ("כן.") joins its neighbour when the two fit on screen together.
  const cues = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.length < minWords && i + 1 < parts.length && fits([...p, ...parts[i + 1]], o)) {
      parts[i + 1] = [...p, ...parts[i + 1]];
    } else if (p.length < minWords && cues.length && fits([...cues.at(-1), ...p], o)) {
      cues.at(-1).push(...p);
    } else cues.push(p);
  }
  return cues.map((ws) => {
    const raw = join(ws);
    const extra = ws.reduce((sum, x) => sum + x.extra, 0);
    const cue = { text: raw.replace(/\*/g, '').replace(/[.,;:—–]$/, ''), highlight: raw.includes('*'), ...(extra ? { extra } : {}) };
    // How many words the cue holds — used to time it on the real word timestamps.
    Object.defineProperty(cue, 'wordCount', { value: ws.length, enumerable: false });
    return cue;
  });
}

// Index of a caption-text word in the segment's spoken words. captionText may differ
// from the spoken text (e.g. "3" vs "שלושה"): then map proportionally.
const mapIndex = (k, nCaption, nSpoken) => (nCaption === nSpoken ? k : Math.min(nSpoken - 1, Math.round((k * nSpoken) / Math.max(1, nCaption))));
const LEAD = 0.05;

// Where does each cue start (seconds from the segment start)? Picks one real pause per
// cue change so that, all together, the cue durations best match their text lengths
// (dynamic programming — a single long mid-sentence pause can't drag everything off).
// Falls back to proportional timing when there are too few pauses.
export function alignCues(weights, pauses, duration) {
  const n = weights.length;
  if (n === 1) return [0];
  const lead = pauses.find((p) => p.start <= 0.05);
  const tail = pauses.find((p) => p.end >= duration - 0.05);
  const from = lead ? lead.end : 0;
  const to = tail && tail.start > from ? tail.start : duration;
  const cands = pauses
    .filter((p) => p !== lead && p !== tail && p.start > from + 0.3 && p.end < to - 0.3)
    .map((p) => ({ at: p.end - Math.min(0.1, (p.end - p.start) / 2), bonus: 0.2 * Math.min(p.end - p.start, 0.5) }));
  if (cands.length < n - 1) {
    return findBoundaries(pauses, duration, weights, { searchWindow: 0.12, minSegment: Math.min(0.6, duration / n / 2) });
  }
  const total = weights.reduce((a, b) => a + b, 0);
  const expected = weights.map((w) => ((to - from) * w) / total);
  const cost = (a, b, i) => (b - a - expected[i]) ** 2 / expected[i];
  // best[i][j]: cue i+1 starts at candidate j.
  const best = [];
  for (let i = 0; i < n - 1; i++) {
    best.push(cands.map((c, j) => {
      if (i === 0) return { cost: cost(from, c.at, 0) - c.bonus, prev: -1 };
      let b = { cost: Infinity, prev: -1 };
      for (let k = i - 1; k < j; k++) {
        const v = best[i - 1][k].cost + cost(cands[k].at, c.at, i) - c.bonus;
        if (v < b.cost) b = { cost: v, prev: k };
      }
      return b;
    }));
  }
  let j = -1;
  let min = Infinity;
  best[n - 2].forEach((b, k) => { const v = b.cost + cost(cands[k].at, to, n - 1); if (v < min) { min = v; j = k; } });
  const starts = [];
  for (let i = n - 2; i >= 0; i--) { starts.unshift(round3(cands[j].at)); j = best[i][j].prev; }
  return [0, ...starts];
}

// Time each cue within its segment, on the real pauses in the speech (`opts.pauses`,
// from timing.json) — so a sentence appears when it starts and leaves when it ends.
export function timeCaptions(segmentText, segStart, segDuration, opts = {}) {
  const cues = splitCaptions(segmentText, opts);
  const end = segStart + segDuration;
  // Exact timing: every cue appears the moment its first word is spoken (Whisper word
  // timestamps from timing.json) and stays until the next cue starts.
  const sw = opts.segWords;
  if (sw?.length) {
    const nCaption = cues.reduce((sum, c) => sum + c.wordCount, 0);
    let k = 0;
    const starts = cues.map((c, i) => {
      const at = i === 0 ? segStart : Math.max(segStart, sw[mapIndex(k, nCaption, sw.length)].start - LEAD);
      k += c.wordCount;
      return at;
    });
    return cues.map((c, i) => {
      const from = starts[i];
      const to = Math.max(from + 0.2, starts[i + 1] ?? end);
      const { extra, ...cue } = c;
      return { ...cue, start: round3(from), length: round3(to - from) };
    });
  }
  const weights = cues.map((c) => c.text.length + 3 + (c.extra ?? 0));
  const pauses = (opts.pauses ?? [])
    .filter((p) => p.end > segStart && p.start < end)
    .map((p) => ({ start: Math.max(0, p.start - segStart), end: Math.min(segDuration, p.end - segStart) }));
  const starts = alignCues(weights, pauses, segDuration);
  return cues.map((c, i) => {
    const from = segStart + starts[i];
    const to = segStart + (starts[i + 1] ?? segDuration);
    const { extra, ...cue } = c;
    return { ...cue, start: round3(from), length: round3(to - from) };
  });
}

const round3 = (n) => Math.round(n * 1000) / 1000;

const wordsOf = (words, id) => (words ?? []).filter((w) => w.seg === id);

export function buildCaptions(script, timing, opts = {}) {
  const byId = Object.fromEntries(timing.segments.map((s) => [s.id, s]));
  const o = { ...opts, pauses: opts.pauses ?? timing.pauses };
  return script.segments.flatMap((seg) => {
    const t = byId[seg.id];
    if (!t) throw new Error(`No timing for segment ${seg.id} — run "voice" first`);
    return timeCaptions(seg.captionText ?? seg.text, t.start, t.duration, { ...o, segWords: wordsOf(timing.words ?? o.words, seg.id) });
  });
}

// For matching anchors: no tags, no markup, no punctuation (except inside numbers like 3.6).
const norm = (s) => s
  .replace(/<[^>]*>|\[[^\]]*\]/g, ' ')
  .replace(/\*/g, '')
  .replace(/(?<!\d)[.,](?!\d)|[;:!?"“”'…—–()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

// When is `anchor` (a word or phrase from the segment) spoken? Uses the same timing as
// the captions, so an overlay or a cut lands with its caption. Searches captionText first
// (e.g. "3.6"), then the spoken text. Returns null if absent.
export function anchorTime(seg, segTiming, anchor, opts = {}) {
  const needle = norm(anchor);
  if (!needle) return null;
  // Exact timing: the moment the anchor's first word is spoken.
  const sw = wordsOf(opts.words, seg.id);
  if (sw.length) {
    for (const text of [seg.captionText, seg.text].filter(Boolean)) {
      const toks = text.replace(/(<[^>]*>|\[[^\]]*\])/g, ' ').trim().split(/\s+/).filter(Boolean).map(norm);
      let joined = ' ';
      const offs = toks.map((t) => { const o = joined.length; joined += t + ' '; return o; });
      let at = joined.indexOf(` ${needle} `);
      at = at >= 0 ? at + 1 : joined.indexOf(needle);
      if (at < 0) continue;
      let k = offs.findLastIndex((o) => o <= at);
      if (k < 0) k = 0;
      return round3(sw[mapIndex(k, toks.length, sw.length)].start);
    }
    return null;
  }
  for (const text of [seg.captionText, seg.text].filter(Boolean)) {
    const cues = timeCaptions(text, segTiming.start, segTiming.duration, opts);
    let joined = ' ';
    const ranges = cues.map((c) => {
      const n = norm(c.text);
      const from = joined.length;
      joined += n + ' ';
      return { from, to: from + n.length, cue: c };
    });
    let at = joined.indexOf(` ${needle} `);
    at = at >= 0 ? at + 1 : joined.indexOf(needle);
    if (at < 0) continue;
    const r = ranges.find((x) => at < x.to + 1) ?? ranges.at(-1);
    const within = Math.min(1, Math.max(0, (at - r.from) / Math.max(1, r.to - r.from)));
    return round3(r.cue.start + r.cue.length * within);
  }
  return null;
}
