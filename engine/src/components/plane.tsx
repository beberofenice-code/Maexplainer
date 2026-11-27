import React, { useMemo } from "react";
import { geoMercator } from "d3-geo";
import { clamp01, presence } from "../lib/anim";
import { resolveColor } from "../lib/colors";
import { featurePath, geometryPath } from "../lib/paths";
import { colorOf, lngLatOf, type ElementProps } from "./ctx";
import type { LngLat } from "../types";

/* Elements rendered INSIDE the pitched/rotated map plane SVG (they stick to the ground). */

const unitMercator = geoMercator().scale(1 / (2 * Math.PI)).translate([0.5, 0.5]).precision(0);

/** Animated glowing bar along a border line feature (or inline coordinates). */
export const GlowingBorderBar: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const c = colorOf(spec, ctx, "highlight");
  const p = presence(ctx.frame, startF, endF, 4, 10);
  const draw = 1 - Math.pow(1 - clamp01((ctx.frame - startF) / Math.round(ctx.fps * ((spec.draw_s as number) ?? 1.0))), 3);
  const pulse = 0.65 + 0.35 * Math.sin((ctx.frame - startF) / 5);
  const width = (spec.width as number) ?? 9;
  let d = "";
  const f = spec.feature ? ctx.assets.features.get(spec.feature as string) : undefined;
  if (f) d = featurePath(f, ctx.vp);
  else if (Array.isArray(spec.coordinates)) {
    const coords = (spec.coordinates as LngLat[]).map((ll) => unitMercator(ll) as [number, number]);
    d = geometryPath({ type: "LineString", coordinates: coords }, ctx.vp);
  }
  if (!d) return null;
  return (
    <g opacity={p}>
      <path d={d} pathLength={1} strokeDasharray={`${draw} 1`} fill="none" stroke={c.fill} strokeWidth={width * 4} strokeOpacity={0.55 * pulse} filter="url(#mxp-glow)" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} pathLength={1} strokeDasharray={`${draw} 1`} fill="none" stroke={c.fill} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} pathLength={1} strokeDasharray={`${draw} 1`} fill="none" stroke="#FFFFFF" strokeWidth={width * 0.35} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </g>
  );
};

/**
 * Sovereignty that flips between two owners: a glowing wavy spline sweeps across the
 * feature, repainting it in the new owner's locked color. One flip every `period_s`.
 */
export const ShiftingBorderSpline: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const f = ctx.assets.features.get(spec.feature as string);
  if (!f) return null;
  const [k0, k1] = (spec.colors as [string, string]) ?? ["spain", "france"];
  const cols = [resolveColor(k0, ctx.assets.colors), resolveColor(k1, ctx.assets.colors)];
  const p = presence(ctx.frame, startF, endF, 8, 10);
  const periodF = Math.round(((spec.period_s as number) ?? 1.6) * ctx.fps);
  const sweepF = Math.round(((spec.sweep_s as number) ?? 0.6) * ctx.fps);
  const flips = (spec.flips as number) ?? 3;
  const local = ctx.frame - startF;
  // flip k starts at (k+1)*periodF - sweepF  (matches sound_engine border_flip cues)
  let owner = 0;
  let sweep = -1;
  for (let k = 0; k < flips; k++) {
    const fs = (k + 1) * periodF - sweepF;
    if (local >= fs + sweepF) owner = 1 - owner;
    else if (local >= fs) {
      sweep = (local - fs) / sweepF;
      break;
    }
  }
  const d = featurePath(f, ctx.vp);
  if (!d) return null;
  // bbox in plane px
  const [x0, y0] = ctx.vp.plane([f.bboxLL[0], f.bboxLL[3]]);
  const [x1, y1] = ctx.vp.plane([f.bboxLL[2], f.bboxLL[1]]);
  const pad = Math.max(40, (x1 - x0) * 0.25);
  const id = `sbs-${spec.id ?? spec.feature}`;
  let clip: React.ReactNode = null;
  let edge: React.ReactNode = null;
  if (sweep >= 0) {
    const e = sweep < 0.5 ? 4 * sweep ** 3 : 1 - Math.pow(-2 * sweep + 2, 3) / 2;
    const sx = x0 - pad + (x1 - x0 + 2 * pad) * e;
    const h = y1 - y0 + 2 * pad;
    const amp = (x1 - x0) * 0.12 + 10;
    const top = y0 - pad;
    const spline = `M${sx},${top} C${sx + amp},${top + h * 0.33} ${sx - amp},${top + h * 0.66} ${sx},${top + h}`;
    clip = (
      <clipPath id={id}>
        <path d={`M${x0 - pad * 3},${top} L${sx},${top} C${sx + amp},${top + h * 0.33} ${sx - amp},${top + h * 0.66} ${sx},${top + h} L${x0 - pad * 3},${top + h} Z`} />
      </clipPath>
    );
    edge = (
      <g>
        <path d={spline} stroke="#FFE600" strokeWidth={22} strokeOpacity={0.6} fill="none" filter="url(#mxp-glow)" />
        <path d={spline} stroke="#FFFFFF" strokeWidth={6} fill="none" />
      </g>
    );
  }
  const cur = cols[owner];
  const next = cols[1 - owner];
  return (
    <g opacity={p}>
      <defs>{clip}</defs>
      <path d={d} fill={cur.fill} fillOpacity={0.78} fillRule="evenodd" />
      {sweep >= 0 ? <path d={d} fill={next.fill} fillOpacity={0.85} fillRule="evenodd" clipPath={`url(#${id})`} /> : null}
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinejoin="round" />
      {edge}
    </g>
  );
};

/**
 * True-scale comparison: re-centers a city polygon over a target while preserving its real
 * ground size (local km offsets, then re-projected), and slides it in from above.
 */
export const TrueScaleCityCompare: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const f = ctx.assets.features.get(spec.feature as string);
  const target = lngLatOf(spec, ctx, "target");
  const geom = useMemo(() => {
    if (!f || !target || !f.rawGeometry) return null;
    const [x0, y0, x1, y1] = f.bboxLL;
    const lng0 = (x0 + x1) / 2;
    const lat0 = (y0 + y1) / 2;
    const k0 = Math.cos((lat0 * Math.PI) / 180);
    const k1 = Math.cos((target[1] * Math.PI) / 180);
    const map = (c: any): any =>
      typeof c[0] === "number"
        ? unitMercator([target[0] + ((c[0] - lng0) * k0) / k1, target[1] + (c[1] - lat0)])
        : c.map(map);
    return { type: f.rawGeometry.type, coordinates: map(f.rawGeometry.coordinates) };
  }, [f, target?.[0], target?.[1]]);
  if (!geom) return null;
  const c = colorOf({ ...spec, color: spec.color ?? "nyc_size_overlay" }, ctx);
  const p = presence(ctx.frame, startF, endF, 6, 10);
  const slide = clamp01((ctx.frame - startF) / Math.round(ctx.fps * ((spec.slide_s as number) ?? 1.0)));
  const e = 1 - Math.pow(1 - slide, 4);
  const offY = (1 - e) * -ctx.vp.H * 0.7;
  const d = geometryPath(geom, ctx.vp);
  return (
    <g opacity={p} transform={`translate(0, ${offY})`}>
      <path d={d} fill={c.tint} fillRule="evenodd" />
      <path d={d} fill="none" stroke={c.glow} strokeWidth={14} filter="url(#mxp-glow)" />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinejoin="round" />
    </g>
  );
};
