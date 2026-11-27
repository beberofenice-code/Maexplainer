import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { geoMercator } from "d3-geo";
import type { CountryColors, GeoFeature } from "../types";

/** A feature pre-projected to Web-Mercator normalized coordinates (0..1) via d3-geo. */
export interface ProjectedFeature {
  id: string;
  role: "feature" | "context";
  colorKey?: string;
  adm0?: string;
  kind: "polygon" | "line";
  /** GeoJSON-like geometry whose coordinates are [u, v] in 0..1 */
  geometry: { type: string; coordinates: any };
  /** original lng/lat geometry (for true-scale re-centering) */
  rawGeometry: { type: string; coordinates: any };
  bboxLL: [number, number, number, number];
  centroidLL: [number, number];
}

export interface ProjectAssets {
  features: Map<string, ProjectedFeature>;
  context: ProjectedFeature[];
  colors: CountryColors;
  tiles: Set<string>;
  maxTileZoom: number;
}

// d3 Mercator scaled so that the whole world maps to the unit square (== Web Mercator / 512px tiles).
const unitMercator = geoMercator().scale(1 / (2 * Math.PI)).translate([0.5, 0.5]).precision(0);

const mapCoords = (c: any, depth: number): any =>
  depth === 0 ? unitMercator(c as [number, number]) : (c as any[]).map((x) => mapCoords(x, depth - 1));

const DEPTH: Record<string, number> = { Point: 0, LineString: 1, MultiPoint: 1, Polygon: 2, MultiLineString: 2, MultiPolygon: 3 };

const project = (f: GeoFeature): ProjectedFeature => {
  const depth = DEPTH[f.geometry.type] ?? 2;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let sx = 0, sy = 0, n = 0;
  const walk = (c: any, dd: number) => {
    if (dd === 0) {
      const [x, y] = c as [number, number];
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      sx += x; sy += y; n++;
    } else for (const x of c) walk(x, dd - 1);
  };
  walk(f.geometry.coordinates, depth);
  const kind = /Line/.test(f.geometry.type) ? "line" : "polygon";
  return {
    id: f.properties.id,
    role: f.properties.role,
    colorKey: f.properties.color_key,
    adm0: f.properties.adm0_a3,
    kind,
    geometry: { type: f.geometry.type, coordinates: mapCoords(f.geometry.coordinates, depth) },
    rawGeometry: f.geometry,
    bboxLL: [minX, minY, maxX, maxY],
    centroidLL: [sx / Math.max(1, n), sy / Math.max(1, n)],
  };
};

const fetchJson = async (path: string, fallback?: any) => {
  try {
    const r = await fetch(staticFile(path));
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Could not load ${path}: ${e}. Run the pipeline scripts first.`);
  }
};

let cache: Promise<ProjectAssets> | null = null;

export const loadProjectAssets = (): Promise<ProjectAssets> => {
  if (!cache) {
    cache = (async () => {
      const [geo, colors, manifest] = await Promise.all([
        fetchJson("assets/geo/features.geojson", { type: "FeatureCollection", features: [] }),
        fetchJson("assets/country-colors.json"),
        fetchJson("assets/tiles/manifest.json", { tiles: [], max_zoom: 0 }),
      ]);
      const features = new Map<string, ProjectedFeature>();
      const context: ProjectedFeature[] = [];
      for (const f of geo.features as GeoFeature[]) {
        const p = project(f);
        if (p.role === "context") context.push(p);
        else features.set(p.id, p);
      }
      return { features, context, colors, tiles: new Set<string>(manifest.tiles), maxTileZoom: manifest.max_zoom ?? 0 };
    })();
  }
  return cache;
};

export const useProjectAssets = (): ProjectAssets | null => {
  const [assets, setAssets] = useState<ProjectAssets | null>(null);
  const [handle] = useState(() => delayRender("Loading map-explainer project assets"));
  useEffect(() => {
    loadProjectAssets()
      .then((a) => {
        setAssets(a);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return assets;
};
