// Nothing else needed: NO TIMELINE / NO CAPCUT / NO LAPTOP as kinetic poster words, ground hard-cut per group,
// the second word struck through 6 frames after it lands — only while its own group is on screen.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "reelkit/frame";

type ShotProps = any;
type W = { word: string; f: number; end: number };

export const NoNoNo = ({ frames, cue, words, c, face, ui }: ShotProps) => {
  const { KineticLine, Push, chunkAt } = ui;
  const frame = useCurrentFrame();
  const ws = words as W[];
  const grounds = [
    { bg: c.black, ink: c.cream, hot: c.yellow, bar: c.accent },
    { bg: c.accent, ink: c.cream, hot: c.black, bar: c.yellow },
    { bg: c.yellow, ink: c.black, hot: c.accent, bar: c.black },
  ];
  const i = Math.max(0, chunkAt(ws, frame, 2));
  const g = grounds[i % grounds.length];
  const hit = [cue.timeline, cue.capcut, cue.laptop][Math.min(2, i)];
  const strike = interpolate(frame, [hit + 6, hit + 13], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Second-line centre for NO + one long word: the geometry KineticLine lays out (y 760, width 860, glyph 0.68).
  const second = ws.filter((w) => w.f <= frame).at(-1)?.word.replace(/[.]/, "") ?? "";
  const s1 = Math.min(330, 860 / (2 * 0.68));
  const s2 = Math.min(330, 860 / (Math.max(2, second.length) * 0.68));
  const lineY = 760 - ((s1 + s2) * 0.92) / 2 + s1 * 0.92 + (s2 * 0.92) / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: g.bg }}>
      <Push frames={frames} zoom={1.1} hits={[cue.timeline, cue.capcut, cue.laptop]}>
        <KineticLine words={ws} face={face} ink={g.ink} accent={g.hot} emphasis={["timeline", "capcut", "laptop"]} y={760} />
        {frame >= hit ? <div style={{ position: "absolute", left: 110, top: lineY - 18, width: 860 * strike, height: 36, borderRadius: 18, background: g.bar, transform: "rotate(-4deg)", transformOrigin: "left center" }} /> : null}
      </Push>
    </AbsoluteFill>
  );
};
