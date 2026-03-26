// ============================================================
// NotFound.tsx — 404 Error Page
//
// This page is shown automatically by React Router when the user
// visits a URL that does not exist in routes.tsx.
// e.g., visiting "/xyz" or "/admin/unknown" will show this page.
// ============================================================

import { Link } from "react-router"; // Link = navigation component (like <a> but for React Router)

export default function NotFound() {
    return (
        // Full-screen centered container with light background
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center px-6">
            <div className="text-center space-y-6 max-w-lg">

                {/* Large "404" error code displayed prominently in EagleEye blue */}
                <div className="text-8xl font-extrabold font-['Manrope',sans-serif] text-[#0058be] tracking-tighter">
                    404
                </div>

                {/* Page title heading */}
                <h1 className="text-3xl font-bold font-['Manrope',sans-serif] text-[#0b1c30] tracking-tight">
                    Shipment Not Found
                </h1>

                {/* Friendly error message explaining what happened */}
                <p className="text-base text-[#45464d] font-['Inter',sans-serif]">
                    The page you're looking for doesn't exist or has been moved. Please check the URL and try again.
                </p>

                {/* "Return to Dashboard" button — navigates the user back to the home page "/" */}
                <Link
                    to="/"
                    className="inline-block bg-[#0058be] text-white font-semibold text-sm px-8 py-3 rounded-lg hover:bg-[#004395] transition-colors no-underline tracking-wide"
                >
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
