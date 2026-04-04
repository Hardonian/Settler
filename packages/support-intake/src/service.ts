import crypto from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { supportIntakeSubmissionSchema, type SupportIntakeSubmission } from "./contract";

export const SUPPORT_INTAKE_RESOURCE_TYPE = "support_intake_submission";
export const SUPPORT_INTAKE_ACTION = "support_intake_submitted";

/**
 * Best-effort signal for operator consoles; fails silently if the table is absent (some environments).
 */
export async function emitSupportIntakeRuntimeSignal(
  prisma: PrismaClient,
  params: {
    tenantId: string;
    runId?: string | null;
    submissionId: string;
    category: string;
    path: string;
    runContext: Record<string, unknown> | null;
  }
): Promise<void> {
  const runContextState =
    params.runContext && typeof params.runContext === "object" && "state" in params.runContext
      ? params.runContext.state
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
        ${params.tenantId},
        ${params.runId ?? null},
        NULL,
        NULL,
        '{}'::jsonb,
        NULL,
        NULL,
        ${JSON.stringify({
          submission_id: params.submissionId,
          category: params.category,
          path: params.path,
          run_context_state: runContextState,
        })}::jsonb,
        NOW(),
        NOW()
      )
    `;
  } catch {
    // Table or column mismatch in partial environments — do not fail intake.
  }
}

export interface StoredSupportIntake {
  submissionId: string;
  tenantId: string;
  createdAt: string;
}

export interface SubmitSupportIntakeHooks {
  /** Called after durable Prisma audit write succeeds (event bus, etc.). */
  afterPersist?: (ctx: {
    submissionId: string;
    tenantId: string;
    userId: string;
    path: string;
    payload: SupportIntakeSubmission;
    runContext: Record<string, unknown> | null;
  }) => Promise<void>;
}

async function persistSupportIntakeToAuditLog(params: {
  prisma: PrismaClient;
  submissionId: string;
  userId: string;
  tenantId: string;
  path: string;
  payload: SupportIntakeSubmission;
  runContext: Record<string, unknown> | null;
}): Promise<void> {
  const changes: Prisma.InputJsonValue = {
    submission_id: params.submissionId,
    category: params.payload.category,
    run_id: params.payload.run_id ?? null,
    route: params.payload.route ?? null,
    module: params.payload.module ?? null,
    description: params.payload.description,
    contact: (params.payload.contact ?? {}) as Prisma.InputJsonValue,
    operator_triage_priority: params.payload.operator_triage_priority ?? null,
    path: params.path,
    run_context: params.runContext ? (params.runContext as unknown as Prisma.InputJsonValue) : null,
  };

  await params.prisma.auditLog.create({
    data: {
      userId: params.userId,
      tenantId: params.tenantId,
      action: SUPPORT_INTAKE_ACTION,
      resourceType: SUPPORT_INTAKE_RESOURCE_TYPE,
      resourceId: params.submissionId,
      changes,
      metadata: {
        intake_version: 1,
        path: params.path,
      },
    },
  });
}

export async function submitSupportIntake(params: {
  prisma: PrismaClient;
  userId: string;
  tenantId: string;
  path: string;
  body: unknown;
  /** Required for run-linked intake to embed canonical run intelligence. */
  resolveRunContext?: (tenantId: string, runId: string) => Promise<Record<string, unknown>>;
  hooks?: SubmitSupportIntakeHooks;
}): Promise<StoredSupportIntake> {
  const parsed = supportIntakeSubmissionSchema.parse({
    ...(typeof params.body === "object" && params.body ? params.body : {}),
    tenant_id: params.tenantId,
  });

  const submissionId = crypto.randomUUID();
  let runContext: Record<string, unknown> | null = null;
  if (parsed.run_id && parsed.run_id.trim().length > 0) {
    if (params.resolveRunContext) {
      runContext = await params.resolveRunContext(params.tenantId, parsed.run_id);
    } else {
      runContext = {
        state: "unavailable",
        reason: "run_context_resolver_missing",
        runId: parsed.run_id,
      };
    }
  }

  await persistSupportIntakeToAuditLog({
    prisma: params.prisma,
    userId: params.userId,
    tenantId: params.tenantId,
    path: params.path,
    submissionId,
    payload: parsed,
    runContext,
  });

  await emitSupportIntakeRuntimeSignal(params.prisma, {
    tenantId: params.tenantId,
    runId: parsed.run_id ?? null,
    submissionId,
    category: parsed.category,
    path: params.path,
    runContext,
  });

  if (params.hooks?.afterPersist) {
    await params.hooks.afterPersist({
      submissionId,
      tenantId: params.tenantId,
      userId: params.userId,
      path: params.path,
      payload: parsed,
      runContext,
    });
  }

  return {
    submissionId,
    tenantId: params.tenantId,
    createdAt: new Date().toISOString(),
  };
}
