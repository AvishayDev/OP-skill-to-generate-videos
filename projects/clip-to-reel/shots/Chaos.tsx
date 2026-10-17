// The pain. Part 1: a camera viewfinder (REC dot, timecode, corner brackets, a person) and a check on "clip".
// Part 2 (on the cue "editor"): a dark timeline UI piles up clips, a clock spins to 2 HOURS on "hours", then on
// "disappeared" every clip drops off the bottom of the frame.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";

type ShotProps = any;

const TRACKS = 5;
const CLIPS = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => Math.abs(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1;
  return { track: i % TRACKS, x: 40 + r(1) * 860, w: 70 + r(2) * 170, at: Math.floor(i * 1.15), hue: [0, 1, 2, 3][Math.floor(r(3) * 4)], fall: 0.6 + r(4) * 0.8, spin: (r(5) - 0.5) * 50 };
});

export const Chaos = ({ frames, cue, c, face, body, ui }: ShotProps) => {
  const { Pop, Push, Stamp } = ui;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < cue.editor) {
    const sec = frame / fps;
    const tc = `00:00:${String(Math.floor(sec)).padStart(2, "0")}:${String(frame % fps).padStart(2, "0")}`;
    const bracket = (x: number, y: number, sx: number, sy: number) => (
      <div style={{ position: "absolute", left: x, top: y, width: 90, height: 90, borderLeft: sx > 0 ? `8px solid ${c.cream}` : undefined, borderRight: sx < 0 ? `8px solid ${c.cream}` : undefined, borderTop: sy > 0 ? `8px solid ${c.cream}` : undefined, borderBottom: sy < 0 ? `8px solid ${c.cream}` : undefined }} />
    );
    return (
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #3a3f52 0%, #16161C 75%)" }}>
        <Push frames={cue.editor} zoom={1.05} hits={[cue.clip]}>
          {/* the person being filmed */}
          <div style={{ position: "absolute", left: 540 - 130, top: 470, width: 260, height: 260, borderRadius: "50%", background: "#E8B48A" }} />
          <div style={{ position: "absolute", left: 540 - 280, top: 760, width: 560, height: 700, borderRadius: "260px 260px 40px 40px", background: c.blue }} />
          {bracket(110, 260, 1, 1)}{bracket(880, 260, -1, 1)}{bracket(110, 1290, 1, -1)}{bracket(880, 1290, -1, -1)}
          <div style={{ position: "absolute", left: 140, top: 170, display: "flex", alignItems: "center", gap: 18, fontFamily: body, fontWeight: 800, fontSize: 46, color: c.cream }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: c.accent, opacity: Math.floor(frame / 12) % 2 ? 0.25 : 1 }} />
            REC
          </div>
          <div style={{ position: "absolute", right: 140, top: 172, fontFamily: body, fontWeight: 700, fontSize: 42, color: c.cream, fontVariantNumeric: "tabular-nums" }}>{tc}</div>
          <Pop at={cue.clip} from="scale" feel="bouncy" x={540} y={1150}>
            <div style={{ background: c.green, color: c.black, fontFamily: face, fontSize: 84, padding: "18px 44px", borderRadius: 24, transform: "rotate(-3deg)" }}>GREAT CLIP ✓</div>
          </Pop>
        </Push>
      </AbsoluteFill>
    );
  }
  // Part 2: the timeline.
  const f = frame - cue.editor;
  const gone = frame >= cue.gone ? frame - cue.gone : -1;
  const hues = [c.blue, c.accent, c.yellow, c.green];
  const hoursP = spring({ frame: frame - cue.hours, fps, config: { stiffness: 380, damping: 16 } });
  const spinTurns = interpolate(frame, [cue.editor, cue.hours], [0, 24], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: c.night }}>
      <Push frames={frames - cue.editor} zoom={1.06} hits={[cue.hours, cue.gone]} shake={18}>
        {/* the window chrome */}
        <div style={{ position: "absolute", left: 40, top: 210, width: 1000, height: 1150, borderRadius: 28, background: c.slate, border: "3px solid #3a3a46" }} />
        <div style={{ position: "absolute", left: 80, top: 240, display: "flex", gap: 14 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((col) => <div key={col} style={{ width: 22, height: 22, borderRadius: "50%", background: col }} />)}
        </div>
        <div style={{ position: "absolute", left: 80, top: 300, fontFamily: body, fontWeight: 700, fontSize: 34, color: "#9a9aa8" }}>my_reel_FINAL_v7.proj</div>
        {/* the clock */}
        <div style={{ position: "absolute", left: 540 - 150, top: 380, width: 300, height: 300, borderRadius: "50%", border: `14px solid ${frame >= cue.hours ? c.accent : c.cream}`, background: c.night }}>
          <div style={{ position: "absolute", left: 136, top: 40, width: 0, height: 0 }} />
          <div style={{ position: "absolute", left: 137, top: 40, width: 12, height: 110, background: c.cream, borderRadius: 6, transformOrigin: "50% 100%", transform: `rotate(${spinTurns * 360}deg)` }} />
          <div style={{ position: "absolute", left: 137, top: 76, width: 12, height: 74, background: c.accent, borderRadius: 6, transformOrigin: "50% 100%", transform: `rotate(${spinTurns * 30}deg)` }} />
        </div>
        {/* tracks + clips */}
        {Array.from({ length: TRACKS }, (_, t) => (
          <div key={t} style={{ position: "absolute", left: 70, top: 760 + t * 100, width: 940, height: 82, borderRadius: 10, background: "#1e1e26" }} />
        ))}
        {CLIPS.filter((k) => f >= k.at).map((k, i) => {
          const p = spring({ frame: f - k.at, fps, config: { stiffness: 400, damping: 22 } });
          const drop = gone < 0 ? 0 : gone * gone * 2.2 * k.fall;
          return <div key={i} style={{ position: "absolute", left: 70 + k.x * 0.92, top: 768 + k.track * 100 + drop, width: k.w * p, height: 66, borderRadius: 10, background: hues[k.hue], opacity: 0.92, transform: `rotate(${gone < 0 ? 0 : k.spin * Math.min(1, gone / 12)}deg)` }} />;
        })}
        {/* the playhead */}
        <div style={{ position: "absolute", left: 80 + ((f * 23) % 900), top: 740, width: 6, height: 520, background: c.accent, opacity: gone < 0 ? 1 : 0 }} />
        {frame >= cue.hours ? (
          <div style={{ position: "absolute", left: 0, width: 1080, top: 640, textAlign: "center", fontFamily: face, fontSize: 158, color: c.yellow, transform: `scale(${interpolate(hoursP, [0, 1], [1.3, 1])}) rotate(-4deg)`, textShadow: "0 10px 0 rgba(0,0,0,.45)" }}>2 HOURS</div>
        ) : null}
      </Push>
    </AbsoluteFill>
  );
};
