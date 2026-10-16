// "3 HEARTS": the headline lands with the shot, three coral hearts pop on "three", the first two get GILLS tags on
// "gills", the third a BODY tag on "body".
import React from "react";
import { useCurrentFrame } from "reelkit/frame";

type ShotProps = any;

const Heart = ({ size, color, beat }: { size: number; color: string; beat: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 92" style={{ transform: `scale(${1 + 0.06 * beat})`, display: "block" }}>
    <path d="M50 88 C20 66 2 48 2 28 C2 13 14 2 28 2 C38 2 46 8 50 16 C54 8 62 2 72 2 C86 2 98 13 98 28 C98 48 80 66 50 88 Z" fill={color} stroke="#14213D" strokeWidth={4} />
  </svg>
);

export const ThreeHearts = ({ cue, c, face, body, ui }: ShotProps) => {
  const { Pop, BigText, Tag } = ui;
  const frame = useCurrentFrame();
  const xs = [270, 540, 810];
  return (
    <>
      <Pop at={0} from="rise" x={540} y={330}>
        <BigText text={["3 HEARTS"]} color={c.ink} face={face} size={150} mark={[0]} markAt={cue.three} markColor={c.accent} markInk={c.accentInk} />
      </Pop>
      {xs.map((x, i) => {
        const at = cue.three + i * 4;
        // A heartbeat every 18 frames once landed.
        const beat = frame > at + 10 ? Math.max(0, Math.sin(((frame - at) / 18) * Math.PI * 2)) : 0;
        return (
          <Pop key={i} at={at} from="scale" feel="bouncy" x={x} y={760}>
            <Heart size={230} color={c.accent} beat={beat} />
          </Pop>
        );
      })}
      {[0, 1].map((i) => (
        <Pop key={`g${i}`} at={cue.gills + i * 3} from="rise" x={xs[i]} y={960}>
          <Tag text="GILLS" bg={c.ink} ink={c.paper} face={body} size={40} />
        </Pop>
      ))}
      <Pop at={cue.body} from="rise" x={xs[2]} y={960}>
        <Tag text="BODY" bg={c.blue} ink={c.paper} face={body} size={40} />
      </Pop>
    </>
  );
};
