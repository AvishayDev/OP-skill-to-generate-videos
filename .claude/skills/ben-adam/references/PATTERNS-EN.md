# English pattern catalog - the English engine of ben-adam

**A reference of `ben-adam`.** The router loads this file when the detected prose language is English. Do not load it for Hebrew prose, where `PATTERNS-HE.md` runs instead. Several rules here are the mirror image of the Hebrew ones. English AI text *avoids* the plain copula and reaches for "serves as / boasts / features", while Hebrew AI text *overuses* the copula with "מהווה / משמש". Running the wrong engine on a span produces the wrong fix, which is why the router separates them.

**The core idea.** English AI text does not read as machine-written because it breaks rules. It reads that way because it is *over-produced*: inflated where plain words would do, padded with discourse scaffolding, and statistically smooth in a way human writing rarely is. This engine strips the over-production without flattening the writer's voice. The patterns are a signal, not a verdict. Humans under deadline, in a second language, or in compressed technical genres produce the same shapes, so use the flags to improve writing, never as the sole basis for a consequential decision.

## Register and how tags work

The skill uses one register spine for both languages, four levels. The English level names and their Hebrew equivalents:

| code | level | English equivalent | typical text |
|---|---|---|---|
| **F** | formal | רשמי | academic paper, legal doc, spec, official report |
| **E** | editorial | מאמר | journalism, professional blog, long-form LinkedIn |
| **M** | marketing | פוסט | social post, landing page, ad copy, product blurb |
| **C** | casual | דיבורי | chat, Slack, comments, quick notes |

Every pattern carries four tags, one per level: `F E M C`. The marks:
- `✓` fine at this level, leave it
- `✗` fix at this level
- `?` context-dependent, stop and ask the writer (the doubt rule)

The **doubt rule** works exactly as in the Hebrew engine: when a pattern is tagged `?` for the detected level, do not auto-fix. Quote the exact text and ask the user, with two or three concrete options. Ask as you hit each one, not in a batch at the end.

**Optional voice** (independent of level, set only if the writer asks or the input already has a clear one): *plain* (contractions, short sentences, first person allowed), *professional* (active voice, one concrete claim per paragraph, low hedging), *technical* (plain copulatives, one idea per sentence, define jargon on first use), *warm* (address the reader, cut intensifiers, no performative empathy), *blunt* (lead with the claim, periods over dashes, near-zero hedging). Where voice and level disagree on how strict to be, resolve toward the stricter.

**Nine families, plus one:**
1. Inflation
2. Vocabulary tells
3. Syntactic plastic
4. Discourse rituals
5. Service tone
6. Typography fingerprints
7. Attribution and evidence
8. Generation residue
9. Rhythm and uniformity
10. Voice and emotion

**Fix in every register** (`✗` at all levels): family 5 (service tone), family 8 (generation residue), em-dash overuse (6.1), and the clearest single-word tells in 2.1. Everything else depends on level.

---

## Family 1: Inflation

Raising the text above what the content earns: empty significance, promotional gloss, and intensifiers that assert importance instead of showing it.

### 1.1 Significance inflation
**Register:** `F✗ E✗ M? C✗`

Routine events dressed as history: "marking a pivotal moment in the evolution of", "a watershed moment for the industry", "ushering in a new era". State what happened and let the reader judge the scale. Test: if the sentence still works after you delete the inflation clause, delete it.

**Before:** "The update, marking a watershed moment for the payments space, adds split billing."
**After:** "The update adds split billing."

### 1.2 Promotional gloss
**Register:** `F✗ E✗ M? C✗`

Tourism-brochure prose: "nestled in a vibrant hub of innovation", "a thriving ecosystem of builders". Replace with plain fact. If you would not say it out loud to a colleague, cut it.

**Before:** "The team is nestled in the thriving tech ecosystem of the region."
**After:** "The team is based in the region, alongside about a dozen other startups."

### 1.3 Empty intensifiers on abstract nouns
**Register:** `F✗ E? M? C?`

`real`, `actual`, `genuine`, `true` stuck on an abstract noun to imply the rest of the field is fake, without naming the contrast: "real product-market fit", "genuine utility", "actual traction". This mirrors the Hebrew 2.6 ("אמיתי / ממש"). Flag by density.

