/**
 * TTL Worker for Export Artifacts
 *
 * Scheduled worker that identifies and prunes aged export artifacts
 * based on tenant-specific retention policies.
 *
 * Features:
 * - Configurable tenant-level retention policies
 * - Different retention periods per artifact type
 * - Safe deletion with transaction handling
 * - Dry-run mode for testing policies
 * - Metrics collection
 */

import { prisma } from "../../infrastructure/db/prisma";
import { config } from "../../config";
import { logInfo, logError, logWarn } from "../../utils/logger";
import { retentionPolicyService, RetentionPeriod } from "./retention-policy";
import { retentionMetricsService } from "./retention-metrics";

export interface TTLWorkerConfig {
  pollIntervalMs: number;
  batchSize: number;
  maxConcurrentDeletes: number;
  dryRun: boolean;
}

export interface TTLWorkerStats {
  workerId: string;
  startedAt: Date;
  runsCompleted: number;
  artifactsScanned: number;
  artifactsPruned: number;
  storageReclaimedBytes: number;
  violations: number;
  errors: number;
  lastRunAt: Date | null;
  isRunning: boolean;
}

export interface PruneResult {
  success: boolean;
  tenantId: string;
  artifactType: string;
  prunedCount: number;
  storageReclaimedBytes: number;
  violations: number;
  latencyMs: number;
  errors: string[];
}

export interface ExpiredArtifact {
  id: string;
  tenant_id: string;
  type: string;
  storage_location: string | null;
  file_size_bytes: number | null;
  created_at: Date;
  expires_at: Date | null;
}

export const DEFAULT_TTL_WORKER_CONFIG: TTLWorkerConfig = {
  pollIntervalMs: 3600000, // 1 hour
  batchSize: 100,
  maxConcurrentDeletes: 10,
  dryRun: false,
};

/**
 * TTL Worker for Export Artifacts
 */
export class TTLWorker {
  private workerId: string;
  private config: TTLWorkerConfig;
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private stats: TTLWorkerStats;

  constructor(workerId?: string, config?: Partial<TTLWorkerConfig>) {
    this.workerId = workerId || `ttl-worker-${Date.now()}`;
    this.config = { ...DEFAULT_TTL_WORKER_CONFIG, ...config };

    this.stats = {
      workerId: this.workerId,
      startedAt: new Date(),
      runsCompleted: 0,
      artifactsScanned: 0,
      artifactsPruned: 0,
      storageReclaimedBytes: 0,
      violations: 0,
      errors: 0,
      lastRunAt: null,
      isRunning: false,
    };
  }

