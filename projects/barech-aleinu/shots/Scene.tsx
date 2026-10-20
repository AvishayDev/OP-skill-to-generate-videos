// Every shot of "ברך עלינו": the two cartoon friends cut back and forth (Beni explains on teal, Avi pretends on
// sand); each shot id picks its speaker, mood and pose, and its props land on their cue words. The Amida map
// (rules-b/c/d) walks a pointer down the blessings; the last shots are a two-shot with crickets, then rain.
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "reelkit/frame";

type ShotProps = any;
type Mood = "happy" | "smug" | "nervous" | "annoyed" | "shocked" | "dizzy" | "relieved" | "laugh" | "calm" | "pray" | "worried";
type Pose = "down" | "point" | "wave" | "shrug" | "cross" | "pray" | "hips" | "up";

const INK = "#1d1b1a";
const AVI = { skin: "#E9B48C", hair: "#232020", shirt: "#2b2b2e", pants: "#3c4a5c", hairStyle: "spiky" as const, beard: "#2a2624" };
const BENI = { skin: "#F3C9A4", hair: "#5b3a22", shirt: "#fbfbf8", pants: "#2a2a2a", beard: "#6b4429", glasses: true, kippah: "#2E5FA8", collar: true };

// Who speaks in each single shot, how he looks, and the ground behind him.
const SOLO: Record<string, { who: "avi" | "beni"; mood: Mood; pose: Pose; gaze?: number }> = {
  amen: { who: "avi", mood: "pray", pose: "pray" },
  hope: { who: "beni", mood: "happy", pose: "point" },
  sure: { who: "avi", mood: "nervous", pose: "down", gaze: -1 },
  "why-a": { who: "beni", mood: "happy", pose: "point" },
  "why-b": { who: "beni", mood: "happy", pose: "up" },
  grumble: { who: "avi", mood: "annoyed", pose: "cross" },
  everyone: { who: "beni", mood: "laugh", pose: "shrug" },
  asking: { who: "avi", mood: "worried", pose: "hips", gaze: 1 },
  "rules-a": { who: "beni", mood: "calm", pose: "down" },
  lost: { who: "avi", mood: "dizzy", pose: "down" },
  "simple-a": { who: "beni", mood: "laugh", pose: "wave" },
  "simple-b": { who: "beni", mood: "happy", pose: "point" },
  relief: { who: "avi", mood: "relieved", pose: "hips" },
  tease: { who: "beni", mood: "smug", pose: "point", gaze: 1 },
  what: { who: "avi", mood: "shocked", pose: "up" },
  later: { who: "beni", mood: "smug", pose: "wave", gaze: -1 },
  "come-on": { who: "avi", mood: "annoyed", pose: "shrug" },
  another: { who: "beni", mood: "happy", pose: "point" },
};

