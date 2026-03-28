/**
 * notifications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Notification management system — handles ALL in-app alerts for customers, agents, and admins.
 *
 * STORAGE STRATEGY: "Dual Storage"
 *  - Primary : localStorage (browser) — instant, works offline, no auth needed
 *  - Secondary: Backend API (database) — persists across devices, synced
 *  Every write operation saves to localStorage first, then also sends to API in background.
 *
 * ROLE-BASED: Each role only sees their own notifications.
 *  - customer : order updates (confirmed, out for delivery, delivered)
 *  - agent    : delivery assignments, payment credits, route updates
 *  - admin    : system alerts, hub capacity warnings, query notifications
 *
 * KEY EXPORTS:
 *  addNotification(notif)         — Creates and saves a new notification
 *  getNotifications(role?)        — Read notifications from localStorage (sync)
 *  getNotificationsAsync(role?)   — Read notifications from API (async, with fallback)
 *  markAsRead(id)                 — Mark one notification as read
 *  markAllAsRead(role?)           — Mark all notifications as read
 *  getUnreadCount(role?)          — Count unread notifications (used for badge in Header)
 *  seedNotifications(role?)       — Pre-fill sample notifications for demo/testing
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ═══════════════════════════════════════════════════════════
   Notification Store — API-backed with localStorage fallback
   Role-based: each role gets its own relevant notifications
   SRS: Notification table mapped to /api/notifications
   ═══════════════════════════════════════════════════════════ */

import { API_BASE } from "./api";

export type NotificationType =
  // Customer
  | "order_confirmed" | "agent_assigned" | "out_for_delivery" | "delivered" | "delayed"
  // Agent
  | "new_delivery" | "pickup_reminder" | "route_updated" | "payment_credited" | "bonus_earned"
  // Admin
  | "system_alert" | "low_capacity" | "agent_performance" | "new_query" | "broadcast_sent"
  // Shared
  | "info";

export type NotificationRole = "customer" | "agent" | "admin";

export interface AppNotification {
  id: string;
  type: NotificationType;
  role: NotificationRole; // which role this notification belongs to
  title: string;
  message: string;
  awb?: string;
  timestamp: string;
  read: boolean;
}

// LS_KEY: The key used to store all notifications in browser localStorage
const LS_KEY = "ee_app_notifications";

// ── Helper: get current user from localStorage ──
function getCurrentUser(): { phone: string; role: string } | null {
  try {
    const stored = localStorage.getItem("ee_auth_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return { phone: parsed.phone, role: parsed.role };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Get notifications (API first, localStorage fallback) ──
export async function getNotificationsAsync(role?: string): Promise<AppNotification[]> {
  const user = getCurrentUser();
  if (user) {
    try {
      const r = role || user.role;
      const res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(user.phone)}/${r}`);
      if (res.ok) {
        const data = await res.json();
        return (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.type as NotificationType,
          role: n.userRole as NotificationRole,
          title: n.title,
          message: n.message,
          awb: n.awb || undefined,
          timestamp: n.sentAt,
          read: n.read,
        }));
      }
    } catch {
      // Fallback to localStorage
    }
  }
  return getNotifications(role);
}

// ── Sync version (localStorage only — for immediate use in components) ──
export function getNotifications(role?: string): AppNotification[] {
  try {
    const all: AppNotification[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (role) {
      return all.filter((n) => n.role === role);
    }
    return all;
  } catch {
    return [];
  }
}

// ── Add notification (API + localStorage) ──
export function addNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">) {
  const all: AppNotification[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const entry: AppNotification = {
    ...notif,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  // Save to localStorage immediately
  localStorage.setItem(LS_KEY, JSON.stringify([entry, ...all]));

  // Also save to API (async, non-blocking)
  const user = getCurrentUser();
  if (user) {
    fetch(`${API_BASE}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPhone: user.phone,
        userRole: notif.role,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        awb: notif.awb || "",
      }),
    }).catch(() => {}); // Silently fail
  }

  return entry;
}

