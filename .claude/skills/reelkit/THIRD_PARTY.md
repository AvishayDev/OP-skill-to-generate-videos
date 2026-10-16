# Third-party sources

Some guidance in these skills, and some starter-kit components, are adapted from three open-source motion-design skills. The first two target a different renderer (HTML pages captured with Playwright), so their engines, scripts and workflows are not used here; only renderer-independent design principles were taken and rewritten for Reelkit’s HyperFrames adapter.

- **Barty-Bart/motion-graphics** (`skills/motion-broll`), MIT License, Copyright (c) 2026 Bart.
  https://github.com/Barty-Bart/motion-graphics
  Adapted: pacing changes to spoken words, one idea per clip, never inventing data, and the list of banned effects.

- **howseen-ai/claude-motion-design** (`skill/motion-design`), MIT License.
  https://github.com/howseen-ai/claude-motion-design
  Adapted: spring presets, one accent colour, one thing moving at a time, no frozen frames, masked text reveals, determinism, truthfulness rules, and the idea of checking frames before calling a video done.

- **haidrrrry/claude-remotion-skill** (`remotion-motion-graphics`), MIT License.
  https://github.com/haidrrrry/claude-remotion-skill
  This one targets Remotion, so more carried over. Adapted into the starter kit (`src/hyperframes/kit`): the layer stack (background mesh, grade, grain, vignette), the combined entrance, the word-by-word reveal, Ken Burns with pan, spring and easing presets, and the starting palettes. Adapted into the skills: the animation rules, hero-colour rule, hit-hold-build rhythm, safe zones and common layout bugs. Its setup, render and sound-effect steps are not used; this project has its own pipeline.

- **A "CapCut-style animated captions" skill** supplied by the project owner as pasted text, source repository not stated.
  It burns captions in with FFmpeg subtitle files, which this project does not do. Adapted into the kit's `Captions` component (the pop, highlight and karaoke modes) and the `captions` skill (words per screen, timing, safe zones, contrast, shake and flash limits). Its engagement statistics were left out because they are unsourced.

- **Motion-graphics and launch-film skills from Skillry** (skillry.dev: the CreatorMotion effect library and the HyperFrames launch-film skills), read from the project owner's own downloaded copies.
  They build plain HTML and GSAP compositions with their own generators; none of their code, layouts, assets, fonts, images or wording is used here. Only methods were taken and written afresh for Reelkit: choosing an explaining graphic by what changes on screen, the shared order of drawing (line before label, evidence before verdict), a figure and its shape on one progress, a held reading state, limits on content that fail with advice, writing the scene changes down before the code, a size for every line of type, and building the riskiest shot first. They are in `explain-graphics`, `continuity`, `launch-film`, and the kit's `BarChart`, `TrendLine`, `DonutStat`, `CompareTable`, `FlowDiagram`, `ChatStack`, `CopyCorrection` and `Callout`, which are original components. A second pass over the rest of that collection (presentation, web, illustration and brand-style skills, and the localization film) gave, again as methods only: the locked looks, the spines for an argument and the headlines-alone test in `scriptwriting`, the written style contract and the reject list in `image-sets`, the timing and layout of `LanguageWheel`, and the idea of the three scripts in `tools/image`, which are written from scratch for Reelkit (Pillow and numpy only).

Used in: `motion-design`, `hyperframes-composition`, `scriptwriting`, `scene-treatments`, the starter kit, and the preview checklist in `SKILL.md`.

## The 3D typeface

- **liyupi/ai-promo-video-maker** (https://github.com/liyupi/ai-promo-video-maker), MIT License. A workflow for product films on a different renderer (Remotion) with its own scripts; none of its code, templates or wording is used. Ideas taken and written afresh for Reelkit: capturing the real product page as the film's material (`reelkit assets shot`), a check of the machine before starting (`reelkit doctor`), showing a choice of looks as frames, and the plain-words rules in `scriptwriting`.

- **Microsoft Fluent Emoji** (https://github.com/microsoft/fluentui-emoji), MIT License, Copyright (c) Microsoft Corporation. The 3D set is in the shared library as images, unchanged, each with this source, licence and credit in its record. Nothing of it is in this package.

- **shaders** (https://github.com/shader-effects-inc/shaders), MIT License, Copyright (c) 2026 Shader Effects Inc. The kit's `ShaderLayer` draws with this library's engine and components. It is not bundled with Reelkit: the published `shaders` npm package is downloaded, unchanged, the first time a composition uses `ShaderLayer`. Only the engine and components in that package are used; the presets, sections and design editor at shaders.com are under separate terms and are not used.

- **Inter** (Bold weight), by the Inter Project Authors (https://github.com/rsms/inter), SIL Open Font License 1.1. It is the one typeface bundled for the kit's `Text3D`, converted to three.js's typeface JSON (the Latin letters, digits, punctuation and a few symbols) and kept as data in `src/hyperframes/kit/inter-bold-typeface.ts`. The three npm package ships no typeface files, so the glyph outlines were taken from the Inter font files in the `@fontsource/inter` package; the outlines are unchanged apart from scaling to 1000 units to the em. The licence text, as shipped with that package:

```
Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) Inter-Italic[opsz,wght].ttf: Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

The 3D layer depends on `three` (MIT) and `@react-three/fiber` (MIT). Rendering uses `@hyperframes/engine` (Apache-2.0). Fonts are bundled locally from Fontsource; each family retains its original font licence in its installed package.

## Additional production references

The style recipes and external-production guide summarize the project owner’s supplied CapCut studio-editing reference and reviewed official Higgsfield and HyperFrames documentation. They adapt relevant craft and identify runtime boundaries; external editor code and services are not bundled. Sources: https://higgsfield.ai/skills, https://higgsfield.ai/plugins/blender, https://github.com/heygen-com/hyperframes/tree/main/skills.

## Keynote launch film

`reference/keynote-film.md` and the seven components of `examples/keynote-launch` adapt the film grammar, the copy patterns and the research steps of **a "Manus 2.0 style launch video" skill** (`bs-manus2-0-style-launch-video`) supplied by the project owner as a folder; its source repository and licence were not stated. That skill renders its own HTML pages with Playwright and generates media through FAL; none of its engine, scripts, fonts or icon data is bundled here. Adapted, and rewritten for Reelkit's HyperFrames kit: the colour and type scale, the motion vocabulary (word drop-in with re-centring, the slot divider, the dock launch, glass pairs, the burst, the pen marks, the end card), the beat sheet, the copy and truth rules, and reading the product's own site first. It is an independent style study, not affiliated with or endorsed by Manus, and uses none of that film's footage, music, characters or logo.

## Art-style catalog

`reference/art-styles.md` adapts the fifteen style films and prompts in **Vincentwei1021/mg-styles-15**, https://github.com/VincentWei1021/mg-styles-15. The motion recipes are translated for Reelkit rather than bundling the original renderer. Its MIT notice follows:

```
MIT License

Copyright (c) 2026 Vincentwei1021

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
