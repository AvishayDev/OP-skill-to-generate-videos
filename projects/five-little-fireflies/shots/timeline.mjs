// Writes shots/timeline.txt (one spoken word per line: "segment word start end") for Fireflies.java.
import { readFileSync, writeFileSync } from 'node:fs';
const dir = new URL('..', import.meta.url).pathname;
const timing = JSON.parse(readFileSync(dir + 'timing.json', 'utf8'));
const clean = (w) => w.toLowerCase().replace(/[^a-z']/g, '');
writeFileSync(dir + 'shots/timeline.txt', timing.words.map((w) => `${w.seg} ${clean(w.w)} ${w.start} ${w.end}`).join('\n') + '\n');
