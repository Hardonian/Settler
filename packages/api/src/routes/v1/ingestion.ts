/**
 * Ingestion API Routes
 * Handles CSV uploads, connector management, and ingestion processing
 */

import { Router, Response } from "express";
import multer from "multer";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { logError, logInfo } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import {
  parseCSV,
  autoDetectColumnMapping,
  normalizeCSVRow,
  validateMapping,
  buildImportWorkbenchPreview,
} from "../../services/ingestion/csv-importer";
import {
  createIngestion,
  batchCreateNormalizedTransactions,
  createRawRecord,
  updateIngestionStatus,
} from "../../services/ingestion/ingestion-service";
import { query } from "../../db";
import { CSVColumnMapping } from "../../services/ingestion/types";
import { checkIngestionLimit } from "../../middleware/usage-enforcement";
import { trackIngestionUsage } from "../../utils/usage-tracking";
import { getBillingAccount } from "../../utils/billing-helpers";
import {
  isConnectorDisabled,
  isBackgroundJobPaused,
} from "../../services/operator-mode/kill-switches";
import { canRunBackgroundJob } from "../../services/operator-mode/cost-controls";
import { encrypt } from "../../infrastructure/security/encryption";

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/** Bounded parallelism for per-row DB work (raw_record + normalize); avoids unbounded Promise fan-out */
const CSV_ROW_INGEST_CONCURRENCY = 8;

async function processCsvRowsWithBoundedConcurrency(
  rowCount: number,
  concurrency: number,
  processRow: (index: number) => Promise<void>
): Promise<void> {
  const limit = Math.max(1, Math.min(concurrency, rowCount || 1));
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const i = next++;
      if (i >= rowCount) {
        return;
      }
      await processRow(i);
    }
  });
  await Promise.all(workers);
}

function parseColumnMappingOverride(rawValue: unknown): {
  mapping?: CSVColumnMapping;
  error?: string;
} {
  if (!rawValue) {
    return {};
  }

  if (typeof rawValue === "object") {
    return { mapping: rawValue as CSVColumnMapping };
  }

  if (typeof rawValue !== "string") {
    return { error: "columnMapping must be a JSON object or JSON string" };
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "columnMapping must be a JSON object" };
    }
    return { mapping: parsed as CSVColumnMapping };
  } catch {
    return { error: "columnMapping is not valid JSON" };
  }
}

async function loadSchemaDriftBaseline(
  tenantId: string,
  sourceId: string
): Promise<
  | {
      baseline?: { ingestionId: string; capturedAt: string; headers: string[] };
      history: Array<{ headers: string[]; hasDrift: boolean }>;
    }
  | undefined
> {
  const previous = await query(
    `SELECT id, completed_at, metadata
       FROM ingestions
      WHERE tenant_id = $1
        AND source_id = $2
        AND status = 'completed'
      ORDER BY completed_at DESC NULLS LAST, created_at DESC
      LIMIT 6`,
    [tenantId, sourceId]
  );

  if (previous.length === 0) {
    return undefined;
  }

  const parsed = previous
    .map((row) => {
      const record = row as Record<string, unknown>;
      const metadataValue = record.metadata;
      const metadata =
        typeof metadataValue === "string"
          ? (JSON.parse(metadataValue) as Record<string, unknown>)
          : (metadataValue as Record<string, unknown> | null);
      const workbench = (metadata?.importWorkbench || {}) as Record<string, unknown>;
      const sourceSummary = (workbench.sourceSummary || {}) as Record<string, unknown>;
      const headers = Array.isArray(sourceSummary.headers)
        ? sourceSummary.headers.filter((header): header is string => typeof header === "string")
        : [];

      if (headers.length === 0 || typeof record.id !== "string") {
        return null;
      }

      const schemaDriftValue = (workbench.schemaDrift || {}) as Record<string, unknown>;
      const hasDrift = Boolean(schemaDriftValue.hasDrift);
      return {
        ingestionId: record.id,
        capturedAt:
          record.completed_at instanceof Date
            ? record.completed_at.toISOString()
            : new Date().toISOString(),
        headers,
        hasDrift,
      };
    })
    .filter(
      (
        item
      ): item is {
        ingestionId: string;
        capturedAt: string;
        headers: string[];
        hasDrift: boolean;
      } => Boolean(item)
    );

  if (parsed.length === 0) {
    return undefined;
  }

  const [first, ...rest] = parsed;
  return {
    baseline: first
      ? {
          ingestionId: first.ingestionId,
          capturedAt: first.capturedAt,
          headers: first.headers,
        }
      : undefined,
    history: rest.map((item) => ({ headers: item.headers, hasDrift: item.hasDrift })),
  };
}

