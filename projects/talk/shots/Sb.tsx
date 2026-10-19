// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sb = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="left" feel="bouncy" x={540} y={330}><Tag text={"קראנץ' בצק עוגיות"} bg={c.accent} ink={c.accentInk} face={face} size={50} /></Pop>
      <Pop at={cue.c1} from="right" feel="bouncy" x={540} y={450}><Tag text={"קראנץ' פיג'"} bg={c.accent} ink={c.accentInk} face={face} size={50} /></Pop>
    </>
  );
};
