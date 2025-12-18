/**
 * Trace ID / Correlation ID Utilities
 * 
 * Provides trace_id propagation across web → API → logs
 * Generates trace_id on edge (web) if absent
 * Forwards to API via headers
 * Includes in all logs and error responses
 */

import { randomBytes } from 'crypto';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

const TRACE_ID_HEADER = 'x-trace-id';
const TRACE_ID_COOKIE = 'trace-id';

/**
 * Generate a new trace ID
 */
export function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Get trace ID from request headers or generate new one
 */
export async function getTraceId(request?: NextRequest | Request): Promise<string> {
  if (request) {
    // Check header first
    const headerTraceId = request.headers.get(TRACE_ID_HEADER);
    if (headerTraceId) {
      return headerTraceId;
    }

    // Check cookie
    if (request instanceof NextRequest) {
      const cookieTraceId = request.cookies.get(TRACE_ID_COOKIE)?.value;
      if (cookieTraceId) {
        return cookieTraceId;
      }
    }
  }

  // Try to get from Next.js headers (server-side)
  try {
    const headersList = await headers();
    const headerTraceId = headersList.get(TRACE_ID_HEADER);
    if (headerTraceId) {
      return headerTraceId;
    }
  } catch {
    // Not in server context, continue
  }

  // Generate new trace ID
  return generateTraceId();
}

/**
 * Add trace ID to response headers
 */
export function addTraceIdToResponse(response: Response, traceId: string): Response {
  response.headers.set(TRACE_ID_HEADER, traceId);
  return response;
}

/**
 * Add trace ID to NextResponse headers
 */
export function addTraceIdToNextResponse(
  response: Response,
  traceId: string
): Response {
  response.headers.set(TRACE_ID_HEADER, traceId);
  return response;
}

/**
 * Get trace ID from client-side (browser)
 */
export function getTraceIdFromClient(): string {
  if (typeof window === 'undefined') {
    return generateTraceId();
  }

  // Check localStorage first
  const stored = localStorage.getItem(TRACE_ID_COOKIE);
  if (stored) {
    return stored;
  }

  // Generate and store
  const traceId = generateTraceId();
  localStorage.setItem(TRACE_ID_COOKIE, traceId);
  return traceId;
}
