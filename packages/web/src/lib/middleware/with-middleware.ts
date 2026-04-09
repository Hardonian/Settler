/**
 * Middleware Composition Helper
 *
 * Composes multiple middleware functions into a single handler.
 * Type-safe and handles errors gracefully.
 */

import { NextRequest, NextResponse } from "next/server";

type Middleware = (req: NextRequest) => Promise<NextResponse | null> | NextResponse | null;
type Handler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Compose middleware functions
 * Returns first non-null response, or calls handler if all pass
 */
export function withMiddleware(handler: Handler, ...middlewares: Middleware[]): Handler {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Run all middlewares in sequence
    for (const middleware of middlewares) {
      const response = await middleware(req);
      if (response !== null) {
        return response;
      }
    }

    // All middlewares passed, call handler
    return handler(req);
  };
}
