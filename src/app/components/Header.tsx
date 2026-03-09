/**
 * Header.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The sticky top navigation bar shown on every page of EagleEye.
 *
 * KEY FEATURES:
 *  1. Logo + EagleEye brand name (links to home/dashboard)
 *  2. Role-based navigation links:
 *     - Guest/Customer : Home, Services (dropdown), Track, Ship Now, Support
 *     - Agent          : Dashboard, My Deliveries, Scan Parcel, Payments
 *     - Admin          : Dashboard, Agents, Hubs, Broadcasts, Queries, Promotions
 *  3. Dark / Light mode toggle button
 *  4. User account dropdown:
 *     - Shows user name, role badge, email
 *     - Links to profile, orders, notifications
 *     - Logout button
 *  5. Unread notification count badge
 *
 * HOW DROPDOWNS WORK:
 *  - openDropdown state tracks which dropdown is currently open
 *  - Clicking outside any dropdown closes it (click-outside handler)
 *  - Dropdowns close automatically when the route changes
 *
 * ROLE DETECTION:
 *  - The useAuth() hook provides role (customer/agent/admin)
 *  - Different nav arrays (CUSTOMER_NAV, AGENT_NAV, ADMIN_NAV) are selected
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Package, ChevronDown, Sun, Moon, BarChart3, Users, Building2, Globe, Headphones, HelpCircle, MapPin, BookOpen, History, Bell, User, LogOut, Truck, ScanLine, Wallet, Megaphone, MessageSquare, Tag, Navigation } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { getUnreadCount } from "../lib/notifications";

// ── Dropdown Data ──
// SERVICES: Menu items for the "Services" dropdown in the customer nav
const SERVICES = [
    { label: "Express Parcel", desc: "Fast, door-to-door parcel delivery with real-time tracking.", path: "/services#express-parcel" },
    { label: "Express Premium", desc: "Affordable, next-day delivery service for urgent shipments.", path: "/services#express-premium" },
    { label: "3PL (Third-Party Logistics)", desc: "End-to-end storage, inventory, and order fulfillment solutions.", path: "/services#3pl" },
    { label: "LTL (Less Than Truckload)", desc: "Cost-effective freight shipping for smaller loads.", path: "/services#ltl" },
    { label: "Bulk Shipping", desc: "Large-scale logistics for high-volume business needs.", path: "/services#bulk-shipping" },
];

// OPERATIONS: Menu items for the "Operations" dropdown (admin/internal links)
const OPERATIONS = [
    { label: "Analytics", desc: "Monitor shipments, analytics, and system health in real-time.", path: "/admin", icon: BarChart3 },
    { label: "Agents", desc: "Track field agents, manage assignments, and optimize routes.", path: "/agent", icon: Users },
    { label: "Hubs", desc: "Oversee logistics hubs, capacity, and regional operations.", path: "/hubs", icon: Building2 },
    { label: "Network", desc: "Interactive India map with all hubs, zones, and connections.", path: "/network", icon: Globe },
];

// SUPPORT: Menu items for the "Support" dropdown
const SUPPORT = [
    { label: "Customer Care", desc: "Delivery feedback and support queries.", path: "/support/customer-care", icon: Headphones },
    { label: "FAQs", desc: "Frequently asked questions and answers.", path: "/support/faqs", icon: HelpCircle },
    { label: "Locate Us", desc: "Find nearby hubs, offices, and service centers.", path: "/support/locate-us", icon: MapPin },
    { label: "Service Guide", desc: "Explore all our logistics services in detail.", path: "/support/service-guide", icon: BookOpen },
];

// CUSTOMER_ACCOUNT: Links shown in the account dropdown for customer users
const CUSTOMER_ACCOUNT = [
    { label: "Order History", desc: "View and track your past shipments.", path: "/account/orders", icon: History },
    { label: "Notifications", desc: "Delivery updates and alerts.", path: "/account/notifications", icon: Bell },
    { label: "Profile", desc: "Manage your account details.", path: "/account/profile", icon: User },
    { label: "Logout", desc: "Sign out of your account.", path: "#logout", icon: LogOut },
];

// AGENT_ACCOUNT: Links shown in the account dropdown for agent users
const AGENT_ACCOUNT = [
    { label: "Profile", desc: "Your agent profile.", path: "/account/profile", icon: User },
    { label: "Notifications", desc: "Delivery updates and alerts.", path: "/account/notifications", icon: Bell },
    { label: "Logout", desc: "Sign out of your account.", path: "#logout", icon: LogOut },
];

// ADMIN_ACCOUNT: Links shown in the account dropdown for admin users
const ADMIN_ACCOUNT = [
    { label: "Profile", desc: "Your admin profile.", path: "/account/profile", icon: User },
    { label: "Notifications", desc: "System alerts.", path: "/account/notifications", icon: Bell },
    { label: "Logout", desc: "Sign out of your account.", path: "#logout", icon: LogOut },
];

// ── Role-based Nav Links ──
// NavLink: A single item in the navigation bar.
// If dropdownKey is set, clicking it opens a dropdown menu instead of navigating.
type NavLink = { label: string; path: string; dropdownKey?: string };

// CUSTOMER_NAV: Navigation shown to logged-in customers and guests
const CUSTOMER_NAV: NavLink[] = [
    { label: "Home", path: "/" },
    { label: "Services", path: "#", dropdownKey: "services" },
    { label: "Track", path: "/track" },
    { label: "Ship Now", path: "/client" },
    { label: "Support", path: "#", dropdownKey: "support" },
];

// AGENT_NAV: Navigation shown to delivery agents after login
const AGENT_NAV: NavLink[] = [
    { label: "Dashboard", path: "/agent/dashboard" },
    { label: "My Deliveries", path: "/agent/delivery" },
    { label: "Scan Parcel", path: "/agent/scan" },
    { label: "Payments", path: "/agent/payments" },
];

// ADMIN_NAV: Navigation shown to admin users after login
const ADMIN_NAV: NavLink[] = [
    { label: "Dashboard", path: "/admin" },
    { label: "Agents", path: "/admin/agents" },
    { label: "Hubs", path: "/admin/hubs-manage" },
    { label: "Broadcasts", path: "/admin/broadcast" },
    { label: "Queries", path: "/admin/queries" },
    { label: "Promotions", path: "/admin/promotions" },
];

// Guest nav = customer nav (not logged in)
const GUEST_NAV = CUSTOMER_NAV;

// Operations sub-paths for active detection
const OPERATIONS_PATHS = ["/admin", "/agent", "/hubs", "/network"];
const SUPPORT_PATHS = ["/support/customer-care", "/support/faqs", "/support/locate-us", "/support/service-guide"];
const ACCOUNT_PATHS = ["/account/orders", "/account/notifications", "/account/profile"];

export default function Header() {
    const location = useLocation();    // current page URL
    const navigate = useNavigate();    // function to navigate programmatically
    const { theme, toggleTheme } = useTheme(); // dark/light mode state
    const { user, isAuthenticated, role, logout } = useAuth(); // logged-in user info
    const [openDropdown, setOpenDropdown] = useState<string | null>(null); // which dropdown is open
    // Refs used to detect clicks outside dropdowns
    const servicesRef = useRef<HTMLDivElement>(null);
    const operationsRef = useRef<HTMLDivElement>(null);
    const supportRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);
    const unreadCount = getUnreadCount(role || undefined); // notification badge count
    const isLoginPage = location.pathname === "/login"; // hide nav on login page

    // Determine nav based on role
    const navLinks = !isAuthenticated || !role || role === "customer"
        ? CUSTOMER_NAV
        : role === "agent"
            ? AGENT_NAV
            : ADMIN_NAV;

    const accountItems = !isAuthenticated || !role || role === "customer"
        ? CUSTOMER_ACCOUNT
        : role === "agent"
            ? AGENT_ACCOUNT
            : ADMIN_ACCOUNT;

    // Close dropdowns on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            const refs = [servicesRef, operationsRef, supportRef, accountRef];
            const clickedInside = refs.some(ref => ref.current?.contains(target));
            if (!clickedInside) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    // Close on route change
    useEffect(() => {
        setOpenDropdown(null);
    }, [location.pathname]);

    function toggleDropdown(key: string) {
        setOpenDropdown(openDropdown === key ? null : key);
    }

    // Check if current path is an operations/support/account sub-path
    const isSupportActive = SUPPORT_PATHS.some(p => location.pathname.startsWith(p));
    const isAccountActive = ACCOUNT_PATHS.some(p => location.pathname.startsWith(p));

    function getDropdownData(key: string) {
        switch (key) {
            case "services": return { items: SERVICES, ref: servicesRef, width: "w-80", header: null };
            case "operations": return { items: OPERATIONS, ref: operationsRef, width: "w-[340px]", header: "Operations Center" };
            case "support": return { items: SUPPORT, ref: supportRef, width: "w-[320px]", header: "Support" };
            default: return null;
        }
    }

    function isDropdownActive(key: string): boolean {
        if (key === "support") return isSupportActive;
        return false;
    }

    // Role badge color
    const roleBadge = role === "agent"
        ? { bg: "from-emerald-500 to-teal-600", label: "Agent" }
        : role === "admin"
            ? { bg: "from-purple-500 to-indigo-600", label: "Admin" }
            : { bg: "from-blue-500 to-purple-600", label: "" };

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/60 transition-colors duration-300">
            <div className="h-16 flex items-center justify-between px-6 md:px-12 max-w-[1600px] mx-auto">
                <div className="flex items-center gap-8">
                    <Link to={role === "agent" ? "/agent/dashboard" : role === "admin" ? "/admin" : "/"} className="flex items-center gap-2.5 no-underline group">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
                            EagleEye
                        </span>
                    </Link>
                    {!isLoginPage && <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            // ── Dropdown items ──
                            if (link.dropdownKey) {
                                const dd = getDropdownData(link.dropdownKey);
                                if (!dd) return null;
                                const isOpen = openDropdown === link.dropdownKey;
                                const isActive = isDropdownActive(link.dropdownKey);

                                return (
                                    <div key={link.label} className="relative" ref={dd.ref}>
                                        <button
                                            onClick={() => toggleDropdown(link.dropdownKey!)}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                                isOpen || isActive
                                                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                            }`}
                                        >
                                            {link.label}
                                            <ChevronDown
                                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                                    isOpen ? "rotate-180" : ""
                                                }`}
                                            />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div
                                            className={`absolute top-full left-0 mt-2 ${dd.width} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden transition-all duration-200 origin-top ${
                                                isOpen
                                                    ? "opacity-100 scale-y-100 pointer-events-auto"
                                                    : "opacity-0 scale-y-95 pointer-events-none"
                                            }`}
                                        >
                                            {/* Header label */}
                                            {dd.header && (
                                                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                        {dd.header}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="py-1.5">
                                                {dd.items.map((item) => {
                                                    const isItemActive = "path" in item && item.path !== "#" && location.pathname === item.path;
                                                    const Icon = "icon" in item ? item.icon : null;

                                                    if ("path" in item && item.path !== "#") {
                                                        return (
                                                            <Link
                                                                key={item.label}
                                                                to={item.path}
                                                                className={`flex items-start gap-3 px-4 py-3 no-underline transition-colors ${
                                                                    isItemActive
                                                                        ? "bg-blue-50 dark:bg-blue-500/10"
                                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                                                }`}
                                                            >
                                                                {Icon && (
                                                                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                        isItemActive
                                                                            ? "bg-blue-100 dark:bg-blue-500/20"
                                                                            : "bg-slate-100 dark:bg-slate-800"
                                                                    }`}>
                                                                        <Icon className={`w-4 h-4 ${
                                                                            isItemActive
                                                                                ? "text-blue-600 dark:text-blue-400"
                                                                                : "text-slate-500 dark:text-slate-400"
                                                                        }`} />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <div className={`text-sm font-semibold ${
                                                                        isItemActive
                                                                            ? "text-blue-600 dark:text-blue-400"
                                                                            : "text-slate-900 dark:text-white"
                                                                    }`}>
                                                                        {item.label}
                                                                    </div>
                                                                    <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                                                                        {item.desc}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        );
                                                    }

                                                    // Services items (no path, not links)
                                                    return (
                                                        <div
                                                            key={item.label}
                                                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer transition-colors"
                                                        >
                                                            <div className="text-slate-900 dark:text-white text-sm font-semibold">
                                                                {item.label}
                                                            </div>
                                                            <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                                                                {item.desc}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // ── Regular nav links ──
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path + link.label}
                                    to={link.path}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-all ${
                                        isActive
                                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>}
                </div>
                <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    {!isLoginPage && isAuthenticated && role && role !== "customer" && (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${roleBadge.bg}`}>
                            {roleBadge.label}
                        </span>
                    )}

                    {/* Dark / Light mode toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all duration-300 cursor-pointer group"
                        aria-label="Toggle theme"
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === "dark" ? (
                            <Sun className="w-4.5 h-4.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <Moon className="w-4.5 h-4.5 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {/* Account Dropdown */}
                    {!isLoginPage && <div className="relative" ref={accountRef}>
                        <button
                            onClick={() => toggleDropdown("account")}
                            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                                openDropdown === "account" || isAccountActive
                                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                                    : "hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-slate-950"
                            } bg-gradient-to-br ${roleBadge.bg}`}
                        >
                            <span className="text-white font-semibold text-xs">{isAuthenticated && user ? user.avatar : "?"}</span>
                        </button>

                        {/* Account Dropdown Menu */}
                        <div
                            className={`absolute top-full right-0 mt-2 w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden transition-all duration-200 origin-top-right ${
                                openDropdown === "account"
                                    ? "opacity-100 scale-100 pointer-events-auto"
                                    : "opacity-0 scale-95 pointer-events-none"
                            }`}
                        >
                            {/* Account header */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleBadge.bg} flex items-center justify-center`}>
                                        <span className="text-white font-bold text-sm">{isAuthenticated && user ? user.avatar : "?"}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{isAuthenticated && user ? user.name : "Guest"}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {isAuthenticated && user ? user.email : "Sign in to continue"}
                                            {isAuthenticated && role && role !== "customer" && (
                                                <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${role === "agent" ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"}`}>
                                                    {role}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!isAuthenticated && (
                                <Link to="/login" className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                                    <User className="w-4 h-4 text-blue-400" />
                                    <div>
                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Sign In</div>
                                        <div className="text-slate-500 text-[10px]">Login to your account</div>
                                    </div>
                                </Link>
                            )}

                            {isAuthenticated && (
                                <div className="py-1.5">
                                    {accountItems.map((item) => {
                                        const isItemActive = item.path !== "#" && item.path !== "#logout" && location.pathname === item.path;
                                        const Icon = item.icon;

                                        if (item.path !== "#" && item.path !== "#logout") {
                                            return (
                                                <Link
                                                    key={item.label}
                                                    to={item.path}
                                                    className={`flex items-center gap-3 px-4 py-2.5 no-underline transition-colors ${
                                                        isItemActive
                                                            ? "bg-blue-50 dark:bg-blue-500/10"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                                    }`}
                                                >
                                                    <Icon className={`w-4 h-4 ${
                                                        isItemActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                                                    }`} />
                                                    <div>
                                                        <div className={`text-sm font-medium ${
                                                            isItemActive ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                                                        }`}>
                                                            {item.label}
                                                            {item.label === "Notifications" && unreadCount > 0 && (
                                                                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                                                    {unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-slate-500 dark:text-slate-500 text-[10px]">{item.desc}</div>
                                                    </div>
                                                </Link>
                                            );
                                        }

                                        // Logout item
                                        if (item.path === "#logout") {
                                            return (
                                                <div
                                                    key={item.label}
                                                    onClick={() => { logout(); navigate("/login"); setOpenDropdown(null); }}
                                                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 border-t border-slate-100 dark:border-slate-800/60 mt-1"
                                                >
                                                    <Icon className="w-4 h-4 text-red-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-red-500 dark:text-red-400">{item.label}</div>
                                                        <div className="text-slate-500 dark:text-slate-500 text-[10px]">{item.desc}</div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>}
                </div>
            </div>
        </header>
    );
}
