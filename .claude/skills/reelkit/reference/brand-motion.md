---
name: brand-motion
description: Choose branded transformations and 3D reveals by what the shot communicates, then pair their landing frames with sound.
---

# Brand motion: what changes, when, and why

Use the user's actual name, logo, colours and product material. A branded transition should connect two ideas: a mark becomes the product surface, a product turns toward the viewer, or separate parts resolve into one name. Write that connection in the scene's notes before choosing the effect. Keep the settled identity readable; an effect is the journey, not the brand.

## Choose the move by its purpose

| What the viewer needs to understand | Use | Why it fits | Sound |
|---|---|---|---|
| Recognise a product or wordmark as it faces them | `BrandTransform3D mode="turn"` | A restrained turn exposes the front, then stops | Soft sweep into one lock hit |
| Follow the same object from one position or idea to another | `mode="arc"`, or `Carry` / `Screen3D` across scenes | The curved arrival preserves the object as the visual thread | A short sweep, with a landing only if the new state matters |
| Feel the step from setup into the launch or payoff | `mode="launch"` | An object approaches from depth and settles at its final size | A rising sweep into an impact; duck the music around the hit |
| See parts becoming a whole | `Assemble3D` | Construction explains the relationship, rather than hiding it in a cut | Sparse build ticks and one lock at `assembleEnd` |
| Read a detailed screen, a sentence or a Hebrew wordmark | A 2D image or text with `Entrance` / `Carry` | Detail remains sharp and faces the viewer | Usually a small tap or silence |
| Notice a factual before/after or a new chapter | A clear cut or `SceneFrame` transition | Separation makes the change easier to compare | `cuesOnChanges`, or silence for a deliberate break |

Choose 3D when depth explains the product, reveals its shape, or makes the requested brand moment distinctive. A flat change is often better for reading, comparison and rapid instructions. More 3D shots are appropriate when the user requests a brand film or showreel; give them different jobs instead of repeating the same spin.

## Keep the identity intact

- Use the supplied logo image without stretching, recolouring or replacing it with a guessed text logo. `Card3D src={urls[key]}` can carry the image in space; match its card proportions to the asset, and end with the actual mark facing the viewer. A flat `Img` is the best closing hold when the card frame would distract.
- `Text3D` and `Hero3D kind="logo"` are Latin word treatments, not faithful reconstructions of a supplied logo. Use them for a requested word treatment, and keep Hebrew or other unsupported scripts in 2D.
- Choose the light mood and surface finish from the agreed look: studio for a clear product, night for restrained premium depth, neon for an explicit tech look. Keep the brand palette across all shots.
- Finish the move before the reading hold. Budget the move plus about 1.5 seconds for a short name; longer copy needs longer. If that cannot fit, shorten the move, simplify the copy or choose 2D.
- Avoid moving the camera and object in opposite directions at once. Start with a fixed camera; add a small push only when it improves the shot.

## A move and its sounds use one clock

`BrandTransform3D` goes **inside** `Scene3D`. It transforms its children and ends in a neutral pose; it does not generate sound or invent a logo. `brandTransformFrames` returns the same local `start` and `settle` used by the component. `cuesFor([start, settle], "transform")` places a sweep before the landing and a lock on it. Add the scene's `startFrame` exactly once when the cues are rendered outside that scene.

```tsx
import { BrandTransform3D, Scene3D, SceneFrame, SoundCues, Text3D, brandTransformFrames, cuesFor } from "reelkit/kit";

const timing = { from: 6, frames: 32 };
const event = brandTransformFrames(timing);
const cues = cuesFor([event.start, event.settle], "transform", {
  offset: s.startFrame, voice: true, sweepFrames: 10,
});

// These elements sit beside each other on the video's timeline.
<SceneFrame from={s.startFrame} durationInFrames={s.durationFrames}>
  <Scene3D mood="studio">
    <BrandTransform3D mode="turn" {...timing}>
      <Text3D text="Reelkit" color={palette.hero} fit={0.72} />
    </BrandTransform3D>
  </Scene3D>
</SceneFrame>
<SoundCues cues={cues} sounds={{
  "transform-sweep": urls["assets/lib/<whoosh-id>/clip.mp3"],
  "transform-lock": urls["assets/lib/<impact-id>/clip.mp3"],
}} />
```

Search and pull real sound files first. `sweepFrames` is the time from the file's start to its audible landing: listen to the chosen file and adjust it, instead of assuming every whoosh peaks at ten frames. Use `voice: true` while narration is heard. A build, a transformation and the final resolve are different events; do not stack all their hits on one landing.

## Before changing an existing shot

Identify the observable problem: the logo is unreadable, the result arrives before its spoken word, the movement has no relationship to the next shot, or the sound lands late. Change that problem first. Keep a deliberate cut, an existing brand treatment and the user's chosen look when they already work. Render the start, middle, landing and held state, then listen to the final video. A sound report helps find missed hits; its density targets are guidance, not a reason to add noise to every movement.
