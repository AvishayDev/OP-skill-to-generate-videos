# Stage 2 — Script (any language)

Write the words that will be spoken, in natural, native `project.language` — written by a native speaker for
the ear, never translated from English in your head. Then run `voice <p>` at once: it measures the real length.

## Length budget
`words ≈ durationSeconds × wordsPerSecond` (config/languages.json; ~2.5 if missing) minus ~0.5 s per hard stop or
pause tag. 30 s ≈ 70 words, 60 s ≈ 145, 90 s ≈ 220, 3 min ≈ 430. For Japanese / Chinese / Thai budget characters
(`charsPerSecond`) and put a space between short phrases — captions and word timing split on spaces.
`voice` reports the real length: more than ~8 % over → cut words and `voice --force`. **Never speed audio up.**

## The voice of the script
- **Hook first.** The first sentence earns the next 3 seconds: a surprising fact, a bold claim, a question the
  viewer needs answered, a "you" sentence. Never a greeting, never the channel name, never "in this video".
- **A smart friend talking, not an announcer.** Casual, energetic, warm; lightly humorous where it fits; never
  childish (unless it is a kids' film — then gentle and clear).
- **Plain language.** No jargon a curious 14-year-old wouldn't know; if a term is unavoidable, say what it does.
- **Short sentences.** Mostly 3–10 words; split anything over ~14. Captions show whole short sentences.
- **Facts → twist.** Two or three concrete facts (names, numbers, the source "according to NASA"), then a dry
  one-liner or a takeaway. Every section ends on a punchline or a payoff.
- **A title line opens every section** — a half sentence that works like a headline, so the viewer knows what
  is next; from the second section on it starts with a native linking word ("Meanwhile,", "And then,",
  "ובינתיים,", "Mientras tanto,", "Entre-temps,").
- **Practical value** when the topic allows: what the viewer can do / try / watch out for.
- **Soft CTA at the end** (social formats): one line that invites a comment or a share — never
  "follow / like / subscribe". e.g. "Tell me in the comments which one surprised you." / "Send this to a friend who
  needs it." A promo may end on a direct CTA (the offer, the URL).
- **Accuracy:** only facts from research.md; jokes are about the facts, never instead of them.

## Audio tags (square brackets, English, sparingly — ~1–2 per section)
- Delivery (sets the mood from that point): `[excited] [curious] [surprised] [playfully] [mischievously]
  [whispers] [serious] [warm] [dramatic] [calm]` — any short English adjective works as a style.
- Sounds (at that spot): `[chuckles] [sighs] [gasps] [brief pause]` — at most one `[chuckles]` per script,
  never `[laughs]`. Don't put `[brief pause]` between segments (the pipeline adds one).
- Tags never reach the captions. The pipeline turns them into Gemini TTS styles / vocal tags.

## Format — `script.json`
One segment per section (≥ 3 s of speech each; the hook opens the first segment, the CTA closes the last —
no separate tiny hook/outro segments).
```json
{
  "title": "Why the sky is blue",
  "segments": [
    { "id": "hook", "text": "[curious] The sky isn't actually blue. Not the way you think. Sunlight is *every colour at once*…", "sources": ["https://…"] },
    { "id": "scatter", "text": "[excited] Here's the trick: tiny air molecules. …", "sources": ["https://…"] },
    { "id": "sunset", "text": "[warm] And at sunset? … [playfully] Tell me in the comments what you thought it was!", "sources": [] }
  ]
}
```
- `id`: short, lowercase, unique. `text`: exactly what is spoken. Wrap 1–2 keywords per segment in `*asterisks*`
  (that caption is highlighted).
- Optional `captionText` (what the screen shows when it must differ from the speech, e.g. "1.2 B" vs. spelled
  out), `style` (a few words of delivery for the whole segment).
- Names of products and brands stay in their original spelling. Write numbers so they can't be misread.
- **No narrator** (`project.json → "voice": "none"`): every segment gets `"seconds"` and usually empty `text`
  (or the on-screen words of a lyric / quote film, used for the plan only).

## Self-check
- Hook in the first sentence; CTA (or a payoff) in the last.
- Word count vs. budget; every fact traceable to a URL in `sources`.
- Each section: title line → facts → punchline; linking words from section 2 on.
- Then `node pipeline/cli.mjs voice <p>` — check `timing: word-level (…% matched)`; `estimated ⚠` means
  Whisper is missing (fix before producing).
