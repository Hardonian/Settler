import crypto from "crypto";
import { query } from "../../db";
import { logError } from "../../utils/logger";
import { supportIntakeSubmissionSchema, SupportIntakeSubmission } from "./support-intake-contract";
import { eventBus } from "../events/event-bus";

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

  try {
    await persistSupportIntakeToAuditLog({
      userId: params.userId,
      tenantId: params.tenantId,
      path: params.path,
      submissionId,
      payload: parsed,
    });

    await eventBus.emitEvent(
      "support.issue.created",
      params.tenantId,
      {
        submissionId,
        category: parsed.category,
        runId: parsed.run_id ?? null,
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
      }),
    ]
  );
}
