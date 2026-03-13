"use strict";
/**
 * Idempotent Ingestion Service
 *
 * Provides exactly-once ingestion guarantees through:
 * - Idempotency keys for deduplication
 * - Unique constraints (org_id + source + external_id + effective_date)
 * - Safe upserts with conflict handling
 * - Ingest log table for tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePayloadFingerprint = computePayloadFingerprint;
exports.checkIdempotency = checkIdempotency;
exports.recordIngestion = recordIngestion;
exports.updateIngestionStatus = updateIngestionStatus;
exports.getIdempotencyRecord = getIdempotencyRecord;
exports.listIdempotencyRecords = listIdempotencyRecords;
exports.upsertNormalizedTransaction = upsertNormalizedTransaction;
exports.batchUpsertNormalizedTransactions = batchUpsertNormalizedTransactions;
const node_crypto_1 = require("node:crypto");
const uuid_1 = require("uuid");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const canonical_input_1 = require("./canonical-input");
/**
 * Compute payload fingerprint
 */
function computePayloadFingerprint(payload) {
    const canonicalJson = (0, canonical_input_1.stableStringify)(payload);
    return (0, node_crypto_1.createHash)('sha256').update(canonicalJson).digest('hex');
}
/**
 * Check if ingestion is a duplicate
 */
async function checkIdempotency(request) {
    const { tenant_id, source_id, idempotency_key, payload, effective_date } = request;
    try {
        // If idempotency key provided, check by key
        if (idempotency_key) {
            const existingByKey = await (0, db_1.query)(`SELECT id, ingestion_id, status 
         FROM ingestion_idempotency 
         WHERE tenant_id = $1 AND source_id = $2 AND idempotency_key = $3`, [tenant_id, source_id, idempotency_key]);
            if (existingByKey.length > 0) {
                const record = existingByKey[0];
                return {
                    is_duplicate: true,
                    existing_record_id: record.id,
                    existing_ingestion_id: record.ingestion_id || undefined,
                    action: record.status === 'completed' ? 'skip' : 'conflict',
                    reason: `Duplicate idempotency key: ${idempotency_key}`,
                };
            }
        }
        // If payload provided, check by fingerprint + effective date
        if (payload) {
            const payloadFingerprint = computePayloadFingerprint(payload);
            const existingByPayload = await (0, db_1.query)(`SELECT id, ingestion_id, status 
         FROM ingestion_idempotency 
         WHERE tenant_id = $1 AND source_id = $2 AND payload_fingerprint = $3`, [tenant_id, source_id, payloadFingerprint]);
            if (existingByPayload.length > 0) {
                const record = existingByPayload[0];
                // Update last_seen_at
                await (0, db_1.query)(`UPDATE ingestion_idempotency 
           SET last_seen_at = NOW() 
           WHERE id = $1`, [record.id]);
                return {
                    is_duplicate: true,
                    existing_record_id: record.id,
                    existing_ingestion_id: record.ingestion_id || undefined,
                    action: record.status === 'completed' ? 'skip' : 'conflict',
                    reason: `Duplicate payload fingerprint: ${payloadFingerprint.substring(0, 8)}...`,
                };
            }
        }
        return {
            is_duplicate: false,
            action: 'proceed',
            reason: 'No existing record found, proceeding with ingestion',
        };
    }
    catch (error) {
        (0, logger_1.logError)('Failed to check idempotency', error, { request });
        // On error, allow proceed (fail-open for availability)
        return {
            is_duplicate: false,
            action: 'proceed',
            reason: 'Error checking idempotency, proceeding (fail-open)',
        };
    }
}
/**
 * Record ingestion for idempotency tracking
 */
async function recordIngestion(request) {
    const { tenant_id, source_id, source_type, idempotency_key, payload, run_id, ingestion_id, status, metadata, } = request;
    const idempotencyId = (0, uuid_1.v4)();
    const payloadFingerprint = payload ? computePayloadFingerprint(payload) : '';
    const effectiveIdempotencyKey = idempotency_key || `auto-${payloadFingerprint.substring(0, 8)}`;
    try {
        await (0, db_1.query)(`INSERT INTO ingestion_idempotency (
        id, tenant_id, idempotency_key, source_id, source_type,
        payload_fingerprint, run_id, ingestion_id, status, metadata,
        first_seen_at, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`, [
            idempotencyId,
            tenant_id,
            effectiveIdempotencyKey,
            source_id,
            source_type,
            payloadFingerprint,
            run_id || null,
            ingestion_id || null,
            status,
            (0, canonical_input_1.stableStringify)(metadata || {}),
        ]);
        (0, logger_1.logInfo)('Recorded ingestion idempotency', {
            idempotencyId,
            idempotencyKey: effectiveIdempotencyKey,
            sourceId: source_id,
            status,
        });
        return {
            id: idempotencyId,
            tenant_id,
            idempotency_key: effectiveIdempotencyKey,
            source_id,
            source_type,
            payload_fingerprint: payloadFingerprint,
            first_seen_at: new Date(),
            last_seen_at: new Date(),
            run_id,
            ingestion_id,
            status,
            metadata: metadata || {},
        };
    }
    catch (error) {
        // Check for unique constraint violation
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
            (0, logger_1.logInfo)('Ingestion already recorded (duplicate key)', {
                idempotencyKey: effectiveIdempotencyKey,
                sourceId: source_id,
            });
            // Return existing record
            const existing = await (0, db_1.query)(`SELECT * FROM ingestion_idempotency 
         WHERE tenant_id = $1 AND source_id = $2 AND idempotency_key = $3`, [tenant_id, source_id, effectiveIdempotencyKey]);
            if (existing.length > 0) {
                return mapRowToIdempotency(existing[0]);
            }
        }
        (0, logger_1.logError)('Failed to record ingestion idempotency', error, { request });
        throw error;
    }
}
/**
 * Update ingestion status
 */
