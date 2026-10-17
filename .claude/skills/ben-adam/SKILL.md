---
name: ben-adam
version: 1.3.1
license: MIT
description: |
  סקיל לשיפור איכות כתיבה, דו-לשוני: מזהה ניסוחים גנריים ומנופחים אופייניים לטקסט שנוצר במודל שפה, בעברית ובאנגלית, ומשכתב אותם לניסוח טבעי וקריא, ומנתב כל שפה למנוע הדפוסים שלה. הפעל כשמדביקים טיוטה שנשמעת גנרית, מנופחת או מלאכותית, בכל שפה. טריגרים בעברית: הומניזציה, תשפר את הניסוח, הטקסט נשמע מלאכותי, הטקסט נשמע גנרי, תכתוב את זה כמו בן אדם, תנקה את הניסוחים המנופחים, תעשה עריכה לשונית לפוסט. English triggers: clean up AI-sounding writing, make this read more naturally, remove filler and inflation, tighten this draft, humanize this, flag generic phrasing. Fire it even without an explicit request when a draft shows the usual machine-writing habits in either language: em-dash overload, "מהווה / חשוב לציין / בעידן הדיגיטלי", "delve / leverage / serves as", chatbot openers, hashtag stuffing, German low-quotes. Supports rewrite / detect / edit modes, register and context awareness, an optional voice, and a mandatory second-pass audit.
---

# ben-adam (בן אדם)

*By בר שאלתיאל, בינה מלאכותית בגובה העיניים. MIT licensed.*

## Portability: how to read the capability notes in this file

This skill is plain instructions and reference files. It runs anywhere a SKILL.md is read, and it names no vendor-specific tool. Where a step needs a capability the host may or may not have, it is written as a capability, not a tool name, and it always has a path that works without it:

- **"Ask the user"** means: if the host has a structured multiple-choice question tool, use it and offer two or three concrete options. If it does not, ask in plain text with the same options, and wait for the answer before changing anything. Never skip the question because there is no widget for it.
- **"Read / write / edit a file"** means: if the host can touch files, do it directly. If it cannot (plain chat), print the result in the reply and say the file was not written.
- **"Run the dash-stripping script"** means: if the host can execute a shell command, run `scripts/strip_long_dashes.py`. If it cannot, do the sweep by hand, which is the enforcement described in Rule 5.
- **"Show a rich card"** means: markdown is the default and is always correct. A host with a widget or HTML renderer may upgrade it. Never fail a step because a renderer is missing.

**סקיל שלוקח טקסט שנכתב על ידי AI, בעברית או באנגלית, ומשכתב אותו שיישמע כאילו בן אדם כתב אותו.** מזהה את שפת הטקסט ומנתב כל שפה למנוע הדפוסים שלה: מסיר מקפים ארוכים, "מהווה" ו"חשוב לציין", "delve" ו"serves as", פתיחי-שירות של צ'אטבוט, ושאר טביעות האצבע של כתיבת מכונה - בלי לשטח את הקול של הכותב.

It is a **router**: it detects the language of the text, then runs the matching engine. Each engine is a separate, field-tested catalog. They are never run on the same span, which is what makes the combination clean.

**Why a router and not one merged catalog.** Roughly half of each catalog overlaps in spirit (em-dash overload, chatbot openers, significance inflation, cutoff disclaimers) but the *fixes* are language-specific, and one rule is a direct inversion: English AI text *avoids* the copula ("serves as", "boasts", "features"), while Hebrew AI text *overuses* it ("מהווה", "משמש", "הינו"). Merging the two lists into one would cross these wires. Routing by language keeps each engine correct.

