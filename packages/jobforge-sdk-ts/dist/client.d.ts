/**
 * JobForge TypeScript SDK - Server-only client
 * Never expose service keys on the client
 */
import { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow, JobResultRow, EnqueueJobParams, ClaimJobsParams, HeartbeatJobParams, CompleteJobParams, CancelJobParams, RescheduleJobParams, ListJobsParams } from "@jobforge/shared";
export interface JobForgeClientConfig {
    supabaseUrl: string;
    supabaseKey: string;
    /** Optional custom Supabase client */
    supabaseClient?: SupabaseClient;
}
export declare class JobForgeClient {
    private supabase;
    constructor(config: JobForgeClientConfig);
    /**
     * Enqueue a new job
     */
    enqueueJob(params: EnqueueJobParams): Promise<JobRow>;
    /**
     * Claim jobs for processing (worker use)
     */
    claimJobs(params: ClaimJobsParams): Promise<JobRow[]>;
    /**
     * Send heartbeat for a running job
     */
    heartbeatJob(params: HeartbeatJobParams): Promise<void>;
    /**
     * Complete a job (succeeded or failed)
     */
    completeJob(params: CompleteJobParams): Promise<void>;
    /**
     * Cancel a job
     */
    cancelJob(params: CancelJobParams): Promise<void>;
    /**
     * Reschedule a job
     */
    rescheduleJob(params: RescheduleJobParams): Promise<void>;
    /**
     * List jobs with filters
     */
    listJobs(params: ListJobsParams): Promise<JobRow[]>;
    /**
     * Get a single job by ID
     */
    getJob(jobId: string, tenantId: string): Promise<JobRow | null>;
    /**
     * Get job result
     */
    getResult(resultId: string, tenantId: string): Promise<JobResultRow | null>;
}
//# sourceMappingURL=client.d.ts.map