// The CTA: an Instagram-style comment card. On "EDIT" the field types EDIT and sends (it becomes a posted comment),
// a heart bursts on "show", and on "setup" a reply chip lands: "✓ the whole setup, sent to you".
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";

type ShotProps = any;

export const Comment = ({ frames, cue, c, face, body, ui }: ShotProps) => {
  const { Pop, Push, TypeField } = ui;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const posted = frame >= cue.edit + 12;
  const heart = spring({ frame: frame - cue.show, fps, config: { stiffness: 300, damping: 10 } });
  return (
    <AbsoluteFill style={{ backgroundColor: c.cream }}>
      <Push frames={frames} zoom={1.05} hits={[cue.show, cue.setup]}>
        <Pop at={0} from="drop" x={540} y={330}>
          <div style={{ fontFamily: face, fontSize: 132, color: c.black, textAlign: "center", lineHeight: 0.95 }}>COMMENT<br /><span style={{ color: c.accent }}>“EDIT”</span></div>
        </Pop>
        <div style={{ position: "absolute", left: 80, top: 620, width: 920, borderRadius: 40, background: c.paper, boxShadow: "0 24px 50px rgba(0,0,0,.12)", padding: 40, fontFamily: body }}>
          <div style={{ fontWeight: 800, fontSize: 34, color: c.black, marginBottom: 28 }}>Comments</div>
          {posted ? (
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 30, transform: `translateY(${(1 - spring({ frame: frame - cue.edit - 12, fps, config: { stiffness: 300, damping: 22 } })) * 40}px)` }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${c.yellow}, ${c.accent})` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 28, color: "#6a6a78" }}>you · now</div>
                <div style={{ fontWeight: 900, fontSize: 52, color: c.black }}>EDIT</div>
              </div>
              <div style={{ fontSize: 64, color: frame >= cue.show ? c.accent : "#c5c5d0", transform: `scale(${frame >= cue.show ? interpolate(heart, [0, 1], [1.8, 1]) : 1})` }}>♥</div>
            </div>
          ) : null}
          {!posted ? (
            <TypeField text="EDIT" at={cue.edit} cps={14} w={840} bg="#F1F1F5" ink={c.black} caret={c.accent} face={body} size={52} />
          ) : (
            <div style={{ height: 96, borderRadius: 48, background: "#F1F1F5", display: "flex", alignItems: "center", padding: "0 34px", color: "#9aa0ab", fontSize: 36, fontWeight: 600 }}>Add a comment…</div>
          )}
        </div>
        <Pop at={cue.setup} from="rise" feel="bouncy" x={540} y={1180}>
          <div style={{ background: c.green, color: c.black, fontFamily: body, fontWeight: 900, fontSize: 48, padding: "18px 36px", borderRadius: 999, whiteSpace: "nowrap" }}>✓ the whole setup, sent to you</div>
        </Pop>
      </Push>
    </AbsoluteFill>
  );
};
