/**
 * Dashboard Hooks
 * 
 * React Query hooks for dashboard data.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/data/queryKeys';
import { getDashboardMetrics, getExternalMetricsData } from '@/lib/data/dashboard';
import type { DashboardMetrics } from '@/lib/data/dashboard';

/**
 * Hook to fetch dashboard metrics
 */
export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: getDashboardMetrics,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch external metrics (GitHub, NPM)
 */
export function useExternalMetrics() {
  return useQuery({
    queryKey: queryKeys.dashboard.externalMetrics(),
    queryFn: getExternalMetricsData,
    staleTime: 5 * 60 * 1000, // 5 minutes (external data changes less frequently)
  });
}
