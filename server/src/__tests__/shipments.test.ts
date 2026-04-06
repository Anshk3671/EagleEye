// ─── Shipment Route Tests ────────────────────────────────
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockShipments = [
  {
    id: "s1", awbNumber: "EE-742-9910", status: "IN_TRANSIT",
    origin: "Mumbai", destination: "Delhi", currentLocation: "Nagpur Hub",
    senderName: "Test Sender", receiverName: "Test Receiver",
    weight: 2.5, dimensions: "30x20x15", declaredValue: 5000,
    events: [{ id: "e1", location: "Mumbai", status: "PICKED_UP" }],
  },
];

const mockPrisma = {
  shipment: {
    findMany: vi.fn().mockResolvedValue(mockShipments),
    count: vi.fn().mockResolvedValue(1),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  trackingEvent: {
    create: vi.fn().mockResolvedValue({}),
  },
  dashboardStats: {
    update: vi.fn().mockResolvedValue({}),
  },
};

vi.mock("../services/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  shipmentStatusEmail: vi.fn().mockReturnValue({
    to: "", subject: "Test", html: "<p>Test</p>", text: "Test",
  }),
}));

import { shipmentRoutes } from "../routes/shipments.js";
import express from "express";
import request from "supertest";

describe("Shipment Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/shipments", shipmentRoutes(mockPrisma as any));
  });

  describe("GET /api/shipments", () => {
    it("should list shipments", async () => {
      const res = await request(app).get("/api/shipments");
      expect(res.status).toBe(200);
      expect(res.body.shipments).toBeDefined();
      expect(res.body.total).toBe(1);
    });

    it("should support search param", async () => {
      await request(app).get("/api/shipments?search=Mumbai");
      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it("should support status filter", async () => {
      await request(app).get("/api/shipments?status=IN_TRANSIT");
      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "IN_TRANSIT" }),
        })
      );
    });
  });

  describe("GET /api/shipments/:awb", () => {
    it("should return shipment by AWB", async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipments[0]);
      const res = await request(app).get("/api/shipments/EE-742-9910");
      expect(res.status).toBe(200);
      expect(res.body.awbNumber).toBe("EE-742-9910");
    });

    it("should return 404 for unknown AWB", async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);
      const res = await request(app).get("/api/shipments/UNKNOWN");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/shipments", () => {
    it("should create a new shipment", async () => {
      const newShipment = {
        awbNumber: "EE-999-0001", origin: "Mumbai", destination: "Delhi",
        senderName: "A", receiverName: "B", weight: "1.5",
        dimensions: "10x10x10", declaredValue: "1000",
        expectedDelivery: new Date().toISOString(),
      };
      mockPrisma.shipment.create.mockResolvedValue({ id: "new-1", ...newShipment, events: [] });

      const res = await request(app).post("/api/shipments").send(newShipment);
      expect(res.status).toBe(201);
      expect(mockPrisma.shipment.create).toHaveBeenCalled();
      expect(mockPrisma.dashboardStats.update).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/shipments/:awb", () => {
    it("should update shipment status", async () => {
      mockPrisma.shipment.update.mockResolvedValue({ ...mockShipments[0], status: "DELIVERED" });
      mockPrisma.shipment.findUnique.mockResolvedValue({ ...mockShipments[0], status: "DELIVERED", receiverAddress: "Test" });

      const res = await request(app)
        .patch("/api/shipments/EE-742-9910")
        .send({ status: "DELIVERED", eventDescription: "Delivered successfully" });
      expect(res.status).toBe(200);
      expect(mockPrisma.trackingEvent.create).toHaveBeenCalled();
    });
  });
});
