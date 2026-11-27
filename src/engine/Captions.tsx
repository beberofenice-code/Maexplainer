import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CaptionCue } from "../types/scene";
import { THEME } from "../styles/theme";

export const Captions: React.FC<{ cues: CaptionCue[] }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const active = cues.find((c) => frame >= c.startFrame && frame <= c.endFrame);
  if (!active) return null;

  const progress = interpolate(frame, [active.startFrame, active.startFrame + 4], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 430,
        display: "flex",
        justifyContent: "center",
        padding: "0 72px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: THEME.fonts.body,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.25,
          textAlign: "center",
          color: "#FFFFFF",
          textShadow: "0 4px 16px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,1)",
          opacity: progress,
          transform: `translateY(${(1 - progress) * 8}px)`,
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
