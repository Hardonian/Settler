/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 */

import { query } from '../../db';
import { getRedisClient } from '../../utils/cache';

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

export class HealthCheckService {
  private getRedisClient() {
    // Use the shared Redis client from cache utility
    return getRedisClient();
  }

  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await query('SELECT 1');
      const latency = Date.now() - start;
      return {
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
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
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkSentry(): Promise<HealthCheck> {
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
    } catch (error: unknown) {
      return {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkAll(): Promise<HealthStatus> {
    const redisClient = this.getRedisClient();
    const [database, redis, sentry] = await Promise.all([
      this.checkDatabase(),
      redisClient ? this.checkRedis() : Promise.resolve<HealthCheck>({
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

    const allHealthy = Object.values(checks).every(
      (check) => check.status === 'healthy'
    );
    const anyUnhealthy = Object.values(checks).some(
      (check) => check.status === 'unhealthy'
    );

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

  async checkLive(): Promise<{ status: 'ok' }> {
    // Liveness check - always returns OK if process is alive
    return { status: 'ok' };
  }

  async checkReady(): Promise<{ status: 'ready' | 'not_ready' }> {
    // Readiness check - only returns ready if critical dependencies are healthy
    const health = await this.checkAll();
    return {
      status: health.status === 'healthy' ? 'ready' : 'not_ready',
    };
  }
}
