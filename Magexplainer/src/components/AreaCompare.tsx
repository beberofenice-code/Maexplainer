import { AreaCompareConfig, LngLat, PolygonOverlayConfig, Ring } from "../types/scene";

const DEG = Math.PI / 180;

const partsOf = (c: AreaCompareConfig): Ring[][] =>
  c.multiCoordinates ?? (c.coordinates ? [c.coordinates] : []);

/** Area-weighted centroid of all outer rings, in lng/lat. */
export const centroidOf = (parts: Ring[][]): LngLat => {
  let ax = 0;
  let ay = 0;
  let total = 0;
  for (const [outer] of parts) {
    for (let i = 0; i < outer.length - 1; i++) {
      const [x0, y0] = outer[i];
      const [x1, y1] = outer[i + 1];
      const cross = x0 * y1 - x1 * y0;
      total += cross;
      ax += (x0 + x1) * cross;
      ay += (y0 + y1) * cross;
    }
  }
  if (Math.abs(total) < 1e-12) {
    const pts = parts.flat(2);
    return [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ];
  }
  return [ax / (3 * total), ay / (3 * total)];
};

/**
 * Re-centres a shape on `target` while keeping its real ground size: east-west
 * offsets are converted to distance at the source latitude and back to degrees
 * at the target latitude, so the overlay is honest on a Mercator map.
 */
export const moveTrueScale = (parts: Ring[][], target: LngLat, source = centroidOf(parts)): Ring[][] => {
  const k = Math.cos(source[1] * DEG) / Math.cos(target[1] * DEG);
  return parts.map((rings) =>
    rings.map((ring) =>
      ring.map(([lng, lat]) => [target[0] + (lng - source[0]) * k, target[1] + (lat - source[1])] as LngLat)
    )
  );
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** The overlay polygons for `frame`, ready to hand to MapCanvas. */
export const areaComparePolygons = (
  configs: AreaCompareConfig[] | undefined,
  frame: number
): PolygonOverlayConfig[] =>
  (configs ?? [])
    .filter((c) => frame >= c.startFrame && frame <= c.endFrame)
    .map((c) => {
      const parts = partsOf(c);
      let center = c.targetCenter;
      if (c.slide) {
        const from = c.slide.fromCenter ?? [c.targetCenter[0] - 0.65, c.targetCenter[1]];
        const span = Math.max(1, c.slide.endFrame - c.slide.startFrame);
        const t = easeOutCubic(Math.max(0, Math.min(1, (frame - c.slide.startFrame) / span)));
        center = [from[0] + (c.targetCenter[0] - from[0]) * t, from[1] + (c.targetCenter[1] - from[1]) * t];
      }
      return {
        id: c.id,
        startFrame: c.startFrame,
        endFrame: c.endFrame,
        fillColor: c.fillColor,
        fillOpacity: c.fillOpacity,
        strokeColor: c.strokeColor,
        strokeWidth: c.strokeWidth,
        glowColor: c.glowColor,
        hatched: c.hatched,
        multiCoordinates: moveTrueScale(parts, center),
      };
    });
