// The new way: a phone chat. On "Send" a video bubble flies in from the right with a progress ring that fills
// to "chat", where it turns into a sent check; "That's it" stamps THAT'S IT. and a few confetti bits pop.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "reelkit/frame";

type ShotProps = any;

export const ChatSend = ({ frames, cue, c, face, body, ui }: ShotProps) => {
  const { Phone, Pop, Push, Stamp } = ui;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fly = spring({ frame: frame - cue.send, fps, config: { stiffness: 220, damping: 20 } });
  const up = interpolate(frame, [cue.send + 6, cue.chat], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sent = frame >= cue.chat;
  const R = 46;
  const L = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ backgroundColor: c.yellow }}>
      <Push frames={frames} zoom={1.06} hits={[cue.done]}>
        <Pop at={0} from="rise" x={540} y={250}>
          <div style={{ fontFamily: face, fontSize: 120, color: c.black, whiteSpace: "nowrap" }}>THE NEW WAY</div>
        </Pop>
        <div style={{ position: "absolute", left: 540 - 300, top: 380 }}>
          <Phone w={600} h={1020} body={c.black} screen="#EDEFF3">
            <div style={{ position: "absolute", inset: 0, fontFamily: body }}>
              <div style={{ height: 130, background: "#fff", display: "flex", alignItems: "flex-end", padding: "0 30px 20px", gap: 18, borderBottom: "2px solid #e3e5ea" }}>
                <div style={{ width: 62, height: 62, borderRadius: "50%", background: c.accent, color: "#fff", fontWeight: 900, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>C</div>
                <div style={{ fontWeight: 800, fontSize: 36, color: c.black, paddingBottom: 10 }}>Claude</div>
              </div>
              <div style={{ position: "absolute", left: 30, top: 170, maxWidth: 420, background: "#fff", borderRadius: "28px 28px 28px 8px", padding: "20px 26px", fontSize: 30, fontWeight: 600, color: c.black, opacity: frame >= cue.way ? 1 : 0 }}>Send me the raw clip 🎬</div>
              {frame >= cue.send ? (
                <div style={{ position: "absolute", right: 30, top: 340, width: 360, height: 440, borderRadius: "30px 30px 8px 30px", overflow: "hidden", background: c.blue,
                  transform: `translate(${(1 - fly) * 420}px, ${(1 - fly) * 160}px) rotate(${(1 - fly) * 12}deg)` }}>
                  <div style={{ position: "absolute", left: 120, top: 70, width: 120, height: 120, borderRadius: "50%", background: "#E8B48A" }} />
                  <div style={{ position: "absolute", left: 60, top: 210, width: 240, height: 260, borderRadius: "120px 120px 0 0", background: "#1c3bd1" }} />
                  <div style={{ position: "absolute", left: 130, top: 170, width: 100, height: 100, borderRadius: "50%", background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {sent ? <div style={{ color: "#fff", fontSize: 60, fontWeight: 900 }}>✓</div> : (
                      <svg width={100} height={100} viewBox="0 0 100 100">
                        <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={8} />
                        <circle cx={50} cy={50} r={R} fill="none" stroke="#fff" strokeWidth={8} strokeDasharray={L} strokeDashoffset={L * (1 - up)} transform="rotate(-90 50 50)" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ position: "absolute", left: 18, bottom: 16, color: "#fff", fontWeight: 700, fontSize: 26 }}>raw_clip.mp4 · 0:48</div>
                </div>
              ) : null}
              <div style={{ position: "absolute", left: 24, right: 24, bottom: 30, height: 84, borderRadius: 42, background: "#fff", display: "flex", alignItems: "center", padding: "0 30px", color: "#9aa0ab", fontSize: 30, fontWeight: 600 }}>Message…</div>
            </div>
          </Phone>
        </div>
        <div style={{ position: "absolute", left: 0, width: 1080, top: 1180, display: "flex", justifyContent: "center" }}>
          <Stamp text="THAT'S IT." at={cue.done} color={c.accent} face={face} size={130} rot={-8} fill={c.cream} />
        </div>
        {frame >= cue.done ? Array.from({ length: 14 }, (_, i) => {
          const t = (frame - cue.done) / fps;
          const a = (i / 14) * Math.PI * 2;
          const v = 520 + (i % 3) * 140;
          return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * v * t, top: 1180 + Math.sin(a) * v * t + 900 * t * t, width: 26, height: 14, background: [c.accent, c.blue, c.black][i % 3], transform: `rotate(${i * 40 + t * 600}deg)`, opacity: Math.max(0, 1 - t * 1.2) }} />;
        }) : null}
      </Push>
    </AbsoluteFill>
  );
};