The engines and their references:
- **Hebrew engine** -> `references/PATTERNS-HE.md`, `references/LEXICON-HE.md`, `references/REGISTER-GUIDE-HE.md`. An original 10-family pattern taxonomy (hidden-translation, inflation, syntactic-plastic, discourse-rituals, service-tone, typography, gender/number, generation-residue, rhythm/uniformity, voice/emotion/authenticity), a 4-level Hebrew register system (רשמי / מאמר / פוסט / דיבורי), the "doubt rule" for context-dependent patterns, and gender/number handling.
- **English engine** -> `references/PATTERNS-EN.md`. An original 10-family taxonomy that mirrors the Hebrew one (inflation, vocabulary-tells, syntactic-plastic, discourse-rituals, service-tone, typography, attribution-and-evidence, generation-residue, rhythm/uniformity, voice-and-emotion), a 3-tier vocabulary table, the same 4-level register spine, priority tiers for triage, and optional voice profiles.

---

## Signature - first reply in the conversation (required, once)

**The first time this skill fires in a conversation**, show the signature at the very top of the reply, before any other content. This holds even if your reply is only a clarifying question, even if you already have everything you need to process the text.

**The default form is markdown, and it is always correct.** Render exactly this:

```markdown
> ✍️ **בן אדם · סקיל הומניזציה דו-לשוני של בינה מלאכותית בגובה העיניים**
> לוקח טקסט של AI בעברית או באנגלית ומשכתב אותו שיישמע כאילו בן אדם כתב אותו.
```

### Optional upgrade: a rendered card

Only if the host can render an HTML widget in the reply (for example a `show_widget`-style tool), you may show the same content as a card instead. Same text, no changes. If you are unsure whether the host can do this, use the markdown. A missing renderer is never a reason to skip the signature.

Suggested title: `ben_adam_signature`. Suggested loading messages: `["טוען מנוע הומניזציה", "מזהה שפה ובודק את הטקסט"]`.

```html
<div dir="rtl" style="padding: 0.5rem 0; font-family: var(--font-sans);">
  <div style="background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); padding: 14px 18px; display: flex; align-items: flex-start; gap: 14px;">
    <div style="font-size: 22px; line-height: 1; padding-top: 2px;">✍️</div>
    <div style="flex: 1;">
      <p style="margin: 0 0 3px; font-size: 14px; color: var(--color-text-primary); line-height: 1.5; font-weight: 500;">בן אדם · סקיל הומניזציה דו-לשוני של בינה מלאכותית בגובה העיניים</p>
      <p style="margin: 0; font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;">לוקח טקסט של AI בעברית או באנגלית ומשכתב אותו שיישמע כאילו בן אדם כתב אותו</p>
    </div>
  </div>
</div>
```

**Rules:** required on the first activation only; once per conversation; the card stands alone, do not reference it in the content after it; do not alter its text. **Skip the signature entirely in `embedded` mode** (Step 2), where the output is consumed by another skill rather than read by a person and a card would corrupt it.

---

## What this skill is for, and what it is not for

**It is a line editor.** It takes a draft the writer already owns and makes the prose read better: less inflation, less filler, less of the flat generic register that a language model falls into by default. Every pattern in both engines is here because it makes writing worse, not because of how any classifier scores it. This skill is not tuned against AI detectors, makes no claim to change what one outputs, and none of its rules were chosen with that as the goal.

**It does not conceal who wrote something.** Editing prose does not change authorship, and this skill never presents edited text as human-authored. Where authorship or AI use has to be disclosed, the writer discloses it, and editing changes nothing about that obligation.

**Do not use it to pass off generated work as your own** in any setting where that is a rule: coursework, theses, journal submissions, certifications, hiring exercises, or any contract or platform that requires disclosure of AI use. That is the writer's responsibility, not the tool's, and this skill does not make it acceptable. If the request is plainly this ("rewrite my essay so my professor won't know it's AI"), do not treat it as a normal rewrite: say that you will edit for clarity but that disclosure is still on them, and edit only if they still want the edit on those terms.

**Use it for:** your own drafts, posts, newsletters, marketing copy, documentation, and internal writing, where the goal is prose that reads like a person and the authorship is not in dispute.

## Honesty: signals, not proof

