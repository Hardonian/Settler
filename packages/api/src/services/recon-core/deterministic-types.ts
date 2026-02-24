/**
 * Deterministic Execution Types
 *
 * Ensures reconciliation runs are fully reproducible by capturing:
 * - Input hash fingerprinting
 * - Rule version locking
 * - Execution provenance
 * - Deterministic ordering
 *
 * Part of Phase II: Determinism Hardening
 */

import { createHash } from "crypto";

// ============================================================================
// RUN SNAPSHOT
// ============================================================================

/**
 * Immutable snapshot of run inputs for reproducibility
 */
export interface RunSnapshot {
  /** Unique identifier for this snapshot */
  id: string;

  /** Hash of all inputs (deterministic fingerprint) */
  inputHash: string;

  /** ISO timestamp when snapshot was created */
  createdAt: string;

  /** Job configuration at time of run */
  jobConfig: FrozenJobConfig;

  /** Rule versions locked for this run */
  ruleVersions: RuleVersionLock[];

  /** Source data hash (not the data itself) */
  sourceDataHash: string;

  /** Target data hash (not the data itself) */
  targetDataHash: string;

  /** Adapter configurations (encrypted, hashed) */
  adapterConfigHashes: {
    source: string;
    target: string;
  };

  /** Environment version for reproducibility */
  engineVersion: string;

  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Frozen job configuration at time of run
 */
export interface FrozenJobConfig {
  jobId: string;
  tenantId: string;
  name: string;
  description?: string;
  reconStrategy: "deterministic" | "fuzzy" | "ml_based" | "hybrid";
  validationRules: ValidationRuleSnapshot[];
  mappingTemplateId?: string;
  mappingTemplateVersion?: number;
  transformRecipeId?: string;
  transformRecipeVersion?: number;
}

/**
 * Validation rule snapshot with version
 */
export interface ValidationRuleSnapshot {
  id: string;
  version: number;
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "regex";
  value: unknown;
  severity: "warning" | "error";
}

/**
 * Rule version lock for deterministic execution
 */
export interface RuleVersionLock {
  ruleId: string;
  ruleType: "matching" | "validation" | "transformation";
  version: number;
  checksum: string;
  lockedAt: string;
}

// ============================================================================
// EXECUTION PROVENANCE
// ============================================================================

/**
 * Execution provenance log entry
 */
export interface ExecutionProvenance {
  /** Unique identifier */
  id: string;

  /** Run result ID this provenance belongs to */
  runResultId: string;

  /** Snapshot ID for this run */
  snapshotId: string;

  /** Sequence number for ordering */
  sequence: number;

  /** Timestamp of the operation */
  timestamp: string;

  /** Type of operation performed */
  operation: ProvenanceOperation;

  /** Entity affected */
  entityType: "source_record" | "target_record" | "match" | "rule" | "validation";

  /** Entity ID */
  entityId: string;

  /** Rule that triggered this operation (if applicable) */
  ruleId?: string;

  /** Rule version at time of execution */
  ruleVersion?: number;

  /** Confidence score (for matches) */
  confidence?: number;

  /** Actor: system or human */
  actor: "system" | "human";

  /** User ID if actor is human */
  actorUserId?: string;

  /** Operation details */
  details: Record<string, unknown>;

  /** Hash of this entry for integrity */
  entryHash: string;
}

/**
 * Types of provenance operations
 */
export type ProvenanceOperation =
  | "run_started"
  | "data_ingested"
  | "data_transformed"
  | "data_validated"
  | "matching_started"
  | "match_created"
  | "match_rejected"
  | "review_requested"
  | "review_approved"
  | "review_rejected"
  | "run_completed"
  | "run_failed";

// ============================================================================
// DETERMINISTIC MATCH
// ============================================================================

/**
 * Enhanced match with full provenance
 */
export interface DeterministicMatch {
  /** Match ID */
  id: string;

  /** Source record ID */
  sourceId: string;

  /** Target record ID */
  targetId: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Amount matched (if applicable) */
  amount?: number;

  /** Currency (if applicable) */
  currency?: string;

  /** Fields that were matched */
  matchedFields: Record<string, unknown>;

  /** Rule that produced this match */
  ruleId: string;

  /** Rule version at time of match */
  ruleVersion: number;

  /** Match strategy used */
  matchStrategy: "deterministic_payout" | "strong_amount_date" | "fuzzy_amount_date" | "manual";

  /** Timestamp when match was created */
  matchedAt: string;

  /** Actor: system or human */
  actor: "system" | "human";

  /** User ID if manual match */
  actorUserId?: string;

  /** Reason for match (human-readable) */
  reason: string;

