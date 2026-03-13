"use strict";
/**
 * Ingestion Service
 * Core service for managing ingestion pipeline
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIngestion = createIngestion;
exports.updateIngestionStatus = updateIngestionStatus;
exports.createRawRecord = createRawRecord;
exports.createNormalizedTransaction = createNormalizedTransaction;
exports.getIngestion = getIngestion;
exports.batchCreateNormalizedTransactions = batchCreateNormalizedTransactions;
const uuid_1 = require("uuid");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
/**
 * Create a new ingestion record
 */
async function createIngestion(config) {
    const ingestionId = (0, uuid_1.v4)();
    const traceId = config.traceId || (0, uuid_1.v4)();
    try {
        await (0, db_1.query)(`INSERT INTO ingestions (
        id, source_id, tenant_id, user_id, idempotency_key, status, 
        trace_id, raw_record_count, normalized_count, failed_count, 
        retry_count, metadata, started_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), NOW())
      RETURNING id`, [
            ingestionId,
            config.sourceId,
            config.tenantId,
            config.userId,
            config.idempotencyKey || null,
            "pending",
            traceId,
            0,
            0,
            0,
            0,
            JSON.stringify(config.metadata || {}),
        ]);
        (0, logger_1.logInfo)("Created ingestion", { ingestionId, sourceId: config.sourceId, traceId });
        return ingestionId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create ingestion", error, { config });
        throw error;
    }
}
/**
 * Update ingestion status
 */
async function updateIngestionStatus(ingestionId, status, updates) {
    const updateFields = ["status = $2", "updated_at = NOW()"];
    const params = [ingestionId, status];
    if (updates?.rawRecordCount !== undefined) {
        updateFields.push(`raw_record_count = $${params.length + 1}`);
        params.push(updates.rawRecordCount);
    }
    if (updates?.normalizedCount !== undefined) {
        updateFields.push(`normalized_count = $${params.length + 1}`);
        params.push(updates.normalizedCount);
    }
    if (updates?.failedCount !== undefined) {
        updateFields.push(`failed_count = $${params.length + 1}`);
        params.push(updates.failedCount);
    }
    if (updates?.retryCount !== undefined) {
        updateFields.push(`retry_count = $${params.length + 1}`);
        params.push(updates.retryCount);
    }
    if (updates?.errorMessage !== undefined) {
        updateFields.push(`error_message = $${params.length + 1}`);
        params.push(updates.errorMessage);
    }
    if (updates?.errorStack !== undefined) {
        updateFields.push(`error_stack = $${params.length + 1}`);
        params.push(updates.errorStack);
    }
    if (updates?.completedAt !== undefined) {
        updateFields.push(`completed_at = $${params.length + 1}`);
        params.push(updates.completedAt);
    }
    try {
        await (0, db_1.query)(`UPDATE ingestions SET ${updateFields.join(", ")} WHERE id = $1`, params);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update ingestion status", error, { ingestionId, status });
        throw error;
    }
}
/**
 * Create raw record
 */
async function createRawRecord(ingestionId, sourceId, tenantId, rawData, options) {
    const recordId = (0, uuid_1.v4)();
    try {
        await (0, db_1.query)(`INSERT INTO raw_records (
        id, ingestion_id, source_id, tenant_id, raw_data, row_number,
        external_id, status, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id`, [
            recordId,
            ingestionId,
            sourceId,
            tenantId,
            JSON.stringify(rawData),
            options?.rowNumber || null,
            options?.externalId || null,
            "pending",
            JSON.stringify({}),
        ]);
        return recordId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create raw record", error, { ingestionId });
        throw error;
    }
}
/**
 * Create normalized transaction
 */
async function createNormalizedTransaction(ingestionId, sourceId, tenantId, transaction, rawRecordId) {
    const transactionId = (0, uuid_1.v4)();
    try {
        await (0, db_1.query)(`INSERT INTO normalized_transactions (
        id, ingestion_id, raw_record_id, tenant_id, source_id, external_id,
        amount, currency, date, description, category, payment_method,
        reference, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING id`, [
            transactionId,
            ingestionId,
            rawRecordId || null,
            tenantId,
            sourceId,
            transaction.externalId || null,
            transaction.amount,
            transaction.currency,
            transaction.date,
            transaction.description || null,
            transaction.category || null,
            transaction.paymentMethod || null,
            transaction.reference || null,
            JSON.stringify(transaction.metadata || {}),
        ]);
        // Update raw record status if provided
        if (rawRecordId) {
            await (0, db_1.query)(`UPDATE raw_records SET status = 'normalized', updated_at = NOW() WHERE id = $1`, [rawRecordId]);
        }
        return transactionId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create normalized transaction", error, { ingestionId });
        throw error;
    }
}
/**
 * Get ingestion by ID
 */
async function getIngestion(ingestionId) {
    const results = await (0, db_1.query)(`SELECT 
      id, source_id, tenant_id, user_id, status, raw_record_count,
      normalized_count, failed_count, retry_count, trace_id,
      started_at, completed_at, error_message, metadata
    FROM ingestions
    WHERE id = $1`, [ingestionId]);
    if (results.length === 0) {
        return null;
    }
    const row = results[0];
    return {
        id: row.id,
        sourceId: row.source_id,
        tenantId: row.tenant_id,
        userId: row.user_id,
        status: row.status,
        rawRecordCount: row.raw_record_count,
        normalizedCount: row.normalized_count,
        failedCount: row.failed_count,
        retryCount: row.retry_count,
        traceId: row.trace_id,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        errorMessage: row.error_message,
        metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
    };
}
/**
 * Batch create normalized transactions (for performance)
 */
async function batchCreateNormalizedTransactions(ingestionId, sourceId, tenantId, transactions) {
    if (transactions.length === 0) {
        return [];
    }
    const transactionIds = [];
    // Use transaction for atomicity
    await (0, db_1.transaction)(async (client) => {
        for (const { transaction, rawRecordId } of transactions) {
            const transactionId = (0, uuid_1.v4)();
            transactionIds.push(transactionId);
            await client.query(`INSERT INTO normalized_transactions (
          id, ingestion_id, raw_record_id, tenant_id, source_id, external_id,
          amount, currency, date, description, category, payment_method,
          reference, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`, [
                transactionId,
                ingestionId,
                rawRecordId || null,
                tenantId,
                sourceId,
                transaction.externalId || null,
                transaction.amount,
                transaction.currency,
                transaction.date,
                transaction.description || null,
                transaction.category || null,
                transaction.paymentMethod || null,
                transaction.reference || null,
                JSON.stringify(transaction.metadata || {}),
            ]);
            // Update raw record status if provided
            if (rawRecordId) {
                await client.query(`UPDATE raw_records SET status = 'normalized', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`, [rawRecordId, tenantId]);
            }
        }
    });
    return transactionIds;
}
//# sourceMappingURL=ingestion-service.js.map