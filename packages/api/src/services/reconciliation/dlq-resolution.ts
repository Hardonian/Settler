import { query } from "../../db";
import { logError, logInfo } from "../../utils/logger";
import { stringSimilarity } from "../ingestion/reconciliation-matcher";

export interface DLQResolutionResult {
  resolvedCount: number;
  failedCount: number;
}

/**
 * Secondary fallback heuristic for unmapped transactions.
 * Relaxes strict amount/date tolerances and relies purely on high-confidence
 * fuzzy matching (Levenshtein distance) to prevent human-in-the-loop intervention.
 */
export async function runAutomatedDLQResolution(
  runId: string,
  tenantId: string
): Promise<DLQResolutionResult> {
  const result: DLQResolutionResult = { resolvedCount: 0, failedCount: 0 };
  try {
    // 1. Find all unmatched transactions in this run
    const unmatchedRecords = await query<{
      id: string;
      source_transaction_id: string;
    }>(
      `SELECT id, source_transaction_id
       FROM reconciliation_matches
       WHERE run_id = $1 AND tenant_id = $2 AND match_type = 'unmatched'`,
      [runId, tenantId]
    );

    if (unmatchedRecords.length === 0) {
      return result;
    }

    logInfo("Starting Automated DLQ Resolution", {
      runId,
      tenantId,
      unmatchedCount: unmatchedRecords.length,
    });

    // 2. Fetch all unmatched target transactions for this tenant (not mapped yet)
    // We'll broaden the scope beyond strict tolerances.
    const availableTargets = await query<{
      id: string;
      amount: number;
      date: Date;
      description: string | null;
      external_id: string | null;
    }>(
      `SELECT t.id, t.amount, t.date, t.description, t.external_id
       FROM normalized_transactions t
       WHERE t.tenant_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM reconciliation_matches rm 
           WHERE rm.target_transaction_id = t.id AND rm.tenant_id = $1
         )`,
      [tenantId]
    );

    if (availableTargets.length === 0) {
      logInfo("No available targets for DLQ resolution", { tenantId });
      result.failedCount = unmatchedRecords.length;
      return result;
    }

    // 3. For each unmatched source, attempt deep fuzzy matching
    for (const record of unmatchedRecords) {
      const sourceResults = await query<{
        amount: number;
        date: Date;
        description: string | null;
      }>(
        `SELECT amount, date, description FROM normalized_transactions WHERE id = $1 AND tenant_id = $2`,
        [record.source_transaction_id, tenantId]
      );

      if (sourceResults.length === 0) {
        result.failedCount++;
        continue;
      }

      const source = sourceResults[0]!;
      if (!source.description) {
        result.failedCount++;
        continue;
      }

      let bestTarget = null;
      let highestSimilarity = 0;

      // Scan all available targets for a very high description similarity
      for (const target of availableTargets) {
        if (!target.description) continue;

        const similarity = stringSimilarity(source.description, target.description);

        // Very high threshold required to override strict tolerances (e.g., 0.90+)
        if (similarity > highestSimilarity && similarity >= 0.9) {
          highestSimilarity = similarity;
          bestTarget = target;
        }
      }

      if (bestTarget) {
        // We found a DLQ match!
        const amountDiff = Math.abs(source.amount - bestTarget.amount);
        const dateDiff = Math.round(
          Math.abs(source.date.getTime() - bestTarget.date.getTime()) / (1000 * 60 * 60 * 24)
        );

        await query(
          `UPDATE reconciliation_matches
           SET target_transaction_id = $1,
               match_type = 'fuzzy',
               match_reason = 'DLQ Automated Recovery (similarity: ' || ROUND(($2::numeric * 100), 2) || '%)',
               confidence = $2,
               amount_diff = $3,
               date_diff = $4,
               updated_at = NOW()
           WHERE id = $5 AND tenant_id = $6`,
          [bestTarget.id, highestSimilarity, amountDiff, dateDiff, record.id, tenantId]
        );

        result.resolvedCount++;
        logInfo("DLQ Resolution Successful", {
          matchId: record.id,
          sourceId: record.source_transaction_id,
          targetId: bestTarget.id,
          similarity: highestSimilarity,
        });
      } else {
        result.failedCount++;
      }
    }

    // 4. Update the recon_results stats to reflect the DLQ recovery
    if (result.resolvedCount > 0) {
      await query(
        `UPDATE recon_results 
         SET matched_count = matched_count + $1,
             unmatched_source_count = unmatched_source_count - $1,
             metadata = jsonb_set(metadata, '{dlq_resolved}', $1::text::jsonb)
         WHERE id = $2 AND tenant_id = $3`,
        [result.resolvedCount, runId, tenantId]
      );
    }
  } catch (error) {
    logError("Failed to run DLQ resolution", error, { runId, tenantId });
  }

  return result;
}
