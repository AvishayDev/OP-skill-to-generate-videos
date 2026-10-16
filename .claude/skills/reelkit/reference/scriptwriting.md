---
name: scriptwriting
description: Use when writing the spoken script for a short social video - the opening, hook patterns, story shape by kind of video, pacing, and holding attention to the end.
---

# Scriptwriting for short video

## Length and pace
- Narration is spoken at about 2.5 words per second. A 30 second video is about 75 words; 60 seconds is about 150.
- Without footage, aim for 30 to 60 seconds in total. With footage, never exceed the word limit that `reelkit plan check` reports.
- One idea per scene. Scenes should not all be the same length: let one or two be a hit of three to six words and one run to two sentences. Even scenes read as slides.

## The opening decides the video
Most of what a short video achieves is decided in its first three seconds, and nearly all of it by ten. Write the opening first and spend the most care on it.

- **The first frame is a picture, not a title.** Open on the subject, the result or the problem itself: a generated picture, a clip, the user's own screenshot or footage, or one striking object. Text alone is never the first shot. Something must move within the first second. A voiceless launch film is the exception and follows `reference/launch-film.md` instead: its opening is type and motion, with sound from the first frame.
- **It works with the sound off.** The picture and a few words on screen carry the promise without the voice; many viewers never turn the sound on.
- **The spoken hook is twelve words or fewer** and starts at once. No greeting, no logo sting, no "in this video", no name of the product before the reason to care.
- **Picture, voice and text each do a different job.** The picture shows the claim, the voice adds the tension, the on-screen text is the keyword. Never have all three say the same sentence.
- **The promise is made in the first sentence and kept.** By three seconds the viewer knows what they will get; for a product, it is on screen by five. The video then delivers exactly that. A hook the body does not pay off loses the viewer and their trust.

### Hook patterns
Pick the one that fits what is true about the idea. Each needs its picture as much as its words.
- **Result first.** Show the finished thing, then how. "Four hundred invoices, sent before coffee."
- **The wrong belief.** Name what people assume, then turn it. "Your starter is not dying. It is hungry."
- **The problem, shown.** Open on the mess with no explanation for a second. A calendar with forty meetings in one week.
- **A specific number.** "Three taps replace your morning checklist." Only a number the user gave you.
- **The odd image.** Something that should not be there, then the question it raises. A paper map on a car dashboard: "Why is this still in your glove box?"
- **The open question.** Ask what the last scene answers, and do not answer it until then.
- **Before and after.** Cut between the two states before saying a word about the product.
- **What it costs.** What the viewer loses every week by not knowing this. Only when it is true.
- **Start in the middle.** Open at the moment of trouble, then go back. "At two in the morning the site was down and I was the only one awake."
- **Already happening.** Start mid-action in the interface: the cursor is already drawing the chart.

## Structure
Choose the shape by what the video is.
- **Product or app demo:** the problem in one beat, the product doing the thing for real, the result. Show the action, not a description of it.
- **How something works:** a surprising claim, then cause and effect step by step, then the answer to the opening.
- **Tips or a list:** the strongest or most surprising item first, or build up to it. Never open with the weakest.
- **A story:** setup, a turn, what changed because of it.
- **An announcement:** the news in the first sentence, then why it matters to the viewer, then what to do.

Whatever the shape:
- **Every scene follows from the one before with "but" or "so", never "and then".** If two scenes could swap places, one of them is not needed.
- **Raise a question early and answer it last.** The answer is the payoff; put the biggest picture of the video there.
- **Re-hook twice.** Around forty percent and seventy percent of the way through, give the viewer a new reason to stay: a turn, a number, a reveal, a second question.
- **Be concrete.** At least half the scenes name a real number, a real object or a real moment. "Faster" and "better" are not content.
- **Something new on screen every two to three seconds:** a new shot, a new element, a camera move. The plan's `notes` should say what changes.
- **Mix what the scenes are made of.** A picture, a clip, the interface, type: never more than two scenes in a row of the same kind. A video of only text and shapes reads as a slideshow, so plan a picture or a clip for a third to half of the scenes, the opening first (see `reference/scene-treatments.md` and `reference/clips.md`).
- **End on the payoff, then one action** in five words or fewer. Where it fits, return to the opening image, changed.

## A spine for an argument

