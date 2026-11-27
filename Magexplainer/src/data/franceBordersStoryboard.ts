import { StoryboardConfig } from "../types/scene";
import { THEME } from "../styles/theme";
import { ANDORRA_POLYGON, SPAIN_POLYGON } from "./spainBordersGeo";
import {
  ITALY_MAINLAND_POLYGON,
  SARDINIA_POLYGON,
  SICILY_POLYGON,
  SWITZERLAND_POLYGON,
} from "./italyBordersGeo";
import {
  BELGIUM_POLYGON,
  BRAZIL_POLYGON,
  CORSICA_POLYGON,
  FG_BRAZIL_BORDER_LINE,
  FG_SURINAME_BORDER_LINE,
  FRANCE_MAINLAND_POLYGON,
  FRENCH_GUIANA_POLYGON,
  GERMANY_POLYGON,
  LUXEMBOURG_POLYGON,
  MONACO_CENTER,
  MONACO_POLYGON,
  OIAPOQUE,
  OYAPOCK_VIEW_CENTER,
  PARIS_TO_SAINT_MARTIN_ARC,
  SAINT_GEORGES,
  SAINT_MARTIN_BORDER_LINE,
  SAINT_MARTIN_CENTER,
  SAINT_MARTIN_DUTCH_POLYGON,
  SAINT_MARTIN_FRENCH_POLYGON,
  SURINAME_POLYGON,
} from "./franceBordersGeo";

const FPS = 30;
const s = (seconds: number) => Math.round(seconds * FPS);

const ANDORRA_CENTER: [number, number] = [1.58, 42.54];

/** Hatched neighbour fills for the intro counter: [id, colour, appears at (s), shape] */
const INTRO_NEIGHBOURS: [string, string, number, [number, number][][]][] = [
  ["spain", THEME.colors.spain, 4.8, SPAIN_POLYGON],
  ["andorra", THEME.colors.andorra, 5.4, ANDORRA_POLYGON],
  ["italy-mainland", THEME.colors.italy, 6.0, ITALY_MAINLAND_POLYGON],
  ["italy-sicily", THEME.colors.italy, 6.0, SICILY_POLYGON],
  ["italy-sardinia", THEME.colors.italy, 6.0, SARDINIA_POLYGON],
  ["switzerland", THEME.colors.switzerland, 7.2, SWITZERLAND_POLYGON],
  ["germany", THEME.colors.germany, 7.8, GERMANY_POLYGON],
  ["luxembourg", THEME.colors.luxembourg, 8.4, LUXEMBOURG_POLYGON],
  ["belgium", THEME.colors.belgium, 9.0, BELGIUM_POLYGON],
];

/**
 * 81-second (2430 frames @ 30fps) "France's Strangest Borders" explainer.
 * Beats: hook & 8 European neighbours → Monaco → Saint Martin (France vs the
 * Netherlands in the Caribbean) → French Guiana, where France's longest land
 * border is with Brazil.
 */
