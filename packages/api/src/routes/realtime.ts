import crypto from "node:crypto";
/**
 * Real-time Updates Route
 * WebSocket/SSE endpoint for reconciliation status updates
 */

import { Router, Response } from "express";
import { queryWithTenant } from "../db";
import { AuthRequest } from "../middleware/auth";
import { logInfo, logError, logWarn } from "../utils/logger";
import { redact } from "../utils/redaction";

const router: Router = Router();

interface SSEConnection {
  id: string;
  tenantId: string;
  jobId: string;
  response: Response;
  createdAt: number;
}

const sseConnections = new Map<string, SSEConnection>();
const reconnectAttempts = new Map<string, number[]>();
const MAX_CONNECTIONS_PER_TENANT = 20;
const MAX_CONNECTIONS_PER_JOB = 5;
const RECONNECT_WINDOW_MS = 60_000;
const MAX_RECONNECTS_PER_WINDOW = 12;

function sanitizeExecutionEvent(execution: {
  id: string;
  status: string;
  started_at: Date;
  completed_at: Date | null;
  error: string | null;
  summary: unknown;
}) {
  const redactedSummary = redact(execution.summary ?? {});
  const redactedError = execution.error ? execution.error.slice(0, 256) : null;

  return {
    type: "execution_update",
    executionId: execution.id,
    status: execution.status,
    startedAt: execution.started_at,
    completedAt: execution.completed_at,
    error: redactedError,
    summary: redactedSummary,
  };
}

function recordReconnectAttempt(key: string, now: number): boolean {
  const attempts = reconnectAttempts.get(key) ?? [];
  const recentAttempts = attempts.filter((value) => now - value <= RECONNECT_WINDOW_MS);
  recentAttempts.push(now);
  reconnectAttempts.set(key, recentAttempts);
  return recentAttempts.length <= MAX_RECONNECTS_PER_WINDOW;
}

