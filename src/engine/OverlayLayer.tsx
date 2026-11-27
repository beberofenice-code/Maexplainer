import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CalloutItem } from "../types/scene";
import { THEME } from "../styles/theme";

const FlagGraphic: React.FC<{ code: NonNullable<CalloutItem["flagCode"]>; width?: number }> = ({
  code,
  width = 140,
}) => {
  const height = Math.round(width * 0.65);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 91"
      style={{
        borderRadius: 6,
        border: "3px solid #FFFFFF",
        boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
      }}
    >
      {code === "ES" && (
        <>
          <rect width="140" height="23" y="0" fill="#AA151B" />
          <rect width="140" height="45" y="23" fill="#F1BF00" />
          <rect width="140" height="23" y="68" fill="#AA151B" />
          <rect x="30" y="34" width="16" height="22" rx="3" fill="#AA151B" stroke="#854D0E" strokeWidth="2" />
        </>
      )}
      {code === "FR" && (
        <>
          <rect width="47" height="91" x="0" fill="#002395" />
          <rect width="46" height="91" x="47" fill="#FFFFFF" />
          <rect width="47" height="91" x="93" fill="#ED2939" />
        </>
      )}
      {code === "UK" && (
        <>
          <rect width="140" height="91" fill="#012169" />
          <path d="M0,0 L140,91 M140,0 L0,91" stroke="#FFFFFF" strokeWidth="18" />
          <path d="M0,0 L140,91 M140,0 L0,91" stroke="#C8102E" strokeWidth="8" />
          <path d="M70,0 V91 M0,45.5 H140" stroke="#FFFFFF" strokeWidth="24" />
          <path d="M70,0 V91 M0,45.5 H140" stroke="#C8102E" strokeWidth="14" />
        </>
      )}
      {code === "AD" && (
        <>
          <rect width="47" height="91" x="0" fill="#10069F" />
          <rect width="46" height="91" x="47" fill="#FEDD00" />
          <rect width="47" height="91" x="93" fill="#D50032" />
        </>
      )}
      {code === "MA" && (
        <>
          <rect width="140" height="91" fill="#C1272D" />
          <polygon
            points="70,22 76,41 96,41 80,53 86,72 70,60 54,72 60,53 44,41 64,41"
            fill="none"
            stroke="#006233"
            strokeWidth="4"
          />
        </>
      )}
    </svg>
  );
};

