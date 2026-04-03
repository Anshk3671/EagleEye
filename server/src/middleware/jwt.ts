// ============================================================
// server/src/middleware/jwt.ts — JWT Authentication Middleware
//
// JSON Web Token (JWT) is used to verify that API requests come
// from authenticated users. After login, the server gives the user
// a signed token. For every protected API request, the user sends
// this token, and this middleware verifies it.
//
// Flow:
//  1. User logs in via OTP → server generates JWT token
//  2. Frontend stores token in localStorage
//  3. Every API request includes: Authorization: Bearer <token>
//  4. This middleware reads, verifies, and decodes the token
//  5. If valid → attach user info to request and continue
//  6. If invalid/missing → return 401 Unauthorized error
//
// SRS Security requirement: JWT-based session handling with token expiry
// ============================================================

import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// JWT secret key: used to sign and verify tokens (from .env file)
// If not set in .env, use a default development secret
const JWT_SECRET: Secret = process.env.JWT_SECRET || "eagleeye-dev-secret-2026";

// Token expiry: how long a token is valid (default 24 hours, from .env)
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";

// JwtPayload: The data encoded inside each JWT token
export interface JwtPayload {
  userId: string; // User's database ID
  phone: string;  // User's phone number
  role: string;   // "customer", "agent", or "admin"
}

// ── generateToken: Creates a new signed JWT token for a user ──
// Called in auth.ts after successful OTP verification
export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRY as any };
  return jwt.sign(payload as object, JWT_SECRET, options); // Signs the token with the secret
}

// ── verifyToken: Decodes and validates a JWT token ──
// Returns the payload if valid, null if invalid or expired
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null; // Token is invalid, expired, or tampered with
  }
}

// ── authMiddleware: Express middleware that PROTECTS routes ──
// Add this to any route that requires the user to be logged in.
// Example usage in a route: router.get("/data", authMiddleware, handler)
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract the token from the Authorization header
  // Expected format: "Authorization: Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided — reject the request
    return res.status(401).json({ error: "Unauthorized — no token provided" });
  }

  // Extract just the token part (remove "Bearer " prefix)
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);

  if (!payload) {
    // Token is invalid or expired — reject the request
    return res.status(401).json({ error: "Unauthorized — invalid or expired token" });
  }

  // Token is valid — attach decoded user info to the request object
  // Route handlers can now access req.user.role, req.user.userId etc.
  (req as any).user = payload;
  next(); // Pass control to the next middleware or route handler
}

// ── optionalAuth: Like authMiddleware but doesn't block if no token ──
// Used for routes that work for both logged-in and anonymous users.
// If token is present and valid → attach user; if not → continue anyway
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (payload) {
      (req as any).user = payload; // Attach user if token is valid
    }
  }

  next(); // Always continue (whether or not user is attached)
}
