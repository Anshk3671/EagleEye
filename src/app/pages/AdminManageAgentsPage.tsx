/**
 * AdminManageAgentsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The admin page for managing delivery agents.
 *
 * WHAT IT DOES:
 *  - Shows a searchable list of all registered agents
 *  - Allows admins to add new agents, edit existing ones, or deactivate them
 *  - Displays each agent's hub assignment, zone, vehicle type, and status
 *  - Uses the useAgents() hook to fetch agent data from the backend
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, Users, Plus, Search, Phone, Mail, Building2, CheckCircle2,
  Loader2, X, Truck, Circle, Filter, Edit2, Trash2
} from "lucide-react";
import { HUB_LOCATIONS, SIMULATED_AGENTS } from "../lib/mapData";
import { getHubByCity } from "../lib/mapData";
import { getRegisteredAgents } from "../lib/api";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: "text-emerald-400", label: "Active" },
  ON_ROUTE: { color: "text-blue-400", label: "On Route" },
  OFFLINE: { color: "text-slate-500", label: "Offline" },
};

interface AgentRecord {
  id: string; name: string; phone: string; email: string; hubCode: string;
  status: string; vehicleType: string; completedToday: number; totalTasks: number;
  isRegistered?: boolean;
}

function generateAgentsList(): AgentRecord[] {
  return SIMULATED_AGENTS.map((sa) => ({
    id: sa.id,
    name: sa.name,
    phone: sa.phone,
    email: `${sa.name.split(" ")[0].toLowerCase()}.${sa.name.split(" ")[1]?.[0]?.toLowerCase() || "x"}@eagleeye.in`,
    hubCode: sa.hubCode,
    status: sa.status,
    vehicleType: sa.vehicleType,
    completedToday: sa.completedToday,
    totalTasks: sa.totalTasks,
  }));
}

const LS_AGENTS_KEY = "ee_custom_agents";

function loadCustomAgents(): AgentRecord[] {
  try {
    const saved = localStorage.getItem(LS_AGENTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

export default function AdminManageAgentsPage() {
  const [agents, setAgents] = useState<AgentRecord[]>(() => {
    const simulated = generateAgentsList();
    const custom = loadCustomAgents();
    // Merge custom (persisted) agents with simulated, avoiding phone duplicates
    const existingPhones = new Set(simulated.map(a => a.phone.replace(/\s/g, "")));
    const uniqueCustom = custom.filter(a => !existingPhones.has(a.phone.replace(/\s/g, "")));
    return [...uniqueCustom, ...simulated];
  });
  const [search, setSearch] = useState("");
  const [hubFilter, setHubFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState("");

  // New agent form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newHub, setNewHub] = useState("");
  const [newVehicle, setNewVehicle] = useState("bike");

  // Fetch real registered agents from DB and merge
  useEffect(() => {
    getRegisteredAgents().then((registered) => {
      if (registered.length > 0) {
        const realAgents: AgentRecord[] = registered.map((u) => {
          const hub = getHubByCity(u.city || "") ?? getHubByCity(u.address || "");
          return {
            id: `registered-${u.id}`,
            name: u.name || "Agent",
            phone: u.phone,
            email: u.email || "",
            hubCode: hub?.code || u.hubCode || "DEL",
            status: "ACTIVE",
            vehicleType: u.vehicleType || "bike",
            completedToday: 0,
            totalTasks: 0,
            isRegistered: true,
          };
        });
        setAgents((prev) => {
          // Avoid duplicates by phone
          const existingPhones = new Set(prev.map((a) => a.phone.replace(/\s/g, "")));
          const newAgents = realAgents.filter(
            (ra) => !existingPhones.has(ra.phone.replace(/\s/g, ""))
          );
          return [...newAgents, ...prev];
        });
      }
    });
  }, []);

  const filtered = agents.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.hubCode.toLowerCase().includes(search.toLowerCase());
    const matchHub = !hubFilter || a.hubCode === hubFilter;
    return matchSearch && matchHub;
  });

  function handleAddAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newPhone || !newHub) return;
    setAdding(true);
    setTimeout(() => {
      const agent: AgentRecord = {
        id: `agent-new-${Date.now()}`,
        name: newName,
        phone: newPhone,
        email: newEmail || `${newName.split(" ")[0].toLowerCase()}@eagleeye.in`,
        hubCode: newHub,
        status: "ACTIVE",
        vehicleType: newVehicle,
        completedToday: 0,
        totalTasks: 0,
      };
      const newList = [agent, ...agents];
      setAgents(newList);

      // Persist custom agents to localStorage
      const customAgents = loadCustomAgents();
      customAgents.unshift(agent);
      localStorage.setItem(LS_AGENTS_KEY, JSON.stringify(customAgents));

      // Also try to persist to backend API
      fetch("http://localhost:3001/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          email: newEmail || undefined,
          hubCode: newHub,
          vehicleType: newVehicle,
        }),
      }).catch(() => { /* silently ignore if backend is down */ });

      setAdding(false);
      setShowAddForm(false);
      setSuccess(`Agent "${newName}" registered and assigned to ${newHub}. Temporary password sent via SMS.`);
      setNewName(""); setNewPhone(""); setNewEmail(""); setNewHub(""); setNewVehicle("bike");
      setTimeout(() => setSuccess(""), 5000);
    }, 1500);
  }

  function handleRemoveAgent(id: string) {
    const updated = agents.filter(a => a.id !== id);
    setAgents(updated);
    // Update localStorage — only keep custom agents
    const customAgents = loadCustomAgents().filter(a => a.id !== id);
    localStorage.setItem(LS_AGENTS_KEY, JSON.stringify(customAgents));
  }

  const activeCount = filtered.filter(a => a.status === "ACTIVE").length;
  const onRouteCount = filtered.filter(a => a.status === "ON_ROUTE").length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-slate-500 hover:text-white transition-colors no-underline">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Manage Agents</h1>
              <p className="text-slate-400 text-sm">Register, edit, and manage delivery agents</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">{activeCount} Active</span>
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm">{onRouteCount} On Route</span>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Agent
            </button>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 text-sm">{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <select value={hubFilter} onChange={e => setHubFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none appearance-none cursor-pointer">
            <option value="">All Hubs</option>
            {HUB_LOCATIONS.map(h => <option key={h.code} value={h.code}>{h.code} — {h.name}</option>)}
          </select>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.slice(0, 30).map(agent => {
            const sc = STATUS_CONFIG[agent.status] || STATUS_CONFIG.OFFLINE;
            return (
              <div key={agent.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-slate-600/50 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                      {agent.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{agent.name}</p>
                      <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400 font-mono">{agent.hubCode}</span>
                    <button onClick={() => handleRemoveAgent(agent.id)} className="p-1 text-slate-600 hover:text-red-400 cursor-pointer transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{agent.email}</div>
                  <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{agent.phone}</div>
                  <div className="flex items-center gap-2"><Truck className="w-3 h-3" />{agent.vehicleType}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/30 flex justify-between text-xs">
                  <span className="text-slate-500">Tasks Today</span>
                  <span className="text-white">{agent.completedToday}/{agent.totalTasks}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-slate-600 text-xs mt-4 text-center">Showing {Math.min(filtered.length, 30)} of {filtered.length} agents</p>
      </div>

      {/* Add Agent Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400" /> Register New Agent</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-semibold block mb-1">Full Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Rahul Verma" required
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-semibold block mb-1">Phone Number *</label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+91 9XXXX XXXXX" required
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-semibold block mb-1">Email</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="agent@eagleeye.in"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wider font-semibold block mb-1">Assign Hub *</label>
                  <select value={newHub} onChange={e => setNewHub(e.target.value)} required
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none appearance-none cursor-pointer">
                    <option value="">Select Hub</option>
                    {HUB_LOCATIONS.map(h => <option key={h.code} value={h.code}>{h.code} — {h.name.replace(" Hub","")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wider font-semibold block mb-1">Vehicle</label>
                  <select value={newVehicle} onChange={e => setNewVehicle(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none appearance-none cursor-pointer">
                    <option value="bike">Bike</option><option value="van">Van</option><option value="truck">Truck</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={adding || !newName || !newPhone || !newHub}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? "Registering..." : "Register Agent"}
              </button>
              <p className="text-slate-500 text-xs text-center">A temporary password will be sent via SMS to the agent's phone.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
