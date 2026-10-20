// A flat cartoon character drawn in SVG — for dialogue sketches (two friends talking, a host and a guest).
// `look` sets the person (skin, hair, beard, glasses, kippah, shirt), `mood` the face, `pose` the arms, `talking`
// flaps the mouth (pass whether a word is being spoken on this frame). Centre-bottom at (x, y) in 1080 units;
// `size` is the height. It idles with a small breathing bob.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "reelkit/frame";

export type ToonLook = {
  skin: string; hair: string; shirt: string; pants: string;
  hairStyle?: "neat" | "spiky"; beard?: string; glasses?: boolean; kippah?: string; collar?: boolean;
};
export type ToonMood = "happy" | "smug" | "nervous" | "annoyed" | "shocked" | "dizzy" | "relieved" | "laugh" | "calm" | "pray" | "worried";
export type ToonPose = "down" | "point" | "wave" | "shrug" | "cross" | "pray" | "hips" | "up";

const INK = "#1d1b1a";

// Arm joints (shoulder → elbow → hand) for the character's two arms, in the 600×900 drawing box.
const ARMS: Record<ToonPose, [number, number][][]> = {
  down: [[[178, 452], [150, 610], [168, 760]], [[422, 452], [450, 610], [432, 760]]],
  point: [[[178, 452], [150, 610], [168, 760]], [[422, 452], [500, 560], [500, 410]]],
  wave: [[[178, 452], [150, 610], [168, 760]], [[422, 452], [520, 520], [548, 360]]],
  shrug: [[[178, 452], [96, 580], [52, 470]], [[422, 452], [504, 580], [548, 470]]],
  cross: [[[178, 452], [170, 620], [400, 610]], [[422, 452], [430, 640], [200, 650]]],
  pray: [[[178, 452], [200, 640], [292, 530]], [[422, 452], [400, 640], [308, 530]]],
  hips: [[[178, 452], [86, 590], [170, 700]], [[422, 452], [514, 590], [430, 700]]],
  up: [[[178, 452], [110, 330], [90, 200]], [[422, 452], [490, 330], [510, 200]]],
};

const Arm: React.FC<{ pts: [number, number][]; shirt: string; skin: string; open: boolean }> = ({ pts, shirt, skin, open }) => {
  const [s, e, h] = pts;
  return (
    <g>
      <path d={`M${s[0]},${s[1]} L${e[0]},${e[1]}`} stroke={INK} strokeWidth={66} strokeLinecap="round" fill="none" />
      <path d={`M${e[0]},${e[1]} L${h[0]},${h[1]}`} stroke={INK} strokeWidth={50} strokeLinecap="round" fill="none" />
      <path d={`M${e[0]},${e[1]} L${h[0]},${h[1]}`} stroke={skin} strokeWidth={38} strokeLinecap="round" fill="none" />
      <path d={`M${s[0]},${s[1]} L${e[0]},${e[1]}`} stroke={shirt} strokeWidth={54} strokeLinecap="round" fill="none" />
      <circle cx={h[0]} cy={h[1]} r={open ? 34 : 28} fill={skin} stroke={INK} strokeWidth={6} />
    </g>
  );
};

