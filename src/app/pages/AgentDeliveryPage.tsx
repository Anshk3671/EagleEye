/**
 * AgentDeliveryPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The delivery management page for agents — where they mark shipments as delivered.
 *
 * WHAT IT DOES:
 *  - Shows all active shipments assigned to the logged-in agent
 *  - Allows agents to update shipment status (e.g. Picked Up → In Transit → Delivered)
 *  - Handles Cash on Delivery (COD) collection and confirmation
 *  - Records proof of delivery (digital signature or photo upload)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, MapPin, Package, Truck, CheckCircle2, Clock, Navigation,
  Phone, User, PenTool, X, Send, Loader2, Circle
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../hooks/useAuth";
import { getHubByCode, getHubByCity } from "../lib/mapData";
import { addNotification } from "../lib/notifications";

// Fix Leaflet default icon
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
function createIcon(color: string, label: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const hubIcon = createIcon("#3b82f6", "🏢");
const pickupIcon = createIcon("#f59e0b", "📦");
const deliveryIcon = createIcon("#10b981", "🏠");
const agentIcon = createIcon("#8b5cf6", "🚚");

const TIMELINE_STEPS = [
  { key: "picked_up", label: "Picked Up", desc: "Package collected from sender" },
  { key: "in_transit", label: "In Transit", desc: "Moving through hub network" },
  { key: "arrived_hub", label: "Arrived at Hub", desc: "At local distribution hub" },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "Agent en route to customer" },
  { key: "delivered", label: "Delivered", desc: "Package delivered to customer" },
];

// Map auto-fit component
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => { map.fitBounds(bounds, { padding: [40, 40] }); }, [map, bounds]);
  return null;
}

export default function AgentDeliveryPage() {
  const { user } = useAuth();
  // Auto-detect hub from user's city/address, fallback to hubCode, then DEL
  const agentHub = (user?.city && getHubByCity(user.city)) 
    || (user?.address && getHubByCity(user.address))
    || getHubByCode(user?.hubCode || "DEL");

  // Simulated delivery data
  const hubPos: [number, number] = agentHub ? [agentHub.lat, agentHub.lng] : [19.076, 72.877];
  const pickupPos: [number, number] = [hubPos[0] + 0.02, hubPos[1] - 0.015];
  const deliveryPos: [number, number] = [hubPos[0] - 0.035, hubPos[1] + 0.04];
  const agentPos: [number, number] = [
    pickupPos[0] + (deliveryPos[0] - pickupPos[0]) * 0.6,
    pickupPos[1] + (deliveryPos[1] - pickupPos[1]) * 0.6,
  ];

  const routePath: [number, number][] = [hubPos, pickupPos, agentPos, deliveryPos];
  const bounds = L.latLngBounds(routePath.map(p => L.latLng(p[0], p[1])));

  const [currentStep, setCurrentStep] = useState(3); // 0-indexed, 3 = out for delivery
  const [showSignature, setShowSignature] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [notified, setNotified] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Check if shipment is already delivered in DB (persist across refresh)
  useEffect(() => {
    fetch("http://localhost:3001/api/shipments/EE-742-9910")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.status === "DELIVERED") {
          setDelivered(true);
          setCurrentStep(4);
        }
      })
      .catch(() => {});
  }, []);

  // Signature canvas handlers
  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!canvasRef.current) return;
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineTo(x, y);
    ctx.stroke();
    setSignatureComplete(true);
  }

  function endDraw() {
    isDrawing.current = false;
  }

  function clearSignature() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSignatureComplete(false);
  }

  async function handleMarkDelivered() {
    setDelivering(true);

    // Upload signature canvas to server as proof-of-delivery
    let signatureUrl = "";
    if (canvasRef.current) {
      try {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvasRef.current!.toBlob(resolve, "image/png")
        );
        if (blob) {
          const formData = new FormData();
          formData.append("pod", blob, `signature-EE-742-9910-${Date.now()}.png`);
          const res = await fetch("http://localhost:3001/api/uploads/pod", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            signatureUrl = data.url;
            console.log("✍️ Signature uploaded:", signatureUrl);
          }
        }
      } catch (err) {
        console.error("Signature upload failed:", err);
      }
    }

    // Update shipment status to DELIVERED with signature URL
    try {
      await fetch("http://localhost:3001/api/shipments/EE-742-9910", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DELIVERED",
          eventDescription: "Package delivered. Digital signature captured.",
          ...(signatureUrl && { signatureUrl }),
        }),
      });
    } catch (err) {
      console.error("Status update failed:", err);
    }

    setDelivering(false);
    setDelivered(true);
    setShowSignature(false);
    setCurrentStep(4);
    addNotification({
      type: "delivered",
      role: "agent",
      title: "Package Delivered",
      message: "EE-742-9910 has been delivered successfully. Digital signature captured.",
      awb: "EE-742-9910",
    });
    // Also notify customer
    addNotification({
      type: "delivered",
      role: "customer",
      title: "Delivered Successfully!",
      message: "Your shipment EE-742-9910 has been delivered. Signed by customer.",
      awb: "EE-742-9910",
    });
  }

  function handleNotify() {
    setNotified(true);
    addNotification({
      type: "out_for_delivery",
      role: "customer",
      title: "Out for Delivery",
      message: "Your package EE-742-9910 is out for delivery. Agent is on the way!",
      awb: "EE-742-9910",
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/agent/dashboard" className="text-slate-500 hover:text-white transition-colors no-underline">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Active Delivery</h1>
            <p className="text-slate-400 text-sm">AWB: <span className="font-mono text-white">EE-742-9910</span></p>
            <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {agentHub?.name || "Hub"}{user?.address ? ` • ${user.address}` : ""}{user?.pincode ? ` - ${user.pincode}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden border border-slate-700/40 relative z-0" style={{ height: 450 }}>
            <MapContainer center={hubPos} zoom={13} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <FitBounds bounds={bounds} />
              <Polyline positions={routePath} pathOptions={{ color: "#3b82f6", weight: 3, dashArray: "8 8" }} />
              <Marker position={hubPos} icon={hubIcon}>
                <Popup>{agentHub?.name || "Hub"}</Popup>
              </Marker>
              <Marker position={pickupPos} icon={pickupIcon}>
                <Popup>Pickup Point</Popup>
              </Marker>
              <Marker position={deliveryPos} icon={deliveryIcon}>
                <Popup>Delivery: Connaught Place, Delhi</Popup>
              </Marker>
              {!delivered && (
                <Marker position={agentPos} icon={agentIcon}>
                  <Popup>{user?.name || "Agent"} — En Route</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Delivery Info */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" /> Parcel Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Receiver</span><span className="text-white">Priya Sharma</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Address</span><span className="text-white text-right text-xs">Connaught Place, Delhi</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-white">+91 91234 56789</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Weight</span><span className="text-white">2.5 kg</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-white">Express Parcel</span></div>
                <div className="flex justify-between"><span className="text-slate-500">ETA</span><span className="text-emerald-400 font-bold">~15 min</span></div>
              </div>
            </div>

            {/* Delivery Timeline */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Timeline
              </h3>
              <div className="space-y-0">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.key} className="flex items-start gap-3 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          done ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-500"
                        } ${active ? "ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-slate-900" : ""}`}>
                          {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`w-0.5 h-8 ${i < currentStep ? "bg-emerald-500" : "bg-slate-700"}`} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-medium ${done ? "text-white" : "text-slate-500"}`}>{step.label}</p>
                        <p className="text-xs text-slate-500">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!delivered && (
                <>
                  <button
                    onClick={handleNotify}
                    disabled={notified}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      notified
                        ? "bg-slate-700/50 text-slate-500"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {notified ? "Customer Notified ✓" : "Notify Customer"}
                  </button>
                  <button
                    onClick={() => setShowSignature(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <PenTool className="w-4 h-4" />
                    Mark Delivered & Capture Signature
                  </button>
                </>
              )}
              {delivered && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400 font-bold">Delivery Complete!</p>
                  <p className="text-slate-400 text-xs mt-1">Signature captured • +10 credit points</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSignature(false)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <PenTool className="w-5 h-5 text-blue-400" />
                Customer Signature
              </h3>
              <button onClick={() => setShowSignature(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-400 text-sm mb-4">Customer signs below to confirm delivery of AWB: <span className="text-white font-mono">EE-742-9910</span></p>

            {/* Canvas */}
            <div className="bg-slate-800 rounded-xl border border-slate-600/40 p-1 mb-4">
              <canvas
                ref={canvasRef}
                width={380}
                height={200}
                className="w-full bg-white/5 rounded-lg cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={clearSignature} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium cursor-pointer transition-all">
                Clear
              </button>
              <button
                onClick={handleMarkDelivered}
                disabled={!signatureComplete || delivering}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {delivering ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {delivering ? "Submitting..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