  /** Match metadata */
  metadata: Record<string, unknown>;
}

// ============================================================================
// HASH UTILITIES
// ============================================================================

/**
 * Generate deterministic hash for input data
 */
export function generateInputHash(data: unknown): string {
  const canonical = JSON.stringify(data, Object.keys(data as object).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Generate hash for array of records
 */
export function generateDataHash(records: Record<string, unknown>[]): string {
  // Sort records by ID for deterministic ordering
  const sorted = [...records].sort((a, b) => {
    const aId = String(a.id || "");
    const bId = String(b.id || "");
    return aId.localeCompare(bId);
  });

  // Create canonical representation
  const canonical = JSON.stringify(sorted);
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Generate hash for rule configuration
 */
export function generateRuleChecksum(rule: {
  id: string;
  version: number;
  config: unknown;
}): string {
  const canonical = JSON.stringify({
    id: rule.id,
    version: rule.version,
    config: rule.config,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Generate provenance entry hash for integrity
 */
export function generateProvenanceHash(entry: Omit<ExecutionProvenance, "entryHash">): string {
  const canonical = JSON.stringify({
    runResultId: entry.runResultId,
    sequence: entry.sequence,
    timestamp: entry.timestamp,
    operation: entry.operation,
    entityId: entry.entityId,
    details: entry.details,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

// ============================================================================
// SNAPSHOT BUILDER
// ============================================================================

/**
 * Builder for creating immutable run snapshots
 */
export class RunSnapshotBuilder {
  private jobId: string = "";
  private tenantId: string = "";
  private jobConfig: Partial<FrozenJobConfig> = {};
  private ruleVersions: RuleVersionLock[] = [];
  private sourceData: Record<string, unknown>[] = [];
  private targetData: Record<string, unknown>[] = [];
  private sourceAdapterConfig: string = "";
  private targetAdapterConfig: string = "";

  setJobId(jobId: string): this {
    this.jobId = jobId;
    return this;
  }

  setTenantId(tenantId: string): this {
    this.tenantId = tenantId;
    return this;
  }

  setJobConfig(config: Partial<FrozenJobConfig>): this {
    this.jobConfig = config;
    return this;
  }

  setRuleVersions(versions: RuleVersionLock[]): this {
    this.ruleVersions = versions;
    return this;
  }

  setSourceData(data: Record<string, unknown>[]): this {
    this.sourceData = data;
    return this;
  }

  setTargetData(data: Record<string, unknown>[]): this {
    this.targetData = data;
    return this;
  }

  setAdapterConfigs(source: string, target: string): this {
    this.sourceAdapterConfig = source;
    this.targetAdapterConfig = target;
    return this;
  }

  build(): RunSnapshot {
    const sourceDataHash = generateDataHash(this.sourceData);
    const targetDataHash = generateDataHash(this.targetData);

    const snapshot: RunSnapshot = {
      id: `snapshot_${this.jobId}_${Date.now()}`,
      inputHash: "",
      createdAt: new Date().toISOString(),
      jobConfig: {
        jobId: this.jobId,
        tenantId: this.tenantId,
        name: this.jobConfig.name || "",
        description: this.jobConfig.description,
        reconStrategy: this.jobConfig.reconStrategy || "deterministic",
        validationRules: this.jobConfig.validationRules || [],
        mappingTemplateId: this.jobConfig.mappingTemplateId,
        mappingTemplateVersion: this.jobConfig.mappingTemplateVersion,
        transformRecipeId: this.jobConfig.transformRecipeId,
        transformRecipeVersion: this.jobConfig.transformRecipeVersion,
      },
      ruleVersions: this.ruleVersions,
      sourceDataHash,
      targetDataHash,
      adapterConfigHashes: {
        source: generateInputHash(this.sourceAdapterConfig),
        target: generateInputHash(this.targetAdapterConfig),
      },
      engineVersion: process.env.npm_package_version || "1.0.0",
      metadata: {},
    };

    // Generate overall input hash
    snapshot.inputHash = generateInputHash({
      jobConfig: snapshot.jobConfig,
      ruleVersions: snapshot.ruleVersions,
      sourceDataHash,
      targetDataHash,
      adapterConfigHashes: snapshot.adapterConfigHashes,
      engineVersion: snapshot.engineVersion,
    });

    return snapshot;
  }
}

// ============================================================================
// DETERMINISTIC ORDERING
// ============================================================================

/**
 * Sort records deterministically for reproducible processing order
 */
export function sortRecordsDeterministically(
  records: Record<string, unknown>[]
): Record<string, unknown>[] {
  return [...records].sort((a, b) => {
    // Primary sort: by ID
    const aId = String(a.id || "");
    const bId = String(b.id || "");
    const idCompare = aId.localeCompare(bId);
    if (idCompare !== 0) return idCompare;

    // Secondary sort: by timestamp if available
    const aTime = a.occurredAt ? new Date(a.occurredAt as string).getTime() : 0;
    const bTime = b.occurredAt ? new Date(b.occurredAt as string).getTime() : 0;
    return aTime - bTime;
  });
}

/**
 * Sort matches deterministically for reproducible output
 */
export function sortMatchesDeterministically(
  matches: DeterministicMatch[]
): DeterministicMatch[] {
  return [...matches].sort((a, b) => {
    // Primary sort: by confidence (descending)
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }

    // Secondary sort: by source ID
    const sourceCompare = a.sourceId.localeCompare(b.sourceId);
    if (sourceCompare !== 0) return sourceCompare;

    // Tertiary sort: by target ID
    return a.targetId.localeCompare(b.targetId);
  });
}
