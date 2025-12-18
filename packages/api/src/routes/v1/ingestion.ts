/**
 * Ingestion API Routes
 * Handles CSV uploads, connector management, and ingestion processing
 */

import { Router, Response } from "express";
import multer from "multer";
import { AuthRequest } from "../../middleware/auth";
import { logError, logInfo } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import {
  parseCSV,
  autoDetectColumnMapping,
  normalizeCSVRow,
  validateMapping,
} from "../../services/ingestion/csv-importer";
import {
  createIngestion,
  batchCreateNormalizedTransactions,
  createRawRecord,
  updateIngestionStatus,
} from "../../services/ingestion/ingestion-service";
import { query } from "../../db";
import { CSVColumnMapping } from "../../services/ingestion/types";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/v1/ingestion/sources
 * Create a new ingestion source (connector or CSV)
 */
router.post("/sources", async (req: AuthRequest, res: Response) => {
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

    const sourceId = uuidv4();
    const encryptedConfig = config ? JSON.stringify(config) : null; // TODO: Encrypt properly

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
});

/**
 * GET /api/v1/ingestion/sources
 * List ingestion sources
 */
router.get("/sources", async (req: AuthRequest, res: Response) => {
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
});

/**
 * POST /api/v1/ingestion/upload
 * Upload CSV file for ingestion
 */
router.post(
  "/upload",
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
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
      const tenantId = req.tenantId!;
      const userId = req.userId!;
      const traceId = req.traceId || uuidv4();

      // Parse CSV
      const { headers, rows } = parseCSV(file.buffer);
      if (!rows || rows.length === 0) {
        return res.status(400).json({
          error: "Bad Request",
          message: "CSV file is empty",
          traceId,
        });
      }

      // Auto-detect or use provided column mapping
      let columnMapping: CSVColumnMapping;
      if (columnMappingOverride) {
        columnMapping = JSON.parse(columnMappingOverride);
      } else {
        columnMapping = autoDetectColumnMapping(headers);
      }

      // Validate mapping
      const validation = validateMapping(columnMapping);
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
        const sourceResult = await query(
          `INSERT INTO ingestion_sources (
            id, tenant_id, user_id, name, type, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id`,
          [
            uuidv4(),
            tenantId,
            userId,
            `CSV Import ${new Date().toISOString()}`,
            "csv",
            "active",
          ]
        );
        const firstResult = sourceResult[0];
        if (!firstResult || !firstResult.id) {
          throw new Error("Failed to create ingestion source");
        }
        finalSourceId = firstResult.id as string;
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
      const normalizedTransactions: Array<{
        transaction: any;
        rawRecordId?: string;
      }> = [];
      let failedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        try {
          const normalized = normalizeCSVRow(row, columnMapping);

          // Create raw record
          const rawRecordId = await createRawRecord(
            ingestionId,
            finalSourceId,
            tenantId,
            row,
            {
              rowNumber: i + 1,
              externalId: normalized.externalId,
            }
          );

          normalizedTransactions.push({
            transaction: normalized,
            rawRecordId,
          });
        } catch (error) {
          failedCount++;
          logError("Failed to normalize CSV row", error, {
            rowNumber: i + 1,
            traceId,
          });
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
        traceId,
      });
    } catch (error) {
      logError("Failed to process CSV upload", error, {
        traceId: req.traceId,
      });
      return res.status(500).json({
        error: "Internal Server Error",
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
router.get("/:ingestionId", async (req: AuthRequest, res: Response) => {
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
      metadata: typeof ingestion.metadata === "string"
        ? JSON.parse(ingestion.metadata as string)
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
});

/**
 * GET /api/v1/ingestion/:ingestionId/transactions
 * Get normalized transactions for an ingestion
 */
router.get(
  "/:ingestionId/transactions",
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
          metadata:
            typeof t.metadata === "string"
              ? JSON.parse(t.metadata as string)
              : t.metadata,
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

export default router;
