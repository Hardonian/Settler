/**
 * Python Workhorse Job Queue API
 *
 * Server actions for enqueueing Python jobs from the Next.js app.
 * Provides type-safe interface to the Python job queue.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCorrelationId } from "@/lib/logger";

export type PythonJobType =
  | "csv_ingestion"
  | "json_ingestion"
  | "pdf_report"
  | "excel_export"
  | "reconciliation_batch"
  | "anomaly_detection"
  | "daily_report"
  | "data_quality_check"
  | "custom";

export type PythonJobStatus = "queued" | "running" | "succeeded" | "failed" | "dead" | "cancelled";

export interface PythonJob {
  id: string;
  tenant_id: string;
  workspace_id?: string;
  job_type: PythonJobType;
  payload: Record<string, unknown>;
  status: PythonJobStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at?: string;
  available_at?: string;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, unknown>;
  error_message?: string;
  records_processed?: number;
  records_failed?: number;
  output_location?: string;
}

export interface EnqueuePythonJobRequest {
  jobType: PythonJobType;
  payload: Record<string, unknown>;
  priority?: number;
  idempotencyKey?: string;
  maxAttempts?: number;
  delaySeconds?: number;
}

export interface EnqueuePythonJobResult {
  success: boolean;
  job?: PythonJob;
  error?: string;
  correlationId: string;
}

export interface PythonJobStats {
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  dead: number;
  cancelled: number;
  total: number;
}

/**
 * Enqueue a Python job for background processing
 *
 * This is the primary interface from TypeScript to the Python workhorse.
 * Jobs are queued in the python_jobs table and processed by the Python worker.
 */
export async function enqueuePythonJob(
  request: EnqueuePythonJobRequest
): Promise<EnqueuePythonJobResult> {
  const correlationId = generateCorrelationId();
  const supabase = await createClient();

  try {
    // Get current tenant from session
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

    // Get tenant_id from user metadata or session
    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return {
        success: false,
        error: "Tenant context not found",
        correlationId,
      };
    }

    // Call the database function to enqueue
    // @ts-expect-error - Database RPC type definition issue
    const { data: jobId, error: enqueueError } = await supabase.rpc("enqueue_python_job", {
      p_tenant_id: tenantId,
      p_workspace_id: null, // Optional: can be extended later
      p_job_type: request.jobType,
      p_payload: request.payload,
      p_priority: request.priority ?? 100,
      p_idempotency_key: request.idempotencyKey ?? null,
      p_max_attempts: request.maxAttempts ?? 3,
      p_delay_seconds: request.delaySeconds ?? 0,
    });

    if (enqueueError) {
      console.error("Failed to enqueue Python job:", enqueueError);
      return {
        success: false,
        error: `Database error: ${enqueueError.message}`,
        correlationId,
      };
    }

    // Fetch the created job
    const { data: job, error: fetchError } = await supabase
      .from("python_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return {
        success: true, // Job was enqueued but we can't fetch details
        job: {
          id: jobId,
          tenant_id: tenantId,
          job_type: request.jobType,
          payload: request.payload,
          status: "queued",
          priority: request.priority ?? 100,
          attempts: 0,
          max_attempts: request.maxAttempts ?? 3,
          created_at: new Date().toISOString(),
        } as PythonJob,
        correlationId,
      };
    }

    return {
      success: true,
      job: job as PythonJob,
      correlationId,
    };
  } catch (_error) {
    console.error("Error enqueueing Python job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    };
  }
}

/**
 * Get a Python job by ID
 */
export async function getPythonJob(jobId: string): Promise<PythonJob | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.from("python_jobs").select("*").eq("id", jobId).single();

    if (error || !data) {
      return null;
    }

    return data as PythonJob;
  } catch (_error) {
    console.error("Error fetching Python job:", error);
    return null;
  }
}

/**
 * Get job statistics for the current tenant
 */
export async function getPythonJobStats(): Promise<PythonJobStats | null> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.user_metadata?.tenant_id) {
      return null;
    }

    const tenantId = session.user.user_metadata.tenant_id;

    // @ts-expect-error - Database RPC type definition issue
    const { data, error } = await supabase.rpc("get_python_job_stats", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("Error fetching job stats:", error);
      return null;
    }

    // Transform array of {status, count} into stats object
    const stats: PythonJobStats = {
      queued: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
      dead: 0,
      cancelled: 0,
      total: 0,
    };

    if (Array.isArray(data)) {
       
      for (const row of data as any[]) {
        const status = row.status as keyof Omit<PythonJobStats, "total">;
        const count = Number(row.count);
        if (status in stats) {
          stats[status] = count;
        }
        stats.total += count;
      }
    }

    return stats;
  } catch (_error) {
    console.error("Error fetching job stats:", error);
    return null;
  }
}

/**
 * Cancel a queued or running Python job
 */
