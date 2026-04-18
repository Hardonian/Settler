import { Router, Request, Response } from "express";
import { config } from "../config";
import { query } from "../db";
import { pool } from "../db";
import { HealthCheckService } from "../infrastructure/observability/health";
import { tokenBucket } from "../infrastructure/rate-limiting/TokenBucket";
import { getDistributedGuarantees } from "../services/distributed-guards";

const router: Router = Router();
const healthCheckService = new HealthCheckService();

interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  latency?: number;
  error?: string;
}

// Reserved for future detailed health checks

async function _checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await query("SELECT 1");
    const latency = Date.now() - start;
    return { status: "healthy", latency };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { status: "unhealthy", error: message };
  }
}

// Reserved for future detailed health checks

async function _checkConnectionPool(): Promise<HealthCheck> {
  try {
    const totalConnections = pool.totalCount;
    const idleConnections = pool.idleCount;
    const waitingCount = pool.waitingCount;

    const utilization = (totalConnections - idleConnections) / pool.options.max;

    if (utilization > 0.9) {
      return {
        status: "degraded",
        error: `High connection pool utilization: ${(utilization * 100).toFixed(1)}%`,
      };
    }

    if (waitingCount > 0) {
      return {
        status: "degraded",
        error: `${waitingCount} connections waiting`,
      };
    }

    return { status: "healthy" };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { status: "unhealthy", error: message };
  }
}

// Basic health check (liveness probe)
router.get("/", async (_req: Request, res: Response) => {
  const health = await healthCheckService.checkLive();
  res.json({
    status: health.status,
    timestamp: new Date().toISOString(),
    service: "settler-api",
    version: "1.0.0",
  });
});

// Detailed health check with dependency checks (SEC-06: restricted in production)
router.get("/detailed", async (req: Request, res: Response) => {
  if (config.nodeEnv === "production" || config.nodeEnv === "preview") {
    const ip = req.ip || req.socket.remoteAddress || "";
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
    if (!isLocal) {
      res.status(403).json({ error: "Forbidden", message: "Detailed health is internal only" });
      return;
    }
  }
  const [health, distributedGuarantees] = await Promise.all([
    healthCheckService.checkAll(),
    getDistributedGuarantees(),
  ]);
  res.status(health.status === "unhealthy" ? 503 : 200).json({
    status: health.status,
    checks: health.checks,
    blocking: health.blocking,
    degraded: health.degraded,
    rateLimiting: {
      tokenBucketMode: tokenBucket.mode,
      distributedGuarantee: distributedGuarantees.rateLimiting,
    },
    timestamp: health.timestamp,
    service: "settler-api",
    version: "1.0.0",
  });
});

// Liveness probe (always returns OK if process is alive)
router.get("/live", async (_req: Request, res: Response) => {
  const health = await healthCheckService.checkLive();
  res.status(200).json(health);
});

// Readiness probe (returns ready only if dependencies are healthy)
router.get("/ready", async (_req: Request, res: Response) => {
  const health = await healthCheckService.checkReady();
  res.status(health.status === "ready" ? 200 : 503).json(health);
});

// Database health check endpoint (SEC-06: restricted in production)
router.get("/db", async (req: Request, res: Response) => {
  if (config.nodeEnv === "production" || config.nodeEnv === "preview") {
    const ip = req.ip || req.socket.remoteAddress || "";
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
    if (!isLocal) {
      res.status(403).json({ error: "Forbidden", message: "Database health is internal only" });
      return;
    }
  }
  try {
    const dbCheck = await healthCheckService.checkDatabase();
    const statusCode =
      dbCheck.status === "healthy" ? 200 : dbCheck.status === "degraded" ? 200 : 503;
    res.status(statusCode).json({
      status: dbCheck.status,
      latency: dbCheck.latency,
      error: dbCheck.error,
      timestamp: dbCheck.timestamp,
      service: "settler-api-database",
    });
  } catch (error: unknown) {
    res.status(503).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      service: "settler-api-database",
    });
  }
});

// Reference unused functions to satisfy TypeScript
void _checkDatabase;
void _checkConnectionPool;

export { router as healthRouter };
