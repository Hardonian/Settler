"use strict";
/**
 * Observability Middleware
 * Adds tracing, metrics, and logging to HTTP requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.observabilityMiddleware = observabilityMiddleware;
const api_1 = require("@opentelemetry/api");
const metrics_1 = require("../infrastructure/observability/metrics");
const logger_1 = require("../utils/logger");
const tracer = api_1.trace.getTracer('settler-api');
function observabilityMiddleware(req, res, next) {
    const startTime = Date.now();
    const method = req.method;
    const route = req.route?.path || req.path;
    const tenantId = req.tenantId || req.userId || 'unknown';
    // Create span for this request
    const span = tracer.startSpan(`http.${method.toLowerCase()}`, {
        attributes: {
            'http.method': method,
            'http.route': route,
            'http.url': req.url,
            'tenant.id': tenantId,
        },
    });
    // Set span in context
    const ctx = api_1.trace.setSpan(api_1.context.active(), span);
    // Wrap response handlers
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);
    const originalEnd = res.end.bind(res);
    res.send = function (body) {
        recordMetrics();
        return originalSend.call(this, body);
    };
    res.json = function (body) {
        recordMetrics();
        return originalJson.call(this, body);
    };
    res.end = function (chunk, encoding, cb) {
        recordMetrics();
        if (typeof encoding === 'function') {
            // encoding is actually a callback function (two-arg overload: end(chunk, cb))
            originalEnd(chunk, encoding);
        }
        else if (encoding !== undefined && typeof encoding === 'string') {
            // encoding is a BufferEncoding string (three-arg overload: end(chunk, encoding, cb))
            originalEnd(chunk, encoding, cb);
        }
        else if (cb !== undefined) {
            // cb is provided but encoding is not (two-arg overload: end(chunk, cb))
            originalEnd(chunk, cb);
        }
        else {
            // Only chunk provided (one-arg overload: end(chunk))
            originalEnd(chunk);
        }
    };
    function recordMetrics() {
        const duration = (Date.now() - startTime) / 1000;
        const statusCode = res.statusCode;
        // Update span
        span.setAttribute('http.status_code', statusCode);
        span.setAttribute('http.response_size', res.get('content-length') || 0);
        if (statusCode >= 400) {
            span.setStatus({
                code: api_1.SpanStatusCode.ERROR,
                message: `HTTP ${statusCode}`,
            });
            span.recordException(new Error(`HTTP ${statusCode}: ${method} ${route}`));
            // Record error metrics
            metrics_1.httpRequestErrors.inc({
                method,
                route,
                error_type: statusCode >= 500 ? 'server_error' : 'client_error',
                tenant_id: tenantId,
            });
        }
        else {
            span.setStatus({ code: api_1.SpanStatusCode.OK });
        }
        // Record metrics
        metrics_1.httpRequestDuration.observe({
            method,
            route,
            status_code: statusCode.toString(),
            tenant_id: tenantId,
        }, duration);
        metrics_1.httpRequestTotal.inc({
            method,
            route,
            status_code: statusCode.toString(),
            tenant_id: tenantId,
        });
        // Log performance for slow requests (> 200ms)
        if (duration > 0.2) {
            (0, logger_1.logPerformance)(`${method} ${route}`, duration * 1000, {
                tenant_id: tenantId,
                status_code: statusCode,
            });
        }
        // End span
        span.end();
    }
    // Handle errors
    res.on('finish', () => {
        if (!res.headersSent) {
            recordMetrics();
        }
    });
    // Continue with next middleware
    api_1.context.with(ctx, () => {
        next();
    });
}
//# sourceMappingURL=observability.js.map