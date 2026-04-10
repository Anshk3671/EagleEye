// ============================================================
// server/src/routes/callbacks.ts — Callback Request API Routes
//
// Manages customer callback requests submitted from the home page contact form.
// All routes are mounted under: /api/callbacks/
//
// Endpoints:
//  - POST   /      → Submit a new callback request (from home page form)
//  - GET    /      → List all callback requests (for admin to review)
//  - PATCH  /:id   → Update callback status: "pending" → "contacted" → "resolved"
// ============================================================
import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

export function callbackRoutes(prisma: PrismaClient) {
    const router = Router();

    // POST /api/callbacks — Submit a callback request (from home page form)
    router.post("/", async (req, res) => {
        try {
            const { name, phone, email, message } = req.body;

            if (!name || !phone) {
                return res.status(400).json({ error: "Name and phone are required." });
            }

            const callback = await prisma.callbackRequest.create({
                data: {
                    name: name.trim(),
                    phone: phone.trim(),
                    email: (email || "").trim(),
                    message: (message || "").trim(),
                },
            });

            res.status(201).json(callback);
        } catch (err) {
            console.error("Create callback error:", err);
            res.status(500).json({ error: "Failed to submit callback request." });
        }
    });

    // GET /api/callbacks — List all callback requests (for admin dashboard)
    router.get("/", async (_req, res) => {
        try {
            const callbacks = await prisma.callbackRequest.findMany({
                orderBy: { createdAt: "desc" },
                take: 20,
            });
            res.json(callbacks);
        } catch (err) {
            console.error("Get callbacks error:", err);
            res.status(500).json({ error: "Failed to fetch callbacks." });
        }
    });

    // PATCH /api/callbacks/:id — Update callback status
    router.patch("/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const callback = await prisma.callbackRequest.update({
                where: { id },
                data: { status },
            });

            res.json(callback);
        } catch (err) {
            console.error("Update callback error:", err);
            res.status(500).json({ error: "Failed to update callback." });
        }
    });

    return router;
}
