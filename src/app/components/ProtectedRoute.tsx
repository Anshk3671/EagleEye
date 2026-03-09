// ============================================================
// ProtectedRoute.tsx — Role-Based Access Guard
//
// This component acts as a SECURITY GATE for pages that require login.
// Before rendering a page, it checks:
//   1. Is the user logged in? → if not, redirect to /login
//   2. Does the user have the right role? → if not, redirect to their own home
//
// Usage example:
//   <ProtectedRoute allowedRoles={["admin"]}>
//     <AdminDashboardPage />
//   </ProtectedRoute>
// ============================================================

import { Navigate } from "react-router"; // Navigate = programmatic redirect component
import { useAuth, type UserRole } from "../hooks/useAuth"; // Auth hook to check login state

// Props: what page to protect (children) and which roles are allowed (allowedRoles)
interface ProtectedRouteProps {
  children: React.ReactNode;   // The actual page/component to render if access is allowed
  allowedRoles: UserRole[];    // e.g. ["admin"] or ["agent", "admin"]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  // Get authentication state and user role from the global auth context
  const { isAuthenticated, role } = useAuth();

  // Guard 1: If user is NOT logged in, redirect to the login page
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  // Guard 2: If user's role is not in the allowed list, redirect to their own home page
  if (!allowedRoles.includes(role)) {
    // Determine where to redirect based on the user's actual role
    const dest = role === "agent" ? "/agent/dashboard" : role === "admin" ? "/admin" : "/";
    return <Navigate to={dest} replace />;
  }

  // All checks passed — render the protected page
  return <>{children}</>;
}
