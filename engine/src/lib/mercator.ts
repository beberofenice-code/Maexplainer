import type { LngLat } from "../types";
import type { CameraState } from "./camera";

/** World size in px at zoom z (MapLibre convention: 512 px tiles at z). */
export const worldSize = (zoom: number) => 512 * Math.pow(2, zoom);
/** CSS perspective distance used for pitch (must match mxp_common.PERSPECTIVE). */
export const PERSPECTIVE = 2200;
export const TILE_PX = 256;

export const lngLatToNorm = ([lng, lat]: LngLat): [number, number] => {
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat));
  const s = Math.sin((clamped * Math.PI) / 180);
  return [(lng + 180) / 360, 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)];
};

export const normToLngLat = (u: number, v: number): LngLat => {
  const lng = u * 360 - 180;
  const n = Math.PI - 2 * Math.PI * v;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
};

/** Satellite tile zoom used for a camera zoom (must match mxp_common.tile_zoom_for). */
export const tileZoomFor = (zoom: number, maxZoom: number) =>
  Math.max(1, Math.min(maxZoom, Math.floor(zoom + 1 + 0.35)));

export interface Viewport {
  W: number;
  H: number;
  cam: CameraState;
  world: number;
  /** plane px (unrotated, unpitched map plane, screen-sized) for a lngLat */
  plane: (ll: LngLat) => [number, number];
  /** final screen px for a lngLat, after bearing + pitch */
  screen: (ll: LngLat) => [number, number];
  /** perspective scale factor at a lngLat (1 = no foreshortening) */
  depthScale: (ll: LngLat) => number;
  /** visible map-plane bbox [minX,minY,maxX,maxY] in plane px */
  planeBounds: [number, number, number, number];
}

export const makeViewport = (W: number, H: number, cam: CameraState): Viewport => {
  const world = worldSize(cam.zoom);
  const a = (cam.pitch * Math.PI) / 180;
  const b = (-cam.bearing * Math.PI) / 180;
  const cx = W / 2;
  const cy = H / 2;
  const d = PERSPECTIVE;
  const plane = (ll: LngLat): [number, number] => {
    const [u, v] = lngLatToNorm(ll);
    return [(u - cam.u) * world + cx, (v - cam.v) * world + cy];
  };
  const toScreen = (px: number, py: number): [number, number, number] => {
    const x = px - cx;
    const y = py - cy;
    const xr = x * Math.cos(b) - y * Math.sin(b);
    const yr = x * Math.sin(b) + y * Math.cos(b);
    const k = d / (d - yr * Math.sin(a));
    return [cx + xr * k, cy + yr * Math.cos(a) * k, k];
  };
  // inverse: screen -> plane (for tile / clip coverage)
  const toPlane = (sx: number, sy: number): [number, number] => {
    const X = sx - cx;
    const Y = sy - cy;
    const yr = (Y * d) / (d * Math.cos(a) + Y * Math.sin(a));
    const xr = (X * (d - yr * Math.sin(a))) / d;
    const x = xr * Math.cos(-b) - yr * Math.sin(-b);
    const y = xr * Math.sin(-b) + yr * Math.cos(-b);
    return [x + cx, y + cy];
  };
  const pts: [number, number][] = [];
  for (const fx of [0, 0.5, 1]) for (const fy of [0, 0.5, 1]) pts.push(toPlane(fx * W, fy * H));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const m = 64;
  const planeBounds: [number, number, number, number] = [
    Math.min(...xs) - m,
    Math.min(...ys) - m,
    Math.max(...xs) + m,
    Math.max(...ys) + m,
  ];
  return {
    W,
    H,
    cam,
    world,
    plane,
    screen: (ll) => {
      const [px, py] = plane(ll);
      const s = toScreen(px, py);
      return [s[0], s[1]];
    },
    depthScale: (ll) => {
      const [px, py] = plane(ll);
      return toScreen(px, py)[2];
    },
    planeBounds,
  };
};

/** Tiles (x,y) at zoom z intersecting the visible plane bounds. Mirrors mxp_common.visible_tiles(). */
export const visibleTiles = (vp: Viewport, z: number): { x: number; xu: number; y: number }[] => {
  const n = Math.pow(2, z);
  const [x0, y0, x1, y1] = vp.planeBounds;
  const toNorm = (px: number, py: number) => [vp.cam.u + (px - vp.W / 2) / vp.world, vp.cam.v + (py - vp.H / 2) / vp.world];
  const [u0, v0] = toNorm(x0, y0);
  const [u1, v1] = toNorm(x1, y1);
  const tx0 = Math.floor(u0 * n);
  const tx1 = Math.floor(u1 * n);
  const ty0 = Math.max(0, Math.floor(v0 * n));
  const ty1 = Math.min(n - 1, Math.floor(v1 * n));
  const out: { x: number; xu: number; y: number }[] = [];
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) out.push({ x: ((x % n) + n) % n, xu: x, y });
  return out;
};

export const haversineKm = (a: LngLat, b: LngLat) => {
  const R = 6371.0088;
  const toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR;
  const dLng = (b[0] - a[0]) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const formatDistance = (km: number) => {
  const mi = km * 0.621371;
  if (km < 1) return `${Math.round(km * 1000)} m (${Math.round(km * 3280.84)} ft)`;
  const f = (x: number) => (x < 10 ? x.toFixed(1) : Math.round(x).toLocaleString("en-US"));
  return `${f(km)} km (${f(mi)} mi)`;
};
