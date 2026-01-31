/**
 * JobForge shared types
 * Used by both TypeScript and Python SDKs
 */

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'dead' | 'canceled'

export interface JobRow {
  id: string
  tenant_id: string
  type: string
  payload: Record<string, unknown>
  status: JobStatus
  attempts: number
  max_attempts: number
  run_at: string // ISO timestamp
  locked_at: string | null
  locked_by: string | null
  heartbeat_at: string | null
  started_at: string | null
  finished_at: string | null
  idempotency_key: string | null
  created_by: string | null
  error: Record<string, unknown> | null
  result_id: string | null
  created_at: string
  updated_at: string
}

export interface JobResultRow {
  id: string
  job_id: string
  tenant_id: string
  result: Record<string, unknown>
  artifact_ref: string | null
  created_at: string
}

export interface JobAttemptRow {
  id: string
  job_id: string
  tenant_id: string
  attempt_no: number
  started_at: string
  finished_at: string | null
  error: Record<string, unknown> | null
  created_at: string
}

export interface ConnectorConfigRow {
  id: string
  tenant_id: string
  connector_type: string
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface EnqueueJobParams {
  tenant_id: string
  type: string
  payload: Record<string, unknown>
  idempotency_key?: string
  run_at?: string // ISO timestamp, defaults to now
  max_attempts?: number // defaults to 5
}

export interface ClaimJobsParams {
  worker_id: string
  limit?: number
}

export interface HeartbeatJobParams {
  job_id: string
  worker_id: string
}

export interface CompleteJobParams {
  job_id: string
  worker_id: string
  status: 'succeeded' | 'failed'
  error?: Record<string, unknown>
  result?: Record<string, unknown>
  artifact_ref?: string
}

export interface CancelJobParams {
  job_id: string
  tenant_id: string
}

export interface RescheduleJobParams {
  job_id: string
  tenant_id: string
  run_at: string // ISO timestamp
}

export interface ListJobsParams {
  tenant_id: string
  filters?: {
    status?: JobStatus | JobStatus[]
    type?: string
    limit?: number
    offset?: number
  }
}

/**
 * Job type registry interface
 * Implement this to register job handlers with validation
 */
export interface JobTypeRegistry {
  register<TPayload = unknown, TResult = unknown>(
    type: string,
    handler: JobHandler<TPayload, TResult>,
    options?: JobHandlerOptions
  ): void

  get(type: string): JobHandlerRegistration | undefined
}

export interface JobHandler<TPayload = unknown, TResult = unknown> {
  (payload: TPayload, context: JobContext): Promise<TResult>
}

export interface JobContext {
  job_id: string
  tenant_id: string
  attempt_no: number
  trace_id: string
  heartbeat: () => Promise<void>
}

export interface JobHandlerOptions {
  validate?: (payload: unknown) => boolean
  maxAttempts?: number
  timeoutMs?: number
}

export interface JobHandlerRegistration {
  handler: JobHandler
  options?: JobHandlerOptions
}
