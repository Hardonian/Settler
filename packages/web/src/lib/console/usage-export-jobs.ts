import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/shared/db/prismaClient";
import { getBillingAccountOptimized } from "@/lib/db/query-optimizer";
import { appLogger } from "@/lib/utils/logger";
import {
  estimateTextPayloadBytes,
  recordUsageExportJobMetrics,
} from "@/lib/console/usage-observability";

export type UsageExportFormat = "csv" | "json";

export const USAGE_EXPORT_SYNC_ROW_LIMIT = 1000;
export const USAGE_EXPORT_MAX_ROWS = 250000;

const USAGE_EXPORT_BATCH_SIZE = 2000;
const USAGE_EXPORT_MAX_BATCHES_PER_TICK = 4;
const USAGE_EXPORT_DEDUPE_WINDOW_MS = 60 * 60 * 1000;
const USAGE_EXPORT_DOWNLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;
const USAGE_EXPORT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const USAGE_EXPORT_MAX_CHUNK_PAGE_SIZE = 10;
const USAGE_EXPORT_KIND = "usage-export-v1";

interface UsageExportCursor {
  timestampIso: string;
  id: string;
}

interface UsageExportMetadata {
  kind: string;
  version: number;
  requestHash: string;
  billingAccountId: string;
  tenantScopeId: string;
  userId: string;
  format: UsageExportFormat;
  days: number;
  startDateIso: string;
  endDateIso: string;
  totalRows: number;
  processedRows: number;
  chunkCount: number;
  batchCount: number;
  bytesWritten: number;
  failureCount: number;
  lastCursor: UsageExportCursor | null;
  createdAtIso: string;
  updatedAtIso: string;
  completedAtIso?: string;
  failedAtIso?: string;
  downloadTokenHash?: string;
  downloadTokenExpiresAtIso?: string;
}

interface UsageExportChunkRow {
  chunk_index: number;
  row_count: number;
  content: string;
}

interface AdvisoryLockRow {
  acquired: boolean;
}

interface UsageEventBatchRow {
  id: string;
  timestamp: Date;
  eventType: string;
  quantity: NumericLike;
  metadata: unknown | null;
}

interface DownloadTokenPayload {
  v: number;
  exportId: string;
  billingAccountId: string;
  userId: string;
  exp: number;
}

export interface UsageExportActor {
  billingAccountId: string;
  tenantScopeId: string;
}

export interface UsageExportRequestWindow {
  startDate: Date;
  endDate: Date;
  days: number;
}

export interface UsageExportJobResponse {
  exportId: string;
  format: UsageExportFormat;
  status: string;
  totalRows: number;
  processedRows: number;
  chunkCount: number;
  batchCount: number;
  days: number;
  pollUrl: string;
  downloadUrl: string | null;
  expiresAt: string | null;
  signedUrlExpiresAt: string | null;
  errorMessage: string | null;
  mode: "async";
}

type NumericLike = string | number | bigint | null | undefined;
type JsonObject = Record<string, unknown>;

export interface UsageExportRecord {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  format: string;
  status: string;
  signedUrl: string | null;
  signedUrlExpiresAt: Date | null;
  expiresAt: Date | null;
  rowCount: number | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  metadata: unknown;
  createdAt: Date;
}

function toNumeric(value: NumericLike): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return Number(value) || 0;
}

function asJsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonObject;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getDownloadSigningSecret(): string {
  const secret = process.env.EXPORT_SIGNING_KEY;
  if (!secret) {
    throw new Error("EXPORT_SIGNING_KEY is required for usage export downloads.");
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signDownloadToken(payload: DownloadTokenPayload): {
  token: string;
  tokenHash: string;
  expiresAtIso: string;
} {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", getDownloadSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
  const token = `${encodedPayload}.${signature}`;

  return {
    token,
    tokenHash: hashToken(token),
    expiresAtIso: new Date(payload.exp).toISOString(),
  };
}

function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getDownloadSigningSecret())
    .update(encodedPayload)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as DownloadTokenPayload;
    if (
      typeof parsed?.exportId !== "string" ||
      typeof parsed?.billingAccountId !== "string" ||
      typeof parsed?.userId !== "string" ||
      typeof parsed?.exp !== "number"
    ) {
      return null;
    }

    if (parsed.exp <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function parseMetadata(raw: unknown): UsageExportMetadata | null {
  const metadata = asJsonObject(raw);
  if (metadata.kind !== USAGE_EXPORT_KIND || metadata.version !== 1) {
    return null;
  }

  const candidate = metadata as unknown as UsageExportMetadata;

  if (
    typeof candidate.requestHash !== "string" ||
    typeof candidate.billingAccountId !== "string" ||
    typeof candidate.userId !== "string" ||
    typeof candidate.tenantScopeId !== "string" ||
    typeof candidate.format !== "string" ||
    typeof candidate.days !== "number" ||
    typeof candidate.startDateIso !== "string" ||
    typeof candidate.endDateIso !== "string"
  ) {
    return null;
  }

  return candidate;
}

function buildMetadata(
  actor: UsageExportActor,
  userId: string,
  format: UsageExportFormat,
  window: UsageExportRequestWindow,
  totalRows: number,
  requestHash: string
): UsageExportMetadata {
  const nowIso = new Date().toISOString();

  return {
    kind: USAGE_EXPORT_KIND,
    version: 1,
    requestHash,
    billingAccountId: actor.billingAccountId,
    tenantScopeId: actor.tenantScopeId,
    userId,
    format,
    days: window.days,
    startDateIso: window.startDate.toISOString(),
    endDateIso: window.endDate.toISOString(),
    totalRows,
    processedRows: 0,
    chunkCount: 0,
    batchCount: 0,
    bytesWritten: 0,
    failureCount: 0,
    lastCursor: null,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

function buildRequestHash(
  actor: UsageExportActor,
  userId: string,
  format: UsageExportFormat,
  window: UsageExportRequestWindow
): string {
  const windowStartDay = window.startDate.toISOString().slice(0, 10);
  const windowEndDay = window.endDate.toISOString().slice(0, 10);

  return createHash("sha256")
    .update(
      [
        actor.billingAccountId,
        actor.tenantScopeId,
        userId,
        format,
        String(window.days),
        windowStartDay,
        windowEndDay,
      ].join("|")
    )
    .digest("hex");
}

function getExportFileName(format: UsageExportFormat, window: UsageExportRequestWindow): string {
  const from = window.startDate.toISOString().slice(0, 10);
  const to = window.endDate.toISOString().slice(0, 10);
  return `settler-usage-${from}-to-${to}.${format}`;
}

function getPollPath(exportId: string): string {
  return `/api/console/usage/export/${exportId}`;
}

function getDownloadPath(exportId: string, token: string): string {
  return `/api/console/usage/export/${exportId}/download?token=${encodeURIComponent(token)}`;
}

export function isUsageExportSigningConfigured(): boolean {
  return Boolean(process.env.EXPORT_SIGNING_KEY);
}

function formatExportEvent(event: {
  timestamp: Date;
  eventType: string;
  quantity: NumericLike;
  metadata: unknown | null;
}): {
  timestamp: string;
  service: string;
  operation: string;
  quantity: number;
  status: "success" | "error";
  metadata: Record<string, unknown> | null;
} {
  const [service, ...operationParts] = event.eventType.split(/[:-]/);
  const metadata =
    event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
      ? (event.metadata as Record<string, unknown>)
      : null;

  const status =
    metadata &&
    (Object.prototype.hasOwnProperty.call(metadata, "error") || metadata.status === "error")
      ? "error"
      : "success";

  return {
    timestamp: event.timestamp.toISOString(),
    service: service || "unknown",
    operation: operationParts.length > 0 ? operationParts.join("-") : "unknown",
    quantity: toNumeric(event.quantity),
    status,
    metadata,
  };
}

function escapeCsv(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function encodeCsvRow(event: ReturnType<typeof formatExportEvent>): string {
  return [
    escapeCsv(event.timestamp),
    escapeCsv(event.service),
    escapeCsv(event.operation),
    event.quantity.toString(),
    escapeCsv(event.status),
  ].join(",");
}

function encodeChunk(
  format: UsageExportFormat,
  rows: ReturnType<typeof formatExportEvent>[]
): {
  payload: string;
  bytes: number;
} {
  const payload =
    format === "csv"
      ? rows.map((row) => encodeCsvRow(row)).join("\n")
      : rows.map((row) => JSON.stringify(row)).join(",\n");

  return {
    payload,
    bytes: estimateTextPayloadBytes(payload),
  };
}

async function acquireExportLock(exportId: string): Promise<boolean> {
  const rows = (await prisma.$queryRawUnsafe(
    `
      SELECT pg_try_advisory_lock((('x' || SUBSTRING(md5($1), 1, 16))::bit(64)::bigint)) AS acquired
    `,
    exportId
  )) as AdvisoryLockRow[];

  return rows[0]?.acquired === true;
}

async function releaseExportLock(exportId: string): Promise<void> {
  await prisma.$queryRawUnsafe(
    `
      SELECT pg_advisory_unlock((('x' || SUBSTRING(md5($1), 1, 16))::bit(64)::bigint))
    `,
    exportId
  );
}

async function writeChunk(
  exportId: string,
  tenantScopeId: string,
  billingAccountId: string,
  chunkIndex: number,
  rowCount: number,
  content: string
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO usage_export_chunks (
        export_id,
        tenant_id,
        billing_account_id,
        chunk_index,
        row_count,
        content
      ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::integer, $5::integer, $6::text)
      ON CONFLICT (export_id, chunk_index)
      DO UPDATE SET
        row_count = EXCLUDED.row_count,
        content = EXCLUDED.content
    `,
    exportId,
    tenantScopeId,
    billingAccountId,
    chunkIndex,
    rowCount,
    content
  );
}

export async function purgeUsageExportChunks(exportId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `DELETE FROM usage_export_chunks WHERE export_id = $1::uuid`,
    exportId
  );
}

export async function resolveUsageExportActor(userId: string): Promise<UsageExportActor | null> {
  const billingAccount = await getBillingAccountOptimized(userId, true);
  if (!billingAccount) {
    return null;
  }

  return {
    billingAccountId: billingAccount.id,
    tenantScopeId: billingAccount.tenantId ?? billingAccount.id,
  };
}

export async function countUsageRowsForWindow(
  actor: UsageExportActor,
  window: UsageExportRequestWindow
): Promise<number> {
  return prisma.usageEvent.count({
    where: {
      billingAccountId: actor.billingAccountId,
      timestamp: {
        gte: window.startDate,
        lte: window.endDate,
      },
    },
  });
}

async function findReusableExport(
  actor: UsageExportActor,
  userId: string,
  requestHash: string
): Promise<UsageExportRecord | null> {
  const dedupeFrom = new Date(Date.now() - USAGE_EXPORT_DEDUPE_WINDOW_MS);

  return prisma.export.findFirst({
    where: {
      tenantId: actor.tenantScopeId,
      userId,
      format: "usage_events",
      status: {
        in: ["pending", "processing", "completed"],
      },
      createdAt: {
        gte: dedupeFrom,
      },
      AND: [
        {
          metadata: {
            path: ["kind"],
            equals: USAGE_EXPORT_KIND,
          },
        },
        {
          metadata: {
            path: ["requestHash"],
            equals: requestHash,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

function toJobResponse(exportRecord: UsageExportRecord): UsageExportJobResponse {
  const metadata = parseMetadata(exportRecord.metadata);

  return {
    exportId: exportRecord.id,
    format: (metadata?.format || exportRecord.type) as UsageExportFormat,
    status: exportRecord.status,
    totalRows: metadata?.totalRows || exportRecord.rowCount || 0,
    processedRows: metadata?.processedRows || 0,
    chunkCount: metadata?.chunkCount || 0,
    batchCount: metadata?.batchCount || 0,
    days: metadata?.days || 0,
    pollUrl: getPollPath(exportRecord.id),
    downloadUrl:
      exportRecord.status === "completed" && exportRecord.signedUrl ? exportRecord.signedUrl : null,
    expiresAt: exportRecord.expiresAt ? exportRecord.expiresAt.toISOString() : null,
    signedUrlExpiresAt: exportRecord.signedUrlExpiresAt
      ? exportRecord.signedUrlExpiresAt.toISOString()
      : null,
    errorMessage: exportRecord.errorMessage,
    mode: "async",
  };
}

async function finalizeUsageExport(
  exportRecord: UsageExportRecord,
  metadata: UsageExportMetadata
): Promise<UsageExportRecord> {
  const tokenPayload: DownloadTokenPayload = {
    v: 1,
    exportId: exportRecord.id,
    billingAccountId: metadata.billingAccountId,
    userId: metadata.userId,
    exp: Date.now() + USAGE_EXPORT_DOWNLOAD_TOKEN_TTL_MS,
  };

  const signedToken = signDownloadToken(tokenPayload);
  const completedAt = new Date();

  const nextMetadata: UsageExportMetadata = {
    ...metadata,
    updatedAtIso: completedAt.toISOString(),
    completedAtIso: completedAt.toISOString(),
    downloadTokenHash: signedToken.tokenHash,
    downloadTokenExpiresAtIso: signedToken.expiresAtIso,
  };

  return prisma.export.update({
    where: { id: exportRecord.id },
    data: {
      status: "completed",
      rowCount: metadata.processedRows,
      fileSizeBytes: metadata.bytesWritten,
      signedUrl: getDownloadPath(exportRecord.id, signedToken.token),
      signedUrlExpiresAt: new Date(signedToken.expiresAtIso),
      expiresAt: new Date(Date.now() + USAGE_EXPORT_RETENTION_MS),
      metadata: nextMetadata as unknown as JsonObject,
      errorMessage: null,
    },
  });
}

export async function createUsageExportJob(input: {
  actor: UsageExportActor;
  userId: string;
  format: UsageExportFormat;
  window: UsageExportRequestWindow;
  totalRows: number;
}): Promise<UsageExportRecord> {
  const requestHash = buildRequestHash(input.actor, input.userId, input.format, input.window);
  const reusable = await findReusableExport(input.actor, input.userId, requestHash);

  if (reusable) {
    return reusable;
  }

  const metadata = buildMetadata(
    input.actor,
    input.userId,
    input.format,
    input.window,
    input.totalRows,
    requestHash
  );

  return prisma.export.create({
    data: {
      tenantId: input.actor.tenantScopeId,
      userId: input.userId,
      type: input.format,
      format: "usage_events",
      status: "pending",
      rowCount: input.totalRows,
      metadata: metadata as unknown as JsonObject,
    },
  });
}

export async function getUsageExportJobForActor(input: {
  exportId: string;
  actor: UsageExportActor;
  userId: string;
}): Promise<UsageExportRecord | null> {
  const exportRecord = await prisma.export.findFirst({
    where: {
      id: input.exportId,
      tenantId: input.actor.tenantScopeId,
      userId: input.userId,
      format: "usage_events",
      AND: [
        {
          metadata: {
            path: ["kind"],
            equals: USAGE_EXPORT_KIND,
          },
        },
        {
          metadata: {
            path: ["billingAccountId"],
            equals: input.actor.billingAccountId,
          },
        },
      ],
    },
  });

  return exportRecord;
}

async function fetchNextExportBatch(metadata: UsageExportMetadata): Promise<UsageEventBatchRow[]> {
  const baseWhere = {
    billingAccountId: metadata.billingAccountId,
    timestamp: {
      gte: new Date(metadata.startDateIso),
      lte: new Date(metadata.endDateIso),
    },
  } as Record<string, unknown>;

  const cursor = metadata.lastCursor;
  const where = cursor
    ? ({
        ...baseWhere,
        OR: [
          {
            timestamp: {
              lt: new Date(cursor.timestampIso),
            },
          },
          {
            AND: [
              {
                timestamp: new Date(cursor.timestampIso),
              },
              {
                id: {
                  lt: cursor.id,
                },
              },
            ],
          },
        ],
      } as Record<string, unknown>)
    : baseWhere;

  return (await prisma.usageEvent.findMany({
    where,
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    take: USAGE_EXPORT_BATCH_SIZE,
    select: {
      id: true,
      timestamp: true,
      eventType: true,
      quantity: true,
      metadata: true,
    },
  })) as UsageEventBatchRow[];
}

export async function advanceUsageExportJob(input: {
  exportId: string;
  actor: UsageExportActor;
  userId: string;
}): Promise<UsageExportRecord | null> {
  const lockAcquired = await acquireExportLock(input.exportId);
  if (!lockAcquired) {
    return getUsageExportJobForActor(input);
  }

  const startedAt = Date.now();

  try {
    const exportRecord = await getUsageExportJobForActor(input);
    if (!exportRecord) {
      return null;
    }

    if (exportRecord.status === "completed" || exportRecord.status === "failed") {
      return exportRecord;
    }

    const metadata = parseMetadata(exportRecord.metadata);
    if (!metadata) {
      throw new Error("Usage export metadata is missing or invalid.");
    }

    let mutableMetadata: UsageExportMetadata = {
      ...metadata,
      updatedAtIso: new Date().toISOString(),
    };

    let mutableExport = exportRecord;

    if (mutableExport.status === "pending") {
      mutableExport = await prisma.export.update({
        where: { id: mutableExport.id },
        data: {
          status: "processing",
          metadata: mutableMetadata as unknown as JsonObject,
        },
      });
    }

    for (let batchNo = 0; batchNo < USAGE_EXPORT_MAX_BATCHES_PER_TICK; batchNo++) {
      const batch = await fetchNextExportBatch(mutableMetadata);

      if (batch.length === 0) {
        mutableExport = await finalizeUsageExport(mutableExport, mutableMetadata);

        await recordUsageExportJobMetrics({
          status: "completed",
          format: mutableMetadata.format,
          rowCount: mutableMetadata.processedRows,
          durationMs: Date.now() - startedAt,
          batchCount: mutableMetadata.batchCount,
          bytesWritten: mutableMetadata.bytesWritten,
        });

        return mutableExport;
      }

      const formatted = batch.map((event) => formatExportEvent(event));
      const encoded = encodeChunk(mutableMetadata.format, formatted);
      await writeChunk(
        mutableExport.id,
        mutableMetadata.tenantScopeId,
        mutableMetadata.billingAccountId,
        mutableMetadata.chunkCount,
        formatted.length,
        encoded.payload
      );

      const last = batch[batch.length - 1];
      if (!last) {
        break;
      }

      mutableMetadata = {
        ...mutableMetadata,
        processedRows: mutableMetadata.processedRows + formatted.length,
        chunkCount: mutableMetadata.chunkCount + 1,
        batchCount: mutableMetadata.batchCount + 1,
        bytesWritten: mutableMetadata.bytesWritten + encoded.bytes,
        lastCursor: {
          timestampIso: last.timestamp.toISOString(),
          id: last.id,
        },
        updatedAtIso: new Date().toISOString(),
      };

      mutableExport = await prisma.export.update({
        where: { id: mutableExport.id },
        data: {
          status: "processing",
          metadata: mutableMetadata as unknown as JsonObject,
          rowCount: mutableMetadata.totalRows,
          fileSizeBytes: mutableMetadata.bytesWritten,
        },
      });
    }

    await recordUsageExportJobMetrics({
      status: "processing",
      format: mutableMetadata.format,
      rowCount: mutableMetadata.processedRows,
      durationMs: Date.now() - startedAt,
      batchCount: mutableMetadata.batchCount,
      bytesWritten: mutableMetadata.bytesWritten,
    });

    return mutableExport;
  } catch (error) {
    const failed = await getUsageExportJobForActor(input);
    const failedMetadata = parseMetadata(failed?.metadata);

    if (failed && failedMetadata) {
      const nextMetadata: UsageExportMetadata = {
        ...failedMetadata,
        failureCount: failedMetadata.failureCount + 1,
        failedAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString(),
      };

      await prisma.export.update({
        where: { id: failed.id },
        data: {
          status: "failed",
          metadata: nextMetadata as unknown as JsonObject,
          errorMessage: error instanceof Error ? error.message : "Usage export processing failed",
        },
      });

      await recordUsageExportJobMetrics({
        status: "failed",
        format: nextMetadata.format,
        rowCount: nextMetadata.processedRows,
        durationMs: Date.now() - startedAt,
        batchCount: nextMetadata.batchCount,
        bytesWritten: nextMetadata.bytesWritten,
      });
    }

    appLogger.error("[Usage Export Job] Failed to advance export job", error, {
      exportId: input.exportId,
    });

    return getUsageExportJobForActor(input);
  } finally {
    await releaseExportLock(input.exportId).catch(() => {
      // Lock release failures are non-fatal and will expire with the DB session.
    });
  }
}

export async function resetUsageExportJobForRetry(input: {
  exportRecord: UsageExportRecord;
  actor: UsageExportActor;
  userId: string;
}): Promise<UsageExportRecord> {
  const metadata = parseMetadata(input.exportRecord.metadata);
  if (!metadata) {
    throw new Error("Usage export metadata is missing or invalid.");
  }

  await purgeUsageExportChunks(input.exportRecord.id);

  const resetMetadata: UsageExportMetadata = {
    ...metadata,
    processedRows: 0,
    chunkCount: 0,
    batchCount: 0,
    bytesWritten: 0,
    failureCount: metadata.failureCount,
    lastCursor: null,
    updatedAtIso: new Date().toISOString(),
    completedAtIso: undefined,
    failedAtIso: undefined,
    downloadTokenHash: undefined,
    downloadTokenExpiresAtIso: undefined,
  };

  return prisma.export.update({
    where: {
      id: input.exportRecord.id,
    },
    data: {
      status: "pending",
      signedUrl: null,
      signedUrlExpiresAt: null,
      errorMessage: null,
      expiresAt: null,
      fileSizeBytes: 0,
      rowCount: metadata.totalRows,
      metadata: resetMetadata as unknown as JsonObject,
    },
  });
}

export async function verifyUsageExportDownloadAccess(input: {
  token: string;
  exportRecord: UsageExportRecord;
  actor: UsageExportActor;
  userId: string;
}): Promise<boolean> {
  const metadata = parseMetadata(input.exportRecord.metadata);
  if (!metadata) {
    return false;
  }

  const tokenPayload = verifyDownloadToken(input.token);
  if (!tokenPayload) {
    return false;
  }

  if (
    tokenPayload.exportId !== input.exportRecord.id ||
    tokenPayload.billingAccountId !== metadata.billingAccountId ||
    tokenPayload.userId !== input.userId
  ) {
    return false;
  }

  if (
    metadata.downloadTokenExpiresAtIso &&
    new Date(metadata.downloadTokenExpiresAtIso).getTime() < Date.now()
  ) {
    return false;
  }

  if (!metadata.downloadTokenHash) {
    return false;
  }

  return hashToken(input.token) === metadata.downloadTokenHash;
}

export async function listUsageExportChunkPage(
  exportId: string,
  pageSize: number,
  pageOffset: number
): Promise<UsageExportChunkRow[]> {
  const size = Math.max(1, Math.min(pageSize, USAGE_EXPORT_MAX_CHUNK_PAGE_SIZE));
  return (await prisma.$queryRawUnsafe(
    `
      SELECT chunk_index, row_count, content
      FROM usage_export_chunks
      WHERE export_id = $1::uuid
      ORDER BY chunk_index ASC
      LIMIT $2::integer
      OFFSET $3::integer
    `,
    exportId,
    size,
    pageOffset
  )) as UsageExportChunkRow[];
}

export async function cleanupExpiredUsageExportArtifacts(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `
        DELETE FROM usage_export_chunks
        WHERE export_id IN (
          SELECT id
          FROM exports
          WHERE format = 'usage_events'
            AND expires_at IS NOT NULL
            AND expires_at < NOW()
          LIMIT 200
        )
      `
    );

    await prisma.export.deleteMany({
      where: {
        format: "usage_events",
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    appLogger.warn("[Usage Export Job] Failed cleanup of expired export artifacts", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function formatUsageExportJobResponse(
  exportRecord: UsageExportRecord
): UsageExportJobResponse {
  return toJobResponse(exportRecord);
}

export async function buildSynchronousUsageExport(input: {
  actor: UsageExportActor;
  format: UsageExportFormat;
  window: UsageExportRequestWindow;
}): Promise<{
  content: string;
  rowCount: number;
  fileName: string;
  payloadBytes: number;
}> {
  const events = (await prisma.usageEvent.findMany({
    where: {
      billingAccountId: input.actor.billingAccountId,
      timestamp: {
        gte: input.window.startDate,
        lte: input.window.endDate,
      },
    },
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    take: USAGE_EXPORT_SYNC_ROW_LIMIT,
    select: {
      timestamp: true,
      eventType: true,
      quantity: true,
      metadata: true,
    },
  })) as UsageEventBatchRow[];

  const normalized = events.map((event: UsageEventBatchRow) => formatExportEvent(event));
  const content =
    input.format === "csv"
      ? [getUsageExportHeader("csv"), ...normalized.map((row) => encodeCsvRow(row))].join("\n")
      : JSON.stringify(normalized);

  return {
    content,
    rowCount: normalized.length,
    fileName: getExportFileName(input.format, input.window),
    payloadBytes: estimateTextPayloadBytes(content),
  };
}

export function getUsageExportHeader(format: UsageExportFormat): string {
  if (format === "csv") {
    return "Timestamp,Service,Operation,Quantity,Status";
  }

  return "[";
}

export function getUsageExportFileName(exportRecord: UsageExportRecord): string {
  const metadata = parseMetadata(exportRecord.metadata);
  if (!metadata) {
    return `settler-usage-export-${exportRecord.id}.${exportRecord.type}`;
  }

  const window: UsageExportRequestWindow = {
    startDate: new Date(metadata.startDateIso),
    endDate: new Date(metadata.endDateIso),
    days: metadata.days,
  };

  return getExportFileName(metadata.format, window);
}

export function isUsageExportRecord(exportRecord: UsageExportRecord): boolean {
  return parseMetadata(exportRecord.metadata) !== null;
}
