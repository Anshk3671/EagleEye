/**
 * LoginPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the Login / Sign-up page of EagleEye.
 *
 * HOW IT WORKS — 4-phase login flow:
 *  Phase 1 "phone"    — User selects their role and enters phone number
 *  Phase 2 "otp"      — A 6-digit OTP is sent; user types it in 6 boxes
 *  Phase 3 "register" — If new user: collect name, email, address details
 *  Phase 4 "success"  — Shows success animation, then redirects to dashboard
 *
 * Three roles available:
 *  - customer : normal users who track and ship parcels
 *  - agent    : delivery personnel who manage pickups & deliveries
 *  - admin    : company staff with full system access
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Package, Phone, ArrowRight, Loader2, ShieldCheck, CheckCircle2,
  ShoppingCart, Truck, Building2, User, Mail, MapPin, Calendar, Shield, AlertCircle
} from "lucide-react";
import { useAuth, type UserRole, type UserProfile } from "../hooks/useAuth";
import { API_BASE } from "../lib/api";

// ROLE_TABS: Defines the 3 tabs shown on the login form (Customer / Agent / Admin)
// Each tab has its own color, icon, and description.
const ROLE_TABS: { role: UserRole; label: string; icon: typeof Package; desc: string; color: string }[] = [
  { role: "customer", label: "Customer", icon: ShoppingCart, desc: "Track & ship parcels", color: "blue" },
  { role: "agent", label: "Agent", icon: Truck, desc: "Manage deliveries", color: "emerald" },
  { role: "admin", label: "Join Us", icon: Building2, desc: "Admin & operations", color: "purple" },
];

// ROLE_COLORS: CSS classes used to style each tab's active/ring/background state
const ROLE_COLORS: Record<string, { active: string; ring: string; bg: string }> = {
  blue: { active: "bg-blue-600", ring: "ring-blue-500/50", bg: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  emerald: { active: "bg-emerald-600", ring: "ring-emerald-500/50", bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  purple: { active: "bg-purple-600", ring: "ring-purple-500/50", bg: "bg-purple-500/10 border-purple-500/30 text-purple-400" },
};

export default function LoginPage() {
  // Get authentication state from global context (useAuth hook)
  const { login, isAuthenticated, role: currentRole } = useAuth();
  const navigate = useNavigate();

  // selectedRole: which tab is active (customer/agent/admin)
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  // phase: controls which screen to show
  const [phase, setPhase] = useState<"phone" | "otp" | "register" | "success">("phone");
  const [phone, setPhone] = useState("");        // phone number typed by user
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6-digit OTP digits
  const [sending, setSending] = useState(false);    // true while OTP is being sent
  const [verifying, setVerifying] = useState(false); // true while OTP is being verified
  const [registering, setRegistering] = useState(false); // true while registration is saving
  const [error, setError] = useState("");            // error message to show user
  const [devOtp, setDevOtp] = useState("");          // in development, OTP shown on screen
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);  // refs to each OTP input box

  // Admin-only extra fields: company email and company ID for verification
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [adminHint, setAdminHint] = useState<{ companyEmail: string; companyId: string } | null>(null);

  // Registration form fields collected from new users
  const [regForm, setRegForm] = useState({
    name: "", email: "", gender: "Male", dob: "", address: "", city: "", pincode: "",
  });

  const rc = ROLE_COLORS[ROLE_TABS.find(t => t.role === selectedRole)?.color || "blue"];

  // On page load, fetch the admin demo credentials from the server
  // This shows a hint box on screen so testers know what to enter
  useEffect(() => {
    fetch(`${API_BASE}/auth/admin-hint`).then(r => r.json()).then(setAdminHint).catch(() => {});
  }, []);

  // If user is already logged in, redirect them to the correct dashboard
  useEffect(() => {
    if (isAuthenticated && currentRole) {
      const dest = currentRole === "agent" ? "/agent/dashboard" : currentRole === "admin" ? "/admin" : "/";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, currentRole, navigate]);


  // handleSendOTP: Validates the phone number and sends an OTP via the backend API
  // For admin users, also validates company email and ID before proceeding
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    // Admin: validate company credentials
    if (selectedRole === "admin") {
      if (!companyEmail || !companyId) {
        setError("Company email and ID are required for admin access.");
        return;
      }
    }

    setError("");
    setSending(true);


    try {
      const body: Record<string, string> = { phone: cleaned, role: selectedRole };
      if (selectedRole === "admin") {
        body.companyEmail = companyEmail;
        body.companyId = companyId;
      }

      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        setSending(false);
        return;
      }


      // Store OTP if returned (dev mode)
      if (data.otp) {
        setDevOtp(data.otp);
      }

      setSending(false);
      setPhase("otp");
    } catch {
      setError("Server not reachable. Make sure backend is running.");
      setSending(false);
    }
  }

  // handleOTPChange: Updates the OTP array when user types a digit
  // Also auto-moves focus to the next input box after each digit is entered
  function handleOTPChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  // handleOTPKeyDown: Moves focus to the PREVIOUS box when user presses Backspace
  function handleOTPKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  // handleVerifyOTP: Sends the entered 6-digit OTP to the backend for verification
  // If correct and user already exists → login immediately
  // If correct but user is new → show registration form
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setError("");
    setVerifying(true);

    try {
      const cleaned = phone.replace(/\s/g, "");
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned, role: selectedRole, otp: enteredOtp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        setVerifying(false);
        return;
      }

      setVerifying(false);

      if (data.isNewUser) {
        // New user → show registration form
        setPhase("register");
      } else {
        // Existing user → login directly
        const userData: UserProfile = data.user;
        userData.role = selectedRole;
        login(userData, data.token);
        setPhase("success");
        const dest = selectedRole === "agent" ? "/agent/dashboard" : selectedRole === "admin" ? "/admin" : "/";
        setTimeout(() => navigate(dest, { replace: true }), 1500);
      }
    } catch {
      setError("Server not reachable.");
      setVerifying(false);
    }
  }

  // handleRegister: Saves the new user's profile info to the database
  // After successful registration, logs the user in and redirects to dashboard
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regForm.name.trim()) {
      setError("Name is required.");
      return;
    }

    setError("");
    setRegistering(true);

    try {
      const cleaned = phone.replace(/\s/g, "");
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleaned,
          role: selectedRole,
          ...regForm,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setRegistering(false);
        return;
      }

      // Login with the new user data
      const userData: UserProfile = data.user;
      userData.role = selectedRole;
      login(userData, data.token);
      setRegistering(false);
      setPhase("success");
      const dest = selectedRole === "agent" ? "/agent/dashboard" : selectedRole === "admin" ? "/admin" : "/";
      setTimeout(() => navigate(dest, { replace: true }), 1500);
    } catch {
      setError("Server not reachable.");
      setRegistering(false);
    }
  }

  const roleLabel = ROLE_TABS.find(t => t.role === selectedRole)?.label || "User";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/25">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to EagleEye</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl shadow-black/20">

          {/* ── Role Selector Tabs ── */}
          {phase === "phone" && (
            <div className="flex gap-2 mb-6">
              {ROLE_TABS.map((tab) => {
                const isActive = selectedRole === tab.role;
                const colors = ROLE_COLORS[tab.color];
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.role}
                    onClick={() => { setSelectedRole(tab.role); setError(""); }}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isActive
                        ? `${colors.bg} border-opacity-100`
                        : "bg-slate-700/20 border-slate-600/30 text-slate-500 hover:text-slate-300 hover:border-slate-500/40"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isActive ? "" : "opacity-50"}`} />
                    <div className={`text-xs font-bold ${isActive ? "" : "text-slate-400"}`}>{tab.label}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{tab.desc}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Phone Phase ── */}
          {phase === "phone" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Admin credentials */}
              {selectedRole === "admin" && (
                <div className="space-y-3 mb-2">
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5 font-semibold">
                      Company Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => { setCompanyEmail(e.target.value); setError(""); }}
                        placeholder="admin@eagleeye.in"
                        className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5 font-semibold">
                      Company ID
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={companyId}
                        onChange={(e) => { setCompanyId(e.target.value); setError(""); }}
                        placeholder="EAGLE-ADM-2026"
                        className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                  {/* Admin hint */}
                  {adminHint && (
                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <p className="text-purple-400 text-[10px] text-center leading-relaxed">
                        <ShieldCheck className="w-3 h-3 inline mr-1" />
                        Demo credentials — Email: <span className="font-mono font-bold">{adminHint.companyEmail}</span> • ID: <span className="font-mono font-bold">{adminHint.companyId}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    placeholder="+91 98765 43210"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-700/50 border border-slate-600/40 rounded-xl text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !phone.trim()}
                className={`w-full py-3.5 ${rc.active} hover:brightness-110 disabled:opacity-40 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer`}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Sign in as {roleLabel}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-xs text-center">
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                  OTP will be sent to your phone. Check server console if SMS is not configured.
                </p>
              </div>
            </form>
          )}

          {/* ── OTP Phase ── */}
          {phase === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="text-center mb-2">
                <ShieldCheck className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-white font-semibold">Enter OTP</p>
                <p className="text-slate-400 text-sm mt-1">
                  A 6-digit code was sent to <span className="text-white font-mono">{phone}</span>
                </p>

                {/* Dev Mode OTP Display */}
                {devOtp && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-pulse">
                    <p className="text-emerald-400 text-sm font-bold text-center">
                      🔑 Your OTP: <span className="font-mono text-lg tracking-widest">{devOtp}</span>
                    </p>
                    <p className="text-emerald-400/60 text-[10px] text-center mt-1">Development mode — OTP displayed for testing</p>
                  </div>
                )}
              </div>

              {/* OTP inputs */}
              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 ${rc.ring} ${
                      digit
                        ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                        : "bg-slate-700/50 border-slate-600/40 text-white"
                    }`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || otp.join("").length < 6}
                className={`w-full py-3.5 ${rc.active} hover:brightness-110 disabled:opacity-40 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer`}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setPhase("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                className="w-full text-slate-500 hover:text-slate-300 text-sm transition-colors cursor-pointer"
              >
                ← Change phone number
              </button>

              <button
                type="button"
                onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)}
                className="w-full text-blue-400 hover:text-blue-300 text-xs transition-colors cursor-pointer"
              >
                Resend OTP
              </button>
            </form>
          )}

          {/* ── Registration Phase (New User) ── */}
          {phase === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-3">
                <User className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Complete Your Profile</p>
                <p className="text-slate-400 text-xs mt-1">Tell us about yourself to get started</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-semibold">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-semibold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-semibold">Gender</label>
                    <select
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-semibold">Date of Birth</label>
                    <input
                      type="date"
                      value={regForm.dob}
                      onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-semibold">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={regForm.address}
                      onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                      placeholder="Street address"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-semibold">City</label>
                    <input
                      type="text"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-semibold">PIN Code</label>
                    <input
                      type="text"
                      value={regForm.pincode}
                      onChange={(e) => setRegForm({ ...regForm, pincode: e.target.value })}
                      placeholder="201301"
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={registering || !regForm.name.trim()}
                className={`w-full py-3.5 ${rc.active} hover:brightness-110 disabled:opacity-40 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer`}
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Complete & Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Success Phase ── */}
          {phase === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Login Successful!</h2>
              <p className="text-slate-400 text-sm mt-1">
                Redirecting to {selectedRole === "agent" ? "Agent Dashboard" : selectedRole === "admin" ? "Admin Panel" : "Home"}...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
