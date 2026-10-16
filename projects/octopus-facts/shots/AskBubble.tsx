// Soft CTA: a speech bubble "Which fact got you?" pops on "Tell", three answer chips (3 hearts / blue / 9) follow.
import React from "react";

type ShotProps = any;

export const AskBubble = ({ cue, c, face, body, ui }: ShotProps) => {
  const { Pop, Tag } = ui;
  const chips: [string, string][] = [["3 HEARTS", c.accent], ["BLUE BLOOD", c.blue], ["9 BRAINS", c.ink]];
  return (
    <>
      <Pop at={cue.ask} from="scale" feel="bouncy" x={540} y={520}>
        <div style={{ position: "relative", background: c.paper, border: `6px solid ${c.ink}`, borderRadius: 60, padding: "50px 64px", boxShadow: `12px 14px 0 ${c.ink}` }}>
          <div style={{ fontFamily: face, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: c.ink, textAlign: "center", whiteSpace: "nowrap" }}>WHICH FACT<br />GOT YOU?</div>
          <div style={{ position: "absolute", left: 120, bottom: -58, width: 0, height: 0, borderLeft: "34px solid transparent", borderRight: "34px solid transparent", borderTop: `58px solid ${c.ink}` }} />
        </div>
      </Pop>
      {chips.map(([t, bg], i) => (
        <Pop key={t} at={cue.ask + 10 + i * 5} from="rise" x={540} y={880 + i * 110}>
          <Tag text={t} bg={bg} ink={c.paper} face={body} size={44} />
        </Pop>
      ))}
    </>
  );
};
