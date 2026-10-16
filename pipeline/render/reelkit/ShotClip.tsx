// One shot of the film filling the frame: a muted video clip that is already cut to its slot, or a
// still picture with a slow Ken Burns move. Use it for every b-roll shot laid end to end on the timeline.
import React from "react";
import { AbsoluteFill, OffthreadVideo } from "reelkit/frame";
import { KenBurnsImage } from "reelkit/kit";

export const ShotClip: React.FC<{
  kind: "video" | "image";
  src: string;
  // Frames of this shot already played in an earlier scene (a shot can span a scene change).
  skip?: number;
  zoom?: "in" | "out";
  zoomAmount?: number;
}> = ({ kind, src, skip = 0, zoom = "in", zoomAmount = 1.12 }) => {
  if (kind === "image") return <KenBurnsImage src={src} direction={zoom} zoom={zoomAmount} />;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo src={src} muted startFrom={skip} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};
