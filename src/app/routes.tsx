// ============================================================
// routes.tsx — Application URL Routing Configuration
// Defines WHICH PAGE is shown for WHICH URL.
// Uses React Router v7's createBrowserRouter.
//
// Structure: All routes are children of RootLayout (which adds the Header).
// If a URL doesn't match any route, NotFound (404) page is shown.
// ============================================================

import { createBrowserRouter } from "react-router";
import RootLayout from "./components/RootLayout"; // Wrapper that adds the global Header to all pages

// --- Page Imports ---
import HomePage from "./pages/HomePage";
import AgentDashboardPage from "./pages/AgentDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CustomerPortalPage from "./pages/CustomerPortalPage";
import HubManagementPage from "./pages/HubManagementPage";
import ShipmentDetailsPage from "./pages/ShipmentDetailsPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import NetworkPage from "./pages/NetworkPage";
import NotFound from "./pages/NotFound";
import SupportCustomerCarePage from "./pages/SupportCustomerCarePage";
import SupportFAQsPage from "./pages/SupportFAQsPage";
import SupportLocateUsPage from "./pages/SupportLocateUsPage";
import SupportServiceGuidePage from "./pages/SupportServiceGuidePage";
import AccountOrdersPage from "./pages/AccountOrdersPage";
import AccountNotificationsPage from "./pages/AccountNotificationsPage";
import ServicesPage from "./pages/ServicesPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

// New Agent Pages
import AgentPortalPage from "./pages/AgentPortalPage";
import AgentDeliveryPage from "./pages/AgentDeliveryPage";
import AgentScanPage from "./pages/AgentScanPage";
import AgentPaymentsPage from "./pages/AgentPaymentsPage";

// New Admin Pages
import AdminManageAgentsPage from "./pages/AdminManageAgentsPage";
import AdminManageHubsPage from "./pages/AdminManageHubsPage";
import AdminQueriesPage from "./pages/AdminQueriesPage";
import AdminBroadcastPage from "./pages/AdminBroadcastPage";
import AdminPromotionsPage from "./pages/AdminPromotionsPage";

// createBrowserRouter: Creates the routing table for the app.
// The "/" route uses RootLayout as the parent — so all child pages get the Header.
export const router = createBrowserRouter([
    {
        path: "/",
        Component: RootLayout, // All pages share this layout (includes the top navigation Header)
        children: [
            // --- Public Pages ---
            { index: true, Component: HomePage },         // "/" → Landing page
            { path: "track", Component: CustomerPortalPage }, // "/track" → Shipment tracking (no login needed)
            { path: "services", Component: ServicesPage },    // "/services" → Services listing
            { path: "login", Component: LoginPage },          // "/login" → OTP Login page
            { path: "network", Component: NetworkPage },      // "/network" → India hub map
            { path: "shipments/:id", Component: ShipmentDetailsPage }, // "/shipments/EE-123" → Detail view

            // --- Client Portal ---
            { path: "client", Component: ClientPortalPage },  // "/client" → Business client dashboard

            // --- Hub Management ---
            { path: "hubs", Component: HubManagementPage },   // "/hubs" → Hub list & management

            // --- Support Pages (accessible from footer/support menu) ---
            { path: "support/customer-care", Component: SupportCustomerCarePage },     // "/support/customer-care"
            { path: "support/faqs", Component: SupportFAQsPage },                     // "/support/faqs"
            { path: "support/locate-us", Component: SupportLocateUsPage },             // "/support/locate-us"
            { path: "support/service-guide", Component: SupportServiceGuidePage },     // "/support/service-guide"

            // --- Account Pages (for logged-in users) ---
            { path: "account/orders", Component: AccountOrdersPage },                  // "/account/orders"
            { path: "account/notifications", Component: AccountNotificationsPage },    // "/account/notifications"
            { path: "account/profile", Component: ProfilePage },                       // "/account/profile"

            // --- Agent Portal Pages (only agents should access these) ---
            { path: "agent", Component: AgentDashboardPage },           // "/agent" → Agent home
            { path: "agent/dashboard", Component: AgentPortalPage },    // "/agent/dashboard" → Full agent portal
            { path: "agent/delivery", Component: AgentDeliveryPage },   // "/agent/delivery" → Active delivery tracking
            { path: "agent/scan", Component: AgentScanPage },           // "/agent/scan" → Barcode scanner
            { path: "agent/payments", Component: AgentPaymentsPage },   // "/agent/payments" → Earnings & payments

            // --- Admin Pages (only admins should access these) ---
            { path: "admin", Component: AdminDashboardPage },               // "/admin" → Admin overview
            { path: "admin/agents", Component: AdminManageAgentsPage },     // "/admin/agents" → Manage delivery agents
            { path: "admin/hubs-manage", Component: AdminManageHubsPage },  // "/admin/hubs-manage" → Manage hubs
            { path: "admin/queries", Component: AdminQueriesPage },         // "/admin/queries" → Customer queries
            { path: "admin/broadcast", Component: AdminBroadcastPage },     // "/admin/broadcast" → Send notifications
            { path: "admin/promotions", Component: AdminPromotionsPage },   // "/admin/promotions" → Promo campaigns

            // --- Catch-all: any unknown URL shows the 404 Not Found page ---
            { path: "*", Component: NotFound },
        ],
    },
]);

