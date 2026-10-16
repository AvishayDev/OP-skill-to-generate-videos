// A soft round flare of light in the accent colour that blooms behind a headline or number as it lands, then settles
// to a faint halo. Use it behind text that pops over footage, to give the moment energy and separate it from the picture.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { springs } from "reelkit/kit";

export const LightBurst: React.FC<{ color: string; size?: number }> = ({ color, size = 0.9 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const p = spring({ frame, fps, config: springs.smooth });
  const flash = interpolate(frame, [0, 4, 18], [0, 0.85, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const d = width * size;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: d,
        height: d,
        transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.4, 1])})`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}99 0%, ${color}33 35%, transparent 68%)`,
        opacity: flash,
        pointerEvents: "none",
      }}
    />
  );
};
