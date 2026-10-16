// A big number that counts up from its cue and lands exactly when the count ends, with an optional prefix, suffix
// and accent label under it. Numbers always read left to right. Use it for the one figure a story is about.
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "reelkit/frame";
import { ease } from "reelkit/kit";

// Right-to-left scripts: Hebrew, Arabic, Persian, Urdu.
const HEBREW = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LATIN_RUN = /[A-Za-z0-9$€£₪%+×#@][A-Za-z0-9$€£₪%+×#@.,:'’\-/ ]*[A-Za-z0-9$€£₪%+×#@]|[A-Za-z0-9$€£₪%+×#@]/g;
const isRtl = (text: string) => HEBREW.test(text);
// Hebrew text with every Latin or number run isolated left to right, so "Chrome" or "250K" keep their order.
const bidi = (text: string): React.ReactNode[] => {
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
// 0→1 progress of a move starting at frame `at` lasting `len` frames, eased out and clamped.
const prog = (frame: number, at: number, len = 12, easing: (t: number) => number = ease.out) =>
  interpolate(frame, [at, at + Math.max(1, len)], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const CountUp: React.FC<{
  to: number;
  at: number;
  // Frames the count takes.
  dur?: number;
  from?: number;
  decimals?: number;
  grouped?: boolean;
  prefix?: string;
  suffix?: string;
  color: string;
  face: string;
  size?: number;
  label?: string;
  labelColor?: string;
  labelBg?: string;
}> = ({ to, at, dur = 18, from = 0, decimals = 0, grouped = true, prefix = "", suffix = "", color, face, size = 220, label, labelColor, labelBg }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const p = prog(frame, at, dur, ease.out);
  const v = from + (to - from) * p;
  const num = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouped });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 * k }}>
      <div style={{ direction: "ltr", whiteSpace: "nowrap", fontFamily: face, fontWeight: 900, fontSize: size * k, lineHeight: 1, color, fontVariantNumeric: "tabular-nums" }}>
        {prefix}{num}{suffix}
      </div>
      {label ? (
        <div style={{ direction: isRtl(label) ? "rtl" : "ltr", whiteSpace: "nowrap", fontFamily: face, fontWeight: 800, fontSize: size * 0.26 * k, color: labelColor ?? color, background: labelBg, padding: labelBg ? `${6 * k}px ${20 * k}px` : 0, borderRadius: 12 * k }}>
          {bidi(label)}
        </div>
      ) : null}
    </div>
  );
};
