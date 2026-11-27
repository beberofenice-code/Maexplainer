/**
 * Simplified GeoJSON coordinates ([lng, lat]) for "Italy's Strangest Borders".
 * Shapes are stylised outlines; swap in Natural Earth / OSM data for higher fidelity.
 */

// Shared Alpine border points so neighbouring shapes meet cleanly
const VENTIMIGLIA: [number, number] = [7.53, 43.79];
const MONT_BLANC: [number, number] = [7.04, 45.93];
const MONTE_ROSA: [number, number] = [7.86, 45.92];
const CHIASSO: [number, number] = [9.04, 45.84];
const RESIA: [number, number] = [10.47, 46.86];
const BRENNER: [number, number] = [11.5, 47.0];
const TRIPOINT_AT_SI: [number, number] = [13.71, 46.52];

export const ITALY_MAINLAND_POLYGON: [number, number][][] = [
  [
    VENTIMIGLIA, [7.0, 44.2], [6.63, 45.11], MONT_BLANC, MONTE_ROSA,
    [8.44, 46.46], CHIASSO, [9.54, 46.29], [10.45, 46.54], RESIA, BRENNER,
    [12.2, 47.0], [12.73, 46.65], TRIPOINT_AT_SI, [13.62, 45.77], [13.77, 45.62],
    [12.3, 45.4], [12.4, 44.5], [13.6, 43.6], [14.7, 42.1], [16.0, 41.9],
    [17.2, 40.9], [18.5, 40.1], [17.2, 40.4], [16.6, 39.6], [17.1, 39.0],
    [16.1, 38.0], [15.65, 38.0], [15.8, 38.9], [15.6, 40.1], [14.3, 40.8],
    [13.0, 41.2], [12.2, 41.8], [11.1, 42.4], [10.5, 43.0], [10.2, 43.9],
    [9.0, 44.4], [8.2, 43.9], VENTIMIGLIA,
  ],
];

export const SICILY_POLYGON: [number, number][][] = [
  [
    [12.4, 37.8], [13.3, 38.2], [15.6, 38.3], [15.1, 37.0], [15.1, 36.7],
    [14.3, 37.0], [12.6, 37.6], [12.4, 37.8],
  ],
];

export const SARDINIA_POLYGON: [number, number][][] = [
  [
    [8.4, 40.9], [9.2, 41.25], [9.8, 40.5], [9.6, 39.2], [9.0, 39.1],
    [8.4, 39.0], [8.4, 39.9], [8.4, 40.9],
  ],
];

export const FRANCE_POLYGON: [number, number][][] = [
  [
    VENTIMIGLIA, [7.0, 44.2], [6.63, 45.11], MONT_BLANC, [6.8, 46.4],
    [6.02, 46.15], [6.1, 46.6], [6.95, 47.3], [7.6, 47.58], [8.23, 48.97],
    [2.55, 51.08], [-1.6, 49.7], [-4.79, 48.4], [-2.5, 47.5], [-1.2, 45.6],
    [-1.79, 43.36], [0.7, 42.75], [3.2, 42.43], [5.38, 43.29], VENTIMIGLIA,
  ],
];

export const SWITZERLAND_POLYGON: [number, number][][] = [
  [
    [6.02, 46.15], [6.1, 46.6], [6.95, 47.3], [7.6, 47.58], [8.6, 47.8],
    [9.5, 47.5], [9.6, 47.06], RESIA, [10.45, 46.54], [9.54, 46.29],
    CHIASSO, [8.44, 46.46], MONTE_ROSA, MONT_BLANC, [6.8, 46.4], [6.02, 46.15],
  ],
];

export const AUSTRIA_POLYGON: [number, number][][] = [
  [
    [9.55, 47.27], [9.6, 47.06], RESIA, BRENNER, [12.2, 47.0], [12.73, 46.65],
    TRIPOINT_AT_SI, [14.6, 46.6], [16.0, 46.8], [16.9, 48.0], [17.1, 48.3],
    [16.9, 48.6], [15.0, 49.0], [13.8, 48.7], [13.0, 47.7], [12.2, 47.7],
    [10.5, 47.55], [9.55, 47.27],
  ],
];

export const SLOVENIA_POLYGON: [number, number][][] = [
  [
    TRIPOINT_AT_SI, [14.6, 46.6], [16.0, 46.8], [16.6, 46.5], [15.6, 46.0],
    [15.3, 45.5], [13.6, 45.45], [13.77, 45.62], [13.62, 45.77], TRIPOINT_AT_SI,
  ],
];

export const VATICAN_CENTER: [number, number] = [12.4534, 41.9029];
export const VATICAN_POLYGON: [number, number][][] = [
  [
    [12.4457, 41.9007], [12.4469, 41.9043], [12.4497, 41.9065], [12.4535, 41.9072],
    [12.4560, 41.9071], [12.4584, 41.9025], [12.4540, 41.9003], [12.4497, 41.8998],
    [12.4457, 41.9007],
  ],
];

export const SAN_MARINO_CENTER: [number, number] = [12.457, 43.942];
export const SAN_MARINO_POLYGON: [number, number][][] = [
  [
    [12.40, 43.96], [12.43, 43.985], [12.47, 43.99], [12.51, 43.98], [12.52, 43.95],
    [12.51, 43.92], [12.49, 43.895], [12.45, 43.893], [12.42, 43.905], [12.40, 43.93],
    [12.40, 43.96],
  ],
];

export const CAMPIONE_CENTER: [number, number] = [8.9705, 45.9685];
export const CAMPIONE_POLYGON: [number, number][][] = [
  [
    [8.962, 45.976], [8.969, 45.979], [8.976, 45.978], [8.982, 45.968],
    [8.979, 45.961], [8.972, 45.957], [8.964, 45.962], [8.962, 45.976],
  ],
];

/** Dashed measurement from Campione to the nearest Italian border (< 1 km) */
export const CAMPIONE_TO_ITALY_LINE: [number, number][] = [
  [8.982, 45.97],
  [8.995, 45.972],
];

export const MATTERHORN: [number, number] = [7.6586, 45.9763];
/** Rifugio Guide del Cervino at Testa Grigia, on the Italy–Switzerland border */
export const REFUGE: [number, number] = [7.7083, 45.9357];

/** Old glacier-watershed border, north of the refuge (refuge in Italy) */
export const OLD_ALPINE_BORDER: [number, number][] = [
  MATTERHORN, [7.676, 45.962], [7.69, 45.948], [7.70, 45.9405], [7.7083, 45.9372], [7.718, 45.9335], [7.73, 45.93],
];

/** New border after the glacier retreated (~100 m south, refuge mostly in Switzerland) */
export const NEW_ALPINE_BORDER: [number, number][] = [
  MATTERHORN, [7.676, 45.9612], [7.69, 45.9466], [7.70, 45.9390], [7.7083, 45.9346], [7.718, 45.9318], [7.73, 45.9288],
];
