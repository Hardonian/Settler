/**
 * Observability Middleware
 * Adds tracing, metrics, and logging to HTTP requests
 */

import { Request, Response, NextFunction } from "express";
import { trace, SpanStatusCode, context } from "@opentelemetry/api";
import {
  httpRequestDuration,
  httpRequestTotal,
  httpRequestErrors,
} from "../infrastructure/observability/metrics";
import { logPerformance } from "../utils/logger";
import { AuthRequest } from "./auth";

const tracer = trace.getTracer("settler-api");

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const method = req.method;
  const route = req.route?.path || req.path;
  const tenantId = (req as AuthRequest).tenantId || (req as AuthRequest).userId || "unknown";

  // Create span for this request
  const span = tracer.startSpan(`http.${method.toLowerCase()}`, {
    attributes: {
      "http.method": method,
      "http.route": route,
      "http.url": req.url,
      "tenant.id": tenantId,
    },
  });

  // Set span in context
  const ctx = trace.setSpan(context.active(), span);

  // Wrap response handlers
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);
  const originalEnd = res.end.bind(res);

  res.send = function (this: Response, body: unknown) {
    recordMetrics();
    return originalSend.call(this, body);
  };

  res.json = function (this: Response, body: unknown) {
    recordMetrics();
    return originalJson.call(this, body);
  };

  res.end = function (
    this: Response,
    chunk?: unknown,
    encoding?: BufferEncoding | (() => void),
    cb?: () => void
  ) {
    recordMetrics();
    if (typeof encoding === "function") {
      // encoding is actually a callback function (two-arg overload: end(chunk, cb))
      originalEnd(chunk, encoding);
    } else if (encoding !== undefined && typeof encoding === "string") {
      // encoding is a BufferEncoding string (three-arg overload: end(chunk, encoding, cb))
      originalEnd(chunk, encoding, cb);
    } else if (cb !== undefined) {
      // cb is provided but encoding is not (two-arg overload: end(chunk, cb))
      originalEnd(chunk, cb);
    } else {
      // Only chunk provided (one-arg overload: end(chunk))
      originalEnd(chunk);
    }
  } as typeof originalEnd;

  function recordMetrics() {
    const duration = (Date.now() - startTime) / 1000;
    const statusCode = res.statusCode;

    // Update span
    span.setAttribute("http.status_code", statusCode);
    span.setAttribute("http.response_size", res.get("content-length") || 0);

    if (statusCode >= 400) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `HTTP ${statusCode}`,
      });
      span.recordException(new Error(`HTTP ${statusCode}: ${method} ${route}`));

      // Record error metrics
      httpRequestErrors.inc({
        method,
        route,
        error_type: statusCode >= 500 ? "server_error" : "client_error",
        tenant_id: tenantId,
      });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }

    // Record metrics
    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode.toString(),
        tenant_id: tenantId,
      },
      duration
    );

    httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      tenant_id: tenantId,
    });

    // Log performance for slow requests (> 200ms)
    if (duration > 0.2) {
      logPerformance(`${method} ${route}`, duration * 1000, {
        tenant_id: tenantId,
        status_code: statusCode,
      });
    }

    // End span
    span.end();
  }

  // Handle errors
  res.on("finish", () => {
    if (!res.headersSent) {
      recordMetrics();
    }
  });

  // Continue with next middleware
  context.with(ctx, () => {
    next();
  });
}
