"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const db_2 = require("../db");
const health_1 = require("../infrastructure/observability/health");
const router = (0, express_1.Router)();
exports.healthRouter = router;
const healthCheckService = new health_1.HealthCheckService();
// Reserved for future detailed health checks
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _checkDatabase() {
    const start = Date.now();
    try {
        await (0, db_1.query)('SELECT 1');
        const latency = Date.now() - start;
        return { status: 'healthy', latency };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { status: 'unhealthy', error: message };
    }
}
// Reserved for future detailed health checks
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _checkConnectionPool() {
    try {
        const totalConnections = db_2.pool.totalCount;
        const idleConnections = db_2.pool.idleCount;
        const waitingCount = db_2.pool.waitingCount;
        const utilization = (totalConnections - idleConnections) / db_2.pool.options.max;
        if (utilization > 0.9) {
            return {
                status: 'degraded',
                error: `High connection pool utilization: ${(utilization * 100).toFixed(1)}%`,
            };
        }
        if (waitingCount > 0) {
            return {
                status: 'degraded',
                error: `${waitingCount} connections waiting`,
            };
        }
        return { status: 'healthy' };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { status: 'unhealthy', error: message };
    }
}
// Basic health check (liveness probe)
router.get("/", async (_req, res) => {
    const health = await healthCheckService.checkLive();
    res.json({
        status: health.status,
        timestamp: new Date().toISOString(),
        service: "settler-api",
        version: "1.0.0",
    });
});
// Detailed health check with dependency checks
router.get("/detailed", async (_req, res) => {
    const health = await healthCheckService.checkAll();
    res.status(health.status === 'healthy' ? 200 : 503).json({
        status: health.status,
        checks: health.checks,
        timestamp: health.timestamp,
        service: "settler-api",
        version: "1.0.0",
    });
});
// Liveness probe (always returns OK if process is alive)
router.get("/live", async (_req, res) => {
    const health = await healthCheckService.checkLive();
    res.status(200).json(health);
});
// Readiness probe (returns ready only if dependencies are healthy)
router.get("/ready", async (_req, res) => {
    const health = await healthCheckService.checkReady();
    res.status(health.status === 'ready' ? 200 : 503).json(health);
});
// Reference unused functions to satisfy TypeScript
void _checkDatabase;
void _checkConnectionPool;
//# sourceMappingURL=health.js.map