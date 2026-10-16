# The starter kit

Library interface components (widgets, banners, lists) come small by default: an interface piece fills at least 70% of the frame width, so scale it with a wrapper or its size prop; and one typeface for the film: pass the film font where a component takes one, and prefer components that do.

```
Import from "reelkit/kit". Media props (src) take urls[key]; the kit components also accept the bare project path. For your own <Img>, <Audio> or <OffthreadVideo>, always pass urls[key]. Inside a SceneFrame, useCurrentFrame() starts at 0 for that scene.

SceneFrame { from: number; durationInFrames: number; enter?: Transition; exit?: Transition; transitionFrames?: number; origin?: { x: number; y: number }; color?: string; shape?: "circle" | "bar" | "diagonal"; children }
  Wraps one scene. Places children on the timeline and fades them in and out. enter and exit choose another transition: "fade" (the default), "cut", "zoom-in" (arrives from 1.25x and blurred, settling), "zoom-out", "zoom-through" (exit: scales up fast toward origin and blurs away; enter: the next scene arrives from small at the same point), "push-left" | "push-right" | "push-up" | "push-down", "whip-left" | "whip-right" (a fast slide with directional blur), "blur" and "turn" (a quarter turn in perspective about the vertical axis). Five more are hits meant for the beat: "color-push" (a flat field of color covers the frame as a "circle" growing from origin, a "bar" or a "diagonal" and uncovers the next scene: 10 frames), "rgb-whip" (a whip with the red and blue channels pulled apart and a smear: 6 frames), "flash" (white, or color, for 3 frames), "ring" (the scene closes into a ring of color that sweeps in to origin and the next scene opens out of one: 12 frames) and "flip" (a hard cut with ONE inverted frame). Their own lengths apply unless transitionFrames is set (a flash is never over 4 frames, a flip is always 1). The covers are fullest on the scene boundary, so changeFrame and cuesOnChanges put the hit on the boundary for color-push, flash, ring and flip and half the span before it for rgb-whip. A scene's exit and the next scene's enter are meant to be the same kind. transitionFrames is how long it takes (default 8, at most 20, never more than half the scene); origin is where a zoom aims, as fractions of the frame (default the centre). The exit plays in the last frames of its scene and the enter in the first frames of the next, so a transition is complete exactly at the scene boundary and the cuts stay on the beat.
  <SceneFrame from={s.startFrame} durationInFrames={s.durationFrames} enter="zoom-through" exit="zoom-through" origin={{ x: 0.5, y: 0.4 }}>...</SceneFrame>

TitleCard { text: string; subtitle?: string; color?: string; background?: string }
  Large centred title that springs in.
  <TitleCard text="Ship faster" subtitle="in three steps" background="#101020" />

LowerThird { title: string; subtitle?: string; accent?: string }
  Name/label strip that slides in from the left, low on the screen.
  <LowerThird title="Step 1" subtitle="Connect your account" />

Captions { words: WordTiming[]; mode?: "highlight" | "pop" | "karaoke"; highlight?: string; color?: string; perLine?: number; group?: "none" | "word" | "phrase"; maxWords?: number; uppercase?: boolean; bottom?: number; face?: string; rtl?: boolean }
  Word-timed captions near the bottom, on a dark rounded plate (about 58% opaque) in white so they read on any ground; the spoken word sits on a chip of highlight (the film's accent) with white or dark ink, whichever reads better on it (a karaoke fill is the accent mixed toward white until it reads on the plate). Pass the scene's words from the manifest. Pick one mode for the whole video:
  "highlight" (a line, spoken word coloured), "pop" (1-3 words popping in as spoken), "karaoke" (a line filling with colour).
  group decides which words share the screen: "word" is one word at a time, "phrase" groups words as they are spoken (a group ends at a sentence end ". ? !" and never spans two sentences, at a comma after three words, at a pause of 0.35 s, and holds at most maxWords words, default 3, and about 32 characters), "none" draws nothing. Pass the plan's choice straight through: group={manifest.captions}. Without group and perLine the groups are 3 words, never one; only the plan's "word" shows one word at a time. perLine alone counts the words as before.
  bottom is the distance from the bottom edge as a fraction of the height (default 0.16).
  For Hebrew narration pass face={font("heebo")} and rtl.
  <Captions words={s.words} mode="pop" highlight={palette.hero} uppercase />

Counter { from?: number; to: number; durationFrames?: number; prefix?: string; suffix?: string; color?: string }
  Centred number that counts up.
  <Counter to={10000} suffix="+" durationFrames={45} />

KenBurnsImage { src: string; zoom?: number; direction?: "in" | "out" }
  Full-frame image with a slow zoom and pan. src must come from urls[...]. Alternate direction between consecutive image scenes.
  <KenBurnsImage src={urls[s.imageKey]} />

FootageLayer { src: string; muted?: boolean; dim?: number }
  Full-frame user footage. Place it once, outside the scenes, as the bottom layer. dim (0-1) darkens it for legibility.
  <FootageLayer src={urls[manifest.footageKey]} dim={0.25} />

ClipLayer { src: string; muted?: boolean; dim?: number }
  Full-frame generated or library video clip as a scene's picture (treatment "clip"). Place it inside the scene's SceneFrame as the bottom layer, so it starts with the scene. When the scene is longer than the clip it holds the last frame; it never loops. dim (0-1) darkens it for legibility.
  <ClipLayer src={urls[s.clipKey]} dim={0.2} />

KeyedClip { src: string; x?: number; y?: number; scale?: number; muted?: boolean }
  A green-screen clip with the green keyed out (the transparent .webm, s.clipKeyedKey). Lay it over your own background or screenshot, below the captions. x and y place its bottom centre as fractions of the frame (default x 0.5, y 1: bottom centre); scale is its width as a fraction of the frame width (default 1). Holds its last frame when the scene is longer.
  <KeyedClip src={urls[s.clipKeyedKey]} x={0.5} y={1} scale={0.8} />

BgMesh { bg: string; hero: string; accent?: string }
  The bottom layer of the video: the base colour with two slow-drifting soft colour fields. Use it instead of a flat background.
  <BgMesh bg={palette.bg} hero={palette.hero} accent={palette.accent} />

Grade { color: string; strength?: number }   Grain { opacity?: number; blend?: "multiply" | "overlay" }   Vignette { strength?: number }
  Finishing layers, placed once at the very top of the video in this order: Grade, Grain, Vignette.
  Grade tints everything toward the hero colour so images and graphics read as one look (strength 0.10-0.15 on light themes, 0.18-0.25 on dark).
  Grain uses blend "multiply" on light themes and "overlay" on dark ones.
  <Grade color={palette.hero} /><Grain blend="overlay" /><Vignette />

Entrance { delay?: number; exitAt?: number; rise?: number; breathe?: boolean; style?; children }
  The standard way to bring anything in: fade + rise + scale on a spring, then a slow idle breathe. delay and exitAt are frames from the scene start; exitAt adds a faster exit.
  <Entrance delay={8} exitAt={s.durationFrames - 14}><Card /></Entrance>

WordReveal { text: string; delay?: number; per?: number; highlight?: string; highlightColor?: string; style? }
  Headline that rises in word by word from behind a mask. highlight colours one word.
  <WordReveal text="Stretch first, phone second" highlight="first" highlightColor={palette.hero} style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.09, color: palette.ink }} />

Act the product out (a claim is performed in a small believable interface, not stated)
  Which to reach for: a speed claim -> CounterRoll; an agent or a developer tool -> TerminalLog; an assistant -> PromptBox with a reply; a web product -> BrowserFrame with the user's own screenshot; collaboration -> NamedCursor over the screen it works on; a card, a ticket or a plan -> GlassPanel around your own content; a film's chapters -> ChapterFrame, once per scene, the same slots every time; the words that land the claim -> Headline. HudOverlay lifts any scene. Highlight at most three claims in 30 seconds and merely mention the rest.
  One timing convention for all of them: every time prop (delay, per, startFrame-like props) is a frame counted from the component's own mount, that is the frame useCurrentFrame() gives where it stands (inside a SceneFrame, the scene's own frame). Every one has a companion function that takes the SAME props and returns its event frames in that clock, so a sound sits on the frame the picture settles: add the scene's startFrame (or pass it as offset to cuesFor, below). Size: every one takes width, a fraction of the frame's width (default 0.86), and fits a 9:16 phone frame without numbers; its text is at least 0.032 of the frame's width (about 35 px at 1080). Every one takes hero (the accent), font and, where it has a panel, theme: "dark" (default), "light" or "glass"; themeFor(bg) gives "light" or "dark" for a ground colour.

PromptBox { text: string; cps?: number (22); chips?: string[]; reply?: string; replyCps?: number (70); placeholder?: string; hero?; theme?; font?; width?: number (0.86); delay?: number (6); sendPause?: number (9); replyDelay?: number (12); y?: number (0.5) }
  A rounded input with the question typed in at cps characters a second with a blinking caret, chips under it, a round send button that presses when the typing ends, then a reply that streams in below. Open a film with the user's own question typed into it when the product is an assistant or a tool. promptFrames(props, fps) gives { type: number[] (every character's frame), typedEnd, send, replyStart, reply: number[], end }; typedFrames(text, cps, fps, start?) gives the frame of each character.
  <PromptBox text="Can you answer Anna's refund email?" chips={["Relay", "Inbox"]} reply="Done. A warm reply is ready for your review." hero={palette.hero} />

TerminalLog { lines: { kind: "cmd" | "out" | "ok" | "warn" | "edit"; text: string; add?: number; del?: number; wait?: number }[]; rate?: number (3 lines a second); title?: string; status?: string ("Working"); checklist?: string[]; checkEvery?: number (16); maxLines?: number (8); speed?: number (8); hero?; theme?; font? (monospace); width?; delay?: number (6); y? }
  A window with a title bar, lines that stream in (cmd typed command, out plain, ok success, warn warning, edit a file changed with +add -del), an optional checklist whose items get struck through one by one, and a status line with an elapsed counter that becomes "Done". The newest line is at the bottom. terminalFrames(props, fps) gives { lines: number[], checks: number[], done }; lineFrames(lines, rate, fps, delay) gives the lines' frames alone.
  <TerminalLog lines={[{ kind: "cmd", text: "relay triage inbox" }, { kind: "edit", text: "drafts/anna.md", add: 18, del: 2 }, { kind: "ok", text: "Replies drafted" }]} checklist={["Read", "Draft", "Queue"]} />

NamedCursor { points: { x: number; y: number; click?: boolean; hold?: number }[]; name?: string; color?: string; hero?; font?; delay?: number (4); moveFrames?: number (22); size?: number (0.055) }
  An arrow with a coloured name pill (a teammate or an agent) that travels the points (fractions of the frame) on an eased arc, rests hold frames (10 on a click, 5 otherwise) and clicks with a ripple. Lay it over the screen it points at. clickFrames(points, { delay, moveFrames }) gives the click frames; cursorArrivals gives the arrival frames.
  <NamedCursor name="Maya" points={[{ x: 0.2, y: 0.8 }, { x: 0.7, y: 0.45, click: true }]} />

GlassPanel { children; hero?; glow?: string; theme?; width? (0.86); height?: number (fraction of the frame, default as tall as the content); tilt?: number (degrees, 0); delay?: number (0); radius?: number (0.06); padding?: number (0.05); y? }
  A slab for your own content: a near-black rounded panel (theme "light" for a pale one) with a hairline stroke lit along its top, a coloured glow pool behind it, an optional perspective tilt and an entrance that slides up and settles with a small overshoot. panelSettleFrame(delay, fps) is the frame it lands.
  <GlassPanel tilt={8} glow={palette.hero}><div style={{ color: "#fff", fontSize: width * 0.06 }}>Refund request</div></GlassPanel>

ChapterFrame { index: number; total: number; color: string; ghost?: string; caption?: string; badges?: string[] (up to 3); hero?; ink?; font?; delay?: number (0); children }
  The grammar of one chapter, as slots: "03 / 07" and a progress rule at the top, a large ghost word behind everything, children as the hero in the middle, up to three badges that pop in, one caption line at the bottom. color fills the frame and is the chapter's ground; ink is chosen to read on it. Use it once per scene with the same slots every time, or not at all. chapterFrames({ delay, badges }) gives { badges: number[] (the pops), progressDone }.
  <ChapterFrame index={3} total={7} color="#7C3AED" ghost="Speed" badges={["Instant", "Private"]} caption="Replies in seconds" hero="#FFD166"><CounterRoll to={94} suffix="%" ink="#fff" hero="#FFD166" /></ChapterFrame>

Headline { text: string; keyword?: string; emphasis?: "color" | "highlight" | "underline" ("color"); hero?; ink?: string ("#f4f4f5"); font?; width? (0.86); maxSize?: number (0.2, of the width); delay?: number (0); per?: number (4); align?: "center" | "left"; y? }
  Two to five words set heavy, entering word by word, with ONE keyword emphasised: the word in the hero colour, a block of hero that sweeps in behind it, or a bar that draws on under it. keyword must be one of the words (case and punctuation ignored) or it throws and lists the words. It breaks into lines of about 12 characters and is measured after layout, so it fills width and never leaves the frame. headlineFrames(text, { delay, per }) gives { words: number[], emphasisDone }.
  <Headline text="Answer every email" keyword="every" emphasis="highlight" hero={palette.hero} />

CounterRoll { to: number; from?: number (0); frames?: number (45); delay?: number (0); prefix?; suffix?; label?; decimals?: number (0); group?: boolean (true); hero?; ink?; font?; width? (0.86); maxSize?: number (0.3); y? }
  An odometer: the digits roll like wheels from from to to, easing out, and land exactly, in tabular digits. prefix and suffix and label take the hero colour. settleFrame({ delay, frames }) is the frame it lands (put the settle chime there); rollValue(frame, { from, to, frames, delay }) is its value.
  <CounterRoll to={12480} prefix="$" label="saved this month" delay={8} />

HudOverlay { labels?: string[] (up to 4, top left, top right, bottom left, bottom right); timecode?: boolean (true); scanlines?: boolean (true); hero?; ink?; font?; inset?: number (0.05) }
  Corner brackets, small monospace labels in the corners (your words), a running timecode from the frame and faint scan lines, over a scene. Labels are never below 0.024 of the frame's width. No events to time.
  <HudOverlay labels={["relay v2", "live"]} />

BrowserFrame { src: string; device?: "browser" | "phone"; scroll?: number (0.7, of the window's height); frames?: number (90); delay?: number (0); tilt?: number (-12 browser, -16 phone); url?: string; theme?; hero?; font?; width? (0.86 browser, 0.5 phone); viewAspect?; y? }
  A tilted browser window (or phone) carrying the user's own screenshot (src, a project path or urls[...]) that starts at the top and scrolls down by scroll, with a soft shadow and a sheen that sweeps once as it lands. CSS 3D. It never scrolls past the end of the picture. browserFrames({ delay }) gives { settled, sheenStart, sheenEnd }.
  <BrowserFrame src={urls["assets/screens/inbox.png"]} scroll={0.8} url="relay.app" />

Explain with a picture (a quantity, a comparison, a process or a correction is drawn in the order it is understood, not shown finished)
  Which to reach for, by what CHANGES on screen, never by how the last frame looks: a few quantities grow side by side -> BarChart; one quantity moves through time -> TrendLine; one share of a whole fills -> DonutStat; two options are judged point by point -> CompareTable; parts connect in order -> FlowDiagram (chain for steps, cycle for a loop, hub for one thing joined to many); people exchange messages -> ChatStack; one wording replaces another -> CopyCorrection; one detail of a picture already on screen becomes the point -> Callout. A line of the script that explains nothing new gets none of them.
  One grammar for all of them: nothing moves on frame 0 (the first thing starts 5 frames after delay); the line is drawn before its label, the evidence before the verdict; a figure and the shape that carries it share one progress, so they always agree; what has landed never moves again; the hero colour is on the one thing that is changing and ends on the point. Each ends on a still state: hold it for readFrames(text) frames (three words a second, never under 1.2 s) before the scene changes. Too many items or too long a text THROWS with what fits; it is never cropped or shrunk. All take hero, theme ("dark" | "light" | "glass"), font and delay like the product-surface components, are sized from the frame, set Hebrew right to left by themselves, and have a companion function with the same props that returns their event frames for sound.

BarChart { bars: { label: string; value: number }[] (2 to 6); title?; focus?: number (index that keeps the hero colour; default the largest, -1 none); target?: { value: number; label?: string }; prefix?; suffix?; decimals?: number (0); hero?; theme?; font?; width? (0.86); height?: number (0.5 of the frame's height); delay?: number (0); per?: number (14); grow?: number (34); y? }
  Columns that grow one after another from a baseline, each with its figure counting on top on the same progress. The scale starts at zero. The growing column is hero, landed ones settle to neutral except focus. target draws a dashed line at that value after the columns. barFrames({ count, delay, per, grow }) gives { axis, start[], land[], target, done }: a tick on each start, a soft hit on each land.
  <BarChart title="Replies an hour" bars={[{ label: "By hand", value: 12 }, { label: "Templates", value: 31 }, { label: "Relay", value: 94 }]} target={{ value: 60, label: "Goal 60" }} hero={palette.hero} />

TrendLine { values: number[] (3 to 12); labels?: string[] (one per value; first and last only when over six); title?; note?: string (up to 40 characters); prefix?; suffix?; decimals?; fromZero?: boolean (true); hero?; theme?; font?; width? (0.86); height?: number (0.36); delay?: number (0); frames?: number (60); y? }
  A line drawn left to right at a constant speed with each point landing as the pen passes it, and one large figure that reads the value under the pen, so it ends on the last value as the line does. note is the conclusion, set under the chart after the line is whole. fromZero={false} starts the scale at the lowest value: only when the film says so. trendFrames({ count, delay, frames }) gives { axis, start, points[], drawn, note, done }.
  <TrendLine title="Monthly revenue" prefix="$" values={[1200, 1900, 1700, 2600, 3400, 5200]} labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]} note="Four times in six months" hero={palette.hero} />

DonutStat { value: number; of?: number (100); label?: string (up to 28 characters); tags?: string[] (up to 3, 16 characters each); prefix?; suffix? ("%" when of is 100); decimals?; hero?; theme?; font?; size?: number (0.62 of the frame's short side); delay?: number (0); frames?: number (48); y? }
  A ring that fills to value out of of while the figure in its middle counts with it; they land together. The tags pop under it afterwards, the first in the hero colour. donutFrames({ delay, frames, tags }) gives { start, land, tags[], done }.
  <DonutStat value={72} label="closed without a person" tags={["Refunds", "Shipping", "Login"]} hero={palette.hero} />

CompareTable { columns: [string, string] (up to 14 characters each); rows: { label: string; a: string | boolean; b: string | boolean }[] (2 to 5; a cell text up to 16 characters, true is a check, false a dash); winner?: 0 | 1; hero?; theme?; font?; width? (0.88); delay?: number (0); per?: number (20); y? }
  Two options on the same points, row by row: the row's label, then its left cell, then its right; rows above never move again. winner marks that column in the hero colour after the last row. tableFrames({ rows, delay, per }) gives { header, rows[{ label, a, b }], verdict, done }.
  <CompareTable columns={["Before", "Relay"]} rows={[{ label: "First reply", a: "4 hours", b: "2 minutes" }, { label: "Weekends", a: false, b: true }]} winner={1} hero={palette.hero} />

FlowDiagram { nodes: string[] (labels up to 16 characters; chain 2 to 5, cycle 3 to 5, hub 3 to 6 with the hub first); layout?: "chain" | "cycle" | "hub" ("chain"); hero?; theme?; font?; width? (0.86); height?: number (0.6); delay?: number (0); per?: number (16); y? }
  A node lands, the connector from it draws, and only then does the node it leads to appear. A chain runs top to bottom in a tall frame and left to right in a wide one; a cycle's closing connector is last and is the payoff; a hub joins the first node to the others. The newest node is hero and the ones before settle; the hero colour ends on the outcome (a chain's last node, the hub, a cycle's closing connector). flowFrames({ count, layout, delay, per }) gives { nodes[], links[{ start, end }], done }.
  <FlowDiagram nodes={["Email arrives", "Relay reads it", "Draft is ready", "You approve"]} hero={palette.hero} />

ChatStack { messages: { from: "them" | "me"; text: string (up to 90 characters); name?: string }[] (1 to 4); hero?; theme?; font?; width? (0.86); delay?: number (0); per?: number (32); y? }
  A conversation that arrives one message at a time, about a second apart: "them" on the left in neutral, "me" on the right in the hero colour. Every bubble has its place from the first frame, so a landed message never moves. For a question typed to a product use PromptBox. chatFrames({ count, delay, per }) gives { messages[], done }: a pop on each.
  <ChatStack messages={[{ from: "them", name: "Anna", text: "My order never arrived. Can I get a refund?" }, { from: "me", text: "So sorry, Anna. The refund is on its way." }]} hero={palette.hero} />

CopyCorrection { wrong: string; right: string (up to 60 characters each); label?: string (up to 24 characters); hero?; theme?; font?; width? (0.84); delay?: number (0); read?: number (14); y? }
  A card with the wrong line lands, is held read frames, is struck through and badged with a cross, tilts and drops away, and the right line lands in the same place with a check in the hero colour. label stays above through the change. For a myth and the fact, a bad prompt and a good one, an old claim and the new. correctionFrames({ delay, read }) gives { card, strike, struck, discard, replace, check, done }.
  <CopyCorrection label="Subject line" wrong="URGENT!!! Open now for a deal" right="Your order ships tomorrow" hero={palette.hero} />

Callout { region: { x: number; y: number; w: number; h: number } (fractions of the frame, x and y the top-left corner); note: string (up to 44 characters); children (the picture, filling the frame); side?: "above" | "below" (the roomier one); hero?; font?; dim?: number (0.62); push?: number (0.03); radius?: number (0.02); delay?: number (0); restoreAt?: number }
  Darkens everything outside region, draws a hero ring round it, a short leader and the note, and pushes the picture in a little toward it: the detail stays in its context. restoreAt (a frame) lifts it all again, for a second Callout on the same picture. Wrap the user's own screenshot, a chart or a page. calloutFrames({ delay, restoreAt }) gives { scrim, ring, leader, note, settled, restore }.
  <Callout region={{ x: 0.06, y: 0.39, w: 0.88, h: 0.1 }} note="This row is the one that matters" hero={palette.hero}><Img src={urls["assets/screens/inbox.png"]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Callout>

Locked looks (a ground, an ink, one hero colour, a second colour and a headline face chosen together)
  looks.<name> is { palette: { bg, ink, hero, accent, dim }, display, note?, about }; lookFace(name) is the family for its headlines and lookFace(name, "note") the one for its single handwritten or monospace accent. The names: typeMonolith, darkStage, colourField, studioObject, warmEditorial, photoPoster, nightPitch, acidStudio, softPastel, zine, popPrimary, paperMarker. Take one whole when the user has no brand colours and keep it for the film; the ink reads on the ground at 7 to 1 or better and the hero colour is for one element a frame.
  const look = looks.zine, face = lookFace("zine");  <Headline text="Read this first" keyword="first" hero={look.palette.hero} ink={look.palette.ink} font={face} />

LanguageWheel { product: string; languages: (string | { code: string; phrase?: string })[] (two or more BCP 47 codes); timing?: { hold?, move?, loops?, outro? } (seconds); ink?: string ("#111111"); font?; y?: number (0.5); lineSpacing?: number (0.9); webFonts?: boolean (true); delay?: number (0) }
  "Acme now speaks your language": the product name set heavy and never moving, and a wheel on which each language names itself in its own words and script ("auf Deutsch", then Japanese or Arabic in their own letters) and rolls up into place while the next waits faintly below. Beside the name in a wide frame, under it in a tall one. Each language rests 0.62 s and rolls 0.38 s (shorter above twelve, so the whole stays near 18 s); the first one opens and closes it, so it loops. Only languages the user's product really has. languagePhrase(code) is the phrase for a code; a code with none throws and asks for one. wheelFrames(count, wheelTiming(count)) is its length in frames (give the scene that many) and wheelEvents(count, wheelTiming(count)).arrive the frame each language rolls in, for a tick or a spoken clip. Non-Latin scripts take their Noto Sans face from the web when online and the system's face when not: look at a frame of each script.
  <LanguageWheel product="Acme" languages={["en", "de", "ja", "pt-BR", "ar"]} />

CardFan { children (3 to 7); aspect?: number (0.72, a card's width over its height); width? (0.9); spread?: number (14, degrees); overlap?: number (0.38); radius?: number (0.07); shadow?: string; delay?: number (0); per?: number (3); y? }
  A hand of cards dealt into a fan: the children start upright and a little low and are dealt from the middle outward onto a shallow arc, each leaning away from the centre, the middle one on top. Each child fills a card of the same size (an Img with width and height 100% and objectFit "cover"). For several screens of one product or a set of photographs seen at a glance. fanFrames({ count, delay, per }) gives { cards[], done } for a card sound.
  <CardFan>{shots.map((k) => <Img key={k} src={urls[k]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />)}</CardFan>

StrokeDraw { paths: string[] (SVG path data); viewBox?: string ("0 0 100 100"); color?: string ("#111111"); width?: number (6, pixels on screen); cap?: "round" | "butt" | "square"; delay?: number (0); stagger?: number (5); frames?: number (20); style? }
  A drawing that draws itself: each path is traced from start to end like a pen stroke, one after another. For a hand-drawn underline or arrow, a circle round a word, a doodle, a diagram's outline. It fills its parent (wrap it to size and place it) and keeps its stroke thickness at any scale; paths are outlines, never filled. strokeFrames({ count, delay, stagger, frames }) gives { start[], end[], done } for a pen sound.
  <div style={{ position: "absolute", left: "20%", top: "58%", width: "60%", height: "6%" }}><StrokeDraw viewBox="0 0 300 30" paths={["M4 18 C 80 4, 160 30, 296 12"]} color={palette.hero} width={10} /></div>

Boil { seed?: number (0); amount?: number (1); style?; children }
  Line boil: re-poses its children every four frames by a pixel or two and a fraction of a degree, like a drawing redrawn for each pose. Wrap each drawing of a row (avatars, stickers, doodles) in its own Boil with a different seed; amount 0.45 for something that should feel printed. Never round type that must be read.
  <Boil seed={2}><Img src={urls["assets/user/a-1-head.png"]} style={{ width: 200 }} /></Boil>

Images in layers (a picture's words are a layer OF the picture)
  An image scene is built in layers: the picture at the back, the words in the middle, the subject cut out of the picture in front when it has one. Run reelkit assets layers --scene <id> (or --layers on assets gen image and assets pull --scene) for the one or two hero pictures: the subject is cut out as <name>.subject.png (about 1 second of the cutout quota each) and the manifest scene gets imageLayers { back, subject?, subjectBox?, textZone: { region, luminance, busy } }; without it the words still go in the calm zone, which is measured on this machine for free whenever a picture is registered.

ImageLayers { layers?: ImageLayersRecord; back?: string; subject?: string; depth?: number (0.4); focus?: "subject" | "back"; front?: ReactNode; children }
  Draws back picture, then children (the middle layer: your words), then the subject, then front, so a headline can pass BEHIND the subject. layers is s.imageLayers; or give back and subject (urls[...]) yourself. Depth comes from the frame: the back drifts and grows slowly, the subject a little more and the other way (depth 0 moves them together, 1 is the most), the words between them at their own rate. focus softly blurs the other layer. Without a subject it is one flat picture with the words over it. Every layer covers the frame at every frame.
  <ImageLayers layers={s.imageLayers}><TextOnImage layers={s.imageLayers}><Headline text="Meet Tom" /></TextOnImage></ImageLayers>

TextOnImage { layers?: ImageLayersRecord; zone?: "top" | "middle" | "bottom" | "left" | "right" | { x; y; w; h }; behindSubject?: boolean; ink?: string; scrim?: number; children }
  The always-correct way to put words on a picture. It sets its children in the picture's calm zone (layers.textZone, or zone), picks dark or light ink from how light the zone is (a Headline inside takes it), and lays a soft scrim just behind the words, stronger the busier the zone, so they read on any picture. With a subject layer the words go BEHIND the subject when it covers 10 to 60 percent of the text block (the title behind the person) and in front of it when it would hide more than 60 percent. Never put words on a flat card beside the picture and never over its busiest part.

Carry { keys: { frame: number; x: number; y: number; width: number; height: number; radius?: number; opacity?: number; rotate?: number }[]; lead?: number; stiffness?: number; damping?: number; children | (box) => children }
  One element held through several scenes. Place it once, beside the SceneFrames and above them, so it is still on screen when a scene changes. Each key says where the box must have arrived by an absolute composition frame: x, y are its centre and width, height are fractions of the frame (0 to 1); radius is the corner radius as a fraction of the frame width; rotate is in degrees. The move toward a key starts lead frames before the key's frame (default 12, or at the previous key's frame when the keys are closer) on a spring (default springs.smooth) and lands on the key's frame exactly; between moves the box holds. Before the first key nothing is drawn unless that key sets an opacity; after the last the box holds. Children fill the box; a function child gets { x, y, width, height, radius, opacity, rotate, widthPx, heightPx } for the current moment, so the content can change as the box does.
  <Carry keys={[{ frame: a.startFrame + 6, x: 0.5, y: 0.45, width: 0.8, height: 0.3 }, { frame: b.startFrame, x: 0.5, y: 0.5, width: 1, height: 1, radius: 0 }]}>{(box) => <Card compact={box.width < 0.5} />}</Carry>

Camera { keys: { frame: number; x?: number; y?: number; zoom?: number; rotate?: number }[]; drift?: number; punches?: { frame: number; x: number; y: number; amount?: number; frames?: number; hold?: number }[]; lead?: number; stiffness?: number; damping?: number; children }
  Moves the whole picture. Wrap all the scenes for one camera that never cuts, or wrap one scene's content. x, y are the point of the content, as fractions, that sits at the middle of the frame (default 0.5, 0.5); zoom 1 shows the content as it fits; rotate is in degrees. A key that leaves a value out keeps the one before it. The timing rule is the same as Carry's: the move toward a key starts lead frames before its frame and lands on it. Frames are counted from the start of the scene when the Camera is inside a SceneFrame (frame 0 is the scene's first frame), and are the video's absolute frames when it wraps all the scenes. drift is a very slow continuous push, as a fraction of the zoom per second (0.02 is two percent a second), so a held shot is never perfectly still.
  <Camera keys={[{ frame: 0, zoom: 1 }, { frame: b.startFrame, x: 0.7, y: 0.4, zoom: 4 }]} drift={0.01}>{scenes}</Camera>
  punches are quick emphasis pushes on top of the keys, for a word or a click: a zoom of 8 to 15 percent (amount, default 0.1) onto the point (x, y) over frames (default 5) with a tiny overshoot, held for hold frames (default 6), then eased back. The point stays still on screen. <Camera keys={[{ frame: 0 }]} punches={[{ frame: click, x: 0.62, y: 0.4, amount: 0.12 }]}>...</Camera>
  zoomTo(frame, { x, y, width, height }) makes the key that pushes into an element until it fills the frame (the box is the element's centre and size as fractions of the frame): keys={[{ frame: 0 }, zoomTo(b.startFrame, { x: 0.5, y: 0.4, width: 0.3, height: 0.2 })]}.

ShaderLayer { layers: { type: string; id?: string; props?: Record<string, unknown>; children?: [...] }[]; speed?: number; resolution?: number; delay?: number; style?: React.CSSProperties }
  Layers of the open-source `shaders` library (WebGPU) drawn frame by frame with the film: grounds, light, materials, stylize passes. Fills its parent; draws nothing where the browser has no WebGPU, so keep a colour behind it. Read reference/shaders.md before using it.
Scene3D { camera?: { keys: { frame: number; x?: number; y?: number; z?: number; lookAt?: [number, number, number]; fov?: number }[]; lead?: number }; background?: string; lights?: boolean; mood?: "studio" | "night" | "sunset" | "neon"; children }
  A three.js scene at the size of the frame, for real depth. Transparent unless background is set, so it lays over a 2D ground; a soft three-point light is placed for you (lights={false} to place your own); mood ("studio", "night", "sunset" or "neon") chooses the light colours, their intensities and the fog tint together instead, so lights are never hand-tuned. Put it inside a SceneFrame, with captions and small labels in 2D above it. camera.keys move the camera with the same timing as Camera (a spring that starts 12 frames before the key's frame and lands on it); the default camera is at z 6, looking at the origin, fov 50, and a key that leaves a value out keeps the one before. What it sees: at fov 50 the height is 0.93 times the distance to the object and the width that times width over height, so 3.1 units across at z 6 on 9:16 (4.7 at z 9), 5.6 on 1:1 and 9.9 on 16:9 (not "5.5"). Text3D and Orbit3D read the camera keys and size themselves to fit at the key where the camera is closest: leave their sizes out. visibleWidth(distance, aspect, fov?) and visibleHeight(distance, fov?) give the same numbers. No GL context is made unless a Scene3D is on screen. A 3D scene renders slower: use it only for the shots that need it. See reference/three-d.md.
  <Scene3D camera={{ keys: [{ frame: 0, z: 7.5 }, { frame: 40, z: 6 }] }}><Text3D text="Reelkit" color={palette.hero} enter="rise" /></Scene3D>

BrandTransform3D { mode?: "turn" | "arc" | "launch"; from?: number (0); frames?: number (32); strength?: number (0 to 1, default 1); children }
  A deterministic arrival for a branded object inside Scene3D: turn exposes its face, arc carries it on a curved path, launch approaches from depth. Wrap Text3D, Card3D or Hero3D; the final pose is neutral and holds exactly. Keep the supplied identity intact and allow a readable hold after landing. A transformation has no built-in audio. brandTransformFrames({ from, frames }) returns { start, settle } in the same local clock; cuesFor([start, settle], "transform", { offset: scene.startFrame, voice, sweepFrames }) places the transform-sweep role before the landing and transform-lock on it. Map both roles to pulled sound files. sweepFrames is the chosen sound's attack in frames (default 10). brandTransformAt(frame, fps, options) returns { visible, position, rotation, scale }; BRAND_TRANSFORMS lists the modes. See reference/brand-motion.md for when and why to choose each.
  <BrandTransform3D mode="turn" from={6} frames={32}><Text3D text="Reelkit" fit={0.72} /></BrandTransform3D>

Text3D { text: string; fit?: number (0.8); size?: number; depth?: number; color?: string; position?: [x, y, z]; rotation?: [x, y, z] (degrees); enter?: "rise" | "turn" | "fly" | "none"; delay?: number }
  Extruded text, centred on its position, inside a Scene3D. Latin letters, digits and common punctuation only (one bundled typeface, Inter Bold): Hebrew and other scripts stay 2D. Leave size out: the word is measured on its own letters and sized to fill fit (default 0.8) of the frame's width at the closest the Scene3D camera comes, so it is whole at every moment on any aspect; a line break in the text makes a second line, and the height is held to fit of the frame's height. A size you give wins (scene units, the height of a capital-ish line). A push-in starts the word smaller in proportion: z 7.5 to 6 is a gentle one. depth is how far it is extruded (default a quarter of the size). enter is how it arrives, starting delay frames into the scene; "none" is there from the start. Keep type that must be read facing the camera and held at least 1.5 seconds.
  <Text3D text="Meet Reelkit" color="#ffffff" position={[0, 1, 0]} enter="turn" delay={6} />

Card3D { src?: string; color?: string; label?: string; icon?: string; accent?: string; font?: string; width?: number; height?: number; radius?: number; position?: [x, y, z]; rotation?: [x, y, z] (degrees); tilt?: number; float?: boolean | number }
  A rounded plane in space that shows a picture (src, a project path or urls[...]; the height follows the picture) or a designed face, with a soft shadow behind it. The face is a gradient of color with a highlight and a rim in accent; label is drawn large on it in the film's font (font, default the kit's display face; ink is white on a dark colour, dark on a light one) and icon (a project path to an image or svg, drawn in its own colours) above the label. It is drawn on both sides, so a card seen from behind reads the right way round. Give every card in a ring a label or an icon, never an empty colour. tilt is the one tilt a card needs: a turn about the vertical axis in degrees with a slight lean. float makes it drift slowly and deterministically.
  <Card3D src={urls[s.userAssetKeys[0]]} width={2.4} tilt={-16} float />    <Card3D color={palette.hero} width={1.2} height={1.6} label="Plan" icon="assets/icons/plan.svg" />

Orbit3D { radius?: number; fit?: number (0.85); speed?: number; tiltDeg?: number; billboard?: boolean; position?: [x, y, z]; children }
  Arranges its children on a ring and turns it slowly (speed is degrees a frame, default 0.5), for a set of cards or logos. Leave radius out: the ring takes the radius at which its cards stand side by side and is scaled, radius and cards together, to lie inside fit (default 0.85) of the frame at the closest the Scene3D camera comes, however it has turned and on any aspect. A radius you give wins and nothing is scaled. Children face outward, so the one at the front faces the camera; billboard keeps all of them facing the camera. tiltDeg tips the ring toward the camera. Every card carries a label or an icon.
  <Orbit3D tiltDeg={12}><Card3D color="#8B5CF6" width={1.2} height={1.6} label="Plan" /><Card3D color="#2563EB" width={1.2} height={1.6} label="Focus" /><Card3D color="#059669" width={1.2} height={1.6} label="Ship" /></Orbit3D>

Assemble3D { shape?: "grid" | "ring" | "sphere" | "wall" | "text" ("grid"); text?: string; targets?: [x, y, z][]; count?: number (400, at most 4000); order?: "y" | "x" | "radial" | "random" ("y"); from?: number (0); frames?: number (60); colors?: string[] (two or three); fit?: number (0.8); size?: number; spread?: number (1.6); seed?: number; position? }
  Instanced blocks that fly from a seeded cloud into an arrangement, one after another, each on an arc with a turn that unwinds, then rest: the build-up beat. "text" puts the blocks inside the letters of text (a short Latin word); targets is any [x, y, z] list (centred and fitted). Every piece is home at from + frames. Fits the frame by default at the closest the camera comes. In a Scene3D. assembleProgress(frame, i, { ranks, from, frames }), assembledCount(frame, { ranks, from, frames }) (for a piece counter), assembleRanks(targets, order, seed) and assembleEnd({ from, frames }) (the frame of the lock sound: cuesFor([from, assembleEnd(...)], "assemble")) are exported.
  <Scene3D><Assemble3D shape="text" text="Relay" count={900} order="x" colors={[palette.hero, palette.accent]} /></Scene3D>

Particles3D { from?: "sphere" | "torus" | "knot" | "galaxy" | "plane" | "text" ("sphere"); to? ("torus"); text?: string; count?: number (12000, at most 60000); morph?: number; morphFrames?: [number, number] ([20, 80]); colors?: [string, string]; drift?: number (0.012); fit?: number (0.8); size?: number (0.026); spin?: number (6, degrees a second); seed?: number; position? }
  A cloud of glowing points that morphs between two shapes, an abstract idea made of light: additive, soft, a gentle seeded drift. The morph runs between morphFrames and holds either side, or give morph (0 to 1). Done on the CPU with ordinary points, so it is the same on every machine. In a Scene3D.
  <Scene3D><Particles3D from="galaxy" to="text" text="Relay" morphFrames={[10, 60]} /></Scene3D>

Hero3D { kind?: "device" | "logo" | "box" | "coin" ("box"); src?: string; text?: string ("R"); hero?: string; rim1?: string; rim2?: string; floor?: "soft" | "mirror" | "none" ("soft"); spin?: number; hover?: number (0.5); fit?: number (0.7); aspect?: number; poses?: { frame: number; rotation?: [x, y, z] (degrees); position?: [x, y, z]; scale?: number }[]; lights?: boolean (true); position? }
  A studio-lit hero object: physical material with a clearcoat in hero, a key light and two coloured rim lights (rim1, rim2, by default the hero colour toward blue and toward pink), a contact shadow or a faded mirror copy below. "device" is a rounded slab whose screen shows src (the user's screenshot; without it a designed screen), "logo" extrudes text (a word or one letter) in the kit's typeface, "coin" is a disc with the first letter of text on it. spin is degrees a second (12; a device sways by that many degrees instead of turning), hover is how much it bobs. poses re-pose the one object across scenes with the same timing as Camera (the move starts 12 frames before the key and lands on it); poseAt(keys, frame, fps) is exported. Fits the frame by default. In a Scene3D.
  <Scene3D mood="studio"><Hero3D kind="device" src={urls["assets/screens/inbox.png"]} hero={palette.hero} poses={[{ frame: 0, rotation: [8, -28, 0] }, { frame: 70, rotation: [0, 0, 0], scale: 1.1 }]} /></Scene3D>

Screen3D { the props of Hero3D without kind and text; spin (5) }
  A tilted screen in 3D carrying a screenshot (src) or a designed mock, with a bezel, a shadow and a sheen: the interface carried across scenes and re-posed with poses. It is Hero3D kind="device" with a small sway.
  <Scene3D><Screen3D src={urls["assets/screens/inbox.png"]} poses={[{ frame: 0, rotation: [10, -30, 0] }, { frame: 80, rotation: [0, 0, 0] }]} /></Scene3D>

Warp3D { speed?: number | { frame: number; speed: number }[] (1); burst?: { frame: number; frames: number; peak?: number }; count?: number (500); colors?: [string, string]; width?: number (0.035); seed?: number; position? }
  Speed streaks rushing out of a vanishing point, additive, in two colours: a ground for a hyperspace beat, or a 12 to 20 frame transition burst (burst: a rise and fall that is nothing outside it). The streaks are longer and quicker the higher speed is. In a Scene3D; it is drawn over everything else in it. warpSpeed(frame, speed, burst) is exported.
  <Scene3D><Warp3D burst={{ frame: 20, frames: 16, peak: 4 }} /></Scene3D>

Grounds (the layer under everything; one for the whole film, see reference/backgrounds.md)
  BgVideo { src; dim?: 0-0.8 (0.35); blur?: px (0); zoom?: number (0.04); tint?: string; loop?: boolean (true); playbackRate?: number (1); durationSec?: number }
    A video as the ground, always muted. dim darkens it so type stays readable, tint lays a colour over at low opacity so the clip takes the film's accent, zoom is a slow push over the film. With loop and durationSec (manifest.background.durationSec), a film longer than the clip starts it again with a short cross-fade over the join. <BgVideo src={urls[manifest.background.key]} durationSec={manifest.background.durationSec} dim={0.4} tint={palette.hero} />
  BgImage { src; dim?: 0.35; blur?: 0; tint?; zoom?: 0.06; drift?: "none" | "left" | "right" | "up" | "down"; fit?: "cover" }
    One still picture as the ground, with a slow push and an optional slow pan. It always covers the frame: the pan and the blur never show an edge.
  BgSequence { items: { src: string; from: number }[]; transition?: "fade" | "blur" | "wipe" | "zoom"; transitionFrames?: 18; align?: "center" | "start"; dim?; blur?; tint?; zoom?; drift? }
    Grounds that change smoothly. items are in frame order, the first visible from frame 0 (out of order or on the same frame is an error). The change is centred on from unless align is "start". "blur" cross-fades through a blur peak, "wipe" is a soft-edged wipe, "zoom" pushes the old one in while the new one settles. Each item keeps its own slow zoom through the change. A video src is drawn too (played once, held on its last frame).
    bgPerScene(manifest.scenes, srcs): { src, from }[] makes items that change exactly on scene starts (which are on the beat); a scene whose src is undefined keeps the picture before it.
    <BgSequence items={bgPerScene(manifest.scenes, manifest.scenes.map((s) => s.background && urls[s.background.key]))} tint={palette.hero} dim={0.4} />
  BgAurora { bg; hero; speed?; intensity? (0.6) }   BgGrid { bg; hero; speed?; intensity? (0.6) }   BgBeams { bg; hero; speed?; intensity? (0.6) }   BgGrain { bg; hero; speed?; intensity? (0.6) }
    Grounds drawn in code, with no media, cheap to render. BgAurora: two or three large soft colour fields drifting and crossing. BgGrid: a faint perspective grid receding to a horizon, with a glow there. BgBeams: wide soft diagonal light beams sweeping very slowly. BgGrain: a still ground with a slowly breathing vignette and film grain that steps by the frame number. hero is the accent; speed 1 is the default pace. intensity (0 to 1, default 0.6) is how strongly the ground lights the base; Grade and Vignette on top darken it, so raise it to 0.8 under them (reference/backgrounds.md).
    <BgAurora bg={palette.bg} hero={palette.hero} />

fonts { display: string; body: string }
  Loaded font families. Use fonts.display (weights 600-800) for headlines and numbers, fonts.body for supporting text. Never leave hero text on a default font.

Icon { name: IconName; size: number; color?: string }     brandColor(name): string
  A platform's real logo mark, or a plain interface glyph. size is in pixels. color "brand" uses the platform's own colour.
  Brands: instagram, tiktok, youtube, x, facebook, whatsapp, telegram, twitch, discord, spotify, snapchat, pinterest, messenger, threads,
  reddit, github, gmail, soundcloud, behance, vimeo, dribbble, imessage, apple, googlemessages, signal, googlecalendar, stripe, paypal,
  applepay, shopify, notion, zoom.  Glyphs: message, mail, bell, phone, calendar, cart, heart, star, user, play.
  Use Icon for any platform logo. Never draw a logo yourself, never use a letter or an emoji in its place, and only show a
  platform's mark when the video really refers to that platform.
  <Icon name="instagram" size={width * 0.06} color="brand" />

font(name): string
  Loads one extra typeface and returns its family name. Call it once at the top of a file: const heavy = font("montserrat").
  montserrat (300, 800, 900), montserratItalic (800, 900), kanit (600), roboto (300, 500, 700, 900), robotoSlab (700),
  bebasNeue (tall condensed caps), archivoBlack (very heavy), unbounded (wide heavy display, 800, 900), modak (chunky rounded),
  greatVibes (formal script), sacramento (monoline script), outfit (geometric sans 100, 300, 500, 900), syne (wide heavy 800),
  lilitaOne (heavy rounded), kaushanScript (bold brush script), yellowtail (flowing brush script), mrsSaintDelafield (signature script),
  permanentMarker (marker lettering), bungeeShade (outlined sign capitals), cinzel (Roman capitals 700, 900: epic),
  playfairDisplay (elegant serif 700, 900), jetbrainsMono (monospace 400, 700: terminals, labels), orbitron (sci-fi 700, 900), rye (western), creepster (horror).
  Hebrew text must use a Hebrew face; every face above is Latin only and Hebrew would fall back to a default font. Hebrew faces
  (all also cover Latin): heebo, rubik, notoSansHebrew (400, 700, 900: neutral sans), assistant (400, 700, 800), alef (400, 700),
  secularOne (strong headline), varelaRound (soft rounded), fredoka (playful rounded 500, 700), karantina (tall condensed 400, 700),
  suezOne (heavy serif headline), frankRuhlLibre (book serif 400, 700, 900), davidLibre (traditional serif 400, 700),
  amaticSC (hand-lettered 400, 700).
  Use at most two typefaces in one video.

springs { snappy, smooth, heavy }    ease { out, in, inOut }
  Spring configs for spring({ frame, fps, config: springs.smooth }) and easings for interpolate(..., { easing: ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" }).

palettes { darkTech, warmEditorial, warmPremium, cleanLight }   each is a Palette { bg, ink, hero, accent, dim }
  Proven starting palettes. Pick one that suits the topic, or define your own Palette object. Declare it once at the top of Video.tsx and take every colour from it.

ScreenOverlay { src: string; durationSec?: number; opacity?: number }
  Lays a shared overlay clip (film marks, HUD frames) over the video with a screen blend. Pull one with: reelkit assets search "<description>" --kind overlay, then reelkit assets pull <id>; the clip's durationSec is in its entry in assets/library.json.
  Place it once, above the scenes and below Grade. Works best on dark themes.
  <ScreenOverlay src={urls["assets/lib/<id>/clip.mp4"]} durationSec={5} opacity={0.5} />

Sfx { src: string; at?: number; volume?: number }
  Plays one sound effect from the shared library, starting at the frame given by "at", counted from the start of the enclosing scene. Pull one with: reelkit assets search "<description>" --kind sfx, then reelkit assets pull <id>.
  A pulled sound is levelled when it is pulled (the manifest's soundGain), and Sfx and Music apply that by themselves: the same volume sounds equally loud for every file. Nothing to pass.
  <Sfx src={urls["assets/lib/<id>/clip.mp3"]} at={10} volume={0.35} />

SoundCues { cues: { at: number; sound: string; volume?: number }[]; sounds: Record<string, string>; volume?: number }
  Plays many sound effects from one place, for a video scored with sound (a video with no voice). Place it once, outside the scenes. "at" is an absolute frame of the video, "sound" is a key into "sounds" (name -> link), a cue's own volume defaults to 0.35, and "volume" is a master level for all of them (default 1). It applies the manifest's levelling gain by itself, like Sfx. A cue whose sound is not in "sounds" stops the render with the names that exist.
  <SoundCues sounds={{ click: urls["assets/lib/<id>/clip.mp3"], whoosh: urls["assets/lib/<id>/clip.mp3"] }} cues={[{ at: 0, sound: "whoosh" }, { at: 18, sound: "click", volume: 0.3 }]} />

cuesOnBeats(beatFrames, { from, to, every, sound, volume? }): { at, sound, volume? }[]    cueBefore(frame, leadFrames): number
  Helpers for SoundCues cues. cuesOnBeats gives a cue on every Nth beat from the frame "from" to the frame "to" (both included), starting with the first beat in that range. cueBefore gives the frame at which a sound leadFrames long must start to END on "frame" (a riser or a whoosh into a cut), never before frame 0.
  const cues = [...cuesOnBeats(manifest.music?.beatFrames ?? [], { from: 0, to: 120, every: 2, sound: "tick", volume: 0.2 }), { at: cueBefore(s.startFrame, 12), sound: "whoosh" }];

cuesOnChanges(scenes, { impact?: { sound, volume? }, whoosh?: { sound, volume?, frames }, skip?: number[] }): { at, sound, volume? }[]    changeFrame(scene): number    cueOnCamera(frame, { punch?, punchFrames?, lead? }): number
  Sounds for the scene changes, placed where the eye sees them. A SceneFrame transition is complete on the boundary but the picture changes most half the transition's frames before it (4 for the default 8, 3 for transitionFrames={6}; none for "cut"), and a hit on the boundary lands after the change. scenes are the manifest's scenes, each with the exit and transitionFrames its SceneFrame has: cuesOnChanges gives an impact on that peak and a whoosh (frames long, from the search line's duration times 30) that ENDS on it, for every change but the one after the last scene; skip lists scene indices to leave silent. changeFrame(scene) is the peak for one scene. A camera zoom, zoomTo or punch is a picture change too: cueOnCamera(frame) is the frame where the Camera move to the key at "frame" is fastest (about 9 frames before it); with punch: true, the fastest frame of a punch (just after its frame). The Camera counts frames from the scene's start when it is inside a SceneFrame, so add the scene's startFrame for an absolute cue.
  const exits = [{ exit: "zoom-through" as const }, { exit: "whip-left" as const, transitionFrames: 6 }, {}];  const cues = cuesOnChanges(manifest.scenes.map((s, i) => ({ ...s, ...exits[i] })), { impact: { sound: "thud", volume: 0.55 }, whoosh: { sound: "whoosh", frames: 24, volume: 0.3 } });

cuesFor(events, kind, { offset?, fps?, voice?, volume?, seed?, sweepFrames?, riserFrames? }): { at, sound, volume }[]    clearBefore(cues, frame, { seconds?, fps?, riserFrames? }): cues
  Turns the event frames a component reports into SoundCues with a sensible sound role, level and density for the kind: "type" (promptFrames(...).type: a tick on every 2nd or 3rd character, at most 12 a second, a little different in level each, and a thock one frame after the last), "click" (clickFrames), "snap" (panelSettleFrame: a card or panel landing), "pop" (chapterFrames(...).badges), "count" ([start, settleFrame]: a train of ticks that speeds up and ends on a chime ON settleFrame), "stream" (terminalFrames(...).lines: one soft tick per line, at most 6 a second), "assemble" ([start, lockFrame]: a rising run that gets louder and a lock hit on lockFrame), "transform" ([start, settle]: transform-sweep begins sweepFrames before settle, never before start, and transform-lock lands on settle) and "resolve" ([frame] the logo or end card lands: a riser that ends on the chime, which is on the frame). offset is the scene's startFrame when the events are in the scene's own clock. voice: true gives the quieter levels for a film with a narrator (never over 0.3). Each cue's sound is a role: type-tick, type-return, click, snap, pop, count-tick, count-settle, stream, assemble-run, assemble-lock, transform-sweep, transform-lock, resolve-riser, resolve-chime. Map each role to a pulled file in sounds, searching with: type-tick "mouse click"; type-return "glass tap"; click "mouse click"; snap "soft impact"; pop "bubble pop"; count-tick "counter ticks"; count-settle "success chime"; stream "glass tap"; assemble-run "counter ticks"; assemble-lock "soft impact"; transform-sweep "soft ui whoosh"; transform-lock "soft impact"; resolve-riser "whoosh buildup"; resolve-chime "sparkle shimmer" (reelkit assets search "<words>" --kind sfx; the interface pack's names begin with sfx-ui-). clearBefore(cues, chimeFrame) removes every other cue in the second before the riser so the end card has a clear second of nothing; give the music a dip there (Music dips).
  const p = promptFrames({ text, reply }, fps);  const cues = [...cuesFor(p.type, "type", { offset: s.startFrame }), ...cuesFor([p.send], "click", { offset: s.startFrame }), ...cuesFor([settleFrame({ delay: 20 })], "snap", { offset: s.startFrame })];

Music { src: string; volume?: number; duckTo?: number; dips?: { from: number; to: number; volume: number }[] }
  The video's one music track (pull it with: reelkit assets pull <id> --music). Place it once, outside the scenes. It sits at duckTo (default 0.18) while the voiceover is heard, steady across the 0.2 to 0.5 s between sentences, and comes up to volume (default 0.5) only in a real pause of 1.2 s or more (rising over 0.4 s and back down 0.25 s before the next word), so at the start before the first word and after the last, loops if the video is longer than the track, and fades out over the last second. It follows the manifest, so nothing else is passed. dips are rests in absolute frames: inside each the track holds at that volume (with a short ramp either side), so it can fall quiet before the big moment: dips={[{ from: reveal.startFrame - 20, to: reveal.startFrame, volume: 0.05 }]}.
  <Music src={urls[manifest.music.key]} />

nearestBeat(beatFrames, frame): number | undefined    nextBeat(beatFrames, frame): number | undefined    beatPulse(beatFrames, frame, decayFrames = 10): number
  Beat helpers; beatFrames is manifest.music.beatFrames (composition frames). nearestBeat is the closest beat, nextBeat the first at or after the frame, beatPulse a number from 0 to 1 that is 1 on a beat and falls to 0 after it. Inside a scene, subtract s.startFrame from a beat to get a frame for that scene's own clock.
  const b = nextBeat(manifest.music?.beatFrames ?? [], s.startFrame + 20) ?? s.startFrame + 20;  // <Entrance delay={b - s.startFrame}>

wordFrame(scene, word, { nth?, edge?, absolute?, fps? }): number    wordFrames(scene, words[], opts?): number[]    onWord(scene, word, { lead?, ...wordFrame options }): number    onWordBeat(scene, word, manifest.music, { window?, lead?, ... }): number    sceneById(manifest, id): scene
  Put things on the spoken word. scene is a manifest scene (it has the real word times). wordFrame is the frame inside the scene (counted like useCurrentFrame() in its SceneFrame) at which the word starts; word ignores case and punctuation, nth (1-based) picks a repeated word, a phrase ("whole week") gives the first word's start, edge "end" gives where it ends, absolute adds the scene's startFrame. A word the scene does not say THROWS with the scene's words listed, so a typo fails the render instead of timing to frame 0. onWord is the frame to START an entrance (a delay, a from, an at) so it is seen landing on the word: wordFrame minus lead (default 3), never below 0. onWordBeat is the same but lets the entrance land on a beat when one lies within window frames (default 3) AFTER the word; otherwise the word wins, and it is never earlier than onWord: with a narrator the voice is the clock for anything that shows a word, the beat is for decoration. sceneById(manifest, "id") finds the scene.
  const meet = sceneById(manifest, "meet");  <Entrance delay={onWord(meet, "tasks")}><Card /></Entrance>  <Sequence from={onWord(meet, "builds")}><Card /></Sequence>  <Sfx src={urls[SFX.pop]} at={wordFrame(meet, "energy") - 2} volume={0.25} />

Voiceover { src: string; volume?: number }
  The scene's narration audio. One per narrated scene, inside its SceneFrame. Guard it with s.voiceoverKey so a scene without a recording still renders.
  {s.voiceoverKey ? <Voiceover src={urls[s.voiceoverKey]} /> : null}
```

