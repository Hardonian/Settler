import crypto from "crypto";
import { supportIntakeSubmissionSchema, type SupportIntakeSubmission } from "./contract";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];
// InputJsonValue excludes top-level null to match Prisma's InputJsonValue constraint.
type InputJsonObject = { [key: string]: JsonValue | undefined };
type SupportIntakeContextPayload = object;

interface SupportIntakePrismaClient {
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
  auditLog: {
    create(args: {
      data: {
        userId: string;
        tenantId: string;
        action: string;
        resourceType: string;
        resourceId: string;
        changes: InputJsonObject;
        metadata: InputJsonObject;
      };
    }): Promise<unknown>;
  };
}

export const SUPPORT_INTAKE_RESOURCE_TYPE = "support_intake_submission";
export const SUPPORT_INTAKE_ACTION = "support_intake_submitted";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toUuidColumn(value: string | null | undefined): string | null {
  const t = value?.trim();
  if (!t || !UUID_RE.test(t)) return null;
  return t;
}

/**
 * Best-effort signal for operator consoles; fails silently if the table is absent (some environments).
 */
export async function emitSupportIntakeRuntimeSignal(
  prisma: SupportIntakePrismaClient,
  params: {
    tenantId: string;
    runId?: string | null;
    exceptionId?: string | null;
    submissionId: string;
    category: string;
    path: string;
    route?: string | null;
    module?: string | null;
    descriptionLength: number;
    runContext: SupportIntakeContextPayload | null;
    exceptionContext: SupportIntakeContextPayload | null;
  }
): Promise<void> {
  const runContextState =
    params.runContext && typeof params.runContext === "object" && "state" in params.runContext
      ? params.runContext.state
      : null;
  const exceptionContextState =
    params.exceptionContext &&
    typeof params.exceptionContext === "object" &&
    "state" in params.exceptionContext
      ? params.exceptionContext.state
      : null;
  const runUuid = toUuidColumn(params.runId);
  const exceptionUuid = toUuidColumn(params.exceptionId);
  try {
    await prisma.$executeRaw`
      INSERT INTO operator_runtime_events (
        event_type,
        tenant_id,
        run_id,
        exception_id,
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
        ${runUuid}::uuid,
        ${exceptionUuid}::uuid,
        NULL,
        NULL,
        '{}'::jsonb,
        NULL,
        NULL,
        ${JSON.stringify({
          submission_id: params.submissionId,
          category: params.category,
          path: params.path,
          route: params.route ?? null,
          module: params.module ?? null,
          description_length: params.descriptionLength,
          run_context_state: runContextState,
          exception_context_state: exceptionContextState,
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
    runContext: SupportIntakeContextPayload | null;
    exceptionContext: SupportIntakeContextPayload | null;
  }) => Promise<void>;
}

async function persistSupportIntakeToAuditLog(params: {
  prisma: SupportIntakePrismaClient;
  submissionId: string;
  userId: string;
  tenantId: string;
  path: string;
  payload: SupportIntakeSubmission;
  runContext: SupportIntakeContextPayload | null;
  exceptionContext: SupportIntakeContextPayload | null;
}): Promise<void> {
  const changes: InputJsonObject = {
    submission_id: params.submissionId,
    category: params.payload.category,
    run_id: params.payload.run_id ?? null,
    exception_id: params.payload.exception_id ?? null,
    route: params.payload.route ?? null,
    module: params.payload.module ?? null,
    description: params.payload.description,
    contact: (params.payload.contact ?? {}) as JsonValue,
    operator_triage_priority: params.payload.operator_triage_priority ?? null,
    path: params.path,
    run_context: params.runContext ? (params.runContext as unknown as JsonValue) : null,
    exception_context: params.exceptionContext
      ? (params.exceptionContext as unknown as JsonValue)
      : null,
  };

  const metadata: InputJsonObject = {
    intake_version: 2,
    path: params.path,
  };

  await params.prisma.auditLog.create({
    data: {
      userId: params.userId,
      tenantId: params.tenantId,
      action: SUPPORT_INTAKE_ACTION,
      resourceType: SUPPORT_INTAKE_RESOURCE_TYPE,
      resourceId: params.submissionId,
      changes,
      metadata,
    },
  });
}

export async function submitSupportIntake(params: {
  prisma: SupportIntakePrismaClient;
  userId: string;
  tenantId: string;
  path: string;
  body: unknown;
  /** Required for run-linked intake to embed canonical run intelligence. */
  resolveRunContext?: (tenantId: string, runId: string) => Promise<SupportIntakeContextPayload>;
  /** Optional exception-linked enrichment for family-memory aware support triage. */
  resolveExceptionContext?: (
    tenantId: string,
    exceptionId: string
  ) => Promise<SupportIntakeContextPayload>;
  hooks?: SubmitSupportIntakeHooks;
}): Promise<StoredSupportIntake> {
  const parsed = supportIntakeSubmissionSchema.parse({
    ...(typeof params.body === "object" && params.body ? params.body : {}),
    tenant_id: params.tenantId,
  });

  const submissionId = crypto.randomUUID();
  let runContext: SupportIntakeContextPayload | null = null;
  let exceptionContext: SupportIntakeContextPayload | null = null;
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
  if (parsed.exception_id && parsed.exception_id.trim().length > 0) {
    if (params.resolveExceptionContext && UUID_RE.test(parsed.exception_id.trim())) {
      exceptionContext = await params.resolveExceptionContext(params.tenantId, parsed.exception_id);
    } else if (!params.resolveExceptionContext) {
      exceptionContext = {
        state: "unavailable",
        reason: "exception_context_resolver_missing",
        exceptionId: parsed.exception_id,
      };
    } else {
      exceptionContext = {
        state: "unavailable",
        reason: "exception_context_invalid_reference",
        exceptionId: parsed.exception_id,
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
    exceptionContext,
  });

  await emitSupportIntakeRuntimeSignal(params.prisma, {
    tenantId: params.tenantId,
    runId: parsed.run_id ?? null,
    exceptionId: parsed.exception_id ?? null,
    submissionId,
    category: parsed.category,
    path: params.path,
    route: parsed.route ?? null,
    module: parsed.module ?? null,
    descriptionLength: parsed.description.length,
    runContext,
    exceptionContext,
  });

  if (params.hooks?.afterPersist) {
    await params.hooks.afterPersist({
      submissionId,
      tenantId: params.tenantId,
      userId: params.userId,
      path: params.path,
      payload: parsed,
      runContext,
      exceptionContext,
    });
  }

  return {
    submissionId,
    tenantId: params.tenantId,
    createdAt: new Date().toISOString(),
  };
}
