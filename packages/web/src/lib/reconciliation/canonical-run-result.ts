import { createHash } from "node:crypto";

export type CanonicalRunStatus = "pending" | "running" | "completed" | "failed" | "unknown";
export type RunSummaryState =
  | "success"
  | "review_needed"
  | "in_progress"
  | "failed"
  | "empty"
  | "unknown";
export type RunProgressState = "not_started" | "in_progress" | "completed" | "failed" | "unknown";
export type ConfigDriftStatus = "none" | "detected" | "indeterminate";

export type RowRationaleCode =
  | "EXACT_MATCH"
  | "WITHIN_TOLERANCE"
  | "OUT_OF_TOLERANCE"
  | "MISSING_COUNTERPART"
  | "RULE_EXCLUDED"
  | "VALIDATION_BLOCKED"
  | "MANUAL_REVIEW_REQUIRED";

export interface CanonicalRunSummary {
  total: number;
  sourceCount: number;
  targetCount: number;
  processed: number;
  matched: number;
  matchedWithTolerance: number;
  unmatched: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflicts: number;
  exceptioned: number;
  unresolved: number;
  ignored: number;
  resolved: number;
}

export interface CanonicalExceptionCounts {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  ignored: number;
  unresolved: number;
}

export interface CanonicalRunProvenance {
  runId: string;
  runResultId: string | null;
  snapshotId: string | null;
  inputHash: string | null;
  executedAt: string | null;
  completedAt: string | null;
  configSource: string | null;
  configVersion: string | null;
  templateId: string | null;
  matchingRuleIds: string[];
  ruleVersionCount: number;
  sourceAdapter: string | null;
  targetAdapter: string | null;
  sourceReference: string;
}

export interface AdapterDriftSignal {
  status: ConfigDriftStatus;
  comparisonMode: "safe_fingerprint" | "unavailable";
  sourceChanged: boolean | null;
  targetChanged: boolean | null;
  sourceHashPresent: boolean;
  targetHashPresent: boolean;
}

export interface CanonicalConfigDrift {
  status: ConfigDriftStatus;
  strategyChanged: boolean;
  templateChanged: boolean;
  validationRulesChanged: boolean;
  adapter: AdapterDriftSignal;
  notes: string[];
}

export interface CanonicalRowRationale {
  code: RowRationaleCode;
  category: "match" | "mismatch" | "exception" | "review";
  reasonTag: string;
  toleranceApplied: boolean;
  ruleReference: string | null;
  provenanceReference: string;
}

export interface CanonicalRowResult {
  rowId: string;
  sourceRecordId: string;
  targetRecordId: string | null;
  classification: string;
  confidence: number;
  amountDifferenceMinor: number;
  dateDifferenceDays: number;
  rationale: CanonicalRowRationale;
  isDisputeRelated: boolean;
  isReversalRelated: boolean;
}

export interface CanonicalRunResultContract {
  id: string;
  tenantId: string;
  name: string;
  lifecycle: {
    status: CanonicalRunStatus;
    statusLabel: string;
    isTerminal: boolean;
    progressPercent: number;
    progressState: RunProgressState;
  };
  summary: CanonicalRunSummary;
  summaryState: RunSummaryState;
  provenance: CanonicalRunProvenance;
  configDrift: CanonicalConfigDrift;
  exceptions: CanonicalExceptionCounts;
  rowResults: CanonicalRowResult[];
}

export interface ReconJobRecordLike {
  id: string;
  name?: string | null;
  status?: string | null;
  tenant_id?: string;
  tenantId?: string;
  created_at?: string;
  createdAt?: Date | string;
  source_adapter?: string | null;
  sourceAdapter?: string | null;
  target_adapter?: string | null;
  targetAdapter?: string | null;
  recon_strategy?: string | null;
  reconStrategy?: string | null;
  template_id?: string | null;
  templateId?: string | null;
  validation_rules?: unknown;
  validationRules?: unknown;
  source_config_encrypted?: string | null;
  sourceConfigEncrypted?: string | null;
  target_config_encrypted?: string | null;
  targetConfigEncrypted?: string | null;
}

