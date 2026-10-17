// The payoff: ZOOMS / MUSIC / SOUND EFFECTS / DONE hard-cut on new grounds, NO CAPCUT and NO LAPTOP struck through,
// then the cream end card with the whole CTA line arriving word by word.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "reelkit/frame";

type ShotProps = any;
type W = { word: string; f: number; end: number };

export const Done = ({ words, frames, cue, c, face, ui }: ShotProps) => {
  const { KineticLine, Push, chunkAt } = ui;
  const frame = useCurrentFrame();
  const ws = words as W[];
  const before = ws.filter((w) => w.f < cue.tell);
  const cta = ws.filter((w) => w.f >= cue.tell);
  if (frame >= cue.tell) {
    return (
      <AbsoluteFill style={{ backgroundColor: c.cream }}>
        <Push frames={frames} hits={[cue.tell]} zoom={1.04} turn={0.6}>
          <KineticLine words={cta.map((w) => ({ ...w, f: w.f }))} face={face} ink={c.black} accent={c.accent} emphasis={["film", "first"]} group={6} y={880} width={760} maxSize={220} />
        </Push>
      </AbsoluteFill>
    );
  }
  const grounds = [
    { bg: c.accent, ink: c.cream, hot: c.yellow },
    { bg: c.black, ink: c.cream, hot: c.accent },
    { bg: c.yellow, ink: c.black, hot: c.accent },
    { bg: c.accent, ink: c.cream, hot: c.cream },
    { bg: c.black, ink: c.cream, hot: c.accent },
    { bg: c.yellow, ink: c.black, hot: c.accent },
  ];
  const i = Math.max(0, chunkAt(before, frame, 2));
  const g = grounds[i % grounds.length];
  // Strike through the second line (CAPCUT / LAPTOP): its centre for a 2-line group of NO + a 6-letter word.
  // Only while that word's group is on screen: the next group ("NO" before "LAPTOP") starts clean.
  const laptopGroup = before[before.findIndex((w) => w.f >= cue.laptop) - 1]?.f ?? cue.laptop;
  const strikeAt = frame >= cue.laptop ? cue.laptop : frame >= cue.capcut && frame < laptopGroup ? cue.capcut : null;
  const strike = strikeAt === null ? 0 : interpolate(frame, [strikeAt + 6, strikeAt + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: g.bg }}>
      <Push frames={cue.tell} hits={[cue.done, cue.capcut, cue.laptop]} zoom={1.1}>
        <KineticLine words={before} face={face} ink={g.ink} accent={g.hot} emphasis={["done", "capcut", "laptop"]} y={760} />
        {strikeAt !== null ? (
          <div style={{ position: "absolute", left: 120, top: 905, width: 840 * strike, height: 34, borderRadius: 17, background: g.bg === c.black ? c.yellow : c.accent, transform: "rotate(-4deg)", transformOrigin: "left center" }} />
        ) : null}
      </Push>
    </AbsoluteFill>
  );
};
