// Gemini TTS: the whole script is voiced in ONE request, so the delivery flows
// naturally from segment to segment (and we stay far below the free-tier
// requests-per-minute limit). Each segment is its own text block with its own
// `style` annotation, and inline vocal tags like <laugh> or <short pause> are
// passed straight through. Segment boundaries for captions and cuts are then
// recovered from the pauses in the audio → voice.mp3 + timing.json.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { config, readJson, readJsonIfExists, writeJson, requireEnv, run, probeDuration, round, sleep } from '../lib.mjs';
import { transcribeWords, wordTimings } from './align.mjs';

const API = 'https://generativelanguage.googleapis.com/v1beta/interactions';

// Raw 16-bit little-endian mono PCM → WAV (in case the API returns headerless PCM).
export function pcmToWav(pcm, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE((channels * bitsPerSample) / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// The script is written with ElevenLabs-style audio tags in square brackets:
//   delivery tags  [excited] [curious] [surprised] [playfully] [mischievously] [whispers] …
//   sound tags     [chuckles] [laughs] [sighs] [gasps] [brief pause] …
// Gemini TTS doesn't read square brackets (it would speak them), so sound tags become
// Gemini's inline vocal tags (<chuckle>) and delivery tags start a new text block with
// that delivery as its style. Angle-bracket tags (<laugh>) still pass straight through.
const SOUND_TAGS = {
  chuckle: '<chuckle>', chuckles: '<chuckle>',
  laugh: '<laugh>', laughs: '<laugh>', laughing: '<laugh>',
  giggle: '<giggle>', giggles: '<giggle>',
  snicker: '<snicker>', snickers: '<snicker>',
  sigh: '<sigh>', sighs: '<sigh>',
  gasp: '<gasp>', gasps: '<gasp>',
  breath: '<breath>', breathes: '<breath>', inhales: '<breath>', exhales: '<breath>',
  cheer: '<cheer>', cheers: '<cheer>',
  pause: '<short pause>', 'brief pause': '<short pause>', 'short pause': '<short pause>',
};
const DELIVERY = { whispers: 'whispering', whisper: 'whispering' };

// What the TTS model gets for one segment: [{ style, text }] — caption markup (*keyword*)
// removed, sound tags as <tags>, a new block wherever a delivery tag appears.
export function voiceBlocks(text) {
  const blocks = [{ style: '', text: '' }];
  for (const part of text.replace(/\*/g, '').split(/(\[[^\]]*\])/)) {
    const tag = part.match(/^\[([^\]]*)\]$/)?.[1].trim().toLowerCase();
    if (tag === undefined) { blocks.at(-1).text += part; continue; }
    if (SOUND_TAGS[tag]) { blocks.at(-1).text += ` ${SOUND_TAGS[tag]} `; continue; }
    const style = DELIVERY[tag] ?? tag;
    if (blocks.at(-1).text.trim()) blocks.push({ style, text: '' });
    else blocks.at(-1).style = style;
  }
  return blocks
    .map((b) => ({ style: b.style, text: b.text.replace(/\s+/g, ' ').trim() }))
    .filter((b) => b.text);
}

// Whole segment as one string, as the TTS model hears it (delivery tags dropped).
export const spokenText = (text) => voiceBlocks(text).map((b) => b.text).join(' ');

// Plain words only (no tags of either kind, no markup) — for captions and length estimates.
export const plainText = (text) => text.replace(/<[^>]*>|\[[^\]]*\]/g, ' ').replace(/\*/g, '').replace(/\s+/g, ' ').trim();

// The request body: one text block per segment — or more, when a delivery tag changes
// the mood mid-segment — each with its own style (`voice.style` + the segment's optional
// `style` + the delivery tag). `voice.segmentSeparator` (e.g. "<short pause>") goes before
// every segment after the first, so there's a clear pause to cut on.
export function buildRequest(script, voice) {
  const content = script.segments.flatMap((seg, i) => voiceBlocks(seg.text).map((b, j) => {
    const style = [voice.style, seg.style, b.style].filter(Boolean).join('. ');
    const text = (i > 0 && j === 0 && voice.segmentSeparator ? `${voice.segmentSeparator} ` : '') + b.text;
    return { type: 'text', text, annotations: [{ type: 'speech_metadata', style }] };
  }));
  return {
    model: voice.model,
    input: [{ type: 'user_input', content }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice: voice.voiceName }] },
  };
}

// Free-tier Gemini TTS allows only a few requests per minute. Returns seconds to
// wait before retrying, or null if retrying won't help (daily quota, bad request).
export function retryDelaySeconds(status, bodyText) {
  if (status >= 500) return 10;
  if (status !== 429) return null;
  if (/PerDay/i.test(bodyText)) return null;
  const m = bodyText.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/) ?? bodyText.match(/retry in (\d+(?:\.\d+)?)s/i);
  return m ? Math.ceil(Number(m[1])) + 2 : 30;
}

