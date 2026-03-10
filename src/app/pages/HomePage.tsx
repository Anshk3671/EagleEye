/**
 * HomePage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the main landing page of EagleEye. It is the FIRST page visitors see.
 *
 * It is made up of many small sections (components), each handling a different
 * part of the page:
 *  1. NewsTicker     — scrolling announcement bar at the top
 *  2. HeroSection    — large banner with a background image and call-to-action buttons
 *  3. WhyChooseUs    — 3 feature cards explaining EagleEye's advantages
 *  4. AboutUs        — company description with warehouse image
 *  5. ServicesSection— 4 service cards on a dark background
 *  6. CargoSafety    — 8 safety/trust feature icons
 *  7. Testimonials   — 3 customer reviews
 *  8. RequestCallback— contact form for customers to request a call
 *  9. FAQSection     — accordion (expand/collapse) FAQ
 * 10. Footer         — links and copyright at the bottom of the page
 * 11. NetworkMapSection — interactive India map showing hub locations
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  MapPin,
  Truck,
  Package,
  Smartphone,
  ShoppingCart,
  Shield,
  Headphones,
  MapPinned,
  Banknote,
  BarChart3,
  ChevronDown,
  ArrowRight,
  Clock,
  CheckCircle,
  Star,
  Phone,
  Mail,
  Building2,
  Users,
  Zap,
  Eye,
  Lock,
  Award,
  ThumbsUp,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   NEWS TICKER
   ═══════════════════════════════════════════════════════════════ */
// These are the messages that scroll across the news ticker at the top of the page
const TICKER_ITEMS = [
  "🚚 Track your shipment in real time across India.",
  "📦 For any queries, Our Support Team can be reached via the 'Contact Us' section on our website & app.",
  "🌐 Welcome to EagleEye — Delivering Trust, Speed, and Reliability Across India.",
  "⚡ Now offering same-day delivery in 50+ cities!",
];

