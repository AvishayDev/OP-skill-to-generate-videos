// Brings its children in a few frames after the element around it: a quick fade with a small rise. Use it for the
// second line of a stacked title or a label, so the eye reads the headline first.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { springs } from "reelkit/kit";

export const Reveal: React.FC<{ delay?: number; children: React.ReactNode }> = ({ delay = 6, children }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: springs.snappy });
  return (
    <div style={{ opacity: Math.min(1, p * 1.5), transform: `translateY(${interpolate(p, [0, 1], [width * 0.025, 0])}px)` }}>{children}</div>
  );
};
