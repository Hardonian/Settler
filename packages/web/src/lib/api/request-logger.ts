/**
 * Request Logging Middleware
 *
 * Logs API requests for monitoring and debugging.
 * Respects privacy and doesn't log sensitive data.
 * Includes trace_id in all logs.
 */

import { getTraceId } from "@/lib/observability/trace";
import { logger, type LogContext } from "@/lib/observability/logger";

/**
 * Log API request (server-side only, no sensitive data)
 * Includes trace_id for correlation
 */
export async function logRequest(
  request: Request,
  response: Response,
  startTime: number
): Promise<void> {
  const duration = Date.now() - startTime;
  const url = new URL(request.url);

  // Get trace_id
  const traceId = await getTraceId(request);

  // Extract user ID from headers (if available)
  const userId = request.headers.get("x-user-id") || undefined;

  // Extract IP (respect privacy)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    undefined;

  // Extract user agent (sanitized)
  const userAgent = request.headers.get("user-agent") || undefined;

  const logContext: LogContext = {
    method: request.method,
    path: url.pathname,
    status: response.status,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
    trace_id: traceId,
    user_id: userId,
    user_agent: userAgent ? sanitizeUserAgent(userAgent) : undefined,
    ip_address: ip ? anonymizeIP(ip) : undefined,
  };

  // Use structured logger
  if (response.status >= 400) {
    await logger.error("API Request Error", logContext);
  } else if (duration > 1000) {
    await logger.warn("Slow API Request", logContext);
  } else if (process.env.NODE_ENV === "development") {
    await logger.info("API Request", logContext);
  }
}

function sanitizeUserAgent(ua: string): string {
  // Remove version numbers and keep only browser/OS info
  return ua.replace(/\d+\.\d+/g, "X.X").substring(0, 100); // Limit length
}

function anonymizeIP(ip: string): string {
  // Anonymize last octet for IPv4
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  // For IPv6, just return first segment
  if (ip.includes(":")) {
    return ip.split(":")[0] + ":xxxx:xxxx:xxxx";
  }
  return "xxx.xxx.xxx.xxx";
}

/**
 * Create request logger middleware
 */
export function withRequestLogging<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as Request;
    const startTime = Date.now();

    try {
      const response = await handler(...args);
      await logRequest(request, response, startTime);
      return response;
    } catch (error) {
      // Create error response for logging
      const errorResponse = new Response(JSON.stringify({ error: "Internal error" }), {
        status: 200,
      });
      await logRequest(request, errorResponse, startTime);
      throw error;
    }
  }) as T;
}
