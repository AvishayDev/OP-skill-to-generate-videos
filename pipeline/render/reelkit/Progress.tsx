// A progress / loading bar that fills left to right (bars always fill that way, even in Hebrew) from its cue, with an
// optional label above and the percentage. Use it for an update installing, a download, a share of something.
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

export const Progress: React.FC<{ at: number; dur?: number; to?: number; w: number; h?: number; track: string; fill: string; ink: string; face: string; label?: string; percent?: boolean }> = ({ at, dur = 30, to = 1, w, h = 34, track, fill, ink, face, label, percent = true }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const v = prog(frame, at, dur, ease.inOut) * to;
  return (
    <div style={{ width: w * k, display: "flex", flexDirection: "column", gap: 14 * k, fontFamily: face }}>
      {label || percent ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", direction: "rtl", color: ink, fontWeight: 800, fontSize: 38 * k, whiteSpace: "nowrap" }}>
          <span style={{ direction: label && isRtl(label) ? "rtl" : "ltr" }}>{label ? bidi(label) : ""}</span>
          {percent ? <span style={{ direction: "ltr", fontVariantNumeric: "tabular-nums" }}>{Math.round(v * 100)}%</span> : null}
        </div>
      ) : null}
      <div style={{ direction: "ltr", height: h * k, borderRadius: h * k, background: track, overflow: "hidden", border: `${3 * k}px solid ${ink}` }}>
        <div style={{ width: `${v * 100}%`, height: "100%", background: fill }} />
      </div>
    </div>
  );
};
