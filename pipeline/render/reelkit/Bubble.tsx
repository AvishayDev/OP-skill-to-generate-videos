// A chat or notification bubble: optional sender line, a message, and three typing dots before it lands on its cue.
// Use it for anything that "arrives" — a message, an alert, a reply. Light (paper) or dark (ink) variant; the
// bubble's tail sits on the right, the side Hebrew conversations start from.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "reelkit/frame";

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

export const Bubble: React.FC<{
  text: string;
  at: number;
  bg: string;
  ink: string;
  face: string;
  from?: string;
  fromInk?: string;
  // Frames of typing dots shown before `at` (0 for none).
  typing?: number;
  w?: number;
  size?: number;
  icon?: React.ReactNode;
}> = ({ text, at, bg, ink, face, from, fromInk, typing = 0, w = 760, size = 44, icon }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const box: React.CSSProperties = { background: bg, color: ink, borderRadius: 34 * k, borderBottomRightRadius: 8 * k, padding: `${26 * k}px ${34 * k}px`, boxShadow: `0 ${14 * k}px ${34 * k}px rgba(0,0,0,0.18)`, fontFamily: face, direction: isRtl(text) ? "rtl" : "ltr" };
  if (frame < at - typing) return null;
  if (frame < at) {
    return (
      <div style={{ ...box, display: "inline-flex", gap: 12 * k }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 16 * k, height: 16 * k, borderRadius: "50%", background: ink, opacity: 0.3 + 0.7 * Math.max(0, Math.sin((frame / 4 - i) * 1.4)) }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ ...box, maxWidth: w * k, display: "flex", gap: 22 * k, alignItems: "center" }}>
      {icon ?? null}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 * k }}>
        {from ? <div style={{ fontSize: size * 0.62 * k, fontWeight: 700, color: fromInk ?? ink, opacity: fromInk ? 1 : 0.6, whiteSpace: "nowrap" }}>{bidi(from)}</div> : null}
        <div style={{ fontSize: size * k, fontWeight: 800, lineHeight: 1.25, whiteSpace: "nowrap" }}>{bidi(text)}</div>
      </div>
    </div>
  );
};
