// Music for phones: a phone's bottom edge with its speaker grille, live EQ bars over it. The sub bars (left of a
// "150 Hz" line) fade to grey with "phones can't play this"; on "phone" the mids glow red and a HEARD ✓ tag lands.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "reelkit/frame";

type ShotProps = any;

const N = 22;
const SUB = 5;

export const Speaker = ({ frames, cue, c, face, body, ui }: ShotProps) => {
  const { Pop, Push } = ui;
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [cue.phone, cue.phone + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dim = interpolate(frame, [cue.music, cue.music + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: c.night }}>
      <Push frames={frames} zoom={1.06} hits={[cue.phone]}>
        <div style={{ position: "absolute", left: 0, width: 1080, top: 230, textAlign: "center", fontFamily: face, fontSize: 104, color: c.cream }}>MADE FOR<br /><span style={{ color: c.accent }}>PHONES</span></div>
        {/* EQ */}
        {Array.from({ length: N }, (_, i) => {
          const beat = Math.abs(Math.sin(frame / 3.2 + i * 0.9)) * 0.6 + Math.abs(Math.sin(frame / 7 + i * 2.1)) * 0.4;
          const h = 90 + beat * (i < SUB ? 420 : 300);
          const isSub = i < SUB;
          const col = isSub ? `rgba(160,160,175,${1 - 0.65 * dim})` : glow > 0 ? c.accent : c.cream;
          return <div key={i} style={{ position: "absolute", left: 95 + i * 41, top: 1180 - h, width: 30, height: h, borderRadius: 10, background: col, boxShadow: !isSub && glow > 0 ? `0 0 ${30 * glow}px ${c.accent}` : "none" }} />;
        })}
        <div style={{ position: "absolute", left: 95 + SUB * 41 - 8, top: 600, width: 4, height: 600, background: c.yellow, opacity: dim }} />
        <div style={{ position: "absolute", left: 95 + SUB * 41 + 4, top: 600, fontFamily: body, fontWeight: 800, fontSize: 30, color: c.yellow, opacity: dim }}>150 Hz</div>
        <div style={{ position: "absolute", left: 70, top: 1215, width: 230, fontFamily: body, fontWeight: 700, fontSize: 24, lineHeight: 1.2, color: "#9a9aa8", opacity: dim }}>sub bass: phones can't play it</div>
        {/* the phone's bottom edge with its grille */}
        <div style={{ position: "absolute", left: 140, top: 1300, width: 800, height: 120, borderRadius: "0 0 70px 70px", background: c.slate, border: "4px solid #3a3a46", borderTop: "none" }}>
          {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ position: "absolute", left: 470 + i * 26, top: 52, width: 14, height: 14, borderRadius: 7, background: "#0d0d10" }} />)}
          <div style={{ position: "absolute", left: 360, top: 46, width: 80, height: 26, borderRadius: 13, background: "#0d0d10" }} />
        </div>
        <Pop at={cue.phone + 3} from="scale" feel="bouncy" x={800} y={640} rot={6}>
          <div style={{ background: c.green, color: c.black, fontFamily: face, fontSize: 64, padding: "12px 30px", borderRadius: 18 }}>HEARD ✓</div>
        </Pop>
      </Push>
    </AbsoluteFill>
  );
};
