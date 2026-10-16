// One line of heavy type with a soft coloured glow and no box: the headline look of the film. Hebrew (or mixed
// Hebrew/Latin) reads right to left with every Latin or number run isolated left to right, so "OpenAI" or "3.6 GW"
// keep their order. Use it for titles, subtitles and labels over footage. It never wraps: it shrinks to stay inside
// 90% of the width.
import React from "react";
import { useVideoConfig } from "reelkit/frame";

// Right-to-left scripts: Hebrew, Arabic, Persian, Urdu.
const HEBREW = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
// A Latin/number run: starts and ends with a letter or digit, may hold spaces, dots, signs between.
const LATIN_RUN = /[A-Za-z0-9$€£%+×][A-Za-z0-9$€£%+×.,:'’\-/ ]*[A-Za-z0-9$€£%+×]|[A-Za-z0-9$€£%+×]/g;

export const GlowText: React.FC<{
  text: string;
  // Fill colour of the letters.
  ink: string;
  // Colour of the soft halo around them.
  glow: string;
  face: string;
  // Font size in pixels for a 1080-wide frame.
  size?: number;
  weight?: number;
  // 0 to 1: how strong the halo is (1 for a headline, about 0.5 for a secondary line).
  strength?: number;
}> = ({ text, ink, glow, face, size = 100, weight = 900, strength = 1 }) => {
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const fit = Math.min(1, (width * 0.9) / Math.max(1, text.length * size * 0.58 * k));
  const a = (o: number) => `${glow}${Math.round(Math.min(1, o * strength) * 255).toString(16).padStart(2, "0")}`;
  const style: React.CSSProperties = {
    whiteSpace: "nowrap",
    fontFamily: face,
    fontWeight: weight,
    fontSize: size * k * fit,
    lineHeight: 1.05,
    letterSpacing: 0,
    color: ink,
    textShadow: `0 0 ${10 * k}px ${a(0.9)}, 0 0 ${28 * k}px ${a(0.7)}, 0 0 ${60 * k}px ${a(0.45)}, 0 ${4 * k}px ${14 * k}px rgba(0,0,0,0.55)`,
  };
  if (!HEBREW.test(text)) return <div style={{ ...style, direction: "ltr" }}>{text}</div>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LATIN_RUN)) {
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(<bdi key={at} dir="ltr" style={{ unicodeBidi: "isolate" }}>{m[0]}</bdi>);
    last = at + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <div style={{ ...style, direction: "rtl" }}>{parts}</div>;
};
