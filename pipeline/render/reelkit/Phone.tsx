// A phone silhouette (dark bezel, rounded screen, a small camera notch) holding any screen content as children.
// Use it when the story happens on a phone: a call, a notification, an app. Size in 1080 units.
import React from "react";
import { useVideoConfig } from "reelkit/frame";

export const Phone: React.FC<{ w?: number; h?: number; body?: string; screen?: string; children?: React.ReactNode }> = ({ w = 520, h = 1060, body = "#111", screen = "#fff", children }) => {
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const b = 18 * k;
  return (
    <div style={{ width: w * k, height: h * k, background: body, borderRadius: 74 * k, padding: b, boxSizing: "border-box", boxShadow: `0 ${30 * k}px ${60 * k}px rgba(0,0,0,0.28)` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", background: screen, borderRadius: 58 * k, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "absolute", top: 22 * k, left: "50%", transform: "translateX(-50%)", width: 150 * k, height: 40 * k, borderRadius: 20 * k, background: body, zIndex: 2 }} />
        {children}
      </div>
    </div>
  );
};
