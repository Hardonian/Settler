"use strict";
/**
 * Reconciliation Matcher
 * Deterministic matching algorithm with ML enhancement fallback.
 * Uses proprietary ML models trained on historical matches for improved accuracy.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchTransaction = matchTransaction;
exports.runReconciliation = runReconciliation;
const uuid_1 = require("uuid");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const ml_matching_engine_1 = require("../matching/ml-matching-engine");
const enhanced_cross_customer_intelligence_1 = require("../matching/enhanced-cross-customer-intelligence");
const integrity_1 = require("../reconciliation/integrity");
const runtime_events_1 = require("../ops-intelligence/runtime-events");
const DEFAULT_CONFIG = {
    dateWindowDays: 7,
    amountTolerance: 0.01,
    fuzzyDescriptionThreshold: 0.8,
    requireExactAmount: false,
};
/**
 * Calculate Levenshtein distance (edit distance) between two strings
 */
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];
    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        const row = matrix[0];
        if (row) {
            row[j] = j;
        }
    }
    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        const row = matrix[i];
        const prevRow = matrix[i - 1];
        if (!row || !prevRow)
            continue;
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                row[j] = prevRow[j - 1] ?? 0;
            }
            else {
                row[j] = Math.min((prevRow[j] ?? 0) + 1, // deletion
                (row[j - 1] ?? 0) + 1, // insertion
                (prevRow[j - 1] ?? 0) + 1 // substitution
                );
            }
        }
    }
    return matrix[len1]?.[len2] ?? 0;
}
/**
 * Calculate similarity score between two strings (0-1)
 */
function stringSimilarity(str1, str2) {
    if (!str1 || !str2) {
        return 0;
    }
    const normalized1 = str1.toLowerCase().trim();
    const normalized2 = str2.toLowerCase().trim();
    if (normalized1 === normalized2) {
        return 1.0;
    }
    const maxLen = Math.max(normalized1.length, normalized2.length);
    if (maxLen === 0) {
        return 0;
    }
    const distance = levenshteinDistance(normalized1, normalized2);
    return 1 - distance / maxLen;
}
/**
 * Check if two amounts match within tolerance
 */
function amountsMatch(amount1, amount2, tolerance) {
    return Math.abs(amount1 - amount2) <= tolerance;
}
/**
 * Check if two dates are within window
 */
function datesWithinWindow(date1, date2, windowDays) {
    const diffMs = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= windowDays;
}
/**
 * Calculate days difference between two dates
 */
