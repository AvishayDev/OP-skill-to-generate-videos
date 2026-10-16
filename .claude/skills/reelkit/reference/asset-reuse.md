---
name: asset-reuse
description: Use when deciding whether to reuse a shared library image or generate a new one, and whether a new image may be shared.
---

# Reusing and generating images

## Order of work
For each scene that needs an image:
1. `reelkit assets search "<description>" --kind image` with the key subject and style words. Try a second, broader query if the first returns nothing.
2. Each result starts with a match percentage, the chance it is good enough to reuse. Pull the best one (`reelkit assets pull <id> --scene <sceneId>`) when its match is 60% or more and its description fits the scene. Otherwise `reelkit assets gen image --scene <sceneId>`.
3. When every scene is resolved, run `reelkit check` (it lists scenes with no image).

## When a candidate is close enough to reuse
The match is a guide, not the decision: read the description too. Reuse when the match is 60% or more and all of these hold:
- Same main subject (a glass of water is a glass of water).
- A compatible mood and style with the rest of this video.
- Nothing in its prompt contradicts the narration.

A slightly imperfect existing image is usually fine, and it is free, but below 60% generate. When every result is under 60%, generate a new image rather than lowering your bar to reuse the best of a weak set. Do not reuse when the subject differs, or when the same image is already used by another scene in this video (never give two scenes the same image).

## Generating
- Start from the scene's wanted prompt. Keep one consistent style across the video's images.
- Never ask for text, letters, logos or UI in the picture. `reelkit assets gen image` adds "No text, letters, numbers, logos or brand marks anywhere in the picture." to every prompt that does not itself ask for text or a logo.
- Generate one image per scene. Do not regenerate to chase small improvements.
- A film with several generated pictures follows `reference/image-sets.md`: one written style contract in every prompt, the set checked with `palette.py`, and a picture rejected for one named reason at a time.

## What may be shared
- shareable: true only for generic imagery with nothing specific to this user. Write those prompts in generic terms.
- shareable: false if the prompt mentions or depends on a brand, product, person, place or anything the user uploaded.
- If the user says a scene may not be shared, it stays private whatever you pass. A project made with `reelkit init <name> --private` shares no generated image, clip or graphic at all, whatever the plan's `shareable` says.
- Give 3 to 6 short lowercase tags (subject, style, mood); they are how later videos find the image.

## Small objects and 3D emoji
The library holds about 1,600 3D emoji as small pictures on a transparent background (Microsoft Fluent Emoji, MIT): faces, hands, people, animals, food, objects, transport, symbols. They are for the look where real-feeling little things float around a line of text, mark a list, or react to what was just said.
- Find one by what it is: `reelkit assets search "3d emoji rocket" --kind image`, then `reelkit assets pull <id>` (the ids start with `icon-fluent-3d-`).
- They are 256 pixels square. Draw one at up to about a quarter of a 1080 frame's width; larger than that it turns soft. They are objects in a scene, never its only picture.
- A scatter reads as designed when the things belong to one subject (a workday: clock, notebook, coffee, phone), sit at a few distinct sizes, leave the middle clear for the words, and each drifts or settles on its own slow curve. Six to twelve is a scatter; twenty is noise.
- Mix them with the user's own pictures and with the project's interface cards before reaching for more emoji.
- The library also has 117 glossy 3D objects (search `"3d icon <thing>"`, ids start with `icon-3dicons-`, 400 pixels, CC0) and about fifty app-style logo tiles of well-known services (search `"<name> logo"`, ids start with `icon-brand-tiles-`). A logo tile is that company's trademark: use it only to name or point at that service ("works with", "from your inbox to"), never to suggest it endorses the user's product, and not as decoration. The user's own logo comes from a file they gave.

## Logos of other services
The library has an app-style tile for each of these 53 services: the mark in white or black on a rounded square in the brand's colour, 512 pixels, transparent around it.

