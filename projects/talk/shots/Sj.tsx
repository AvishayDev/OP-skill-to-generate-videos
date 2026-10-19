// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sj = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <At x={540} y={360}><Stamp text={"הכי זול בארץ"} at={cue.c0} color={c.accent} face={face} size={84} fill="rgba(0,0,0,.55)" /></At>
    </>
  );
};