**Carve-out (named contrast):** if the sentence says what the fake version is, keep it. "Actual revenue from paying customers, not grants" is honest contrastive writing. The tell is the unsaid contrast.

**Before:** "It has genuine traction and real staying power."
**After:** "It has 400 paying teams and a 6% monthly churn rate."

### 1.4 Superlative vocabulary
**Register:** `F✗ E✗ M? C✗`

`world-class`, `state-of-the-art`, `best-in-class`, `cutting-edge`, `unprecedented`. Each claims a ranking without a benchmark. Cite the comparison or cut the word.

**Before:** "a cutting-edge, best-in-class analytics layer"
**After:** "an analytics layer that runs queries in under a second"

### 1.5 Novelty inflation
**Register:** `F? E✗ M✗ C✗`

Treating an established idea as if the subject invented it: "she coined the term", "a concept nobody is naming", "the failure mode no one talks about". Most ideas in a piece are applications of existing concepts, not inventions. Claiming novelty reads as both promotional and uninformed. Describe what the person *did with* the idea instead.

**Before:** "He introduced a concept I had never heard: context windows."
**After:** "He walked through how context windows behave under load."

### 1.6 Participial commentary (the trailing -ing clause)
**Register:** `F✗ E✗ M✗ C✗`

A sentence states a fact, then bolts on a present-participle clause that comments on the fact's importance without adding information: "..., highlighting the growing role of", "..., reflecting a broader shift toward", "..., underscoring the need for", "..., cementing its position as", "..., making it a valuable tool for", "..., showcasing the versatility of", "..., demonstrating the importance of".

This is the most mechanical shape in the whole catalog, which is what makes it worth its own entry rather than living under 1.1. The model has finished the sentence, has nothing further to say, and reaches for a grammatical device that lets it say something anyway. The clause never survives a "so what": strip it and no information is lost.

**Test:** delete the comma and everything after it. If the sentence still carries every fact it carried before, the clause was decoration.

**Carve-out:** a participial clause carrying real new content is fine. "The API returned 429, forcing a retry with backoff" adds a consequence. "The API returned 429, highlighting the importance of rate limiting" adds nothing.

**Before:** "The tool launched in March, marking a significant milestone in the company's expansion into enterprise software."
**After:** "The tool launched in March. It was the company's first enterprise product."

### 1.7 Aphorism formulas
**Register:** `F✗ E? M? C✗`

An ordinary claim rewritten into a portable-sounding maxim: "X is the language of Y", "X is the currency of Z", "X is not a tool, it's a mirror", "the architecture of W", "X becomes a trap", "we don't have a K problem, we have an L problem". The shape promises depth and delivers a slogan. It is especially common in LinkedIn and personal-brand content, and especially damaging there, because the reader recognizes the mold even when they cannot name it.

The problem is precision, not ambition. "Trust is the currency of remote teams" sounds like a thesis but does not commit to a claim you could argue with. Replace the formula with whatever specific thing it was gesturing at, which is usually smaller, more useful, and more interesting.

**Carve-out (E/M):** a genuine aphorism the writer actually means, has earned in the piece, and would defend, is voice. The tell is the *stack*: three of these in one post, or one used as the closing line for weight it has not earned. One deliberate line stays. A pattern of them goes.

**Before:** "Attention is the currency of the modern web, and consistency is the architecture of trust."
**After:** "People give a page a few seconds before they leave. Posting on a regular schedule is what makes them come back."

---

## Family 2: Vocabulary tells

The words that appear far more often in AI text than human text. Organized in three tiers by how reliably each signals AI. Every entry covers its inflected forms (adverb, gerund, plural, conjugations) unless a form has a separate honest sense.

### 2.1 Tier 1, replace on sight
**Register:** `F✗ E✗ M✗ C✗`

These run 5 to 20 times more common in AI prose. Default replacements:

