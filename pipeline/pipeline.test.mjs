import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitCaptions, timeCaptions, anchorTime, alignCues } from './video/captions.mjs';
import { computeSlots, shotCues, resolveShots } from './video/slots.mjs';
import { commonsLicenseOk, licenseInfo, treatmentFilter } from './assets/images.mjs';
import { fitBox, validateOverlays } from './assets/overlays.mjs';
import { placeOverlays, overlayConflicts, resolveOverlayConflicts } from './video/timeline.mjs';
import { freesoundLicense, toResult, pickBest, sfxFor, audioCreditItems } from './assets/audio.mjs';
import { buildCredits, ccLicenseUrl } from './credits.mjs';
import { pcmToWav, spokenText, plainText, voiceBlocks, buildRequest, findBoundaries, parseSilences, retryDelaySeconds, voiceGroups, isDialogue } from './audio/tts.mjs';
import { alignWords, wordTimings, segmentWords } from './audio/align.mjs';
import { applyWords } from './audio/tts.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

test('splitCaptions shows whole sentences, splitting long ones at a comma', () => {
  const cues = splitCaptions('OpenAI השיקה היום מודל חדש. הוא *מהיר* פי שלושה מהקודם, וזה עוד לא הכל. [chuckles] כן. וזה גם זול יותר!');
  assert.deepEqual(cues.map((c) => c.text), [
    'OpenAI השיקה היום מודל חדש',
    'הוא מהיר פי שלושה מהקודם, וזה עוד לא הכל',
    'כן. וזה גם זול יותר!',
  ]);
  assert.ok(cues[1].highlight && !cues[0].highlight);
  const long = splitCaptions('צוות משימה בבית הלבן, שאמור להוביל את אמריקה בעולם ה-AI ולהגן עליה בדרך.');
  assert.deepEqual(long.map((c) => c.text), ['צוות משימה בבית הלבן', 'שאמור להוביל את אמריקה בעולם ה-AI ולהגן עליה בדרך']);
  for (const c of splitCaptions('אחת שתיים שלוש ארבע חמש שש שבע שמונה תשע עשר אחת-עשרה שתים-עשרה שלוש-עשרה')) {
    assert.ok(c.text.split(' ').length >= 2 && c.text.split(' ').length <= 9, c.text);
  }
});

test('timeCaptions covers the whole segment and switches on real pauses', () => {
  const cues = timeCaptions('אחת שתיים שלוש ארבע חמש שש שבע שמונה', 10, 4);
  assert.equal(cues[0].start, 10);
  const last = cues.at(-1);
  assert.ok(Math.abs(last.start + last.length - 14) < 0.01);
  // Two sentences; the speaker pauses at 13.0–13.4 → the second caption starts there, not at the 50% mark.
  const two = timeCaptions('משפט ראשון קצר מאוד. משפט שני קצר מאוד.', 10, 6, { pauses: [{ start: 13, end: 13.4 }] });
  assert.equal(two.length, 2);
  assert.equal(two[1].start, 13.3);
  assert.ok(Math.abs(two[1].start + two[1].length - 16) < 0.01);
});

test('alignCues fits all cue durations at once, ignoring a long mid-sentence pause', () => {
  // Three equal sentences over 9 s; real breaks at 3.0 and 6.0 (short), a long decoy pause at 7.2.
  const pauses = [{ start: 2.9, end: 3.05 }, { start: 5.9, end: 6.05 }, { start: 7.0, end: 7.4 }];
  assert.deepEqual(alignCues([10, 10, 10], pauses, 9), [0, 2.975, 5.975]); // just before speech resumes
  assert.deepEqual(alignCues([10], pauses, 9), [0]);
});

test('computeSlots splits segments by weight with no gaps', () => {
  const timing = { totalDuration: 20, segments: [{ id: 'a', start: 0, duration: 9.8 }, { id: 'b', start: 10, duration: 10 }] };
  const footage = { shots: [
    { id: 'a1', segment: 'a', weight: 1 }, { id: 'a2', segment: 'a', weight: 3 },
    { id: 'b1', segment: 'b' },
  ] };
  const s = computeSlots(footage, timing);
  assert.deepEqual(s.a1, { start: 0, length: 2.5 });
  assert.deepEqual(s.a2, { start: 2.5, length: 7.5 });
  assert.deepEqual(s.b1, { start: 10, length: 10.5 });
});

test('computeSlots cuts on a shot\'s spoken words', () => {
  const script = { segments: [{ id: 'a', text: 'משפט ראשון כאן. ועכשיו משפט שני. ומשפט שלישי וזהו.' }] };
  const timing = { totalDuration: 9, pauses: [{ start: 2.8, end: 3.2 }, { start: 5.8, end: 6.2 }], segments: [{ id: 'a', start: 0, duration: 9 }] };
  const footage = { shots: [
    { id: 'a1', segment: 'a' }, { id: 'a2', segment: 'a', words: 'ועכשיו משפט שני' }, { id: 'a3', segment: 'a' },
  ] };
  const s = computeSlots(footage, timing, { script, tail: 0 });
  assert.equal(s.a1.start, 0);
  assert.equal(s.a2.start, 3.05);
  assert.ok(Math.abs(s.a3.start + s.a3.length - 9) < 0.01);
  assert.throws(() => computeSlots({ shots: [{ id: 'x', segment: 'a' }, { id: 'y', segment: 'a', words: 'לא קיים' }] }, timing, { script }), /not in segment/);
});

