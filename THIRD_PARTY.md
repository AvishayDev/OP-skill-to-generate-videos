# Third-party components

| Component | Where | Source | Licence |
|---|---|---|---|
| reelkit skill | `.claude/skills/reelkit/` | reelkit.cc (see its `THIRD_PARTY.md`) | per its files |
| animate-in-code skill | `.claude/skills/animate-in-code/` | the user's skill | per its files |
| ben-adam skill | `.claude/skills/ben-adam/` | בר שאלתיאל (בינה מלאכותית בגובה העיניים), supplied by the user | MIT (`references/NOTICE.md`) |
| remotion-best-practices skill | `.claude/skills/remotion-best-practices/` | Remotion's agent skills v4.0.534 (remotion-dev/skills), supplied by the user | Remotion License (free for individuals and small teams) |
| competitive-ads-extractor skill | `.claude/skills/competitive-ads-extractor/` | supplied by the user | per its source |
| watch-video skill | `.claude/skills/watch-video/` | this repo | — |
| yt-dlp (used by watch-video) | installed by the SessionStart hook | PyPI `yt-dlp[default]` | Unlicense |
| reelkit-cli (render engine, HyperFrames) | installed by the SessionStart hook | npm `reelkit-cli` | per the package |
| Library skill packs | `library/<pack>/` (fetched by `library/fetch.sh`) | `library/sources.json` (repo + pinned commit) | each pack's own LICENSE, copied with it: MIT, Apache-2.0, or the Remotion licence |
| Fonts | downloaded per project | Google Fonts (github.com/google/fonts) | SIL OFL / Apache-2.0 / UFL |
| Media in films | downloaded per project, never committed | Pexels, Pixabay, Wikimedia Commons, Freesound | per item, recorded in shots.json / audio.json → credits.txt |
