// ============================================================
// server/src/services/payment.ts — Razorpay Payment Service
//
// Handles all payment processing for EagleEye using Razorpay.
// Works in 2 modes:
//  1. LIVE mode: Uses real Razorpay keys from .env (RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET)
//  2. MOCK mode: No keys needed — returns fake order/payment IDs for development
//
// Payment Flow:
//  1. Frontend asks backend to create an order → createOrder()
//  2. Razorpay payment popup opens on frontend
//  3. User pays → Razorpay sends payment_id + signature back
//  4. Backend verifies the signature → verifyPayment()
//  5. If valid → mark shipment as paid in database
//
// Webhook Flow:
//  - Razorpay sends payment events to /api/callbacks → verifyWebhook() validates them
//
// Key functions:
//  - createOrder()     → creates a Razorpay payment order (returns order_id)
//  - verifyPayment()   → verifies HMAC-SHA256 signature after payment
//  - verifyWebhook()   → verifies incoming webhook from Razorpay
//  - fetchPayment()    → gets payment details by payment ID
//  - getPublicKey()    → returns the Razorpay key for the frontend to use
// ============================================================

import crypto from "crypto";

interface OrderParams {
  amount: number; // in paise (₹100 = 10000 paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function isConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getAuth(): string {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

// ── Create Order ──
export async function createOrder(params: OrderParams): Promise<RazorpayOrder> {
  if (!isConfigured()) {
    // Mock mode
    const mockOrder: RazorpayOrder = {
      id: `order_mock_${crypto.randomUUID().slice(0, 12)}`,
      entity: "order",
      amount: params.amount,
      currency: params.currency || "INR",
      receipt: params.receipt,
      status: "created",
      created_at: Math.floor(Date.now() / 1000),
    };
    console.log(`\n💰 [Payment MOCK] Order created: ${mockOrder.id} — ₹${(params.amount / 100).toFixed(2)}\n`);
    return mockOrder;
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${getAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || "INR",
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Razorpay error: ${err.error?.description || res.statusText}`);
  }

  const order = await res.json();
  console.log(`💰 [Razorpay] Order created: ${order.id} — ₹${(params.amount / 100).toFixed(2)}`);
  return order;
}

// ── Verify Payment Signature ──
export function verifyPayment(payload: PaymentVerification): boolean {
  if (!isConfigured()) {
    // Mock mode — always verify
    console.log(`\n✅ [Payment MOCK] Verified: ${payload.razorpay_payment_id}\n`);
    return true;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
    .digest("hex");

  const isValid = expectedSignature === payload.razorpay_signature;
  console.log(`💰 [Razorpay] Signature ${isValid ? "✅ Valid" : "❌ Invalid"}: ${payload.razorpay_payment_id}`);
  return isValid;
}

// ── Verify Webhook Signature ──
export function verifyWebhook(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.log("⚠️  [Webhook] No RAZORPAY_WEBHOOK_SECRET set, skipping verification");
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

// ── Fetch Payment Details ──
export async function fetchPayment(paymentId: string): Promise<any> {
  if (!isConfigured()) {
    return {
      id: paymentId,
      entity: "payment",
      amount: 50000,
      currency: "INR",
      status: "captured",
      method: "upi",
      description: "Mock payment",
      mock: true,
    };
  }

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${getAuth()}` },
  });

  if (!res.ok) throw new Error("Failed to fetch payment");
  return res.json();
}

// ── Get public key (for frontend) ──
export function getPublicKey(): string {
  return process.env.RAZORPAY_KEY_ID || "rzp_mock_key_not_configured";
}

export function isMockMode(): boolean {
  return !isConfigured();
}
