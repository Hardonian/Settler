/**
 * React Hook for Backpressure-Aware Reconciliation SSE Stream
 *
 * Connects to /api/v2/stream/runs/:runId/records, listens for progressive
 * record chunks, handles network backoff, and provides virtualized data-ready arrays.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface StreamReconciliationRecord {
  id: string;
  runId: string;
  lineIndex: number;
  sourceAmount: number;
  targetAmount: number;
  currency: string;
  status: "MATCHED" | "VARIANCE" | "UNMATCHED";
  timestamp: string;
  referenceId: string;
}

export interface StreamProgress {
  current: number;
  total: number;
  percentage: number;
}

export type StreamConnectionStatus =
  "idle" | "connecting" | "streaming" | "paused" | "completed" | "error";

export interface UseReconciliationStreamOptions {
  batchSize?: number;
  totalRecords?: number;
  autoStart?: boolean;
}

export interface UseReconciliationStreamResult {
  records: StreamReconciliationRecord[];
  status: StreamConnectionStatus;
  progress: StreamProgress;
  error: string | null;
  startStream: () => void;
  stopStream: () => void;
  resetStream: () => void;
}

export function useReconciliationStream(
  runId: string,
  options: UseReconciliationStreamOptions = {}
): UseReconciliationStreamResult {
  const { batchSize = 250, totalRecords = 2500, autoStart = false } = options;

  const [records, setRecords] = useState<StreamReconciliationRecord[]>([]);
  const [status, setStatus] = useState<StreamConnectionStatus>("idle");
  const [progress, setProgress] = useState<StreamProgress>({
    current: 0,
    total: totalRecords,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus((prev) => (prev === "streaming" ? "paused" : prev));
  }, []);

  const resetStream = useCallback(() => {
    stopStream();
    setRecords([]);
    setProgress({ current: 0, total: totalRecords, percentage: 0 });
    setStatus("idle");
    setError(null);
  }, [stopStream, totalRecords]);

  const startStream = useCallback(() => {
    if (!runId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("connecting");
    setError(null);

    const streamUrl = `/api/v2/stream/runs/${encodeURIComponent(runId)}/records?batchSize=${batchSize}&totalRecords=${totalRecords}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener("connected", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setStatus("streaming");
        if (data.totalRecords) {
          setProgress((prev) => ({ ...prev, total: data.totalRecords }));
        }
      } catch {
        setStatus("streaming");
      }
    });

    es.addEventListener("record_batch", (e: MessageEvent) => {
      try {
        const batchData = JSON.parse(e.data);
        if (Array.isArray(batchData.records)) {
          setRecords((prev) => [...prev, ...batchData.records]);
        }
        if (batchData.progress) {
          setProgress(batchData.progress);
        }
      } catch (err) {
        console.error("Failed to parse record_batch chunk", err);
      }
    });

    es.addEventListener("stream_complete", () => {
      setStatus("completed");
      es.close();
      eventSourceRef.current = null;
    });

    es.onerror = () => {
      // EventSource reconnects automatically on drop, but report error if closed
      if (es.readyState === EventSource.CLOSED) {
        setStatus("error");
        setError("SSE connection closed unexpectedly");
        es.close();
        eventSourceRef.current = null;
      }
    };
  }, [runId, batchSize, totalRecords]);

  useEffect(() => {
    if (autoStart) {
      startStream();
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [autoStart, startStream]);

  return {
    records,
    status,
    progress,
    error,
    startStream,
    stopStream,
    resetStream,
  };
}