router.get("/reconciliations/:jobId", async (req: AuthRequest, res: Response): Promise<void> => {
  const jobIdParam = req.params["jobId"];
  const jobId = Array.isArray(jobIdParam) ? (jobIdParam[0] ?? "") : (jobIdParam ?? "");
  const tenantId = req.tenantId;
  const userId = req.userId;

  if (!userId || !tenantId || !jobId) {
    res.status(401).json({ error: "Authentication, tenant context, and Job ID are required" });
    return;
  }

  const reconnectKey = `${tenantId}:${req.ip ?? "unknown"}:${jobId}`;
  const now = Date.now();
  if (!recordReconnectAttempt(reconnectKey, now)) {
    logWarn("SSE reconnect rate limited", { tenantId, jobId, ip: req.ip });
    res.status(429).json({
      error: "REALTIME_RATE_LIMITED",
      message: "Too many realtime reconnect attempts",
      retryAfterSeconds: Math.floor(RECONNECT_WINDOW_MS / 1000),
    });
    return;
  }

  const tenantConnections = [...sseConnections.values()].filter(
    (c) => c.tenantId === tenantId
  ).length;
  if (tenantConnections >= MAX_CONNECTIONS_PER_TENANT) {
    res.status(429).json({
      error: "REALTIME_CONNECTION_LIMIT",
      message: "Tenant realtime connection limit reached",
    });
    return;
  }

  const jobConnections = [...sseConnections.values()].filter(
    (c) => c.tenantId === tenantId && c.jobId === jobId
  ).length;
  if (jobConnections >= MAX_CONNECTIONS_PER_JOB) {
    res.status(429).json({
      error: "REALTIME_JOB_CONNECTION_LIMIT",
      message: "Job realtime connection limit reached",
    });
    return;
  }

  const jobs = await queryWithTenant<{ id: string }>(
    tenantId,
    `SELECT id FROM jobs WHERE id = $1 AND tenant_id = $2`,
    [jobId, tenantId]
  );

  if (jobs.length === 0) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const connectionId = `${tenantId}-${jobId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  sseConnections.set(connectionId, {
    id: connectionId,
    tenantId,
    jobId,
    response: res,
    createdAt: now,
  });

  logInfo("SSE connection established", { connectionId, jobId, tenantId });

  res.write(`data: ${JSON.stringify({ type: "connected", jobId })}\n\n`);

  const pollInterval = setInterval(async () => {
    try {
      if (res.destroyed || res.closed) {
        clearInterval(pollInterval);
        sseConnections.delete(connectionId);
        return;
      }

      const executions = await queryWithTenant<{
        id: string;
        status: string;
        started_at: Date;
        completed_at: Date | null;
        error: string | null;
        summary: unknown;
      }>(
        tenantId,
        `
            SELECT
              id,
              status,
              started_at,
              completed_at,
              error,
              summary
            FROM executions
            WHERE job_id = $1 AND tenant_id = $2
            ORDER BY started_at DESC
            LIMIT 1
          `,
        [jobId, tenantId]
      );

      if (executions.length > 0 && executions[0]) {
        const update = sanitizeExecutionEvent(executions[0]);
        res.write(`data: ${JSON.stringify(update)}\n\n`);
      }
    } catch (error: unknown) {
      logError("SSE polling error", error, { connectionId, jobId, tenantId });
      res.write(`event: error\ndata: ${JSON.stringify({ error: "Polling failed" })}\n\n`);
    }
  }, 2000);

  req.on("close", () => {
    clearInterval(pollInterval);
    sseConnections.delete(connectionId);
    logInfo("SSE connection closed", { connectionId, jobId, tenantId });
  });

  const heartbeatInterval = setInterval(() => {
    if (!res.destroyed && !res.closed) {
      res.write(": heartbeat\n\n");
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeatInterval);
  });
});

/**
 * GET /api/realtime/workbench
 * Global tenant-wide workbench updates
 */
router.get("/workbench", async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId;
  const userId = req.userId;

  if (!userId || !tenantId) {
    res.status(401).json({ error: "Authentication and tenant context are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const connectionId = `workbench-${tenantId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  logInfo("SSE Workbench connection established", { connectionId, tenantId });

  res.write(`data: ${JSON.stringify({ type: "workbench_connected", tenantId })}\n\n`);

  const pollInterval = setInterval(async () => {
    try {
      if (res.destroyed || res.closed) {
        clearInterval(pollInterval);
        return;
      }

      // Fetch global stats for the workbench
      const stats = await queryWithTenant<{
        open_exceptions: string;
        high_severity_exceptions: string;
        active_runs: string;
        last_run_timestamp: Date | null;
      }>(
        tenantId,
        `
          SELECT 
            (SELECT COUNT(*) FROM reconciliation_matches WHERE tenant_id = $1 AND status = 'open') as open_exceptions,
            (SELECT COUNT(*) FROM reconciliation_matches WHERE tenant_id = $1 AND status = 'open' AND severity IN ('high', 'critical')) as high_severity_exceptions,
            (SELECT COUNT(*) FROM recon_results WHERE tenant_id = $1 AND status = 'running') as active_runs,
            (SELECT MAX(completed_at) FROM recon_results WHERE tenant_id = $1 AND status = 'completed') as last_run_timestamp
        `,
        [tenantId]
      );

      // Fetch most recent active runs
      const activeRuns = await queryWithTenant<{
        id: string;
        recon_job_id: string;
        status: string;
        matched_count: number;
        unmatched_source_count: number;
        unmatched_target_count: number;
        source_count: number;
        target_count: number;
      }>(
        tenantId,
        `
          SELECT 
            id, recon_job_id, status, matched_count, unmatched_source_count, unmatched_target_count,
            source_count, target_count
          FROM recon_results
          WHERE tenant_id = $1 AND status = 'running'
          ORDER BY started_at DESC
          LIMIT 5
        `,
        [tenantId]
      );

      // Cast counts to numbers (Postgres COUNT returns bigint as string in many node drivers)
      const formattedStats = {
        open_exceptions: parseInt(stats[0]?.open_exceptions || "0"),
        high_severity_exceptions: parseInt(stats[0]?.high_severity_exceptions || "0"),
        active_runs: parseInt(stats[0]?.active_runs || "0"),
        last_run_timestamp: stats[0]?.last_run_timestamp,
      };

      const formattedRuns = activeRuns.map((run) => ({
        ...run,
        progress:
          run.source_count + run.target_count === 0
            ? 0
            : Math.round(
                ((run.matched_count * 2 + run.unmatched_source_count + run.unmatched_target_count) /
                  (run.source_count + run.target_count)) *
                  100
              ),
      }));

      res.write(
        `data: ${JSON.stringify({
          type: "workbench_update",
          stats: formattedStats,
          activeRuns: formattedRuns,
        })}\n\n`
      );
    } catch (error: unknown) {
      logError("SSE Workbench polling error", error, { connectionId, tenantId });
      // Don't kill the interval on one error, just log it.
    }
  }, 3000);

  req.on("close", () => {
    clearInterval(pollInterval);
    logInfo("SSE Workbench connection closed", { connectionId, tenantId });
  });

  const heartbeatInterval = setInterval(() => {
    if (!res.destroyed && !res.closed) {
      res.write(": heartbeat\n\n");
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeatInterval);
  });
});

export function broadcastJobUpdate(
  jobId: string,
  tenantId: string,
  update: Record<string, unknown>
) {
  const redactedUpdate = redact(update);
  const connections = Array.from(sseConnections.values()).filter(
    (connection) => connection.jobId === jobId && connection.tenantId === tenantId
  );

  connections.forEach((connection) => {
    try {
      if (!connection.response.destroyed && !connection.response.closed) {
        connection.response.write(`data: ${JSON.stringify(redactedUpdate)}\n\n`);
      } else {
        sseConnections.delete(connection.id);
      }
    } catch (error) {
      logError("Failed to broadcast update", error, {
        connectionId: connection.id,
        jobId,
        tenantId,
      });
      sseConnections.delete(connection.id);
    }
  });
}

export { router as realtimeRouter };
