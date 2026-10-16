---
name: rights
description: Use whenever a file that neither you nor the user made enters a project (a clip from a video, a photo, a logo, music) and before anything is shared with the library - what to log, and what may and may not be shared.
---

# Rights and the asset log

Every project keeps one `ASSET_SOURCES.md` at its root. A file gets its row when it enters the project, not at the end: by the end nobody remembers where the fourth photo came from.

| file | used in | what it shows | source | author | licence |
|---|---|---|---|---|---|

- **Source** is a link that opens the page the file came from, or "generated here with <tool>", or "the user's own".
- **Licence** is the name on that page (CC0, CC BY 4.0, public domain) or, when there is none, "third-party, not licensed, local use only; needs clearance before any posting". Write that sentence in full. It is what stops the file being posted later.
- A CC BY or CC BY-SA file needs its author, the licence, the link and "modified: <what you did>" wherever it is shown or shared.
- A photo of an identifiable person carries more than copyright. A free licence on the picture does not cover the person in it. Say so in the row.
- Brand logos and product screenshots are their owners'. Use them only as the user instructs, and never share them.

## What may be shared with the library
Sharing is publishing: there is no unshare. Only when the user has said yes, in this conversation, to that item:
- components you wrote that carry none of the user's text, names, numbers or brand;
- media you generated here with code, or that is CC0 or public domain, with no identifiable person and no logo;
- CC BY or CC BY-SA media only with the full attribution in its description.

Never: clips cut from someone else's video, music stems, film or broadcast footage, photos of real people, portraits made to look like a real person, logos, screenshots of products, the user's voice or narration, anything whose row says "not licensed".

If the user said the project is private (`reelkit init --private`, `--no-share`, `REELKIT_NO_SHARE=1`), nothing leaves the machine: render with `--no-share` every time, and do not run `reelkit components share` or `reelkit assets upload --share`.
