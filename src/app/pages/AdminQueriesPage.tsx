/**
 * AdminQueriesPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The customer support queries / help tickets page for admins.
 *
 * WHAT IT SHOWS:
 *  - List of support queries submitted by customers
 *  - Callback requests from the homepage contact form
 *  - Admins can mark queries as resolved or reply to them
 *  - Filter by status: Open, In Progress, Resolved
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, MessageSquare, CheckCircle2, Clock, Search, User, Phone,
  Mail, AlertCircle, ChevronRight, Filter, Loader2, X, Send
} from "lucide-react";

interface Query {
  id: string; name: string; email: string; phone: string; subject: string;
  message: string; status: "open" | "assigned" | "resolved"; assignedTo: string;
  date: string; category: string;
}

const MOCK_QUERIES: Query[] = [
  { id: "Q-1001", name: "Ravi Mehta", email: "ravi@gmail.com", phone: "+91 98765 43210", subject: "Parcel not received", message: "My parcel EE-123 has been delayed for 5 days.", status: "open", assignedTo: "", date: "31 Mar 2026", category: "Delivery Issue" },
  { id: "Q-1002", name: "Sneha Patel", email: "sneha@gmail.com", phone: "+91 91234 56789", subject: "Wrong delivery address", message: "My parcel was delivered to wrong address.", status: "assigned", assignedTo: "Support Agent - Priya", date: "30 Mar 2026", category: "Address Issue" },
  { id: "Q-1003", name: "Karthik Reddy", email: "karthik@gmail.com", phone: "+91 90123 45678", subject: "Refund request", message: "I want a refund for my damaged parcel.", status: "open", assignedTo: "", date: "30 Mar 2026", category: "Refund" },
  { id: "Q-1004", name: "Anita Singh", email: "anita@gmail.com", phone: "+91 89012 34567", subject: "Tracking not updating", message: "AWB EE-456 tracking has not updated for 2 days.", status: "resolved", assignedTo: "Support Agent - Amit", date: "29 Mar 2026", category: "Tracking" },
  { id: "Q-1005", name: "Vikash Yadav", email: "vikash@gmail.com", phone: "+91 78901 23456", subject: "Request callback for bulk order", message: "I need a callback to discuss bulk shipping rates.", status: "open", assignedTo: "", date: "31 Mar 2026", category: "Callback" },
  { id: "Q-1006", name: "Meera Joshi", email: "meera@gmail.com", phone: "+91 67890 12345", subject: "Service complaint", message: "The delivery agent was rude during delivery.", status: "assigned", assignedTo: "Support Agent - Rahul", date: "29 Mar 2026", category: "Complaint" },
];

const SUPPORT_AGENTS = ["Support Agent - Priya", "Support Agent - Amit", "Support Agent - Rahul", "Support Agent - Neha", "Support Agent - Deepak"];

export default function AdminQueriesPage() {
  const [queries, setQueries] = useState<Query[]>(MOCK_QUERIES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [assignAgent, setAssignAgent] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState("");

  const filtered = queries.filter(q => {
    const matchSearch = !search || q.name.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase()) || q.id.includes(search);
    const matchStatus = !statusFilter || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCount = queries.filter(q => q.status === "open").length;
  const assignedCount = queries.filter(q => q.status === "assigned").length;
  const resolvedCount = queries.filter(q => q.status === "resolved").length;

  function handleAssign() {
    if (!selectedQuery || !assignAgent) return;
    setQueries(prev => prev.map(q => q.id === selectedQuery.id ? { ...q, status: "assigned" as const, assignedTo: assignAgent } : q));
    setSelectedQuery(prev => prev ? { ...prev, status: "assigned", assignedTo: assignAgent } : null);
  }

  function handleResolve() {
    if (!selectedQuery) return;
    setResolving(true);
    setTimeout(() => {
      setQueries(prev => prev.map(q => q.id === selectedQuery.id ? { ...q, status: "resolved" as const } : q));
      setSelectedQuery(null);
      setResolving(false);
      setResolveNote("");
    }, 1000);
  }

  const statusColor = (s: string) => s === "open" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : s === "assigned" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin" className="text-slate-500 hover:text-white transition-colors no-underline"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Support Queries</h1>
            <p className="text-slate-400 text-sm">Manage customer support tickets and callback requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm font-medium">{openCount} Open</span>
          <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm font-medium">{assignedCount} Assigned</span>
          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-medium">{resolvedCount} Resolved</span>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search queries..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none appearance-none cursor-pointer">
            <option value="">All Status</option>
            <option value="open">Open</option><option value="assigned">Assigned</option><option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Query List */}
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} onClick={() => { setSelectedQuery(q); setAssignAgent(q.assignedTo); }}
              className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-slate-600/50 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {q.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{q.subject}</p>
                      <span className="text-slate-600 text-xs">#{q.id}</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{q.name} · {q.category} · {q.date}</p>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-1">{q.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(q.status)}`}>{q.status}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedQuery(null)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">#{selectedQuery.id}</h3>
              <button onClick={() => setSelectedQuery(null)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /><span className="text-white text-sm">{selectedQuery.name}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-500" /><span className="text-slate-400 text-sm">{selectedQuery.email}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500" /><span className="text-slate-400 text-sm">{selectedQuery.phone}</span></div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg mb-4">
              <p className="text-white font-semibold text-sm mb-1">{selectedQuery.subject}</p>
              <p className="text-slate-400 text-sm">{selectedQuery.message}</p>
            </div>

            {selectedQuery.status !== "resolved" && (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Assign to Support Agent</label>
                  <select value={assignAgent} onChange={e => setAssignAgent(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none appearance-none cursor-pointer">
                    <option value="">Select Agent</option>
                    {SUPPORT_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAssign} disabled={!assignAgent}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Assign
                  </button>
                  <button onClick={handleResolve} disabled={resolving}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                    {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Resolve
                  </button>
                </div>
              </div>
            )}
            {selectedQuery.status === "resolved" && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">This query has been resolved.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