test('pcmToWav writes a valid header', () => {
  const wav = pcmToWav(Buffer.alloc(48000), 24000);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt32LE(40), 48000);
  assert.equal(spokenText('a *b* c'), 'a b c');
});

test('commonsLicenseOk allows PD/CC0/CC BY/CC BY-SA, never NC/ND', () => {
  for (const ok of ['Public domain', 'CC0', 'CC BY 4.0', 'CC BY 3.0', 'PD-USGov-NASA', 'CC BY-SA 4.0']) assert.ok(commonsLicenseOk(ok), ok);
  for (const bad of ['CC BY-NC 2.0', 'CC BY-ND 4.0', 'CC BY-NC-SA 4.0', 'GFDL', '', 'Fair use']) assert.ok(!commonsLicenseOk(bad), bad);
  assert.ok(!commonsLicenseOk('CC BY-SA 4.0', { allowShareAlike: false }));
});

test('licenseInfo flags which licences need a creator mention', () => {
  assert.deepEqual(licenseInfo('CC BY 4.0'), { ok: true, attribution: true, shareAlike: false });
  assert.equal(licenseInfo('CC BY-SA 3.0').shareAlike, true);
  assert.equal(licenseInfo('Pexels licence').attribution, false);
  assert.equal(licenseInfo('Pixabay Content License').attribution, false);
  assert.equal(licenseInfo('CC BY (YouTube)').attribution, true);
  assert.equal(licenseInfo('Official OpenAI press video').attribution, true);
  assert.equal(licenseInfo('something weird').ok, false);
});

test('buildCredits lists required credits with links, thanks stock libraries', () => {
  const images = [
    { license: 'Pexels licence', credit: 'Ann Lee / Pexels' },
    { license: 'Pixabay Content License', credit: 'Pixabay' },
    { license: 'CC BY 4.0', credit: '"Robot" by Bob / Wikimedia Commons', page: 'https://commons.wikimedia.org/wiki/File:Robot.webm' },
    { license: 'CC BY 4.0', credit: '"Robot" by Bob / Wikimedia Commons', page: 'https://commons.wikimedia.org/wiki/File:Robot.webm' },
    { license: 'CC BY (YouTube)', credit: '"Demo" by Lab / YouTube', source: { type: 'youtube', url: 'https://www.youtube.com/watch?v=x' } },
  ];
  const overlays = { overlays: [{ type: 'logo', license: 'Public domain', credit: 'Google logo / Wikimedia Commons' }, { type: 'stat', text: '3' }] };
  const { text, requiredCount } = buildCredits({ images, overlays });
  assert.equal(requiredCount, 2);
  assert.match(text, /"Robot" by Bob .*CC BY 4\.0 \(https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/\).*File:Robot/);
  assert.match(text, /"Demo" by Lab \/ YouTube — CC BY \(YouTube\) — https:\/\/www\.youtube\.com\/watch\?v=x/);
  assert.match(text, /Stock images: Pexels — Ann Lee · Pixabay/);
  assert.ok(!text.includes('Google logo'));
  assert.ok(!text.includes('CC BY-SA'));
  assert.ok(buildCredits({ images: [{ license: 'CC BY-SA 4.0', credit: 'x' }] }).text.includes('shared under CC BY-SA'));
  assert.equal(ccLicenseUrl('CC BY-SA 3.0'), 'https://creativecommons.org/licenses/by-sa/3.0/');
});

const ovCfg = {
  defaultLength: 2.5, leadSeconds: 0.15,
  zones: { upper: { x: 0, y: 0.17 }, middle: { x: 0, y: 0 } },
  defaults: { logo: { zone: 'upper', in: 'zoom', out: 'fade' }, stat: { zone: 'upper', in: 'zoom', out: 'fade' } },
};
const ovScript = { segments: [
  { id: 'hook', text: 'שלום לכולם וברוכים הבאים' },
  { id: 'story1', text: 'היום Google הכריזה על מודל חדש, *מהיר* פי שלושה', captionText: 'היום Google הכריזה על מודל חדש, *מהיר* פי 3' },
] };
const ovTiming = { totalDuration: 10, segments: [{ id: 'hook', start: 0, duration: 3.8 }, { id: 'story1', start: 4, duration: 6 }] };

test('anchorTime finds the moment a word is spoken', () => {
  const t = anchorTime(ovScript.segments[1], ovTiming.segments[1], 'Google', {});
  assert.ok(t > 4 && t < 6, `Google at ${t}`);
  const three = anchorTime(ovScript.segments[1], ovTiming.segments[1], '3', {});
  assert.ok(three > 8.5 && three <= 10, `3 at ${three}`);
  assert.ok(anchorTime(ovScript.segments[1], ovTiming.segments[1], 'מהיר', {}) > t);
  assert.equal(anchorTime(ovScript.segments[1], ovTiming.segments[1], 'OpenAI', {}), null);
});

