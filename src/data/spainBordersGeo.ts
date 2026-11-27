/**
 * Simplified, clean GeoJSON coordinates for the "Spain's Strangest Borders"
 * reference recreation. Swap in full Natural Earth / OSM GeoJSON files for
 * production-grade coastline fidelity.
 */

export const SPAIN_POLYGON: [number, number][][] = [
  [
    [-9.29, 43.01], [-7.0, 43.55], [-4.5, 43.45], [-1.79, 43.36],
    [0.7, 42.75], [3.2, 42.43], [2.15, 41.38], [0.5, 40.7],
    [-0.37, 39.47], [-0.7, 37.6], [-2.1, 36.7], [-5.35, 36.14],
    [-6.3, 36.5], [-7.4, 37.2], [-7.1, 38.8], [-6.9, 40.2],
    [-6.5, 41.9], [-8.87, 41.88], [-9.29, 43.01],
  ],
];

export const FRANCE_POLYGON: [number, number][][] = [
  [
    [-4.79, 48.4], [-1.6, 49.7], [2.55, 51.08], [8.23, 48.97],
    [7.55, 47.58], [6.8, 45.8], [7.65, 43.78], [5.38, 43.29],
    [3.2, 42.43], [0.7, 42.75], [-1.79, 43.36], [-1.2, 45.6],
    [-2.5, 47.5], [-4.79, 48.4],
  ],
];

export const PORTUGAL_POLYGON: [number, number][][] = [
  [
    [-8.87, 41.88], [-6.5, 41.9], [-6.9, 40.2], [-7.1, 38.8],
    [-7.4, 37.2], [-8.99, 37.02], [-9.5, 38.75], [-8.9, 40.6],
    [-8.87, 41.88],
  ],
];

export const LLIVIA_POLYGON: [number, number][][] = [
  [
    [1.958, 42.478], [1.988, 42.482], [2.008, 42.464], [1.996, 42.448],
    [1.964, 42.452], [1.954, 42.466], [1.958, 42.478],
  ],
];

export const PHEASANT_ISLAND_POLYGON: [number, number][][] = [
  [
    [-1.7676, 43.3426], [-1.7652, 43.3431], [-1.7647, 43.3428],
    [-1.7672, 43.3422], [-1.7676, 43.3426],
  ],
];

export const ANDORRA_POLYGON: [number, number][][] = [
  [
    [1.41, 42.56], [1.52, 42.65], [1.73, 42.62], [1.78, 42.51],
    [1.62, 42.43], [1.44, 42.45], [1.41, 42.56],
  ],
];

/** True-scale NYC footprint (~783 km2) centered over Andorra (468 km2) */
export const NYC_OVER_ANDORRA_POLYGON: [number, number][][] = [
  [
    [1.36, 42.66], [1.69, 42.68], [1.80, 42.56], [1.74, 42.40],
    [1.42, 42.39], [1.31, 42.50], [1.36, 42.66],
  ],
];

export const UK_POLYGON: [number, number][][] = [
  [
    [-5.6, 50.06], [-3.2, 51.4], [-4.8, 54.6], [-5.2, 58.6],
    [-1.8, 57.6], [-1.4, 55.0], [1.75, 52.5], [1.4, 51.1],
    [-1.1, 50.7], [-5.6, 50.06],
  ],
];

export const GIBRALTAR_POLYGON: [number, number][][] = [
  [
    [-5.358, 36.155], [-5.338, 36.155], [-5.339, 36.110],
    [-5.355, 36.112], [-5.358, 36.155],
  ],
];

export const MOROCCO_POLYGON: [number, number][][] = [
  [
    [-5.8, 35.78], [-2.2, 35.1], [-1.6, 32.5], [-4.0, 29.8],
    [-9.8, 29.5], [-9.6, 31.5], [-7.6, 33.6], [-5.8, 35.78],
  ],
];

export const PENON_POLYGON: [number, number][][] = [
  [
    [-4.3016, 35.1726], [-4.2994, 35.1728], [-4.2990, 35.1714],
    [-4.3012, 35.1712], [-4.3016, 35.1726],
  ],
];

export const PYRENEES_BORDER_LINE: [number, number][] = [
  [-1.79, 43.36], [-0.9, 42.98], [0.1, 42.7], [1.1, 42.65], [2.1, 42.42], [3.2, 42.43],
];

export const UK_TO_GIBRALTAR_ARC: [number, number][] = [
  [-3.5, 52.0], [-4.8, 48.0], [-5.4, 44.0], [-5.5, 40.0], [-5.35, 36.14],
];

export const UK_TO_SPAIN_DISTANCE_LINE: [number, number][] = [
  [-5.1, 50.0], [-6.8, 43.6],
];

export const LLIVIA_DISTANCE_LINE: [number, number][] = [
  [1.965, 42.452], [1.948, 42.435],
];

export const PHEASANT_BORDER_SPANISH_HALF: [number, number][] = [
  [-1.771, 43.3420], [-1.7676, 43.3431], [-1.7647, 43.3434], [-1.761, 43.3438],
];

export const PHEASANT_BORDER_FRENCH_HALF: [number, number][] = [
  [-1.771, 43.3418], [-1.7676, 43.3420], [-1.7647, 43.3424], [-1.761, 43.3434],
];

export const PENON_SHORTEST_BORDER_LINE: [number, number][] = [
  [-4.3005, 35.1711], [-4.2996, 35.1713],
];
