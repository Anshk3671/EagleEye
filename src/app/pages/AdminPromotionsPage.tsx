/**
 * AdminPromotionsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The promotions and discount management page for admins.
 *
 * WHAT IT DOES:
 *  - Shows all active, expired, and scheduled promo codes
 *  - Allows admins to create new promo codes (percentage or flat discount)
 *  - Set expiry date, minimum order value, and applicable service category
 *  - These promo codes are used in the ClientPortalPage booking wizard
 *
 * STORAGE: API-backed with localStorage fallback
 *  - Loads from /api/promotions (database) first
 *  - Falls back to localStorage if API is unreachable
 *  - All mutations sync to both API and localStorage
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, Tag, Plus, Percent, CheckCircle2, Loader2, X, Clock,
  Trash2, Edit2, Zap, Star, Gift, ShoppingCart, Truck
} from "lucide-react";

interface Promotion {
  id: string; code: string; title: string; description: string;
  discount: number; type: "percentage" | "flat"; validTill: string;
  active: boolean; usageCount: number; category: string;
}

const MOCK_PROMOTIONS: Promotion[] = [
  { id: "P-001", code: "EAGLE20", title: "EagleEye Launch Offer", description: "20% off on all Express Parcel shipments", discount: 20, type: "percentage", validTill: "2026-04-30", active: true, usageCount: 432, category: "Express Parcel" },
  { id: "P-002", code: "FAST50", title: "Premium Rush", description: "Flat ₹50 off on Express Premium", discount: 50, type: "flat", validTill: "2026-12-31", active: true, usageCount: 189, category: "Express Premium" },
  { id: "P-003", code: "BULK15", title: "Bulk Discount", description: "15% off on Bulk Shipping orders above ₹5000", discount: 15, type: "percentage", validTill: "2026-05-31", active: true, usageCount: 67, category: "Bulk Shipping" },
  { id: "P-004", code: "NEW100", title: "New Customer Bonus", description: "Flat ₹100 off on first shipment", discount: 100, type: "flat", validTill: "2026-12-31", active: true, usageCount: 1245, category: "All Services" },
  { id: "P-005", code: "DIWALI30", title: "Diwali Special", description: "30% off on all services during Diwali", discount: 30, type: "percentage", validTill: "2026-10-20", active: false, usageCount: 2890, category: "All Services" },
];

const SERVICE_CATEGORIES = ["All Services", "Express Parcel", "Express Premium", "3PL", "LTL Freight", "Bulk Shipping", "E-Commerce"];

const API_BASE = "http://localhost:3001/api";
const LS_PROMOS_KEY = "ee_promotions";

function loadLocalPromotions(): Promotion[] {
  try {
    const saved = localStorage.getItem(LS_PROMOS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return MOCK_PROMOTIONS;
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(loadLocalPromotions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState("");

  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [newType, setNewType] = useState<"percentage" | "flat">("percentage");
  const [newValid, setNewValid] = useState("");
  const [newCategory, setNewCategory] = useState("All Services");

  const activeCount = promotions.filter(p => p.active).length;

  // Load promotions from API on mount, fallback to localStorage
  useEffect(() => {
    fetch(`${API_BASE}/promotions`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: Promotion[] = data.map((p: any) => ({
            id: p.id,
            code: p.code,
            title: p.title,
            description: p.description || "",
            discount: p.discount,
            type: p.type as "percentage" | "flat",
            validTill: p.validTill,
            active: p.active,
            usageCount: p.usageCount || 0,
            category: p.category || "All Services",
          }));
          setPromotions(mapped);
          localStorage.setItem(LS_PROMOS_KEY, JSON.stringify(mapped));
        }
      })
      .catch(() => { /* use localStorage fallback */ });
  }, []);

  function handleAddPromotion(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode || !newTitle || !newDiscount) return;
    setAdding(true);

    const promoData = {
      code: newCode.toUpperCase(),
      title: newTitle,
      description: newDesc,
      discount: Number(newDiscount),
      type: newType,
      validTill: newValid || "2026-12-31",
      category: newCategory,
    };

    // Save to API first
    fetch(`${API_BASE}/promotions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promoData),
    })
      .then(r => r.ok ? r.json() : null)
      .then(savedPromo => {
        const promo: Promotion = savedPromo ? {
          id: savedPromo.id,
          code: savedPromo.code,
          title: savedPromo.title,
          description: savedPromo.description || "",
          discount: savedPromo.discount,
          type: savedPromo.type as "percentage" | "flat",
          validTill: savedPromo.validTill,
          active: savedPromo.active,
          usageCount: savedPromo.usageCount || 0,
          category: savedPromo.category || "All Services",
        } : {
          // Fallback local-only promo
          id: `P-${(promotions.length + 1).toString().padStart(3, "0")}`,
          ...promoData,
          active: true,
          usageCount: 0,
        };
        const newList = [promo, ...promotions];
        setPromotions(newList);
        localStorage.setItem(LS_PROMOS_KEY, JSON.stringify(newList));
        setAdding(false);
        setShowAddForm(false);
        setSuccess(`Promotion "${newCode.toUpperCase()}" created successfully!`);
        setNewCode(""); setNewTitle(""); setNewDesc(""); setNewDiscount(""); setNewValid("");
        setTimeout(() => setSuccess(""), 5000);
      })
      .catch(() => {
        // Fallback: save locally only
        const promo: Promotion = {
          id: `P-${(promotions.length + 1).toString().padStart(3, "0")}`,
          ...promoData,
          active: true,
          usageCount: 0,
        };
        const newList = [promo, ...promotions];
        setPromotions(newList);
        localStorage.setItem(LS_PROMOS_KEY, JSON.stringify(newList));
        setAdding(false);
        setShowAddForm(false);
        setSuccess(`Promotion "${newCode.toUpperCase()}" created (offline mode)!`);
        setNewCode(""); setNewTitle(""); setNewDesc(""); setNewDiscount(""); setNewValid("");
        setTimeout(() => setSuccess(""), 5000);
      });
  }

  function toggleActive(id: string) {
    const promo = promotions.find(p => p.id === id);
    if (!promo) return;
    const updated = promotions.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setPromotions(updated);
    localStorage.setItem(LS_PROMOS_KEY, JSON.stringify(updated));
    // Sync to API
    fetch(`${API_BASE}/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !promo.active }),
    }).catch(() => {});
  }

  function deletePromotion(id: string) {
    const updated = promotions.filter(p => p.id !== id);
    setPromotions(updated);
    localStorage.setItem(LS_PROMOS_KEY, JSON.stringify(updated));
    // Sync to API
    fetch(`${API_BASE}/promotions/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-slate-500 hover:text-white transition-colors no-underline"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Tag className="w-6 h-6 text-purple-400" /> Promotions & Discounts
              </h1>
              <p className="text-slate-400 text-sm">Manage sales, discount codes, and service updates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">{activeCount} Active</span>
            <button onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer transition-all">
              <Plus className="w-4 h-4" /> Add Promotion
            </button>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400 text-sm">{success}</span>
          </div>
        )}

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map(promo => (
            <div key={promo.id} className={`p-5 rounded-xl border transition-all ${promo.active ? "bg-slate-800/40 border-slate-700/40" : "bg-slate-900/40 border-slate-800/30 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${promo.type === "percentage" ? "bg-purple-500/20" : "bg-amber-500/20"}`}>
                    {promo.type === "percentage"
                      ? <Percent className="w-6 h-6 text-purple-400" />
                      : <span className="text-amber-400 font-bold text-lg">₹</span>}
                  </div>
                  <div>
                    <p className="text-white font-bold">{promo.title}</p>
                    <p className="font-mono text-sm text-blue-400 font-bold">{promo.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(promo.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${promo.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-700/50 text-slate-500 border-slate-600/20"}`}>
                    {promo.active ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => deletePromotion(promo.id)} className="p-1 text-slate-600 hover:text-red-400 cursor-pointer transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-3">{promo.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {promo.category}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Till {promo.validTill}</span>
                </div>
                <span className="text-slate-400">{promo.usageCount} uses</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/30">
                <p className="text-lg font-bold">
                  {promo.type === "percentage" ? (
                    <span className="text-purple-400">{promo.discount}% OFF</span>
                  ) : (
                    <span className="text-amber-400">₹{promo.discount} OFF</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Promotion Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><Gift className="w-5 h-5 text-purple-400" /> Create Promotion</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddPromotion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Promo Code *</label>
                  <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="EAGLE25" required
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/30 placeholder-slate-500" /></div>
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Title *</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Summer Sale" required
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 placeholder-slate-500" /></div>
              </div>
              <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Get discount on all services"
                  className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 placeholder-slate-500" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Discount *</label>
                  <input value={newDiscount} onChange={e => setNewDiscount(e.target.value)} type="number" placeholder="20" required
                    className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" /></div>
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Type</label>
                  <select value={newType} onChange={e => setNewType(e.target.value as "percentage" | "flat")}
                    className="w-full px-2 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none appearance-none cursor-pointer">
                    <option value="percentage">% Off</option><option value="flat">₹ Flat</option>
                  </select></div>
                <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Valid Till</label>
                  <input value={newValid} onChange={e => setNewValid(e.target.value)} type="date"
                    className="w-full px-2 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" /></div>
              </div>
              <div><label className="text-slate-400 text-xs uppercase font-semibold block mb-1">Service Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none appearance-none cursor-pointer">
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <button type="submit" disabled={adding || !newCode || !newTitle || !newDiscount}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                {adding ? "Creating..." : "Create Promotion"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