| replace | with |
|---|---|
| delve / delve into | dig into, look at, explore |
| leverage (verb) | use |
| utilize | use |
| robust | strong, reliable, solid |
| seamless / seamlessly | smooth, without friction |
| comprehensive | thorough, full, complete |
| pivotal | key, important, critical |
| cutting-edge | latest, newest |
| testament to | shows, proves |
| underscores | highlights, shows |
| meticulous | careful, precise |
| game-changer | (say what specifically changed) |
| tapestry / realm / landscape (metaphor) | (name the actual field or complexity) |
| paradigm | model, approach |
| embark | start, begin |
| beacon | (rewrite entirely) |
| nestled | sits in, is located in |
| vibrant / thriving / bustling | active, growing (or cite a number) |
| showcase / showcasing | show, demonstrate |
| deep dive / dive into | look at, examine |
| unpack | explain, break down |
| intricate / intricacies | complex (or name the specific complexity) |
| ever-evolving | changing (or say how) |
| daunting | hard, difficult |
| holistic | full, whole (or list what it covers) |
| actionable | practical, concrete |
| impactful | effective (or describe the impact) |
| learnings | lessons, takeaways |
| thought leader(ship) | expert (or describe the contribution) |
| best practices | what works, the standard approach |
| synergy / synergies | (describe the combined effect) |
| interplay | relationship, interaction |
| serves as | is |
| boasts / features (verb) | has, includes |
| commence | start |
| ascertain | find out, determine |
| endeavor | effort, attempt |
| the future looks bright / only time will tell | (cut, say something specific or nothing) |

### 2.2 Tier 2, flag when two or more cluster in a paragraph
**Register:** `F? E? M? C✓`

Fine alone, suspect together: harness, navigate, foster, elevate, unleash, streamline, empower, bolster, spearhead, resonate, revolutionize, facilitate, underpin, nuanced, crucial, multifaceted, ecosystem, myriad, plethora, encompass, catalyze, reimagine, cultivate, illuminate, juxtapose, transformative, cornerstone, paramount, poised (to), burgeoning, nascent, quintessential, overarching. Two in one paragraph usually means the paragraph wants a rewrite, not a word swap.

### 2.3 Tier 3, flag only at density
**Register:** `F? E? M? C✓`

Normal words AI simply overuses: significant, innovative, effective, dynamic, scalable, compelling, unprecedented, exceptional, remarkable, sophisticated, instrumental. One in a long piece is fine. Several in a short one means the text filled space with vague praise. Replace some with specifics: numbers, comparisons, examples.

### 2.4 Copula avoidance
**Register:** `F✗ E✗ M? C✓`

The mirror of the Hebrew copula problem. English AI avoids "is" and "has" with dressier verbs: "serves as", "stands as", "represents", "features", "boasts", "presents". They read like a press release. Default to "is" or "has" unless a more specific verb truly adds meaning.

**Before:** "The dashboard serves as a hub and boasts sub-second queries."
**After:** "The dashboard is one screen, and its queries run in under a second."

### 2.5 Synonym cycling
**Register:** `F? E✗ M✗ C✓`

Rotating synonyms to avoid repeating a word: "developers... engineers... practitioners... builders" across one paragraph. Human writers repeat the clearest word. If the same noun is right three times, use it three times. Forced variation reads as thesaurus abuse.

---

## Family 3: Syntactic plastic

Padding and hollow structures that add words or balance without adding meaning.

### 3.1 Filler phrases
**Register:** `F✗ E✗ M✗ C✗`

Mechanical padding: "in order to" (to), "due to the fact that" (because), "in terms of" (rewrite), "it is important to note that" (just state it), "the reality is that" (cut), "when it comes to" (talk about the thing directly), "at the end of the day" (cut).

### 3.2 Hedging
**Register:** `F? E? M✗ C?`

`perhaps`, `it could be argued`, `to be clear`, `it's worth noting that`. Make the point directly. Technical writing gets a pass on accurate "may / could".

### 3.3 Hedge-stacked predictions
**Register:** `F✗ E✗ M✗ C✗`

A modal plus a hedge adverb: "could potentially create", "may eventually unlock", "might ultimately transform". Each hedge cancels the next, leaving a sentence that asserts nothing while sounding careful. Pick one.

**Before:** "This could potentially reshape how teams may eventually collaborate."
**After:** "This changes how teams share work in progress."

### 3.4 Negative parallelism
**Register:** `F? E? M✗ C✗`

"It's not X, it's Y" / "This isn't about X, it's about Y". A rhetorical move AI uses to manufacture depth. Rewrite as a direct positive statement. At most one per piece, and only if it earns its place.

**Before:** "It's not just a tool, it's a whole new way of working."
**After:** "It changes the day-to-day work, not only the tooling."

### 3.5 Compulsive rule of three
**Register:** `F? E? M✗ C✗`

