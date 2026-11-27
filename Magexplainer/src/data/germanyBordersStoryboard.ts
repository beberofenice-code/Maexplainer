import { StoryboardConfig } from "../types/scene";
import { THEME } from "../styles/theme";
import { AUSTRIA_POLYGON, SWITZERLAND_POLYGON } from "./italyBordersGeo";
import { BELGIUM_POLYGON, FRANCE_MAINLAND_POLYGON, LUXEMBOURG_POLYGON } from "./franceBordersGeo";
import {
  BUSINGEN_CENTER,
  BUSINGEN_GAP_LINE,
  BUSINGEN_POLYGON,
  CZECHIA_POLYGON,
  DENMARK_POLYGON,
  GERMANY_POLYGON,
  JUNGHOLZ_POLYGON,
  JUNGHOLZ_VIEW,
  KLEINWALSERTAL_POLYGON,
  KLEINWALSERTAL_ROAD,
  KLEINWALSERTAL_VIEW,
  MUTZENICH_CENTER,
  MUTZENICH_POLYGON,
  NETHERLANDS_POLYGON,
  POLAND_POLYGON,
  SORGSCHROFEN,
  VENNBAHN_ENCLAVES,
  VENNBAHN_LINE,
  VENNBAHN_VIEW,
} from "./germanyBordersGeo";

const FPS = 30;
const s = (seconds: number) => Math.round(seconds * FPS);

/** Neighbours in counting order: [id, label, colour, appears at (s), shape, label xPct, yPct, scale] */
const NEIGHBOURS: [string, string, string, number, [number, number][][], number, number, number][] = [
  ["denmark", "DENMARK", THEME.colors.denmark, 4.6, DENMARK_POLYGON, 45, 29, 0.5],
  ["poland", "POLAND", THEME.colors.poland, 5.1, POLAND_POLYGON, 86, 44, 0.45],
  ["czechia", "CZECHIA", THEME.colors.czechia, 5.6, CZECHIA_POLYGON, 76, 55, 0.45],
  ["austria", "AUSTRIA", THEME.colors.austria, 6.1, AUSTRIA_POLYGON, 66, 65, 0.5],
  ["switzerland", "SWITZERLAND", THEME.colors.switzerland, 6.6, SWITZERLAND_POLYGON, 38, 69, 0.42],
  ["france", "FRANCE", THEME.colors.france, 7.1, FRANCE_MAINLAND_POLYGON, 18, 63, 0.55],
  ["luxembourg", "LUXEMBOURG", THEME.colors.luxembourg, 7.6, LUXEMBOURG_POLYGON, 30, 57, 0.35],
  ["belgium", "BELGIUM", THEME.colors.belgium, 8.1, BELGIUM_POLYGON, 20, 51, 0.45],
  ["netherlands", "NETHERLANDS", THEME.colors.netherlands, 8.6, NETHERLANDS_POLYGON, 24, 42, 0.45],
];

/** The five German enclaves appear one by one along the Vennbahn */
const ENCLAVE_TIMES = [64.0, 64.8, 65.6, 66.4, 67.2];

/**
 * 80-second (2400 frames @ 30fps) "Germany's Strangest Borders" explainer.
 * Beats: hook & 9 neighbours → Büsingen (German, but inside Switzerland) →
 * Kleinwalsertal & Jungholz (Austrian, but reached through Germany) →
 * the Vennbahn, a Belgian railway that cut five German enclaves out of Germany.
 */
