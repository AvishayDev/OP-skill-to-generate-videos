// An app window or system dialog: a title bar with three dots and a title, then any content. Use it for a code
// editor, a browser, a settings panel or an alert ("Update available") — the "computer said so" frame.
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

export const Window: React.FC<{ w: number; title?: string; bar?: string; bg?: string; ink?: string; face?: string; dots?: string[]; radius?: number; pad?: number; children?: React.ReactNode }> = ({ w, title = "", bar = "#e9e5db", bg = "#fff", ink = "#111", face = "sans-serif", dots = ["#ff5f57", "#febc2e", "#28c840"], radius = 26, pad = 36, children }) => {
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  return (
    <div style={{ width: w * k, background: bg, color: ink, borderRadius: radius * k, overflow: "hidden", boxShadow: `0 ${24 * k}px ${56 * k}px rgba(0,0,0,0.2)`, border: `${3 * k}px solid ${ink}`, fontFamily: face }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 * k, height: 64 * k, padding: `0 ${24 * k}px`, background: bar, borderBottom: `${3 * k}px solid ${ink}`, direction: "ltr" }}>
        {dots.map((d, i) => <span key={i} style={{ width: 20 * k, height: 20 * k, borderRadius: "50%", background: d, border: `${2 * k}px solid rgba(0,0,0,0.25)` }} />)}
        <div style={{ flex: 1, textAlign: "center", fontSize: 30 * k, fontWeight: 700, whiteSpace: "nowrap", direction: isRtl(title) ? "rtl" : "ltr", marginRight: 70 * k }}>{bidi(title)}</div>
      </div>
      <div style={{ padding: pad * k, direction: "rtl", display: "flex", flexDirection: "column", gap: 22 * k }}>{children}</div>
    </div>
  );
};
