// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sk = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="rise" feel="bouncy" x={540} y={330}><BigText text={"אוהבים אתכם"} color={c.paper} face={face} size={92} mark={[0]} markAt={cue.c0} markColor={c.accent} markInk={c.accentInk} /></Pop>
      <Pop at={cue.c1} from="scale" feel="bouncy" x={540} y={450}><Tag text={"♥"} bg={c.accent} ink={c.accentInk} face={face} size={90} /></Pop>
    </>
  );
};