export function markAsRead(id: string) {
  const all = getNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(LS_KEY, JSON.stringify(updated));

  // Also update API
  fetch(`${API_BASE}/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
}

export function markAllAsRead(role?: string) {
  const all: AppNotification[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const updated = all.map((n) => {
    if (role && n.role !== role) return n;
    return { ...n, read: true };
  });
  localStorage.setItem(LS_KEY, JSON.stringify(updated));

  // Also update API
  const user = getCurrentUser();
  if (user) {
    const r = role || user.role;
    fetch(`${API_BASE}/notifications/read-all/${encodeURIComponent(user.phone)}/${r}`, {
      method: "PATCH",
    }).catch(() => {});
  }
}

export function deleteNotification(id: string) {
  const all: AppNotification[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  localStorage.setItem(LS_KEY, JSON.stringify(all.filter((n) => n.id !== id)));

  // Also delete from API
  fetch(`${API_BASE}/notifications/${id}`, { method: "DELETE" }).catch(() => {});
}

export function clearAllNotifications(role?: string) {
  if (role) {
    const all: AppNotification[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    localStorage.setItem(LS_KEY, JSON.stringify(all.filter((n) => n.role !== role)));
  } else {
    localStorage.setItem(LS_KEY, "[]");
  }

  // Also clear from API
  const user = getCurrentUser();
  if (user) {
    const r = role || user.role;
    fetch(`${API_BASE}/notifications/clear/${encodeURIComponent(user.phone)}/${r}`, {
      method: "DELETE",
    }).catch(() => {});
  }
}

// getUnreadCount: Returns the number of unread notifications for a given role.
// This is shown as a badge number on the "Notifications" link in the header.
export function getUnreadCount(role?: string): number {
  return getNotifications(role).filter((n) => !n.read).length;
}

// seedNotifications: Pre-fills sample/demo notifications for each role.
// Called on first login so users see something in their notification tray.
// Uses a localStorage flag to avoid re-seeding after the user clears notifications.
export function seedNotifications(role?: string) {
  // Use a separate flag to track if we've already seeded for this role
  const seedKey = `ee_notifications_seeded_${role || "all"}`;
  if (localStorage.getItem(seedKey) === "true") return;

  const existing = getNotifications(role);
  if (existing.length > 0) return;

  const now = Date.now();
  const samples: AppNotification[] = [];

  // ── Customer notifications ──
  if (!role || role === "customer") {
    samples.push(
      {
        id: crypto.randomUUID(), role: "customer",
        type: "order_confirmed",
        title: "Order Confirmed!",
        message: "Your shipment EE-742-9910 from Mumbai → Delhi has been confirmed. Estimated delivery: 2 days.",
        awb: "EE-742-9910",
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(), read: false,
      },
      {
        id: crypto.randomUUID(), role: "customer",
        type: "agent_assigned",
        title: "Agent Assigned",
        message: "Delivery agent has been assigned to your shipment EE-742-9910. ETA for pickup: 45 mins.",
        awb: "EE-742-9910",
        timestamp: new Date(now - 1.5 * 60 * 60 * 1000).toISOString(), read: false,
      },
      {
        id: crypto.randomUUID(), role: "customer",
        type: "out_for_delivery",
        title: "Out for Delivery",
        message: "Your shipment EE-8829-0012 is out for delivery in Bangalore. Agent is on the way.",
        awb: "EE-8829-0012",
        timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(), read: true,
      },
      {
        id: crypto.randomUUID(), role: "customer",
        type: "delivered",
        title: "Delivered Successfully!",
        message: "Shipment EE-1055-3347 has been delivered in Chennai. Signed by: Priya S.",
        awb: "EE-1055-3347",
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(), read: true,
      },
      {
        id: crypto.randomUUID(), role: "customer",
        type: "info",
        title: "Welcome to EagleEye!",
        message: "Thank you for choosing EagleEye Logistics. Track your shipments anytime from the dashboard.",
        timestamp: new Date(now - 48 * 60 * 60 * 1000).toISOString(), read: true,
      },
    );
  }

  // ── Agent notifications ──
  if (!role || role === "agent") {
    samples.push(
      {
        id: crypto.randomUUID(), role: "agent",
        type: "new_delivery",
        title: "New Delivery Assigned",
        message: "Parcel EE-742-9910 assigned to you. Pickup from Andheri Hub → Connaught Place, Delhi. Weight: 2.5 kg.",
        awb: "EE-742-9910",
        timestamp: new Date(now - 30 * 60 * 1000).toISOString(), read: false,
      },
      {
        id: crypto.randomUUID(), role: "agent",
        type: "pickup_reminder",
        title: "Pickup Reminder",
        message: "You have a pending pickup at Sector 62, Noida. Customer: Ravi Kumar. Scheduled: 3:00 PM.",
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(), read: false,
      },
      {
        id: crypto.randomUUID(), role: "agent",
        type: "payment_credited",
        title: "Payment Credited",
        message: "₹450 credited for 3 deliveries completed today. Total earnings this week: ₹3,200.",
        timestamp: new Date(now - 8 * 60 * 60 * 1000).toISOString(), read: true,
      },
      {
        id: crypto.randomUUID(), role: "agent",
        type: "route_updated",
        title: "Route Optimized",
        message: "Your delivery route has been updated to avoid traffic on NH-48. New ETA: 25 mins.",
        timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(), read: true,
      },
      {
        id: crypto.randomUUID(), role: "agent",
        type: "bonus_earned",
        title: "Bonus Earned! 🎉",
        message: "You earned a ₹200 bonus for completing 10+ deliveries today. Keep it up!",
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(), read: true,
      },
    );
  }

  // ── Admin notifications ──
  if (!role || role === "admin") {
    samples.push(
      {
        id: crypto.randomUUID(), role: "admin",
        type: "system_alert",
        title: "System Alert",
        message: "Server response time increased by 15% in the last hour. Monitoring auto-scaling.",
        timestamp: new Date(now - 45 * 60 * 1000).toISOString(), read: false,
      },
      {
        id: crypto.randomUUID(), role: "admin",
        type: "low_capacity",
        title: "Hub Capacity Warning",
        message: "Mumbai Hub (BOM) is at 92% capacity. Consider redistributing shipments to Pune Hub.",
        timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(), read: false,
      },
      {
        id: crypto.randomUUID(), role: "admin",
        type: "agent_performance",
        title: "Top Agent This Week",
        message: "Agent Amit Patel completed 47 deliveries with 4.9★ rating. Consider for promotion.",
        timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(), read: true,
      },
      {
        id: crypto.randomUUID(), role: "admin",
        type: "new_query",
        title: "New Customer Query",
        message: "Customer query #4521 received regarding delayed delivery of EE-9012-3344. Priority: High.",
        awb: "EE-9012-3344",
        timestamp: new Date(now - 10 * 60 * 60 * 1000).toISOString(), read: true,
      },
      {
        id: crypto.randomUUID(), role: "admin",
        type: "broadcast_sent",
        title: "Broadcast Delivered",
        message: "Maintenance window broadcast sent to 142 agents in Western Region. 98% acknowledged.",
        timestamp: new Date(now - 30 * 60 * 60 * 1000).toISOString(), read: true,
      },
    );
  }

  // Merge with existing (other roles' notifications)
  const allExisting: AppNotification[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  localStorage.setItem(LS_KEY, JSON.stringify([...samples, ...allExisting]));

  // Mark as seeded so we don't re-seed after user clears
  localStorage.setItem(seedKey, "true");
}