export interface ReconResultRecordLike {
  id: string;
  recon_job_id?: string;
  reconJobId?: string;
  status?: string | null;
  started_at?: string | null;
  startedAt?: Date | string | null;
  completed_at?: string | null;
  completedAt?: Date | string | null;
  source_count?: number | null;
  sourceCount?: number | null;
  target_count?: number | null;
  targetCount?: number | null;
  matched_count?: number | null;
  matchedCount?: number | null;
  unmatched_source_count?: number | null;
  unmatchedSourceCount?: number | null;
  unmatched_target_count?: number | null;
  unmatchedTargetCount?: number | null;
  conflict_count?: number | null;
  conflictCount?: number | null;
  error_message?: string | null;
  errorMessage?: string | null;
  summary?: unknown;
  metadata?: unknown;
  input_hash?: string | null;
  inputHash?: string | null;
  snapshot_id?: string | null;
  snapshotId?: string | null;
}

export interface SnapshotRecordLike {
  id?: string | null;
  input_hash?: string | null;
  inputHash?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  job_config?: unknown;
  jobConfig?: unknown;
  rule_versions?: unknown;
  ruleVersions?: unknown;
  adapter_config_hashes?: unknown;
  adapterConfigHashes?: unknown;
}

export interface DeterministicMatchRowLike {
  stable_match_id: string;
  left_record_id: string;
  right_record_id: string | null;
  confidence_score: number | string | null;
  rule_id: string | null;
  rule_version: number | null;
  match_rationale: unknown;
  matched_at: Date | string;
}

type RuntimeMatchLike = {
  transaction_id?: unknown;
  source_record_id?: unknown;
  target_record_id?: unknown;
  classification?: unknown;
  confidence?: unknown;
  amount_difference_minor?: unknown;
  date_difference_days?: unknown;
  manual_review_rationale_codes?: unknown;
  rule_id?: unknown;
  ruleId?: unknown;
  is_dispute_related?: unknown;
  is_reversal_related?: unknown;
};

const STATUS_ALIAS_TO_CANONICAL: Record<string, CanonicalRunStatus> = {
  pending: "pending",
  queued: "pending",
  created: "pending",
  active: "pending",
  running: "running",
  processing: "running",
  ingesting: "running",
  validating: "running",
  reconciling: "running",
  in_progress: "running",
  completed: "completed",
  succeeded: "completed",
  success: "completed",
  approved: "completed",
  failed: "failed",
  error: "failed",
  dead: "failed",
  cancelled: "failed",
  canceled: "failed",
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function asIsoString(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

function getSummaryObject(result: ReconResultRecordLike | null): Record<string, unknown> {
  return asObject(result?.summary) || {};
}

function getMetadataObject(result: ReconResultRecordLike | null): Record<string, unknown> {
  return asObject(result?.metadata) || {};
}

function firstDefinedString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    if (key in source) {
      return asNumber(source[key]);
    }
  }

  return 0;
}

function pickArray(source: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    if (key in source) {
      return asArray(source[key]).filter((entry): entry is string => typeof entry === "string");
    }
  }

  return [];
}

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableNormalize(entry));
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    for (const key of Object.keys(objectValue).sort()) {
      normalized[key] = stableNormalize(objectValue[key]);
    }

    return normalized;
  }

  return value;
}

