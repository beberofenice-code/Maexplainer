import { StoryboardConfig } from "../types/scene";
import { THEME } from "../styles/theme";
import {
  AUSTRIA_POLYGON,
  CAMPIONE_CENTER,
  CAMPIONE_POLYGON,
  ITALY_MAINLAND_POLYGON,
  SWITZERLAND_POLYGON,
} from "./italyBordersGeo";
import { FRANCE_MAINLAND_POLYGON } from "./franceBordersGeo";
import { BUSINGEN_CENTER, BUSINGEN_POLYGON, GERMANY_POLYGON } from "./germanyBordersGeo";
import {
  HOTEL_ARBEZ,
  INVASION_ROUTE,
  INVASION_VIEW,
  LA_CURE_BORDER_LINE,
  LAKE_CONSTANCE_POLYGON,
  LAKE_CONSTANCE_VIEW,
  LIECHTENSTEIN_CENTER,
  LIECHTENSTEIN_POLYGON,
} from "./switzerlandBordersGeo";

const FPS = 30;
const s = (seconds: number) => Math.round(seconds * FPS);

/** Neighbours in counting order: [id, label, colour, appears at (s), shape, label xPct, yPct, scale] */
const NEIGHBOURS: [string, string, string, number, [number, number][][], number, number, number][] = [
  ["france", "FRANCE", THEME.colors.france, 4.6, FRANCE_MAINLAND_POLYGON, 14, 30, 0.6],
  ["germany", "GERMANY", THEME.colors.germany, 5.2, GERMANY_POLYGON, 50, 34, 0.6],
  ["austria", "AUSTRIA", THEME.colors.austria, 5.8, AUSTRIA_POLYGON, 80, 49, 0.55],
  ["liechtenstein", "LIECHTENSTEIN", THEME.colors.liechtenstein, 6.4, LIECHTENSTEIN_POLYGON, 72, 42, 0.36],
  ["italy", "ITALY", THEME.colors.italy, 7.0, ITALY_MAINLAND_POLYGON, 56, 62, 0.6],
];

/**
 * 78-second (2340 frames @ 30fps) "Switzerland's Strangest Borders" explainer.
 * Beats: hook & 5 neighbours → Liechtenstein & the 2007 accidental invasion →
 * Lake Constance, which has no agreed border → two foreign towns inside
 * Switzerland → the Hôtel Arbez, where the border runs through a bedroom.
 */