test('placeOverlays anchors, clamps to the segment and validates', () => {
  const overlays = { overlays: [
    { id: 'g', segment: 'story1', anchor: 'Google', type: 'logo', source: { url: 'https://x/g.png' }, license: 'Public domain' },
    { id: 's', segment: 'story1', anchor: '3', type: 'stat', text: '×3', length: 4 },
    { id: 'h', segment: 'hook', type: 'stat', text: 'hi', zone: 'middle' },
  ] };
  validateOverlays(overlays, ovScript);
  const [g, s, h] = placeOverlays(overlays, ovScript, ovTiming, ovCfg, {});
  assert.ok(g.start >= 4 && g.start < 6);
  assert.deepEqual(g.transition, { in: 'zoom', out: 'fade' });
  assert.ok(s.start + s.length <= 10 + 1e-9, 'stat must not run past the end');
  assert.equal(h.start, 0);
  assert.equal(h.zone, 'middle');
  assert.deepEqual(overlayConflicts([g, s, h]), []);
  assert.equal(overlayConflicts([g, { ...g, o: { id: 'g2' } }]).length, 1);
  assert.throws(() => placeOverlays({ overlays: [{ ...overlays.overlays[0], anchor: 'Nvidia' }] }, ovScript, ovTiming, ovCfg, {}), /anchor "Nvidia"/);
  assert.throws(() => placeOverlays({ overlays: [{ ...overlays.overlays[0], in: 'spin' }] }, ovScript, ovTiming, ovCfg, {}), /transition "spin"/);
  assert.throws(() => validateOverlays({ overlays: [{ id: 'x', segment: 'nope', type: 'logo' }] }, ovScript), /unknown segment.*\n.*source/s);
});

test('fitBox keeps the aspect ratio inside the box', () => {
  assert.deepEqual(fitBox(1000, 500, 400, 400), { w: 400, h: 200 });
  assert.deepEqual(fitBox(300, 900, 400, 300), { w: 100, h: 300 });
});

