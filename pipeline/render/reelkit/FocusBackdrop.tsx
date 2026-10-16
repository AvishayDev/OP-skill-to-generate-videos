// Pushes the footage back while a headline or number is on screen: the picture blurs and darkens towards the
// centre, then comes back. Use it around the film's picture layer so text moments read as clean graphics,
// not as type fighting a busy clip. windows are absolute frames of the film.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "reelkit/frame";

export const FocusBackdrop: React.FC<{
  windows: { from: number; frames: number }[];
  blur?: number;
  dim?: number;
  ramp?: number;
  children: React.ReactNode;
}> = ({ windows, blur = 14, dim = 0.55, ramp = 8, children }) => {
  const frame = useCurrentFrame();
  let amount = 0;
  for (const w of windows) {
    const v = interpolate(frame, [w.from - 2, w.from + ramp - 2, w.from + w.frames - ramp, w.from + w.frames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    amount = Math.max(amount, v);
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: amount > 0.01 ? `blur(${blur * amount}px) saturate(${1 - 0.25 * amount})` : undefined, transform: `scale(${1 + 0.04 * amount})` }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, rgba(0,0,0,${dim * 0.75 * amount}) 0%, rgba(0,0,0,${dim * amount}) 70%)` }} />
    </AbsoluteFill>
  );
};
