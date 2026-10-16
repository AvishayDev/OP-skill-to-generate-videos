// Brings one overlay in and out over footage: fade + rise + scale on a spring, with a
// direction taken from a Shotstack-style transition name (fade, zoom, slideLeft…, optional Fast/Slow).
// Use it around any logo, number or title that must land on a spoken word and leave before the next one.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";
import { ease, springs } from "reelkit/kit";

export type PopTransition = string;

// Where an element starts (or ends) relative to its place, as fractions of the frame width.
// Slides stay short and inside the frame, so a Hebrew word never enters cut by the edge.
const offsets = (name: string): { x: number; y: number; scale: number } => {
  const base = name.replace(/(Fast|Slow)$/, "");
  if (base === "zoom") return { x: 0, y: 0, scale: 1.22 };
  if (base === "slideLeft" || base === "carouselLeft" || base === "wipeLeft") return { x: 0.07, y: 0, scale: 0.96 };
  if (base === "slideRight" || base === "carouselRight" || base === "wipeRight") return { x: -0.07, y: 0, scale: 0.96 };
  if (base === "slideUp" || base === "carouselUp") return { x: 0, y: 0.05, scale: 0.96 };
  if (base === "slideDown" || base === "carouselDown") return { x: 0, y: -0.05, scale: 0.96 };
  if (base === "none") return { x: 0, y: 0, scale: 1 };
  return { x: 0, y: 0.03, scale: 0.94 }; // fade, reveal, shuffle…: a short rise
};
const speed = (name: string) => (name.endsWith("Fast") ? 0.6 : name.endsWith("Slow") ? 1.6 : 1);

export const PopMotion: React.FC<{
  // Frames the element is on screen (its Sequence length).
  frames: number;
  enter?: PopTransition;
  exit?: PopTransition;
  // Centre of the element, as fractions of the frame.
  x: number;
  y: number;
  children: React.ReactNode;
}> = ({ frames, enter = "fade", exit = "fade", x, y, children }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const a = offsets(enter);
  const b = offsets(exit);
  const p = enter === "none" ? 1 : spring({ frame, fps, config: springs.snappy, durationInFrames: Math.round(14 * speed(enter)) });
  const outFrames = Math.max(4, Math.round(9 * speed(exit)));
  const q = exit === "none" ? 0 : interpolate(frame, [frames - outFrames, frames], [0, 1], { easing: ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dx = (a.x * (1 - p) + b.x * q) * width;
  const dy = (a.y * (1 - p) + b.y * q) * width;
  const scale = interpolate(p, [0, 1], [a.scale, 1]) * interpolate(q, [0, 1], [1, b.scale]);
  const opacity = Math.min(1, p * 1.6) * (1 - q);
  return (
    <div
      style={{
        position: "absolute",
        left: x * width,
        top: y * height,
        transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </div>
  );
};
