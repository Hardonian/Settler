/**
 * Jobs Hooks
 * 
 * React Query hooks for reconciliation jobs.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/data/queryKeys';
import { getJobs } from '@/lib/data/jobs';
import type { Job } from '@/lib/data/jobs';

export interface UseJobsOptions {
  apiKey: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch reconciliation jobs
 */
export function useJobs({ apiKey, limit = 10, enabled = true }: UseJobsOptions) {
  return useQuery<Job[]>({
    queryKey: queryKeys.jobs.list({ limit }),
    queryFn: () => getJobs(apiKey, { limit }),
    enabled: enabled && !!apiKey,
    staleTime: 10 * 1000, // 10 seconds (jobs update frequently)
  });
}