  /**
   * Start the TTL worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logWarn("TTL Worker already running", { workerId: this.workerId });
      return;
    }

    this.isRunning = true;
    this.stats.isRunning = true;

    logInfo("Starting TTL Worker", {
      workerId: this.workerId,
      config: this.config,
    });

    // Run immediately on start
    this.run().catch((error) => {
      logError("Initial TTL worker run failed", error, { workerId: this.workerId });
    });

    // Schedule recurring runs
    this.pollTimer = setInterval(() => {
      this.run().catch((error) => {
        logError("Scheduled TTL worker run failed", error, { workerId: this.workerId });
      });
    }, this.config.pollIntervalMs);

    // Handle graceful shutdown
    process.on("SIGTERM", () => this.stop());
    process.on("SIGINT", () => this.stop());

    logInfo("TTL Worker started", { workerId: this.workerId });
  }

  /**
   * Stop the TTL worker
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.stats.isRunning = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    logInfo("TTL Worker stopped", { workerId: this.workerId });
  }

  /**
   * Run the TTL worker job
   */
  async run(): Promise<void> {
    const startTime = Date.now();

    logInfo("TTL Worker run starting", {
      workerId: this.workerId,
      dryRun: this.config.dryRun,
    });

    try {
      // Get all active tenants
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      logInfo("Processing tenants for TTL", {
        workerId: this.workerId,
        tenantCount: tenants.length,
      });

      for (const tenant of tenants) {
        try {
          await this.processTenant(tenant.id, tenant.name);
        } catch (error) {
          logError("Error processing tenant in TTL worker", error, {
            workerId: this.workerId,
            tenantId: tenant.id,
          });
          this.stats.errors++;
        }
      }

      this.stats.runsCompleted++;
      this.stats.lastRunAt = new Date();

      const duration = Date.now() - startTime;
      logInfo("TTL Worker run completed", {
        workerId: this.workerId,
        duration,
        runsCompleted: this.stats.runsCompleted,
        artifactsPruned: this.stats.artifactsPruned,
        storageReclaimedBytes: this.stats.storageReclaimedBytes,
      });
    } catch (error) {
      logError("TTL Worker run failed", error, { workerId: this.workerId });
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Process a single tenant
   */
  private async processTenant(tenantId: string, tenantName: string): Promise<PruneResult> {
    const result: PruneResult = {
      success: true,
      tenantId,
      artifactType: "all",
      prunedCount: 0,
      storageReclaimedBytes: 0,
      violations: 0,
      latencyMs: 0,
      errors: [],
    };

    const startTime = Date.now();

    try {
      // Get tenant retention policy
      const policy = await retentionPolicyService.getTenantRetentionPolicy(tenantId);

      // Process each artifact type
      const artifactTypes = ["csv", "json", "excel", "pdf"] as const;

      for (const artifactType of artifactTypes) {
        try {
          const typeResult = await this.processArtifactType(
            tenantId,
            artifactType,
            policy.artifactRetention[artifactType]
          );
          result.prunedCount += typeResult.prunedCount;
          result.storageReclaimedBytes += typeResult.storageReclaimedBytes;
          result.violations += typeResult.violations;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Error processing ${artifactType}: ${errorMsg}`);
          logError(`Error processing artifact type ${artifactType}`, error, { tenantId });
        }
      }

      result.latencyMs = Date.now() - startTime;

      // Record metrics
      await retentionMetricsService.recordMetrics(
        tenantId,
        result.prunedCount,
        result.storageReclaimedBytes,
        result.violations,
        result.latencyMs
      );

      // Update stats
      this.stats.artifactsPruned += result.prunedCount;
      this.stats.storageReclaimedBytes += result.storageReclaimedBytes;
      this.stats.violations += result.violations;
    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMsg);
      logError("Error processing tenant", error, { tenantId, tenantName });
    }

    return result;
  }

  /**
   * Process a specific artifact type for a tenant
   */
  private async processArtifactType(
    tenantId: string,
    artifactType: string,
    retentionPeriod: RetentionPeriod
  ): Promise<{ prunedCount: number; storageReclaimedBytes: number; violations: number }> {
    // Calculate cutoff date
    const cutoffDate = new Date();
    if (retentionPeriod.unit !== "forever") {
      const days =
        retentionPeriod.value *
        (retentionPeriod.unit === "weeks" ? 7 : retentionPeriod.unit === "months" ? 30 : 1);
      cutoffDate.setDate(cutoffDate.getDate() - days);
    } else {
      // Forever - set to past so nothing gets deleted
      cutoffDate.setFullYear(1970);
    }

    // Find expired artifacts (with expires_at in the past OR created_at before cutoff with no expires_at)
    const expiredArtifacts = await this.findExpiredArtifacts(tenantId, artifactType, cutoffDate);

    this.stats.artifactsScanned += expiredArtifacts.length;

    let prunedCount = 0;
    let storageReclaimedBytes = 0;
    let violations = 0;

    // Process in batches
    for (let i = 0; i < expiredArtifacts.length; i += this.config.batchSize) {
      const batch = expiredArtifacts.slice(i, i + this.config.batchSize);

      for (const artifact of batch) {
        try {
          if (this.config.dryRun) {
            // Dry run - just log what would be deleted
            logInfo("Dry run: Would delete artifact", {
              artifactId: artifact.id,
              tenantId,
              artifactType,
              fileSize: artifact.file_size_bytes,
            });
            prunedCount++;
          } else {
            // Actual deletion
            const deleteResult = await this.safeDeleteArtifact(artifact);
            prunedCount += deleteResult.deleted ? 1 : 0;
            storageReclaimedBytes += deleteResult.storageReclaimed;

            // Check for violations (artifacts that should have been deleted earlier)
            if (deleteResult.violation) {
              violations++;
            }
          }
        } catch (error) {
          logError("Error deleting artifact", error, {
            artifactId: artifact.id,
            tenantId,
          });
        }
      }
    }

    return { prunedCount, storageReclaimedBytes: storageReclaimedBytes, violations };
  }

  /**
   * Find expired artifacts for a tenant and type
   */
  private async findExpiredArtifacts(
    tenantId: string,
    artifactType: string,
    cutoffDate: Date
  ): Promise<ExpiredArtifact[]> {
    // Find artifacts with explicit expiration that has passed
    // OR artifacts without explicit expiration but past retention cutoff
    const exports = await prisma.export.findMany({
      where: {
        tenantId,
        type: artifactType,
        status: "completed",
        OR: [
          {
            // Artifacts with explicit expiration that has passed
            expiresAt: { not: null, lt: new Date() },
          },
          {
            // Artifacts without explicit expiration but past retention cutoff
            expiresAt: null,
            createdAt: { lt: cutoffDate },
          },
        ],
      },
      select: {
        id: true,
        tenantId: true,
        type: true,
        storageLocation: true,
        fileSizeBytes: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: this.config.batchSize,
    });

    return exports.map((e) => ({
      id: e.id,
      tenant_id: e.tenantId,
      type: e.type,
      storage_location: e.storageLocation,
      file_size_bytes: e.fileSizeBytes,
      created_at: e.createdAt,
      expires_at: e.expiresAt,
    }));
  }

  /**
   * Safely delete an artifact with transaction handling
   */
  private async safeDeleteArtifact(artifact: ExpiredArtifact): Promise<{
    deleted: boolean;
    storageReclaimed: number;
    violation: boolean;
  }> {
    try {
      // Start transaction
      // Check if artifact still exists and is eligible for deletion
      const existing = await prisma.export.findUnique({
        where: { id: artifact.id },
        select: { id: true, fileSizeBytes: true },
      });

      if (!existing) {
        // Already deleted or not eligible
        return { deleted: false, storageReclaimed: 0, violation: false };
      }

      const fileSize = existing.fileSizeBytes || 0;

      // Check for violation (deleted after expiration date)
      const violation = !!(artifact.expires_at && new Date(artifact.expires_at) < new Date());

      // Delete the export record using transaction
      await prisma.$transaction([
        // Delete related audit records
        prisma.reconAudit.deleteMany({
          where: {
            entityType: "export",
            entityId: artifact.id,
          },
        }),
        // Delete the export
        prisma.export.delete({
          where: { id: artifact.id },
        }),
      ]);

      logInfo("Deleted expired artifact", {
        artifactId: artifact.id,
        tenantId: artifact.tenant_id,
        fileSize,
        violation,
      });

      return { deleted: true, storageReclaimed: fileSize, violation };
    } catch (error) {
      logError("Error in safeDeleteArtifact", error, { artifactId: artifact.id });
      throw error;
    }
  }

  /**
   * Get worker stats
   */
  getStats(): TTLWorkerStats {
    return { ...this.stats };
  }

  /**
   * Update worker configuration
   */
  updateConfig(config: Partial<TTLWorkerConfig>): void {
    this.config = { ...this.config, ...config };
    logInfo("Updated TTL Worker config", { workerId: this.workerId, config: this.config });
  }

  /**
   * Enable/disable dry-run mode
   */
  setDryRun(dryRun: boolean): void {
    this.config.dryRun = dryRun;
    logInfo("TTL Worker dry-run mode changed", { workerId: this.workerId, dryRun });
  }

  /**
   * Manually trigger a run (for testing or on-demand)
   */
  async triggerRun(): Promise<void> {
    await this.run();
  }
}

// Export singleton instance
let ttlWorkerInstance: TTLWorker | null = null;

export function getTTLWorker(config?: Partial<TTLWorkerConfig>): TTLWorker {
  if (!ttlWorkerInstance) {
    ttlWorkerInstance = new TTLWorker(undefined, config);
  }
  return ttlWorkerInstance;
}

export async function startTTLWorker(config?: Partial<TTLWorkerConfig>): Promise<TTLWorker> {
  const worker = getTTLWorker(config);
  await worker.start();
  return worker;
}

export async function stopTTLWorker(): Promise<void> {
  if (ttlWorkerInstance) {
    await ttlWorkerInstance.stop();
    ttlWorkerInstance = null;
  }
}
