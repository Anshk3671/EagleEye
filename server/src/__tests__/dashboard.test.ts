// ─── Dashboard Route Tests ───────────────────────────────
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStats = {
  id: "singleton",
  activeShipments: 1247,
  totalHubs: 12,
  registeredAgents: 156,
  hubUtilization: 78,
  onlinePercent: "84% online",
  growthPercent: "+12.5%",
  globalReach: "Pan-India",
  loadStatus: "Optimal",
};

const mockVolume = [
  { id: "v1", day: "Mon", date: "2026-03-24", units: 342, trend: "up" },
  { id: "v2", day: "Tue", date: "2026-03-25", units: 389, trend: "up" },
];

const mockPrisma = {
  dashboardStats: {
    findUnique: vi.fn().mockResolvedValue(mockStats),
  },
  shippingVolume: {
    findMany: vi.fn().mockResolvedValue(mockVolume),
  },
  shipment: {
    count: vi.fn().mockResolvedValue(100),
  },
  hub: {
    count: vi.fn().mockResolvedValue(12),
  },
  agent: {
    count: vi.fn().mockResolvedValue(156),
  },
};

import { dashboardRoutes } from "../routes/dashboard.js";
import express from "express";
import request from "supertest";

describe("Dashboard Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/dashboard", dashboardRoutes(mockPrisma as any));
  });

  describe("GET /api/dashboard/stats", () => {
    it("should return dashboard stats", async () => {
      const res = await request(app).get("/api/dashboard/stats");
      expect(res.status).toBe(200);
      expect(res.body.activeShipments).toBe(1247);
      expect(res.body.totalHubs).toBe(12);
      expect(res.body.registeredAgents).toBe(156);
    });

    it("should compute stats if singleton not found", async () => {
      mockPrisma.dashboardStats.findUnique.mockResolvedValue(null);
      const res = await request(app).get("/api/dashboard/stats");
      expect(res.status).toBe(200);
      expect(res.body.activeShipments).toBeDefined();
      expect(mockPrisma.shipment.count).toHaveBeenCalled();
      expect(mockPrisma.hub.count).toHaveBeenCalled();
      expect(mockPrisma.agent.count).toHaveBeenCalled();
    });
  });

  describe("GET /api/dashboard/volume", () => {
    it("should return shipping volume data", async () => {
      const res = await request(app).get("/api/dashboard/volume");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].day).toBe("Mon");
    });
  });

  describe("GET /api/dashboard/summary", () => {
    it("should return computed summary", async () => {
      const res = await request(app).get("/api/dashboard/summary");
      expect(res.status).toBe(200);
      expect(res.body.totalShipments).toBeDefined();
      expect(res.body.totalHubs).toBeDefined();
      expect(res.body.totalAgents).toBeDefined();
    });
  });
});
