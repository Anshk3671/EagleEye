/**
 * MarkerLayer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders clickable hub location markers (pins) on the India map.
 *
 * USED INSIDE: <IndiaMap> as a child component
 *
 * PROPS:
 *  - markers[]     : List of MapMarker objects (each has lat, lng, label, type, color)
 *  - onMarkerClick : Callback when user clicks a marker (receives marker ID)
 *  - selectedId    : ID of the currently selected/highlighted marker
 *
 * HOW IT WORKS:
 *  Iterates over the markers array and renders a Leaflet CircleMarker for each hub.
 *  The selected marker is shown larger to indicate it is active.
 *  Clicking a marker calls onMarkerClick, which the parent uses to show hub details.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ═══════════════════════════════════════════════════════════
   MARKER LAYER — Custom hub markers for MapLibre GL
   Uses HTML marker overlays for full styling control
   ═══════════════════════════════════════════════════════════ */

import { useCallback } from "react";
import { Marker, Popup } from "react-map-gl/maplibre";
import { useState } from "react";

// ── Marker type ──
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  type?: "hub" | "agent" | "pickup" | "delivery";
  status?: string;
  color?: string;
  meta?: Record<string, string | number>;
  tier?: number;
}

interface MarkerLayerProps {
  markers: MapMarker[];
  onMarkerClick?: (id: string) => void;
  selectedId?: string | null;
}

export default function MarkerLayer({
  markers,
  onMarkerClick,
  selectedId,
}: MarkerLayerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      {markers.map((m) => {
        const size = m.tier === 1 ? 40 : m.tier === 2 ? 32 : 26;
        const color = m.color || "#3b82f6";
        const isSelected = selectedId === m.id;
        const isHovered = hoveredId === m.id;
        const showPopup = isSelected || isHovered;

        return (
          <div key={m.id}>
            <Marker
              longitude={m.lng}
              latitude={m.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onMarkerClick?.(m.id);
              }}
            >
              <div
                className={`hub-marker ${m.tier === 1 ? "tier-1" : ""}`}
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88)`,
                  border: `2px solid ${color}`,
                  boxShadow: isSelected
                    ? `0 0 20px ${color}60, 0 0 40px ${color}20`
                    : `0 2px 8px ${color}30`,
                  color: color,
                  transform: isSelected ? "scale(1.3)" : undefined,
                  zIndex: isSelected ? 100 : m.tier === 1 ? 10 : 5,
                }}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Hub icon */}
                <svg
                  width={size * 0.5}
                  height={size * 0.5}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            </Marker>

            {/* Popup */}
            {showPopup && (
              <Popup
                longitude={m.lng}
                latitude={m.lat}
                anchor="bottom"
                offset={[0, -(size / 2 + 8)] as [number, number]}
                closeButton={false}
                closeOnClick={false}
                className="hub-popup"
              >
                <div className="hub-popup-title">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  {m.label}
                </div>
                {m.sublabel && (
                  <div
                    className="hub-popup-row"
                    style={{ marginBottom: 6, opacity: 0.7, fontSize: 10 }}
                  >
                    {m.sublabel}
                  </div>
                )}
                {m.meta &&
                  Object.entries(m.meta).map(([key, val]) => (
                    <div key={key} className="hub-popup-row">
                      <span className="label">{key}</span>
                      <span className="value" style={{ color }}>
                        {val}
                      </span>
                    </div>
                  ))}
              </Popup>
            )}
          </div>
        );
      })}
    </>
  );
}
