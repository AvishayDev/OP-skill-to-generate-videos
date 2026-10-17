// Punch-ins: a viewfinder on the speaker; on "zooms" the frame punches in to 1.3 with a selection box and a
// "×1.3" tag; on "point" the word POINT. slams in red with a shake.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";

type ShotProps = any;

export const Punch = ({ frames, cue, c, face, body, ui }: ShotProps) => {
  const { Pop, Push } = ui;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = spring({ frame: frame - cue.zoom, fps, config: { stiffness: 300, damping: 20 } });
  const zoom = frame < cue.zoom ? 1 : interpolate(z, [0, 1], [1, 1.3]);
  const box = interpolate(z, [0, 1], [1, 0.77]);
  return (
    <AbsoluteFill style={{ backgroundColor: c.cream }}>
      <Push frames={frames} zoom={1.03} hits={[cue.zoom, cue.point]} shake={20}>
        <div style={{ position: "absolute", left: 90, top: 300, width: 900, height: 1000, borderRadius: 30, overflow: "hidden", background: "linear-gradient(180deg,#9fb3ff,#2B50FF)" }}>
          <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 38%" }}>
            <div style={{ position: "absolute", left: 450 - 140, top: 220, width: 280, height: 280, borderRadius: "50%", background: "#E8B48A" }} />
            <div style={{ position: "absolute", left: 450 - 50, top: 360, width: 100, height: 26, borderRadius: 13, background: "#7a3b22" }} />
            <div style={{ position: "absolute", left: 450 - 300, top: 520, width: 600, height: 600, borderRadius: "280px 280px 0 0", background: c.black }} />
          </div>
        </div>
        {frame >= cue.zoom ? (
          <div style={{ position: "absolute", left: 540 - 450 * box, top: 800 - 500 * box, width: 900 * box, height: 1000 * box, border: `8px solid ${c.accent}`, borderRadius: 8 }}>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => (
              <div key={`${sx}${sy}`} style={{ position: "absolute", left: sx < 0 ? -18 : undefined, right: sx > 0 ? -18 : undefined, top: sy < 0 ? -18 : undefined, bottom: sy > 0 ? -18 : undefined, width: 28, height: 28, background: c.paper, border: `6px solid ${c.accent}` }} />
            ))}
          </div>
        ) : null}
        <Pop at={cue.zoom + 4} from="left" x={250} y={250}>
          <div style={{ background: c.accent, color: c.paper, fontFamily: body, fontWeight: 900, fontSize: 56, padding: "10px 26px", borderRadius: 14 }}>ZOOM ×1.3</div>
        </Pop>
        <Pop at={cue.point} from="scale" feel="bouncy" x={540} y={1400} rot={-5}>
          <div style={{ fontFamily: face, fontSize: 190, color: c.yellow, WebkitTextStroke: `10px ${c.black}`, paintOrder: "stroke fill" }}>POINT.</div>
        </Pop>
      </Push>
    </AbsoluteFill>
  );
};
