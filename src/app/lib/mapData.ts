/**
 * mapData.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Static data file: ALL HUB LOCATIONS, AGENT DATA, and CONNECTIONS used on the India map.
 *
 * WHAT'S IN HERE:
 *  1. HubLocation interface  — Shape of a logistics hub object
 *  2. SimulatedAgent interface — Shape of a simulated delivery agent object
 *  3. HubConnection interface — Represents a route between two hubs
 *  4. HUB_LOCATIONS[]       — 35+ real Indian city hub data (lat/lng, zone, capacity, tier)
 *  5. HUB_CONNECTIONS[]     — Which hubs are connected to each other (primary/secondary routes)
 *  6. SIMULATED_AGENTS[]    — Mock delivery agents for demonstration purposes
 *  7. getHubStats()         — Helper to compute aggregate stats (total hubs, agents, zones, states)
 *  8. getHubByCode(code)    — Look up a hub by its 3-letter code (e.g. "BOM" = Mumbai)
 *
 * WHERE IT'S USED:
 *  - IndiaMap.tsx (renders markers and route lines on the map)
 *  - HomePage.tsx NetworkMapSection (network section of the landing page)
 *  - NetworkPage.tsx (full-page map)
 *  - ClientPortalPage.tsx (findNearestHub function)
 *  - api.ts (generates MOCK_HUBS and MOCK_AGENTS for when backend is offline)
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ═══════════════════════════════════════════════════════════════
   SIMULATED AGENT & HUB DATA FOR MAP
   20+ realistic Indian hub locations + delivery agents
   ═══════════════════════════════════════════════════════════════ */

export interface HubLocation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  zone: "North" | "South" | "East" | "West" | "Central" | "Northeast";
  status: "OPTIMIZED" | "WARNING";
  capacity: number;
  activeAgents: number;
  tier: 1 | 2 | 3;
}

export interface SimulatedAgent {
  id: string;
  name: string;
  hubCode: string;
  status: "ACTIVE" | "ON_ROUTE" | "OFFLINE";
  phone: string;
  currentLat: number;
  currentLng: number;
  destinationLat: number;
  destinationLng: number;
  pickupLat: number;
  pickupLng: number;
  route: [number, number][];
  routeProgress: number;
  speed: number;
  eta: number;
  currentTask: string;
  completedToday: number;
  totalTasks: number;
  vehicleType: "bike" | "van" | "truck";
}

export interface DeliveryPoint {
  lat: number;
  lng: number;
  label: string;
  type: "pickup" | "delivery" | "hub";
}

export interface HubConnection {
  from: string;
  to: string;
  type: "primary" | "secondary";
}