function stableStringify(value: unknown): string | null {
  try {
    return JSON.stringify(stableNormalize(value));
  } catch {
    return null;
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function computeSafeAdapterFingerprint(raw: string | null | undefined): string | null {
  const candidate = asString(raw);
  if (!candidate) {
    return null;
  }

  let normalizedSource: unknown = candidate;

  try {
    normalizedSource = JSON.parse(candidate);
  } catch {
    normalizedSource = candidate;
  }

  const serialized = stableStringify(normalizedSource);
  if (!serialized) {
    return null;
  }

  return sha256(serialized);
}

function normalizeAdapterHashes(raw: unknown): { source: string | null; target: string | null } {
  const objectValue = asObject(raw);
  if (!objectValue) {
    return { source: null, target: null };
  }

  return {
    source: firstDefinedString(objectValue.source, objectValue.sourceHash, objectValue.left),
    target: firstDefinedString(objectValue.target, objectValue.targetHash, objectValue.right),
  };
}

function normalizeRuntimeMatch(input: unknown): RuntimeMatchLike | null {
  const value = asObject(input);
  if (!value) {
    return null;
  }

  const sourceRecordId = firstDefinedString(value.source_record_id, value.sourceRecordId);
  if (!sourceRecordId) {
    return null;
  }

  return {
    transaction_id: firstDefinedString(value.transaction_id, value.transactionId) || sourceRecordId,
    source_record_id: sourceRecordId,
    target_record_id: firstDefinedString(value.target_record_id, value.targetRecordId),
    classification: firstDefinedString(value.classification, value.match_type) || "MANUAL_REVIEW",
    confidence: asNumber(value.confidence),
    amount_difference_minor: asNumber(
      value.amount_difference_minor ?? value.amountDifferenceMinor ?? value.amount_diff_minor
    ),
    date_difference_days: asNumber(
      value.date_difference_days ?? value.dateDifferenceDays ?? value.date_diff_days
    ),
    manual_review_rationale_codes:
      asArray(value.manual_review_rationale_codes ?? value.manualReviewRationaleCodes) || [],
    rule_id: firstDefinedString(value.rule_id, value.ruleId),
    is_dispute_related: Boolean(value.is_dispute_related ?? value.isDisputeRelated),
    is_reversal_related: Boolean(value.is_reversal_related ?? value.isReversalRelated),
  };
}

function normalizeDeterministicRationaleCode(input: {
  classification: string;
  warnings: string[];
  confidence: number;
}): {
  code: RowRationaleCode;
  category: "match" | "mismatch" | "exception" | "review";
  reasonTag: string;
  toleranceApplied: boolean;
} {
  const classification = input.classification.toUpperCase();

  if (classification === "EXACT_MATCH") {
    return {
      code: "EXACT_MATCH",
      category: "match",
      reasonTag: "exact_match",
      toleranceApplied: false,
    };
  }

  if (classification === "FUZZY_MATCH" || classification === "GROUPED_MATCH") {
    return {
      code: "WITHIN_TOLERANCE",
      category: "match",
      reasonTag: "within_tolerance",
      toleranceApplied: true,
    };
  }

  if (classification.includes("UNMATCHED")) {
    return {
      code: "MISSING_COUNTERPART",
      category: "mismatch",
      reasonTag: "missing_counterpart",
      toleranceApplied: false,
    };
  }

  if (
    classification === "TIMING_VARIANCE" ||
    classification === "FEE_VARIANCE" ||
    classification === "FX_VARIANCE"
  ) {
    return {
      code: "OUT_OF_TOLERANCE",
      category: "mismatch",
      reasonTag: "out_of_tolerance",
      toleranceApplied: true,
    };
  }

  if (
    classification === "STATUS_CONFLICT" ||
    classification === "DUPLICATE_DETECTED" ||
    classification === "DISPUTE_RELATED" ||
    classification === "REVERSAL_RELATED" ||
    classification === "MANUAL_REVIEW"
  ) {
    return {
      code: "MANUAL_REVIEW_REQUIRED",
      category: "review",
      reasonTag: "manual_review_required",
      toleranceApplied: false,
    };
  }

  if (input.warnings.length > 0 || input.confidence < 0.5) {
    return {
      code: "VALIDATION_BLOCKED",
      category: "exception",
      reasonTag: "validation_blocked",
      toleranceApplied: false,
    };
  }

  return {
    code: "MANUAL_REVIEW_REQUIRED",
    category: "review",
    reasonTag: "manual_review_required",
    toleranceApplied: false,
  };
}

function runtimeRowToCanonicalRow(
  runtimeMatch: RuntimeMatchLike,
  runId: string,
  runResultId: string | null,
  snapshotId: string | null
): CanonicalRowResult {
  const classification = String(runtimeMatch.classification || "MANUAL_REVIEW").toUpperCase();
  const manualCodes = asArray(runtimeMatch.manual_review_rationale_codes)
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.toLowerCase());

  const rationaleBase = normalizeDeterministicRationaleCode({
    classification,
    warnings: manualCodes,
    confidence: asNumber(runtimeMatch.confidence),
  });

  return {
    rowId:
      firstDefinedString(runtimeMatch.transaction_id, runtimeMatch.source_record_id) ||
      `${runId}:${Math.random().toString(36).slice(2)}`,
    sourceRecordId: String(runtimeMatch.source_record_id || "unknown"),
    targetRecordId: firstDefinedString(runtimeMatch.target_record_id) || null,
    classification,
    confidence: asNumber(runtimeMatch.confidence),
    amountDifferenceMinor: asNumber(runtimeMatch.amount_difference_minor),
    dateDifferenceDays: asNumber(runtimeMatch.date_difference_days),
    rationale: {
      code: rationaleBase.code,
      category: rationaleBase.category,
      reasonTag: manualCodes[0] || rationaleBase.reasonTag,
      toleranceApplied: rationaleBase.toleranceApplied,
      ruleReference: firstDefinedString(runtimeMatch.rule_id, runtimeMatch.ruleId),
      provenanceReference: [runId, runResultId || "result", snapshotId || "snapshot", String(runtimeMatch.source_record_id || "source")].join(":"),
    },
    isDisputeRelated: Boolean(runtimeMatch.is_dispute_related),
    isReversalRelated: Boolean(runtimeMatch.is_reversal_related),
  };
}

function deterministicRowToCanonicalRow(
  row: DeterministicMatchRowLike,
  runId: string,
  runResultId: string | null,
  snapshotId: string | null
): CanonicalRowResult {
  const rationale = asObject(row.match_rationale) || {};
  const warnings = asArray(rationale.warnings)
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.toLowerCase());
  const rawMatchType =
    firstDefinedString(rationale.match_type, rationale.matchType)?.toUpperCase() || "MANUAL_REVIEW";

  const matchTypeToClassification: Record<string, string> = {
    EXACT: "EXACT_MATCH",
    FUZZY: "FUZZY_MATCH",
    RANGE: "TIMING_VARIANCE",
    COMPOSITE: "GROUPED_MATCH",
  };

  const classification = matchTypeToClassification[rawMatchType] || rawMatchType;
  const rationaleBase = normalizeDeterministicRationaleCode({
    classification,
    warnings,
    confidence: asNumber(row.confidence_score),
  });

  return {
    rowId: row.stable_match_id,
    sourceRecordId: row.left_record_id,
    targetRecordId: row.right_record_id || null,
    classification,
    confidence: asNumber(row.confidence_score),
    amountDifferenceMinor: 0,
    dateDifferenceDays: 0,
    rationale: {
      code: rationaleBase.code,
      category: rationaleBase.category,
      reasonTag: warnings[0] || rationaleBase.reasonTag,
      toleranceApplied: rationaleBase.toleranceApplied,
      ruleReference: row.rule_id || null,
      provenanceReference: [runId, runResultId || "result", snapshotId || "snapshot", row.stable_match_id].join(":"),
    },
    isDisputeRelated: false,
    isReversalRelated: false,
  };
}

