// Word-level timing for the voiceover. Whisper (faster-whisper, the language's model) transcribes
// voice.wav with a timestamp per word; those words are then aligned to the script's own
// words, so every script word gets the exact moment it is spoken. Captions, cuts and
// overlays are timed on these words instead of on estimates.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, round, ensureWhisper } from '../lib.mjs';

// Script words exactly as the captions tokenize them: tags dropped, markup kept out.
export function segmentWords(text) {
  return text
    .replace(/(<[^>]*>|\[[^\]]*\])/g, ' ')
    .replace(/\*/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// For comparing a script word with a transcribed one: no niqqud, punctuation, quotes,
// hyphens or case.
export const normWord = (w) => w
  .normalize('NFKD')
  .replace(/[֑-ׇ]/g, '')
  .replace(/[^\p{L}\p{N}]/gu, '')
  .toLowerCase();

function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

// Needleman–Wunsch over words: script words × transcribed words. Words that match well
// take the transcribed word's times; the rest (numbers read out, English names spelled
// in Hebrew, …) are spread over the gap between their matched neighbours by length.
// Returns { times: [{ start, end }] per script word, matched: fraction matched }.
export function alignWords(script, asr, { gap = -0.4, minSim = 0.5 } = {}) {
  const a = script.map(normWord);
  const b = asr.map((x) => normWord(x.w));
  const m = a.length;
  const n = b.length;
  const score = Array.from({ length: m + 1 }, () => new Float64Array(n + 1));
  const move = Array.from({ length: m + 1 }, () => new Uint8Array(n + 1)); // 1 diag, 2 up, 3 left
  for (let i = 1; i <= m; i++) { score[i][0] = i * gap; move[i][0] = 2; }
  for (let j = 1; j <= n; j++) { score[0][j] = j * gap; move[0][j] = 3; }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const s = similarity(a[i - 1], b[j - 1]);
      const diag = score[i - 1][j - 1] + (s >= minSim ? 2 * s - 0.5 : -0.6);
      const up = score[i - 1][j] + gap;
      const left = score[i][j - 1] + gap;
      if (diag >= up && diag >= left) { score[i][j] = diag; move[i][j] = 1; } else if (up >= left) { score[i][j] = up; move[i][j] = 2; } else { score[i][j] = left; move[i][j] = 3; }
    }
  }
  const pair = new Array(m).fill(-1);
  for (let i = m, j = n; i > 0 || j > 0;) {
    const mv = move[i][j];
    if (mv === 1) {
      if (similarity(a[i - 1], b[j - 1]) >= minSim) pair[i - 1] = j - 1;
      i--; j--;
    } else if (mv === 2) i--;
    else j--;
  }

  // A matched word that Whisper split in pieces ("3" ".4" for 3.4) starts at the first
  // leftover piece after the previous match.
  let lastJ = -1;
  const times = pair.map((j, i) => {
    if (j < 0) return null;
    const prevMatched = i > 0 && pair[i - 1] >= 0;
    const from = prevMatched && j - lastJ > 1 ? lastJ + 1 : j;
    lastJ = j;
    return { start: asr[from].start, end: asr[j].end };
  });
  const matched = times.filter(Boolean).length / Math.max(1, m);
  // Fill the unmatched runs between matched neighbours (or the audio edges).
  const audioEnd = asr.length ? asr.at(-1).end : 0;
  for (let i = 0; i < m;) {
    if (times[i]) { i++; continue; }
    let k = i;
    while (k < m && !times[k]) k++;
    const from = i > 0 ? times[i - 1].end : (asr[0]?.start ?? 0);
    const to = k < m ? times[k].start : audioEnd;
    const lens = script.slice(i, k).map((w) => normWord(w).length + 1);
    const total = lens.reduce((x, y) => x + y, 0);
    let t = from;
    for (let q = i; q < k; q++) {
      const len = (Math.max(0, to - from) * lens[q - i]) / total;
      times[q] = { start: round(t), end: round(t + len) };
      t += len;
    }
    i = k;
  }
  return { times, matched };
}

// Runs Whisper on the audio → [{ w, start, end }]. Throws if faster-whisper is missing.
export function transcribeWords(audioFile, { model, language = 'en', prompt = '' } = {}) {
  if (!ensureWhisper()) throw new Error('faster-whisper is not installed');
  const script = join(ROOT, 'pipeline', 'audio', 'whisper_words.py');
  const res = spawnSync('python3', [script, audioFile, model, language, prompt], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, HF_HUB_DISABLE_PROGRESS_BARS: '1' },
  });
  if (res.status !== 0) throw new Error(`whisper failed: ${(res.stderr || res.error?.message || '').trim().split('\n').slice(-3).join(' | ')}`);
  return JSON.parse(res.stdout);
}

// Script segments + Whisper words → timing.words: [{ seg, w, start, end }] for every
// script word, in order.
export function wordTimings(script, asr) {
  const list = script.segments.flatMap((s) => segmentWords(s.text).map((w) => ({ seg: s.id, w })));
  const { times, matched } = alignWords(list.map((x) => x.w), asr);
  return { words: list.map((x, i) => ({ ...x, start: times[i].start, end: times[i].end })), matched: round(matched, 2) };
}
