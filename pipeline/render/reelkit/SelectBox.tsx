// An editor's selection box in the accent colour, with square handles on its corners and an optional tag: it snaps
// around a photo, a word or a detail on its cue to say "look at this". Size in 1080 units; place it with At or Pop.
import React from "react";
import { ease } from "reelkit/kit";
import { interpolate, useCurrentFrame, useVideoConfig } from "reelkit/frame";

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

export const SelectBox: React.FC<{ w: number; h: number; at?: number; color: string; tag?: string; tagInk?: string; face?: string; thickness?: number; children?: React.ReactNode }> = ({ w, h, at = 0, color, tag, tagInk = "#000", face = "sans-serif", thickness = 5, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const p = prog(frame, at, 9);
  const grow = interpolate(p, [0, 1], [1.12, 1]);
  const hs = 18 * k;
  return (
    <div style={{ position: "relative", width: w * k, height: h * k }}>
      {children}
      {frame >= at ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${grow})`, opacity: Math.min(1, p * 2.5) }}>
          <div style={{ position: "absolute", inset: 0, border: `${thickness * k}px solid ${color}` }} />
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([sx, sy], i) => (
            <div key={i} style={{ position: "absolute", left: `calc(${sx * 100}% - ${hs / 2}px)`, top: `calc(${sy * 100}% - ${hs / 2}px)`, width: hs, height: hs, background: "#fff", border: `${3 * k}px solid ${color}` }} />
          ))}
          {tag ? (
            <div style={{ position: "absolute", right: -thickness * k, bottom: "100%", marginBottom: 10 * k }}>
              <div style={{ background: color, color: tagInk, fontFamily: face, fontWeight: 800, fontSize: 30 * k, lineHeight: 1, padding: `${8 * k}px ${15 * k}px`, borderRadius: 9 * k, whiteSpace: "nowrap", direction: isRtl(tag) ? "rtl" : "ltr" }}>{tag}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
