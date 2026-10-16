// A hand-drawn marker stroke that draws itself on its cue: a loose circle around something, an underline, an arrow,
// a cross-out or a check. The line wobbles like a real pen (seeded, so it is the same on every render). Size in
// 1080 units; place it with At over the thing it marks.
import React from "react";
import { ease } from "reelkit/kit";
import { random, useCurrentFrame, useVideoConfig, interpolate } from "reelkit/frame";

// 0→1 progress of a move starting at frame `at` lasting `len` frames, eased out and clamped.
const prog = (frame: number, at: number, len = 12, easing: (t: number) => number = ease.out) =>
  interpolate(frame, [at, at + Math.max(1, len)], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export type DoodleKind = "circle" | "underline" | "arrow" | "cross" | "check";

const path = (kind: DoodleKind, w: number, h: number, seed: number): string => {
  const j = (i: number, a = 1) => (random(`${seed}-${i}`) - 0.5) * a;
  if (kind === "circle") {
    const pts: string[] = [];
    for (let i = 0; i <= 26; i++) {
      const a = -Math.PI * 0.6 + (i / 24) * Math.PI * 2.08;
      const r = 1 + j(i, 0.08);
      pts.push(`${(w / 2 + Math.cos(a) * (w / 2) * r).toFixed(1)},${(h / 2 + Math.sin(a) * (h / 2) * r).toFixed(1)}`);
    }
    return `M${pts.join(" L")}`;
  }
  if (kind === "underline") return `M${w},${h * 0.55 + j(1, 8)} Q${w * 0.5},${h * 0.35 + j(2, 10)} 0,${h * 0.6 + j(3, 8)}`;
  if (kind === "arrow") return `M${w},${h} Q${w * 0.55 + j(1, 20)},${h * 0.2} ${w * 0.08},${h * 0.12} M${w * 0.08},${h * 0.12} l${w * 0.16},${-h * 0.08} M${w * 0.08},${h * 0.12} l${w * 0.1},${h * 0.16}`;
  if (kind === "cross") return `M0,0 L${w},${h} M${w},0 L0,${h}`;
  return `M${w * 0.05},${h * 0.55} L${w * 0.38},${h * 0.92} L${w * 0.95},${h * 0.06}`;
};

export const Doodle: React.FC<{ kind: DoodleKind; w: number; h: number; at: number; dur?: number; color: string; stroke?: number; seed?: number }> = ({ kind, w, h, at, dur = 10, color, stroke = 9, seed = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  if (frame < at) return null;
  const p = prog(frame, at, dur);
  const pad = stroke * 2;
  return (
    <svg width={(w + 2 * pad) * k} height={(h + 2 * pad) * k} viewBox={`${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`} style={{ overflow: "visible", display: "block" }}>
      <path d={path(kind, w, h, seed)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    </svg>
  );
};