export async function cancelPythonJob(jobId: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.user_metadata?.tenant_id) {
      return false;
    }

    const tenantId = session.user.user_metadata.tenant_id;

    // Use RPC for atomic cancel with RLS
    const { error } = await supabase
      .from("python_jobs")
      // @ts-expect-error - Database table update type issue
      .update({
        status: "cancelled",
        locked_at: null,
        locked_by: null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("tenant_id", tenantId)
      .in("status", ["queued", "running"]);

    if (error) {
      console.error("Error cancelling job:", error);
      return false;
    }

    return true;
  } catch (_error) {
    console.error("Error cancelling Python job:", error);
    return false;
  }
}

/**
 * Enqueue a CSV ingestion job
 *
 * Convenience function for the most common use case.
 */
export async function enqueueCSVIngestion(
  fileContentBase64: string,
  options?: {
    columnMapping?: Record<string, string>;
    defaultCurrency?: string;
    skipRows?: number;
    priority?: number;
    idempotencyKey?: string;
  }
): Promise<EnqueuePythonJobResult> {
  return enqueuePythonJob({
    jobType: "csv_ingestion",
    payload: {
      file_content_base64: fileContentBase64,
      column_mapping: options?.columnMapping,
      default_currency: options?.defaultCurrency ?? "USD",
      skip_rows: options?.skipRows ?? 0,
    },
    priority: options?.priority,
    idempotencyKey: options?.idempotencyKey,
  });
}

/**
 * Enqueue an export job
 *
 * Export data in CSV, Excel, or PDF format.
 */
export async function enqueueExport(
  entityType: "transactions" | "reconciliations" | "accounts" | "ledgers",
  format: "csv" | "excel" | "pdf",
  tenantId: string,
  options?: {
    filters?: Record<string, unknown>;
    columns?: string[];
    title?: string; // For PDF
    priority?: number;
    idempotencyKey?: string;
  }
): Promise<EnqueuePythonJobResult> {
  const jobTypeMap: Record<string, PythonJobType> = {
    csv: "csv_ingestion", // Will be mapped by backend to export.csv
    excel: "excel_export", // Will be mapped by backend to export.excel
    pdf: "pdf_report", // Will be mapped by backend to export.pdf
  };

  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    entity_type: entityType,
    filters: options?.filters || {},
    columns: options?.columns || [],
    dry_run: false,
    idempotency_key: options?.idempotencyKey || null,
  };

  if (format === "pdf" && options?.title) {
    payload.title = options.title;
  }

  return enqueuePythonJob({
    jobType: jobTypeMap[format] ?? "custom",
    payload,
    priority: options?.priority,
    idempotencyKey: options?.idempotencyKey,
  });
}

/**
 * Enqueue an import validation job
 *
 * Validate CSV/Excel files before actual import.
 */
export async function enqueueImportValidation(
  fileContentBase64: string,
  importType: "csv" | "xlsx",
  tenantId: string,
  options?: {
    expectedColumns?: string[];
    requiredColumns?: string[];
    columnMapping?: Record<string, string>;
    priority?: number;
    idempotencyKey?: string;
  }
): Promise<EnqueuePythonJobResult> {
  // Note: This requires backend support for "import.validate" job type
  // For now, we'll use a generic approach
  return enqueuePythonJob({
    jobType: "custom",
    payload: {
      tenant_id: tenantId,
      file_content_base64: fileContentBase64,
      import_type: importType,
      expected_columns: options?.expectedColumns || [],
      required_columns: options?.requiredColumns || [],
      column_mapping: options?.columnMapping || {},
      dry_run: false,
      idempotency_key: options?.idempotencyKey || null,
    },
    priority: options?.priority,
    idempotencyKey: options?.idempotencyKey,
  });
}

/**
 * Enqueue a receipt OCR job
 *
 * Extract text and data from receipt images.
 */
export async function enqueueReceiptOCR(
  imageContentBase64: string,
  tenantId: string,
  options?: {
    receiptId?: string;
    ocrEngine?: "tesseract" | "mock";
    preprocess?: boolean;
    extractStructure?: boolean;
    language?: string;
    priority?: number;
    idempotencyKey?: string;
  }
): Promise<EnqueuePythonJobResult> {
  // Note: This requires backend support for "receipt.ocr" job type
  // For now, we'll use a generic approach
  return enqueuePythonJob({
    jobType: "custom",
    payload: {
      tenant_id: tenantId,
      image_content_base64: imageContentBase64,
      receipt_id: options?.receiptId || null,
      ocr_engine: options?.ocrEngine || "tesseract",
      preprocess: options?.preprocess !== false,
      extract_structure: options?.extractStructure !== false,
      language: options?.language || "eng",
      dry_run: false,
      idempotency_key: options?.idempotencyKey || null,
    },
    priority: options?.priority,
    idempotencyKey: options?.idempotencyKey,
  });
}