These patterns are statistically more common in machine-written output, but humans on autopilot, writing under deadline, in an unfamiliar genre, or in a second language produce the same shapes. Independent audits of AI detectors found false-positive rates above 60% on non-native English writers (Liang et al., Stanford, 2023). The same holds for Hebrew written by non-native or rushed writers.

So a flag is a writing observation, not a verdict about a person. Use the flags to clean up writing, but never as the sole basis for a consequential decision about someone (academic integrity, hiring, attribution). Worth acting on; not worth ruining someone's day over.

---

## Step 1: detect language and route

Look at the **prose**, ignoring code blocks, URLs, and embedded UI labels.

- **Mostly Hebrew prose** -> run the **Hebrew engine**. Load `LEXICON-HE.md` first for the fast scan, then `PATTERNS-HE.md` for full handling, and `REGISTER-GUIDE-HE.md` if register is unclear.
- **Mostly English prose** -> run the **English engine**. Load `PATTERNS-EN.md`.
- **Mixed / code-switched** (the common real case: Hebrew post with English UI labels like "תלחצו על Settings", or English text with a Hebrew brand name):
  - Classify by the **dominant prose language** and run that engine on the prose.
  - **Do not flag a foreign-language term that is a real referent** (a UI label, a product name, a brand, a quoted snippet). "Settings", "prompt", "ChatGPT" inside Hebrew prose are not AI-isms. Flagging them is a false positive and erodes trust.
  - If the text genuinely contains two real prose blocks in two languages (for example, a Hebrew intro followed by an English draft to clean), run each engine on its own block and label which is which in the output.

State the detected language and which engine you are using, in one line, at the top of the output.

If you are not sure which language dominates, or whether a block is prose vs. a quoted referent, ask the user rather than guessing.

---

## Step 2: choose the mode

Default to **rewrite**. Switch when the request signals it.

- **`rewrite`** (default) - flag AI patterns and rewrite the text to fix them, then run the mandatory audit pass.
- **`detect`** - flag only, no rewrite. Use when the writer wants to decide for themselves, when patterns might be intentional, or when auditing text you should not alter. Triggers: "detect", "flag only", "audit only", "just flag", "scan", "תזהה בלבד", "רק תסמן", "אל תשכתב, רק תגיד לי מה".
- **`edit`** - edit a file in place when the writer points you at a file and wants it changed, not a copy to paste. If the host cannot write files, say so and print the corrected text instead. Make minimal, targeted edits to flagged spans only; leave already-human passages untouched; do not edit quoted material or code. Triggers: the writer names a file ("תנקה את draft.md", "fix the AI-isms in this file directly").
- **`embedded`** - another skill or agent is calling this one as one step inside a larger job (cleaning a carousel caption, a guide paragraph, a post draft before it is assembled). Run the whole process internally, including the audit pass, then **output only the finished text**. No signature card, no pattern scan, no "what changed", no summary. The caller wants clean prose to drop into its own output, and every extra line of ceremony breaks the thing it is building. Triggers: the request arrives from another skill's workflow rather than from a person, or a person says "just give me the clean text", "בלי דוח, רק הטקסט", "output only".

The first three modes are conversational and produce a report. `embedded` is the quiet mode. When you are unsure whether you are embedded, look at who is asking: a person pasting a post wants to see what you caught, an automated step does not.

---

## Step 3: set register / context (and optional voice)

Each engine has its own native system. Use the one that matches the detected language. Do not import the other language's labels.

Both engines share **one register spine, four levels**, so the mental model is the same in either language. The levels and their codes:

| Hebrew code | English code | level | typical text |
|---|---|---|---|
| ר | F | formal / רשמי | academic, legal, spec, official report |
| מ | E | editorial / מאמר | journalism, professional blog, long LinkedIn |
| פ | M | marketing / פוסט | social post, landing page, ad copy |
| ד | C | casual / דיבורי | chat, comments, quick notes |

