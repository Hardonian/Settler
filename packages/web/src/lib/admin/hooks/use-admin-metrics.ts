/**
 * Admin Dashboard Hooks
 * 
 * React hooks for admin dashboard data fetching with TanStack Query.
 * Includes realtime SSE integration and fallback polling.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { MetricsSnapshot, StreamEvent, HealthDelta } from '../metrics/types';

const QUERY_KEY_METRICS = ['admin', 'metrics'] as const;
const QUERY_KEY_EXCEPTIONS = ['admin', 'exceptions'] as const;
const QUERY_KEY_RUNS = ['admin', 'runs'] as const;
const QUERY_KEY_AUDIT = ['admin', 'audit'] as const;

/**
 * Fetch metrics snapshot
 */
async function fetchMetrics(range: string = '24h', tenantId?: string): Promise<MetricsSnapshot> {
  const params = new URLSearchParams({ range });
  if (tenantId) params.set('tenantId', tenantId);
  
  const res = await fetch(`/api/admin/metrics?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch metrics: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch exceptions
 */
async function fetchExceptions(params: {
  status?: string;
  severity?: string;
  source?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.severity) searchParams.set('severity', params.severity);
  if (params.source) searchParams.set('source', params.source);
  if (params.tenantId) searchParams.set('tenantId', params.tenantId);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  
  const res = await fetch(`/api/admin/exceptions?${searchParams}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch exceptions: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch runs
 */
async function fetchRuns(params: {
  status?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.tenantId) searchParams.set('tenantId', params.tenantId);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  
  const res = await fetch(`/api/admin/runs?${searchParams}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch runs: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch audit trail
 */
async function fetchAudit(params: {
  ruleId?: string;
  source?: string;
  status?: string;
  actor?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.ruleId) searchParams.set('ruleId', params.ruleId);
  if (params.source) searchParams.set('source', params.source);
  if (params.status) searchParams.set('status', params.status);
  if (params.actor) searchParams.set('actor', params.actor);
  if (params.tenantId) searchParams.set('tenantId', params.tenantId);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  
  const res = await fetch(`/api/admin/audit?${searchParams}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch audit trail: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Hook for metrics snapshot
 */
export function useAdminMetrics(range: string = '24h', tenantId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY_METRICS, range, tenantId],
    queryFn: () => fetchMetrics(range, tenantId),
    staleTime: 30 * 1000, // 30s
    refetchInterval: 60 * 1000, // Fallback polling: 60s
  });
}

/**
 * Hook for exceptions
 */
export function useAdminExceptions(params: {
  status?: string;
  severity?: string;
  source?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY_EXCEPTIONS, params],
    queryFn: () => fetchExceptions(params),
    staleTime: 10 * 1000, // 10s
    refetchInterval: 30 * 1000, // Fallback polling: 30s
  });
}

/**
 * Hook for runs
 */
export function useAdminRuns(params: {
  status?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY_RUNS, params],
    queryFn: () => fetchRuns(params),
    staleTime: 10 * 1000, // 10s
    refetchInterval: 30 * 1000, // Fallback polling: 30s
  });
}

/**
 * Hook for audit trail
 */
export function useAdminAudit(params: {
  ruleId?: string;
  source?: string;
  status?: string;
  actor?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY_AUDIT, params],
    queryFn: () => fetchAudit(params),
    staleTime: 30 * 1000, // 30s
    refetchInterval: 60 * 1000, // Fallback polling: 60s
  });
}

/**
 * Connection state for SSE
 */
export type ConnectionState = 'connected' | 'reconnecting' | 'offline';

/**
 * Hook for SSE stream connection
 */
export function useAdminStream(
  channels: string[] = ['metrics', 'exceptions', 'runs', 'health'],
  tenantId?: string,
  enabled: boolean = true
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('offline');
  const [latency, setLatency] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1s, exponential backoff

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const params = new URLSearchParams({
        channels: channels.join(','),
      });
      if (tenantId) params.set('tenantId', tenantId);

      const eventSource = new EventSource(`/api/admin/stream?${params}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionState('connected');
        reconnectAttempts.current = 0;
      };

      eventSource.onerror = () => {
        setConnectionState('reconnecting');
        eventSource.close();

        // Exponential backoff reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current);
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionState('offline');
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StreamEvent;

          // Handle different event types
          switch (data.type) {
            case 'metrics_delta':
              // Invalidate metrics query to trigger refetch
              queryClient.invalidateQueries({ queryKey: QUERY_KEY_METRICS });
              break;
            case 'exceptions_delta':
              // Invalidate exceptions query
              queryClient.invalidateQueries({ queryKey: QUERY_KEY_EXCEPTIONS });
              break;
            case 'run_delta':
              // Invalidate runs query
              queryClient.invalidateQueries({ queryKey: QUERY_KEY_RUNS });
              break;
            case 'health':
              const health = data as HealthDelta;
              setConnectionState(health.status);
              setLatency(health.latency);
              break;
          }
        } catch (_error) {
          // Error parsing event - non-critical, continue processing
          if (process.env.NODE_ENV === 'development') {
             
            console.error('[Admin Stream] Error parsing event:', error);
          }
        }
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [channels.join(','), tenantId, enabled, queryClient]);

  return {
    connectionState,
    latency,
  };
}
