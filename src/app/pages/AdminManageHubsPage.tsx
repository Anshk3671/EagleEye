/**
 * AdminManageHubsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The admin page for managing logistics hubs.
 *
 * WHAT IT DOES:
 *  - Shows a list of all EagleEye logistics hubs across India
 *  - Allows admins to add new hubs, edit capacity, status, and zone
 *  - Displays hub tier (Tier 1/2/3), city, state, and active agent count
 *  - Uses the useHubs() hook to fetch hub data from the backend
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, Building2, Plus, Search, MapPin, CheckCircle2,
  Loader2, X, Users, Gauge, Globe
} from "lucide-react";
import { HUB_LOCATIONS, type HubLocation } from "../lib/mapData";

export default function AdminManageHubsPage() {
  const [hubs, setHubs] = useState<HubLocation[]>([...HUB_LOCATIONS]);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState("");

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZone, setNewZone] = useState<HubLocation["zone"]>("North");
  const [newTier, setNewTier] = useState<1 | 2 | 3>(3);
  const [newCapacity, setNewCapacity] = useState("30");

  const zones = Array.from(new Set(HUB_LOCATIONS.map(h => h.zone)));
  const filtered = hubs.filter(h => {
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.code.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase());
    const matchZone = !zoneFilter || h.zone === zoneFilter;
    return matchSearch && matchZone;
  });

  function handleAddHub(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newCode || !newCity || !newState) return;
    setAdding(true);
    setTimeout(() => {
      const newHub: HubLocation = {
        code: newCode.toUpperCase(),
        name: newName,
        city: newCity,
        state: newState,
        zone: newZone,
        lat: 20 + Math.random() * 12,
        lng: 72 + Math.random() * 16,
        status: "OPTIMIZED",
        capacity: Number(newCapacity) || 30,
        activeAgents: 0,
        tier: newTier,
      };
      setHubs(prev => [newHub, ...prev]);
      setAdding(false);
      setShowAddForm(false);
      setSuccess(`Hub "${newName}" (${newCode.toUpperCase()}) added successfully.`);
      setNewName(""); setNewCode(""); setNewCity(""); setNewState(""); setNewCapacity("30");
      setTimeout(() => setSuccess(""), 5000);
    }, 1500);
  }

  const tierLabel = (t: number) => t === 1 ? "Tier 1 (Metro)" : t === 2 ? "Tier 2 (Regional)" : "Tier 3 (Local)";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-slate-500 hover:text-white transition-colors no-underline"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Manage Hubs</h1>
              <p className="text-slate-400 text-sm">{hubs.length} hubs across {zones.length} zones</p>
            </div>
          </div>
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer transition-all">
            <Plus className="w-4 h-4" /> Add Hub
          </button>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400 text-sm">{success}</span>
          </div>
        )}

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hubs..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none appearance-none cursor-pointer">
            <option value="">All Zones</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(hub => (
            <div key={hub.code} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-slate-600/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hub.status === "WARNING" ? "bg-amber-500/20" : "bg-emerald-500/20"}`}>
                    <Building2 className={`w-5 h-5 ${hub.status === "WARNING" ? "text-amber-400" : "text-emerald-400"}`} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{hub.name}</p>
                    <p className="text-slate-500 text-xs">{hub.city}, {hub.state}</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400 font-mono">{hub.code}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="py-1.5 bg-slate-700/30 rounded-lg">
                  <Gauge className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                  <p className="text-white text-xs font-bold">{hub.capacity}%</p>
                  <p className="text-slate-500 text-[10px]">Capacity</p>
                </div>
                <div className="py-1.5 bg-slate-700/30 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                  <p className="text-white text-xs font-bold">{hub.activeAgents}</p>
                  <p className="text-slate-500 text-[10px]">Agents</p>
                </div>
                <div className="py-1.5 bg-slate-700/30 rounded-lg">
                  <Globe className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                  <p className="text-white text-xs font-bold">{hub.zone}</p>
                  <p className="text-slate-500 text-[10px]">Zone</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">{tierLabel(hub.tier)}</span>
                <span className={`font-bold ${hub.status === "WARNING" ? "text-amber-400" : "text-emerald-400"}`}>{hub.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Hub Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-400" /> Add New Hub</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddHub} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Hub Name *</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Kanpur Hub" required
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Code *</label>
                  <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="KNP" maxLength={3} required
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">City *</label>
                  <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Kanpur" required
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" /></div>
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">State *</label>
                  <input value={newState} onChange={e => setNewState(e.target.value)} placeholder="Uttar Pradesh" required
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Zone</label>
                  <select value={newZone} onChange={e => setNewZone(e.target.value as HubLocation["zone"])}
                    className="w-full px-2 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none appearance-none cursor-pointer">
                    {zones.map(z => <option key={z} value={z}>{z}</option>)}
                  </select></div>
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Tier</label>
                  <select value={newTier} onChange={e => setNewTier(Number(e.target.value) as 1|2|3)}
                    className="w-full px-2 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none appearance-none cursor-pointer">
                    <option value={1}>Tier 1</option><option value={2}>Tier 2</option><option value={3}>Tier 3</option>
                  </select></div>
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Capacity</label>
                  <input value={newCapacity} onChange={e => setNewCapacity(e.target.value)} type="number"
                    className="w-full px-2 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
              </div>
              <button type="submit" disabled={adding || !newName || !newCode || !newCity || !newState}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                {adding ? "Adding Hub..." : "Add Hub"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