// ══════════════════════════════════════════════════════
//  20+ HUB LOCATIONS ACROSS INDIA
// ══════════════════════════════════════════════════════
export const HUB_LOCATIONS: HubLocation[] = [
  // ── NORTH ZONE ──
  { code: "DEL", name: "Delhi NCR Hub", lat: 28.6139, lng: 77.209, city: "Gurugram", state: "Haryana", zone: "North", status: "OPTIMIZED", capacity: 72, activeAgents: 45, tier: 1 },
  { code: "JAI", name: "Jaipur Hub", lat: 26.9124, lng: 75.7873, city: "Jaipur", state: "Rajasthan", zone: "North", status: "OPTIMIZED", capacity: 55, activeAgents: 22, tier: 2 },
  { code: "LKO", name: "Lucknow Hub", lat: 26.8467, lng: 80.9462, city: "Lucknow", state: "Uttar Pradesh", zone: "North", status: "OPTIMIZED", capacity: 48, activeAgents: 20, tier: 2 },
  { code: "CHD", name: "Chandigarh Hub", lat: 30.7333, lng: 76.7794, city: "Chandigarh", state: "Punjab", zone: "North", status: "OPTIMIZED", capacity: 42, activeAgents: 18, tier: 2 },
  { code: "DED", name: "Dehradun Hub", lat: 30.3165, lng: 78.0322, city: "Dehradun", state: "Uttarakhand", zone: "North", status: "OPTIMIZED", capacity: 32, activeAgents: 12, tier: 3 },
  { code: "VNS", name: "Varanasi Hub", lat: 25.3176, lng: 82.9739, city: "Varanasi", state: "Uttar Pradesh", zone: "North", status: "OPTIMIZED", capacity: 35, activeAgents: 14, tier: 3 },
  { code: "AGR", name: "Agra Hub", lat: 27.1767, lng: 78.0081, city: "Agra", state: "Uttar Pradesh", zone: "North", status: "OPTIMIZED", capacity: 30, activeAgents: 11, tier: 3 },
  { code: "ASR", name: "Amritsar Hub", lat: 31.6340, lng: 74.8723, city: "Amritsar", state: "Punjab", zone: "North", status: "OPTIMIZED", capacity: 28, activeAgents: 10, tier: 3 },
  { code: "SML", name: "Shimla Hub", lat: 31.1048, lng: 77.1734, city: "Shimla", state: "Himachal Pradesh", zone: "North", status: "OPTIMIZED", capacity: 22, activeAgents: 8, tier: 3 },
  { code: "JMU", name: "Jammu Hub", lat: 32.7266, lng: 74.8570, city: "Jammu", state: "Jammu & Kashmir", zone: "North", status: "OPTIMIZED", capacity: 24, activeAgents: 9, tier: 3 },

  // ── WEST ZONE ──
  { code: "BOM", name: "Mumbai Hub", lat: 19.076, lng: 72.8777, city: "Andheri East", state: "Maharashtra", zone: "West", status: "WARNING", capacity: 85, activeAgents: 52, tier: 1 },
  { code: "PNQ", name: "Pune Hub", lat: 18.5204, lng: 73.8567, city: "Hinjewadi", state: "Maharashtra", zone: "West", status: "WARNING", capacity: 78, activeAgents: 35, tier: 1 },
  { code: "AMD", name: "Ahmedabad Hub", lat: 23.0225, lng: 72.5714, city: "Sanand", state: "Gujarat", zone: "West", status: "OPTIMIZED", capacity: 52, activeAgents: 29, tier: 2 },
  { code: "STV", name: "Surat Hub", lat: 21.1702, lng: 72.8311, city: "Surat", state: "Gujarat", zone: "West", status: "OPTIMIZED", capacity: 45, activeAgents: 19, tier: 2 },
  { code: "IDR", name: "Indore Hub", lat: 22.7196, lng: 75.8577, city: "Indore", state: "Madhya Pradesh", zone: "West", status: "OPTIMIZED", capacity: 40, activeAgents: 16, tier: 2 },
  { code: "GOI", name: "Goa Hub", lat: 15.4909, lng: 73.8278, city: "Panaji", state: "Goa", zone: "West", status: "OPTIMIZED", capacity: 25, activeAgents: 9, tier: 3 },
  { code: "JDH", name: "Jodhpur Hub", lat: 26.2389, lng: 73.0243, city: "Jodhpur", state: "Rajasthan", zone: "West", status: "OPTIMIZED", capacity: 26, activeAgents: 10, tier: 3 },
  { code: "UDR", name: "Udaipur Hub", lat: 24.5854, lng: 73.7125, city: "Udaipur", state: "Rajasthan", zone: "West", status: "OPTIMIZED", capacity: 24, activeAgents: 9, tier: 3 },

  // ── SOUTH ZONE ──
  { code: "BLR", name: "Bangalore Hub", lat: 12.9716, lng: 77.5946, city: "Electronic City", state: "Karnataka", zone: "South", status: "OPTIMIZED", capacity: 61, activeAgents: 55, tier: 1 },
  { code: "MAA", name: "Chennai Hub", lat: 13.0827, lng: 80.2707, city: "Ambattur", state: "Tamil Nadu", zone: "South", status: "OPTIMIZED", capacity: 58, activeAgents: 32, tier: 1 },
  { code: "HYD", name: "Hyderabad Hub", lat: 17.385, lng: 78.4867, city: "Madhapur", state: "Telangana", zone: "South", status: "OPTIMIZED", capacity: 55, activeAgents: 42, tier: 1 },
  { code: "COK", name: "Kochi Hub", lat: 9.9312, lng: 76.2673, city: "Kochi", state: "Kerala", zone: "South", status: "OPTIMIZED", capacity: 38, activeAgents: 15, tier: 2 },
  { code: "CJB", name: "Coimbatore Hub", lat: 11.0168, lng: 76.9558, city: "Coimbatore", state: "Tamil Nadu", zone: "South", status: "OPTIMIZED", capacity: 35, activeAgents: 14, tier: 3 },
  { code: "VTZ", name: "Vizag Hub", lat: 17.6868, lng: 83.2185, city: "Visakhapatnam", state: "Andhra Pradesh", zone: "South", status: "OPTIMIZED", capacity: 33, activeAgents: 13, tier: 3 },
  { code: "TRV", name: "Trivandrum Hub", lat: 8.5241, lng: 76.9366, city: "Thiruvananthapuram", state: "Kerala", zone: "South", status: "OPTIMIZED", capacity: 28, activeAgents: 10, tier: 3 },
  { code: "MNG", name: "Mangalore Hub", lat: 12.9141, lng: 74.8560, city: "Mangalore", state: "Karnataka", zone: "South", status: "OPTIMIZED", capacity: 26, activeAgents: 10, tier: 3 },
  { code: "MYS", name: "Mysore Hub", lat: 12.2958, lng: 76.6394, city: "Mysore", state: "Karnataka", zone: "South", status: "OPTIMIZED", capacity: 24, activeAgents: 9, tier: 3 },

  // ── EAST ZONE ──
  { code: "CCU", name: "Kolkata Hub", lat: 22.5726, lng: 88.3639, city: "Salt Lake City", state: "West Bengal", zone: "East", status: "OPTIMIZED", capacity: 48, activeAgents: 28, tier: 1 },
  { code: "PAT", name: "Patna Hub", lat: 25.5941, lng: 85.1376, city: "Patna", state: "Bihar", zone: "East", status: "OPTIMIZED", capacity: 35, activeAgents: 14, tier: 2 },
  { code: "BBI", name: "Bhubaneswar Hub", lat: 20.2961, lng: 85.8245, city: "Bhubaneswar", state: "Odisha", zone: "East", status: "OPTIMIZED", capacity: 32, activeAgents: 12, tier: 2 },
  { code: "RCH", name: "Ranchi Hub", lat: 23.3441, lng: 85.3096, city: "Ranchi", state: "Jharkhand", zone: "East", status: "OPTIMIZED", capacity: 28, activeAgents: 10, tier: 3 },

  // ── CENTRAL ZONE ──
  { code: "NAG", name: "Nagpur Hub", lat: 21.1458, lng: 79.0882, city: "Nagpur", state: "Maharashtra", zone: "Central", status: "OPTIMIZED", capacity: 45, activeAgents: 20, tier: 2 },
  { code: "BPL", name: "Bhopal Hub", lat: 23.2599, lng: 77.4126, city: "Bhopal", state: "Madhya Pradesh", zone: "Central", status: "OPTIMIZED", capacity: 30, activeAgents: 11, tier: 3 },
  { code: "RPR", name: "Raipur Hub", lat: 21.2514, lng: 81.6296, city: "Raipur", state: "Chhattisgarh", zone: "Central", status: "OPTIMIZED", capacity: 26, activeAgents: 10, tier: 3 },
  { code: "GWL", name: "Gwalior Hub", lat: 26.2183, lng: 78.1828, city: "Gwalior", state: "Madhya Pradesh", zone: "Central", status: "OPTIMIZED", capacity: 22, activeAgents: 8, tier: 3 },

  // ── NORTHEAST ZONE ──
  { code: "GAU", name: "Guwahati Hub", lat: 26.1445, lng: 91.7362, city: "Guwahati", state: "Assam", zone: "Northeast", status: "OPTIMIZED", capacity: 30, activeAgents: 10, tier: 2 },
];