// NewsTicker: Joins all ticker messages into one long string separated by bullets
// and uses a CSS animation (ticker) to scroll it from right to left continuously.
function NewsTicker() {
  const text = TICKER_ITEMS.join("   •   ");
  return (
    <div className="bg-blue-600 dark:bg-[#0d1117] text-white text-xs py-2 overflow-hidden whitespace-nowrap relative border-b border-blue-700 dark:border-slate-800/50 transition-colors duration-300">
      <div className="inline-block animate-[ticker_30s_linear_infinite]">
        <span className="px-4">{text}</span>
        <span className="px-4">{text}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO SECTION — Full-width hero with overlay text (Caravanchain style)
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative w-full min-h-[520px] lg:min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <img
        src="/images/hero-shipping-port.png"
        alt="Logistics port with shipping containers"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/70 to-[#0a1628]/30" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 flex items-center min-h-[520px] lg:min-h-[600px]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-300 text-xs font-medium uppercase tracking-wider">
              India's Trusted Logistics Partner
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
            Connect Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Business
            </span>{" "}
            To A World Of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Possibilities
            </span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed max-w-xl">
            EagleEye offers end-to-end logistics solutions across India — from express parcels 
            to bulk freight. Your shipment, our responsibility.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/track"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-300 no-underline group shadow-lg shadow-blue-600/25"
            >
              Track Shipment
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/client"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-300 no-underline border border-white/20"
            >
              Ship Now
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
            {[
              { value: "17,500+", label: "PIN Codes" },
              { value: "35+", label: "Logistics Hubs" },
              { value: "96%", label: "Coverage" },
              { value: "50+", label: "Cities" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-slate-400 text-sm mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WHY CHOOSE US — Feature cards (Caravanchain "Why traders choose us")
   ═══════════════════════════════════════════════════════════════ */
const WHY_CHOOSE = [
  {
    icon: Truck,
    title: "Supply Chain Solutions",
    desc: "Complete end-to-end supply chain management covering pickup, warehousing, and last-mile delivery across India.",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/10",
  },
  {
    icon: MapPin,
    title: "Pan-India Network",
    desc: "Covering 96% of India's pin codes with 35+ strategically located logistics hubs for maximum reach.",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-500/10",
  },
  {
    icon: Zap,
    title: "Express Logistics",
    desc: "Same-day and next-day delivery options in 50+ cities. Speed is our commitment.",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
  },
];

function WhyChooseUs() {
  return (
    <section className="py-20 px-6 md:px-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">
            Our Advantages
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 text-slate-900 dark:text-white">
            Why Businesses Choose{" "}
            <span className="text-blue-600 dark:text-blue-400">EagleEye</span>
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <div className="w-3 h-3 border-2 border-blue-600 rounded-full" />
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {WHY_CHOOSE.map((item) => (
            <div
              key={item.title}
              className="group p-8 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/50 hover:border-blue-300 dark:hover:border-blue-500/30 shadow-sm hover:shadow-xl dark:hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div
                className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <item.icon className={`w-8 h-8 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                {item.desc}
              </p>
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-semibold cursor-pointer group-hover:gap-2 transition-all">
                Read more <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABOUT US — Split layout (image + text)
   ═══════════════════════════════════════════════════════════════ */
function AboutUs() {
  return (
    <section className="py-20 px-6 md:px-12 bg-white dark:bg-[#0d1117] transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30">
            <img
              src="/images/about-warehouse.png"
              alt="EagleEye warehouse operations"
              className="w-full h-[400px] object-cover"
            />
            {/* Accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />
          </div>

          {/* Text */}
          <div>
            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">
              About Us
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-6 text-slate-900 dark:text-white leading-tight">
              An exclusive hub for all your{" "}
              <span className="text-blue-600 dark:text-blue-400">logistics needs</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              EagleEye Logistics is India's emerging end-to-end supply chain and logistics company, 
              providing reliable, innovative solutions for businesses of every size. From personal courier 
              to large-scale freight, our tech-driven platform connects senders and receivers across 
              17,500+ pin codes.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              With 35+ strategically located hubs, 650+ personnel, and a mission to simplify logistics, 
              we're building the future of Indian supply chain management.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: CheckCircle, text: "Real-time tracking" },
                { icon: Shield, text: "Secure handling" },
                { icon: Clock, text: "On-time delivery" },
                { icon: Users, text: "Dedicated support" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>

            <Link
              to="/track"
              className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-300 no-underline group shadow-lg shadow-blue-600/20"
            >
              Discover More
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SERVICES — Cards overlaid on logistics image (Caravanchain style)
   ═══════════════════════════════════════════════════════════════ */
const SERVICES_DATA = [
  {
    icon: Package,
    title: "E-commerce Logistics",
    desc: "Seamless integrations with all major e-commerce platforms for streamlined shipping.",
    link: "/services#ecommerce",
  },
  {
    icon: Truck,
    title: "Express Delivery",
    desc: "Same-day & next-day delivery services across 50+ cities in India.",
    link: "/services#express-premium",
  },
  {
    icon: Building2,
    title: "Warehousing & 3PL",
    desc: "End-to-end storage, inventory management, and order fulfillment solutions.",
    link: "/services#warehousing",
  },
  {
    icon: BarChart3,
    title: "Supply Chain Analytics",
    desc: "Real-time insights and data-driven optimization for your logistics operations.",
    link: "/services#analytics",
  },
];

function ServicesSection() {
  return (
    <section className="relative py-0">
      {/* Background image */}
      <div className="relative min-h-[500px]">
        <img
          src="/images/services-port-bg.png"
          alt="Port logistics background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/80 dark:bg-slate-950/85" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20">
          <div className="text-center mb-14">
            <span className="text-amber-400 text-sm font-bold uppercase tracking-wider">
              What We Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 text-white">
              Our Core Services
            </h2>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-12 h-1 bg-amber-400 rounded-full" />
              <div className="w-3 h-3 border-2 border-amber-400 rounded-full" />
              <div className="w-12 h-1 bg-amber-400 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES_DATA.map((s) => (
              <Link
                key={s.title}
                to={s.link}
                className="group bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer no-underline"
              >
                <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <s.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{s.desc}</p>
                <span className="inline-flex items-center gap-1 text-blue-400 text-sm font-semibold mt-3 group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   YOUR CARGO IS SAFE — Features grid (Caravanchain style)
   ═══════════════════════════════════════════════════════════════ */
const SAFETY_FEATURES = [
  { icon: Shield, title: "Privacy and Safety", desc: "Complete end-to-end privacy for all shipments." },
  { icon: Lock, title: "Integrity Guarantee", desc: "Package integrity preserved throughout transit." },
  { icon: Clock, title: "Long Shelf-Time", desc: "Secure storage facilities for extended periods." },
  { icon: Users, title: "Dedicated Staff", desc: "Trained workforce at every logistics hub." },
  { icon: Award, title: "Quality Service", desc: "Industry-leading service standards." },
  { icon: Eye, title: "Real-Time Tracking", desc: "Complete shipment visibility at every stage." },
  { icon: Banknote, title: "COD Remittance", desc: "Guaranteed payments within 2 days." },
  { icon: ThumbsUp, title: "Reliable Delivery", desc: "Consistent on-time delivery performance." },
];

function CargoSafety() {
  return (
    <section className="py-20 px-6 md:px-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">
            Trust & Security
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 text-slate-900 dark:text-white">
            Your Cargo Is{" "}
            <span className="text-blue-600 dark:text-blue-400">Safe</span> With Us
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <div className="w-3 h-3 border-2 border-blue-600 rounded-full" />
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {SAFETY_FEATURES.map((f) => (
            <div
              key={f.title}
              className="group text-center p-6 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/50 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 mx-auto bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{f.title}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS — "What they say about us"
   ═══════════════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  {
    name: "Rajesh Kumar",
    role: "E-commerce Seller, Mumbai",
    text: "EagleEye has transformed our delivery operations. The real-time tracking gives our customers confidence and the COD remittance is lightning fast.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Operations Manager, Delhi",
    text: "Reliable, affordable, and incredibly fast. EagleEye's pan-India coverage means we never have to worry about hard-to-reach pin codes.",
    rating: 5,
  },
  {
    name: "Vikram Patel",
    role: "Startup Founder, Bangalore",
    text: "Their API integrations with our Shopify store were seamless. EagleEye is the logistics partner every D2C brand needs.",
    rating: 5,
  },
];

function Testimonials() {
  return (
    <section className="py-20 px-6 md:px-12 bg-white dark:bg-[#0d1117] transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-amber-500 dark:text-amber-400 text-sm font-bold uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 text-slate-900 dark:text-white">
            What They Say{" "}
            <span className="text-blue-600 dark:text-blue-400">About Us</span>
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-12 h-1 bg-amber-500 rounded-full" />
            <div className="w-3 h-3 border-2 border-amber-500 rounded-full" />
            <div className="w-12 h-1 bg-amber-500 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="p-8 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/50 hover:shadow-xl transition-all duration-300 relative"
            >
              {/* Quote mark */}
              <div className="absolute top-6 right-8 text-6xl font-serif text-blue-100 dark:text-blue-900/30 pointer-events-none leading-none">
                "
              </div>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 relative z-10">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REQUEST A CALLBACK — Contact form
   ═══════════════════════════════════════════════════════════════ */
function RequestCallback() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // handleSubmit: Called when user clicks "Send Request" button
  // Validates form, sends data to backend API, and shows success/error message
  async function handleSubmit() {
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/api/callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Failed to submit");
      }
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-20 px-6 md:px-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Info */}
          <div>
            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">
              Get In Touch
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-6 text-slate-900 dark:text-white">
              Request A{" "}
              <span className="text-blue-600 dark:text-blue-400">Call Back</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              Need help with your logistics? Our team is ready to assist you with customized 
              shipping solutions for your business.
            </p>

            <div className="space-y-4">
              {[
                { icon: Phone, label: "+91 98765 43210" },
                { icon: Mail, label: "support@eagleeye.in" },
                { icon: MapPin, label: "Pan-India Operations" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-8 border border-slate-200 dark:border-slate-800/50 shadow-lg">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Request Submitted!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Our team will call you back shortly.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-all cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your shipping needs..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-300 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Send Request"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FAQs
   ═══════════════════════════════════════════════════════════════ */
const FAQS = [
  {
    q: "What percentage of India does EagleEye cover?",
    a: "EagleEye covers over 96% of India's pin codes, reaching more than 17,500+ pin codes across the country, including remote and tier-3 cities.",
  },
  {
    q: "What is PUDO in EagleEye services?",
    a: "PUDO stands for Pick-Up and Drop-Off. It's a network of convenient partner outlets where you can drop off or collect your parcels without waiting for a delivery person.",
  },
  {
    q: "How can I track my parcel?",
    a: "You can track your parcel by entering your Air Waybill (AWB) number on our Track page. You'll get real-time updates on your shipment's location and status.",
  },
  {
    q: "What types of shipments does EagleEye handle?",
    a: "EagleEye handles personal couriers, bulk shipping for businesses, and e-commerce shipments with COD, returns, and platform integrations across India.",
  },
  {
    q: "Can I integrate EagleEye with my e-commerce store?",
    a: "Absolutely! EagleEye offers seamless integrations with all major e-commerce platforms including Shopify, WooCommerce, Magento, and custom APIs for enterprise solutions.",
  },
];

// FAQSection: Shows frequently asked questions in an accordion format.
// Clicking a question expands/collapses its answer. Only one can be open at a time.
function FAQSection() {
  // openIndex: tracks which FAQ item is currently expanded (null = all collapsed)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-6 md:px-12 bg-white dark:bg-[#0d1117] transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">
            Common Questions
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 text-slate-900 dark:text-white">
            Frequently Asked{" "}
            <span className="text-blue-600 dark:text-blue-400">Questions</span>
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <div className="w-3 h-3 border-2 border-blue-600 rounded-full" />
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors cursor-pointer"
              >
                <span className="text-slate-800 dark:text-slate-200 font-medium text-sm md:text-base pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-60" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-4 pt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-[#0a1628] text-white border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">
                EagleEye
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Delivering Trust, Speed, and Reliability Across India.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-300">
              Services
            </h4>
            <ul className="space-y-2.5">
              {["Express Parcel", "Bulk Shipping", "E-Commerce", "Express Delivery"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-slate-400 hover:text-white text-sm cursor-pointer transition-colors">
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-300">
              Company
            </h4>
            <ul className="space-y-2.5">
              {["About Us", "Careers", "Blog", "Press"].map((item) => (
                <li key={item}>
                  <span className="text-slate-400 hover:text-white text-sm cursor-pointer transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-300">
              Support
            </h4>
            <ul className="space-y-2.5">
              {["Help Center", "Contact Us", "FAQs", "Terms of Service"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-slate-400 hover:text-white text-sm cursor-pointer transition-colors">
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © 2026 EagleEye Logistics. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <img
              src="https://flagcdn.com/20x15/in.png"
              alt="India"
              className="w-5 h-4 rounded-sm"
            />
            <span className="text-slate-400 text-xs font-medium">INDIA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OUR NETWORK — Interactive India Map with Hub Locations
   ═══════════════════════════════════════════════════════════════ */
const ZONE_COLORS: Record<string, string> = {
  North: "#3b82f6",
  South: "#22c55e",
  East: "#f59e0b",
  West: "#8b5cf6",
  Central: "#ef4444",
  Northeast: "#06b6d4",
};

// NetworkMapSection: Shows an interactive India map with all logistics hub locations.
// Users can filter by zone (North/South/East etc.) and click a hub to see its details.
function NetworkMapSection() {
  const [activeZone, setActiveZone] = useState<string | null>(null); // currently selected zone filter
  const [selectedHub, setSelectedHub] = useState<string | null>(null); // currently clicked hub
  const stats = getHubStats(); // total counts for hubs, agents, zones, states

  // Convert hubs to map markers
  const hubMarkers: MapMarker[] = useMemo(() => {
    return HUB_LOCATIONS
      .filter(h => !activeZone || h.zone === activeZone)
      .map(h => ({
        id: h.code,
        lat: h.lat,
        lng: h.lng,
        label: h.name,
        sublabel: `${h.city}, ${h.state}`,
        type: "hub" as const,
        status: h.status,
        color: ZONE_COLORS[h.zone] || "#3b82f6",
        tier: h.tier,
        meta: {
          "Zone": h.zone,
          "Tier": `Tier ${h.tier}`,
          "Capacity": `${h.capacity}%`,
          "Active Agents": h.activeAgents,
        },
      }));
  }, [activeZone]);

  // Convert connections to routes
  const connectionRoutes: MapRoute[] = useMemo(() => {
    return HUB_CONNECTIONS
      .filter(c => {
        if (!activeZone) return true;
        const from = getHubByCode(c.from);
        const to = getHubByCode(c.to);
        return from?.zone === activeZone || to?.zone === activeZone;
      })
      .map(c => {
        const from = getHubByCode(c.from);
        const to = getHubByCode(c.to);
        if (!from || !to) return null;
        return {
          id: `${c.from}-${c.to}`,
          points: [[from.lat, from.lng], [to.lat, to.lng]] as [number, number][],
          color: c.type === "primary" ? "#3b82f6" : "#64748b",
          weight: c.type === "primary" ? 2.5 : 1.5,
          opacity: c.type === "primary" ? 0.5 : 0.25,
          dashed: true,
        };
      })
      .filter(Boolean) as MapRoute[];
  }, [activeZone]);

  const zones = ["North", "South", "East", "West", "Central", "Northeast"];

  return (
    <section className="py-20 px-6 md:px-12 bg-white dark:bg-[#0d1117] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">
            Pan-India Presence
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 text-slate-900 dark:text-white">
            Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
              Network
            </span>{" "}
            Across India
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <div className="w-3 h-3 border-2 border-blue-600 rounded-full" />
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
          </div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm">
            {stats.total} strategically located hubs across {stats.states} states, covering 96% of India's pin codes
          </p>
        </div>

        {/* Zone filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveZone(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
              !activeZone
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25"
                : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
            }`}
          >
            All Zones ({stats.total})
          </button>
          {zones.map(zone => {
            const count = HUB_LOCATIONS.filter(h => h.zone === zone).length;
            const color = ZONE_COLORS[zone];
            return (
              <button
                key={zone}
                onClick={() => setActiveZone(activeZone === zone ? null : zone)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
                  activeZone === zone
                    ? "text-white shadow-lg border-transparent"
                    : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                }`}
                style={activeZone === zone ? { background: color, boxShadow: `0 8px 20px ${color}40` } : {}}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: color }} />
                {zone} ({count})
              </button>
            );
          })}
        </div>

        {/* Map + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/50 shadow-xl dark:shadow-black/20">
            <IndiaMap
              theme="auto"
              height="550px"
              showMask={true}
              showBorder={true}
              restrictToIndia={true}
              scrollWheelZoom={false}
              className="rounded-2xl"
            >
              <RouteLayer routes={connectionRoutes} />
              <MarkerLayer
                markers={hubMarkers}
                onMarkerClick={(id) => setSelectedHub(id === selectedHub ? null : id)}
                selectedId={selectedHub}
              />
            </IndiaMap>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            {/* Network stats card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Network Overview</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Total Hubs", value: stats.total, color: "text-blue-500" },
                  { label: "Tier-1 (Major)", value: stats.tier1, color: "text-emerald-500" },
                  { label: "Tier-2 (Regional)", value: stats.tier2, color: "text-amber-500" },
                  { label: "Tier-3 (Local)", value: stats.tier3, color: "text-purple-500" },
                  { label: "Active Agents", value: stats.totalAgents, color: "text-cyan-500" },
                  { label: "Zones", value: stats.zones, color: "text-rose-500" },
                  { label: "States", value: stats.states, color: "text-indigo-500" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone legend card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Zone Legend</span>
              </div>
              <div className="space-y-2.5">
                {zones.map(zone => (
                  <div
                    key={zone}
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setActiveZone(activeZone === zone ? null : zone)}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ZONE_COLORS[zone] }} />
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex-grow">{zone} Zone</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {HUB_LOCATIONS.filter(h => h.zone === zone).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected hub detail */}
            {selectedHub && (() => {
              const hub = HUB_LOCATIONS.find(h => h.code === selectedHub);
              if (!hub) return null;
              return (
                <div className="p-5 rounded-2xl border-2 transition-all duration-300" style={{ borderColor: ZONE_COLORS[hub.zone], background: `${ZONE_COLORS[hub.zone]}08` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: ZONE_COLORS[hub.zone] }} />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{hub.name}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div>{hub.city}, {hub.state}</div>
                    <div>Zone: <span className="font-semibold text-slate-700 dark:text-slate-300">{hub.zone}</span></div>
                    <div>Tier: <span className="font-semibold text-slate-700 dark:text-slate-300">{hub.tier}</span></div>
                    <div className="flex justify-between">
                      <span>Capacity</span>
                      <span className={hub.capacity >= 80 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>{hub.capacity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Agents</span>
                      <span className="font-bold text-blue-500">{hub.activeAgents}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════════════ */
// ─────────────────────────────────────────────────────────────────────────────
// HomePage: The root component that assembles all sections in order.
// Each section is a separate component defined above, making the code modular.
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="w-full">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <NewsTicker />
      <HeroSection />
      <WhyChooseUs />
      <AboutUs />
      <ServicesSection />
      <CargoSafety />
      <Testimonials />
      <RequestCallback />
      <FAQSection />
      <Footer />
    </div>
  );
}
