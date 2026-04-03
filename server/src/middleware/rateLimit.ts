// ============================================================
// server/src/middleware/rateLimit.ts — Rate Limiting Middleware
//
// Prevents abuse and brute-force attacks by limiting how many
// requests a single IP address can make in a given time window.
//
// Example: Allow max 5 OTP requests per 15 minutes from one IP.
// If the limit is exceeded, return HTTP 429 (Too Many Requests).
//
// Implementation: In-memory store (a Map). 
// Note: For production with multiple servers, use Redis instead.
// ============================================================

import type { Request, Response, NextFunction } from "express";

// RateLimitEntry: Tracks request count and when the window resets for each IP
interface RateLimitEntry {
  count: number;   // How many requests this IP has made in the current window
  resetAt: number; // Timestamp (ms) when the window resets
}

// rateLimit(): Factory function that creates a rate limiting middleware
// Options:
//   windowMs   — time window in milliseconds (e.g. 15 * 60 * 1000 = 15 minutes)
//   maxRequests — max requests allowed in that window (e.g. 5)
//   keyFn      — optional custom function to extract the key (default: IP address)
//   message    — custom error message when limit is exceeded
export function rateLimit(options: {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests allowed per window
  keyFn?: (req: Request) => string; // Custom key function (default: use IP)
  message?: string;    // Custom error message
}) {
  // In-memory store: maps IP → { count, resetAt }
  const store = new Map<string, RateLimitEntry>();
  const { windowMs, maxRequests, message } = options;

  // Cleanup: Remove expired entries from memory every 60 seconds
  // This prevents the Map from growing indefinitely
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key); // Delete if window has expired
    }
  }, 60_000);

  // Return the actual Express middleware function
  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine the rate limit key (usually the client's IP address)
    const key = options.keyFn ? options.keyFn(req) : req.ip || "unknown";
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      // First request in a new window — start counting
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      // Limit exceeded — reject with 429 Too Many Requests
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000); // Seconds until reset
      res.set("Retry-After", String(retryAfter)); // Tell client when to retry
      res.status(429).json({
        error: message || "Too many requests. Please try again later.",
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    // Increment the request count and allow the request
    entry.count++;
    next();
  };
}
