import React from "react";
import type { ProjectAssets } from "../lib/assets";
import { resolveColor } from "../lib/colors";
import { featurePath } from "../lib/paths";
import type { Viewport } from "../lib/mercator";
import { presence } from "../lib/anim";
import type { LayerSpec } from "../types";
import type { SceneClock } from "../lib/timing";

export const PlaneDefs: React.FC<{ hatch: string }> = ({ hatch }) => (
  <defs>
    <pattern id="mxp-hatch" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)">
      <rect width="18" height="18" fill="transparent" />
      <line x1="0" y1="0" x2="0" y2="18" stroke={hatch} strokeWidth="4.5" strokeOpacity="0.9" />
    </pattern>
    <filter id="mxp-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="7" />
    </filter>
    <filter id="mxp-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" />
    </filter>
  </defs>
);

/** Context countries: dark land + dark-grey borders (dark_cutaway) or faint white borders (satellite). */
export const ContextLayer: React.FC<{ vp: Viewport; assets: ProjectAssets; mode: "satellite" | "dark_cutaway"; show: boolean }> = ({
  vp,
  assets,
  mode,
  show,
}) => {
  const dc = assets.colors.defaults.dark_cutaway;
  if (mode === "satellite" && !show) return null;
  return (
    <g>
      {assets.context.map((f) => {
        const d = featurePath(f, vp);
        if (!d) return null;
        return mode === "dark_cutaway" ? (
          <path key={f.id} d={d} fill={dc.land} stroke={dc.border} strokeWidth={2} fillRule="evenodd" strokeLinejoin="round" />
        ) : (
          <path key={f.id} d={d} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.6} strokeLinejoin="round" />
        );
      })}
    </g>
  );
};

export const FeatureLayer: React.FC<{
  spec: LayerSpec;
  vp: Viewport;
  assets: ProjectAssets;
  clock: SceneClock;
  frame: number;
  fps: number;
  mode: "satellite" | "dark_cutaway";
}> = ({ spec, vp, assets, clock, frame, fps, mode }) => {
  const f = assets.features.get(spec.feature);
  if (!f) return null;
  const startF = Math.round(clock.at(spec) * fps);
  const endF = Math.round(clock.until(spec) * fps);
  if (frame < startF || frame > endF + 10) return null;
  const p = presence(frame, startF, endF, 12, 10);
  if (p <= 0) return null;
  const c = resolveColor(spec.color ?? f.colorKey ?? f.id, assets.colors);
  const dc = assets.colors.defaults.dark_cutaway;
  const style = spec.style ?? (f.kind === "line" ? "line" : mode === "dark_cutaway" ? "hatch" : "tint");
  const width = spec.width ?? 4;

  if (style === "line" || f.kind === "line") {
    const d = featurePath(f, vp);
    return (
      <g opacity={p}>
        <path d={d} fill="none" stroke={c.glow} strokeWidth={width * 3.5} filter="url(#mxp-glow)" strokeLinecap="round" />
        <path d={d} fill="none" stroke={c.fill} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }

  if (style === "hatch") {
    const lift = (spec.lift ?? 14) * p;
    const d = featurePath(f, vp, 0, -lift);
    const shadow = featurePath(f, vp, 0, lift * 0.6);
    return (
      <g opacity={Math.min(1, p * 1.4)}>
        <path d={shadow} fill="rgba(0,0,0,0.75)" filter="url(#mxp-shadow)" fillRule="evenodd" />
        <path d={d} fill={c.fill} fillRule="evenodd" />
        <path d={d} fill="url(#mxp-hatch)" fillRule="evenodd" opacity={0.55} />
        <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={3.5} strokeLinejoin="round" />
      </g>
    );
  }

  const d = featurePath(f, vp);
  if (!d) return null;
  if (style === "silhouette") {
    return (
      <g opacity={p}>
        <path d={d} fill={dc.silhouette} fillRule="evenodd" />
        <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={3} strokeDasharray="14 10" strokeLinejoin="round" />
      </g>
    );
  }
  if (style === "flat") {
    return (
      <g opacity={p}>
        <path d={d} fill={c.fill} fillRule="evenodd" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" />
      </g>
    );
  }
  if (style === "outline") {
    return (
      <g opacity={p}>
        <path d={d} fill="none" stroke={c.glow} strokeWidth={width * 3} filter="url(#mxp-glow)" />
        <path d={d} fill="none" stroke={c.border} strokeWidth={width} strokeLinejoin="round" />
      </g>
    );
  }
  // tint / highlight (satellite)
  const hl = style === "highlight";
  const hlColor = resolveColor("highlight", assets.colors);
  return (
    <g opacity={p}>
      <path d={d} fill={spec.opacity !== undefined ? c.fill : c.tint} fillOpacity={spec.opacity ?? 1} fillRule="evenodd" />
      <path d={d} fill="none" stroke={hl ? hlColor.fill : c.glow} strokeWidth={width * 3.2} strokeOpacity={0.85} filter="url(#mxp-glow)" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={hl ? hlColor.fill : c.border} strokeWidth={width} strokeLinejoin="round" />
    </g>
  );
};