Android (`android`), Anthropic (`anthropic`), Apple (`apple`), Apple Music (`applemusic`), Behance (`behance`), Bluesky (`bluesky`), Claude (`claude`), Discord (`discord`), Dribbble (`dribbble`), Dropbox (`dropbox`), Facebook (`facebook`), Figma (`figma`), GitHub (`github`), GitLab (`gitlab`), Gmail (`gmail`), Google (`google`), Google Calendar (`googlecalendar`), Google Chrome (`googlechrome`), Google Drive (`googledrive`), Google Maps (`googlemaps`), Instagram (`instagram`), LINE (`line`), Mastodon (`mastodon`), Medium (`medium`), Messenger (`messenger`), Netflix (`netflix`), Notion (`notion`), PayPal (`paypal`), Pinterest (`pinterest`), Product Hunt (`producthunt`), Reddit (`reddit`), Safari (`safari`), Shopify (`shopify`), Signal (`signal`), Snapchat (`snapchat`), SoundCloud (`soundcloud`), Spotify (`spotify`), Stack Overflow (`stackoverflow`), Stripe (`stripe`), Substack (`substack`), Telegram (`telegram`), Threads (`threads`), TikTok (`tiktok`), Tumblr (`tumblr`), Twitch (`twitch`), Vercel (`vercel`), Viber (`viber`), Vimeo (`vimeo`), WeChat (`wechat`), WhatsApp (`whatsapp`), X (`x`), YouTube (`youtube`), Zoom (`zoom`).

- Pull one by its id, which is `icon-brand-tiles-` and the name in brackets: `reelkit assets pull icon-brand-tiles-whatsapp`. Searching works too: `reelkit assets search "whatsapp logo" --kind image`.
- Draw it like any pulled picture, `urls["assets/lib/icon-brand-tiles-whatsapp/image.png"]`, at up to about half a 1080 frame's width.
- Uses that are fine: naming where something comes from or goes to ("from Gmail to Notion"), a row of the services a product connects to, the apps a person juggles in a "too many tabs" scene, a "find us on" close with the user's own channels.
- Uses that are not: placing a logo beside the user's product as if that company backs it, a "trusted by" or "as seen on" row the user did not supply, changing the mark's colour or shape, animating it into something else, or scattering logos as decoration with no line of the script about them.
- A row of logos wants one size, even gaps and a calm entrance (a short stagger, each settling once). They are other people's identities: do not spin, squash or explode them.
- A service that is not in the list (LinkedIn, Slack and OpenAI are not) is shown from a file the user gives, or named in text. Never draw a company's logo from memory.
- The user's own logo always comes from their file, never from this set.
- Add a row to `ASSET_SOURCES.md` for each tile used: Simple Icons, CC0 for the drawing, the mark is its owner's trademark (`reference/rights.md`).

## Vector graphics

Use `reelkit assets gen svg "<prompt>"` for icons, logo-like marks, simple illustrations and diagrams: anything that must stay sharp when zoomed or that takes one flat accent colour. Use `reelkit assets gen image` for photos and textured art. Say the colours and "transparent background" in the prompt ("a flat teal rocket icon, two colours, transparent background"). It takes about 45 seconds and counts as one image against the image quota. With `--scene <id>` on an illustration scene the graphic becomes that scene's image; without it the file is saved as `assets/svg-<id>.svg` and you place it yourself with `<Img src={urls["assets/svg-<id>.svg"]} />`. The file is checked before it is saved: a graphic with a script or an outside link is refused and nothing is saved. `--private` keeps it from the library whatever the plan says.


## Components you pull from the library

Library components differ in how they count frames, so read the pulled file in `src/` before timing one to a spoken word. For each prop that takes a frame (`delay`, `at`, `tickAt`, `every`, `from`), find out what it counts from: the component's own first frame, or the frame after some fixed lead-in. Some add a hidden offset (a checklist whose `tickAt` has 10 frames added after its `delay`; a cursor that clicks 3 frames after `at`), and some have one uniform `every` for all their items instead of one time per item. Account for the offset in the number you pass, or write the item times out one by one.

A component that has only a `delay` (or nothing) starts from its own frame 0: wrap it, so that its frame 0 is the word's: `<Sequence from={onWord(s, "tasks")}><Card /></Sequence>`. Inside the `Sequence` its `delay` counts from there. Then look at `reelkit preview`'s word frame for that word: the component should already show what the word names.
