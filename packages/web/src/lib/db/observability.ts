/**
 * Database Observability & Monitoring
 *
 * Instruments database operations with metrics and tracing:
 * - Query timing (p50, p95, p99)
 * - Connection pool health
 * - Slow query detection
 * - Error rate tracking
 * - RLS policy performance
 *
 * Based on OpenAI's operational observability principles
 */

import { prisma } from '@/shared/db/prismaClient';
import { appLogger } from '@/lib/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface QueryMetrics {
  queryName: string;
  duration: number;
  rowCount: number | null;
  cacheHit: boolean;
  error: boolean;
  timestamp: Date;
}

export interface ConnectionPoolMetrics {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingRequests: number;
  healthy: boolean;
  timestamp: Date;
}

export interface SlowQueryAlert {
  query: string;
  duration: number;
  threshold: number;
  timestamp: Date;
}

// ============================================================================
// IN-MEMORY METRICS STORAGE (LAST 1000 QUERIES)
// ============================================================================

const queryMetricsBuffer: QueryMetrics[] = [];
const MAX_METRICS_BUFFER_SIZE = 1000;

const slowQueryAlerts: SlowQueryAlert[] = [];
const MAX_SLOW_QUERY_ALERTS = 100;

const SLOW_QUERY_THRESHOLD_MS = 1000; // 1 second

// ============================================================================
// METRIC COLLECTION
// ============================================================================

/**
 * Record a query execution for metrics
 */
export function recordQueryMetric(metric: QueryMetrics): void {
  // Add to buffer
  queryMetricsBuffer.push(metric);

  // Trim buffer if too large
  if (queryMetricsBuffer.length > MAX_METRICS_BUFFER_SIZE) {
    queryMetricsBuffer.shift();
  }

  // Check for slow query
  if (metric.duration > SLOW_QUERY_THRESHOLD_MS) {
    const alert: SlowQueryAlert = {
      query: metric.queryName,
      duration: metric.duration,
      threshold: SLOW_QUERY_THRESHOLD_MS,
      timestamp: metric.timestamp,
    };

    slowQueryAlerts.push(alert);

    // Trim slow query alerts
    if (slowQueryAlerts.length > MAX_SLOW_QUERY_ALERTS) {
      slowQueryAlerts.shift();
    }

    // Log slow query
    appLogger.warn('[DB Observability] Slow query detected', {
      query: metric.queryName,
      duration: metric.duration,
      threshold: SLOW_QUERY_THRESHOLD_MS,
      rowCount: metric.rowCount,
    });
  }

  // Log error queries
  if (metric.error) {
    appLogger.error('[DB Observability] Query error', {
      query: metric.queryName,
      duration: metric.duration,
    });
  }
}

/**
 * Get query metrics summary (last N queries)
 */
export function getQueryMetricsSummary(limit: number = 100): {
  total: number;
  errors: number;
  cacheHits: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  slowQueries: number;
  byQuery: Record<string, {
    count: number;
    avgDuration: number;
    errors: number;
  }>;
} {
  const recentMetrics = queryMetricsBuffer.slice(-limit);

  if (recentMetrics.length === 0) {
    return {
      total: 0,
      errors: 0,
      cacheHits: 0,
      avgDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      slowQueries: 0,
      byQuery: {},
    };
  }

  // Calculate percentiles
  const durations = recentMetrics.map((m) => m.duration).sort((a, b) => a - b);
  const p50Index = Math.floor(durations.length * 0.5);
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  // Aggregate by query name
  const byQuery: Record<string, { count: number; totalDuration: number; errors: number }> = {};

  for (const metric of recentMetrics) {
    if (!byQuery[metric.queryName]) {
      byQuery[metric.queryName] = { count: 0, totalDuration: 0, errors: 0 };
    }

    byQuery[metric.queryName].count++;
    byQuery[metric.queryName].totalDuration += metric.duration;

    if (metric.error) {
      byQuery[metric.queryName].errors++;
    }
  }

  // Convert to output format
  const byQuerySummary: Record<string, { count: number; avgDuration: number; errors: number }> =
    {};

  for (const [queryName, stats] of Object.entries(byQuery)) {
    byQuerySummary[queryName] = {
      count: stats.count,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      errors: stats.errors,
    };
  }

  return {
    total: recentMetrics.length,
    errors: recentMetrics.filter((m) => m.error).length,
    cacheHits: recentMetrics.filter((m) => m.cacheHit).length,
    avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    p50Duration: durations[p50Index] || 0,
    p95Duration: durations[p95Index] || 0,
    p99Duration: durations[p99Index] || 0,
    slowQueries: recentMetrics.filter((m) => m.duration > SLOW_QUERY_THRESHOLD_MS).length,
    byQuery: byQuerySummary,
  };
}

/**
 * Get recent slow query alerts
 */
export function getSlowQueryAlerts(limit: number = 20): SlowQueryAlert[] {
  return slowQueryAlerts.slice(-limit);
}

/**
 * Clear metrics (for testing or reset)
 */
export function clearMetrics(): void {
  queryMetricsBuffer.length = 0;
  slowQueryAlerts.length = 0;
}

// ============================================================================
// CONNECTION POOL MONITORING
// ============================================================================

