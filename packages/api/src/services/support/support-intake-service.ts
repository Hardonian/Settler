import crypto from "crypto";
import { query } from "../../db";
import { logError } from "../../utils/logger";
import { supportIntakeSubmissionSchema, SupportIntakeSubmission } from "./support-intake-contract";
import { eventBus } from "../events/event-bus";
import { prisma } from "../../infrastructure/db/prisma";
import {
  resolveOperatorRunDetailForTenants,
  toRunCompactProofSummary,
  unavailableRunProofpackIndex,
} from "@settler/reconciliation-core";

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
  await query(
    `INSERT INTO audit_logs (event, user_id, tenant_id, path, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      "support_intake_submitted",
      params.userId,
      params.tenantId,
      params.path,
      JSON.stringify({
        submission_id: params.submissionId,
        category: params.payload.category,
        run_id: params.payload.run_id ?? null,
        route: params.payload.route ?? null,
        module: params.payload.module ?? null,
        description: params.payload.description,
        contact: params.payload.contact ?? {},
        run_context: params.runContext,
      }),
    ]
  );
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
        compactProofSummary: toRunCompactProofSummary(
          unavailableRunProofpackIndex("support_run_detail_unavailable")
        ),
      };
    }

    return {
      state: "resolved",
      runId: outcome.detail.id,
      runKind: outcome.detail.runKind,
      status: outcome.detail.status,
      compactProofSummary: toRunCompactProofSummary(
        outcome.detail.proofpackIndex ?? unavailableRunProofpackIndex("support_run_proofpack_missing")
      ),
    };
  } catch (error) {
    logError("Failed to derive run intelligence for support intake", error, { tenantId, runId });
    return {
      state: "degraded",
      reason: "support_run_context_error",
      runId,
      compactProofSummary: toRunCompactProofSummary(
        unavailableRunProofpackIndex("support_run_context_error")
      ),
    };
  }
}
