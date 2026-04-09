/**
 * Request Size Limit Middleware
 *
 * Enforces request size limits on API routes.
 * Prevents DoS attacks via large request bodies.
 */

import { NextRequest, NextResponse } from "next/server";

export interface RequestSizeLimitConfig {
  maxSizeBytes: number;
  errorMessage?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Check request size and return error if exceeded
 */
export function checkRequestSize(
  request: NextRequest,
  maxSizeBytes = DEFAULT_MAX_SIZE
): NextResponse | null {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: `Request body too large. Maximum size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
          maxSizeBytes,
          receivedSizeBytes: size,
        },
        { status: 413 }
      );
    }
  }

  return null; // Size OK or unknown (will be checked when reading body)
}

/**
 * Request size limit middleware factory
 */
export function requestSizeLimit(
  config: RequestSizeLimitConfig
): (req: NextRequest) => NextResponse | null {
  return (req: NextRequest) => {
    return checkRequestSize(req, config.maxSizeBytes);
  };
}

/**
 * Pre-configured request size limits
 */
export const requestSizeLimits = {
  webhook: requestSizeLimit({
    maxSizeBytes: 500 * 1024, // 500KB for webhooks
    errorMessage: "Webhook payload too large",
  }),
  api: requestSizeLimit({
    maxSizeBytes: 10 * 1024 * 1024, // 10MB for API
    errorMessage: "Request body too large",
  }),
  upload: requestSizeLimit({
    maxSizeBytes: 50 * 1024 * 1024, // 50MB for uploads
    errorMessage: "File too large",
  }),
};
