// Captions on every word, graphics on cue: kinetic words on blue; on "graphics" a ring, a star and a tag burst in.
import React from "react";
import { AbsoluteFill } from "reelkit/frame";

type ShotProps = any;

export const Graphics = ({ words, frames, cue, c, face, body, ui }: ShotProps) => {
  const { KineticLine, Push, Pop } = ui;
  const g = cue.graphics;
  return (
    <AbsoluteFill style={{ backgroundColor: c.blue }}>
      <Push frames={frames} hits={[cue.captions, g]} zoom={1.08}>
        <KineticLine words={words} face={face} ink={c.cream} accent={c.yellow} emphasis={["captions", "word", "graphics"]} y={800} />
        <Pop at={g} from="scale" feel="bouncy" x={210} y={330}>
          <div style={{ width: 190, height: 190, borderRadius: "50%", border: `26px solid ${c.yellow}` }} />
        </Pop>
        <Pop at={g + 4} from="spin" feel="bouncy" x={880} y={1290}>
          <svg width={220} height={220} viewBox="-50 -50 100 100">
            <polygon fill={c.accent} points={Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 20 : 48; const a = (Math.PI / 5) * i - Math.PI / 2; return `${r * Math.cos(a)},${r * Math.sin(a)}`; }).join(" ")} />
          </svg>
        </Pop>
        <Pop at={g + 8} from="left" x={300} y={1330} rot={-6}>
          <div style={{ background: c.cream, color: c.black, fontFamily: body, fontWeight: 800, fontSize: 64, padding: "14px 34px", borderRadius: 18 }}>+ GRAPHICS</div>
        </Pop>
      </Push>
    </AbsoluteFill>
  );
};
