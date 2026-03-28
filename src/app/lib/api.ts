/**
 * api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized API client — ALL frontend API calls go through this file.
 *
 * IMPORTANT DESIGN PATTERN: "API-first with Mock Fallback"
 *  Every function in this file tries to call the real backend first.
 *  If the backend is offline (e.g. during development), it falls back to
 *  hardcoded MOCK data so the UI still works and looks real.
 *
 * EXPORTS (functions you can call from anywhere in the frontend):
 *
 * │ SHIPMENTS
 * ├─ getShipments(params?)     ─ Get a list of shipments (searchable, filterable)
 * ├─ getShipment(awb)          ─ Get one shipment by AWB number
 * ├─ createShipment(data)      ─ Book/create a new shipment
 * └─ updateShipment(awb, data) ─ Update shipment status or location
 *
 * │ HUBS
 * ├─ getHubs()                 ─ Get all logistics hubs
 * ├─ getHub(code)              ─ Get a single hub with its agents
 * └─ updateHub(code, data)     ─ Update hub capacity / status
 *
 * │ AGENTS
 * ├─ getAgents(params?)        ─ Get agents (filterable by hub, status)
 * ├─ getAgent(id)              ─ Get a single agent
 * └─ updateAgent(id, data)     ─ Update agent status/task counts
 *
 * │ DASHBOARD
 * ├─ getDashboardStats()       ─ KPI cards data
 * ├─ getDashboardVolume()      ─ Last 7 days shipping bar chart data
 * └─ getDashboardSummary()     ─ Status breakdown counts
 *
 * │ OTHER
 * ├─ lookupPincode(pin)        ─ Get city/state from a 6-digit PIN code
 * ├─ submitCallback(data)      ─ Submit a callback request from the homepage form
 * └─ getCallbacks()            ─ Get all callback requests (admin only)
 * ─────────────────────────────────────────────────────────────────────────────
 */
// EagleEye API Client
// Centralized API service with inline fallback mock data
// Mock data is auto-generated from mapData for consistency

import { HUB_LOCATIONS, SIMULATED_AGENTS, getHubStats } from "./mapData";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const BASE_URL = API_BASE;

// ─── Types ───────────────────────────────────────────────

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  location: string;
  locationCode: string;
  status: string;
  description: string;
  timestamp: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  awbNumber: string;
  status: string;
  origin: string;
  destination: string;
  currentLocation: string;
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  weight: number;
  dimensions: string;
  declaredValue: number;
  currency: string;
  expectedDelivery: string;
  shipmentType: string;
  createdAt: string;
  updatedAt: string;
  events: TrackingEvent[];
}

export interface ShipmentListResponse {
  shipments: Shipment[];
  total: number;
  limit: number;
  offset: number;
}

