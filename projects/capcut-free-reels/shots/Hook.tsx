// Hook: the spoken words slam in two at a time on hard-cut red / black / yellow grounds; STOP and SERIOUSLY hit.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "reelkit/frame";

type ShotProps = any;
type W = { word: string; f: number; end: number };

export const Hook = ({ words, frames, cue, c, face, ui }: ShotProps) => {
  const { KineticLine, Push, chunkAt } = ui;
  const frame = useCurrentFrame();
  const grounds = [
    { bg: c.accent, ink: c.cream, hot: c.yellow },
    { bg: c.black, ink: c.cream, hot: c.accent },
    { bg: c.yellow, ink: c.black, hot: c.accent },
    { bg: c.black, ink: c.cream, hot: c.yellow },
  ];
  const g = grounds[Math.max(0, chunkAt(words, frame)) % grounds.length];
  const hits = (words as W[]).filter((w) => /^(stop|hand|seriously)/i.test(w.word)).map((w) => w.f);
  return (
    <AbsoluteFill style={{ backgroundColor: g.bg }}>
      <Push frames={frames} hits={hits} zoom={1.1}>
        <KineticLine words={words} face={face} ink={g.ink} accent={g.hot} emphasis={["stop", "hand", "seriously"]} y={780} />
      </Push>
    </AbsoluteFill>
  );
};
