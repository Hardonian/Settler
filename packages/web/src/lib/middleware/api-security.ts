/**
 * API Security Middleware
 *
 * Comprehensive security middleware for API routes.
 * Includes rate limiting, authenticated mutation protections, and privileged mutation controls.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { withRateLimit } from "@/lib/api/rate-limit";
import { appLogger } from "@/lib/utils/logger";
import { authenticateRequest } from "@/lib/api/unified-auth";

export interface SecurityOptions {
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };
  requireAuth?: boolean;
  requirePrivilegedApproval?: boolean;
}

function isPrivilegedMutation(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  const isMutation =
    method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  return isMutation && request.nextUrl.pathname.startsWith("/api/admin");
}

function isMutationMethod(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function isSameOrigin(originOrReferer: string, requestOrigin: string): boolean {
  try {
    const origin = new URL(originOrReferer).origin;
    return origin === requestOrigin;
  } catch {
    return false;
  }
}

function validateMutationOrigin(request: NextRequest): NextResponse | null {
  if (!isMutationMethod(request)) {
    return null;
  }

  // API-key based callers are not browser-cookie authenticated and do not require origin checks.
  if (
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.startsWith("Bearer rk_")
  ) {
    return null;
  }

  const requestOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");

  // Settler's browser mutation trust model is same-origin only.
  // sibling same-site origins (for example app.example.com -> api.example.com) are not trusted.
  if (secFetchSite && !["same-origin", "none"].includes(secFetchSite)) {
    return NextResponse.json(
      {
        code: "INVALID_FETCH_SITE",
        message: "Cross-site mutation rejected.",
      },
      { status: 403 }
    );
  }

  if (!origin && !referer) {
    return NextResponse.json(
      {
        code: "MISSING_ORIGIN_CONTEXT",
        message: "Mutation requests must include an origin or referer header.",
      },
      { status: 403 }
    );
  }

  if (origin && !isSameOrigin(origin, requestOrigin)) {
    return NextResponse.json(
      {
        code: "INVALID_ORIGIN",
        message: "Cross-origin mutation rejected.",
      },
      { status: 403 }
    );
  }

  if (!origin && referer && !isSameOrigin(referer, requestOrigin)) {
    return NextResponse.json(
      {
        code: "INVALID_REFERER",
        message: "Cross-origin mutation rejected.",
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Security middleware wrapper for API routes
 * Supports both handlers with and without params (Next.js 15+ pattern)
 */
export function withSecurity<
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
>(handler: T, options: SecurityOptions = {}): T {
  const {
    rateLimit = { maxRequests: 60, windowMs: 60 * 1000 },
    requirePrivilegedApproval,
    requireAuth,
  } = options;

  const securedHandler = withRateLimit(
    async (request: NextRequest, ...args: any[]) => {
      const originViolation = validateMutationOrigin(request);
      if (originViolation) {
        return originViolation;
      }

      const authRequired = requireAuth ?? isMutationMethod(request);

      if (authRequired) {
        const auth = await authenticateRequest(request);
        if (!auth) {
          return NextResponse.json(
            {
              code: "UNAUTHORIZED",
              message: "Authentication required.",
            },
            { status: 401 }
          );
        }
      }

      const privilegedApprovalRequired = requirePrivilegedApproval ?? isPrivilegedMutation(request);
      if (privilegedApprovalRequired) {
        const operatorId = request.headers.get("x-operator-id");
        const breakGlassTicket = request.headers.get("x-breakglass-ticket");
        const traceId = `priv-${Date.now()}`;

        if (!operatorId || !breakGlassTicket) {
          return NextResponse.json(
            {
              code: "PRIVILEGED_APPROVAL_REQUIRED",
              message: "Privileged mutations require operator approval headers.",
              traceId,
              retryable: false,
            },
            { status: 403 }
          );
        }

        const sessionRecordId = createHash("sha256")
          .update(`${operatorId}|${breakGlassTicket}|${request.nextUrl.pathname}|${Date.now()}`)
          .digest("hex");

        appLogger.info("Privileged mutation approved", {
          operatorId,
          breakGlassTicket,
          path: request.nextUrl.pathname,
          method: request.method.toUpperCase(),
          sessionRecordId,
          traceId,
        });

        const response = await handler(request, ...args);
        response.headers.set("X-Privileged-Trace-Id", traceId);
        response.headers.set("X-Privileged-Session-Record-Id", sessionRecordId);
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        return response;
      }

      const response = await handler(request, ...args);
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return response;
    },
    {
      maxRequests: rateLimit.maxRequests,
      windowMs: rateLimit.windowMs,
    }
  );

  return securedHandler as T;
}
