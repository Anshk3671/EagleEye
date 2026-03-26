/**
 * ProfilePage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The user profile page — shows and allows editing of account details.
 *
 * WHAT IT SHOWS:
 *  - User name, phone, email, address, city, PIN code
 *  - Role badge (Customer / Agent / Admin)
 *  - Edit mode: user can update their profile details
 *  - Saves changes via the backend API
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  CheckCircle2,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    gender: user?.gender || "",
    dob: user?.dob || "",
    address: user?.address || "",
    city: user?.city || "",
    pincode: user?.pincode || "",
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Not Signed In</h2>
          <p className="text-slate-400 mb-6">Please sign in to view your profile.</p>
          <Link
            to="/login"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all no-underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  function startEdit() {
    setForm({
      name: user!.name,
      phone: user!.phone,
      email: user!.email,
      gender: user!.gender,
      dob: user!.dob,
      address: user!.address,
      city: user!.city,
      pincode: user!.pincode,
    });
    setEditing(true);
    setSaved(false);
  }

  function handleSave() {
    updateProfile(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }



  const fields = [
    { key: "name", label: "Full Name", icon: User, type: "text" },
    { key: "phone", label: "Phone", icon: Phone, type: "tel" },
    { key: "email", label: "Email", icon: Mail, type: "email" },
    { key: "gender", label: "Gender", icon: Shield, type: "select", options: ["Male", "Female", "Other"] },
    { key: "dob", label: "Date of Birth", icon: Calendar, type: "date" },
    { key: "address", label: "Address", icon: MapPin, type: "text" },
    { key: "city", label: "City", icon: MapPin, type: "text" },
    { key: "pincode", label: "PIN Code", icon: MapPin, type: "text" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 no-underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-4 ml-0 block mt-2">
            <User className="w-4 h-4 inline" />
            <span className="ml-1">My Account</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-slate-400 mt-1">Manage your personal information.</p>
        </div>

        {/* Success toast */}
        {saved && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-sm animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4" />
            Profile updated successfully!
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden">
          {/* Avatar Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-slate-900 shadow-xl">
                <span className="text-white font-bold text-2xl">{user.avatar}</span>
              </div>
            </div>
          </div>

          <div className="pt-16 px-8 pb-8">
            {/* Name & Actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-slate-400 text-sm">{user.email}</p>
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((f) => {
                const Icon = f.icon;
                const value = editing
                  ? form[f.key as keyof typeof form]
                  : user[f.key as keyof typeof user];

                return (
                  <div key={f.key} className="group">
                    <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1.5 font-semibold">
                      {f.label}
                    </label>
                    {editing ? (
                      f.type === "select" ? (
                        <select
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                        >
                          {f.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      )
                    ) : (
                      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-700/20 border border-slate-700/30 rounded-lg">
                        <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="text-white text-sm">{value || "—"}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Logout */}
            <div className="mt-8 pt-6 border-t border-slate-700/40">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
