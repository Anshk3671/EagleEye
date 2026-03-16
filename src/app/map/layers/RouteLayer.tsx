/**
 * RouteLayer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders route lines (connections) between logistics hubs on the India map.
 *
 * USED INSIDE: <IndiaMap> as a child component
 *
 * PROPS:
 *  - routes[] : List of MapRoute objects (each has an array of [lat, lng] points,
 *               a color, weight, opacity, and a dashed flag)
 *
 * HOW IT WORKS:
 *  Iterates over the routes array and renders a Leaflet Polyline for each route.
 *  Primary routes appear as solid blue lines; secondary routes are thinner and faded.
 *  Dashed lines are used to show that these are virtual/estimated connections.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ═══════════════════════════════════════════════════════════
   ROUTE LAYER — Connection lines between hubs for MapLibre GL
   Uses native MapLibre vector line rendering (GPU accelerated)
   ═══════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import type { LineLayerSpecification } from "maplibre-gl";
import type { FeatureCollection } from "geojson";

export interface MapRoute {
  id: string;
  points: [number, number][]; // [lat, lng] pairs
  color?: string;
  weight?: number;
  opacity?: number;
  dashed?: boolean;
}

interface RouteLayerProps {
  routes: MapRoute[];
}

export default function RouteLayer({ routes }: RouteLayerProps) {
  // Split routes into primary (thicker) and secondary (thinner)
  const { primaryGeo, secondaryGeo } = useMemo(() => {
    const primary: GeoJSON.Feature[] = [];
    const secondary: GeoJSON.Feature[] = [];

    routes.forEach((route) => {
      const feature: GeoJSON.Feature = {
        type: "Feature",
        properties: {
          id: route.id,
          color: route.color || "#3b82f6",
          weight: route.weight || 1.5,
          opacity: route.opacity || 0.3,
        },
        geometry: {
          type: "LineString",
          // Convert [lat, lng] → [lng, lat] for GeoJSON
          coordinates: route.points.map(([lat, lng]) => [lng, lat]),
        },
      };

      if ((route.weight || 1.5) >= 2) {
        primary.push(feature);
      } else {
        secondary.push(feature);
      }
    });

    return {
      primaryGeo: {
        type: "FeatureCollection" as const,
        features: primary,
      },
      secondaryGeo: {
        type: "FeatureCollection" as const,
        features: secondary,
      },
    };
  }, [routes]);

  const primaryStyle: LineLayerSpecification = {
    id: "routes-primary",
    type: "line",
    source: "routes-primary",
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["get", "weight"],
      "line-opacity": ["get", "opacity"],
      "line-dasharray": [6, 4],
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  };

  const primaryGlowStyle: LineLayerSpecification = {
    id: "routes-primary-glow",
    type: "line",
    source: "routes-primary",
    paint: {
      "line-color": ["get", "color"],
      "line-width": 8,
      "line-opacity": 0.06,
      "line-blur": 4,
    },
    layout: {
      "line-cap": "round",
    },
  };

  const secondaryStyle: LineLayerSpecification = {
    id: "routes-secondary",
    type: "line",
    source: "routes-secondary",
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["get", "weight"],
      "line-opacity": ["get", "opacity"],
      "line-dasharray": [4, 6],
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  };

  return (
    <>
      {/* Primary routes (major corridors) */}
      {primaryGeo.features.length > 0 && (
        <Source id="routes-primary" type="geojson" data={primaryGeo}>
          <Layer {...primaryGlowStyle} />
          <Layer {...primaryStyle} />
        </Source>
      )}

      {/* Secondary routes */}
      {secondaryGeo.features.length > 0 && (
        <Source id="routes-secondary" type="geojson" data={secondaryGeo}>
          <Layer {...secondaryStyle} />
        </Source>
      )}
    </>
  );
}
