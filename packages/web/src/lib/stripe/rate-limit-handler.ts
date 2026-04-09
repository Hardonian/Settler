/**
 * Stripe API Rate Limit Handler
 *
 * Handles Stripe API rate limits with exponential backoff.
 * Respects Stripe's rate limit headers and retries automatically.
 */

import Stripe from "stripe";
import { getStripeClient } from "@/domain/billing/stripeService";

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Extract rate limit info from Stripe response headers
 */
function extractRateLimitInfo(headers: Headers): RateLimitInfo | null {
  const limit = headers.get("stripe-ratelimit-limit");
  const remaining = headers.get("stripe-ratelimit-remaining");
  const reset = headers.get("stripe-ratelimit-reset");

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
    };
  }

  return null;
}

/**
 * Calculate backoff delay based on rate limit reset time
 */
function calculateBackoffDelay(resetTime: number, attempt: number): number {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilReset = Math.max(0, resetTime - now);

  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  const exponentialDelay = Math.min(1000 * Math.pow(2, attempt), 30000);

  // Use whichever is longer: time until reset or exponential backoff
  return Math.max(timeUntilReset * 1000, exponentialDelay);
}

/**
 * Safe Stripe API call with rate limit handling
 */
export async function safeStripeCall<T>(
  operation: (stripe: Stripe) => Promise<T>,
  maxRetries = 3
): Promise<{ data: T; rateLimitInfo: RateLimitInfo | null }> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured (demo mode)");
  }
  let lastError: Error | null = null;
  let rateLimitInfo: RateLimitInfo | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute operation
      const result = await operation(stripe);

      // Try to extract rate limit info from last response
      // Note: Stripe SDK doesn't expose headers directly, so we check after
      // In practice, monitor Stripe dashboard for rate limit usage
      return { data: result, rateLimitInfo };
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error
      if (error?.type === "StripeRateLimitError" || error?.statusCode === 429) {
        // Extract reset time from error if available
        const resetTime = error?.headers?.["stripe-ratelimit-reset"]
          ? parseInt(error.headers["stripe-ratelimit-reset"], 10)
          : Date.now() / 1000 + 60; // Default to 60 seconds

        rateLimitInfo = extractRateLimitInfo(new Headers(error.headers || {})) || {
          limit: 100, // Default Stripe limit
          remaining: 0,
          reset: resetTime,
        };

        if (attempt < maxRetries) {
          const delay = calculateBackoffDelay(resetTime, attempt);
          console.warn(`[Stripe] Rate limit hit, retrying after ${delay}ms`, {
            attempt: attempt + 1,
            resetTime,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // For non-rate-limit errors, throw immediately
      if (error?.type !== "StripeRateLimitError" && error?.statusCode !== 429) {
        throw error;
      }
    }
  }

  // If we exhausted retries, throw the last error
  throw lastError || new Error("Stripe API call failed after retries");
}

/**
 * Monitor Stripe rate limit usage
 * Logs warnings when approaching limits
 */
export function monitorStripeRateLimit(rateLimitInfo: RateLimitInfo | null): void {
  if (!rateLimitInfo) {
    return;
  }

  const usagePercent =
    ((rateLimitInfo.limit - rateLimitInfo.remaining) / rateLimitInfo.limit) * 100;

  if (usagePercent >= 90) {
    console.warn("[Stripe] Rate limit usage critical", {
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      usagePercent: usagePercent.toFixed(1),
      resetTime: new Date(rateLimitInfo.reset * 1000).toISOString(),
    });
  } else if (usagePercent >= 75) {
    console.warn("[Stripe] Rate limit usage high", {
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      usagePercent: usagePercent.toFixed(1),
    });
  }
}
