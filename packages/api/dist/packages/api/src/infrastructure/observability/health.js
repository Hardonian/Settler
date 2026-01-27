"use strict";
/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    async checkSupabase() {
        try {
            const { checkSupabaseHealth } = await Promise.resolve().then(() => __importStar(require('../../infrastructure/supabase/client')));
            const health = await checkSupabaseHealth();
            return {
                status: health.healthy ? 'healthy' : 'unhealthy',
                latency: health.latency,
                error: health.error,
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
            return {
                status: 'healthy',
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
        const [database, redis, sentry, supabase] = await Promise.all([
            this.checkDatabase(),
            redisClient ? this.checkRedis() : Promise.resolve({
                status: 'degraded',
                error: 'Redis not configured',
                timestamp: new Date().toISOString(),
            }),
            this.checkSentry(),
            this.checkSupabase(),
        ]);
        const checks = {
            database,
            redis,
            sentry,
            supabase,
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