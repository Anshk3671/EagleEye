// ============================================================
// server/src/routes/promotions.ts — Promotion Management API Routes
//
// Handles CRUD operations for promotional discount codes.
// All routes are mounted under: /api/promotions/
//
// Endpoints:
//  - GET    /             → List all promotions
//  - GET    /active       → List only active, non-expired promotions
//  - POST   /             → Create a new promotion
//  - PATCH  /:id          → Update promotion (toggle active, update fields)
//  - DELETE /:id          → Delete a promotion
// ============================================================
import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

// Default promotions to seed if the table is empty
const SEED_PROMOTIONS = [
    { code: "EAGLE20", title: "EagleEye Launch Offer", description: "20% off on all Express Parcel shipments", discount: 20, type: "percentage", validTill: "2026-04-30", active: true, usageCount: 432, category: "Express Parcel" },
    { code: "FAST50", title: "Premium Rush", description: "Flat ₹50 off on Express Premium", discount: 50, type: "flat", validTill: "2026-12-31", active: true, usageCount: 189, category: "Express Premium" },
    { code: "BULK15", title: "Bulk Discount", description: "15% off on Bulk Shipping orders above ₹5000", discount: 15, type: "percentage", validTill: "2026-05-31", active: true, usageCount: 67, category: "Bulk Shipping" },
    { code: "NEW100", title: "New Customer Bonus", description: "Flat ₹100 off on first shipment", discount: 100, type: "flat", validTill: "2026-12-31", active: true, usageCount: 1245, category: "All Services" },
    { code: "DIWALI30", title: "Diwali Special", description: "30% off on all services during Diwali", discount: 30, type: "percentage", validTill: "2026-10-20", active: false, usageCount: 2890, category: "All Services" },
];

export function promotionRoutes(prisma: PrismaClient) {
    const router = Router();

    // Seed default promotions if table is empty
    async function seedIfEmpty() {
        try {
            const count = await prisma.promotion.count();
            if (count === 0) {
                await prisma.promotion.createMany({ data: SEED_PROMOTIONS });
                console.log("🎁 Seeded default promotions");
            }
        } catch (err) {
            console.warn("⚠️ Could not seed promotions:", (err as Error).message);
        }
    }
    seedIfEmpty();

    // GET /api/promotions — List all promotions
    router.get("/", async (_req, res) => {
        try {
            const promotions = await prisma.promotion.findMany({
                orderBy: { createdAt: "desc" },
            });
            res.json(promotions);
        } catch (error) {
            console.error("Error fetching promotions:", error);
            res.status(500).json({ error: "Failed to fetch promotions" });
        }
    });

    // GET /api/promotions/active — List only active, non-expired promotions
    router.get("/active", async (_req, res) => {
        try {
            const promotions = await prisma.promotion.findMany({
                where: { active: true },
                orderBy: { createdAt: "desc" },
            });
            res.json(promotions);
        } catch (error) {
            console.error("Error fetching active promotions:", error);
            res.status(500).json({ error: "Failed to fetch active promotions" });
        }
    });

    // POST /api/promotions — Create a new promotion
    router.post("/", async (req, res) => {
        try {
            const { code, title, description, discount, type, validTill, category } = req.body;
            if (!code || !title || discount === undefined || !type) {
                return res.status(400).json({ error: "Code, title, discount, and type are required" });
            }

            const promotion = await prisma.promotion.create({
                data: {
                    code: code.toUpperCase(),
                    title,
                    description: description || "",
                    discount: parseFloat(discount),
                    type,
                    validTill: validTill || "2026-12-31",
                    active: true,
                    usageCount: 0,
                    category: category || "All Services",
                },
            });

            res.status(201).json(promotion);
        } catch (error: any) {
            if (error?.code === "P2002") {
                return res.status(409).json({ error: "Promo code already exists" });
            }
            console.error("Error creating promotion:", error);
            res.status(500).json({ error: "Failed to create promotion" });
        }
    });

    // PATCH /api/promotions/:id — Update promotion
    router.patch("/:id", async (req, res) => {
        try {
            const { active, title, description, discount, type, validTill, category, usageCount } = req.body;

            const promotion = await prisma.promotion.update({
                where: { id: req.params.id },
                data: {
                    ...(active !== undefined && { active }),
                    ...(title && { title }),
                    ...(description !== undefined && { description }),
                    ...(discount !== undefined && { discount: parseFloat(discount) }),
                    ...(type && { type }),
                    ...(validTill && { validTill }),
                    ...(category && { category }),
                    ...(usageCount !== undefined && { usageCount }),
                },
            });

            res.json(promotion);
        } catch (error) {
            console.error("Error updating promotion:", error);
            res.status(500).json({ error: "Failed to update promotion" });
        }
    });

    // DELETE /api/promotions/:id — Delete a promotion
    router.delete("/:id", async (req, res) => {
        try {
            await prisma.promotion.delete({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch (error) {
            console.error("Error deleting promotion:", error);
            res.status(500).json({ error: "Failed to delete promotion" });
        }
    });

    return router;
}
