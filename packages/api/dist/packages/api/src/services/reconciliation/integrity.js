"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stableStringify = stableStringify;
exports.computeReconciliationHash = computeReconciliationHash;
exports.computeChainHash = computeChainHash;
exports.verifyIntegrityChain = verifyIntegrityChain;
exports.appendRunIntegrityEntry = appendRunIntegrityEntry;
exports.verifyTenantIntegrityChain = verifyTenantIntegrityChain;
const node_crypto_1 = require("node:crypto");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
function canonicalize(value) {
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }
    if (value && typeof value === "object") {
        const sortedKeys = Object.keys(value).sort();
        const result = {};
        for (const key of sortedKeys) {
            result[key] = canonicalize(value[key]);
        }
        return result;
    }
    return value;
}
function stableStringify(value) {
    return JSON.stringify(canonicalize(value));
}
function computeReconciliationHash(run, matches) {
    const canonicalPayload = {
        run,
        matches: [...matches].sort((a, b) => a.id.localeCompare(b.id)),
    };
    return (0, node_crypto_1.createHash)("sha256").update(stableStringify(canonicalPayload)).digest("hex");
}
function computeChainHash(previousHash, reconciliationHash) {
    const payload = `${previousHash ?? "GENESIS"}:${reconciliationHash}`;
    return (0, node_crypto_1.createHash)("sha256").update(payload).digest("hex");
}
function verifyIntegrityChain(entries) {
    let expectedPreviousHash = null;
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
async function loadRun(runId, tenantId) {
    const rows = await (0, db_1.query)(`SELECT id, tenant_id, ingestion_id, status, source_count, target_count,
            matched_count, unmatched_source_count, unmatched_target_count,
            confidence_avg, started_at, completed_at
     FROM reconciliation_runs
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`, [runId, tenantId]);
    if (rows.length === 0) {
        return null;
    }
    const row = rows[0];
    if (!row) {
        return null;
    }
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
async function loadMatches(runId, tenantId) {
    const rows = await (0, db_1.query)(`SELECT id, source_transaction_id, target_transaction_id,
            match_type, confidence, amount_diff, date_diff
     FROM reconciliation_matches
     WHERE run_id = $1 AND tenant_id = $2`, [runId, tenantId]);
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
async function appendRunIntegrityEntry(runId, tenantId) {
    const run = await loadRun(runId, tenantId);
    if (!run) {
        return null;
    }
    const matches = await loadMatches(runId, tenantId);
    const reconciliationHash = computeReconciliationHash(run, matches);
    const previousRows = await (0, db_1.query)(`SELECT metadata
     FROM reconciliation_runs
     WHERE tenant_id = $1
       AND id <> $2
       AND metadata->'integrity'->>'chainHash' IS NOT NULL
     ORDER BY COALESCE(completed_at, created_at) ASC, id ASC`, [tenantId, runId]);
    let previousHash = null;
    for (const row of previousRows) {
        const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        const integrity = metadata?.integrity;
        previousHash = typeof integrity?.chainHash === "string" ? integrity.chainHash : previousHash;
    }
    const chainHash = computeChainHash(previousHash, reconciliationHash);
    const sequence = previousRows.length + 1;
    const integrity = {
        schemaVersion: "1.0.0",
        sequence,
        previousHash,
        reconciliationHash,
        chainHash,
        hashAlgorithm: "sha256",
    };
    await (0, db_1.query)(`UPDATE reconciliation_runs
     SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('integrity', $1::jsonb),
         updated_at = NOW()
     WHERE id = $2 AND tenant_id = $3`, [JSON.stringify(integrity), runId, tenantId]);
    (0, logger_1.logInfo)("Integrity hash-chain entry appended", { tenantId, runId, sequence, chainHash });
    return integrity;
}
async function verifyTenantIntegrityChain(tenantId) {
    const rows = await (0, db_1.query)(`SELECT id, metadata
     FROM reconciliation_runs
     WHERE tenant_id = $1
       AND metadata->'integrity'->>'chainHash' IS NOT NULL
     ORDER BY COALESCE(completed_at, created_at) ASC, id ASC`, [tenantId]);
    const entries = [];
    for (const row of rows) {
        const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        const integrity = metadata?.integrity;
        if (!integrity) {
            continue;
        }
        const reconciliationHash = typeof integrity.reconciliationHash === "string" ? integrity.reconciliationHash : "";
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
        const brokenRunId = result.brokenAt === null ? null : entries[result.brokenAt]?.runId ?? null;
        (0, logger_1.logError)("Integrity chain verification failed", new Error("Hash chain broken"), {
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
//# sourceMappingURL=integrity.js.map