export const Toon: React.FC<{
  look: ToonLook; mood?: ToonMood; pose?: ToonPose; talking?: boolean; x: number; y: number; size?: number;
  gaze?: number; flip?: boolean; tilt?: number;
}> = ({ look, mood = "happy", pose = "down", talking = false, x, y, size = 1000, gaze = 0, flip = false, tilt = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const h = size * k;
  const w = (h * 600) / 900;
  const bob = Math.sin(frame / 11) * 5;
  const open = talking && Math.floor(frame / 3) % 2 === 0;
  const arms = ARMS[pose];
  const front = pose === "cross" || pose === "pray";
  const blink = mood !== "pray" && mood !== "relieved" && frame % 97 > 93;

  // Eyes
  const eye = (cx: number) => {
    if (mood === "laugh" || (mood === "happy" && blink)) return <path d={`M${cx - 24},${258} Q${cx},${228} ${cx + 24},${258}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
    if (mood === "pray" || mood === "relieved" || blink) return <path d={`M${cx - 24},${250} Q${cx},${270} ${cx + 24},${250}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
    if (mood === "dizzy") return <path d={`M${cx},250 m-4,0 a4,4 0 1,1 8,0 a10,10 0 1,1 -18,0 a16,16 0 1,1 30,0`} stroke={INK} strokeWidth={6} fill="none" />;
    const big = mood === "shocked" ? 1.3 : 1;
    const pr = mood === "shocked" ? 8 : 12;
    const lid = mood === "annoyed" || mood === "smug";
    return (
      <g>
        <ellipse cx={cx} cy={250} rx={25 * big} ry={30 * big} fill="#fff" stroke={INK} strokeWidth={6} />
        <circle cx={cx + gaze * 10} cy={254} r={pr} fill={INK} />
        <circle cx={cx + gaze * 10 + 4} cy={249} r={3.5} fill="#fff" />
        {lid ? <path d={`M${cx - 29},${246} L${cx + 29},${246} L${cx + 29},${214} L${cx - 29},${214} Z`} fill={look.skin} stroke="none" /> : null}
        {lid ? <path d={`M${cx - 27},${246} L${cx + 27},${246}`} stroke={INK} strokeWidth={7} strokeLinecap="round" /> : null}
      </g>
    );
  };
  // Brows: inner and outer heights per mood (left brow; the right one mirrors).
  const BROWS: Record<ToonMood, [number, number]> = {
    happy: [200, 196], smug: [204, 194], nervous: [190, 204], annoyed: [214, 198], shocked: [180, 184], dizzy: [196, 196],
    relieved: [204, 200], laugh: [198, 194], calm: [204, 202], pray: [206, 204], worried: [188, 206],
  };
  const [bi, bo] = BROWS[mood];
  const browColor = look.beard ?? look.hair;

  const mouth = () => {
    if (open || mood === "shocked") {
      const rh = mood === "shocked" && !open ? 30 : 26;
      return (
        <g>
          <ellipse cx={300} cy={340} rx={30} ry={rh} fill="#6e1f1f" stroke={INK} strokeWidth={6} />
          <ellipse cx={300} cy={352} rx={16} ry={8} fill="#e0716c" />
        </g>
      );
    }
    if (mood === "laugh") return <path d="M256,322 Q300,382 344,322 Z" fill="#6e1f1f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
    if (mood === "annoyed") return <path d="M270,342 L330,336" stroke={INK} strokeWidth={8} strokeLinecap="round" />;
    if (mood === "nervous") return <path d="M262,340 Q276,326 290,340 Q304,354 318,340 Q330,328 340,338" stroke={INK} strokeWidth={7} fill="#fff" strokeLinecap="round" />;
    if (mood === "worried" || mood === "dizzy") return <path d="M268,346 Q300,322 332,346" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />;
    if (mood === "smug") return <path d="M268,334 Q306,356 336,326" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />;
    if (mood === "pray" || mood === "calm") return <path d="M276,336 Q300,350 324,336" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />;
    return <path d="M262,326 Q300,370 338,326 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
  };

  const hair = look.hairStyle === "spiky"
    ? "M178,250 L170,170 L205,182 L210,120 L250,150 L272,96 L300,140 L330,94 L352,146 L392,116 L396,180 L432,172 L422,250 Q410,190 300,178 Q190,190 178,250 Z"
    : "M178,252 Q170,120 300,108 Q430,120 422,252 Q408,186 330,176 Q300,196 262,176 Q196,184 178,252 Z";

  return (
    <div style={{ position: "absolute", left: x * k - w / 2, top: y * k - h, width: w, height: h, transform: `translateY(${bob * k}px) rotate(${tilt}deg) scaleX(${flip ? -1 : 1})`, transformOrigin: "50% 100%" }}>
      <svg viewBox="0 0 600 900" width={w} height={h} style={{ overflow: "visible" }}>
        {/* body */}
        <path d="M258,370 L342,370 L342,430 L258,430 Z" fill={look.skin} stroke={INK} strokeWidth={6} />
        <path d="M150,470 Q150,420 230,412 L370,412 Q450,420 450,470 L440,830 L160,830 Z" fill={look.shirt} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M188,830 L188,900 M412,830 L412,900" stroke={INK} strokeWidth={6} />
        <path d="M160,826 L440,826 L436,900 L164,900 Z" fill={look.pants} stroke={INK} strokeWidth={7} />
        {look.collar ? (
          <g>
            <path d="M232,414 L300,470 L268,500 L222,430 Z M368,414 L300,470 L332,500 L378,430 Z" fill={look.shirt} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M300,470 L300,826" stroke={INK} strokeWidth={4} opacity={0.5} />
            {[540, 620, 700, 780].map((cy) => <circle key={cy} cx={312} cy={cy} r={6} fill={INK} opacity={0.5} />)}
          </g>
        ) : (
          <path d="M252,414 Q300,452 348,414" stroke={INK} strokeWidth={6} fill="none" />
        )}
        {!front ? arms.map((a, i) => <Arm key={i} pts={a} shirt={look.shirt} skin={look.skin} open={pose === "wave" || pose === "shrug"} />) : null}
        {/* head */}
        <ellipse cx={186} cy={262} rx={24} ry={32} fill={look.skin} stroke={INK} strokeWidth={6} />
        <ellipse cx={414} cy={262} rx={24} ry={32} fill={look.skin} stroke={INK} strokeWidth={6} />
        <ellipse cx={300} cy={250} rx={120} ry={136} fill={look.skin} stroke={INK} strokeWidth={7} />
        {look.beard ? <path d="M182,262 Q186,404 300,410 Q414,404 418,262 Q396,318 340,316 Q300,306 260,316 Q204,318 182,262 Z" fill={look.beard} stroke={INK} strokeWidth={6} strokeLinejoin="round" /> : null}
        <path d={hair} fill={look.hair} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {look.kippah ? (
          <g transform="rotate(-8 300 112)">
            <ellipse cx={300} cy={116} rx={74} ry={26} fill={look.kippah} stroke={INK} strokeWidth={6} />
            <path d="M234,118 Q300,136 366,118" stroke="#fff" strokeWidth={6} fill="none" opacity={0.8} />
          </g>
        ) : null}
        <path d={`M228,${bo} L278,${bi}`} stroke={browColor} strokeWidth={12} strokeLinecap="round" />
        <path d={`M372,${bo} L322,${bi}`} stroke={browColor} strokeWidth={12} strokeLinecap="round" />
        {eye(255)}
        {eye(345)}
        {look.glasses ? (
          <g fill="none" stroke={INK} strokeWidth={9}>
            <circle cx={255} cy={252} r={40} />
            <circle cx={345} cy={252} r={40} />
            <path d="M295,248 Q300,240 305,248 M215,246 L186,238 M385,246 L414,238" />
          </g>
        ) : null}
        <path d="M300,262 Q290,294 300,300 Q308,302 312,296" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        {mood === "laugh" || mood === "happy" ? (
          <g opacity={0.35}>
            <ellipse cx={226} cy={300} rx={22} ry={12} fill="#e8706a" />
            <ellipse cx={374} cy={300} rx={22} ry={12} fill="#e8706a" />
          </g>
        ) : null}
        {mouth()}
        {mood === "nervous" || mood === "worried" ? <path d="M432,170 Q446,200 446,214 A14,14 0 1,1 418,214 Q418,200 432,170 Z" fill="#7cc6f2" stroke={INK} strokeWidth={5} /> : null}
        {front ? arms.map((a, i) => <Arm key={i} pts={a} shirt={look.shirt} skin={look.skin} open={false} />) : null}
      </svg>
    </div>
  );
};
