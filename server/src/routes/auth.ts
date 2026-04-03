// ============================================================
// server/src/routes/auth.ts — Authentication API Routes
//
// Handles all login, OTP verification, and profile management.
// All routes are mounted under: /api/auth/
//
// Login Flow:
//  1. POST /api/auth/send-otp   → Generate OTP, send via SMS/email
//  2. POST /api/auth/verify-otp → Verify OTP, check if user exists
//  3. POST /api/auth/register   → Create user profile (if new)
//
// Profile Endpoints:
//  - GET  /api/auth/profile/:phone/:role → Get user profile
//  - PUT  /api/auth/profile              → Update profile
//  - GET  /api/auth/admin-hint           → Returns demo admin credentials
//
// Security:
//  - Rate limited: 10 requests per minute per IP
//  - OTP expires after 5 minutes
//  - Admin login requires company email + company ID verification
//  - Uses in-memory OTP fallback when database is unreachable
// ============================================================
import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { sendOtp, checkRateLimit, resetOtpRateLimit } from "../services/sms.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { generateToken } from "../middleware/jwt.js";

// ─── Admin credentials (shown as demo hint on login page) ───
const ADMIN_COMPANY_EMAIL = "admin@eagleeye.in";
const ADMIN_COMPANY_ID = "EAGLE-ADM-2026";

