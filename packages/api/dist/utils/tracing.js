"use strict";
// Basic distributed tracing implementation
// For production, use OpenTelemetry SDK
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraceContext = getTraceContext;
exports.getParentTraceContext = getParentTraceContext;
exports.createChildSpan = createChildSpan;
exports.endSpan = endSpan;
exports.trace = trace;
const uuid_1 = require("uuid");
const traceContexts = new Map();
function getTraceContext(req) {
    const traceId = req.traceId || (0, uuid_1.v4)();
    const spanId = (0, uuid_1.v4)();
    const context = {
        traceId,
        spanId,
    };
    traceContexts.set(spanId, context);
    return context;
}
function getParentTraceContext(spanId) {
    return traceContexts.get(spanId) || null;
}
function createChildSpan(parentSpanId) {
    const parent = traceContexts.get(parentSpanId);
    if (!parent) {
        throw new Error('Parent span not found');
    }
    const childSpan = {
        traceId: parent.traceId,
        spanId: (0, uuid_1.v4)(),
        parentSpanId: parent.spanId,
    };
    traceContexts.set(childSpan.spanId, childSpan);
    return childSpan;
}
function endSpan(spanId) {
    traceContexts.delete(spanId);
}
// Helper to trace async operations
async function trace(name, operation, context) {
    const spanId = context?.spanId || (0, uuid_1.v4)();
    const traceId = context?.traceId || (0, uuid_1.v4)();
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
    }
    catch (error) {
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
//# sourceMappingURL=tracing.js.map