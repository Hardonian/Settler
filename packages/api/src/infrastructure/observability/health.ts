/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 */

import { query } from "../../db";
import { getDistributedGuarantees } from "../../services/distributed-guards";
import { getRedisClient } from "../../utils/cache";
import { getLedgerService } from "../../domain/services/LedgerService";
import { getOpenFgaAuthorizationService } from "../../services/authz/openfga-authorization-service";

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  latency?: number;
  error?: string;
  timestamp: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: HealthCheck;
    redis?: HealthCheck;
    sentry?: HealthCheck;
    tigerbeetle?: HealthCheck;
    [key: string]: HealthCheck | undefined;
  };
  blocking: string[];
  degraded: string[];
  timestamp: string;
}

export interface ReadinessStatus {
  status: "ready" | "not_ready";
  blocking: string[];
  degraded: string[];
  timestamp: string;
}

export class HealthCheckService {
  private getRedisClient() {
    // Use the shared Redis client from cache utility
    return getRedisClient();
  }

  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await query("SELECT 1");
      const latency = Date.now() - start;
      return {
        status: "healthy",
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    const redisClient = this.getRedisClient();
    if (!redisClient) {
      return {
        status: "degraded",
        error: "Redis not configured",
        timestamp: new Date().toISOString(),
      };
    }

    const start = Date.now();
    try {
      await redisClient.ping();
      const latency = Date.now() - start;
      return {
        status: "healthy",
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkSupabase(): Promise<HealthCheck> {
    try {
      const { checkSupabaseHealth } = await import("../../infrastructure/supabase/client");
      const health = await checkSupabaseHealth();
      return {
        status: health.healthy ? "healthy" : "unhealthy",
        latency: health.latency,
        error: health.error,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkTigerBeetle(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const ledgerService = getLedgerService();
      if (!ledgerService.isEnabled()) {
        return {
          status: "degraded",
          error: "TigerBeetle is disabled in configuration",
          timestamp: new Date().toISOString(),
        };
      }

      const repository = ledgerService.getRepository();
      const healthy = await repository.ping();
      const latency = Date.now() - start;

      return {
        status: healthy ? "healthy" : "unhealthy",
        latency,
        error: healthy ? undefined : repository.getReason(),
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkOpenFga(): Promise<HealthCheck> {
    try {
      const status = await getOpenFgaAuthorizationService().status();
      if (status.state === "available") {
        return {
          status: "healthy",
          timestamp: new Date().toISOString(),
        };
      }

      if (status.state === "disabled" || status.state === "unconfigured") {
        return {
          status: "degraded",
          error: status.reason,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: "unhealthy",
        error: status.reason || "openfga_unavailable",
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkSentry(): Promise<HealthCheck> {
    try {
      // Check if Sentry is configured
      const sentryDsn = process.env.SENTRY_DSN;
      if (!sentryDsn) {
        return {
          status: "degraded",
          error: "Sentry not configured",
          timestamp: new Date().toISOString(),
        };
      }

      // Sentry SDK is initialized if DSN is set
      // We can't directly test Sentry connectivity, but we can verify it's configured
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: "degraded",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  private getCriticalCheckNames(): Set<string> {
    const critical = new Set<string>(["database"]);
    if (process.env.OPENFGA_REQUIRED === "true") {
      critical.add("openfga");
    }
    return critical;
  }

  private classifyChecks(checks: HealthStatus["checks"]): {
    blocking: string[];
    degraded: string[];
  } {
    const critical = this.getCriticalCheckNames();
    const blocking: string[] = [];
    const degraded: string[] = [];

    for (const [name, check] of Object.entries(checks)) {
      if (!check) continue;

      if (critical.has(name)) {
        if (check.status === "unhealthy") {
          blocking.push(name);
        } else if (check.status === "degraded") {
          degraded.push(name);
        }
        continue;
      }

      if (check.status !== "healthy") {
        degraded.push(name);
      }
    }

    return { blocking, degraded };
  }

  async checkAll(): Promise<HealthStatus> {
    const redisClient = this.getRedisClient();
    const [database, redis, sentry, supabase, ledger, openfga, guarantees] = await Promise.all([
      this.checkDatabase(),
      redisClient
        ? this.checkRedis()
        : Promise.resolve<HealthCheck>({
            status: "degraded",
            error: "Redis not configured",
            timestamp: new Date().toISOString(),
          }),
      this.checkSentry(),
      this.checkSupabase(),
      this.checkTigerBeetle(),
      this.checkOpenFga(),
      getDistributedGuarantees(),
    ]);

    const ts = new Date().toISOString();
    const rateLimitGuaranteeCheck: HealthCheck =
      guarantees.rateLimiting === "distributed_shared"
        ? { status: "healthy", timestamp: ts }
        : {
            status: "degraded",
            error: `API rate limiting guarantee is "${guarantees.rateLimiting}" (not shared across instances unless Redis is healthy; Postgres bucket or in-memory fallback may apply)`,
            timestamp: ts,
          };
    const webhookReplayGuaranteeCheck: HealthCheck =
      guarantees.webhookReplayDedup === "distributed_shared"
        ? { status: "healthy", timestamp: ts }
        : {
            status: "degraded",
            error: `Webhook replay deduplication guarantee is "${guarantees.webhookReplayDedup}" (not shared across instances unless Redis is healthy; Postgres or in-memory fallback may apply)`,
            timestamp: ts,
          };

    const checks = {
      database,
      redis,
      sentry,
      supabase,
      tigerbeetle: ledger,
      openfga,
      rate_limit_guarantee: rateLimitGuaranteeCheck,
      webhook_replay_guarantee: webhookReplayGuaranteeCheck,
    };

    const classification = this.classifyChecks(checks);
    const overallStatus =
      classification.blocking.length > 0
        ? "unhealthy"
        : classification.degraded.length > 0
          ? "degraded"
          : "healthy";

    return {
      status: overallStatus,
      checks,
      blocking: classification.blocking,
      degraded: classification.degraded,
      timestamp: new Date().toISOString(),
    };
  }

  async checkLive(): Promise<{ status: "ok" }> {
    // Liveness check - always returns OK if process is alive
    return { status: "ok" };
  }

  async checkReady(): Promise<ReadinessStatus> {
    // Readiness check - only critical dependencies block traffic.
    // Optional services remain explicit in `degraded` for operator triage.
    const health = await this.checkAll();
    return {
      status: health.blocking.length === 0 ? "ready" : "not_ready",
      blocking: health.blocking,
      degraded: health.degraded,
      timestamp: new Date().toISOString(),
    };
  }
}