export interface Hub {
  id: string;
  name: string;
  code: string;
  city: string;
  region: string;
  regionTag: string;
  address: string;
  capacity: number;
  activeAgents: number;
  totalPersonnel: number;
  status: string;
  statusNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface HubDetail extends Hub {
  agents: Agent[];
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  hubCode: string;
  assignedTasks: number;
  completedToday: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  activeShipments: number;
  totalHubs: number;
  registeredAgents: number;
  hubUtilization: number;
  onlinePercent: string;
  growthPercent: string;
  globalReach: string;
  loadStatus: string;
}

export interface ShippingVolume {
  id: string;
  day: string;
  date: string;
  units: number;
  trend: string;
}

export interface DashboardSummary {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  pending: number;
  totalHubs: number;
  totalAgents: number;
  activeAgents: number;
}

// ─── Fetch Wrapper ───────────────────────────────────────
// apiFetch: A generic helper that makes HTTP requests to the backend.
// It automatically adds the Content-Type header and throws an error if the response is not OK.
// All API functions below call this internally.
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      (errorBody as any).error || `API Error: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

// ═══════════════════════════════════════════════════════════
//  MOCK / FALLBACK DATA
//  These are used when the real backend server is not running.
//  MOCK_SHIPMENTS = 3 example shipments (can be searched by AWB number)
//  MOCK_HUBS      = auto-generated from mapData.ts HUB_LOCATIONS list
//  MOCK_AGENTS    = auto-generated from SIMULATED_AGENTS in mapData.ts
// ═══════════════════════════════════════════════════════════

const NOW = new Date().toISOString();
const DAY_AGO = new Date(Date.now() - 86400000).toISOString();
const TWO_DAYS = new Date(Date.now() + 172800000).toISOString();
const THREE_DAYS = new Date(Date.now() + 259200000).toISOString();

const MOCK_SHIPMENTS: Record<string, Shipment> = {
  "EE-742-9910": {
    id: "s1", awbNumber: "EE-742-9910", status: "IN_TRANSIT",
    origin: "Mumbai, Maharashtra", destination: "Delhi, NCR",
    currentLocation: "Nagpur Hub", senderName: "Rajesh Kumar", senderAddress: "Andheri East, Mumbai 400069",
    receiverName: "Priya Sharma", receiverAddress: "Connaught Place, Delhi 110001",
    weight: 2.5, dimensions: "30x20x15 cm", declaredValue: 5000, currency: "INR",
    expectedDelivery: TWO_DAYS, shipmentType: "EXPRESS_PARCEL",
    createdAt: DAY_AGO, updatedAt: NOW,
    events: [
      { id: "e1", shipmentId: "s1", location: "Mumbai Hub", locationCode: "BOM", status: "PICKED_UP", description: "Package picked up from sender", timestamp: DAY_AGO, createdAt: DAY_AGO },
      { id: "e2", shipmentId: "s1", location: "Mumbai Hub", locationCode: "BOM", status: "DEPARTED", description: "Departed Mumbai Hub → Nagpur", timestamp: new Date(Date.now() - 72000000).toISOString(), createdAt: DAY_AGO },
      { id: "e3", shipmentId: "s1", location: "Nagpur Hub", locationCode: "NAG", status: "ARRIVED", description: "Arrived at Nagpur transit hub", timestamp: new Date(Date.now() - 36000000).toISOString(), createdAt: NOW },
      { id: "e4", shipmentId: "s1", location: "Nagpur Hub", locationCode: "NAG", status: "IN_TRANSIT", description: "Processing at hub, next stop Delhi", timestamp: NOW, createdAt: NOW },
    ],
  },
  "EE-8829-0012": {
    id: "s2", awbNumber: "EE-8829-0012", status: "OUT_FOR_DELIVERY",
    origin: "Chennai, Tamil Nadu", destination: "Bangalore, Karnataka",
    currentLocation: "Electronic City, Bangalore", senderName: "Vikram Patel", senderAddress: "T. Nagar, Chennai 600017",
    receiverName: "Ananya Reddy", receiverAddress: "Koramangala, Bangalore 560034",
    weight: 1.2, dimensions: "25x15x10 cm", declaredValue: 3500, currency: "INR",
    expectedDelivery: NOW, shipmentType: "EXPRESS_PREMIUM",
    createdAt: DAY_AGO, updatedAt: NOW,
    events: [
      { id: "e5", shipmentId: "s2", location: "Chennai Hub", locationCode: "MAA", status: "PICKED_UP", description: "Package collected from sender", timestamp: DAY_AGO, createdAt: DAY_AGO },
      { id: "e6", shipmentId: "s2", location: "Chennai Hub", locationCode: "MAA", status: "DEPARTED", description: "Departed Chennai → Bangalore", timestamp: new Date(Date.now() - 54000000).toISOString(), createdAt: DAY_AGO },
      { id: "e7", shipmentId: "s2", location: "Bangalore Hub", locationCode: "BLR", status: "ARRIVED", description: "Arrived at Bangalore Hub", timestamp: new Date(Date.now() - 18000000).toISOString(), createdAt: NOW },
      { id: "e8", shipmentId: "s2", location: "Electronic City", locationCode: "BLR", status: "OUT_FOR_DELIVERY", description: "Out for delivery — Agent Ananya on the way", timestamp: NOW, createdAt: NOW },
    ],
  },
  "EE-1055-3347": {
    id: "s3", awbNumber: "EE-1055-3347", status: "DELIVERED",
    origin: "Delhi, NCR", destination: "Chennai, Tamil Nadu",
    currentLocation: "Delivered", senderName: "Amit Singh", senderAddress: "Sector 18, Noida 201301",
    receiverName: "Priya Sundaram", receiverAddress: "Adyar, Chennai 600020",
    weight: 4.0, dimensions: "40x30x20 cm", declaredValue: 12000, currency: "INR",
    expectedDelivery: DAY_AGO, shipmentType: "ECOMMERCE",
    createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: DAY_AGO,
    events: [
      { id: "e9", shipmentId: "s3", location: "Delhi Hub", locationCode: "DEL", status: "PICKED_UP", description: "Picked up from warehouse", timestamp: new Date(Date.now() - 259200000).toISOString(), createdAt: new Date(Date.now() - 259200000).toISOString() },
      { id: "e10", shipmentId: "s3", location: "Delhi Hub", locationCode: "DEL", status: "DEPARTED", description: "Departed Delhi → Hyderabad", timestamp: new Date(Date.now() - 216000000).toISOString(), createdAt: new Date(Date.now() - 216000000).toISOString() },
      { id: "e11", shipmentId: "s3", location: "Hyderabad Hub", locationCode: "HYD", status: "ARRIVED", description: "Transit stop at Hyderabad", timestamp: new Date(Date.now() - 172800000).toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString() },
      { id: "e12", shipmentId: "s3", location: "Chennai Hub", locationCode: "MAA", status: "ARRIVED", description: "Arrived at destination hub", timestamp: new Date(Date.now() - 108000000).toISOString(), createdAt: new Date(Date.now() - 108000000).toISOString() },
      { id: "e13", shipmentId: "s3", location: "Adyar, Chennai", locationCode: "MAA", status: "DELIVERED", description: "Delivered — signed by Priya S.", timestamp: DAY_AGO, createdAt: DAY_AGO },
    ],
  },
};

const ALL_MOCK_SHIPMENTS = Object.values(MOCK_SHIPMENTS);

// ── Auto-generate mock data from mapData (single source of truth) ──

const _hubStats = getHubStats();

const STATUS_NOTES: Record<string, string> = {
  BOM: "High demand period", DEL: "Operating normally", BLR: "Expansion underway",
  PNQ: "Near capacity", HYD: "Tech corridor hub", MAA: "Operating normally",
  CCU: "Eastern gateway", AMD: "Gujarat operations", NAG: "Central transit point",
  JAI: "Rajasthan hub", LKO: "UP operations", CHD: "North command",
};

const MOCK_HUBS: Hub[] = HUB_LOCATIONS.map((hub, i) => ({
  id: `h${i + 1}`,
  name: `${hub.name}`,
  code: hub.code,
  city: hub.city,
  region: hub.zone.replace(" Zone", ""),
  regionTag: hub.zone.replace(" Zone", "").toLowerCase(),
  address: `${hub.city}, ${hub.state}`,
  capacity: hub.tier === 1 ? 65 + Math.floor(Math.random() * 25) : hub.tier === 2 ? 45 + Math.floor(Math.random() * 25) : 30 + Math.floor(Math.random() * 30),
  activeAgents: hub.activeAgents,
  totalPersonnel: Math.floor(hub.activeAgents * 1.3),
  status: hub.capacity > 80 ? "WARNING" : "OPTIMIZED",
  statusNote: STATUS_NOTES[hub.code] || "",
  createdAt: NOW,
  updatedAt: NOW,
}));

const MOCK_AGENTS: Agent[] = SIMULATED_AGENTS.map((sa, i) => ({
  id: `a${i + 1}`,
  name: sa.name,
  email: `${sa.name.split(" ")[0].toLowerCase()}.${sa.name.split(" ")[1]?.[0]?.toLowerCase() || "x"}@eagleeye.in`,
  phone: sa.phone,
  hubCode: sa.hubCode,
  assignedTasks: sa.totalTasks,
  completedToday: sa.completedToday,
  status: sa.status,
  createdAt: NOW,
  updatedAt: NOW,
}));

const MOCK_DASHBOARD_STATS: DashboardStats = {
  activeShipments: 1247, totalHubs: _hubStats.total, registeredAgents: _hubStats.totalAgents,
  hubUtilization: 78, onlinePercent: "84% online", growthPercent: "+12.5% this month",
  globalReach: "Pan-India", loadStatus: "Optimal",
};

const MOCK_VOLUME: ShippingVolume[] = [
  { id: "v1", day: "Mon", date: "2026-03-24", units: 342, trend: "up" },
  { id: "v2", day: "Tue", date: "2026-03-25", units: 389, trend: "up" },
  { id: "v3", day: "Wed", date: "2026-03-26", units: 415, trend: "up" },
  { id: "v4", day: "Thu", date: "2026-03-27", units: 378, trend: "down" },
  { id: "v5", day: "Fri", date: "2026-03-28", units: 456, trend: "up" },
  { id: "v6", day: "Sat", date: "2026-03-29", units: 298, trend: "down" },
  { id: "v7", day: "Sun", date: "2026-03-30", units: 185, trend: "down" },
];

const MOCK_SUMMARY: DashboardSummary = {
  totalShipments: 4832, inTransit: 1247, delivered: 2890,
  delayed: 156, pending: 539, totalHubs: _hubStats.total,
  totalAgents: _hubStats.totalAgents, activeAgents: Math.floor(_hubStats.totalAgents * 0.84),
};

// ─── Shipments ───────────────────────────────────────────
// getShipments: Fetches a paginated list of shipments.
// Supports filtering by search term (AWB / name), status, and pagination.
export async function getShipments(params?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ShipmentListResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return await apiFetch(`/shipments${qs ? `?${qs}` : ""}`);
  } catch {
    // Fallback to mock data
    return { shipments: ALL_MOCK_SHIPMENTS, total: ALL_MOCK_SHIPMENTS.length, limit: 50, offset: 0 };
  }
}

// getShipment: Fetches a single shipment by its AWB number.
// Falls back to MOCK_SHIPMENTS if the server is offline.
export async function getShipment(awb: string): Promise<Shipment> {
  try {
    return await apiFetch(`/shipments/${encodeURIComponent(awb)}`);
  } catch {
    // Fallback to mock data only if API fails
    const mockShipment = MOCK_SHIPMENTS[awb.toUpperCase()];
    if (mockShipment) return mockShipment;
    throw new Error("Shipment not found");
  }
}

// createShipment: Creates a new shipment in the database.
// Called from ClientPortalPage after the customer completes the booking wizard.
// Falls back to returning a mock shipment object if the server is offline.
export async function createShipment(data: Partial<Shipment>): Promise<Shipment> {
  try {
    return await apiFetch("/shipments", { method: "POST", body: JSON.stringify(data) });
  } catch {
    // Return a mock created shipment
    return {
      id: crypto.randomUUID(),
      awbNumber: data.awbNumber || `EE-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "PENDING",
      origin: data.origin || "",
      destination: data.destination || "",
      currentLocation: data.origin || "",
      senderName: data.senderName || "",
      senderAddress: data.senderAddress || "",
      receiverName: data.receiverName || "",
      receiverAddress: data.receiverAddress || "",
      weight: data.weight || 1,
      dimensions: data.dimensions || "20x15x10 cm",
      declaredValue: data.declaredValue || 0,
      currency: "INR",
      expectedDelivery: TWO_DAYS,
      shipmentType: data.shipmentType || "EXPRESS_PARCEL",
      createdAt: NOW,
      updatedAt: NOW,
      events: [],
    };
  }
}