The triad that "sounds comprehensive": "faster, cheaper, and more reliable". Vary the grouping. Use two items, or four, or a full sentence. At most one "adjective, adjective, and adjective" per piece.

### 3.6 Parenthetical hedging
**Register:** `F? E? M✗ C✓`

Asides that sound nuanced without committing: "(and, increasingly, Z)", "(or, more precisely, Y)". If the aside matters, give it its own sentence. If not, cut it.

---

## Family 4: Discourse rituals

The structural tics: transitions, scaffolding lead-ins, and formulaic openers and closers.

### 4.1 Transition phrases
**Register:** `F✓ E? M✗ C✗`

"Moreover", "Furthermore", "Additionally" opening every other paragraph. Restructure so the connection is obvious, or use "and", "also", "on top of that".

### 4.2 Confidence-calibration phrases
**Register:** `F? E? M✗ C✗`

"It's worth noting", "Interestingly", "Notably", "Importantly", "Surprisingly", "the real question is", "at its core", "make no mistake". They tell the reader how to feel about a fact instead of letting the fact carry it. One "notably" in a long piece is fine, three in a short one is emphasis stacking. Flag by density.

### 4.3 Generic conclusions
**Register:** `F? E✗ M✗ C✗`

"The future looks bright", "Only time will tell", "As we move forward", "One thing is certain". Filler disguised as a conclusion. Cut, or write a closing thought specific to the argument.

### 4.4 "In conclusion / In summary"
**Register:** `F✓ E? M✗ C✗`

A good conclusion is obvious without the label. Drop the windup and let the last point land.

### 4.5 Inline-header lists
**Register:** `F? E✗ M✗ C✗`

Bullets where each item opens with a bold label that restates itself: "**Speed:** Speed improved by 40%." Strip the label and write the point, or make the items paragraphs.

### 4.6 Rhetorical-question openers
**Register:** `F✗ E? M? C✓`

"But what does this mean for teams?", "So why should you care?" used to stall before the point. If you know the answer, say it. A rhetorical question is earned by setup, not dropped as a section transition.

### 4.7 "Let's" constructions
**Register:** `F✗ E✗ M? C✓`

"Let's explore", "Let's break this down", "Let's take a look" as a false-collaborative warm-up. Just start with the point.

### 4.8 Numbered-list inflation
**Register:** `F? E? M? C✗`

"Three key takeaways", "Seven things to know". AI defaults to numbered lists because they are structurally safe. Use one only when the content genuinely has that many discrete, parallel items. If you are padding to hit the number, the list should not exist.

### 4.9 False concession
**Register:** `F? E? M✗ C✗`

"While X is impressive, Y remains a challenge", with both halves vague. It sounds balanced without weighing anything. Either make the concession specific or pick a side and argue it.

### 4.10 Engagement-bait hooks and closers
**Register:** `F✗ E✗ M? C?`

Formulas that manufacture curiosity or interaction instead of letting the content earn it. Now one of the loudest social tells. Mid-flow hooks: "Here's the thing", "Here's what's interesting", "The catch?", "The kicker?", "Plot twist:", "But here's the kicker:", "Let me explain", "here are N things I learned". Bait closers: "Let that sink in", "Read that again", "Save this for later", "Don't sleep on this", "Thank me later", "Trust me, you'll want this", "This one is worth your time:". Performative CTAs: "Thoughts?", "Agree?", "Who else?".

**Carve-out:** a genuine, specific call to action is fine. The tell is the empty formula. "Thoughts?" is bait; "What is the first thing you would build with this?" is a real question. In marketing one strong hook is craft, not a tell. Flag stacks of formulas, or a formula that leads nowhere.

**Before:** "Here's the thing. AI changes everything. Let that sink in. Thoughts?"
**After:** "Most people still use AI like a search box. What would you build first if it were a coding partner instead?"

---

## Family 5: Service tone

Chat-interface residue that has no place in writing. Fix at every level.

### 5.1 Chatbot artifacts
**Register:** `F✗ E✗ M✗ C✗`

"Certainly!", "I hope this helps", "Feel free to reach out", "Let me know if you need anything else", "In this article, we will explore", "Let's dive in". Remove entirely.

### 5.2 Sycophancy
**Register:** `F✗ E✗ M✗ C✗`

"Great question!", "Excellent point!", "You're absolutely right!". Conversational rewards from a chat UI, validating the reader rather than informing them. Remove.

