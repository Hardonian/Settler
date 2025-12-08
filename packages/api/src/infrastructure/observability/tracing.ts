/**
 * OpenTelemetry Distributed Tracing
 * Sets up distributed tracing for the application
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, Span, SpanStatusCode } from '@opentelemetry/api';
import { config } from '../../config';

let sdk: NodeSDK | null = null;

export function initializeTracing(): void {
  if (sdk) {
    return; // Already initialized
  }

  const otlpEndpoint = config.observability.otlpEndpoint;

  if (!otlpEndpoint) {
    console.warn('OTLP_ENDPOINT not set, tracing disabled');
    return;
  }

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.observability.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  console.log('OpenTelemetry tracing initialized');
}

export function shutdownTracing(): Promise<void> {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}

/**
 * Create a span for a function execution
 */
export async function traceFunction<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer('settler-api');
  const spanOptions: { attributes?: Record<string, string | number | boolean> } = {};
  if (attributes) {
    spanOptions.attributes = attributes;
  }
  const span = tracer.startSpan(name, spanOptions);

  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: unknown) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a database span
 */
export async function traceDatabase<T>(
  operation: string,
  query: string,
  fn: () => Promise<T>,
  tenantId?: string
): Promise<T> {
  const tracer = trace.getTracer('settler-api');
  const span = tracer.startSpan(`db.${operation}`, {
    attributes: {
      'db.operation': operation,
      'db.statement': query.substring(0, 500), // Truncate long queries
      'tenant.id': tenantId || '',
    },
  });

  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: unknown) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Database error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a cache span
 */
export async function traceCache<T>(
  operation: string,
  key: string,
  fn: () => Promise<T>,
  tenantId?: string
): Promise<T> {
  const tracer = trace.getTracer('settler-api');
  const span = tracer.startSpan(`cache.${operation}`, {
    attributes: {
      'cache.operation': operation,
      'cache.key': key,
      'tenant.id': tenantId || '',
    },
  });

  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: unknown) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Cache error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a queue span
 */
export async function traceQueue<T>(
  queueName: string,
  operation: string,
  fn: () => Promise<T>,
  tenantId?: string,
  jobId?: string
): Promise<T> {
  const tracer = trace.getTracer('settler-api');
  const span = tracer.startSpan(`queue.${queueName}.${operation}`, {
    attributes: {
      'queue.name': queueName,
      'queue.operation': operation,
      'tenant.id': tenantId || '',
      'job.id': jobId || '',
    },
  });

  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: unknown) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Queue error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a business span (for domain-specific operations)
 */
export async function traceBusiness<T>(
  operation: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
  tenantId?: string
): Promise<T> {
  const tracer = trace.getTracer('settler-api');
  const span = tracer.startSpan(`business.${operation}`, {
    attributes: {
      ...attributes,
      'tenant.id': tenantId || '',
    },
  });

  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: unknown) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Business logic error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Get the current trace ID
 */
export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}
