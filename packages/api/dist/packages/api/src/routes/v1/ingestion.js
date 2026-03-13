"use strict";
/**
 * Ingestion API Routes
 * Handles CSV uploads, connector management, and ingestion processing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
const csv_importer_1 = require("../../services/ingestion/csv-importer");
const ingestion_service_1 = require("../../services/ingestion/ingestion-service");
const db_1 = require("../../db");
const usage_enforcement_1 = require("../../middleware/usage-enforcement");
const usage_tracking_1 = require("../../utils/usage-tracking");
const billing_helpers_1 = require("../../utils/billing-helpers");
const kill_switches_1 = require("../../services/operator-mode/kill-switches");
const cost_controls_1 = require("../../services/operator-mode/cost-controls");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
function parseColumnMappingOverride(rawValue) {
    if (!rawValue) {
        return {};
    }
    if (typeof rawValue === "object") {
        return { mapping: rawValue };
    }
    if (typeof rawValue !== "string") {
        return { error: "columnMapping must be a JSON object or JSON string" };
    }
    try {
        const parsed = JSON.parse(rawValue);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { error: "columnMapping must be a JSON object" };
        }
        return { mapping: parsed };
    }
    catch {
        return { error: "columnMapping is not valid JSON" };
    }
}
async function loadSchemaDriftBaseline(tenantId, sourceId) {
    const previous = await (0, db_1.query)(`SELECT id, completed_at, metadata
       FROM ingestions
      WHERE tenant_id = $1
        AND source_id = $2
        AND status = 'completed'
      ORDER BY completed_at DESC NULLS LAST, created_at DESC
      LIMIT 6`, [tenantId, sourceId]);
    if (previous.length === 0) {
        return undefined;
    }
    const parsed = previous
        .map((row) => {
        const record = row;
        const metadataValue = record.metadata;
        const metadata = typeof metadataValue === "string"
            ? JSON.parse(metadataValue)
            : metadataValue;
        const workbench = (metadata?.importWorkbench || {});
        const sourceSummary = (workbench.sourceSummary || {});
        const headers = Array.isArray(sourceSummary.headers)
            ? sourceSummary.headers.filter((header) => typeof header === "string")
            : [];
        if (headers.length === 0 || typeof record.id !== "string") {
            return null;
        }
        const schemaDriftValue = (workbench.schemaDrift || {});
        const hasDrift = Boolean(schemaDriftValue.hasDrift);
        return {
            ingestionId: record.id,
            capturedAt: record.completed_at instanceof Date
                ? record.completed_at.toISOString()
                : new Date().toISOString(),
            headers,
            hasDrift,
        };
    })
        .filter((item) => Boolean(item));
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
router.post("/sources", async (req, res) => {
    try {
        const { name, type, connectorType, config, configMetadata } = req.body;
        const tenantId = req.tenantId;
        const userId = req.userId;
        if (!name || !type) {
            return res.status(400).json({
                error: "Bad Request",
                message: "name and type are required",
                traceId: req.traceId,
            });
        }
        // Check kill switch for connector
        if (connectorType && (await (0, kill_switches_1.isConnectorDisabled)(connectorType))) {
            return res.status(503).json({
                error: "Service Unavailable",
                message: `Connector ${connectorType} is currently disabled`,
                traceId: req.traceId,
            });
        }
        const sourceId = (0, uuid_1.v4)();
        const encryptedConfig = config ? JSON.stringify(config) : null; // TODO: Encrypt properly
        await (0, db_1.query)(`INSERT INTO ingestion_sources (
        id, tenant_id, user_id, name, type, connector_type,
        config_encrypted, config_metadata, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id`, [
            sourceId,
            tenantId,
            userId,
            name,
            type,
            connectorType || null,
            encryptedConfig,
            JSON.stringify(configMetadata || {}),
            "active",
        ]);
        (0, logger_1.logInfo)("Created ingestion source", { sourceId, type, tenantId });
        return res.status(201).json({
            id: sourceId,
            name,
            type,
            connectorType,
            status: "active",
            createdAt: new Date().toISOString(),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create ingestion source", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create ingestion source",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/ingestion/sources
 * List ingestion sources
 */
