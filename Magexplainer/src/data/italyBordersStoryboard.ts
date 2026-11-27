import { StoryboardConfig } from "../types/scene";
import { THEME } from "../styles/theme";
import {
  AUSTRIA_POLYGON,
  CAMPIONE_CENTER,
  CAMPIONE_POLYGON,
  CAMPIONE_TO_ITALY_LINE,
  FRANCE_POLYGON,
  ITALY_MAINLAND_POLYGON,
  MATTERHORN,
  NEW_ALPINE_BORDER,
  OLD_ALPINE_BORDER,
  REFUGE,
  SAN_MARINO_CENTER,
  SAN_MARINO_POLYGON,
  SARDINIA_POLYGON,
  SICILY_POLYGON,
  SLOVENIA_POLYGON,
  SWITZERLAND_POLYGON,
  VATICAN_CENTER,
  VATICAN_POLYGON,
} from "./italyBordersGeo";

const FPS = 30;
const s = (seconds: number) => Math.round(seconds * FPS);

const ITALY_SHAPES = [
  { key: "mainland", coordinates: ITALY_MAINLAND_POLYGON },
  { key: "sicily", coordinates: SICILY_POLYGON },
  { key: "sardinia", coordinates: SARDINIA_POLYGON },
];

/**
 * 78-second (2340 frames @ 30fps) "Italy's Strangest Borders" explainer.
 * Beats: hook & neighbor counter → Vatican City → San Marino →
 * Campione d'Italia → the melting Alpine border at the Matterhorn.
 */
