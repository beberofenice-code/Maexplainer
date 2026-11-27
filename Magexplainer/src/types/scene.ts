export type BasemapMode = "satellite" | "dark";

export type EasingName = "linear" | "easeInOutCubic" | "easeOutQuart" | "easeInOutQuart";

export interface CameraKeyframe {
  frame: number;
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch?: number;
  bearing?: number;
  basemap?: BasemapMode;
  easing?: EasingName;
}

export type LngLat = [number, number];
export type Ring = LngLat[];

/** Geometry may be given inline or by referencing a feature id in the project's geo.json. */
export interface PolygonGeometryFields {
  /** Polygon rings (outer ring first, holes after). */
  coordinates?: Ring[];
  /** MultiPolygon parts. Filled in automatically when `geo` is resolved. */
  multiCoordinates?: Ring[][];
  /** Feature id in projects/<slug>/geo.json (see geoSources + scripts/fetch-geojson.ts). */
  geo?: string;
}

export interface PolygonOverlayConfig extends PolygonGeometryFields {
  id: string;
  label?: string;
  startFrame: number;
  endFrame: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor?: string;
  strokeWidth?: number;
  glowColor?: string;
  hatched?: boolean;
  /** Optional dynamic longitude/latitude offset animation (e.g. NYC sliding onto Andorra) */
  slideFromOffset?: {
    startFrame: number;
    endFrame: number;
    dLng: number;
    dLat: number;
  };
}

export interface LineOverlayConfig {
  id: string;
  startFrame: number;
  endFrame: number;
  color: string;
  width: number;
  glowColor?: string;
  dashed?: boolean;
  /** Animate drawing the line progressively from 0 -> 1 over this frame range */
  drawRange?: [number, number];
  coordinates?: LngLat[];
  /** Feature id in geo.json: a LineString, or a polygon whose largest outer ring is traced. */
  geo?: string;
}

/**
 * Drops a shape onto another place at true scale (corrected for Mercator
 * distortion), e.g. "New York City on top of Andorra".
 */
export interface AreaCompareConfig extends PolygonGeometryFields {
  id: string;
  startFrame: number;
  endFrame: number;
  /** Where the shape's centroid ends up. */
  targetCenter: LngLat;
  /** Slide in from `fromCenter` (default: 0.65° west of the target) over this range. */
  slide?: { startFrame: number; endFrame: number; fromCenter?: LngLat };
  fillColor: string;
  fillOpacity: number;
  strokeColor?: string;
  strokeWidth?: number;
  glowColor?: string;
  hatched?: boolean;
}

export type GeoSource = (
  | { /** Natural Earth admin-0 country, matched on ADM0_A3 / ISO_A3 / NAME */ naturalEarth: string; scale?: "10m" | "50m" | "110m" }
  | { /** Nominatim free-text search, e.g. "Llívia, Girona" */ osm: string }
  | { /** OSM object id, e.g. "R1689636" (R=relation, W=way, N=node) */ osmId: string }
) & {
  /** Douglas-Peucker tolerance in degrees (0 = keep every vertex). */
  simplify?: number;
  /** Keep only polygon parts intersecting [west, south, east, north] (drops overseas territories). */
  bbox?: [number, number, number, number];
};

export interface VoiceConfig {
  /** ElevenLabs voice id (from GET /v1/voices). */
  voiceId?: string;
  modelId?: string;
  /** 0.7 – 1.2 */
  speed?: number;
}

export interface BeaconConfig {
  id: string;
  lngLat: [number, number];
  startFrame: number;
  endFrame: number;
  color: string;
  radius?: number;
}

export type CalloutKind =
  | "countryLabel"
  | "pinLabel"
  | "hookBanner"
  | "counter"
  | "questionMarks"
  | "distanceBadge"
  | "populationBadge"
  | "flag"
  | "curvedArrow"
  | "pheasantTugOfWar";

export interface CalloutItem {
  id: string;
  kind: CalloutKind;
  startFrame: number;
  endFrame: number;
  /** Screen-space anchor in percentage [0..100] of 1080x1920 frame */
  xPct: number;
  yPct: number;
  text?: string;
  subtext?: string;
  accentWord?: string;
  color?: string;
  flagCode?: "ES" | "FR" | "UK" | "AD" | "MA" | "IT" | "CH" | "SM" | "VA" | "MC" | "NL" | "BR" | "DE" | "AT" | "BE" | "LI";
  rotationDeg?: number;
  scale?: number;
  /** Counter values keyed by frame offset */
  counterSteps?: { frame: number; value: number }[];
  /** Target point for curved arrow */
  targetXPct?: number;
  targetYPct?: number;
}

export interface CaptionCue {
  startFrame: number;
  endFrame: number;
  text: string;
}

export interface AudioCue {
  src: string; // Path relative to public/, e.g. "audio/narration.mp3"
  startFrame: number;
  volume?: number;
}

export interface StoryboardConfig {
  id: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  cameraKeyframes: CameraKeyframe[];
  polygons: PolygonOverlayConfig[];
  lines: LineOverlayConfig[];
  beacons: BeaconConfig[];
  areaCompares?: AreaCompareConfig[];
  callouts: CalloutItem[];
  /** Phrase-level script: the narration text and its target timing. */
  captions: CaptionCue[];
  /** Shapes fetched into geo.json by scripts/fetch-geojson.ts, keyed by feature id. */
  geoSources?: Record<string, GeoSource>;
  voice?: VoiceConfig;
  /** Paths are relative to projects/ (the Remotion public dir). Missing files are skipped. */
  audio?: {
    /** Defaults to <slug>/voice.mp3 when that file exists. */
    narration?: AudioCue;
    bgm?: AudioCue;
    sfx?: AudioCue[];
  };
}

/** Word-level caption, same shape as @remotion/captions `Caption`. */
export interface WordCaption {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
}
