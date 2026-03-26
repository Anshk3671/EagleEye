/**
 * AccountNotificationsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The notifications page showing system alerts and shipment updates for the logged-in user.
 *
 * WHAT IT SHOWS:
 *  - All notifications for this user (order confirmed, agent assigned, out for delivery etc.)
 *  - Unread count badge
 *  - Mark all as read button
 *  - Notification type icons and timestamps
 *
 * Notifications are stored locally in the browser's localStorage using
 * the addNotification() utility from lib/notifications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Truck,
  Package,
  AlertTriangle,
  Info,
  User as UserIcon,
  Check,
  CheckCheck,
  Trash2,
  Wallet,
  Gift,
  Navigation,
  Activity,
  AlertOctagon,
  TrendingUp,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  seedNotifications,
  type AppNotification,
} from "../lib/notifications";
import { useAuth } from "../hooks/useAuth";

// Type configs for all notification types across roles
const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  // Customer
  order_confirmed: { icon: Package, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  agent_assigned: { icon: Truck, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  out_for_delivery: { icon: Truck, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  delivered: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  delayed: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  // Agent
  new_delivery: { icon: Package, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  pickup_reminder: { icon: Navigation, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  route_updated: { icon: Navigation, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  payment_credited: { icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  bonus_earned: { icon: Gift, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  // Admin
  system_alert: { icon: AlertOctagon, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  low_capacity: { icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  agent_performance: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  new_query: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  broadcast_sent: { icon: Megaphone, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  // Shared
  info: { icon: Info, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

// Role-specific filter options
const CUSTOMER_FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "order_confirmed", label: "Orders" },
  { value: "agent_assigned", label: "Agent" },
  { value: "out_for_delivery", label: "Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delayed", label: "Delayed" },
];

const AGENT_FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "new_delivery", label: "Deliveries" },
  { value: "pickup_reminder", label: "Pickups" },
  { value: "payment_credited", label: "Payments" },
  { value: "route_updated", label: "Routes" },
  { value: "bonus_earned", label: "Bonus" },
];

const ADMIN_FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "system_alert", label: "System" },
  { value: "low_capacity", label: "Capacity" },
  { value: "agent_performance", label: "Agents" },
  { value: "new_query", label: "Queries" },
  { value: "broadcast_sent", label: "Broadcasts" },
];

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function AccountNotificationsPage() {
  const { role, isAuthenticated } = useAuth();
  const currentRole = role || "customer";
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState("all");

  const filterOptions = currentRole === "agent"
    ? AGENT_FILTERS
    : currentRole === "admin"
      ? ADMIN_FILTERS
      : CUSTOMER_FILTERS;

  useEffect(() => {
    seedNotifications(currentRole);
    setNotifications(getNotifications(currentRole));
  }, [currentRole]);

  function refresh() {
    setNotifications(getNotifications(currentRole));
  }

  function handleMarkRead(id: string) {
    markAsRead(id);
    refresh();
  }

  function handleMarkAllRead() {
    markAllAsRead(currentRole);
    refresh();
  }

  function handleDelete(id: string) {
    deleteNotification(id);
    refresh();
  }

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const backPath = currentRole === "agent" ? "/agent/dashboard" : currentRole === "admin" ? "/admin" : "/";

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Not Signed In</h2>
          <p className="text-slate-400 mb-6">Sign in to view your notifications.</p>
          <Link to="/login" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all no-underline">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 no-underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {currentRole === "agent" ? "Dashboard" : currentRole === "admin" ? "Admin" : "Home"}
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mt-2">
            <UserIcon className="w-4 h-4 inline" />
            <span className="ml-1">
              {currentRole === "agent" ? "Agent" : currentRole === "admin" ? "Admin" : "My Account"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-slate-400 mt-1">
                {currentRole === "agent"
                  ? "Your delivery updates and assignments."
                  : currentRole === "admin"
                    ? "System alerts and operational updates."
                    : "Your delivery updates and alerts."}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                filter === opt.value
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                  : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-1">No Notifications</h3>
            <p className="text-slate-500 text-sm">
              {filter === "all"
                ? "You're all caught up! No new updates."
                : "No notifications match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
              const Icon = cfg.icon;

              return (
                <div
                  key={notif.id}
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
                    notif.read
                      ? "bg-slate-800/20 border-slate-800/40"
                      : "bg-slate-800/40 border-slate-700/40 shadow-lg shadow-black/5"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} border flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`text-sm font-semibold ${notif.read ? "text-slate-400" : "text-white"}`}>
                          {notif.title}
                          {!notif.read && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2 align-middle" />
                          )}
                        </h4>
                        <p className={`text-sm mt-0.5 leading-relaxed ${notif.read ? "text-slate-500" : "text-slate-300"}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-slate-600 text-xs">{timeAgo(notif.timestamp)}</span>
                          {notif.awb && (
                            <Link
                              to={`/track?awb=${encodeURIComponent(notif.awb)}`}
                              className="text-blue-400 hover:text-blue-300 text-xs font-mono no-underline transition-colors"
                            >
                              {notif.awb}
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-all cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
