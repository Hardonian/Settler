/**
 * Trace ID / Correlation ID Utilities
 *
 * Provides trace_id propagation across web → API → logs
 * Generates trace_id on edge (web) if absent
 * Forwards to API via headers
 * Includes in all logs and error responses
 */

import { NextRequest } from "next/server";

const TRACE_ID_HEADER = "x-trace-id";
const TRACE_ID_COOKIE = "trace-id";

/**
 * Generate a new trace ID
 */
const toHex = (value: number): string => value.toString(16).padStart(2, "0");

const getRandomBytes = (size: number): Uint8Array => {
const getRandomBytes = (size: number): Uint8Array => {
  const c = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : undefined;

  if (c && "getRandomValues" in c) {
    const bytes = new Uint8Array(size);
    c.getRandomValues(bytes);
    return bytes;
  }

  if (c && "randomUUID" in c && typeof (c as Crypto).randomUUID === "function") {
    const hex = (c as Crypto).randomUUID().replace(/-/g, "");
    const bytes = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) {
      bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2) || "00", 16);
    }
    return bytes;
  }

  throw new Error("Secure random source unavailable for trace ID generation");
};

export function generateTraceId(): string {
  const bytes = getRandomBytes(16);
  return Array.from(bytes, (byte) => toHex(byte)).join("");
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
  // Use dynamic import to avoid bundling next/headers in client components
  // This prevents build errors when trace.ts is imported by client components
  try {
    // Only attempt to use headers() in server context (not in browser)
    if (typeof window === "undefined" && typeof process !== "undefined") {
      const { headers: getHeaders } = await import("next/headers");
      const headersList = await getHeaders();
      const headerTraceId = headersList.get(TRACE_ID_HEADER);
      if (headerTraceId) {
        return headerTraceId;
      }
    }
  } catch {
    // Not in server context or headers() unavailable, continue to generate new ID
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
export function addTraceIdToNextResponse(response: Response, traceId: string): Response {
  response.headers.set(TRACE_ID_HEADER, traceId);
  return response;
}

/**
 * Get trace ID from client-side (browser)
 */
export function getTraceIdFromClient(): string {
  if (typeof window === "undefined") {
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
