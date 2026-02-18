import { query } from "../../db";
import {
  computeReconciliationHash,
  verifyIntegrityChain,
  ReconciliationMatchForIntegrity,
  ReconciliationRunForIntegrity,
} from "./integrity";

export const EXPORT_SCHEMA_VERSION = "1.0.0" as const;

interface IntegrityChainEntry {
  runId: string;
  sequence: number;
  previousHash: string | null;
  reconciliationHash: string;
  chainHash: string;
}

export interface ReconciliationExportDocument {
  schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  tenantId: string;
  run: ReconciliationRunForIntegrity;
  matches: ReconciliationMatchForIntegrity[];
  integrity: {
    hashAlgorithm: "sha256";
    reconciliationHash: string;
    chain: IntegrityChainEntry[];
    chainValid: boolean;
  };
}

export async function buildReconciliationExport(
  tenantId: string,
  runId: string
): Promise<ReconciliationExportDocument | null> {
  const runRows = await query<Record<string, unknown>>(
    `SELECT id, tenant_id, ingestion_id, status, source_count, target_count,
            matched_count, unmatched_source_count, unmatched_target_count,
            confidence_avg, started_at, completed_at
     FROM reconciliation_runs
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [runId, tenantId]
  );

  if (runRows.length === 0) {
    return null;
  }

  const runRow = runRows[0];
  if (!runRow) {
    return null;
  }
  const run: ReconciliationRunForIntegrity = {
    id: String(runRow.id),
    tenantId: String(runRow.tenant_id),
    ingestionId: runRow.ingestion_id ? String(runRow.ingestion_id) : null,
    status: String(runRow.status),
    sourceCount: Number(runRow.source_count),
    targetCount: Number(runRow.target_count),
    matchedCount: Number(runRow.matched_count),
    unmatchedSourceCount: Number(runRow.unmatched_source_count),
    unmatchedTargetCount: Number(runRow.unmatched_target_count),
    confidenceAvg: runRow.confidence_avg === null ? null : Number(runRow.confidence_avg),
    startedAt: new Date(String(runRow.started_at)).toISOString(),
    completedAt: runRow.completed_at ? new Date(String(runRow.completed_at)).toISOString() : null,
  };

  const matchRows = await query<Record<string, unknown>>(
    `SELECT id, source_transaction_id, target_transaction_id, match_type, confidence, amount_diff, date_diff
     FROM reconciliation_matches
     WHERE run_id = $1 AND tenant_id = $2
     ORDER BY id ASC`,
    [runId, tenantId]
  );

  const matches: ReconciliationMatchForIntegrity[] = matchRows.map((row) => ({
    id: String(row.id),
    sourceTransactionId: String(row.source_transaction_id),
    targetTransactionId: row.target_transaction_id ? String(row.target_transaction_id) : null,
    matchType: String(row.match_type),
    confidence: Number(row.confidence),
    amountDiff: row.amount_diff === null ? null : Number(row.amount_diff),
    dateDiff: row.date_diff === null ? null : Number(row.date_diff),
  }));

  const reconciliationHash = computeReconciliationHash(run, matches);

  const chainRows = await query<Record<string, unknown>>(
    `SELECT id, metadata
     FROM reconciliation_runs
     WHERE tenant_id = $1
       AND metadata->'integrity'->>'chainHash' IS NOT NULL
     ORDER BY COALESCE(completed_at, created_at) ASC, id ASC`,
    [tenantId]
  );

  const chain: IntegrityChainEntry[] = chainRows
    .map((row) => {
      const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
      const integrity = (metadata as Record<string, unknown>)?.integrity as Record<string, unknown> | undefined;
      if (!integrity) {
        return null;
      }

      return {
        runId: String(row.id),
        sequence: Number(integrity.sequence),
        previousHash:
          typeof integrity.previousHash === "string" ? integrity.previousHash : null,
        reconciliationHash: String(integrity.reconciliationHash),
        chainHash: String(integrity.chainHash),
      };
    })
    .filter((entry): entry is IntegrityChainEntry => entry !== null);

  const chainVerification = verifyIntegrityChain(chain);

  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tenantId,
    run,
    matches,
    integrity: {
      hashAlgorithm: "sha256",
      reconciliationHash,
      chain,
      chainValid: chainVerification.valid,
    },
  };
}
