/**
 * Job Queue Module
 *
 * Server-side module for enqueueing work and checking job status.
 * Uses Supabase RPC functions for safe, RLS-compliant operations.
 *
 * All functions use tenant context for RLS enforcement.
 */

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Json } from "@/types/database.types";
import { appLogger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

// Types - import from canonical jobforge-shared
import { JobStatus } from "@jobforge/shared";
export type { JobStatus };

export interface EnqueueJobParams {
  tenantId: string;
  type: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
  maxAttempts?: number;
  runAt?: Date;
}

export interface Job {
  id: string;
  tenant_id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  run_at: string;
  locked_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  locked_by: string | null;
  error: Record<string, unknown> | null;
  error_message: string | null;
  result_ref: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobResult {
  id: string;
  job_id: string;
  tenant_id: string;
  result_data: Record<string, unknown> | null;
  result_url: string | null;
  created_at: string;
}

export interface ListJobsParams {
  tenantId: string;
  type?: string;
  status?: JobStatus;
  limit?: number;
  offset?: number;
}

export interface JobListResult {
  jobs: Job[];
  total: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  traceId: string;
  details?: unknown;
}

// Type guard to check if result is an error
export function isApiError(result: unknown): result is ApiError {
  return typeof result === "object" && result !== null && "error" in result;
}

// Helper to create friendly error response
function createErrorResponse(message: string, details?: unknown): ApiError {
  return {
    error: message,
    traceId: uuidv4(),
    details,
  };
}

/**
 * Enqueue a new job
 * Uses the enqueue_job RPC for idempotency and RLS safety
 */
export async function enqueueJob({
  tenantId,
  type,
  payload = {},
  idempotencyKey,
  maxAttempts = 3,
  runAt,
}: EnqueueJobParams): Promise<{ jobId: string } | ApiError> {
  try {
    const adminClient = await createAdminClient();

    // @ts-expect-error - Database RPC type definition issue
    const { data: jobId, error } = await adminClient.rpc("enqueue_job", {
      p_tenant_id: tenantId,
      p_type: type,
      p_payload: payload as Json,
      p_idempotency_key: idempotencyKey || null,
      p_run_at: runAt?.toISOString() || null,
      p_max_attempts: maxAttempts,
    });

    if (error) {
      appLogger.error("Failed to enqueue job", { error, tenantId, type });
      return createErrorResponse("Failed to enqueue job", error.message);
    }

    if (!jobId) {
      return createErrorResponse("Failed to enqueue job: no job ID returned");
    }

    return { jobId };
  } catch (error) {
    appLogger.error("Exception enqueueing job", { error, tenantId, type });
    return createErrorResponse(
      "Failed to enqueue job",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Get a single job by ID
 * Uses RLS to ensure tenant isolation
 */
export async function getJob(jobId: string, tenantId: string): Promise<Job | ApiError> {
  try {
    const client = await createClient();

    // Set tenant context for RLS
    // @ts-expect-error - Database RPC type definition issue
    await client.rpc("set_tenant_context", { tenant_id: tenantId });

    const { data: job, error } = await client.from("jobs").select("*").eq("id", jobId).single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return createErrorResponse("Job not found");
      }
      appLogger.error("Failed to get job", { error, jobId, tenantId });
      return createErrorResponse("Failed to retrieve job", error.message);
    }

    if (!job) {
      return createErrorResponse("Job not found");
    }

    return job as Job;
  } catch (error) {
    appLogger.error("Exception getting job", { error, jobId, tenantId });
    return createErrorResponse(
      "Failed to retrieve job",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * List jobs for a tenant with optional filtering
 * Uses RLS to ensure tenant isolation
 */
export async function listJobs({
  tenantId,
  type,
  status,
  limit = 20,
  offset = 0,
}: ListJobsParams): Promise<JobListResult | ApiError> {
  try {
    const client = await createClient();

    // Set tenant context for RLS
    // @ts-expect-error - Database RPC type definition issue
    await client.rpc("set_tenant_context", { tenant_id: tenantId });

    // Build query
    let query = client.from("jobs").select("*", { count: "exact" });

    if (type) {
      query = query.eq("type", type);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Order by created_at desc (newest first)
    query = query.order("created_at", { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: jobs, error, count } = await query;

    if (error) {
      appLogger.error("Failed to list jobs", { error, tenantId });
      return createErrorResponse("Failed to list jobs", error.message);
    }

    const total = count || 0;

    return {
      jobs: (jobs || []) as Job[],
      total,
      hasMore: total > offset + limit,
    };
  } catch (error) {
    appLogger.error("Exception listing jobs", { error, tenantId });
    return createErrorResponse(
      "Failed to list jobs",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Get job result by job ID
 * Uses RLS to ensure tenant isolation
 */
export async function getJobResult(jobId: string, tenantId: string): Promise<JobResult | ApiError> {
  try {
    const client = await createClient();

    // Set tenant context for RLS
    // @ts-expect-error - Database RPC type definition issue
    await client.rpc("set_tenant_context", { tenant_id: tenantId });

    const { data: result, error } = await client
      .from("job_results")
      .select("id, job_id, tenant_id, result_data, result_url, created_at")
      .eq("job_id", jobId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found - check if job exists
        const { data: job } = await client.from("jobs").select("status").eq("id", jobId).single();

        if (!job) {
          return createErrorResponse("Job not found");
        }

        // @ts-expect-error - Type inference issue with job row
        if (job.status === "running" || job.status === "queued") {
          return createErrorResponse("Job result not yet available - job is still processing");
        }

        return createErrorResponse("No result found for this job");
      }
      appLogger.error("Failed to get job result", { error, jobId, tenantId });
      return createErrorResponse("Failed to retrieve job result", error.message);
    }

    if (!result) {
      return createErrorResponse("Job result not found");
    }

    return result as JobResult;
  } catch (error) {
    appLogger.error("Exception getting job result", { error, jobId, tenantId });
    return createErrorResponse(
      "Failed to retrieve job result",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Check if a job is complete (succeeded, failed, dead, or canceled)
 */
export function isJobComplete(status: JobStatus): boolean {
  return ["succeeded", "failed", "dead", "canceled"].includes(status);
}

/**
 * Format job for API response
 * Removes internal fields and adds helpful metadata
 */
export function formatJobForResponse(job: Job): Record<string, unknown> {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    payload: job.payload,
    attempts: job.attempts,
    max_attempts: job.max_attempts,
    created_at: job.created_at,
    updated_at: job.updated_at,
    started_at: job.started_at,
    finished_at: job.finished_at,
    run_at: job.run_at,
    error: job.error,
    error_message: job.error_message,
    result_ref: job.result_ref,
    is_complete: isJobComplete(job.status),
  };
}

/**
 * Format job result for API response
 */
export function formatJobResultForResponse(result: JobResult): Record<string, unknown> {
  return {
    job_id: result.job_id,
    result_data: result.result_data,
    result_url: result.result_url,
    created_at: result.created_at,
  };
}
