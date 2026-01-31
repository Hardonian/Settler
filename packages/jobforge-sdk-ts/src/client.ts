/**
 * JobForge TypeScript SDK - Server-only client
 * Never expose service keys on the client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  JobRow,
  JobResultRow,
  EnqueueJobParams,
  ClaimJobsParams,
  HeartbeatJobParams,
  CompleteJobParams,
  CancelJobParams,
  RescheduleJobParams,
  ListJobsParams,
} from '@jobforge/shared'
import { enqueueJobParamsSchema, completeJobParamsSchema } from '@jobforge/shared'

export interface JobForgeClientConfig {
  supabaseUrl: string
  supabaseKey: string
  /** Optional custom Supabase client */
  supabaseClient?: SupabaseClient
}

export class JobForgeClient {
  private supabase: SupabaseClient

  constructor(config: JobForgeClientConfig) {
    this.supabase = config.supabaseClient || createClient(config.supabaseUrl, config.supabaseKey)
  }

  /**
   * Enqueue a new job
   */
  async enqueueJob(params: EnqueueJobParams): Promise<JobRow> {
    // Validate params
    const validated = enqueueJobParamsSchema.parse(params)

    const { data, error } = await this.supabase.rpc('jobforge_enqueue_job', {
      p_tenant_id: validated.tenant_id,
      p_type: validated.type,
      p_payload: validated.payload,
      p_idempotency_key: validated.idempotency_key || null,
      p_run_at: validated.run_at || new Date().toISOString(),
      p_max_attempts: validated.max_attempts || 5,
    })

    if (error) {
      throw new Error(`Failed to enqueue job: ${error.message}`)
    }

    return data as JobRow
  }

  /**
   * Claim jobs for processing (worker use)
   */
  async claimJobs(params: ClaimJobsParams): Promise<JobRow[]> {
    const { data, error } = await this.supabase.rpc('jobforge_claim_jobs', {
      p_worker_id: params.worker_id,
      p_limit: params.limit || 10,
    })

    if (error) {
      throw new Error(`Failed to claim jobs: ${error.message}`)
    }

    return (data as JobRow[]) || []
  }

  /**
   * Send heartbeat for a running job
   */
  async heartbeatJob(params: HeartbeatJobParams): Promise<void> {
    const { error } = await this.supabase.rpc('jobforge_heartbeat_job', {
      p_job_id: params.job_id,
      p_worker_id: params.worker_id,
    })

    if (error) {
      throw new Error(`Failed to heartbeat job: ${error.message}`)
    }
  }

  /**
   * Complete a job (succeeded or failed)
   */
  async completeJob(params: CompleteJobParams): Promise<void> {
    // Validate params
    const validated = completeJobParamsSchema.parse(params)

    const { error } = await this.supabase.rpc('jobforge_complete_job', {
      p_job_id: validated.job_id,
      p_worker_id: validated.worker_id,
      p_status: validated.status,
      p_error: validated.error || null,
      p_result: validated.result || null,
      p_artifact_ref: validated.artifact_ref || null,
    })

    if (error) {
      throw new Error(`Failed to complete job: ${error.message}`)
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(params: CancelJobParams): Promise<void> {
    const { error } = await this.supabase.rpc('jobforge_cancel_job', {
      p_job_id: params.job_id,
      p_tenant_id: params.tenant_id,
    })

    if (error) {
      throw new Error(`Failed to cancel job: ${error.message}`)
    }
  }

  /**
   * Reschedule a job
   */
  async rescheduleJob(params: RescheduleJobParams): Promise<void> {
    const { error } = await this.supabase.rpc('jobforge_reschedule_job', {
      p_job_id: params.job_id,
      p_tenant_id: params.tenant_id,
      p_run_at: params.run_at,
    })

    if (error) {
      throw new Error(`Failed to reschedule job: ${error.message}`)
    }
  }

  /**
   * List jobs with filters
   */
  async listJobs(params: ListJobsParams): Promise<JobRow[]> {
    const filters = {
      status: params.filters?.status || null,
      type: params.filters?.type || null,
      limit: params.filters?.limit || 50,
      offset: params.filters?.offset || 0,
    }

    const { data, error } = await this.supabase.rpc('jobforge_list_jobs', {
      p_tenant_id: params.tenant_id,
      p_filters: filters,
    })

    if (error) {
      throw new Error(`Failed to list jobs: ${error.message}`)
    }

    return (data as JobRow[]) || []
  }

  /**
   * Get a single job by ID
   */
  async getJob(jobId: string, tenantId: string): Promise<JobRow | null> {
    const { data, error } = await this.supabase
      .from('jobforge_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw new Error(`Failed to get job: ${error.message}`)
    }

    return data as JobRow
  }

  /**
   * Get job result
   */
  async getResult(resultId: string, tenantId: string): Promise<JobResultRow | null> {
    const { data, error } = await this.supabase
      .from('jobforge_job_results')
      .select('*')
      .eq('id', resultId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get result: ${error.message}`)
    }

    return data as JobResultRow
  }
}
