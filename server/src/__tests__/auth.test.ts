// ─── Auth Route Tests ────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock PrismaClient
const mockPrisma = {
  otpVerification: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    create: vi.fn().mockResolvedValue({ id: "otp-1", phone: "9876543210", otp: "123456", role: "customer" }),
    findFirst: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
  },
  user: {
    findFirst: vi.fn(),
    upsert: vi.fn(),
  },
};

// Mock SMS service
vi.mock("../services/sms.js", () => ({
  sendOtp: vi.fn().mockResolvedValue({ success: true, message: "OTP logged to console" }),
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

// Mock rate limit middleware
vi.mock("../middleware/rateLimit.js", () => ({
  rateLimit: () => (_req: any, _res: any, next: any) => next(),
}));

import { authRoutes } from "../routes/auth.js";
import express from "express";
import request from "supertest";

describe("Auth Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes(mockPrisma as any));
  });

  describe("POST /api/auth/send-otp", () => {
    it("should return 400 if phone or role is missing", async () => {
      const res = await request(app)
        .post("/api/auth/send-otp")
        .send({ phone: "9876543210" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("required");
    });

    it("should send OTP successfully", async () => {
      const res = await request(app)
        .post("/api/auth/send-otp")
        .send({ phone: "9876543210", role: "customer" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.otpVerification.deleteMany).toHaveBeenCalledWith({
        where: { phone: "9876543210", role: "customer" },
      });
      expect(mockPrisma.otpVerification.create).toHaveBeenCalled();
    });

    it("should reject admin without company credentials", async () => {
      const res = await request(app)
        .post("/api/auth/send-otp")
        .send({ phone: "9876543210", role: "admin", companyEmail: "wrong", companyId: "wrong" });
      expect(res.status).toBe(403);
    });

    it("should accept admin with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/send-otp")
        .send({
          phone: "9876543210",
          role: "admin",
          companyEmail: "admin@eagleeye.in",
          companyId: "EAGLE-ADM-2026",
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("POST /api/auth/verify-otp", () => {
    it("should return 400 if fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({ phone: "9876543210" });
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid OTP", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({ phone: "9876543210", role: "customer", otp: "000000" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid");
    });

    it("should verify OTP for new user", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue({
        id: "otp-1", phone: "9876543210", otp: "123456", role: "customer", verified: false,
      });
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({ phone: "9876543210", role: "customer", otp: "123456" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isNewUser).toBe(true);
    });

    it("should verify OTP for returning user", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue({
        id: "otp-1", phone: "9876543210", otp: "123456", role: "customer", verified: false,
      });
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-1", phone: "9876543210", role: "customer", name: "Test User", isNew: false,
      });

      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({ phone: "9876543210", role: "customer", otp: "123456" });
      expect(res.status).toBe(200);
      expect(res.body.isNewUser).toBe(false);
      expect(res.body.user.name).toBe("Test User");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should return 400 if required fields missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ phone: "9876543210" });
      expect(res.status).toBe(400);
    });

    it("should return 403 if OTP not verified", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/auth/register")
        .send({ phone: "9876543210", role: "customer", name: "Test" });
      expect(res.status).toBe(403);
    });

    it("should register user successfully", async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue({
        id: "otp-1", verified: true,
      });
      mockPrisma.user.upsert.mockResolvedValue({
        id: "user-1", phone: "9876543210", role: "customer", name: "Test User", avatar: "TU",
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ phone: "9876543210", role: "customer", name: "Test User" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe("Test User");
    });
  });

  describe("GET /api/auth/admin-hint", () => {
    it("should return admin credentials", async () => {
      const res = await request(app).get("/api/auth/admin-hint");
      expect(res.status).toBe(200);
      expect(res.body.companyEmail).toBe("admin@eagleeye.in");
      expect(res.body.companyId).toBe("EAGLE-ADM-2026");
    });
  });
});
