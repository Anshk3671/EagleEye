/**
 * AgentDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The main dashboard for delivery agents.
 *
 * WHAT IT SHOWS:
 *  - Today's delivery tasks assigned to this agent
 *  - Quick stats: deliveries done today, pending pickups, success rate
 *  - Shipment list with status (PENDING → IN_TRANSIT → DELIVERED)
 *  - Quick action buttons to scan, deliver, or view payment details
 *
 * DATA SOURCE: Fetches agent-specific data from the backend API
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { useAgents } from "../hooks/useAgents";
import { useHubs } from "../hooks/useHubs";
import {
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Circle,
  Truck,
  Loader2,
  AlertTriangle,
  Filter,
  Search,
  Map,
} from "lucide-react";
import { SIMULATED_AGENTS } from "../lib/mapData";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Users; label: string }> = {
  ACTIVE: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, label: "Active" },
  ON_ROUTE: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Truck, label: "On Route" },
  OFFLINE: { color: "text-slate-500", bg: "bg-slate-500/10 border-slate-500/20", icon: Circle, label: "Offline" },
};

export default function AgentDashboardPage() {
  const [hubFilter, setHubFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents, loading, error, refetch } = useAgents();
  const { hubs } = useHubs();

  const filtered = agents.filter((a) => {
    if (hubFilter && a.hubCode !== hubFilter) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.hubCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = agents.filter((a) => a.status === "ACTIVE").length;
  const onRouteCount = agents.filter((a) => a.status === "ON_ROUTE").length;
  const offlineCount = agents.filter((a) => a.status === "OFFLINE").length;



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
            <h1 className="text-3xl font-bold text-white">Agent Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage and monitor field agents</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">{activeCount} Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">{onRouteCount} On Route</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/10 rounded-lg border border-slate-500/20">
              <span className="text-slate-400 text-sm font-medium">{offlineCount} Offline</span>
            </div>
          </div>
        </div>


        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={hubFilter}
              onChange={(e) => setHubFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer"
            >
              <option value="">All Hubs</option>
              {hubs.map((h) => (
                <option key={h.code} value={h.code}>{h.code} — {h.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_ROUTE">On Route</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((agent) => {
            const sc = STATUS_CONFIG[agent.status] || STATUS_CONFIG.OFFLINE;
            const completionPct = agent.assignedTasks > 0
              ? Math.round((agent.completedToday / agent.assignedTasks) * 100)
              : 0;

            // Find matching simulated agent
            const simAgent = SIMULATED_AGENTS.find(
              (sa) => sa.hubCode === agent.hubCode && sa.name === agent.name
            );

            return (
              <div
                key={agent.id}
                className={`p-5 rounded-xl border ${sc.bg} hover:brightness-110 transition-all ${
                  simAgent ? "cursor-pointer" : ""
                }`}
                onClick={() => {
                  if (simAgent) {
                    setSelectedAgentId(simAgent.id);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold text-sm">
                      {agent.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{agent.name}</h3>
                      <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">

                    <span className="px-2 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400 font-mono">
                      {agent.hubCode}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{agent.phone}</span>
                  </div>
                </div>

                {/* Task Progress */}
                <div className="pt-3 border-t border-slate-700/30">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Tasks Today</span>
                    <span className="text-white font-medium">{agent.completedToday}/{agent.assignedTasks}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        completionPct >= 80 ? "bg-emerald-500" : completionPct >= 50 ? "bg-blue-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No agents found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
