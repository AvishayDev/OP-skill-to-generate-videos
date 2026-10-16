// A rubber stamp that slams onto the frame on its cue ("תוקן", "נתבע", "חדש"): bordered heavy word, tilted, scaling
// down from big with a short shake. Use it for a verdict or a status — once or twice a film, it is loud.
import React from "react";
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

export const Stamp: React.FC<{ text: string; at: number; color: string; face: string; size?: number; rot?: number; fill?: string }> = ({ text, at, color, face, size = 110, rot = -9, fill = "transparent" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  if (frame < at) return null;
  const t = frame - at;
  const s = interpolate(t, [0, 5], [2.3, 1], { extrapolateRight: "clamp" });
  const shake = t >= 5 && t < 11 ? Math.sin(t * 2.6) * 6 * k * (11 - t) / 6 : 0;
  return (
    <div style={{ transform: `translate(${shake}px, 0) rotate(${rot}deg) scale(${s})`, opacity: interpolate(t, [0, 2], [0.3, 0.95], { extrapolateRight: "clamp" }), border: `${10 * k}px solid ${color}`, borderRadius: 18 * k, padding: `${size * 0.08 * k}px ${size * 0.32 * k}px`, color, background: fill, fontFamily: face, fontWeight: 900, fontSize: size * k, lineHeight: 1.05, whiteSpace: "nowrap", direction: isRtl(text) ? "rtl" : "ltr" }}>
      {bidi(text)}
    </div>
  );
};
