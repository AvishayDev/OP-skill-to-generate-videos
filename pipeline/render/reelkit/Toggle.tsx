// A settings switch that flips on at its cue (knob slides, track fills with the on colour). Pair it with a label in
// a settings row: "בקרת הורים", "מצב פרטי". Switches slide left to right like every phone's.
import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "reelkit/frame";

export const Toggle: React.FC<{ at: number; on: string; off?: string; knob?: string; w?: number }> = ({ at, on, off = "#cfcac0", knob = "#fff", w = 120 }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const p = frame < at ? 0 : spring({ frame: frame - at, fps, config: { stiffness: 300, damping: 20 } });
  const h = w * 0.58;
  return (
    <div style={{ direction: "ltr", position: "relative", width: w * k, height: h * k, borderRadius: h * k, background: p > 0.5 ? on : off, transition: "none", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: h * 0.08 * k, left: (h * 0.08 + (w - h) * p) * k, width: h * 0.84 * k, height: h * 0.84 * k, borderRadius: "50%", background: knob, boxShadow: `0 ${3 * k}px ${8 * k}px rgba(0,0,0,0.25)` }} />
    </div>
  );
};
