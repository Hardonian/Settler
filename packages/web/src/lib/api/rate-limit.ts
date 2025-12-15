/**
 * Rate Limiting Utilities
 * 
 * Provides rate limiting for API routes to prevent abuse.
 * Uses in-memory store (for serverless) or Redis (for persistent storage).
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store (clears on serverless cold start)
const store: RateLimitStore = {};

/**
 * Simple rate limiter using in-memory store
 * For production, consider using Redis or Vercel Edge Config
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = config.keyGenerator 
    ? config.keyGenerator(request)
    : getDefaultKey(request);

  const now = Date.now();
  const entry = store[key];

  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupExpiredEntries(now);
  }

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired entry
    store[key] = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

function getDefaultKey(request: Request): string {
  // Use IP address or API key as default key
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const apiKey = request.headers.get('x-api-key');
  return apiKey ? `api_key:${apiKey.substring(0, 12)}` : `ip:${ip}`;
}

function cleanupExpiredEntries(now: number): void {
  for (const key in store) {
    const entry = store[key];
    if (entry && entry.resetAt < now) {
      delete store[key];
    }
  }
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return async (request: Request): Promise<Response | null> => {
    const result = await rateLimit(request, config);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200, // Return 200 with error envelope
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toString(),
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Continue with request
  };
}
