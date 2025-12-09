/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 */
export interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    latency?: number;
    error?: string;
    timestamp: string;
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
        database: HealthCheck;
        redis?: HealthCheck;
        sentry?: HealthCheck;
        [key: string]: HealthCheck | undefined;
    };
    timestamp: string;
}
export declare class HealthCheckService {
    private getRedisClient;
    checkDatabase(): Promise<HealthCheck>;
    checkRedis(): Promise<HealthCheck>;
    checkSentry(): Promise<HealthCheck>;
    checkAll(): Promise<HealthStatus>;
    checkLive(): Promise<{
        status: 'ok';
    }>;
    checkReady(): Promise<{
        status: 'ready' | 'not_ready';
    }>;
}
//# sourceMappingURL=health.d.ts.map