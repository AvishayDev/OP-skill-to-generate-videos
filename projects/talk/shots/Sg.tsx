// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sg = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="scale" feel="bouncy" x={540} y={340}><Tag text={"2 ב-100 ₪"} bg="#E5173F" ink="#fff" face={face} size={110} border={c.paper} /></Pop>
      <Pop at={cue.c1} from="rise" feel="bouncy" x={540} y={470}><Tag text={"כמה שרוצים"} bg={c.accent} ink={c.accentInk} face={face} size={58} /></Pop>
    </>
  );
};
