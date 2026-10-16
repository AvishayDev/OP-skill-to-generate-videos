// The concept's ground: a flat colour with fine paper grain and an optional quiet pattern (dots, a grid or ruled
// lines). It sits under every shot for the whole film, so the video reads as one designed piece.
import React from "react";
import { AbsoluteFill, useVideoConfig } from "reelkit/frame";

const grainSvg = (opacity: number) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0'/></filter><rect width='300' height='300' filter='url(#n)'/></svg>`)}")`;

export const Paper: React.FC<{ color: string; grain?: number; pattern?: "none" | "dots" | "grid" | "lines"; patternColor?: string; patternSize?: number }> = ({ color, grain = 0.06, pattern = "none", patternColor = "rgba(0,0,0,0.08)", patternSize = 54 }) => {
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const s = patternSize * k;
  const layer =
    pattern === "dots" ? `radial-gradient(${patternColor} ${2.2 * k}px, transparent ${2.6 * k}px)`
    : pattern === "grid" ? `linear-gradient(${patternColor} ${1.5 * k}px, transparent ${1.5 * k}px), linear-gradient(90deg, ${patternColor} ${1.5 * k}px, transparent ${1.5 * k}px)`
    : pattern === "lines" ? `linear-gradient(${patternColor} ${1.5 * k}px, transparent ${1.5 * k}px)`
    : "none";
  return (
    <AbsoluteFill style={{ backgroundColor: color }}>
      {pattern !== "none" ? <AbsoluteFill style={{ backgroundImage: layer, backgroundSize: `${s}px ${s}px`, backgroundPosition: "center" }} /> : null}
      {grain > 0 ? <AbsoluteFill style={{ backgroundImage: grainSvg(grain * 1.2), backgroundSize: `${300 * k}px ${300 * k}px`, mixBlendMode: "multiply" }} /> : null}
    </AbsoluteFill>
  );
};
