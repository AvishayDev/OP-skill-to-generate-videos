// The camera over a whole shot (kinetic typography, CapCut Video Studio style 2): a slow push with a slight turn,
// plus a decaying shake after each hit frame. Wrap a shot's content: `<Push frames={frames} hits={[cue.done]}>…</Push>`.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "reelkit/frame";

export const Push: React.FC<{ frames: number; zoom?: number; turn?: number; hits?: number[]; shake?: number; children?: React.ReactNode }> = ({ frames, zoom = 1.08, turn = 1.2, hits = [], shake = 14, children }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const k = Math.min(W, H) / 1080;
  const t = Math.min(1, frame / Math.max(1, frames));
  let dx = 0;
  let dy = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d < 0 || d > 10) continue;
    const a = shake * k * Math.exp(-d / 3);
    dx += a * Math.sin(d * 2.7 + h);
    dy += a * Math.cos(d * 3.1 + h);
  }
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px) scale(${1 + (zoom - 1) * t}) rotate(${turn * (t - 0.5)}deg)` }}>
      {children}
    </div>
  );
};
