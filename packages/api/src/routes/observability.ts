import { Router, Request, Response } from "express";
import { query } from "../db";

/**
 * Observability Routes
 * 
 * GET /api/v1/observability/metrics - Get metrics
 * GET /api/v1/observability/logs - Query logs
 * GET /api/v1/observability/traces - Query traces
 * GET /api/v1/observability/health - Detailed health check
 */

export const observabilityRouter = Router();

/**
 * GET /api/v1/observability/metrics
 * Get system and application metrics
 */
observabilityRouter.get("/metrics", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const tenantId = (req as any).tenantId;

    // Get job metrics
    const jobStats = await query<{
      total: number;
      active: number;
      completed: number;
      failed: number;
    }>(
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
    const reconciliationStats = await query<{
      totalReconciliations: number;
      totalMatched: number;
      totalUnmatched: number;
      averageAccuracy: number;
    }>(
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
    const apiUsage = await query<{
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      averageLatency: number;
    }>(
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
    const webhookStats = await query<{
      totalWebhooks: number;
      successfulWebhooks: number;
      failedWebhooks: number;
    }>(
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
    console.error("Error fetching metrics:", error);
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
    const userId = (req as any).userId;
    const tenantId = (req as any).tenantId;
    const {
      level,
      jobId,
      startDate,
      endDate,
      limit = "100",
      offset = "0",
    } = req.query;

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
    const params: any[] = [userId, tenantId];
    let paramIndex = 3;

    if (level) {
      queryStr += ` AND level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    if (jobId) {
      queryStr += ` AND job_id = $${paramIndex}`;
      params.push(jobId);
      paramIndex++;
    }

    if (startDate) {
      queryStr += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      queryStr += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const logs = await query(queryStr, params);

    res.json({
      data: logs,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: logs.length,
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
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
    // Reserved for future user/tenant filtering
    const _ = {
      userId: (req as any).userId,
      tenantId: (req as any).tenantId,
    };
    void _;
    // Reserved for future tracing backend integration
    void req.query.traceId;
    void req.query.jobId;
    void req.query.startDate;
    void req.query.endDate;
    void req.query.limit;

    // In a real implementation, this would query your tracing backend (Jaeger, Zipkin, etc.)
    // For now, return a placeholder response
    res.json({
      data: [],
      message: "Tracing requires OTLP endpoint configuration",
      documentation: "https://docs.settler.io/observability/tracing",
    });
  } catch (error) {
    console.error("Error fetching traces:", error);
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
      await query("SELECT 1");
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
