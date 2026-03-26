/**
 * AgentPaymentsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The payments and COD (Cash on Delivery) management page for agents.
 *
 * WHAT IT SHOWS:
 *  - List of COD payments to be collected from customers
 *  - Total amount collected today vs. pending
 *  - Ability to mark a COD payment as collected
 *  - Remittance history (money sent back to the company)
 *
 * STORAGE: API-backed with localStorage fallback
 *  - Loads COD parcels from /api/payments/cod/:phone (database) first
 *  - Falls back to localStorage if API is unreachable
 *  - COD collection status synced to both API and localStorage
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, IndianRupee, CreditCard, CheckCircle2, Clock, TrendingUp,
  Star, Package, Wallet, Award, Gift, MapPin
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getHubByCode, getHubByCity } from "../lib/mapData";

interface CodParcel {
  awb: string;
  receiver: string;
  amount: number;
  status: string; // "pending" | "collected"
}

const DEFAULT_COD_PARCELS: CodParcel[] = [
  { awb: "EE-331-4455", receiver: "Neha Desai", amount: 1250, status: "pending" },
  { awb: "EE-887-2201", receiver: "Harsh Vardhan", amount: 850, status: "pending" },
  { awb: "EE-556-7788", receiver: "Pooja Bansal", amount: 3200, status: "collected" },
  { awb: "EE-112-3344", receiver: "Karan Malhotra", amount: 1800, status: "pending" },
  { awb: "EE-209-6677", receiver: "Ritu Mishra", amount: 600, status: "collected" },
];

const API_BASE = "http://localhost:3001/api";
const LS_COD_KEY = "ee_cod_parcels";

function loadLocalCodParcels(): CodParcel[] {
  try {
    const saved = localStorage.getItem(LS_COD_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  localStorage.setItem(LS_COD_KEY, JSON.stringify(DEFAULT_COD_PARCELS));
  return DEFAULT_COD_PARCELS;
}

const EARNING_HISTORY = [
  { date: "Today", deliveries: 7, commission: 350, cod: 3800, points: 70 },
  { date: "Yesterday", deliveries: 11, commission: 550, cod: 5200, points: 110 },
  { date: "29 Mar", deliveries: 9, commission: 450, cod: 4100, points: 90 },
  { date: "28 Mar", deliveries: 8, commission: 400, cod: 3600, points: 80 },
  { date: "27 Mar", deliveries: 12, commission: 600, cod: 6800, points: 120 },
];

const POINT_REWARDS = [
  { points: 500, reward: "₹250 wallet credit" },
  { points: 1000, reward: "₹600 wallet credit" },
  { points: 2000, reward: "₹1,500 wallet credit" },
  { points: 5000, reward: "Premium Agent Badge + ₹5,000" },
];

export default function AgentPaymentsPage() {
  const { user } = useAuth();
  const agentHub = (user?.city && getHubByCity(user.city)) 
    || (user?.address && getHubByCity(user.address))
    || getHubByCode(user?.hubCode || "DEL");
  const [codParcels, setCodParcels] = useState<CodParcel[]>(loadLocalCodParcels);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const totalPending = codParcels.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalCollected = codParcels.filter(p => p.status === "collected").reduce((s, p) => s + p.amount, 0);
  const creditPoints = user?.creditPoints ?? 850;
  const todayCommission = EARNING_HISTORY[0].commission;

  // Load COD parcels from API on mount
  useEffect(() => {
    const phone = user?.phone || "agent";

    // First seed default data if needed
    fetch(`${API_BASE}/payments/cod/seed`, { method: "POST" }).catch(() => {});

    // Then fetch COD parcels
    fetch(`${API_BASE}/payments/cod/${encodeURIComponent(phone)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.parcels && data.parcels.length > 0) {
          const mapped: CodParcel[] = data.parcels.map((p: any) => ({
            awb: p.awbNumber,
            receiver: p.description || "Customer",
            amount: p.amount,
            status: p.paymentStatus === "PAID" ? "collected" : "pending",
          }));
          setCodParcels(mapped);
          localStorage.setItem(LS_COD_KEY, JSON.stringify(mapped));
        }
      })
      .catch(() => { /* use localStorage fallback */ });
  }, [user?.phone]);

  function handleCollectCOD(awb: string) {
    setCollectingId(awb);

    // Update API first
    fetch(`${API_BASE}/payments/cod/${encodeURIComponent(awb)}/collect`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    })
      .then(r => r.ok ? r.json() : null)
      .finally(() => {
        // Update local state regardless of API result
        const updated = codParcels.map(p => p.awb === awb ? { ...p, status: "collected" } : p);
        setCodParcels(updated);
        localStorage.setItem(LS_COD_KEY, JSON.stringify(updated));
        setCollectingId(null);
      });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/agent/dashboard" className="text-slate-500 hover:text-white transition-colors no-underline">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-purple-400" /> Payments & Earnings
            </h1>
            <p className="text-slate-400 text-sm">Manage COD collections, view earnings, and redeem credit points</p>
            <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {agentHub?.name || "Hub"}{user?.address ? ` • ${user.address}` : ""}{user?.pincode ? ` - ${user.pincode}` : ""}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <IndianRupee className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-white">₹{totalPending.toLocaleString()}</p>
            <p className="text-amber-400/70 text-xs">COD Pending</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-white">₹{totalCollected.toLocaleString()}</p>
            <p className="text-emerald-400/70 text-xs">COD Collected</p>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <TrendingUp className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white">₹{todayCommission}</p>
            <p className="text-blue-400/70 text-xs">Today's Commission</p>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <Star className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">{creditPoints}</p>
            <p className="text-purple-400/70 text-xs">Credit Points</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COD Collection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" /> COD Collection
              </h2>
              <div className="space-y-3">
                {codParcels.map(parcel => (
                  <div key={parcel.awb} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-white font-mono text-sm">{parcel.awb}</p>
                        <p className="text-slate-500 text-xs">{parcel.receiver}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-sm">₹{parcel.amount.toLocaleString()}</span>
                      {parcel.status === "collected" ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">Collected</span>
                      ) : (
                        <button
                          onClick={() => handleCollectCOD(parcel.awb)}
                          disabled={collectingId === parcel.awb}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                        >
                          {collectingId === parcel.awb ? "..." : "Collect"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings History */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Earnings History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/40">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Deliveries</th>
                      <th className="pb-3 pr-4">Commission</th>
                      <th className="pb-3 pr-4">COD</th>
                      <th className="pb-3">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EARNING_HISTORY.map((row, i) => (
                      <tr key={i} className="border-b border-slate-700/20 last:border-0">
                        <td className="py-3 pr-4 text-white text-sm">{row.date}</td>
                        <td className="py-3 pr-4 text-slate-400 text-sm">{row.deliveries}</td>
                        <td className="py-3 pr-4 text-emerald-400 text-sm font-bold">₹{row.commission}</td>
                        <td className="py-3 pr-4 text-slate-400 text-sm">₹{row.cod.toLocaleString()}</td>
                        <td className="py-3 text-amber-400 text-sm">+{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Points & Rewards */}
          <div className="space-y-6">
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" /> Credit Points
              </h3>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-purple-400">{creditPoints}</p>
                <p className="text-slate-500 text-xs mt-1">Available Points</p>
              </div>
              <div className="space-y-2">
                {POINT_REWARDS.map((pr) => {
                  const canRedeem = creditPoints >= pr.points;
                  return (
                    <div key={pr.points} className={`p-3 rounded-lg border ${canRedeem ? "bg-purple-500/10 border-purple-500/20" : "bg-slate-700/20 border-slate-700/30"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className={`w-4 h-4 ${canRedeem ? "text-purple-400" : "text-slate-600"}`} />
                          <span className={`text-sm ${canRedeem ? "text-white" : "text-slate-500"}`}>{pr.reward}</span>
                        </div>
                        <span className={`text-xs font-bold ${canRedeem ? "text-purple-400" : "text-slate-600"}`}>{pr.points} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" /> Accepted Payment
              </h3>
              <div className="space-y-2">
                {["Cash", "UPI (GPay/PhonePe)", "Card (Swipe)"].map(m => (
                  <div key={m} className="flex items-center gap-2 py-2 border-b border-slate-700/20 last:border-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300 text-sm">{m}</span>
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
