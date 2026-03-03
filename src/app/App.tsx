// ============================================================
// App.tsx — Root React Component
// This is the top-level component that wraps the entire application.
// It sets up three global systems: Theme, Authentication, and Routing.
// ============================================================

import { RouterProvider } from "react-router"; // Provides URL routing to all child components
import { router } from "./routes"; // The route configuration (URL → Page mapping)
import { ThemeProvider } from "./hooks/useTheme"; // Manages dark/light mode across the app
import { AuthProvider } from "./hooks/useAuth"; // Manages login state (who is logged in)

export default function App() {
    return (
        // ThemeProvider: wraps everything so any component can access dark/light mode
        <ThemeProvider>
            {/* AuthProvider: wraps everything so any component can check if user is logged in */}
            <AuthProvider>
                {/* RouterProvider: activates the routing system defined in routes.tsx */}
                <RouterProvider router={router} />
            </AuthProvider>
        </ThemeProvider>
    );
}
