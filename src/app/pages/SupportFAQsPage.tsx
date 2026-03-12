/**
 * SupportFAQsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The FAQ (Frequently Asked Questions) page for customer self-service.
 *
 * WHAT IT SHOWS:
 *  - Categorized list of questions and answers about EagleEye services
 *  - Accordion (expand/collapse) format for easy browsing
 *  - Search functionality to find answers quickly
 *
 * This is a STATIC informational page — no API calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { Link } from "react-router";
import {
  ChevronDown,
  HelpCircle,
  ArrowLeft,
  Search,
  MessageCircle,
} from "lucide-react";

// ─── FAQ Data ───────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    name: "Shipping & Delivery",
    faqs: [
      {
        q: "What percentage of India does EagleEye cover?",
        a: "EagleEye covers over 96% of India's pin codes, reaching more than 17,500+ pin codes across the country, including remote and tier-3 cities.",
      },
      {
        q: "How long does delivery take?",
        a: "Delivery times depend on the service selected: Express Premium offers same/next-day delivery, Express Parcel takes 1-2 days, and Standard shipping takes 2-5 days depending on distance.",
      },
      {
        q: "Do you offer same-day delivery?",
        a: "Yes! Our Express Premium service offers same-day delivery in 50+ cities across India. Select this option during booking for the fastest delivery.",
      },
      {
        q: "What happens if my delivery is delayed?",
        a: "If your delivery is delayed beyond the estimated time, you can track it in real-time or raise a query through our Customer Care section. Our team will investigate and update you within 24 hours.",
      },
    ],
  },
  {
    name: "Tracking",
    faqs: [
      {
        q: "How can I track my parcel?",
        a: "You can track your parcel by entering your Air Waybill (AWB) number on our Track page. You'll get real-time updates on your shipment's location and status.",
      },
      {
        q: "What is an AWB number?",
        a: "AWB stands for Air Waybill. It's a unique tracking number assigned to your shipment when you book. You'll receive it via email/SMS after booking. It looks like: EE-XXX-XXXX.",
      },
      {
        q: "Can I get notifications about my shipment?",
        a: "Yes! Go to your Account → Notifications and subscribe to real-time updates for any shipment using the AWB number. You can choose which events to be notified about.",
      },
    ],
  },
  {
    name: "Payments & Pricing",
    faqs: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Prepaid payments (UPI, Credit/Debit Card, Net Banking) and Cash on Delivery (COD). COD is available for most serviceable pin codes.",
      },
      {
        q: "How is the shipping rate calculated?",
        a: "Shipping rates depend on: origin & destination pin codes, package weight, dimensions, and service type selected. Use our Rate Calculator in the Ship Now section for instant estimates.",
      },
      {
        q: "Is there a minimum order value?",
        a: "There's no minimum order value. However, minimum chargeable weight is 0.5 kg for Express services and 30 kg for LTL (Less Than Truckload).",
      },
    ],
  },
  {
    name: "Services",
    faqs: [
      {
        q: "What is PUDO in EagleEye services?",
        a: "PUDO stands for Pick-Up and Drop-Off. It's a network of convenient partner outlets where you can drop off or collect your parcels without waiting for a delivery person.",
      },
      {
        q: "What types of shipments does EagleEye handle?",
        a: "EagleEye handles personal couriers, bulk shipping for businesses, and e-commerce shipments with COD, returns, and platform integrations across India.",
      },
      {
        q: "Can I integrate EagleEye with my e-commerce store?",
        a: "Absolutely! EagleEye offers seamless integrations with all major e-commerce platforms including Shopify, WooCommerce, Magento, and custom APIs for enterprise solutions.",
      },
    ],
  },
];

export default function SupportFAQsPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Flatten and filter FAQs
  const allFaqs = FAQ_CATEGORIES.flatMap((cat) =>
    cat.faqs.map((faq) => ({ ...faq, category: cat.name }))
  );

  const filteredFaqs = allFaqs.filter((faq) => {
    const matchesSearch = !searchQuery || 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 no-underline transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-4 ml-0 block mt-2">
            <HelpCircle className="w-4 h-4 inline" />
            <span className="ml-1">Frequently Asked Questions</span>
          </div>
          <h1 className="text-3xl font-bold text-white">FAQs</h1>
          <p className="text-slate-400 mt-1">Find answers to common questions about our services.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/40 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !activeCategory
                ? "bg-blue-600 text-white"
                : "bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/40"
            }`}
          >
            All
          </button>
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat.name
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/40"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No FAQs found matching your search.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, i) => {
              const key = `${faq.category}-${i}`;
              const isOpen = openIndex === key;
              return (
                <div
                  key={key}
                  className="border border-slate-700/40 rounded-xl overflow-hidden transition-all hover:border-slate-600/50"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 pr-4">
                      <span className="text-slate-200 font-medium text-sm md:text-base block">
                        {faq.q}
                      </span>
                      <span className="text-blue-400/60 text-xs mt-1 block">{faq.category}</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-60" : "max-h-0"
                    }`}
                  >
                    <p className="px-6 pb-4 pt-2 text-slate-400 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Still need help? */}
        <div className="mt-10 p-6 bg-slate-800/30 rounded-xl border border-slate-700/30 text-center">
          <h3 className="text-white font-bold text-lg mb-2">Still have questions?</h3>
          <p className="text-slate-400 text-sm mb-4">Can't find what you're looking for? Contact our support team.</p>
          <Link to="/support/customer-care" className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all no-underline">
            <MessageCircle className="w-4 h-4" />
            Contact Customer Care
          </Link>
        </div>
      </div>
    </div>
  );
}
