// ============================================================
// server/src/index.ts — Backend Server Entry Point
//
// This is where the Express.js server starts.
// It does the following in order:
//  1. Loads environment variables from .env file
//  2. Creates the Express app and Prisma database client
//  3. Sets up middleware (CORS, JSON parsing, static files)
//  4. Registers all API route handlers
//  5. Starts listening on the configured PORT (default: 3001)
//  6. Handles graceful shutdown on SIGTERM signal
// ============================================================

import "dotenv/config"; // Load environment variables from .env file (API keys, DB URL etc.)
import express from "express"; // Express.js — the web server framework
import cors from "cors";        // CORS — allows frontend (localhost:5173) to talk to backend
import path from "path";        // Node.js path utility for file paths
import { PrismaClient } from "@prisma/client"; // Prisma ORM — talks to the database

// Import all route handlers (each file handles a different API endpoint group)
import { shipmentRoutes } from "./routes/shipments.js";
import { hubRoutes } from "./routes/hubs.js";
import { agentRoutes } from "./routes/agents.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { authRoutes } from "./routes/auth.js";
import { uploadRoutes } from "./routes/uploads.js";
import { paymentRoutes } from "./routes/payments.js";
import { notificationRoutes } from "./routes/notifications.js";
import { pincodeRoutes } from "./routes/pincode.js";
import { callbackRoutes } from "./routes/callbacks.js";
import { promotionRoutes } from "./routes/promotions.js";
import { broadcastRoutes } from "./routes/broadcasts.js";

// Create the Express application
const app = express();

// Create a Prisma client — used to query the database in all route handlers
const prisma = new PrismaClient();

// Server port: reads from .env file, defaults to 3001 if not set
const PORT = process.env.PORT || 3001;

// ── Middleware Setup ──────────────────────────────────────

// CORS: Allows frontend (running on localhost:any port) to make requests to this server
// Without CORS, the browser would block all API requests from the frontend
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allow non-browser requests (e.g., Postman)
        const allowedLocalOrigins = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
        if (allowedLocalOrigins.some((rx) => rx.test(origin))) {
            return callback(null, true); // Allow any localhost origin
        }
        return callback(new Error("Not allowed by CORS")); // Block other origins
    },
    credentials: true, // Allow cookies and auth headers
}));

// JSON body parser: Allows reading request body as JSON (for POST/PUT requests)
app.use(express.json());

// Serve uploaded files (proof of delivery photos etc.) as static files
// e.g., GET /uploads/photo.jpg returns the actual file
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

// ── Health Check Endpoint ─────────────────────────────────
// GET /api/health — Used to verify the server is running and check service status
// Returns: status, timestamp, environment, and which services are active
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        services: {
            sms: process.env.SMS_PROVIDER || "console",         // "twilio" or "console"
            email: process.env.EMAIL_PROVIDER || "console",     // "gmail" or "console"
            payments: process.env.RAZORPAY_KEY_ID ? "razorpay" : "mock", // Payment gateway
            database: process.env.DB_PROVIDER || "sqlite",      // "postgresql" or "sqlite"
        },
    });
});

// ── API Route Registration ────────────────────────────────
// Each route group handles a specific resource type.
// All routes are prefixed with /api/ so they're easy to identify.
// Prisma client is passed to each route so they can query the database.

app.use("/api/auth", authRoutes(prisma));                   // Login, OTP, profile
app.use("/api/shipments", shipmentRoutes(prisma));           // Create/track/update shipments
app.use("/api/hubs", hubRoutes(prisma));                     // Hub management
app.use("/api/agents", agentRoutes(prisma));                 // Agent management
app.use("/api/dashboard", dashboardRoutes(prisma));          // Admin analytics & stats
app.use("/api/uploads", uploadRoutes());                     // File upload handling
app.use("/api/payments", paymentRoutes(prisma));             // Razorpay payment processing
app.use("/api/notifications", notificationRoutes(prisma));   // Send/fetch notifications
app.use("/api/pincode", pincodeRoutes());                    // Pincode lookup (India Post API)
app.use("/api/callbacks", callbackRoutes(prisma));           // Razorpay payment webhooks
app.use("/api/promotions", promotionRoutes(prisma));         // Promotion/coupon management
app.use("/api/broadcasts", broadcastRoutes(prisma));         // Broadcast alerts management

// ── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
    const env = process.env.NODE_ENV || "development";
    console.log(`\n🦅 EagleEye API Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${env}`);
    console.log(`   Database: ${process.env.DB_PROVIDER || "sqlite"}`);
    console.log(`   SMS: ${process.env.SMS_PROVIDER || "console (fallback)"}`);
    console.log(`   Email: ${process.env.EMAIL_PROVIDER || "console (fallback)"}`);
    console.log(`   Payments: ${process.env.RAZORPAY_KEY_ID ? "Razorpay" : "Mock mode"}`);
    console.log(`\n   Routes:`);
    console.log(`   ├─ /api/health`);
    console.log(`   ├─ /api/auth`);
    console.log(`   ├─ /api/shipments`);
    console.log(`   ├─ /api/hubs`);
    console.log(`   ├─ /api/agents`);
    console.log(`   ├─ /api/dashboard`);
    console.log(`   ├─ /api/uploads`);
    console.log(`   ├─ /api/payments`);
    console.log(`   ├─ /api/notifications`);
   console.log(`   ├─ /api/pincode`);
   console.log(`   ├─ /api/callbacks`);
   console.log(`   ├─ /api/promotions`);
   console.log(`   └─ /api/broadcasts\n`);
});

// ── Graceful Shutdown ─────────────────────────────────────
// When the server receives a termination signal (e.g., from Docker or OS),
// it properly disconnects from the database before shutting down.
process.on("SIGTERM", async () => {
    await prisma.$disconnect(); // Close database connections cleanly
    process.exit(0);
});
