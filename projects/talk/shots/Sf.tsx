// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sf = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="left" feel="bouncy" x={250} y={330}><Tag text={"גדול"} bg={c.accent} ink={c.accentInk} face={face} size={56} /></Pop>
      <Pop at={cue.c1} from="left" feel="bouncy" x={250} y={430}><Tag text={"קטן"} bg={c.accent} ink={c.accentInk} face={face} size={56} /></Pop>
      <Pop at={cue.c2} from="scale" feel="bouncy" x={540} y={1180}><Tag text={"2 סירים ב-100 ₪"} bg="#E5173F" ink="#fff" face={face} size={90} border={c.paper} /></Pop>
    </>
  );
};
