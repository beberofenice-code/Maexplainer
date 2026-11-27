import { interpolate } from "remotion";

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** 0→1 entrance progress (eased) and 1→0 exit, in frames. */
export const presence = (frame: number, startF: number, endF: number, inF = 10, outF = 8) => {
  const i = clamp01((frame - startF) / inF);
  const o = clamp01((endF - frame) / outF);
  const easeOut = 1 - Math.pow(1 - i, 3);
  return Math.min(easeOut, o);
};

/** Back-out pop for scale (overshoots to ~1.12). */
export const pop = (frame: number, startF: number, durF = 12) => {
  const x = clamp01((frame - startF) / durF);
  const c1 = 2.2;
  const c3 = c1 + 1;
  return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export { interpolate };
