// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Se = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="drop" feel="bouncy" x={540} y={340}><BigText text={"הגיע סחורה!"} color={c.paper} face={face} size={96} mark={[0]} markAt={cue.c0} markColor={c.accent} markInk={c.accentInk} /></Pop>
    </>
  );
};
