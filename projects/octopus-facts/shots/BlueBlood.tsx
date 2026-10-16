// "BLUE BLOOD": the headline's marker turns blue on "blue"; a Cu element tile pops with a check on "copper", an Fe
// tile drops in and gets stamped NOPE on "iron".
import React from "react";

type ShotProps = any;

const Tile = ({ sym, name, n, bg, ink, face, body }: { sym: string; name: string; n: number; bg: string; ink: string; face: string; body: string }) => (
  <div style={{ width: 300, height: 340, background: bg, color: ink, borderRadius: 28, border: "5px solid #14213D", boxShadow: "10px 12px 0 #14213D", padding: 26, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <div style={{ fontFamily: body, fontWeight: 700, fontSize: 38 }}>{n}</div>
    <div style={{ fontFamily: face, fontWeight: 900, fontSize: 140, lineHeight: 1, textAlign: "center" }}>{sym}</div>
    <div style={{ fontFamily: body, fontWeight: 700, fontSize: 36, textAlign: "center" }}>{name}</div>
  </div>
);

export const BlueBlood = ({ cue, c, face, body, ui }: ShotProps) => {
  const { Pop, BigText, Stamp, Doodle } = ui;
  return (
    <>
      <Pop at={0} from="rise" x={540} y={300}>
        <BigText text={["BLUE", "BLOOD"]} color={c.ink} face={face} size={170} mark={[0]} markAt={cue.blue} markColor={c.blue} markInk={c.paper} />
      </Pop>
      <Pop at={cue.copper} from="scale" feel="bouncy" x={330} y={850} rot={-4}>
        <Tile sym="Cu" name="COPPER" n={29} bg={c.blue} ink={c.paper} face={face} body={body} />
      </Pop>
      <Pop at={cue.copper + 8} from="none" x={330} y={1080}>
        <Doodle kind="check" w={140} h={110} at={cue.copper + 8} color={c.accent} stroke={14} />
      </Pop>
      <Pop at={cue.iron} from="drop" x={760} y={850} rot={5}>
        <Tile sym="Fe" name="IRON" n={26} bg={c.paper} ink={c.muted} face={face} body={body} />
      </Pop>
      <Pop at={cue.iron + 6} from="none" x={760} y={850}>
        <Stamp text="NOPE" at={cue.iron + 6} color={c.accent} face={face} size={96} rot={-14} />
      </Pop>
    </>
  );
};
