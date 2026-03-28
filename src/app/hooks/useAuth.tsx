// ============================================================
// useAuth.tsx — Global Authentication State Management
//
// Stores the logged-in user's data and role using React Context,
// so ANY component in the app can access authentication info.
// Persists login state in localStorage (survives browser refresh).
//
// How to use:  const { user, isAdmin, login, logout } = useAuth();
// ============================================================

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { API_BASE } from "../lib/api";

// ─── Types ───────────────────────────────────────────────
// UserRole: The 3 types of users in EagleEye
export type UserRole = "customer" | "agent" | "admin";

// UserProfile: Complete data of the logged-in user
export interface UserProfile {
  id?: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  dob: string;        // Date of birth
  address: string;
  city: string;
  pincode: string;
  avatar: string;     // User's initials (e.g. "AK" for Ansh Kumar)
  role: UserRole;
  // Agent-specific fields (only when role === "agent")
  hubCode?: string;      // Which hub agent belongs to (e.g. "DEL")
  vehicleType?: string;  // "bike", "van", or "truck"
  agentId?: string;
  creditPoints?: number;
  isNew?: boolean;       // True if agent just registered
}

// AuthState: Everything the auth context exposes to the app
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  role: UserRole | null;
  isCustomer: boolean;
  isAgent: boolean;
  isAdmin: boolean;
  login: (userData: UserProfile, token?: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

// localStorage keys
const LS_KEY = "ee_auth_user";        // Stores user profile JSON
const LS_TOKEN_KEY = "ee_auth_token"; // Stores JWT token

// ─── Context ─────────────────────────────────────────────
const AuthContext = createContext<AuthState | null>(null);

// AuthProvider: Wraps the entire app so all components can access auth
export function AuthProvider({ children }: { children: ReactNode }) {

  // Load previously saved user from localStorage (keeps user logged in after refresh)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.role) parsed.role = "customer"; // Fallback role
        return parsed;
      }
      return null;
    } catch {
      return null; // If JSON parse fails, treat as not logged in
    }
  });

  // Derived booleans computed from the user's role
  const isAuthenticated = !!user;
  const role = user?.role ?? null;
  const isCustomer = role === "customer";
  const isAgent = role === "agent";
  const isAdmin = role === "admin";

  // Sync user state to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(LS_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LS_KEY); // On logout: remove stored user
    }
  }, [user]);

  // login(): Called after successful OTP verification — saves user + JWT token
  function login(userData: UserProfile, token?: string) {
    setUser(userData);
    if (token) {
      localStorage.setItem(LS_TOKEN_KEY, token);
    }
  }

  // logout(): Clears all auth data from state and localStorage
  function logout() {
    setUser(null);
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_TOKEN_KEY);
  }

  // updateProfile(): Updates user info locally and syncs to backend
  async function updateProfile(data: Partial<UserProfile>) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      // Regenerate avatar initials if name changed (e.g. "Ansh Kumar" → "AK")
      if (data.name) {
        updated.avatar = data.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      }
      return updated;
    });

    // Also save to backend database
    if (user) {
      try {
        const token = localStorage.getItem(LS_TOKEN_KEY);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        await fetch(`${API_BASE}/auth/profile`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ phone: user.phone, role: user.role, ...data }),
        });
      } catch {
        // Silently fail — local state is already updated
      }
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, role, isCustomer, isAgent, isAdmin, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth(): Custom hook — call this in any component to get auth state
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


