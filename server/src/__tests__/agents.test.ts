// ─── Agent Route Tests ───────────────────────────────────
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAgents = [
  { id: "a1", name: "Rajesh Kumar", email: "rajesh@eagleeye.in", phone: "9876543210", hubCode: "BOM", assignedTasks: 8, completedToday: 5, status: "ACTIVE" },
  { id: "a2", name: "Priya Sharma", email: "priya@eagleeye.in", phone: "9876543211", hubCode: "DEL", assignedTasks: 6, completedToday: 4, status: "ON_ROUTE" },
  { id: "a3", name: "Amit Patel", email: "amit@eagleeye.in", phone: "9876543212", hubCode: "BOM", assignedTasks: 0, completedToday: 0, status: "OFFLINE" },
];

const mockPrisma = {
  agent: {
    findMany: vi.fn().mockResolvedValue(mockAgents),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

import { agentRoutes } from "../routes/agents.js";
import express from "express";
import request from "supertest";

describe("Agent Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/agents", agentRoutes(mockPrisma as any));
  });

  describe("GET /api/agents", () => {
    it("should list all agents", async () => {
      const res = await request(app).get("/api/agents");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
    });

    it("should filter by hub", async () => {
      mockPrisma.agent.findMany.mockResolvedValue([mockAgents[0], mockAgents[2]]);
      const res = await request(app).get("/api/agents?hub=BOM");
      expect(res.status).toBe(200);
      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hubCode: "BOM" }),
        })
      );
    });

    it("should filter by status", async () => {
      mockPrisma.agent.findMany.mockResolvedValue([mockAgents[0]]);
      const res = await request(app).get("/api/agents?status=ACTIVE");
      expect(res.status).toBe(200);
      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "ACTIVE" }),
        })
      );
    });
  });

  describe("GET /api/agents/:id", () => {
    it("should return agent by ID", async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(mockAgents[0]);
      const res = await request(app).get("/api/agents/a1");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Rajesh Kumar");
    });

    it("should return 404 for unknown agent", async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);
      const res = await request(app).get("/api/agents/unknown");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/agents/:id", () => {
    it("should update agent status", async () => {
      mockPrisma.agent.update.mockResolvedValue({ ...mockAgents[0], status: "ON_ROUTE" });
      const res = await request(app)
        .patch("/api/agents/a1")
        .send({ status: "ON_ROUTE" });
      expect(res.status).toBe(200);
      expect(mockPrisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "a1" },
          data: expect.objectContaining({ status: "ON_ROUTE" }),
        })
      );
    });

    it("should update agent tasks", async () => {
      mockPrisma.agent.update.mockResolvedValue({ ...mockAgents[0], assignedTasks: 10, completedToday: 7 });
      const res = await request(app)
        .patch("/api/agents/a1")
        .send({ assignedTasks: 10, completedToday: 7 });
      expect(res.status).toBe(200);
    });
  });
});