export function authRoutes(prisma: PrismaClient) {
  const router = Router();

  // In-memory OTP store as fallback when DB is unreachable
  const inMemoryOtps = new Map<string, { otp: string; expiresAt: Date; verified: boolean }>();

  // Rate limit: 10 requests per minute per IP for auth routes
  router.use(rateLimit({
    windowMs: 60_000,
    maxRequests: 10,
    message: "Too many auth requests. Please wait a minute.",
  }));

  // ━━━ SEND OTP ━━━
  router.post("/send-otp", async (req, res) => {
    try {
      const { phone, role } = req.body;
      if (!phone || !role) {
        return res.status(400).json({ error: "Phone and role are required" });
      }

      // For admin: validate company credentials
      if (role === "admin") {
        const { companyEmail, companyId } = req.body;
        if (companyEmail !== ADMIN_COMPANY_EMAIL || companyId !== ADMIN_COMPANY_ID) {
          return res.status(403).json({ error: "Invalid company credentials" });
        }
      }

      // Rate limit per phone number
      const rl = checkRateLimit(phone);
      if (!rl.allowed) {
        const retryMin = Math.ceil((rl.retryAfterMs || 0) / 60_000);
        return res.status(429).json({
          error: `Too many OTP requests. Try again in ${retryMin} minute(s).`,
          retryAfterMs: rl.retryAfterMs,
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

      // Always store in memory as fallback
      const memKey = `${phone}:${role}`;
      inMemoryOtps.set(memKey, { otp, expiresAt, verified: false });

      // Try to store OTP in database (non-fatal)
      let dbStored = false;
      try {
        await prisma.otpVerification.deleteMany({ where: { phone, role } });
        await prisma.otpVerification.create({ data: { phone, role, otp, expiresAt } });
        dbStored = true;
      } catch (dbErr) {
        console.warn(`⚠️ [OTP] Database unavailable, using in-memory fallback`);
      }

      // Send via SMS service
      let smsResult = { success: false, message: "SMS not attempted" };
      try {
        smsResult = await sendOtp(phone, otp);
      } catch (smsErr) {
        console.warn(`⚠️ [OTP] SMS send failed:`, (smsErr as Error).message);
      }

      console.log(`🔐 [OTP] Generated for ${phone} (${role}): ${otp} — DB: ${dbStored ? "✅" : "❌ (in-memory)"} — SMS: ${smsResult.message}`);

      const response: Record<string, unknown> = {
        success: true,
        message: smsResult.success ? "OTP sent to your phone" : "OTP generated. Check the page for your code.",
      };

      // In development mode, include OTP in response for easy testing
      if (process.env.NODE_ENV !== "production") {
        response.otp = otp;
      }

      res.json(response);
    } catch (err) {
      console.error("Send OTP error:", err);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // ━━━ VERIFY OTP ━━━
  router.post("/verify-otp", async (req, res) => {
    try {
      const { phone, role, otp } = req.body;
      if (!phone || !role || !otp) {
        return res.status(400).json({ error: "Phone, role, and OTP are required" });
      }

      let verified = false;
      let existingUser = null;

      // Try DB verification first
      try {
        const record = await prisma.otpVerification.findFirst({
          where: { phone, role, otp, verified: false, expiresAt: { gte: new Date() } },
        });

        if (record) {
          await prisma.otpVerification.update({
            where: { id: record.id },
            data: { verified: true },
          });
          verified = true;
        }

        // Check if user exists
        existingUser = await prisma.user.findFirst({ where: { phone, role } });
      } catch (dbErr) {
        console.warn(`⚠️ [Verify] Database unavailable, checking in-memory fallback`);
      }

      // Fallback: check in-memory OTP
      if (!verified) {
        const memKey = `${phone}:${role}`;
        const memOtp = inMemoryOtps.get(memKey);
        if (memOtp && memOtp.otp === otp && !memOtp.verified && memOtp.expiresAt > new Date()) {
          memOtp.verified = true;
          verified = true;
        }
      }

      if (!verified) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      if (existingUser && !existingUser.isNew) {
        const token = generateToken({ userId: existingUser.id, phone: existingUser.phone, role: existingUser.role });
        return res.json({ success: true, isNewUser: false, user: existingUser, token });
      }

      return res.json({ success: true, isNewUser: true, user: null });
    } catch (err) {
      console.error("Verify OTP error:", err);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // ━━━ REGISTER (New user after OTP) ━━━
  router.post("/register", async (req, res) => {
    try {
      const { phone, role, name, email, gender, dob, address, city, pincode, hubCode, vehicleType } = req.body;

      if (!phone || !role || !name) {
        return res.status(400).json({ error: "Phone, role, and name are required" });
      }

      // Check OTP was verified (DB or in-memory)
      let otpVerified = false;
      try {
        const otpRecord = await prisma.otpVerification.findFirst({
          where: { phone, role, verified: true },
        });
        if (otpRecord) otpVerified = true;
      } catch { /* DB unavailable */ }

      // Fallback: check in-memory
      if (!otpVerified) {
        const memKey = `${phone}:${role}`;
        const memOtp = inMemoryOtps.get(memKey);
        if (memOtp && memOtp.verified) otpVerified = true;
      }

      if (!otpVerified) {
        return res.status(403).json({ error: "OTP not verified" });
      }

      // Avatar from name initials
      const avatar = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

      // Try to create/update user in DB
      let user: any = null;
      let token = "";
      try {
        user = await prisma.user.upsert({
          where: { phone_role: { phone, role } },
          update: {
            name, email: email || "", gender: gender || "", dob: dob || "",
            address: address || "", city: city || "", pincode: pincode || "",
            avatar, hubCode: hubCode || "", vehicleType: vehicleType || "", isNew: false,
          },
          create: {
            phone, role, name, email: email || "", gender: gender || "", dob: dob || "",
            address: address || "", city: city || "", pincode: pincode || "",
            avatar, hubCode: hubCode || "", vehicleType: vehicleType || "", isNew: false,
          },
        });

        await prisma.otpVerification.deleteMany({ where: { phone, role } });

        token = generateToken({ userId: user.id, phone: user.phone, role: user.role });
      } catch (dbErr) {
        console.warn(`⚠️ [Register] Database unavailable, creating local session`);
        // Create a local-only user object for dev mode
        user = {
          id: `local-${Date.now()}`, phone, role, name, email: email || "",
          gender: gender || "", dob: dob || "", address: address || "",
          city: city || "", pincode: pincode || "", avatar,
          hubCode: hubCode || "", vehicleType: vehicleType || "",
          isNew: false, creditPoints: 0, createdAt: new Date(),
        };
        token = generateToken({ userId: user.id, phone, role });
      }

      // Clean up in-memory OTP
      inMemoryOtps.delete(`${phone}:${role}`);

      res.json({ success: true, user, token });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // ━━━ GET PROFILE ━━━
  router.get("/profile/:phone/:role", async (req, res) => {
    try {
      const { phone, role } = req.params;
      const user = await prisma.user.findFirst({
        where: { phone, role },
      });

      if (!user || user.isNew) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // ━━━ UPDATE PROFILE ━━━
  router.put("/profile", async (req, res) => {
    try {
      const { phone, role, ...data } = req.body;
      if (!phone || !role) {
        return res.status(400).json({ error: "Phone and role are required" });
      }

      // Avatar from name
      if (data.name) {
        data.avatar = data.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
      }

      const user = await prisma.user.update({
        where: { phone_role: { phone, role } },
        data,
      });

      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ error: "Update failed" });
    }
  });

  // ━━━ ADMIN CREDENTIALS (for showing demo hint) ━━━
  router.get("/admin-hint", (_req, res) => {
    res.json({
      companyEmail: ADMIN_COMPANY_EMAIL,
      companyId: ADMIN_COMPANY_ID,
    });
  });
  // ━━━ DEV HELPER: reset OTP rate limit ─━━
  if (process.env.NODE_ENV !== "production") {
    router.post("/reset-otp-rate-limit", (req, res) => {
      const { phone } = req.body;
      resetOtpRateLimit(phone);
      res.json({ success: true, cleared: phone ? [phone] : "all" });
    });
  }
  return router;
}
