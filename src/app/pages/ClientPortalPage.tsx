/**
 * ClientPortalPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The "Book a Shipment" page for clients (customers) of EagleEye.
 *
 * HOW IT WORKS — 5-step wizard:
 *  Step 1: Addresses  — Enter sender and receiver name, phone, PIN code, address
 *  Step 2: Package    — Enter weight (kg), dimensions (L x W x H cm), contents
 *  Step 3: Service    — Choose a delivery type (Express Parcel / Premium / E-Commerce / LTL)
 *  Step 4: Payment    — Select payment mode (Prepaid/COD), apply promo codes
 *  Step 5: Confirm    — Review all details and click "Book Shipment"
 *
 * After booking:
 *  - An AWB (Air Waybill) tracking number is generated
 *  - The shipment is saved to the database via the backend API
 *  - An agent and hub are automatically assigned
 *  - Notifications are added to the notification system
 *  - A booking confirmation screen is shown with the tracking number
 *
 * KEY CALCULATIONS:
 *  - distanceKm(): Haversine formula to calculate real-world distance in km
 *  - calcRate()  : Calculates shipping price based on weight, distance, and service type
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import {
  Package,
  MapPin,
  Calculator,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Truck,
  ChevronRight,
  Loader2,
  Search,
  Zap,
  ShoppingCart,
  Building2,
  User,
  Phone,
  Clock,
  Navigation,
  Tag,
  Percent,
  Gift,
  X,
} from "lucide-react";
import { guessCoords } from "../lib/coordinates";
import { HUB_LOCATIONS, SIMULATED_AGENTS, type SimulatedAgent, type HubLocation } from "../lib/mapData";
import { addNotification } from "../lib/notifications";
import { createShipment, lookupPincode } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

// ─── Promotions (shared with Admin) ─────────────────────
interface Promotion {
  code: string; title: string; description: string;
  discount: number; type: "percentage" | "flat";
  validTill: string; active: boolean; category: string;
  minOrder?: number;
}

// ACTIVE_PROMOTIONS: Default promo codes — will be merged with any admin-created promos from API.
// Each has a discount type (percentage or flat ₹ amount), an expiry date, and
// an optional minimum order value and service category restriction.
const DEFAULT_PROMOTIONS: Promotion[] = [
  { code: "EAGLE20", title: "EagleEye Launch Offer", description: "20% off on all Express Parcel shipments", discount: 20, type: "percentage", validTill: "2026-04-30", active: true, category: "Express Parcel" },
  { code: "FAST50", title: "Premium Rush", description: "Flat ₹50 off on Express Premium", discount: 50, type: "flat", validTill: "2026-12-31", active: true, category: "Express Premium" },
  { code: "BULK15", title: "Bulk Discount", description: "15% off on Bulk Shipping above ₹5000", discount: 15, type: "percentage", validTill: "2026-05-31", active: true, category: "Bulk Shipping", minOrder: 5000 },
  { code: "NEW100", title: "New Customer Bonus", description: "Flat ₹100 off on first shipment", discount: 100, type: "flat", validTill: "2026-12-31", active: true, category: "All Services" },
];

const API_PROMO_URL = "http://localhost:3001/api/promotions/active";

// ─── Helpers ────────────────────────────────────────────

function distanceKm(city1: string, city2: string): number {
  const c1 = guessCoords(city1);
  const c2 = guessCoords(city2);

  // If both cities are unknown but different text, estimate a minimum distance
  if (!c1 && !c2) {
    // Both unknown — if same city text, distance = 0; else estimate ~500km
    if (city1.toLowerCase().trim() === city2.toLowerCase().trim()) return 0;
    return 500; // reasonable estimate for unknown Indian cities
  }

  // Use center of India as fallback for single unknown city
  const p1 = c1 ?? [22.5, 78.5]; // center of India
  const p2 = c2 ?? [22.5, 78.5];

  // If after resolution both points are the same but input cities differ, estimate
  if (p1[0] === p2[0] && p1[1] === p2[1] && city1.toLowerCase().trim() !== city2.toLowerCase().trim()) {
    return 500;
  }

  const R = 6371;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

  // If computed distance is suspiciously 0 for different city names, return minimum
  if (km === 0 && city1.toLowerCase().trim() !== city2.toLowerCase().trim()) {
    return 100;
  }

  return km;
}

// calcRate: Calculates the shipping cost (₹) based on:
//  - weight (in kg)
//  - km (distance between cities)
//  - type (service type like EXPRESS_PREMIUM, ECOMMERCE etc.)
// Formula: Base price + (weight × per-kg rate) + (distance × 0.6 per km)
function calcRate(weight: number, km: number, type: string): number {
  const base = type === "EXPRESS_PREMIUM" ? 150 : type === "EXPRESS_PARCEL" ? 80 : type === "ECOMMERCE" ? 60 : 50;
  const perKg = type === "EXPRESS_PREMIUM" ? 20 : type === "EXPRESS_PARCEL" ? 12 : type === "ECOMMERCE" ? 10 : 8;
  const perKm = 0.6;
  return Math.round(base + weight * perKg + km * perKm);
}

// ─── Service Options ────────────────────────────────────
const SERVICE_OPTIONS = [
  { value: "EXPRESS_PARCEL", label: "Express Parcel", desc: "1–2 days delivery", icon: Package, color: "blue" },
  { value: "EXPRESS_PREMIUM", label: "Express Premium", desc: "Same/Next day", icon: Zap, color: "amber" },
  { value: "ECOMMERCE", label: "E-Commerce", desc: "2–3 days, COD available", icon: ShoppingCart, color: "emerald" },
  { value: "LTL", label: "LTL Freight", desc: "3–5 days, 30kg+", icon: Truck, color: "purple" },
];

const COLOR_MAP: Record<string, { active: string; inactive: string }> = {
  blue: { active: "bg-blue-500/20 border-blue-500/40 text-blue-400", inactive: "bg-slate-700/30 border-slate-600/30 text-slate-400" },
  amber: { active: "bg-amber-500/20 border-amber-500/40 text-amber-400", inactive: "bg-slate-700/30 border-slate-600/30 text-slate-400" },
  emerald: { active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", inactive: "bg-slate-700/30 border-slate-600/30 text-slate-400" },
  purple: { active: "bg-purple-500/20 border-purple-500/40 text-purple-400", inactive: "bg-slate-700/30 border-slate-600/30 text-slate-400" },
};

// ─── Steps ──────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { num: 1, label: "Addresses", icon: MapPin },
  { num: 2, label: "Package", icon: Package },
  { num: 3, label: "Service", icon: Truck },
  { num: 4, label: "Payment", icon: CreditCard },
  { num: 5, label: "Confirm", icon: CheckCircle2 },
];

// ─── Main Component ─────────────────────────────────────

// ── Helper: find nearest hub to a city ──
function findNearestHub(city: string): HubLocation {
  const coords = guessCoords(city);
  if (!coords) return HUB_LOCATIONS[0];
  let nearest = HUB_LOCATIONS[0];
  let minDist = Infinity;
  for (const hub of HUB_LOCATIONS) {
    const d = Math.sqrt((hub.lat - coords[0]) ** 2 + (hub.lng - coords[1]) ** 2);
    if (d < minDist) { minDist = d; nearest = hub; }
  }
  return nearest;
}

// findAgentForHub: Picks the first available (non-OFFLINE) agent assigned to a hub.
// Used to automatically assign a delivery agent after booking.
function findAgentForHub(hubCode: string): SimulatedAgent {
  const hubAgents = SIMULATED_AGENTS.filter(a => a.hubCode === hubCode && a.status !== "OFFLINE");
  return hubAgents.length > 0 ? hubAgents[0] : SIMULATED_AGENTS[0];
}

// ClientPortalPage: The main 5-step shipment booking wizard for customers.
export default function ClientPortalPage() {
  const { user } = useAuth(); // get logged-in user's info (phone, name)
  const [step, setStep] = useState<Step>(1); // which step of the wizard is active
  const [isBooking, setIsBooking] = useState(false);  // true while booking is in progress
  const [booked, setBooked] = useState(false);        // true after successful booking
  const [awbNumber, setAwbNumber] = useState("");      // generated tracking number
  const [assignedAgent, setAssignedAgent] = useState<SimulatedAgent | null>(null); // agent assigned to pickup
  const [assignedHub, setAssignedHub] = useState<HubLocation | null>(null);        // hub hub assigned

  // Step 1 — Addresses: All the sender and receiver details
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderCity, setSenderCity] = useState("");
  const [senderState, setSenderState] = useState("");
  const [senderPincode, setSenderPincode] = useState("");
  const [senderPinLooking, setSenderPinLooking] = useState(false);
  const [senderPinError, setSenderPinError] = useState("");
  const [senderAddress, setSenderAddress] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverCity, setReceiverCity] = useState("");
  const [receiverState, setReceiverState] = useState("");
  const [receiverPincode, setReceiverPincode] = useState("");
  const [receiverPinLooking, setReceiverPinLooking] = useState(false);
  const [receiverPinError, setReceiverPinError] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");

  // Debounce refs for pincode lookup
  const senderPinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const receiverPinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // handlePincodeChange: Auto-fetches city and state when user types a 6-digit PIN code.
  // Uses a 300ms debounce (delay) to avoid sending too many API requests while typing.
  const handlePincodeChange = useCallback(
    (
      pin: string,
      side: "sender" | "receiver"
    ) => {
      const setPin = side === "sender" ? setSenderPincode : setReceiverPincode;
      const setCity = side === "sender" ? setSenderCity : setReceiverCity;
      const setState = side === "sender" ? setSenderState : setReceiverState;
      const setLooking = side === "sender" ? setSenderPinLooking : setReceiverPinLooking;
      const setError = side === "sender" ? setSenderPinError : setReceiverPinError;
      const timerRef = side === "sender" ? senderPinTimer : receiverPinTimer;

      // Only allow digits
      const cleaned = pin.replace(/\D/g, "").slice(0, 6);
      setPin(cleaned);
      setError("");

      // Clear previous timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Auto-fetch when 6 digits entered
      if (cleaned.length === 6) {
        setLooking(true);
        timerRef.current = setTimeout(async () => {
          try {
            const result = await lookupPincode(cleaned);
            if (result.found && result.city) {
              setCity(result.city);
              setState(result.state || "");
              setError("");
            } else {
              setCity("");
              setState("");
              setError("PIN code not found. Please check and try again.");
            }
          } catch {
            setError("Failed to lookup PIN code. Please enter city manually.");
          } finally {
            setLooking(false);
          }
        }, 300);
      } else {
        setCity("");
        setState("");
      }
    },
    []
  );

  // Step 2 — Package
  const [weight, setWeight] = useState("1");
  const [length, setLength] = useState("20");
  const [width, setWidth] = useState("15");
  const [height, setHeight] = useState("10");
  const [contents, setContents] = useState("");

  // Step 3 — Service
  const [serviceType, setServiceType] = useState("EXPRESS_PARCEL");

  // Step 4 — Payment
  const [paymentMode, setPaymentMode] = useState("PREPAID");

  // Coupon / Promo — loaded from API + defaults
  const [availablePromos, setAvailablePromos] = useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [couponInput, setCouponInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Load active promotions from API on mount
  useEffect(() => {
    fetch(API_PROMO_URL)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          const apiPromos: Promotion[] = data.map((p: any) => ({
            code: p.code,
            title: p.title,
            description: p.description || "",
            discount: p.discount,
            type: p.type as "percentage" | "flat",
            validTill: p.validTill,
            active: p.active,
            category: p.category || "All Services",
          }));
          // Merge: API promos take priority, then defaults for any codes not in API
          const apiCodes = new Set(apiPromos.map(p => p.code));
          const fallbacks = DEFAULT_PROMOTIONS.filter(p => !apiCodes.has(p.code));
          setAvailablePromos([...apiPromos, ...fallbacks]);
        }
      })
      .catch(() => { /* use DEFAULT_PROMOTIONS */ });
  }, []);

  // Calculated values
  const km = distanceKm(senderCity, receiverCity);
  const rate = calcRate(parseFloat(weight) || 1, km, serviceType);
  const serviceInfo = SERVICE_OPTIONS.find((s) => s.value === serviceType);
  const days = serviceType === "EXPRESS_PREMIUM" ? 1 : serviceType === "EXPRESS_PARCEL" ? 2 : serviceType === "ECOMMERCE" ? 3 : Math.max(3, Math.round(km / 500));

  // Discount calculation
  const discountAmount = appliedPromo
    ? appliedPromo.type === "percentage"
      ? Math.round(rate * appliedPromo.discount / 100)
      : Math.min(appliedPromo.discount, rate)
    : 0;
  const finalRate = rate - discountAmount;

  // Map service type → category for promo matching
  const serviceCategoryMap: Record<string, string> = {
    EXPRESS_PARCEL: "Express Parcel",
    EXPRESS_PREMIUM: "Express Premium",
    ECOMMERCE: "E-Commerce",
    LTL: "LTL Freight",
  };

  function applyPromoCode(code: string) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setCouponError("");
    setCouponSuccess("");
    const promo = availablePromos.find(p => p.code === normalized && p.active);
    if (!promo) {
      setCouponError(`Invalid coupon code "${normalized}". Try EAGLE20 or NEW100.`);
      return;
    }
    // Check expiry
    if (new Date(promo.validTill) < new Date()) {
      setCouponError(`Coupon "${normalized}" has expired.`);
      return;
    }
    // Check category
    const currentCategory = serviceCategoryMap[serviceType] || "";
    if (promo.category !== "All Services" && promo.category !== currentCategory) {
      setCouponError(`"${normalized}" is valid only for ${promo.category}. You selected ${currentCategory}.`);
      return;
    }
    // Check min order
    if (promo.minOrder && rate < promo.minOrder) {
      setCouponError(`Minimum order ₹${promo.minOrder} required for "${normalized}". Your order is ₹${rate}.`);
      return;
    }
    setAppliedPromo(promo);
    setCouponInput("");
    const disc = promo.type === "percentage"
      ? Math.round(rate * promo.discount / 100)
      : Math.min(promo.discount, rate);
    setCouponSuccess(`🎉 "${promo.code}" applied! You save ₹${disc}.`);
  }

  function removePromo() {
    setAppliedPromo(null);
    setCouponSuccess("");
    setCouponError("");
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return !!(senderName && senderPhone && senderCity && senderPincode && senderAddress && receiverName && receiverPhone && receiverCity && receiverPincode && receiverAddress);
      case 2: return !!(weight && contents);
      case 3: return !!serviceType;
      case 4: return !!paymentMode;
      default: return true;
    }
  }

  // handleBook: Called when user confirms the booking in Step 5.
  // - Generates a unique AWB (tracking) number
  // - Finds the nearest hub to sender's city and assigns an agent
  // - Saves the shipment to the database via the API
  // - Triggers customer notifications about order and agent assignment
  async function handleBook() {
    setIsBooking(true);
    const newAwb = `EE-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Find nearest hub and assign agent
    const hub = findNearestHub(senderCity);
    const agent = findAgentForHub(hub.code);

    // Save shipment to database via API
    try {
      await createShipment({
        awbNumber: newAwb,
        status: "PENDING",
        origin: `${senderCity}, India`,
        destination: `${receiverCity}, India`,
        currentLocation: hub.name,
        senderName: senderName || "Customer",
        senderAddress: senderAddress || senderCity,
        receiverName: receiverName || "Receiver",
        receiverAddress: receiverAddress || receiverCity,
        weight: parseFloat(weight) || 1,
        dimensions: `${length}x${width}x${height} cm`,
        declaredValue: finalRate,
        currency: "INR",
        expectedDelivery: new Date(Date.now() + days * 86400000).toISOString(),
        shipmentType: serviceType,
        customerPhone: user?.phone || "",
        customerName: user?.name || senderName || "",
      } as any);
    } catch (err) {
      console.error("Failed to save shipment:", err);
    }

    setAwbNumber(newAwb);
    setAssignedAgent(agent);
    setAssignedHub(hub);
    setBooked(true);
    setIsBooking(false);

    // Generate notifications
    addNotification({
      type: "order_confirmed",
      role: "customer",
      title: "Order Confirmed!",
      message: `Your shipment ${newAwb} from ${senderCity} → ${receiverCity} has been confirmed. Estimated delivery: ${days} day${days > 1 ? "s" : ""}.`,
      awb: newAwb,
    });

    addNotification({
      type: "agent_assigned",
      role: "customer",
      title: "Agent Assigned",
      message: `Delivery agent ${agent.name} (${agent.vehicleType}) has been assigned for pickup from ${hub.name}. ETA: ${agent.eta} mins.`,
      awb: newAwb,
    });
  }

  function resetFlow() {
    setStep(1);
    setBooked(false);
    setSenderName(""); setSenderPhone(""); setSenderPincode(""); setSenderAddress(""); setSenderCity(""); setSenderState(""); setSenderPinError("");
    setReceiverName(""); setReceiverPhone(""); setReceiverPincode(""); setReceiverAddress(""); setReceiverCity(""); setReceiverState(""); setReceiverPinError("");
    setWeight("1"); setLength("20"); setWidth("15"); setHeight("10"); setContents("");
    setServiceType("EXPRESS_PARCEL"); setPaymentMode("PREPAID");
    setAppliedPromo(null); setCouponInput(""); setCouponError(""); setCouponSuccess("");
  }

  // ─── Booking Confirmed Screen ─────────────────────────
  if (booked) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Shipment Booked!</h1>
            <p className="text-slate-400">Your shipment has been successfully placed.</p>
          </div>

          {/* AWB Card */}
          <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40 mb-6 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">AWB Number</p>
            <p className="text-3xl font-bold font-mono text-emerald-400">{awbNumber}</p>
            <p className="text-slate-500 text-xs mt-2">Save this number to track your shipment</p>
          </div>

          {/* Route / Delivery / Cost */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-slate-800/30 rounded-lg text-center">
              <p className="text-slate-500 text-xs">Route</p>
              <p className="text-white font-medium text-sm mt-0.5">{senderCity} → {receiverCity}</p>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg text-center">
              <p className="text-slate-500 text-xs">Est. Delivery</p>
              <p className="text-white font-medium text-sm mt-0.5">{days} day{days > 1 ? "s" : ""}</p>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg text-center">
              <p className="text-slate-500 text-xs">Total Cost</p>
              {appliedPromo ? (
                <div>
                  <p className="text-slate-500 text-xs line-through">₹{rate.toLocaleString()}</p>
                  <p className="text-emerald-400 font-bold text-sm">₹{finalRate.toLocaleString()}</p>
                </div>
              ) : (
                <p className="text-emerald-400 font-bold text-sm mt-0.5">₹{rate.toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Assigned Agent Card */}
          {assignedAgent && assignedHub && (
            <div className="p-6 bg-slate-800/40 rounded-xl border border-purple-500/20 mb-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                Assigned Delivery Agent
              </h3>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {assignedAgent.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-white font-semibold">{assignedAgent.name}</p>
                    <p className="text-slate-400 text-sm">{assignedHub.name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Phone className="w-3 h-3" />
                      {assignedAgent.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Truck className="w-3 h-3" />
                      {assignedAgent.vehicleType.charAt(0).toUpperCase() + assignedAgent.vehicleType.slice(1)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Clock className="w-3 h-3" />
                      ETA: {assignedAgent.eta} mins
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Timeline */}
              <div className="mt-5 pt-4 border-t border-slate-700/40">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  Delivery Timeline
                </h4>
                <div className="space-y-3">
                  {[
                    { status: "Order Confirmed", time: "Just now", done: true },
                    { status: "Agent Assigned", time: "Just now", done: true },
                    { status: `Pickup from ${senderCity}`, time: `~${assignedAgent.eta} mins`, done: false },
                    { status: `In Transit to ${receiverCity}`, time: `~${days * 12} hrs`, done: false },
                    { status: "Out for Delivery", time: `Day ${days}`, done: false },
                    { status: "Delivered", time: `Est. ${days} day${days > 1 ? "s" : ""}`, done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.done
                          ? "bg-emerald-500/20 border border-emerald-500/40"
                          : "bg-slate-700/50 border border-slate-600/40"
                      }`}>
                        {step.done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`text-sm ${step.done ? "text-white" : "text-slate-500"}`}>{step.status}</span>
                        <span className="text-xs text-slate-600">{step.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link
              to="/track"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 no-underline"
            >
              <Truck className="w-4 h-4" />
              Track Shipment
            </Link>
            <button
              onClick={resetFlow}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-white rounded-lg font-medium transition-all cursor-pointer"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-4">
            <Truck className="w-4 h-4" />
            Ship Now
          </div>
          <h1 className="text-3xl font-bold text-white">Book a Shipment</h1>
          <p className="text-slate-400 mt-1">Complete the steps below to book your delivery.</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-1 mb-8 p-2 bg-slate-800/30 rounded-xl border border-slate-700/30">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center flex-1">
                <button
                  onClick={() => isDone ? setStep(s.num as Step) : undefined}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                      : isDone
                      ? "bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20"
                      : "text-slate-600"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <s.icon className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className={`w-4 h-4 mx-1 flex-shrink-0 ${isDone ? "text-emerald-500/40" : "text-slate-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="animate-in fade-in duration-300">
          {/* STEP 1: Addresses */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sender */}
              <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Pickup Address (Sender)
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Full Name</label>
                    <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Sender name"
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Phone</label>
                    <input value={senderPhone} onChange={(e) => {
                      let val = e.target.value;
                      // Auto-prefix +91 and only allow digits after prefix
                      if (!val.startsWith("+91")) val = "+91 ";
                      const digits = val.slice(4).replace(/[^0-9 ]/g, "");
                      setSenderPhone("+91 " + digits.slice(0, 12));
                    }} placeholder="+91 98765 43210" type="tel" inputMode="numeric"
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">PIN Code</label>
                    <div className="relative">
                      <input
                        value={senderPincode}
                        onChange={(e) => handlePincodeChange(e.target.value, "sender")}
                        placeholder="Enter 6-digit PIN code"
                        maxLength={6}
                        inputMode="numeric"
                        className={`w-full px-3 py-2.5 bg-slate-700/50 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 pr-10 ${
                          senderPinError ? "border-red-500/60 focus:ring-red-500/40" :
                          senderCity ? "border-emerald-500/60 focus:ring-emerald-500/40" :
                          "border-slate-600/40 focus:ring-blue-500/40"
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {senderPinLooking ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : senderCity ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : senderPincode.length === 6 ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Search className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                    {senderPinError && <p className="text-red-400 text-xs mt-1">{senderPinError}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">City</label>
                      <input
                        value={senderCity}
                        onChange={(e) => setSenderCity(e.target.value)}
                        placeholder={senderPinLooking ? "Fetching..." : "Auto-filled from PIN"}
                        readOnly={senderPinLooking}
                        className={`w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                          senderCity ? "text-emerald-300 font-medium" : "text-white"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">State</label>
                      <input
                        value={senderState}
                        onChange={(e) => setSenderState(e.target.value)}
                        placeholder={senderPinLooking ? "Fetching..." : "Auto-filled from PIN"}
                        readOnly={senderPinLooking}
                        className={`w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                          senderState ? "text-emerald-300 font-medium" : "text-white"
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Full Address</label>
                    <textarea value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} rows={2} placeholder="Street, area, landmark..."
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                </div>
              </div>

              {/* Receiver */}
              <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  Delivery Address (Receiver)
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Full Name</label>
                    <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Receiver name"
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Phone</label>
                    <input value={receiverPhone} onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith("+91")) val = "+91 ";
                      const digits = val.slice(4).replace(/[^0-9 ]/g, "");
                      setReceiverPhone("+91 " + digits.slice(0, 12));
                    }} placeholder="+91 98765 43210" type="tel" inputMode="numeric"
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">PIN Code</label>
                    <div className="relative">
                      <input
                        value={receiverPincode}
                        onChange={(e) => handlePincodeChange(e.target.value, "receiver")}
                        placeholder="Enter 6-digit PIN code"
                        maxLength={6}
                        inputMode="numeric"
                        className={`w-full px-3 py-2.5 bg-slate-700/50 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 pr-10 ${
                          receiverPinError ? "border-red-500/60 focus:ring-red-500/40" :
                          receiverCity ? "border-emerald-500/60 focus:ring-emerald-500/40" :
                          "border-slate-600/40 focus:ring-blue-500/40"
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {receiverPinLooking ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : receiverCity ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : receiverPincode.length === 6 ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Search className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                    {receiverPinError && <p className="text-red-400 text-xs mt-1">{receiverPinError}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">City</label>
                      <input
                        value={receiverCity}
                        onChange={(e) => setReceiverCity(e.target.value)}
                        placeholder={receiverPinLooking ? "Fetching..." : "Auto-filled from PIN"}
                        readOnly={receiverPinLooking}
                        className={`w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                          receiverCity ? "text-emerald-300 font-medium" : "text-white"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">State</label>
                      <input
                        value={receiverState}
                        onChange={(e) => setReceiverState(e.target.value)}
                        placeholder={receiverPinLooking ? "Fetching..." : "Auto-filled from PIN"}
                        readOnly={receiverPinLooking}
                        className={`w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                          receiverState ? "text-emerald-300 font-medium" : "text-white"
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Full Address</label>
                    <textarea value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} rows={2} placeholder="Street, area, landmark..."
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Package Details */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto">
              <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  Package Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Weight (kg)</label>
                    <input type="number" min="0.1" step="0.1" value={weight} onChange={(e) => {
                      const v = e.target.value; if (v === "" || parseFloat(v) >= 0.1) setWeight(v || "0.1");
                    }} onBlur={() => { if (!weight || parseFloat(weight) < 0.1) setWeight("0.1"); }}
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Length (cm)</label>
                      <input type="number" min="1" value={length} onChange={(e) => {
                        const v = e.target.value; if (v === "" || parseInt(v) >= 1) setLength(v || "1");
                      }} onBlur={() => { if (!length || parseInt(length) < 1) setLength("1"); }}
                        className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Width (cm)</label>
                      <input type="number" min="1" value={width} onChange={(e) => {
                        const v = e.target.value; if (v === "" || parseInt(v) >= 1) setWidth(v || "1");
                      }} onBlur={() => { if (!width || parseInt(width) < 1) setWidth("1"); }}
                        className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Height (cm)</label>
                      <input type="number" min="1" value={height} onChange={(e) => {
                        const v = e.target.value; if (v === "" || parseInt(v) >= 1) setHeight(v || "1");
                      }} onBlur={() => { if (!height || parseInt(height) < 1) setHeight("1"); }}
                        className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Contents Description</label>
                    <input value={contents} onChange={(e) => setContents(e.target.value)} placeholder="e.g. Electronics, Documents, Clothing..."
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                </div>

                {/* Live rate preview */}
                <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-sm font-medium">Live Rate Estimate</span>
                    </div>
                    <span className="text-white font-bold text-lg">₹{rate.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">{senderCity} → {receiverCity} • {km.toLocaleString()} km • {parseFloat(weight) || 1} kg</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Service Type */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto">
              <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-400" />
                  Select Service Type
                </h2>
                <div className="space-y-3">
                  {SERVICE_OPTIONS.map((opt) => {
                    const isSelected = serviceType === opt.value;
                    const colors = COLOR_MAP[opt.color];
                    const optRate = calcRate(parseFloat(weight) || 1, km, opt.value);
                    const optDays = opt.value === "EXPRESS_PREMIUM" ? 1 : opt.value === "EXPRESS_PARCEL" ? 2 : opt.value === "ECOMMERCE" ? 3 : Math.max(3, Math.round(km / 500));
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setServiceType(opt.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                          isSelected ? colors.active : colors.inactive + " hover:bg-slate-700/50"
                        }`}
                      >
                        <opt.icon className={`w-6 h-6 flex-shrink-0 ${isSelected ? "" : "text-slate-500"}`} />
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${isSelected ? "" : "text-white"}`}>{opt.label}</p>
                          <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isSelected ? "" : "text-white"}`}>₹{optRate.toLocaleString()}</p>
                          <p className="text-xs opacity-60">{optDays} day{optDays > 1 ? "s" : ""}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Mode */}
          {step === 4 && (
            <div className="max-w-2xl mx-auto">
              <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Payment Mode
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { value: "PREPAID", label: "Prepaid", desc: "Pay now via UPI, Card, Net Banking", icon: CreditCard },
                    { value: "COD", label: "Cash on Delivery", desc: "Receiver pays on delivery", icon: Package },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPaymentMode(opt.value)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
                        paymentMode === opt.value
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-slate-700/30 border-slate-600/30 text-slate-400 hover:text-white hover:bg-slate-700/50"
                      }`}
                    >
                      <opt.icon className="w-8 h-8" />
                      <div className="text-center">
                        <p className="font-bold text-base">{opt.label}</p>
                        <p className="text-xs opacity-60 mt-1">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="p-5 bg-purple-500/5 rounded-xl border border-purple-500/15 mb-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" /> Apply Coupon Code
                  </h3>

                  {/* Coupon Input */}
                  {!appliedPromo ? (
                    <div className="flex gap-2 mb-3">
                      <input
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => applyPromoCode(couponInput)}
                        disabled={!couponInput.trim()}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-emerald-400 font-mono font-bold text-sm">{appliedPromo.code}</span>
                          <span className="text-slate-400 text-xs ml-2">— {appliedPromo.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold text-sm">-₹{discountAmount.toLocaleString()}</span>
                        <button onClick={removePromo} className="text-slate-500 hover:text-red-400 cursor-pointer transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-red-400 text-xs mb-2">{couponError}</p>
                  )}
                  {couponSuccess && !appliedPromo && (
                    <p className="text-emerald-400 text-xs mb-2">{couponSuccess}</p>
                  )}

                  {/* Available Coupons */}
                  {!appliedPromo && (
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-2">Available Offers</p>
                      <div className="space-y-2">
                        {availablePromos.filter(p => {
                          const cat = serviceCategoryMap[serviceType] || "";
                          return p.active && new Date(p.validTill) >= new Date() && (p.category === "All Services" || p.category === cat);
                        }).map(promo => (
                          <button
                            key={promo.code}
                            type="button"
                            onClick={() => applyPromoCode(promo.code)}
                            className="w-full flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left cursor-pointer group"
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${promo.type === "percentage" ? "bg-purple-500/20" : "bg-amber-500/20"}`}>
                              {promo.type === "percentage" ? <Percent className="w-4 h-4 text-purple-400" /> : <span className="text-amber-400 font-bold">₹</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-mono text-xs font-bold">{promo.code}</span>
                                <span className="text-slate-500 text-xs">•</span>
                                <span className="text-slate-400 text-xs truncate">{promo.description}</span>
                              </div>
                            </div>
                            <span className={`text-xs font-bold flex-shrink-0 ${promo.type === "percentage" ? "text-purple-400" : "text-amber-400"}`}>
                              {promo.type === "percentage" ? `${promo.discount}% OFF` : `₹${promo.discount} OFF`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="p-5 bg-slate-700/20 rounded-xl border border-slate-700/30">
                  <h3 className="text-white font-bold mb-4">Order Summary</h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route</span>
                      <span className="text-white">{senderCity} → {receiverCity} ({km} km)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Package</span>
                      <span className="text-white">{parseFloat(weight) || 1} kg — {contents || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Service</span>
                      <span className="text-white">{serviceInfo?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est. Delivery</span>
                      <span className="text-white">{days} day{days > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment</span>
                      <span className="text-white">{paymentMode === "COD" ? "Cash on Delivery" : "Prepaid"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-white">₹{rate.toLocaleString()}</span>
                    </div>
                    {appliedPromo && (
                      <div className="flex justify-between">
                        <span className="text-purple-400 flex items-center gap-1"><Tag className="w-3 h-3" /> {appliedPromo.code}</span>
                        <span className="text-emerald-400 font-medium">-₹{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-700/50 pt-2 mt-2 flex justify-between">
                      <span className="text-white font-bold">Total</span>
                      <span className="text-emerald-400 font-bold text-lg">₹{finalRate.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Confirm & Book */}
          {step === 5 && (
            <div className="max-w-2xl mx-auto">
              <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Review & Confirm
                </h2>

                {/* Sender → Receiver summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-700/20 rounded-lg">
                    <p className="text-blue-400 text-xs uppercase tracking-wider font-semibold mb-2">Sender</p>
                    <p className="text-white font-medium text-sm">{senderName}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{senderPhone}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{senderAddress}, {senderCity} - {senderPincode}</p>
                  </div>
                  <div className="p-4 bg-slate-700/20 rounded-lg">
                    <p className="text-emerald-400 text-xs uppercase tracking-wider font-semibold mb-2">Receiver</p>
                    <p className="text-white font-medium text-sm">{receiverName}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{receiverPhone}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{receiverAddress}, {receiverCity} - {receiverPincode}</p>
                  </div>
                </div>

                {/* Package + Service + Payment summary */}
                <div className="p-4 bg-slate-700/20 rounded-lg mb-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Package</span>
                    <span className="text-white">{parseFloat(weight) || 1} kg | {length}×{width}×{height} cm | {contents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service</span>
                    <span className="text-white">{serviceInfo?.label} ({days} day{days > 1 ? "s" : ""})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Distance</span>
                    <span className="text-white">{km.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment</span>
                    <span className="text-white">{paymentMode === "COD" ? "Cash on Delivery" : "Prepaid"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">₹{rate.toLocaleString()}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between">
                      <span className="text-purple-400 flex items-center gap-1"><Tag className="w-3 h-3" /> {appliedPromo.code}</span>
                      <span className="text-emerald-400 font-medium">-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700/50 pt-2 flex justify-between">
                    <span className="text-white font-bold">Total Cost</span>
                    <span className="text-emerald-400 font-bold text-xl">₹{finalRate.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={isBooking}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Booking Shipment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm & Book Shipment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {!booked && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep((step - 1) as Step)}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-2.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {step < 5 && (
              <button
                onClick={() => setStep((step + 1) as Step)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
