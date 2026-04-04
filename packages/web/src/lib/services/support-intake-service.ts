/**
 * Console support intake — mirrors packages/api support-intake-service using web Prisma.
 * Canonical schema: @settler/types supportIntakeSubmissionSchema.
 */

import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import {
  resolveOperatorRunDetailForTenants,
  resolveRunCompactProofSummary,
} from "@settler/reconciliation-core";
import type { SupportIntakeSubmission } from "@settler/types";
import { supportIntakeSubmissionSchema } from "@settler/types";
import { appLogger } from "@/lib/utils/logger";
import { prisma } from "@/shared/db/prismaClient";

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
    appLogger.error("Failed to derive run intelligence for support intake", error, {
      tenantId,
      runId,
    });
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

async function emitSupportIntakeRuntimeSignal(params: {
  tenantId: string;
  runId: string | null;
  submissionId: string;
  path: string;
  category: string;
  route: string | null;
  module: string | null;
  descriptionLength: number;
  runContext: Record<string, unknown> | null;
}): Promise<void> {
  const runContextState =
    params.runContext && typeof params.runContext === "object" && "state" in params.runContext
      ? (params.runContext as { state?: string }).state
      : null;

  try {
    await prisma.$executeRaw`
      INSERT INTO operator_runtime_events (
        event_type,
        tenant_id,
        run_id,
        records_processed,
        duration_ms,
        classification_counts,
        manual_review_count,
        error_id,
        metadata,
        occurred_at,
        created_at
      ) VALUES (
        'support_intake_submitted',
        ${params.tenantId}::uuid,
        ${params.runId}::uuid,
        NULL,
        NULL,
        '{}'::jsonb,
        NULL,
        NULL,
        ${JSON.stringify({
          submission_id: params.submissionId,
          category: params.category,
          path: params.path,
          route: params.route,
          module: params.module,
          description_length: params.descriptionLength,
          run_context_state: runContextState,
        })}::jsonb,
        NOW(),
        NOW()
      )
    `;
  } catch (error) {
    appLogger.error("Failed to persist support_intake_submitted operator runtime event", error, {
      tenantId: params.tenantId,
      submissionId: params.submissionId,
    });
  }
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
  const runIdForResolve = parsed.run_id?.trim() ?? "";
  const runContext =
    runIdForResolve.length > 0
      ? await buildSupportRunContext(params.tenantId, runIdForResolve)
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

    await emitSupportIntakeRuntimeSignal({
      tenantId: params.tenantId,
      runId: toRunUuid(parsed.run_id),
      submissionId,
      path: params.path,
      category: parsed.category,
      route: parsed.route ?? null,
      module: parsed.module ?? null,
      descriptionLength: parsed.description.length,
      runContext,
    });
  } catch (error) {
    appLogger.error("Failed to persist support intake submission", error, {
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
