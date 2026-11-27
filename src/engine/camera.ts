import { BasemapMode, CameraKeyframe, EasingName } from "../types/scene";

export interface CameraState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  basemap: BasemapMode;
}

const applyEasing = (t: number, easing: EasingName = "easeInOutCubic"): number => {
  const clamped = Math.max(0, Math.min(1, t));
  switch (easing) {
    case "linear":
      return clamped;
    case "easeOutQuart":
      return 1 - Math.pow(1 - clamped, 4);
    case "easeInOutQuart":
      return clamped < 0.5
        ? 8 * clamped * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 4) / 2;
    case "easeInOutCubic":
    default:
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
  }
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const interpolateCamera = (
  frame: number,
  keyframes: CameraKeyframe[]
): CameraState => {
  if (keyframes.length === 0) {
    return { center: [0, 20], zoom: 2, pitch: 0, bearing: 0, basemap: "satellite" };
  }
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  if (frame <= sorted[0].frame) {
    const first = sorted[0];
    return {
      center: first.center,
      zoom: first.zoom,
      pitch: first.pitch ?? 0,
      bearing: first.bearing ?? 0,
      basemap: first.basemap ?? "satellite",
    };
  }

  const last = sorted[sorted.length - 1];
  if (frame >= last.frame) {
    return {
      center: last.center,
      zoom: last.zoom,
      pitch: last.pitch ?? 0,
      bearing: last.bearing ?? 0,
      basemap: last.basemap ?? "satellite",
    };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const span = Math.max(1, b.frame - a.frame);
      const rawT = (frame - a.frame) / span;
      const t = applyEasing(rawT, b.easing ?? "easeInOutCubic");
      return {
        center: [lerp(a.center[0], b.center[0], t), lerp(a.center[1], b.center[1], t)],
        zoom: lerp(a.zoom, b.zoom, t),
        pitch: lerp(a.pitch ?? 0, b.pitch ?? 0, t),
        bearing: lerp(a.bearing ?? 0, b.bearing ?? 0, t),
        basemap: rawT < 0.5 ? (a.basemap ?? "satellite") : (b.basemap ?? a.basemap ?? "satellite"),
      };
    }
  }

  return {
    center: last.center,
    zoom: last.zoom,
    pitch: last.pitch ?? 0,
    bearing: last.bearing ?? 0,
    basemap: last.basemap ?? "satellite",
  };
};
