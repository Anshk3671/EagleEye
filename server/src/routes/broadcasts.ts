// ============================================================
// server/src/routes/broadcasts.ts — Broadcast Management API Routes
//
// Handles broadcast message creation and history.
// All routes are mounted under: /api/broadcasts/
//
// Endpoints:
//  - GET  /  → List broadcast history (newest first)
//  - POST /  → Create a new broadcast message
// ============================================================
import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

// Default broadcasts to seed if table is empty
const SEED_BROADCASTS = [
    { message: "Heavy rain warning: Expect delays in Mumbai region.", target: "All Agents", count: 72, sentAt: new Date("2026-03-30T15:45:00Z") },
    { message: "Diwali sale: 20% discount on Express Premium!", target: "All Customers", count: 1520, sentAt: new Date("2026-03-28T10:00:00Z") },
    { message: "System maintenance scheduled for tonight 2AM-4AM.", target: "Everyone", count: 1842, sentAt: new Date("2026-03-25T18:00:00Z") },
];

export function broadcastRoutes(prisma: PrismaClient) {
    const router = Router();

    // Seed default broadcasts if table is empty
    async function seedIfEmpty() {
        try {
            const count = await prisma.broadcast.count();
            if (count === 0) {
                await prisma.broadcast.createMany({ data: SEED_BROADCASTS });
                console.log("📢 Seeded default broadcasts");
            }
        } catch (err) {
            console.warn("⚠️ Could not seed broadcasts:", (err as Error).message);
        }
    }
    seedIfEmpty();

    // GET /api/broadcasts — List broadcast history
    router.get("/", async (_req, res) => {
        try {
            const broadcasts = await prisma.broadcast.findMany({
                orderBy: { sentAt: "desc" },
            });
            res.json(broadcasts);
        } catch (error) {
            console.error("Error fetching broadcasts:", error);
            res.status(500).json({ error: "Failed to fetch broadcasts" });
        }
    });

    // POST /api/broadcasts — Create a new broadcast
    router.post("/", async (req, res) => {
        try {
            const { message, target, count } = req.body;
            if (!message || !target) {
                return res.status(400).json({ error: "Message and target are required" });
            }

            const broadcast = await prisma.broadcast.create({
                data: {
                    message,
                    target,
                    count: count || 0,
                    sentAt: new Date(),
                },
            });

            res.status(201).json(broadcast);
        } catch (error) {
            console.error("Error creating broadcast:", error);
            res.status(500).json({ error: "Failed to create broadcast" });
        }
    });

    return router;
}
