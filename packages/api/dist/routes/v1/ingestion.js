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
        if (connectorType && await (0, kill_switches_1.isConnectorDisabled)(connectorType)) {
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
 * POST /api/v1/ingestion/upload
 * Upload CSV file for ingestion
 */
router.post("/upload", upload.single("file"), (0, usage_enforcement_1.checkIngestionLimit)(), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                error: "Bad Request",
                message: "CSV file is required",
                traceId: req.traceId,
            });
        }
        const { sourceId, columnMapping: columnMappingOverride } = req.body;
        const tenantId = req.tenantId;
        const userId = req.userId;
        const traceId = req.traceId || (0, uuid_1.v4)();
        // Parse CSV
        const { headers, rows } = (0, csv_importer_1.parseCSV)(file.buffer);
        if (!rows || rows.length === 0) {
            return res.status(400).json({
                error: "Bad Request",
                message: "CSV file is empty",
                traceId,
            });
        }
        // Auto-detect or use provided column mapping
        let columnMapping;
        if (columnMappingOverride) {
            columnMapping = JSON.parse(columnMappingOverride);
        }
        else {
            columnMapping = (0, csv_importer_1.autoDetectColumnMapping)(headers);
        }
        // Validate mapping
        const validation = (0, csv_importer_1.validateMapping)(columnMapping);
        if (!validation.valid) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Invalid column mapping",
                errors: validation.errors,
                detectedHeaders: headers,
                detectedMapping: columnMapping,
                traceId,
            });
        }
        // Create source if not provided
        let finalSourceId = sourceId;
        if (!finalSourceId) {
            const sourceResult = await (0, db_1.query)(`INSERT INTO ingestion_sources (
            id, tenant_id, user_id, name, type, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id`, [
                (0, uuid_1.v4)(),
                tenantId,
                userId,
                `CSV Import ${new Date().toISOString()}`,
                "csv",
                "active",
            ]);
            const firstResult = sourceResult[0];
            if (!firstResult || !firstResult.id) {
                throw new Error("Failed to create ingestion source");
            }
            finalSourceId = firstResult.id;
        }
        // Check kill switches
        if (await (0, kill_switches_1.isBackgroundJobPaused)('ingestion')) {
            return res.status(503).json({
                error: "Service Unavailable",
                message: "Ingestion jobs are currently paused",
                traceId,
            });
        }
        // Check background job limits
        const jobCheck = await (0, cost_controls_1.canRunBackgroundJob)('ingestion', tenantId);
        if (!jobCheck.allowed) {
            return res.status(429).json({
                error: "Too Many Requests",
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
            traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to process CSV upload", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
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
                metadata: typeof t.metadata === "string"
                    ? JSON.parse(t.metadata)
                    : t.metadata,
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
exports.default = router;
//# sourceMappingURL=ingestion.js.map