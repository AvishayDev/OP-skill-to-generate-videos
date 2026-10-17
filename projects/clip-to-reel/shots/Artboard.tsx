// Captions + logos in a design tool: rulers and a dot grid; caption chips land one per spoken word, the current
// one inside a selection box with handles and a "LOCKED" size label; on "Logos" / "pop" three app-logo tiles pop in.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";

type ShotProps = any;
type W = { word: string; f: number; end: number };

export const Artboard = ({ frames, cue, words, c, face, body, ui }: ShotProps) => {
  const { Pop, Push } = ui;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const caps = (words as W[]).filter((w) => w.f < cue.logos);
  const cur = [...caps].reverse().find((w) => w.f <= frame);
  const tiles = [
    { bg: c.accent, glyph: "▶", x: 250 },
    { bg: c.blue, glyph: "♪", x: 540 },
    { bg: c.black, glyph: "✦", x: 830 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#E9E9EE", backgroundImage: "radial-gradient(#c5c5d0 2.4px, transparent 2.6px)", backgroundSize: "40px 40px" }}>
      <Push frames={frames} zoom={1.05} hits={[cue.logos, cue.pop]}>
        {/* rulers */}
        <div style={{ position: "absolute", left: 0, top: 150, width: 1080, height: 44, background: "#fff", borderBottom: "2px solid #d0d0da" }}>
          {Array.from({ length: 28 }, (_, i) => <div key={i} style={{ position: "absolute", left: i * 40, bottom: 0, width: 2, height: i % 5 ? 12 : 26, background: "#9a9aa8" }} />)}
        </div>
        <div style={{ position: "absolute", left: 60, top: 230, fontFamily: body, fontWeight: 800, fontSize: 32, color: "#6a6a78" }}>Frame 1 · 1080 × 1920</div>
        {/* the caption chips, one per word */}
        <div style={{ position: "absolute", left: 60, right: 60, top: 330, display: "flex", flexWrap: "wrap", gap: 22, justifyContent: "center" }}>
          {caps.filter((w) => w.f <= frame).map((w) => {
            const p = spring({ frame: frame - w.f, fps, config: { stiffness: 380, damping: 18 } });
            const on = cur === w;
            return (
              <div key={w.f} style={{ position: "relative", fontFamily: face, fontSize: 92, padding: "8px 26px", borderRadius: 18, background: on ? c.yellow : c.paper, color: c.black,
                boxShadow: "0 8px 0 rgba(0,0,0,.12)", transform: `scale(${interpolate(p, [0, 1], [1.3, 1])})` }}>
                {w.word.replace(/[.,]$/, "").toUpperCase()}
                {on ? (
                  <div style={{ position: "absolute", inset: -14, border: `5px solid ${c.blue}` }}>
                    {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([sx, sy]) => <div key={`${sx}${sy}`} style={{ position: "absolute", left: sx ? undefined : -12, right: sx ? -12 : undefined, top: sy ? undefined : -12, bottom: sy ? -12 : undefined, width: 20, height: 20, background: "#fff", border: `4px solid ${c.blue}` }} />)}
                    <div style={{ position: "absolute", left: "50%", bottom: -62, transform: "translateX(-50%)", background: c.blue, color: "#fff", fontFamily: body, fontWeight: 800, fontSize: 24, padding: "4px 12px", borderRadius: 8, whiteSpace: "nowrap" }}>🔒 LOCKED · {(w.f / fps).toFixed(2)}s</div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {/* logo tiles */}
        {tiles.map((t, i) => (
          <Pop key={i} at={i === 0 ? cue.logos : cue.pop + (i - 1) * 4} from="scale" feel="bouncy" x={t.x} y={1130}>
            <div style={{ width: 210, height: 210, borderRadius: 52, background: t.bg, color: "#fff", fontSize: 110, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 30px rgba(0,0,0,.18)",
              transform: `translateY(${frame >= cue.pop ? -Math.abs(Math.sin((frame - cue.pop - i * 4) / 4)) * 40 * Math.exp(-(frame - cue.pop) / 14) : 0}px)` }}>{t.glyph}</div>
          </Pop>
        ))}
      </Push>
    </AbsoluteFill>
  );
};