// ══════════════════════════════════════════════════════
//  HUB NETWORK CONNECTIONS (for map visualization)
// ══════════════════════════════════════════════════════
export const HUB_CONNECTIONS: HubConnection[] = [
  // Primary corridors (major freight routes)
  { from: "DEL", to: "BOM", type: "primary" },
  { from: "DEL", to: "CCU", type: "primary" },
  { from: "BOM", to: "BLR", type: "primary" },
  { from: "BLR", to: "MAA", type: "primary" },
  { from: "DEL", to: "HYD", type: "primary" },
  { from: "HYD", to: "BLR", type: "primary" },
  { from: "BOM", to: "HYD", type: "primary" },

  // Secondary connections (existing)
  { from: "DEL", to: "JAI", type: "secondary" },
  { from: "DEL", to: "LKO", type: "secondary" },
  { from: "DEL", to: "CHD", type: "secondary" },
  { from: "DEL", to: "DED", type: "secondary" },
  { from: "BOM", to: "PNQ", type: "secondary" },
  { from: "BOM", to: "AMD", type: "secondary" },
  { from: "BOM", to: "STV", type: "secondary" },
  { from: "BOM", to: "IDR", type: "secondary" },
  { from: "BLR", to: "COK", type: "secondary" },
  { from: "BLR", to: "CJB", type: "secondary" },
  { from: "MAA", to: "VTZ", type: "secondary" },
  { from: "CCU", to: "PAT", type: "secondary" },
  { from: "CCU", to: "BBI", type: "secondary" },
  { from: "CCU", to: "GAU", type: "secondary" },
  { from: "CCU", to: "RCH", type: "secondary" },
  { from: "HYD", to: "NAG", type: "secondary" },
  { from: "NAG", to: "BPL", type: "secondary" },
  { from: "IDR", to: "BPL", type: "secondary" },
  { from: "LKO", to: "PAT", type: "secondary" },
  { from: "AMD", to: "STV", type: "secondary" },

  // New hub connections
  { from: "LKO", to: "VNS", type: "secondary" },
  { from: "DEL", to: "AGR", type: "secondary" },
  { from: "AGR", to: "GWL", type: "secondary" },
  { from: "CHD", to: "ASR", type: "secondary" },
  { from: "CHD", to: "SML", type: "secondary" },
  { from: "ASR", to: "JMU", type: "secondary" },
  { from: "BOM", to: "GOI", type: "secondary" },
  { from: "JAI", to: "JDH", type: "secondary" },
  { from: "JAI", to: "UDR", type: "secondary" },
  { from: "COK", to: "TRV", type: "secondary" },
  { from: "BLR", to: "MNG", type: "secondary" },
  { from: "BLR", to: "MYS", type: "secondary" },
  { from: "NAG", to: "RPR", type: "secondary" },
  { from: "BPL", to: "GWL", type: "secondary" },
  { from: "VNS", to: "PAT", type: "secondary" },
  { from: "GOI", to: "MNG", type: "secondary" },
];

