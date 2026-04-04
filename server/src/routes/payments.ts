// ============================================================
// server/src/routes/payments.ts — Razorpay Payment API Routes
//
// Handles all payment operations using Razorpay.
// All routes are mounted under: /api/payments/
//
// Endpoints:
//  - GET  /config              → Returns Razorpay public key and mode (live/mock)
//  - GET  /history/:phone      → Payment history for a customer
//  - POST /create-order        → Creates a Razorpay order (returns order_id to frontend)
//  - POST /verify              → Verifies payment signature after payment completes
//  - POST /webhook             → Handles Razorpay payment webhooks (called by Razorpay)
//
// Payment verification uses HMAC-SHA256 cryptographic signature
// to ensure the payment data was not tampered with.
// ============================================================

import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { createOrder, verifyPayment, verifyWebhook, fetchPayment, getPublicKey, isMockMode } from "../services/payment.js";

export function paymentRoutes(prisma: PrismaClient) {
  const router = Router();

  // GET /api/payments/config — Get public key & mode
  router.get("/config", (_req, res) => {
    res.json({
      keyId: getPublicKey(),
      mockMode: isMockMode(),
      currency: "INR",
    });
  });

  // GET /api/payments/history/:phone — Get payment history for a customer
  router.get("/history/:phone", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      const payments = await prisma.payment.findMany({
        where: { customerPhone: phone },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      res.json({ payments, total: payments.length });
    } catch (err) {
      console.error("Fetch payment history error:", err);
      res.status(500).json({ error: "Failed to fetch payment history" });
    }
  });

  // POST /api/payments/create-order — Create a Razorpay order + save to DB
  router.post("/create-order", async (req, res) => {
    try {
      const { amount, shipmentId, description, customerPhone, awbNumber, paymentMode } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Valid amount is required (in INR)" });
        return;
      }

      const receipt = `rcpt_${shipmentId || Date.now()}`;

      const order = await createOrder({
        amount: Math.round(amount * 100), // Convert rupees to paise
        currency: "INR",
        receipt,
        notes: {
          shipmentId: shipmentId || "",
          description: description || "EagleEye Shipping Payment",
        },
      });

      // Save payment record to DB with PENDING status
      const payment = await prisma.payment.create({
        data: {
          awbNumber: awbNumber || "",
          customerPhone: customerPhone || "",
          amount: amount,
          currency: "INR",
          paymentMode: paymentMode || "PREPAID",
          paymentStatus: "PENDING",
          razorpayOrderId: order.id,
          receipt,
          description: description || "EagleEye Shipping Payment",
        },
      });

      console.log(`💰 [Payment] Order created: ${order.id} — ₹${amount} — DB ID: ${payment.id}`);

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
        paymentId: payment.id,
        keyId: getPublicKey(),
        mockMode: isMockMode(),
      });
    } catch (err: any) {
      console.error("Create order error:", err);
      res.status(500).json({ error: err.message || "Failed to create order" });
    }
  });

  // POST /api/payments/verify — Verify payment after completion + update DB
  router.post("/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({ error: "Missing payment verification fields" });
        return;
      }

      const isValid = verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        // Update DB record to FAILED
        await prisma.payment.updateMany({
          where: { razorpayOrderId: razorpay_order_id },
          data: { paymentStatus: "FAILED" },
        });
        res.status(400).json({ error: "Payment verification failed — invalid signature" });
        return;
      }

      // Fetch payment details from Razorpay
      const rpPayment = await fetchPayment(razorpay_payment_id);

      // Update DB record to PAID
      await prisma.payment.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          paymentStatus: "PAID",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentDate: new Date(),
        },
      });

      console.log(`💰 [Payment] Verified: ${razorpay_payment_id} — Status: PAID`);

      res.json({
        success: true,
        verified: true,
        payment: {
          id: rpPayment.id,
          amount: rpPayment.amount / 100,
          currency: rpPayment.currency,
          status: rpPayment.status,
          method: rpPayment.method,
        },
      });
    } catch (err: any) {
      console.error("Verify payment error:", err);
      res.status(500).json({ error: err.message || "Verification failed" });
    }
  });

  // POST /api/payments/webhook — Razorpay webhook handler
  router.post("/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      const body = JSON.stringify(req.body);

      if (!verifyWebhook(body, signature)) {
        console.log("⚠️  [Webhook] Invalid signature");
        res.status(400).json({ error: "Invalid webhook signature" });
        return;
      }

      const event = req.body.event;
      const payload = req.body.payload;

      console.log(`💰 [Webhook] Event: ${event}`);

      switch (event) {
        case "payment.captured": {
          const pId = payload.payment?.entity?.id;
          const amount = (payload.payment?.entity?.amount || 0) / 100;
          console.log(`  ✅ Payment captured: ${pId} — ₹${amount}`);
          // Update DB
          if (pId) {
            await prisma.payment.updateMany({
              where: { razorpayPaymentId: pId },
              data: { paymentStatus: "PAID", paymentDate: new Date() },
            });
          }
          break;
        }
        case "payment.failed": {
          const pId = payload.payment?.entity?.id;
          console.log(`  ❌ Payment failed: ${pId}`);
          if (pId) {
            await prisma.payment.updateMany({
              where: { razorpayPaymentId: pId },
              data: { paymentStatus: "FAILED" },
            });
          }
          break;
        }
        case "order.paid":
          console.log(`  ✅ Order paid: ${payload.order?.entity?.id}`);
          break;
        default:
          console.log(`  ℹ️  Unhandled event: ${event}`);
      }

      res.json({ status: "ok" });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // ━━━ COD COLLECTION ENDPOINTS (for Agent Payments page) ━━━

  // GET /api/payments/cod/:agentPhone — Get COD parcels for an agent
  router.get("/cod/:agentPhone", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.agentPhone);
      const codPayments = await prisma.payment.findMany({
        where: { paymentMode: "COD" },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      res.json({ parcels: codPayments });
    } catch (err) {
      console.error("Fetch COD parcels error:", err);
      res.status(500).json({ error: "Failed to fetch COD parcels" });
    }
  });

  // POST /api/payments/cod/seed — Seed default COD parcels for demo
  router.post("/cod/seed", async (_req, res) => {
    try {
      const existing = await prisma.payment.count({ where: { paymentMode: "COD" } });
      if (existing > 0) {
        return res.json({ message: "COD data already exists", seeded: false });
      }

      const codParcels = [
        { awbNumber: "EE-331-4455", customerPhone: "+91 98765 00001", amount: 1250, paymentMode: "COD", paymentStatus: "PENDING", description: "Neha Desai" },
        { awbNumber: "EE-887-2201", customerPhone: "+91 98765 00002", amount: 850, paymentMode: "COD", paymentStatus: "PENDING", description: "Harsh Vardhan" },
        { awbNumber: "EE-556-7788", customerPhone: "+91 98765 00003", amount: 3200, paymentMode: "COD", paymentStatus: "PAID", description: "Pooja Bansal" },
        { awbNumber: "EE-112-3344", customerPhone: "+91 98765 00004", amount: 1800, paymentMode: "COD", paymentStatus: "PENDING", description: "Karan Malhotra" },
        { awbNumber: "EE-209-6677", customerPhone: "+91 98765 00005", amount: 600, paymentMode: "COD", paymentStatus: "PAID", description: "Ritu Mishra" },
      ];

      await prisma.payment.createMany({ data: codParcels });
      res.json({ message: "COD data seeded", seeded: true });
    } catch (err) {
      console.error("Seed COD error:", err);
      res.status(500).json({ error: "Failed to seed COD data" });
    }
  });

  // PATCH /api/payments/cod/:awb/collect — Mark a COD payment as collected
  router.patch("/cod/:awb/collect", async (req, res) => {
    try {
      const awb = decodeURIComponent(req.params.awb);

      const updated = await prisma.payment.updateMany({
        where: { awbNumber: awb, paymentMode: "COD" },
        data: { paymentStatus: "PAID", paymentDate: new Date() },
      });

      if (updated.count === 0) {
        return res.status(404).json({ error: "COD payment not found for this AWB" });
      }

      res.json({ success: true, awb, status: "PAID" });
    } catch (err) {
      console.error("Collect COD error:", err);
      res.status(500).json({ error: "Failed to update COD status" });
    }
  });

  return router;
}