### 5.3 Acknowledgment loops
**Register:** `F✗ E✗ M✗ C✗`

Restating the prompt before answering: "You're asking about", "To answer your question", "The question of whether". The reader knows what was asked. Just answer. Same for opening a section by recapping the previous one.

### 5.4 Reasoning-chain artifacts
**Register:** `F✗ E✗ M✗ C✗`

"Let me think step by step", "Breaking this down", "To approach this systematically", "First, let's consider". Chain-of-thought scaffolding leaking into prose. State the conclusion, then the evidence.

---

## Family 6: Typography fingerprints

Mechanical tells, independent of content.

### 6.1 Em-dash overuse
**Register:** `F✗ E✗ M✗ C✗`

The most recognizable tell, because the model reaches for it constantly. This skill's owner wants **zero** long dashes in the output, and that is absolute, not a doubt-rule item. Replace every — (U+2014) and every -- substitute with a comma, a period, or parentheses. Catch them in headings too. Before presenting, sweep the whole text and confirm zero. A bundled script (`scripts/strip_long_dashes.py`) enforces this deterministically when a shell is available, but you still do the smart context-aware replacement first.

### 6.2 Bold overuse
**Register:** `F? E✗ M? C✗`

Bold scattered across many phrases. At most one bolded phrase per major section, or none. If something is important enough to bold, restructure the sentence to lead with it. Marketing copy gets a little slack here.

### 6.3 Emoji in headers
**Register:** `F✗ E✗ M? C?`

No "## 🚀 What this means". Social and casual posts may use one or two at the end of a line, never mid-sentence and never in a heading.

### 6.4 Title-case headings
**Register:** `F? E✗ M✗ C✗`

"Strategic Negotiations And Key Partnerships" instead of sentence case. Use sentence case for subheadings. Title case only for the main title, if at all.

### 6.5 Hyphenated-pair overuse
**Register:** `F? E? M? C✓`

Stacked compound modifiers: "a high-quality, well-architected, future-proof solution". Cut to the modifier that matters. Also fix the predicate error: hyphenate before the noun ("a high-quality report") but not after a linking verb ("the report is high quality").

### 6.6 Curly quotes (weak signal)
**Register:** `F? E? M? C?`

Curly quotation marks and apostrophes are a weak paste-from-chat signal, meaningful mainly in plain-text contexts like code comments or commit messages, where nothing auto-curls. Word, Docs, macOS, and iOS curl quotes by default, so most human prose has them too. Corroborating only, never conclusive. Do not flag curly apostrophes on their own.

---

## Family 7: Attribution and evidence

Claims that sound sourced or notable but carry nothing checkable.

### 7.1 Vague attributions
**Register:** `F✗ E✗ M✗ C✗`

"Experts believe", "Studies show", "Research suggests", "Industry leaders agree", with no expert, study, or leader named. Cite a specific source or drop the attribution and state the claim directly.

### 7.2 Notability name-dropping
**Register:** `F? E✗ M? C✗`

Piling prestigious references to manufacture credibility: "cited in the NYT, BBC, FT, and Wired". One reference with context beats four name-drops: "in a 2024 NYT interview, she argued...".

### 7.3 False ranges
**Register:** `F? E✗ M✗ C✗`

False breadth from unrelated extremes: "from the Big Bang to dark matter", "from ancient history to modern startups". Sweeping but empty. List the actual topics or pick the one that matters.

### 7.4 Speculative gap-filling
**Register:** `F✗ E✗ M✗ C✗`

When the model lacks a fact it fills the gap with hedged guesses dressed as background: "maintains a relatively low public profile", "is believed to have", "likely began his career in". Guesses formatted as statements, worse than an open admission of the gap because the reader cannot tell what is known from what is invented. Cut, or replace with a sourced fact.

### 7.5 Cutoff disclaimers
**Register:** `F✓ E✗ M✗ C✗`

"As of my last update", "While details are limited in available sources", "I don't have access to real-time data". Model limitations leaking into prose. Find the information or remove the hedge. Legitimate only in a genuinely formal hedge about evidence.

---

## Family 8: Generation residue

The highest-confidence tells. Not style choices, but leftovers from the generation process that a copy-paste missed. Their presence is near-proof the text was generated and shipped unedited. Fix at every level.

