// Graphics over the speaker, each landing on the word that names it.
import React from "react";
import { useCurrentFrame, spring, interpolate, useVideoConfig } from "reelkit/frame";
type ShotProps = any;
const RED = "#E5262B";
const rtl: React.CSSProperties = { direction: "rtl", unicodeBidi: "plaintext", whiteSpace: "nowrap", fontWeight: 800 };
const El = ({ k, t, at, x, y, f, ex, face, c, ui }: any) => {
  const { Pop, Stamp } = ui;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = Math.max(0, spring({ frame: frame - at, fps, config: { stiffness: 200, damping: 18 } }));
  const base: React.CSSProperties = { fontFamily: face, ...rtl };
  let inner: React.ReactNode = null;
  if (k === "stamp") return <Pop at={at} from="none" x={x} y={y}><Stamp text={t} at={0} color={RED} face={face} size={96} rot={-8} fill="#FFFFFF" /></Pop>;
  if (k === "tag")
    inner = (
      <div style={{ ...base, background: c.accent, color: "#111", fontSize: 66, padding: "22px 46px", borderRadius: 22, boxShadow: "0 12px 0 #0008", display: "flex", gap: 18, alignItems: "center", overflow: "hidden", position: "relative" }}>
        {ex.pin ? <svg width="46" height="60" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.2 0 11.6 0 20 12 32 12 32s12-12 12-20.4C24 5.2 18.6 0 12 0zm0 16a4.6 4.6 0 110-9.2 4.6 4.6 0 010 9.2z" fill="#111" /></svg> : null}
        {t}
        <div style={{ position: "absolute", top: 0, bottom: 0, width: 90, left: interpolate(frame - at, [4, 22], [-200, 1400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), background: "linear-gradient(100deg,transparent,#FFFFFF99,transparent)" }} />
      </div>
    );
  if (k === "chip")
    inner = <div style={{ ...base, background: ex.bg, color: ex.fg, border: ex.line ? `5px solid ${ex.line}` : "none", fontSize: 58, padding: "16px 40px", borderRadius: 999, boxShadow: "0 10px 0 #0008" }}>{t}</div>;
  if (k === "big")
    inner = <div style={{ ...base, color: "#FFF", fontSize: 150, WebkitTextStroke: "0", textShadow: `0 8px 0 ${RED}, 0 0 30px #000A`, lineHeight: 1 }}>{t}</div>;
  if (k === "price")
    inner = (
      <div style={{ ...base, width: 300, height: 300, borderRadius: "50%", background: RED, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 92, border: "10px solid #FFF", boxShadow: "0 14px 0 #0008", transform: `rotate(${(1 - p) * 40 - 8}deg)` }}>{t}</div>
    );
  if (k === "count") {
    const n = Math.round(ex.n * interpolate(frame - at, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    inner = (
      <div style={{ ...base, background: "#111", border: `6px solid ${c.accent}`, borderRadius: 28, padding: "10px 34px 18px", textAlign: "center", boxShadow: "0 12px 0 #0008" }}>
        <div style={{ fontSize: 130, color: c.accent, lineHeight: 1.1 }}>{n}</div>
        <div style={{ fontSize: 44, color: "#FFF" }}>{ex.label}</div>
      </div>
    );
  }
  if (k === "check")
    inner = (
      <div style={{ ...base, background: "#FFF", color: "#111", fontSize: 58, padding: "14px 40px 14px 28px", borderRadius: 999, display: "flex", gap: 20, alignItems: "center", boxShadow: "0 10px 0 #0008" }}>
        <svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="#1FB655" /><path d="M14 29l10 10 18-21" stroke="#FFF" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset={60 * (1 - Math.min(1, p * 1.2))} /></svg>
        {t}
      </div>
    );
  if (k === "heart")
    inner = <svg width="190" height="170" viewBox="0 0 32 29" style={{ transform: `scale(${1 + 0.08 * Math.sin((frame - at) / 3)})`, filter: "drop-shadow(0 8px 0 #0008)" }}><path d="M16 28C-6 13 4-3 16 7 28-3 38 13 16 28z" fill={RED} /></svg>;
  return <Pop at={at} from={f} feel="bouncy" x={x} y={y}>{inner}</Pop>;
};

export const ShB = ({ cue, c, face, ui }: ShotProps) => (
    <>
      <El face={face} c={c} ui={ui} k="tag" t={"סט סכו\"ם נירוסטה יוקרתי"} at={cue.c0} x={540} y={1290} f="left" ex={{}} />
    </>
);
