/**
 * Job Idempotency Utilities
 * 
 * Ensures jobs are idempotent and retry-safe.
 */

import { Job } from './worker';

/**
 * Check if a job with the same idempotency key already exists
 */
export async function checkJobIdempotency(
  _idempotencyKey: string,
  _workspaceId: string
): Promise<{ exists: boolean; jobId?: string }> {
  try {
    // Check in jobs table (if it exists in Supabase)
    // For now, we'll use a simple check - in production this should query the actual jobs table
    // This is a placeholder - actual implementation depends on your jobs table schema
    return { exists: false };
  } catch (error) {
    console.error('[Job Idempotency] Error checking key:', error);
    // Fail open - allow job creation
    return { exists: false };
  }
}

/**
 * Ensure job execution is idempotent
 * 
 * This should be called at the start of job handlers to prevent duplicate execution.
 */
export async function ensureJobIdempotency(
  job: Job,
  operation: () => Promise<void>
): Promise<void> {
  // If job has idempotency key, check if already processed
  if (job.idempotency_key) {
    // Check idempotency key store
    const { checkIdempotencyKey } = await import('@/lib/idempotency/store');
    const check = await checkIdempotencyKey(job.idempotency_key);
    
    if (check.isDuplicate && check.existingResponse) {
      // Job already completed - skip
      return;
    }
  }

  // Execute operation
  await operation();
}

/**
 * Generate idempotency key for a job
 */
export function generateJobIdempotencyKey(
  workspaceId: string,
  jobType: string,
  payload: Record<string, unknown>
): string {
  const { generateIdempotencyKey } = require('@/lib/idempotency/key');
  return generateIdempotencyKey({
    tenantId: workspaceId,
    operation: `job:${jobType}`,
    payload,
    timeWindow: 60, // 60 minutes
  });
}