## A minimal working Video.tsx

```tsx
import React from "react";
import { AbsoluteFill, useVideoConfig } from "reelkit/frame";
import { BgMesh, Captions, FootageLayer, fonts, Grade, Grain, KenBurnsImage, palettes, SceneFrame, Vignette, Voiceover, WordReveal } from "reelkit/kit";
import type { VideoProps } from "reelkit/kit";

const palette = palettes.darkTech;

export const Video: React.FC<VideoProps> = ({ manifest, urls }) => {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill>
      {manifest.footageKey ? <FootageLayer src={urls[manifest.footageKey]} dim={0.2} /> : <BgMesh bg={palette.bg} hero={palette.hero} accent={palette.accent} />}
      {manifest.scenes.map((s, i) => (
        <SceneFrame key={s.id} from={s.startFrame} durationInFrames={s.durationFrames}>
          {s.imageKey ? <KenBurnsImage src={urls[s.imageKey]} direction={i % 2 ? "out" : "in"} /> : null}
          {i === 0 && !manifest.footageKey ? (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: width * 0.08 }}>
              <WordReveal text="Demo video" highlight="Demo" highlightColor={palette.hero} style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: width * 0.1, color: palette.ink }} />
            </AbsoluteFill>
          ) : null}
          <Captions words={s.words} />
          {s.voiceoverKey ? <Voiceover src={urls[s.voiceoverKey]} /> : null}
        </SceneFrame>
      ))}
      {manifest.footageKey ? null : <Grade color={palette.hero} />}
      <Grain blend="overlay" />
      <Vignette />
    </AbsoluteFill>
  );
};
```

## What the checks can see

- `reelkit check` counts sounds only where the code places them literally. When the cues are computed (a loop, `cuesOnBeats`, a helper, a variable that is not a plain list) its sound-count notes stay silent, so the absence of a note proves nothing. For a film with no voice, the sound report after `reelkit render` is the real count.
- `reelkit preview` prints the continuity and beat lines. It prints no rhythm line: how even the scene lengths are is `reelkit plan check`'s.
