// A big number that counts up to its value, white with a soft glow in the accent colour, with an optional label
// (children) under it. A percentage also draws a ring that fills with the count. Use it for the one striking figure
// of a story ($2, 3.6 GW, 71%) over footage.
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { ease } from "reelkit/kit";

export type StatCount = { prefix: string; value: number; decimals: number; grouped: boolean; suffix: string };

export const StatPop: React.FC<{
  text: string;
  // The number inside text, when it is one, so it can count up; null shows text as is.
  count?: StatCount | null;
  ink: string;
  glow: string;
  face: string;
  // Font size in pixels for a 1080-wide frame.
  size?: number;
  // Frames the count takes.
  countFrames?: number;
  children?: React.ReactNode;
}> = ({ text, count, ink, glow, face, size = 190, countFrames = 20, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const p = interpolate(frame, [0, countFrames], [0, 1], { easing: ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let shown = text;
  if (count) {
    const v = count.value * p;
    const num = count.grouped
      ? v.toLocaleString("en-US", { minimumFractionDigits: count.decimals, maximumFractionDigits: count.decimals })
      : v.toFixed(count.decimals);
    shown = `${count.prefix}${num}${count.suffix}`;
  }
  const fit = Math.min(1, (width * 0.86) / Math.max(1, text.length * size * 0.6 * k));
  const fs = size * k * fit;
  // A percentage gets a ring around it that fills as the number counts.
  const ring = count && count.suffix.trim() === "%" && count.value <= 100 ? (count.value / 100) * p : null;
  const R = fs * 1.05;
  const C = 2 * Math.PI * R;
  const number = (
    <div
      style={{
        direction: "ltr",
        whiteSpace: "nowrap",
        fontFamily: face,
        fontWeight: 900,
        fontSize: fs,
        lineHeight: 1,
        color: ink,
        fontVariantNumeric: "tabular-nums",
        textShadow: `0 0 ${12 * k}px ${glow}e6, 0 0 ${34 * k}px ${glow}b3, 0 0 ${80 * k}px ${glow}73, 0 ${5 * k}px ${16 * k}px rgba(0,0,0,0.55)`,
      }}
    >
      {shown}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * k }}>
      {ring === null ? (
        number
      ) : (
        <div style={{ position: "relative", width: R * 2.3, height: R * 2.3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={R * 2.3} height={R * 2.3} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <circle cx={R * 1.15} cy={R * 1.15} r={R} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.14)" strokeWidth={10 * k} />
            <circle
              cx={R * 1.15}
              cy={R * 1.15}
              r={R}
              fill="none"
              stroke={glow}
              strokeWidth={12 * k}
              strokeLinecap="round"
              strokeDasharray={`${C * ring} ${C}`}
              transform={`rotate(-90 ${R * 1.15} ${R * 1.15})`}
              style={{ filter: `drop-shadow(0 0 ${14 * k}px ${glow})` }}
            />
          </svg>
          {number}
        </div>
      )}
      {children}
    </div>
  );
};
