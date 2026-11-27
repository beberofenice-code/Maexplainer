/**
 * Storyboard schema shared by the Python pipeline (fetch_geo_and_tiles.py,
 * sound_engine.py, qa_check.py) and this Remotion engine.
 * See .claude/skills/map-explainer-pro/references/storyboard-schema.md
 */

export type LngLat = [number, number];
export type Pct = [number, number];
export type Easing = "linear" | "easeInOutCubic" | "easeOutQuart" | "easeInOutQuart" | "easeOutBack";

/** Any timed thing can be placed by seconds-from-scene-start (`t`) or by a narration word. */
export interface TimeSpec {
  t?: number;
  at_word?: string;
  occurrence?: number;
  offset?: number;
}

export interface EndSpec {
  until_t?: number;
  until_word?: string;
  until_occurrence?: number;
  until_offset?: number;
  duration?: number;
}

export interface CameraKeyframe extends TimeSpec {
  center: LngLat;
  zoom: number;
  pitch?: number;
  bearing?: number;
  easing?: Easing;
}

export type LayerStyle =
  | "tint" // satellite: locked 0.55 RGBA tint + white border + glow
  | "outline" // border only
  | "highlight" // yellow highlight glow border + tint
  | "hatch" // dark_cutaway: lifted diagonal white-hatched polygon
  | "flat" // solid locked fill
  | "silhouette" // mystery dark silhouette with dashed outline
  | "line"; // line feature (borders, routes)

export interface LayerSpec extends TimeSpec, EndSpec {
  feature: string;
  style?: LayerStyle;
  color?: string; // color key or hex override
  opacity?: number;
  lift?: number; // px lift for hatch style
  glow?: boolean;
  width?: number;
}

export interface ElementBase extends TimeSpec, EndSpec {
  type: string;
  id?: string;
  sfx?: string | null;
  color?: string;
}

export type ElementSpec = ElementBase & Record<string, any>;

export interface SfxCue extends TimeSpec {
  name: string;
  gain_db?: number;
}

export interface SceneSpec {
  id: string;
  mode: "satellite" | "dark_cutaway";
  /** optional hard cuts between modes inside a scene, e.g. [{ at_word: "Peñón", mode: "satellite" }] */
  mode_at?: (TimeSpec & { mode: "satellite" | "dark_cutaway" })[];
  narration: string;
  min_duration_s?: number;
  tail_s?: number;
  camera: CameraKeyframe[];
  layers?: LayerSpec[];
  elements?: ElementSpec[];
  sfx?: SfxCue[];
  show_context_borders?: boolean;
  transition_sfx?: string | null;
}

export interface FeatureSpec {
  id: string;
  source: "natural_earth" | "osm" | "nominatim" | "ne_boundary" | "inline";
  adm0_a3?: string;
  osm?: string;
  nominatim?: string;
  between?: [string, string];
  parent?: string;
  color?: string;
  type?: "Polygon" | "MultiPolygon" | "LineString" | "MultiLineString";
  coordinates?: any;
  fallback_coordinates?: any;
}

export interface Storyboard {
  schema_version: number;
  meta: {
    slug: string;
    title: string;
    fps: number;
    width: number;
    height: number;
    lufs?: number;
    max_tile_zoom?: number;
    voice?: Record<string, any>;
    music?: Record<string, any>;
    subtitles?: { max_words?: number; y_pct?: number };
  };
  geo: { context?: string[]; features: FeatureSpec[] };
  scenes: SceneSpec[];
}

export interface Word {
  word: string;
  start: number;
  end: number;
  scene: string;
}

export interface SceneTiming {
  id: string;
  start: number;
  end: number;
  vo_start?: number;
  vo_end?: number;
}

export interface Timestamps {
  fps: number;
  total_s: number;
  provider?: string;
  scenes: SceneTiming[];
  words: Word[];
}

export interface ColorEntry {
  name?: string;
  fill: string;
  tint?: string;
  border?: string;
  glow?: string;
  parent?: string;
}

export interface CountryColors {
  defaults: {
    tint_opacity: number;
    border: string;
    glow: string;
    dark_cutaway: { background: string; land: string; border: string; hatch: string; silhouette: string };
  };
  countries: Record<string, ColorEntry>;
  territories: Record<string, ColorEntry & { parent: string }>;
  overlays: Record<string, ColorEntry>;
  sovereign_codes?: Record<string, string>;
}

export interface GeoFeature {
  type: "Feature";
  properties: { id: string; role: "feature" | "context"; adm0_a3?: string; color_key?: string; name?: string };
  geometry: { type: string; coordinates: any };
}

export interface ProjectData {
  storyboard: Storyboard;
  timestamps: Timestamps;
}