export function normalizeRunStatus(raw: string | null | undefined): CanonicalRunStatus {
  if (!raw) {
    return "unknown";
  }

  const normalized = raw.trim().toLowerCase();
  return STATUS_ALIAS_TO_CANONICAL[normalized] || "unknown";
}

export function deriveRunStatus(
  jobStatus: string | null | undefined,
  resultStatus: string | null | undefined
): CanonicalRunStatus {
  const result = normalizeRunStatus(resultStatus);
  if (result !== "unknown") {
    return result;
  }

  return normalizeRunStatus(jobStatus);
}

export function getRunStatusLabel(status: CanonicalRunStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

export function isTerminalRunState(status: CanonicalRunStatus): boolean {
  return status === "completed" || status === "failed";
}

export function extractProgressPercent(result: ReconResultRecordLike | null): number {
  const metadata = getMetadataObject(result);
  const progress = asObject(metadata.progress);
  const metadataPercent = progress ? asNumber(progress.percentage) : NaN;
  if (Number.isFinite(metadataPercent)) {
    return Math.max(0, Math.min(100, Math.round(metadataPercent)));
  }

  const status = normalizeRunStatus(firstDefinedString(result?.status));
  const sourceCount = asNumber(result?.source_count ?? result?.sourceCount);
  const targetCount = asNumber(result?.target_count ?? result?.targetCount);
  const matched = asNumber(result?.matched_count ?? result?.matchedCount);
  const unmatchedSource = asNumber(result?.unmatched_source_count ?? result?.unmatchedSourceCount);
  const unmatchedTarget = asNumber(result?.unmatched_target_count ?? result?.unmatchedTargetCount);
  const conflicts = asNumber(result?.conflict_count ?? result?.conflictCount);

  const total = sourceCount + targetCount;
  const resolved = matched + unmatchedSource + unmatchedTarget + conflicts;

  if (total > 0 && (status === "running" || status === "pending")) {
    return Math.max(0, Math.min(100, Math.round((resolved / total) * 100)));
  }

  if (status === "completed" || status === "failed") {
    return 100;
  }

  return 0;
}

function buildRowResults(input: {
  runId: string;
  runResultId: string | null;
  snapshotId: string | null;
  result: ReconResultRecordLike | null;
  deterministicRows?: DeterministicMatchRowLike[];
}): CanonicalRowResult[] {
  const deterministicRows = input.deterministicRows || [];
  if (deterministicRows.length > 0) {
    return deterministicRows.map((row) =>
      deterministicRowToCanonicalRow(row, input.runId, input.runResultId, input.snapshotId)
    );
  }

  const metadata = getMetadataObject(input.result);
  const summary = getSummaryObject(input.result);
  const runtimeRaw =
    metadata.runtime_matches || metadata.runtimeMatches || summary.runtime_matches || [];

  return asArray(runtimeRaw)
    .map((entry) => normalizeRuntimeMatch(entry))
    .filter((entry): entry is RuntimeMatchLike => Boolean(entry))
    .map((entry) => runtimeRowToCanonicalRow(entry, input.runId, input.runResultId, input.snapshotId));
}

function buildCanonicalRunSummary(input: {
  result: ReconResultRecordLike | null;
  exceptionCounts: CanonicalExceptionCounts;
  rowResults: CanonicalRowResult[];
}): CanonicalRunSummary {
  const result = input.result;
  const summary = getSummaryObject(result);

  const sourceCount = asNumber(result?.source_count ?? result?.sourceCount);
  const targetCount = asNumber(result?.target_count ?? result?.targetCount);
  const matched = asNumber(result?.matched_count ?? result?.matchedCount);
  const unmatchedSourceCount = asNumber(result?.unmatched_source_count ?? result?.unmatchedSourceCount);
  const unmatchedTargetCount = asNumber(result?.unmatched_target_count ?? result?.unmatchedTargetCount);
  const conflicts = asNumber(result?.conflict_count ?? result?.conflictCount);

  const matchedWithToleranceFromSummary = pickNumber(summary, [
    "matched_with_tolerance",
    "matchedWithTolerance",
    "within_tolerance",
    "withinTolerance",
  ]);

  const matchedWithToleranceFromRows = input.rowResults.filter(
    (row) => row.rationale.code === "WITHIN_TOLERANCE"
  ).length;

  const matchedWithTolerance = Math.max(
    matchedWithToleranceFromSummary,
    matchedWithToleranceFromRows
  );

  const processedFromSummary = pickNumber(summary, ["processed", "processed_count", "processedCount"]);
  const processedFallback = matched + unmatchedSourceCount + unmatchedTargetCount + conflicts;
  const processed = Math.max(processedFromSummary, processedFallback);

  const exceptionedFromSummary = pickNumber(summary, [
    "exceptioned",
    "exception_count",
    "exceptionCount",
    "exceptions",
  ]);

  const ignoredFromSummary = pickNumber(summary, ["ignored", "ignored_count", "ignoredCount"]);
  const resolvedFromSummary = pickNumber(summary, ["resolved", "resolved_count", "resolvedCount"]);
  const unresolvedFromSummary = pickNumber(summary, [
    "unresolved",
    "unresolved_count",
    "unresolvedCount",
  ]);

  const unresolved = Math.max(input.exceptionCounts.unresolved, unresolvedFromSummary);
  const ignored = Math.max(input.exceptionCounts.ignored, ignoredFromSummary);
  const resolved = Math.max(input.exceptionCounts.resolved, resolvedFromSummary);

  const exceptioned = Math.max(
    exceptionedFromSummary,
    input.exceptionCounts.total,
    unresolved + ignored + resolved
  );

  return {
    total: sourceCount + targetCount,
    sourceCount,
    targetCount,
    processed,
    matched,
    matchedWithTolerance,
    unmatched: unmatchedSourceCount + unmatchedTargetCount,
    unmatchedSourceCount,
    unmatchedTargetCount,
    conflicts,
    exceptioned,
    unresolved,
    ignored,
    resolved,
  };
}

export function getRunSummaryState(
  status: CanonicalRunStatus,
  summary: CanonicalRunSummary
): RunSummaryState {
  if (status === "failed") {
    return "failed";
  }

  if (status === "pending" || status === "running") {
    return "in_progress";
  }

  if (status === "completed") {
    if (summary.total <= 0) {
      return "empty";
    }

    if (summary.unmatched > 0 || summary.conflicts > 0 || summary.unresolved > 0) {
      return "review_needed";
    }

    return "success";
  }

  return "unknown";
}

export function getRunProgressState(
  status: CanonicalRunStatus,
  progressPercent: number
): RunProgressState {
  if (status === "failed") {
    return "failed";
  }

  if (status === "completed") {
    return "completed";
  }

  if ((status === "pending" || status === "running") && progressPercent <= 0) {
    return "not_started";
  }

  if (status === "pending" || status === "running") {
    return "in_progress";
  }

  return "unknown";
}

function extractProvenance(result: ReconResultRecordLike | null): Record<string, unknown> {
  const summary = getSummaryObject(result);
  const metadata = getMetadataObject(result);

  const summaryProvenance =
    asObject(summary._provenance) ||
    asObject(summary.provenance) ||
    asObject(summary.provenance_data) ||
    null;

  const metadataProvenance =
    asObject(metadata._provenance) ||
    asObject(metadata.provenance) ||
    asObject(metadata.provenance_data) ||
    null;

  return summaryProvenance || metadataProvenance || {};
}

function extractRuleVersionCount(snapshot: SnapshotRecordLike | null): number {
  const ruleVersions = asArray(snapshot?.rule_versions ?? snapshot?.ruleVersions);
  return ruleVersions.length;
}

function buildProvenance(input: {
  runId: string;
  runResultId: string | null;
  job: ReconJobRecordLike;
  result: ReconResultRecordLike | null;
  snapshot: SnapshotRecordLike | null;
}): CanonicalRunProvenance {
  const provenance = extractProvenance(input.result);

  const snapshotId =
    firstDefinedString(
      input.result?.snapshot_id,
      input.result?.snapshotId,
      input.snapshot?.id
    ) || null;

  const matchingRuleIds = pickArray(provenance, ["matchingRuleIds", "matching_rule_ids"]);

  const sourceAdapter = firstDefinedString(input.job.source_adapter, input.job.sourceAdapter);
  const targetAdapter = firstDefinedString(input.job.target_adapter, input.job.targetAdapter);

  return {
    runId: input.runId,
    runResultId: input.runResultId,
    snapshotId,
    inputHash:
      firstDefinedString(
        input.result?.input_hash,
        input.result?.inputHash,
        input.snapshot?.input_hash,
        input.snapshot?.inputHash
      ) || null,
    executedAt: firstDefinedString(input.result?.started_at, input.result?.startedAt),
    completedAt: firstDefinedString(input.result?.completed_at, input.result?.completedAt),
    configSource: firstDefinedString(provenance.configSource, provenance.config_source),
    configVersion: firstDefinedString(provenance.configVersion, provenance.config_version),
    templateId:
      firstDefinedString(
        provenance.templateId,
        provenance.template_id,
        input.job.template_id,
        input.job.templateId
      ) || null,
    matchingRuleIds,
    ruleVersionCount: extractRuleVersionCount(input.snapshot),
    sourceAdapter,
    targetAdapter,
    sourceReference: [
      sourceAdapter || "source",
      targetAdapter || "target",
      input.runResultId || "result",
    ].join(":"),
  };
}

function compareValidationRules(snapshotRules: unknown, currentRules: unknown): boolean {
  if (!Array.isArray(snapshotRules) || !Array.isArray(currentRules)) {
    return false;
  }

  if (snapshotRules.length !== currentRules.length) {
    return true;
  }

  const snapshotSerialized = stableStringify(snapshotRules);
  const currentSerialized = stableStringify(currentRules);

  if (!snapshotSerialized || !currentSerialized) {
    return false;
  }

  return snapshotSerialized !== currentSerialized;
}

function buildConfigDrift(input: {
  job: ReconJobRecordLike;
  snapshot: SnapshotRecordLike | null;
}): CanonicalConfigDrift {
  const snapshotJobConfig = asObject(input.snapshot?.job_config ?? input.snapshot?.jobConfig);
  const currentStrategy = firstDefinedString(input.job.recon_strategy, input.job.reconStrategy);
  const snapshotStrategy = firstDefinedString(
    snapshotJobConfig?.reconStrategy,
    snapshotJobConfig?.recon_strategy
  );

  const currentTemplateId = firstDefinedString(input.job.template_id, input.job.templateId);
  const snapshotTemplateId = firstDefinedString(
    snapshotJobConfig?.templateId,
    snapshotJobConfig?.template_id,
    snapshotJobConfig?.mappingTemplateId,
    snapshotJobConfig?.mapping_template_id
  );

  const currentValidationRules = input.job.validation_rules ?? input.job.validationRules;
  const snapshotValidationRules = snapshotJobConfig?.validationRules ?? snapshotJobConfig?.validation_rules;

  const strategyChanged =
    Boolean(currentStrategy && snapshotStrategy) &&
    currentStrategy!.toLowerCase() !== snapshotStrategy!.toLowerCase();
  const templateChanged =
    Boolean(currentTemplateId && snapshotTemplateId) && currentTemplateId !== snapshotTemplateId;
  const validationRulesChanged = compareValidationRules(snapshotValidationRules, currentValidationRules);

  const snapshotHashes = normalizeAdapterHashes(
    input.snapshot?.adapter_config_hashes ?? input.snapshot?.adapterConfigHashes
  );
  const currentSourceFingerprint = computeSafeAdapterFingerprint(
    firstDefinedString(input.job.source_config_encrypted, input.job.sourceConfigEncrypted)
  );
  const currentTargetFingerprint = computeSafeAdapterFingerprint(
    firstDefinedString(input.job.target_config_encrypted, input.job.targetConfigEncrypted)
  );

  const sourceHashPresent = Boolean(snapshotHashes.source);
  const targetHashPresent = Boolean(snapshotHashes.target);

  let sourceChanged: boolean | null = null;
  let targetChanged: boolean | null = null;
  if (snapshotHashes.source && currentSourceFingerprint) {
    sourceChanged = snapshotHashes.source !== currentSourceFingerprint;
  }
  if (snapshotHashes.target && currentTargetFingerprint) {
    targetChanged = snapshotHashes.target !== currentTargetFingerprint;
  }

  const adapterKnown = sourceChanged !== null || targetChanged !== null;
  const adapterChanged = Boolean(sourceChanged || targetChanged);

  const notes: string[] = [];
  if (strategyChanged) {
    notes.push("Reconciliation strategy changed since this run executed.");
  }
  if (templateChanged) {
    notes.push("Template reference changed since this run executed.");
  }
  if (validationRulesChanged) {
    notes.push("Validation rule definitions changed since this run executed.");
  }

  if (adapterKnown && adapterChanged) {
    notes.push("Adapter configuration fingerprint changed since this run executed.");
  } else if (!adapterKnown) {
    notes.push("Adapter drift could not be fully evaluated from available safe fingerprints.");
  }

  let adapterStatus: ConfigDriftStatus = "none";
  if (adapterChanged) {
    adapterStatus = "detected";
  } else if (!adapterKnown) {
    adapterStatus = "indeterminate";
  }

  let status: ConfigDriftStatus = "none";
  if (strategyChanged || templateChanged || validationRulesChanged || adapterStatus === "detected") {
    status = "detected";
  } else if (adapterStatus === "indeterminate") {
    status = "indeterminate";
  }

  return {
    status,
    strategyChanged,
    templateChanged,
    validationRulesChanged,
    adapter: {
      status: adapterStatus,
      comparisonMode: adapterKnown ? "safe_fingerprint" : "unavailable",
      sourceChanged,
      targetChanged,
      sourceHashPresent,
      targetHashPresent,
    },
    notes,
  };
}

export function buildCanonicalRunResultContract(input: {
  job: ReconJobRecordLike;
  result: ReconResultRecordLike | null;
  snapshot?: SnapshotRecordLike | null;
  exceptionCounts?: Partial<CanonicalExceptionCounts>;
  deterministicRows?: DeterministicMatchRowLike[];
}): CanonicalRunResultContract {
  const runId = input.job.id;
  const tenantId = firstDefinedString(input.job.tenant_id, input.job.tenantId) || "unknown";
  const runResultId = input.result?.id || null;
  const snapshotId =
    firstDefinedString(
      input.result?.snapshot_id,
      input.result?.snapshotId,
      input.snapshot?.id
    ) || null;

  const exceptionCounts: CanonicalExceptionCounts = {
    total: asNumber(input.exceptionCounts?.total),
    pending: asNumber(input.exceptionCounts?.pending),
    investigating: asNumber(input.exceptionCounts?.investigating),
    resolved: asNumber(input.exceptionCounts?.resolved),
    ignored: asNumber(input.exceptionCounts?.ignored),
    unresolved:
      asNumber(input.exceptionCounts?.unresolved) ||
      asNumber(input.exceptionCounts?.pending) + asNumber(input.exceptionCounts?.investigating),
  };

  const rowResults = buildRowResults({
    runId,
    runResultId,
    snapshotId,
    result: input.result,
    deterministicRows: input.deterministicRows,
  });

  const status = deriveRunStatus(input.job.status, input.result?.status);
  const progressPercent = extractProgressPercent(input.result);
  const lifecycle = {
    status,
    statusLabel: getRunStatusLabel(status),
    isTerminal: isTerminalRunState(status),
    progressPercent,
    progressState: getRunProgressState(status, progressPercent),
  };

  const summary = buildCanonicalRunSummary({
    result: input.result,
    exceptionCounts,
    rowResults,
  });

  return {
    id: runId,
    tenantId,
    name: firstDefinedString(input.job.name) || "Reconciliation Run",
    lifecycle,
    summary,
    summaryState: getRunSummaryState(status, summary),
    provenance: buildProvenance({
      runId,
      runResultId,
      job: input.job,
      result: input.result,
      snapshot: input.snapshot || null,
    }),
    configDrift: buildConfigDrift({
      job: input.job,
      snapshot: input.snapshot || null,
    }),
    exceptions: exceptionCounts,
    rowResults,
  };
}

export interface CanonicalRunTruth {
  status: CanonicalRunStatus;
  statusLabel: string;
  summary: {
    total: number;
    sourceCount: number;
    targetCount: number;
    matched: number;
    unmatched: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflicts: number;
  };
  summaryState: RunSummaryState;
  progressPercent: number;
  progressState: RunProgressState;
  isTerminal: boolean;
}

export function toLegacyRunTruth(contract: CanonicalRunResultContract): CanonicalRunTruth {
  return {
    status: contract.lifecycle.status,
    statusLabel: contract.lifecycle.statusLabel,
    summary: {
      total: contract.summary.total,
      sourceCount: contract.summary.sourceCount,
      targetCount: contract.summary.targetCount,
      matched: contract.summary.matched,
      unmatched: contract.summary.unmatched,
      unmatchedSourceCount: contract.summary.unmatchedSourceCount,
      unmatchedTargetCount: contract.summary.unmatchedTargetCount,
      conflicts: contract.summary.conflicts,
    },
    summaryState: contract.summaryState,
    progressPercent: contract.lifecycle.progressPercent,
    progressState: contract.lifecycle.progressState,
    isTerminal: contract.lifecycle.isTerminal,
  };
}

export function buildLegacyRunSummary(result: ReconResultRecordLike | null): CanonicalRunTruth["summary"] {
  const contract = buildCanonicalRunResultContract({
    job: { id: result?.recon_job_id || result?.reconJobId || "unknown", status: result?.status },
    result,
  });

  return toLegacyRunTruth(contract).summary;
}
