/**
 * ServicesPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The "Our Services" information page — describes all EagleEye service offerings.
 *
 * SECTIONS:
 *  - Express Parcel   : 1-2 day delivery for standard packages
 *  - Express Premium  : Same/next day delivery for urgent shipments
 *  - E-Commerce       : 2-3 day delivery with COD support for online sellers
 *  - Warehousing & 3PL: Storage and order fulfillment services
 *  - LTL Freight      : Less-than-truckload shipping for 30kg+ cargo
 *  - Supply Chain Analytics: Data dashboard for business clients
 *
 * This is a STATIC informational page — no API calls, just content.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowLeft,
  Package,
  Zap,
  Building2,
  Truck,
  ShoppingCart,
  BarChart3,
  Warehouse,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  ChevronDown,
} from "lucide-react";

// ── Service Data ──
const SERVICES = [
  {
    id: "express-parcel",
    icon: Package,
    title: "Express Parcel",
    tagline: "Fast, door-to-door parcel delivery with real-time tracking",
    color: "blue",
    features: [
      "Door-to-door pickup & delivery",
      "Real-time tracking with SMS/email updates",
      "Delivery in 1–2 business days",
      "Up to 30 kg per shipment",
      "Insurance coverage up to ₹50,000",
      "Proof of delivery with e-signature",
    ],
    pricing: [
      { weight: "Up to 500g", price: "₹60" },
      { weight: "500g – 1 kg", price: "₹80" },
      { weight: "1 kg – 5 kg", price: "₹120" },
      { weight: "5 kg – 10 kg", price: "₹200" },
      { weight: "10 kg – 30 kg", price: "₹350" },
    ],
    coverage: "17,500+ PIN codes across India",
    timeline: "1–2 business days (metro), 2–3 days (tier-2/3 cities)",
  },
  {
    id: "express-premium",
    icon: Zap,
    title: "Express Premium",
    tagline: "Same-day and next-day delivery for urgent shipments",
    color: "amber",
    features: [
      "Same-day delivery within city (order before 11 AM)",
      "Next-day delivery across 50+ cities",
      "Priority handling at all hubs",
      "Dedicated agent assignment",
      "Live GPS tracking of delivery agent",
      "Time-slot delivery options",
    ],
    pricing: [
      { weight: "Up to 500g", price: "₹150" },
      { weight: "500g – 1 kg", price: "₹200" },
      { weight: "1 kg – 5 kg", price: "₹300" },
      { weight: "5 kg – 10 kg", price: "₹450" },
      { weight: "10 kg+", price: "Custom quote" },
    ],
    coverage: "50+ metros and tier-1 cities",
    timeline: "Same day (intra-city) | Next day (inter-city)",
  },
  {
    id: "3pl",
    icon: Building2,
    title: "3PL (Third-Party Logistics)",
    tagline: "End-to-end storage, inventory, and order fulfillment solutions",
    color: "purple",
    features: [
      "Warehouse management system (WMS)",
      "Pick, pack, and ship services",
      "Inventory tracking & analytics",
      "Multi-channel order fulfillment",
      "Returns management & processing",
      "Climate-controlled storage available",
    ],
    pricing: [
      { weight: "Storage per sqft/month", price: "₹15" },
      { weight: "Pick & Pack per order", price: "₹25" },
      { weight: "Inventory management", price: "Custom" },
      { weight: "Returns processing", price: "₹20/item" },
    ],
    coverage: "Warehouses in 8 major cities",
    timeline: "Same-day dispatch for orders before 2 PM",
  },
  {
    id: "ltl",
    icon: Truck,
    title: "LTL (Less Than Truckload)",
    tagline: "Cost-effective freight shipping for smaller loads",
    color: "emerald",
    features: [
      "Shared trucking for cost savings",
      "Loads from 30 kg to 3,000 kg",
      "Hub-to-hub and door delivery options",
      "Palletized cargo handling",
      "Real-time freight tracking",
      "Scheduled pickup windows",
    ],
    pricing: [
      { weight: "30 kg – 100 kg", price: "₹8/kg" },
      { weight: "100 kg – 500 kg", price: "₹6/kg" },
      { weight: "500 kg – 1,000 kg", price: "₹5/kg" },
      { weight: "1,000 kg – 3,000 kg", price: "₹4/kg" },
    ],
    coverage: "All 35+ hub-connected routes across India",
    timeline: "3–5 business days depending on distance",
  },
  {
    id: "bulk-shipping",
    icon: Warehouse,
    title: "Bulk Shipping",
    tagline: "Large-scale logistics for high-volume business needs",
    color: "rose",
    features: [
      "Full truckload (FTL) options",
      "Dedicated fleet allocation",
      "Volume discounts up to 40%",
      "Customized packaging solutions",
      "Dedicated account manager",
      "Monthly billing with credit facility",
    ],
    pricing: [
      { weight: "3,000 kg – 5,000 kg", price: "₹3.5/kg" },
      { weight: "5,000 kg – 10,000 kg", price: "₹3/kg" },
      { weight: "10,000 kg+", price: "Custom quote" },
      { weight: "FTL (Full Truck)", price: "Starting ₹15,000" },
    ],
    coverage: "Pan-India with cross-docking at all hubs",
    timeline: "2–4 days for FTL, 3–6 days for partial loads",
  },
  {
    id: "ecommerce",
    icon: ShoppingCart,
    title: "E-Commerce Logistics",
    tagline: "Platform integrations, COD, returns — built for online businesses",
    color: "cyan",
    features: [
      "Shopify, WooCommerce, Magento integrations",
      "Cash on Delivery (COD) with 2-day remittance",
      "Automated return pickups",
      "NDR (Non-Delivery Report) management",
      "Branded tracking pages",
      "API for custom platform integrations",
    ],
    pricing: [
      { weight: "Up to 500g", price: "₹45" },
      { weight: "500g – 1 kg", price: "₹65" },
      { weight: "1 kg – 2 kg", price: "₹85" },
      { weight: "COD handling", price: "₹25 + 1.5%" },
      { weight: "Return pickup", price: "₹50" },
    ],
    coverage: "96% of India's PIN codes",
    timeline: "2–3 days (metro), 3–5 days (rest of India)",
  },
  {
    id: "warehousing",
    icon: Building2,
    title: "Warehousing & Storage",
    tagline: "Secure, scalable storage facilities across India",
    color: "indigo",
    features: [
      "Grade-A warehouse facilities",
      "24/7 CCTV surveillance & security",
      "Climate-controlled zones",
      "Automated inventory system",
      "Flexible lease terms (monthly/yearly)",
      "Loading dock & forklift access",
    ],
    pricing: [
      { weight: "Standard storage /sqft", price: "₹12/month" },
      { weight: "Climate-controlled /sqft", price: "₹20/month" },
      { weight: "Handling charges", price: "₹5/unit" },
      { weight: "Minimum commitment", price: "500 sqft" },
    ],
    coverage: "8 locations across Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad",
    timeline: "Instant availability in most locations",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Supply Chain Analytics",
    tagline: "Real-time insights and data-driven optimization for logistics",
    color: "teal",
    features: [
      "Real-time shipment dashboard",
      "Delivery performance analytics",
      "Route optimization insights",
      "Cost analysis & optimization",
      "SLA compliance tracking",
      "Custom report generation",
    ],
    pricing: [
      { weight: "Basic plan", price: "Free with shipping" },
      { weight: "Pro analytics", price: "₹2,999/month" },
      { weight: "Enterprise", price: "Custom pricing" },
    ],
    coverage: "Available to all EagleEye customers",
    timeline: "Instant access via dashboard",
  },
];

const COLOR_MAP: Record<string, { accent: string; bg: string; border: string; text: string }> = {
  blue: { accent: "bg-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
  amber: { accent: "bg-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  purple: { accent: "bg-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  emerald: { accent: "bg-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  rose: { accent: "bg-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" },
  cyan: { accent: "bg-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
  indigo: { accent: "bg-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
  teal: { accent: "bg-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20", text: "text-teal-400" },
};

export default function ServicesPage() {
  const location = useLocation();
  const [expandedService, setExpandedService] = useState<string | null>(null);

  // Auto-scroll to anchor from hash
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
        setExpandedService(id);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-6 no-underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4 block">
            <Package className="w-4 h-4 inline" />
            <span>Our Services</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Logistics Solutions For Every Need
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            From express parcels to bulk freight, warehousing to analytics — EagleEye offers comprehensive
            logistics services across India.
          </p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const c = COLOR_MAP[s.color];
            return (
              <button
                key={s.id}
                onClick={() => {
                  setExpandedService(expandedService === s.id ? null : s.id);
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  expandedService === s.id
                    ? `${c.bg} ${c.border} ${c.text}`
                    : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                {s.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services List */}
      <div className="max-w-6xl mx-auto px-6 pb-16 space-y-6">
        {SERVICES.map((service) => {
          const c = COLOR_MAP[service.color];
          const isExpanded = expandedService === service.id;
          const Icon = service.icon;

          return (
            <div
              key={service.id}
              id={service.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden scroll-mt-24 ${
                isExpanded ? `${c.border} ${c.bg}` : "border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/50"
              }`}
            >
              {/* Header (always visible) */}
              <button
                onClick={() => setExpandedService(isExpanded ? null : service.id)}
                className="w-full flex items-center gap-4 p-6 text-left cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-7 h-7 ${c.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white">{service.title}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">{service.tagline}</p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform duration-300 flex-shrink-0 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Expanded Content */}
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  isExpanded ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Features */}
                  <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-700/30">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${c.text}`} />
                      Features
                    </h4>
                    <ul className="space-y-2.5">
                      {service.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${c.text}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing */}
                  <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-700/30">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <span className={`text-lg ${c.text}`}>₹</span>
                      Pricing
                    </h4>
                    <div className="space-y-2">
                      {service.pricing.map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                          <span className="text-slate-400 text-sm">{p.weight}</span>
                          <span className={`font-bold text-sm ${c.text}`}>{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coverage & Timeline */}
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-700/30">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${c.text}`} />
                        Coverage
                      </h4>
                      <p className="text-slate-300 text-sm">{service.coverage}</p>
                    </div>
                    <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-700/30">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${c.text}`} />
                        Delivery Timeline
                      </h4>
                      <p className="text-slate-300 text-sm">{service.timeline}</p>
                    </div>
                    <Link
                      to="/client"
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all no-underline ${c.bg} border ${c.border} ${c.text} hover:brightness-125`}
                    >
                      Ship Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
