import { geoIdentity, geoPath } from "d3-geo";
import type { ProjectedFeature } from "./assets";
import type { Viewport } from "./mercator";

/**
 * Per-frame SVG path for a pre-projected feature in map-plane px, clipped to the visible
 * area with d3-geo (keeps path strings small even at street-level zoom).
 */
export const featurePath = (f: ProjectedFeature, vp: Viewport, dx = 0, dy = 0): string => {
  const { W, H, cam, world, planeBounds } = vp;
  const proj = geoIdentity()
    .scale(world)
    .translate([W / 2 - cam.u * world + dx, H / 2 - cam.v * world + dy])
    .clipExtent([
      [planeBounds[0] - Math.abs(dx), planeBounds[1] - Math.abs(dy)],
      [planeBounds[2] + Math.abs(dx), planeBounds[3] + Math.abs(dy)],
    ]);
  return geoPath(proj)(f.geometry as any) ?? "";
};

/** Path for raw normalized geometry (used by TrueScaleCityCompare after re-centering). */
export const geometryPath = (geometry: any, vp: Viewport): string => {
  const { W, H, cam, world, planeBounds } = vp;
  const proj = geoIdentity()
    .scale(world)
    .translate([W / 2 - cam.u * world, H / 2 - cam.v * world])
    .clipExtent([
      [planeBounds[0], planeBounds[1]],
      [planeBounds[2], planeBounds[3]],
    ]);
  return geoPath(proj)(geometry) ?? "";
};
