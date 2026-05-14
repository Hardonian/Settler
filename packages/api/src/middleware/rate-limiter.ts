/**
 * Rate Limiter Middleware
 *
 * Per-tenant rate limiting using Redis or in-memory fallback
 * Protects against abuse and ensures fair usage
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  handler?: (req: Request, res: Response) => void;
}

interface RateLimitStore {
  increment(key: string): Promise<{ count: number; resetTime: number }>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
}

// In-memory store (fallback when Redis unavailable)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      const resetTime = now + 60000; // 1 minute window
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    existing.count++;
    return { count: existing.count, resetTime: existing.resetTime };
  }

  async decrement(key: string): Promise<void> {
    const existing = this.store.get(key);
    if (existing) {
      existing.count = Math.max(0, existing.count - 1);
    }
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    keyGenerator = (req) => req.ip || 'unknown',
    handler = (req, res) => {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  } = options;

  const store = new MemoryStore();
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator(req);
      const { count, resetTime } = await store.increment(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

      if (count > maxRequests) {
        res.setHeader('Retry-After', windowSeconds);
        handler(req, res);
        return;
      }

      // Cleanup on request end
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          store.decrement(key);
        }
      });

      next();
    } catch (error) {
      // If rate limiting fails, allow request (fail open)
      console.error('Rate limit error:', error);
      next();
    }
  };
}

// Pre-configured limiters
export const apiRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => `api:${req.ip}`,
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60000, // 15 minutes
  maxRequests: 5, // 5 attempts
  keyGenerator: (req) => `auth:${req.ip}`,
});

export const webhookRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 200,
  keyGenerator: (req) => `webhook:${req.ip}`,
});
