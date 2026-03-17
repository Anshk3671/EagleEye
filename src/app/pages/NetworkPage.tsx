/**
 * NetworkPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The EagleEye logistics network visualization page.
 *
 * WHAT IT SHOWS:
 *  - Full-screen interactive India map with all 35+ hub locations
 *  - Zone-wise filtering (North / South / East / West / Central / Northeast)
 *  - Clicking a hub shows its details: city, zone, tier, capacity, agents
 *  - Route connections between hubs shown as lines on the map
 *  - Network statistics: total hubs, states covered, agents
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ═══════════════════════════════════════════════════════════
   NETWORK PAGE — Full-screen India Hub Network Map
   Dedicated page for exploring EagleEye logistics network
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import {
  Globe,
  Layers,
  Building2,
  Users,
  Truck,
  MapPin,
  Gauge,
  ArrowRight,
  Filter,
  Search,
  Zap,
} from "lucide-react";
import { IndiaMap, MarkerLayer, RouteLayer } from "../map";
import type { MapMarker, MapRoute } from "../map";
import {
  HUB_LOCATIONS,
  HUB_CONNECTIONS,
  getHubByCode,
  getHubStats,
} from "../lib/mapData";

// ── Zone Colors ──
const ZONE_COLORS: Record<string, string> = {
  North: "#3b82f6",
  South: "#22c55e",
  East: "#f59e0b",
  West: "#8b5cf6",
  Central: "#ef4444",
  Northeast: "#06b6d4",
};

const ZONES = ["North", "South", "East", "West", "Central", "Northeast"];

export default function NetworkPage() {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const stats = getHubStats();

  // ── Filter hubs by zone + search ──
  const filteredHubs = useMemo(() => {
    return HUB_LOCATIONS.filter((h) => {
      if (activeZone && h.zone !== activeZone) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.state.toLowerCase().includes(q) ||
          h.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeZone, searchQuery]);

  // ── Convert to map markers ──
  const hubMarkers: MapMarker[] = useMemo(() => {
    return filteredHubs.map((h) => ({
      id: h.code,
      lat: h.lat,
      lng: h.lng,
      label: h.name,
      sublabel: `${h.city}, ${h.state}`,
      type: "hub" as const,
      status: h.status,
      color: ZONE_COLORS[h.zone] || "#3b82f6",
      tier: h.tier,
      meta: {
        Zone: h.zone,
        Tier: `Tier ${h.tier}`,
        Capacity: `${h.capacity}%`,
        "Active Agents": h.activeAgents,
      },
    }));
  }, [filteredHubs]);

  // ── Convert connections to routes ──
  const connectionRoutes: MapRoute[] = useMemo(() => {
    return HUB_CONNECTIONS.filter((c) => {
      if (!activeZone) return true;
      const from = getHubByCode(c.from);
      const to = getHubByCode(c.to);
      return from?.zone === activeZone || to?.zone === activeZone;
    })
      .map((c) => {
        const from = getHubByCode(c.from);
        const to = getHubByCode(c.to);
        if (!from || !to) return null;
        return {
          id: `${c.from}-${c.to}`,
          points: [
            [from.lat, from.lng],
            [to.lat, to.lng],
          ] as [number, number][],
          color: c.type === "primary" ? "#3b82f6" : "#64748b",
          weight: c.type === "primary" ? 2.5 : 1.5,
          opacity: c.type === "primary" ? 0.5 : 0.25,
          dashed: true,
        };
      })
      .filter(Boolean) as MapRoute[];
  }, [activeZone]);

  // Selected hub detail
  const selectedHubData = selectedHub
    ? HUB_LOCATIONS.find((h) => h.code === selectedHub)
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Our Network</h1>
                <p className="text-slate-400 text-sm">
                  {stats.total} hubs across {stats.states} states • {stats.totalAgents} active agents
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { icon: Building2, label: "Hubs", value: stats.total, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: Zap, label: "Tier-1", value: stats.tier1, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { icon: Users, label: "Agents", value: stats.totalAgents, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
              { icon: Layers, label: "Zones", value: stats.zones, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            ].map((s) => (
              <div key={s.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${s.bg}`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search + Zone Filters ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search hubs, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Zone pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveZone(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                !activeZone
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25"
                  : "bg-transparent text-slate-400 border-slate-700 hover:border-blue-400"
              }`}
            >
              All ({stats.total})
            </button>
            {ZONES.map((zone) => {
              const count = HUB_LOCATIONS.filter((h) => h.zone === zone).length;
              const color = ZONE_COLORS[zone];
              return (
                <button
                  key={zone}
                  onClick={() => setActiveZone(activeZone === zone ? null : zone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                    activeZone === zone
                      ? "text-white shadow-lg border-transparent"
                      : "bg-transparent text-slate-400 border-slate-700 hover:border-blue-400"
                  }`}
                  style={
                    activeZone === zone
                      ? { background: color, boxShadow: `0 6px 16px ${color}40` }
                      : {}
                  }
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ background: color }}
                  />
                  {zone} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Layout: Map + Sidebar ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {/* Map */}
          <div className="xl:col-span-3 rounded-2xl overflow-hidden border border-slate-700/40 shadow-xl shadow-black/20">
            <IndiaMap
              theme="auto"
              height="calc(100vh - 280px)"
              showMask={true}
              showBorder={true}
              restrictToIndia={true}
              scrollWheelZoom={true}
              className="rounded-2xl"
            >
              <RouteLayer routes={connectionRoutes} />
              <MarkerLayer
                markers={hubMarkers}
                onMarkerClick={(id) =>
                  setSelectedHub(id === selectedHub ? null : id)
                }
                selectedId={selectedHub}
              />
            </IndiaMap>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin">
            {/* Network Stats */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-white">
                  Network Overview
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Total Hubs", value: stats.total, color: "text-blue-400" },
                  { label: "Tier-1 (Major)", value: stats.tier1, color: "text-emerald-400" },
                  { label: "Tier-2 (Regional)", value: stats.tier2, color: "text-amber-400" },
                  { label: "Tier-3 (Local)", value: stats.tier3, color: "text-purple-400" },
                  { label: "Active Agents", value: stats.totalAgents, color: "text-cyan-400" },
                  { label: "Zones", value: stats.zones, color: "text-rose-400" },
                  { label: "States Covered", value: stats.states, color: "text-indigo-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{s.label}</span>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Legend */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-white">Zone Legend</span>
              </div>
              <div className="space-y-2">
                {ZONES.map((zone) => (
                  <div
                    key={zone}
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      setActiveZone(activeZone === zone ? null : zone)
                    }
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: ZONE_COLORS[zone] }}
                    />
                    <span className="text-xs text-slate-400 flex-grow">
                      {zone} Zone
                    </span>
                    <span className="text-xs font-bold text-white">
                      {HUB_LOCATIONS.filter((h) => h.zone === zone).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Hub Detail */}
            {selectedHubData && (
              <div
                className="p-4 rounded-xl border-2 transition-all duration-300 animate-in fade-in slide-in-from-right-4"
                style={{
                  borderColor: ZONE_COLORS[selectedHubData.zone],
                  background: `${ZONE_COLORS[selectedHubData.zone]}08`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: ZONE_COLORS[selectedHubData.zone] }}
                  />
                  <span className="font-bold text-sm text-white">
                    {selectedHubData.name}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {selectedHubData.city}, {selectedHubData.state}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2 bg-slate-800/50 rounded-lg text-center">
                      <p className="text-[10px] text-slate-500 uppercase">Zone</p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: ZONE_COLORS[selectedHubData.zone] }}
                      >
                        {selectedHubData.zone}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded-lg text-center">
                      <p className="text-[10px] text-slate-500 uppercase">Tier</p>
                      <p className="text-sm font-bold text-white">
                        {selectedHubData.tier}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded-lg text-center">
                      <p className="text-[10px] text-slate-500 uppercase">
                        Capacity
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          selectedHubData.capacity >= 80
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {selectedHubData.capacity}%
                      </p>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded-lg text-center">
                      <p className="text-[10px] text-slate-500 uppercase">Agents</p>
                      <p className="text-sm font-bold text-blue-400">
                        {selectedHubData.activeAgents}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hub List */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Hub Directory
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {filteredHubs.length} hubs
                </span>
              </div>
              <div className="space-y-1.5">
                {filteredHubs.map((hub) => (
                  <div
                    key={hub.code}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all text-xs ${
                      selectedHub === hub.code
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : "hover:bg-slate-700/30 border border-transparent"
                    }`}
                    onClick={() =>
                      setSelectedHub(
                        selectedHub === hub.code ? null : hub.code
                      )
                    }
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: ZONE_COLORS[hub.zone] }}
                    />
                    <div className="flex-grow min-w-0">
                      <p className="text-white font-medium truncate">
                        {hub.name}
                      </p>
                      <p className="text-slate-500 text-[10px] truncate">
                        {hub.city} • Tier {hub.tier}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[9px] text-slate-400 font-mono">
                        {hub.code}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