/**
 * POST /api/v1/ingestion/sources
 * Create a new ingestion source (connector or CSV)
 */
router.post(
  "/sources",
  enforceFreezeState(),
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, type, connectorType, config, configMetadata } = req.body;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      if (!name || !type) {
        return res.status(400).json({
          error: "Bad Request",
          message: "name and type are required",
          traceId: req.traceId,
        });
      }

      // Check kill switch for connector
      if (connectorType && (await isConnectorDisabled(connectorType))) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: `Connector ${connectorType} is currently disabled`,
          traceId: req.traceId,
        });
      }

      const sourceId = uuidv4();
      // Connector configs contain OAuth tokens and API keys — encrypt at rest with AES-256-GCM.
      const encryptedConfig = config ? encrypt(JSON.stringify(config)) : null;

      await query(
        `INSERT INTO ingestion_sources (
        id, tenant_id, user_id, name, type, connector_type,
        config_encrypted, config_metadata, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id`,
        [
          sourceId,
          tenantId,
          userId,
          name,
          type,
          connectorType || null,
          encryptedConfig,
          JSON.stringify(configMetadata || {}),
          "active",
        ]
      );

      logInfo("Created ingestion source", { sourceId, type, tenantId });

      return res.status(201).json({
        id: sourceId,
        name,
        type,
        connectorType,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      logError("Failed to create ingestion source", error, {
        traceId: req.traceId,
      });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create ingestion source",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * GET /api/v1/ingestion/sources
 * List ingestion sources
 */
router.get(
  "/sources",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;

      const sources = await query(
        `SELECT
        id, name, type, connector_type, status, last_sync_at,
        last_sync_status, created_at, updated_at
      FROM ingestion_sources
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC`,
        [tenantId]
      );

      return res.json({
        sources: sources.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          name: s.name as string,
          type: s.type as string,
          connectorType: s.connector_type as string | null,
          status: s.status as string,
          lastSyncAt: s.last_sync_at as Date | null,
          lastSyncStatus: s.last_sync_status as string | null,
          createdAt: s.created_at as Date,
          updatedAt: s.updated_at as Date,
        })),
      });
    } catch (error) {
      logError("Failed to list ingestion sources", error, {
        traceId: req.traceId,
      });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to list ingestion sources",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * POST /api/v1/ingestion/preview
 * Build truthful ingestion preview without persisting records
 */
router.post(
  "/preview",
  upload.single("file"),
  enforceFreezeState(),
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
          traceId: req.traceId,
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_CSV_REQUIRED",
          message: "CSV file is required",
          traceId: req.traceId,
        });
      }

      const traceId = req.traceId || uuidv4();
      const columnMappingOverride = req.body.columnMapping;

      let headers: string[] = [];
      let rows: Array<Record<string, string | number | null | undefined>> = [];

      try {
        const parsed = parseCSV(file.buffer);
        headers = parsed.headers;
        rows = parsed.rows;
      } catch (error) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_CSV_PARSE_FAILED",
          message: error instanceof Error ? error.message : "Invalid CSV payload",
          traceId,
        });
      }

      const mappingParse = parseColumnMappingOverride(columnMappingOverride);
      if (mappingParse.error) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_INVALID_COLUMN_MAPPING",
          message: mappingParse.error,
          traceId,
        });
      }

      const sourceId = typeof req.body.sourceId === "string" ? req.body.sourceId : undefined;
      const schemaDriftBaselineData = sourceId
        ? await loadSchemaDriftBaseline(tenantId, sourceId)
        : undefined;

      const preview = buildImportWorkbenchPreview({
        fileName: file.originalname,
        fileSizeBytes: file.size,
        headers,
        rows,
        providedMapping: mappingParse.mapping,
        schemaDriftBaseline: schemaDriftBaselineData?.baseline,
        schemaDriftHistory: schemaDriftBaselineData?.history,
        sourceProfile:
          typeof req.body.sourceProfile === "string" ? req.body.sourceProfile : undefined,
      });

      return res.status(200).json({
        preview,
        traceId,
      });
    } catch (error) {
      logError("Failed to build ingestion preview", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        code: "INGESTION_PREVIEW_FAILED",
        message: "Failed to build ingestion preview",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * POST /api/v1/ingestion/upload
 * Upload CSV file for ingestion
 */
router.post(
  "/upload",
  upload.single("file"),
  enforceFreezeState(),
  requirePermission(Permission.OPERATOR_WRITE),
  checkIngestionLimit(),
  async (req: AuthRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_CSV_REQUIRED",
          message: "CSV file is required",
          traceId: req.traceId,
        });
      }

      const { sourceId, columnMapping: columnMappingOverride } = req.body;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const traceId = req.traceId || uuidv4();

      if (!tenantId || !userId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant and user context are required",
          traceId,
        });
      }

      // Parse CSV
      let headers: string[] = [];
      let rows: Array<Record<string, string | number | null | undefined>> = [];
      try {
        const parsed = parseCSV(file.buffer);
        headers = parsed.headers;
        rows = parsed.rows;
      } catch (error) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_CSV_PARSE_FAILED",
          message: error instanceof Error ? error.message : "Invalid CSV payload",
          traceId,
        });
      }

      const mappingParse = parseColumnMappingOverride(columnMappingOverride);
      if (mappingParse.error) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_INVALID_COLUMN_MAPPING",
          message: mappingParse.error,
          traceId,
        });
      }

      // Auto-detect or use provided column mapping
      const columnMapping: CSVColumnMapping =
        mappingParse.mapping || autoDetectColumnMapping(headers);

      const schemaDriftBaselineData = sourceId
        ? await loadSchemaDriftBaseline(tenantId, sourceId)
        : undefined;

      const preview = buildImportWorkbenchPreview({
        fileName: file.originalname,
        fileSizeBytes: file.size,
        headers,
        rows,
        providedMapping: mappingParse.mapping,
        schemaDriftBaseline: schemaDriftBaselineData?.baseline,
        schemaDriftHistory: schemaDriftBaselineData?.history,
        sourceProfile:
          typeof req.body.sourceProfile === "string" ? req.body.sourceProfile : undefined,
      });

      // Validate mapping
      const validation = validateMapping(columnMapping);
      if (!validation.valid || !preview.canProceed) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_INVALID_COLUMN_MAPPING",
          message: "Import preview found blocking issues",
          errors: validation.errors,
          detectedHeaders: headers,
          detectedMapping: columnMapping,
          preview,
          traceId,
        });
      }

      // Create source if not provided
      let finalSourceId = sourceId;
      if (!finalSourceId) {
        const sourceResult = await query(
          `INSERT INTO ingestion_sources (
            id, tenant_id, user_id, name, type, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id`,
          [uuidv4(), tenantId, userId, `CSV Import ${new Date().toISOString()}`, "csv", "active"]
        );
        const firstResult = sourceResult[0];
        if (!firstResult || !firstResult.id) {
          throw new Error("Failed to create ingestion source");
        }
        finalSourceId = firstResult.id as string;
      }

      // Check kill switches
      if (await isBackgroundJobPaused("ingestion")) {
        return res.status(503).json({
          error: "Service Unavailable",
          code: "INGESTION_PAUSED",
          message: "Ingestion jobs are currently paused",
          traceId,
        });
      }

      // Check background job limits
      const jobCheck = await canRunBackgroundJob("ingestion", tenantId);
      if (!jobCheck.allowed) {
        return res.status(429).json({
          error: "Too Many Requests",
          code: "INGESTION_RATE_LIMITED",
          message: jobCheck.reason || "Background job limit exceeded",
          traceId,
        });
      }

      // Create ingestion job
      const ingestionId = await createIngestion({
        sourceId: finalSourceId,
        tenantId,
        userId,
        idempotencyKey: req.headers["idempotency-key"] as string | undefined,
        traceId,
      });

      // Process CSV rows
      type RowSlot =
        | { kind: "ok"; transaction: ReturnType<typeof normalizeCSVRow>; rawRecordId: string }
        | { kind: "fail" }
        | { kind: "empty" };

      const rowSlots: RowSlot[] = new Array(rows.length);
      await processCsvRowsWithBoundedConcurrency(
        rows.length,
        CSV_ROW_INGEST_CONCURRENCY,
        async (i) => {
          const row = rows[i];
          if (!row) {
            rowSlots[i] = { kind: "empty" };
            return;
          }
          try {
            const normalized = normalizeCSVRow(row, columnMapping);

            const rawRecordId = await createRawRecord(ingestionId, finalSourceId, tenantId, row, {
              rowNumber: i + 1,
              externalId: normalized.externalId,
            });

            rowSlots[i] = { kind: "ok", transaction: normalized, rawRecordId };
          } catch (error) {
            rowSlots[i] = { kind: "fail" };
            logError("Failed to normalize CSV row", error, {
              rowNumber: i + 1,
              traceId,
            });
          }
        }
      );

      const normalizedTransactions: Array<{
        transaction: any;
        rawRecordId?: string;
      }> = [];
      let failedCount = 0;
      for (const slot of rowSlots) {
        if (!slot) {
          continue;
        }
        if (slot.kind === "ok") {
          normalizedTransactions.push({
            transaction: slot.transaction,
            rawRecordId: slot.rawRecordId,
          });
        } else if (slot.kind === "fail" || slot.kind === "empty") {
          failedCount += 1;
        }
      }

      // Batch create normalized transactions
      const transactionIds = await batchCreateNormalizedTransactions(
        ingestionId,
        finalSourceId,
        tenantId,
        normalizedTransactions
      );

      // Update ingestion status
      await updateIngestionStatus(ingestionId, "completed", {
        rawRecordCount: rows.length,
        normalizedCount: transactionIds.length,
        failedCount,
        completedAt: new Date(),
      });

      await query(
        `UPDATE ingestions SET metadata = $2, updated_at = NOW() WHERE id = $1 AND tenant_id = $3`,
        [
          ingestionId,
          JSON.stringify({
            importWorkbench: {
              sourceSummary: preview.sourceSummary,
              mapping: preview.mapping,
              normalization: {
                attemptedRows: preview.normalization.attemptedRows,
                normalizedRows: preview.normalization.normalizedRows,
                failedRows: preview.normalization.failedRows,
                droppedRows: preview.normalization.droppedRows,
                defaultedFieldCounts: preview.normalization.defaultedFieldCounts,
              },
              qualityGates: preview.qualityGates,
              schemaDrift: preview.schemaDrift,
              sourceProfile: preview.sourceProfile,
              contract: preview.contract,
              diagnosticsSample: preview.diagnostics.slice(0, 25),
              diagnosticsSummary: {
                info: preview.diagnostics.filter((d) => d.severity === "info").length,
                warning: preview.diagnostics.filter((d) => d.severity === "warning").length,
                blocking: preview.diagnostics.filter((d) => d.severity === "blocking").length,
              },
            },
          }),
          tenantId,
        ]
      );

      // Track usage
      const billingAccount = await getBillingAccount(userId, tenantId);
      if (billingAccount) {
        await trackIngestionUsage({
          billingAccountId: billingAccount.id,
          userId,
          tenantId,
          ingestionId,
        });
      }

      logInfo("CSV ingestion completed", {
        ingestionId,
        totalRows: rows.length,
        normalizedCount: transactionIds.length,
        failedCount,
        traceId,
      });

      return res.status(201).json({
        ingestionId,
        sourceId: finalSourceId,
        totalRows: rows.length,
        normalizedCount: transactionIds.length,
        failedCount,
        columnMapping,
        preview: {
          sourceSummary: preview.sourceSummary,
          mapping: preview.mapping,
          normalization: preview.normalization,
          qualityGates: preview.qualityGates,
          schemaDrift: preview.schemaDrift,
          sourceProfile: preview.sourceProfile,
          diagnosticsSample: preview.diagnostics.slice(0, 25),
          contract: preview.contract,
          canProceed: preview.canProceed,
        },
        recovery: {
          retryEndpoint: `/api/v1/ingestion/${ingestionId}/retry`,
          retryPreviewEndpoint: `/api/v1/ingestion/${ingestionId}/retry?dryRun=true`,
        },
        traceId,
      });
    } catch (error) {
      logError("Failed to process CSV upload", error, {
        traceId: req.traceId,
      });
      return res.status(500).json({
        error: "Internal Server Error",
        code: "INGESTION_UPLOAD_FAILED",
        message: "Failed to process CSV upload",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * GET /api/v1/ingestion/:ingestionId
 * Get ingestion details
 */
router.get(
  "/:ingestionId",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { ingestionId } = req.params;
      const tenantId = req.tenantId!;

      const results = await query(
        `SELECT
        id, source_id, status, raw_record_count, normalized_count,
        failed_count, retry_count, trace_id, started_at, completed_at,
        error_message, metadata
      FROM ingestions
      WHERE id = $1 AND tenant_id = $2`,
        [ingestionId || "", tenantId]
      );

      if (results.length === 0) {
        return res.status(404).json({
          error: "Not Found",
          message: "Ingestion not found",
          traceId: req.traceId,
        });
      }

      const ingestion = results[0] as Record<string, unknown>;

      return res.json({
        id: ingestion.id as string,
        sourceId: ingestion.source_id as string,
        status: ingestion.status as string,
        rawRecordCount: ingestion.raw_record_count as number,
        normalizedCount: ingestion.normalized_count as number,
        failedCount: ingestion.failed_count as number,
        retryCount: ingestion.retry_count as number,
        traceId: ingestion.trace_id as string | null,
        startedAt: ingestion.started_at as Date,
        completedAt: ingestion.completed_at as Date | null,
        errorMessage: ingestion.error_message as string | null,
        metadata:
          typeof ingestion.metadata === "string"
            ? JSON.parse(ingestion.metadata)
            : ingestion.metadata,
      });
    } catch (error) {
      logError("Failed to get ingestion", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get ingestion",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * GET /api/v1/ingestion/:ingestionId/transactions
 * Get normalized transactions for an ingestion
 */
router.get(
  "/:ingestionId/transactions",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { ingestionId } = req.params;
      const tenantId = req.tenantId!;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await query(
        `SELECT
          id, external_id, amount, currency, date, description,
          category, payment_method, reference, metadata, created_at
        FROM normalized_transactions
        WHERE ingestion_id = $1 AND tenant_id = $2
        ORDER BY date DESC
        LIMIT $3 OFFSET $4`,
        [ingestionId || "", tenantId, limit.toString(), offset.toString()]
      );

      const totalResults = await query(
        `SELECT COUNT(*) as count
        FROM normalized_transactions
        WHERE ingestion_id = $1 AND tenant_id = $2`,
        [ingestionId || "", tenantId]
      );

      const firstTotalResult = totalResults[0];
      if (!firstTotalResult) {
        throw new Error("Failed to get transaction count");
      }
      const total = (firstTotalResult as { count: string }).count;

      return res.json({
        transactions: transactions.map((t: Record<string, unknown>) => ({
          id: t.id as string,
          externalId: t.external_id as string | null,
          amount: t.amount as number,
          currency: t.currency as string,
          date: t.date as Date,
          description: t.description as string | null,
          category: t.category as string | null,
          paymentMethod: t.payment_method as string | null,
          reference: t.reference as string | null,
          metadata: typeof t.metadata === "string" ? JSON.parse(t.metadata) : t.metadata,
          createdAt: t.created_at as Date,
        })),
        pagination: {
          limit,
          offset,
          total: parseInt(total),
        },
      });
    } catch (error) {
      logError("Failed to get transactions", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get transactions",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * GET /api/v1/ingestion/workbench/recent
 * Get recent ingestion workbench summaries for control-plane linking
 */
router.get(
  "/workbench/recent",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
          traceId: req.traceId,
        });
      }

      const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);
      const ingestions = await query(
        `SELECT id, source_id, status, completed_at, metadata
         FROM ingestions
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
        [tenantId, limit.toString()]
      );

      return res.json({
        items: ingestions.map((row: Record<string, unknown>) => {
          const metadata =
            typeof row.metadata === "string"
              ? (JSON.parse(row.metadata) as Record<string, unknown>)
              : (row.metadata as Record<string, unknown> | undefined) || {};
          const workbench = (metadata.importWorkbench || {}) as Record<string, unknown>;
          return {
            ingestionId: row.id as string,
            sourceId: row.source_id as string,
            status: row.status as string,
            completedAt: row.completed_at as Date | null,
            workbench,
            links: {
              ingestionDetail: `/api/v1/ingestion/${row.id as string}`,
              retry: `/api/v1/ingestion/${row.id as string}/retry`,
            },
          };
        }),
      });
    } catch (error) {
      logError("Failed to get recent ingestion workbench summaries", error, {
        traceId: req.traceId,
      });
      return res.status(500).json({
        error: "Internal Server Error",
        code: "INGESTION_WORKBENCH_RECENT_FAILED",
        message: "Failed to load recent ingestion workbench summaries",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * POST /api/v1/ingestion/:ingestionId/retry
 * Retry ingestion with remapped fields using original raw records
 */
router.post(
  "/:ingestionId/retry",
  enforceFreezeState(),
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      if (!tenantId || !userId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant and user context are required",
          traceId: req.traceId,
        });
      }

      const { ingestionId } = req.params;
      const mappingParse = parseColumnMappingOverride(req.body.columnMapping);
      if (mappingParse.error) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_INVALID_COLUMN_MAPPING",
          message: mappingParse.error,
          traceId: req.traceId,
        });
      }

      const dryRun = req.body.dryRun !== false;
      const originalRows = await query(
        `SELECT i.source_id, r.row_number, r.raw_data
         FROM ingestions i
         JOIN raw_records r ON r.ingestion_id = i.id
        WHERE i.id = $1 AND i.tenant_id = $2
        ORDER BY r.row_number ASC`,
        [ingestionId || "", tenantId]
      );

      if (originalRows.length === 0) {
        return res.status(404).json({
          error: "Not Found",
          code: "INGESTION_RETRY_SOURCE_NOT_FOUND",
          message: "No raw records found for ingestion retry",
          traceId: req.traceId,
        });
      }

      const first = originalRows[0] as Record<string, unknown>;
      const sourceId = first.source_id as string;
      const rows = originalRows.map((row: Record<string, unknown>) => {
        const value = row.raw_data;
        return typeof value === "string"
          ? (JSON.parse(value) as Record<string, string | number | null | undefined>)
          : (value as Record<string, string | number | null | undefined>);
      });
      const headers = Object.keys(rows[0] || {});

      const schemaDriftBaselineData = await loadSchemaDriftBaseline(tenantId, sourceId);
      const preview = buildImportWorkbenchPreview({
        fileName: `retry-${ingestionId}.csv`,
        fileSizeBytes: 0,
        headers,
        rows,
        providedMapping: mappingParse.mapping,
        schemaDriftBaseline: schemaDriftBaselineData?.baseline,
        schemaDriftHistory: schemaDriftBaselineData?.history,
      });

      if (dryRun) {
        return res.status(200).json({
          mode: "dry_run",
          preview,
          traceId: req.traceId,
        });
      }

      if (!preview.canProceed) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INGESTION_RETRY_BLOCKED",
          message: "Retry blocked by import workbench diagnostics",
          preview,
          traceId: req.traceId,
        });
      }

      const retryIngestionId = await createIngestion({
        sourceId,
        tenantId,
        userId,
        idempotencyKey: req.headers["idempotency-key"] as string | undefined,
        traceId: req.traceId,
        metadata: {
          retryOfIngestionId: ingestionId,
          importWorkbench: {
            sourceSummary: preview.sourceSummary,
            mapping: preview.mapping,
            normalization: preview.normalization,
            qualityGates: preview.qualityGates,
            schemaDrift: preview.schemaDrift,
            diagnosticsSample: preview.diagnostics.slice(0, 25),
            contract: preview.contract,
          },
        },
      });

      const columnMapping = mappingParse.mapping || autoDetectColumnMapping(headers);

      type RetrySlot =
        | { kind: "ok"; transaction: ReturnType<typeof normalizeCSVRow>; rawRecordId: string }
        | { kind: "fail"; rawRecordId: string }
        | { kind: "empty" };

      const retrySlots: RetrySlot[] = new Array(rows.length);
      await processCsvRowsWithBoundedConcurrency(
        rows.length,
        CSV_ROW_INGEST_CONCURRENCY,
        async (index) => {
          const row = rows[index];
          if (!row) {
            retrySlots[index] = { kind: "empty" };
            return;
          }

          const rowNumber = index + 1;
          const rawRecordId = await createRawRecord(retryIngestionId, sourceId, tenantId, row, {
            rowNumber,
          });

          try {
            const normalized = normalizeCSVRow(row, columnMapping);
            retrySlots[index] = { kind: "ok", transaction: normalized, rawRecordId };
          } catch {
            retrySlots[index] = { kind: "fail", rawRecordId };
            await query(
              `UPDATE raw_records SET status = 'failed', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
              [rawRecordId, tenantId]
            );
          }
        }
      );

      const normalizedTransactions: Array<{
        transaction: ReturnType<typeof normalizeCSVRow>;
        rawRecordId?: string;
      }> = [];
      let failedCount = 0;
      for (const slot of retrySlots) {
        if (!slot) {
          continue;
        }
        if (slot.kind === "ok") {
          normalizedTransactions.push({
            transaction: slot.transaction,
            rawRecordId: slot.rawRecordId,
          });
        } else if (slot.kind === "fail" || slot.kind === "empty") {
          failedCount += 1;
        }
      }

      const created = await batchCreateNormalizedTransactions(
        retryIngestionId,
        sourceId,
        tenantId,
        normalizedTransactions
      );

      await updateIngestionStatus(retryIngestionId, "completed", {
        rawRecordCount: rows.length,
        normalizedCount: created.length,
        failedCount,
        completedAt: new Date(),
      });

      return res.status(201).json({
        retryIngestionId,
        sourceIngestionId: ingestionId,
        normalizedCount: created.length,
        failedCount,
        preview,
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed ingestion retry", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        code: "INGESTION_RETRY_FAILED",
        message: "Failed to retry ingestion",
        traceId: req.traceId,
      });
    }
  }
);

export default router;
