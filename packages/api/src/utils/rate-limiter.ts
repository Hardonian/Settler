import Redis from "ioredis";
import { config } from "../config";

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
};

export class RedisRateLimiter {
  private redis: Redis;

  private readonly KILL_SWITCH_KEY = "ratelimit:global_kill_switch";

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis(config.redisUrl);
  }

  /**
   * Sets the state of the global kill switch.
   * @param active True to block all traffic, false to allow normally.
   */
  async setGlobalKillSwitch(active: boolean): Promise<void> {
    if (active) {
      await this.redis.set(this.KILL_SWITCH_KEY, "true");
    } else {
      await this.redis.del(this.KILL_SWITCH_KEY);
    }
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
   */
  async checkLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;

    const multi = this.redis.multi();
    multi.get(this.KILL_SWITCH_KEY);
    multi.incr(windowKey);
    multi.expire(windowKey, windowSeconds + 1);

    const results = await multi.exec();
    if (!results) throw new Error("Rate limit execution failed");

    // results[0][1] is the result of GET KILL_SWITCH_KEY
    // results[1][1] is the result of INCR windowKey
    const killSwitchActive = results[0][1] === "true";
    const count = results[1][1] as number;
    
    if (killSwitchActive) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: (Math.floor(now / windowSeconds) + 1) * windowSeconds,
      };
    }

    const remaining = Math.max(0, limit - count);
    const reset = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
    };
  }
}

// Singleton instance for the application
export const rateLimiter = new RedisRateLimiter();
