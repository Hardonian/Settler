/**
 * Retention Metrics Service
 *
 * Tracks and aggregates retention metrics for dashboard display.
 * Includes: pruned artifact counts, storage reclaimed, violations, latency.
 */

import { query, queryOne } from "../../db";
import { logInfo, logError } from "../../utils/logger";
import { Pool } from "pg";
import { config } from "../../config";

export interface RetentionMetrics {
  prunedArtifactCount: number;
  storageReclaimedBytes: number;
  retentionPolicyViolations: number;
  workerProcessingLatencyMs: number;
  lastUpdated: Date;
}

export interface DailyRetentionMetrics {
  date: string;
  prunedArtifactCount: number;
  storageReclaimedBytes: number;
  violationsCount: number;
  avgLatencyMs: number;
  tenantId?: string;
}

export interface TenantRetentionMetrics extends RetentionMetrics {
  tenantId: string;
  tenantName: string;
}

/**
 * Retention Metrics Service
 */
export class RetentionMetricsService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    });
  }

  /**
   * Initialize metrics storage (create table if not exists)
   */
  async initializeMetricsStorage(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS retention_metrics (
          id              SERIAL PRIMARY KEY,
          tenant_id       UUID,
          pruned_count    INTEGER DEFAULT 0,
          storage_bytes   BIGINT DEFAULT 0,
          violations      INTEGER DEFAULT 0,
          latency_ms      BIGINT DEFAULT 0,
          run_date        DATE DEFAULT CURRENT_DATE,
          created_at      TIMESTAMP DEFAULT NOW(),
          
          UNIQUE(tenant_id, run_date)
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_retention_metrics_date 
        ON retention_metrics(run_date DESC)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_retention_metrics_tenant 
        ON retention_metrics(tenant_id, run_date DESC)
      `);

      logInfo("Retention metrics storage initialized");
    } catch (error) {
      logError("Failed to initialize retention metrics storage", error);
      throw error;
    }
  }

  /**
   * Record metrics from a retention run
   */
  async recordMetrics(
    tenantId: string | null,
    prunedCount: number,
    storageBytes: number,
    violations: number,
    latencyMs: number
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO retention_metrics (tenant_id, pruned_count, storage_bytes, violations, latency_ms, run_date)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
         ON CONFLICT (tenant_id, run_date)
         DO UPDATE SET 
            pruned_count = retention_metrics.pruned_count + EXCLUDED.pruned_count,
            storage_bytes = retention_metrics.storage_bytes + EXCLUDED.storage_bytes,
            violations = retention_metrics.violations + EXCLUDED.violations,
            latency_ms = GREATEST(retention_metrics.latency_ms, EXCLUDED.latency_ms)`,
        [tenantId, prunedCount, storageBytes, violations, latencyMs]
      );

      logInfo("Recorded retention metrics", {
        tenantId,
        prunedCount,
        storageBytes,
        violations,
        latencyMs,
      });
    } catch (error) {
      logError("Failed to record retention metrics", error);
      throw error;
    }
  }

  /**
   * Get current metrics summary
   */
  async getMetricsSummary(): Promise<RetentionMetrics> {
    try {
      const result = await queryOne<{
        pruned_count: string;
        storage_bytes: string;
        violations: string;
        latency_ms: string;
      }>(
        `SELECT 
           COALESCE(SUM(pruned_count), 0) as pruned_count,
           COALESCE(SUM(storage_bytes), 0) as storage_bytes,
           COALESCE(SUM(violations), 0) as violations,
           COALESCE(AVG(latency_ms), 0) as latency_ms
         FROM retention_metrics
         WHERE run_date >= CURRENT_DATE - INTERVAL '30 days'`
      );

      return {
        prunedArtifactCount: parseInt(result?.pruned_count || "0", 10),
        storageReclaimedBytes: parseInt(result?.storage_bytes || "0", 10),
        retentionPolicyViolations: parseInt(result?.violations || "0", 10),
        workerProcessingLatencyMs: parseInt(result?.latency_ms || "0", 10),
        lastUpdated: new Date(),
      };
    } catch (error) {
      logError("Failed to get metrics summary", error);
      return {
        prunedArtifactCount: 0,
        storageReclaimedBytes: 0,
        retentionPolicyViolations: 0,
        workerProcessingLatencyMs: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Get metrics by tenant
   */
  async getMetricsByTenant(tenantId: string): Promise<TenantRetentionMetrics> {
    try {
      const result = await queryOne<{
        tenant_id: string;
        tenant_name: string;
        pruned_count: string;
        storage_bytes: string;
        violations: string;
        latency_ms: string;
      }>(
        `SELECT 
           rm.tenant_id,
           t.name as tenant_name,
           COALESCE(SUM(rm.pruned_count), 0) as pruned_count,
           COALESCE(SUM(rm.storage_bytes), 0) as storage_bytes,
           COALESCE(SUM(rm.violations), 0) as violations,
           COALESCE(AVG(rm.latency_ms), 0) as latency_ms
         FROM retention_metrics rm
         JOIN tenants t ON t.id = rm.tenant_id
         WHERE rm.tenant_id = $1
           AND rm.run_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY rm.tenant_id, t.name`,
        [tenantId]
      );

      if (!result) {
        // Return default metrics for tenant with no history
        const tenantName = await this.getTenantName(tenantId);
        return {
          tenantId,
          tenantName,
          prunedArtifactCount: 0,
          storageReclaimedBytes: 0,
          retentionPolicyViolations: 0,
          workerProcessingLatencyMs: 0,
          lastUpdated: new Date(),
        };
      }

      return {
        tenantId: result.tenant_id,
        tenantName: result.tenant_name,
        prunedArtifactCount: parseInt(result.pruned_count, 10),
        storageReclaimedBytes: parseInt(result.storage_bytes, 10),
        retentionPolicyViolations: parseInt(result.violations, 10),
        workerProcessingLatencyMs: parseInt(result.latency_ms, 10),
        lastUpdated: new Date(),
      };
    } catch (error) {
      logError("Failed to get metrics by tenant", error, { tenantId });
      return {
        tenantId,
        tenantName: "Unknown",
        prunedArtifactCount: 0,
        storageReclaimedBytes: 0,
        retentionPolicyViolations: 0,
        workerProcessingLatencyMs: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Get tenant name by ID
   */
  private async getTenantName(tenantId: string): Promise<string> {
    const result = await queryOne<{ name: string }>(`SELECT name FROM tenants WHERE id = $1`, [
      tenantId,
    ]);
    return result?.name || "Unknown";
  }

  /**
   * Get daily metrics for dashboard
   */
  async getDailyMetrics(days: number = 30): Promise<DailyRetentionMetrics[]> {
    try {
      const results = await query<{
        run_date: string;
        pruned_count: string;
        storage_bytes: string;
        violations: string;
        latency_ms: string;
      }>(
        `SELECT 
           run_date::text as run_date,
           SUM(pruned_count) as pruned_count,
           SUM(storage_bytes) as storage_bytes,
           SUM(violations) as violations,
           AVG(latency_ms) as latency_ms
         FROM retention_metrics
         WHERE run_date >= CURRENT_DATE - INTERVAL '1 day' * $1
         GROUP BY run_date
         ORDER BY run_date DESC`,
        [days]
      );

      return results.map((row) => ({
        date: row.run_date,
        prunedArtifactCount: parseInt(row.pruned_count, 10),
        storageReclaimedBytes: parseInt(row.storage_bytes, 10),
        violationsCount: parseInt(row.violations, 10),
        avgLatencyMs: parseInt(row.latency_ms, 10),
      }));
    } catch (error) {
      logError("Failed to get daily metrics", error);
      return [];
    }
  }

  /**
   * Get all tenant metrics for dashboard
   */
  async getAllTenantMetrics(): Promise<TenantRetentionMetrics[]> {
    try {
      const results = await query<{
        tenant_id: string;
        tenant_name: string;
        pruned_count: string;
        storage_bytes: string;
        violations: string;
        latency_ms: string;
      }>(
        `SELECT 
           rm.tenant_id,
           t.name as tenant_name,
           COALESCE(SUM(rm.pruned_count), 0) as pruned_count,
           COALESCE(SUM(rm.storage_bytes), 0) as storage_bytes,
           COALESCE(SUM(rm.violations), 0) as violations,
           COALESCE(AVG(rm.latency_ms), 0) as latency_ms
         FROM retention_metrics rm
         JOIN tenants t ON t.id = rm.tenant_id
         WHERE rm.run_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY rm.tenant_id, t.name
         ORDER BY pruned_count DESC`
      );

      return results.map((row) => ({
        tenantId: row.tenant_id,
        tenantName: row.tenant_name,
        prunedArtifactCount: parseInt(row.pruned_count, 10),
        storageReclaimedBytes: parseInt(row.storage_bytes, 10),
        retentionPolicyViolations: parseInt(row.violations, 10),
        workerProcessingLatencyMs: parseInt(row.latency_ms, 10),
        lastUpdated: new Date(),
      }));
    } catch (error) {
      logError("Failed to get all tenant metrics", error);
      return [];
    }
  }

  /**
   * Clear old metrics (for maintenance)
   */
  async clearOldMetrics(daysToKeep: number = 90): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM retention_metrics 
         WHERE run_date < CURRENT_DATE - INTERVAL '1 day' * $1`,
        [daysToKeep]
      );

      const deletedCount = (result as any)?.rowCount || 0;
      logInfo("Cleared old retention metrics", { deletedCount, daysToKeep });
      return deletedCount;
    } catch (error) {
      logError("Failed to clear old metrics", error);
      throw error;
    }
  }

  /**
   * Close database pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const retentionMetricsService = new RetentionMetricsService();