### 8.1 Unfilled placeholders
**Register:** `F✗ E✗ M✗ C✗`

Bracketed slot-fillers meant to be replaced before publishing: "[Your Name]", "[INSERT LINK]", "[describe the section]", "2025-XX-XX". Fill with real content or delete the sentence.

### 8.2 Leaked instruction labels
**Register:** `F✗ E✗ M✗ C✗`

Headings that are the prompt, not content: "Strong closing sentence", "Opening hook", "CTA here", "Main heading". A person does not write the scaffolding into the piece. The Hebrew mirror is 8.1 there. Delete the label, write the content.

### 8.3 Chat-tool markup and URL params
**Register:** `F✗ E✗ M✗ C✗`

Citation tokens that leak from chat UIs, and tracking parameters appended to generated URLs ("utm_source=chatgpt.com" and similar). Fingerprints, not patterns. Strip every token; keep a meaningful link but lose the parameter.

---

## Family 9: Rhythm and uniformity

Not a word or phrase problem but the shape of the whole text, and the one that does the most damage to how a piece reads. Fix every flagged word and leave the rhythm metronomic, and the prose is still a slog: uniform sentence length flattens emphasis, because nothing stands out when everything is the same size. Human prose has burst and variation. Most of these are `?`: surface them and ask, since changing rhythm is an editorial choice.

### 9.1 Sentence-length uniformity
**Register:** `F? E? M? C?`

If most sentences run 15 to 25 words, the text sounds robotic. Mix short punchy sentences (3 to 8 words) with longer ones. Fragments work. A question breaks the monotony.

**Persuasive-repetition carve-out (register M).** In sales copy, deliberate repetition and short staccato lines are a rhythm device, not always a tell (the Hormozi/Brunson cadence). Distinguish *intentional* persuasive repetition (two or three parallel beats that build, then break) from *mechanical* AI anaphora (four or more identical openings stacked as a list). Break the mechanical stacks. Keep two or three beats when they do persuasive work. This is the English mirror of the Hebrew rhetorical-anaphora carve-out (4.8 there).

### 9.2 Paragraph-length uniformity
**Register:** `F? E? M? C?`

If every paragraph is three to five sentences and the same size, vary it on purpose. Some paragraphs should be one sentence.

### 9.3 Over-polishing
**Register:** `F? E? M? C?`

Sanding away every irregularity is how you end up with the flat, uniform prose this whole catalog exists to fix. Natural disfluency, idiosyncratic word choices, and uneven pacing are the texture that makes writing sound like a person. Do not remove all personality in pursuit of clean prose. Applying every rule at maximum strictness recreates the uniformity you are trying to break.

### 9.4 Excessive structure
**Register:** `F? E✗ M? C✗`

More than three headings in under 300 words, or 8-plus bullets in under 200 words, or default scaffold headers ("Overview", "Key Points", "Summary"). Merge sections and use headers that say something specific.

### 9.5 Bullet lists of bare noun phrases
**Register:** `F? E✗ M? C✓`

Five or more consecutive bullets, each a short adjective-plus-noun phrase with no verb: "Stable performance / Reliable connectivity / Optimized throughput". The tell is the symmetry, every item the same shape and length, none asserting anything checkable. Convert to prose, or rewrite each as a full claim with a verb and a number. Genuine list content (changelogs, parameter docs, ingredients) is exempt.

**Marketing carve-out (important, register M).** In sales and social copy, a scannable bullet list is a persuasion feature, not a tell. People skim marketing; prosifying a clean list into a paragraph hurts skimmability and can make the copy *worse*. In M, do not auto-convert bullets to prose. Treat conversion as a doubt-rule ask, and lean toward keeping the list scannable while only fixing what is actually mechanical inside it (turning bare noun phrases into claims with a verb and a number, breaking a too-perfect ×7 symmetry down to a varied set). This mirrors how the Hebrew engine protects Hebrew Q&A headers. Keep the two engines consistent: do not prosify in English what you would have kept as structure in Hebrew.

### 9.6 Hashtag stuffing
**Register:** `F✗ E✗ M? C✗`

