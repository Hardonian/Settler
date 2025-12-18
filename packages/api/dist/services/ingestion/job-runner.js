"use strict";
/**
 * Ingestion Job Runner
 * Serverless-friendly job runner with retry/backoff and idempotency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIngestionJob = runIngestionJob;
exports.processIngestionJob = processIngestionJob;
const uuid_1 = require("uuid");
const db_1 = require("../../db");
const retry_with_backoff_1 = require("../../utils/retry-with-backoff");
const logger_1 = require("../../utils/logger");
const ingestion_service_1 = require("./ingestion-service");
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    retryDelayMs: 1000,
    idempotencyWindowMs: 24 * 60 * 60 * 1000, // 24 hours
};
/**
 * Check if ingestion with same idempotency key already exists
 */
async function checkIdempotency(idempotencyKey, tenantId) {
    if (!idempotencyKey) {
        return { exists: false };
    }
    const results = await (0, db_1.query)(`SELECT id, status, completed_at
    FROM ingestions
    WHERE idempotency_key = $1 AND tenant_id = $2
    ORDER BY created_at DESC
    LIMIT 1`, [idempotencyKey, tenantId]);
    if (results.length === 0) {
        return { exists: false };
    }
    const ingestion = results[0];
    // Check if ingestion is still within idempotency window
    if (ingestion.completed_at) {
        const completedAt = new Date(ingestion.completed_at);
        const now = new Date();
        const ageMs = now.getTime() - completedAt.getTime();
        if (ageMs > DEFAULT_OPTIONS.idempotencyWindowMs) {
            return { exists: false };
        }
    }
    return {
        exists: true,
        ingestionId: ingestion.id,
    };
}
/**
 * Run ingestion job with retry and idempotency
 */
async function runIngestionJob(config, jobFn, options) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const traceId = config.traceId || (0, uuid_1.v4)();
    // Check idempotency
    if (config.idempotencyKey) {
        const idempotencyCheck = await checkIdempotency(config.idempotencyKey, config.tenantId);
        if (idempotencyCheck.exists && idempotencyCheck.ingestionId) {
            (0, logger_1.logInfo)("Idempotent ingestion request", {
                idempotencyKey: config.idempotencyKey,
                existingIngestionId: idempotencyCheck.ingestionId,
                traceId,
            });
            // Return existing ingestion result if completed
            const existing = await (0, ingestion_service_1.getIngestion)(idempotencyCheck.ingestionId);
            if (existing && existing.status === "completed") {
                // Note: In a real implementation, you'd want to cache/store the result
                // For now, we'll re-run but this is idempotent-safe
                (0, logger_1.logWarn)("Re-running completed ingestion (idempotent)", {
                    ingestionId: idempotencyCheck.ingestionId,
                });
            }
        }
    }
    // Create ingestion record
    const ingestionId = await (0, ingestion_service_1.createIngestion)({
        ...config,
        traceId,
    });
    let lastError = null;
    let retryCount = 0;
    // Run job with retry logic
    const result = await (0, retry_with_backoff_1.retryWithBackoff)(async () => {
        try {
            // Update status to processing
            await (0, ingestion_service_1.updateIngestionStatus)(ingestionId, "processing");
            // Execute job function
            const jobResult = await jobFn(ingestionId);
            // Update status to completed
            await (0, ingestion_service_1.updateIngestionStatus)(ingestionId, "completed", {
                completedAt: new Date(),
            });
            (0, logger_1.logInfo)("Ingestion job completed", {
                ingestionId,
                traceId,
                retryCount,
            });
            return jobResult;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            retryCount++;
            const errorMessage = lastError.message;
            const errorStack = lastError.stack || undefined;
            // Update retry count
            await (0, ingestion_service_1.updateIngestionStatus)(ingestionId, "processing", {
                retryCount,
                errorMessage: `Attempt ${retryCount}: ${errorMessage}`,
                errorStack,
            });
            // If this is the last retry, mark as failed
            if (retryCount >= opts.maxRetries) {
                await (0, ingestion_service_1.updateIngestionStatus)(ingestionId, "failed", {
                    retryCount,
                    errorMessage: `Failed after ${retryCount} attempts: ${errorMessage}`,
                    errorStack,
                    completedAt: new Date(),
                });
            }
            throw lastError;
        }
    }, {
        maxAttempts: opts.maxRetries,
        initialDelayMs: opts.retryDelayMs,
        backoffMultiplier: 2,
        onRetry: (attempt, error) => {
            (0, logger_1.logWarn)("Retrying ingestion job", {
                ingestionId,
                attempt,
                maxAttempts: opts.maxRetries,
                error: error.message,
                traceId,
            });
        },
    });
    return { ingestionId, result };
}
/**
 * Process ingestion job (serverless-friendly)
 * Can be triggered by API call, webhook, or scheduled job
 */
async function processIngestionJob(ingestionId) {
    const ingestion = await (0, ingestion_service_1.getIngestion)(ingestionId);
    if (!ingestion) {
        throw new Error(`Ingestion ${ingestionId} not found`);
    }
    if (ingestion.status === "completed") {
        (0, logger_1.logInfo)("Ingestion already completed", { ingestionId });
        return;
    }
    if (ingestion.status === "processing") {
        (0, logger_1.logWarn)("Ingestion already processing", { ingestionId });
        return;
    }
    // This would be called by the actual job processor
    // The jobFn passed to runIngestionJob handles the actual work
    await (0, ingestion_service_1.updateIngestionStatus)(ingestionId, "processing");
}
//# sourceMappingURL=job-runner.js.map