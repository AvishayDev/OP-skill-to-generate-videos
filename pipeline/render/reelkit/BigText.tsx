// Heavy display type, one element per line and never wrapped: the film's headline voice. Hebrew lines read right to
// left with every Latin or number run isolated left to right ("Chrome", "250K" keep their order). An optional accent
// marker block grows behind a line from the right (where Hebrew starts reading) on its cue. All lines share one size,
// shrunk together so the longest fits `maxWidth`.
import React from "react";
import { ease } from "reelkit/kit";
import { useCurrentFrame, useVideoConfig, interpolate } from "reelkit/frame";

// 0→1 progress of a move starting at frame `at` lasting `len` frames, eased out and clamped.
const prog = (frame: number, at: number, len = 12, easing: (t: number) => number = ease.out) =>
  interpolate(frame, [at, at + Math.max(1, len)], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Right-to-left scripts: Hebrew, Arabic, Persian, Urdu.
const HEBREW = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LATIN_RUN = /[A-Za-z0-9$€£₪%+×#@][A-Za-z0-9$€£₪%+×#@.,:'’\-/ ]*[A-Za-z0-9$€£₪%+×#@]|[A-Za-z0-9$€£₪%+×#@]/g;

// Splits a line into Hebrew text and isolated left-to-right runs.
export const bidi = (text: string): React.ReactNode[] => {
  if (!HEBREW.test(text)) return [text];
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LATIN_RUN)) {
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(<bdi key={at} dir="ltr" style={{ unicodeBidi: "isolate" }}>{m[0]}</bdi>);
    last = at + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};
export const isRtl = (text: string) => HEBREW.test(text);

export const BigText: React.FC<{
  text: string | string[];
  color: string;
  face: string;
  // Font size in 1080 units.
  size?: number;
  weight?: number;
  // Line indexes that get the marker block (default: none), its colour, the ink on it, and the frame it grows on.
  mark?: number[];
  markColor?: string;
  markInk?: string;
  markAt?: number;
  align?: "center" | "right" | "left";
  maxWidth?: number;
  lineHeight?: number;
  shadow?: string;
}> = ({ text, color, face, size = 120, weight = 900, mark = [], markColor = "#000", markInk, markAt = 0, align = "center", maxWidth = 960, lineHeight = 1.08, shadow }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const lines = Array.isArray(text) ? text : [text];
  const longest = Math.max(...lines.map((l) => l.length));
  const fit = Math.min(1, maxWidth / Math.max(1, longest * size * 0.56));
  const fs = size * fit * k;
  const m = prog(frame, markAt, 8);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start", gap: fs * (lineHeight - 1) }}>
      {lines.map((line, i) => {
        const marked = mark.includes(i);
        return (
          <div key={i} style={{ position: "relative", whiteSpace: "nowrap", direction: isRtl(line) ? "rtl" : "ltr", fontFamily: face, fontWeight: weight, fontSize: fs, lineHeight, letterSpacing: 0, color: marked && m > 0.5 && markInk ? markInk : color, padding: `0 ${fs * 0.12}px`, textShadow: shadow }}>
            {marked ? (
              <div style={{ position: "absolute", top: "6%", bottom: "2%", right: 0, width: `${m * 100}%`, background: markColor, zIndex: 0 }} />
            ) : null}
            <span style={{ position: "relative", zIndex: 1 }}>{bidi(line)}</span>
          </div>
        );
      })}
    </div>
  );
};
