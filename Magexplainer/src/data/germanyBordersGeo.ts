/**
 * Simplified GeoJSON coordinates ([lng, lat]) for "Germany's Strangest Borders".
 * Shapes are stylised outlines; swap in Natural Earth / OSM data for higher fidelity.
 * France, Belgium, Luxembourg, Switzerland and Austria are reused from earlier videos.
 */

// Shared border points so neighbouring shapes meet cleanly
const SCHENGEN: [number, number] = [6.37, 49.46];
const LAUTERBOURG: [number, number] = [8.23, 48.97];
const BASEL: [number, number] = [7.6, 47.58];
const PASSAU: [number, number] = [13.8, 48.77];
const AS_CZ: [number, number] = [12.1, 50.3];
const ZITTAU: [number, number] = [14.82, 50.87];
const STETTIN_LAGOON: [number, number] = [14.2, 53.9];
const FLENSBURG: [number, number] = [9.9, 54.8];
const SYLT_BORDER: [number, number] = [8.6, 54.9];
const DOLLART: [number, number] = [7.2, 53.25];
const VAALS: [number, number] = [6.1, 50.75];

export const GERMANY_POLYGON: [number, number][][] = [
  [
    SCHENGEN, [7.0, 49.15], LAUTERBOURG, BASEL, [8.6, 47.8], [9.5, 47.5], [10.2, 47.4],
    [10.7, 47.55], [12.2, 47.65], [13.0, 47.75], PASSAU, [12.5, 49.5], AS_CZ, [13.5, 50.6],
    ZITTAU, [14.6, 52.3], STETTIN_LAGOON, [13.4, 54.4], [11.0, 54.0], [10.9, 54.4], FLENSBURG,
    SYLT_BORDER, [8.9, 54.0], [8.6, 53.5], [7.2, 53.6], DOLLART, [7.0, 52.25], [6.0, 51.85],
    VAALS, [6.4, 50.32], [6.13, 50.13], [6.5, 49.8], SCHENGEN,
  ],
];

export const NETHERLANDS_POLYGON: [number, number][][] = [
  [
    [3.37, 51.37], [4.25, 51.37], [5.0, 51.45], [5.85, 51.15], VAALS, [6.0, 51.85],
    [7.0, 52.25], DOLLART, [6.9, 53.45], [5.0, 53.3], [4.6, 52.4], [4.0, 51.9], [3.37, 51.37],
  ],
];

export const DENMARK_POLYGON: [number, number][][] = [
  [SYLT_BORDER, FLENSBURG, [10.5, 55.0], [10.3, 56.2], [10.6, 57.7], [8.6, 57.1], [8.1, 56.0], SYLT_BORDER],
];

export const POLAND_POLYGON: [number, number][][] = [
  [
    ZITTAU, [16.3, 50.65], [18.9, 49.5], [22.6, 49.1], [24.1, 50.8], [23.6, 52.7],
    [23.5, 53.9], [22.8, 54.36], [19.6, 54.45], [18.5, 54.8], [16.5, 54.55],
    STETTIN_LAGOON, [14.6, 52.3], ZITTAU,
  ],
];

export const CZECHIA_POLYGON: [number, number][][] = [
  [PASSAU, [14.7, 48.6], [16.9, 48.6], [18.9, 49.5], [16.3, 50.65], ZITTAU, [13.5, 50.6], AS_CZ, [12.5, 49.5], PASSAU],
];

// Büsingen am Hochrhein: German exclave inside Switzerland
export const BUSINGEN_CENTER: [number, number] = [8.695, 47.699];
export const BUSINGEN_POLYGON: [number, number][][] = [
  [
    [8.655, 47.7], [8.665, 47.708], [8.685, 47.712], [8.705, 47.708], [8.725, 47.703],
    [8.735, 47.695], [8.72, 47.689], [8.7, 47.688], [8.68, 47.69], [8.665, 47.692], [8.655, 47.7],
  ],
];
/** ~700 m strip of Swiss land between Büsingen and the rest of Germany */
export const BUSINGEN_GAP_LINE: [number, number][] = [
  [8.735, 47.695],
  [8.744, 47.697],
];

// Kleinwalsertal: Austrian valley reachable by road only from Germany
export const KLEINWALSERTAL_VIEW: [number, number] = [10.2, 47.35];
export const KLEINWALSERTAL_POLYGON: [number, number][][] = [
  [
    [10.22, 47.375], [10.24, 47.35], [10.21, 47.31], [10.16, 47.27], [10.1, 47.27],
    [10.07, 47.3], [10.1, 47.34], [10.16, 47.37], [10.22, 47.375],
  ],
];
export const OBERSTDORF: [number, number] = [10.28, 47.41];
export const KLEINWALSERTAL_ROAD: [number, number][] = [
  OBERSTDORF, [10.24, 47.385], [10.21, 47.36], [10.18, 47.34], [10.15, 47.32],
];

// Jungholz: Austrian village attached to Austria at a single summit
export const JUNGHOLZ_VIEW: [number, number] = [10.45, 47.577];
export const SORGSCHROFEN: [number, number] = [10.4388, 47.5617];
export const JUNGHOLZ_POLYGON: [number, number][][] = [
  [
    [10.425, 47.567], SORGSCHROFEN, [10.46, 47.566], [10.475, 47.578], [10.465, 47.592],
    [10.445, 47.592], [10.43, 47.585], [10.425, 47.567],
  ],
];

// Vennbahn: Belgian railway strip cutting through Germany
export const VENNBAHN_VIEW: [number, number] = [6.2, 50.59];
export const VENNBAHN_LINE: [number, number][] = [
  [6.1, 50.71], [6.15, 50.67], [6.18, 50.64], [6.2, 50.615], [6.215, 50.595],
  [6.232, 50.568], [6.245, 50.545], [6.255, 50.52], [6.265, 50.49], [6.26, 50.465],
];
export const MUTZENICH_CENTER: [number, number] = [6.212, 50.567];
export const MUTZENICH_POLYGON: [number, number][][] = [
  [
    [6.195, 50.582], [6.216, 50.587], [6.228, 50.568], [6.236, 50.552], [6.215, 50.548],
    [6.195, 50.556], [6.188, 50.57], [6.195, 50.582],
  ],
];
/** Approximate positions of the five German enclaves cut off by the railway */
export const VENNBAHN_ENCLAVES: [string, [number, number]][] = [
  ["roetgener-wald", [6.135, 50.665]],
  ["munsterbildchen", [6.165, 50.64]],
  ["ruitzerwald", [6.188, 50.612]],
  ["mutzenich", MUTZENICH_CENTER],
  ["ruckschlag", [6.24, 50.522]],
];
