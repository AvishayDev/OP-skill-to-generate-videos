// Tests for the studio's general features: languages, aspect ratios, project config, narrator-less films,
// long films in parts, and prepared clips.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameSize, deepMerge, language, languages } from './lib.mjs';
import { computeSlots } from './video/slots.mjs';
import { partRanges, sliceEpisodeData, sceneChunks } from './render/reelkit.mjs';
import { conformArgs, videoTreatment } from './render/clips.mjs';
import { whisperPrompt } from './audio/tts.mjs';

test('frame sizes keep 1080 on the short side', () => {
  assert.deepEqual(frameSize('9:16'), [1080, 1920]);
  assert.deepEqual(frameSize('16:9'), [1920, 1080]);
  assert.deepEqual(frameSize('1:1'), [1080, 1080]);
  assert.deepEqual(frameSize('4:5'), [1080, 1350]);
  assert.throws(() => frameSize('3:2'), /aspect/);
});

test('languages: every entry has a TTS locale and a direction; unknown codes fall back sensibly', () => {
  for (const [code, l] of Object.entries(languages())) {
    if (code === '_default') continue;
    assert.ok(l.languageCode && typeof l.rtl === 'boolean' && l.name, code);
  }
  assert.equal(language('he').rtl, true);
  assert.equal(language('he').whisperModel, 'ivrit-ai/whisper-large-v3-turbo-ct2');
  assert.equal(language('pt-BR').code, 'pt');
  assert.equal(language('en').whisperModel, 'large-v3-turbo');
  const sw = language('sw');
  assert.equal(sw.languageCode, 'sw');
  assert.equal(sw.rtl, false);
});

test('project config deep-merges over the repo defaults', () => {
  const merged = deepMerge({ music: { volume: 0.17, query: 'a' }, sfx: { enabled: true } }, { music: { volume: 0.3 }, captions: { enabled: false } });
  assert.deepEqual(merged, { music: { volume: 0.3, query: 'a' }, sfx: { enabled: true }, captions: { enabled: false } });
});

test('narrator-less films: shots cut on "at" seconds or share a segment by weight', () => {
  const timing = { totalDuration: 10, pauses: [], words: [], segments: [{ id: 'a', start: 0, duration: 4 }, { id: 'b', start: 4, duration: 6 }] };
  const plan = { shots: [
    { id: 'a1', segment: 'a' }, { id: 'a2', segment: 'a', at: 1.5 },
    { id: 'b1', segment: 'b' }, { id: 'b2', segment: 'b', weight: 2 },
  ] };
  const slots = computeSlots(plan, timing, { tail: 0 });
  assert.deepEqual(slots.a1, { start: 0, length: 1.5 });
  assert.deepEqual(slots.a2, { start: 1.5, length: 2.5 });
  assert.deepEqual(slots.b1, { start: 4, length: 2 });
  assert.deepEqual(slots.b2, { start: 6, length: 4 });
});

test('long films split into parts of at most 16 scenes, each rebased to frame 0', () => {
  const fps = 30;
  // 40 shots of 6 s = 240 s → scenes of ≤ 15 s cut on shots → more than 16 scenes.
  const shots = Array.from({ length: 40 }, (_, i) => ({ id: `s${i}`, segment: `seg${Math.floor(i / 4)}`, from: i * 180, frames: 180 }));
  const scenes = sceneChunks(shots, { fps });
  const parts = partRanges(scenes);
  assert.ok(parts.length >= 2);
  assert.equal(parts[0].from, 0);
  for (let i = 1; i < parts.length; i++) assert.equal(parts[i].from, parts[i - 1].to);
  assert.equal(parts.at(-1).to, 40 * 180);
  assert.ok(parts.every((p) => p.scenes.length <= 16));

  const data = {
    fps, totalFrames: 7200, shots: shots.map((s) => ({ ...s, kind: 'component' })),
    overlays: [{ id: 'o', from: parts[1].from + 10, frames: 60 }],
    captions: { groups: [{ from: parts[1].from + 5, to: parts[1].from + 40, words: [{ w: 'hi', f: parts[1].from + 5 }] }] },
    motif: { levels: Array.from({ length: 7200 }, (_, i) => i), spans: [{ from: 0, to: 7200 }] },
    audio: { voice: 'assets/voice.mp3', music: null, sfx: [{ at: parts[1].from + 3, src: 'x', frames: 10, volume: 1 }, { at: 2, src: 'y', frames: 10, volume: 1 }] },
  };
  const p2 = sliceEpisodeData(data, parts[1], { voice: 'assets/voice.mp3', music: null });
  assert.equal(p2.totalFrames, parts[1].to - parts[1].from);
  assert.equal(p2.shots[0].from, 0);
  assert.equal(p2.overlays[0].from, 10);
  assert.equal(p2.captions.groups[0].words[0].f, 5);
  assert.deepEqual(p2.audio.sfx.map((x) => x.at), [3]);
  assert.equal(p2.motif.levels[0], parts[1].from);
  assert.deepEqual(p2.motif.spans, [{ from: 0, to: p2.totalFrames }]);
});

test('clips are conformed to the exact frame count, size and treatment', () => {
  const args = conformArgs('in.mp4', 'out.mp4', { width: 1920, height: 1080, fps: 30, frames: 95, start: 2, loop: true, treat: 'bw' });
  assert.ok(args.includes('-stream_loop'));
  assert.equal(args[args.indexOf('-frames:v') + 1], '95');
  assert.equal(args[args.indexOf('-ss') + 1], '2');
  const vf = args[args.indexOf('-vf') + 1];
  assert.match(vf, /scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080/);
  assert.match(vf, /hue=s=0/);
  assert.match(vf, /tpad=stop_mode=clone/);
  const contain = conformArgs('in.mp4', 'out.mp4', { width: 1080, height: 1920, fps: 30, frames: 10, fit: 'contain', pad: '#112233' });
  assert.match(contain[contain.indexOf('-vf') + 1], /pad=1080:1920:\(ow-iw\)\/2:\(oh-ih\)\/2:color=0x112233/);
  assert.equal(videoTreatment('none'), null);
});

test('Whisper prompt: names only for Latin-script languages, every Latin run otherwise', () => {
  const en = whisperPrompt({ segments: [{ text: 'Yesterday OpenAI and Google shipped 3 new things, and nobody noticed.' }] });
  assert.match(en, /OpenAI/);
  assert.doesNotMatch(en, /nobody/);
  const he = whisperPrompt({ segments: [{ text: 'אתמול OpenAI השיקה את gpt-5 החדש' }] });
  assert.match(he, /gpt-5/);
});
