---
name: motion-design
description: Use when deciding how a scene looks and moves - layout, typography, colour, springs, pacing to speech, continuity between scenes, and the rules that stop a video looking AI-generated.
---

# Motion design guidelines

Use these as starting craft choices, not a universal style. The selected look, source material and user direction decide the treatment; `reference/style-recipes.md` translates all supported style families into action, sound and review evidence. Engine constraints, factual source identity and actual speech timing remain requirements across looks.

## The user's uploads
`assets/index.json` lists the user's own files with a description of each. Ask for a logo as an SVG where the user has one: its edges stay sharp at any size, while a PNG softens when scaled up. Show each one only in the scenes whose userAssetKeys include it, sized and framed for what it is: a logo small and clean on a plain area; a screenshot framed in a device or browser mockup (search the library with `reelkit assets search "phone mockup" --kind component`, then `reelkit assets pull <id>`, which puts it in `src/`; if none fits, build a simple rounded framed card); a product photo large, with KenBurnsImage or a rounded card. Never stretch a logo, never crop a screenshot's important part, and never invent a screen when a real one was supplied.

## One system, start to end
- One base colour, one text colour and **one hero colour**, kept for the whole video. Roughly 60 percent base, 30 percent secondary surfaces, 10 percent hero.
- The hero colour appears on **at most one element per frame**: it tells the eye where to look. Highlight one word per headline, not the whole line.
- A soft glow is allowed on the hero element only. More than one glowing element per frame looks cheap.
- One typeface family, two weights. One icon style with one stroke weight.
- Carry one visual thread through every scene: the same badge style, accent shape or background treatment. Scenes should feel like one piece transforming, not slides.
- Where two scenes share an idea, carry an element across: the number becomes the badge, the word stays while its container changes. A shared element beats a fade.

## Layout
- One focal point per scene. Everything else supports it.
- Keep important content inside the middle 80 percent of the frame horizontally. On vertical video keep critical text in the middle 75 percent vertically: the platform's own buttons cover the top and bottom. Captions sit just above the bottom of that zone.
- On a 1080 by 1920 reel that means text stays clear of the top 250 pixels, the bottom 350, and 80 on each side (140 for anything that must be read, since tall phones crop about 100 from each side), plus 140 on the right in the lower half, where the app's own buttons sit. Backgrounds and graphics may run to the edge. On square and wide video keep text 6 percent in from every side.
- Zoom so that each state fills the frame. A small thing centred in an empty frame looks like a mistake.
- Reuse the same margins in every scene.
- Vary composition between scenes (centred, top-aligned, split) so the video is not one slide repeated.

## Typography
- Headlines 7 to 10 percent of the frame width; supporting text 3.5 to 5 percent. Never smaller than 3 percent: it must read on a phone.
- A message the viewer must read is at least 90 pixels tall on a 1080 wide video. Hero words run from 220 to 520. Interface text inside a recreated interface and tiny decorative technical labels are exempt.
- If any on-screen text is Hebrew, read `reference/hebrew-rtl.md` first. Set it in one of the kit's Hebrew faces and give its container `direction: "rtl"`. The Latin faces have no Hebrew letters. Good pairings: `heebo` or `assistant` for everything; `secularOne` or `karantina` headlines over `assistant` body; `suezOne` or `frankRuhlLibre` for an editorial feel; `varelaRound` or `fredoka` for a friendly one.
- Short lines, broken by meaning, not by width. A title should fit on one line where it can.
- Reveal Latin text with a masked rise (translate up from behind an overflow-hidden box), word by word, about 2 frames apart. Avoid plain opacity fades for headlines. Hebrew never uses a mask: its words enter whole (see `reference/hebrew-rtl.md`).

## Motion
- **Match the motion to the material.** Springs suit responsive UI and weighty arrivals; restrained eased motion suits calm or premium shots. Bounce, squash and overshoot suit playful scenes when deliberate. Useful spring starting points (stiffness / damping): snappy UI 320 / 30, containers 170 / 26, heavy type and logos 120 / 24.
- Use anticipation when it clarifies the move's direction or physical weight; a UI state change can respond immediately.
- Exits are faster than entrances. An entrance takes about 0.1 to 0.25 seconds.
- Linear motion suits steady scrolls or continuous travel; entrances and stops need an intentional easing or spring unless the chosen effect is a hard cut.
- **The camera is a group.** Put the whole scene inside one wrapper and move that: a slow push of 2 to 4 percent across a shot, on a softer spring than the content. Never scale text up by enlarging a container that holds it as an image; set the size so it stays sharp.
- **Choose the clock.** Use spoken triggers for narrated meaning and music beats for rhythmic decoration. Do not invent an event to fill every grid step.
- Stage attention. Stagger a list when each item matters; move related objects together when their shared action explains the idea.
- **Pace to speech.** Use actual word events for the ideas they name. `wordFrame` gives the word onset and `onWord` starts an entrance so it lands there; do not treat the entrance start as the semantic landing. A deliberate reading hold can span several spoken beats.
- Make the premise clear early. Change the picture when attention or meaning needs it; a useful pause, close-up or readable hold is not dead time.
- **Rhythm is hit, hold, build.** A fast move, then a hold of about half a second where nothing new enters, then the next move. Constant motion reads amateur; contrast reads expensive. During a hold, settled elements keep their slow breathe.
- A held pose can remain still. Add a slow drift only when it supports the look and keeps text sharp; do not force it onto footage or a reading-heavy shot.
- Let an element finish animating and stay readable for at least 1.5 seconds before it leaves. A label or phrase of more than one word stays at least 1.3 seconds; the closing title or message is held at least 1.5 seconds before the last frame. If the plan's length cannot fit that, lengthen the scene and tell the user.
- Counters and progress bars land on the event they explain, such as the spoken result or task completion; leave a readable hold afterward.
- Text that swaps inside a container that is also changing size needs its own exit and enter timing, or old and new text overlap.
- **Whatever a scene adds, the scene removes.** Every overlay, label and effect leaves when its moment ends. A leftover from an earlier scene is the most common thing a review finds.
- **Show what is being said.** A visual must clarify the current idea. Reuse a supplied object, picture or clip when continuity or comparison needs it; avoid unrelated repetition used to fill time.

