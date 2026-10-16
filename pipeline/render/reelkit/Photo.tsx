// A prepared picture as an element: a framed photo (cover-fit in a w×h box, optional white border, shadow and tilt)
// or, with fit "contain" and no frame, a cut-out / logo / engraving sitting straight on the paper. The picture's colour
// treatment (black and white, duotone) was applied when it was prepared, so every photo of the film shares the concept.
import React from "react";
import { Img, useCurrentFrame, useVideoConfig, interpolate } from "reelkit/frame";

export const Photo: React.FC<{
  src: string;
  w: number;
  h: number;
  fit?: "cover" | "contain";
  frame?: string | null;
  radius?: number;
  shadow?: boolean;
  // Slow push-in over the shot, 0 for none (1.06 = 6%).
  drift?: number;
  // Which part of the picture to keep in a cover crop, CSS object-position ("50% 30%").
  focus?: string;
}> = ({ src, w, h, fit = "cover", frame: border = null, radius = 0, shadow = true, drift = 1.04, focus = "50% 50%" }) => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const z = interpolate(f, [0, Math.max(1, durationInFrames)], [1, drift], { extrapolateRight: "clamp" });
  const pad = border ? 14 * k : 0;
  return (
    <div style={{ width: w * k + 2 * pad, height: h * k + 2 * pad, padding: pad, boxSizing: "border-box", background: border ?? "transparent", borderRadius: radius * k, boxShadow: shadow && border ? `0 ${18 * k}px ${40 * k}px rgba(0,0,0,0.22)` : undefined, filter: shadow && !border ? `drop-shadow(0 ${14 * k}px ${22 * k}px rgba(0,0,0,0.25))` : undefined }}>
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: Math.max(0, radius - 6) * k }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: focus, transform: `scale(${z})`, display: "block" }} />
      </div>
    </div>
  );
};
