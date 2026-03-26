/**
 * AccountOrdersPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The "My Orders" page showing all past and current shipments for a logged-in customer.
 *
 * WHAT IT SHOWS:
 *  - Complete list of shipments booked by this customer
 *  - AWB number, status, route, booking date
 *  - Link to the full tracking details page for each shipment
 *  - Filter by status: All / Active / Delivered
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getShipments, type Shipment } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowLeft,
  History,
  Search,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Loader2,
  User,
} from "lucide-react";
import { format } from "date-fns";

const API_BASE = "http://localhost:3001/api";

// ─── Status Colors ──────────────────────────────────────
const STATUS_COLORS: Record<string, { text: string; bg: string; icon: typeof Package }> = {
  IN_TRANSIT: { text: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Truck },
  DELIVERED: { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  DELAYED: { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
  PENDING: { text: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: Clock },
  OUT_FOR_DELIVERY: { text: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: Truck },
};

export default function AccountOrdersPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Auto-load user's orders on mount
  useEffect(() => {
    if (isAuthenticated && user?.phone) {
      loadMyOrders();
    }
  }, [isAuthenticated, user?.phone]);

  async function loadMyOrders() {
    if (!user?.phone) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shipments/my/${encodeURIComponent(user.phone)}`);
      if (res.ok) {
        const data = await res.json();
        setShipments(data.shipments || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      // If search cleared, reload user's orders
      await loadMyOrders();
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await getShipments({ search: query.trim(), limit: 20 });
      setShipments(res.shipments);
    } catch {
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 no-underline transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mt-2">
            <User className="w-4 h-4 inline" />
            <span className="ml-1">My Account</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Order History</h1>
          <p className="text-slate-400 mt-1">Track and manage all your past shipments.</p>
        </div>

        {/* Search */}
        <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40 mb-6">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Search Orders
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Search by AWB number, sender, receiver, or city.
          </p>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. EE-463-4177, Delhi, Amit..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
          </div>
        )}

        {/* No orders found */}
        {!loading && initialLoaded && shipments.length === 0 && !searched && (
          <div className="text-center py-12 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium text-slate-400 mb-1">No orders yet</p>
            <p className="text-sm">Book a shipment to see your order history here.</p>
            <Link
              to="/client"
              className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all no-underline"
            >
              <Package className="w-4 h-4" />
              Ship Now
            </Link>
          </div>
        )}

        {/* No search results */}
        {!loading && searched && shipments.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No shipments found. Try a different search term.</p>
          </div>
        )}

        {/* Shipment list */}
        {!loading && shipments.length > 0 && (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">{shipments.length} shipment{shipments.length !== 1 ? "s" : ""} found</p>
            {shipments.map((s) => {
              const sc = STATUS_COLORS[s.status] || STATUS_COLORS.PENDING;
              const Icon = sc.icon;
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/shipments/${s.awbNumber}`)}
                  className={`p-5 rounded-xl border ${sc.bg} cursor-pointer hover:brightness-110 transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${sc.bg} border flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${sc.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-mono font-bold">{s.awbNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sc.bg} ${sc.text} border`}>
                            {s.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-slate-500">{s.shipmentType}</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-0.5">
                          {s.origin.split(",")[0]} → {s.destination.split(",")[0]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="hidden md:block">
                        <p className="text-slate-500 text-xs">Expected</p>
                        <p className="text-white text-sm font-medium">
                          {format(new Date(s.expectedDelivery), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
