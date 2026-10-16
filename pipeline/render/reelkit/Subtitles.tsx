// Word-timed Hebrew captions in the concept's colours: a few words at a time (groups decided by the pipeline from the
// real word timings), dark ink straight on the ground, the word being spoken on an accent chip. No dark plate unless
// asked for (a plate is for a concept whose shots are busy photos). Groups enter with a short rise, never a mask.
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

export type CaptionGroup = { from: number; to: number; words: { w: string; f: number }[] };

export const Subtitles: React.FC<{
  groups: CaptionGroup[];
  ink: string;
  chip: string;
  chipInk: string;
  face: string;
  // Font size in 1080 units and baseline distance from the bottom (fraction of the height).
  size?: number;
  bottom?: number;
  plate?: string | null;
  halo?: string | null;
}> = ({ groups, ink, chip, chipInk, face, size = 64, bottom = 0.2, plate = null, halo = null }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const g = groups.find((x) => frame >= x.from && frame < x.to);
  if (!g) return null;
  const rise = interpolate(frame - g.from, [0, 4], [14 * k, 0], { extrapolateRight: "clamp" });
  const active = g.words.reduce((a, w, i) => (frame >= w.f ? i : a), -1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: height * bottom, display: "flex", justifyContent: "center", transform: `translateY(${rise}px)` }}>
      <div style={{ direction: isRtl(g.words.map((w) => w.w).join(" ")) ? "rtl" : "ltr", whiteSpace: "nowrap", fontFamily: face, fontWeight: 800, fontSize: size * k, lineHeight: 1.4, color: ink, background: plate ?? undefined, borderRadius: 18 * k, padding: plate ? `${4 * k}px ${22 * k}px` : 0, textShadow: halo ? `0 0 ${10 * k}px ${halo}, 0 0 ${4 * k}px ${halo}` : undefined }}>
        {g.words.map((w, i) => (
          <React.Fragment key={i}>
            <span style={{ borderRadius: 10 * k, padding: `0 ${10 * k}px`, ...(i === active ? { background: chip, color: chipInk, textShadow: "none" } : {}) }}>{bidi(w.w)}</span>
            {i < g.words.length - 1 ? " " : ""}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
