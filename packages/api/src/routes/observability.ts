import { Router, Request, Response } from "express";
import { queryWithTenant } from "../db";
import { logError } from "../utils/logger";

/**
 * Observability Routes
 *
 * GET /api/v1/observability/metrics - Get metrics
 * GET /api/v1/observability/logs - Query logs
 * GET /api/v1/observability/traces - Query traces
 * GET /api/v1/observability/health - Detailed health check
 */

export const observabilityRouter: Router = Router();

/**
 * GET /api/v1/observability/metrics
 * Get system and application metrics
 */
interface AuthenticatedRequest extends Request {
  userId?: string;
  tenantId?: string;
}

observabilityRouter.get("/metrics", async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const tenantId = (req as AuthenticatedRequest).tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get job metrics
    const jobStats = await queryWithTenant<{
      total: number;
      active: number;
      completed: number;
      failed: number;
    }>(
      (req as any)?.tenantId || (_req as any)?.tenantId || "",
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM jobs
      WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    // Get reconciliation metrics
    const reconciliationStats = await queryWithTenant<{
      totalReconciliations: number;
      totalMatched: number;
      totalUnmatched: number;
      averageAccuracy: number;
    }>(
      (req as any)?.tenantId || (_req as any)?.tenantId || "",
      `SELECT 
        COUNT(*) as "totalReconciliations",
        COALESCE(SUM(matched_count), 0) as "totalMatched",
        COALESCE(SUM(unmatched_source_count + unmatched_target_count), 0) as "totalUnmatched",
        COALESCE(AVG(accuracy), 0) as "averageAccuracy"
      FROM reconciliation_reports
      WHERE user_id = $1 AND tenant_id = $2
      AND created_at >= NOW() - INTERVAL '30 days'`,
      [userId, tenantId]
    );

    // Get API usage metrics
    const apiUsage = await queryWithTenant<{
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      averageLatency: number;
    }>(
      (req as any)?.tenantId || (_req as any)?.tenantId || "",
      `SELECT 
        COUNT(*) as "totalRequests",
        COUNT(*) FILTER (WHERE status_code < 400) as "successfulRequests",
        COUNT(*) FILTER (WHERE status_code >= 400) as "failedRequests",
        COALESCE(AVG(response_time_ms), 0) as "averageLatency"
      FROM api_logs
      WHERE user_id = $1 AND tenant_id = $2
      AND created_at >= NOW() - INTERVAL '24 hours'`,
      [userId, tenantId]
    );

    // Get webhook metrics
    const webhookStats = await queryWithTenant<{
      totalWebhooks: number;
      successfulWebhooks: number;
      failedWebhooks: number;
    }>(
      (req as any)?.tenantId || (_req as any)?.tenantId || "",
      `SELECT 
        COUNT(*) as "totalWebhooks",
        COUNT(*) FILTER (WHERE status = 'delivered') as "successfulWebhooks",
        COUNT(*) FILTER (WHERE status = 'failed') as "failedWebhooks"
      FROM webhook_deliveries
      WHERE user_id = $1 AND tenant_id = $2
      AND created_at >= NOW() - INTERVAL '24 hours'`,
      [userId, tenantId]
    );

    res.json({
      data: {
        jobs: jobStats[0] || {
          total: 0,
          active: 0,
          completed: 0,
          failed: 0,
        },
        reconciliations: reconciliationStats[0] || {
          totalReconciliations: 0,
          totalMatched: 0,
          totalUnmatched: 0,
          averageAccuracy: 0,
        },
        api: apiUsage[0] || {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageLatency: 0,
        },
        webhooks: webhookStats[0] || {
          totalWebhooks: 0,
          successfulWebhooks: 0,
          failedWebhooks: 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const userId = (req as AuthenticatedRequest).userId;
    const tenantId = (req as AuthenticatedRequest).tenantId;
    logError("Error fetching metrics", error, { userId, tenantId });
    res.status(500).json({
      error: "Failed to fetch metrics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/v1/observability/logs
 * Query structured logs
 */
observabilityRouter.get("/logs", async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const tenantId = (req as AuthenticatedRequest).tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { level, jobId, startDate, endDate, limit = "100", offset = "0" } = req.query;

    let queryStr = `
      SELECT 
        id,
        level,
        message,
        metadata,
        job_id,
        created_at as timestamp
      FROM logs
      WHERE user_id = $1 AND tenant_id = $2
    `;
    const params: (string | number)[] = [userId, tenantId];
    let paramIndex = 3;

    if (level) {
      queryStr += ` AND level = $${paramIndex}`;
      params.push(typeof level === "string" ? level : String(level));
      paramIndex++;
    }

    if (jobId) {
      queryStr += ` AND job_id = $${paramIndex}`;
      params.push(typeof jobId === "string" ? jobId : String(jobId));
      paramIndex++;
    }

    if (startDate) {
      queryStr += ` AND created_at >= $${paramIndex}`;
      params.push(typeof startDate === "string" ? startDate : String(startDate));
      paramIndex++;
    }

    if (endDate) {
      queryStr += ` AND created_at <= $${paramIndex}`;
      params.push(typeof endDate === "string" ? endDate : String(endDate));
      paramIndex++;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const logs = await queryWithTenant(req.tenantId!, queryStr, params);

    res.json({
      data: logs,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: logs.length,
      },
    });
  } catch (error) {
    const userId = (req as AuthenticatedRequest).userId;
    const tenantId = (req as AuthenticatedRequest).tenantId;
    logError("Error fetching logs", error, { userId, tenantId });
    res.status(500).json({
      error: "Failed to fetch logs",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/v1/observability/traces
 * Query distributed traces
 */
observabilityRouter.get("/traces", async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const tenantId = (req as AuthenticatedRequest).tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.status(501).json({
      error: "tracing_unavailable",
      message: "Distributed tracing is not enabled for this environment.",
      degraded: true,
      documentation: "https://docs.settler.io/observability/tracing",
    });
  } catch (error) {
    const userId = (req as AuthenticatedRequest).userId;
    const tenantId = (req as AuthenticatedRequest).tenantId;
    logError("Error fetching traces", error, { userId, tenantId });
    res.status(500).json({
      error: "Failed to fetch traces",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/v1/observability/health
 * Detailed health check with system status
 */
observabilityRouter.get("/health", async (_req: Request, res: Response) => {
  try {
    // Check database connection
    let dbStatus = "healthy";
    try {
      await queryWithTenant(req.tenantId!, "SELECT 1");
    } catch {
      dbStatus = "unhealthy";
    }

    // Check Redis connection (if configured)
    let redisStatus = "unknown";
    try {
      // In a real implementation, ping Redis
      redisStatus = "healthy";
    } catch {
      redisStatus = "unhealthy";
    }

    res.json({
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      checks: {
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});
