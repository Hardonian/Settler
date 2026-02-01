/**
 * Background Job Worker
 * 
 * Processes jobs from the queue with retries, backoff, and dead-letter handling.
 */

import { createClient } from '@/lib/supabase/server';
import { getNextAvailableAt, shouldRetry } from '@/lib/backoff';
import { createLogger, generateCorrelationId } from '@/lib/logger';

export interface Job {
  id: string;
  workspace_id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'dead';
  idempotency_key?: string;
  run_id?: string;
  attempts: number;
  max_attempts: number;
  last_error?: Record<string, unknown>;
  available_at: Date;
}

export interface JobHandler {
  (job: Job): Promise<void>;
}

const WORKER_ID = `worker_${process.pid}_${Date.now()}`;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Claim next available job from queue
 */
export async function claimNextJob(): Promise<Job | null> {
  const supabase = await createClient();
  const logger = createLogger({ workerId: WORKER_ID });

  try {
    // Find next available job (not locked or lock expired)
    const { data: jobs, error } = await (supabase
      .from('jobs' as any)
      .select('*')
      .eq('status', 'queued')
      .lte('available_at', new Date().toISOString())
      .or(`locked_at.is.null,locked_at.lt.${new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString()}`)
      .order('available_at', { ascending: true })
      .limit(1) as any);

    if (error) {
      logger.error('Failed to query jobs', error as Error);
      return null;
    }

    if (!jobs || jobs.length === 0) {
      return null;
    }

    const job = jobs[0];

    // Try to lock the job
    const { data: updated, error: lockError } = await ((supabase.from('jobs' as any) as any)
      .update({
        status: 'running',
        locked_at: new Date().toISOString(),
        locked_by: WORKER_ID,
      } as any)
      .eq('id', job.id)
      .eq('status', 'queued') // Optimistic locking
      .select()
      .single() as any);

    if (lockError || !updated) {
      // Job was claimed by another worker
      logger.debug('Job already claimed by another worker', { jobId: job.id });
      return null;
    }

    logger.info('Claimed job', {
      jobId: updated.id,
      type: updated.type,
      workspaceId: updated.workspace_id,
    });

    return {
      id: updated.id,
      workspace_id: updated.workspace_id,
      type: updated.type,
      payload: updated.payload || {},
      status: updated.status as Job['status'],
      idempotency_key: updated.idempotency_key || undefined,
      run_id: updated.run_id || undefined,
      attempts: updated.attempts,
      max_attempts: updated.max_attempts,
      last_error: updated.last_error || undefined,
      available_at: new Date(updated.available_at),
    };
  } catch (_error) {
    logger.error('Error claiming job', error as Error);
    return null;
  }
}

/**
 * Execute a job
 */
export async function executeJob(job: Job, handler: JobHandler): Promise<void> {
  const supabase = await createClient();
  const correlationId = generateCorrelationId();
  const logger = createLogger({
    jobId: job.id,
    workspaceId: job.workspace_id,
    correlationId,
  });

  const attemptNo = job.attempts + 1;

  logger.info('Executing job', {
    type: job.type,
    attempt: attemptNo,
  });

  // Record attempt start
  await (supabase.from('job_attempts' as any).insert({
    job_id: job.id,
    attempt_no: attemptNo,
    started_at: new Date().toISOString(),
  } as any) as any);

  try {
    await handler(job);

    // Success
    await ((supabase.from('jobs' as any) as any)
      .update({
        status: 'succeeded',
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', job.id));

    await ((supabase.from('job_attempts' as any) as any)
      .update({
        finished_at: new Date().toISOString(),
        ok: true,
      } as any)
      .eq('job_id', job.id)
      .eq('attempt_no', attemptNo));

    logger.info('Job succeeded', { jobId: job.id });
  } catch (_error) {
    const errorObj = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    logger.error('Job failed', error as Error, { jobId: job.id, attempt: attemptNo });

    // Record attempt failure
    await ((supabase.from('job_attempts' as any) as any)
      .update({
        finished_at: new Date().toISOString(),
        ok: false,
        error: errorObj,
      } as any)
      .eq('job_id', job.id)
      .eq('attempt_no', attemptNo));

    // Check if should retry
    if (shouldRetry(attemptNo, job.max_attempts)) {
      await scheduleRetry(job, errorObj);
    } else {
      await deadLetter(job, errorObj);
    }
  }
}

/**
 * Schedule retry with backoff
 */
export async function scheduleRetry(
  job: Job,
  error: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  const logger = createLogger({ jobId: job.id });

  const nextAttempt = job.attempts + 1;
  const availableAt = getNextAvailableAt(nextAttempt);

  logger.info('Scheduling retry', {
    jobId: job.id,
    attempt: nextAttempt,
    availableAt: availableAt.toISOString(),
  });

  await ((supabase.from('jobs' as any) as any)
    .update({
      status: 'queued',
      attempts: nextAttempt,
      available_at: availableAt.toISOString(),
      last_error: error,
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', job.id));
}

/**
 * Move job to dead letter queue
 */
export async function deadLetter(
  job: Job,
  error: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  const logger = createLogger({ jobId: job.id });

  logger.error('Moving job to dead letter queue', undefined, { jobId: job.id });

  // Create dead letter entry
  await (supabase.from('dead_letters' as any).insert({
    job_id: job.id,
    workspace_id: job.workspace_id,
    type: job.type,
    payload: job.payload,
    error,
  } as any) as any);

  // Update job status
  await ((supabase.from('jobs' as any) as any)
    .update({
      status: 'dead',
      locked_at: null,
      locked_by: null,
      last_error: error,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', job.id));
}

/**
 * Process a batch of jobs
 */
export async function processJobs(
  handler: JobHandler,
  maxJobs: number = 10
): Promise<number> {
  let processed = 0;

  for (let i = 0; i < maxJobs; i++) {
    const job = await claimNextJob();
    if (!job) {
      break;
    }

    await executeJob(job, handler);
    processed++;
  }

  return processed;
}
