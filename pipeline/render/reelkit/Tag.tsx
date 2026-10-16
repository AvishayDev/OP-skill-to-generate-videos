// A small pill label (a name, a source, "AI · קול", "חדש"): accent fill with dark ink, or any pair of colours.
// Use it on a corner of a photo or a selection box to say what the viewer is looking at.
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

export const Tag: React.FC<{ text: string; bg: string; ink: string; face: string; size?: number; dot?: string; border?: string }> = ({ text, bg, ink, face, size = 34, dot, border }) => {
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3 * k, whiteSpace: "nowrap", direction: isRtl(text) ? "rtl" : "ltr", background: bg, color: ink, fontFamily: face, fontWeight: 800, fontSize: size * k, lineHeight: 1, padding: `${size * 0.28 * k}px ${size * 0.5 * k}px`, borderRadius: size * 0.3 * k, border: border ? `${3 * k}px solid ${border}` : undefined }}>
      {dot ? <span style={{ width: size * 0.36 * k, height: size * 0.36 * k, borderRadius: "50%", background: dot, display: "inline-block" }} /> : null}
      <span>{bidi(text)}</span>
    </div>
  );
};
