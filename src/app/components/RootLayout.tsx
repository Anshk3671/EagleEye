// ============================================================
// RootLayout.tsx — Global Page Wrapper (Shared Layout)
// Every page in the app is rendered INSIDE this component.
// It adds the top Header navigation bar to all pages automatically.
// ============================================================

import { Outlet } from "react-router"; // Outlet = placeholder where child page content goes
import Header from "./Header"; // Top navigation bar with logo, menu, and login button

export default function RootLayout() {
    return (
        // Outer wrapper: fills the full screen, applies background color based on dark/light theme
        <div className="min-h-screen w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
            {/* Header: rendered at the top of EVERY page */}
            <Header />
            <main>
                {/* Outlet: React Router replaces this with the current page component.
                    e.g., if URL is "/login", LoginPage renders here */}
                <Outlet />
            </main>
        </div>
    );
}
