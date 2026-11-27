import type { ProjectAssets } from "../lib/assets";
import type { Viewport } from "../lib/mercator";
import type { SceneClock } from "../lib/timing";
import type { ElementSpec, LngLat } from "../types";
import { resolveColor, type ResolvedColor } from "../lib/colors";

export interface ElementCtx {
  vp: Viewport;
  assets: ProjectAssets;
  clock: SceneClock;
  frame: number;
  fps: number;
  mode: "satellite" | "dark_cutaway";
}

export interface ElementProps {
  spec: ElementSpec;
  ctx: ElementCtx;
  startF: number;
  endF: number;
}

export const FONT = "'Montserrat', 'Inter Display', 'Inter', 'DejaVu Sans', sans-serif";

export const TEXT_SHADOW =
  "0 0 2px #000, 0 3px 0 rgba(0,0,0,0.85), 3px 0 0 rgba(0,0,0,0.6), -3px 0 0 rgba(0,0,0,0.6), 0 -2px 0 rgba(0,0,0,0.6), 0 8px 22px rgba(0,0,0,0.55)";

/** Resolve `${key}` (lngLat), `${key}_pct` (screen %), or `${key}_feature` (feature center) to screen px. */
export const point = (spec: ElementSpec, ctx: ElementCtx, key = "at"): [number, number] | null => {
  const ll = spec[key] as LngLat | undefined;
  if (Array.isArray(ll)) return ctx.vp.screen(ll);
  const pct = spec[`${key}_pct`] as [number, number] | undefined;
  if (Array.isArray(pct)) return [(pct[0] / 100) * ctx.vp.W, (pct[1] / 100) * ctx.vp.H];
  const fid = spec[`${key}_feature`] as string | undefined;
  if (fid) {
    const ll2 = featureCenter(ctx, fid);
    if (ll2) return ctx.vp.screen(ll2);
  }
  return null;
};

export const lngLatOf = (spec: ElementSpec, ctx: ElementCtx, key: string): LngLat | null => {
  if (Array.isArray(spec[key])) return spec[key] as LngLat;
  const fid = spec[`${key}_feature`] as string | undefined;
  return fid ? featureCenter(ctx, fid) : null;
};

export const featureCenter = (ctx: ElementCtx, id: string): LngLat | null => {
  const f = ctx.assets.features.get(id) ?? ctx.assets.context.find((c) => c.id === id);
  if (!f) return null;
  const [x0, y0, x1, y1] = f.bboxLL;
  return [(x0 + x1) / 2, (y0 + y1) / 2];
};

export const colorOf = (spec: ElementSpec, ctx: ElementCtx, fallback = "highlight"): ResolvedColor =>
  resolveColor((spec.color as string | undefined) ?? fallback, ctx.assets.colors);
