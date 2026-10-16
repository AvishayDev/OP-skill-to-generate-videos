# Third-party components

| Component | Where | Source | Licence |
|---|---|---|---|
| reelkit skill | `.claude/skills/reelkit/` | reelkit.cc (see its `THIRD_PARTY.md`) | per its files |
| animate-in-code skill | `.claude/skills/animate-in-code/` | the user's skill | per its files |
| reelkit-cli (render engine, HyperFrames) | installed by the SessionStart hook | npm `reelkit-cli` | per the package |
| Library skill packs | `library/<pack>/` (fetched by `library/fetch.sh`) | `library/sources.json` (repo + pinned commit) | each pack's own LICENSE, copied with it: MIT, Apache-2.0, or the Remotion licence |
| Fonts | downloaded per project | Google Fonts (github.com/google/fonts) | SIL OFL / Apache-2.0 / UFL |
| Media in films | downloaded per project, never committed | Pexels, Pixabay, Wikimedia Commons, Freesound | per item, recorded in shots.json / audio.json → credits.txt |
