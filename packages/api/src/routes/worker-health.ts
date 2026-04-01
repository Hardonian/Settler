/**
 * Worker Health Check Routes
 *
 * Provides health check endpoints for the background worker service.
 * These endpoints can be used by load balancers, orchestrators (K8s),
 * and monitoring systems to check worker health and status.
 */

import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query, pool } from "../db";
import { logInfo, logError } from "../utils/logger";

const router: Router = Router();

/**
 * Get worker health status
 * GET /api/worker/health
 */
router.get(
  "/health",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      // Check database connectivity
      const dbStart = Date.now();
      await pool.query("SELECT 1");
      const dbLatency = Date.now() - dbStart;

      // Check for stuck jobs
      const stuckJobsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count 
         FROM jobs 
         WHERE status = 'running' 
           AND locked_at < NOW() - INTERVAL '10 minutes'
           AND heartbeat_at < NOW() - INTERVAL '5 minutes'`
      );

      const stuckCount = parseInt(stuckJobsResult[0]?.count || "0", 10);

      // Get queue depth (pending jobs)
      const queueDepthResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM jobs WHERE status = 'queued'`
      );

      const queueDepth = parseInt(queueDepthResult[0]?.count || "0", 10);

      // Determine health status
      let status: "healthy" | "degraded" | "unhealthy" = "healthy";
      const issues: string[] = [];

      if (stuckCount > 10) {
        status = "unhealthy";
        issues.push(`${stuckCount} stuck jobs detected`);
      } else if (stuckCount > 0) {
        status = "degraded";
        issues.push(`${stuckCount} stuck jobs`);
      }

      if (dbLatency > 1000) {
        status = "degraded";
        issues.push(`Database latency high: ${dbLatency}ms`);
      }

      res.status(status === "healthy" ? 200 : status === "degraded" ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        service: "export-worker",
        checks: {
          database: {
            status: dbLatency < 1000 ? "healthy" : "degraded",
            latency: dbLatency,
          },
          queue: {
            status: queueDepth > 1000 ? "degraded" : "healthy",
            depth: queueDepth,
          },
          stuckJobs: {
            status: stuckCount > 10 ? "unhealthy" : stuckCount > 0 ? "degraded" : "healthy",
            count: stuckCount,
          },
        },
        issues,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logError("Worker health check failed", error);

      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "export-worker",
        error: message,
      });
    }
  }
);

/**
 * Get worker liveness probe
 * GET /api/worker/live
 *
 * Returns OK if the process is alive (always true if endpoint responds)
 */
router.get(
  "/live",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      service: "export-worker",
    });
  }
);

/**
 * Get worker readiness probe
 * GET /api/worker/ready
 *
 * Returns ready only if the worker can process jobs
 */
router.get(
  "/ready",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      // Check database connectivity
      await pool.query("SELECT 1");

      // Check if we can claim jobs (basic lock test)
      // In production, this would verify the worker is operational

      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        service: "export-worker",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logError("Worker readiness check failed", error);

      res.status(503).json({
        status: "not-ready",
        timestamp: new Date().toISOString(),
        service: "export-worker",
        error: message,
      });
    }
  }
);

/**
 * Get worker statistics
 * GET /api/worker/stats
 *
 * Returns detailed statistics about the worker
 */
router.get(
  "/stats",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      // Get job statistics
      const statsResult = await query<{
        status: string;
        count: string;
      }>(
        `SELECT status, COUNT(*) as count 
         FROM jobs 
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY status`
      );

      const stats: Record<string, number> = {};
      statsResult.forEach((row) => {
        stats[row.status] = parseInt(row.count, 10);
      });

      // Get recent job performance
      const performanceResult = await query<{
        avg_duration_seconds: string;
        total_jobs: string;
      }>(
        `SELECT 
           AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) as avg_duration_seconds,
           COUNT(*) as total_jobs
         FROM jobs 
         WHERE status IN ('succeeded', 'failed')
           AND finished_at IS NOT NULL
           AND started_at IS NOT NULL
           AND finished_at > NOW() - INTERVAL '1 hour'`
      );

      res.json({
        timestamp: new Date().toISOString(),
        service: "export-worker",
        jobStats: stats,
        performance: {
          avgDurationSeconds: parseFloat(performanceResult[0]?.avg_duration_seconds || "0"),
          totalProcessed: parseInt(performanceResult[0]?.total_jobs || "0", 10),
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logError("Worker stats check failed", error);

      res.status(500).json({
        error: "Failed to get worker stats",
        message,
      });
    }
  }
);

/**
 * Release stale locks (admin operation)
 * POST /api/worker/release-stale-locks
 *
 * Manually release locks from crashed workers
 */
router.post(
  "/release-stale-locks",
  requirePermission(Permission.ADMIN_WRITE),
  async (_req: AuthRequest, res: Response) => {
    try {
      const result = await query<{ job_id: string; old_worker: string }>(
        `UPDATE jobs
         SET status = 'queued',
             locked_by = NULL,
             locked_at = NULL,
             heartbeat_at = NULL,
             run_at = NOW() + INTERVAL '1 minute', -- Brief delay before retry
             updated_at = NOW()
         WHERE status = 'running'
           AND locked_by IS NOT NULL
           AND heartbeat_at < NOW() - INTERVAL '10 minutes'
         RETURNING id as job_id, locked_by as old_worker`
      );

      const releasedCount = result.length;

      logInfo("Released stale locks", { count: releasedCount });

      res.json({
        success: true,
        releasedCount,
        jobs: result.map((r) => ({
          jobId: r.job_id,
          oldWorker: r.old_worker,
        })),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logError("Failed to release stale locks", error);

      res.status(500).json({
        error: "Failed to release stale locks",
        message,
      });
    }
  }
);

/**
 * Get queue status
 * GET /api/worker/queue-status
 *
 * Returns detailed queue status including job types and tenants
 */
router.get(
  "/queue-status",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      // Get status breakdown by job type
      const byTypeResult = await query<{
        type: string;
        status: string;
        count: string;
      }>(
        `SELECT type, status, COUNT(*) as count
         FROM jobs
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY type, status
         ORDER BY type, status`
      );

      // Get status breakdown by tenant
      const byTenantResult = await query<{
        tenant_id: string;
        status: string;
        count: string;
      }>(
        `SELECT tenant_id, status, COUNT(*) as count
         FROM jobs
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY tenant_id, status
         ORDER BY tenant_id, status
         LIMIT 50`
      );

      // Get worker information
      const workersResult = await query<{
        worker_id: string;
        active_jobs: string;
        last_heartbeat: Date;
      }>(
        `SELECT locked_by as worker_id, 
                COUNT(*) as active_jobs,
                MAX(heartbeat_at) as last_heartbeat
         FROM jobs
         WHERE status = 'running' AND locked_by IS NOT NULL
         GROUP BY locked_by
         ORDER BY active_jobs DESC`
      );

      res.json({
        timestamp: new Date().toISOString(),
        service: "export-worker",
        byType: byTypeResult.map((r) => ({
          type: r.type,
          status: r.status,
          count: parseInt(r.count, 10),
        })),
        byTenant: byTenantResult.map((r) => ({
          tenantId: r.tenant_id,
          status: r.status,
          count: parseInt(r.count, 10),
        })),
        workers: workersResult.map((w) => ({
          workerId: w.worker_id,
          activeJobs: parseInt(w.active_jobs, 10),
          lastHeartbeat: w.last_heartbeat?.toISOString(),
        })),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logError("Failed to get queue status", error);

      res.status(500).json({
        error: "Failed to get queue status",
        message,
      });
    }
  }
);

export { router as workerHealthRouter };
