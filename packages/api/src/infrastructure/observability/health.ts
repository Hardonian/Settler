/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 */

import { query } from "../../db";
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

  async checkAll(): Promise<HealthStatus> {
    const redisClient = this.getRedisClient();
    const [database, redis, sentry, supabase, ledger, openfga] = await Promise.all([
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
    ]);

    const checks = {
      database,
      redis,
      sentry,
      supabase,
      tigerbeetle: ledger,
      openfga,
    };

    const allHealthy = Object.values(checks).every((check) => check.status === "healthy");
    const anyUnhealthy = Object.values(checks).some((check) => check.status === "unhealthy");

    const overallStatus = anyUnhealthy ? "unhealthy" : allHealthy ? "healthy" : "degraded";

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  async checkLive(): Promise<{ status: "ok" }> {
    // Liveness check - always returns OK if process is alive
    return { status: "ok" };
  }

  async checkReady(): Promise<{ status: "ready" | "not_ready" }> {
    // Readiness check - only returns ready if critical dependencies are healthy
    const health = await this.checkAll();
    return {
      status: health.status === "healthy" ? "ready" : "not_ready",
    };
  }
}
