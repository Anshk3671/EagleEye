/**
 * SupportCustomerCarePage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The customer support / contact page.
 *
 * WHAT IT SHOWS:
 *  - "Submit a Query" form: customer types their issue and submits it
 *  - Contact details: phone, email, physical address
 *  - Support chat widget (placeholder)
 *  - Links to FAQs and Service Guide
 *
 * Submitted queries are sent to the backend and appear in the Admin Queries page.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import {
  Star,
  HelpCircle,
  Headphones,
  CheckCheck,
  Send,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router";

// ─── Types ──────────────────────────────────────────────
type Tab = "feedback" | "query";

// ─── Main Component ─────────────────────────────────────
export default function SupportCustomerCarePage() {
  const [activeTab, setActiveTab] = useState<Tab>("feedback");

  const tabs = [
    { id: "feedback" as Tab, label: "Delivery Feedback", icon: Star, desc: "Rate your delivery experience" },
    { id: "query" as Tab, label: "Raise a Query", icon: HelpCircle, desc: "Report an issue or ask a question" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 no-underline transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-4 ml-0 block mt-2">
            <Headphones className="w-4 h-4 inline" />
            <span className="ml-1">Customer Care</span>
          </div>
          <h1 className="text-3xl font-bold text-white">How Can We Help?</h1>
          <p className="text-slate-400 mt-1">Submit delivery feedback or raise a support query — we're here 24/7.</p>
        </div>

        {/* Tab Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-500/5"
                  : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/50"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-blue-500/20"
                  : "bg-slate-700/40"
              }`}>
                <tab.icon className={`w-6 h-6 ${
                  activeTab === tab.id ? "text-blue-400" : "text-slate-400"
                }`} />
              </div>
              <div>
                <h3 className={`font-bold text-base ${
                  activeTab === tab.id ? "text-blue-400" : "text-white"
                }`}>{tab.label}</h3>
                <p className="text-slate-500 text-sm mt-0.5">{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === "feedback" && <DeliveryFeedback />}
          {activeTab === "query" && <RaiseQuery />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DELIVERY FEEDBACK
// ═══════════════════════════════════════════════════════

function DeliveryFeedback() {
  const [awb, setAwb] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("delivery_speed");
  const [submitted, setSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("ee_feedback") || "[]");
    setExistingFeedback(stored);
  }, [submitted]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!awb.trim() || rating === 0) return;
    const entry = {
      id: crypto.randomUUID(),
      awb: awb.trim().toUpperCase(),
      rating,
      comment,
      category,
      date: new Date().toISOString(),
    };
    const stored = JSON.parse(localStorage.getItem("ee_feedback") || "[]");
    localStorage.setItem("ee_feedback", JSON.stringify([entry, ...stored]));
    setSubmitted(true);
    setAwb(""); setRating(0); setComment("");
    setTimeout(() => setSubmitted(false), 3000);
  }

  const categories = [
    { value: "delivery_speed", label: "Delivery Speed" },
    { value: "packaging", label: "Packaging" },
    { value: "agent_behavior", label: "Agent Behavior" },
    { value: "overall", label: "Overall Experience" },
  ];

  const ratingLabels = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          Rate Your Delivery
        </h2>
        <p className="text-slate-400 text-sm mb-6">Share your experience to help us improve.</p>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-lg">Thank You!</h3>
            <p className="text-slate-400 text-sm mt-1">Your feedback has been recorded.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">AWB Number</label>
              <input
                type="text"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                placeholder="e.g. EE-742-9910"
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`py-2 px-3 rounded-lg border text-sm transition-all ${
                      category === c.value
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                        : "bg-slate-700/30 border-slate-600/30 text-slate-400 hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-3">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hovered || rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
                {(hovered || rating) > 0 && (
                  <span className="text-slate-400 text-sm ml-2">{ratingLabels[hovered || rating]}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={3}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <button
              type="submit"
              disabled={!awb.trim() || rating === 0}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg font-medium transition-all"
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>

      {/* Past Feedback */}
      <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
        <h3 className="text-lg font-semibold text-white mb-4">Your Past Feedback</h3>
        {existingFeedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600">
            <Star className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {existingFeedback.map((fb) => (
              <div key={fb.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-mono text-sm font-medium">{fb.awb}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
                      />
                    ))}
                  </div>
                </div>
                {fb.comment && <p className="text-slate-400 text-sm">{fb.comment}</p>}
                <p className="text-slate-600 text-xs mt-1">{format(new Date(fb.date), "MMM dd, yyyy")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// RAISE A QUERY
// ═══════════════════════════════════════════════════════

function RaiseQuery() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [awb, setAwb] = useState("");
  const [issueType, setIssueType] = useState("delayed");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    setTickets(JSON.parse(localStorage.getItem("ee_tickets") || "[]"));
  }, [submitted]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticketId = `EET-${Date.now().toString().slice(-6)}`;
    const entry = {
      ticketId,
      name, email, awb: awb.toUpperCase(), issueType, message,
      status: "OPEN",
      date: new Date().toISOString(),
    };
    const stored = JSON.parse(localStorage.getItem("ee_tickets") || "[]");
    localStorage.setItem("ee_tickets", JSON.stringify([entry, ...stored]));
    setSubmitted(ticketId);
    setName(""); setEmail(""); setAwb(""); setMessage("");
  }

  const issues = [
    { value: "delayed", label: "⏰ Shipment Delayed" },
    { value: "missing", label: "❓ Shipment Missing" },
    { value: "damaged", label: "📦 Damaged Package" },
    { value: "wrong", label: "🔄 Wrong Delivery" },
    { value: "other", label: "💬 Other" },
  ];

  const statusColors: Record<string, string> = {
    OPEN: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    RESOLVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          Raise a Support Query
        </h2>
        <p className="text-slate-400 text-sm mb-6">Having a problem? We'll get back to you within 24 hours.</p>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
              <CheckCheck className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-white font-bold text-lg">Query Registered!</h3>
            <div className="mt-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-purple-400 font-mono font-bold text-lg">{submitted}</p>
            </div>
            <p className="text-slate-400 text-sm mt-2">Save this ticket ID for reference.</p>
            <button
              onClick={() => setSubmitted(null)}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300"
            >
              Raise another query
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Your Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Raj Kumar" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="raj@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">AWB Number (optional)</label>
              <input value={awb} onChange={(e) => setAwb(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="EE-742-9910" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">Issue Type</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {issues.map((issue) => (
                  <button key={issue.value} type="button" onClick={() => setIssueType(issue.value)}
                    className={`py-2 px-2 rounded-lg border text-xs transition-all text-left ${
                      issueType === issue.value
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-slate-700/30 border-slate-600/30 text-slate-400 hover:text-white"
                    }`}
                  >
                    {issue.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">Describe the Issue</label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)}
                rows={4} placeholder="Please describe your issue in detail..."
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <button type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Submit Query
            </button>
          </form>
        )}
      </div>

      {/* My Tickets */}
      <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/40">
        <h3 className="text-lg font-semibold text-white mb-4">My Tickets</h3>
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600">
            <HelpCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No tickets raised yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tickets.map((t) => (
              <div key={t.ticketId} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-mono text-sm font-bold">{t.ticketId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[t.status] ?? statusColors.OPEN}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{t.message.slice(0, 80)}{t.message.length > 80 ? "..." : ""}</p>
                {t.awb && <p className="text-slate-500 text-xs mt-1 font-mono">AWB: {t.awb}</p>}
                <p className="text-slate-600 text-xs mt-1">{format(new Date(t.date), "MMM dd, yyyy 'at' hh:mm a")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
