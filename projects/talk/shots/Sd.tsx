// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sd = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="rise" feel="bouncy" x={300} y={330}><Tag text={"סופגניות"} bg={c.accent} ink={c.accentInk} face={face} size={52} /></Pop>
      <Pop at={cue.c1} from="left" feel="bouncy" x={300} y={430}><Tag text={"עם ריבה"} bg={c.accent} ink={c.accentInk} face={face} size={44} /></Pop>
      <Pop at={cue.c2} from="left" feel="bouncy" x={300} y={520}><Tag text={"בלי ריבה"} bg={c.accent} ink={c.accentInk} face={face} size={44} /></Pop>
      <Pop at={cue.c3} from="scale" feel="bouncy" x={540} y={1180}><Tag text={"4 יח' ב-10 ₪"} bg="#E5173F" ink="#fff" face={face} size={92} border={c.paper} /></Pop>
    </>
  );
};
