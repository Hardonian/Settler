import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { logError } from "../../utils/logger";
import { supportIntakeSubmissionSchema, SupportIntakeSubmission } from "./support-intake-contract";
import { eventBus } from "../events/event-bus";
import { emitOperatorRuntimeEvent } from "../ops-intelligence/runtime-events";
import { prisma } from "../../infrastructure/db/prisma";
import {
  resolveRunCompactProofSummary,
  resolveOperatorRunDetailForTenants,
} from "@settler/reconciliation-core";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toRunUuid(runId: string | undefined): string | null {
  const t = runId?.trim();
  if (!t || !UUID_RE.test(t)) return null;
  return t;
}

export interface StoredSupportIntake {
  submissionId: string;
  tenantId: string;
  createdAt: string;
}

export async function submitSupportIntake(params: {
  userId: string;
  tenantId: string;
  path: string;
  body: unknown;
}): Promise<StoredSupportIntake> {
  const parsed = supportIntakeSubmissionSchema.parse({
    ...(typeof params.body === "object" && params.body ? params.body : {}),
    tenant_id: params.tenantId,
  });

  const submissionId = crypto.randomUUID();
  const runContext =
    parsed.run_id && parsed.run_id.trim().length > 0
      ? await buildSupportRunContext(params.tenantId, parsed.run_id)
      : null;

  try {
    await persistSupportIntakeToAuditLog({
      userId: params.userId,
      tenantId: params.tenantId,
      path: params.path,
      submissionId,
      payload: parsed,
      runContext,
    });

    await emitOperatorRuntimeEvent({
      eventType: "support_intake_submitted",
      tenantId: params.tenantId,
      runId: toRunUuid(parsed.run_id),
      metadata: {
        submission_id: submissionId,
        category: parsed.category,
        path: params.path,
        route: parsed.route ?? null,
        module: parsed.module ?? null,
        description_length: parsed.description.length,
        run_context_state:
          runContext && typeof runContext === "object" && "state" in runContext
            ? (runContext as { state?: string }).state
            : null,
      },
    });

    await eventBus.emitEvent(
      "support.issue.created",
      params.tenantId,
      {
        submissionId,
        category: parsed.category,
        runId: parsed.run_id ?? null,
        runIntelligence: runContext,
        route: parsed.route ?? null,
        module: parsed.module ?? null,
      },
      {
        correlationId: `support:${params.tenantId}:${submissionId}`,
        runId: parsed.run_id ?? undefined,
        executionId: parsed.run_id ?? submissionId,
        actorId: params.userId,
        source: "api.support-intake",
        severity: "info",
      }
    );
  } catch (error) {
    logError("Failed to persist support intake submission", error, {
      tenantId: params.tenantId,
      userId: params.userId,
      submissionId,
    });
    throw error;
  }

  return {
    submissionId,
    tenantId: params.tenantId,
    createdAt: new Date().toISOString(),
  };
}

async function persistSupportIntakeToAuditLog(params: {
  submissionId: string;
  userId: string;
  tenantId: string;
  path: string;
  payload: SupportIntakeSubmission;
  runContext: Record<string, unknown> | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      tenantId: params.tenantId,
      action: "support_intake_submitted",
      resourceType: "support",
      metadata: {
        submission_id: params.submissionId,
        path: params.path,
        category: params.payload.category,
        severity: params.payload.severity ?? "medium",
        status: "open",
        run_id: params.payload.run_id ?? null,
        route: params.payload.route ?? null,
        module: params.payload.module ?? null,
        description: params.payload.description,
        contact: params.payload.contact ?? {},
        run_context: params.runContext,
        operator_notes: null,
      } as Prisma.InputJsonValue,
    },
  });
}

async function buildSupportRunContext(
  tenantId: string,
  runId: string
): Promise<Record<string, unknown>> {
  try {
    const outcome = await resolveOperatorRunDetailForTenants(prisma, [tenantId], runId);
    if (outcome.kind !== "ok") {
      return {
        state: "unavailable",
        reason: outcome.kind,
        runId,
        compactProofSummary: resolveRunCompactProofSummary({
          runKind: "recon_job",
          fallbackReasonCode: "support_run_detail_unavailable",
        }).compactProofSummary,
      };
    }

    const summaryResolution = resolveRunCompactProofSummary({
      runKind: outcome.detail.runKind,
      compactProofSummary: outcome.detail.compactProofSummary,
      proofpackIndex: outcome.detail.proofpackIndex,
    });

    return {
      state: "ok",
      runId: outcome.detail.id,
      runKind: outcome.detail.runKind,
      status: outcome.detail.status,
      compactProofSummary: summaryResolution.compactProofSummary,
      fallbackReason: summaryResolution.fallbackReasonCode,
    };
  } catch (error) {
    logError("Failed to derive run intelligence for support intake", error, { tenantId, runId });
    return {
      state: "degraded",
      reason: "support_run_context_error",
      runId,
      compactProofSummary: resolveRunCompactProofSummary({
        runKind: "recon_job",
        fallbackReasonCode: "support_run_context_error",
      }).compactProofSummary,
    };
  }
}