router.get("/sources", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const sources = await (0, db_1.query)(`SELECT 
        id, name, type, connector_type, status, last_sync_at,
        last_sync_status, created_at, updated_at
      FROM ingestion_sources
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC`, [tenantId]);
        return res.json({
            sources: sources.map((s) => ({
                id: s.id,
                name: s.name,
                type: s.type,
                connectorType: s.connector_type,
                status: s.status,
                lastSyncAt: s.last_sync_at,
                lastSyncStatus: s.last_sync_status,
                createdAt: s.created_at,
                updatedAt: s.updated_at,
            })),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list ingestion sources", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to list ingestion sources",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/ingestion/preview
 * Build truthful ingestion preview without persisting records
 */
router.post("/preview", upload.single("file"), async (req, res) => {
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
        const traceId = req.traceId || (0, uuid_1.v4)();
        const columnMappingOverride = req.body.columnMapping;
        let headers = [];
        let rows = [];
        try {
            const parsed = (0, csv_importer_1.parseCSV)(file.buffer);
            headers = parsed.headers;
            rows = parsed.rows;
        }
        catch (error) {
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
        const preview = (0, csv_importer_1.buildImportWorkbenchPreview)({
            fileName: file.originalname,
            fileSizeBytes: file.size,
            headers,
            rows,
            providedMapping: mappingParse.mapping,
            schemaDriftBaseline: schemaDriftBaselineData?.baseline,
            schemaDriftHistory: schemaDriftBaselineData?.history,
            sourceProfile: typeof req.body.sourceProfile === "string" ? req.body.sourceProfile : undefined,
        });
        return res.status(200).json({
            preview,
            traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to build ingestion preview", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            code: "INGESTION_PREVIEW_FAILED",
            message: "Failed to build ingestion preview",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/ingestion/upload
 * Upload CSV file for ingestion
 */
router.post("/upload", upload.single("file"), (0, usage_enforcement_1.checkIngestionLimit)(), async (req, res) => {
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
        const traceId = req.traceId || (0, uuid_1.v4)();
        if (!tenantId || !userId) {
            return res.status(400).json({
                error: "Bad Request",
                code: "TENANT_CONTEXT_REQUIRED",
                message: "Tenant and user context are required",
                traceId,
            });
        }
        // Parse CSV
        let headers = [];
        let rows = [];
        try {
            const parsed = (0, csv_importer_1.parseCSV)(file.buffer);
            headers = parsed.headers;
            rows = parsed.rows;
        }
        catch (error) {
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
        const columnMapping = mappingParse.mapping || (0, csv_importer_1.autoDetectColumnMapping)(headers);
        const schemaDriftBaselineData = sourceId
            ? await loadSchemaDriftBaseline(tenantId, sourceId)
            : undefined;
        const preview = (0, csv_importer_1.buildImportWorkbenchPreview)({
            fileName: file.originalname,
            fileSizeBytes: file.size,
            headers,
            rows,
            providedMapping: mappingParse.mapping,
            schemaDriftBaseline: schemaDriftBaselineData?.baseline,
            schemaDriftHistory: schemaDriftBaselineData?.history,
            sourceProfile: typeof req.body.sourceProfile === "string" ? req.body.sourceProfile : undefined,
        });
        // Validate mapping
        const validation = (0, csv_importer_1.validateMapping)(columnMapping);
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
            const sourceResult = await (0, db_1.query)(`INSERT INTO ingestion_sources (
            id, tenant_id, user_id, name, type, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id`, [(0, uuid_1.v4)(), tenantId, userId, `CSV Import ${new Date().toISOString()}`, "csv", "active"]);
            const firstResult = sourceResult[0];
            if (!firstResult || !firstResult.id) {
                throw new Error("Failed to create ingestion source");
            }
            finalSourceId = firstResult.id;
        }
        // Check kill switches
        if (await (0, kill_switches_1.isBackgroundJobPaused)("ingestion")) {
            return res.status(503).json({
                error: "Service Unavailable",
                code: "INGESTION_PAUSED",
                message: "Ingestion jobs are currently paused",
                traceId,
            });
        }
        // Check background job limits
        const jobCheck = await (0, cost_controls_1.canRunBackgroundJob)("ingestion", tenantId);
        if (!jobCheck.allowed) {
            return res.status(429).json({
                error: "Too Many Requests",
                code: "INGESTION_RATE_LIMITED",
                message: jobCheck.reason || "Background job limit exceeded",
                traceId,
            });
        }
        // Create ingestion job
        const ingestionId = await (0, ingestion_service_1.createIngestion)({
            sourceId: finalSourceId,
            tenantId,
            userId,
            idempotencyKey: req.headers["idempotency-key"],
            traceId,
        });
        // Process CSV rows
        const normalizedTransactions = [];
        let failedCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row)
                continue;
            try {
                const normalized = (0, csv_importer_1.normalizeCSVRow)(row, columnMapping);
                // Create raw record
                const rawRecordId = await (0, ingestion_service_1.createRawRecord)(ingestionId, finalSourceId, tenantId, row, {
                    rowNumber: i + 1,
                    externalId: normalized.externalId,
                });
                normalizedTransactions.push({
                    transaction: normalized,
                    rawRecordId,
                });
            }
            catch (error) {
                failedCount++;
                (0, logger_1.logError)("Failed to normalize CSV row", error, {
                    rowNumber: i + 1,
                    traceId,
                });
            }
        }
        // Batch create normalized transactions
        const transactionIds = await (0, ingestion_service_1.batchCreateNormalizedTransactions)(ingestionId, finalSourceId, tenantId, normalizedTransactions);
        // Update ingestion status
        await (0, ingestion_service_1.updateIngestionStatus)(ingestionId, "completed", {
            rawRecordCount: rows.length,
            normalizedCount: transactionIds.length,
            failedCount,
            completedAt: new Date(),
        });
        await (0, db_1.query)(`UPDATE ingestions SET metadata = $2, updated_at = NOW() WHERE id = $1 AND tenant_id = $3`, [
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
        ]);
        // Track usage
        const billingAccount = await (0, billing_helpers_1.getBillingAccount)(userId, tenantId);
        if (billingAccount) {
            await (0, usage_tracking_1.trackIngestionUsage)({
                billingAccountId: billingAccount.id,
                userId,
                tenantId,
                ingestionId,
            });
        }
        (0, logger_1.logInfo)("CSV ingestion completed", {
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
    }
    catch (error) {
        (0, logger_1.logError)("Failed to process CSV upload", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            code: "INGESTION_UPLOAD_FAILED",
            message: "Failed to process CSV upload",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/ingestion/:ingestionId
 * Get ingestion details
 */
router.get("/:ingestionId", async (req, res) => {
    try {
        const { ingestionId } = req.params;
        const tenantId = req.tenantId;
        const results = await (0, db_1.query)(`SELECT 
        id, source_id, status, raw_record_count, normalized_count,
        failed_count, retry_count, trace_id, started_at, completed_at,
        error_message, metadata
      FROM ingestions
      WHERE id = $1 AND tenant_id = $2`, [ingestionId || "", tenantId]);
        if (results.length === 0) {
            return res.status(404).json({
                error: "Not Found",
                message: "Ingestion not found",
                traceId: req.traceId,
            });
        }
        const ingestion = results[0];
        return res.json({
            id: ingestion.id,
            sourceId: ingestion.source_id,
            status: ingestion.status,
            rawRecordCount: ingestion.raw_record_count,
            normalizedCount: ingestion.normalized_count,
            failedCount: ingestion.failed_count,
            retryCount: ingestion.retry_count,
            traceId: ingestion.trace_id,
            startedAt: ingestion.started_at,
            completedAt: ingestion.completed_at,
            errorMessage: ingestion.error_message,
            metadata: typeof ingestion.metadata === "string"
                ? JSON.parse(ingestion.metadata)
                : ingestion.metadata,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get ingestion", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get ingestion",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/ingestion/:ingestionId/transactions
 * Get normalized transactions for an ingestion
 */
router.get("/:ingestionId/transactions", async (req, res) => {
    try {
        const { ingestionId } = req.params;
        const tenantId = req.tenantId;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const transactions = await (0, db_1.query)(`SELECT 
          id, external_id, amount, currency, date, description,
          category, payment_method, reference, metadata, created_at
        FROM normalized_transactions
        WHERE ingestion_id = $1 AND tenant_id = $2
        ORDER BY date DESC
        LIMIT $3 OFFSET $4`, [ingestionId || "", tenantId, limit.toString(), offset.toString()]);
        const totalResults = await (0, db_1.query)(`SELECT COUNT(*) as count
        FROM normalized_transactions
        WHERE ingestion_id = $1 AND tenant_id = $2`, [ingestionId || "", tenantId]);
        const firstTotalResult = totalResults[0];
        if (!firstTotalResult) {
            throw new Error("Failed to get transaction count");
        }
        const total = firstTotalResult.count;
        return res.json({
            transactions: transactions.map((t) => ({
                id: t.id,
                externalId: t.external_id,
                amount: t.amount,
                currency: t.currency,
                date: t.date,
                description: t.description,
                category: t.category,
                paymentMethod: t.payment_method,
                reference: t.reference,
                metadata: typeof t.metadata === "string" ? JSON.parse(t.metadata) : t.metadata,
                createdAt: t.created_at,
            })),
            pagination: {
                limit,
                offset,
                total: parseInt(total),
            },
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get transactions", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get transactions",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/ingestion/workbench/recent
 * Get recent ingestion workbench summaries for control-plane linking
 */
router.get("/workbench/recent", async (req, res) => {
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
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
        const ingestions = await (0, db_1.query)(`SELECT id, source_id, status, completed_at, metadata
         FROM ingestions
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2`, [tenantId, limit.toString()]);
        return res.json({
            items: ingestions.map((row) => {
                const metadata = typeof row.metadata === "string"
                    ? JSON.parse(row.metadata)
                    : row.metadata || {};
                const workbench = (metadata.importWorkbench || {});
                return {
                    ingestionId: row.id,
                    sourceId: row.source_id,
                    status: row.status,
                    completedAt: row.completed_at,
                    workbench,
                    links: {
                        ingestionDetail: `/api/v1/ingestion/${row.id}`,
                        retry: `/api/v1/ingestion/${row.id}/retry`,
                    },
                };
            }),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get recent ingestion workbench summaries", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            code: "INGESTION_WORKBENCH_RECENT_FAILED",
            message: "Failed to load recent ingestion workbench summaries",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/ingestion/:ingestionId/retry
 * Retry ingestion with remapped fields using original raw records
 */
router.post("/:ingestionId/retry", async (req, res) => {
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
        const originalRows = await (0, db_1.query)(`SELECT i.source_id, r.row_number, r.raw_data
         FROM ingestions i
         JOIN raw_records r ON r.ingestion_id = i.id
        WHERE i.id = $1 AND i.tenant_id = $2
        ORDER BY r.row_number ASC`, [ingestionId || "", tenantId]);
        if (originalRows.length === 0) {
            return res.status(404).json({
                error: "Not Found",
                code: "INGESTION_RETRY_SOURCE_NOT_FOUND",
                message: "No raw records found for ingestion retry",
                traceId: req.traceId,
            });
        }
        const first = originalRows[0];
        const sourceId = first.source_id;
        const rows = originalRows.map((row) => {
            const value = row.raw_data;
            return typeof value === "string"
                ? JSON.parse(value)
                : value;
        });
        const headers = Object.keys(rows[0] || {});
        const schemaDriftBaselineData = await loadSchemaDriftBaseline(tenantId, sourceId);
        const preview = (0, csv_importer_1.buildImportWorkbenchPreview)({
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
        const retryIngestionId = await (0, ingestion_service_1.createIngestion)({
            sourceId,
            tenantId,
            userId,
            idempotencyKey: req.headers["idempotency-key"],
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
        const normalizedTransactions = [];
        let failedCount = 0;
        const columnMapping = mappingParse.mapping || (0, csv_importer_1.autoDetectColumnMapping)(headers);
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            if (!row) {
                failedCount += 1;
                continue;
            }
            const rowNumber = index + 1;
            const rawRecordId = await (0, ingestion_service_1.createRawRecord)(retryIngestionId, sourceId, tenantId, row, {
                rowNumber,
            });
            try {
                const normalized = (0, csv_importer_1.normalizeCSVRow)(row, columnMapping);
                normalizedTransactions.push({ transaction: normalized, rawRecordId });
            }
            catch {
                failedCount += 1;
                await (0, db_1.query)(`UPDATE raw_records SET status = 'failed', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`, [rawRecordId, tenantId]);
            }
        }
        const created = await (0, ingestion_service_1.batchCreateNormalizedTransactions)(retryIngestionId, sourceId, tenantId, normalizedTransactions);
        await (0, ingestion_service_1.updateIngestionStatus)(retryIngestionId, "completed", {
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
    }
    catch (error) {
        (0, logger_1.logError)("Failed ingestion retry", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            code: "INGESTION_RETRY_FAILED",
            message: "Failed to retry ingestion",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=ingestion.js.map