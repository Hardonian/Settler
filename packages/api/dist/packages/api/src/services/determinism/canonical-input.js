"use strict";
/**
 * Canonical Input Fingerprinting
 *
 * Provides deterministic hashing of input data for replayability.
 * Same inputs + same ruleset → same outputs (bit-for-bit stable).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stableStringify = stableStringify;
exports.computeInputFingerprint = computeInputFingerprint;
exports.computeRecordFingerprint = computeRecordFingerprint;
exports.computeRulesetHash = computeRulesetHash;
exports.computeRunFingerprint = computeRunFingerprint;
exports.normalizeTransaction = normalizeTransaction;
exports.normalizeSettlement = normalizeSettlement;
exports.computeStreamFingerprint = computeStreamFingerprint;
exports.batchComputeRecordFingerprints = batchComputeRecordFingerprints;
const node_crypto_1 = require("node:crypto");
/**
 * Sort keys recursively for deterministic JSON serialization
 */
function stableStringify(value) {
    return JSON.stringify(canonicalize(value));
}
/**
 * Recursively canonicalize a value for deterministic serialization
 */
function canonicalize(value) {
    if (value === null)
        return null;
    if (value === undefined)
        return null; // Treat undefined as null for consistency
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }
    if (typeof value === 'object') {
        const sortedKeys = Object.keys(value).sort();
        const result = {};
        for (const key of sortedKeys) {
            result[key] = canonicalize(value[key]);
        }
        return result;
    }
    if (typeof value === 'number') {
        // Handle special numeric cases
        if (Number.isNaN(value))
            return 'NaN';
        if (!Number.isFinite(value))
            return value > 0 ? 'Infinity' : '-Infinity';
        return value;
    }
    return value;
}
/**
 * Compute SHA-256 hash of canonicalized input
 */
function computeInputFingerprint(batch) {
    // Sort records by stable keys before hashing
    const sortedSourceRecords = [...batch.source_records].sort(compareCanonicalRecords);
    const sortedTargetRecords = [...batch.target_records].sort(compareCanonicalRecords);
    const canonicalBatch = {
        source_records: sortedSourceRecords,
        target_records: sortedTargetRecords,
    };
    const canonicalJson = stableStringify(canonicalBatch);
    return (0, node_crypto_1.createHash)('sha256').update(canonicalJson).digest('hex');
}
/**
 * Compute hash for a single canonical record
 */
function computeRecordFingerprint(record) {
    const canonicalJson = stableStringify(record);
    return (0, node_crypto_1.createHash)('sha256').update(canonicalJson).digest('hex');
}
/**
 * Compute hash for ruleset configuration
 */
function computeRulesetHash(rules) {
    const canonicalJson = stableStringify(rules);
    return (0, node_crypto_1.createHash)('sha256').update(canonicalJson).digest('hex');
}
/**
 * Compute combined fingerprint for run snapshot
 */
function computeRunFingerprint(inputFingerprint, configSnapshot, engineVersion) {
    const snapshotData = {
        input: inputFingerprint,
        pipeline_id: configSnapshot.pipeline_id,
        pipeline_version: configSnapshot.pipeline_version,
        ruleset_id: configSnapshot.ruleset_id,
        ruleset_version: configSnapshot.ruleset_version,
        ruleset_hash: configSnapshot.ruleset_hash,
        adapter_config_hashes: Object.entries(configSnapshot.adapter_config_hashes)
            .sort(([a], [b]) => a.localeCompare(b)),
        engine_version: engineVersion,
    };
    const canonicalJson = stableStringify(snapshotData);
    return (0, node_crypto_1.createHash)('sha256').update(canonicalJson).digest('hex');
}
/**
 * Compare function for sorting canonical records
 * Ensures deterministic ordering regardless of input order
 */
function compareCanonicalRecords(a, b) {
    // Sort by: source, external_id, date, amount, currency
    const sourceCompare = a.source.localeCompare(b.source);
    if (sourceCompare !== 0)
        return sourceCompare;
    const externalIdCompare = a.external_id.localeCompare(b.external_id);
    if (externalIdCompare !== 0)
        return externalIdCompare;
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0)
        return dateCompare;
    const amountCompare = a.amount.localeCompare(b.amount);
    if (amountCompare !== 0)
        return amountCompare;
    return a.currency.localeCompare(b.currency);
}
/**
 * Normalize a transaction record for canonical hashing
 */
function normalizeTransaction(raw) {
    return {
        source: String(raw.source || raw.adapter || 'unknown'),
        external_id: String(raw.external_id || raw.id || raw.reference || ''),
        date: normalizeDate(raw.date || raw.created_at || raw.timestamp),
        amount: normalizeAmount(raw.amount || raw.value || 0),
        currency: String(raw.currency || 'USD').toUpperCase(),
        account: raw.account ? String(raw.account) : undefined,
        description: raw.description ? normalizeString(String(raw.description)) : undefined,
        metadata: raw.metadata ? canonicalize(raw.metadata) : undefined,
    };
}
/**
 * Normalize a settlement record for canonical hashing
 */
function normalizeSettlement(raw) {
    return {
        source: String(raw.source || raw.adapter || 'unknown'),
        external_id: String(raw.external_id || raw.id || raw.reference || ''),
        date: normalizeDate(raw.date || raw.settlement_date || raw.timestamp),
        amount: normalizeAmount(raw.amount || raw.value || 0),
        currency: String(raw.currency || 'USD').toUpperCase(),
        account: raw.account ? String(raw.account) : undefined,
        description: raw.description ? normalizeString(String(raw.description)) : undefined,
        metadata: raw.metadata ? canonicalize(raw.metadata) : undefined,
    };
}
/**
 * Normalize date to ISO 8601 string
 */
function normalizeDate(date) {
    if (!date)
        return '1970-01-01T00:00:00.000Z';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
        return '1970-01-01T00:00:00.000Z';
    }
    return d.toISOString();
}
/**
 * Normalize amount to string to avoid floating point issues
 */
function normalizeAmount(amount) {
    if (typeof amount === 'string') {
        const parsed = parseFloat(amount);
        if (!isNaN(parsed)) {
            return parsed.toFixed(2);
        }
        return '0.00';
    }
    if (typeof amount === 'number') {
        return amount.toFixed(2);
    }
    return '0.00';
}
/**
 * Normalize string: trim whitespace, consistent case handling
 */
function normalizeString(str) {
    return str.trim().normalize('NFC');
}
/**
 * Create a JSONL stream fingerprint for large datasets
 */
function computeStreamFingerprint(records) {
    return new Promise((resolve, reject) => {
        const hash = (0, node_crypto_1.createHash)('sha256');
        const processRecords = async () => {
            try {
                for await (const record of records) {
                    // Add newline delimiter between records
                    hash.update(stableStringify(record));
                    hash.update('\n');
                }
                resolve(hash.digest('hex'));
            }
            catch (error) {
                reject(error);
            }
        };
        processRecords();
    });
}
/**
 * Batch compute fingerprints for multiple records
 */
function batchComputeRecordFingerprints(records) {
    const fingerprints = new Map();
    for (const record of records) {
        const key = `${record.source}:${record.external_id}`;
        fingerprints.set(key, computeRecordFingerprint(record));
    }
    return fingerprints;
}
//# sourceMappingURL=canonical-input.js.map