## Legibility over images and footage
- Text over an image or footage needs help: a dim layer of 0.2 to 0.45 on the media, or a solid plate behind the text, plus a soft shadow.
- In footage mode keep overlays to one graphic at a time, clear of the subject.
- Use a punch-in on selected emphasis or to improve framing; calm personal speech may need none. Keep the face framed and avoid repeated resets. Do not add a second zoom over footage that already zooms.
- Add an insert where it clarifies the speech or demonstrates evidence, not merely because a timer elapsed.
- A punch-in softens 1080 footage. If the user can still choose, suggest filming in 4K when zooms are planned.

## Truth on screen
- Never show a number, quote, price, statistic or result that is not in the narration or on-screen text of the plan.
- A chart or gauge with no real data behind it uses relative shapes with no figures, or is labelled "Example".
- Do not invent product screens or features. A recreated interface that is not the user's real one is illustrative and should look generic.

## Determinism
- Never use `Math.random()` or the clock. A frame must render the same every time. Use `random(seed)` from reelkit/frame for any variation.
- Everything is a function of `useCurrentFrame()`. No CSS transitions or animations, no timers.

## Shape of a 30 second video
Hook (first 1.5 s: the boldest visual and claim) → context (one line, one visual) → body (three or four beats) → payoff (the result or number, the biggest animation of the video) → close (one action, calm).

## Motion blur and speed
- Do not fake blur on fast motion with a blur filter on everything. Keep a short blur (6 to 10 pixels for a few frames) for content swapping inside a container and for depth.
- A whole word sliding hundreds of pixels in a frame leaves separate ghost copies. Give it a directional blur that follows its speed, or shorten the travel.

## Product shots
- **One object, then the push.** A product shot holds one thing in the middle: a field, a card, a device, a number. Space around it reads as confidence, as long as the camera group is moving in on it.
- **Screens live in space.** A screenshot laid flat is a slide; set at 8 to 15 degrees of turn on a card with a deep soft shadow it is an object. Bring it in from a steeper angle and let it settle; turn it to face the viewer only when its content must be read.
- **Change the shot through the object.** The field grows into the card, the icon opens into the screen, the tile becomes the number. When nothing can be carried across, the old object leaves in 4 to 6 frames with a directional blur and the new one lands on a heavy spring.
- **Interface text is typed, tapped and sent, never faded in.** A field gets a caret and keystrokes, a button gets a press (down 4 to 8 percent, back on a snappy spring) and a visible result, a switch travels. The viewer should be able to tell what was touched.
- **A pointer needs a reason.** Move it on an eased path, slow it into the target, press, and let something change within two frames of the press.
- **Two tones of text.** Set a sentence in a muted tone and bring only its key word to full ink or the hero colour as it is spoken.
- **End smaller than you began.** After the payoff, the logo sits small and centred on the clean ground, with at most one line under it, held at least 1.5 seconds.

## Weight on the page
- Keep a scene under roughly 1,500 elements; beyond that draw on one canvas and redraw it each frame.
- Compute heavy geometry once, outside the frame function, and only position it per frame.
- Grain or paper texture is one static layer above everything, outside the camera group. Inside a zooming group it is slow and the grain swells into blotches.

## Techniques need a purpose
A flat field, fade, particles, glow, comic bounce or 3D transformation can be right for the chosen idea. Avoid combining them as generic decoration. Keep identity, hierarchy and readability intact. Placeholder copy, false product results and unrelated logos are defects regardless of style. Consult `reference/styles.md` and `reference/brand-motion.md` for techniques that fit the message.

## The studio test
Review the selected treatment against observable evidence:
1. There is one clear idea at each moment, and the eye knows where to look.
2. Motion starts, lands and holds intentionally, with the timing and weight the material needs.
3. Nothing is frozen longer than the look allows, and nothing shakes without a reason.
4. Every word reads at phone size, in the right order, uncut and not touching its neighbour.
5. Every colour comes from the palette that was agreed; no shade crept in on the way.
6. Departures from the treatment's defaults are intentional and preserve the user's direction.
7. Source identity, factual content and the requested style survive the motion and final hold.

## Check your own frames
Preview and fix observable defects; repeat after a real change or unresolved problem. If an approved shot does not fit, make the smallest layout or timing correction and explain it. A substantial change of message or concept needs user direction when it was not already delegated. Use `reference/delivery-review.md` to verify the export.

Run `reelkit preview`, then look at both frames of every scene in `out/preview/` (early at 30%, late at 90%) as a harsh director would. Hunt for: text overlapping during a swap, text cut by the frame edge, type too small for a phone, a frame with nothing in it, and anything that looks like a template. Fix what is real, then check again.

## Choosing a transformation

Change the shot when the idea changes or the same object must take a new role. Name the relationship first: question to answer, parts to whole, product to result, or result to brand. Keep the agreed palette and the actual identity through the change. Use `reference/brand-motion.md` to choose a 2D carry, clear cut or branded 3D arrival and its sound. A deliberate readable hold can remain still; do not add drift or a flip just to meet a motion quota.