export const Scene = ({ id, cue, c, face, body, words, frames, fps, ui }: ShotProps) => {
  const { Pop, Stamp, Toon } = ui;
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const H = height / k;
  const q = (n: string): number => (cue[n] === undefined ? 1e9 : cue[n]);
  const talking = words.some((w: { f: number; end: number }) => frame >= w.f && frame <= w.end);
  const since = (n: string, len = 12) => interpolate(frame - q(n), [0, len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ── shared props ───────────────────────────────────────────────────────────
  const Ground = ({ color }: { color: string }) => (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 38%, rgba(255,255,255,0.28), rgba(0,0,0,0) 60%), ${color}` }} />
  );
  const Label = ({ text, size = 64, bg = c.paper, ink = INK, rot = 0 }: { text: string; size?: number; bg?: string; ink?: string; rot?: number }) => (
    <div style={{ direction: "rtl", whiteSpace: "nowrap", fontFamily: face, fontWeight: 900, fontSize: size * k, color: ink, background: bg, border: `${6 * k}px solid ${INK}`, borderRadius: 28 * k, padding: `${10 * k}px ${30 * k}px`, boxShadow: `${8 * k}px ${10 * k}px 0 ${INK}`, transform: `rotate(${rot}deg)` }}>{text}</div>
  );
  const Thought = ({ text, size = 58 }: { text: string; size?: number }) => (
    <div style={{ position: "relative" }}>
      <div style={{ direction: "rtl", whiteSpace: "nowrap", fontFamily: face, fontWeight: 900, fontSize: size * k, color: INK, background: c.paper, border: `${6 * k}px solid ${INK}`, borderRadius: 80 * k, padding: `${26 * k}px ${46 * k}px` }}>{text}</div>
      {[[30, 34, 0], [56, 22, 46]].map(([r, s, dy], i) => (
        <div key={i} style={{ position: "absolute", left: `${18 + i * 6}%`, bottom: -(r + dy) * k, width: s * k, height: s * k, borderRadius: "50%", background: c.paper, border: `${5 * k}px solid ${INK}` }} />
      ))}
    </div>
  );
  const Sun = ({ size = 200 }: { size?: number }) => (
    <svg viewBox="-100 -100 200 200" width={size * k} height={size * k}>
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d="M0,-92 L0,-70" stroke={INK} strokeWidth={9} strokeLinecap="round" transform={`rotate(${i * 36 + frame})`} />
      ))}
      <circle r={58} fill={c.gold} stroke={INK} strokeWidth={8} />
      <path d="M-22,-8 L-22,-4 M22,-8 L22,-4 M-24,16 Q0,34 24,16" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
    </svg>
  );
  const Cloud = ({ size = 320, rain = true }: { size?: number; rain?: boolean }) => (
    <svg viewBox="0 0 320 300" width={size * k} height={(size * 300) / 320 * k} style={{ overflow: "visible" }}>
      {rain ? Array.from({ length: 7 }, (_, i) => {
        const y = ((frame * 9 + i * 37) % 120);
        return <path key={i} d={`M${60 + i * 34},${150 + y} l-8,26`} stroke={c.accent} strokeWidth={9} strokeLinecap="round" />;
      }) : null}
      <path d="M60,160 Q20,160 24,124 Q28,90 70,94 Q78,40 140,44 Q190,18 222,70 Q290,62 294,120 Q300,164 250,162 Z" fill="#f4f7fb" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    </svg>
  );
  const Key = ({ size = 420 }: { size?: number }) => (
    <svg viewBox="0 0 420 180" width={size * k} height={(size * 180) / 420 * k} style={{ overflow: "visible" }}>
      <circle cx={80} cy={90} r={66} fill={c.gold} stroke={INK} strokeWidth={9} />
      <circle cx={80} cy={90} r={26} fill="none" stroke={INK} strokeWidth={9} />
      <path d="M144,72 L396,72 L396,108 L370,108 L370,140 L340,140 L340,108 L312,108 L312,130 L284,130 L284,108 L144,108 Z" fill={c.gold} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d="M30,60 Q50,36 76,34" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.7} />
    </svg>
  );
  const Sparkle = ({ x, y, s, at }: { x: number; y: number; s: number; at: number }) => {
    const t = frame - at;
    if (t < 0) return null;
    const sc = interpolate(t, [0, 8, 22], [0, 1.2, 0.9], { extrapolateRight: "clamp" });
    return (
      <div style={{ position: "absolute", left: (x - s / 2) * k, top: (y - s / 2) * k, transform: `scale(${sc}) rotate(${t * 3}deg)` }}>
        <svg viewBox="-50 -50 100 100" width={s * k} height={s * k}><path d="M0,-48 Q8,-8 48,0 Q8,8 0,48 Q-8,8 -48,0 Q-8,-8 0,-48 Z" fill={c.gold} stroke={INK} strokeWidth={5} /></svg>
      </div>
    );
  };
  const Rain = ({ amount }: { amount: number }) => (
    <svg viewBox={`0 0 1080 ${H}`} width={1080 * k} height={H * k} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: Math.round(70 * amount) }, (_, i) => {
        const x = (i * 157) % 1080;
        const sp = 26 + (i % 5) * 4;
        const y = ((frame * sp + i * 211) % (H + 200)) - 100;
        return <path key={i} d={`M${x},${y} l-10,44`} stroke="#6fa8d6" strokeWidth={6} strokeLinecap="round" opacity={0.75} />;
      })}
    </svg>
  );
  const Cricket = ({ x, y, flip = false, phase = 0 }: { x: number; y: number; flip?: boolean; phase?: number }) => {
    const chirp = Math.floor((frame + phase) / 5) % 2 === 0;
    return (
      <div style={{ position: "absolute", left: x * k, top: y * k, transform: `scaleX(${flip ? -1 : 1})` }}>
        <svg viewBox="0 0 160 110" width={160 * k} height={110 * k} style={{ overflow: "visible" }}>
          <path d="M40,70 L18,104 M70,74 L60,106 M100,72 L130,104 L150,98" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          <ellipse cx={78} cy={58} rx={56} ry={24} fill="#5c8a3a" stroke={INK} strokeWidth={6} />
          <circle cx={130} cy={50} r={20} fill="#6e9c47" stroke={INK} strokeWidth={6} />
          <circle cx={136} cy={45} r={5} fill={INK} />
          <path d="M140,34 Q170,0 200,-6 M132,32 Q150,-10 176,-24" stroke={INK} strokeWidth={4} fill="none" />
          <path d={chirp ? "M40,40 L110,30" : "M40,44 L110,38"} stroke="#3e6626" strokeWidth={10} strokeLinecap="round" />
          {chirp ? <text x={20} y={10} fontSize={40} fontWeight={900} fill={INK}>♪</text> : null}
        </svg>
      </div>
    );
  };

  // ── the Amida map (rules-b / rules-c / rules-d) ───────────────────────────
  const AmidaMap = () => {
    const rows = ["ברך עלינו", "· · ·", "שמע קולנו", "רצה", "· · ·", "סוף העמידה"];
    const Y = (i: number) => 230 + i * 128;
    // Where the pointer is, by shot and cue.
    let at = 0;
    if (id === "rules-c") at = 2 * since("pass", 14);
    if (id === "rules-d") at = frame < q("end") ? 2 + interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }) : 3 + 2 * since("end", 14);
    const hot = Math.round(at);
    const Arrow = ({ from, to, p, label }: { from: number; to: number; p: number; label: string }) => {
      if (p <= 0) return null;
      const y1 = Y(from), y2 = Y(to);
      const len = Math.abs(y1 - y2) + 140;
      return (
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <svg viewBox={`0 0 1080 ${H}`} width={1080 * k} height={H * k} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d={`M840,${y1} C980,${y1} 980,${y2} 840,${y2}`} stroke={c.red} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray={len * 1.3} strokeDashoffset={len * 1.3 * (1 - p)} />
            {p > 0.95 ? <path d={`M864,${y2 - 26} L834,${y2} L864,${y2 + 26}`} stroke={c.red} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
          </svg>
          <div style={{ position: "absolute", left: 930 * k, top: ((y1 + y2) / 2) * k, transform: "translate(-50%, -50%)", opacity: p }}>
            <Label text={label} size={44} bg={c.red} ink="#fff" rot={-6} />
          </div>
        </div>
      );
    };
    return (
      <>
        <div style={{ position: "absolute", left: 120 * k, top: 120 * k, fontFamily: face, fontWeight: 900, fontSize: 56 * k, color: "#fff", direction: "rtl", width: 840 * k, textAlign: "center" }}>תפילת העמידה</div>
        {rows.map((r, i) => {
          const dots = r.startsWith("·");
          const on = !dots && i === hot;
          return (
            <div key={i} style={{ position: "absolute", left: 200 * k, top: (Y(i) - 50) * k, width: 600 * k, height: 100 * k, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: face, fontWeight: 900, fontSize: (dots ? 44 : 58) * k, color: dots ? "rgba(255,255,255,0.7)" : INK, background: dots ? "transparent" : on ? c.gold : c.paper, border: dots ? "none" : `${6 * k}px solid ${INK}`, borderRadius: 24 * k, boxShadow: dots ? "none" : `${7 * k}px ${8 * k}px 0 ${INK}`, transform: on ? "scale(1.06)" : "none" }}>{r}</div>
          );
        })}
        {/* pointer */}
        <div style={{ position: "absolute", left: 110 * k, top: (Y(at) - 40) * k }}>
          <svg viewBox="0 0 90 80" width={90 * k} height={80 * k}><path d="M6,14 L60,14 L60,0 L88,40 L60,80 L60,66 L6,66 Z" fill={c.gold} stroke={INK} strokeWidth={6} strokeLinejoin="round" /></svg>
        </div>
        {id === "rules-b" && frame >= q("s1") ? (
          <Pop at={q("s1")} from="scale" x={540} y={Y(0) + 96}><Label text="עוד לא חתמת?" size={40} bg={c.paper} /></Pop>
        ) : null}
        {id === "rules-b" ? (
          <Pop at={q("back1")} from="scale" feel="bouncy" x={540} y={Y(1) + 40}><Label text="↩ חוזר לברך עלינו" size={46} bg={c.red} ink="#fff" rot={-3} /></Pop>
        ) : null}
        {id === "rules-c" ? (
          <Pop at={q("add")} from="right" feel="bouncy" x={540} y={Y(2) + 92}><Label text="+ ותן טל ומטר לברכה" size={46} bg={c.accent} ink="#fff" rot={-3} /></Pop>
        ) : null}
        {id === "rules-d" ? <Arrow from={3} to={0} p={since("back2", 16) * (frame < q("end") ? 1 : 0)} label="חוזר!" /> : null}
        {id === "rules-d" ? <Arrow from={5} to={-0.8} p={since("top", 16)} label="מההתחלה" /> : null}
      </>
    );
  };

  // ── two-shot: crickets and rain ──────────────────────────────────────────
  const twoShotFrom = id === "another" ? q("stamp") + 30 : 0;
  if (id === "bye" || id === "bye2" || (id === "another" && frame >= twoShotFrom)) {
    const rainFrom = id === "another" ? q("drops") : -1e9;
    const rain = interpolate(frame - rainFrom, [0, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (id === "another" ? 1 : 1);
    return (
      <>
        <Ground color="#b9c7cf" />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1440 * k, bottom: 0, background: "#7fa36a" }} />
        <Toon look={AVI} x={300} y={1960} size={1080} mood={id === "bye" ? "worried" : "calm"} pose={id === "another" ? "down" : "hips"} talking={id === "bye" && talking} gaze={id === "another" ? 1 : 0} />
        <Toon look={BENI} x={780} y={1960} size={1080} mood={id === "bye2" ? "happy" : "calm"} pose={id === "bye2" ? "wave" : "down"} talking={id === "bye2" && talking} gaze={id === "another" ? -1 : 0} />
        {id === "another" ? (
          <>
            {frame >= q("crickets") ? <Cricket x={420} y={1330} phase={0} /> : null}
            {frame >= q("crickets") + 10 ? <Cricket x={560} y={1380} flip phase={3} /> : null}
          </>
        ) : null}
        <Rain amount={rain} />
      </>
    );
  }

  // ── Amida-map shots: Beni small in the corner ─────────────────────────
  if (id === "rules-b" || id === "rules-c" || id === "rules-d") {
    return (
      <>
        <Ground color={c.teal} />
        <AmidaMap />
        <Toon look={BENI} x={170} y={1760} size={600} mood="happy" pose="point" talking={talking} />
      </>
    );
  }

  // ── simple-c: the key goes into "שמע קולנו" ───────────────────────────
  if (id === "simple-c") {
    const fly = since("insert", 16);
    return (
      <>
        <Ground color={c.teal} />
        <Pop at={q("miss")} from="left" x={540} y={300}>
          <div style={{ position: "relative" }}>
            <Label text="ברך עלינו" size={70} />
            <svg viewBox="0 0 100 100" width={130 * k} height={130 * k} style={{ position: "absolute", left: -150 * k, top: -10 * k }}>
              <path d="M14,14 L86,86 M86,14 L14,86" stroke={c.red} strokeWidth={14} strokeLinecap="round" strokeDasharray={120} strokeDashoffset={120 * (1 - since("miss", 8))} />
            </svg>
          </div>
        </Pop>
        <Pop at={q("miss") + 6} from="left" x={540} y={620}>
          <div style={{ position: "relative" }}>
            <Label text="שמע קולנו" size={70} bg={frame >= q("ok") ? c.gold : c.paper} />
            {frame >= q("ok") ? (
              <svg viewBox="0 0 100 100" width={130 * k} height={130 * k} style={{ position: "absolute", left: -150 * k, top: -10 * k }}>
                <path d="M12,54 L40,82 L90,20" stroke="#2f9e44" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={140} strokeDashoffset={140 * (1 - since("ok", 8))} />
              </svg>
            ) : null}
          </div>
        </Pop>
        <div style={{ position: "absolute", left: interpolate(fly, [0, 1], [980, 920]) * k, top: interpolate(fly, [0, 1], [380, 620]) * k, transform: `translate(-50%,-50%) rotate(${interpolate(fly, [0, 1], [-30, 180])}deg)` }}>
          <Key size={300} />
        </div>
        <Toon look={BENI} x={540} y={1800} size={800} mood="happy" pose="point" talking={talking} />
      </>
    );
  }

  // ── single-speaker shots ──────────────────────────────────────────────
  const s = SOLO[id];
  const beni = s.who === "beni";
  return (
    <>
      <Ground color={beni ? c.teal : c.sand} />
      <Toon look={beni ? BENI : AVI} x={540} y={1900} size={1200} mood={s.mood} pose={s.pose} talking={talking} gaze={s.gaze ?? 0} />

      {id === "amen" ? (
        <>
          <Sparkle x={250} y={360} s={110} at={q("amen")} />
          <Sparkle x={840} y={300} s={80} at={q("amen") + 4} />
          <Sparkle x={860} y={560} s={60} at={q("amen") + 8} />
        </>
      ) : null}
      {id === "hope" ? <Pop at={q("ask")} from="scale" feel="bouncy" x={300} y={250}><Label text="ברך עלינו?" size={70} rot={-5} /></Pop> : null}
      {id === "sure" ? <Pop at={q("think")} from="scale" feel="bouncy" x={560} y={190}><Thought text="מה זה ברך עלינו?!" size={60} /></Pop> : null}
      {id === "why-a" ? (
        <>
          <Pop at={q("cal")} from="drop" feel="bouncy" x={230} y={300}>
            <div style={{ width: 250 * k, background: c.paper, border: `${7 * k}px solid ${INK}`, borderRadius: 26 * k, overflow: "hidden", boxShadow: `${9 * k}px ${10 * k}px 0 ${INK}`, transform: "rotate(-6deg)", textAlign: "center", fontFamily: face, fontWeight: 900, direction: "rtl" }}>
              <div style={{ background: c.red, color: "#fff", fontSize: 50 * k, padding: `${8 * k}px 0` }}>חשוון</div>
              <div style={{ fontSize: 150 * k, lineHeight: 1.1, color: INK }}>ז׳</div>
            </div>
          </Pop>
          <Pop at={q("sun")} from="scale" feel="bouncy" x={850} y={300}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Sun size={210} />
              <Label text="ברכנו" size={46} />
              {frame >= q("x") ? (
                <svg viewBox="0 0 100 100" width={260 * k} height={260 * k} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
                  <path d="M12,12 L88,88 M88,12 L12,88" stroke={c.red} strokeWidth={12} strokeLinecap="round" strokeDasharray={120} strokeDashoffset={120 * (1 - since("x", 8))} />
                </svg>
              ) : null}
            </div>
          </Pop>
        </>
      ) : null}
      {id === "why-b" ? (
        <>
          <Pop at={q("rain")} from="drop" feel="bouncy" x={540} y={230}><Cloud size={360} /></Pop>
          <Pop at={q("text")} from="rise" x={540} y={470}><Label text="ותן טל ומטר לברכה" size={66} bg={c.accent} ink="#fff" /></Pop>
        </>
      ) : null}
      {id === "grumble" ? (
        <Pop at={q("used")} from="scale" feel="bouncy" x={800} y={240}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 * k }}>
            <Thought text="ברכנו..." size={56} />
            <Sun size={150} />
          </div>
        </Pop>
      ) : null}
      {id === "everyone" ? <Pop at={q("all")} from="scale" feel="bouncy" x={540} y={250}><Label text="כולם שוכחים בהתחלה" size={62} rot={-4} /></Pop> : null}
      {id === "asking" ? (
        <>
          <Pop at={q("q")} from="scale" feel="bouncy" x={220} y={260}>
            <div style={{ fontFamily: face, fontWeight: 900, fontSize: 260 * k, color: c.accent, WebkitTextStroke: `${8 * k}px ${INK}`, lineHeight: 1 }}>?</div>
          </Pop>
          <Pop at={q("me")} from="right" x={760} y={250}><Label text="בשביל חבר..." size={58} rot={4} /></Pop>
        </>
      ) : null}
      {id === "rules-a" ? <Pop at={q("calm")} from="scale" feel="bouncy" x={540} y={250}><Label text="זה ממש בקטנה" size={70} rot={-3} /></Pop> : null}
      {id === "lost" ? (
        <div style={{ position: "absolute", left: 540 * k, top: 240 * k, transform: `translate(-50%,-50%) rotate(${frame * 9}deg)` }}>
          <svg viewBox="-120 -60 240 120" width={300 * k} height={150 * k}>
            <path d="M-100,0 C-100,-50 100,-50 100,0 C100,40 -80,40 -80,0 C-80,-30 80,-30 80,0 C80,24 -56,24 -56,0 C-56,-14 50,-14 50,0" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
          </svg>
        </div>
      ) : null}
      {id === "simple-a" ? <Pop at={q("easy")} from="scale" feel="bouncy" x={540} y={250}><Label text="ממש פשוט!" size={80} bg={c.gold} rot={-4} /></Pop> : null}
      {id === "simple-b" ? (
        <>
          <Pop at={0} from="rise" x={540} y={190}><Label text="ותן טל ומטר לברכה" size={60} bg={c.accent} ink="#fff" /></Pop>
          <Pop at={q("key")} from="spin" feel="bouncy" x={540} y={420}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * k }}>
              <Key size={480} />
              <div style={{ fontFamily: face, fontWeight: 900, fontSize: 70 * k, color: "#fff", WebkitTextStroke: `${3 * k}px ${INK}`, letterSpacing: 4 * k }}>SUPER KEY</div>
            </div>
          </Pop>
          <Sparkle x={210} y={330} s={90} at={q("key") + 6} />
          <Sparkle x={880} y={480} s={70} at={q("key") + 10} />
        </>
      ) : null}
      {id === "relief" ? (
        <Pop at={q("ok")} from="none" x={540} y={260}><Stamp text="סגרנו!" at={q("ok")} color={c.red} face={face} size={120} fill="rgba(255,255,255,0.9)" /></Pop>
      ) : null}
      {id === "tease" ? (
        <Pop at={q("n30")} from="scale" feel="bouncy" x={800} y={290}>
          <div style={{ width: 300 * k, height: 300 * k, borderRadius: "50%", background: c.gold, border: `${8 * k}px solid ${INK}`, boxShadow: `${9 * k}px ${10 * k}px 0 ${INK}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: face, fontWeight: 900, color: INK, direction: "rtl" }}>
            <div style={{ fontSize: 140 * k, lineHeight: 1 }}>30</div>
            <div style={{ fontSize: 50 * k }}>יום</div>
          </div>
        </Pop>
      ) : null}
      {id === "what" ? (
        <Pop at={q("q")} from="scale" feel="bouncy" x={540} y={230}>
          <div style={{ fontFamily: face, fontWeight: 900, fontSize: 280 * k, color: c.red, WebkitTextStroke: `${9 * k}px ${INK}`, lineHeight: 1 }}>?!</div>
        </Pop>
      ) : null}
      {id === "later" ? (
        <Pop at={q("stamp")} from="none" x={540} y={260}><Stamp text="לסרטון אחר" at={q("stamp")} color={c.red} face={face} size={100} fill="rgba(255,255,255,0.9)" /></Pop>
      ) : null}
      {id === "come-on" ? (
        <Pop at={q("mad")} from="scale" feel="bouncy" x={780} y={230}>
          <svg viewBox="-60 -60 120 120" width={190 * k} height={190 * k}>
            {[0, 90, 180, 270].map((r) => <path key={r} d="M14,-46 Q6,-18 30,-12" transform={`rotate(${r})`} stroke={c.red} strokeWidth={11} fill="none" strokeLinecap="round" />)}
          </svg>
        </Pop>
      ) : null}
      {id === "another" ? (
        <Pop at={q("stamp")} from="none" x={540} y={260}><Stamp text="סרטון אחר!" at={q("stamp")} color={c.red} face={face} size={110} fill="rgba(255,255,255,0.9)" /></Pop>
      ) : null}
    </>
  );
};