async function updateIngestionStatus(idempotencyId, status, ingestionId) {
    try {
        await (0, db_1.query)(`UPDATE ingestion_idempotency 
       SET status = $1, ingestion_id = COALESCE($2, ingestion_id), last_seen_at = NOW() 
       WHERE id = $3`, [status, ingestionId || null, idempotencyId]);
        (0, logger_1.logInfo)('Updated ingestion idempotency status', { idempotencyId, status });
    }
    catch (error) {
        (0, logger_1.logError)('Failed to update ingestion status', error, { idempotencyId, status });
        throw error;
    }
}
/**
 * Get idempotency record by ID
 */
async function getIdempotencyRecord(idempotencyId) {
    try {
        const results = await (0, db_1.query)(`SELECT * FROM ingestion_idempotency WHERE id = $1`, [idempotencyId]);
        if (results.length === 0) {
            return null;
        }
        return mapRowToIdempotency(results[0]);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get idempotency record', error, { idempotencyId });
        throw error;
    }
}
/**
 * List idempotency records for a source
 */
async function listIdempotencyRecords(tenantId, sourceId, limit = 100) {
    try {
        const results = await (0, db_1.query)(`SELECT * FROM ingestion_idempotency 
       WHERE tenant_id = $1 AND source_id = $2
       ORDER BY first_seen_at DESC
       LIMIT $3`, [tenantId, sourceId, limit]);
        return results.map(row => mapRowToIdempotency(row));
    }
    catch (error) {
        (0, logger_1.logError)('Failed to list idempotency records', error, { tenantId, sourceId });
        throw error;
    }
}
/**
 * Safe upsert for normalized transactions
 * Uses unique constraint to prevent duplicates
 */
async function upsertNormalizedTransaction(tenantId, sourceId, externalId, date, transactionData) {
    const effectiveDate = new Date(date);
    const dateStr = effectiveDate.toISOString().split('T')[0] ?? '';
    try {
        // Try to insert
        const transactionId = (0, uuid_1.v4)();
        await (0, db_1.query)(`INSERT INTO normalized_transactions (
        id, tenant_id, source_id, external_id, date,
        amount, currency, description, category, payment_method, reference, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT DO NOTHING`, [
            transactionId,
            tenantId,
            sourceId,
            externalId,
            effectiveDate,
            transactionData.amount,
            transactionData.currency,
            transactionData.description || null,
            transactionData.category || null,
            transactionData.payment_method || null,
            transactionData.reference || null,
            (0, canonical_input_1.stableStringify)(transactionData.metadata || {}),
        ]);
        // Check if insert succeeded
        const existing = await (0, db_1.query)(`SELECT id FROM normalized_transactions 
       WHERE tenant_id = $1 AND source_id = $2 AND external_id = $3 AND DATE(date) = $4`, [tenantId, sourceId, externalId, dateStr]);
        if (existing.length > 0) {
            return {
                id: existing[0].id,
                created: false,
            };
        }
        return {
            id: transactionId,
            created: true,
        };
    }
    catch (error) {
        (0, logger_1.logError)('Failed to upsert normalized transaction', error, {
            tenantId,
            sourceId,
            externalId,
        });
        // Try to fetch existing on error
        const existing = await (0, db_1.query)(`SELECT id FROM normalized_transactions 
       WHERE tenant_id = $1 AND source_id = $2 AND external_id = $3 AND DATE(date) = $4`, [tenantId, sourceId, externalId, dateStr]);
        if (existing.length > 0) {
            return {
                id: existing[0].id,
                created: false,
            };
        }
        throw error;
    }
}
/**
 * Batch upsert normalized transactions
 */
async function batchUpsertNormalizedTransactions(tenantId, sourceId, transactions) {
    let successCount = 0;
    let duplicateCount = 0;
    for (const tx of transactions) {
        try {
            const result = await upsertNormalizedTransaction(tenantId, sourceId, tx.externalId, tx.date, tx);
            if (result.created) {
                successCount++;
            }
            else {
                duplicateCount++;
            }
        }
        catch (error) {
            (0, logger_1.logError)('Failed to upsert transaction in batch', error, { externalId: tx.externalId });
            duplicateCount++;
        }
    }
    return {
        success_count: successCount,
        duplicate_count: duplicateCount,
    };
}
/**
 * Map database row to IngestionIdempotency
 */
function mapRowToIdempotency(row) {
    return {
        id: row.id,
        tenant_id: row.tenant_id,
        idempotency_key: row.idempotency_key,
        source_id: row.source_id,
        source_type: row.source_type,
        payload_fingerprint: row.payload_fingerprint,
        first_seen_at: row.first_seen_at,
        last_seen_at: row.last_seen_at,
        run_id: row.run_id,
        ingestion_id: row.ingestion_id,
        status: row.status,
        metadata: typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata || {},
    };
}
//# sourceMappingURL=idempotent-ingestion.js.map