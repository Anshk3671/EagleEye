/**
 * IndiaMap.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The core map component — renders an interactive India map using Leaflet.js.
 *
 * BUILT WITH:
 *  - react-leaflet (React wrapper for Leaflet.js, an open-source map library)
 *  - OpenStreetMap tiles (free, open-source map tiles)
 *
 * PROPS:
 *  - theme           : "light" | "dark" | "auto" — controls map tile color scheme
 *  - height          : CSS height string (e.g. "500px")
 *  - showMask        : If true, adds a faded overlay outside India's borders
 *  - showBorder      : If true, draws India's border outline
 *  - restrictToIndia : If true, limits panning/zooming to India only
 *  - scrollWheelZoom : Whether mouse scroll zooms the map
 *  - children        : Accepts <MarkerLayer> and <RouteLayer> components inside it
 *
 * HOW IT WORKS:
 *  This is a "container" component — it sets up the map and defines the bounds.
 *  The actual markers (hub pins) and route lines are rendered by separate
 *  child components: MarkerLayer and RouteLayer.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ═══════════════════════════════════════════════════════════
   INDIA MAP — Core MapLibre GL Component
   WebGL-powered, auto dark/light, India-only mask
   ═══════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, {
  NavigationControl,
  Source,
  Layer,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles/map.css";

import { getTileStyle, detectTheme } from "./utils/tiles";
import { getIndiaGeoData, INDIA_CENTER, INDIA_BOUNDS } from "./utils/indiaGeo";
import type { FillLayerSpecification, LineLayerSpecification } from "maplibre-gl";

// ── Types ──
export interface IndiaMapProps {
  /** "auto" syncs with app theme, or force "dark"/"light" */
  theme?: "auto" | "dark" | "light";
  /** Map height */
  height?: string;
  /** Show mask outside India */
  showMask?: boolean;
  /** Show India border glow */
  showBorder?: boolean;
  /** Restrict panning to India */
  restrictToIndia?: boolean;
  /** Scroll wheel zoom */
  scrollWheelZoom?: boolean;
  /** Optional className */
  className?: string;
  /** Custom initial zoom */
  zoom?: number;
  /** Custom initial center [lng, lat] */
  center?: [number, number];
  /** Children (layers, markers) */
  children?: React.ReactNode;
}

// ── Layer styles ──
const maskLayerStyle: FillLayerSpecification = {
  id: "india-mask",
  type: "fill",
  source: "india-mask",
  paint: {
    "fill-color": "#0d1117",
    "fill-opacity": 0.85,
  },
};

const maskLayerStyleLight: FillLayerSpecification = {
  id: "india-mask",
  type: "fill",
  source: "india-mask",
  paint: {
    "fill-color": "#f5f5f4",
    "fill-opacity": 0.88,
  },
};

const borderLayerStyle: LineLayerSpecification = {
  id: "india-border",
  type: "line",
  source: "india-border",
  paint: {
    "line-color": "#3b82f6",
    "line-width": 1.5,
    "line-opacity": 0.4,
    "line-blur": 1,
  },
};

const borderGlowLayerStyle: LineLayerSpecification = {
  id: "india-border-glow",
  type: "line",
  source: "india-border",
  paint: {
    "line-color": "#3b82f6",
    "line-width": 6,
    "line-opacity": 0.08,
    "line-blur": 4,
  },
};

export default function IndiaMap({
  theme = "auto",
  height = "500px",
  showMask = true,
  showBorder = true,
  restrictToIndia = true,
  scrollWheelZoom = true,
  className = "",
  zoom,
  center,
  children,
}: IndiaMapProps) {
  const mapRef = useRef<MapRef>(null);

  // ── Theme tracking ──
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">(
    theme === "auto" ? detectTheme() : theme
  );

  useEffect(() => {
    if (theme !== "auto") {
      setCurrentTheme(theme);
      return;
    }

    // Watch for class changes on <html>
    const observer = new MutationObserver(() => {
      setCurrentTheme(detectTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Also watch prefers-color-scheme
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setCurrentTheme(detectTheme());
    mq.addEventListener("change", handler);

    return () => {
      observer.disconnect();
      mq.removeEventListener("change", handler);
    };
  }, [theme]);

  // ── Geo data ──
  const { mask, border } = useMemo(() => getIndiaGeoData(), []);

  // ── Map style URL ──
  const mapStyle = useMemo(() => getTileStyle(currentTheme), [currentTheme]);

  // ── Initial view ──
  const initialViewState = useMemo(
    () => ({
      longitude: center?.[0] ?? INDIA_CENTER[0],
      latitude: center?.[1] ?? INDIA_CENTER[1],
      zoom: zoom ?? 4.3,
      pitch: 0,
      bearing: 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Max bounds (restrict to India region) ──
  const maxBounds = restrictToIndia ? INDIA_BOUNDS : undefined;

  return (
    <div
      className={`eagle-map-container ${className}`}
      style={{ height }}
    >
      <MapGL
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        maxBounds={maxBounds as any}
        minZoom={3.5}
        maxZoom={18}
        scrollZoom={scrollWheelZoom}
        attributionControl={false}
        dragRotate={false}
        touchZoomRotate={true}
      >
        <NavigationControl position="top-left" showCompass={false} />

        {/* India Mask — dims everything outside India */}
        {showMask && (
          <Source id="india-mask" type="geojson" data={mask}>
            <Layer
              {...(currentTheme === "dark"
                ? maskLayerStyle
                : maskLayerStyleLight)}
            />
          </Source>
        )}

        {/* India Border — subtle glow effect */}
        {showBorder && (
          <Source id="india-border" type="geojson" data={border}>
            <Layer {...borderGlowLayerStyle} />
            <Layer {...borderLayerStyle} />
          </Source>
        )}

        {/* Children (MarkerLayer, RouteLayer, etc.) */}
        {children}
      </MapGL>
    </div>
  );
}
