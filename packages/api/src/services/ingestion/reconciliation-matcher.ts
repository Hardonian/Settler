/**
 * Reconciliation Matcher
 * Deterministic matching algorithm with ML enhancement fallback.
 * Uses proprietary ML models trained on historical matches for improved accuracy.
 */

import { v4 as uuidv4 } from "uuid";
import { query, transaction } from "../../db";
import { logError, logInfo, logWarn } from "../../utils/logger";
import { MatchResult, ReconciliationConfig } from "./types";
import { mlMatchingEngine } from "../matching/ml-matching-engine";
import { enhancedCrossCustomerIntelligence } from "../matching/enhanced-cross-customer-intelligence";
import { appendRunIntegrityEntry } from "../reconciliation/integrity";
import { emitOperatorRuntimeEvent } from "../ops-intelligence/runtime-events";
import {
  getMatchingRulesForJob,
  ReconciliationConfig as LoaderReconciliationConfig,
} from "../matching-rules-loader";

/**
 * Default tolerance values (fallback when config loading fails)
 */
const DEFAULT_CONFIG: Required<ReconciliationConfig> = {
  dateWindowDays: 7,
  amountTolerance: 0.01,
  fuzzyDescriptionThreshold: 0.8,
  requireExactAmount: false,
};

/**
 * Default tolerances from canonical loader
 */
