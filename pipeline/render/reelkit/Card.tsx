// A clean UI card (paper fill, rounded, soft shadow) that holds any content: a dialog, an article, a receipt, a
// setting. Optional header row with a small title and a coloured dot, and grey skeleton lines for body text that
// does not need to be read.
import React from "react";
import { useVideoConfig } from "reelkit/frame";

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

export const Card: React.FC<{
  w: number;
  bg?: string;
  ink?: string;
  face?: string;
  title?: string;
  dot?: string;
  // Number of grey placeholder lines under the content.
  lines?: number;
  radius?: number;
  pad?: number;
  border?: string;
  children?: React.ReactNode;
}> = ({ w, bg = "#fff", ink = "#111", face = "sans-serif", title, dot, lines = 0, radius = 30, pad = 40, border, children }) => {
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  return (
    <div style={{ width: w * k, boxSizing: "border-box", background: bg, color: ink, borderRadius: radius * k, padding: pad * k, boxShadow: `0 ${22 * k}px ${50 * k}px rgba(0,0,0,0.18)`, border: border ? `${3 * k}px solid ${border}` : undefined, fontFamily: face, direction: "rtl", display: "flex", flexDirection: "column", gap: 20 * k }}>
      {title ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 * k, fontSize: 30 * k, fontWeight: 700, opacity: 0.75, whiteSpace: "nowrap", direction: isRtl(title) ? "rtl" : "ltr" }}>
          {dot ? <span style={{ width: 18 * k, height: 18 * k, borderRadius: "50%", background: dot }} /> : null}
          <span>{bidi(title)}</span>
        </div>
      ) : null}
      {children}
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} style={{ height: 18 * k, borderRadius: 9 * k, background: ink, opacity: 0.12, width: `${[100, 86, 93, 64, 78][i % 5]}%` }} />
      ))}
    </div>
  );
};
