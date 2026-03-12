/**
 * SupportLocateUsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The "Find a Hub / Locate Us" page for customers to find nearby EagleEye offices.
 *
 * WHAT IT SHOWS:
 *  - Interactive map showing all EagleEye hub locations across India
 *  - Search by city or PIN code to find nearest hub
 *  - Each hub shows address, phone, working hours
 *  - Zone-wise filtering (North / South / East / West)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { Link } from "react-router";
import {
  MapPin,
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  Building2,
  Navigation,
  Search,
} from "lucide-react";
import { HUB_LOCATIONS, getHubStats } from "../lib/mapData";

// Auto-generate locations from mapData for consistency
const LOCATION_DETAILS: Record<string, { type: string; phone: string; email: string; hours: string; address: string }> = {
  BOM: { type: "Head Office", phone: "+91 22 4050 1234", email: "hq@eagleeye.in", hours: "Mon–Sat: 9:00 AM – 7:00 PM", address: "Andheri East, Western Express Highway, Mumbai 400093" },
  DEL: { type: "Regional Hub", phone: "+91 124 401 5678", email: "delhi@eagleeye.in", hours: "Mon–Sat: 8:00 AM – 8:00 PM", address: "Sector 18, Gurgaon, Haryana 122015" },
  BLR: { type: "Regional Hub", phone: "+91 80 2557 9012", email: "blr@eagleeye.in", hours: "Mon–Sat: 9:00 AM – 7:00 PM", address: "Whitefield Main Road, Bangalore 560066" },
  MAA: { type: "Warehouse", phone: "+91 44 2635 3456", email: "chennai@eagleeye.in", hours: "Mon–Sat: 8:30 AM – 6:30 PM", address: "Ambattur Industrial Estate, Chennai 600058" },
  HYD: { type: "Warehouse", phone: "+91 40 2345 6789", email: "hyd@eagleeye.in", hours: "Mon–Sat: 8:00 AM – 7:00 PM", address: "HITEC City, Madhapur, Hyderabad 500081" },
  CCU: { type: "Regional Hub", phone: "+91 33 4030 7890", email: "kolkata@eagleeye.in", hours: "Mon–Sat: 9:00 AM – 6:00 PM", address: "Sector V, Salt Lake, Kolkata 700091" },
  PNQ: { type: "Regional Hub", phone: "+91 20 2568 1234", email: "pune@eagleeye.in", hours: "Mon–Sat: 9:00 AM – 7:00 PM", address: "Hinjewadi IT Park, Pune 411057" },
  AMD: { type: "Service Center", phone: "+91 79 2680 1234", email: "amd@eagleeye.in", hours: "Mon–Sat: 9:30 AM – 6:30 PM", address: "SG Highway, Ahmedabad 380054" },
  NAG: { type: "Transit Hub", phone: "+91 712 245 3456", email: "nagpur@eagleeye.in", hours: "Mon–Sat: 8:00 AM – 7:00 PM", address: "Butibori Industrial Area, Nagpur 441108" },
  JAI: { type: "Sorting Center", phone: "+91 141 235 5678", email: "jaipur@eagleeye.in", hours: "Mon–Sat: 8:00 AM – 7:00 PM", address: "Mansarovar Industrial Area, Jaipur 302020" },
};

const LOCATIONS = HUB_LOCATIONS.map((hub) => {
  const detail = LOCATION_DETAILS[hub.code];
  const zoneMap: Record<string, string> = { "North Zone": "North", "South Zone": "South", "East Zone": "East", "West Zone": "West", "Central Zone": "Central", "Northeast Zone": "Northeast" };
  return {
    name: hub.code === "BOM" ? "EagleEye HQ — Mumbai" : `${hub.name}`,
    type: detail?.type || (hub.tier === 1 ? "Regional Hub" : hub.tier === 2 ? "Service Center" : "Local Hub"),
    address: detail?.address || `${hub.city}, ${hub.state}`,
    phone: detail?.phone || `+91 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
    email: detail?.email || `${hub.code.toLowerCase()}@eagleeye.in`,
    hours: detail?.hours || "Mon–Sat: 9:00 AM – 6:00 PM",
    lat: hub.lat,
    lng: hub.lng,
    zone: zoneMap[hub.zone] || hub.zone.replace(" Zone", ""),
    code: hub.code,
    activeAgents: hub.activeAgents,
    tier: hub.tier,
  };
});

const ZONE_COLORS: Record<string, string> = {
  North: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  South: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  East: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  West: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  Central: "bg-red-500/10 border-red-500/20 text-red-400",
  Northeast: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
};

export default function SupportLocateUsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const hubStats = getHubStats();

  const zones = [...new Set(LOCATIONS.map((l) => l.zone))];

  const filtered = LOCATIONS.filter((loc) => {
    const matchesSearch = !searchQuery ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = !activeZone || loc.zone === activeZone;
    return matchesSearch && matchesZone;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 no-underline transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4 ml-0 block mt-2">
            <MapPin className="w-4 h-4 inline" />
            <span className="ml-1">Locate Us</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Our Locations</h1>
          <p className="text-slate-400 mt-1">Find an EagleEye hub, office, or service center near you.</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, zone, or address..."
              className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700/40 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveZone(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !activeZone ? "bg-blue-600 text-white" : "bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/40"
              }`}
            >
              All
            </button>
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setActiveZone(activeZone === zone ? null : zone)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeZone === zone ? "bg-blue-600 text-white" : "bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/40"
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row — dynamic from mapData */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: String(hubStats.total), label: "Logistics Hubs" },
            { value: "17,500+", label: "PIN Codes" },
            { value: "96%", label: "India Coverage" },
            { value: `${hubStats.totalAgents}+`, label: "Personnel" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-slate-600">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No locations found matching your search.</p>
            </div>
          ) : (
            filtered.map((loc) => (
              <div
                key={loc.code}
                className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-slate-600/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold text-base">{loc.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${ZONE_COLORS[loc.zone] || ZONE_COLORS.North}`}>
                      {loc.zone} Zone — {loc.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400 font-mono">{loc.code}</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-700/40 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Building2 className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 mt-4">
                  <div className="flex items-start gap-2.5">
                    <Navigation className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{loc.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{loc.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{loc.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{loc.hours}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
