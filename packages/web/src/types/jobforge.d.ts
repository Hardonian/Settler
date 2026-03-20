/**
 * Type declarations for @jobforge/* packages.
 *
 * These packages are optional integrations that may not be installed.
 * Stub declarations let the rest of the codebase compile cleanly.
 */

declare module "@jobforge/sdk-ts" {
  export interface JobForgeClientConfig {
    supabaseUrl: string;
    supabaseKey: string;
  }

  export interface EnqueueJobParams {
    tenant_id: string;
    type: string;
    payload?: Record<string, unknown>;
    idempotency_key?: string;
  }

  export class JobForgeClient {
    constructor(config: JobForgeClientConfig);
    enqueueJob(params: EnqueueJobParams): Promise<import("@jobforge/shared").JobRow>;
    getJob(jobId: string, tenantId: string): Promise<import("@jobforge/shared").JobRow | null>;
    getResult(
      resultId: string,
      tenantId: string
    ): Promise<import("@jobforge/shared").JobResultRow | null>;
  }
}

declare module "@jobforge/shared" {
  export type JobStatus =
    | "pending"
    | "queued"
    | "running"
    | "completed"
    | "succeeded"
    | "failed"
    | "dead"
    | "cancelled"
    | "canceled"
    | "retrying";

  export interface JobRow {
    id: string;
    tenant_id: string;
    type: string;
    status: JobStatus;
    payload?: Record<string, unknown>;
    result_id?: string;
    created_at: string;
    updated_at?: string;
    [key: string]: unknown;
  }

  export interface JobResultRow {
    id: string;
    job_id: string;
    status: JobStatus;
    output?: Record<string, unknown>;
    error?: string;
    created_at: string;
    [key: string]: unknown;
  }
}