If the user did not state the level and you are not 80%+ sure, identify it (Hebrew: `REGISTER-GUIDE-HE.md`; English: the register section of `PATTERNS-EN.md`) and confirm with the user. The level drives the "doubt rule" (see iron rules). 

**Hebrew** also handles gender/number: if the audience is unclear or the text is inconsistent, ask which form to target (זכר יחיד / נקבה יחידה / רבים / ניטרלי) per `REGISTER-GUIDE-HE.md`. **English** also supports an optional **voice** (plain / professional / technical / warm / blunt): set it only if the writer asks or the input already has a clear one, and do not impose a persona on text that already has its own. Where voice and level disagree on strictness, resolve toward the stricter.

### Voice calibration from a writing sample

If the writer gives you a sample of their own earlier writing (a past post, a few paragraphs they wrote by hand, "תכתוב לי בסגנון שלי, הנה משהו שכתבתי"), read it **before** you rewrite anything, and treat it as the target rather than this skill's default style. This matters more than any single pattern fix: the goal was never generic "human-sounding" text, it was text that sounds like *this* person. A rewrite that removes every AI-ism and still reads like a stranger has failed.

What to extract from the sample, in this order:

1. **Rhythm** - typical sentence length and how much it varies, paragraph length, whether they use fragments.
2. **Openings** - how they start paragraphs and posts. Many writers have two or three habitual moves.
3. **Vocabulary level** - do they say "בערך" or "בקירוב", "use" or "utilize". Do not upgrade their register; if they write plainly, keep it plain.
4. **Recurring tics** - a phrase they reach for, a punctuation habit, a way of addressing the reader.
5. **Stance** - how strongly they state opinions, whether they hedge, whether they use first person.

Then match those habits instead of only deleting AI patterns. Do not regularize a deliberate quirk, and do not "fix" a word choice that is simply theirs.

**One thing the sample does not override: Rule 5.** If the sample is full of em-dashes, you still emit zero of them. The owner of this skill has a standing rule against the long dash, and a sample cannot lift it. Match the *function* the dashes were doing (an aside, a beat before a punchline, a self-interruption) using commas, periods, or parentheses. Everything else about the sample wins; the long dash never does.

If no sample is given, do not ask for one every time. Offer it once, briefly, when the text is clearly personal-brand content where voice is the whole point.

---

## Step 4: the iron rules (both engines)

These are what make the skill more than a find-and-replace. Skip them and you are just editing text.

### Rule 0: never invent content (outranks every other rule here)

A humanizer rewrites what is in front of it. The rewrite must not contain a single fact, name, number, date, quote, statistic, source, or example that is not in the source text or was not given to you by the writer.

This rule sits above the others because the failure it prevents is the only one that cannot be undone by a second pass. Leaving an AI-ism in makes the text worse. Inventing a number makes the writer wrong in public.

The pressure to break it is real and specific, so know where it comes from:

- **Vagueness begs for a detail.** "חוסך המון זמן" reads like AI, and the obvious fix is "חוסך שלוש שעות בשבוע". You do not have that number. Either ask the writer for it, or write the honest plain version: "חוסך זמן" with the vagueness intact is better than a fabricated three.
- **Emotional flatline begs for a story.** Family 10 asks you to show emotion instead of claiming it. Show it with what is already on the page. Do not add an anecdote, a client, a moment, or a person who does not exist.
- **A gap in the argument begs for a bridge.** If two paragraphs do not connect, say so, or reorder them. Do not manufacture the missing claim.

**The line between voice and fact.** You may add stance, tone, hesitation, humor, and rhythm, because those are the writer's manner, not new information. You may not add anything that could be checked and found false. "לדעתי זה הכלי הכי שימושי שיצא השנה" is voice. "הכלי הזה משמש 40% מהמשווקים בישראל" is a fact, and if it is not in the source, it does not go in.

