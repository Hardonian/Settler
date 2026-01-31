/**
 * Generic Job Queue API (RLS-safe)
 *
 * Server actions for enqueueing and managing jobs from the Next.js app.
 * Provides type-safe interface to the job queue with tenant isolation.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCorrelationId } from "@/lib/logger";

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "dead" | "canceled";

export interface Job {
  id: string;
  tenant_id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  run_at: string;
  locked_at?: string;
  started_at?: string;
  finished_at?: string;
  locked_by?: string;
  error?: Record<string, unknown>;
  error_message?: string;
  result_ref?: string;
  idempotency_key?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JobResult {
  id: string;
  job_id: string;
  tenant_id: string;
  result_data?: Record<string, unknown>;
  result_url?: string;
  created_at: string;
}

export interface EnqueueJobRequest {
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  runAt?: Date;
  maxAttempts?: number;
}

export interface EnqueueJobResult {
  success: boolean;
  job?: Job;
  jobId?: string;
  error?: string;
  correlationId: string;
}

export interface JobStats {
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  dead: number;
  canceled: number;
  total: number;
}

export interface ListJobsOptions {
  status?: JobStatus;
  type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Enqueue a job for background processing
 *
 * Primary interface for creating jobs with idempotency support.
 * Jobs are queued in the jobs table and processed by workers.
 */
export async function enqueueJob(request: EnqueueJobRequest): Promise<EnqueueJobResult> {
  const correlationId = generateCorrelationId();
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Authentication required",
        correlationId,
      };
    }

    // Get tenant_id from session
    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return {
        success: false,
        error: "No tenant context",
        correlationId,
      };
    }

    // Call RPC function to enqueue
    const { data: jobId, error } = await supabase.rpc("enqueue_job", {
      p_tenant_id: tenantId,
      p_type: request.type,
      p_payload: request.payload,
      p_idempotency_key: request.idempotencyKey || null,
      p_run_at: request.runAt?.toISOString() || null,
      p_max_attempts: request.maxAttempts || 3,
      p_created_by: session.user.id,
    });

    if (error) {
      console.error("[enqueueJob] RPC error:", error);
      return {
        success: false,
        error: error.message,
        correlationId,
      };
    }

    // Fetch the created job
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError) {
      console.error("[enqueueJob] Fetch error:", fetchError);
      return {
        success: true, // Job was created even if we can't fetch it
        jobId,
        correlationId,
      };
    }

    return {
      success: true,
      job,
      jobId,
      correlationId,
    };
  } catch (err) {
    console.error("[enqueueJob] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      correlationId,
    };
  }
}

/**
 * List jobs for the current tenant
 */
export async function listJobs(
  options: ListJobsOptions = {}
): Promise<{ success: boolean; jobs?: Job[]; error?: string }> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return { success: false, error: "No tenant context" };
    }

    let query = supabase
      .from("jobs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(options.limit || 50);

    if (options.status) {
      query = query.eq("status", options.status);
    }

    if (options.type) {
      query = query.eq("type", options.type);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error("[listJobs] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, jobs: jobs || [] };
  } catch (err) {
    console.error("[listJobs] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Get a single job by ID
 */
export async function getJob(
  jobId: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return { success: false, error: "No tenant context" };
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Job not found" };
      }
      console.error("[getJob] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, job };
  } catch (err) {
    console.error("[getJob] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Get job statistics for the current tenant
 */
export async function getJobStats(): Promise<{
  success: boolean;
  stats?: JobStats;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return { success: false, error: "No tenant context" };
    }

    const { data: counts, error } = await supabase
      .from("jobs")
      .select("status")
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[getJobStats] Error:", error);
      return { success: false, error: error.message };
    }

    const stats: JobStats = {
      queued: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
      dead: 0,
      canceled: 0,
      total: counts?.length || 0,
    };

    counts?.forEach((row) => {
      if (row.status in stats) {
        stats[row.status as keyof Omit<JobStats, "total">]++;
      }
    });

    return { success: true, stats };
  } catch (err) {
    console.error("[getJobStats] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Cancel a queued or running job
 */
export async function cancelJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return { success: false, error: "No tenant context" };
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "canceled",
        locked_by: null,
        locked_at: null,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("tenant_id", tenantId)
      .in("status", ["queued", "running"]);

    if (error) {
      console.error("[cancelJob] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[cancelJob] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Retry a dead or failed job
 */
export async function retryJob(
  jobId: string,
  delayMs?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return { success: false, error: "No tenant context" };
    }

    const { error } = await supabase.rpc("retry_job", {
      p_job_id: jobId,
      p_delay: delayMs ? `${delayMs} milliseconds` : "0 seconds",
    });

    if (error) {
      console.error("[retryJob] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[retryJob] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Create a test job (for smoke testing)
 */
export async function createTestJob(testData?: Record<string, unknown>): Promise<EnqueueJobResult> {
  const correlationId = generateCorrelationId();
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Authentication required",
        correlationId,
      };
    }

    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return {
        success: false,
        error: "No tenant context",
        correlationId,
      };
    }

    const { data: jobId, error } = await supabase.rpc("create_test_job", {
      p_tenant_id: tenantId,
      p_test_data: testData || { message: "smoke test" },
    });

    if (error) {
      console.error("[createTestJob] RPC error:", error);
      return {
        success: false,
        error: error.message,
        correlationId,
      };
    }

    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError) {
      return {
        success: true,
        jobId,
        correlationId,
      };
    }

    return {
      success: true,
      job,
      jobId,
      correlationId,
    };
  } catch (err) {
    console.error("[createTestJob] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      correlationId,
    };
  }
}