Six or more trailing hashtags on a short post, usually mixing a specific tag with broad category tags (#AI #Innovation #FutureTech). Near-universal in AI social output, rare in thoughtful human posts. Two or three specific tags maximum, or none. Extra strict on investor-facing posts.

### 9.7 Low information density (treadmill effect)
**Register:** `F? E? M? C?`

Read each paragraph and ask what is actually new. AI prose often restates the premise in fresh words instead of advancing it: lots of motion, no distance. If you could cut 40 to 60 percent and lose nothing, that is the tell. Name the one fact or turn each paragraph contributes, lead with it, and drop the throat-clearing.

### 9.8 Disconnected flow
**Register:** `F? E✗ M✗ C?`

The text jumps between topics with no logical bridge, or sets paragraphs side by side with no connective tissue. Each paragraph stands alone as a module, and you could reorder them without the reader noticing. Human writing builds a through-line where each paragraph leans on the one before. Quick test: if you can shuffle the paragraphs without breaking the piece, there is no thread, only a list. Add bridge sentences or establish a thesis each paragraph advances.

### 9.9 Manufactured punchlines and staccato drama
**Register:** `F✗ E✗ M? C✗`

Every sentence engineered to land, or a run of clipped fragments stacked to simulate tension: "Then the numbers came in. No warning. No pattern. No way back. Everything changed." Each line is built as a closer, so nothing is left to build toward, and the reader stops feeling the drama and starts hearing the machinery.

Two distinct shapes, and both need the same fix, which is to put the information back:

- **The engineered closer.** A paragraph ends on a quotable line that restates what the paragraph already said, in fewer words and a lower voice. Cut it; the paragraph already landed.
- **The fragment stack.** Three or more subjectless fragments in a row, usually negations ("No X. No Y. No Z."), doing tonal work in place of content. Collapse them into one sentence that says what actually happened.

**Note the tension with 9.1.** That entry tells you to break up uniform mid-length sentences and says fragments work. Both are true: variety is the goal, and a stack of fragments is just uniformity at a different length. One short sentence after three long ones is rhythm. Five short ones in a row is a drum machine.

**Carve-out (M):** in sales copy, a deliberate short-line cadence is a real device, the same carve-out as 9.1. Judge by whether the lines carry information. "Two clicks. No signup. Free." is a spec sheet with rhythm. "The rules were gone. Everything was different. Nothing would be the same." is fog.

**Before:** "Then the model shipped. No press release. No launch event. No warning. The field moved overnight."
**After:** "The model shipped without a launch event or a press release. Within a week, three competitors had changed their pricing."

---

## Family 10: Voice and emotion

The family that matters most for personal-brand and viral content, because it is the difference between a post someone finishes and a post someone scrolls past. Human writing has a stance, shown (not announced) emotion, and a point of view. A model with no stake in the subject defaults to neutral and flat, and flat writing does not hold a reader.

### 10.1 Emotional flatline
**Register:** `F✓ E? M✗ C✗`

Claiming an emotion instead of conveying it through the writing: "What surprised me most", "I was fascinated to discover", "What struck me was", "the most interesting part", and the bare header form "Interesting thing here:". If the thing is genuinely surprising, the reader feels it from the content, not from the announcement. These are also overused as list and transition lead-ins.

**Carve-out:** the fix is not "never say surprised". It is: if you claim an emotion, the writing around it must earn it. Otherwise cut the claim and present the thing directly.

**Before:** "The most fascinating thing I found was that it saves hours."
**After:** "It took a three-hour task and turned it into twenty minutes."

### 10.2 Relentless neutrality, no stance
**Register:** `F✓ E? M✗ C✗`

Where the genre wants an opinion, AI stays neutral. No "I think", no preference, no position. In a personal post, an opinion piece, or a professional argument, the absence of a voice is itself a tell. People follow humans with views, not balanced summaries.

**Carve-out:** in formal or reference writing (F), neutrality is correct. This is genre-dependent. Do not force an opinion onto text that should be factual.

**Before:** "AI has pros and cons, and everyone should decide for themselves."
**After:** "Most people use AI the wrong way, and it quietly costs them hours a week."

---

## Priority tiers (for triage on long documents)

When triaging a large piece, fix in this order:

**P0, credibility killers, fix immediately:** cutoff disclaimers (7.5), chatbot artifacts and sycophancy (5.1, 5.2), vague attributions (7.1), significance inflation (1.1), generation residue (family 8), hashtag stuffing on professional posts (9.6).

**P1, obvious AI smell, fix before publishing:** Tier 1 vocabulary (2.1), filler phrases (3.1), "let's" openers (4.7), synonym cycling (2.5), formulaic openings, bold overuse (6.2), em-dash frequency (6.1), generic conclusions (4.3), hedge-stacked predictions (3.3), empty intensifiers (1.3), bare-NP bullet lists (9.5).

**P2, stylistic polish, fix when time allows:** generic rule of three (3.5), uniform paragraph length (9.2), copula avoidance (2.4), transition phrases (4.1), Tier 3 density (2.3).

Use P0 and P1 for a quick pass. A full audit covers all three.

---

## Signs of human writing: protect these on sight

The warnings below tell you what not to flag. This list is the positive version, and it is the more useful one, because these are not neutral text you should leave alone. They are the *load-bearing* parts of a human voice, and every one of them is fragile under editing. When you see one, your instinct to smooth it is exactly wrong.

Run this list before you rewrite, not after. If a passage carries two or three of these, the correct edit is usually a light one.

- **Specific, hard-to-fabricate detail.** A street name, an odd number, "the guy who used to run the Tuesday standup", a brand nobody would name-drop. Models round specifics off toward the generic; humans hoard them. Never trade one of these for a smoother phrase.
- **Mixed feelings left unresolved.** "I think it's the right call and it still bothers me, and I can't fully explain why." AI defaults to a clean take. Do not resolve the tension for the writer.
- **Sentence-length variety that is already there.** If short and long already alternate, the rhythm is working. Do not regularize it in the name of flow.
- **Self-interruption.** Parentheticals, asides, a correction mid-sentence, a "(actually, that's not quite right)". Models almost never interrupt themselves. This is one of the strongest human signals in the list.
- **Era-bound and local reference.** Slang, a meme, an in-joke, a reference to something that happened locally last month. Models lag, and they flatten regional detail toward the international default.
- **A stated opinion the writer would defend.** Not a balanced summary of both sides, but a position. Sharpen it if it is buried; never neutralize it.
- **Plain words where a fancier one would fit.** A writer who says "use" and "start" instead of "utilize" and "commence" is already doing this engine's job. Do not upgrade them.
- **Deliberate repetition of the right word.** Saying "risk" four times because the piece is about risk. Elegant variation (2.5) is the AI move; repetition is often the human one.
- **A joke that is only medium-funny.** Models produce either no humor or clean setup-punchline humor. A slightly-off, slightly-too-long, in-group joke is a person.

The failure this list prevents: a rewrite that passes every check in this file and reads like nobody wrote it. Over-polishing pushes text back toward the statistical middle, which is where AI writing already lives.

---

## Over-correction warnings

The engine is a ruler, not a red pen.
- **Signals, not proof.** These shapes also come from second-language writers, deadline-pressed humans, and compressed technical genres. Pair the flags with context before judging authorship.
- **Self-reference exemption.** When the text is *about* AI writing (a tutorial, this file, a quoted bad example), do not flag the illustrative quotes. Only the author's own prose.
- **Technical genres.** In docs and technical writing, several Tier 1 words carry real meaning (robust, comprehensive, ecosystem, leverage as in platform leverage). Do not flag them there. Still flag delve, tapestry, beacon, game-changer.
- **Repetition can be right.** If the same clear word is correct three times, keep it. Forced variation is the worse tell.
- **Do not invent content.** A humanizer rewrites what is there. It does not add facts, quotes, or claims the writer did not make, even to smooth a transition. Inventing a sentence is a worse failure than leaving an AI-ism.
- **Keep real referents.** Product names, proper nouns, and technical terms are referents, not AI vocabulary. Leave them.
- **Protect marketing skimmability (register M).** Scannable bullet lists, short lines, and section structure are persuasion tools in sales and social copy. Do not prosify them by default. Fix what is mechanical inside the structure, keep the structure scannable, and stay consistent with how the Hebrew engine would treat the same post.
- **Persuasive repetition is a device, not always a tell (register M).** Two or three parallel beats that build are intentional sales rhythm. Break only the fully metronomic stacks (four or more identical openings).

Over-polishing human text sands off the texture that made it sound human in the first place. That is the opposite of the goal.

---

*The English engine of ben-adam. The ten-family taxonomy, the register spine, the prose, and the examples are original work by בינה מלאכותית בגובה העיניים. The individual flagged words and the linguistic observations behind them are widely documented facts about English usage and are not subject to copyright.*
