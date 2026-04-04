// ============================================================
// server/src/routes/notifications.ts — Notifications API Routes
//
// Manages in-app notifications for customers, agents, and admins.
// All routes are mounted under: /api/notifications/
//
// Endpoints:
//  - GET    /:phone/:role          → Get all notifications for a user (last 50)
//  - GET    /unread-count/:phone/:role → Count of unread notifications
//  - POST   /                      → Create a new notification (called by backend events)
//  - PATCH  /:id/read              → Mark single notification as read
//  - PATCH  /read-all/:phone/:role → Mark all notifications as read for a user
//  - DELETE /:id                   → Delete one notification
//  - DELETE /clear/:phone/:role    → Delete all notifications for a user
// ============================================================

import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

export function notificationRoutes(prisma: PrismaClient) {
  const router = Router();

  // GET /api/notifications/:phone/:role — Get all notifications for a user
  router.get("/:phone/:role", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      const role = req.params.role;

      const notifications = await prisma.notification.findMany({
        where: { userPhone: phone, userRole: role },
        orderBy: { sentAt: "desc" },
        take: 50, // limit to last 50
      });

      res.json({ notifications, total: notifications.length });
    } catch (err) {
      console.error("Fetch notifications error:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // GET /api/notifications/unread-count/:phone/:role — Get unread count
  router.get("/unread-count/:phone/:role", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      const role = req.params.role;

      const count = await prisma.notification.count({
        where: { userPhone: phone, userRole: role, read: false },
      });

      res.json({ count });
    } catch (err) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // POST /api/notifications — Create a notification
  router.post("/", async (req, res) => {
    try {
      const { userPhone, userRole, type, title, message, awb } = req.body;

      if (!userPhone || !userRole || !type || !title || !message) {
        return res.status(400).json({ error: "userPhone, userRole, type, title, and message are required" });
      }

      const notification = await prisma.notification.create({
        data: {
          userPhone,
          userRole,
          type,
          title,
          message,
          awb: awb || "",
        },
      });

      console.log(`🔔 [Notification] ${type} → ${userPhone} (${userRole}): ${title}`);
      res.status(201).json(notification);
    } catch (err) {
      console.error("Create notification error:", err);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // PATCH /api/notifications/:id/read — Mark single notification as read
  router.patch("/:id/read", async (req, res) => {
    try {
      const notification = await prisma.notification.update({
        where: { id: req.params.id },
        data: { read: true },
      });
      res.json(notification);
    } catch (err) {
      console.error("Mark read error:", err);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // PATCH /api/notifications/read-all/:phone/:role — Mark all as read for a user
  router.patch("/read-all/:phone/:role", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      const role = req.params.role;

      const result = await prisma.notification.updateMany({
        where: { userPhone: phone, userRole: role, read: false },
        data: { read: true },
      });

      res.json({ success: true, updated: result.count });
    } catch (err) {
      console.error("Mark all read error:", err);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  // DELETE /api/notifications/:id — Delete a notification
  router.delete("/:id", async (req, res) => {
    try {
      await prisma.notification.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Delete notification error:", err);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // DELETE /api/notifications/clear/:phone/:role — Clear all for user
  router.delete("/clear/:phone/:role", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      const role = req.params.role;

      const result = await prisma.notification.deleteMany({
        where: { userPhone: phone, userRole: role },
      });

      res.json({ success: true, deleted: result.count });
    } catch (err) {
      console.error("Clear notifications error:", err);
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  return router;
}
