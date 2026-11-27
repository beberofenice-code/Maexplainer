import { getStaticFiles } from "remotion";
import {
  LngLat,
  PolygonGeometryFields,
  Ring,
  StoryboardConfig,
  WordCaption,
} from "./types/scene";

type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] }
  | { type: "LineString"; coordinates: LngLat[] }
  | { type: "MultiLineString"; coordinates: LngLat[][] };

interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: { type: "Feature"; id: string; properties?: Record<string, unknown>; geometry: Geometry }[];
}

export interface MapProject {
  slug: string;
  storyboard: StoryboardConfig;
  /** Word-level captions from projects/<slug>/captions.json, if present. */
  captions: WordCaption[] | null;
  /** Path relative to the public dir (projects/), or null if no voice track exists. */
  voiceSrc: string | null;
}

// Every projects/<slug>/{storyboard,captions,geo}.json is bundled automatically.
const ctx = require.context("../projects", true, /^\.\/[^/]+\/(storyboard|captions|geo)\.json$/);

const load = <T,>(slug: string, file: string): T | null => {
  const key = `./${slug}/${file}`;
  return ctx.keys().includes(key) ? (ctx(key) as T) : null;
};

const ringArea = (ring: Ring) => {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(a / 2);
};

const toMulti = (g: Geometry, slug: string, id: string): Ring[][] => {
  if (g.type === "Polygon") return [g.coordinates];
  if (g.type === "MultiPolygon") return g.coordinates;
  throw new Error(`[${slug}] geo feature "${id}" is a ${g.type}, expected a polygon`);
};

const toLine = (g: Geometry): LngLat[] => {
  if (g.type === "LineString") return g.coordinates;
  if (g.type === "MultiLineString") return g.coordinates.flat();
  const parts = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return parts.map((p) => p[0]).sort((a, b) => ringArea(b) - ringArea(a))[0];
};

/** Fill `coordinates` / `multiCoordinates` from geo.json refs so the renderer only sees inline geometry. */
export const resolveStoryboard = (
  slug: string,
  raw: StoryboardConfig,
  geo: GeoFeatureCollection | null
): StoryboardConfig => {
  const find = (id: string) => {
    const f = geo?.features.find((feat) => feat.id === id);
    if (!f) {
      throw new Error(
        `[${slug}] geo "${id}" not found in projects/${slug}/geo.json — run: npm run fetch-geo -- ${slug}`
      );
    }
    return f.geometry;
  };
  const resolvePoly = <T extends PolygonGeometryFields>(item: T, what: string): T => {
    if (item.geo) return { ...item, multiCoordinates: toMulti(find(item.geo), slug, item.geo) };
    if (!item.coordinates && !item.multiCoordinates) {
      throw new Error(`[${slug}] ${what} needs coordinates, multiCoordinates or geo`);
    }
    return item;
  };

  return {
    ...raw,
    polygons: raw.polygons.map((p) => resolvePoly(p, `polygon "${p.id}"`)),
    areaCompares: raw.areaCompares?.map((a) => resolvePoly(a, `areaCompare "${a.id}"`)),
    lines: raw.lines.map((l) => {
      if (l.geo) return { ...l, coordinates: toLine(find(l.geo)) };
      if (!l.coordinates) throw new Error(`[${slug}] line "${l.id}" needs coordinates or geo`);
      return l;
    }),
  };
};

const hasStaticFile = (path: string) => getStaticFiles().some((f) => f.name === path);

export const loadProjects = (): MapProject[] => {
  const slugs = Array.from(
    new Set(
      ctx
        .keys()
        .filter((k) => k.endsWith("/storyboard.json"))
        .map((k) => k.split("/")[1])
    )
  ).sort();

  return slugs.map((slug) => {
    const raw = load<StoryboardConfig>(slug, "storyboard.json")!;
    const storyboard = resolveStoryboard(slug, raw, load<GeoFeatureCollection>(slug, "geo.json"));
    const voice = storyboard.audio?.narration?.src ?? `${slug}/voice.mp3`;
    return {
      slug,
      storyboard,
      captions: load<WordCaption[]>(slug, "captions.json"),
      voiceSrc: hasStaticFile(voice) ? voice : null,
    };
  });
};

export { hasStaticFile };
