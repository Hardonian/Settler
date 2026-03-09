import { randomUUID } from "crypto";

export interface TraceContext {
  traceId: string;
  executionId: string;
  tenantId?: string;
}

export function createTraceContext(tenantId?: string, executionId?: string): TraceContext {
  return {
    traceId: randomUUID(),
    executionId: executionId ?? randomUUID(),
    tenantId,
  };
}

export function withTraceHeaders(
  headers: Record<string, string>,
  context: TraceContext
): Record<string, string> {
  const merged: Record<string, string> = {
    ...headers,
    "X-Trace-Id": context.traceId,
    "X-Execution-Id": context.executionId,
  };

  if (context.tenantId) {
    merged["X-Tenant-Id"] = context.tenantId;
  }

  return merged;
}
