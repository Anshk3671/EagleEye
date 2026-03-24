/**
 * AgentPortalPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The main portal/home page for delivery agents.
 *
 * WHAT IT SHOWS:
 *  - Assigned delivery tasks for the day
 *  - Hub assignment and zone information
 *  - Navigation links to scan, delivery, and payment pages
 *  - Agent performance stats
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { Link } from "react-router";
import {
  User, MapPin, Package, Truck, Star, CheckCircle2, Clock, Navigation,
  ChevronRight, Zap, Target, Award, TrendingUp, Building2, Circle
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { HUB_LOCATIONS, SIMULATED_AGENTS, getHubByCode, getHubByCity } from "../lib/mapData";

const ALL_TASKS_MOCK = [
  // Delhi/NCR hub parcels
  { awb: "EE-742-9910", dest: "Connaught Place, Delhi", status: "IN_TRANSIT", type: "Express Parcel", weight: "2.5 kg", hubCode: "DEL" },
  { awb: "EE-998-1122", dest: "Dwarka Sector 21, Delhi", status: "PENDING", type: "Express Premium", weight: "1.0 kg", hubCode: "DEL" },
  { awb: "EE-774-5566", dest: "Noida Sector 62, NCR", status: "OUT_FOR_DELIVERY", type: "E-Commerce", weight: "0.5 kg", hubCode: "DEL" },
  // Mumbai hub parcels
  { awb: "EE-331-4455", dest: "Andheri West, Mumbai", status: "PENDING", type: "E-Commerce", weight: "1.2 kg", hubCode: "MUM" },
  { awb: "EE-887-2201", dest: "Bandra, Mumbai", status: "OUT_FOR_DELIVERY", type: "Express Premium", weight: "0.8 kg", hubCode: "MUM" },
  { awb: "EE-556-7788", dest: "Powai, Mumbai", status: "PENDING", type: "LTL Freight", weight: "15 kg", hubCode: "MUM" },
  { awb: "EE-112-3344", dest: "Juhu, Mumbai", status: "IN_TRANSIT", type: "Express Parcel", weight: "3.0 kg", hubCode: "MUM" },
  // Bangalore hub parcels
  { awb: "EE-443-7788", dest: "Koramangala, Bangalore", status: "PENDING", type: "Express Parcel", weight: "2.0 kg", hubCode: "BLR" },
  { awb: "EE-665-9900", dest: "Whitefield, Bangalore", status: "IN_TRANSIT", type: "E-Commerce", weight: "1.5 kg", hubCode: "BLR" },
  // Chennai hub parcels
  { awb: "EE-221-3344", dest: "T. Nagar, Chennai", status: "PENDING", type: "Express Parcel", weight: "1.8 kg", hubCode: "MAA" },
  // Pune hub parcels
  { awb: "EE-889-1122", dest: "Hinjewadi, Pune", status: "IN_TRANSIT", type: "E-Commerce", weight: "0.9 kg", hubCode: "PNQ" },
  // Kolkata hub parcels
  { awb: "EE-553-7700", dest: "Salt Lake, Kolkata", status: "PENDING", type: "Express Parcel", weight: "2.2 kg", hubCode: "CCU" },
  // Hyderabad hub parcels
  { awb: "EE-770-2233", dest: "Madhapur, Hyderabad", status: "OUT_FOR_DELIVERY", type: "Express Premium", weight: "0.6 kg", hubCode: "HYD" },
];

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  PENDING: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Pending" },
  IN_TRANSIT: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "In Transit" },
  OUT_FOR_DELIVERY: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Out for Delivery" },
  DELIVERED: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Delivered" },
};

export default function AgentPortalPage() {
  const { user } = useAuth();
  const agentHub = (user?.city && getHubByCity(user.city)) 
    || (user?.address && getHubByCity(user.address))
    || getHubByCode(user?.hubCode || "DEL");
  const simAgent = SIMULATED_AGENTS.find(a => a.id === user?.agentId);

  const completedToday = simAgent?.completedToday ?? 7;
  const totalTasks = simAgent?.totalTasks ?? 12;
  const pct = Math.round((completedToday / totalTasks) * 100);
  const creditPoints = user?.creditPoints ?? 850;

  // Filter tasks to only show parcels for this agent's hub
  const TASKS_MOCK = ALL_TASKS_MOCK.filter(t => !agentHub || t.hubCode === agentHub.code);

  // Nearest hubs (sorted by distance from agent's hub)
  const nearbyHubs = agentHub
    ? HUB_LOCATIONS
        .filter(h => h.code !== agentHub.code)
        .map(h => ({
          ...h,
          dist: Math.round(
            6371 * 2 * Math.asin(Math.sqrt(
              Math.sin(((h.lat - agentHub.lat) * Math.PI / 180) / 2) ** 2 +
              Math.cos(agentHub.lat * Math.PI / 180) * Math.cos(h.lat * Math.PI / 180) *
              Math.sin(((h.lng - agentHub.lng) * Math.PI / 180) / 2) ** 2
            ))
          ),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 6)
    : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Agent Profile Card */}
        <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/40 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
                {user?.avatar || "AP"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.name || "Agent"}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-emerald-400 text-sm">
                    <Circle className="w-2.5 h-2.5 fill-current" /> Active
                  </span>
                  <span className="text-slate-500 text-sm">|</span>
                  <span className="flex items-center gap-1 text-slate-400 text-sm">
                    <Building2 className="w-3.5 h-3.5" /> {agentHub?.name || "Hub"}
                  </span>
                  <span className="text-slate-500 text-sm">|</span>
                  <span className="flex items-center gap-1 text-slate-400 text-sm">
                    <Truck className="w-3.5 h-3.5" /> {user?.vehicleType || "Bike"}
                  </span>
                </div>
                {user?.address && (
                  <p className="flex items-center gap-1 text-slate-500 text-xs mt-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> {user.address}{user.city ? `, ${user.city}` : ""}{user.pincode ? ` - ${user.pincode}` : ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold">{creditPoints}</span>
                <span className="text-amber-400/60 text-xs">points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/agent/delivery" className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/15 transition-all no-underline group">
            <Navigation className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white font-semibold text-sm">Start Delivery</p>
            <p className="text-slate-500 text-xs mt-0.5">Navigate to destination</p>
          </Link>
          <Link to="/agent/scan" className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/15 transition-all no-underline group">
            <Target className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white font-semibold text-sm">Scan Parcel</p>
            <p className="text-slate-500 text-xs mt-0.5">Update parcel status</p>
          </Link>
          <Link to="/agent/payments" className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/15 transition-all no-underline group">
            <Award className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white font-semibold text-sm">Payments</p>
            <p className="text-slate-500 text-xs mt-0.5">COD & earnings</p>
          </Link>
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-white font-semibold text-sm">Daily Progress</p>
            <p className="text-amber-400 text-xs mt-0.5 font-bold">{completedToday}/{totalTasks} tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Parcels */}
          <div className="lg:col-span-2 p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-blue-400" />
              Assigned Parcels
              <span className="ml-auto px-2 py-0.5 bg-blue-500/10 rounded-lg text-blue-400 text-xs font-bold">{TASKS_MOCK.length}</span>
            </h2>
            <div className="space-y-3">
              {TASKS_MOCK.map((task) => {
                const badge = STATUS_BADGE[task.status] || STATUS_BADGE.PENDING;
                return (
                  <div key={task.awb} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                        <Package className="w-4.5 h-4.5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-mono text-sm font-semibold">{task.awb}</p>
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {task.dest}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>{badge.label}</span>
                      <Link to="/agent/delivery" className="text-slate-500 hover:text-blue-400 transition-colors no-underline">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Progress Ring */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40 text-center">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2 justify-center">
                <Clock className="w-4 h-4 text-emerald-400" /> Today's Progress
              </h3>
              <div className="relative w-28 h-28 mx-auto mb-3">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#grad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${pct * 2.64} 264`} />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{pct}%</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">{completedToday} of {totalTasks} deliveries</p>
            </div>

            {/* Nearest Hubs */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" /> Nearest Hubs
              </h3>
              <div className="space-y-2">
                {nearbyHubs.map(hub => (
                  <div key={hub.code} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400 font-mono">{hub.code}</span>
                      <span className="text-white text-sm">{hub.name.replace(" Hub", "")}</span>
                    </div>
                    <span className="text-slate-500 text-xs">{hub.dist} km</span>
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
