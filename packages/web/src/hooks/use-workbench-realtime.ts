"use client";

import { useEffect, useState, useCallback } from "react";

export interface WorkbenchStats {
  open_exceptions: number;
  high_severity_exceptions: number;
  active_runs: number;
  last_run_timestamp: string | null;
}

export interface ActiveRun {
  id: string;
  recon_job_id: string;
  status: string;
  matched_count: number;
  unmatched_source_count: number;
  unmatched_target_count: number;
  progress: number;
}

interface WorkbenchData {
  stats: WorkbenchStats;
  activeRuns: ActiveRun[];
}

export function useWorkbenchRealtime() {
  const [data, setData] = useState<WorkbenchData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    const eventSource = new EventSource("/api/realtime/workbench", {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "workbench_update") {
          setData({
            stats: payload.stats,
            activeRuns: payload.activeRuns,
          });
        }
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection Error", err);
      setIsConnected(false);
      setError("Disconnected from live updates. Retrying...");
      eventSource.close();

      // Attempt reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    return eventSource;
  }, []);

  useEffect(() => {
    const es = connect();
    return () => {
      es.close();
    };
  }, [connect]);

  return { data, isConnected, error };
}
