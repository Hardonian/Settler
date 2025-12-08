/**
 * Jobs Data Access
 * 
 * Centralized functions for fetching reconciliation job data.
 */

import { createClient } from '@/lib/supabase/server';
import { SettlerClient } from '@settler/sdk';

export interface Job {
  id: string;
  name: string;
  source: unknown;
  createdAt?: string;
}

/**
 * Fetch jobs using Settler SDK
 */
export async function getJobs(apiKey: string, options?: { limit?: number }) {
  const client = new SettlerClient({ apiKey });
  const response = await client.jobs.list({ limit: options?.limit || 10 });
  return response.data || [];
}

/**
 * Fetch job execution status (for real-time dashboard)
 * This is handled via EventSource in the component, but we can add
 * a REST endpoint wrapper here if needed.
 */
export async function getJobExecution(jobId: string, apiKey: string) {
  // This would typically call an API endpoint
  // For now, real-time updates are handled via EventSource
  throw new Error('Use EventSource for real-time job execution updates');
}
