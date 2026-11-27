/**
 * Pulls real country / enclave polygons for a project into projects/<slug>/geo.json.
 *
 *   npm run fetch-geo -- <slug> [--only id1,id2] [--refresh]
 *
 * Sources are declared in storyboard.json → "geoSources":
 *   "spain":   { "naturalEarth": "ESP", "scale": "50m" }      Natural Earth admin-0
 *   "llivia":  { "osm": "Llívia, Girona, Spain" }             Nominatim search
 *   "nyc":     { "osmId": "R175905", "simplify": 0.002 }      OSM relation/way/node
 * Optional per source: "simplify" (degrees, Douglas-Peucker), "bbox" [w,s,e,n].
 *
 * Storyboard items then use "geo": "<id>" instead of inline coordinates.
 */
import fs from "node:fs";
import path from "node:path";
import type { GeoSource, LngLat, Ring } from "../src/types/scene";
import { CACHE, isMain, parseArgs, projectDir, readStoryboard, sleep } from "./lib";

type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] }
  | { type: "LineString"; coordinates: LngLat[] }
  | { type: "MultiLineString"; coordinates: LngLat[][] }
  | { type: "Point"; coordinates: LngLat };

interface Feature {
  type: "Feature";
  id: string;
  properties: Record<string, unknown>;
  geometry: Geometry;
}

const USER_AGENT = "map-explainer-studio/1.0 (geojson fetch script)";
const NOMINATIM = "https://nominatim.openstreetmap.org";
const NE_URL = (scale: string) =>
  `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_${scale}_admin_0_countries.geojson`;

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// --- geometry helpers ------------------------------------------------------

const perpDist = (p: LngLat, a: LngLat, b: LngLat) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};

/** Douglas-Peucker, iterative. */
export const simplifyLine = (pts: LngLat[], tol: number): LngLat[] => {
  if (tol <= 0 || pts.length <= 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(pts[i], pts[s], pts[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx >= 0 && maxD > tol) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};

const simplifyRing = (ring: Ring, tol: number): Ring | null => {
  const out = simplifyLine(ring, tol);
  if (out.length < 4) return tol > 0 && ring.length >= 4 ? null : ring;
  return out;
};

const round = (n: number) => Math.round(n * 1e5) / 1e5;
const roundPts = <T,>(v: T): T =>
  (Array.isArray(v) ? (typeof v[0] === "number" ? v.map(round) : v.map(roundPts)) : v) as T;

const bboxOf = (rings: Ring[]) => {
  const pts = rings.flat();
  return [
    Math.min(...pts.map((p) => p[0])),
    Math.min(...pts.map((p) => p[1])),
    Math.max(...pts.map((p) => p[0])),
    Math.max(...pts.map((p) => p[1])),
  ];
};
const intersects = (a: number[], b: number[]) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

export function cleanGeometry(g: Geometry, src: GeoSource): Geometry {
  const tol = src.simplify ?? 0;
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    let parts = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    if (src.bbox) parts = parts.filter((p) => intersects(bboxOf(p), src.bbox!));
    parts = parts
      .map((rings) => {
        const outer = simplifyRing(rings[0], tol);
        if (!outer) return null;
        return [outer, ...rings.slice(1).map((r) => simplifyRing(r, tol)).filter((r): r is Ring => !!r)];
      })
      .filter((p): p is Ring[] => !!p);
    if (parts.length === 0) throw new Error("geometry vanished after bbox/simplify — loosen them");
    return { type: "MultiPolygon", coordinates: roundPts(parts) };
  }
  if (g.type === "LineString") return { type: "LineString", coordinates: roundPts(simplifyLine(g.coordinates, tol)) };
  if (g.type === "MultiLineString") {
    return { type: "MultiLineString", coordinates: roundPts(g.coordinates.map((l) => simplifyLine(l, tol))) };
  }
  return { type: "Point", coordinates: roundPts(g.coordinates) };
}

// --- sources ---------------------------------------------------------------

async function naturalEarth(code: string, scale: string): Promise<{ geometry: Geometry; name: string }> {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `ne_${scale}_admin_0_countries.geojson`);
  if (!fs.existsSync(file)) {
    console.log(`  downloading Natural Earth ${scale} countries…`);
    fs.writeFileSync(file, JSON.stringify(await getJson(NE_URL(scale))));
  }
  const fc = JSON.parse(fs.readFileSync(file, "utf8"));
  const want = code.toUpperCase();
  const f = fc.features.find((feat: any) => {
    const p = feat.properties;
    return [p.ADM0_A3, p.ISO_A3, p.SOV_A3, p.NAME?.toUpperCase(), p.NAME_LONG?.toUpperCase()].includes(want);
  });
  if (!f) throw new Error(`Natural Earth has no country matching "${code}" (try the ADM0_A3 code, e.g. FRA)`);
  return { geometry: f.geometry, name: f.properties.NAME };
}