test('vocal tags reach TTS but never the captions', () => {
  assert.equal(spokenText('וואו *טריליון* <gasp> פרמטרים'), 'וואו טריליון <gasp> פרמטרים');
  assert.equal(plainText('וואו *טריליון* <gasp> [chuckles] פרמטרים'), 'וואו טריליון פרמטרים');
  const cues = splitCaptions('[excited] זה מטורף <laugh> ממש מטורף! [chuckles] באמת.');
  assert.ok(cues.every((c) => !/[<[]/.test(c.text)));
});

test('voiceBlocks turns ElevenLabs-style [tags] into Gemini styles and vocal tags', () => {
  assert.deepEqual(voiceBlocks('[excited] אתמול *טראמפ* הכריז. [chuckles] כן. [playfully] מסתבר שלא. [brief pause]'), [
    { style: 'excited', text: 'אתמול טראמפ הכריז. <chuckle> כן.' },
    { style: 'playfully', text: 'מסתבר שלא. <short pause>' },
  ]);
  assert.deepEqual(voiceBlocks('[whispers] סוד'), [{ style: 'whispering', text: 'סוד' }]);
  assert.deepEqual(voiceBlocks('בלי תגיות <laugh>'), [{ style: '', text: 'בלי תגיות <laugh>' }]);
});

test('buildRequest sends one block per segment with layered style', () => {
  const body = buildRequest(
    { segments: [{ id: 'hook', text: 'היי *שם*' }, { id: 'outro', style: 'warm', text: 'ביי <chuckle>' }] },
    { model: 'm', voiceName: 'Kore', style: 'playful', segmentSeparator: '<short pause>' },
  );
  const [a, b] = body.input[0].content;
  assert.equal(a.text, 'היי שם');
  assert.equal(a.annotations[0].style, 'playful');
  assert.equal(b.text, '<short pause> ביי <chuckle>');
  assert.equal(b.annotations[0].style, 'playful. warm');
  assert.equal(body.generation_config.speech_config[0].voice, 'Kore');
  // A delivery tag mid-segment starts a new block; the separator only opens the segment.
  const multi = buildRequest(
    { segments: [{ id: 's1', text: 'א.' }, { id: 's2', text: '[curious] ב. [mischievously] ג.' }] },
    { model: 'm', voiceName: 'Kore', style: 'base', segmentSeparator: '<short pause>' },
  ).input[0].content;
  assert.deepEqual(multi.map((c) => [c.text, c.annotations[0].style]), [
    ['א.', 'base'], ['<short pause> ב.', 'base. curious'], ['ג.', 'base. mischievously'],
  ]);
});

test('no video or audio is tracked in git', () => {
  let files;
  try { files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n'); } catch { return; }
  const media = files.filter((f) => /\.(mp4|mov|m4v|webm|mkv|avi|mp3|wav|m4a|aac|ogg|oga|opus|flac)$/i.test(f));
  assert.deepEqual(media, [], 'media files must never be committed — they belong on local disk');
});

test('findBoundaries snaps to the pause nearest each expected boundary', () => {
  // 3 equal segments over 30 s → expect cuts near 10 s and 20 s.
  const silences = [{ start: 4, end: 4.3 }, { start: 9.2, end: 9.8 }, { start: 11.5, end: 11.7 }, { start: 20.4, end: 21 }];
  const starts = findBoundaries(silences, 30, [1, 1, 1]);
  assert.equal(starts[0], 0);
  assert.equal(starts[1], 9.7);
  assert.equal(starts[2], 20.9);
  // No pauses at all → proportional fallback, still ordered.
  assert.deepEqual(findBoundaries([], 30, [1, 1, 1]), [0, 10, 20]);
});

test('parseSilences reads ffmpeg silencedetect output', () => {
  const log = '[silencedetect @ 0x1] silence_start: 1.2\n[silencedetect @ 0x1] silence_end: 1.56 | silence_duration: 0.36\n';
  assert.deepEqual(parseSilences(log), [{ start: 1.2, end: 1.56 }]);
});

test('retryDelaySeconds waits on per-minute 429s but not on daily quota', () => {
  assert.equal(retryDelaySeconds(429, '{"quotaId":"GenerateRequestsPerMinute-FreeTier","retryDelay":"37s"}'), 39);
  assert.equal(retryDelaySeconds(429, '{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}'), null);
  assert.equal(retryDelaySeconds(503, 'overloaded'), 10);
  assert.equal(retryDelaySeconds(400, 'bad request'), null);
});

test('freesoundLicense keeps CC0 / CC BY, rejects NC and Sampling+', () => {
  assert.equal(freesoundLicense('http://creativecommons.org/publicdomain/zero/1.0/'), 'CC0');
  assert.equal(freesoundLicense('Creative Commons 0'), 'CC0');
  assert.equal(freesoundLicense('https://creativecommons.org/licenses/by/4.0/'), 'CC BY 4.0');
  assert.equal(freesoundLicense('Attribution'), 'CC BY');
  assert.equal(freesoundLicense('http://creativecommons.org/licenses/by-nc/3.0/'), null);
  assert.equal(freesoundLicense('Attribution NonCommercial'), null);
  assert.equal(freesoundLicense('http://creativecommons.org/licenses/sampling+/1.0/'), null);
  const r = toResult({ id: 7, name: 'Pop', username: 'ann', license: 'https://creativecommons.org/licenses/by/4.0/', duration: 0.8,
    previews: { 'preview-hq-mp3': 'https://cdn.freesound.org/previews/0/7-hq.mp3' }, url: 'https://freesound.org/people/ann/sounds/7/' });
  assert.equal(r.credit, '"Pop" by ann / Freesound');
  assert.ok(r.attribution && licenseInfo(r.license).attribution);
  assert.equal(licenseInfo('CC0').attribution, false);
});

test('pickBest prefers music long enough for the whole video', () => {
  const short = { duration: 30, downloads: 50000, rating: 5 };
  const long = { duration: 120, downloads: 100, rating: 4 };
  assert.equal(pickBest([short, long], { kind: 'music', needSeconds: 61 }), long);
  assert.equal(pickBest([long, short], { kind: 'sfx' }), short);
});

test('sound effects follow sfx.byType (text overlays only when configured)', () => {
  const cfg = { enabled: true, volume: 0.5, offsetSeconds: 0, byType: { logo: 'logo', image: 'image' } };
  const placed = [
    { o: { id: 'a', type: 'logo' }, start: 4.2 },
    { o: { id: 'b', type: 'stat' }, start: 6 },
    { o: { id: 'c', type: 'title', sfx: 'logo' }, start: 8 },
    { o: { id: 'd', type: 'image', sfx: false }, start: 9 },
  ];
  assert.equal(sfxFor(placed[1].o, cfg), null);
  assert.equal(sfxFor(placed[0].o, { ...cfg, enabled: false }), null);
  assert.deepEqual(placed.map((p) => sfxFor(p.o, cfg)), ['logo', null, 'logo', null]);
});

test('buildCredits includes music and used sound effects', () => {
  const plan = {
    music: { license: 'CC BY 4.0', credit: '"Drive" by Kai / Freesound', page: 'https://freesound.org/people/Kai/sounds/1/' },
    sfx: { logo: { license: 'CC0', credit: '"Pop" by ann / Freesound' }, image: { license: 'CC0', credit: '"Swish" by zed / Freesound' } },
  };
  const audio = audioCreditItems(plan, new Set(['logo']));
  const { text, requiredCount } = buildCredits({ audio });
  assert.equal(requiredCount, 1);
  assert.match(text, /"Drive" by Kai \/ Freesound — CC BY 4\.0 \(https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/\) — https:\/\/freesound\.org/);
  assert.match(text, /Music & sound effects: Freesound — ann/);
  assert.ok(!text.includes('zed') && !text.includes('Stock images'));
});

test('alignWords maps script words to Whisper words, incl. split numbers and misheard names', () => {
  const asr = [
    { w: 'גוגל', start: 0.0, end: 0.4 }, { w: 'השיקה', start: 0.5, end: 0.9 },
    { w: '3', start: 1.0, end: 1.2 }, { w: '.4', start: 1.2, end: 1.5 }, { w: 'סנט.', start: 1.6, end: 2.0 },
  ];
  const { times, matched } = alignWords(['Google', 'השיקה', '3.4', 'סנט.'], asr);
  assert.equal(times[1].start, 0.5);
  assert.equal(times[2].start, 1.0); // "3" ".4" → starts at "3"
  assert.equal(times[3].start, 1.6);
  assert.equal(times[0].start, 0); // unmatched "Google" ← interpolated at the edge
  assert.ok(matched >= 0.5);
});

test('word timings drive segment starts, captions, cuts and anchors', () => {
  const script = { segments: [
    { id: 'a', text: '[excited] אחת שתיים. שלוש ארבע.' },
    { id: 'b', text: '[curious] חמש *שש*. שבע שמונה.' },
  ] };
  assert.deepEqual(segmentWords(script.segments[1].text), ['חמש', 'שש.', 'שבע', 'שמונה.']);
  const asr = ['אחת', 'שתיים.', 'שלוש', 'ארבע.', 'חמש', 'שש.', 'שבע', 'שמונה.'].map((w, i) => ({ w, start: i * 2 + (i >= 4 ? 1 : 0), end: i * 2 + 1.5 + (i >= 4 ? 1 : 0) }));
  const timing = { totalDuration: 18, pauses: [], segments: [{ id: 'a', start: 0, duration: 6 }, { id: 'b', start: 6, duration: 12 }] };
  applyWords(timing, wordTimings(script, asr));
  assert.equal(timing.segments[1].start, 8.92); // "חמש" at 9.0, minus a hair
  const seg = script.segments[1];
  const cues = timeCaptions(seg.text, timing.segments[1].start, timing.segments[1].duration, { minWords: 2, maxWords: 9, maxChars: 52, segWords: timing.words.filter((w) => w.seg === 'b') });
  assert.deepEqual(cues.map((c) => c.start), [8.92, 12.95]); // second sentence on "שבע" (13.0)
  assert.equal(anchorTime(seg, timing.segments[1], 'שמונה', { words: timing.words }), 15);
  const slots = computeSlots({ shots: [{ id: 'a1', segment: 'a' }, { id: 'b1', segment: 'b' }, { id: 'b2', segment: 'b', words: 'שבע שמונה' }] }, timing, { script });
  assert.equal(slots.b2.start, 12.95);
});

test('same-zone overlay overlaps are fixed: shorten the earlier one, or move the later one', () => {
  const cfg = { minGapSeconds: 0.3, zones: { upper: {}, middle: {} } };
  const a = { o: { id: 'logo' }, start: 10, length: 2.5, zone: 'upper' };
  const b = { o: { id: 'title' }, start: 11.8, length: 2.5, zone: 'upper' };
  resolveOverlayConflicts([a, b], cfg);
  assert.equal(a.length, 1.5);
  assert.deepEqual(overlayConflicts([a, b], 0.3), []);
  const c = { o: { id: 'logo2' }, start: 20, length: 2.5, zone: 'upper' };
  const d = { o: { id: 'title2' }, start: 20.5, length: 2.5, zone: 'upper' };
  resolveOverlayConflicts([c, d], cfg);
  assert.equal(d.zone, 'middle');
  assert.deepEqual(overlayConflicts([c, d], 0.3), []);
});

test('reelkit scenes stay within 15 s, start on story changes and cut only between shots', async () => {
  const { sceneChunks } = await import('./render/reelkit.mjs');
  const fps = 30;
  // story1: 4 shots of 6 s (24 s) → must split; story2: one 5 s shot.
  const shots = [0, 1, 2, 3].map((i) => ({ segment: 'story1', from: i * 180, frames: 180 })).concat([{ segment: 'story2', from: 720, frames: 150 }]);
  const scenes = sceneChunks(shots, { fps });
  assert.ok(scenes.every((s) => s.frames <= 15 * fps && s.frames >= 9));
  assert.deepEqual(scenes.map((s) => [s.segment, s.from, s.frames]), [['story1', 0, 360], ['story1', 360, 360], ['story2', 720, 150]]);
  // A single shot longer than 15 s is split anyway.
  const long = sceneChunks([{ segment: 's', from: 0, frames: 600 }], { fps });
  assert.deepEqual(long.map((s) => s.frames), [450, 150]);
  assert.equal(new Set(scenes.map((s) => s.id)).size, scenes.length);
});

test('reelkit captions use script words (no tags/markup) on Whisper times, captionText mapped', async () => {
  const { captionWords } = await import('./render/reelkit.mjs');
  const script = { segments: [
    { id: 's1', text: '[excited] OpenAI *השיקה* מודל.' },
    { id: 's2', text: 'שלושה וחצי ג׳יגה', captionText: '3.5 GW' },
  ] };
  const timing = { words: [
    { seg: 's1', start: 0.1, end: 0.5 }, { seg: 's1', start: 0.6, end: 0.9 }, { seg: 's1', start: 1.0, end: 1.4 },
    { seg: 's2', start: 2.0, end: 2.3 }, { seg: 's2', start: 2.4, end: 2.6 }, { seg: 's2', start: 2.7, end: 3.0 },
  ] };
  const w = captionWords(script, timing);
  assert.deepEqual(w.map((x) => x.word), ['OpenAI', 'השיקה', 'מודל.', '3.5', 'GW']);
  assert.equal(w[0].startSec, 0.1);
  assert.equal(w[3].startSec, 2.0);
  assert.ok(w.every((x, i) => x.endSec >= x.startSec && (i === 0 || x.startSec >= w[i - 1].endSec)));
});

test('reelkit stat parsing and zone placement', async () => {
  const { parseStat, zoneCenter } = await import('./render/reelkit.mjs');
  assert.deepEqual(parseStat('3.6 GW'), { prefix: '', value: 3.6, decimals: 1, grouped: false, suffix: ' GW' });
  assert.deepEqual(parseStat('$4,300'), { prefix: '$', value: 4300, decimals: 0, grouped: true, suffix: '' });
  assert.equal(parseStat('טריליון'), null);
  assert.deepEqual(zoneCenter({ x: 0, y: 0.17 }), { x: 0.5, y: 0.33 });
  assert.deepEqual(zoneCenter({ x: -0.24, y: 0.17 }), { x: 0.26, y: 0.33 });
});

test('reelkit Video.tsx template keeps its markers and components are self-contained', () => {
  const dir = new URL('./render/reelkit/', import.meta.url);
  const video = readFileSync(new URL('Video.tsx', dir), 'utf8');
  assert.ok(video.includes('const EPISODE: Episode = {} as Episode; // filled in by pipeline/render/reelkit.mjs'));
  assert.ok(video.includes('// @shot-imports (filled in by pipeline/render/reelkit.mjs)'));
  assert.ok(video.includes('const SHOTS: Record<string, React.FC<ShotProps>> = {}; // @shots (filled in by pipeline/render/reelkit.mjs)'));
  const names = new Set(readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => f.slice(0, -4)));
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
    const code = readFileSync(new URL(f, dir), 'utf8');
    const imports = [...code.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    // Reelkit: only Video.tsx may import sibling component files.
    assert.ok(imports.every((i) => ['react', 'reelkit/frame', 'reelkit/kit'].includes(i) || (f === 'Video.tsx' && i.startsWith('./') && names.has(i.slice(2)))), `${f}: ${imports}`);
    assert.match(code, new RegExp(`export const ${f === 'Video.tsx' ? 'Video' : f.slice(0, -4)}\\b`), `${f} exports its own name`);
    assert.match(code, /^\/\/ /, `${f} starts with a comment saying what it shows`);
  }
});

const cueScript = { segments: [{ id: 'a', text: '[excited] גוגל שילמה להם מאתיים וחמישים אלף דולר. כל הכבוד.' }, { id: 'b', text: 'ומה הלאה? עוד חדשות.' }] };
const cueTiming = (() => {
  const words = ['גוגל', 'שילמה', 'להם', 'מאתיים', 'וחמישים', 'אלף', 'דולר.', 'כל', 'הכבוד.'].map((w, i) => ({ seg: 'a', w, start: i * 0.5, end: i * 0.5 + 0.4 }))
    .concat(['ומה', 'הלאה?', 'עוד', 'חדשות.'].map((w, i) => ({ seg: 'b', w, start: 5 + i * 0.5, end: 5.4 + i * 0.5 })));
  return { totalDuration: 7, pauses: [], words, segments: [{ id: 'a', start: 0, duration: 4.92 }, { id: 'b', start: 4.92, duration: 2.08 }] };
})();

test('shot cues land on their spoken word, relative to the shot', () => {
  const plan = { shots: [
    { id: 'a1', segment: 'a', skill: 'reelkit', component: 'A1', cues: { paid: 'שילמה', money: { word: 'מאתיים', sfx: 'ding' }, late: 1.25 } },
    { id: 'a2', segment: 'a', skill: 'canvas', words: 'כל הכבוד', cues: { bravo: { word: 'הכבוד', delay: 0.1 } } },
    { id: 'b1', segment: 'b', skill: 'reelkit', component: 'B1' },
  ] };
  const list = resolveShots(plan, { script: cueScript, timing: cueTiming, fps: 30 });
  const [a1, a2, b1] = list;
  assert.deepEqual([a1.from, a2.from, b1.from], [0, 104, 148]);
  assert.equal(a1.frames + a2.frames + b1.frames, Math.round(7.5 * 30));
  assert.deepEqual(a1.cues.paid, { t: 0.5, sfx: null, volume: undefined, f: 15 });
  assert.equal(a1.cues.money.sfx, 'ding');
  assert.equal(a1.cues.late.t, 1.25);
  assert.equal(a2.cues.bravo.t, 0.65);
  assert.deepEqual(a2.words.map((w) => w.word), ['כל', 'הכבוד.']);
  // A cue whose word is spoken in another shot is refused.
  assert.throws(() => shotCues({ id: 'x', segment: 'a', cues: { k: 'הכבוד' } }, { start: 0, length: 3 }, { script: cueScript, timing: cueTiming }), /outside the shot/);
  assert.throws(() => shotCues({ id: 'x', segment: 'a', cues: { k: 'נוקיה' } }, { start: 0, length: 3 }, { script: cueScript, timing: cueTiming }), /not in segment/);
});

test('caption groups: a few words, never across a sentence end, held through short gaps', async () => {
  const { captionGroups } = await import('./render/reelkit.mjs');
  const w = (word, s, e) => ({ word, startSec: s, endSec: e });
  const groups = captionGroups([w('גוגל', 0, 0.4), w('שילמה', 0.45, 0.8), w('להם', 0.85, 1), w('המון', 1.05, 1.3), w('כסף.', 1.35, 1.7), w('כל', 2.5, 2.7), w('הכבוד!', 2.75, 3.1)], { fps: 30 });
  assert.deepEqual(groups.map((g) => g.words.map((x) => x.w)), [['גוגל', 'שילמה', 'להם'], ['המון', 'כסף'], ['כל', 'הכבוד']]);
  assert.equal(groups[0].to, groups[1].from);
  assert.ok(groups[1].to <= groups[2].from && groups[1].to > Math.round(1.7 * 30));
  assert.equal(groups[2].words[1].f, Math.round(2.75 * 30));
});

test('image treatments: bw and duotone map to the concept palette', () => {
  assert.match(treatmentFilter('bw'), /format=gray/);
  assert.match(treatmentFilter('duotone', { ink: '#000000', paper: '#ffffff' }), /geq=r='0\+\(255\)\*r\(X,Y\)\/255'/);
  assert.match(treatmentFilter('none', { alpha: true }), /format=rgba/);
  assert.throws(() => treatmentFilter('sepia'), /Unknown image treatment/);
});

test('episode data: component shots, canvas clips, cue sounds, concept palette and motif spans', async () => {
  const { buildEpisodeData } = await import('./render/reelkit.mjs');
  const { mkdtempSync, writeFileSync: wf } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const tmp = mkdtempSync(`${tmpdir()}/ep-`);
  const f = (n) => { const p = `${tmp}/${n}`; wf(p, 'x'); return p; };
  const plan = {
    images: [{ id: 'logo', source: { url: 'https://x/l.png' }, license: 'Public domain' }],
    shots: [
      { id: 'a1', segment: 'a', skill: 'reelkit', component: 'A1', images: ['logo'], cues: { money: { word: 'מאתיים', sfx: 'ding' } } },
      { id: 'a2', segment: 'a', skill: 'canvas', words: 'כל הכבוד', motif: false },
      { id: 'b1', segment: 'b', skill: 'reelkit', component: 'B1' },
    ],
  };
  const frames = resolveShots(plan, { script: cueScript, timing: cueTiming, fps: 30 }).find((s) => s.id === 'a2').frames;
  const assets = {
    elements: { logo: { file: f('logo.png'), w: 400, h: 200 } },
    canvas: { a2: { file: f('a2.mp4'), frames } },
    sfx: { ding: { file: f('ding.mp3'), duration: 0.5 } },
  };
  const video = { overlays: { enabled: false }, sfx: { enabled: true, volume: 0.6 }, music: { volume: 0.2 }, captions: { enabled: true, minWords: 2, maxWords: 9, maxChars: 52 }, reelkit: {} };
  const brand = { fps: 30, width: 1080, height: 1920, colors: { background: '#000', primary: '#fff', accent: '#0ff' } };
  const concept = { name: 'Test', palette: { bg: '#f2efe6', ink: '#111111', accent: '#d7ff3a' }, motif: { type: 'voiceline' } };
  const { data, files, plan: rk } = buildEpisodeData({ brand, video, script: cueScript, plan, timing: { ...cueTiming, voiceFile: f('voice.wav') }, assets, overlays: { overlays: [] }, concept, levels: null });
  assert.deepEqual(data.shots.map((s) => s.kind), ['component', 'clip', 'component']);
  assert.equal(data.shots[0].images[0], 'logo');
  assert.equal(data.images.logo.src, 'assets/elements/logo.png');
  assert.equal(files['assets/shots/a2.mp4'], assets.canvas.a2.file);
  assert.deepEqual(data.audio.sfx.map((x) => [x.at, x.volume]), [[45, 0.6]]);
  assert.equal(data.palette.accentInk, '#111111');
  assert.deepEqual(data.motif.spans, [{ from: 0, to: data.shots[1].from }, { from: data.shots[2].from, to: data.totalFrames }]);
  assert.equal(data.captions.chip, '#d7ff3a');
  assert.ok(rk.scenes.every((s) => s.seconds <= 15) && rk.scenes.length >= 2);
  assert.throws(() => buildEpisodeData({ brand, video, script: cueScript, plan, timing: { ...cueTiming, voiceFile: f('voice.wav') }, assets: { ...assets, canvas: {} }, overlays: { overlays: [] }, concept }), /canvas shot a2 is not rendered/);
});

// ---------- footage mode (pipeline/video/source.mjs) ----------
import { keepRanges, remapTime, remapWords, transcriptSegments, editFilterGraph, sourceVideoFilter } from './video/source.mjs';
import { conformArgs } from './render/clips.mjs';

test('keepRanges keeps the words, cuts long pauses, measured silences and chosen ranges, on the frame grid', () => {
  const words = [{ start: 1.0, end: 1.4 }, { start: 1.5, end: 2.0 }, { start: 4.0, end: 4.5 }, { start: 4.6, end: 6.2 }];
  // 1.0–2.0 and 4.0–6.2 are two takes; the 2 s gap goes.
  assert.deepEqual(keepRanges(words, 8, { fps: 10 }), [[0.9, 2.2], [3.9, 6.4]]);
  // Whisper stretched "6.2" over a silence 5.0–6.0: it is cut, pads kept.
  assert.deepEqual(keepRanges(words, 8, { fps: 10, silences: [{ start: 5.0, end: 6.0 }] }), [[0.9, 2.2], [3.9, 5.2], [5.9, 6.4]]);
  // A false start removed by the director.
  assert.deepEqual(keepRanges(words, 8, { fps: 10, remove: [[0.9, 2.2]] }), [[3.9, 6.4]]);
});

test('remapTime / remapWords move source times into the edit', () => {
  const ranges = [[1, 2], [4, 6]];
  assert.equal(remapTime(1.5, ranges), 0.5);
  assert.equal(remapTime(5, ranges), 2);
  assert.equal(remapTime(3, ranges), null);
  assert.equal(remapTime(3, ranges, { snap: 'next' }), 1);
  assert.equal(remapTime(3, ranges, { snap: 'prev' }), 1);
  const words = remapWords([{ w: 'a', start: 0.8, end: 1.3 }, { w: 'gone', start: 2.5, end: 3.5 }, { w: 'b', start: 4.2, end: 4.6 }], ranges);
  assert.deepEqual(words.map((w) => [w.w, w.start, w.end]), [['a', 0, 0.3], ['b', 1.2, 1.6]]);
});

test('transcriptSegments cuts the transcript at sentence ends into a few segments', () => {
  const words = [];
  let t = 0;
  for (const sentence of ['one two three four five six.', 'seven eight nine ten eleven twelve.', 'thirteen fourteen fifteen sixteen.', 'bye now.']) {
    for (const w of sentence.split(' ')) { words.push({ w, start: t, end: t + 0.4 }); t += 0.5; }
  }
  const segs = transcriptSegments(words);
  assert.deepEqual(segs.map((s) => s.id), ['s1', 's2', 's3']);
  assert.equal(segs[0].text, 'one two three four five six.');
  assert.ok(segs.at(-1).text.endsWith('bye now.'), 'a tiny last sentence joins the one before');
});

test('the source edit graph cuts picture and sound together and conformArgs punches in', () => {
  const g = editFilterGraph([[0.5, 1.5], [2, 3]], { videoFilter: sourceVideoFilter({ width: 1080, height: 1920, fps: 30, color: { contrast: 1.1 } }) });
  assert.match(g, /\[0:v\]trim=start=0\.5:end=1\.5/);
  assert.match(g, /\[0:a\]atrim=start=2:end=3/);
  assert.match(g, /concat=n=2:v=1:a=1/);
  assert.match(g, /crop=1080:1920.*eq=contrast=1\.1/);
  const args = conformArgs('in.mp4', 'out.mp4', { width: 1080, height: 1920, fps: 30, frames: 90, start: 2, zoom: 1.2, focusY: 0.4 });
  assert.match(args[args.indexOf('-vf') + 1], /scale=1296:2304,crop=1080:1920:\(iw-1080\)\/2:\(ih-1920\)\*0\.4/);
  assert.equal(args[args.indexOf('-ss') + 1], '2');
});

test('image-writer is pixel-only: the kit never draws, and the guard refuses cameras, scenes and drawing calls', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = '.claude/skills/image-writer';
  for (const f of readdirSync(`${dir}/kit`)) {
    const code = readFileSync(`${dir}/kit/${f}`, 'utf8');
    assert.doesNotMatch(code, /Graphics|createGraphics|drawString|drawImage|fillRect|AlphaComposite|ConvolveOp|\boverlay\(/, `${f} must not draw`);
  }
  for (const f of readdirSync(`${dir}/examples`)) execFileSync(`${dir}/check.sh`, [`${dir}/examples/${f}`]);
  const bad = mkdtempSync(`${tmpdir()}/iw-`);
  for (const [name, body] of [
    ['Cam', 'Camera camera = new Camera();'],
    ['Draw', 'void f(java.awt.Graphics2D g) { g.fillRect(0, 0, 9, 9); }'],
    ['Ball', 'Sphere ball;'],
  ]) {
    writeFileSync(`${bad}/${name}.java`, `// "Scene" in a comment is fine\npublic class ${name} {\n  String s = "Camera";\n  ${body}\n}\n`);
    assert.throws(() => execFileSync(`${dir}/check.sh`, [`${bad}/${name}.java`], { stdio: 'pipe' }), name);
  }
  writeFileSync(`${bad}/Ok.java`, '// a Sphere and a Camera in a comment\npublic class Ok { String s = "Scene"; double d = Math.hypot(1, 2); }\n');
  execFileSync(`${dir}/check.sh`, [`${bad}/Ok.java`]);
});

test('dialogue: one multi-speaker request per part, split on pauseBefore', () => {
  const voice = { style: 'Sketch.', speakers: { Avi: { voiceName: 'Charon', style: 'sheepish' }, Beni: { voiceName: 'Puck' } } };
  const script = { segments: [
    { id: 'a', speaker: 'Avi', style: 'nervously', text: 'כן, *ברור*.' },
    { id: 'b', speaker: 'Beni', text: 'יופי!' },
    { id: 'c', speaker: 'Avi', pauseBefore: 2.5, text: 'ביי.' },
  ] };
  assert.equal(isDialogue(script), true);
  assert.equal(isDialogue({ segments: [{ id: 'x', text: 'hi' }] }), false);
  const groups = voiceGroups(script, voice);
  assert.deepEqual(groups.map((g) => [g.first, g.segments.length]), [[0, 2], [2, 1]]);
  const [two, one] = groups.map((g) => g.body);
  assert.match(two.contents[0].parts[0].text, /Avi: \[nervously\] כן, ברור\.\nBeni: יופי!$/);
  assert.deepEqual(two.generationConfig.speechConfig.multiSpeakerVoiceConfig.speakerVoiceConfigs.map((s) => s.voiceConfig.prebuiltVoiceConfig.voiceName), ['Charon', 'Puck']);
  assert.equal(one.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Charon');
  assert.throws(() => voiceGroups({ segments: [{ id: 'z', speaker: 'Dan', text: 'x' }] }, voice), /speaker "Dan" has no voice/);
});
