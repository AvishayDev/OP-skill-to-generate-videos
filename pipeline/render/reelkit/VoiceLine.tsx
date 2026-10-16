// The film's thread: a live waveform line across the frame that moves with the narrator's voice (its loudness per
// frame, measured from the voiceover). Flat in the silences, lively on stressed words. Drawn as an accent line with a
// dark outline so it reads on paper and on pictures. It runs under the captions through every shot.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "reelkit/frame";

export const VoiceLine: React.FC<{
  // Voice level per frame of the film, 0..1.
  levels: number[];
  // Vertical position of the line, as a fraction of the height.
  y?: number;
  color: string;
  outline?: string;
  // Peak height in 1080 units.
  amp?: number;
  // Width of the line as a fraction of the frame width.
  span?: number;
  stroke?: number;
}> = ({ levels, y = 0.69, color, outline = "#111", amp = 70, span = 0.92, stroke = 5 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const N = 140;
  const lv = (f: number) => levels[Math.max(0, Math.min(levels.length - 1, f))] ?? 0;
  const x0 = (width * (1 - span)) / 2;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const fromMid = Math.abs(u - 0.5) * 2; // 0 in the middle, 1 at the ends
    const lag = Math.round(fromMid * 10);
    const env = lv(frame - lag) * Math.pow(1 - fromMid, 1.4);
    const wave = Math.sin(u * 46 + frame * 0.9) * 0.62 + Math.sin(u * 97 - frame * 1.3) * 0.38;
    pts.push(`${(x0 + u * width * span).toFixed(1)},${(wave * env * amp * k).toFixed(1)}`);
  }
  const d = `M${pts.join(" L")}`;
  return (
    <svg width={width} height={amp * 2.4 * k} style={{ position: "absolute", left: 0, top: height * y - amp * 1.2 * k, overflow: "visible" }} viewBox={`0 ${-amp * 1.2 * k} ${width} ${amp * 2.4 * k}`}>
      <path d={d} fill="none" stroke={outline} strokeWidth={(stroke + 5) * k} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={stroke * k} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};
