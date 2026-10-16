# Style menu

Pick one look per film (or blend two that share a palette). Each row: the ground + palette idea, the type, the
engine that draws it best, and how it moves. Fonts are kit names unless "(G)" = Google family via `fonts`.
Reelkit's own `reference/styles.md` ("Locked looks") and `reference/art-styles.md` add more; animate-in-code's
`references/styles.md` has its nine media in depth; `library/lemo-opuscar/styles/*/STYLE.md` and
`library/anidoodle/references/styles.md` hold full recipes for their styles.

## Editorial & explainer
| Look | Ground / palette | Type | Engine | Motion |
|---|---|---|---|---|
| Cream paper reel (house look) | cream `#F2F0E9`, ink, one lime/orange accent, dots | heebo / montserrat 900 | reelkit | elements pop on words, marker blocks, voice line |
| Vox paper collage | torn paper, halftone, red + cream | bebasNeue | canvas collage / `vox-explainer` | stop-motion on twos, paper slides |
| Newsprint dossier | newsprint grey, black, red stamps, redaction bars | playfairDisplay + robotoSlab | reelkit (Stamp, Tag) | stamps thud, bars wipe |
| Swiss / international | white, black, one red, strict grid | montserrat / outfit | reelkit | hard cuts, grid snaps, big numbers |
| Blueprint | navy `#0D2B52`, white lines, grid | jetbrainsMono + outfit | canvas lines / lemo `blueprint` | lines draw themselves, measure arrows |
| Whiteboard draw-on | white, black marker, one colour | permanentMarker | canvas sketch / `whiteboard-animation` | hand draws, then fills |
| Chalkboard | dark green slate, chalk white, yellow | amaticSC / permanentMarker | canvas chalk | chalk strokes, dust |
| Pencil sketchbook | warm paper, graphite, one watercolour wash | kaushanScript | canvas sketchbook | sketch → ink → colour |
| Isometric infographic | soft pastel, 2.5D blocks | outfit | `isometric-animation` / lemo `iso-infographic` | blocks rise, explode apart |
| Data dashboard | dark slate, cyan + amber | roboto + jetbrainsMono | reelkit kit charts | bars grow, counters roll |
| Museum archive | off-white card, sepia photos, labels | cinzel + robotoSlab | reelkit Photo/Tag / lemo `archive-lighttable` | slow push-ins, label pins |
| Travel journal | aged paper, stamps, maps, tape | playfairDisplay + permanentMarker | reelkit + canvas collage | stamps, map lines trace |
| Teardown / exploded view | white studio, black lines, orange callouts | outfit | lemo `teardown` | parts fly apart and label |
| Microscope / science | black, bioluminescent cyan/magenta | orbitron | canvas particles / lemo `microscope` | drifting cells, focus pulls |
| Satellite briefing | dark map, green HUD, coordinates | jetbrainsMono | lemo `satellite-briefing` / reelkit HudOverlay | zoom to coordinates, scan lines |
| Maths (3Blue1Brown) | near-black, blue/yellow/teal | (Manim LaTeX) | `clip` ← manim | equations morph, graphs plot |

## Bold & social
| Look | Ground / palette | Type | Engine | Motion |
|---|---|---|---|---|
| Bold poster | flat hot colour (red/yellow) + black | bebasNeue / unbounded | reelkit BigText | hard cuts on beats, scale slams |
| Acid studio | near-black, acid lime, hot orange | bebasNeue + jetbrainsMono | reelkit | rotated labels, thick frames |
| Kinetic typography | black or white, one accent | syne / unbounded / montserrat 900 | reelkit or `kinetic-typography` / `kinetic-reel` | words split, stagger, scale with the beat |
| Meme / UGC | white top bar, Impact-like caps | anton-like: bebasNeue | reelkit + footage | zoom punches, jump cuts |
| Text-message story | phone UI, chat bubbles | system: roboto | reelkit Phone + Bubble / ChatStack | messages pop with typing dots |
| Y2K / chrome | holographic gradient, chrome type | syne | reelkit ShaderLayer | shine sweeps, sparkles |
| Neon night | black, magenta/cyan neon | sacramento + orbitron | reelkit GlowText / `title-sequence-3d` | flicker on, glow pulse |
| Glitch / VHS | dark, RGB split, scanlines | jetbrainsMono | hyperframes registry (glitch, CRT) | tears, chromatic jumps |
| Terminal / hacker | black, green `#00FF66` | jetbrainsMono | reelkit TerminalLog / lemo `ascii-crt` | typing, cursor blink |
| Countdown / top-N | dark, big numerals, accent ring | bebasNeue | reelkit CountUp / `countdown-video` | number flips, ring fills |

## Premium & product
| Look | Ground / palette | Type | Engine | Motion |
|---|---|---|---|---|
| Keynote | pale grey/white, black, one product colour | outfit / montserrat | reelkit (`reference/keynote-film.md`) | big centred words, slow camera on screens |
| Apple launch film | gradients, menu bar, notch widgets | outfit | `apple-launch-film` | widgets grow from the notch |
| Dark keynote | black, white, one gradient | outfit 900 | lemo `dark-keynote` / reelkit | light sweeps, product reveals |
| Glass product | soft studio gradient, glass cards | outfit | reelkit + ShaderLayer / lemo `glass-product` | glass focus, depth blur |
| Luxury | black + gold `#C9A24A` | cinzel / playfairDisplay | reelkit | slow fades, letter-spacing opens |
| SaaS UI demo | white, product colours, cursor | the product's / roboto | reelkit BrowserFrame, NamedCursor, `motion-effects` | cursor clicks, UI morphs |
| 3D title | lit 3D scene | orbitron / syne | `clip` ← hyperframes Three.js / `title-sequence-3d` | camera flies through |

