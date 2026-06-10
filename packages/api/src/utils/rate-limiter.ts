import Redis from "ioredis";
import { config } from "../config";
import { Counter, Gauge } from "prom-client";

const rateLimitCounter = new Counter({
  name: "api_rate_limit_events_total",
  help: "Total number of rate limit events",
  labelNames: ["event_type", "role", "path"],
});

const killSwitchGauge = new Gauge({
  name: "api_kill_switch_active",
  help: "Indicates if the global kill switch is active (1) or inactive (0)",
});

const KILL_SWITCH_KEY = "ratelimit:killswitch";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export type UserRole = "admin" | "standard" | "anonymous";

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

const LIMIT_TIERS: Record<UserRole, RateLimitConfig> = {
  admin: { limit: 1000, windowSeconds: 60 },
  standard: { limit: 100, windowSeconds: 60 },
  anonymous: { limit: 20, windowSeconds: 60 },
};

const ENDPOINT_OVERRIDES: Record<string, RateLimitConfig> = {
  "/api/v1/heavy-op": { limit: 10, windowSeconds: 60 },
  "/api/v1/health": { limit: 500, windowSeconds: 60 },
  // Strict limits for compute-heavy operations to prevent DoS and cost sprawl
  "/api/v1/recon/run": { limit: 10, windowSeconds: 60 },
  "/api/v1/ingestion/csv": { limit: 5, windowSeconds: 60 },
  "/api/v1/governance/close-period": { limit: 5, windowSeconds: 60 },
  "/api/v1/exception-intelligence/analyze": { limit: 20, windowSeconds: 60 },
};

export class RedisRateLimiter {
  private redis: Redis;

  constructor(redisClient?: Redis) {
    const redisUrl = config.redis.url || "redis://localhost:6379";
    this.redis = redisClient || new Redis(redisUrl);
  }

  /**
   * Toggles the global kill switch to block all traffic.
   */
  async setGlobalKillSwitch(active: boolean): Promise<void> {
    if (active) {
      await this.redis.set(KILL_SWITCH_KEY, "true");
      killSwitchGauge.set(1);
    } else {
      await this.redis.del(KILL_SWITCH_KEY);
      killSwitchGauge.set(0);
    }
  }

  /**
   * Returns the current status of the global kill switch.
   */
  async isKillSwitchActive(): Promise<boolean> {
    const status = await this.redis.get(KILL_SWITCH_KEY);
    const active = status === "true";
    killSwitchGauge.set(active ? 1 : 0);
    return active;
  }

  /**
   * Resolves the appropriate limit based on role and endpoint path.
   */
  getLimitForRequest(role: UserRole, path: string): RateLimitConfig {
    // 1. Check for specific endpoint overrides first
    if (ENDPOINT_OVERRIDES[path]) {
      return ENDPOINT_OVERRIDES[path];
    }

    // 2. Fallback to role-based tiers
    return LIMIT_TIERS[role] || LIMIT_TIERS.anonymous;
  }

  /**
   * Checks if a request should be rate limited using a fixed window.
   * @param key The unique identifier (IP, API Key, etc.)
   * @param limit Maximum requests allowed in the window
   * @param windowSeconds Window size in seconds
   * @param labels Optional labels for Prometheus metrics
   */
  async checkLimit(
    key: string,
    limit: number,
    windowSeconds: number,
    labels: { path: string; role: string } = { path: "unknown", role: "unknown" }
  ): Promise<RateLimitResult> {
    // 1. Check Global Kill Switch
    const killSwitch = await this.redis.get(KILL_SWITCH_KEY);
    if (killSwitch === "true") {
      killSwitchGauge.set(1);
      rateLimitCounter.inc({ event_type: "kill_switch", ...labels });
      return {
        success: false,
        limit,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      };
    }

    killSwitchGauge.set(0);

    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;

    const multi = this.redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, windowSeconds + 1);

    const results = await multi.exec();
    if (!results || !results[0]) throw new Error("Rate limit execution failed");

    const count = results[0][1] as number;
    const remaining = Math.max(0, limit - count);
    const reset = (Math.floor(now / windowSeconds) + 1) * windowSeconds;
    const success = count <= limit;

    // 2. Track Metrics
    rateLimitCounter.inc({ event_type: success ? "allowed" : "blocked", ...labels });

    return {
      success,
      limit,
      remaining,
      reset,
    };
  }
}

// Singleton instance for the application
export const rateLimiter = new RedisRateLimiter();

export interface RateLimitCheckRequest {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  ip: string;
  userId?: string;
  tenantId?: string;
  apiKeyId?: string;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  scope: "tenant" | "user" | "ip";
}

export async function checkRateLimit(req: RateLimitCheckRequest): Promise<RateLimitDecision> {
  const path = req.path.startsWith("/api") ? req.path : `/api${req.path}`;
  const scope: RateLimitDecision["scope"] = req.tenantId ? "tenant" : req.userId ? "user" : "ip";
  const role: UserRole =
    req.headers["x-admin"] === "true" ? "admin" : req.userId ? "standard" : "anonymous";
  const { limit, windowSeconds } = rateLimiter.getLimitForRequest(role, path);
  const identity = req.tenantId || req.userId || req.apiKeyId || req.ip;
  const result = await rateLimiter.checkLimit(identity, limit, windowSeconds, { path, role });
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    scope,
  };
}

export function rateLimitMiddleware() {
  return async (
    req: {
      method: string;
      path: string;
      headers: Record<string, unknown>;
      ip?: string;
      userId?: string;
      tenantId?: string;
      apiKeyId?: string;
    },
    res: {
      status: (code: number) => { json: (payload: unknown) => unknown };
      setHeader: (k: string, v: string) => void;
    },
    next: () => void
  ) => {
    const decision = await checkRateLimit({
      method: req.method,
      path: req.path,
      headers: Object.fromEntries(
        Object.entries(req.headers || {}).map(([k, v]) => [
          k,
          typeof v === "string" ? v : undefined,
        ])
      ),
      ip: req.ip || "unknown",
      userId: req.userId,
      tenantId: req.tenantId,
      apiKeyId: req.apiKeyId,
    });

    res.setHeader("X-RateLimit-Limit", String(decision.limit));
    res.setHeader("X-RateLimit-Remaining", String(decision.remaining));
    res.setHeader("X-RateLimit-Reset", String(decision.reset));

    if (!decision.allowed) {
      res.status(429).json({
        error: "RATE_LIMITED",
        message: "Rate limit exceeded",
        scope: decision.scope,
        reset: decision.reset,
      });
      return;
    }
    next();
  };
}
