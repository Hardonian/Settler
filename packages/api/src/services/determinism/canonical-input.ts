/**
 * Canonical Input Fingerprinting
 *
 * Provides deterministic hashing of input data for replayability.
 * Same inputs + same ruleset → same outputs (bit-for-bit stable).
 */

import { createHash } from "node:crypto";

/**
 * Sort keys recursively for deterministic JSON serialization
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/**
 * Recursively canonicalize a value for deterministic serialization
 */
function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  if (value === undefined) return null; // Treat undefined as null for consistency

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (typeof value === "object") {
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }

  if (typeof value === "number") {
    // Handle special numeric cases
    if (Number.isNaN(value)) return "NaN";
    if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
    return value;
  }

  return value;
}

/**
 * Normalized transaction record for canonical hashing
 */
export interface CanonicalTransaction {
  // Stable sorting keys (in order of priority)
  source: string; // Adapter/source identifier
  external_id: string; // External reference ID
  date: string; // ISO 8601 date string
  amount: string; // String representation to avoid float issues
  currency: string; // ISO 4217 currency code
  account?: string; // Account identifier (optional)
  description?: string; // Normalized description (optional)
  metadata?: Record<string, unknown>; // Additional metadata (sorted)
}

/**
 * Normalized settlement record for canonical hashing
 */
export interface CanonicalSettlement {
  source: string;
  external_id: string;
  date: string;
  amount: string;
  currency: string;
  account?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input batch for fingerprinting
 */
export interface InputBatch {
  source_records: CanonicalTransaction[];
  target_records: CanonicalSettlement[];
}

/**
 * Configuration snapshot for fingerprinting
 */
export interface ConfigSnapshot {
  pipeline_id: string;
  pipeline_version: string;
  ruleset_id: string;
  ruleset_version: string;
  ruleset_hash: string;
  adapter_config_hashes: Record<string, string>;
}

/**
 * Compute SHA-256 hash of canonicalized input
 */
export function computeInputFingerprint(batch: InputBatch): string {
  // Sort records by stable keys before hashing
  const sortedSourceRecords = [...batch.source_records].sort(compareCanonicalRecords);
  const sortedTargetRecords = [...batch.target_records].sort(compareCanonicalRecords);

  const canonicalBatch = {
    source_records: sortedSourceRecords,
    target_records: sortedTargetRecords,
  };

  const canonicalJson = stableStringify(canonicalBatch);
  return createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Compute hash for a single canonical record
 */
export function computeRecordFingerprint(
  record: CanonicalTransaction | CanonicalSettlement
): string {
  const canonicalJson = stableStringify(record);
  return createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Compute hash for ruleset configuration
 */
export function computeRulesetHash(rules: unknown): string {
  const canonicalJson = stableStringify(rules);
  return createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Compute combined fingerprint for run snapshot
 */
export function computeRunFingerprint(
  inputFingerprint: string,
  configSnapshot: ConfigSnapshot,
  engineVersion: string
): string {
  const snapshotData = {
    input: inputFingerprint,
    pipeline_id: configSnapshot.pipeline_id,
    pipeline_version: configSnapshot.pipeline_version,
    ruleset_id: configSnapshot.ruleset_id,
    ruleset_version: configSnapshot.ruleset_version,
    ruleset_hash: configSnapshot.ruleset_hash,
    adapter_config_hashes: Object.entries(configSnapshot.adapter_config_hashes).sort(([a], [b]) =>
      a.localeCompare(b)
    ),
    engine_version: engineVersion,
  };

  const canonicalJson = stableStringify(snapshotData);
  return createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Compare function for sorting canonical records
 * Ensures deterministic ordering regardless of input order
 */
function compareCanonicalRecords(
  a: CanonicalTransaction | CanonicalSettlement,
  b: CanonicalTransaction | CanonicalSettlement
): number {
  // Sort by: source, external_id, date, amount, currency
  const sourceCompare = a.source.localeCompare(b.source);
  if (sourceCompare !== 0) return sourceCompare;

  const externalIdCompare = a.external_id.localeCompare(b.external_id);
  if (externalIdCompare !== 0) return externalIdCompare;

  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) return dateCompare;

  const amountCompare = a.amount.localeCompare(b.amount);
  if (amountCompare !== 0) return amountCompare;

  return a.currency.localeCompare(b.currency);
}

/**
 * Normalize a transaction record for canonical hashing
 */
export function normalizeTransaction(raw: Record<string, unknown>): CanonicalTransaction {
  return {
    source: String(raw.source || raw.adapter || "unknown"),
    external_id: String(raw.external_id || raw.id || raw.reference || ""),
    date: normalizeDate(raw.date || raw.created_at || raw.timestamp),
    amount: normalizeAmount(raw.amount || raw.value || 0),
    currency: String(raw.currency || "USD").toUpperCase(),
    account: raw.account ? String(raw.account) : undefined,
    description: raw.description ? normalizeString(String(raw.description)) : undefined,
    metadata: raw.metadata ? (canonicalize(raw.metadata) as Record<string, unknown>) : undefined,
  };
}

/**
 * Normalize a settlement record for canonical hashing
 */
export function normalizeSettlement(raw: Record<string, unknown>): CanonicalSettlement {
  return {
    source: String(raw.source || raw.adapter || "unknown"),
    external_id: String(raw.external_id || raw.id || raw.reference || ""),
    date: normalizeDate(raw.date || raw.settlement_date || raw.timestamp),
    amount: normalizeAmount(raw.amount || raw.value || 0),
    currency: String(raw.currency || "USD").toUpperCase(),
    account: raw.account ? String(raw.account) : undefined,
    description: raw.description ? normalizeString(String(raw.description)) : undefined,
    metadata: raw.metadata ? (canonicalize(raw.metadata) as Record<string, unknown>) : undefined,
  };
}

/**
 * Normalize date to ISO 8601 string
 */
function normalizeDate(date: unknown): string {
  if (!date) return "1970-01-01T00:00:00.000Z";

  const d = date instanceof Date ? date : new Date(date as string | number);

  if (isNaN(d.getTime())) {
    return "1970-01-01T00:00:00.000Z";
  }

  return d.toISOString();
}

/**
 * Normalize amount to string to avoid floating point issues
 */
function normalizeAmount(amount: unknown): string {
  if (typeof amount === "string") {
    const parsed = parseFloat(amount);
    if (!isNaN(parsed)) {
      return parsed.toFixed(2);
    }
    return "0.00";
  }

  if (typeof amount === "number") {
    return amount.toFixed(2);
  }

  return "0.00";
}

/**
 * Normalize string: trim whitespace, consistent case handling
 */
function normalizeString(str: string): string {
  return str.trim().normalize("NFC");
}

/**
 * Create a JSONL stream fingerprint for large datasets
 */
export function computeStreamFingerprint(
  records: AsyncIterable<CanonicalTransaction | CanonicalSettlement>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");

    const processRecords = async () => {
      try {
        for await (const record of records) {
          // Add newline delimiter between records
          hash.update(stableStringify(record));
          hash.update("\n");
        }
        resolve(hash.digest("hex"));
      } catch (error) {
        reject(error);
      }
    };

    processRecords();
  });
}

/**
 * Batch compute fingerprints for multiple records
 */
export function batchComputeRecordFingerprints(
  records: Array<CanonicalTransaction | CanonicalSettlement>
): Map<string, string> {
  const fingerprints = new Map<string, string>();

  for (const record of records) {
    const key = `${record.source}:${record.external_id}`;
    fingerprints.set(key, computeRecordFingerprint(record));
  }

  return fingerprints;
}
