import { createHash } from "node:crypto";
import { query } from "../../db";
import {
  assertTenantOwnership,
  validateTenantId,
} from "../../infrastructure/tenancy/TenantEnforcement";
import { logError, logInfo } from "../../utils/logger";

export interface ReconciliationRunForIntegrity {
  id: string;
  tenantId: string;
  ingestionId: string | null;
  status: string;
  sourceCount: number;
  targetCount: number;
  matchedCount: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  confidenceAvg: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface ReconciliationMatchForIntegrity {
  id: string;
  sourceTransactionId: string;
  targetTransactionId: string | null;
  matchType: string;
  confidence: number;
  amountDiff: number | null;
  dateDiff: number | null;
}

export interface IntegrityMetadata {
  schemaVersion: "1.0.0";
  sequence: number;
  previousHash: string | null;
  reconciliationHash: string;
  chainHash: string;
  hashAlgorithm: "sha256";
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function computeReconciliationHash(
  run: ReconciliationRunForIntegrity,
  matches: ReconciliationMatchForIntegrity[]
): string {
  const canonicalPayload = {
    run,
    matches: [...matches].sort((a, b) => a.id.localeCompare(b.id)),
  };

  return createHash("sha256").update(stableStringify(canonicalPayload)).digest("hex");
}

export function computeChainHash(previousHash: string | null, reconciliationHash: string): string {
  const payload = `${previousHash ?? "GENESIS"}:${reconciliationHash}`;
  return createHash("sha256").update(payload).digest("hex");
}

export function verifyIntegrityChain(
  entries: Array<Pick<IntegrityMetadata, "previousHash" | "reconciliationHash" | "chainHash">>
): { valid: boolean; brokenAt: number | null } {
  let expectedPreviousHash: string | null = null;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) {
      return { valid: false, brokenAt: index };
    }

    if (entry.previousHash !== expectedPreviousHash) {
      return { valid: false, brokenAt: index };
    }

    const expectedChainHash = computeChainHash(entry.previousHash, entry.reconciliationHash);
    if (entry.chainHash !== expectedChainHash) {
      return { valid: false, brokenAt: index };
    }

    expectedPreviousHash = entry.chainHash;
  }

  return { valid: true, brokenAt: null };
}

