/**
 * Simplified GeoJSON coordinates ([lng, lat]) for "France's Strangest Borders".
 * Shapes are stylised outlines; swap in Natural Earth / OSM data for higher fidelity.
 * Spain, Andorra, Italy and Switzerland are reused from the Spain and Italy videos.
 */

// Shared border points so neighbouring shapes meet cleanly
const DUNKIRK: [number, number] = [2.55, 51.08];
const BE_LU_FR: [number, number] = [5.82, 49.55];
const SCHENGEN: [number, number] = [6.37, 49.46];
const LAUTERBOURG: [number, number] = [8.23, 48.97];
const BASEL: [number, number] = [7.6, 47.58];

export const FRANCE_MAINLAND_POLYGON: [number, number][][] = [
  [
    DUNKIRK, [3.0, 50.78], [4.2, 50.3], [4.85, 50.15], [4.85, 49.8], [5.47, 49.5],
    BE_LU_FR, SCHENGEN, [7.0, 49.15], LAUTERBOURG, BASEL, [6.95, 47.3], [6.1, 46.6],
    [6.02, 46.15], [6.8, 46.4], [7.04, 45.93], [6.63, 45.11], [7.0, 44.2], [7.53, 43.79],
    [7.44, 43.75], [7.25, 43.69], [6.6, 43.15], [5.38, 43.29], [4.2, 43.45], [3.04, 42.6],
    [3.2, 42.43], [1.73, 42.62], [0.7, 42.75], [-1.79, 43.36], [-1.25, 44.6], [-1.2, 45.6],
    [-2.2, 47.2], [-4.79, 48.4], [-3.0, 48.8], [-1.6, 48.65], [-1.6, 49.7], [0.2, 49.5],
    [1.5, 50.2], [1.6, 50.9], DUNKIRK,
  ],
];

export const CORSICA_POLYGON: [number, number][][] = [
  [
    [9.4, 43.0], [9.55, 42.1], [9.2, 41.38], [8.6, 41.7], [8.6, 42.3], [9.0, 42.65], [9.4, 43.0],
  ],
];

export const BELGIUM_POLYGON: [number, number][][] = [
  [
    DUNKIRK, [3.37, 51.37], [4.25, 51.37], [5.0, 51.45], [5.85, 51.15], [6.1, 50.75],
    [6.4, 50.32], [6.13, 50.13], [5.75, 50.0], BE_LU_FR, [5.47, 49.5], [4.85, 49.8],
    [4.85, 50.15], [4.2, 50.3], [3.0, 50.78], DUNKIRK,
  ],
];

export const LUXEMBOURG_POLYGON: [number, number][][] = [
  [BE_LU_FR, SCHENGEN, [6.5, 49.8], [6.13, 50.13], [5.75, 50.0], BE_LU_FR],
];

export const GERMANY_POLYGON: [number, number][][] = [
  [
    SCHENGEN, [7.0, 49.15], LAUTERBOURG, BASEL, [8.6, 47.8], [9.5, 47.5], [10.5, 47.55],
    [13.0, 47.7], [13.8, 48.7], [12.1, 50.3], [14.8, 50.9], [14.2, 53.9], [9.9, 54.8],
    [8.6, 53.5], [7.0, 53.3], [6.0, 51.85], [6.1, 50.75], [6.4, 50.32], [6.13, 50.13],
    [6.5, 49.8], SCHENGEN,
  ],
];

export const MONACO_CENTER: [number, number] = [7.4205, 43.7384];
export const MONACO_POLYGON: [number, number][][] = [
  [
    [7.4091, 43.7247], [7.4135, 43.7315], [7.4190, 43.7365], [7.4265, 43.7435],
    [7.4335, 43.7500], [7.4395, 43.7515], [7.4390, 43.7485], [7.4310, 43.7410],
    [7.4250, 43.7340], [7.4205, 43.7300], [7.4160, 43.7255], [7.4091, 43.7247],
  ],
];

