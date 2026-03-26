/**
 * CustomerPortalPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The shipment tracking page for customers (public-facing).
 *
 * WHAT IT DOES:
 *  - Allows ANY visitor (logged in or not) to track a shipment by AWB number
 *  - Shows real-time shipment status, location, and delivery timeline
 *  - Displays sender/receiver details, shipment type, and weight
 *  - Shows the EagleEye network map with the shipment's current location
 *  - Provides a QR code scanner option for mobile users
 *
 * KEY FLOW:
 *  1. User types an AWB number (e.g. EE-123-4567) into the search box
 *  2. App calls the backend API to fetch shipment details
 *  3. Results are displayed with a visual timeline of tracking events
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getShipment, type Shipment } from "../lib/api";
import {
  Search,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Box,
  Loader2,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";
import { guessCoords } from "../lib/coordinates";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default icon
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Custom map markers
function createIcon(color: string, label: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:bold;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35)">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}
const originIcon = createIcon("#f59e0b", "📦");
const destIcon = createIcon("#10b981", "🏠");
const vehicleIcon = createIcon("#8b5cf6", "🚚");
const hubIcon = createIcon("#3b82f6", "🏢");

// Map auto-fit
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => { map.fitBounds(bounds, { padding: [50, 50] }); }, [map, bounds]);
  return null;
}

// Guess vehicle type from shipment type
function guessVehicle(type: string): { emoji: string; name: string } {
  const t = type.toUpperCase();
  if (t.includes("EXPRESS") || t.includes("PRIORITY")) return { emoji: "✈️", name: "Air Freight" };
  if (t.includes("LTL") || t.includes("FREIGHT")) return { emoji: "🚛", name: "Heavy Truck" };
  if (t.includes("ECOMMERCE") || t.includes("E-COMMERCE")) return { emoji: "🛵", name: "Bike Delivery" };
  return { emoji: "🚚", name: "Delivery Van" };
}


const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Package }> = {
  IN_TRANSIT: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Truck },
  DELIVERED: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  DELAYED: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
  PENDING: { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: Clock },
  ARRIVED: { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: MapPin },
  DEPARTED: { color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", icon: ArrowRight },
  PICKED_UP: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: Box },
  OUT_FOR_DELIVERY: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: Truck },
};

export default function CustomerPortalPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const doSearch = useCallback(async (awb: string) => {
    const trimmed = awb.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setShipment(null);
    setSearched(true);

    try {
      const result = await getShipment(trimmed);
      setShipment(result);
    } catch {
      setError("Shipment not found. Please check the AWB number and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search if ?awb= is in URL
  useEffect(() => {
    const awbParam = searchParams.get("awb");
    if (awbParam) {
      doSearch(awbParam);
    }
  }, [searchParams, doSearch]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }



  const statusCfg = shipment
    ? STATUS_CONFIG[shipment.status] || STATUS_CONFIG.PENDING
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Package className="w-4 h-4" />
            EagleEye Logistics Tracking
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Track Your Shipment
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Enter your Air Waybill (AWB) number to get real-time tracking updates for your shipment.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-500" />
              <input
                id="tracking-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter AWB number (e.g. EE-742-9910)"
                className="w-full pl-12 pr-32 py-4 bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-base transition-all"
              />
              <button
                id="tracking-search-button"
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all text-sm flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Track
              </button>
            </div>
          </form>

          {/* Quick Examples */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-slate-500 text-sm">Try:</span>
            {["EE-742-9910", "EE-8829-0012", "EE-1055-3347"].map((awb) => (
              <button
                key={awb}
                onClick={async () => {
                  setQuery(awb);
                  setLoading(true);
                  setError(null);
                  setShipment(null);
                  setSearched(true);
                  try {
                    const result = await getShipment(awb);
                    setShipment(result);
                  } catch {
                    setError("Shipment not found. Please check the AWB number and try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-sm text-blue-400 hover:text-blue-300 font-mono transition-colors cursor-pointer"
              >
                {awb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Shipment Result */}
        {shipment && statusCfg && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <div
              className={`p-6 rounded-xl border ${statusCfg.bg} cursor-pointer hover:brightness-110 transition-all`}
              onClick={() => navigate(`/shipments/${shipment.awbNumber}`)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${statusCfg.bg} border flex items-center justify-center`}>
                    <statusCfg.icon className={`w-6 h-6 ${statusCfg.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-white font-mono">{shipment.awbNumber}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${statusCfg.bg} ${statusCfg.color} border`}>
                        {shipment.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      {shipment.shipmentType} • {shipment.weight} kg • {shipment.dimensions}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Expected Delivery</p>
                  <p className="text-white font-medium">
                    {format(new Date(shipment.expectedDelivery), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>



            {/* Route Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Origin</p>
                <p className="text-white font-medium text-sm">{shipment.origin}</p>
                <p className="text-slate-400 text-xs mt-1">{shipment.senderName}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Current Location</p>
                <p className="text-white font-medium text-sm">{shipment.currentLocation}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Destination</p>
                <p className="text-white font-medium text-sm">{shipment.destination}</p>
                <p className="text-slate-400 text-xs mt-1">{shipment.receiverName}</p>
              </div>
            </div>

            {/* ── Route Map ─────────────────────────────────── */}
            {(() => {
              const originCoords = guessCoords(shipment.origin);
              const destCoords = guessCoords(shipment.destination);
              const currentCoords = guessCoords(shipment.currentLocation);
              const vehicle = guessVehicle(shipment.shipmentType);

              if (!originCoords || !destCoords) return null;

              // Calculate vehicle position (between origin and dest based on progress)
              const vehiclePos: [number, number] = currentCoords || [
                originCoords[0] + (destCoords[0] - originCoords[0]) * 0.45,
                originCoords[1] + (destCoords[1] - originCoords[1]) * 0.45,
              ];

              // Build route with intermediate points for curve effect
              const midLat = (originCoords[0] + destCoords[0]) / 2;
              const midLng = (originCoords[1] + destCoords[1]) / 2;
              const offset = Math.abs(destCoords[1] - originCoords[1]) * 0.08;
              const routePoints: [number, number][] = [
                originCoords,
                [midLat + offset, midLng - offset],
                vehiclePos,
                [midLat - offset, midLng + offset],
                destCoords,
              ];

              // Distance
              const R = 6371;
              const dLat = ((destCoords[0] - originCoords[0]) * Math.PI) / 180;
              const dLon = ((destCoords[1] - originCoords[1]) * Math.PI) / 180;
              const a = Math.sin(dLat / 2) ** 2 + Math.cos(originCoords[0] * Math.PI / 180) * Math.cos(destCoords[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
              const distKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

              const bounds: L.LatLngBoundsExpression = [
                [Math.min(originCoords[0], destCoords[0]) - 0.5, Math.min(originCoords[1], destCoords[1]) - 0.5],
                [Math.max(originCoords[0], destCoords[0]) + 0.5, Math.max(originCoords[1], destCoords[1]) + 0.5],
              ];

              return (
                <div className="rounded-xl border border-slate-700/40 overflow-hidden relative z-0">
                  {/* Map Header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-slate-800/60 border-b border-slate-700/40">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-semibold text-sm">Live Route Map</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-slate-400">Origin</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-slate-400">{vehicle.emoji} {vehicle.name}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-400">Destination</span>
                      </span>
                    </div>
                  </div>

                  {/* Map */}
                  <div style={{ height: 380 }}>
                    <MapContainer
                      center={[vehiclePos[0], vehiclePos[1]]}
                      zoom={6}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://carto.com">Carto</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      />
                      <FitBounds bounds={bounds} />

                      {/* Route Line */}
                      <Polyline
                        positions={routePoints}
                        pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.7, dashArray: "8 6" }}
                      />
                      {/* Travelled portion (solid) */}
                      <Polyline
                        positions={[originCoords, routePoints[1], vehiclePos]}
                        pathOptions={{ color: "#8b5cf6", weight: 3, opacity: 0.9 }}
                      />

                      {/* Origin Marker */}
                      <Marker position={originCoords} icon={originIcon}>
                        <Popup>
                          <div style={{ textAlign: "center" }}>
                            <strong>📦 Origin</strong><br />
                            {shipment.origin}<br />
                            <span style={{ fontSize: 11, color: "#888" }}>Sender: {shipment.senderName}</span>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Vehicle / Current Location Marker */}
                      <Marker position={vehiclePos} icon={vehicleIcon}>
                        <Popup>
                          <div style={{ textAlign: "center" }}>
                            <strong>{vehicle.emoji} {vehicle.name}</strong><br />
                            {shipment.currentLocation}<br />
                            <span style={{ fontSize: 11, color: "#888" }}>Status: {shipment.status.replace(/_/g, " ")}</span>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Destination Marker */}
                      <Marker position={destCoords} icon={destIcon}>
                        <Popup>
                          <div style={{ textAlign: "center" }}>
                            <strong>🏠 Destination</strong><br />
                            {shipment.destination}<br />
                            <span style={{ fontSize: 11, color: "#888" }}>Receiver: {shipment.receiverName}</span>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>

                  {/* Map Footer — Route Details */}
                  <div className="flex items-center justify-between px-5 py-3 bg-slate-800/60 border-t border-slate-700/40">
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs">Distance</span>
                        <p className="text-white font-semibold">{distKm.toLocaleString()} km</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Vehicle</span>
                        <p className="text-white font-semibold">{vehicle.emoji} {vehicle.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Service</span>
                        <p className="text-white font-semibold">{shipment.shipmentType.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-xs">Weight</span>
                      <p className="text-white font-semibold">{shipment.weight} kg</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tracking Timeline */}
            <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold text-lg mb-6">Tracking History</h3>
              <div className="relative">
                {shipment.events.map((event, idx) => {
                  const evCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.PENDING;
                  const isLast = idx === shipment.events.length - 1;
                  return (
                    <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                      <div className="relative flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${evCfg.bg} border flex items-center justify-center flex-shrink-0 z-10`}>
                          <evCfg.icon className={`w-4 h-4 ${evCfg.color}`} />
                        </div>
                        {!isLast && (
                          <div className="w-px h-full bg-slate-700/60 absolute top-8" />
                        )}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${evCfg.color}`}>
                            {event.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 text-xs font-mono">
                            {event.locationCode || "—"}
                          </span>
                        </div>
                        <p className="text-white text-sm mt-1">{event.description}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {format(new Date(event.timestamp), "MMM dd, yyyy 'at' hh:mm a")} • {event.location}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* View Full Details */}
            <button
              onClick={() => navigate(`/shipments/${shipment.awbNumber}`)}
              className="w-full py-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 rounded-xl text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              View Full Shipment Details
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {searched && !loading && !shipment && !error && (
          <div className="text-center py-12 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No shipment found. Check the AWB number and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