When the video argues for something (a pitch, a recommendation, a lesson, a brand's reason for being), choose one spine and keep to it. Each is an order of beats; a scene is one beat.

- **Answer first.** The conclusion in the first scene, then the three reasons, each with its one piece of evidence, then the conclusion again as what to do. For a busy viewer and a decision.
- **Situation, complication, resolution.** What everyone agrees is true; what changed or went wrong; what follows from it. For news and for a change of mind.
- **A pitch.** The problem as two numbers (today, and where it is heading); the idea in one sentence; how it works in three steps; the proof; the ask. With a narrator, the ask is the last sentence and nothing follows it.
- **A brand's story.** Where it began; the friction it met; what it came to believe; how that belief shows in what it makes; where it is going. The belief comes before any product shot.
- **A lesson.** Why it matters to you; the picture to hold in your head; one worked example; your turn (a question held on screen for a beat before the answer); how to use it tomorrow.
- **A story in pictures.** The opening image; the complication; the turn; what it led to; what the viewer should do. One picture and one short line a scene, and the distance of the camera changes from scene to scene.

**Read the headlines alone.** Write every scene's main on-screen line first, as a finding and not a label ("Replies went from four hours to two minutes", never "Results"), and read only those lines in order. They must tell the whole video. If they do not, the script is not ready, whatever the narration says.

**Drop a scene instead of filling it.** A scene that needs a number, a quote or a customer the user did not give is cut, or rewritten around what they did give. It is never kept with an invented one.

**Vary what repeats.** No three scenes in a row on the same ground, in the same layout, or with their words in the same place.

## Voice
- Write for the ear: short sentences, contractions, plain words. Read it aloud in your head.
- Write numbers as they are spoken ("seventy-five percent"), since the text goes to a voice model.
- No emoji, no hashtags, no stage directions in narration.
- Write in the language of the idea. If the idea is in Hebrew, write the script in Hebrew.

## Using the user's uploads
Each of the user's files in `assets/index.json` has a description of what it shows. Use an asset in the scene where it is relevant to what is being said, and leave out any that fit nowhere: a logo in the opening or closing scene, a screenshot where the narration talks about that screen, a product photo where the product is named. Put its id in that scene's userAssetIds and say in the notes how to show it.

## Choosing the voice
`reelkit assets voices` lists the available voices with a description, gender, accent and language (`--json` also gives each voice's kind). Pick one `voiceId` for the whole video and a `pace`.

- **Language first.** For Hebrew narration choose a voice whose language is Hebrew if there is one. For English, choose an accent that suits the audience; default to a neutral one.
- **Match the energy of the idea.** Punchy tips, lists and promos: an energetic, social-media style voice. Explainers and how-tos: a clear, friendly educator. Finance, health, legal and B2B: a steady, trustworthy voice. Stories and reflective pieces: a warm storyteller.
- **Match the speaker the script implies.** If the script speaks as the brand or founder ("we build..."), prefer the owner's own cloned voice when one is listed (kind "cloned"). Otherwise choose freely; do not pick a gender by stereotype of the topic.
- **Avoid character voices** (described as a villain, warrior, trickster, cartoon or similar) unless the idea is playful and calls for one.
- **Pace:** "normal" by default, "fast" for high-energy hooks and lists, "slow" for calm, emotional or complex material. A fast pace fits more words per second; keep the word limit either way.
- Vary your choice across videos: do not default to the first voice in the list.

## Plain words first
A viewer who does not know the product, the people or the story must follow it on one viewing.
- Say what this is in one plain sentence before any suspense. A riddle for an opening tells an outsider nothing.
- Tell it in the order a person would retell it: what it is, what happened or what is wrong, how we know, what came of it, what to do now. Every sentence picks up from the one before.
- The first time a term of the trade, a nickname or a person's name appears, give it one line of explanation on screen ("the team's lead designer"), or do not use it.
- Before delivery, read only the narration (or only the on-screen text of a voiceless film) and retell the whole story from it. If the retelling has a hole, the script has one: fix the script, not the picture.
- For a product, the real interface or the real result is on screen in every section about a feature; drawn cards and generated pictures dress it and join the sections, and do not stand in for it.

## Truthfulness
- Never invent numbers, statistics, quotes, prices, testimonials or results. Use a figure only when the idea supplies it or it is common knowledge you are sure of; otherwise make the point without a number.
- Do not claim features or facts about the user's product that the idea did not state.
- No fake urgency or made-up social proof.

## On-screen text
- onScreenText is what appears on screen, not the narration. Two to five words per item, at most three items per scene, and at most 44 characters: a longer line cannot be set large enough to read on a phone, so shorten it or give it a shot of its own.
- It should reinforce the spoken point (a keyword, a number, a label), never repeat the sentence.

## Show, do not state
A claim written as a sentence is the weakest way to make it. Give each claim a small interface that performs it (a typed question and its answer, a terminal that works, a number that rolls) and keep the words to a headline of two to five with one emphasised keyword. Open with the user's own question when the product answers questions. Say which claims are highlighted and which are only mentioned, at most three highlighted in 30 seconds.
