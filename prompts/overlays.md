# Stage 3b — Overlays (optional)

**Usually leave this empty (`{ "overlays": [] }`).** Logos, numbers and titles now live *inside* the shots, drawn
in the day's concept (prompts/visuals.md) — that is where they belong. `overlays.json` is a fallback layer that
floats a logo / number / title above any shot with the older glowing look; use it only when a shot can't carry
the element itself. Everything below applies only when you do.

## What to flag (read every segment of script.json)
| In the script | Overlay | How |
|---|---|---|
| A company or product people know (OpenAI, ChatGPT, Claude, Google, Nvidia, Meta, Mistral…) | `logo` | `search-logo "<company>"` |
| A gadget / device / chip (Vision Pro, a robot, an H200…) | `image` | `search-images "<product>"`, or the official press image (`type: "url"`) |
| A striking number ($4.3B, 3.6 GW, ×3, 1T parameters) | `stat` | `text` = the number, short; optional `label` (2–4 words in the film's language) |
| A key phrase / name worth seeing in writing | `title` | `text` = 1–4 words; optional `subtitle` = 2–4 words |
| A simple concept with an obvious symbol (chip, lock, robot, money, brain, warning) | `icon` | `search-icons "<english word>"` — at most 1–2 per video |

Rules of thumb:
- **4–7 overlays per video**, at most ~1 per 5 s, at most 3 per story. Pick the strongest moments.
- **Text moments (`stat`/`title`) are the film's graphics: 2–4 per video, ideally one per story.** While one is
  on screen the shot blurs and darkens behind it (Reelkit `FocusBackdrop`), a light flare blooms behind the
  text and a sound plays (stat: counter ticks, title: whoosh). Heavy Heebo, white with a soft accent glow
  (no box, no outline); a stat counts up to its number (a `%` stat also fills a ring) with its `label` in the
  accent colour under it.
- `subtitle` on a `title`: a secondary line in the accent colour that appears a beat after the title (like
  "שכבה דקה" / "כמו קליפה"). Use it **on about half the titles** — when a short explanation or punchline
  adds something; never just repeat the title. Keep title ≤ 4 words, subtitle ≤ 4 words.
- `icon` overlays are seasoning: **at most 1–2 per video**.
  Icons are small white flat glyphs — pick a filled, simple one that reads at a glance; never use an icon
  where a real logo exists (company → `logo`).
- No overlay in the first 1.5 s of the video unless it IS the hook (a logo or number can be).
- Names of real people go here (a `title`), never into image prompts.
- Story badges are off, so a logo on the company's first mention is the main way to name it on screen.
- Don't put a logo over a shot that already shows that logo.
- Overlays in the same `zone` must not overlap in time (`timeline` warns). Use `upperLeft`/`upperRight`
  for a second simultaneous item.

## Format
```json
{ "overlays": [
  { "id": "story2-logo", "segment": "story2", "anchor": "Google", "type": "logo",
    "source": { "type": "commons", "url": "https://thumb.wikimedia.org/…png" },
    "license": "Public domain", "credit": "Google logo / Wikimedia Commons", "page": "https://commons.wikimedia.org/wiki/File:…" },
  { "id": "story2-stat", "segment": "story2", "anchor": "3.6", "type": "stat", "text": "3.6 GW", "label": "חשמל ל-Google", "length": 3 },
  { "id": "story3-title", "segment": "story3", "anchor": "טריליון", "type": "title", "text": "טריליון פרמטרים", "subtitle": "פי עשרה מהקודם" }
] }
```
- `anchor` = a word or phrase copied exactly from the segment's `captionText` or `text` (asterisks
  don't matter). The overlay starts 0.15 s before it is spoken. Without `anchor` it starts at the
  segment start (+ `delay` seconds).
- Optional: `length` (s, default 2.5, never runs past the segment), `zone` (`upper` default,
  `upperLeft`, `upperRight`, `middle`), `in` / `out` transitions (`fade`, `zoom` — never on logo/image/icon overlays: Shotstack ignores their scale mid-zoom and they flash full-screen; `slideLeft`,
  `slideRight`, `slideUp`, `slideDown`, `wipeLeft`, `wipeRight`, `reveal`, `carouselLeft`…, add `Fast`/`Slow`),
  `scale` (0.5–1.5 × the default size), `style` (`card` = white rounded card — default for logos;
  `plain` = transparent PNG as-is — default for images), `sfx` (a sound name from `audio.json`, or `false`
  for silence — every type except icons has a default sound in `config/video.json` → `sfx.byType`; see prompts/audio.md),
  `subtitle` (titles only).
- Defaults per type live in `config/video.json` → `overlays`.

## Sources and rights
- Logos: Wikimedia Commons first — most AI-company logos are there as public domain (simple text
  logos). `search-logo` returns ready PNG URLs (SVGs pre-rendered). Otherwise the company's official
  press kit / brand page (`license: "Official press kit"`, `credit: "<Company>"`).
  Show a logo only when the story is about that company — never as decoration.
- Images: Commons (CC BY / BY-SA OK — credit goes into credits.txt) or official press images.
- Icons: `search-icons` returns ready `url`, `license`, `credit`, `page` — copy them as-is
  (`source: { "type": "url", "url": "…svg" }`). Flaticon results (only with `FREEPIK_API_KEY`) need the credit
  line in the post; Iconify sets are MIT/Apache/CC — also credited automatically.
- Record `license`, `credit` and `page` for every image overlay — `credits` picks them up.

## Check them
`node pipeline/cli.mjs overlays <p>` downloads and renders every image overlay to
`overlays/<id>.png` (free, no approval needed). **Read** each PNG: the right logo? current version?
readable? no stray background? Replace bad ones before producing.

In the Gate 1 message add one line: `✨ Overlays: N (logos a / numbers b / images c / titles d)`.
