// ============================================================
// server/src/services/sms.ts — SMS OTP Sending Service
//
// Handles sending OTP (One-Time Password) verification codes via SMS.
// Supports 3 providers (configured via .env):
//  1. Fast2SMS — Indian SMS gateway (set SMS_PROVIDER=fast2sms)
//  2. Twilio   — Global SMS provider (set SMS_PROVIDER=twilio)
//  3. Console  — Prints OTP to terminal (default, for development)
//
// Also handles OTP rate limiting:
//  - Max 5 OTP requests per hour per phone number (in production)
//  - Max 20 in development mode
//
// Key functions:
//  - sendOtp(phone, otp)      → sends OTP via configured provider
//  - checkRateLimit(phone)    → checks if more OTPs are allowed
//  - resetOtpRateLimit(phone) → resets the rate limit (used after successful verification)
// ============================================================

interface SmsResult {
  success: boolean;
  message: string;
}

// ── Rate limit store (in-memory — use Redis in production) ─
const otpAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_OTP_PER_HOUR = process.env.NODE_ENV === "production" ? 5 : 20;
const OTP_WINDOW_MS = 60 * 60 * 1000;

export function checkRateLimit(phone: string): { allowed: boolean; retryAfterMs?: number } {
  if (process.env.NODE_ENV !== "production" && process.env.OTP_RATE_LIMIT_DISABLED === "true") {
    return { allowed: true };
  }

  const now = Date.now();
  const entry = otpAttempts.get(phone);

  if (!entry || now > entry.resetAt) {
    otpAttempts.set(phone, { count: 1, resetAt: now + OTP_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_OTP_PER_HOUR) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

export function resetOtpRateLimit(phone?: string) {
  if (phone) {
    otpAttempts.delete(phone);
  } else {
    otpAttempts.clear();
  }
}

// ── Fast2SMS ──
async function sendViaFast2SMS(phone: string, otp: string): Promise<SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    return { success: false, message: "FAST2SMS_API_KEY not set" };
  }

  const cleaned = phone.replace(/[\s+\-]/g, "").replace(/^91/, "");

  try {
    // Use Quick SMS route ("q") — works without DLT registration
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: `Your EagleEye verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        flash: 0,
        numbers: cleaned,
      }),
    });
    const data = await res.json();
    const success = !!data.return;
    console.log(`📱 [Fast2SMS] ${cleaned}: ${success ? "✅ Sent" : "❌ Failed"} ${data.message || ""}`);
    return { success, message: data.message || (success ? "OTP sent" : "SMS failed") };
  } catch (err) {
    console.error("❌ [Fast2SMS ERROR]", err);
    return { success: false, message: "Fast2SMS request failed" };
  }
}

// ── Twilio ──
async function sendViaTwilio(phone: string, otp: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return { success: false, message: "Twilio credentials not set" };
  }

  const to = phone.startsWith("+") ? phone : `+91${phone.replace(/[\s\-]/g, "")}`;

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const body = new URLSearchParams({
      To: to,
      From: from,
      Body: `Your EagleEye verification code is: ${otp}. Valid for 5 minutes.`,
    });

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json();
    const success = res.ok;
    if (success) {
      console.log(`📱 [Twilio] ${to}: ✅ Sent — SID: ${data.sid}`);
    } else {
      console.error(`📱 [Twilio] ${to}: ❌ Failed — Code: ${data.code}, Message: ${data.message}, More: ${data.more_info}`);
    }
    return { success, message: success ? "OTP sent via Twilio" : data.message || "Twilio failed" };
  } catch (err) {
    console.error("❌ [Twilio ERROR]", err);
    return { success: false, message: "Twilio request failed" };
  }
}

// ── Console (development fallback) ──
function sendViaConsole(phone: string, otp: string): SmsResult {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  📱 OTP for ${phone.padEnd(15)}       ║`);
  console.log(`║  🔑 Code: ${otp}                      ║`);
  console.log(`║  ⏱️  Expires in 5 minutes             ║`);
  console.log(`╚══════════════════════════════════════╝\n`);
  return { success: true, message: "OTP logged to console (dev mode)" };
}

// ── Main send function ──
export async function sendOtp(phone: string, otp: string): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER || "console";

  // Try the configured provider first
  if (provider === "fast2sms") {
    const result = await sendViaFast2SMS(phone, otp);
    if (result.success) return result;
    console.log("⚠️  Fast2SMS failed, falling back to console");
  } else if (provider === "twilio") {
    const result = await sendViaTwilio(phone, otp);
    if (result.success) return result;
    console.log("⚠️  Twilio failed, falling back to console");
  }

  // Fallback: always log to console
  return sendViaConsole(phone, otp);
}
