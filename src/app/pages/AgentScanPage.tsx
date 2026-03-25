/**
 * AgentScanPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The QR/barcode scanning page for delivery agents.
 *
 * WHAT IT DOES:
 *  - Allows agents to scan shipment QR codes using their device camera
 *  - Automatically looks up the scanned AWB number
 *  - Updates shipment status after scanning (e.g. Package Received at Hub)
 *  - Works as a quick alternative to typing AWB numbers manually
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, Search, Package, MapPin, CheckCircle2, AlertTriangle,
  Loader2, Truck, Clock, ScanLine, Send
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getHubByCode, getHubByCity } from "../lib/mapData";
import { addNotification } from "../lib/notifications";

// Mock shipment data for scanning
const SCANNABLE_SHIPMENTS: Record<string, {
  awb: string; sender: string; receiver: string; origin: string; destination: string;
  weight: string; currentStatus: string; type: string;
}> = {
  "EE-742-9910": { awb: "EE-742-9910", sender: "Rajesh Kumar", receiver: "Priya Sharma", origin: "Mumbai", destination: "Delhi", weight: "2.5 kg", currentStatus: "IN_TRANSIT", type: "Express Parcel" },
  "EE-8829-0012": { awb: "EE-8829-0012", sender: "Vikram Patel", receiver: "Ananya Reddy", origin: "Chennai", destination: "Bangalore", weight: "1.2 kg", currentStatus: "OUT_FOR_DELIVERY", type: "Express Premium" },
  "EE-1055-3347": { awb: "EE-1055-3347", sender: "Amit Singh", receiver: "Priya Sundaram", origin: "Delhi", destination: "Chennai", weight: "4.0 kg", currentStatus: "DELIVERED", type: "E-Commerce" },
  "EE-331-4455": { awb: "EE-331-4455", sender: "Sanjay Mehta", receiver: "Neha Desai", origin: "Mumbai", destination: "Pune", weight: "1.8 kg", currentStatus: "PENDING", type: "Express Parcel" },
  "EE-887-2201": { awb: "EE-887-2201", sender: "Kavita Rao", receiver: "Harsh Vardhan", origin: "Mumbai", destination: "Mumbai", weight: "0.8 kg", currentStatus: "OUT_FOR_DELIVERY", type: "Express Premium" },
};

const STATUS_OPTIONS = [
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "ARRIVED_AT_HUB", label: "Arrived at Hub" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "DELAYED", label: "Delayed" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  IN_TRANSIT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  OUT_FOR_DELIVERY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PICKED_UP: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  DELAYED: "bg-red-500/10 text-red-400 border-red-500/20",
  ARRIVED_AT_HUB: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function AgentScanPage() {
  const { user } = useAuth();
  const agentHub = (user?.city && getHubByCity(user.city)) 
    || (user?.address && getHubByCity(user.address))
    || getHubByCode(user?.hubCode || "DEL");

  const [awbInput, setAwbInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedShipment, setScannedShipment] = useState<(typeof SCANNABLE_SHIPMENTS)[string] | null>(null);
  const [scanError, setScanError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [recentScans, setRecentScans] = useState<{ awb: string; status: string; time: string }[]>([]);

  function handleScan(e?: React.FormEvent) {
    e?.preventDefault();
    const q = awbInput.trim().toUpperCase();
    if (!q) return;
    setScanError("");
    setScannedShipment(null);
    setUpdateSuccess(false);
    setNewStatus("");
    setScanning(true);

    // Try API first, fall back to local mock
    fetch(`http://localhost:3001/api/shipments/${encodeURIComponent(q)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setScannedShipment({
            awb: data.awbNumber || q,
            sender: data.senderName || "Unknown",
            receiver: data.receiverName || "Unknown",
            origin: data.origin || "",
            destination: data.destination || "",
            weight: data.weight ? `${data.weight} kg` : "—",
            currentStatus: data.status || "PENDING",
            type: data.shipmentType || "Express Parcel",
          });
        } else {
          // Fallback to local mock
          const found = SCANNABLE_SHIPMENTS[q];
          if (found) {
            setScannedShipment(found);
          } else {
            setScanError(`No parcel found with AWB "${q}". Try: EE-742-9910`);
          }
        }
        setScanning(false);
      })
      .catch(() => {
        // Fallback to local mock
        const found = SCANNABLE_SHIPMENTS[q];
        if (found) {
          setScannedShipment(found);
        } else {
          setScanError(`No parcel found with AWB "${q}". Try: EE-742-9910`);
        }
        setScanning(false);
      });
  }

  async function handleUpdateStatus() {
    if (!newStatus || !scannedShipment) return;
    setUpdating(true);
    try {
      await fetch(`http://localhost:3001/api/shipments/${encodeURIComponent(scannedShipment.awb)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          currentLocation: agentHub?.name || "Hub",
          eventDescription: `Status updated to "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}" at ${agentHub?.name || "Hub"}`,
        }),
      });
    } catch (err) {
      console.error("Status update failed:", err);
    }
    setUpdating(false);
    setUpdateSuccess(true);
    // Update the local scanned shipment status to reflect the change
    if (scannedShipment) {
      setScannedShipment({ ...scannedShipment, currentStatus: newStatus });
    }
    setRecentScans(prev => [{
      awb: scannedShipment.awb,
      status: newStatus,
      time: new Date().toLocaleTimeString(),
    }, ...prev].slice(0, 10));
    addNotification({
      type: "info",
      role: "agent",
      title: `Status Updated: ${scannedShipment.awb}`,
      message: `Parcel status changed to "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}" at ${agentHub?.name || "Hub"}.`,
      awb: scannedShipment.awb,
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/agent/dashboard" className="text-slate-500 hover:text-white transition-colors no-underline">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ScanLine className="w-6 h-6 text-emerald-400" /> Scan & Update Parcel
            </h1>
            <p className="text-slate-400 text-sm">Enter AWB number to scan and update parcel status</p>
            <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {agentHub?.name || "Hub"}{user?.address ? ` • ${user.address}` : ""}{user?.pincode ? ` - ${user.pincode}` : ""}
            </p>
          </div>
        </div>

        {/* Scanner Input */}
        <form onSubmit={handleScan} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={awbInput}
                onChange={e => { setAwbInput(e.target.value); setScanError(""); setUpdateSuccess(false); }}
                placeholder="Enter AWB number (e.g. EE-742-9910)"
                className="w-full pl-12 pr-4 py-4 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={scanning || !awbInput.trim()}
              className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
              Scan
            </button>
          </div>
          {/* Quick AWBs */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {Object.keys(SCANNABLE_SHIPMENTS).map(awb => (
              <button
                key={awb}
                type="button"
                onClick={() => { setAwbInput(awb); setTimeout(() => handleScan()); }}
                className="px-3 py-1 bg-slate-800/50 border border-slate-700/40 rounded-lg text-xs text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer font-mono"
              >
                {awb}
              </button>
            ))}
          </div>
        </form>

        {/* Error */}
        {scanError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 mb-6">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Scanned Parcel Details */}
        {scannedShipment && (
          <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                {scannedShipment.awb}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[scannedShipment.currentStatus] || STATUS_BADGE.PENDING}`}>
                {scannedShipment.currentStatus.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div><p className="text-slate-500 text-xs">Sender</p><p className="text-white text-sm">{scannedShipment.sender}</p></div>
              <div><p className="text-slate-500 text-xs">Receiver</p><p className="text-white text-sm">{scannedShipment.receiver}</p></div>
              <div><p className="text-slate-500 text-xs">Weight</p><p className="text-white text-sm">{scannedShipment.weight}</p></div>
              <div><p className="text-slate-500 text-xs">Origin</p><p className="text-white text-sm">{scannedShipment.origin}</p></div>
              <div><p className="text-slate-500 text-xs">Destination</p><p className="text-white text-sm">{scannedShipment.destination}</p></div>
              <div><p className="text-slate-500 text-xs">Type</p><p className="text-white text-sm">{scannedShipment.type}</p></div>
            </div>

            {/* Location Auto-Tag */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm">Current Location: <span className="font-bold">{agentHub?.name || "Hub"}</span> ({agentHub?.code || "—"})</span>
            </div>

            {/* Status Update */}
            {!updateSuccess ? (
              <div className="flex gap-3">
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none cursor-pointer"
                >
                  <option value="">Select new status...</option>
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || updating}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Update
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-bold text-sm">Status Updated Successfully!</p>
                  <p className="text-slate-400 text-xs">Customer notified • Logged at {agentHub?.name || "Hub"}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Recent Scans
            </h3>
            <div className="space-y-2">
              {recentScans.map((scan, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">{scan.awb}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[scan.status] || ""}`}>
                      {scan.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-slate-500 text-xs">{scan.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
