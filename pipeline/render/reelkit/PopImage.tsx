// A prepared picture overlay (a logo on its card, a product image, a flat icon) shown at its exact pixel
// size with a soft drop shadow. Use it inside PopMotion to make a logo or gadget pop in on its word.
import React from "react";
import { Img, useVideoConfig } from "reelkit/frame";

export const PopImage: React.FC<{
  src: string;
  // Pixel size the PNG was prepared at, for a 1080-wide frame.
  w: number;
  h: number;
  shadow?: boolean;
}> = ({ src, w, h, shadow = true }) => {
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  return (
    <Img
      src={src}
      style={{
        display: "block",
        width: w * k,
        height: h * k,
        filter: shadow ? `drop-shadow(0 ${10 * k}px ${24 * k}px rgba(0,0,0,0.45))` : undefined,
      }}
    />
  );
};