// ── Helper: Generate random point near a hub ──
function nearHub(hub: HubLocation, radius = 0.08): [number, number] {
  return [
    hub.lat + (Math.random() - 0.5) * radius * 2,
    hub.lng + (Math.random() - 0.5) * radius * 2,
  ];
}

// ── Helper: Generate route waypoints ──
function generateRoute(start: [number, number], end: [number, number], waypoints = 8): [number, number][] {
  const route: [number, number][] = [start];
  for (let i = 1; i < waypoints; i++) {
    const t = i / waypoints;
    const jitter = 0.003;
    route.push([
      start[0] + (end[0] - start[0]) * t + (Math.random() - 0.5) * jitter,
      start[1] + (end[1] - start[1]) * t + (Math.random() - 0.5) * jitter,
    ]);
  }
  route.push(end);
  return route;
}

// ── Generate simulated agents (3 per Tier-1 hub, 2 per Tier-2, 1 per Tier-3) ──
function createSimulatedAgents(): SimulatedAgent[] {
  const agents: SimulatedAgent[] = [];
  const NAMES = [
    "Amit Patel", "Ananya Reddy", "Bhavesh Shah", "Divya Nair",
    "Farhan Khan", "Geeta Sharma", "Harsh Vardhan", "Isha Gupta",
    "Jai Mehta", "Kavita Rao", "Lakshmi Iyer", "Manish Tiwari",
    "Neha Desai", "Om Prakash", "Priya Singh", "Rahul Verma",
    "Sneha Patil", "Tarun Joshi", "Uma Devi", "Vikram Rathod",
    "Wasim Ahmed", "Yamini Pillai", "Zara Begum", "Arjun Kapoor",
    "Deepak Chauhan", "Ritu Mishra", "Suresh Yadav", "Pooja Bansal",
    "Karan Malhotra", "Meera Krishnan", "Nikhil Pandey", "Swati Garg",
  ];
  const TASKS = [
    "Delivering parcel to sector 21", "Pickup from hub warehouse",
    "Last-mile delivery - 3 packages", "Express delivery - priority",
    "Bulk shipment transfer", "COD collection pending",
    "Returning to hub", "At delivery point",
  ];
  const VEHICLES: ("bike" | "van" | "truck")[] = ["bike", "bike", "bike", "van", "van", "truck"];

  let nameIdx = 0;
  HUB_LOCATIONS.forEach((hub) => {
    const agentCount = hub.tier === 1 ? 3 : hub.tier === 2 ? 2 : 1;
    for (let i = 0; i < agentCount; i++) {
      const status: SimulatedAgent["status"] = i === 0 ? "ON_ROUTE" : i === 1 ? "ACTIVE" : (Math.random() > 0.5 ? "ACTIVE" : "ON_ROUTE");
      const pickup = nearHub(hub, 0.04);
      const destination = nearHub(hub, 0.1);
      const currentPos = nearHub(hub, 0.06);
      const route = generateRoute(pickup, destination);

      agents.push({
        id: `agent-${hub.code}-${i}`,
        name: NAMES[nameIdx % NAMES.length],
        hubCode: hub.code,
        status,
        phone: `+91 ${90000 + Math.floor(Math.random() * 9999)} ${10000 + Math.floor(Math.random() * 89999)}`,
        currentLat: currentPos[0],
        currentLng: currentPos[1],
        destinationLat: destination[0],
        destinationLng: destination[1],
        pickupLat: pickup[0],
        pickupLng: pickup[1],
        route,
        routeProgress: Math.random() * 0.7,
        speed: 0.0003 + Math.random() * 0.0005,
        eta: Math.floor(5 + Math.random() * 40),
        currentTask: TASKS[Math.floor(Math.random() * TASKS.length)],
        completedToday: Math.floor(Math.random() * 12),
        totalTasks: Math.floor(8 + Math.random() * 8),
        vehicleType: VEHICLES[Math.floor(Math.random() * VEHICLES.length)],
      });
      nameIdx++;
    }
  });

  return agents;
}