export const SWITZERLAND_BORDERS_STORYBOARD: StoryboardConfig = {
  id: "SwitzerlandsStrangestBorders",
  title: "Switzerland's Strangest Borders",
  fps: FPS,
  width: 1080,
  height: 1920,
  durationInFrames: s(78),

  cameraKeyframes: [
    // Beat 1: Hook & neighbour counter (0:00 - 0:10.5)
    { frame: s(0), center: [8.2, 46.6], zoom: 4.2, pitch: 12, bearing: 0, basemap: "satellite" },
    { frame: s(2.5), center: [8.2, 46.8], zoom: 6.3, pitch: 18, bearing: -4, basemap: "satellite" },
    { frame: s(3.5), center: [8.3, 46.8], zoom: 6.0, pitch: 0, bearing: 0, basemap: "dark", easing: "easeOutQuart" },
    { frame: s(8.4), center: [8.35, 46.8], zoom: 5.95, pitch: 0, bearing: 0, basemap: "dark" },

    // Beat 2: Liechtenstein & the accidental invasion (0:10.5 - 0:30.5)
    { frame: s(10.5), center: [9.3, 47.1], zoom: 8.4, pitch: 18, bearing: 0, basemap: "satellite" },
    { frame: s(13.0), center: LIECHTENSTEIN_CENTER, zoom: 10.6, pitch: 22, bearing: 0, basemap: "satellite" },
    { frame: s(20.5), center: [9.53, 47.15], zoom: 10.4, pitch: 20, bearing: 0, basemap: "satellite" },
    { frame: s(23.0), center: INVASION_VIEW, zoom: 12.2, pitch: 26, bearing: 0, basemap: "satellite" },
    { frame: s(30.0), center: [9.476, 47.08], zoom: 12.0, pitch: 22, bearing: 4, basemap: "satellite" },

    // Beat 3: Lake Constance (0:30.5 - 0:42)
    { frame: s(32.0), center: LAKE_CONSTANCE_VIEW, zoom: 9.4, pitch: 18, bearing: 0, basemap: "satellite" },
    { frame: s(42.0), center: [9.42, 47.63], zoom: 9.3, pitch: 16, bearing: 3, basemap: "satellite" },

    // Beat 4: Two foreign towns inside Switzerland (0:42 - 0:52.5)
    { frame: s(43.5), center: [8.8, 46.9], zoom: 7.0, pitch: 10, bearing: 0, basemap: "satellite" },
    { frame: s(52.5), center: [8.8, 46.88], zoom: 6.95, pitch: 10, bearing: 0, basemap: "satellite" },

    // Beat 5: Hôtel Arbez (0:52.5 - 1:18)
    { frame: s(54.0), center: [6.3, 46.6], zoom: 8.2, pitch: 16, bearing: 0, basemap: "satellite" },
    { frame: s(57.0), center: HOTEL_ARBEZ, zoom: 15.5, pitch: 30, bearing: 0, basemap: "satellite" },
    { frame: s(78.0), center: [6.0745, 46.4645], zoom: 16.2, pitch: 26, bearing: 6, basemap: "satellite" },
  ],

  polygons: [
    // Intro hatched fills on the dark map
    {
      id: "switzerland-hatch",
      startFrame: s(1.0),
      endFrame: s(10.5),
      fillColor: THEME.colors.switzerland,
      fillOpacity: 0.88,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      hatched: true,
      coordinates: SWITZERLAND_POLYGON,
    },
    ...NEIGHBOURS.map(([id, , color, at, coordinates]) => ({
      id: `${id}-hatch`,
      startFrame: s(at),
      endFrame: s(10.5),
      fillColor: color,
      fillOpacity: 0.85,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      hatched: true,
      coordinates,
    })),

    // Liechtenstein
    {
      id: "liechtenstein-fill",
      startFrame: s(12.5),
      endFrame: s(21.0),
      fillColor: THEME.colors.liechtenstein,
      fillOpacity: 0.5,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: LIECHTENSTEIN_POLYGON,
    },

    // Lake Constance
    {
      id: "lake-constance",
      startFrame: s(32.0),
      endFrame: s(42.5),
      fillColor: THEME.colors.lake,
      fillOpacity: 0.45,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      glowColor: THEME.colors.accentYellow,
      coordinates: LAKE_CONSTANCE_POLYGON,
    },

    // Two foreign towns inside Switzerland (wide shot, so a coarse Swiss tint is fine)
    {
      id: "switzerland-tint",
      startFrame: s(43.0),
      endFrame: s(53.0),
      fillColor: THEME.colors.switzerland,
      fillOpacity: 0.3,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: SWITZERLAND_POLYGON,
    },
    {
      id: "busingen-fill",
      startFrame: s(44.5),
      endFrame: s(53.0),
      fillColor: THEME.colors.germany,
      fillOpacity: 0.9,
      strokeColor: "#FFFFFF",
      strokeWidth: 2,
      coordinates: BUSINGEN_POLYGON,
    },
    {
      id: "campione-fill",
      startFrame: s(47.0),
      endFrame: s(53.0),
      fillColor: THEME.colors.italy,
      fillOpacity: 0.9,
      strokeColor: "#FFFFFF",
      strokeWidth: 2,
      coordinates: CAMPIONE_POLYGON,
    },
  ],

  lines: [
    {
      id: "invasion-route",
      startFrame: s(23.5),
      endFrame: s(30.5),
      color: "#FFFFFF",
      glowColor: THEME.colors.accentRed,
      width: 6,
      dashed: true,
      drawRange: [s(23.5), s(26.0)],
      coordinates: INVASION_ROUTE,
    },
    {
      id: "la-cure-border",
      startFrame: s(59.0),
      endFrame: s(78),
      color: "#FEF08A",
      glowColor: THEME.colors.accentRed,
      width: 8,
      drawRange: [s(59.0), s(62.0)],
      coordinates: LA_CURE_BORDER_LINE,
    },
  ],

  beacons: [
    { id: "liechtenstein-beacon-intro", lngLat: LIECHTENSTEIN_CENTER, startFrame: s(6.4), endFrame: s(10.5), color: "#F97316", radius: 8 },
    { id: "invasion-beacon", lngLat: INVASION_ROUTE[INVASION_ROUTE.length - 1], startFrame: s(26.0), endFrame: s(30.5), color: "#EF4444", radius: 12 },
    { id: "busingen-beacon", lngLat: BUSINGEN_CENTER, startFrame: s(44.5), endFrame: s(53.0), color: "#F97316", radius: 10 },
    { id: "campione-beacon", lngLat: CAMPIONE_CENTER, startFrame: s(47.0), endFrame: s(53.0), color: "#F97316", radius: 10 },
    { id: "hotel-beacon", lngLat: HOTEL_ARBEZ, startFrame: s(57.5), endFrame: s(78), color: "#F97316", radius: 12 },
  ],

  callouts: [
    // Beat 1: Hook & neighbour counter
    { id: "hook-bed", kind: "hookBanner", startFrame: s(1.0), endFrame: s(3.4), xPct: 50, yPct: 24, accentWord: "2", text: "countries, 1 bed" },
    { id: "hook-arrow", kind: "curvedArrow", startFrame: s(1.2), endFrame: s(3.4), xPct: 56, yPct: 34, color: "#FFFFFF" },
    { id: "lbl-switzerland-intro", kind: "countryLabel", startFrame: s(1.0), endFrame: s(10.5), xPct: 44, yPct: 49, text: "SWITZERLAND", scale: 0.7 },
    {
      id: "neighbor-counter",
      kind: "counter",
      startFrame: s(4.6),
      endFrame: s(10.5),
      xPct: 50,
      yPct: 17,
      counterSteps: NEIGHBOURS.map(([, , , at], i) => ({ frame: s(at), value: i + 1 })),
    },
    ...NEIGHBOURS.map(([id, label, , at, , xPct, yPct, scale]) => ({
      id: `lbl-${id}-intro`,
      kind: "countryLabel" as const,
      startFrame: s(at),
      endFrame: s(10.5),
      xPct,
      yPct,
      text: label,
      scale,
    })),

    // Beat 2: Liechtenstein & the accidental invasion
    { id: "pin-liechtenstein", kind: "pinLabel", startFrame: s(13.0), endFrame: s(17.0), xPct: 52, yPct: 36, text: "Liechtenstein", scale: 0.8 },
    { id: "flag-li", kind: "flag", startFrame: s(14.0), endFrame: s(20.5), xPct: 74, yPct: 24, flagCode: "LI", rotationDeg: 8 },
    { id: "flag-ch-li", kind: "flag", startFrame: s(14.5), endFrame: s(20.5), xPct: 22, yPct: 62, flagCode: "CH", rotationDeg: -8 },
    { id: "pop-liechtenstein", kind: "populationBadge", startFrame: s(15.5), endFrame: s(18.0), xPct: 52, yPct: 47, text: "40,000" },
    { id: "lbl-swiss-franc", kind: "countryLabel", startFrame: s(18.0), endFrame: s(20.5), xPct: 50, yPct: 62, text: "Uses the Swiss franc", scale: 0.55 },
    { id: "hook-2007", kind: "hookBanner", startFrame: s(20.5), endFrame: s(23.0), xPct: 50, yPct: 24, accentWord: "2007", text: "" },
    { id: "lbl-170-soldiers", kind: "countryLabel", startFrame: s(23.5), endFrame: s(26.0), xPct: 50, yPct: 36, text: "170 soldiers", scale: 0.7 },
    { id: "dist-invasion", kind: "distanceBadge", startFrame: s(24.5), endFrame: s(28.0), xPct: 50, yPct: 62, text: "1.5 km", subtext: "(0.9 mi)" },
    { id: "hook-oops", kind: "hookBanner", startFrame: s(25.5), endFrame: s(28.0), xPct: 50, yPct: 24, accentWord: "OOPS!", text: "" },
    { id: "lbl-no-army", kind: "countryLabel", startFrame: s(28.0), endFrame: s(30.5), xPct: 50, yPct: 36, text: "No army to object", scale: 0.6 },

    // Beat 3: Lake Constance
    { id: "lake-qmarks", kind: "questionMarks", startFrame: s(32.5), endFrame: s(36.0), xPct: 50, yPct: 48 },
    { id: "flag-de-lake", kind: "flag", startFrame: s(33.0), endFrame: s(42.0), xPct: 40, yPct: 30, flagCode: "DE", rotationDeg: -6 },
    { id: "flag-ch-lake", kind: "flag", startFrame: s(33.6), endFrame: s(42.0), xPct: 30, yPct: 64, flagCode: "CH", rotationDeg: 6 },
    { id: "flag-at-lake", kind: "flag", startFrame: s(34.2), endFrame: s(42.0), xPct: 84, yPct: 66, flagCode: "AT", rotationDeg: -6 },
    { id: "hook-no-border", kind: "hookBanner", startFrame: s(36.0), endFrame: s(42.0), xPct: 50, yPct: 20, accentWord: "NO", text: "border" },

    // Beat 4: Two foreign towns inside Switzerland
    { id: "pin-busingen", kind: "pinLabel", startFrame: s(44.5), endFrame: s(52.5), xPct: 48, yPct: 33, text: "Büsingen", scale: 0.6 },
    { id: "flag-de-busingen", kind: "flag", startFrame: s(45.0), endFrame: s(52.5), xPct: 76, yPct: 30, flagCode: "DE", rotationDeg: 6 },
    { id: "pin-campione", kind: "pinLabel", startFrame: s(47.0), endFrame: s(52.5), xPct: 53, yPct: 57, text: "Campione d'Italia", scale: 0.6 },
    { id: "flag-it-campione", kind: "flag", startFrame: s(47.5), endFrame: s(52.5), xPct: 22, yPct: 60, flagCode: "IT", rotationDeg: -6 },

    // Beat 5: Hôtel Arbez
    { id: "pin-hotel", kind: "pinLabel", startFrame: s(57.0), endFrame: s(61.0), xPct: 50, yPct: 42, text: "Hôtel Arbez", scale: 0.8 },
    { id: "lbl-1862", kind: "countryLabel", startFrame: s(58.0), endFrame: s(61.0), xPct: 50, yPct: 24, text: "Treaty of 1862", scale: 0.6 },
    { id: "lbl-france-hotel", kind: "countryLabel", startFrame: s(61.0), endFrame: s(78), xPct: 26, yPct: 40, text: "FRANCE", scale: 0.6 },
    { id: "lbl-switzerland-hotel", kind: "countryLabel", startFrame: s(61.5), endFrame: s(78), xPct: 72, yPct: 58, text: "SWITZERLAND", scale: 0.5 },
    { id: "flag-fr-hotel", kind: "flag", startFrame: s(62.0), endFrame: s(71.0), xPct: 24, yPct: 28, flagCode: "FR", rotationDeg: -8 },
    { id: "flag-ch-hotel", kind: "flag", startFrame: s(62.5), endFrame: s(71.0), xPct: 76, yPct: 66, flagCode: "CH", rotationDeg: 8 },
    { id: "hook-one-bed", kind: "hookBanner", startFrame: s(71.0), endFrame: s(78), xPct: 50, yPct: 22, accentWord: "2", text: "countries, 1 bed" },
  ],

  captions: [
    { startFrame: s(0.0), endFrame: s(1.0), text: "Did you know" },
    { startFrame: s(1.0), endFrame: s(2.2), text: "you can sleep in two countries" },
    { startFrame: s(2.2), endFrame: s(3.4), text: "at the same time?" },
    { startFrame: s(3.4), endFrame: s(4.6), text: "Switzerland has five neighbors:" },
    { startFrame: s(4.6), endFrame: s(5.8), text: "France, Germany," },
    { startFrame: s(5.8), endFrame: s(7.0), text: "Austria, Liechtenstein" },
    { startFrame: s(7.0), endFrame: s(8.4), text: "and Italy." },
    { startFrame: s(8.4), endFrame: s(10.5), text: "But its borders hide some strange surprises." },
    { startFrame: s(10.5), endFrame: s(13.0), text: "Liechtenstein is one of the world's smallest countries," },
    { startFrame: s(13.0), endFrame: s(15.5), text: "squeezed between Switzerland and Austria." },
    { startFrame: s(15.5), endFrame: s(18.0), text: "Its 40,000 people use the Swiss franc," },
    { startFrame: s(18.0), endFrame: s(20.5), text: "and Switzerland even runs its customs." },
    { startFrame: s(20.5), endFrame: s(23.0), text: "They're so close that in 2007," },
    { startFrame: s(23.0), endFrame: s(25.5), text: "about 170 Swiss soldiers got lost on a night march" },
    { startFrame: s(25.5), endFrame: s(28.0), text: "and accidentally invaded Liechtenstein." },
    { startFrame: s(28.0), endFrame: s(30.5), text: "Nobody minded — Liechtenstein doesn't even have an army." },
    { startFrame: s(30.5), endFrame: s(33.0), text: "Further north lies Lake Constance," },
    { startFrame: s(33.0), endFrame: s(35.5), text: "shared by Switzerland, Germany and Austria." },
    { startFrame: s(35.5), endFrame: s(38.5), text: "Yet the three never agreed where the borders on the lake are." },
    { startFrame: s(38.5), endFrame: s(42.0), text: "It's one of the only places in Europe with no official border." },
    { startFrame: s(42.0), endFrame: s(44.5), text: "Switzerland also swallows two foreign towns:" },
    { startFrame: s(44.5), endFrame: s(47.0), text: "Büsingen, which belongs to Germany," },
    { startFrame: s(47.0), endFrame: s(49.5), text: "and Campione d'Italia, which belongs to Italy." },
    { startFrame: s(49.5), endFrame: s(52.5), text: "Both sit inside Switzerland — but neither is Swiss." },
    { startFrame: s(52.5), endFrame: s(55.0), text: "But the strangest border runs through a hotel." },
    { startFrame: s(55.0), endFrame: s(58.0), text: "In the village of La Cure stands the Hôtel Arbez." },
    { startFrame: s(58.0), endFrame: s(61.0), text: "When a treaty moved the border in 1862," },
    { startFrame: s(61.0), endFrame: s(64.0), text: "a building went up right on the new line." },
    { startFrame: s(64.0), endFrame: s(67.5), text: "Today the French–Swiss border runs straight through it." },
    { startFrame: s(67.5), endFrame: s(71.0), text: "In one room, the bed sits right on the border," },
    { startFrame: s(71.0), endFrame: s(74.5), text: "so guests sleep with their head in France" },
    { startFrame: s(74.5), endFrame: s(78.0), text: "and their feet in Switzerland." },
  ],

  audio: {
    narration: { src: "audio/switzerland-narration.mp3", startFrame: 0, volume: 1 },
    bgm: { src: "audio/bgm.mp3", startFrame: 0, volume: 0.18 },
    sfx: [
      { src: "audio/sfx/whoosh.mp3", startFrame: s(2.0), volume: 0.5 },
      { src: "audio/sfx/pop.mp3", startFrame: s(4.6), volume: 0.55 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(11.5), volume: 0.5 },
      { src: "audio/sfx/pop.mp3", startFrame: s(25.5), volume: 0.55 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(31.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(55.0), volume: 0.5 },
    ],
  },
};
