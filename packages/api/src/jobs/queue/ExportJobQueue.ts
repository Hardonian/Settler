/**
 * Export Job Queue Service
 *
 * Provides an interface for enqueueing export jobs to be processed
 * by the background worker. Supports multi-tenant isolation and
 * idempotency.
 */

import { query } from "../../db";
import { v4 as uuidv4 } from "uuid";
import { logInfo, logError } from "../../utils/logger";
import { ExportJobPayload } from "../worker/ExportJobWorker";

export interface EnqueueExportJobOptions {
  tenantId: string;
  userId: string;
  type: "export" | "reconciliation-export" | "csv-export" | "pdf-report";
  runId?: string;
  format?: "csv" | "json" | "pdf" | "xlsx";
  options?: Record<string, unknown>;
  idempotencyKey?: string;
  runAt?: Date;
  maxAttempts?: number;
}

export interface EnqueuedJob {
  id: string;
  tenantId: string;
  type: string;
  status: string;
  createdAt: Date;
}

/**
 * Export Job Queue Service
 *
 * Handles enqueueing export jobs with proper tenant isolation
 * and idempotency support.
 */
export class ExportJobQueue {
  /**
   * Enqueue a new export job
   */
  async enqueue(options: EnqueueExportJobOptions): Promise<EnqueuedJob> {
    const {
      tenantId,
      userId,
      type,
      runId,
      format = "json",
      options: jobOptions = {},
      idempotencyKey,
      runAt,
      maxAttempts = 5,
    } = options;

    // Validate tenant ID format (UUID)
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)
    ) {
      throw new Error(`[TENANT ISOLATION VIOLATION] Invalid tenantId: ${tenantId}`);
    }

    const jobId = uuidv4();
    const payload: ExportJobPayload = {
      type,
      runId,
      format,
      options: jobOptions,
      tenantId,
      userId,
    };

    try {
      // Check for existing job with same idempotency key
      if (idempotencyKey) {
        const existing = await query<{ id: string }>(
          `SELECT id FROM jobs 
           WHERE tenant_id = $1 AND idempotency_key = $2
           LIMIT 1`,
          [tenantId, idempotencyKey]
        );

        if (existing.length > 0) {
          logInfo("Returning existing job for idempotency key", {
            tenantId,
            idempotencyKey,
            existingJobId: existing[0].id,
          });

          const existingJob = await query<{
            id: string;
            tenant_id: string;
            type: string;
            status: string;
            created_at: Date;
          }>(`SELECT id, tenant_id, type, status, created_at FROM jobs WHERE id = $1`, [
            existing[0].id,
          ]);

          if (existingJob.length > 0) {
            return {
              id: existingJob[0].id,
              tenantId: existingJob[0].tenant_id,
              type: existingJob[0].type,
              status: existingJob[0].status,
              createdAt: existingJob[0].created_at,
            };
          }
        }
      }

      // Insert new job
      const result = await query<{ id: string; created_at: Date }>(
        `INSERT INTO jobs (
           id,
           tenant_id,
           type,
           payload,
           status,
           idempotency_key,
           created_by,
           run_at,
           max_attempts,
           attempts,
           created_at,
           updated_at
         ) VALUES ($1, $2, $3, $4, 'queued', $5, $6, $7, $8, 0, NOW(), NOW())
         RETURNING id, created_at`,
        [
          jobId,
          tenantId,
          type,
          JSON.stringify(payload),
          idempotencyKey || null,
          userId,
          runAt || null,
          maxAttempts,
        ]
      );

      if (result.length === 0 || !result[0]) {
        throw new Error("Failed to enqueue job: no returned ID");
      }

      logInfo("Export job enqueued", {
        jobId,
        tenantId,
        type,
        idempotencyKey,
        runAt,
      });

      return {
        id: result[0].id,
        tenantId,
        type,
        status: "queued",
        createdAt: result[0].created_at,
      };
    } catch (error) {
      logError("Failed to enqueue export job", error, {
        tenantId,
        type,
        runId,
      });
      throw error;
    }
  }

  /**
   * Get job status and details
   */
  async getJob(
    jobId: string,
    tenantId: string
  ): Promise<{
    id: string;
    tenantId: string;
    type: string;
    status: string;
    payload: ExportJobPayload;
    attempts: number;
    maxAttempts: number;
    error: Record<string, unknown> | null;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
  } | null> {
    // Validate tenant ID format
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)
    ) {
      throw new Error(`[TENANT ISOLATION VIOLATION] Invalid tenantId: ${tenantId}`);
    }

    const result = await query<{
      id: string;
      tenant_id: string;
      type: string;
      status: string;
      payload: string;
      attempts: number;
      max_attempts: number;
      error: Record<string, unknown> | null;
      created_at: Date;
      started_at: Date | null;
      finished_at: Date | null;
    }>(
      `SELECT id, tenant_id, type, status, payload, attempts, max_attempts, 
              error, created_at, started_at, finished_at
       FROM jobs 
       WHERE id = $1 AND tenant_id = $2`,
      [jobId, tenantId]
    );

    if (result.length === 0 || !result[0]) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      status: row.status,
      payload: JSON.parse(row.payload) as ExportJobPayload,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      error: row.error,
      createdAt: row.created_at,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
    };
  }

  /**
   * Cancel a queued job (only if not yet running)
   */
  async cancelJob(jobId: string, tenantId: string): Promise<boolean> {
    // Validate tenant ID format
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)
    ) {
      throw new Error(`[TENANT ISOLATION VIOLATION] Invalid tenantId: ${tenantId}`);
    }

    const result = await query<{ id: string }>(
      `UPDATE jobs 
       SET status = 'canceled', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND status = 'queued'
       RETURNING id`,
      [jobId, tenantId]
    );

    if (result.length === 0) {
      return false;
    }

    logInfo("Job canceled", { jobId, tenantId });
    return true;
  }

  /**
   * List jobs for a tenant
   */
  async listJobs(
    tenantId: string,
    options: {
      status?: string | string[];
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    jobs: Array<{
      id: string;
      type: string;
      status: string;
      attempts: number;
      createdAt: Date;
      finishedAt: Date | null;
    }>;
    total: number;
  }> {
    // Validate tenant ID format
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)
    ) {
      throw new Error(`[TENANT ISOLATION VIOLATION] Invalid tenantId: ${tenantId}`);
    }

    const { status, type, limit = 100, offset = 0 } = options;

    let whereClause = "WHERE tenant_id = $1";
    const params: (string | number)[] = [tenantId];

    if (status) {
      if (Array.isArray(status)) {
        whereClause += ` AND status = ANY($${params.length + 1})`;
        params.push(status);
      } else {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(status);
      }
    }

    if (type) {
      whereClause += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    const [jobs, countResult] = await Promise.all([
      query<{
        id: string;
        type: string;
        status: string;
        attempts: number;
        created_at: Date;
        finished_at: Date | null;
      }>(
        `SELECT id, type, status, attempts, created_at, finished_at
         FROM jobs ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM jobs ${whereClause}`, params),
    ]);

    return {
      jobs: jobs.map((j) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        attempts: j.attempts,
        createdAt: j.created_at,
        finishedAt: j.finished_at,
      })),
      total: parseInt(countResult[0]?.count || "0", 10),
    };
  }
}

/**
 * Create a new ExportJobQueue instance
 */
export function createExportJobQueue(): ExportJobQueue {
  return new ExportJobQueue();
}
