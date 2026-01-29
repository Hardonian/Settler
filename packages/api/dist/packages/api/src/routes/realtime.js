"use strict";
/**
 * Real-time Updates Route
 * WebSocket/SSE endpoint for reconciliation status updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeRouter = void 0;
exports.broadcastJobUpdate = broadcastJobUpdate;
const express_1 = require("express");
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.realtimeRouter = router;
// Store active SSE connections
const sseConnections = new Map();
/**
 * GET /api/v1/realtime/reconciliations/:jobId
 * Server-Sent Events (SSE) endpoint for reconciliation status updates
 */
router.get("/reconciliations/:jobId", async (req, res) => {
    const { jobId } = req.params;
    const tenantId = req.tenantId || req.userId;
    if (!jobId || !tenantId) {
        res.status(400).json({ error: "Job ID and Tenant ID are required" });
        return;
    }
    // Verify job ownership
    const jobs = await (0, db_1.query)(`SELECT id FROM jobs WHERE id = $1 AND tenant_id = $2`, [
        jobId,
        tenantId,
    ]);
    if (jobs.length === 0) {
        res.status(404).json({ error: "Job not found" });
        return;
    }
    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    // Store connection
    const connectionId = `${tenantId}-${jobId}-${Date.now()}`;
    sseConnections.set(connectionId, res);
    (0, logger_1.logInfo)("SSE connection established", { connectionId, jobId, tenantId });
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "connected", jobId })}\n\n`);
    // Poll for updates every 2 seconds
    const pollInterval = setInterval(async () => {
        try {
            // Check if connection is still alive
            if (res.destroyed || res.closed) {
                clearInterval(pollInterval);
                sseConnections.delete(connectionId);
                return;
            }
            // Fetch latest execution status
            const executions = await (0, db_1.query)(`
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
          `, [jobId, tenantId]);
            if (executions.length > 0 && executions[0]) {
                const execution = executions[0];
                const update = {
                    type: "execution_update",
                    executionId: execution.id,
                    status: execution.status,
                    startedAt: execution.started_at,
                    completedAt: execution.completed_at,
                    error: execution.error,
                    summary: execution.summary,
                };
                res.write(`data: ${JSON.stringify(update)}\n\n`);
            }
        }
        catch (error) {
            (0, logger_1.logError)("SSE polling error", error, { connectionId, jobId });
            const message = error instanceof Error ? error.message : "Polling failed";
            res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
        }
    }, 2000);
    // Handle client disconnect
    req.on("close", () => {
        clearInterval(pollInterval);
        sseConnections.delete(connectionId);
        (0, logger_1.logInfo)("SSE connection closed", { connectionId, jobId });
    });
    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
        if (!res.destroyed && !res.closed) {
            res.write(": heartbeat\n\n");
        }
        else {
            clearInterval(heartbeatInterval);
        }
    }, 30000); // Every 30 seconds
    req.on("close", () => {
        clearInterval(heartbeatInterval);
    });
});
/**
 * Broadcast update to all connections for a job
 */
function broadcastJobUpdate(jobId, tenantId, update) {
    const connections = Array.from(sseConnections.entries()).filter(([id]) => id.includes(jobId) && id.includes(tenantId));
    connections.forEach(([connectionId, res]) => {
        try {
            if (!res.destroyed && !res.closed) {
                res.write(`data: ${JSON.stringify(update)}\n\n`);
            }
            else {
                sseConnections.delete(connectionId);
            }
        }
        catch (error) {
            (0, logger_1.logError)("Failed to broadcast update", error, { connectionId });
            sseConnections.delete(connectionId);
        }
    });
}
//# sourceMappingURL=realtime.js.map