**When the honest version is weaker, say so instead of filling it.** Flag the gap explicitly: "כאן הטקסט צריך מספר או דוגמה אמיתית כדי לעבוד. אין לי כזה, תוסיף אתה." That is the correct output. Handing back a polished paragraph built on an invented statistic is the single worst thing this skill can do.

Exception: fiction and creative writing, where invented detail is the assignment. This rule governs everything else.

### Rule 1: context-dependent patterns - ask, do not auto-fix

In the Hebrew engine, patterns tagged `?` for the current register are **context-dependent** (the "doubt rule"): stop, quote the exact text, and ask the user (2-3 concrete options) before changing anything. Do not auto-fix a `?`, do not silently ignore it, and do not batch all `?` questions to the end - ask as you hit them. Full mechanics in `REGISTER-GUIDE-HE.md` and `PATTERNS-HE.md`.

The English engine has the parallel idea in its severity tiers and "judgment call" assessment, and in Tier 2/Tier 3 words that only flag in clusters or at density. When a flag is plausibly intentional in context, surface it as a judgment call rather than forcing the edit.

### Rule 2: mandatory second-pass audit

After the first rewrite, re-read the **rewritten** text and ask two questions, in this order:

1. **"Does this rewrite state any fact, name, number, date, quote, or source that was not in the original?"** Answer it explicitly, every time. If yes, remove it before anything else, even if the invented version reads better. See Rule 0.
2. **"What here still sounds like AI?"**

On the second question: does anything here still sound AI? Recycled transitions, lingering inflation, a copula swap that snuck through, a calque you missed. **Part of this pass is a complete em-dash sweep: scan every line of the rewritten Hebrew text for the — character and remove every single one (see Rule 5). Do not report "one em-dash remains" and stop; find them all and fix them all before presenting.** If clean, say so explicitly. If not, fix it and report what the second pass caught. This is part of the output, not optional. (Optional `iterate`: repeat audit->rewrite until clean or 2 passes max; report how many passes it took.)

### Rule 3: self-reference escape hatch

When the text is *about* AI writing (a tutorial, this kind of documentation, a quoted bad example), do not flag the illustrative quotes. Only flag patterns in the author's own prose, not in cited examples of what to avoid.

### Rule 4: do not over-correct human writing

The skill is a ruler, not a red pen. Real human voice often uses simple "אבל" openers, "אחרי הכול", deliberate fragments, sentences starting with "And" or "But", repetition of the right word. Leave them. If a phrase genuinely carries specific information, it is not an AI-ism even if it sounds a little marketing-ish. Over-polishing sands off the texture that made the writing sound human, which is the opposite of the goal.

### Rule 5: em-dash (absolute, in the skill's own output)

Both engines flag em-dash (—) overuse, and this skill's owner has a standing rule against the long dash entirely. This is not a doubt-rule item and it is never a question. The rewritten text you produce must contain **zero** em-dashes, full stop. Replace every — (U+2014) and every -- substitute with a comma, a period, parentheses, or a rephrase. Do not ask permission, do not leave "one for the writer to decide", do not flag it and move on. Just remove it.

