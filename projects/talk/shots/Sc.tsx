// Animated callouts over the speaker, each landing on the word that names it.
import React from "react";

type ShotProps = any;

export const Sc = ({ cue, c, face, ui }: ShotProps) => {
  const { Pop, At, BigText, Tag, Stamp } = ui;
  return (
    <>
      <At x={540} y={360}><Stamp text={"סחורה חדשה"} at={cue.c0} color={c.accent} face={face} size={84} fill="rgba(0,0,0,.55)" /></At>
    </>
  );
};