export const OverlayLayer: React.FC<{ callouts: CalloutItem[] }> = ({ callouts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const active = callouts.filter((c) => frame >= c.startFrame && frame <= c.endFrame);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {active.map((item) => {
        const localFrame = frame - item.startFrame;
        const pop = spring({
          frame: localFrame,
          fps,
          config: { damping: 14, stiffness: 180, mass: 0.7 },
        });
        const fadeOut = interpolate(
          frame,
          [item.endFrame - 6, item.endFrame],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const opacity = Math.min(1, pop) * fadeOut;

        const basePos: React.CSSProperties = {
          position: "absolute",
          left: `${item.xPct}%`,
          top: `${item.yPct}%`,
          transform: `translate(-50%, -50%) scale(${(item.scale ?? 1) * (0.85 + 0.15 * pop)}) rotate(${item.rotationDeg ?? 0}deg)`,
          opacity,
        };

        if (item.kind === "countryLabel") {
          return (
            <div
              key={item.id}
              style={{
                ...basePos,
                fontFamily: THEME.fonts.display,
                fontWeight: 900,
                fontSize: 64,
                letterSpacing: "0.02em",
                color: item.color ?? THEME.colors.white,
                textShadow: "0 6px 20px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.95)",
                whiteSpace: "nowrap",
              }}
            >
              {item.text}
            </div>
          );
        }

        if (item.kind === "pinLabel") {
          return (
            <div key={item.id} style={{ ...basePos, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  fontFamily: THEME.fonts.display,
                  fontWeight: 800,
                  fontSize: 40,
                  color: THEME.colors.white,
                  textShadow: "0 4px 14px rgba(0,0,0,0.9)",
                  marginBottom: 8,
                  whiteSpace: "nowrap",
                }}
              >
                {item.text}
              </div>
              <div style={{ width: 4, height: 34, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.7)" }} />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  boxShadow: "0 0 12px rgba(255,255,255,0.9)",
                }}
              />
            </div>
          );
        }

        if (item.kind === "hookBanner") {
          return (
            <div
              key={item.id}
              style={{
                ...basePos,
                fontFamily: THEME.fonts.display,
                fontWeight: 900,
                fontSize: 54,
                lineHeight: 1.1,
                textAlign: "center",
                color: THEME.colors.white,
                textShadow: "0 6px 22px rgba(0,0,0,0.9)",
              }}
            >
              {item.accentWord && (
                <span
                  style={{
                    color: "#FFFFFF",
                    textShadow: "0 0 24px #EF4444, 0 0 42px #EF4444",
                    marginRight: 12,
                  }}
                >
                  {item.accentWord}
                </span>
              )}
              <span>{item.text}</span>
            </div>
          );
        }

        if (item.kind === "counter" && item.counterSteps) {
          let currentVal = item.counterSteps[0]?.value ?? 1;
          for (const step of item.counterSteps) {
            if (frame >= step.frame) currentVal = step.value;
          }
          return (
            <div
              key={item.id}
              style={{
                ...basePos,
                fontFamily: THEME.fonts.display,
                fontWeight: 900,
                fontSize: 132,
                color: THEME.colors.accentYellow,
                textShadow: "0 10px 28px rgba(0,0,0,0.85)",
              }}
            >
              {currentVal}
            </div>
          );
        }

        if (item.kind === "questionMarks") {
          const offsets = [-120, -60, 0, 60, 120];
          return (
            <div key={item.id} style={{ ...basePos, display: "flex", gap: 18 }}>
              {offsets.map((_, idx) => {
                const delay = idx * 4;
                const s = spring({ frame: Math.max(0, localFrame - delay), fps, config: { damping: 10 } });
                return (
                  <span
                    key={idx}
                    style={{
                      fontFamily: THEME.fonts.display,
                      fontWeight: 900,
                      fontSize: 72,
                      color: THEME.colors.accentYellow,
                      textShadow: "0 6px 14px rgba(0,0,0,0.85)",
                      transform: `scale(${s}) translateY(${(idx % 2) * 14}px)`,
                    }}
                  >
                    ?
                  </span>
                );
              })}
            </div>
          );
        }

        if (item.kind === "distanceBadge") {
          return (
            <div
              key={item.id}
              style={{
                ...basePos,
                fontFamily: THEME.fonts.display,
                fontWeight: 900,
                fontSize: 44,
                lineHeight: 1.15,
                textAlign: "center",
                color: item.color ?? THEME.colors.accentYellow,
                textShadow: "0 4px 16px rgba(0,0,0,0.95)",
              }}
            >
              <div>{item.text}</div>
              {item.subtext && <div style={{ fontSize: 32, opacity: 0.95 }}>{item.subtext}</div>}
            </div>
          );
        }

        if (item.kind === "populationBadge") {
          return (
            <div
              key={item.id}
              style={{
                ...basePos,
                background: "rgba(37, 99, 235, 0.92)",
                border: "3px solid #93C5FD",
                borderRadius: 16,
                padding: "10px 24px",
                fontFamily: THEME.fonts.display,
                fontWeight: 900,
                fontSize: 36,
                color: "#FFFFFF",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {item.text}
            </div>
          );
        }

        if (item.kind === "flag" && item.flagCode) {
          return (
            <div key={item.id} style={basePos}>
              <FlagGraphic code={item.flagCode} width={150} />
            </div>
          );
        }

        if (item.kind === "pheasantTugOfWar") {
          const tug = Math.sin(localFrame * 0.45) * 14;
          return (
            <div key={item.id} style={{ ...basePos, width: 320, height: 420 }}>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 30 + tug,
                  transform: "translateX(-50%) rotate(8deg)",
                }}
              >
                <FlagGraphic code="FR" width={145} />
                <svg width="145" height="90" viewBox="0 0 145 90" style={{ overflow: "visible" }}>
                  <path d="M25,0 Q15,45 40,85" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <path d="M120,0 Q130,45 105,85" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 30 - tug,
                  transform: "translateX(-50%) rotate(-6deg)",
                }}
              >
                <svg width="145" height="90" viewBox="0 0 145 90" style={{ overflow: "visible" }}>
                  <path d="M25,90 Q15,45 40,5" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <path d="M120,90 Q130,45 105,5" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
                <FlagGraphic code="ES" width={145} />
              </div>
            </div>
          );
        }

        if (item.kind === "curvedArrow") {
          const draw = interpolate(localFrame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
          return (
            <svg
              key={item.id}
              width="240"
              height="240"
              viewBox="0 0 240 240"
              style={{ ...basePos, overflow: "visible" }}
            >
              <path
                d="M 190 25 Q 90 60 85 185"
                fill="none"
                stroke={item.color ?? "#FFFFFF"}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray="260"
                strokeDashoffset={260 * (1 - draw)}
                style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.8))" }}
              />
              {draw > 0.8 && (
                <path
                  d="M 65 162 L 85 190 L 108 166"
                  fill="none"
                  stroke={item.color ?? "#FFFFFF"}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          );
        }

        return null;
      })}
    </div>
  );
};