export const GERMANY_BORDERS_STORYBOARD: StoryboardConfig = {
  id: "GermanysStrangestBorders",
  title: "Germany's Strangest Borders",
  fps: FPS,
  width: 1080,
  height: 1920,
  durationInFrames: s(80),

  cameraKeyframes: [
    // Beat 1: Hook & neighbour counter (0:00 - 0:11)
    { frame: s(0), center: [10.4, 50.5], zoom: 3.6, pitch: 12, bearing: 0, basemap: "satellite" },
    { frame: s(2.5), center: [10.4, 50.9], zoom: 5.5, pitch: 18, bearing: -4, basemap: "satellite" },
    { frame: s(3.5), center: [10.4, 51.0], zoom: 5.2, pitch: 0, bearing: 0, basemap: "dark", easing: "easeOutQuart" },
    { frame: s(9.4), center: [10.5, 51.0], zoom: 5.15, pitch: 0, bearing: 0, basemap: "dark" },

    // Beat 2: Büsingen am Hochrhein (0:11 - 0:27)
    { frame: s(11.0), center: [8.5, 47.9], zoom: 8.0, pitch: 18, bearing: 0, basemap: "satellite" },
    { frame: s(14.0), center: BUSINGEN_CENTER, zoom: 12.4, pitch: 24, bearing: -6, basemap: "satellite" },
    { frame: s(27.0), center: [8.697, 47.699], zoom: 12.1, pitch: 20, bearing: 0, basemap: "satellite" },

    // Beat 3: Kleinwalsertal & Jungholz (0:27 - 0:52)
    { frame: s(28.0), center: [10.1, 47.55], zoom: 8.4, pitch: 18, bearing: 0, basemap: "satellite" },
    { frame: s(30.5), center: KLEINWALSERTAL_VIEW, zoom: 11.2, pitch: 26, bearing: 0, basemap: "satellite" },
    { frame: s(38.5), center: [10.2, 47.352], zoom: 11.0, pitch: 22, bearing: 4, basemap: "satellite" },
    { frame: s(41.5), center: JUNGHOLZ_VIEW, zoom: 13.2, pitch: 26, bearing: 0, basemap: "satellite" },
    { frame: s(52.0), center: [10.451, 47.577], zoom: 13.0, pitch: 22, bearing: -4, basemap: "satellite" },

    // Beat 4: The Vennbahn (0:52 - 1:20)
    { frame: s(53.0), center: [6.4, 50.7], zoom: 8.2, pitch: 14, bearing: 0, basemap: "satellite" },
    { frame: s(56.0), center: VENNBAHN_VIEW, zoom: 11.0, pitch: 10, bearing: 0, basemap: "satellite" },
    { frame: s(67.5), center: [6.2, 50.592], zoom: 10.9, pitch: 10, bearing: 0, basemap: "satellite" },
    { frame: s(71.0), center: MUTZENICH_CENTER, zoom: 13.6, pitch: 24, bearing: 0, basemap: "satellite" },
    { frame: s(80.0), center: [6.2125, 50.5672], zoom: 13.9, pitch: 20, bearing: 4, basemap: "satellite" },
  ],

  polygons: [
    // Intro hatched fills on the dark map (0:01 - 0:10)
    {
      id: "germany-hatch",
      startFrame: s(1.0),
      endFrame: s(10.2),
      fillColor: THEME.colors.germany,
      fillOpacity: 0.88,
      strokeColor: "#FFFBEB",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      hatched: true,
      coordinates: GERMANY_POLYGON,
    },
    ...NEIGHBOURS.map(([id, , color, at, coordinates]) => ({
      id: `${id}-hatch`,
      startFrame: s(at),
      endFrame: s(10.2),
      fillColor: color,
      fillOpacity: 0.85,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      hatched: true,
      coordinates,
    })),

    // Büsingen
    {
      id: "busingen-fill",
      startFrame: s(13.5),
      endFrame: s(27.5),
      fillColor: THEME.colors.germany,
      fillOpacity: 0.62,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: BUSINGEN_POLYGON,
    },

    // Kleinwalsertal & Jungholz (Austrian)
    {
      id: "kleinwalsertal-fill",
      startFrame: s(30.0),
      endFrame: s(39.5),
      fillColor: THEME.colors.uk,
      fillOpacity: 0.55,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: KLEINWALSERTAL_POLYGON,
    },
    {
      id: "jungholz-fill",
      startFrame: s(40.5),
      endFrame: s(52.5),
      fillColor: THEME.colors.uk,
      fillOpacity: 0.55,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: JUNGHOLZ_POLYGON,
    },

    // Mützenich, the largest Vennbahn enclave
    {
      id: "mutzenich-fill",
      startFrame: s(69.5),
      endFrame: s(80),
      fillColor: THEME.colors.germany,
      fillOpacity: 0.6,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: MUTZENICH_POLYGON,
    },
  ],

  lines: [
    {
      id: "busingen-gap",
      startFrame: s(19.0),
      endFrame: s(23.5),
      color: "#FFFFFF",
      width: 5,
      dashed: true,
      drawRange: [s(19.0), s(20.0)],
      coordinates: BUSINGEN_GAP_LINE,
    },
    {
      id: "kleinwalsertal-road",
      startFrame: s(35.5),
      endFrame: s(39.5),
      color: "#FEF08A",
      glowColor: THEME.colors.accentYellow,
      width: 6,
      drawRange: [s(35.5), s(37.0)],
      coordinates: KLEINWALSERTAL_ROAD,
    },
    {
      id: "vennbahn",
      startFrame: s(56.5),
      endFrame: s(80),
      color: "#FFFFFF",
      glowColor: THEME.colors.belgium,
      width: 7,
      drawRange: [s(57.0), s(60.0)],
      coordinates: VENNBAHN_LINE,
    },
  ],

  beacons: [
    { id: "sorgschrofen-beacon", lngLat: SORGSCHROFEN, startFrame: s(44.5), endFrame: s(52.5), color: "#F97316", radius: 12 },
    ...VENNBAHN_ENCLAVES.map(([id, lngLat], i) => ({
      id: `enclave-${id}`,
      lngLat,
      startFrame: s(ENCLAVE_TIMES[i]),
      endFrame: s(70.0),
      color: THEME.colors.germany,
      radius: 9,
    })),
  ],

  callouts: [
    // Beat 1: Hook & neighbour counter
    { id: "hook-nine", kind: "hookBanner", startFrame: s(1.0), endFrame: s(3.4), xPct: 50, yPct: 24, accentWord: "9", text: "neighbors" },
    { id: "hook-arrow", kind: "curvedArrow", startFrame: s(1.2), endFrame: s(3.4), xPct: 56, yPct: 34, color: "#FFFFFF" },
    { id: "lbl-germany-intro", kind: "countryLabel", startFrame: s(1.0), endFrame: s(10.2), xPct: 50, yPct: 47, text: "GERMANY", scale: 0.85 },
    {
      id: "neighbor-counter",
      kind: "counter",
      startFrame: s(4.6),
      endFrame: s(10.2),
      xPct: 50,
      yPct: 17,
      counterSteps: NEIGHBOURS.map(([, , , at], i) => ({ frame: s(at), value: i + 1 })),
    },
    ...NEIGHBOURS.map(([id, label, , at, , xPct, yPct, scale]) => ({
      id: `lbl-${id}-intro`,
      kind: "countryLabel" as const,
      startFrame: s(at),
      endFrame: s(10.2),
      xPct,
      yPct,
      text: label,
      scale,
    })),

    // Beat 2: Büsingen
    { id: "pin-busingen", kind: "pinLabel", startFrame: s(14.0), endFrame: s(18.5), xPct: 50, yPct: 40, text: "Büsingen", scale: 0.8 },
    { id: "flag-de-busingen", kind: "flag", startFrame: s(15.0), endFrame: s(22.0), xPct: 72, yPct: 24, flagCode: "DE", rotationDeg: 8 },
    { id: "flag-ch-busingen", kind: "flag", startFrame: s(16.0), endFrame: s(22.0), xPct: 26, yPct: 64, flagCode: "CH", rotationDeg: -8 },
    { id: "pop-busingen", kind: "populationBadge", startFrame: s(18.5), endFrame: s(21.0), xPct: 50, yPct: 47, text: "1,500" },
    { id: "dist-busingen", kind: "distanceBadge", startFrame: s(19.5), endFrame: s(23.5), xPct: 80, yPct: 44, text: "700 m", subtext: "(0.4 mi)" },
    { id: "lbl-swiss-francs", kind: "countryLabel", startFrame: s(21.5), endFrame: s(24.2), xPct: 50, yPct: 62, text: "Pays in Swiss francs", scale: 0.55 },
    { id: "lbl-swiss-customs", kind: "countryLabel", startFrame: s(24.2), endFrame: s(27.0), xPct: 50, yPct: 62, text: "Swiss customs zone", scale: 0.55 },

    // Beat 3: Kleinwalsertal & Jungholz
    { id: "pin-kleinwalsertal", kind: "pinLabel", startFrame: s(30.5), endFrame: s(35.5), xPct: 38, yPct: 50, text: "Kleinwalsertal", scale: 0.7 },
    { id: "flag-at-kwt", kind: "flag", startFrame: s(31.0), endFrame: s(38.5), xPct: 22, yPct: 30, flagCode: "AT", rotationDeg: -8 },
    { id: "lbl-no-road", kind: "countryLabel", startFrame: s(33.0), endFrame: s(35.5), xPct: 50, yPct: 22, text: "No road to Austria", scale: 0.55 },
    { id: "pin-oberstdorf", kind: "pinLabel", startFrame: s(35.5), endFrame: s(38.8), xPct: 68, yPct: 31, text: "Oberstdorf", scale: 0.55 },
    { id: "flag-de-kwt", kind: "flag", startFrame: s(35.8), endFrame: s(38.8), xPct: 78, yPct: 58, flagCode: "DE", rotationDeg: 8 },
    { id: "pin-jungholz", kind: "pinLabel", startFrame: s(41.5), endFrame: s(44.5), xPct: 50, yPct: 40, text: "Jungholz", scale: 0.8 },
    { id: "flag-at-jungholz", kind: "flag", startFrame: s(41.8), endFrame: s(46.0), xPct: 72, yPct: 24, flagCode: "AT", rotationDeg: 8 },
    { id: "flag-de-jungholz", kind: "flag", startFrame: s(42.5), endFrame: s(52.0), xPct: 76, yPct: 62, flagCode: "DE", rotationDeg: -6 },
    { id: "pin-sorgschrofen", kind: "pinLabel", startFrame: s(45.0), endFrame: s(52.0), xPct: 36, yPct: 58, text: "Sorgschrofen", scale: 0.55 },
    { id: "lbl-one-point", kind: "hookBanner", startFrame: s(45.5), endFrame: s(52.0), xPct: 50, yPct: 24, accentWord: "1", text: "point" },

    // Beat 4: The Vennbahn
    { id: "pin-vennbahn", kind: "pinLabel", startFrame: s(58.0), endFrame: s(63.5), xPct: 58, yPct: 44, text: "Vennbahn", scale: 0.7 },
    { id: "flag-be-vennbahn", kind: "flag", startFrame: s(59.0), endFrame: s(66.0), xPct: 72, yPct: 28, flagCode: "BE", rotationDeg: 8 },
    { id: "flag-de-vennbahn", kind: "flag", startFrame: s(60.5), endFrame: s(66.0), xPct: 26, yPct: 62, flagCode: "DE", rotationDeg: -8 },
    {
      id: "enclave-counter",
      kind: "counter",
      startFrame: s(64.0),
      endFrame: s(70.0),
      xPct: 50,
      yPct: 17,
      counterSteps: ENCLAVE_TIMES.map((t, i) => ({ frame: s(t), value: i + 1 })),
    },
    { id: "pin-mutzenich", kind: "pinLabel", startFrame: s(70.5), endFrame: s(76.0), xPct: 46, yPct: 40, text: "Mützenich", scale: 0.8 },
    { id: "lbl-belgium-rail", kind: "countryLabel", startFrame: s(72.0), endFrame: s(80), xPct: 84, yPct: 30, text: "BELGIUM", scale: 0.5 },
    { id: "lbl-enclave", kind: "countryLabel", startFrame: s(76.0), endFrame: s(80), xPct: 46, yPct: 62, text: "German enclave", scale: 0.6 },
  ],

  captions: [
    { startFrame: s(0.0), endFrame: s(1.0), text: "Did you know" },
    { startFrame: s(1.0), endFrame: s(2.2), text: "Germany has nine neighbors —" },
    { startFrame: s(2.2), endFrame: s(3.4), text: "more than any other EU country?" },
    { startFrame: s(3.4), endFrame: s(4.6), text: "Let's count them:" },
    { startFrame: s(4.6), endFrame: s(6.1), text: "Denmark, Poland, Czechia," },
    { startFrame: s(6.1), endFrame: s(7.6), text: "Austria, Switzerland, France," },
    { startFrame: s(7.6), endFrame: s(9.4), text: "Luxembourg, Belgium and the Netherlands." },
    { startFrame: s(9.4), endFrame: s(11.5), text: "But its strangest borders are tiny." },
    { startFrame: s(11.5), endFrame: s(14.0), text: "On the Rhine, near Schaffhausen," },
    { startFrame: s(14.0), endFrame: s(16.5), text: "lies Büsingen — a German village" },
    { startFrame: s(16.5), endFrame: s(19.0), text: "completely surrounded by Switzerland." },
    { startFrame: s(19.0), endFrame: s(21.5), text: "It's only 700 meters from the rest of Germany," },
    { startFrame: s(21.5), endFrame: s(24.0), text: "yet it pays in Swiss francs" },
    { startFrame: s(24.0), endFrame: s(27.0), text: "and sits inside Swiss customs territory." },
    { startFrame: s(27.0), endFrame: s(29.5), text: "Germany also traps pieces of Austria." },
    { startFrame: s(29.5), endFrame: s(32.5), text: "The Kleinwalsertal valley is Austrian," },
    { startFrame: s(32.5), endFrame: s(35.5), text: "but mountains cut it off from the rest of Austria." },
    { startFrame: s(35.5), endFrame: s(38.5), text: "The only road in comes from Oberstdorf, in Germany." },
    { startFrame: s(38.5), endFrame: s(41.5), text: "Nearby, the Austrian village of Jungholz" },
    { startFrame: s(41.5), endFrame: s(44.5), text: "is almost completely surrounded by Germany." },
    { startFrame: s(44.5), endFrame: s(48.0), text: "It touches Austria at just one point:" },
    { startFrame: s(48.0), endFrame: s(52.0), text: "the summit of the Sorgschrofen mountain." },
    { startFrame: s(52.0), endFrame: s(55.0), text: "But the strangest border of all is near Aachen." },
    { startFrame: s(55.0), endFrame: s(58.0), text: "After World War I, a railway called the Vennbahn" },
    { startFrame: s(58.0), endFrame: s(61.0), text: "was handed to Belgium — along with the land under it." },
    { startFrame: s(61.0), endFrame: s(64.0), text: "That thin Belgian strip runs right through Germany," },
    { startFrame: s(64.0), endFrame: s(67.0), text: "cutting off five pieces of German land." },
    { startFrame: s(67.0), endFrame: s(70.0), text: "They became German enclaves surrounded by Belgium." },
    { startFrame: s(70.0), endFrame: s(73.0), text: "The largest is the village of Mützenich," },
    { startFrame: s(73.0), endFrame: s(76.5), text: "where crossing the old railway means leaving Germany." },
    { startFrame: s(76.5), endFrame: s(80.0), text: "The trains are gone — it's a bike path now — but the border remains." },
  ],

  audio: {
    narration: { src: "audio/germany-narration.mp3", startFrame: 0, volume: 1 },
    bgm: { src: "audio/bgm.mp3", startFrame: 0, volume: 0.18 },
    sfx: [
      { src: "audio/sfx/whoosh.mp3", startFrame: s(2.0), volume: 0.5 },
      { src: "audio/sfx/pop.mp3", startFrame: s(4.6), volume: 0.55 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(12.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(28.5), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(53.5), volume: 0.5 },
      { src: "audio/sfx/pop.mp3", startFrame: s(64.0), volume: 0.55 },
    ],
  },
};
