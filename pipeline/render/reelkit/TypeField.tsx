// An input field that types its text in reading order from its cue, with a blinking caret at the end of what is
// typed (the left end, for Hebrew). `mask` shows dots instead of letters (a password, a code word). Use it for
// a search, a prompt, a URL or anything the viewer should watch being written.
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

export const TypeField: React.FC<{
  text: string;
  at: number;
  // Characters per second.
  cps?: number;
  w: number;
  bg?: string;
  ink: string;
  caret: string;
  face: string;
  size?: number;
  label?: string;
  mask?: boolean;
  icon?: React.ReactNode;
}> = ({ text, at, cps = 16, w, bg = "#fff", ink, caret, face, size = 46, label, mask = false, icon }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - at) / fps) * cps)));
  const shown = mask ? "•".repeat(n) : text.slice(0, n);
  const blink = Math.floor(frame / 8) % 2 === 0 || (n > 0 && n < text.length);
  const rtl = isRtl(text);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 * k, fontFamily: face, direction: rtl ? "rtl" : "ltr" }}>
      {label ? <div style={{ fontSize: size * 0.6 * k, fontWeight: 700, color: ink, whiteSpace: "nowrap" }}>{bidi(label)}</div> : null}
      <div style={{ width: w * k, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 16 * k, background: bg, border: `${4 * k}px solid ${ink}`, borderRadius: 22 * k, padding: `${20 * k}px ${28 * k}px`, fontSize: size * k, fontWeight: 700, color: ink, whiteSpace: "nowrap", overflow: "hidden" }}>
        {icon ?? null}
        <span>{bidi(shown)}</span>
        <span style={{ width: 5 * k, height: size * 1.1 * k, background: caret, opacity: blink ? 1 : 0, marginInlineStart: -8 * k }} />
      </div>
    </div>
  );
};
