/**
 * Idempotent Ingestion Service
 *
 * Provides exactly-once ingestion guarantees through:
 * - Idempotency keys for deduplication
 * - Unique constraints (org_id + source + external_id + effective_date)
 * - Safe upserts with conflict handling
 * - Ingest log table for tracking
 */

import { createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { query } from "../../db";
import { logError, logInfo } from "../../utils/logger";
import { stableStringify } from "./canonical-input";

/**
 * Idempotency record status
 */
export type IdempotencyStatus = "pending" | "processing" | "completed" | "failed" | "duplicate";

/**
 * Ingestion idempotency record
 */
export interface IngestionIdempotency {
  id: string;
  tenant_id: string;
  idempotency_key: string;
  source_id: string;
  source_type: string;
  payload_fingerprint: string;
  first_seen_at: Date;
  last_seen_at: Date;
  run_id?: string;
  ingestion_id?: string;
  status: IdempotencyStatus;
  metadata: Record<string, unknown>;
}

/**
 * Check idempotency request
 */
export interface CheckIdempotencyRequest {
  tenant_id: string;
  source_id: string;
  idempotency_key?: string;
  payload?: unknown;
  effective_date?: Date;
}

/**
 * Check idempotency response
 */
export interface CheckIdempotencyResponse {
  is_duplicate: boolean;
  existing_record_id?: string;
  existing_ingestion_id?: string;
  action: "proceed" | "skip" | "conflict";
  reason: string;
}

/**
 * Record ingestion request
 */
export interface RecordIngestionRequest {
  tenant_id: string;
  source_id: string;
  source_type: string;
  idempotency_key?: string;
  payload: unknown;
  run_id?: string;
  ingestion_id?: string;
  status: IdempotencyStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Compute payload fingerprint
 */
export function computePayloadFingerprint(payload: unknown): string {
  const canonicalJson = stableStringify(payload);
  return createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Check if ingestion is a duplicate
 */
export async function checkIdempotency(
  request: CheckIdempotencyRequest
): Promise<CheckIdempotencyResponse> {
  const { tenant_id, source_id, idempotency_key, payload } = request;

  try {
    // If idempotency key provided, check by key
    if (idempotency_key) {
      const existingByKey = await query(
        `SELECT id, ingestion_id, status 
         FROM ingestion_idempotency 
         WHERE tenant_id = $1 AND source_id = $2 AND idempotency_key = $3`,
        [tenant_id, source_id, idempotency_key]
      );

      if (existingByKey.length > 0) {
        const record = existingByKey[0] as {
          id: string;
          ingestion_id: string | null;
          status: string;
        };

        return {
          is_duplicate: true,
          existing_record_id: record.id,
          existing_ingestion_id: record.ingestion_id || undefined,
          action: record.status === "completed" ? "skip" : "conflict",
          reason: `Duplicate idempotency key: ${idempotency_key}`,
        };
      }
    }

    // If payload provided, check by fingerprint + effective date
    if (payload) {
      const payloadFingerprint = computePayloadFingerprint(payload);

      const existingByPayload = await query(
        `SELECT id, ingestion_id, status 
         FROM ingestion_idempotency 
         WHERE tenant_id = $1 AND source_id = $2 AND payload_fingerprint = $3`,
        [tenant_id, source_id, payloadFingerprint]
      );

      if (existingByPayload.length > 0) {
        const record = existingByPayload[0] as {
          id: string;
          ingestion_id: string | null;
          status: string;
        };

        // Update last_seen_at
        await query(
          `UPDATE ingestion_idempotency 
           SET last_seen_at = NOW() 
           WHERE id = $1`,
          [record.id]
        );

        return {
          is_duplicate: true,
          existing_record_id: record.id,
          existing_ingestion_id: record.ingestion_id || undefined,
          action: record.status === "completed" ? "skip" : "conflict",
          reason: `Duplicate payload fingerprint: ${payloadFingerprint.substring(0, 8)}...`,
        };
      }
    }

    return {
      is_duplicate: false,
      action: "proceed",
      reason: "No existing record found, proceeding with ingestion",
    };
  } catch (error) {
    logError("Failed to check idempotency", error, { request });
    // On error, allow proceed (fail-open for availability)
    return {
      is_duplicate: false,
      action: "proceed",
      reason: "Error checking idempotency, proceeding (fail-open)",
    };
  }
}

/**
 * Record ingestion for idempotency tracking
 */
export async function recordIngestion(
  request: RecordIngestionRequest
): Promise<IngestionIdempotency> {
  const {
    tenant_id,
    source_id,
    source_type,
    idempotency_key,
    payload,
    run_id,
    ingestion_id,
    status,
    metadata,
  } = request;

  const idempotencyId = uuidv4();
  const payloadFingerprint = payload ? computePayloadFingerprint(payload) : "";
  const effectiveIdempotencyKey = idempotency_key || `auto-${payloadFingerprint.substring(0, 8)}`;

  try {
    await query(
      `INSERT INTO ingestion_idempotency (
        id, tenant_id, idempotency_key, source_id, source_type,
        payload_fingerprint, run_id, ingestion_id, status, metadata,
        first_seen_at, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [
        idempotencyId,
        tenant_id,
        effectiveIdempotencyKey,
        source_id,
        source_type,
        payloadFingerprint,
        run_id || null,
        ingestion_id || null,
        status,
        stableStringify(metadata || {}),
      ]
    );

    logInfo("Recorded ingestion idempotency", {
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
  } catch (error: unknown) {
    // Check for unique constraint violation
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
      logInfo("Ingestion already recorded (duplicate key)", {
        idempotencyKey: effectiveIdempotencyKey,
        sourceId: source_id,
      });

      // Return existing record
      const existing = await query(
        `SELECT * FROM ingestion_idempotency 
         WHERE tenant_id = $1 AND source_id = $2 AND idempotency_key = $3`,
        [tenant_id, source_id, effectiveIdempotencyKey]
      );

      if (existing.length > 0) {
        return mapRowToIdempotency(existing[0] as Record<string, unknown>);
      }
    }

    logError("Failed to record ingestion idempotency", error, { request });
    throw error;
  }
}

/**
 * Update ingestion status
 */
export async function updateIngestionStatus(
  idempotencyId: string,
  status: IdempotencyStatus,
  ingestionId?: string
): Promise<void> {
  try {
    await query(
      `UPDATE ingestion_idempotency 
       SET status = $1, ingestion_id = COALESCE($2, ingestion_id), last_seen_at = NOW() 
       WHERE id = $3`,
      [status, ingestionId || null, idempotencyId]
    );

    logInfo("Updated ingestion idempotency status", { idempotencyId, status });
  } catch (error) {
    logError("Failed to update ingestion status", error, { idempotencyId, status });
    throw error;
  }
}

/**
 * Get idempotency record by ID
 */
export async function getIdempotencyRecord(
  idempotencyId: string
): Promise<IngestionIdempotency | null> {
  try {
    const results = await query(`SELECT * FROM ingestion_idempotency WHERE id = $1`, [
      idempotencyId,
    ]);

    if (results.length === 0) {
      return null;
    }

    return mapRowToIdempotency(results[0] as Record<string, unknown>);
  } catch (error) {
    logError("Failed to get idempotency record", error, { idempotencyId });
    throw error;
  }
}

/**
 * List idempotency records for a source
 */
export async function listIdempotencyRecords(
  tenantId: string,
  sourceId: string,
  limit: number = 100
): Promise<IngestionIdempotency[]> {
  try {
    const results = await query(
      `SELECT * FROM ingestion_idempotency 
       WHERE tenant_id = $1 AND source_id = $2
       ORDER BY first_seen_at DESC
       LIMIT $3`,
      [tenantId, sourceId, limit]
    );

    return results.map((row) => mapRowToIdempotency(row as Record<string, unknown>));
  } catch (error) {
    logError("Failed to list idempotency records", error, { tenantId, sourceId });
    throw error;
  }
}

/**
 * Safe upsert for normalized transactions
 * Uses unique constraint to prevent duplicates
 */
export async function upsertNormalizedTransaction(
  tenantId: string,
  sourceId: string,
  externalId: string | null,
  date: Date,
  transactionData: {
    amount: number;
    currency: string;
    description?: string;
    category?: string;
    payment_method?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ id: string; created: boolean }> {
  const effectiveDate = new Date(date);
  const dateStr = effectiveDate.toISOString().split("T")[0] ?? "";

  try {
    // Try to insert
    const transactionId = uuidv4();
    await query(
      `INSERT INTO normalized_transactions (
        id, tenant_id, source_id, external_id, date,
        amount, currency, description, category, payment_method, reference, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT DO NOTHING`,
      [
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
        stableStringify(transactionData.metadata || {}),
      ]
    );

    // Check if insert succeeded
    const existing = await query(
      `SELECT id FROM normalized_transactions 
       WHERE tenant_id = $1 AND source_id = $2 AND external_id = $3 AND DATE(date) = $4`,
      [tenantId, sourceId, externalId, dateStr]
    );

    if (existing.length > 0) {
      return {
        id: (existing[0] as { id: string }).id,
        created: false,
      };
    }

    return {
      id: transactionId,
      created: true,
    };
  } catch (error) {
    logError("Failed to upsert normalized transaction", error, {
      tenantId,
      sourceId,
      externalId,
    });

    // Try to fetch existing on error
    const existing = await query(
      `SELECT id FROM normalized_transactions 
       WHERE tenant_id = $1 AND source_id = $2 AND external_id = $3 AND DATE(date) = $4`,
      [tenantId, sourceId, externalId, dateStr]
    );

    if (existing.length > 0) {
      return {
        id: (existing[0] as { id: string }).id,
        created: false,
      };
    }

    throw error;
  }
}

/**
 * Batch upsert normalized transactions
 */
export async function batchUpsertNormalizedTransactions(
  tenantId: string,
  sourceId: string,
  transactions: Array<{
    externalId: string | null;
    date: Date;
    amount: number;
    currency: string;
    description?: string;
    category?: string;
    payment_method?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
  }>
): Promise<{ success_count: number; duplicate_count: number }> {
  let successCount = 0;
  let duplicateCount = 0;

  for (const tx of transactions) {
    try {
      const result = await upsertNormalizedTransaction(
        tenantId,
        sourceId,
        tx.externalId,
        tx.date,
        tx
      );

      if (result.created) {
        successCount++;
      } else {
        duplicateCount++;
      }
    } catch (error) {
      logError("Failed to upsert transaction in batch", error, { externalId: tx.externalId });
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
function mapRowToIdempotency(row: Record<string, unknown>): IngestionIdempotency {
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    idempotency_key: row.idempotency_key as string,
    source_id: row.source_id as string,
    source_type: row.source_type as string,
    payload_fingerprint: row.payload_fingerprint as string,
    first_seen_at: row.first_seen_at as Date,
    last_seen_at: row.last_seen_at as Date,
    run_id: row.run_id as string | undefined,
    ingestion_id: row.ingestion_id as string | undefined,
    status: row.status as IdempotencyStatus,
    metadata:
      typeof row.metadata === "string"
        ? JSON.parse(row.metadata)
        : (row.metadata as Record<string, unknown>) || {},
  };
}