const DEFAULT_TOLERANCES = {
  amount: 0.01,
  dateDays: 7,
} as const;

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

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
    if (!row || !prevRow) continue;
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        row[j] = prevRow[j - 1] ?? 0;
      } else {
        row[j] = Math.min(
          (prevRow[j] ?? 0) + 1, // deletion
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
function stringSimilarity(str1: string, str2: string): number {
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
function amountsMatch(amount1: number, amount2: number, tolerance: number): boolean {
  return Math.abs(amount1 - amount2) <= tolerance;
}

/**
 * Check if two dates are within window
 */
function datesWithinWindow(date1: Date, date2: Date, windowDays: number): boolean {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= windowDays;
}

/**
 * Calculate days difference between two dates
 */
function daysDifference(date1: Date, date2: Date): number {
  const diffMs = date1.getTime() - date2.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Match source transaction to target transactions
 *
 * INVARIANT: tenantId is required. All queries are scoped to the tenant boundary.
 */
export async function matchTransaction(
  sourceTransactionId: string,
  targetTransactionIds: string[],
  tenantId: string,
  config: ReconciliationConfig = {}
): Promise<MatchResult | null> {
  if (!tenantId) throw new Error("tenantId is required for matchTransaction");
  const opts = { ...DEFAULT_CONFIG, ...config };

  // Get source transaction — scoped by tenant_id
  const sourceResults = await query(
    `SELECT id, amount, currency, date, description, external_id
    FROM normalized_transactions
    WHERE id = $1 AND tenant_id = $2`,
    [sourceTransactionId, tenantId]
  );

  if (sourceResults.length === 0) {
    throw new Error(`Source transaction ${sourceTransactionId} not found`);
  }

  const source = sourceResults[0] as {
    id: string;
    amount: number;
    currency: string;
    date: Date;
    description: string | null;
    external_id: string | null;
  };

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
  const targetResults = await query(
    `SELECT id, amount, currency, date, description, external_id
    FROM normalized_transactions
    WHERE id IN (${placeholders}) AND tenant_id = $2`,
    [sourceTransactionId, tenantId, ...targetTransactionIds]
  );

  const targets = targetResults as Array<{
    id: string;
    amount: number;
    currency: string;
    date: Date;
    description: string | null;
    external_id: string | null;
  }>;

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
    const targetAdapters = await Promise.all(
      targetTransactionIds.map((id) => getSourceAdapter(id, tenantId))
    );

    // Use ML engine for first target adapter (most common case)
    if (targetAdapters.length > 0) {
      const mlPrediction = await mlMatchingEngine.predictMatch(
        sourceTransactionId,
        targetTransactionIds,
        tenantId,
        sourceAdapter || "unknown",
        targetAdapters[0] || "unknown"
      );

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
  } catch (error) {
    // Fall back to deterministic algorithm if ML fails
    logError("ML matching failed, falling back to deterministic", error);
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
  const dateMatches = currencyMatchesFiltered.filter((t) =>
    datesWithinWindow(source.date, t.date, dateWindowDays)
  );

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
  const amountMatches = dateMatches.filter((t) =>
    amountsMatch(source.amount, t.amount, amountTolerance)
  );

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
    const descSimilarity =
      source.description && target.description
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
  let matchType: "exact" | "fuzzy" | "manual" | "unmatched" = "fuzzy";
  if (
    bestMatch.descSimilarity >= fuzzyDescriptionThreshold &&
    bestMatch.amountDiff === 0 &&
    bestMatch.dateDiff === 0
  ) {
    matchType = "exact";
  } else if (bestMatch.confidence >= fuzzyDescriptionThreshold) {
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
export async function runReconciliation(
  ingestionId: string,
  tenantId: string,
  userId: string,
  jobId?: string,
  templateId?: string,
  config: ReconciliationConfig = {}
): Promise<string> {
  const runId = uuidv4();
  const traceId = uuidv4();

  // Load matching rules config from canonical loader
  let matchingConfig: LoaderReconciliationConfig;
  try {
    matchingConfig = await getMatchingRulesForJob(
      tenantId,
      jobId ?? `reconciliation-${runId}`,
      templateId
    );
    logInfo("Loaded matching rules from canonical loader", {
      runId,
      tenantId,
      jobId,
      templateId,
      configSource: matchingConfig.configSource,
      amountTolerance: matchingConfig.amountTolerance,
      dateToleranceDays: matchingConfig.dateToleranceDays,
    });
  } catch (error) {
    logWarn("Failed to load matching rules from canonical loader, using defaults", {
      runId,
      tenantId,
      jobId,
      templateId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Use defaults - matchingConfig will have default tolerances
    matchingConfig = {
      amountTolerance: DEFAULT_TOLERANCES.amount,
      dateToleranceDays: DEFAULT_TOLERANCES.dateDays,
      matchingRules: [],
      configVersion: `fallback-${Date.now()}`,
      configSource: "default",
      tenantId,
      jobId: jobId ?? `reconciliation-${runId}`,
    };
  }

  // Merge user-provided config with loader config (user config takes precedence)
  const effectiveConfig: Required<ReconciliationConfig> = {
    ...DEFAULT_CONFIG,
    amountTolerance: config.amountTolerance ?? matchingConfig.amountTolerance,
    dateWindowDays: config.dateWindowDays ?? matchingConfig.dateToleranceDays,
    fuzzyDescriptionThreshold: config.fuzzyDescriptionThreshold ?? 0.8,
    requireExactAmount: config.requireExactAmount ?? false,
  };

  try {
    // Create reconciliation run
    await query(
      `INSERT INTO reconciliation_runs (
        id, ingestion_id, tenant_id, user_id, status, started_at,
        trace_id, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, NOW(), NOW())`,
      [runId, ingestionId, tenantId, userId, "running", traceId, JSON.stringify(config)]
    );

    await emitOperatorRuntimeEvent({
      eventType: "reconciliation_run_started",
      tenantId,
      runId,
      metadata: { ingestionId, traceId },
    });

    // Get source transactions (from this ingestion)
    const sourceTransactions = await query(
      `SELECT id FROM normalized_transactions
      WHERE ingestion_id = $1 AND tenant_id = $2
      ORDER BY date, amount`,
      [ingestionId, tenantId]
    );

    // Get target transactions (from other ingestions or manual entries)
    // For MVP, we'll match against all other transactions in the tenant
    const targetTransactions = await query(
      `SELECT id FROM normalized_transactions
      WHERE tenant_id = $1 AND ingestion_id != $2
      ORDER BY date, amount`,
      [tenantId, ingestionId]
    );

    const sourceIds = (sourceTransactions as Array<{ id: string }>).map((t) => t.id);
    const targetIds = (targetTransactions as Array<{ id: string }>).map((t) => t.id);

    logInfo("Starting reconciliation", {
      runId,
      sourceCount: sourceIds.length,
      targetCount: targetIds.length,
      traceId,
    });

    // Match each source transaction
    const matches: MatchResult[] = [];
    let matchedCount = 0;
    let unmatchedCount = 0;
    let totalConfidence = 0;

    for (const sourceId of sourceIds) {
      const match = await matchTransaction(sourceId, targetIds, tenantId, effectiveConfig);
      if (match) {
        matches.push(match);
        if (match.targetTransactionId) {
          matchedCount++;
          totalConfidence += match.confidence;
        } else {
          unmatchedCount++;
        }
      }
    }

    // Store matches
    await transaction(async (client) => {
      for (const match of matches) {
        await client.query(
          `INSERT INTO reconciliation_matches (
            id, run_id, source_transaction_id, target_transaction_id,
            tenant_id, match_type, confidence, match_reason,
            amount_diff, date_diff, reviewed, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
          [
            uuidv4(),
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
          ]
        );
      }
    });

    // Update reconciliation run
    const avgConfidence = matchedCount > 0 ? totalConfidence / matchedCount : 0;

    await query(
      `UPDATE reconciliation_runs SET
        status = 'completed',
        completed_at = NOW(),
        source_count = $1,
        target_count = $2,
        matched_count = $3,
        unmatched_source_count = $4,
        unmatched_target_count = $5,
        confidence_avg = $6,
        updated_at = NOW()
      WHERE id = $7`,
      [
        sourceIds.length,
        targetIds.length,
        matchedCount,
        unmatchedCount,
        targetIds.length - matchedCount, // Unmatched targets
        avgConfidence,
        runId,
      ]
    );

    await appendRunIntegrityEntry(runId, tenantId);

    await emitOperatorRuntimeEvent({
      eventType: "reconciliation_run_completed",
      tenantId,
      runId,
      recordsProcessed: sourceIds.length,
      durationMs: undefined,
      classificationCounts: { matched: matchedCount, unmatched: unmatchedCount },
      manualReviewCount: unmatchedCount,
      metadata: { traceId, avgConfidence },
    });

    logInfo("Reconciliation completed", {
      runId,
      matchedCount,
      unmatchedCount,
      avgConfidence,
      traceId,
    });

    // Automatically trigger review process (industry best practice)
    try {
      const { autoReviewRun } = await import("../reconciliation/automated-review");
      const reviewStats = await autoReviewRun(runId, tenantId);
      logInfo("Automated review completed", {
        runId,
        tenantId,
        ...reviewStats,
        traceId,
      });

      // Check quality metrics and generate alerts
      const { checkQualityThresholds } = await import("../reconciliation/quality-monitor");
      const alerts = await checkQualityThresholds(runId, tenantId);
      if (alerts.length > 0) {
        logInfo("Quality alerts generated", {
          runId,
          tenantId,
          alertCount: alerts.length,
          alerts: alerts.map((a) => ({ type: a.alertType, severity: a.severity })),
          traceId,
        });
      }
    } catch (reviewError) {
      // Non-fatal: log error but don't fail reconciliation
      logError("Automated review failed (non-fatal)", reviewError, {
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
            await enhancedCrossCustomerIntelligence.recordPattern(tenantId, {
              sourceAdapter,
              targetAdapter,
              matchType: match.matchType,
              confidence: match.confidence,
              amountDiff: match.amountDiff || 0,
              dateDiff: match.dateDiff || 0,
            });
          }
        } catch (error) {
          // Non-fatal - continue even if pattern recording fails
          logError("Failed to record pattern", error);
        }
      }
    }

    return runId;
  } catch (error) {
    logError("Reconciliation failed", error, { runId, traceId });
    await query(
      `UPDATE reconciliation_runs SET
        status = 'failed',
        completed_at = NOW(),
        error_message = $1,
        updated_at = NOW()
      WHERE id = $2`,
      [error instanceof Error ? error.message : String(error), runId]
    );
    await emitOperatorRuntimeEvent({
      eventType: "reconciliation_run_failed",
      tenantId,
      runId,
      errorId: traceId,
      metadata: { message: error instanceof Error ? error.message : String(error), traceId },
    });
    await appendRunIntegrityEntry(runId, tenantId);
    throw error;
  }
}

/**
 * Get source adapter for transaction — scoped by tenant_id
 */
async function getSourceAdapter(transactionId: string, tenantId: string): Promise<string | null> {
  try {
    const result = await query(
      `SELECT si.connector_type
      FROM normalized_transactions nt
      JOIN ingestion_sources si ON si.id = nt.source_id
      WHERE nt.id = $1 AND nt.tenant_id = $2
      LIMIT 1`,
      [transactionId, tenantId]
    );

    if (result.length > 0) {
      return (result[0] as { connector_type: string | null }).connector_type;
    }
    return null;
  } catch (error) {
    logError("Failed to get source adapter", error, { transactionId });
    return null;
  }
}
