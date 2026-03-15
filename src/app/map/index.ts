/* ═══════════════════════════════════════════════════════════
   MAP BARREL EXPORTS — Single import point for map system
   ═══════════════════════════════════════════════════════════ */

// Core map component
export { default as IndiaMap } from "./IndiaMap";
export type { IndiaMapProps } from "./IndiaMap";

// Layers
export { default as MarkerLayer } from "./layers/MarkerLayer";
export type { MapMarker } from "./layers/MarkerLayer";

export { default as RouteLayer } from "./layers/RouteLayer";
export type { MapRoute } from "./layers/RouteLayer";

// Utilities
export { getTileStyle, detectTheme, TILE_STYLES } from "./utils/tiles";
export {
  INDIA_CENTER,
  INDIA_BOUNDS,
  getIndiaGeoData,
  getIndiaBorderFeature,
  getIndiaMaskFeature,
} from "./utils/indiaGeo";
