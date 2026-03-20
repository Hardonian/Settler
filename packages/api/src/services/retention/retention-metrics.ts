/**
 * Retention Metrics Service
 *
 * Tracks and aggregates retention metrics for dashboard display.
 * Includes: pruned artifact counts, storage reclaimed, violations, latency.
 */

import { prisma } from "../../infrastructure/db/prisma";
import { logInfo, logError } from "../../utils/logger";

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Try to update existing record first
      const existing = await prisma.retentionMetric.findFirst({
        where: {
          tenantId: tenantId || undefined,
          runDate: today,
        },
      });

      if (existing) {
        await prisma.retentionMetric.update({
          where: { id: existing.id },
          data: {
            prunedCount: { increment: prunedCount },
            storageBytes: { increment: BigInt(storageBytes) },
            violations: { increment: violations },
            latencyMs: { increment: BigInt(latencyMs) },
          },
        });
      } else {
        await prisma.retentionMetric.create({
          data: {
            tenantId: tenantId || undefined,
            prunedCount,
            storageBytes: BigInt(storageBytes),
            violations,
            latencyMs: BigInt(latencyMs),
            runDate: today,
          },
        });
      }

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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.retentionMetric.aggregate({
        where: {
          runDate: { gte: thirtyDaysAgo },
        },
        _sum: {
          prunedCount: true,
          storageBytes: true,
          violations: true,
        },
        _avg: {
          latencyMs: true,
        },
      });

      return {
        prunedArtifactCount: result._sum.prunedCount || 0,
        storageReclaimedBytes: Number(result._sum.storageBytes || 0n),
        retentionPolicyViolations: result._sum.violations || 0,
        workerProcessingLatencyMs: Number(result._avg.latencyMs || 0n),
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.retentionMetric.aggregate({
        where: {
          tenantId,
          runDate: { gte: thirtyDaysAgo },
        },
        _sum: {
          prunedCount: true,
          storageBytes: true,
          violations: true,
        },
        _avg: {
          latencyMs: true,
        },
      });

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });

      return {
        tenantId,
        tenantName: tenant?.name || "Unknown",
        prunedArtifactCount: result._sum.prunedCount || 0,
        storageReclaimedBytes: Number(result._sum.storageBytes || 0n),
        retentionPolicyViolations: result._sum.violations || 0,
        workerProcessingLatencyMs: Number(result._avg.latencyMs || 0n),
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
   * Get daily metrics for dashboard
   */
  async getDailyMetrics(days: number = 30): Promise<DailyRetentionMetrics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await prisma.retentionMetric.groupBy({
        by: ["runDate"],
        where: {
          runDate: { gte: startDate },
        },
        _sum: {
          prunedCount: true,
          storageBytes: true,
          violations: true,
        },
        _avg: {
          latencyMs: true,
        },
        orderBy: {
          runDate: "desc",
        },
      });

      return results.map((row) => ({
        date: row.runDate.toISOString().split("T")[0],
        prunedArtifactCount: row._sum.prunedCount || 0,
        storageReclaimedBytes: Number(row._sum.storageBytes || 0n),
        violationsCount: row._sum.violations || 0,
        avgLatencyMs: Number(row._avg.latencyMs || 0n),
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const results = await prisma.retentionMetric.groupBy({
        by: ["tenantId"],
        where: {
          runDate: { gte: thirtyDaysAgo },
          tenantId: { not: null },
        },
        _sum: {
          prunedCount: true,
          storageBytes: true,
          violations: true,
        },
        _avg: {
          latencyMs: true,
        },
      });

      const metrics: TenantRetentionMetrics[] = [];

      for (const row of results) {
        if (!row.tenantId) continue;

        const tenant = await prisma.tenant.findUnique({
          where: { id: row.tenantId },
          select: { name: true },
        });

        metrics.push({
          tenantId: row.tenantId,
          tenantName: tenant?.name || "Unknown",
          prunedArtifactCount: row._sum.prunedCount || 0,
          storageReclaimedBytes: Number(row._sum.storageBytes || 0n),
          retentionPolicyViolations: row._sum.violations || 0,
          workerProcessingLatencyMs: Number(row._avg.latencyMs || 0n),
          lastUpdated: new Date(),
        });
      }

      return metrics.sort((a, b) => b.prunedArtifactCount - a.prunedArtifactCount);
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
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.retentionMetric.deleteMany({
        where: {
          runDate: { lt: cutoffDate },
        },
      });

      logInfo("Cleared old retention metrics", {
        deletedCount: result.count,
        daysToKeep,
      });

      return result.count;
    } catch (error) {
      logError("Failed to clear old metrics", error);
      throw error;
    }
  }
}

export const retentionMetricsService = new RetentionMetricsService();
