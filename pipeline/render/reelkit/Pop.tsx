// Brings one element in on its word and (optionally) out again: a whole-word entrance that moves opacity, position
// and scale together on a spring — never a mask, so Hebrew never shows a cut letter. Use it around every element a
// shot introduces: `<Pop at={cue.logo} from="scale" x={540} y={600}>…</Pop>`. Before `at` nothing is drawn.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { ease } from "reelkit/kit";

export type PopFrom = "scale" | "rise" | "drop" | "left" | "right" | "spin" | "none";

export const Pop: React.FC<{
  at: number;
  // Frame at which the element has left (it starts leaving 8 frames earlier). Omit to stay to the end.
  out?: number;
  from?: PopFrom;
  // Centre in 1080-wide units; omit both to lay the element out in the normal flow.
  x?: number;
  y?: number;
  rot?: number;
  // Distance of the slide or rise, in 1080 units.
  dist?: number;
  // Springiness: "snappy" (default), "bouncy" for a playful overshoot, "soft" for calm text.
  feel?: "snappy" | "bouncy" | "soft";
  children?: React.ReactNode;
}> = ({ at, out, from = "rise", x, y, rot = 0, dist, feel = "snappy", children }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  if (frame < at || (out !== undefined && frame >= out)) return null;
  const config = feel === "bouncy" ? { stiffness: 260, damping: 13 } : feel === "soft" ? { stiffness: 140, damping: 24 } : { stiffness: 320, damping: 26 };
  const p = from === "none" ? 1 : spring({ frame: frame - at, fps, config });
  const q = out === undefined ? 0 : interpolate(frame, [out - 8, out], [0, 1], { easing: ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const d = (dist ?? (from === "drop" ? 120 : from === "rise" ? 46 : 90)) * k;
  const dx = from === "left" ? -d * (1 - p) : from === "right" ? d * (1 - p) : 0;
  const dy = from === "rise" ? d * (1 - p) : from === "drop" ? -d * (1 - p) : 0;
  const scale = (from === "scale" || from === "spin" ? interpolate(p, [0, 1], [0.35, 1]) : interpolate(p, [0, 1], [0.94, 1])) * (1 - 0.08 * q);
  const spin = from === "spin" ? (1 - p) * -40 : 0;
  const opacity = Math.min(1, interpolate(frame - at, [0, 2], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) * (1 - q);
  const place = x === undefined || y === undefined ? "" : "translate(-50%, -50%) ";
  const style: React.CSSProperties = {
    transform: `${place}translate(${dx}px, ${dy - 18 * k * q}px) rotate(${rot + spin}deg) scale(${scale})`,
    opacity,
    ...(x === undefined || y === undefined ? { display: "inline-block" } : { position: "absolute", left: x * k, top: y * k }),
  };
  return <div style={style}>{children}</div>;
};
