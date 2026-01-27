/**
 * Reliability Metrics Storage
 * 
 * Tracks key reliability metrics for operations:
 * - success rate per operation
 * - retries count
 * - dead-letter count
 * - avg duration
 * - p95 duration
 * - adapter error rates
 */

import { prisma } from '@/shared/db/prismaClient';

export interface ReliabilityMetric {
  operation: string;
  tenantId?: string;
  success: boolean;
  durationMs: number;
  retryCount?: number;
  errorCode?: string;
  errorMessage?: string;
  adapterType?: string;
  timestamp: Date;
}

export interface OperationStats {
  operation: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  retryCount: number;
  deadLetterCount: number;
  lastError?: {
    code: string;
    message: string;
    timestamp: Date;
  };
}

/**
 * Record a reliability metric
 */
export async function recordReliabilityMetric(metric: ReliabilityMetric): Promise<void> {
  try {
    // Store in database (using a telemetry/ops_events table if it exists)
    // For now, we'll use a simple approach - store in audit log or create a metrics table
    
    // Check if ops_events table exists (from schema inspection)
    // If not, we'll use console logging as fallback
    
    await prisma.$executeRaw`
      INSERT INTO ops_events (
        tenant_id,
        user_id,
        event_type,
        operation,
        duration_ms,
        success,
        retry_count,
        error_code,
        error_message,
        adapter_type,
        metadata,
        created_at
      ) VALUES (
        ${metric.tenantId || null},
        null,
        'operation',
        ${metric.operation},
        ${metric.durationMs},
        ${metric.success},
        ${metric.retryCount || 0},
        ${metric.errorCode || null},
        ${metric.errorMessage || null},
        ${metric.adapterType || null},
        '{}'::jsonb,
        ${metric.timestamp}
      )
    `.catch(() => {
      // Table might not exist - log to console as fallback
      console.log('[Reliability Metric]', JSON.stringify(metric));
    });
  } catch {
    // Don't throw - metrics are best-effort
    console.error('[Reliability Metrics] Error recording metric:', error);
  }
}

/**
 * Get operation statistics for a time period
 */
export async function getOperationStats(
  operation: string,
  since: Date,
  tenantId?: string
): Promise<OperationStats | null> {
  try {
    // Query ops_events table
    const query = tenantId
      ? prisma.$queryRaw<Array<{
          total: bigint;
          success_count: bigint;
          failure_count: bigint;
          avg_duration: number;
          p95_duration: number;
          retry_count: bigint;
          dead_letter_count: bigint;
        }>>`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE success = true) as success_count,
          COUNT(*) FILTER (WHERE success = false) as failure_count,
          AVG(duration_ms)::float as avg_duration,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::float as p95_duration,
          SUM(COALESCE(retry_count, 0)) as retry_count,
          COUNT(*) FILTER (WHERE error_code = 'DEAD_LETTER') as dead_letter_count
        FROM ops_events
        WHERE operation = ${operation}
          AND tenant_id = ${tenantId}
          AND created_at >= ${since}
      `
      : prisma.$queryRaw<Array<{
          total: bigint;
          success_count: bigint;
          failure_count: bigint;
          avg_duration: number;
          p95_duration: number;
          retry_count: bigint;
          dead_letter_count: bigint;
        }>>`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE success = true) as success_count,
          COUNT(*) FILTER (WHERE success = false) as failure_count,
          AVG(duration_ms)::float as avg_duration,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::float as p95_duration,
          SUM(COALESCE(retry_count, 0)) as retry_count,
          COUNT(*) FILTER (WHERE error_code = 'DEAD_LETTER') as dead_letter_count
        FROM ops_events
        WHERE operation = ${operation}
          AND created_at >= ${since}
      `;

    const results = await query.catch(() => []);
    if (!results || results.length === 0) {
      return null;
    }

    const row = results[0];
    if (!row) {
      return null;
    }
    
    const total = Number(row.total ?? 0n);
    const successCount = Number(row.success_count ?? 0n);
    const failureCount = Number(row.failure_count ?? 0n);

    return {
      operation,
      totalRequests: total,
      successCount,
      failureCount,
      successRate: total > 0 ? successCount / total : 0,
      avgDurationMs: row.avg_duration ?? 0,
      p95DurationMs: row.p95_duration ?? 0,
      retryCount: Number(row.retry_count ?? 0n),
      deadLetterCount: Number(row.dead_letter_count ?? 0n),
    };
  } catch {
    console.error('[Reliability Metrics] Error getting stats:', error);
    return null;
  }
}

/**
 * Get adapter error rates
 */
export async function getAdapterErrorRates(
  since: Date,
  tenantId?: string
): Promise<Array<{ adapterType: string; errorRate: number; totalRequests: number }>> {
  try {
    const query = tenantId
      ? prisma.$queryRaw<Array<{
          adapter_type: string;
          total: bigint;
          error_count: bigint;
        }>>`
        SELECT
          adapter_type,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE success = false) as error_count
        FROM ops_events
        WHERE adapter_type IS NOT NULL
          AND tenant_id = ${tenantId}
          AND created_at >= ${since}
        GROUP BY adapter_type
      `
      : prisma.$queryRaw<Array<{
          adapter_type: string;
          total: bigint;
          error_count: bigint;
        }>>`
        SELECT
          adapter_type,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE success = false) as error_count
        FROM ops_events
        WHERE adapter_type IS NOT NULL
          AND created_at >= ${since}
        GROUP BY adapter_type
      `;

    const results = await query.catch(() => []);
    return results.map((row) => {
      const total = Number(row.total ?? 0n);
      const errorCount = Number(row.error_count ?? 0n);
      return {
        adapterType: row.adapter_type || 'unknown',
        errorRate: total > 0 ? errorCount / total : 0,
        totalRequests: total,
      };
    });
  } catch {
    console.error('[Reliability Metrics] Error getting adapter error rates:', error);
    return [];
  }
}