export const PARIS: [number, number] = [2.35, 48.86];
export const SAINT_MARTIN_CENTER: [number, number] = [-63.07, 18.065];

/** Stylised flight path Paris → Saint Martin (~6,700 km) */
export const PARIS_TO_SAINT_MARTIN_ARC: [number, number][] = [
  PARIS, [-10, 47.5], [-22, 44.5], [-34, 39.5], [-45, 33], [-54, 25.5], SAINT_MARTIN_CENTER,
];

const SXM_WEST: [number, number] = [-63.11, 18.045];
const SXM_LAGOON: [number, number] = [-63.07, 18.055];
const SXM_EAST: [number, number] = [-63.016, 18.054];

/** French Collectivity of Saint-Martin (north) */
export const SAINT_MARTIN_FRENCH_POLYGON: [number, number][][] = [
  [
    [-63.145, 18.07], SXM_WEST, SXM_LAGOON, SXM_EAST, [-63.01, 18.08], [-63.03, 18.11],
    [-63.06, 18.12], [-63.09, 18.1], [-63.12, 18.09], [-63.145, 18.07],
  ],
];

/** Dutch Sint Maarten (south) */
export const SAINT_MARTIN_DUTCH_POLYGON: [number, number][][] = [
  [SXM_WEST, SXM_LAGOON, SXM_EAST, [-63.03, 18.03], [-63.06, 18.015], [-63.1, 18.02], SXM_WEST],
];

export const SAINT_MARTIN_BORDER_LINE: [number, number][] = [SXM_WEST, SXM_LAGOON, SXM_EAST];

// French Guiana
const FG_COAST_WEST: [number, number] = [-54.0, 5.75];
const OYAPOCK_MOUTH: [number, number] = [-51.62, 4.15];
const TRIPOINT_FG_BR_SR: [number, number] = [-54.6, 2.33];

/** Border with Brazil: Oyapock River, then the Tumuc-Humac mountains (~730 km) */
export const FG_BRAZIL_BORDER_LINE: [number, number][] = [
  OYAPOCK_MOUTH, [-51.85, 3.85], [-52.3, 3.2], [-52.6, 2.5], [-52.95, 2.18],
  [-53.8, 2.3], TRIPOINT_FG_BR_SR,
];

/** Border with Suriname: the Maroni / Lawa River (~510 km) */
export const FG_SURINAME_BORDER_LINE: [number, number][] = [
  TRIPOINT_FG_BR_SR, [-54.2, 3.2], [-54.0, 4.0], [-54.4, 4.7], FG_COAST_WEST,
];

export const FRENCH_GUIANA_POLYGON: [number, number][][] = [
  [
    FG_COAST_WEST, [-53.0, 5.45], [-52.33, 4.93], [-51.85, 4.6],
    ...FG_BRAZIL_BORDER_LINE,
    ...FG_SURINAME_BORDER_LINE.slice(1),
  ],
];

export const SURINAME_POLYGON: [number, number][][] = [
  [
    ...[...FG_SURINAME_BORDER_LINE].reverse(),
    [-56.0, 1.9], [-57.0, 3.3], [-58.0, 4.0], [-57.1, 5.9], [-55.9, 5.9], FG_COAST_WEST,
  ],
];

/** Northern Brazil (Amapá / Pará), clipped well south of the border */
export const BRAZIL_POLYGON: [number, number][][] = [
  [
    ...FG_BRAZIL_BORDER_LINE,
    [-56.5, 1.9], [-55.0, -1.0], [-50.0, 0.0], [-50.5, 2.0], OYAPOCK_MOUTH,
  ],
];

/** Twin towns linked by the Oyapock River Bridge */
export const SAINT_GEORGES: [number, number] = [-51.805, 3.89];
export const OIAPOQUE: [number, number] = [-51.835, 3.84];
export const OYAPOCK_VIEW_CENTER: [number, number] = [-51.82, 3.865];
