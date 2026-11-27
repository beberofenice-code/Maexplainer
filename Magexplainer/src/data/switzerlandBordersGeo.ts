/**
 * Simplified GeoJSON coordinates ([lng, lat]) for "Switzerland's Strangest Borders".
 * Shapes are stylised outlines; swap in Natural Earth / OSM data for higher fidelity.
 * Switzerland, its neighbours, Büsingen and Campione are reused from earlier videos.
 */

export const LIECHTENSTEIN_CENTER: [number, number] = [9.54, 47.16];
export const LIECHTENSTEIN_POLYGON: [number, number][][] = [
  [
    [9.475, 47.055], [9.53, 47.05], [9.61, 47.06], [9.635, 47.13], [9.6, 47.17],
    [9.57, 47.21], [9.555, 47.27], [9.53, 47.275], [9.5, 47.22], [9.49, 47.17],
    [9.475, 47.1], [9.475, 47.055],
  ],
];

/** The 2007 night march: Swiss soldiers wander ~1.5 km over the Rhine into Liechtenstein */
export const INVASION_VIEW: [number, number] = [9.475, 47.08];
export const INVASION_ROUTE: [number, number][] = [
  [9.455, 47.081],
  [9.475, 47.08],
  [9.495, 47.079],
];

/** Lake Constance (Obersee + Überlinger See), where no border has ever been agreed */
export const LAKE_CONSTANCE_VIEW: [number, number] = [9.4, 47.63];
export const LAKE_CONSTANCE_POLYGON: [number, number][][] = [
  [
    [9.18, 47.665], [9.05, 47.8], [9.1, 47.82], [9.27, 47.71], [9.48, 47.655],
    [9.62, 47.58], [9.74, 47.54], [9.72, 47.49], [9.62, 47.47], [9.53, 47.5],
    [9.37, 47.56], [9.27, 47.62], [9.18, 47.665],
  ],
];

/** Hôtel Arbez Franco-Suisse, La Cure: the border runs through the building */
export const HOTEL_ARBEZ: [number, number] = [6.0745, 46.4645];
export const LA_CURE_BORDER_LINE: [number, number][] = [
  [6.0715, 46.4615],
  [6.0745, 46.4645],
  [6.0775, 46.4675],
];
