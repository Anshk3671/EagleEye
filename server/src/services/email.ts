// ============================================================
// server/src/services/email.ts — Email Sending Service
//
// Handles all outgoing emails from the EagleEye system.
// Supports 3 modes (configured via .env):
//  1. SMTP (Gmail, Outlook) — set EMAIL_PROVIDER=smtp
//  2. SendGrid — set EMAIL_PROVIDER=sendgrid
//  3. Console (default) — prints email to terminal (for development)
//
// Key functions:
//  - sendEmail()              → sends any email
//  - shipmentStatusEmail()    → template for shipment status updates
//  - otpEmail()               → template for OTP verification codes
// ============================================================

import { createTransport, type Transporter } from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  message: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const provider = process.env.EMAIL_PROVIDER || "console";

  if (provider === "smtp") {
    transporter = createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  if (provider === "sendgrid") {
    transporter = createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
    return transporter;
  }

  return null; // Console mode
}

// ── Send email ──
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || "console";
  const from = process.env.EMAIL_FROM || "noreply@eagleeye.in";

  if (provider === "console" || !getTransporter()) {
    console.log(`\n╔══════════════════════════════════════════════╗`);
    console.log(`║  📧 EMAIL (console mode)                     ║`);
    console.log(`║  To: ${options.to.padEnd(39)} ║`);
    console.log(`║  Subject: ${options.subject.slice(0, 34).padEnd(34)} ║`);
    console.log(`╚══════════════════════════════════════════════╝`);
    if (options.text) console.log(`  Body: ${options.text.slice(0, 200)}\n`);
    return { success: true, message: "Email logged to console (dev mode)" };
  }

  try {
    const info = await getTransporter()!.sendMail({
      from: `"EagleEye Logistics" <${from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`📧 [Email] Sent to ${options.to}: ${info.messageId}`);
    return { success: true, message: `Email sent: ${info.messageId}` };
  } catch (err) {
    console.error("❌ [Email ERROR]", err);
    return { success: false, message: "Failed to send email" };
  }
}

// ── Pre-built email templates ──

export function shipmentStatusEmail(params: {
  customerName: string;
  awbNumber: string;
  status: string;
  currentLocation: string;
  description: string;
}): EmailOptions & { to: string } {
  const statusEmoji: Record<string, string> = {
    PICKED_UP: "📦",
    IN_TRANSIT: "🚚",
    OUT_FOR_DELIVERY: "🏍️",
    DELIVERED: "✅",
    DELAYED: "⚠️",
    CANCELLED: "❌",
  };

  const emoji = statusEmoji[params.status] || "📋";
  const statusText = params.status.replace(/_/g, " ");

  return {
    to: "", // Caller must set this
    subject: `${emoji} Shipment ${params.awbNumber} — ${statusText}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9ff; padding: 32px;">
        <div style="background: linear-gradient(135deg, #0058BE, #131B2E); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🦅 EagleEye Logistics</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <p style="color: #0B1C30; font-size: 16px;">Hi <strong>${params.customerName}</strong>,</p>
          <div style="background: #f0f4ff; border-left: 4px solid #0058BE; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #45464D;">Tracking Number</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #0058BE;">${params.awbNumber}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; color: #45464D;">Status</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600; color: #0B1C30;">${emoji} ${statusText}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; color: #45464D;">Location</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600; color: #0B1C30;">${params.currentLocation}</td>
            </tr>
            <tr>
              <td style="padding: 12px; color: #45464D;">Update</td>
              <td style="padding: 12px; color: #0B1C30;">${params.description}</td>
            </tr>
          </table>
          <a href="https://eagleeye.in/track" style="display: inline-block; background: #0058BE; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Track Your Shipment →</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">This is an automated notification from EagleEye Logistics.</p>
        </div>
      </div>
    `,
    text: `Hi ${params.customerName}, your shipment ${params.awbNumber} status: ${statusText}. Location: ${params.currentLocation}. ${params.description}`,
  };
}

export function otpEmail(params: { name: string; otp: string }): Omit<EmailOptions, "to"> {
  return {
    subject: `🔐 Your EagleEye Verification Code: ${params.otp}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9ff; padding: 32px;">
        <div style="background: linear-gradient(135deg, #0058BE, #131B2E); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🦅 EagleEye Logistics</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #0B1C30; font-size: 16px;">Hi <strong>${params.name || "there"}</strong>,</p>
          <p style="color: #45464D;">Your verification code is:</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0058BE; background: #f0f4ff; padding: 20px; border-radius: 12px; margin: 20px 0;">${params.otp}</div>
          <p style="color: #999; font-size: 13px;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    `,
    text: `Your EagleEye verification code is: ${params.otp}. Valid for 5 minutes.`,
  };
}
