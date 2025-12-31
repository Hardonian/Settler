"use strict";
/**
 * OpenTelemetry Distributed Tracing
 * Sets up distributed tracing for the application
 *
 * Note: OpenTelemetry packages are optional dependencies.
 * If not installed, tracing functions will be no-ops.
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
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const config_1 = require("../../config");
// Optional OpenTelemetry imports - gracefully handle if packages aren't installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let NodeSDK;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getNodeAutoInstrumentations;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Resource;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SemanticResourceAttributes;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let OTLPTraceExporter;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let trace;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SpanStatusCode;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const sdkNode = require("@opentelemetry/sdk-node");
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const autoInstrumentations = require("@opentelemetry/auto-instrumentations-node");
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const resources = require("@opentelemetry/resources");
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const semanticConventions = require("@opentelemetry/semantic-conventions");
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const traceExporter = require("@opentelemetry/exporter-trace-otlp-http");
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const api = require("@opentelemetry/api");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    NodeSDK = sdkNode.NodeSDK;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    getNodeAutoInstrumentations = autoInstrumentations.getNodeAutoInstrumentations;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    Resource = resources.Resource;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    SemanticResourceAttributes = semanticConventions.SemanticResourceAttributes;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    OTLPTraceExporter = traceExporter.OTLPTraceExporter;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    trace = api.trace;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    SpanStatusCode = api.SpanStatusCode;
}
catch (error) {
    // OpenTelemetry packages not installed - tracing will be disabled
    console.warn("OpenTelemetry packages not found, tracing disabled");
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sdk = null;
function initializeTracing() {
    if (sdk) {
        return; // Already initialized
    }
    // Check if OpenTelemetry packages are available
    if (!NodeSDK || !Resource || !SemanticResourceAttributes) {
        console.warn("OpenTelemetry packages not installed, tracing disabled");
        return;
    }
    const otlpEndpoint = config_1.config.observability.otlpEndpoint;
    if (!otlpEndpoint) {
        console.warn("OTLP_ENDPOINT not set, tracing disabled");
        return;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        sdk = new NodeSDK({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            resource: new Resource({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                [SemanticResourceAttributes.SERVICE_NAME]: config_1.config.observability.serviceName,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
            }),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            traceExporter: new OTLPTraceExporter({
                url: `${otlpEndpoint}/v1/traces`,
            }),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            instrumentations: [getNodeAutoInstrumentations()],
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        sdk.start();
        console.log("OpenTelemetry tracing initialized");
    }
    catch (error) {
        console.warn("Failed to initialize OpenTelemetry tracing:", error);
    }
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
async function traceFunction(name, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
fn, attributes) {
    // If tracing is not available, just execute the function
    if (!trace || !SpanStatusCode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        return fn(null);
    }
    const tracer = trace.getTracer("settler-api");
    const spanOptions = {};
    if (attributes) {
        spanOptions.attributes = attributes;
    }
    const span = tracer.startSpan(name, spanOptions);
    try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : "Unknown error",
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
    // If tracing is not available, just execute the function
    if (!trace || !SpanStatusCode) {
        return fn();
    }
    const tracer = trace.getTracer("settler-api");
    const span = tracer.startSpan(`db.${operation}`, {
        attributes: {
            "db.operation": operation,
            "db.statement": query.substring(0, 500), // Truncate long queries
            "tenant.id": tenantId || "",
        },
    });
    try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : "Database error",
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
    // If tracing is not available, just execute the function
    if (!trace || !SpanStatusCode) {
        return fn();
    }
    const tracer = trace.getTracer("settler-api");
    const span = tracer.startSpan(`cache.${operation}`, {
        attributes: {
            "cache.operation": operation,
            "cache.key": key,
            "tenant.id": tenantId || "",
        },
    });
    try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : "Cache error",
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
    // If tracing is not available, just execute the function
    if (!trace || !SpanStatusCode) {
        return fn();
    }
    const tracer = trace.getTracer("settler-api");
    const span = tracer.startSpan(`queue.${queueName}.${operation}`, {
        attributes: {
            "queue.name": queueName,
            "queue.operation": operation,
            "tenant.id": tenantId || "",
            "job.id": jobId || "",
        },
    });
    try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : "Queue error",
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
async function traceBusiness(operation, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
fn, attributes, tenantId) {
    // If tracing is not available, just execute the function
    if (!trace || !SpanStatusCode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        return fn(null);
    }
    const tracer = trace.getTracer("settler-api");
    const span = tracer.startSpan(`business.${operation}`, {
        attributes: {
            ...attributes,
            "tenant.id": tenantId || "",
        },
    });
    try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : "Business logic error",
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
    if (!trace) {
        return undefined;
    }
    const span = trace.getActiveSpan();
    return span?.spanContext().traceId;
}
//# sourceMappingURL=tracing.js.map