function daysDifference(date1, date2) {
    const diffMs = date1.getTime() - date2.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
/**
 * Match source transaction to target transactions
 *
 * INVARIANT: tenantId is required. All queries are scoped to the tenant boundary.
 */
async function matchTransaction(sourceTransactionId, targetTransactionIds, tenantId, config = {}) {
    if (!tenantId)
        throw new Error("tenantId is required for matchTransaction");
    const opts = { ...DEFAULT_CONFIG, ...config };
    // Get source transaction — scoped by tenant_id
    const sourceResults = await (0, db_1.query)(`SELECT id, amount, currency, date, description, external_id
    FROM normalized_transactions
    WHERE id = $1 AND tenant_id = $2`, [sourceTransactionId, tenantId]);
    if (sourceResults.length === 0) {
        throw new Error(`Source transaction ${sourceTransactionId} not found`);
    }
    const source = sourceResults[0];
    // Get target transactions
    if (targetTransactionIds.length === 0) {
        return {
            sourceTransactionId: source.id,
            matchType: "unmatched",
            confidence: 0,
            matchReason: "No target transactions available",
        };
    }
    const placeholders = targetTransactionIds.map((_, i) => `$${i + 3}`).join(", ");
    const targetResults = await (0, db_1.query)(`SELECT id, amount, currency, date, description, external_id
    FROM normalized_transactions
    WHERE id IN (${placeholders}) AND tenant_id = $2`, [sourceTransactionId, tenantId, ...targetTransactionIds]);
    const targets = targetResults;
    // Try exact match first (same external ID)
    if (source.external_id) {
        const exactMatch = targets.find((t) => t.external_id === source.external_id);
        if (exactMatch) {
            return {
                sourceTransactionId: source.id,
                targetTransactionId: exactMatch.id,
                matchType: "exact",
                confidence: 1.0,
                matchReason: "Exact external ID match",
                amountDiff: Math.abs(source.amount - exactMatch.amount),
                dateDiff: daysDifference(source.date, exactMatch.date),
            };
        }
    }
    // Try ML matching engine (proprietary, creates data moat)
    // This uses historical match data and cross-customer intelligence
    try {
        const sourceAdapter = await getSourceAdapter(sourceTransactionId, tenantId);
        const targetAdapters = await Promise.all(targetTransactionIds.map((id) => getSourceAdapter(id, tenantId)));
        // Use ML engine for first target adapter (most common case)
        if (targetAdapters.length > 0) {
            const mlPrediction = await ml_matching_engine_1.mlMatchingEngine.predictMatch(sourceTransactionId, targetTransactionIds, tenantId, sourceAdapter || "unknown", targetAdapters[0] || "unknown");
            if (mlPrediction && mlPrediction.confidence > 0.7) {
                // ML prediction is confident, use it
                const bestTarget = targets.find((t) => targetTransactionIds.includes(t.id));
                if (bestTarget) {
                    return {
                        sourceTransactionId: source.id,
                        targetTransactionId: bestTarget.id,
                        matchType: mlPrediction.matchType,
                        confidence: mlPrediction.confidence,
                        matchReason: `ML model prediction: ${mlPrediction.reasoning}`,
                        amountDiff: Math.abs(source.amount - bestTarget.amount),
                        dateDiff: daysDifference(source.date, bestTarget.date),
                    };
                }
            }
        }
    }
    catch (error) {
        // Fall back to deterministic algorithm if ML fails
        (0, logger_1.logError)("ML matching failed, falling back to deterministic", error);
    }
    // Filter by currency match
    const currencyMatchesFiltered = targets.filter((t) => t.currency === source.currency);
    if (currencyMatchesFiltered.length === 0) {
        return {
            sourceTransactionId: source.id,
            matchType: "unmatched",
            confidence: 0,
            matchReason: "No transactions with matching currency",
        };
    }
    // Filter by date window
    const dateWindowDays = opts.dateWindowDays ?? 7;
    const dateMatches = currencyMatchesFiltered.filter((t) => datesWithinWindow(source.date, t.date, dateWindowDays));
    if (dateMatches.length === 0) {
        return {
            sourceTransactionId: source.id,
            matchType: "unmatched",
            confidence: 0,
            matchReason: `No transactions within ${dateWindowDays} day window`,
        };
    }
    // Filter by amount match
    const amountTolerance = opts.amountTolerance ?? 0.01;
    const amountMatches = dateMatches.filter((t) => amountsMatch(source.amount, t.amount, amountTolerance));
    if (amountMatches.length === 0) {
        return {
            sourceTransactionId: source.id,
            matchType: "unmatched",
            confidence: 0,
            matchReason: `No transactions with matching amount (tolerance: ${amountTolerance})`,
        };
    }
    // If exact amount required, use only exact matches
    const candidates = opts.requireExactAmount
        ? amountMatches.filter((t) => t.amount === source.amount)
        : amountMatches;
    if (candidates.length === 0) {
        return {
            sourceTransactionId: source.id,
            matchType: "unmatched",
            confidence: 0,
            matchReason: "No exact amount matches found",
        };
    }
    // Score candidates by description similarity
    const fuzzyDescriptionThreshold = opts.fuzzyDescriptionThreshold ?? 0.8;
    const dateWindowDaysForScoring = opts.dateWindowDays ?? 7;
    const scoredCandidates = candidates.map((target) => {
        const descSimilarity = source.description && target.description
            ? stringSimilarity(source.description, target.description)
            : 0.5; // Default similarity if no description
        const dateDiff = daysDifference(source.date, target.date);
        const dateScore = 1 - Math.min(dateDiff / dateWindowDaysForScoring, 1);
        const amountDiff = Math.abs(source.amount - target.amount);
        const amountScore = amountDiff === 0 ? 1 : 1 - Math.min(amountDiff / source.amount, 1);
        // Weighted confidence score
        const confidence = descSimilarity * 0.5 + dateScore * 0.25 + amountScore * 0.25;
        return {
            target,
            confidence,
            descSimilarity,
            dateDiff,
            amountDiff,
        };
    });
    // Sort by confidence (highest first)
    scoredCandidates.sort((a, b) => b.confidence - a.confidence);
    const bestMatch = scoredCandidates[0];
    if (!bestMatch) {
        return {
            sourceTransactionId: source.id,
            matchType: "unmatched",
            confidence: 0,
            matchReason: "No matching candidates found",
        };
    }
    // Determine match type
    let matchType = "fuzzy";
    if (bestMatch.descSimilarity >= fuzzyDescriptionThreshold &&
        bestMatch.amountDiff === 0 &&
        bestMatch.dateDiff === 0) {
        matchType = "exact";
    }
    else if (bestMatch.confidence >= fuzzyDescriptionThreshold) {
        matchType = "fuzzy";
    }
    return {
        sourceTransactionId: source.id,
        targetTransactionId: bestMatch.target.id,
        matchType,
        confidence: bestMatch.confidence,
        matchReason: `Matched by amount (diff: ${bestMatch.amountDiff.toFixed(2)}), date (diff: ${bestMatch.dateDiff} days), description similarity: ${(bestMatch.descSimilarity * 100).toFixed(1)}%`,
        amountDiff: bestMatch.amountDiff,
        dateDiff: bestMatch.dateDiff,
    };
}
/**
 * Run reconciliation for an ingestion
 */
async function runReconciliation(ingestionId, tenantId, userId, config = {}) {
    const runId = (0, uuid_1.v4)();
    const traceId = (0, uuid_1.v4)();
    try {
        // Create reconciliation run
        await (0, db_1.query)(`INSERT INTO reconciliation_runs (
        id, ingestion_id, tenant_id, user_id, status, started_at,
        trace_id, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, NOW(), NOW())`, [runId, ingestionId, tenantId, userId, "running", traceId, JSON.stringify(config)]);
        await (0, runtime_events_1.emitOperatorRuntimeEvent)({
            eventType: "reconciliation_run_started",
            tenantId,
            runId,
            metadata: { ingestionId, traceId },
        });
        // Get source transactions (from this ingestion)
        const sourceTransactions = await (0, db_1.query)(`SELECT id FROM normalized_transactions
      WHERE ingestion_id = $1 AND tenant_id = $2
      ORDER BY date, amount`, [ingestionId, tenantId]);
        // Get target transactions (from other ingestions or manual entries)
        // For MVP, we'll match against all other transactions in the tenant
        const targetTransactions = await (0, db_1.query)(`SELECT id FROM normalized_transactions
      WHERE tenant_id = $1 AND ingestion_id != $2
      ORDER BY date, amount`, [tenantId, ingestionId]);
        const sourceIds = sourceTransactions.map((t) => t.id);
        const targetIds = targetTransactions.map((t) => t.id);
        (0, logger_1.logInfo)("Starting reconciliation", {
            runId,
            sourceCount: sourceIds.length,
            targetCount: targetIds.length,
            traceId,
        });
        // Match each source transaction
        const matches = [];
        let matchedCount = 0;
        let unmatchedCount = 0;
        let totalConfidence = 0;
        for (const sourceId of sourceIds) {
            const match = await matchTransaction(sourceId, targetIds, tenantId, config);
            if (match) {
                matches.push(match);
                if (match.targetTransactionId) {
                    matchedCount++;
                    totalConfidence += match.confidence;
                }
                else {
                    unmatchedCount++;
                }
            }
        }
        // Store matches
        await (0, db_1.transaction)(async (client) => {
            for (const match of matches) {
                await client.query(`INSERT INTO reconciliation_matches (
            id, run_id, source_transaction_id, target_transaction_id,
            tenant_id, match_type, confidence, match_reason,
            amount_diff, date_diff, reviewed, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`, [
                    (0, uuid_1.v4)(),
                    runId,
                    match.sourceTransactionId,
                    match.targetTransactionId || null,
                    tenantId,
                    match.matchType,
                    match.confidence,
                    match.matchReason || null,
                    match.amountDiff || null,
                    match.dateDiff || null,
                    false,
                    JSON.stringify({}),
                ]);
            }
        });
        // Update reconciliation run
        const avgConfidence = matchedCount > 0 ? totalConfidence / matchedCount : 0;
        await (0, db_1.query)(`UPDATE reconciliation_runs SET
        status = 'completed',
        completed_at = NOW(),
        source_count = $1,
        target_count = $2,
        matched_count = $3,
        unmatched_source_count = $4,
        unmatched_target_count = $5,
        confidence_avg = $6,
        updated_at = NOW()
      WHERE id = $7`, [
            sourceIds.length,
            targetIds.length,
            matchedCount,
            unmatchedCount,
            targetIds.length - matchedCount, // Unmatched targets
            avgConfidence,
            runId,
        ]);
        await (0, integrity_1.appendRunIntegrityEntry)(runId, tenantId);
        await (0, runtime_events_1.emitOperatorRuntimeEvent)({
            eventType: "reconciliation_run_completed",
            tenantId,
            runId,
            recordsProcessed: sourceIds.length,
            durationMs: undefined,
            classificationCounts: { matched: matchedCount, unmatched: unmatchedCount },
            manualReviewCount: unmatchedCount,
            metadata: { traceId, avgConfidence },
        });
        (0, logger_1.logInfo)("Reconciliation completed", {
            runId,
            matchedCount,
            unmatchedCount,
            avgConfidence,
            traceId,
        });
        // Automatically trigger review process (industry best practice)
        try {
            const { autoReviewRun } = await Promise.resolve().then(() => __importStar(require("../reconciliation/automated-review")));
            const reviewStats = await autoReviewRun(runId, tenantId);
            (0, logger_1.logInfo)("Automated review completed", {
                runId,
                tenantId,
                ...reviewStats,
                traceId,
            });
            // Check quality metrics and generate alerts
            const { checkQualityThresholds } = await Promise.resolve().then(() => __importStar(require("../reconciliation/quality-monitor")));
            const alerts = await checkQualityThresholds(runId, tenantId);
            if (alerts.length > 0) {
                (0, logger_1.logInfo)("Quality alerts generated", {
                    runId,
                    tenantId,
                    alertCount: alerts.length,
                    alerts: alerts.map((a) => ({ type: a.alertType, severity: a.severity })),
                    traceId,
                });
            }
        }
        catch (reviewError) {
            // Non-fatal: log error but don't fail reconciliation
            (0, logger_1.logError)("Automated review failed (non-fatal)", reviewError, {
                runId,
                tenantId,
                traceId,
            });
        }
        // Record patterns for cross-customer intelligence (creates data moat)
        for (const match of matches) {
            if (match.targetTransactionId && match.matchType !== "unmatched") {
                try {
                    const sourceAdapter = await getSourceAdapter(match.sourceTransactionId, tenantId);
                    const targetAdapter = await getSourceAdapter(match.targetTransactionId, tenantId);
                    if (sourceAdapter && targetAdapter) {
                        await enhanced_cross_customer_intelligence_1.enhancedCrossCustomerIntelligence.recordPattern(tenantId, {
                            sourceAdapter,
                            targetAdapter,
                            matchType: match.matchType,
                            confidence: match.confidence,
                            amountDiff: match.amountDiff || 0,
                            dateDiff: match.dateDiff || 0,
                        });
                    }
                }
                catch (error) {
                    // Non-fatal - continue even if pattern recording fails
                    (0, logger_1.logError)("Failed to record pattern", error);
                }
            }
        }
        return runId;
    }
    catch (error) {
        (0, logger_1.logError)("Reconciliation failed", error, { runId, traceId });
        await (0, db_1.query)(`UPDATE reconciliation_runs SET
        status = 'failed',
        completed_at = NOW(),
        error_message = $1,
        updated_at = NOW()
      WHERE id = $2`, [error instanceof Error ? error.message : String(error), runId]);
        await (0, runtime_events_1.emitOperatorRuntimeEvent)({
            eventType: "reconciliation_run_failed",
            tenantId,
            runId,
            errorId: traceId,
            metadata: { message: error instanceof Error ? error.message : String(error), traceId },
        });
        await (0, integrity_1.appendRunIntegrityEntry)(runId, tenantId);
        throw error;
    }
}
/**
 * Get source adapter for transaction — scoped by tenant_id
 */
async function getSourceAdapter(transactionId, tenantId) {
    try {
        const result = await (0, db_1.query)(`SELECT si.connector_type
      FROM normalized_transactions nt
      JOIN ingestion_sources si ON si.id = nt.source_id
      WHERE nt.id = $1 AND nt.tenant_id = $2
      LIMIT 1`, [transactionId, tenantId]);
        if (result.length > 0) {
            return result[0].connector_type;
        }
        return null;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get source adapter", error, { transactionId });
        return null;
    }
}
//# sourceMappingURL=reconciliation-matcher.js.map