import { Prisma, PrismaClient } from "@prisma/client";
import { ExportJobQueue } from "../../jobs/queue/ExportJobQueue";
import { ExportJobExecutionResult, ExportJobType } from "../../jobs/export/export-job-contract";
import { ConflictError, NotFoundError } from "../../utils/typed-errors";

type ExportStatus = "pending" | "processing" | "completed" | "failed";

export interface RequestExportInput {
  tenantId: string;
  userId: string;
  type: "reconciliation" | "exceptions" | "audit" | "evidence";
  format: "csv" | "json" | "xlsx" | "pdf";
  runId?: string;
  options?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface RequestExportResult {
  exportId: string;
  jobId: string;
  type: string;
  format: string;
  status: ExportStatus;
  createdAt: string;
  idempotent: boolean;
  createdNew: boolean;
}

export interface MarkExportProcessingInput {
  tenantId: string;
  jobId: string;
  workerId: string;
}

export interface RecordExportRetryInput {
  tenantId: string;
  jobId: string;
  errorMessage: string;
  retryScheduledAt: Date;
  attempt: number;
  maxAttempts: number;
}

export interface RecordExportFailureInput {
  tenantId: string;
  jobId: string;
  errorMessage: string;
}

export interface CancelExportJobInput {
  tenantId: string;
  jobId: string;
}

export interface RecordExportSuccessInput {
  tenantId: string;
  jobId: string;
  result: ExportJobExecutionResult;
}

interface ExportRecordSnapshot {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  format: string;
  reconciliationRunId: string | null;
  status: string;
  storageLocation: string | null;
  signedUrl: string | null;
  signedUrlExpiresAt: Date | null;
  fileSizeBytes: number | null;
  rowCount: number | null;
  errorMessage: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}

interface CanonicalLookupInput {
  tenantId: string;
  jobId?: string;
  idempotencyKey?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asMetadataObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return isRecord(value) ? { ...value } : {};
}

function mergeMetadata(
  metadata: Prisma.JsonValue | null | undefined,
  patch: Record<string, unknown>
): Prisma.InputJsonValue {
  return {
    ...asMetadataObject(metadata),
    ...patch,
  } as Prisma.InputJsonValue;
}

function normalizeOptions(options?: Record<string, unknown>): Record<string, unknown> {
  if (!options) {
    return {};
  }

  return Object.keys(options)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = options[key];
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
}

function buildRequestFingerprint(input: RequestExportInput): string {
  return JSON.stringify({
    tenantId: input.tenantId,
    type: input.type,
    format: input.format,
    runId: input.runId ?? null,
    options: normalizeOptions(input.options),
  });
}

function selectJobType(
  type: RequestExportInput["type"],
  format: RequestExportInput["format"]
): ExportJobType {
  if (type === "reconciliation") {
    return "reconciliation-export";
  }

  if (format === "csv") {
    return "csv-export";
  }

  if (format === "pdf") {
    return "pdf-report";
  }

  return "export";
}

export class ExportLifecycleService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly exportQueue: ExportJobQueue = new ExportJobQueue()
  ) {}

  async requestExport(input: RequestExportInput): Promise<RequestExportResult> {
    const jobType = selectJobType(input.type, input.format);
    const enqueuedJob = await this.exportQueue.enqueue({
      tenantId: input.tenantId,
      userId: input.userId,
      type: jobType,
      runId: input.runId,
      format: input.format,
      idempotencyKey: input.idempotencyKey,
      options: {
        ...normalizeOptions(input.options),
        exportType: input.type,
        requestFingerprint: buildRequestFingerprint(input),
      },
    });

    return this.prisma.$transaction(async (tx) => {
      await this.acquireExportLock(tx, input.tenantId, enqueuedJob.id, input.idempotencyKey);

      const existing = await this.findCanonicalExport(tx, {
        tenantId: input.tenantId,
        jobId: enqueuedJob.id,
        idempotencyKey: input.idempotencyKey,
      });

      if (existing) {
        return {
          exportId: existing.id,
          jobId: enqueuedJob.id,
          type: existing.type,
          format: existing.format,
          status: existing.status as ExportStatus,
          createdAt: existing.createdAt.toISOString(),
          idempotent: true,
          createdNew: false,
        };
      }

      const created = await tx.export.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          type: input.type,
          format: input.format,
          reconciliationRunId: input.runId ?? null,
          status: enqueuedJob.status === "running" ? "processing" : "pending",
          metadata: {
            idempotencyKey: input.idempotencyKey ?? null,
            jobId: enqueuedJob.id,
            options: normalizeOptions(input.options),
            requestFingerprint: buildRequestFingerprint(input),
            jobType,
            requestedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      return {
        exportId: created.id,
        jobId: enqueuedJob.id,
        type: created.type,
        format: created.format,
        status: created.status as ExportStatus,
        createdAt: created.createdAt.toISOString(),
        idempotent: false,
        createdNew: true,
      };
    });
  }

  async markJobProcessing(input: MarkExportProcessingInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.acquireExportLock(tx, input.tenantId, input.jobId);
      const canonical = await this.requireCanonicalExport(tx, {
        tenantId: input.tenantId,
        jobId: input.jobId,
      });

      if (canonical.status === "completed") {
        return;
      }

      if (canonical.status === "failed") {
        throw new ConflictError("Cannot resume a failed export artifact", {
          code: "EXPORT_ALREADY_FAILED",
          exportId: canonical.id,
          jobId: input.jobId,
        });
      }

      await tx.export.update({
        where: { id: canonical.id },
        data: {
          status: "processing",
          errorMessage: null,
          metadata: mergeMetadata(canonical.metadata, {
            jobId: input.jobId,
            processingStartedAt: new Date().toISOString(),
            processingWorkerId: input.workerId,
          }),
        },
      });
    });
  }

  async recordJobRetryScheduled(input: RecordExportRetryInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.acquireExportLock(tx, input.tenantId, input.jobId);
      const canonical = await this.requireCanonicalExport(tx, {
        tenantId: input.tenantId,
        jobId: input.jobId,
      });

      await tx.export.update({
        where: { id: canonical.id },
        data: {
          status: "pending",
          errorMessage: null,
          metadata: mergeMetadata(canonical.metadata, {
            jobId: input.jobId,
            lastAttemptError: input.errorMessage,
            retryScheduledAt: input.retryScheduledAt.toISOString(),
            retryAttempt: input.attempt,
            maxAttempts: input.maxAttempts,
          }),
        },
      });
    });
  }

  async recordJobFailure(input: RecordExportFailureInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.acquireExportLock(tx, input.tenantId, input.jobId);
      const canonical = await this.requireCanonicalExport(tx, {
        tenantId: input.tenantId,
        jobId: input.jobId,
      });

      await tx.export.update({
        where: { id: canonical.id },
        data: {
          status: "failed",
          errorMessage: input.errorMessage,
          metadata: mergeMetadata(canonical.metadata, {
            jobId: input.jobId,
            failedAt: new Date().toISOString(),
            failureReason: input.errorMessage,
          }),
        },
      });
    });
  }

  async cancelQueuedJob(input: CancelExportJobInput): Promise<boolean> {
    return this.exportQueue.cancelJob(input.jobId, input.tenantId);
  }

  async recordJobSuccess(input: RecordExportSuccessInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.acquireExportLock(tx, input.tenantId, input.jobId);
      const canonical = await this.requireCanonicalExport(tx, {
        tenantId: input.tenantId,
        jobId: input.jobId,
      });

      const metadata = input.result.metadata ?? {};

      await tx.export.update({
        where: { id: canonical.id },
        data: {
          status: "completed",
          storageLocation: input.result.storageLocation ?? canonical.storageLocation,
          signedUrl: input.result.signedUrl ?? canonical.signedUrl,
          signedUrlExpiresAt: input.result.signedUrlExpiresAt
            ? new Date(input.result.signedUrlExpiresAt)
            : canonical.signedUrlExpiresAt,
          fileSizeBytes:
            input.result.fileSizeBytes === undefined
              ? canonical.fileSizeBytes
              : input.result.fileSizeBytes,
          rowCount: input.result.rowCount,
          errorMessage: null,
          metadata: mergeMetadata(canonical.metadata, {
            jobId: input.jobId,
            exportedAt: input.result.exportedAt,
            completedAt: new Date().toISOString(),
            lastSuccessfulJobId: input.jobId,
            artifact: {
              rowCount: input.result.rowCount,
              fileSizeBytes: input.result.fileSizeBytes ?? null,
              storageLocation: input.result.storageLocation ?? canonical.storageLocation,
              signedUrlExpiresAt:
                input.result.signedUrlExpiresAt ??
                canonical.signedUrlExpiresAt?.toISOString() ??
                null,
            },
            ...metadata,
          }),
        },
      });
    });
  }

  private async requireCanonicalExport(
    tx: Prisma.TransactionClient,
    input: CanonicalLookupInput
  ): Promise<ExportRecordSnapshot> {
    const canonical = await this.findCanonicalExport(tx, input);

    if (!canonical) {
      throw new NotFoundError(
        "Export not found for queued job",
        "export_job",
        input.jobId ?? "unknown"
      );
    }

    return canonical;
  }

  private async findCanonicalExport(
    tx: Prisma.TransactionClient,
    input: CanonicalLookupInput
  ): Promise<ExportRecordSnapshot | null> {
    const byJobId = input.jobId
      ? await tx.export.findMany({
          where: {
            tenantId: input.tenantId,
            metadata: { path: ["jobId"], equals: input.jobId },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        })
      : [];

    const byIdempotencyKey = input.idempotencyKey
      ? await tx.export.findMany({
          where: {
            tenantId: input.tenantId,
            metadata: { path: ["idempotencyKey"], equals: input.idempotencyKey },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        })
      : [];

    const candidates = [...byJobId, ...byIdempotencyKey].filter(
      (candidate, index, all) => all.findIndex((item) => item.id === candidate.id) === index
    ) as ExportRecordSnapshot[];

    if (candidates.length === 0) {
      return null;
    }

    const canonical = candidates[0]!;
    const duplicates = candidates.slice(1);

    if (duplicates.length > 0) {
      const dedupedAt = new Date().toISOString();
      for (const duplicate of duplicates) {
        await tx.export.update({
          where: { id: duplicate.id },
          data: {
            status: "failed",
            errorMessage: `Superseded duplicate export row by canonical export ${canonical.id}`,
            metadata: mergeMetadata(duplicate.metadata, {
              duplicateOfExportId: canonical.id,
              duplicateJobId: input.jobId ?? null,
              duplicateIdempotencyKey: input.idempotencyKey ?? null,
              dedupedAt,
            }),
          },
        });
      }
    }

    const canonicalMetadata = asMetadataObject(canonical.metadata);
    const needsLinkUpdate =
      (input.jobId && canonicalMetadata["jobId"] !== input.jobId) ||
      (input.idempotencyKey && canonicalMetadata["idempotencyKey"] !== input.idempotencyKey);

    if (!needsLinkUpdate) {
      return canonical;
    }

    return (await tx.export.update({
      where: { id: canonical.id },
      data: {
        metadata: mergeMetadata(canonical.metadata, {
          ...(input.jobId ? { jobId: input.jobId } : {}),
          ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
        }),
      },
    })) as ExportRecordSnapshot;
  }

  private async acquireExportLock(
    tx: Prisma.TransactionClient,
    tenantId: string,
    jobId?: string,
    idempotencyKey?: string
  ): Promise<void> {
    const lockKey = `export:${tenantId}:${jobId ?? "none"}:${idempotencyKey ?? "none"}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
  }
}