export const FRANCE_BORDERS_STORYBOARD: StoryboardConfig = {
  id: "FrancesStrangestBorders",
  title: "France's Strangest Borders",
  fps: FPS,
  width: 1080,
  height: 1920,
  durationInFrames: s(81),

  cameraKeyframes: [
    // Beat 1: Hook & European neighbour counter (0:00 - 0:12)
    { frame: s(0), center: [2.5, 46.0], zoom: 3.4, pitch: 12, bearing: 0, basemap: "satellite" },
    { frame: s(2.5), center: [2.4, 46.5], zoom: 5.3, pitch: 18, bearing: -4, basemap: "satellite" },
    { frame: s(3.5), center: [2.5, 46.6], zoom: 5.0, pitch: 0, bearing: 0, basemap: "dark", easing: "easeOutQuart" },
    { frame: s(9.6), center: [2.6, 46.6], zoom: 4.95, pitch: 0, bearing: 0, basemap: "dark" },

    // Beat 2: Monaco (0:12 - 0:27)
    { frame: s(12.0), center: [6.8, 44.0], zoom: 7.8, pitch: 20, bearing: 0, basemap: "satellite" },
    { frame: s(15.0), center: MONACO_CENTER, zoom: 13.6, pitch: 26, bearing: -8, basemap: "satellite" },
    { frame: s(26.5), center: [7.421, 43.7386], zoom: 13.3, pitch: 20, bearing: 0, basemap: "satellite" },

    // Beat 3: Across the Atlantic to Saint Martin (0:27 - 0:47)
    { frame: s(28.8), center: [-30, 33], zoom: 2.6, pitch: 0, bearing: 0, basemap: "satellite" },
    { frame: s(31.2), center: [-32, 32], zoom: 2.7, pitch: 0, bearing: 0, basemap: "satellite" },
    { frame: s(34.0), center: SAINT_MARTIN_CENTER, zoom: 11.8, pitch: 24, bearing: 0, basemap: "satellite" },
    { frame: s(46.5), center: [-63.07, 18.066], zoom: 11.6, pitch: 20, bearing: 4, basemap: "satellite" },

    // Beat 4: French Guiana & the Brazil border (0:47 - 1:09)
    { frame: s(48.0), center: [-58, 12], zoom: 3.6, pitch: 10, bearing: 0, basemap: "satellite" },
    { frame: s(50.5), center: [-52.8, 3.8], zoom: 6.5, pitch: 16, bearing: 0, basemap: "satellite" },
    { frame: s(63.5), center: [-52.7, 3.7], zoom: 6.35, pitch: 14, bearing: 0, basemap: "satellite" },

    // Beat 5: The Oyapock River, France meets Brazil (1:09 - 1:21)
    { frame: s(69.0), center: OYAPOCK_VIEW_CENTER, zoom: 13.0, pitch: 30, bearing: 0, basemap: "satellite" },
    { frame: s(81.0), center: [-51.82, 3.866], zoom: 13.4, pitch: 24, bearing: 6, basemap: "satellite" },
  ],

  polygons: [
    // Intro hatched fills on the dark map (0:01 - 0:10)
    {
      id: "france-hatch",
      startFrame: s(1.0),
      endFrame: s(10.5),
      fillColor: THEME.colors.france,
      fillOpacity: 0.88,
      strokeColor: THEME.colors.franceStroke,
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      hatched: true,
      coordinates: FRANCE_MAINLAND_POLYGON,
    },
    {
      id: "corsica-hatch",
      startFrame: s(1.0),
      endFrame: s(10.5),
      fillColor: THEME.colors.france,
      fillOpacity: 0.88,
      strokeColor: THEME.colors.franceStroke,
      strokeWidth: 3,
      hatched: true,
      coordinates: CORSICA_POLYGON,
    },
    ...INTRO_NEIGHBOURS.map(([id, color, at, coordinates]) => ({
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

    // Monaco
    {
      id: "monaco-fill",
      startFrame: s(14.5),
      endFrame: s(27.0),
      fillColor: THEME.colors.accentRed,
      fillOpacity: 0.62,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: MONACO_POLYGON,
    },

    // Saint Martin: French north, Dutch south
    {
      id: "sxm-french",
      startFrame: s(34.5),
      endFrame: s(47.0),
      fillColor: THEME.colors.france,
      fillOpacity: 0.55,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: SAINT_MARTIN_FRENCH_POLYGON,
    },
    {
      id: "sxm-dutch",
      startFrame: s(35.5),
      endFrame: s(47.0),
      fillColor: THEME.colors.netherlands,
      fillOpacity: 0.55,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: SAINT_MARTIN_DUTCH_POLYGON,
    },

    // French Guiana and its neighbours (wide shots only)
    {
      id: "french-guiana",
      startFrame: s(49.5),
      endFrame: s(66.5),
      fillColor: THEME.colors.france,
      fillOpacity: 0.55,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: FRENCH_GUIANA_POLYGON,
    },
    {
      id: "suriname",
      startFrame: s(52.0),
      endFrame: s(66.5),
      fillColor: THEME.colors.suriname,
      fillOpacity: 0.45,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: SURINAME_POLYGON,
    },
    {
      id: "brazil",
      startFrame: s(54.5),
      endFrame: s(66.5),
      fillColor: THEME.colors.brazil,
      fillOpacity: 0.45,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: BRAZIL_POLYGON,
    },
  ],

  lines: [
    {
      id: "paris-sxm-arc",
      startFrame: s(28.5),
      endFrame: s(33.0),
      color: "#FFFFFF",
      glowColor: THEME.colors.accentRed,
      width: 5,
      drawRange: [s(28.8), s(31.5)],
      coordinates: PARIS_TO_SAINT_MARTIN_ARC,
    },
    {
      id: "sxm-border",
      startFrame: s(36.0),
      endFrame: s(47.0),
      color: "#FEF08A",
      glowColor: THEME.colors.accentYellow,
      width: 7,
      drawRange: [s(36.0), s(37.5)],
      coordinates: SAINT_MARTIN_BORDER_LINE,
    },
    {
      id: "fg-suriname-border",
      startFrame: s(52.0),
      endFrame: s(66.5),
      color: "#FFFFFF",
      width: 4,
      dashed: true,
      coordinates: FG_SURINAME_BORDER_LINE,
    },
    {
      id: "fg-brazil-border",
      startFrame: s(57.5),
      endFrame: s(68.0),
      color: "#FEF08A",
      glowColor: THEME.colors.accentRed,
      width: 7,
      drawRange: [s(57.5), s(60.0)],
      coordinates: FG_BRAZIL_BORDER_LINE,
    },
  ],

  beacons: [
    { id: "andorra-beacon", lngLat: ANDORRA_CENTER, startFrame: s(5.4), endFrame: s(10.5), color: "#F97316", radius: 8 },
    { id: "monaco-beacon-intro", lngLat: MONACO_CENTER, startFrame: s(6.6), endFrame: s(10.5), color: "#F97316", radius: 8 },
    { id: "saint-georges-beacon", lngLat: SAINT_GEORGES, startFrame: s(69.5), endFrame: s(81), color: "#60A5FA", radius: 12 },
    { id: "oiapoque-beacon", lngLat: OIAPOQUE, startFrame: s(71.5), endFrame: s(81), color: "#22C55E", radius: 12 },
  ],

  callouts: [
    // Beat 1: Hook & neighbour counter
    { id: "hook-brazil", kind: "hookBanner", startFrame: s(1.0), endFrame: s(3.4), xPct: 50, yPct: 24, accentWord: "BRAZIL", text: "?!" },
    { id: "hook-arrow", kind: "curvedArrow", startFrame: s(1.2), endFrame: s(3.4), xPct: 56, yPct: 34, color: "#FFFFFF" },
    { id: "lbl-france-intro", kind: "countryLabel", startFrame: s(1.0), endFrame: s(10.5), xPct: 50, yPct: 49, text: "FRANCE" },
    {
      id: "neighbor-counter",
      kind: "counter",
      startFrame: s(4.8),
      endFrame: s(10.5),
      xPct: 50,
      yPct: 17,
      counterSteps: [4.8, 5.4, 6.0, 6.6, 7.2, 7.8, 8.4, 9.0].map((t, i) => ({ frame: s(t), value: i + 1 })),
    },
    { id: "lbl-spain-intro", kind: "countryLabel", startFrame: s(4.8), endFrame: s(10.5), xPct: 26, yPct: 71, text: "SPAIN", scale: 0.6 },
    { id: "lbl-andorra-intro", kind: "countryLabel", startFrame: s(5.4), endFrame: s(10.5), xPct: 42, yPct: 66, text: "ANDORRA", scale: 0.4 },
    { id: "lbl-italy-intro", kind: "countryLabel", startFrame: s(6.0), endFrame: s(10.5), xPct: 82, yPct: 57, text: "ITALY", scale: 0.55 },
    { id: "lbl-monaco-intro", kind: "countryLabel", startFrame: s(6.6), endFrame: s(10.5), xPct: 66, yPct: 63, text: "MONACO", scale: 0.4 },
    { id: "lbl-switzerland-intro", kind: "countryLabel", startFrame: s(7.2), endFrame: s(10.5), xPct: 78, yPct: 47, text: "SWITZERLAND", scale: 0.4 },
    { id: "lbl-germany-intro", kind: "countryLabel", startFrame: s(7.8), endFrame: s(10.5), xPct: 80, yPct: 37, text: "GERMANY", scale: 0.55 },
    { id: "lbl-luxembourg-intro", kind: "countryLabel", startFrame: s(8.4), endFrame: s(10.5), xPct: 60, yPct: 41, text: "LUXEMBOURG", scale: 0.38 },
    { id: "lbl-belgium-intro", kind: "countryLabel", startFrame: s(9.0), endFrame: s(10.5), xPct: 54, yPct: 34, text: "BELGIUM", scale: 0.45 },

    // Beat 2: Monaco
    { id: "pin-monaco", kind: "pinLabel", startFrame: s(14.5), endFrame: s(18.5), xPct: 50, yPct: 40, text: "Monaco" },
    { id: "flag-mc", kind: "flag", startFrame: s(15.5), endFrame: s(24.0), xPct: 72, yPct: 24, flagCode: "MC", rotationDeg: 8 },
    { id: "flag-fr-monaco", kind: "flag", startFrame: s(16.0), endFrame: s(24.0), xPct: 26, yPct: 64, flagCode: "FR", rotationDeg: -8 },
    { id: "area-monaco", kind: "distanceBadge", startFrame: s(16.5), endFrame: s(21.5), xPct: 50, yPct: 62, text: "2 km²", subtext: "(0.78 sq mi)" },
    { id: "pop-monaco", kind: "populationBadge", startFrame: s(22.0), endFrame: s(24.5), xPct: 50, yPct: 47, text: "38,000" },
    { id: "lbl-densest", kind: "countryLabel", startFrame: s(24.5), endFrame: s(27.0), xPct: 50, yPct: 62, text: "Densest country on Earth", scale: 0.55 },

    // Beat 3: Saint Martin
    { id: "dist-paris-sxm", kind: "distanceBadge", startFrame: s(29.5), endFrame: s(32.5), xPct: 50, yPct: 36, text: "6,700 km", subtext: "(4,200 mi)", color: "#FFFFFF" },
    { id: "pin-sxm", kind: "pinLabel", startFrame: s(33.0), endFrame: s(35.5), xPct: 50, yPct: 40, text: "Saint Martin" },
    { id: "lbl-sxm-france", kind: "countryLabel", startFrame: s(35.0), endFrame: s(46.5), xPct: 50, yPct: 40, text: "FRANCE", scale: 0.6 },
    { id: "lbl-sxm-netherlands", kind: "countryLabel", startFrame: s(36.0), endFrame: s(46.5), xPct: 46, yPct: 62, text: "NETHERLANDS", scale: 0.55 },
    { id: "flag-fr-sxm", kind: "flag", startFrame: s(35.5), endFrame: s(42.0), xPct: 74, yPct: 26, flagCode: "FR", rotationDeg: 8 },
    { id: "flag-nl-sxm", kind: "flag", startFrame: s(36.5), endFrame: s(42.0), xPct: 24, yPct: 66, flagCode: "NL", rotationDeg: -8 },
    {
      id: "counter-sxm",
      kind: "counter",
      startFrame: s(37.5),
      endFrame: s(42.0),
      xPct: 50,
      yPct: 17,
      counterSteps: [
        { frame: s(37.5), value: 8 },
        { frame: s(38.5), value: 9 },
      ],
    },

    // Beat 4: French Guiana
    { id: "lbl-fg", kind: "countryLabel", startFrame: s(50.0), endFrame: s(57.0), xPct: 45, yPct: 46, text: "FRENCH GUIANA", scale: 0.6 },
    { id: "lbl-suriname", kind: "countryLabel", startFrame: s(52.0), endFrame: s(66.5), xPct: 17, yPct: 44, text: "SURINAME", scale: 0.5 },
    { id: "lbl-brazil", kind: "countryLabel", startFrame: s(54.5), endFrame: s(66.5), xPct: 54, yPct: 68, text: "BRAZIL", scale: 0.7 },
    {
      id: "counter-fg",
      kind: "counter",
      startFrame: s(52.0),
      endFrame: s(57.5),
      xPct: 50,
      yPct: 17,
      counterSteps: [
        { frame: s(52.0), value: 10 },
        { frame: s(54.5), value: 11 },
      ],
    },
    { id: "dist-fg-brazil", kind: "distanceBadge", startFrame: s(58.5), endFrame: s(63.5), xPct: 66, yPct: 56, text: "730 km", subtext: "(454 mi)", color: "#FFFFFF", rotationDeg: -40 },
    { id: "lbl-vs-spain", kind: "countryLabel", startFrame: s(60.5), endFrame: s(63.5), xPct: 50, yPct: 30, text: "Spain border: 623 km", scale: 0.5 },
    { id: "hook-longest", kind: "hookBanner", startFrame: s(63.5), endFrame: s(68.5), xPct: 50, yPct: 26, accentWord: "LONGEST", text: "border: Brazil" },
    { id: "flag-br", kind: "flag", startFrame: s(64.5), endFrame: s(68.5), xPct: 78, yPct: 80, flagCode: "BR", rotationDeg: -6 },

    // Beat 5: The Oyapock River
    { id: "pin-saint-georges", kind: "pinLabel", startFrame: s(70.0), endFrame: s(81), xPct: 66, yPct: 33, text: "Saint-Georges", scale: 0.65 },
    { id: "pin-oiapoque", kind: "pinLabel", startFrame: s(72.0), endFrame: s(81), xPct: 31, yPct: 66, text: "Oiapoque", scale: 0.65 },
    { id: "flag-fr-oyapock", kind: "flag", startFrame: s(73.5), endFrame: s(81), xPct: 80, yPct: 22, flagCode: "FR", rotationDeg: 8 },
    { id: "flag-br-oyapock", kind: "flag", startFrame: s(75.0), endFrame: s(81), xPct: 18, yPct: 50, flagCode: "BR", rotationDeg: -8 },
  ],

  captions: [
    { startFrame: s(0.0), endFrame: s(1.0), text: "Did you know" },
    { startFrame: s(1.0), endFrame: s(2.2), text: "France's longest border" },
    { startFrame: s(2.2), endFrame: s(3.4), text: "is with Brazil?" },
    { startFrame: s(3.4), endFrame: s(4.8), text: "In Europe, France has eight neighbors:" },
    { startFrame: s(4.8), endFrame: s(6.4), text: "Spain, Andorra, Italy, Monaco," },
    { startFrame: s(6.4), endFrame: s(8.0), text: "Switzerland, Germany," },
    { startFrame: s(8.0), endFrame: s(9.6), text: "Luxembourg and Belgium." },
    { startFrame: s(9.6), endFrame: s(12.0), text: "But its strangest borders hide in the corners." },
    { startFrame: s(12.0), endFrame: s(14.0), text: "On the Riviera sits Monaco," },
    { startFrame: s(14.0), endFrame: s(16.5), text: "wrapped by France on every side but the sea." },
    { startFrame: s(16.5), endFrame: s(19.0), text: "At just 2 square kilometers," },
    { startFrame: s(19.0), endFrame: s(22.0), text: "it's the second-smallest country in the world," },
    { startFrame: s(22.0), endFrame: s(24.5), text: "yet home to about 38,000 people —" },
    { startFrame: s(24.5), endFrame: s(27.0), text: "the most densely populated country on Earth." },
    { startFrame: s(27.0), endFrame: s(29.5), text: "Now cross the Atlantic." },
    { startFrame: s(29.5), endFrame: s(32.0), text: "6,700 kilometers from Paris" },
    { startFrame: s(32.0), endFrame: s(34.5), text: "lies the island of Saint Martin," },
    { startFrame: s(34.5), endFrame: s(37.5), text: "split between France and the Netherlands." },
    { startFrame: s(37.5), endFrame: s(40.0), text: "That gives France a land border with the Dutch" },
    { startFrame: s(40.0), endFrame: s(42.0), text: "that it doesn't have in Europe." },
    { startFrame: s(42.0), endFrame: s(44.5), text: "Legend says the border was settled by a walking race:" },
    { startFrame: s(44.5), endFrame: s(47.0), text: "the Frenchman drank wine, the Dutchman gin." },
    { startFrame: s(47.0), endFrame: s(49.5), text: "Further south, on the edge of the Amazon," },
    { startFrame: s(49.5), endFrame: s(52.0), text: "is French Guiana — a full part of France." },
    { startFrame: s(52.0), endFrame: s(54.5), text: "It borders Suriname to the west" },
    { startFrame: s(54.5), endFrame: s(57.5), text: "and Brazil to the south and east." },
    { startFrame: s(57.5), endFrame: s(60.5), text: "That border runs about 730 kilometers," },
    { startFrame: s(60.5), endFrame: s(63.5), text: "longer than France's border with Spain." },
    { startFrame: s(63.5), endFrame: s(66.5), text: "So France's longest land border" },
    { startFrame: s(66.5), endFrame: s(69.0), text: "is with Brazil." },
    { startFrame: s(69.0), endFrame: s(72.0), text: "Here on the Oyapock River," },
    { startFrame: s(72.0), endFrame: s(75.0), text: "a bridge links the French town of Saint-Georges" },
    { startFrame: s(75.0), endFrame: s(78.0), text: "to Oiapoque in Brazil —" },
    { startFrame: s(78.0), endFrame: s(81.0), text: "where the European Union meets South America." },
  ],

  audio: {
    narration: { src: "audio/france-narration.mp3", startFrame: 0, volume: 1 },
    bgm: { src: "audio/bgm.mp3", startFrame: 0, volume: 0.18 },
    sfx: [
      { src: "audio/sfx/whoosh.mp3", startFrame: s(2.0), volume: 0.5 },
      { src: "audio/sfx/pop.mp3", startFrame: s(4.8), volume: 0.55 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(13.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(28.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(48.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(67.5), volume: 0.5 },
    ],
  },
};
