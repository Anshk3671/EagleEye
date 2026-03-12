/**
 * SupportServiceGuidePage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The service guide page explaining how to use EagleEye's various shipping services.
 *
 * SECTIONS:
 *  - Step-by-step booking guide
 *  - Packaging guidelines and prohibited items
 *  - Delivery timeline expectations per service type
 *  - COD (Cash on Delivery) policy
 *  - Claims and dispute resolution process
 *
 * This is a STATIC informational page — no API calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Link } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  Package,
  Truck,
  Building2,
  BarChart3,
  MapPin,
  Zap,
  ArrowRight,
  CheckCircle,
  ShoppingCart,
  Shield,
} from "lucide-react";

// ─── Service Data ──────────────────────────────────────
const SERVICES = [
  {
    icon: Package,
    title: "Express Parcel",
    desc: "Fast, door-to-door parcel delivery with real-time tracking across India.",
    delivery: "1–2 Business Days",
    minWeight: "0.5 kg",
    features: ["Real-time tracking", "Door-to-door delivery", "SMS/Email notifications", "Insurance available"],
    useCases: ["Personal couriers", "E-commerce orders", "Document delivery"],
    color: "blue",
  },
  {
    icon: Zap,
    title: "Express Premium",
    desc: "Priority handling with same-day and next-day delivery for urgent shipments.",
    delivery: "Same / Next Day",
    minWeight: "0.5 kg",
    features: ["Same-day delivery", "Priority handling", "Dedicated support", "Insurance included"],
    useCases: ["Urgent documents", "Medical supplies", "High-value items"],
    color: "amber",
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce Logistics",
    desc: "Seamless integrations with all major e-commerce platforms for streamlined shipping.",
    delivery: "2–3 Business Days",
    minWeight: "0.5 kg",
    features: ["Platform integrations", "COD available", "Return management", "Bulk shipping"],
    useCases: ["Shopify stores", "Amazon sellers", "D2C brands"],
    color: "emerald",
  },
  {
    icon: Truck,
    title: "LTL (Less Than Truckload)",
    desc: "Cost-effective freight shipping for smaller loads that don't fill a full truck.",
    delivery: "3–5 Business Days",
    minWeight: "30 kg",
    features: ["Partial truck loads", "Cost-effective", "Route optimization", "Scheduled pickups"],
    useCases: ["Small businesses", "Partial shipments", "Regional distribution"],
    color: "purple",
  },
  {
    icon: Building2,
    title: "3PL / Warehousing",
    desc: "End-to-end storage, inventory management, and order fulfillment solutions.",
    delivery: "Custom SLA",
    minWeight: "—",
    features: ["Inventory management", "Order fulfillment", "Multi-location storage", "Automated picking"],
    useCases: ["Growing brands", "Seasonal storage", "Multi-channel sellers"],
    color: "cyan",
  },
  {
    icon: BarChart3,
    title: "Bulk Shipping",
    desc: "Large-scale logistics solutions for high-volume business needs across India.",
    delivery: "5–7 Business Days",
    minWeight: "500 kg",
    features: ["Volume discounts", "Dedicated fleet", "Route planning", "Real-time tracking"],
    useCases: ["Manufacturing", "Wholesale", "Industrial logistics"],
    color: "rose",
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  blue: { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-400", iconBg: "bg-blue-500/10" },
  amber: { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-400", iconBg: "bg-amber-500/10" },
  emerald: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-400", iconBg: "bg-emerald-500/10" },
  purple: { bg: "bg-purple-500/5", border: "border-purple-500/20", text: "text-purple-400", iconBg: "bg-purple-500/10" },
  cyan: { bg: "bg-cyan-500/5", border: "border-cyan-500/20", text: "text-cyan-400", iconBg: "bg-cyan-500/10" },
  rose: { bg: "bg-rose-500/5", border: "border-rose-500/20", text: "text-rose-400", iconBg: "bg-rose-500/10" },
};

export default function SupportServiceGuidePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 no-underline transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-4 ml-0 block mt-2">
            <BookOpen className="w-4 h-4 inline" />
            <span className="ml-1">Service Guide</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Our Services</h1>
          <p className="text-slate-400 mt-1">Everything you need to know about EagleEye's logistics solutions.</p>
        </div>

        {/* Service Cards */}
        <div className="space-y-6">
          {SERVICES.map((service) => {
            const colors = COLOR_MAP[service.color];
            return (
              <div
                key={service.title}
                className={`p-6 rounded-2xl border ${colors.border} ${colors.bg} transition-all hover:shadow-lg group`}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left — Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                        <service.icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{service.title}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`text-xs font-semibold ${colors.text}`}>{service.delivery}</span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-slate-500 text-xs">Min: {service.minWeight}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{service.desc}</p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2">
                      {service.features.map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle className={`w-3.5 h-3.5 ${colors.text} flex-shrink-0`} />
                          <span className="text-slate-300 text-sm">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right — Use Cases + CTA */}
                  <div className="lg:w-64 flex flex-col justify-between">
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-semibold">Best For</p>
                      <div className="space-y-1.5">
                        {service.useCases.map((uc) => (
                          <div key={uc} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace("text-", "bg-")}`} />
                            <span className="text-slate-400 text-sm">{uc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link
                      to="/client"
                      className={`mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all no-underline ${colors.text} bg-white/5 hover:bg-white/10 border ${colors.border}`}
                    >
                      Ship Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-12 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/30">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Service Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40">
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wider">Feature</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Express Parcel</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Premium</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">E-Commerce</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">LTL</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">3PL</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Bulk</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  { feature: "Same-day delivery", values: ["❌", "✅", "❌", "❌", "❌", "❌"] },
                  { feature: "Real-time tracking", values: ["✅", "✅", "✅", "✅", "✅", "✅"] },
                  { feature: "COD Available", values: ["✅", "✅", "✅", "❌", "✅", "❌"] },
                  { feature: "Insurance", values: ["Optional", "Included", "Optional", "Optional", "Included", "Optional"] },
                  { feature: "Min Weight", values: ["0.5 kg", "0.5 kg", "0.5 kg", "30 kg", "—", "500 kg"] },
                  { feature: "Delivery Time", values: ["1–2d", "Same/Next", "2–3d", "3–5d", "Custom", "5–7d"] },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800/40 last:border-0">
                    <td className="py-3 px-4 text-slate-400 font-medium">{row.feature}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="py-3 px-3 text-center">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
