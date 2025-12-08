// Basic distributed tracing implementation
// For production, use OpenTelemetry SDK

import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
// Config import removed - not used in this file

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

const traceContexts = new Map<string, TraceContext>();

export function getTraceContext(req: AuthRequest): TraceContext {
  const traceId = req.traceId || uuidv4();
  const spanId = uuidv4();

  const context: TraceContext = {
    traceId,
    spanId,
  };

  traceContexts.set(spanId, context);
  return context;
}

export function getParentTraceContext(spanId: string): TraceContext | null {
  return traceContexts.get(spanId) || null;
}

export function createChildSpan(parentSpanId: string): TraceContext {
  const parent = traceContexts.get(parentSpanId);
  if (!parent) {
    throw new Error('Parent span not found');
  }

  const childSpan: TraceContext = {
    traceId: parent.traceId,
    spanId: uuidv4(),
    parentSpanId: parent.spanId,
  };

  traceContexts.set(childSpan.spanId, childSpan);
  return childSpan;
}

export function endSpan(spanId: string): void {
  traceContexts.delete(spanId);
}

// Helper to trace async operations
export async function trace<T>(
  name: string,
  operation: () => Promise<T>,
  context?: TraceContext
): Promise<T> {
  const spanId = context?.spanId || uuidv4();
  const traceId = context?.traceId || uuidv4();

  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    // Log trace (in production, send to tracing backend)
    console.log(JSON.stringify({
      traceId,
      spanId,
      name,
      duration,
      status: 'success',
      timestamp: new Date().toISOString(),
    }));

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.log(JSON.stringify({
      traceId,
      spanId,
      name,
      duration,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }));

    throw error;
  }
}

// For production: Use OpenTelemetry
/*
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: config.observability.jaegerEndpoint,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
*/