/**
 * Get connection pool health metrics
 *
 * Note: Prisma doesn't expose pool metrics directly, so we use a health check query
 * and infer health from latency. For more detailed metrics, consider using a custom
 * pooling solution or monitoring tool.
 */
export async function getConnectionPoolMetrics(): Promise<ConnectionPoolMetrics> {
  const startTime = Date.now();

  try {
    // Execute a simple health check query
    await prisma.$queryRaw`SELECT 1 as health_check`;

    const duration = Date.now() - startTime;
    const healthy = duration < 100; // Consider healthy if < 100ms

    // Note: Prisma doesn't expose pool metrics, so we return placeholder values
    // In production, consider using pg-promise or node-postgres directly for pool metrics
    return {
      totalConnections: 0, // Unknown (Prisma abstraction)
      idleConnections: 0, // Unknown
      activeConnections: 0, // Unknown
      waitingRequests: 0, // Unknown
      healthy,
      timestamp: new Date(),
    };
  } catch (error) {
    appLogger.error('[DB Observability] Connection pool health check failed', { error });

    return {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      waitingRequests: 0,
      healthy: false,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// TABLE BLOAT MONITORING
// ============================================================================

export interface TableBloatMetrics {
  tableName: string;
  totalSize: string;
  liveRows: number;
  deadRows: number;
  deadRowPercentage: number;
  lastVacuum: Date | null;
  lastAutovacuum: Date | null;
}

/**
 * Get table bloat metrics (requires RLS bypass or admin role)
 */
export async function getTableBloatMetrics(): Promise<TableBloatMetrics[]> {
  try {
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname,
        tablename AS "tableName",
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS "totalSize",
        n_live_tup AS "liveRows",
        n_dead_tup AS "deadRows",
        CASE
          WHEN n_live_tup > 0 THEN ROUND((n_dead_tup::NUMERIC / n_live_tup) * 100, 2)
          ELSE 0
        END AS "deadRowPercentage",
        last_vacuum AS "lastVacuum",
        last_autovacuum AS "lastAutovacuum"
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND tablename IN ('usage_events', 'api_call_logs', 'stripe_events', 'audit_logs', 'usage_counters')
      ORDER BY n_dead_tup DESC;
    `;

    return results.map((row) => ({
      tableName: row.tableName,
      totalSize: row.totalSize,
      liveRows: Number(row.liveRows),
      deadRows: Number(row.deadRows),
      deadRowPercentage: Number(row.deadRowPercentage),
      lastVacuum: row.lastVacuum ? new Date(row.lastVacuum) : null,
      lastAutovacuum: row.lastAutovacuum ? new Date(row.lastAutovacuum) : null,
    }));
  } catch (error) {
    appLogger.error('[DB Observability] Failed to get table bloat metrics', { error });
    return [];
  }
}

// ============================================================================
// INDEX USAGE MONITORING
// ============================================================================

export interface IndexUsageMetrics {
  schemaName: string;
  tableName: string;
  indexName: string;
  indexScans: number;
  rowsRead: number;
  rowsFetched: number;
  indexSize: string;
  usageCategory: 'UNUSED' | 'LOW_USAGE' | 'ACTIVE';
}

/**
 * Get index usage metrics (requires RLS bypass or admin role)
 */
export async function getIndexUsageMetrics(): Promise<IndexUsageMetrics[]> {
  try {
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname AS "schemaName",
        tablename AS "tableName",
        indexname AS "indexName",
        idx_scan AS "indexScans",
        idx_tup_read AS "rowsRead",
        idx_tup_fetch AS "rowsFetched",
        pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS "indexSize",
        CASE
          WHEN idx_scan = 0 THEN 'UNUSED'
          WHEN idx_scan < 100 THEN 'LOW_USAGE'
          ELSE 'ACTIVE'
        END AS "usageCategory"
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan ASC, pg_relation_size(indexrelid::regclass) DESC
      LIMIT 50;
    `;

    return results.map((row) => ({
      schemaName: row.schemaName,
      tableName: row.tableName,
      indexName: row.indexName,
      indexScans: Number(row.indexScans),
      rowsRead: Number(row.rowsRead),
      rowsFetched: Number(row.rowsFetched),
      indexSize: row.indexSize,
      usageCategory: row.usageCategory,
    }));
  } catch (error) {
    appLogger.error('[DB Observability] Failed to get index usage metrics', { error });
    return [];
  }
}

// ============================================================================
// HEALTH CHECK ENDPOINT DATA
// ============================================================================

export interface DatabaseHealthMetrics {
  connectionPool: ConnectionPoolMetrics;
  queryMetrics: ReturnType<typeof getQueryMetricsSummary>;
  slowQueries: SlowQueryAlert[];
  tableBloat: TableBloatMetrics[];
  indexUsage: IndexUsageMetrics[];
}

/**
 * Get comprehensive database health metrics (for admin endpoints)
 */
export async function getDatabaseHealthMetrics(): Promise<DatabaseHealthMetrics> {
  const [connectionPool, tableBloat, indexUsage] = await Promise.all([
    getConnectionPoolMetrics(),
    getTableBloatMetrics(),
    getIndexUsageMetrics(),
  ]);

  return {
    connectionPool,
    queryMetrics: getQueryMetricsSummary(1000),
    slowQueries: getSlowQueryAlerts(20),
    tableBloat,
    indexUsage,
  };
}
