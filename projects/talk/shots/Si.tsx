// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Si = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="left" feel="bouncy" x={540} y={320}><Tag text={"2 סטים"} bg={c.accent} ink={c.accentInk} face={face} size={60} /></Pop>
      <Pop at={cue.c1} from="scale" feel="bouncy" x={540} y={440}><Tag text={"150 ₪ בלבד"} bg="#E5173F" ink="#fff" face={face} size={100} border={c.paper} /></Pop>
      <At x={540} y={1180}><Stamp text={"75 ₪ לסט"} at={cue.c2} color={c.accent} face={face} size={90} fill="rgba(0,0,0,.55)" /></At>
    </>
  );
};