export const SIMULATED_AGENTS = createSimulatedAgents();

// ── Get hub by code ──
export function getHubByCode(code: string): HubLocation | undefined {
  return HUB_LOCATIONS.find((h) => h.code === code);
}

// ── Get nearest hub by city/address string ──
export function getHubByCity(cityOrAddress: string): HubLocation | undefined {
  if (!cityOrAddress) return undefined;
  const lower = cityOrAddress.toLowerCase();
  
  // Direct city match first
  const cityMap: Record<string, string> = {
    delhi: "DEL", "new delhi": "DEL", gurugram: "DEL", gurgaon: "DEL", noida: "DEL", ghaziabad: "DEL", faridabad: "DEL",
    mumbai: "BOM", "navi mumbai": "BOM", thane: "BOM",
    bangalore: "BLR", bengaluru: "BLR",
    chennai: "MAA",
    hyderabad: "HYD",
    kolkata: "CCU",
    pune: "PNQ",
    ahmedabad: "AMD",
    jaipur: "JAI",
    lucknow: "LKO",
    chandigarh: "CHD",
    dehradun: "DED",
    varanasi: "VNS", banaras: "VNS",
    agra: "AGR",
    amritsar: "ASR",
    shimla: "SML",
    jammu: "JMU",
    surat: "STV",
    indore: "IDR",
    goa: "GOI", panaji: "GOI",
    jodhpur: "JDH",
    udaipur: "UDR",
    kochi: "COK", cochin: "COK",
    coimbatore: "CJB",
    vizag: "VTZ", visakhapatnam: "VTZ",
    trivandrum: "TRV", thiruvananthapuram: "TRV",
    mangalore: "MNG", mangaluru: "MNG",
    mysore: "MYS", mysuru: "MYS",
    nagpur: "NAG",
    bhopal: "BPL",
    raipur: "RPR",
    gwalior: "GWL",
    patna: "PAT",
    bhubaneswar: "BBI",
    ranchi: "RCH",
    guwahati: "GAU",
  };
  
  for (const [city, code] of Object.entries(cityMap)) {
    if (lower.includes(city)) {
      return getHubByCode(code);
    }
  }
  return undefined;
}

// ── Get connection route points ──
export function getConnectionPoints(conn: HubConnection): [number, number][] {
  const from = getHubByCode(conn.from);
  const to = getHubByCode(conn.to);
  if (!from || !to) return [];
  return [[from.lat, from.lng], [to.lat, to.lng]];
}

// ── India bounds (re-exported for backward compat) ──
export const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0],
  [35.5, 97.5],
];

export const INDIA_CENTER: [number, number] = [22.0, 79.0];

// ── Statistics ──
export function getHubStats() {
  const total = HUB_LOCATIONS.length;
  const tier1 = HUB_LOCATIONS.filter(h => h.tier === 1).length;
  const tier2 = HUB_LOCATIONS.filter(h => h.tier === 2).length;
  const tier3 = HUB_LOCATIONS.filter(h => h.tier === 3).length;
  const totalAgents = HUB_LOCATIONS.reduce((sum, h) => sum + h.activeAgents, 0);
  const zones = [...new Set(HUB_LOCATIONS.map(h => h.zone))].length;
  const states = [...new Set(HUB_LOCATIONS.map(h => h.state))].length;
  return { total, tier1, tier2, tier3, totalAgents, zones, states };
}
