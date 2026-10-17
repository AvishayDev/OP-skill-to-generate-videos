// Kinetic typography (the CapCut Video Studio skill's style 2): the spoken words themselves, 1–2 huge words at a
// time, each landing on the frame it is said. Every word sits on its own line, sized to fill the width; emphasised
// words slam in from 1.25× in the accent colour, the rest rise whole (safe for Hebrew: no masks). `chunkAt` tells a shot which group is on screen (e.g. to
// hard-cut its background on every new group). The camera that goes with it is Push.tsx.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";

type Word = { word: string; f: number; end: number };

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

// Words → groups of at most `group` words; a sentence or clause end closes a group.
export const chunkWords = (words: Word[], group = 2): Word[][] => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= group || /[.!?,;:…]$/.test(w.word)) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
};

// Index of the group on screen at `frame` (-1 before the first word).
export const chunkAt = (words: Word[], frame: number, group = 2): number => {
  const chunks = chunkWords(words, group);
  let i = -1;
  chunks.forEach((c, k) => { if (c[0].f <= frame) i = k; });
  return i;
};

export const KineticLine: React.FC<{
  words: Word[];
  face: string;
  ink: string;
  accent: string;
  // Words (any case/punctuation) that slam in the accent colour.
  emphasis?: string[];
  group?: number;
  // Centre of the block and the width the words fill, in 1080 units.
  x?: number;
  y?: number;
  width?: number;
  maxSize?: number;
  // Average glyph width / font size for the face (0.68 suits heavy grotesques like Archivo Black).
  glyph?: number;
  upper?: boolean;
  // Last frame the line is drawn (default: to the end of the shot).
  until?: number;
}> = ({ words, face, ink, accent, emphasis = [], group = 2, x = 540, y = 760, width = 860, maxSize = 330, glyph = 0.68, upper = true, until }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const k = Math.min(W, H) / 1080;
  if (until !== undefined && frame >= until) return null;
  const chunks = chunkWords(words, group);
  const i = chunkAt(words, frame, group);
  if (i < 0) return null;
  const hot = new Set(emphasis.map(norm));
  const lines = chunks[i].map((w) => {
    const text = (upper ? w.word.toUpperCase() : w.word).replace(/[,;:]$/, "");
    const size = Math.min(maxSize, width / (Math.max(2, [...text].length) * glyph));
    return { w, text, size, hot: hot.has(norm(w.word)) };
  });
  const lead = 0.92;
  const total = lines.reduce((a, l) => a + l.size * lead, 0);
  let top = y - total / 2;
  return (
    <>
      {lines.map(({ w, text, size, hot: isHot }) => {
        const yTop = top;
        top += size * lead;
        if (frame < w.f) return null;
        const p = spring({ frame: frame - w.f, fps, config: isHot ? { stiffness: 420, damping: 18 } : { stiffness: 300, damping: 24 } });
        const scale = isHot ? interpolate(p, [0, 1], [1.25, 1]) : interpolate(p, [0, 1], [0.92, 1]);
        const rise = isHot ? 0 : (1 - p) * 60;
        const opacity = Math.min(1, (frame - w.f + 1) / 3);
        return (
          <div key={`${w.f}-${text}`} style={{
            position: "absolute", left: (x - width / 2) * k, width: width * k, top: (yTop + rise) * k, height: size * lead * k,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: face, fontSize: size * k, lineHeight: 1, letterSpacing: -0.01 * size * k, whiteSpace: "nowrap",
            color: isHot ? accent : ink, opacity, transform: `scale(${scale})`,
          }}>
            {text}
          </div>
        );
      })}
    </>
  );
};
