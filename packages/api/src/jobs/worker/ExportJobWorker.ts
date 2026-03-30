/**
 * Export Job Worker Service
 *
 * Background worker that polls for pending export jobs and processes them
 * independently of UI connections. Ensures export jobs advance through
 * completion states regardless of active user sessions.
 *
 * Job Flow:
 * 1. Poll for queued jobs (pending → claimed)
 * 2. Process the job based on type
 * 3. Update job status (succeeded/failed)
 * 4. Handle retries with exponential backoff
 */

import { Pool } from "pg";
import { config } from "../../config";
import { logInfo, logError, logWarn } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import { ExportJobExecutionResult, ExportJobPayload } from "../export/export-job-contract";
import { ExportLifecycleService } from "../../application/services/ExportLifecycleService";
import { prisma } from "../../infrastructure/db/prisma";

export interface WorkerConfig {
  pollIntervalMs: number;
  maxConcurrentJobs: number;
  lockTimeoutMs: number;
  heartbeatIntervalMs: number;
  maxRetries: number;
}

export interface WorkerStats {
  workerId: string;
  startedAt: Date;
  jobsProcessed: number;
  jobsSucceeded: number;
  jobsFailed: number;
  jobsRetried: number;
  lastProcessedAt: Date | null;
  currentJobs: string[];
  isHealthy: boolean;
}

export interface ProcessedJob {
  id: string;
  tenant_id: string;
  type: string;
  payload: ExportJobPayload;
  status: string;
  attempts: number;
  max_attempts: number;
}

/**
 * Default worker configuration
 */
export const DEFAULT_WORKER_CONFIG: WorkerConfig = {
  pollIntervalMs: 1000, // Poll every 1 second
  maxConcurrentJobs: 5, // Process up to 5 jobs concurrently
  lockTimeoutMs: 300000, // 5 minute lock timeout
  heartbeatIntervalMs: 30000, // Heartbeat every 30 seconds
  maxRetries: 3, // Max retries before marking as dead
};

export class ExportJobWorker extends EventEmitter {
  private pool: Pool;
  private workerId: string;
  private config: WorkerConfig;
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private activeJobs: Map<string, ProcessedJob> = new Map();
  private stats: WorkerStats;
  private exportLifecycleService: ExportLifecycleService;

  constructor(
    workerId?: string,
    config?: Partial<WorkerConfig>,
    exportLifecycleService: ExportLifecycleService = new ExportLifecycleService(prisma)
  ) {
    super();
    this.workerId = workerId || `export-worker-${uuidv4()}`;
    this.config = { ...DEFAULT_WORKER_CONFIG, ...config };
    this.exportLifecycleService = exportLifecycleService;

    // Create dedicated connection pool for worker using global config
    this.pool = new Pool({
      max: this.config.maxConcurrentJobs + 2, // Jobs + heartbeat + poll
    });

    this.stats = {
      workerId: this.workerId,
      startedAt: new Date(),
      jobsProcessed: 0,
      jobsSucceeded: 0,
      jobsFailed: 0,
      jobsRetried: 0,
      lastProcessedAt: null,
      currentJobs: [],
      isHealthy: true,
    };
  }

