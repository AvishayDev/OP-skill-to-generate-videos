// One raw clip in: kinetic words on yellow; a clip strip with a waveform lands on "clip", then its silent gap turns
// red, is cut, and the two halves close up on "pause".
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";

type ShotProps = any;

const BARS = 34;
const GAP = [15, 21]; // the silent stretch
const amp = (i: number) => (i >= GAP[0] && i < GAP[1] ? 0.06 : 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));

export const CutClip = ({ words, frames, cue, c, face, ui }: ShotProps) => {
  const { KineticLine, Push, Pop } = ui;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cut = spring({ frame: frame - cue.pause, fps, config: { stiffness: 260, damping: 20 } });
  const cutOn = frame >= cue.pause;
  const gapW = 6 * 22; // px of the gap in 1080 units
  return (
    <AbsoluteFill style={{ backgroundColor: c.yellow }}>
      <Push frames={frames} hits={[cue.clip, cue.pause]} zoom={1.06}>
        <KineticLine words={words} face={face} ink={c.black} accent={c.accent} emphasis={["clip", "pause"]} y={560} maxSize={260} />
        <Pop at={cue.clip} from="rise" x={540} y={1240} dist={160}>
          <div style={{ width: 900, height: 280, borderRadius: 36, background: c.black, display: "flex", alignItems: "center", justifyContent: "center", gap: 0, position: "relative" }}>
            {Array.from({ length: BARS }, (_, i) => {
              const inGap = i >= GAP[0] && i < GAP[1];
              const shift = cutOn && !inGap ? (i < GAP[0] ? 1 : -1) * (gapW / 2) * cut : 0;
              const fade = cutOn && inGap ? 1 - cut : 1;
              return (
                <div key={i} style={{ width: 14, margin: "0 4px", height: 200 * amp(i), borderRadius: 7, opacity: fade,
                  background: inGap ? c.accent : c.cream, transform: `translateX(${shift}px) scaleX(${inGap ? interpolate(fade, [0, 1], [0, 1]) : 1})` }} />
              );
            })}
            {frame >= cue.pause - 6 && frame < cue.pause + 6 ? (
              <div style={{ position: "absolute", left: 450 - 3, top: -40, width: 6, height: 360, background: c.accent, borderRadius: 3 }} />
            ) : null}
          </div>
        </Pop>
      </Push>
    </AbsoluteFill>
  );
};
