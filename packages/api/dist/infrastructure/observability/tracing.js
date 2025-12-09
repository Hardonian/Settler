"use strict";
/**
 * OpenTelemetry Distributed Tracing
 * Sets up distributed tracing for the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTracing = initializeTracing;
exports.shutdownTracing = shutdownTracing;
exports.traceFunction = traceFunction;
exports.traceDatabase = traceDatabase;
exports.traceCache = traceCache;
exports.traceQueue = traceQueue;
exports.traceBusiness = traceBusiness;
exports.getTraceId = getTraceId;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const api_1 = require("@opentelemetry/api");
const config_1 = require("../../config");
let sdk = null;
function initializeTracing() {
    if (sdk) {
        return; // Already initialized
    }
    const otlpEndpoint = config_1.config.observability.otlpEndpoint;
    if (!otlpEndpoint) {
        console.warn('OTLP_ENDPOINT not set, tracing disabled');
        return;
    }
    sdk = new sdk_node_1.NodeSDK({
        resource: new resources_1.Resource({
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: config_1.config.observability.serviceName,
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
        }),
        traceExporter: new exporter_trace_otlp_http_1.OTLPTraceExporter({
            url: `${otlpEndpoint}/v1/traces`,
        }),
        instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
    });
    sdk.start();
    console.log('OpenTelemetry tracing initialized');
}
function shutdownTracing() {
    if (sdk) {
        return sdk.shutdown();
    }
    return Promise.resolve();
}
/**
 * Create a span for a function execution
 */
async function traceFunction(name, fn, attributes) {
    const tracer = api_1.trace.getTracer('settler-api');
    const spanOptions = {};
    if (attributes) {
        spanOptions.attributes = attributes;
    }
    const span = tracer.startSpan(name, spanOptions);
    try {
        const result = await fn(span);
        span.setStatus({ code: api_1.SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span.end();
    }
}
/**
 * Create a database span
 */
async function traceDatabase(operation, query, fn, tenantId) {
    const tracer = api_1.trace.getTracer('settler-api');
    const span = tracer.startSpan(`db.${operation}`, {
        attributes: {
            'db.operation': operation,
            'db.statement': query.substring(0, 500), // Truncate long queries
            'tenant.id': tenantId || '',
        },
    });
    try {
        const result = await fn();
        span.setStatus({ code: api_1.SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Database error',
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span.end();
    }
}
/**
 * Create a cache span
 */
async function traceCache(operation, key, fn, tenantId) {
    const tracer = api_1.trace.getTracer('settler-api');
    const span = tracer.startSpan(`cache.${operation}`, {
        attributes: {
            'cache.operation': operation,
            'cache.key': key,
            'tenant.id': tenantId || '',
        },
    });
    try {
        const result = await fn();
        span.setStatus({ code: api_1.SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Cache error',
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span.end();
    }
}
/**
 * Create a queue span
 */
async function traceQueue(queueName, operation, fn, tenantId, jobId) {
    const tracer = api_1.trace.getTracer('settler-api');
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
        span.setStatus({ code: api_1.SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Queue error',
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span.end();
    }
}
/**
 * Create a business span (for domain-specific operations)
 */
async function traceBusiness(operation, fn, attributes, tenantId) {
    const tracer = api_1.trace.getTracer('settler-api');
    const span = tracer.startSpan(`business.${operation}`, {
        attributes: {
            ...attributes,
            'tenant.id': tenantId || '',
        },
    });
    try {
        const result = await fn(span);
        span.setStatus({ code: api_1.SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Business logic error',
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span.end();
    }
}
/**
 * Get the current trace ID
 */
function getTraceId() {
    const span = api_1.trace.getActiveSpan();
    return span?.spanContext().traceId;
}
//# sourceMappingURL=tracing.js.map