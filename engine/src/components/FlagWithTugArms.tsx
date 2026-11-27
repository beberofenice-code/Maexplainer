import React from "react";
import { AbsoluteFill } from "remotion";
import { pop, presence } from "../lib/anim";
import { Flag } from "./Flags";
import { point, type ElementProps } from "./ctx";

/**
 * Two flags on poles with stick arms pulling a rope over a disputed spot.
 * The knot oscillates (tug-of-war); `winner` ("left" | "right") biases the end state.
 */
export const FlagWithTugArms: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const pt = point(spec, ctx) ?? [ctx.vp.W / 2, ctx.vp.H * 0.45];
  const p = presence(ctx.frame, startF, endF, 8, 8);
  const s = pop(ctx.frame, startF, 14) * ((spec.scale as number) ?? 1);
  const t = (ctx.frame - startF) / ctx.fps;
  const sway = Math.sin(t * 5.2) * 26 + Math.sin(t * 11.3) * 8;
  const spread = (spec.spread as number) ?? 300;
  const L = (spec.left as string) ?? "ES";
  const R = (spec.right as string) ?? "FR";
  const knotX = sway;
  const lean = sway / 6;
  const fig = (side: -1 | 1, code: string) => {
    const x = side * spread;
    const pull = side === -1 ? -lean : lean;
    return (
      <g transform={`translate(${x},0) rotate(${pull * side * -1})`}>
        {/* pole */}
        <line x1={side * 46} y1={-210} x2={side * 46} y2={40} stroke="#E8E8E8" strokeWidth={8} strokeLinecap="round" />
        {/* bent stick arms gripping the rope */}
        <path d={`M${side * 46},-78 L${-side * 6},${-46 + Math.sin(t * 9) * 4} L${-side * 62},-4`} stroke="#111" strokeWidth={17} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${side * 46},-78 L${-side * 6},${-46 + Math.sin(t * 9) * 4} L${-side * 62},-4`} stroke="#FFFFFF" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${side * 46},-34 L${-side * 14},${-12 + Math.cos(t * 9) * 4} L${-side * 70},4`} stroke="#111" strokeWidth={17} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${side * 46},-34 L${-side * 14},${-12 + Math.cos(t * 9) * 4} L${-side * 70},4`} stroke="#FFFFFF" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={-side * 64} cy={0} r={13} fill="#FFFFFF" stroke="#111" strokeWidth={4} />
        <foreignObject x={side === -1 ? side * 46 - 4 : side * 46 - 164} y={-215} width={170} height={116}>
          <Flag code={code} width={168} wave={Math.sin(t * 6 + side) * 3} />
        </foreignObject>
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <svg width={ctx.vp.W} height={ctx.vp.H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g transform={`translate(${pt[0]},${pt[1]}) scale(${s})`} style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.55))" }}>
          {/* rope */}
          <path d={`M${-spread + 70},3 Q${knotX / 2},${16 + Math.abs(sway) / 4} ${spread - 70},3`} stroke="#C79A5B" strokeWidth={14} fill="none" strokeLinecap="round" />
          <circle cx={knotX} cy={12} r={13} fill="#FFE600" stroke="#000" strokeWidth={3} />
          {fig(-1, L)}
          {fig(1, R)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
