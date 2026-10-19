// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sh = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="rise" feel="bouncy" x={540} y={320}><BigText text={"סכו\"ם יוקרתי"} color={c.paper} face={face} size={84} mark={[0]} markAt={cue.c0} markColor={c.accent} markInk={c.accentInk} /></Pop>
      <Pop at={cue.c1} from="scale" feel="bouncy" x={540} y={450}><Tag text={"24 חלקים"} bg={c.accent} ink={c.accentInk} face={face} size={58} /></Pop>
      <Pop at={cue.c2} from="rise" feel="bouncy" x={250} y={1180}><Tag text={"כסף"} bg={c.accent} ink={c.accentInk} face={face} size={50} /></Pop>
      <Pop at={cue.c3} from="rise" feel="bouncy" x={540} y={1180}><Tag text={"שחור"} bg={c.accent} ink={c.accentInk} face={face} size={50} /></Pop>
      <Pop at={cue.c4} from="rise" feel="bouncy" x={830} y={1180}><Tag text={"זהב"} bg={c.accent} ink={c.accentInk} face={face} size={50} /></Pop>
    </>
  );
};
