/**
 * AdminDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The main overview screen for admin users.
 *
 * WHAT IT SHOWS:
 *  1. KPI Cards    — 4 key metrics: Active Shipments, Hubs, Agents, Hub Utilization
 *  2. Bar Chart    — Shipping volume over the last 7 days (using Recharts library)
 *  3. Status Panel — Visual progress bars showing shipment status breakdown
 *  4. Recent Shipments Table — Latest 8 shipments with AWB number, status, route
 *  5. Quick Links  — Shortcut buttons to Agents, Hubs, Broadcasts, Queries, Promotions
 *  6. Revenue Panel— Revenue figures for today / week / month / COD
 *  7. Callbacks Panel — Customer callback requests from the homepage contact form
 *
 * Data is fetched from the backend using:
 *  - useDashboard() hook — provides stats, volume, summary
 *  - useShipments() hook — provides recent shipments list
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useDashboard } from "../hooks/useDashboard";
import { useShipments } from "../hooks/useShipments";
import {
  Package,
  Building2,
  Users,
  Gauge,
  TrendingUp,
  Wifi,
  Globe,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Truck,
  CheckCircle2,
  Clock,
  Megaphone,
  MessageSquare,
  Tag,
  IndianRupee,
  Phone,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";


// STATUS_COLORS: Color coding for each shipment status badge in the table
// Key = status string from backend, Value = text + background CSS classes
const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  IN_TRANSIT: { text: "text-blue-400", bg: "bg-blue-500/10" },
  DELIVERED: { text: "text-emerald-400", bg: "bg-emerald-500/10" },
  DELAYED: { text: "text-amber-400", bg: "bg-amber-500/10" },
  PENDING: { text: "text-slate-400", bg: "bg-slate-500/10" },
  OUT_FOR_DELIVERY: { text: "text-orange-400", bg: "bg-orange-500/10" },
};

export default function AdminDashboardPage() {
  // Fetch live dashboard stats from the backend API
  const { stats, volume, summary, loading, error } = useDashboard();
  // Fetch the 8 most recent shipments for the table
  const { shipments, loading: shipmentsLoading } = useShipments({ limit: 8 });
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // kpiCards: Array of 4 KPI (Key Performance Indicator) cards to display at the top
  // Each card shows a metric title, its current value, icon, and color theme
  const kpiCards = [
    {
      label: "Active Shipments",
      value: stats?.activeShipments?.toLocaleString() ?? "—",
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      sub: stats?.growthPercent ?? "",
    },
    {
      label: "Total Hubs",
      value: stats?.totalHubs?.toLocaleString() ?? "—",
      icon: Building2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      sub: stats?.globalReach ?? "",
    },
    {
      label: "Registered Agents",
      value: stats?.registeredAgents?.toLocaleString() ?? "—",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      sub: stats?.onlinePercent ?? "",
    },
    {
      label: "Hub Utilization",
      value: stats?.hubUtilization ? `${stats.hubUtilization}%` : "—",
      icon: Gauge,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      sub: stats?.loadStatus ?? "",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">System overview and analytics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className={`p-5 rounded-xl border ${kpi.bg} transition-all hover:brightness-110`}
            >
              <div className="flex items-center justify-between mb-3">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                {kpi.sub && (
                  <span className="text-xs text-slate-400 font-medium">{kpi.sub}</span>
                )}
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-slate-400 text-sm mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipping Volume Chart */}
          <div className="lg:col-span-2 p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Shipping Volume
              </h2>
              <span className="text-xs text-slate-500">Last 7 days</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volume} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13,
                    }}
                    cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                  />
                  <Bar dataKey="units" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Summary */}
          <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-emerald-400" />
              Status Breakdown
            </h2>
            {summary && (
              <div className="space-y-4">
                <StatusBar label="In Transit" value={summary.inTransit} total={summary.totalShipments} color="bg-blue-500" />
                <StatusBar label="Delivered" value={summary.delivered} total={summary.totalShipments} color="bg-emerald-500" />
                <StatusBar label="Delayed" value={summary.delayed} total={summary.totalShipments} color="bg-amber-500" />
                <StatusBar label="Pending" value={summary.pending} total={summary.totalShipments} color="bg-slate-500" />
                <div className="pt-4 border-t border-slate-700/40 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Hubs</span>
                    <span className="text-white font-medium">{summary.totalHubs}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Agents</span>
                    <span className="text-white font-medium">{summary.activeAgents}/{summary.totalAgents} active</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Recent Shipments Table */}
        <div className="mt-6 p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              Recent Shipments
            </h2>
            <button
              onClick={() => navigate("/track")}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              Track Shipment <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {shipmentsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/40">
                    <th className="pb-3 pr-4">AWB Number</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4 hidden md:table-cell">Origin → Destination</th>
                    <th className="pb-3 pr-4 hidden lg:table-cell">Type</th>
                    <th className="pb-3 pr-4 hidden lg:table-cell">Expected</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => {
                    const sc = STATUS_COLORS[s.status] || STATUS_COLORS.PENDING;
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-slate-700/20 hover:bg-slate-800/40 cursor-pointer transition-colors"
                        onClick={() => navigate(`/shipments/${s.awbNumber}`)}
                      >
                        <td className="py-3 pr-4">
                          <span className="text-white font-mono text-sm font-medium">{s.awbNumber}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                            {s.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          <span className="text-slate-300 text-sm truncate max-w-xs block">
                            {s.origin.split(",")[0]} → {s.destination.split(",")[0]}
                          </span>
                        </td>
                        <td className="py-3 pr-4 hidden lg:table-cell text-slate-400 text-sm">{s.shipmentType}</td>
                        <td className="py-3 pr-4 hidden lg:table-cell text-slate-400 text-sm">
                          {format(new Date(s.expectedDelivery), "MMM dd")}
                        </td>
                        <td className="py-3">
                          <ArrowRight className="w-4 h-4 text-slate-600" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <Link to="/admin/agents" className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-emerald-500/30 transition-all no-underline group">
            <Users className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white text-sm font-semibold">Manage Agents</p>
            <p className="text-slate-500 text-xs">Add, edit, remove agents</p>
          </Link>
          <Link to="/admin/hubs-manage" className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-blue-500/30 transition-all no-underline group">
            <Building2 className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white text-sm font-semibold">Manage Hubs</p>
            <p className="text-slate-500 text-xs">Add, configure hubs</p>
          </Link>
          <Link to="/admin/broadcast" className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-amber-500/30 transition-all no-underline group">
            <Megaphone className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white text-sm font-semibold">Broadcasts</p>
            <p className="text-slate-500 text-xs">Send bulk alerts</p>
          </Link>
          <Link to="/admin/queries" className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-cyan-500/30 transition-all no-underline group">
            <MessageSquare className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white text-sm font-semibold">Queries</p>
            <p className="text-slate-500 text-xs">Support tickets</p>
          </Link>
          <Link to="/admin/promotions" className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-purple-500/30 transition-all no-underline group">
            <Tag className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white text-sm font-semibold">Promotions</p>
            <p className="text-slate-500 text-xs">Sales & discounts</p>
          </Link>
        </div>

        {/* Callbacks & Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <CallbackRequestsPanel />
          <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <IndianRupee className="w-5 h-5 text-emerald-400" /> Revenue Overview
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"><p className="text-emerald-400 text-xs mb-1">Today</p><p className="text-2xl font-bold text-white">₹1,24,500</p></div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"><p className="text-blue-400 text-xs mb-1">This Week</p><p className="text-2xl font-bold text-white">₹8,45,200</p></div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl"><p className="text-purple-400 text-xs mb-1">This Month</p><p className="text-2xl font-bold text-white">₹32,18,700</p></div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"><p className="text-amber-400 text-xs mb-1">COD Collected</p><p className="text-2xl font-bold text-white">₹2,35,800</p></div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 font-semibold">+12.5%</span> vs last week</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// StatusBar: A small helper component that renders a labelled progress bar.
// Shows how many shipments are in a given status relative to the total.
// Example: "In Transit | 45 | ███████░░░░░ "
function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  // pct: percentage of this status out of all shipments (used for bar width)
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// timeAgo: Converts a date string to a human-readable "time ago" label
// Example: "5 minutes ago" → "5m ago", "2 days ago" → "2d ago"
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// CallbackRequestsPanel: Displays callback requests submitted from the homepage contact form
// Fetches up to 5 most recent requests and shows name, phone, message, and time
function CallbackRequestsPanel() {
  // callbacks: list of pending callback requests from customers
  const [callbacks, setCallbacks] = useState<{id:string;name:string;phone:string;email:string;message:string;status:string;createdAt:string}[]>([]);

  // On mount: fetch callback requests from the backend
  useEffect(() => {
    fetch("http://localhost:3001/api/callbacks")
      .then(r => r.json())
      .then(setCallbacks)
      .catch(() => {});
  }, []);

  return (
    <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Phone className="w-5 h-5 text-cyan-400" /> Callback Requests
        </h2>
        <Link to="/admin/queries" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 no-underline">View All <ChevronRight className="w-3.5 h-3.5" /></Link>
      </div>
      <div className="space-y-3">
        {callbacks.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No callback requests yet.</p>
        ) : (
          callbacks.slice(0, 5).map((cb) => (
            <div key={cb.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-cyan-400" /></div>
                <div>
                  <p className="text-white text-sm font-medium">{cb.name}</p>
                  <p className="text-slate-500 text-xs">{cb.message || cb.email || "Callback request"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">{cb.phone}</p>
                <p className="text-slate-600 text-[10px]">{timeAgo(cb.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

