---
name: style-components
description: Map Reelkit's shared component catalog to shot roles and styles, while distinguishing pulled sibling components from built-in kit exports.
---

# Choose a component by its job

This inventory covers the 91 shared components in the reviewed repository catalog. It is not a list of built-in kit exports or a promise that every component is published in the current account's library. Search for the role, inspect the returned match, and pull its actual id before use. `reelkit assets pull <id>` prints the import and example and puts the source in `src/`. Read its props and timing implementation before retiming it.

Import a pulled component from its sibling file. Only actual kit exports in `reference/kit.md` come from `reelkit/kit`. Do not import every component into a film or duplicate the entire catalog inside the skill. If the required component is unavailable, use a fitting kit primitive or follow `reference/component-authoring.md` to write a reusable alternative.

| Shot role | Shared components | Styles and checks |
|---|---|---|
| Notifications and results | `NotificationBanner`, `AlertDialog`, `StatusToast`, `DynamicIsland`, `HomeWidget`, `DeviceSheet`, `AppInstallCard` | Product walkthrough, AI at work, launch; trigger the actual state after the action and verify held content |
| Source screens and products | `PhoneMockup`, `BrowserMockup`, `LaptopMockup`, `TiltCard`, `ProductCard`, `AppDock` | Product and premium shots; supply real media, preserve proportions and finish in a readable pose |
| Interactions and settings | `SearchBar`, `ToggleList`, `CursorClick`, `TouchTap`, `CollabCursors`, `CallOut` | Walkthrough, tutorial, morphing UI; inspect target coordinates, response timing and crop |
| Assistant and developer work | `PromptBox`, `StreamingAnswer`, `AssistantChatWindow`, `AgentSteps`, `ShimmerSkeleton`, `GlowOrb`, `TerminalWindow`, `CodeWindow`, `IssueBoard`, `ChatThread` | AI/product films; use supplied outputs and preserve request → processing → result order |
| Steps and time | `StepList`, `Checklist`, `ProgressBars`, `Countdown`, `Timeline` | Tutorials, processes and milestones; align each state to the real instruction or source date |
| Charts and factual results | `LineChart`, `BarChart`, `AreaChart`, `PieChart`, `RadialChart`, `RadarChart`, `ComposedChart`, `StatCard`, `ComparisonSplit`, `RankingList`, `LiveScoreCard`, `PollCard`, `StarRating` | Numbers, proof and HUD; verify baseline, unit, scale, source values and final state |
| Offers and feature collections | `PricingCard`, `PriceDrop`, `BentoGrid`, `IconGrid`, `OrbitItems` | Launch, product and spatial lists; supplied price/features/marks, one focal hierarchy and readable hold |
| Brand and closing action | `LogoReveal`, `BrandSplash`, `AppIconOpen`, `CTAButton` | Logo sting and launch; preserve the actual mark and user-requested action |
| People and social evidence | `SocialHandle`, `NameLowerThird`, `QuoteCard`, `SocialPost`, `StoryFrame`, `PostFrame`, `ReelOverlay`, `CommentSticker`, `ProfileCard` | People/proof, footage, social native; exact attribution, real counts and face/platform clearance |
| Reactions and playful material | `EmojiPop`, `EmojiReactions`, `ReactionPills`, `Confetti`, `StickerBadge`, `HandDrawnMark` | Social, notebook, cel and collage; use reactions intentionally, keep them clear of speech and important text |
| Type and poster motion | `NeonText`, `KineticTitle`, `CinematicTitle`, `Marquee`, `HighlightText`, `TypewriterText`, `ScrambleText`, `BlurReveal`, `GradientText`, `WordRotate`, `GlitchText`, `WaveText`, `OutlineFillText`, `EchoText`, `PunchWords`, `CircleText`, `SpotlightText`, `StrikeReplace` | Headline, cinematic, neon, poster and mixed media; inspect reading order, complete words, RTL and final fit |
| Keynote launch film | `KineticSentence`, `SlotDivider`, `DotCanvas`, `DockLaunch`, `GlassPairs`, `PillBurst`, `EndMark` | The long launch film in chapters (`reference/keynote-film.md`); one accent, the same divider list each time, every sentence whole at its last step |
| Audio visual and atmosphere | `Waveform`, `GlowBackdrop` | Assistant, music, aurora and premium shots; distinguish decorative activity from a measured waveform and protect text contrast |

## Kit building blocks

The kit supplies scene framing, timing and reusable geometry around those components:

- `SceneFrame`, `Entrance`, `Carry`, `Camera`: stage the action and carry a subject across shots.
- `Headline`, `WordReveal`, `Counter`, `CounterRoll`: readable type and numbers. Word timing comes from the actual speech events.
- `BarChart`, `TrendLine`, `DonutStat`, `CompareTable`, `FlowDiagram`, `ChatStack`, `CopyCorrection`, `Callout`: explain a quantity, a comparison, a process, an exchange, a correction or a detail by drawing it in order. Choose by what changes on screen (`reference/explain-graphics.md`); the values and labels are the user's.
- `CardFan`, `StrokeDraw`, `Boil`, `LanguageWheel`: a hand of screens or photographs dealt into a fan; a line that draws itself (an underline, an arrow, a doodle); the slight re-posing that makes a row of drawings feel hand-made; and a product name with its languages rolling beside it, for a localization announcement.
- `BrowserFrame`, `GlassPanel`, `PromptBox`, `NamedCursor`, `TerminalLog`: built-in UI primitives. The kit's `PromptBox` and a pulled component of the same name are separate APIs; use the source you actually imported.
- `Scene3D`, `BrandTransform3D`, `Hero3D`, `Screen3D`, `Card3D`, `Orbit3D`, `Text3D`, `Assemble3D`, `Particles3D`, `Warp3D`: frame-driven depth and branded transformations. Custom product geometry, rigs and Blender shaders need an external rendered asset or a separately implemented kit feature.
- `BgMesh`, `BgAurora`, `BgGrid`, `BgBeams`, `BgGrain`, `BgImage`, `BgVideo`, `BgSequence`: choose a ground that fits the style.
- `ImageLayers`, `TextOnImage`, `KenBurnsImage`, `ClipLayer`, `KeyedClip`, `FootageLayer`: layer source material without fabricating it.
- `Voiceover`, `Music`, `Sfx`, `SoundCues`, `Captions`: preserve speech, place sound on the visual event clock and honor the chosen caption mode.
- `HudOverlay`, `ScreenOverlay`, `Grade`, `Grain`, `Vignette`: use finishing only when it solves a visible problem or belongs to the look.

The detailed props and examples remain in `reference/kit.md` and the pulled source. This role map chooses a candidate; it does not verify the component's behavior in a new composition. Run the normal check and preview, inspect its action and held state, then verify the final export.
