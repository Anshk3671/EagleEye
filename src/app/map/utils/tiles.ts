/**
 * tiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Map tile configuration — defines the visual style of the map background.
 *
 * WHAT'S A TILE?
 *  A map tile is a small image (256x256 pixels) that shows a section of the map.
 *  Many tiles are stitched together to form the complete map view.
 *  Different tile providers give different visual styles (streets, satellite, dark mode).
 *
 * WHAT'S IN HERE:
 *  - TILE_LIGHT : OpenStreetMap tiles for light/day mode
 *  - TILE_DARK  : CartoDB dark matter tiles for dark/night mode
 *  - getTileUrl(theme) : Returns the correct tile URL based on the current theme
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ═══════════════════════════════════════════════════════════
   TILE STYLES — Free vector tile sources for MapLibre GL
   No API key required
   ═══════════════════════════════════════════════════════════ */

/** CartoDB vector tile style URLs (free, no key) */
export const TILE_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  darkNolabels: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
  lightNolabels: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
} as const;

/** Detect current theme from <html> class */
export function detectTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Get the tile style URL for current or given theme */
export function getTileStyle(theme?: "dark" | "light", labels = true): string {
  const t = theme ?? detectTheme();
  if (labels) {
    return t === "dark" ? TILE_STYLES.dark : TILE_STYLES.light;
  }
  return t === "dark" ? TILE_STYLES.darkNolabels : TILE_STYLES.lightNolabels;
}
