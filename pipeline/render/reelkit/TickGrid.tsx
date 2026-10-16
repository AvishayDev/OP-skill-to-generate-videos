// A grid of identical items (people, phones, files, calls) where items get a check or a cross one by one on given
// frames — "70 of 100", "8 out of 10". Items are drawn as rounded tiles holding an optional picture or icon.
import React from "react";
import { Img, useCurrentFrame, useVideoConfig, spring } from "reelkit/frame";

export const TickGrid: React.FC<{
  n: number;
  cols: number;
  cell?: number;
  gap?: number;
  // Frame at which item i gets its mark (undefined = never). Marks run in reading order (from the right).
  marks: (number | undefined)[];
  kind?: "check" | "cross";
  tile: string;
  ink: string;
  mark: string;
  markInk: string;
  src?: string;
  icon?: React.ReactNode;
  // Items after this frame fade to 25% unless marked (to make the marked ones stand out).
  dimAt?: number;
}> = ({ n, cols, cell = 120, gap = 22, marks, kind = "check", tile, ink, mark, markInk, src, icon, dimAt }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell * k}px)`, gap: gap * k, direction: "rtl" }}>
      {Array.from({ length: n }, (_, i) => {
        const at = marks[i];
        const on = at !== undefined && frame >= at;
        const p = on ? spring({ frame: frame - (at as number), fps, config: { stiffness: 300, damping: 15 } }) : 0;
        const dim = dimAt !== undefined && frame >= dimAt && !on ? 0.25 : 1;
        return (
          <div key={i} style={{ position: "relative", width: cell * k, height: cell * k, borderRadius: cell * 0.22 * k, background: tile, opacity: dim, display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
            {src ? <Img src={src} style={{ width: "78%", height: "78%", objectFit: "contain" }} /> : icon ?? <div style={{ width: "36%", height: "36%", borderRadius: "50%", background: ink, opacity: 0.8 }} />}
            {on ? (
              <div style={{ position: "absolute", right: -cell * 0.1 * k, bottom: -cell * 0.1 * k, width: cell * 0.46 * k, height: cell * 0.46 * k, borderRadius: "50%", background: mark, color: markInk, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})`, fontWeight: 900, fontSize: cell * 0.3 * k, fontFamily: "sans-serif", border: `${3 * k}px solid ${ink}` }}>
                {kind === "check" ? "✓" : "✕"}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
