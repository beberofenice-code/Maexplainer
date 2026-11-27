import { StoryboardConfig } from "../types/scene";
import { THEME } from "../styles/theme";
import {
  ANDORRA_POLYGON,
  FRANCE_POLYGON,
  GIBRALTAR_POLYGON,
  LLIVIA_DISTANCE_LINE,
  LLIVIA_POLYGON,
  MOROCCO_POLYGON,
  NYC_OVER_ANDORRA_POLYGON,
  PENON_POLYGON,
  PENON_SHORTEST_BORDER_LINE,
  PHEASANT_BORDER_FRENCH_HALF,
  PHEASANT_BORDER_SPANISH_HALF,
  PHEASANT_ISLAND_POLYGON,
  PORTUGAL_POLYGON,
  PYRENEES_BORDER_LINE,
  SPAIN_POLYGON,
  UK_POLYGON,
  UK_TO_GIBRALTAR_ARC,
  UK_TO_SPAIN_DISTANCE_LINE,
} from "./spainBordersGeo";

const FPS = 30;
const s = (seconds: number) => Math.round(seconds * FPS);

/**
 * Full 96.6-second (2898 frames @ 30fps) reference recreation of
 * "Spain's Strangest Borders" in the GeoGlobe Tales visual style.
 */
export const SPAIN_BORDERS_STORYBOARD: StoryboardConfig = {
  id: "SpainsStrangestBorders",
  title: "Spain's Strangest Borders",
  fps: FPS,
  width: 1080,
  height: 1920,
  durationInFrames: 2898,

  cameraKeyframes: [
    // Beat 1: Hook & Neighbor Counter (0:00 - 0:10)
    { frame: s(0), center: [-4.5, 39.0], zoom: 3.1, pitch: 12, bearing: 0, basemap: "satellite" },
    { frame: s(2.5), center: [-3.7, 40.3], zoom: 4.9, pitch: 18, bearing: -4, basemap: "satellite" },
    { frame: s(3.5), center: [-3.2, 40.8], zoom: 4.5, pitch: 0, bearing: 0, basemap: "dark", easing: "easeOutQuart" },
    { frame: s(9.5), center: [-2.2, 41.2], zoom: 4.4, pitch: 0, bearing: 0, basemap: "dark" },

    // Beat 2: Pyrenees & Llivia Enclave (0:10 - 0:23)
    { frame: s(10.2), center: [0.2, 43.2], zoom: 5.7, pitch: 22, bearing: -6, basemap: "satellite" },
    { frame: s(13.5), center: [1.97, 42.46], zoom: 11.4, pitch: 24, bearing: 4, basemap: "satellite" },
    { frame: s(21.0), center: [1.96, 42.45], zoom: 10.6, pitch: 18, bearing: 0, basemap: "satellite" },

    // Beat 3: Pheasant Island (0:23 - 0:42)
    { frame: s(25.5), center: [-1.77, 43.34], zoom: 8.5, pitch: 20, bearing: 0, basemap: "satellite" },
    { frame: s(28.5), center: [-1.7662, 43.3427], zoom: 16.2, pitch: 28, bearing: -12, basemap: "satellite" },
    { frame: s(41.5), center: [-1.7662, 43.3427], zoom: 16.0, pitch: 22, bearing: -8, basemap: "satellite" },

    // Beat 4: Andorra vs NYC (0:42 - 0:52)
    { frame: s(44.5), center: [1.56, 42.54], zoom: 6.4, pitch: 18, bearing: 0, basemap: "satellite" },
    { frame: s(47.0), center: [1.56, 42.54], zoom: 9.8, pitch: 24, bearing: 0, basemap: "satellite" },
    { frame: s(51.8), center: [1.56, 42.54], zoom: 9.5, pitch: 20, bearing: 0, basemap: "satellite" },

    // Beat 5: UK & Gibraltar (0:52 - 1:14)
    { frame: s(54.5), center: [-2.5, 46.5], zoom: 4.1, pitch: 15, bearing: 0, basemap: "satellite" },
    { frame: s(60.5), center: [-5.35, 36.14], zoom: 12.2, pitch: 26, bearing: -10, basemap: "satellite" },
    { frame: s(68.0), center: [-5.4, 36.05], zoom: 7.4, pitch: 18, bearing: 0, basemap: "satellite" },
    { frame: s(72.5), center: [-3.5, 36.5], zoom: 3.1, pitch: 10, bearing: 0, basemap: "satellite" },

    // Beat 6: Morocco, Ceuta, Melilla & Penon de Velez de la Gomera (1:14 - 1:36.6)
    { frame: s(79.0), center: [-4.3, 35.8], zoom: 5.5, pitch: 20, bearing: 0, basemap: "satellite" },
    { frame: s(84.5), center: [-4.2, 35.4], zoom: 7.6, pitch: 22, bearing: 0, basemap: "satellite" },
    { frame: s(88.5), center: [-4.3005, 35.1718], zoom: 16.4, pitch: 24, bearing: 6, basemap: "satellite" },
    { frame: s(96.6), center: [-4.3002, 35.1714], zoom: 17.2, pitch: 20, bearing: 10, basemap: "satellite" },
  ],

  polygons: [
    // Intro hatched fills (0:01 - 0:10)
    {
      id: "spain-hatch",
      startFrame: s(1.0),
      endFrame: s(9.8),
      fillColor: THEME.colors.spain,
      fillOpacity: 0.88,
      strokeColor: THEME.colors.spainStroke,
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      hatched: true,
      coordinates: SPAIN_POLYGON,
    },
    {
      id: "france-hatch",
      startFrame: s(5.5),
      endFrame: s(9.8),
      fillColor: THEME.colors.france,
      fillOpacity: 0.85,
      strokeColor: THEME.colors.franceStroke,
      strokeWidth: 3,
      hatched: true,
      coordinates: FRANCE_POLYGON,
    },
    {
      id: "portugal-hatch",
      startFrame: s(6.5),
      endFrame: s(9.8),
      fillColor: THEME.colors.portugal,
      fillOpacity: 0.85,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      hatched: true,
      coordinates: PORTUGAL_POLYGON,
    },

    // Semi-transparent satellite country tints (0:10 - 1:36)
    {
      id: "spain-tint",
      startFrame: s(9.8),
      endFrame: s(87.0),
      fillColor: THEME.colors.spain,
      fillOpacity: 0.45,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: SPAIN_POLYGON,
    },
    {
      id: "france-tint",
      startFrame: s(9.8),
      endFrame: s(59.0),
      fillColor: THEME.colors.france,
      fillOpacity: 0.42,
      strokeColor: "#FFFFFF",
      strokeWidth: 2.5,
      coordinates: FRANCE_POLYGON,
    },

    // Llivia Enclave highlight
    {
      id: "llivia-enclave",
      startFrame: s(13.5),
      endFrame: s(23.5),
      fillColor: THEME.colors.spain,
      fillOpacity: 0.72,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      glowColor: THEME.colors.accentYellow,
      coordinates: LLIVIA_POLYGON,
    },

    // Pheasant Island 6-month ownership swaps
    {
      id: "pheasant-spanish-half",
      startFrame: s(35.0),
      endFrame: s(38.0),
      fillColor: THEME.colors.spain,
      fillOpacity: 0.65,
      strokeColor: THEME.colors.accentYellow,
      strokeWidth: 4,
      coordinates: PHEASANT_ISLAND_POLYGON,
    },
    {
      id: "pheasant-french-half",
      startFrame: s(38.0),
      endFrame: s(42.0),
      fillColor: THEME.colors.france,
      fillOpacity: 0.65,
      strokeColor: THEME.colors.accentYellow,
      strokeWidth: 4,
      coordinates: PHEASANT_ISLAND_POLYGON,
    },

    // Andorra + NYC true-scale slide-over comparison
    {
      id: "andorra-fill",
      startFrame: s(44.0),
      endFrame: s(52.5),
      fillColor: THEME.colors.andorra,
      fillOpacity: 0.62,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      coordinates: ANDORRA_POLYGON,
    },
    {
      id: "nyc-comparison",
      startFrame: s(49.5),
      endFrame: s(52.0),
      fillColor: THEME.colors.nycOverlay,
      fillOpacity: 0.5,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      slideFromOffset: { startFrame: s(49.5), endFrame: s(50.8), dLng: -0.65, dLat: 0 },
      coordinates: NYC_OVER_ANDORRA_POLYGON,
    },

    // UK & Gibraltar
    {
      id: "uk-fill",
      startFrame: s(54.0),
      endFrame: s(60.5),
      fillColor: THEME.colors.uk,
      fillOpacity: 0.62,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: UK_POLYGON,
    },
    {
      id: "gibraltar-fill",
      startFrame: s(60.0),
      endFrame: s(68.0),
      fillColor: THEME.colors.uk,
      fillOpacity: 0.68,
      strokeColor: "#FFFFFF",
      strokeWidth: 3,
      coordinates: GIBRALTAR_POLYGON,
    },

    // Morocco & Penon de Velez de la Gomera
    {
      id: "morocco-fill",
      startFrame: s(79.5),
      endFrame: s(96.6),
      fillColor: THEME.colors.morocco,
      fillOpacity: 0.45,
      strokeColor: "#CCFBF1",
      strokeWidth: 3,
      coordinates: MOROCCO_POLYGON,
    },
    {
      id: "penon-fill",
      startFrame: s(89.5),
      endFrame: s(96.6),
      fillColor: THEME.colors.spain,
      fillOpacity: 0.52,
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      coordinates: PENON_POLYGON,
    },
  ],

  lines: [
    {
      id: "pyrenees-glow",
      startFrame: s(10.5),
      endFrame: s(13.5),
      color: "#FFFFFF",
      glowColor: THEME.colors.accentYellow,
      width: 5,
      drawRange: [s(10.5), s(11.8)],
      coordinates: PYRENEES_BORDER_LINE,
    },
    {
      id: "llivia-distance",
      startFrame: s(16.5),
      endFrame: s(19.5),
      color: THEME.colors.accentYellow,
      width: 6,
      dashed: true,
      coordinates: LLIVIA_DISTANCE_LINE,
    },
    {
      id: "pheasant-border-es",
      startFrame: s(35.0),
      endFrame: s(38.0),
      color: THEME.colors.accentYellow,
      glowColor: THEME.colors.accentYellow,
      width: 6,
      coordinates: PHEASANT_BORDER_SPANISH_HALF,
    },
    {
      id: "pheasant-border-fr",
      startFrame: s(38.0),
      endFrame: s(42.0),
      color: THEME.colors.accentYellow,
      glowColor: THEME.colors.accentYellow,
      width: 6,
      coordinates: PHEASANT_BORDER_FRENCH_HALF,
    },
    {
      id: "uk-spain-distance",
      startFrame: s(55.5),
      endFrame: s(60.0),
      color: "#FFFFFF",
      width: 5,
      dashed: true,
      coordinates: UK_TO_SPAIN_DISTANCE_LINE,
    },
    {
      id: "uk-gibraltar-arc",
      startFrame: s(57.8),
      endFrame: s(60.5),
      color: "#FFFFFF",
      glowColor: THEME.colors.accentRed,
      width: 6,
      drawRange: [s(57.8), s(59.6)],
      coordinates: UK_TO_GIBRALTAR_ARC,
    },
    {
      id: "penon-85m-border",
      startFrame: s(92.0),
      endFrame: s(96.6),
      color: "#FEF08A",
      glowColor: THEME.colors.accentYellow,
      width: 10,
      coordinates: PENON_SHORTEST_BORDER_LINE,
    },
  ],

  beacons: [
    { id: "ceuta-beacon", lngLat: [-5.316, 35.889], startFrame: s(78.5), endFrame: s(86.5), color: "#F97316", radius: 10 },
    { id: "penon-beacon", lngLat: [-4.300, 35.172], startFrame: s(79.0), endFrame: s(86.5), color: "#F97316", radius: 10 },
    { id: "melilla-beacon", lngLat: [-2.938, 35.292], startFrame: s(79.5), endFrame: s(86.5), color: "#F97316", radius: 10 },
  ],

  callouts: [
    { id: "lbl-spain-intro", kind: "countryLabel", startFrame: s(1.0), endFrame: s(9.8), xPct: 48, yPct: 50, text: "SPAIN" },
    { id: "hook-not-simple", kind: "hookBanner", startFrame: s(2.0), endFrame: s(3.4), xPct: 62, yPct: 26, accentWord: "NOT", text: "as simple as it looks" },
    { id: "hook-arrow", kind: "curvedArrow", startFrame: s(2.1), endFrame: s(3.4), xPct: 56, yPct: 36, color: "#FFFFFF" },
    {
      id: "neighbor-counter",
      kind: "counter",
      startFrame: s(4.8),
      endFrame: s(9.8),
      xPct: 48,
      yPct: 19,
      counterSteps: [
        { frame: s(4.8), value: 1 },
        { frame: s(6.0), value: 2 },
        { frame: s(7.6), value: 4 },
        { frame: s(8.6), value: 5 },
      ],
    },
    { id: "lbl-france-intro", kind: "countryLabel", startFrame: s(5.6), endFrame: s(9.8), xPct: 60, yPct: 37, text: "FRANCE", scale: 0.72 },
    { id: "lbl-portugal-intro", kind: "countryLabel", startFrame: s(6.5), endFrame: s(9.8), xPct: 28, yPct: 49, text: "PORTUGAL", scale: 0.56 },

    // Pyrenees & Llivia
    { id: "pyrenees-qmarks", kind: "questionMarks", startFrame: s(11.0), endFrame: s(13.0), xPct: 50, yPct: 49 },
    { id: "pin-llivia", kind: "pinLabel", startFrame: s(14.0), endFrame: s(20.5), xPct: 52, yPct: 38, text: "Llivia" },
    { id: "flag-fr-llivia", kind: "flag", startFrame: s(15.5), endFrame: s(20.5), xPct: 68, yPct: 19, flagCode: "FR" },
    { id: "flag-es-llivia", kind: "flag", startFrame: s(18.0), endFrame: s(20.5), xPct: 28, yPct: 73, flagCode: "ES" },
    { id: "dist-llivia", kind: "distanceBadge", startFrame: s(16.5), endFrame: s(19.5), xPct: 54, yPct: 58, text: "2 km", subtext: "(1.24 mi)", rotationDeg: 18 },
    { id: "lbl-enclave", kind: "countryLabel", startFrame: s(21.2), endFrame: s(23.5), xPct: 62, yPct: 37, text: "Enclave", scale: 0.78 },

    // Pheasant Island
    { id: "pin-pheasant", kind: "pinLabel", startFrame: s(26.0), endFrame: s(28.0), xPct: 50, yPct: 46, text: "Pheasant Island" },
    { id: "pheasant-tug", kind: "pheasantTugOfWar", startFrame: s(29.0), endFrame: s(34.5), xPct: 50, yPct: 50 },
    { id: "flag-fr-pheasant", kind: "flag", startFrame: s(34.6), endFrame: s(41.5), xPct: 50, yPct: 34, flagCode: "FR" },
    { id: "flag-es-pheasant", kind: "flag", startFrame: s(34.6), endFrame: s(41.5), xPct: 50, yPct: 66, flagCode: "ES" },

    // Andorra
    { id: "pin-andorra", kind: "pinLabel", startFrame: s(44.2), endFrame: s(49.4), xPct: 50, yPct: 41, text: "Andorra" },
    { id: "pop-andorra", kind: "populationBadge", startFrame: s(47.6), endFrame: s(49.4), xPct: 50, yPct: 47, text: "80,000" },
    { id: "lbl-nyc", kind: "countryLabel", startFrame: s(50.0), endFrame: s(52.0), xPct: 50, yPct: 37, text: "New York", scale: 0.78 },

    // UK & Gibraltar
    { id: "lbl-uk", kind: "countryLabel", startFrame: s(54.2), endFrame: s(59.5), xPct: 50, yPct: 32, text: "UNITED KINGDOM", scale: 0.62 },
    { id: "dist-uk-es", kind: "distanceBadge", startFrame: s(55.8), endFrame: s(59.8), xPct: 33, yPct: 45, text: "706 km", subtext: "(438 mi)", color: "#FFFFFF", rotationDeg: -72 },
    { id: "pin-gibraltar", kind: "pinLabel", startFrame: s(61.5), endFrame: s(63.8), xPct: 50, yPct: 46, text: "Gibraltar" },
    { id: "flag-es-gib", kind: "flag", startFrame: s(63.8), endFrame: s(66.8), xPct: 44, yPct: 43, flagCode: "ES", rotationDeg: -10 },
    { id: "flag-uk-gib", kind: "flag", startFrame: s(63.8), endFrame: s(66.8), xPct: 54, yPct: 51, flagCode: "UK", rotationDeg: 8 },
    { id: "lbl-europe", kind: "countryLabel", startFrame: s(72.2), endFrame: s(74.0), xPct: 52, yPct: 41, text: "Europe", scale: 0.85 },
    { id: "lbl-africa", kind: "countryLabel", startFrame: s(72.4), endFrame: s(74.0), xPct: 46, yPct: 54, text: "Africa", scale: 0.85 },

    // Morocco, Ceuta, Melilla & Penon
    { id: "lbl-morocco", kind: "countryLabel", startFrame: s(80.5), endFrame: s(83.8), xPct: 36, yPct: 60, text: "MOROCCO", scale: 0.65 },
    { id: "pin-ceuta", kind: "pinLabel", startFrame: s(83.8), endFrame: s(86.8), xPct: 26, yPct: 37, text: "Ceuta", scale: 0.82 },
    { id: "pin-melilla", kind: "pinLabel", startFrame: s(84.2), endFrame: s(86.8), xPct: 78, yPct: 37, text: "Melilla", scale: 0.82 },
    { id: "pin-penon", kind: "pinLabel", startFrame: s(85.5), endFrame: s(89.0), xPct: 52, yPct: 44, text: "Peñón de Vélez de la Gomera", scale: 0.62 },
    { id: "flag-es-penon", kind: "flag", startFrame: s(88.2), endFrame: s(96.6), xPct: 38, yPct: 48, flagCode: "ES", rotationDeg: 18 },
    { id: "dist-85m", kind: "distanceBadge", startFrame: s(94.2), endFrame: s(96.6), xPct: 54, yPct: 54, text: "85 m", subtext: "(279 ft)", color: "#FFFFFF" },
  ],

  captions: [
    { startFrame: s(0.0), endFrame: s(1.0), text: "Did you know" },
    { startFrame: s(1.0), endFrame: s(2.0), text: "Spain is the country" },
    { startFrame: s(2.0), endFrame: s(3.2), text: "with the strangest borders?" },
    { startFrame: s(3.2), endFrame: s(4.5), text: "On the map, it looks like Spain" },
    { startFrame: s(4.5), endFrame: s(6.0), text: "has only two land neighbors," },
    { startFrame: s(6.0), endFrame: s(7.2), text: "France and Portugal," },
    { startFrame: s(7.2), endFrame: s(9.0), text: "but in reality there are many more." },
    { startFrame: s(9.0), endFrame: s(11.0), text: "Just the border with France" },
    { startFrame: s(11.0), endFrame: s(13.0), text: "creates a few unusual oddities." },
    { startFrame: s(13.0), endFrame: s(15.0), text: "For example, the town of Llivia," },
    { startFrame: s(15.0), endFrame: s(17.0), text: "which lies entirely within French territory," },
    { startFrame: s(17.0), endFrame: s(19.0), text: "only 2 kilometers from the border," },
    { startFrame: s(19.0), endFrame: s(21.0), text: "but it is Spanish territory." },
    { startFrame: s(21.0), endFrame: s(23.0), text: "This phenomenon is called an enclave." },
    { startFrame: s(23.0), endFrame: s(25.5), text: "Further west, you'll find an even more surprising case:" },
    { startFrame: s(25.5), endFrame: s(27.5), text: "Pheasant Island." },
    { startFrame: s(27.5), endFrame: s(30.5), text: "Spain and France couldn't agree on how to divide it" },
    { startFrame: s(30.5), endFrame: s(33.0), text: "because the border ran right through the middle," },
    { startFrame: s(33.0), endFrame: s(35.0), text: "so they decided to take turns owning it." },
    { startFrame: s(35.0), endFrame: s(38.0), text: "For the first half of the year it belongs to Spain," },
    { startFrame: s(38.0), endFrame: s(41.5), text: "and for the second half, the border shifts to France." },
    { startFrame: s(41.5), endFrame: s(44.5), text: "There is also another neighbor hidden between them: Andorra." },
    { startFrame: s(44.5), endFrame: s(48.5), text: "One of the smallest countries, with a population of 80,000" },
    { startFrame: s(48.5), endFrame: s(52.0), text: "and almost half the size of New York City." },
    { startFrame: s(52.0), endFrame: s(55.5), text: "Spain has another hidden neighbor: the United Kingdom." },
    { startFrame: s(55.5), endFrame: s(60.5), text: "Britain holds an overseas territory at the tip of Iberia:" },
    { startFrame: s(60.5), endFrame: s(66.5), text: "Gibraltar — a centuries-old dispute between Spain and the UK" },
    { startFrame: s(66.5), endFrame: s(71.0), text: "controlling access to the Mediterranean via the Strait of Gibraltar." },
    { startFrame: s(71.0), endFrame: s(74.5), text: "The strait divides two continents: Europe and Africa." },
    { startFrame: s(74.5), endFrame: s(78.5), text: "Yet Spain is the only European country with a land border in Africa," },
    { startFrame: s(78.5), endFrame: s(82.5), text: "thanks to three Spanish enclaves bordering Morocco." },
    { startFrame: s(82.5), endFrame: s(86.0), text: "Two are the cities of Ceuta and Melilla," },
    { startFrame: s(86.0), endFrame: s(90.5), text: "and the third is Peñón de Vélez de la Gomera, once an island" },
    { startFrame: s(90.5), endFrame: s(94.0), text: "connected to the mainland by a narrow isthmus," },
    { startFrame: s(94.0), endFrame: s(96.6), text: "creating the shortest land border in the world — just 85 meters long." },
  ],

  audio: {
    narration: { src: "audio/narration.mp3", startFrame: 0, volume: 1 },
    bgm: { src: "audio/bgm.mp3", startFrame: 0, volume: 0.18 },
    sfx: [
      { src: "audio/sfx/whoosh.mp3", startFrame: s(2.0), volume: 0.5 },
      { src: "audio/sfx/pop.mp3", startFrame: s(4.8), volume: 0.55 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(13.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(27.5), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(58.0), volume: 0.5 },
      { src: "audio/sfx/whoosh.mp3", startFrame: s(87.0), volume: 0.5 },
    ],
  },
};
