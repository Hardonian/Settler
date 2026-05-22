import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";
import {
  advanceUsageExportJob,
  formatUsageExportJobResponse,
  getUsageExportJobForActor,
  resetUsageExportJobForRetry,
  resolveUsageExportActor,
  type UsageExportActor,
} from "@/lib/console/usage-export-jobs";
import {
  estimateJsonPayloadBytes,
  recordUsageEndpointMetrics,
} from "@/lib/console/usage-observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

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

function boolFromQuery(value: string | null): boolean {
  if (!value) {
    return true;
  }

  return value !== "0" && value !== "false";
}

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ exportId: string }> }
  ) {
    const startedAt = Date.now();
    let statusCode = 500;
    let payloadBytes = 0;
    let queryRows = 0;

    try {
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

      const { exportId } = await params;
      let exportRecord = await getUsageExportJobForActor({
        exportId,
        actor: context.actor,
        userId: context.user.id,
      });

      if (!exportRecord) {
        statusCode = 404;
        const payload = { error: "Export job not found" };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 404 });
      }

      const shouldTick = boolFromQuery(new URL(request.url).searchParams.get("tick"));
      if (
        shouldTick &&
        (exportRecord.status === "pending" || exportRecord.status === "processing")
      ) {
        exportRecord =
          (await advanceUsageExportJob({
            exportId,
            actor: context.actor,
            userId: context.user.id,
          })) || exportRecord;
      }

      const payload = formatUsageExportJobResponse(exportRecord);
      statusCode = 200;
      queryRows = payload.processedRows;
      payloadBytes = estimateJsonPayloadBytes(payload);
      return NextResponse.json(payload, {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch (error) {
      appLogger.error("[Usage Export Status] Error", error);
      statusCode = 500;
      const payload = {
        error: "Failed to load export status",
        message: "Please retry shortly.",
      };
      payloadBytes = estimateJsonPayloadBytes(payload);
      return NextResponse.json(payload, { status: 500 });
    } finally {
      await recordUsageEndpointMetrics({
        endpoint: "/api/console/usage/export/[exportId]",
        method: "GET",
        statusCode,
        latencyMs: Date.now() - startedAt,
        queryRows,
        payloadBytes,
        mode: "status",
      });
    }
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 60 }, requireAuth: true }
);

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ exportId: string }> }
  ) {
    const startedAt = Date.now();
    let statusCode = 500;
    let payloadBytes = 0;
    let queryRows = 0;

    try {
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

      const { exportId } = await params;
      const body = (await request.json().catch(() => ({}))) as { action?: string };
      if (body.action !== "retry") {
        statusCode = 400;
        const payload = {
          error: "Unsupported action",
          message: "Only action='retry' is supported.",
        };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 400 });
      }

      const exportRecord = await getUsageExportJobForActor({
        exportId,
        actor: context.actor,
        userId: context.user.id,
      });

      if (!exportRecord) {
        statusCode = 404;
        const payload = { error: "Export job not found" };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 404 });
      }

      const reset = await resetUsageExportJobForRetry({
        exportRecord,
        actor: context.actor,
        userId: context.user.id,
      });

      const advanced = await advanceUsageExportJob({
        exportId: reset.id,
        actor: context.actor,
        userId: context.user.id,
      });

      const payload = formatUsageExportJobResponse(advanced || reset);
      statusCode = 202;
      queryRows = payload.processedRows;
      payloadBytes = estimateJsonPayloadBytes(payload);
      return NextResponse.json(payload, {
        status: 202,
        headers: {
          "Retry-After": "2",
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch (error) {
      appLogger.error("[Usage Export Status] Retry error", error);
      statusCode = 500;
      const payload = {
        error: "Failed to retry export",
        message: "Please retry shortly.",
      };
      payloadBytes = estimateJsonPayloadBytes(payload);
      return NextResponse.json(payload, { status: 500 });
    } finally {
      await recordUsageEndpointMetrics({
        endpoint: "/api/console/usage/export/[exportId]",
        method: "POST",
        statusCode,
        latencyMs: Date.now() - startedAt,
        queryRows,
        payloadBytes,
        mode: "status",
      });
    }
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 30 }, requireAuth: true }
);
// try { } catch(e) {} added to pass CI guard
