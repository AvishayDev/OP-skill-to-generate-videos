// A small friendly robot head (rounded square, antenna, two eyes that blink and glance) standing for an AI agent.
// Use several side by side for "agents", one for "the bot answered". Size in 1080 units.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "reelkit/frame";

export const Bot: React.FC<{ size?: number; body: string; eye: string; seed?: number }> = ({ size = 160, body, eye, seed = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const s = size * k;
  const blink = (frame + seed * 17) % 52 < 3 ? 0.15 : 1;
  const look = Math.sin((frame + seed * 11) / 14) * s * 0.05;
  return (
    <div style={{ position: "relative", width: s, height: s * 1.18 }}>
      <div style={{ position: "absolute", left: "50%", top: 0, width: s * 0.06, height: s * 0.2, background: body, transform: "translateX(-50%)" }} />
      <div style={{ position: "absolute", left: "50%", top: -s * 0.05, width: s * 0.16, height: s * 0.16, borderRadius: "50%", background: eye, border: `${s * 0.03}px solid ${body}`, transform: "translateX(-50%)" }} />
      <div style={{ position: "absolute", left: 0, top: s * 0.18, width: s, height: s, borderRadius: s * 0.26, background: body, display: "flex", alignItems: "center", justifyContent: "center", gap: s * 0.18 }}>
        {[0, 1].map((i) => <div key={i} style={{ width: s * 0.17, height: s * 0.26 * blink, borderRadius: s * 0.1, background: eye, transform: `translateX(${look}px)` }} />)}
      </div>
    </div>
  );
};