async function synthesize(body, apiKey) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (res.ok) {
      const audio = (JSON.parse(text).steps ?? [])
        .filter((s) => s.type === 'model_output')
        .flatMap((s) => s.content ?? [])
        .filter((c) => c.type === 'audio' && c.data)
        .pop();
      if (!audio) throw new Error(`Gemini TTS returned no audio: ${text.slice(0, 500)}`);
      const buf = Buffer.from(audio.data, 'base64');
      return buf.subarray(0, 4).toString() === 'RIFF' ? buf : pcmToWav(buf);
    }
    const wait = retryDelaySeconds(res.status, text);
    if (wait === null || attempt > 5) throw new Error(`Gemini TTS ${res.status}: ${text}`);
    console.log(`  Gemini TTS ${res.status} — retrying in ${wait}s (attempt ${attempt}/5)…`);
    await sleep(wait * 1000);
  }
}

// ffmpeg silencedetect log → [{ start, end }]
export function parseSilences(log) {
  const out = [];
  let start = null;
  for (const line of log.split('\n')) {
    const s = line.match(/silence_start: (-?[\d.]+)/);
    if (s) start = Math.max(0, Number(s[1]));
    const e = line.match(/silence_end: ([\d.]+)/);
    if (e && start !== null) { out.push({ start, end: Number(e[1]) }); start = null; }
  }
  return out;
}

function detectSilences(file, voice, minPause = voice.minPauseSeconds ?? 0.2) {
  const filter = `silencedetect=noise=${voice.silenceThresholdDb ?? -35}dB:d=${minPause}`;
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', filter, '-f', 'null', '-'], { encoding: 'utf8' });
  return parseSilences(stderr ?? '');
}

// Where does each segment start? Roughly, segments take time in proportion to
// their text length, and the separator puts a pause between them. For every
// boundary, take the pause closest to the expected time (favouring longer
// pauses), keeping boundaries in order and at least `minSegment` seconds apart.
// Falls back to the proportional estimate when there's no usable pause nearby.
export function findBoundaries(silences, totalDuration, weights, { searchWindow = 0.15, minSegment = 1.5 } = {}) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const window = totalDuration * searchWindow;
  const starts = [0];
  let acc = 0;
  for (let i = 1; i < weights.length; i++) {
    acc += weights[i - 1];
    const expected = (totalDuration * acc) / sum;
    const earliest = starts[i - 1] + minSegment;
    const latest = totalDuration - (weights.length - i) * minSegment;
    let best = null;
    for (const s of silences) {
      const mid = (s.start + s.end) / 2;
      const len = s.end - s.start;
      if (mid < earliest || mid > latest || Math.abs(mid - expected) > window) continue;
      const score = Math.abs(mid - expected) / window - Math.min(len, 1);
      // Cut just before speech resumes, so the new segment's captions/shots start on its first word.
      if (!best || score < best.score) best = { score, at: s.end - Math.min(0.1, len / 2) };
    }
    starts.push(round(best ? best.at : Math.min(Math.max(expected, earliest), latest)));
  }
  return starts;
}

const hash = (body) => createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16);

// A film without a narrator (project.json → "voice": "none"): every segment lasts its `seconds`, the
// voice track is silence (so the timeline has a clock), there are no words and no captions. Shots cut on
// `at` (seconds into the segment) or share the segment by `weight`; cues are plain seconds.
export function silentTiming(ep, script) {
  mkdirSync(ep.audioDir, { recursive: true });
  let t = 0;
  const segments = script.segments.map((s) => {
    if (!(s.seconds > 0)) throw new Error(`segment ${s.id}: a film without a narrator needs "seconds" on every segment`);
    const seg = { id: s.id, start: round(t), duration: round(s.seconds) };
    t += s.seconds;
    return seg;
  });
  const voiceFile = join(ep.audioDir, 'voice.mp3');
  run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', String(round(t, 3)), '-c:a', 'libmp3lame', '-b:a', '64k', voiceFile]);
  const timing = { voiceFile, silent: true, totalDuration: round(t), pauses: [], segments, words: [] };
  writeJson(ep.timing, timing);
  console.log(`No narrator: ${segments.length} segments, ${timing.totalDuration}s (silent voice track)`);
  return timing;
}