async function nominatim(url: string): Promise<{ geometry: Geometry; name: string; osm: string }> {
  const fc = await getJson(url);
  const f = fc.features?.[0];
  if (!f) throw new Error(`Nominatim returned nothing for ${url}`);
  const p = f.properties;
  return { geometry: f.geometry, name: p.display_name, osm: `${p.osm_type}/${p.osm_id}` };
}

async function fetchSource(id: string, src: GeoSource): Promise<Feature> {
  const params = "format=geojson&polygon_geojson=1&limit=1";
  if ("naturalEarth" in src) {
    const scale = src.scale ?? "50m";
    const r = await naturalEarth(src.naturalEarth, scale);
    return {
      type: "Feature",
      id,
      properties: { name: r.name, source: `Natural Earth ${scale} (${src.naturalEarth})` },
      geometry: cleanGeometry(r.geometry, src),
    };
  }
  const url =
    "osm" in src
      ? `${NOMINATIM}/search?q=${encodeURIComponent(src.osm)}&${params}`
      : `${NOMINATIM}/lookup?osm_ids=${encodeURIComponent(src.osmId)}&${params}`;
  const r = await nominatim(url);
  await sleep(1100); // Nominatim usage policy: max 1 request / second
  return {
    type: "Feature",
    id,
    properties: { name: r.name, source: `OpenStreetMap ${r.osm} (© OpenStreetMap contributors, ODbL)` },
    geometry: cleanGeometry(r.geometry, src),
  };
}

export async function fetchGeojson(slug: string, opts: { only?: string[]; refresh?: boolean } = {}) {
  const storyboard = readStoryboard(slug);
  const sources = storyboard.geoSources ?? {};
  const out = path.join(projectDir(slug), "geo.json");
  const existing: Feature[] = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")).features : [];
  const byId = new Map(existing.filter((f) => f.id in sources).map((f) => [f.id, f]));

  const ids = Object.keys(sources).filter((id) => !opts.only || opts.only.includes(id));
  if (ids.length === 0) {
    console.log(`[${slug}] no geoSources to fetch`);
    return;
  }
  for (const id of ids) {
    if (byId.has(id) && !opts.refresh && !opts.only) {
      console.log(`  ${id}: cached (use --refresh to re-download)`);
      continue;
    }
    const f = await fetchSource(id, sources[id]);
    const n = JSON.stringify(f.geometry.coordinates).split("],[").length;
    console.log(`  ${id}: ${f.geometry.type}, ~${n} vertices — ${f.properties.name}`);
    byId.set(id, f);
  }

  const features = Object.keys(sources).filter((id) => byId.has(id)).map((id) => byId.get(id)!);
  const json = JSON.stringify({ type: "FeatureCollection", features }, null, 0)
    .replace(/\{"type":"Feature"/g, '\n{"type":"Feature"')
    .replace(/\]\}$/, "\n]}");
  fs.writeFileSync(out, json + "\n");
  console.log(`[${slug}] wrote ${path.relative(process.cwd(), out)} (${features.length} features)`);
}

if (isMain(import.meta.url)) {
  const { positional, flags } = parseArgs();
  const slug = positional[0];
  if (!slug) {
    console.error("usage: npm run fetch-geo -- <project-slug> [--only id1,id2] [--refresh]");
    process.exit(1);
  }
  fetchGeojson(slug, {
    only: typeof flags.only === "string" ? flags.only.split(",") : undefined,
    refresh: !!flags.refresh,
  }).catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
