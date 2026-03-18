/**
 * ShipmentDetailsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The detailed shipment tracking page — shows full info for one specific shipment.
 *
 * ACCESSED VIA: /shipments/:awbNumber (e.g. /shipments/EE-123-4567)
 *
 * WHAT IT SHOWS:
 *  - Full shipment info: AWB, origin, destination, type, weight, value
 *  - Sender and receiver name and address
 *  - Current status badge (IN_TRANSIT, DELIVERED, DELAYED etc.)
 *  - Complete tracking event timeline with dates and locations
 *  - Estimated delivery date
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router";
import { useShipment } from "../hooks/useShipments";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Box,
  Loader2,
  Weight,
  Ruler,
  DollarSign,
  User,
  Mail,
} from "lucide-react";
import { format } from "date-fns";



const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Package; label: string }> = {
  IN_TRANSIT: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Truck, label: "In Transit" },
  DELIVERED: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, label: "Delivered" },
  DELAYED: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle, label: "Delayed" },
  PENDING: { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: Clock, label: "Pending" },
  ARRIVED: { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: MapPin, label: "Arrived" },
  DEPARTED: { color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", icon: ArrowRight, label: "Departed" },
  PICKED_UP: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: Box, label: "Picked Up" },
  OUT_FOR_DELIVERY: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: Truck, label: "Out for Delivery" },
};

export default function ShipmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shipment, loading, error } = useShipment(id);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading shipment details...</span>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Shipment Not Found</h2>
          <p className="text-slate-400 mb-6">{error || `No shipment found with AWB: ${id}`}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
          >
            Go to Tracking
          </button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${statusCfg.bg} border flex items-center justify-center`}>
              <StatusIcon className={`w-7 h-7 ${statusCfg.color}`} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-mono">{shipment.awbNumber}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${statusCfg.bg} ${statusCfg.color} border`}>
                  {statusCfg.label}
                </span>
                <span className="text-slate-500 text-sm">{shipment.shipmentType}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs uppercase tracking-wider">Expected Delivery</p>
            <p className="text-white font-semibold text-lg">
              {format(new Date(shipment.expectedDelivery), "MMMM dd, yyyy")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shipment Info */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                Shipment Info
              </h3>
              <div className="space-y-3">
                <InfoRow icon={Weight} label="Weight" value={`${shipment.weight} kg`} />
                <InfoRow icon={Ruler} label="Dimensions" value={shipment.dimensions} />
                <InfoRow icon={DollarSign} label="Declared Value" value={`${shipment.currency} ${shipment.declaredValue.toLocaleString()}`} />
                <InfoRow icon={Clock} label="Created" value={format(new Date(shipment.createdAt), "MMM dd, yyyy")} />
              </div>
            </div>

            {/* Sender */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Sender
              </h3>
              <p className="text-white font-medium">{shipment.senderName}</p>
              <p className="text-slate-400 text-sm mt-1">{shipment.senderAddress || shipment.origin}</p>
            </div>

            {/* Receiver */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                Receiver
              </h3>
              <p className="text-white font-medium">{shipment.receiverName}</p>
              <p className="text-slate-400 text-sm mt-1">{shipment.receiverAddress || shipment.destination}</p>
            </div>
          </div>

          {/* Right Column - Route & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Card */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-4">Route Overview</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-500 text-xs uppercase mb-0.5">Origin</p>
                  <p className="text-white font-medium text-sm truncate">{shipment.origin}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <p className="text-slate-500 text-xs uppercase mb-0.5">Current</p>
                  <p className="text-blue-400 font-medium text-sm truncate">{shipment.currentLocation}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-500 text-xs uppercase mb-0.5">Destination</p>
                  <p className="text-white font-medium text-sm truncate">{shipment.destination}</p>
                </div>
              </div>
            </div>

            {/* Route Info */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="text-white font-semibold text-sm">Route Info</h3>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Current Location</span>
                <span className="text-white font-medium">{shipment.currentLocation}</span>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <h3 className="text-white font-semibold mb-6">
                Tracking History
                <span className="text-slate-500 font-normal text-sm ml-2">({shipment.events.length} events)</span>
              </h3>
              <div className="relative">
                {shipment.events.map((event, idx) => {
                  const evCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.PENDING;
                  const EvIcon = evCfg.icon;
                  const isLast = idx === shipment.events.length - 1;
                  const isFirst = idx === 0;

                  return (
                    <div key={event.id} className={`flex gap-4 ${isLast ? "" : "pb-6"}`}>
                      <div className="relative flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full ${evCfg.bg} border flex items-center justify-center flex-shrink-0 z-10 ${isFirst ? "ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-500/30" : ""}`}>
                          <EvIcon className={`w-5 h-5 ${evCfg.color}`} />
                        </div>
                        {!isLast && (
                          <div className="w-px h-full bg-gradient-to-b from-slate-600/60 to-slate-700/30 absolute top-10" />
                        )}
                      </div>
                      <div className="pb-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${evCfg.color}`}>
                            {event.status.replace(/_/g, " ")}
                          </span>
                          {event.locationCode && (
                            <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400 font-mono">
                              {event.locationCode}
                            </span>
                          )}
                        </div>
                        <p className="text-white text-sm mt-1">{event.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.timestamp), "MMM dd, yyyy 'at' hh:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-400 text-sm">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}
