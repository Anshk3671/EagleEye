// ============================================================
// server/src/routes/agents.ts — Agent Management API Routes
//
// Handles delivery agent data and management.
// All routes are mounted under: /api/agents/
//
// Endpoints:
//  - GET  /registered   → List users registered with role="agent"
//  - GET  /             → List all agents (filter by hub, status)
//  - GET  /:id          → Get one agent by ID
//  - PATCH /:id         → Update agent status, assignedTasks, completedToday
//  - POST /             → Create a new agent (auto-generates email if not provided)
// ============================================================
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

export function agentRoutes(prisma: PrismaClient) {
    const router = Router();

    // GET /api/agents/registered — List real registered users with agent role
    router.get("/registered", async (_req, res) => {
        try {
            const users = await prisma.user.findMany({
                where: { role: "agent" },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true, name: true, phone: true, email: true,
                    city: true, address: true, pincode: true, avatar: true,
                    hubCode: true, vehicleType: true, agentId: true,
                    creditPoints: true, createdAt: true,
                },
            });
            res.json(users);
        } catch (error) {
            console.error("Error fetching registered agents:", error);
            res.status(500).json({ error: "Failed to fetch registered agents" });
        }
    });

    // GET /api/agents — List all agents (optionally filter by hub)
    router.get("/", async (req, res) => {
        try {
            const { hub, status } = req.query;

            const where: any = {};
            if (hub && typeof hub === "string") {
                where.hubCode = hub.toUpperCase();
            }
            if (status && typeof status === "string") {
                where.status = status;
            }

            const agents = await prisma.agent.findMany({
                where,
                orderBy: { name: "asc" },
            });

            res.json(agents);
        } catch (error) {
            console.error("Error fetching agents:", error);
            res.status(500).json({ error: "Failed to fetch agents" });
        }
    });

    // GET /api/agents/:id — Get agent by ID
    router.get("/:id", async (req, res) => {
        try {
            const agent = await prisma.agent.findUnique({
                where: { id: req.params.id },
            });

            if (!agent) {
                res.status(404).json({ error: "Agent not found" });
                return;
            }

            res.json(agent);
        } catch (error) {
            console.error("Error fetching agent:", error);
            res.status(500).json({ error: "Failed to fetch agent" });
        }
    });

    // PATCH /api/agents/:id — Update agent status/tasks
    router.patch("/:id", async (req, res) => {
        try {
            const { status, assignedTasks, completedToday } = req.body;

            const agent = await prisma.agent.update({
                where: { id: req.params.id },
                data: {
                    ...(status && { status }),
                    ...(assignedTasks !== undefined && { assignedTasks }),
                    ...(completedToday !== undefined && { completedToday }),
                },
            });

            res.json(agent);
        } catch (error) {
            console.error("Error updating agent:", error);
            res.status(500).json({ error: "Failed to update agent" });
        }
    });

    // POST /api/agents — Create a new agent
    router.post("/", async (req, res) => {
        try {
            const { name, phone, email, hubCode } = req.body;
            if (!name || !phone) {
                res.status(400).json({ error: "Name and phone are required" });
                return;
            }

            // Check if agent with same phone already exists
            const existing = await prisma.agent.findFirst({
                where: { phone: phone.replace(/\s/g, "") },
            });
            if (existing) {
                res.json(existing); // Return existing instead of error
                return;
            }

            // Generate a unique email if not provided
            const agentEmail = email || `${name.split(" ")[0].toLowerCase()}.${Date.now()}@eagleeye.in`;

            const agent = await prisma.agent.create({
                data: {
                    name,
                    phone: phone.replace(/\s/g, ""),
                    email: agentEmail,
                    hubCode: hubCode || "DEL",
                    status: "ACTIVE",
                    assignedTasks: 0,
                    completedToday: 0,
                },
            });

            res.status(201).json(agent);
        } catch (error) {
            console.error("Error creating agent:", error);
            res.status(500).json({ error: "Failed to create agent" });
        }
    });

    return router;
}
