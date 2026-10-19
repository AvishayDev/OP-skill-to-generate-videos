// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sa = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <Pop at={cue.c0} from="rise" feel="bouncy" x={540} y={330}><BigText text={"החטיפים החדשים"} color={c.paper} face={face} size={86} mark={[0]} markAt={cue.c0} markColor={c.accent} markInk={c.accentInk} /></Pop>
    </>
  );
};
