/**
 * HubManagementPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The hub operations management page (accessible by hub managers and admins).
 *
 * WHAT IT DOES:
 *  - Shows the current hub's operational status (capacity, agents online)
 *  - Displays all shipments currently at this hub (incoming/outgoing)
 *  - Allows hub managers to update shipment status as packages move through
 *  - Shows hub-level analytics: throughput, pending count
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { useHubs } from "../hooks/useHubs";
import { getHub, type HubDetail } from "../lib/api";
import {
  Building2,
  MapPin,
  Users,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  X,
  Phone,
  Mail,
  Truck,
  Circle,
  Map,
} from "lucide-react";
import { SIMULATED_AGENTS, HUB_LOCATIONS, getHubByCode } from "../lib/mapData";

const HUB_STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Building2 }> = {
  OPTIMIZED: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  WARNING: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
  CRITICAL: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: AlertTriangle },
};

const AGENT_STATUS: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: "text-emerald-400", label: "Active" },
  ON_ROUTE: { color: "text-blue-400", label: "On Route" },
  OFFLINE: { color: "text-slate-500", label: "Offline" },
};

export default function HubManagementPage() {
  const { hubs, loading, error } = useHubs();
  const [selectedHub, setSelectedHub] = useState<HubDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);


  async function openHubDetail(code: string) {
    setDetailLoading(true);
    try {
      const detail = await getHub(code);
      setSelectedHub(detail);
    } catch {
      // Silently fail
    } finally {
      setDetailLoading(false);
    }
  }



  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Hub Management</h1>
            <p className="text-slate-400 mt-1">Monitor and manage logistics hubs across regions</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Hubs</p>
            <p className="text-2xl font-bold text-white">{hubs.length}</p>
          </div>
          <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Optimized</p>
            <p className="text-2xl font-bold text-emerald-400">{hubs.filter((h) => h.status === "OPTIMIZED").length}</p>
          </div>
          <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/15">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Warning</p>
            <p className="text-2xl font-bold text-amber-400">{hubs.filter((h) => h.status === "WARNING").length}</p>
          </div>
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Personnel</p>
            <p className="text-2xl font-bold text-white">{hubs.reduce((sum, h) => sum + h.totalPersonnel, 0)}</p>
          </div>
        </div>



        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Hub Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {hubs.map((hub) => {
            const sc = HUB_STATUS_CONFIG[hub.status] || HUB_STATUS_CONFIG.OPTIMIZED;
            const capacityColor =
              hub.capacity >= 80 ? "bg-red-500" : hub.capacity >= 60 ? "bg-amber-500" : "bg-emerald-500";

            return (
              <div
                key={hub.id}
                className={`p-5 rounded-xl border ${sc.bg} hover:brightness-110 transition-all cursor-pointer group`}
                onClick={() => openHubDetail(hub.code)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{hub.name}</h3>
                      <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400 font-mono">
                        {hub.code}
                      </span>
                    </div>
                    {hub.regionTag && (
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{hub.regionTag}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">

                    <sc.icon className={`w-5 h-5 ${sc.color}`} />
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{hub.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{hub.activeAgents} active agents</span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="pt-3 border-t border-slate-700/30">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3 h-3" /> Capacity
                    </span>
                    <span className={`font-bold ${hub.capacity >= 80 ? "text-red-400" : hub.capacity >= 60 ? "text-amber-400" : "text-emerald-400"}`}>
                      {hub.capacity}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${capacityColor} rounded-full transition-all duration-700`}
                      style={{ width: `${hub.capacity}%` }}
                    />
                  </div>
                  {hub.statusNote && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{hub.statusNote}</p>
                  )}
                </div>

                <div className="flex items-center justify-end mt-3 text-xs text-slate-500 group-hover:text-blue-400 transition-colors">
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hub Detail Modal */}
      {(selectedHub || detailLoading) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedHub(null)}>
          <div
            className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : selectedHub ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedHub.name}</h2>
                      <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400 font-mono">{selectedHub.code}</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{selectedHub.city}</p>
                  </div>
                  <button onClick={() => setSelectedHub(null)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-500 text-xs mb-0.5">Address</p>
                    <p className="text-white text-sm">{selectedHub.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-slate-500 text-xs mb-0.5">Region</p>
                      <p className="text-white text-sm">{selectedHub.region}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-slate-500 text-xs mb-0.5">Capacity</p>
                      <p className="text-white text-sm font-bold">{selectedHub.capacity}%</p>
                    </div>
                  </div>
                  {selectedHub.statusNote && (
                    <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/15">
                      <p className="text-amber-400 text-sm">{selectedHub.statusNote}</p>
                    </div>
                  )}
                </div>

                {/* Agents at this hub */}
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Agents at Hub ({selectedHub.agents?.length ?? 0})
                  </h3>
                  {selectedHub.agents && selectedHub.agents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedHub.agents.map((agent) => {
                        const as = AGENT_STATUS[agent.status] || AGENT_STATUS.OFFLINE;
                        return (
                          <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-semibold">
                                {agent.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{agent.name}</p>
                                <p className={`text-xs ${as.color}`}>{as.label}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-400 text-xs">{agent.completedToday}/{agent.assignedTasks} tasks</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-4">No agents assigned to this hub.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
