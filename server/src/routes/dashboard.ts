// ============================================================
// server/src/routes/dashboard.ts — Admin Dashboard API Routes
//
// Provides aggregated statistics and analytics for the Admin Dashboard.
// All routes are mounted under: /api/dashboard/
//
// Endpoints:
//  - GET /stats   → Key metrics: active shipments, total hubs, agents, utilization
//  - GET /volume  → Daily shipment volume data for bar/line charts
//  - GET /summary → Detailed breakdown: in-transit, delivered, delayed, pending counts
//
// Performance note: Uses Promise.all() for parallel DB queries on /summary
// to minimize response time by running all count queries simultaneously.
// ============================================================
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

export function dashboardRoutes(prisma: PrismaClient) {
    const router = Router();

    // GET /api/dashboard/stats — Dashboard KPIs
    router.get("/stats", async (_req, res) => {
        try {
            const stats = await prisma.dashboardStats.findUnique({
                where: { id: "singleton" },
            });

            // Always compute live counts for hubs and agents
            const [activeShipments, totalHubs, dbAgentCount, registeredUsers] = await Promise.all([
                prisma.shipment.count({ where: { status: { not: "DELIVERED" } } }),
                prisma.hub.count(),
                prisma.agent.count(),
                prisma.user.count({ where: { role: "agent" } }),
            ]);

            // Use 36 (known hub count from mapData) if DB has fewer
            const effectiveHubs = Math.max(totalHubs, 36);
            const effectiveAgents = Math.max(dbAgentCount, registeredUsers, stats?.registeredAgents ?? 0);

            if (!stats) {
                res.json({
                    activeShipments,
                    totalHubs: effectiveHubs,
                    registeredAgents: effectiveAgents,
                    hubUtilization: 0,
                    onlinePercent: "N/A",
                    growthPercent: "N/A",
                    globalReach: "Pan India",
                    loadStatus: "Unknown",
                });
                return;
            }

            res.json({
                ...stats,
                totalHubs: effectiveHubs,
                activeShipments: Math.max(stats.activeShipments, activeShipments),
                registeredAgents: effectiveAgents,
            });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            res.status(500).json({ error: "Failed to fetch dashboard stats" });
        }
    });

    // GET /api/dashboard/volume — Shipping volume chart data
    router.get("/volume", async (_req, res) => {
        try {
            const volume = await prisma.shippingVolume.findMany({
                orderBy: { date: "asc" },
            });
            res.json(volume);
        } catch (error) {
            console.error("Error fetching volume data:", error);
            res.status(500).json({ error: "Failed to fetch volume data" });
        }
    });

    // GET /api/dashboard/summary — Quick summary with computed counts
    router.get("/summary", async (_req, res) => {
        try {
            const [
                totalShipments,
                inTransit,
                delivered,
                delayed,
                pending,
                totalHubs,
                totalAgents,
                activeAgents,
            ] = await Promise.all([
                prisma.shipment.count(),
                prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
                prisma.shipment.count({ where: { status: "DELIVERED" } }),
                prisma.shipment.count({ where: { status: "DELAYED" } }),
                prisma.shipment.count({ where: { status: "PENDING" } }),
                prisma.hub.count(),
                prisma.agent.count(),
                prisma.agent.count({ where: { status: { not: "OFFLINE" } } }),
            ]);

            res.json({
                totalShipments,
                inTransit,
                delivered,
                delayed,
                pending,
                totalHubs: Math.max(totalHubs, 36),
                totalAgents,
                activeAgents,
            });
        } catch (error) {
            console.error("Error fetching summary:", error);
            res.status(500).json({ error: "Failed to fetch summary" });
        }
    });

    return router;
}
