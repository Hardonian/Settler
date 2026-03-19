import { trackApiMetric, trackMetric } from "@/lib/monitoring/metrics";
import { appLogger } from "@/lib/utils/logger";

export interface UsageEndpointMetricsInput {
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  queryRows?: number;
  payloadBytes?: number;
  mode?: "sync" | "async" | "status" | "download";
  format?: "csv" | "json";
}

function getStatusClass(statusCode: number): string {
  if (statusCode >= 500) {
    return "5xx";
  }

  if (statusCode >= 400) {
    return "4xx";
  }

  if (statusCode >= 300) {
    return "3xx";
  }

  return "2xx";
}

function safeTagValue(value: string | number | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return String(value).slice(0, 64);
}

export async function recordUsageEndpointMetrics(input: UsageEndpointMetricsInput): Promise<void> {
  const statusClass = getStatusClass(input.statusCode);
  const tags = {
    endpoint: safeTagValue(input.endpoint) ?? "unknown",
    method: safeTagValue(input.method) ?? "GET",
    status_class: statusClass,
    mode: safeTagValue(input.mode) ?? "sync",
    ...(input.format ? { format: safeTagValue(input.format) } : {}),
  };

  try {
    await Promise.all([
      trackApiMetric(input.endpoint, input.method, input.statusCode, input.latencyMs),
      trackMetric({
        name: "usage.api.latency_ms",
        value: input.latencyMs,
        tags,
      }),
      trackMetric({
        name: "usage.api.request",
        value: 1,
        tags,
      }),
      ...(typeof input.queryRows === "number"
        ? [
            trackMetric({
              name: "usage.api.query_rows",
              value: input.queryRows,
              tags,
            }),
          ]
        : []),
      ...(typeof input.payloadBytes === "number"
        ? [
            trackMetric({
              name: "usage.api.payload_bytes",
              value: input.payloadBytes,
              tags,
            }),
          ]
        : []),
    ]);
  } catch (error) {
    appLogger.warn("[Usage Observability] Failed to record endpoint metrics", {
      endpoint: input.endpoint,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export interface UsageExportJobMetricInput {
  status: "processing" | "completed" | "failed";
  format: "csv" | "json";
  rowCount: number;
  durationMs: number;
  batchCount: number;
  bytesWritten: number;
}

export async function recordUsageExportJobMetrics(input: UsageExportJobMetricInput): Promise<void> {
  const tags = {
    status: input.status,
    format: input.format,
  };

  try {
    await Promise.all([
      trackMetric({
        name: "usage.export.duration_ms",
        value: input.durationMs,
        tags,
      }),
      trackMetric({
        name: "usage.export.row_count",
        value: input.rowCount,
        tags,
      }),
      trackMetric({
        name: "usage.export.batch_count",
        value: input.batchCount,
        tags,
      }),
      trackMetric({
        name: "usage.export.bytes",
        value: input.bytesWritten,
        tags,
      }),
      trackMetric({
        name: "usage.export.jobs",
        value: 1,
        tags,
      }),
    ]);
  } catch (error) {
    appLogger.warn("[Usage Observability] Failed to record export job metrics", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function estimateJsonPayloadBytes(payload: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(payload), "utf8");
  } catch {
    return 0;
  }
}

export function estimateTextPayloadBytes(payload: string): number {
  return Buffer.byteLength(payload, "utf8");
}