async function loadRun(
  runId: string,
  tenantId: string
): Promise<ReconciliationRunForIntegrity | null> {
  validateTenantId(tenantId, "loadRun");
  const rows = await query<Record<string, unknown>>(
    `SELECT id, tenant_id, null as ingestion_id, status, source_count, target_count,
            matched_count, unmatched_source_count, unmatched_target_count,
            confidence_avg, started_at, completed_at
     FROM recon_results
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [runId, tenantId]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  if (!row) {
    return null;
  }

  assertTenantOwnership(row as { tenant_id?: string | null }, tenantId, "recon_results");

  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    ingestionId: row.ingestion_id ? String(row.ingestion_id) : null,
    status: String(row.status),
    sourceCount: Number(row.source_count),
    targetCount: Number(row.target_count),
    matchedCount: Number(row.matched_count),
    unmatchedSourceCount: Number(row.unmatched_source_count),
    unmatchedTargetCount: Number(row.unmatched_target_count),
    confidenceAvg: row.confidence_avg === null ? null : Number(row.confidence_avg),
    startedAt: new Date(String(row.started_at)).toISOString(),
    completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null,
  };
}

async function loadMatches(
  runId: string,
  tenantId: string
): Promise<ReconciliationMatchForIntegrity[]> {
  validateTenantId(tenantId, "loadMatches");
  const rows = await query<Record<string, unknown>>(
    `SELECT id, tenant_id, source_transaction_id, target_transaction_id,
            match_type, confidence, amount_diff, date_diff
     FROM reconciliation_matches
     WHERE run_id = $1 AND tenant_id = $2`,
    [runId, tenantId]
  );

  assertTenantOwnership(
    rows as Array<{ tenant_id?: string | null }>,
    tenantId,
    "reconciliation_matches"
  );

  return rows.map((row) => ({
    id: String(row.id),
    sourceTransactionId: String(row.source_transaction_id),
    targetTransactionId: row.target_transaction_id ? String(row.target_transaction_id) : null,
    matchType: String(row.match_type),
    confidence: Number(row.confidence),
    amountDiff: row.amount_diff === null ? null : Number(row.amount_diff),
    dateDiff: row.date_diff === null ? null : Number(row.date_diff),
  }));
}

export async function appendRunIntegrityEntry(
  runId: string,
  tenantId: string
): Promise<IntegrityMetadata | null> {
  validateTenantId(tenantId, "appendRunIntegrityEntry");
  const run = await loadRun(runId, tenantId);
  if (!run) {
    return null;
  }

  const matches = await loadMatches(runId, tenantId);
  const reconciliationHash = computeReconciliationHash(run, matches);

  const previousRows = await query<Record<string, unknown>>(
    `SELECT metadata
     FROM recon_results
     WHERE tenant_id = $1
       AND id <> $2
       AND metadata->'integrity'->>'chainHash' IS NOT NULL
     ORDER BY COALESCE(completed_at, started_at) ASC, id ASC`,
    [tenantId, runId]
  );

  let previousHash: string | null = null;
  for (const row of previousRows) {
    const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
    const integrity = (metadata as Record<string, unknown>)?.integrity as
      | Record<string, unknown>
      | undefined;
    previousHash = typeof integrity?.chainHash === "string" ? integrity.chainHash : previousHash;
  }

  const chainHash = computeChainHash(previousHash, reconciliationHash);
  const sequence = previousRows.length + 1;

  const integrity: IntegrityMetadata = {
    schemaVersion: "1.0.0",
    sequence,
    previousHash,
    reconciliationHash,
    chainHash,
    hashAlgorithm: "sha256",
  };

  await query(
    `UPDATE recon_results
     SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('integrity', $1::jsonb),
         updated_at = NOW()
     WHERE id = $2 AND tenant_id = $3`,
    [JSON.stringify(integrity), runId, tenantId]
  );

  logInfo("Integrity hash-chain entry appended", { tenantId, runId, sequence, chainHash });
  return integrity;
}

export async function verifyTenantIntegrityChain(tenantId: string): Promise<{
  valid: boolean;
  checkedRuns: number;
  brokenRunId: string | null;
}> {
  validateTenantId(tenantId, "verifyTenantIntegrityChain");

  const rows = await query<Record<string, unknown>>(
    `SELECT id, metadata
     FROM recon_results
     WHERE tenant_id = $1
       AND metadata->'integrity'->>'chainHash' IS NOT NULL
     ORDER BY COALESCE(completed_at, started_at) ASC, id ASC`,
    [tenantId]
  );

  const entries: Array<{
    runId: string;
    previousHash: string | null;
    reconciliationHash: string;
    chainHash: string;
  }> = [];

  for (const row of rows) {
    const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
    const integrity = (metadata as Record<string, unknown>)?.integrity as
      | Record<string, unknown>
      | undefined;

    if (!integrity) {
      continue;
    }

    const reconciliationHash =
      typeof integrity.reconciliationHash === "string" ? integrity.reconciliationHash : "";
    const chainHash = typeof integrity.chainHash === "string" ? integrity.chainHash : "";
    const previousHash = typeof integrity.previousHash === "string" ? integrity.previousHash : null;

    entries.push({
      runId: String(row.id),
      previousHash,
      reconciliationHash,
      chainHash,
    });
  }

  const result = verifyIntegrityChain(entries);
  if (!result.valid) {
    const brokenRunId = result.brokenAt === null ? null : (entries[result.brokenAt]?.runId ?? null);
    logError("Integrity chain verification failed", new Error("Hash chain broken"), {
      tenantId,
      brokenRunId,
      brokenIndex: result.brokenAt,
    });

    return {
      valid: false,
      checkedRuns: entries.length,
      brokenRunId,
    };
  }

  return {
    valid: true,
    checkedRuns: entries.length,
    brokenRunId: null,
  };
}
