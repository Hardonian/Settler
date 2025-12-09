"use strict";
/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckService = void 0;
const db_1 = require("../../db");
const cache_1 = require("../../utils/cache");
class HealthCheckService {
    getRedisClient() {
        // Use the shared Redis client from cache utility
        return (0, cache_1.getRedisClient)();
    }
    async checkDatabase() {
        const start = Date.now();
        try {
            await (0, db_1.query)('SELECT 1');
            const latency = Date.now() - start;
            return {
                status: 'healthy',
                latency,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async checkRedis() {
        const redisClient = this.getRedisClient();
        if (!redisClient) {
            return {
                status: 'degraded',
                error: 'Redis not configured',
                timestamp: new Date().toISOString(),
            };
        }
        const start = Date.now();
        try {
            await redisClient.ping();
            const latency = Date.now() - start;
            return {
                status: 'healthy',
                latency,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async checkSentry() {
        const start = Date.now();
        try {
            // Check if Sentry is configured
            const sentryDsn = process.env.SENTRY_DSN;
            if (!sentryDsn) {
                return {
                    status: 'degraded',
                    error: 'Sentry not configured',
                    timestamp: new Date().toISOString(),
                };
            }
            // Sentry SDK is initialized if DSN is set
            // We can't directly test Sentry connectivity, but we can verify it's configured
            const latency = Date.now() - start;
            return {
                status: 'healthy',
                latency,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                status: 'degraded',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async checkAll() {
        const redisClient = this.getRedisClient();
        const [database, redis, sentry] = await Promise.all([
            this.checkDatabase(),
            redisClient ? this.checkRedis() : Promise.resolve({
                status: 'degraded',
                error: 'Redis not configured',
                timestamp: new Date().toISOString(),
            }),
            this.checkSentry(),
        ]);
        const checks = {
            database,
            redis,
            sentry,
        };
        const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');
        const anyUnhealthy = Object.values(checks).some((check) => check.status === 'unhealthy');
        const overallStatus = anyUnhealthy
            ? 'unhealthy'
            : allHealthy
                ? 'healthy'
                : 'degraded';
        return {
            status: overallStatus,
            checks,
            timestamp: new Date().toISOString(),
        };
    }
    async checkLive() {
        // Liveness check - always returns OK if process is alive
        return { status: 'ok' };
    }
    async checkReady() {
        // Readiness check - only returns ready if critical dependencies are healthy
        const health = await this.checkAll();
        return {
            status: health.status === 'healthy' ? 'ready' : 'not_ready',
        };
    }
}
exports.HealthCheckService = HealthCheckService;
//# sourceMappingURL=health.js.map