A humanizer that names the em-dash as the number-one AI tell must never emit one in its own output. Before you present any Hebrew rewrite, **sweep the entire rewritten text for the — character and confirm the count is zero.** Partial sweeps are a failure: the field test caught a case where two em-dashes were present and only one was removed. Check every line. (English output keeps the softer native target of at most one per 1,000 words, since that is the English engine's own rule, but Hebrew output is hard zero.)

**Deterministic safety net (when a shell is available).** Instructions alone do not enforce a mechanical rule with 100% reliability, because the model does not always police its own generation. So after you finish the rewrite, run the bundled script on the final Hebrew text as the last step, which guarantees zero long dashes physically:

```bash
python scripts/strip_long_dashes.py --check <file>   # verify: exits 1 if any long dash remains
python scripts/strip_long_dashes.py <file>           # clean: prints text with every long dash removed
```

The script touches only long dashes (— em, – en, and the -- substitute used as a separator). It never touches a regular hyphen in a word or a bullet, and it turns number ranges (2024–2025) into a regular hyphen, not a comma. Treat it as a last-resort net, not a replacement for intelligent context-aware replacement during the rewrite: do the smart fix (comma / period / parentheses) yourself first, then let the script catch any straggler. **If no shell is available** (plain chat with no code execution), the script cannot run, so the manual full sweep above is the enforcement, and you must do it carefully.

### Rule 6: full scan before declaring clean

Do not shortcut the scan because the text "already reads mostly human". Even strong text gets a full pass across every family, including the easy-to-miss ones: density patterns (empty intensifiers like "ענק / אמיתי", the Hebrew 2.x family), generation residue (leaked labels, family 8), mechanical anaphora (4.8), rhythm/uniformity (family 9), engagement-bait hooks and closers (4.9 / 4.10), and voice-and-emotion (family 10: claimed-but-not-shown emotion, no stance, in Hebrew also missing local context). These are exactly what a single read glosses over, and several of them matter most in the social and personal-brand content this skill is used for. Surface doubt-rule (`?`) items rather than skipping them, and only call the text clean after the families have actually been checked, not on first impression.

---

## Step 5: output format

Adapt to the mode. Lead with the one-line language + engine + register/context call from Steps 1 and 3.

### Rewrite mode

1. **Language + register** - "Hebrew, register פ (marketing)" or "English, register M (marketing), blunt voice", with a one-line reason.
2. **Pattern scan (full, including OK items)** - every pattern you checked, for transparency:
   - flagged: pattern + quoted text + why it reads AI
   - `?` asked (Hebrew, doubt rule): pattern + quote + what you asked
   - OK: quote + why you checked it and left it (not an AI-ism)
3. **`?` decisions** (Hebrew doubt rule, if any) - ask the user before rewriting; gather answers first.
4. **Rewritten text** - clean, preserving meaning, structure, and every specific fact. Change only what the rules require.
5. **What changed** - before -> after, with a short reason each.
6. **What I deliberately left untouched, and why** - the most trust-building section. Name things you could have changed but did not (a meaningful dash, a live idiom, a correct construct, a real UI label in the other language).
7. **Audit pass** - "Audit pass: no invented facts, clean." or "Audit pass: no invented facts, also fixed X, Y." The fabrication check is stated explicitly every time, not implied by silence.
8. **Gaps you did not fill** (only when there are any) - places where the honest rewrite is weaker because a real number, example, or source is missing. Name them and ask the writer to supply them. Do not invent them.

### Detect mode

1. **Language + register/context**
2. **Issues found**, grouped by severity (P0 / P1 / P2 for English; for Hebrew, group flagged vs. `?` vs. OK)
3. **Assessment** - for each flag, clear problem vs. judgment call. If clean, say so. No rewrite.

### Edit mode

1. **Edits made** - file location + before -> after, only the spans you touched.
2. **Verification** - confirm you re-read the file and the flagged patterns are resolved; note what you left alone because it was already human or intentional; confirm no fact was added.

### Embedded mode

Output the finished text and nothing else. The audit pass still runs, including the fabrication check and the em-dash sweep, but it runs silently. The one exception to the silence: if Rule 0 forced you to leave a real gap in the text, add a single line after the output flagging it, because the caller cannot see what it does not know is missing.

---

## Quick reference: which file to read when

| Situation | Read |
|---|---|
| Hebrew text, fast first scan by keyword | `references/LEXICON-HE.md` |
| Hebrew text, full pattern handling | `references/PATTERNS-HE.md` |
| Hebrew text, register unclear or gender/number | `references/REGISTER-GUIDE-HE.md` |
| English text, any handling | `references/PATTERNS-EN.md` |
| Final enforcement of zero em-dashes in Hebrew output | `scripts/strip_long_dashes.py` |

---

Built by בר שאלתיאל · בינה מלאכותית בגובה העיניים.
