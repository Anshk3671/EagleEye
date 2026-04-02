// ============================================================
// server/src/routes/hubs.ts — Hub Management API Routes
//
// Manages logistics hub locations and their operational status.
// All routes are mounted under: /api/hubs/
//
// Endpoints:
//  - GET   /       → List all hubs (sorted by name)
//  - GET   /:code  → Get one hub by code (e.g. "DEL") + list its agents
//  - PATCH /:code  → Update hub capacity, status, statusNote, or agent count
// ============================================================
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

export function hubRoutes(prisma: PrismaClient) {
    const router = Router();

    // GET /api/hubs — List all hubs
    router.get("/", async (_req, res) => {
        try {
            const hubs = await prisma.hub.findMany({
                orderBy: { name: "asc" },
            });
            res.json(hubs);
        } catch (error) {
            console.error("Error fetching hubs:", error);
            res.status(500).json({ error: "Failed to fetch hubs" });
        }
    });

    // GET /api/hubs/:code — Get hub by code
    router.get("/:code", async (req, res) => {
        try {
            const hub = await prisma.hub.findUnique({
                where: { code: req.params.code.toUpperCase() },
            });

            if (!hub) {
                res.status(404).json({ error: "Hub not found" });
                return;
            }

            // Get agents at this hub
            const agents = await prisma.agent.findMany({
                where: { hubCode: req.params.code.toUpperCase() },
            });

            res.json({ ...hub, agents });
        } catch (error) {
            console.error("Error fetching hub:", error);
            res.status(500).json({ error: "Failed to fetch hub" });
        }
    });

    // PATCH /api/hubs/:code — Update hub capacity/status
    router.patch("/:code", async (req, res) => {
        try {
            const { capacity, status, statusNote, activeAgents } = req.body;

            const hub = await prisma.hub.update({
                where: { code: req.params.code.toUpperCase() },
                data: {
                    ...(capacity !== undefined && { capacity }),
                    ...(status && { status }),
                    ...(statusNote && { statusNote }),
                    ...(activeAgents !== undefined && { activeAgents }),
                },
            });

            res.json(hub);
        } catch (error) {
            console.error("Error updating hub:", error);
            res.status(500).json({ error: "Failed to update hub" });
        }
    });

    return router;
}
