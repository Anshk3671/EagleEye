/**
 * indiaGeo.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GeoJSON data file containing India's geographic boundary coordinates.
 *
 * WHAT IT CONTAINS:
 *  A GeoJSON polygon (array of [lng, lat] coordinate pairs) that traces
 *  the outline of India's border, including coastal areas.
 *
 * WHERE IT'S USED:
 *  - IndiaMap.tsx: Used to draw the India border outline on the map
 *  - Also used to create the "mask" that fades out areas outside India
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ═══════════════════════════════════════════════════════════
   INDIA GEO UTILITIES — Boundary & Mask for MapLibre GL
   Simplified India outline for masking + border
   ═══════════════════════════════════════════════════════════ */

import type { Feature, Polygon, MultiPolygon, FeatureCollection } from "geojson";

// ── India center & bounds ──
export const INDIA_CENTER: [number, number] = [78.9, 22.0]; // [lng, lat] for MapLibre
export const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [68.0, 6.5],   // [west, south]
  [97.5, 35.5],  // [east, north]
];

// ── Simplified India border polygon (lng, lat pairs) ──
const INDIA_OUTLINE: [number, number][] = [
  [77.0, 35.5], [78.5, 34.5], [80.0, 33.0], [80.5, 31.5],
  [81.5, 30.5], [82.0, 29.5], [83.5, 28.5], [84.5, 27.5],
  [86.0, 27.2], [87.0, 27.5], [88.0, 28.0], [88.5, 27.5],
  [89.0, 26.5], [89.5, 26.0], [92.0, 26.0], [92.5, 25.5],
  [92.0, 25.0], [91.0, 24.5], [92.0, 23.5], [93.0, 22.5],
  [93.5, 21.5], [94.0, 21.0], [94.5, 20.0], [94.0, 19.0],
  [93.5, 18.5], [93.0, 18.0], [92.5, 17.5], [92.5, 16.5],
  [92.0, 16.0], [91.5, 17.0], [90.5, 18.0], [89.5, 19.0],
  [89.0, 20.0], [89.0, 21.0], [88.5, 21.5], [88.0, 22.0],
  [87.0, 22.0], [86.5, 21.5], [86.0, 21.0], [85.5, 20.5],
  [85.0, 20.0], [84.5, 19.5], [83.5, 19.0], [82.0, 18.5],
  [81.5, 17.5], [81.0, 16.5], [80.5, 15.5], [80.0, 14.5],
  [80.0, 13.5], [80.5, 12.5], [80.0, 11.5], [79.5, 10.5],
  [79.0, 10.0], [78.5, 9.0], [78.0, 8.5], [77.5, 8.0],
  [76.5, 8.5], [76.0, 9.5], [75.5, 10.5], [75.5, 11.5],
  [74.8, 12.5], [74.5, 13.5], [74.5, 14.5], [73.5, 15.5],
  [73.0, 16.5], [73.0, 17.5], [72.5, 18.5], [72.5, 19.5],
  [72.8, 20.5], [72.0, 21.0], [71.5, 22.0], [70.5, 22.5],
  [70.0, 23.0], [69.0, 23.5], [68.5, 24.0], [69.0, 24.5],
  [70.0, 24.5], [70.5, 25.0], [71.0, 25.5], [70.5, 26.5],
  [69.5, 27.0], [70.0, 28.0], [71.0, 28.5], [72.0, 29.0],
  [73.0, 29.5], [74.0, 30.0], [74.5, 30.5], [75.0, 31.5],
  [75.5, 32.5], [76.0, 33.0], [76.5, 34.0], [77.0, 35.5],
];

/** GeoJSON Feature for India border line */
export function getIndiaBorderFeature(): Feature<Polygon> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [INDIA_OUTLINE],
    },
  };
}

/** GeoJSON mask — covers the world EXCEPT India (for outside-India dimming) */
export function getIndiaMaskFeature(): Feature<Polygon> {
  // World rectangle (covers everything)
  const world: [number, number][] = [
    [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
  ];
  // India as a "hole" in the world polygon
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [world, INDIA_OUTLINE],
    },
  };
}

/** FeatureCollection with both mask and border */
export function getIndiaGeoData(): {
  mask: FeatureCollection;
  border: FeatureCollection;
} {
  return {
    mask: {
      type: "FeatureCollection",
      features: [getIndiaMaskFeature()],
    },
    border: {
      type: "FeatureCollection",
      features: [getIndiaBorderFeature()],
    },
  };
}
