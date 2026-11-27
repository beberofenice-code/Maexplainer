import type { CameraKeyframe, Easing } from "../types";
import type { SceneClock } from "./timing";
import { lngLatToNorm } from "./mercator";

export interface CameraState {
  /** Web-Mercator normalized center (0..1). */
  u: number;
  v: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export const EASINGS: Record<Easing, (x: number) => number> = {
  linear: (x) => x,
  easeInOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  easeOutQuart: (x) => 1 - Math.pow(1 - x, 4),
  easeInOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
  easeOutBack: (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
};

const kfState = (k: CameraKeyframe): CameraState => {
  const [u, v] = lngLatToNorm(k.center);
  return { u, v, zoom: k.zoom, pitch: k.pitch ?? 0, bearing: k.bearing ?? 0 };
};

/**
 * Interpolate between two camera states with parameter e in [0,1].
 * Zoom is linear (=> exponential scale); the center is interpolated so that the
 * point of interest moves at constant *screen* speed (no "swoosh" at the end of
 * a deep zoom). Must match mxp_common.interp_camera().
 */
export const interpCamera = (a: CameraState, b: CameraState, e: number): CameraState => {
  const zoom = a.zoom + (b.zoom - a.zoom) * e;
  const sA = Math.pow(2, a.zoom);
  const sB = Math.pow(2, b.zoom);
  const s = Math.pow(2, zoom);
  let u: number;
  let v: number;
  if (Math.abs(b.zoom - a.zoom) < 1e-3) {
    u = a.u + (b.u - a.u) * e;
    v = a.v + (b.v - a.v) * e;
  } else if (b.zoom > a.zoom) {
    const k = (sA * (1 - e)) / s;
    u = b.u - (b.u - a.u) * k;
    v = b.v - (b.v - a.v) * k;
  } else {
    const k = (sB * e) / s;
    u = a.u + (b.u - a.u) * k;
    v = a.v + (b.v - a.v) * k;
  }
  return {
    u,
    v,
    zoom,
    pitch: a.pitch + (b.pitch - a.pitch) * e,
    bearing: a.bearing + (b.bearing - a.bearing) * e,
  };
};

export const cameraAt = (keys: CameraKeyframe[], clock: SceneClock, t: number): CameraState => {
  if (keys.length === 0) return { u: 0.5, v: 0.5, zoom: 2, pitch: 0, bearing: 0 };
  const times = keys.map((k, i) => clock.at(k, i === 0 ? 0 : clock.duration));
  if (t <= times[0]) return kfState(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (t <= times[i]) {
      const span = Math.max(1e-6, times[i] - times[i - 1]);
      const x = (t - times[i - 1]) / span;
      const ease = EASINGS[keys[i].easing ?? "easeInOutCubic"] ?? EASINGS.easeInOutCubic;
      return interpCamera(kfState(keys[i - 1]), kfState(keys[i]), ease(x));
    }
  }
  return kfState(keys[keys.length - 1]);
};
