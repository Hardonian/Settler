/**
 * API Call Logs API Route
 *
 * GET - Retrieve API call logs for current tenant (or all tenants if super admin)
 *
 * Features:
 * - Rate limiting
 * - Response caching
 * - Request validation
 * - Automatic API logging (excluded from self-logging)
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiCallLogs, getApiCallStats } from "@/domain/console/api-logs";
import { requireConsoleApiAccess } from "@/lib/api/console-auth";
import { withRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/security/rate-limiter";
import { withCache, CACHE_CONFIGS } from "@/lib/cache/api-cache";
import { validatePagination } from "@/lib/security/request-validator";
import { withApiLogging } from "@/middleware/api-logger";
import { appLogger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  // Require console access (auth + subscription)
  const accessCheck = await requireConsoleApiAccess(request);
  if (accessCheck) {
    return accessCheck;
  }

  const { searchParams } = new URL(request.url);

  // Validate pagination
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  const pagination = validatePagination({
    ...(limit ? { limit } : {}),
    ...(offset ? { offset } : {}),
  });

  if (pagination.errors) {
    return NextResponse.json(
      { error: "Invalid pagination parameters", errors: pagination.errors },
      { status: 400 }
    );
  }

  // Parse filters
  const tenantId = searchParams.get("tenantId") || undefined;
  const userId = searchParams.get("userId") || undefined;
  const method = searchParams.get("method") || undefined;
  const path = searchParams.get("path") || undefined;
  const statusCodeParam = searchParams.get("statusCode");
  const statusCode = statusCodeParam ? parseInt(statusCodeParam, 10) : undefined;
  const startDateParam = searchParams.get("startDate");
  const startDate = startDateParam ? new Date(startDateParam) : undefined;
  const endDateParam = searchParams.get("endDate");
  const endDate = endDateParam ? new Date(endDateParam) : undefined;

  const filters = {
    ...(tenantId ? { tenantId } : {}),
    ...(userId ? { userId } : {}),
    ...(method ? { method } : {}),
    ...(path ? { path } : {}),
    ...(statusCode ? { statusCode } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    limit: pagination.limit,
    offset: pagination.offset,
  };

  // Validate date range
  if (startDate && endDate && startDate > endDate) {
    return NextResponse.json(
      { error: "Invalid date range: startDate must be before endDate" },
      { status: 400 }
    );
  }

  // Check if stats requested
  const statsOnly = searchParams.get("stats") === "true";

  try {
    if (statsOnly) {
      const stats = await getApiCallStats(filters);
      return NextResponse.json({ stats });
    }

    const logs = await getApiCallLogs(filters);
    return NextResponse.json({
      logs,
      count: logs.length,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (_error) {
    appLogger.error("[api-logs] Error", error);
    // Never return 500 - return actionable error message with empty logs
    return NextResponse.json(
      {
        error: "Failed to fetch API logs",
        message:
          error instanceof Error ? error.message : "Unknown error occurred. Please try again.",
        logs: [],
        count: 0,
        limit: filters.limit,
        offset: filters.offset,
        retryable: true,
      },
      { status: 200 }
    );
  }
}

// Apply middleware: rate limiting -> caching -> handler
export const GET = withRateLimit(
  RATE_LIMIT_CONFIGS.logs,
  withCache(CACHE_CONFIGS.logs, withApiLogging(handleGet))
);
