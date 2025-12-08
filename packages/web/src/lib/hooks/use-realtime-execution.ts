/**
 * Realtime Execution Hook
 * 
 * Custom hook for managing real-time execution updates via EventSource.
 * This is a special case that doesn't use React Query since it's a stream.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ExecutionUpdate {
  type: string;
  executionId?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  summary?: {
    total_source_records?: number;
    total_target_records?: number;
    matched_count?: number;
    unmatched_source_count?: number;
    unmatched_target_count?: number;
    errors_count?: number;
    accuracy_percentage?: number;
  };
}

export interface UseRealtimeExecutionOptions {
  jobId: string;
  apiKey: string;
  enabled?: boolean;
  onUpdate?: (update: ExecutionUpdate) => void;
  onError?: (error: Error) => void;
}

export interface UseRealtimeExecutionResult {
  connected: boolean;
  execution: ExecutionUpdate | null;
  logs: string[];
  errors: string[];
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Hook for real-time execution updates via EventSource
 */
export function useRealtimeExecution({
  jobId,
  apiKey,
  enabled = true,
  onUpdate,
  onError,
}: UseRealtimeExecutionOptions): UseRealtimeExecutionResult {
  const [connected, setConnected] = useState(false);
  const [execution, setExecution] = useState<ExecutionUpdate | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev.slice(-99), `${new Date().toISOString()}: ${message}`]);
  }, []);

  const addError = useCallback((error: string) => {
    setErrors((prev) => [...prev.slice(-49), `${new Date().toISOString()}: ${error}`]);
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!jobId || !apiKey || !enabled) {
      return;
    }

    // Clean up existing connection
    disconnect();

    const url = `/api/v1/realtime/reconciliations/${jobId}?token=${encodeURIComponent(apiKey)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      addLog('Connected to real-time updates');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ExecutionUpdate = JSON.parse(event.data);

        if (data.type === 'connected') {
          addLog('Connection established');
        } else if (data.type === 'execution_update') {
          setExecution(data);
          addLog(`Status update: ${data.status}`);
          onUpdate?.(data);

          if (data.error) {
            addError(data.error);
          }

          if (data.status === 'completed' || data.status === 'failed') {
            disconnect();
            addLog('Reconciliation finished. Connection closed.');
          }
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
        addError('Failed to parse update message');
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setConnected(false);
      addLog('Connection error. Attempting to reconnect...');
      onError?.(error instanceof Error ? error : new Error('SSE connection error'));

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [jobId, apiKey, enabled, addLog, addError, onUpdate, onError, disconnect]);

  useEffect(() => {
    if (enabled && jobId && apiKey) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, jobId, apiKey, connect, disconnect]);

  return {
    connected,
    execution,
    logs,
    errors,
    reconnect: connect,
    disconnect,
  };
}