// updateShipment: Partially updates a shipment's status, location, or tracking events.
// Called by agents when they scan / deliver a package.
export async function updateShipment(
  awb: string,
  data: { status?: string; currentLocation?: string; eventDescription?: string }
): Promise<Shipment> {
  return apiFetch(`/shipments/${encodeURIComponent(awb)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Hubs ────────────────────────────────────────────────
// getHubs: Fetches all EagleEye logistics hubs from the database.
export async function getHubs(): Promise<Hub[]> {
  try {
    return await apiFetch("/hubs");
  } catch {
    return MOCK_HUBS;
  }
}

// getHub: Fetches a single hub by its hub code, including its list of agents.
export async function getHub(code: string): Promise<HubDetail> {
  try {
    return await apiFetch(`/hubs/${encodeURIComponent(code)}`);
  } catch {
    const hub = MOCK_HUBS.find(h => h.code === code) || MOCK_HUBS[0];
    const agents = MOCK_AGENTS.filter(a => a.hubCode === code);
    return { ...hub, agents };
  }
}

export async function updateHub(
  code: string,
  data: { capacity?: number; status?: string; statusNote?: string; activeAgents?: number }
): Promise<Hub> {
  return apiFetch(`/hubs/${encodeURIComponent(code)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Agents ──────────────────────────────────────────────
// getAgents: Fetches all delivery agents. Optionally filter by hub code or status.
export async function getAgents(params?: {
  hub?: string;
  status?: string;
}): Promise<Agent[]> {
  try {
    const query = new URLSearchParams();
    if (params?.hub) query.set("hub", params.hub);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return await apiFetch(`/agents${qs ? `?${qs}` : ""}`);
  } catch {
    let agents = MOCK_AGENTS;
    if (params?.hub) agents = agents.filter(a => a.hubCode === params.hub);
    if (params?.status) agents = agents.filter(a => a.status === params.status);
    return agents;
  }
}

// getAgent: Fetches a single agent by their database ID.
export async function getAgent(id: string): Promise<Agent> {
  try {
    return await apiFetch(`/agents/${encodeURIComponent(id)}`);
  } catch {
    return MOCK_AGENTS.find(a => a.id === id) || MOCK_AGENTS[0];
  }
}

export async function updateAgent(
  id: string,
  data: { status?: string; assignedTasks?: number; completedToday?: number }
): Promise<Agent> {
  return apiFetch(`/agents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Dashboard ───────────────────────────────────────────
// getDashboardStats: Fetches the 4 KPI metrics for the admin dashboard top cards.
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    return await apiFetch("/dashboard/stats");
  } catch {
    return MOCK_DASHBOARD_STATS;
  }
}

// getDashboardVolume: Fetches last 7 days shipment volume data for the bar chart.
export async function getDashboardVolume(): Promise<ShippingVolume[]> {
  try {
    return await apiFetch("/dashboard/volume");
  } catch {
    return MOCK_VOLUME;
  }
}

// getDashboardSummary: Fetches shipment status breakdown counts (in-transit, delivered, etc.)
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    return await apiFetch("/dashboard/summary");
  } catch {
    return MOCK_SUMMARY;
  }
}

// ─── Health ──────────────────────────────────────────────
// checkHealth: Pings the backend to see if it is online.
// Returns "offline (mock mode)" if the server is unreachable.
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  try {
    return await apiFetch("/health");
  } catch {
    return { status: "offline (mock mode)", timestamp: NOW };
  }
}

// ─── Registered Agents (real users with role=agent) ──────

export interface RegisteredAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  pincode: string;
  avatar: string;
  hubCode: string;
  vehicleType: string;
  agentId: string;
  creditPoints: number;
  createdAt: string;
}

export async function getRegisteredAgents(): Promise<RegisteredAgent[]> {
  try {
    return await apiFetch("/agents/registered");
  } catch {
    return [];
  }
}

// ─── Pincode Lookup ──────────────────────────────────────
// lookupPincode: Converts a 6-digit Indian PIN code into city/state information.
// First tries our backend, then falls back to the India Post public API.

export interface PincodeLookup {
  found: boolean;
  pin: string;
  city?: string;
  state?: string;
  district?: string;
  division?: string;
  region?: string;
  areas?: { name: string; branchType: string; deliveryStatus: string }[];
}

export async function lookupPincode(pin: string): Promise<PincodeLookup> {
  try {
    return await apiFetch(`/pincode/${pin}`);
  } catch {
    // Fallback: try calling India Post API directly (may fail due to CORS)
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length) {
        const first = data[0].PostOffice[0];
        return {
          found: true,
          pin,
          city: first.District || first.Division || "",
          state: first.State || "",
          district: first.District || "",
        };
      }
    } catch {}
    return { found: false, pin };
  }
}

// ─── Callback Requests ───────────────────────────────────

export interface CallbackRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
}

// ─── Callback Requests ───────────────────────────────────
// submitCallback: Saves a customer's callback request (from the homepage contact form)
export async function submitCallback(data: {
  name: string;
  phone: string;
  email?: string;
  message?: string;
}): Promise<CallbackRequest> {
  return apiFetch("/callbacks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// getCallbacks: Gets all pending callback requests (for the admin dashboard)
export async function getCallbacks(): Promise<CallbackRequest[]> {
  try {
    return await apiFetch("/callbacks");
  } catch {
    return [];
  }
}