export async function generateVoice(ep, { force = false } = {}) {
  const voice = config.voice();
  const script = readJson(ep.script);
  if (voice.none) return silentTiming(ep, script);
  const { GEMINI_API_KEY } = requireEnv('GEMINI_API_KEY');
  mkdirSync(ep.audioDir, { recursive: true });

  const body = buildRequest(script, voice);
  const requestHash = hash(body);
  const wav = join(ep.audioDir, 'voice.wav');
  const previous = readJsonIfExists(ep.timing, {});
  let fresh = false;
  if (force || !existsSync(wav) || previous.requestHash !== requestHash) {
    console.log(`TTS: whole script in one request (${voice.model}, ${script.segments.length} segments)…`);
    writeFileSync(wav, await synthesize(body, GEMINI_API_KEY));
    fresh = true;
  } else {
    console.log('TTS: script unchanged — reusing audio/voice.wav (use --force to regenerate)');
  }

  const voiceFile = join(ep.audioDir, 'voice.mp3');
  run('ffmpeg', ['-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', voiceFile]);
  const total = probeDuration(voiceFile);
  const weights = script.segments.map((s) => plainText(s.text).length + 5);
  const silences = detectSilences(wav, voice);
  const starts = findBoundaries(silences, total, weights);

  const timing = {
    voiceFile,
    requestHash,
    totalDuration: round(total),
    // Every pause in the speech, even short ones between sentences — captions switch on these.
    pauses: detectSilences(wav, voice, voice.captionPauseSeconds ?? 0.1).map((p) => ({ start: round(p.start), end: round(p.end) })),
    segments: script.segments.map((s, i) => ({ id: s.id, start: starts[i], duration: round((starts[i + 1] ?? total) - starts[i]) })),
  };
  // Exact word timing (Whisper) — reused while the audio is unchanged.
  const words = !fresh && previous.words?.length ? { words: previous.words, matched: previous.wordsMatched } : alignVoice(wav, script, voice);
  if (words) applyWords(timing, words, total);
  writeJson(ep.timing, timing);

  const target = config.brand().durationSeconds;
  if (!timing.words) console.warn('⚠ No word timing — captions and cues are estimated. Fix: pip install faster-whisper and allow huggingface.co');
  console.log(`Voice: ${timing.totalDuration}s (target ${target}s) · timing: ${timing.words ? `word-level (Whisper, ${Math.round(timing.wordsMatched * 100)}% of words matched)` : 'estimated from pauses ⚠'}`);
  for (const s of timing.segments) console.log(`  ${s.id.padEnd(8)} ${s.start.toFixed(2)}s  +${s.duration.toFixed(2)}s`);
  if (target && total > target * 1.08 + 2) console.warn(`⚠ Voiceover is ${round(total - target, 1)}s over the ${target}s target — cut words (never speed the audio up).`);
  if (target && total < target * 0.8 - 2) console.warn(`⚠ Voiceover is ${round(target - total, 1)}s under the ${target}s target — add a little, or accept the shorter film.`);
  return timing;
}

// Names / numbers from the script, so Whisper spells them the way the script does.
export function whisperPrompt(script) {
  const text = plainText(script.segments.map((s) => s.text).join(' '));
  const letters = text.match(/\p{L}/gu) ?? [];
  const latinShare = letters.filter((c) => /[A-Za-z]/.test(c)).length / Math.max(1, letters.length);
  // In a Latin-script language only names and numbers help (capitalised words, digits); elsewhere every Latin run does.
  const pattern = latinShare > 0.5 ? /\b(?:[A-Z][\w.+-]*|\d[\w.,+-]*)(?: [A-Z][\w.+-]*)*/g : /[A-Za-z0-9][\w.+-]*(?: [A-Z][\w.+-]*)*/g;
  const latin = new Set((text.match(pattern) ?? []).slice(0, 60));
  return [...latin].join(', ');
}

// Whisper → word timings aligned to the script. Returns null (with a warning) when
// faster-whisper isn't available or the transcript doesn't match the script well enough.
export function alignVoice(wav, script, voice = config.voice()) {
  const model = voice.alignModel ?? 'large-v3-turbo';
  try {
    console.log(`Word timing: transcribing the voice with Whisper (${model})…`);
    const asr = transcribeWords(wav, { model, language: voice.alignLanguage ?? 'en', prompt: whisperPrompt(script) });
    const result = wordTimings(script, asr);
    if (result.matched < 0.5) {
      console.warn(`⚠ Whisper matched only ${Math.round(result.matched * 100)}% of the script's words — falling back to pause-based timing.`);
      return null;
    }
    return result;
  } catch (e) {
    console.warn(`⚠ Word timing unavailable (${e.message}) — falling back to pause-based timing. Install: pip install faster-whisper`);
    return null;
  }
}

// Word timings → timing.words, and segment starts snapped to each segment's first word
// (a hair before it, never before the previous segment's last word ends).
export function applyWords(timing, { words, matched }, total = timing.totalDuration) {
  timing.words = words;
  timing.wordsMatched = matched;
  const starts = timing.segments.map((seg, i) => {
    if (i === 0) return 0;
    const first = words.find((w) => w.seg === seg.id);
    const prevLast = words.filter((w) => w.seg === timing.segments[i - 1].id).at(-1);
    if (!first) return seg.start;
    return round(Math.max(prevLast?.end ?? 0, first.start - 0.08));
  });
  timing.segments = timing.segments.map((seg, i) => ({ ...seg, start: starts[i], duration: round((starts[i + 1] ?? total) - starts[i]) }));
  return timing;
}