export const ITALY_BORDERS_STORYBOARD: StoryboardConfig = {
  id: "ItalysStrangestBorders",
  title: "Italy's Strangest Borders",
  fps: FPS,
  width: 1080,
  height: 1920,
  durationInFrames: s(78),

  cameraKeyframes: [
    // Beat 1: Hook & neighbor counter (0:00 - 0:10)
    { frame: s(0), center: [12.5, 42.0], zoom: 3.4, pitch: 12, bearing: 0, basemap: "satellite" },
    { frame: s(2.5), center: [12.0, 42.8], zoom: 5.3, pitch: 18, bearing: -4, basemap: "satellite" },
    { frame: s(3.5), center: [11.8, 43.2], zoom: 5.0, pitch: 0, bearing: 0, basemap: "dark", easing: "easeOutQuart" },
    { frame: s(9.5), center: [11.9, 43.3], zoom: 4.95, pitch: 0, bearing: 0, basemap: "dark" },

    // Beat 2: Rome & Vatican City (0:10 - 0:25)
    { frame: s(10.2), center: [12.2, 42.3], zoom: 6.5, pitch: 20, bearing: -4, basemap: "satellite" },
    { frame: s(12.5), center: [12.48, 41.9], zoom: 10.6, pitch: 22, bearing: 0, basemap: "satellite" },
    { frame: s(14.5), center: VATICAN_CENTER, zoom: 14.6, pitch: 26, bearing: 8, basemap: "satellite" },
    { frame: s(24.0), center: [12.4536, 41.9031], zoom: 14.3, pitch: 20, bearing: 2, basemap: "satellite" },

    // Beat 3: San Marino (0:25 - 0:40)
    { frame: s(25.5), center: [12.3, 43.3], zoom: 7.5, pitch: 18, bearing: 0, basemap: "satellite" },
    { frame: s(28.0), center: SAN_MARINO_CENTER, zoom: 11.6, pitch: 24, bearing: -6, basemap: "satellite" },
    { frame: s(39.5), center: [12.459, 43.941], zoom: 11.25, pitch: 20, bearing: 0, basemap: "satellite" },

    // Beat 4: Campione d'Italia (0:40 - 0:58)
    { frame: s(41.0), center: [8.95, 46.2], zoom: 7.2, pitch: 18, bearing: 0, basemap: "satellite" },
    { frame: s(44.0), center: CAMPIONE_CENTER, zoom: 13.6, pitch: 26, bearing: 6, basemap: "satellite" },
    { frame: s(57.5), center: [8.975, 45.968], zoom: 13.2, pitch: 20, bearing: 0, basemap: "satellite" },

    // Beat 5: The melting border at the Matterhorn (0:58 - 1:18)
    { frame: s(59.0), center: [8.3, 46.2], zoom: 7.0, pitch: 20, bearing: 0, basemap: "satellite" },
    { frame: s(61.5), center: MATTERHORN, zoom: 12.4, pitch: 40, bearing: -10, basemap: "satellite" },
    { frame: s(66.5), center: REFUGE, zoom: 15.4, pitch: 34, bearing: 0, basemap: "satellite" },
    { frame: s(78.0), center: [7.7084, 45.9356], zoom: 15.9, pitch: 28, bearing: 6, basemap: "satellite" },
  ],

  polygons: [
    // Intro hatched fills on the dark map (0:01 - 0:10)
    ...ITALY_SHAPES.map(({ key, coordinates }) => ({
      id: `italy-${key}-hatch`,
      startFrame: s(1.0),
      endFrame: s(9.8),
      fillColor: THEME.colors.italy,
      fillOpacity: 0.88,
      strokeColor: THEME.colors.italyStroke,
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      hatched: true,
      coordinates,
    })),
    {
      id: "france-hatch",
      startFrame: s(4.8),
      endFrame: s(9.8),
      fillColor: THEME.colors.france,
      fillOpacity: 0.85,
      strokeColor: THEME.colors.franceStroke,
      strokeWidth: 3,
      hatched: true,
      coordinates: FRANCE_POLYGON,
    },
    {
      id: "switzerland-hatch",
      startFrame: s(5.6),
      endFrame: s(9.8),
      fillColor: THEME.colors.switzerland,
      fillOpacity: 0.85,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      hatched: true,
      coordinates: SWITZERLAND_POLYGON,
    },
    {
      id: "austria-hatch",
      startFrame: s(6.4),
      endFrame: s(9.8),
      fillColor: THEME.colors.austria,
      fillOpacity: 0.85,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      hatched: true,
      coordinates: AUSTRIA_POLYGON,
    },
    {
      id: "slovenia-hatch",
      startFrame: s(7.2),
      endFrame: s(9.8),
      fillColor: THEME.colors.slovenia,
      fillOpacity: 0.85,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      hatched: true,
      coordinates: SLOVENIA_POLYGON,
    },

    // Semi-transparent satellite tints (wide shots only: the simplified outlines
    // are too coarse for the close-ups at Campione and the Matterhorn)
    ...ITALY_SHAPES.map(({ key, coordinates }) => ({
      id: `italy-${key}-tint`,
      startFrame: s(9.8),
      endFrame: s(40.0),
      fillColor: THEME.colors.italy,
      fillOpacity: 0.4,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates,
    })),
    {
      id: "switzerland-tint",
      startFrame: s(40.0),
      endFrame: s(43.5),
      fillColor: THEME.colors.switzerland,
      fillOpacity: 0.4,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: SWITZERLAND_POLYGON,
    },

    // Vatican City
    {
      id: "vatican-fill",
      startFrame: s(14.0),
      endFrame: s(25.0),
      fillColor: THEME.colors.vatican,
      fillOpacity: 0.7,
      strokeColor: "#FFFFFF",
      strokeWidth: 5,
      glowColor: THEME.colors.accentYellow,
      coordinates: VATICAN_POLYGON,
    },

    // San Marino
    {
      id: "san-marino-fill",
      startFrame: s(27.0),
      endFrame: s(40.0),
      fillColor: THEME.colors.sanMarino,
      fillOpacity: 0.68,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: SAN_MARINO_POLYGON,
    },

    // Campione d'Italia: an Italian exclave inside Switzerland
    {
      id: "campione-fill",
      startFrame: s(44.0),
      endFrame: s(58.0),
      fillColor: THEME.colors.italy,
      fillOpacity: 0.75,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: CAMPIONE_POLYGON,
    },
  ],

  lines: [
    {
      id: "campione-distance",
      startFrame: s(50.0),
      endFrame: s(55.0),
      color: "#FFFFFF",
      width: 5,
      dashed: true,
      drawRange: [s(50.0), s(51.2)],
      coordinates: CAMPIONE_TO_ITALY_LINE,
    },
    {
      id: "alpine-border-old",
      startFrame: s(62.0),
      endFrame: s(78),
      color: "#FFFFFF",
      width: 5,
      dashed: true,
      coordinates: OLD_ALPINE_BORDER,
    },
    {
      id: "alpine-border-new",
      startFrame: s(70.0),
      endFrame: s(78),
      color: "#FEF08A",
      glowColor: THEME.colors.accentRed,
      width: 8,
      drawRange: [s(70.0), s(72.5)],
      coordinates: NEW_ALPINE_BORDER,
    },
  ],

  beacons: [
    { id: "vatican-beacon-intro", lngLat: VATICAN_CENTER, startFrame: s(8.4), endFrame: s(9.8), color: "#F97316", radius: 10 },
    { id: "san-marino-beacon-intro", lngLat: SAN_MARINO_CENTER, startFrame: s(8.6), endFrame: s(9.8), color: "#F97316", radius: 10 },
    { id: "vatican-beacon-rome", lngLat: VATICAN_CENTER, startFrame: s(11.5), endFrame: s(14.0), color: "#F97316", radius: 12 },
    { id: "refuge-beacon", lngLat: REFUGE, startFrame: s(66.5), endFrame: s(78), color: "#F97316", radius: 12 },
  ],

  callouts: [
    // Beat 1: Hook & neighbor counter
    { id: "lbl-italy-intro", kind: "countryLabel", startFrame: s(1.0), endFrame: s(9.8), xPct: 63, yPct: 60, text: "ITALY" },
    { id: "hook-hidden", kind: "hookBanner", startFrame: s(1.0), endFrame: s(3.4), xPct: 50, yPct: 24, accentWord: "2", text: "hidden countries" },
    { id: "hook-arrow", kind: "curvedArrow", startFrame: s(1.2), endFrame: s(3.4), xPct: 56, yPct: 34, color: "#FFFFFF" },
    {
      id: "neighbor-counter",
      kind: "counter",
      startFrame: s(4.8),
      endFrame: s(9.8),
      xPct: 50,
      yPct: 18,
      counterSteps: [
        { frame: s(4.8), value: 1 },
        { frame: s(5.6), value: 2 },
        { frame: s(6.4), value: 3 },
        { frame: s(7.2), value: 4 },
        { frame: s(8.6), value: 6 },
      ],
    },
    { id: "lbl-france-intro", kind: "countryLabel", startFrame: s(4.8), endFrame: s(9.8), xPct: 18, yPct: 46, text: "FRANCE", scale: 0.6 },
    { id: "lbl-switzerland-intro", kind: "countryLabel", startFrame: s(5.6), endFrame: s(9.8), xPct: 33, yPct: 37, text: "SWITZERLAND", scale: 0.48 },
    { id: "lbl-austria-intro", kind: "countryLabel", startFrame: s(6.4), endFrame: s(9.8), xPct: 60, yPct: 34, text: "AUSTRIA", scale: 0.55 },
    { id: "lbl-slovenia-intro", kind: "countryLabel", startFrame: s(7.2), endFrame: s(9.8), xPct: 74, yPct: 42, text: "SLOVENIA", scale: 0.48 },

    // Beat 2: Rome & Vatican City
    { id: "pin-rome", kind: "pinLabel", startFrame: s(11.8), endFrame: s(13.8), xPct: 50, yPct: 44, text: "Rome" },
    { id: "pin-vatican", kind: "pinLabel", startFrame: s(14.8), endFrame: s(18.0), xPct: 50, yPct: 40, text: "Vatican City" },
    { id: "flag-va", kind: "flag", startFrame: s(15.5), endFrame: s(23.0), xPct: 72, yPct: 24, flagCode: "VA", rotationDeg: 8 },
    { id: "flag-it-rome", kind: "flag", startFrame: s(16.5), endFrame: s(23.0), xPct: 28, yPct: 72, flagCode: "IT", rotationDeg: -8 },
    { id: "area-vatican", kind: "distanceBadge", startFrame: s(18.0), endFrame: s(20.8), xPct: 50, yPct: 60, text: "0.44 km²", subtext: "(0.17 sq mi)" },
    { id: "pop-vatican", kind: "populationBadge", startFrame: s(20.8), endFrame: s(24.5), xPct: 50, yPct: 47, text: "< 1,000" },

    // Beat 3: San Marino
    { id: "pin-san-marino", kind: "pinLabel", startFrame: s(26.0), endFrame: s(31.0), xPct: 50, yPct: 40, text: "San Marino" },
    { id: "flag-sm", kind: "flag", startFrame: s(28.5), endFrame: s(36.0), xPct: 70, yPct: 22, flagCode: "SM", rotationDeg: 6 },
    { id: "flag-it-sm", kind: "flag", startFrame: s(29.5), endFrame: s(36.0), xPct: 28, yPct: 74, flagCode: "IT", rotationDeg: -6 },
    { id: "pop-san-marino", kind: "populationBadge", startFrame: s(31.0), endFrame: s(34.0), xPct: 50, yPct: 47, text: "34,000" },
    { id: "area-san-marino", kind: "distanceBadge", startFrame: s(34.0), endFrame: s(37.0), xPct: 50, yPct: 60, text: "61 km²", subtext: "(24 sq mi)" },
    { id: "lbl-301ad", kind: "countryLabel", startFrame: s(37.0), endFrame: s(39.8), xPct: 50, yPct: 62, text: "Since 301 AD", scale: 0.8 },

    // Beat 4: Campione d'Italia
    { id: "lbl-switzerland", kind: "countryLabel", startFrame: s(40.5), endFrame: s(43.0), xPct: 46, yPct: 36, text: "SWITZERLAND", scale: 0.6 },
    { id: "campione-qmarks", kind: "questionMarks", startFrame: s(42.0), endFrame: s(44.2), xPct: 50, yPct: 49 },
    { id: "pin-campione", kind: "pinLabel", startFrame: s(44.5), endFrame: s(50.0), xPct: 50, yPct: 40, text: "Campione d'Italia", scale: 0.7 },
    { id: "flag-it-campione", kind: "flag", startFrame: s(46.0), endFrame: s(52.0), xPct: 30, yPct: 24, flagCode: "IT", rotationDeg: -8 },
    { id: "flag-ch-campione", kind: "flag", startFrame: s(47.5), endFrame: s(52.0), xPct: 70, yPct: 72, flagCode: "CH", rotationDeg: 8 },
    { id: "dist-campione", kind: "distanceBadge", startFrame: s(50.5), endFrame: s(55.0), xPct: 72, yPct: 42, text: "< 1 km", subtext: "(0.6 mi)" },
    { id: "lbl-exclave", kind: "countryLabel", startFrame: s(53.0), endFrame: s(57.8), xPct: 50, yPct: 62, text: "Exclave", scale: 0.8 },

    // Beat 5: The melting Alpine border
    { id: "lbl-alps", kind: "countryLabel", startFrame: s(59.0), endFrame: s(61.0), xPct: 46, yPct: 46, text: "THE ALPS", scale: 0.8 },
    { id: "pin-matterhorn", kind: "pinLabel", startFrame: s(61.5), endFrame: s(65.0), xPct: 50, yPct: 40, text: "Matterhorn" },
    { id: "pin-refuge", kind: "pinLabel", startFrame: s(66.8), endFrame: s(69.8), xPct: 50, yPct: 42, text: "Rifugio Guide del Cervino", scale: 0.6 },
    { id: "flag-ch-alps", kind: "flag", startFrame: s(67.5), endFrame: s(72.5), xPct: 68, yPct: 28, flagCode: "CH", rotationDeg: 8 },
    { id: "flag-it-alps", kind: "flag", startFrame: s(67.5), endFrame: s(72.5), xPct: 32, yPct: 70, flagCode: "IT", rotationDeg: -8 },
    { id: "dist-border-shift", kind: "distanceBadge", startFrame: s(73.0), endFrame: s(78), xPct: 28, yPct: 62, text: "~100 m", subtext: "(330 ft)", color: "#FFFFFF" },
  ],

  captions: [
    { startFrame: s(0.0), endFrame: s(1.0), text: "Did you know" },
    { startFrame: s(1.0), endFrame: s(2.2), text: "Italy hides" },
    { startFrame: s(2.2), endFrame: s(3.4), text: "two countries inside it?" },
    { startFrame: s(3.4), endFrame: s(4.8), text: "On the map, its borders look simple:" },
    { startFrame: s(4.8), endFrame: s(6.2), text: "France, Switzerland," },
    { startFrame: s(6.2), endFrame: s(7.6), text: "Austria and Slovenia." },
    { startFrame: s(7.6), endFrame: s(9.6), text: "But there are two more neighbors" },
    { startFrame: s(9.6), endFrame: s(11.5), text: "hiding completely inside Italy." },
    { startFrame: s(11.5), endFrame: s(13.5), text: "The first is in the heart of Rome:" },
    { startFrame: s(13.5), endFrame: s(15.5), text: "Vatican City," },
    { startFrame: s(15.5), endFrame: s(18.0), text: "the smallest country in the world." },
    { startFrame: s(18.0), endFrame: s(20.5), text: "It covers just 0.44 square kilometers" },
    { startFrame: s(20.5), endFrame: s(23.0), text: "and has fewer than 1,000 residents." },
    { startFrame: s(23.0), endFrame: s(25.5), text: "The second lies further north:" },
    { startFrame: s(25.5), endFrame: s(28.0), text: "the Republic of San Marino," },
    { startFrame: s(28.0), endFrame: s(31.0), text: "a mountaintop state completely surrounded by Italy." },
    { startFrame: s(31.0), endFrame: s(34.0), text: "Home to about 34,000 people," },
    { startFrame: s(34.0), endFrame: s(37.0), text: "it covers just 61 square kilometers" },
    { startFrame: s(37.0), endFrame: s(40.0), text: "and traces its founding back to 301 AD." },
    { startFrame: s(40.0), endFrame: s(42.5), text: "Italy also plays the trick in reverse." },
    { startFrame: s(42.5), endFrame: s(44.5), text: "On the shore of Lake Lugano" },
    { startFrame: s(44.5), endFrame: s(47.0), text: "lies Campione d'Italia —" },
    { startFrame: s(47.0), endFrame: s(50.0), text: "an Italian town completely surrounded by Switzerland," },
    { startFrame: s(50.0), endFrame: s(53.0), text: "less than a kilometer from the rest of Italy." },
    { startFrame: s(53.0), endFrame: s(55.5), text: "For decades it used Swiss francs" },
    { startFrame: s(55.5), endFrame: s(58.0), text: "and even Swiss license plates." },
    { startFrame: s(58.0), endFrame: s(61.0), text: "But Italy's strangest border is in the Alps." },
    { startFrame: s(61.0), endFrame: s(64.0), text: "Near the Matterhorn," },
    { startFrame: s(64.0), endFrame: s(67.0), text: "the border follows the glacier's watershed." },
    { startFrame: s(67.0), endFrame: s(70.0), text: "As the glaciers melt, the watershed moves —" },
    { startFrame: s(70.0), endFrame: s(73.0), text: "and so does the border." },
    { startFrame: s(73.0), endFrame: s(75.5), text: "Here it shifted about 100 meters," },
    { startFrame: s(75.5), endFrame: s(78.0), text: "putting most of this Italian mountain hut in Switzerland." },
  ],

  audio: {
    narration: { src: "audio/italy-narration.mp3", startFrame: 0, volume: 1 },
    bgm: { src: "audio/bgm.mp3", startFrame: 0, volume: 0.18 },
    sfx: [
      { src: "audio/sfx/whoosh.mp3", startFrame: s(2.0), volume: 0.5 },
      { src: "audio/sfx/pop.mp3", startFrame: s(4.8), volume: 0.55 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(12.5), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(26.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(42.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(60.0), volume: 0.5 },
    ],
  },
};
