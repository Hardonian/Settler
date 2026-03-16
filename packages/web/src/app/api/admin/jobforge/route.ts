// ROUTE_CLASS: admin-internal
// AUTH: session + superAdmin
import { NextRequest } from "next/server";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/auth/super-admin";
import {
  getJobForgeIntegrationStatus,
  getJobForgeReport,
  requestJobForgeBundleExecution,
  runJobForgeModuleDryRun,
  submitJobForgeEvent,
} from "@/lib/jobforge/adapter";
import {
  apiError,
  apiInternalError,
  apiSuccess,
  apiValidationError,
} from "@/lib/types/api-response";

const contextSchema = z.object({
  tenantId: z.string().uuid(),
  projectId: z.string().uuid(),
});

const submitEventSchema = z.object({
  action: z.literal("submit-event"),
  context: contextSchema,
  eventName: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().min(1).optional(),
});

const dryRunSchema = z.object({
  action: z.literal("run-module-dry-run"),
  context: contextSchema,
  moduleName: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().min(1).optional(),
});

const reportSchema = z.object({
  action: z.literal("view-report"),
  context: contextSchema,
  jobId: z.string().uuid(),
});

const bundleSchema = z.object({
  action: z.literal("request-bundle-execution"),
  context: contextSchema,
  bundleId: z.string().min(1),
  reportJobId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(1).optional(),
  confirm: z.literal(true),
});

const actionSchema = z.discriminatedUnion("action", [
  submitEventSchema,
  dryRunSchema,
  reportSchema,
  bundleSchema,
]);

export async function GET() {
  try {
    await requireSuperAdmin();
    return apiSuccess(getJobForgeIntegrationStatus());
  } catch (error) {
    return apiInternalError("Failed to load JobForge status", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const formatted = Object.fromEntries(
        Object.entries(fieldErrors).map(([key, value]) => [key, value?.join(", ") || "Invalid"])
      );
      return apiValidationError(formatted);
    }

    const payload = parsed.data;

    if (payload.action === "submit-event") {
      const result = await submitJobForgeEvent({
        context: payload.context,
        eventName: payload.eventName,
        payload: payload.payload,
        idempotencyKey: payload.idempotencyKey,
      });

      if (!result.ok) {
        return apiError(
          "JOBFORGE_EVENT_FAILED",
          result.error ?? "JobForge event submission failed",
          { code: result.code },
          result.code === "disabled" ? 412 : 400
        );
      }

      return apiSuccess({ job: result.data });
    }

    if (payload.action === "run-module-dry-run") {
      const result = await runJobForgeModuleDryRun({
        context: payload.context,
        moduleName: payload.moduleName,
        input: payload.input,
        idempotencyKey: payload.idempotencyKey,
      });

      if (!result.ok) {
        return apiError(
          "JOBFORGE_DRY_RUN_FAILED",
          result.error ?? "JobForge dry-run failed",
          { code: result.code },
          result.code === "disabled" ? 412 : 400
        );
      }

      return apiSuccess({ job: result.data });
    }

    if (payload.action === "view-report") {
      const result = await getJobForgeReport(payload.context, payload.jobId);

      if (!result.ok) {
        return apiError(
          "JOBFORGE_REPORT_FAILED",
          result.error ?? "JobForge report fetch failed",
          { code: result.code },
          result.code === "disabled" ? 412 : 400
        );
      }

      return apiSuccess(result.data);
    }

    if (payload.action === "request-bundle-execution") {
      const result = await requestJobForgeBundleExecution({
        context: payload.context,
        bundleId: payload.bundleId,
        reportJobId: payload.reportJobId,
        idempotencyKey: payload.idempotencyKey,
      });

      if (!result.ok) {
        return apiError(
          "JOBFORGE_BUNDLE_FAILED",
          result.error ?? "JobForge bundle execution request failed",
          { code: result.code },
          result.code === "execution-disabled" ? 403 : 400
        );
      }

      return apiSuccess({ job: result.data });
    }

    return apiError("JOBFORGE_UNKNOWN_ACTION", "Unsupported JobForge action", undefined, 400);
  } catch (error) {
    return apiInternalError("JobForge request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