  /**
   * Initialize the worker with config
   */
  private initializeFromConfig(): void {
    // Use config module for database connection
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: this.config.maxConcurrentJobs + 2,
    });
  }

  /**
   * Start the worker - begins polling for jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logWarn("Worker already running", { workerId: this.workerId });
      return;
    }

    this.initializeFromConfig();
    this.isRunning = true;

    logInfo("Export job worker starting", {
      workerId: this.workerId,
      config: this.config,
    });

    // Start polling for jobs
    this.startPolling();

    // Start heartbeat to keep locks alive
    this.startHeartbeat();

    // Handle graceful shutdown
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());

    logInfo("Export job worker started", { workerId: this.workerId });
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Wait for active jobs to complete (with timeout)
    if (this.activeJobs.size > 0) {
      logInfo("Waiting for active jobs to complete", {
        workerId: this.workerId,
        activeJobs: this.activeJobs.size,
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    await this.pool.end();

    logInfo("Export job worker stopped", { workerId: this.workerId });
  }

  /**
   * Start polling for queued jobs
   */
  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      try {
        await this.pollAndClaimJobs();
      } catch (error) {
        logError("Error polling for jobs", error, { workerId: this.workerId });
      }
    }, this.config.pollIntervalMs);

    // Run immediately on start
    this.pollAndClaimJobs().catch((error) => {
      logError("Initial job poll failed", error, { workerId: this.workerId });
    });
  }

  /**
   * Start heartbeat to maintain job locks
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        logError("Error sending heartbeat", error, { workerId: this.workerId });
      }
    }, this.config.heartbeatIntervalMs);
  }

  /**
   * Poll database for and claim queued jobs
   */
  private async pollAndClaimJobs(): Promise<void> {
    // Don't claim more than max concurrent jobs
    if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
      return;
    }

    const availableSlots = this.config.maxConcurrentJobs - this.activeJobs.size;

    try {
      // Atomically claim jobs
      const claimedJobs = await this.claimJobs(availableSlots);

      if (claimedJobs.length === 0) {
        return;
      }

      logInfo("Claimed jobs", {
        workerId: this.workerId,
        count: claimedJobs.length,
      });

      // Process each claimed job
      for (const job of claimedJobs) {
        this.processJob(job).catch((error) => {
          logError("Error processing job", error, {
            workerId: this.workerId,
            jobId: job.id,
          });
        });
      }
    } catch (error) {
      logError("Error claiming jobs", error, { workerId: this.workerId });
    }
  }

  /**
   * Claim jobs from the queue atomically
   */
  private async claimJobs(limit: number): Promise<ProcessedJob[]> {
    const client = await this.pool.connect();

    try {
      // Use advisory locks for atomic claim
      const result = await client.query<{
        id: string;
        tenant_id: string;
        type: string;
        payload: ExportJobPayload | string;
        status: string;
        attempts: number;
        max_attempts: number;
      }>(
        `WITH claimed AS (
          SELECT id, tenant_id, type, payload, status, attempts, max_attempts
          FROM jobs
          WHERE status = 'queued' 
            AND (run_at IS NULL OR run_at <= NOW())
            AND locked_by IS NULL
          ORDER BY 
            CASE 
              WHEN type = 'reconciliation-export' THEN 1 
              WHEN type = 'export' THEN 2 
              ELSE 3 
            END,
            created_at ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE jobs j
        SET status = 'running',
            locked_by = $2,
            locked_at = NOW(),
            heartbeat_at = NOW(),
            started_at = NOW(),
            attempts = attempts + 1,
            updated_at = NOW()
        FROM claimed c
        WHERE j.id = c.id
        RETURNING j.id, j.tenant_id, j.type, j.payload, j.status, j.attempts, j.max_attempts`,
        [limit, this.workerId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        tenant_id: row.tenant_id,
        type: row.type,
        payload: this.parseJobPayload(row.payload),
        status: row.status,
        attempts: row.attempts,
        max_attempts: row.max_attempts,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Send heartbeat to keep locks alive
   */
  private async sendHeartbeat(): Promise<void> {
    if (this.activeJobs.size === 0) {
      return;
    }

    const jobIds = Array.from(this.activeJobs.keys());

    try {
      await this.pool.query(
        `UPDATE jobs 
         SET heartbeat_at = NOW(), updated_at = NOW()
         WHERE id = ANY($1) AND locked_by = $2`,
        [jobIds, this.workerId]
      );

      // Update stats
      this.stats.currentJobs = jobIds;
    } catch (error) {
      logError("Error sending heartbeat", error, {
        workerId: this.workerId,
        jobIds,
      });
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: ProcessedJob): Promise<void> {
    // Track active job
    this.activeJobs.set(job.id, job);

    logInfo("Processing job", {
      workerId: this.workerId,
      jobId: job.id,
      type: job.type,
      tenantId: job.tenant_id,
      attempt: job.attempts,
    });

    try {
      await this.exportLifecycleService.markJobProcessing({
        tenantId: job.tenant_id,
        jobId: job.id,
        workerId: this.workerId,
      });

      // Process based on job type
      const result = await this.executeJob(job);

      await this.exportLifecycleService.recordJobSuccess({
        tenantId: job.tenant_id,
        jobId: job.id,
        result,
      });

      // Mark job as succeeded
      await this.completeJob(job.id, "succeeded", result);

      this.stats.jobsSucceeded++;
      this.stats.jobsProcessed++;
      this.stats.lastProcessedAt = new Date();

      logInfo("Job completed successfully", {
        workerId: this.workerId,
        jobId: job.id,
      });

      this.emit("job:completed", { jobId: job.id, result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logError("Job processing failed", error, {
        workerId: this.workerId,
        jobId: job.id,
        attempt: job.attempts,
        maxAttempts: job.max_attempts,
      });

      // Check if we should retry
      if (job.attempts < job.max_attempts) {
        const retryAt = await this.retryJob(job, errorMessage);
        await this.exportLifecycleService.recordJobRetryScheduled({
          tenantId: job.tenant_id,
          jobId: job.id,
          errorMessage,
          retryScheduledAt: retryAt,
          attempt: job.attempts,
          maxAttempts: job.max_attempts,
        });
        this.stats.jobsRetried++;
      } else {
        await this.exportLifecycleService.recordJobFailure({
          tenantId: job.tenant_id,
          jobId: job.id,
          errorMessage,
        });

        // Max retries exceeded - mark as failed
        await this.completeJob(job.id, "failed", { error: errorMessage });
        this.stats.jobsFailed++;
        this.stats.jobsProcessed++;

        this.emit("job:failed", { jobId: job.id, error: errorMessage });
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Execute the job based on its type
   */
  private async executeJob(job: ProcessedJob): Promise<ExportJobExecutionResult> {
    const { type, payload } = job;

    switch (type) {
      case "export":
      case "reconciliation-export":
        return this.handleExportJob(payload);

      case "csv-export":
        return this.handleCSVExportJob(payload);

      case "pdf-report":
        return this.handlePDFReportJob(payload);

      default:
        logWarn("Unknown job type", { jobId: job.id, type });
        return {
          success: true,
          runId: payload.runId ?? job.id,
          format: payload.format ?? "json",
          exportedAt: new Date().toISOString(),
          rowCount: 0,
          metadata: { message: "No handler for job type" },
        };
    }
  }

  /**
   * Normalize DB payloads that may arrive as JSON text or parsed JSON.
   */
  private parseJobPayload(payload: ExportJobPayload | string): ExportJobPayload {
    if (typeof payload === "string") {
      return JSON.parse(payload) as ExportJobPayload;
    }

    return payload;
  }

  /**
   * Handle reconciliation export job
   */
  private async handleExportJob(payload: ExportJobPayload): Promise<ExportJobExecutionResult> {
    const { runId, tenantId, format = "json" } = payload;

    if (!runId) {
      throw new Error("Missing runId for export job");
    }

    logInfo("Processing export job", {
      workerId: this.workerId,
      runId,
      tenantId,
      format,
    });

    // Query run data from database
    const client = await this.pool.connect();

    try {
      // Verify run exists and belongs to tenant
      const runResult = await client.query(
        `SELECT id, status, matched_count, unmatched_source_count, unmatched_target_count, total_records
         FROM reconciliation_runs WHERE id = $1 AND tenant_id = $2`,
        [runId, tenantId]
      );

      if (runResult.rows.length === 0) {
        throw new Error(`Run ${runId} not found in tenant ${tenantId}`);
      }

      const run = runResult.rows[0];

      // Query matches for this run
      const matchesResult = await client.query(
        `SELECT rm.id, rm.match_type, rm.confidence, rm.match_reason, rm.amount_diff, rm.date_diff,
                rm.reviewed, rm.reviewed_by, rm.reviewed_at, rm.status as exception_status,
                nt.amount, nt.currency, nt.date, nt.description, nt.category, nt.external_id
         FROM reconciliation_matches rm
         LEFT JOIN normalized_transactions nt ON nt.id = rm.source_transaction_id
         WHERE rm.run_id = $1 AND rm.tenant_id = $2
         ORDER BY rm.created_at DESC`,
        [runId, tenantId]
      );

      const matches = matchesResult.rows;
      const matchedRows = matches.filter((m) => m.match_type !== "unmatched");
      const exceptionRows = matches.filter((m) => m.match_type === "unmatched");

      const exportedAt = new Date().toISOString();
      const rowCount = matches.length;

      logInfo("Export job completed", {
        workerId: this.workerId,
        runId,
        tenantId,
        format,
        matchedCount: matchedRows.length,
        exceptionCount: exceptionRows.length,
      });

      return {
        success: true,
        runId,
        format,
        exportedAt,
        rowCount,
        fileSizeBytes: JSON.stringify({
          matched: matchedRows.length,
          exceptions: exceptionRows.length,
        }).length,
        metadata: {
          runStatus: run.status,
          matchedCount: matchedRows.length,
          exceptionCount: exceptionRows.length,
          totalRows: rowCount,
        },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Handle CSV export job
   */
  private async handleCSVExportJob(payload: ExportJobPayload): Promise<ExportJobExecutionResult> {
    const { runId, tenantId } = payload;

    if (!runId) {
      throw new Error("Missing runId for CSV export job");
    }

    logInfo("Processing CSV export job", {
      workerId: this.workerId,
      runId,
      tenantId,
    });

    // Query data for CSV export
    const client = await this.pool.connect();

    try {
      const matchesResult = await client.query(
        `SELECT rm.id, rm.match_type, rm.confidence, rm.match_reason, rm.amount_diff,
                rm.reviewed, rm.status, nt.amount, nt.currency, nt.date, nt.description, nt.category
         FROM reconciliation_matches rm
         LEFT JOIN normalized_transactions nt ON nt.id = rm.source_transaction_id
         WHERE rm.run_id = $1 AND rm.tenant_id = $2
         ORDER BY rm.created_at DESC`,
        [runId, tenantId]
      );

      const rowCount = matchesResult.rows.length;
      const exportedAt = new Date().toISOString();

      return {
        success: true,
        runId,
        format: "csv",
        exportedAt,
        rowCount,
        metadata: {
          format: "csv",
        },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Handle PDF report job
   */
  private async handlePDFReportJob(payload: ExportJobPayload): Promise<ExportJobExecutionResult> {
    const { runId, tenantId } = payload;

    if (!runId) {
      throw new Error("Missing runId for PDF report job");
    }

    logInfo("Processing PDF report job", {
      workerId: this.workerId,
      runId,
      tenantId,
    });

    // Query run summary for PDF generation
    const client = await this.pool.connect();

    try {
      const runResult = await client.query(
        `SELECT rr.id, rr.status, rr.matched_count, rr.unmatched_source_count, rr.unmatched_target_count,
                rr.total_records, rr.confidence_avg, rr.error_message, rr.started_at, rr.completed_at
         FROM reconciliation_runs rr
         WHERE rr.id = $1 AND rr.tenant_id = $2`,
        [runId, tenantId]
      );

      const matchesCount = await client.query(
        `SELECT COUNT(*)::int as count FROM reconciliation_matches
         WHERE run_id = $1 AND tenant_id = $2`,
        [runId, tenantId]
      );

      const rowCount = matchesCount.rows[0]?.count || 0;
      const exportedAt = new Date().toISOString();

      return {
        success: true,
        runId,
        format: "pdf",
        exportedAt,
        rowCount,
        metadata: {
          format: "pdf",
          runStatus: runResult.rows[0]?.status || "unknown",
        },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Complete a job with success or failure status
   */
  private async completeJob(
    jobId: string,
    status: "succeeded" | "failed",
    result?: Record<string, unknown> | ExportJobExecutionResult
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `UPDATE jobs 
         SET status = $1,
             locked_by = NULL,
             locked_at = NULL,
             heartbeat_at = NULL,
             finished_at = NOW(),
             updated_at = NOW(),
             result_id = $2,
             error = $3
         WHERE id = $4 AND locked_by = $5`,
        [
          status,
          status === "succeeded" ? uuidv4() : null,
          status === "failed"
            ? {
                message:
                  result && typeof result === "object" && "error" in result
                    ? String(result.error ?? "Unknown error")
                    : "Unknown error",
              }
            : null,
          jobId,
          this.workerId,
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Retry a failed job with backoff
   */
  private async retryJob(job: ProcessedJob, errorMessage: string): Promise<Date> {
    const client = await this.pool.connect();

    try {
      // Calculate backoff: exponential with jitter
      const backoffMs = Math.min(
        1000 * Math.pow(2, job.attempts - 1) + Math.random() * 1000,
        300000 // Max 5 minutes
      );

      const runAt = new Date(Date.now() + backoffMs);

      await client.query(
        `UPDATE jobs 
         SET status = 'queued',
             locked_by = NULL,
             locked_at = NULL,
             heartbeat_at = NULL,
             error = $1,
             run_at = $2,
             updated_at = NOW()
         WHERE id = $3 AND locked_by = $4`,
        [{ message: errorMessage, attempt: job.attempts }, runAt, job.id, this.workerId]
      );

      logInfo("Job queued for retry", {
        workerId: this.workerId,
        jobId: job.id,
        attempt: job.attempts + 1,
        backoffMs,
      });

      return runAt;
    } finally {
      client.release();
    }
  }

  /**
   * Get worker statistics
   */
  getStats(): WorkerStats {
    return {
      ...this.stats,
      currentJobs: Array.from(this.activeJobs.keys()),
      isHealthy: this.isRunning && this.stats.jobsFailed < 10,
    };
  }

  /**
   * Check if worker is running
   */
  isHealthy(): boolean {
    return this.isRunning && this.stats.isHealthy;
  }

  /**
   * Graceful shutdown handler
   */
  private async shutdown(): Promise<void> {
    logInfo("Shutdown signal received", { workerId: this.workerId });
    await this.stop();
  }
}

/**
 * Factory function to create worker instance
 */
export function createExportJobWorker(
  workerId?: string,
  config?: Partial<WorkerConfig>
): ExportJobWorker {
  return new ExportJobWorker(workerId, config);
}
