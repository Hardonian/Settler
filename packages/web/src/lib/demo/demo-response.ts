/**
 * Demo Response Helpers
 *
 * Shared utilities for demo API routes. Ensures consistent:
 * - Response headers (X-Demo-Mode, cache control)
 * - Rate limiting via simple in-memory token bucket
 * - Analytics tagging to separate demo traffic from production
 *
 * All demo routes should use `demoJsonResponse()` instead of `NextResponse.json()`
 * and `checkDemoRateLimit()` at the top of each handler.
 */

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Demo response headers
// ---------------------------------------------------------------------------

const DEMO_HEADERS = {
  "X-Demo-Mode": "true",
  "X-Data-Source": "showcase-deterministic",
  "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=60",
} as const;

/**
 * Wrap data in a NextResponse with consistent demo headers.
 */
export function demoJsonResponse<T>(data: T, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  for (const [key, value] of Object.entries(DEMO_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter for demo endpoints
// ---------------------------------------------------------------------------

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // generous but bounded

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

// Periodic cleanup to prevent memory leak (every 5 minutes)
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of buckets) {
        if (entry.resetAt < now) {
          buckets.delete(key);
        }
      }
    }, 5 * 60_000).unref?.();
  }
}

function getClientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit for a demo request.
 * Returns null if allowed, or a 429 NextResponse if rate-limited.
 */
export function checkDemoRateLimit(request: NextRequest): NextResponse | null {
  scheduleCleanup();
  const key = `demo:${getClientKey(request)}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    const response = NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Demo API is rate-limited. Please wait before making more requests.",
        retry_after_seconds: retryAfter,
      },
      { status: 429 }
    );
    response.headers.set("Retry-After", String(retryAfter));
    response.headers.set("X-Demo-Mode", "true");
    return response;
  }

  return null;
}
