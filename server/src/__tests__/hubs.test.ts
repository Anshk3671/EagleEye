// ─── Hub Route Tests ─────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockHubs = [
  { id: "h1", name: "Mumbai Hub", code: "BOM", city: "Mumbai", region: "West", capacity: 75, activeAgents: 42, status: "OPTIMIZED" },
  { id: "h2", name: "Delhi Hub", code: "DEL", city: "Delhi", region: "North", capacity: 88, activeAgents: 38, status: "WARNING" },
];

const mockAgents = [
  { id: "a1", name: "Agent 1", hubCode: "BOM", status: "ACTIVE" },
];

const mockPrisma = {
  hub: {
    findMany: vi.fn().mockResolvedValue(mockHubs),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  agent: {
    findMany: vi.fn().mockResolvedValue(mockAgents),
  },
};

import { hubRoutes } from "../routes/hubs.js";
import express from "express";
import request from "supertest";

describe("Hub Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/hubs", hubRoutes(mockPrisma as any));
  });

  describe("GET /api/hubs", () => {
    it("should list all hubs", async () => {
      const res = await request(app).get("/api/hubs");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].code).toBe("BOM");
    });
  });

  describe("GET /api/hubs/:code", () => {
    it("should return hub with agents", async () => {
      mockPrisma.hub.findUnique.mockResolvedValue(mockHubs[0]);
      const res = await request(app).get("/api/hubs/BOM");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Mumbai Hub");
      expect(res.body.agents).toBeDefined();
    });

    it("should return 404 for unknown hub", async () => {
      mockPrisma.hub.findUnique.mockResolvedValue(null);
      const res = await request(app).get("/api/hubs/UNKNOWN");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/hubs/:code", () => {
    it("should update hub capacity", async () => {
      mockPrisma.hub.update.mockResolvedValue({ ...mockHubs[0], capacity: 85 });
      const res = await request(app)
        .patch("/api/hubs/BOM")
        .send({ capacity: 85 });
      expect(res.status).toBe(200);
      expect(mockPrisma.hub.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { code: "BOM" },
        })
      );
    });
  });
});
