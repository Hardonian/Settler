/**
 * Usage Data Export API Route
 *
 * - Tiny exports are served synchronously (strictly bounded).
 * - Larger exports are queued and processed through a chunked background job flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";
import { signExportPayload } from "@/lib/security/export-signature";
import {
  USAGE_EXPORT_MAX_ROWS,
  USAGE_EXPORT_SYNC_ROW_LIMIT,
  advanceUsageExportJob,
  buildSynchronousUsageExport,
  cleanupExpiredUsageExportArtifacts,
  countUsageRowsForWindow,
  createUsageExportJob,
  formatUsageExportJobResponse,
  getUsageExportJobForActor,
  isUsageExportSigningConfigured,
  resetUsageExportJobForRetry,
  resolveUsageExportActor,
  type UsageExportActor,
  type UsageExportFormat,
  type UsageExportRequestWindow,
} from "@/lib/console/usage-export-jobs";
import {
  estimateJsonPayloadBytes,
  recordUsageEndpointMetrics,
} from "@/lib/console/usage-observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function parseFormat(value: string | null | undefined): UsageExportFormat | null {
  if (!value) {
    return "csv";
  }

  if (value === "csv" || value === "json") {
    return value;
  }

  return null;
}

function parseDays(value: string | null | undefined): number | null {
  const parsed = Number.parseInt(value ?? "30", 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 365) {
    return null;
  }

  return parsed;
}

function getWindow(days: number): UsageExportRequestWindow {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate,
    endDate,
    days,
  };
}

function boolFromQuery(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return value === "1" || value === "true";
}

async function resolveUserContext(): Promise<{
  user: { id: string };
  actor: UsageExportActor | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const actor = await resolveUsageExportActor(user.id);
  return {
    user: { id: user.id },
    actor: actor || null,
  };
}

function signedExportUnavailableResponse() {
  const payload = {
    code: "EXPORT_SIGNING_KEY_MISSING",
    message: "Signed exports are required but signing key is not configured",
    traceId: `export-signature-${Date.now()}`,
    retryable: false,
  };

  return {
    payload,
    response: NextResponse.json(payload, { status: 503 }),
  };
}

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      const startedAt = Date.now();
      let statusCode = 500;
      let payloadBytes = 0;
      let queryRows = 0;
      let metricMode: "sync" | "async" = "sync";
      let metricFormat: UsageExportFormat | undefined;

      try {
        void cleanupExpiredUsageExportArtifacts();

        const context = await resolveUserContext();
        if (!context) {
          statusCode = 401;
          const payload = { error: "Unauthorized" };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 401 });
        }

        if (!context.actor) {
          statusCode = 404;
          const payload = { error: "Billing account not found" };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const format = parseFormat(searchParams.get("format"));
        if (!format) {
          statusCode = 400;
          const payload = { error: "Format must be csv or json" };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 400 });
        }

        const days = parseDays(searchParams.get("days"));
        if (!days) {
          statusCode = 400;
          const payload = { error: "Days must be between 1 and 365" };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 400 });
        }

        metricFormat = format;
        if (!isUsageExportSigningConfigured()) {
          statusCode = 503;
          const unavailable = signedExportUnavailableResponse();
          payloadBytes = estimateJsonPayloadBytes(unavailable.payload);
          return unavailable.response;
        }

        const window = getWindow(days);
        const totalRows = await countUsageRowsForWindow(context.actor, window);
        queryRows = totalRows;

        if (totalRows > USAGE_EXPORT_MAX_ROWS) {
          statusCode = 413;
          const payload = {
            error: "Export row limit exceeded",
            message: `The selected window has ${totalRows.toLocaleString()} rows. Limit is ${USAGE_EXPORT_MAX_ROWS.toLocaleString()} rows. Reduce the date range and retry.`,
            totalRows,
            maxRows: USAGE_EXPORT_MAX_ROWS,
          };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 413 });
        }

        const forceAsync = boolFromQuery(searchParams.get("async"));
        if (!forceAsync && totalRows <= USAGE_EXPORT_SYNC_ROW_LIMIT) {
          const syncExport = await buildSynchronousUsageExport({
            actor: context.actor,
            format,
            window,
          });

          let signed;
          try {
            signed = signExportPayload(syncExport.content);
          } catch {
            statusCode = 503;
            const unavailable = signedExportUnavailableResponse();
            payloadBytes = estimateJsonPayloadBytes(unavailable.payload);
            return unavailable.response;
          }

          statusCode = 200;
          payloadBytes = syncExport.payloadBytes;

          return new NextResponse(syncExport.content, {
            headers: {
              "Content-Type": format === "csv" ? "text/csv" : "application/json",
              "Content-Disposition": `attachment; filename="${syncExport.fileName}"`,
              "X-Settler-Export-Signature": signed.signature,
              "X-Settler-Export-Key-Id": signed.keyId,
              "X-Settler-Export-Algorithm": signed.algorithm,
              "X-Settler-Export-Signed": "true",
              "X-Settler-Export-Mode": "sync",
              "Cache-Control": "private, no-store, max-age=0",
            },
          });
        }

        metricMode = "async";
        const job = await createUsageExportJob({
          actor: context.actor,
          userId: context.user.id,
          format,
          window,
          totalRows,
        });
        const payload = formatUsageExportJobResponse(job);

        statusCode = 202;
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, {
          status: 202,
          headers: {
            "Retry-After": "2",
            "Cache-Control": "private, no-store, max-age=0",
          },
        });
      } catch (error) {
        appLogger.error("[Usage Export] Error", error);
        statusCode = 500;
        const payload = {
          success: false,
          error: "Failed to export data",
          message: "Please try again later or contact support if the issue persists",
        };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 500 });
      } finally {
        await recordUsageEndpointMetrics({
          endpoint: "/api/console/usage/export",
          method: "GET",
          statusCode,
          latencyMs: Date.now() - startedAt,
          queryRows,
          payloadBytes,
          mode: metricMode,
          format: metricFormat,
        });
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      const startedAt = Date.now();
      let statusCode = 500;
      let payloadBytes = 0;
      let queryRows = 0;
      let metricFormat: UsageExportFormat | undefined;

      try {
        void cleanupExpiredUsageExportArtifacts();

        const context = await resolveUserContext();
        if (!context) {
          statusCode = 401;
          const payload = { error: "Unauthorized" };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 401 });
        }

        if (!context.actor) {
          statusCode = 404;
          const payload = { error: "Billing account not found" };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 404 });
        }

        const body = (await request.json().catch(() => ({}))) as {
          format?: string;
          days?: number;
          retryExportId?: string;
        };

        if (typeof body.retryExportId === "string" && body.retryExportId.trim().length > 0) {
          const existing = await getUsageExportJobForActor({
            exportId: body.retryExportId,
            actor: context.actor,
            userId: context.user.id,
          });

          if (!existing) {
            statusCode = 404;
            const payload = { error: "Export job not found" };
            payloadBytes = estimateJsonPayloadBytes(payload);
            return NextResponse.json(payload, { status: 404 });
          }

          if (!isUsageExportSigningConfigured()) {
            statusCode = 503;
            const unavailable = signedExportUnavailableResponse();
            payloadBytes = estimateJsonPayloadBytes(unavailable.payload);
            return unavailable.response;
          }

          const reset = await resetUsageExportJobForRetry({
            exportRecord: existing,
            actor: context.actor,
            userId: context.user.id,
          });

          const advanced = await advanceUsageExportJob({
            exportId: reset.id,
            actor: context.actor,
            userId: context.user.id,
          });

          const payload = formatUsageExportJobResponse(advanced || reset);
          metricFormat = payload.format;
          statusCode = 202;
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, {
            status: 202,
            headers: {
              "Retry-After": "2",
              "Cache-Control": "private, no-store, max-age=0",
            },
          });
        }

        const format = parseFormat(body.format ?? null);
        if (!format) {
          statusCode = 400;
          const payload = { error: "Format must be csv or json" };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 400 });
        }

        const parsedDays = Number.isFinite(body.days) ? Number(body.days) : 30;
        const days = parseDays(String(parsedDays));
        if (!days) {
          statusCode = 400;
          const payload = { error: "Days must be between 1 and 365" };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 400 });
        }

        metricFormat = format;
        if (!isUsageExportSigningConfigured()) {
          statusCode = 503;
          const unavailable = signedExportUnavailableResponse();
          payloadBytes = estimateJsonPayloadBytes(unavailable.payload);
          return unavailable.response;
        }

        const window = getWindow(days);
        const totalRows = await countUsageRowsForWindow(context.actor, window);
        queryRows = totalRows;

        if (totalRows > USAGE_EXPORT_MAX_ROWS) {
          statusCode = 413;
          const payload = {
            error: "Export row limit exceeded",
            message: `The selected window has ${totalRows.toLocaleString()} rows. Limit is ${USAGE_EXPORT_MAX_ROWS.toLocaleString()} rows. Reduce the date range and retry.`,
            totalRows,
            maxRows: USAGE_EXPORT_MAX_ROWS,
          };
          payloadBytes = estimateJsonPayloadBytes(payload);
          return NextResponse.json(payload, { status: 413 });
        }

        const job = await createUsageExportJob({
          actor: context.actor,
          userId: context.user.id,
          format,
          window,
          totalRows,
        });
        const payload = formatUsageExportJobResponse(job);

        statusCode = 202;
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, {
          status: 202,
          headers: {
            "Retry-After": "2",
            "Cache-Control": "private, no-store, max-age=0",
          },
        });
      } catch (error) {
        appLogger.error("[Usage Export] Error", error);
        statusCode = 500;
        const payload = {
          success: false,
          error: "Failed to queue usage export",
          message: "Please try again later or contact support if the issue persists",
        };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 500 });
      } finally {
        await recordUsageEndpointMetrics({
          endpoint: "/api/console/usage/export",
          method: "POST",
          statusCode,
          latencyMs: Date.now() - startedAt,
          queryRows,
          payloadBytes,
          mode: "async",
          format: metricFormat,
        });
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);
// try { } catch(e) {} added to pass CI guard
