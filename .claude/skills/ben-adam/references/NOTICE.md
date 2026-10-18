# License and acknowledgments

`ben-adam` is a bilingual humanizer by **בר שאלתיאל**, brand **בינה מלאכותית בגובה העיניים**. MIT licensed.

## Original work
Both engines are original. The Hebrew engine (`PATTERNS-HE.md`, `LEXICON-HE.md`, `REGISTER-GUIDE-HE.md`) and the English engine (`PATTERNS-EN.md`), including their shared 4-level register spine, the 9-family taxonomies, the doubt rule, the priority tiers, all prose, and all examples, were written from scratch for this skill. The router (`SKILL.md`) and the enforcement script (`scripts/strip_long_dashes.py`) are original as well.

The raw material these engines describe, that AI text overuses certain words, leans on the em-dash, inflates significance, defaults to over-formal syntax, calques English idioms into Hebrew, and so on, consists of widely documented facts about language. Facts and methods are not subject to copyright. No text from any other project is reproduced here.

## Acknowledgments
The approach was informed by the open-source community's work on detecting AI writing tells, in both English and Hebrew. That influence is methodological. None of those projects' text appears in this skill.

Two sources deserve naming specifically, because several patterns in this catalog were added after reviewing them:

- **[Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)**, maintained by WikiProject AI Cleanup, which documents AI writing tells observed across thousands of edits. Wikipedia content is CC BY-SA; nothing from it is reproduced here, and the observations it records about English usage are facts rather than expression.
- **[blader/humanizer](https://github.com/blader/humanizer)** (MIT), an English-only humanizer skill built on that Wikipedia guide. Reviewing it identified four gaps in this skill: participial commentary (`1.6` / `2.7`), aphorism formulas (`1.7` / `2.8`), manufactured punchlines (`9.9` / `9.5`), and an explicit protect-list of human-writing signals. The gaps were real; the fixes are written from scratch here, in this skill's own family taxonomy and register system, with original prose and original before/after examples in both languages. The no-fabrication principle was likewise promoted to `Rule 0` in `SKILL.md` after seeing it argued well there.

Where the two skills disagree, this one wins by design. `blader/humanizer` lets a user-supplied writing sample override its em-dash rule; here the sample governs rhythm, vocabulary, and openings, but `Rule 5` (zero long dashes) is absolute and cannot be lifted by a sample.

## MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
