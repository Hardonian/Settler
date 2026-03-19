import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";
import {
  getUsageExportFileName,
  getUsageExportJobForActor,
  listUsageExportChunkPage,
  resolveUsageExportActor,
  verifyUsageExportDownloadAccess,
  type UsageExportActor,
} from "@/lib/console/usage-export-jobs";
import {
  estimateJsonPayloadBytes,
  recordUsageEndpointMetrics,
} from "@/lib/console/usage-observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const CHUNK_PAGE_SIZE = 10;

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

function buildChunkedDownloadStream(params: {
  exportId: string;
  format: "csv" | "json";
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let offset = 0;
        let hasWrittenContent = false;

        if (params.format === "csv") {
          controller.enqueue(encoder.encode("Timestamp,Service,Operation,Quantity,Status"));
        } else {
          controller.enqueue(encoder.encode("["));
        }

        while (true) {
          const rows = await listUsageExportChunkPage(params.exportId, CHUNK_PAGE_SIZE, offset);
          if (rows.length === 0) {
            break;
          }

          for (const row of rows) {
            if (!row.content) {
              continue;
            }

            if (params.format === "csv") {
              controller.enqueue(encoder.encode("\n"));
              controller.enqueue(encoder.encode(row.content));
            } else {
              if (hasWrittenContent) {
                controller.enqueue(encoder.encode(",\n"));
              }

              controller.enqueue(encoder.encode(row.content));
              hasWrittenContent = true;
            }
          }

          offset += rows.length;
        }

        if (params.format === "json") {
          controller.enqueue(encoder.encode("]"));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
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

      const token = new URL(request.url).searchParams.get("token");
      if (!token) {
        statusCode = 400;
        const payload = { error: "Missing download token" };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 400 });
      }

      const { exportId } = await params;
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

      if (exportRecord.status !== "completed") {
        statusCode = 409;
        const payload = {
          error: "Export is not ready",
          status: exportRecord.status,
        };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 409 });
      }

      if (exportRecord.expiresAt && exportRecord.expiresAt.getTime() <= Date.now()) {
        statusCode = 410;
        const payload = {
          error: "Export has expired",
          message: "Please create a new export.",
        };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 410 });
      }

      const isAuthorized = await verifyUsageExportDownloadAccess({
        token,
        exportRecord,
        actor: context.actor,
        userId: context.user.id,
      });

      if (!isAuthorized) {
        statusCode = 403;
        const payload = { error: "Invalid or expired download token" };
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload, { status: 403 });
      }

      const format = exportRecord.type === "json" ? "json" : "csv";
      queryRows = exportRecord.rowCount || 0;
      statusCode = 200;
      payloadBytes = exportRecord.fileSizeBytes || 0;

      const bodyStream = buildChunkedDownloadStream({
        exportId: exportRecord.id,
        format,
      });

      return new NextResponse(bodyStream, {
        status: 200,
        headers: {
          "Content-Type": format === "csv" ? "text/csv" : "application/json",
          "Content-Disposition": `attachment; filename="${getUsageExportFileName(exportRecord)}"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch (error) {
      appLogger.error("[Usage Export Download] Error", error);
      statusCode = 500;
      const payload = {
        error: "Failed to download export",
        message: "Please retry shortly.",
      };
      payloadBytes = estimateJsonPayloadBytes(payload);
      return NextResponse.json(payload, { status: 500 });
    } finally {
      await recordUsageEndpointMetrics({
        endpoint: "/api/console/usage/export/[exportId]/download",
        method: "GET",
        statusCode,
        latencyMs: Date.now() - startedAt,
        queryRows,
        payloadBytes,
        mode: "download",
      });
    }
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 40 }, requireAuth: true }
);