## Illustrated & hand-made
| Look | Ground / palette | Type | Engine | Motion |
|---|---|---|---|---|
| Brush strokes | white, bold black brush, one colour | kaushanScript | canvas brush | strokes paint on |
| Watercolour picture book | soft paper, washes | fredoka / (G) Patrick Hand | `painted-animation` / lemo `watercolor` | slow drifts, bleeding edges |
| Paper cut / papercraft | layered coloured paper, shadows | lilitaOne | canvas collage / lemo `papercut-red`, `paper-popup` | layers slide with parallax |
| Stickers | bright paper stickers with white borders | fredoka / lilitaOne | canvas stickers | peel, slap on, wobble |
| Risograph | 2–3 spot inks, misregistration, grain | unbounded | canvas riso | overprint offsets jitter |
| Pixel art 8-bit | limited palette, pixel grid | (G) Press Start 2P | canvas pixel / lemo `pixel-rpg` | steps on threes, sprites |
| HD-2D | pixel sprites + depth blur | (G) Press Start 2P | lemo `hd-2d` | tilt-shift, bloom |
| Sand animation | lightbox amber, sand dark | (none — drawn) | canvas sand | sand flows into images |
| Cross-stitch | linen, thread colours | (G) Pixelify Sans | canvas stitch | stitches fill row by row |
| Ink wash / sumi-e | rice paper, black ink, red seal | (G) Shippori Mincho | lemo `ink-wash` | ink blooms, brush trails |
| Ukiyo-e | woodblock palette, indigo, waves | (G) Noto Serif JP | lemo `ukiyoe` | layered parallax, wave loops |
| Stained glass | dark leading, jewel colours, light | cinzel | lemo `stained-glass` | light rays shift |
| Impasto oil | thick paint texture | playfairDisplay | lemo `impasto` | strokes build up |
| Engraving | cross-hatch black on cream | cinzel | lemo `engraving` / bw images | hatch reveals |
| One-line drawing | white, one continuous line | outfit 300 | lemo `one-line` / canvas | the line draws everything |
| Rubber-hose cartoon | 1930s sepia, black ink | rye | lemo `rubber-hose` | bouncy loops on twos |
| Mid-century toon | teal/orange/mustard, flat shapes | (G) Josefin Sans | lemo `midcentury-toon` | limited animation, swings |
| Cel anime 80s | sunset gradients, cel shading | (G) Zen Dots | lemo `cel-anime-80s` | speed lines, pans |
| Silent film | black & white, film grain, title cards | playfairDisplay / (G) Limelight | lemo `silent-film` / bw footage | iris wipes, flicker |
| Shadow puppet | warm backlight, black silhouettes | cinzel | lemo `shadow-puppet` | puppets sway on rods |
| Crayon kids' book | white paper, crayon texture | (G) Gochi Hand | lemo `crayon-book` | wobbly boil |
| Lowpoly island | flat-shaded 3D pastel | lilitaOne | lemo `lowpoly-island` | slow orbit |
| Toy bricks | primary colours, studs | lilitaOne | lemo `brick-toy` | bricks snap together |
| Art deco | black, gold, geometric fans | cinzel | lemo `art-deco` | symmetric reveals |
| Silkscreen poster | 2 inks, halftone | bebasNeue | lemo `silkscreen-poster` | ink layers pull |
| Doodles over real video | footage + white brush-pen doodles | permanentMarker | canvas overlay (animate-in-code `references/overlay.md`) | doodles draw on the action |
| Lottie flat motion | flat vector, brand colours | montserrat | `clip` ← lottie | icons morph, loaders |

## Cinematic
| Look | Ground / palette | Type | Engine | Motion |
|---|---|---|---|---|
| Documentary footage | real footage, muted grade, lower thirds | robotoSlab | footage + reelkit overlays | slow push-ins, captions on a plate |
| Spy titles | silhouettes, bold colour fields | (G) Bebas Neue / bebasNeue | lemo `spy-titles` | circles, gun-barrel wipes |
| Game show | stage lights, bulbs, gold | bungeeShade | lemo `game-show` | bulbs chase, scoreboards |
| Horror | near-black, blood red, grain | creepster | reelkit + ShaderLayer grain | flicker, slow creeps |
| Western | sepia, dust, wood | rye | reelkit + bw footage | dust blows, wanted posters |
| Epic history | parchment / marble, gold | cinzel | reelkit + engraving images | slow zooms, maps |
| Hologram HUD | dark blue, cyan wireframes | orbitron | lemo `hologram-hud` / reelkit HudOverlay | scan, flicker, rotate |
| Backrooms / liminal | yellow carpet, fluorescent hum | jetbrainsMono | lemo `backrooms` | slow corridor drifts |
| Tilt-shift miniature | saturated footage, blur bands | outfit | footage + blur / lemo `tilt-shift` | fast-motion city |
| LiDAR / point cloud | black, rainbow points | jetbrainsMono | lemo `lidar-survey` / canvas particles | sweeps reveal the scene |
