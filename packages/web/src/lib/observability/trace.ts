import { v4 as uuidv4 } from "uuid";

let requestIdCounter = 0;

/**
 * Generate a unique request ID for correlation across services
 * Format: settler-req-{timestamp}-{counter}
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  requestIdCounter = (requestIdCounter + 1) % 10000;
  return `settler-req-${timestamp}-${requestIdCounter}`;
}

/**
 * Get the current request ID from headers or generate a new one
 */
export function getRequestId(request?: Request): string {
  if (request) {
    const header = request.headers.get("x-request-id") || request.headers.get("x-trace-id");
    if (header) return header;
  }
  return generateTraceId();
}

/**
 * Middleware wrapper to ensure request ID is on every response
 */
export function addTraceHeaders(
  response: Response,
  options: {
    generateIfMissing?: boolean;
  }
): Response {
  const id = options.generateIfMissing
    ? generateTraceId()
    : response.headers.get("x-request-id") || generateTraceId();
  response.headers.set("x-request-id", id);
  response.headers.set("x-correlation-id", id);
  return response;
}
