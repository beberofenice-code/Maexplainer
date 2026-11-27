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

export interface PolygonOverlayConfig {
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
  coordinates: [number, number][][];
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
  coordinates: [number, number][];
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
  flagCode?: "ES" | "FR" | "UK" | "AD" | "MA" | "IT" | "CH" | "SM" | "VA" | "MC" | "NL" | "BR" | "DE" | "AT" | "BE";
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
  callouts: CalloutItem[];
  captions: CaptionCue[];
  audio?: {
    narration?: AudioCue;
    bgm?: AudioCue;
    sfx?: AudioCue[];
  };
}
