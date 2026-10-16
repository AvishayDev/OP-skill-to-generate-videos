// Places its children with their centre at (x, y) in 1080-wide frame units, optionally rotated, scaled or faded.
// Use it to put any element exactly where a shot's layout wants it (Pop does the same while animating in).
import React from "react";
import { useVideoConfig } from "reelkit/frame";

export const At: React.FC<{ x: number; y: number; rot?: number; scale?: number; opacity?: number; children?: React.ReactNode }> = ({ x, y, rot = 0, scale = 1, opacity = 1, children }) => {
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  return (
    <div style={{ position: "absolute", left: x * k, top: y * k, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`, opacity }}>
      {children}
    </div>
  );
};
