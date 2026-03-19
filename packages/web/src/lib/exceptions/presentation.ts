export type ExceptionWorkflowState = "pending" | "investigating" | "resolved" | "ignored";
export type ExceptionResolutionState = Extract<ExceptionWorkflowState, "resolved" | "ignored">;

export interface ExceptionAuditEntry {
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

type ExceptionMetadata = Record<string, unknown>;

type ResolutionRecord = {
  status?: unknown;
  notes?: unknown;
  resolvedBy?: unknown;
  resolvedAt?: unknown;
  ignoredBy?: unknown;
  ignoredAt?: unknown;
};

type ReopenRecord = {
  reopenedBy?: unknown;
  reopenedAt?: unknown;
  notes?: unknown;
};

export interface ExceptionPresentationInput {
  driftType?: string | null;
  fieldPath?: string | null;
  expectedValue?: unknown;
  actualValue?: unknown;
  metadata?: unknown;
  createdAt?: Date | string | null;
  acknowledged?: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: Date | string | null;
}

export interface ExceptionReasonTagInput {
  driftType?: string | null;
  fieldPath?: string | null;
  metadata?: unknown;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asDateString(value: unknown): string | null {
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

function humanizeFieldPath(fieldPath?: string | null): string | null {
  if (!fieldPath) {
    return null;
  }

  return fieldPath
    .split(".")
    .filter(Boolean)
    .map((segment) => segment.replace(/_/g, " "))
    .join(" -> ");
}

function serializeValue(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function normalizeReasonTag(value: string): string | null {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized.length > 0 ? normalized : null;
}

export function getExceptionResolutionState(metadata: unknown): ExceptionResolutionState | null {
  const parsedMetadata = asObject(metadata);
  const resolution = asObject(parsedMetadata?.resolution) as ResolutionRecord | null;
  const resolutionStatus =
    resolution && typeof resolution.status === "string" ? resolution.status.toLowerCase() : null;

  if (resolutionStatus === "resolved" || resolutionStatus === "ignored") {
    return resolutionStatus;
  }

  return null;
}

export function buildExceptionReasonTags(input: ExceptionReasonTagInput): string[] {
  const tags = new Set<string>();
  const metadata = asObject(input.metadata);
  const driftType = typeof input.driftType === "string" ? input.driftType.toLowerCase() : null;

  if (driftType) {
    switch (driftType) {
      case "amount_mismatch":
        tags.add("amount_out_of_tolerance");
        break;
      case "timing_difference":
        tags.add("timing_window_difference");
        break;
      case "missing_transaction":
        tags.add("missing_counterparty_record");
        break;
      case "duplicate_transaction":
        tags.add("duplicate_record");
        break;
      case "currency_mismatch":
        tags.add("currency_mismatch");
        break;
      default: {
        const normalized = normalizeReasonTag(driftType);
        if (normalized) {
          tags.add(normalized);
        }
      }
    }
  }

  if (input.fieldPath) {
    const normalizedPath = normalizeReasonTag(input.fieldPath);
    if (normalizedPath) {
      tags.add(`field:${normalizedPath}`);
    }
  }

  const rationaleCodes = metadata?.rationale_codes;
  if (Array.isArray(rationaleCodes)) {
    for (const code of rationaleCodes) {
      if (typeof code === "string") {
        const normalized = normalizeReasonTag(code);
        if (normalized) {
          tags.add(normalized);
        }
      }
    }
  }

  if (metadata?.status_conflict === true) {
    tags.add("status_conflict");
  }
  if (metadata?.is_dispute_related === true) {
    tags.add("dispute_related");
  }
  if (metadata?.is_reversal_related === true) {
    tags.add("reversal_related");
  }

  return Array.from(tags).slice(0, 6);
}

export function getExceptionWorkflowState(input: {
  acknowledged?: boolean;
  metadata?: unknown;
}): ExceptionWorkflowState {
  const resolutionStatus = getExceptionResolutionState(input.metadata);
  if (resolutionStatus === "ignored") {
    return "ignored";
  }
  if (resolutionStatus === "resolved") {
    return "resolved";
  }

  if (input.acknowledged) {
    return "investigating";
  }

  return "pending";
}

export function buildExceptionDescription(input: {
  driftType?: string | null;
  fieldPath?: string | null;
  expectedValue?: unknown;
  actualValue?: unknown;
}): string {
  const fieldLabel = humanizeFieldPath(input.fieldPath);
  const expected = serializeValue(input.expectedValue);
  const actual = serializeValue(input.actualValue);

  if (fieldLabel && expected && actual) {
    return `${fieldLabel} differs from expected value`;
  }

  if (fieldLabel) {
    return `Field mismatch: ${fieldLabel}`;
  }

  if (input.driftType) {
    return input.driftType.replace(/_/g, " ");
  }

  return "Drift detected";
}

export function buildExceptionStatusDetail(input: ExceptionPresentationInput): string {
  const status = getExceptionWorkflowState({
    acknowledged: input.acknowledged,
    metadata: input.metadata,
  });

  const metadata = asObject(input.metadata);
  const resolution = asObject(metadata?.resolution) as ResolutionRecord | null;

  if (status === "ignored") {
    const actor =
      typeof resolution?.ignoredBy === "string"
        ? resolution.ignoredBy
        : input.acknowledgedBy || "an operator";
    const timestamp = asDateString(resolution?.ignoredAt) || asDateString(input.acknowledgedAt);
    return timestamp
      ? `Ignored by ${actor} on ${new Date(timestamp).toLocaleString()}.`
      : `Ignored by ${actor}.`;
  }

  if (status === "resolved") {
    const actor =
      typeof resolution?.resolvedBy === "string"
        ? resolution.resolvedBy
        : input.acknowledgedBy || "an operator";
    const timestamp = asDateString(resolution?.resolvedAt) || asDateString(input.acknowledgedAt);
    return timestamp
      ? `Marked resolved by ${actor} on ${new Date(timestamp).toLocaleString()}.`
      : `Marked resolved by ${actor}.`;
  }

  if (status === "investigating") {
    const actor = input.acknowledgedBy || "an operator";
    const timestamp = asDateString(input.acknowledgedAt);
    return timestamp
      ? `Acknowledged by ${actor} on ${new Date(timestamp).toLocaleString()}. Resolution is still pending.`
      : `Acknowledged by ${actor}. Resolution is still pending.`;
  }

  return "Awaiting operator review.";
}

export function buildSuggestedActions(input: {
  driftType?: string | null;
  fieldPath?: string | null;
  status: ExceptionWorkflowState;
}): string[] {
  if (input.status === "resolved" || input.status === "ignored") {
    return [];
  }

  switch (input.driftType) {
    case "amount_mismatch":
      return [
        "Compare the source and target amounts against the current tolerance policy.",
        "Confirm whether fees, taxes, or currency conversion explain the variance.",
      ];
    case "missing_transaction":
      return [
        "Verify the transaction exists in the upstream source and was included in the run window.",
        "Check whether ingestion completed before this run started.",
      ];
    case "duplicate_transaction":
      return [
        "Confirm whether the source record was ingested twice or replayed.",
        "Review upstream idempotency controls before resolving the duplicate.",
      ];
    default:
      if (input.fieldPath) {
        return [
          `Review the ${humanizeFieldPath(input.fieldPath) || input.fieldPath} values on both sides of the run.`,
          "Resolve or ignore the exception only after the source-of-truth record is confirmed.",
        ];
      }

      return ["Review the source and target records before resolving this exception."];
  }
}

export function buildExceptionAuditTrail(input: ExceptionPresentationInput): ExceptionAuditEntry[] {
  const entries: ExceptionAuditEntry[] = [];
  const metadata = asObject(input.metadata) as ExceptionMetadata | null;
  const resolution = asObject(metadata?.resolution) as ResolutionRecord | null;
  const reopen = asObject(metadata?.reopen) as ReopenRecord | null;
  const description = buildExceptionDescription(input);

  const createdAt = asDateString(input.createdAt);
  if (createdAt) {
    entries.push({
      timestamp: createdAt,
      action: "Detected",
      user: "system",
      details: description,
    });
  }

  if (input.acknowledged && input.acknowledgedAt && !resolution?.status) {
    const acknowledgedAt = asDateString(input.acknowledgedAt);
    if (acknowledgedAt) {
      entries.push({
        timestamp: acknowledgedAt,
        action: "Acknowledged",
        user: input.acknowledgedBy || "unknown",
        details: "Operator started investigating this exception.",
      });
    }
  }

  if (typeof resolution?.status === "string") {
    const status = resolution.status.toLowerCase();
    const timestamp =
      status === "ignored"
        ? asDateString(resolution.ignoredAt)
        : asDateString(resolution.resolvedAt);
    const actor =
      status === "ignored"
        ? typeof resolution.ignoredBy === "string"
          ? resolution.ignoredBy
          : "unknown"
        : typeof resolution.resolvedBy === "string"
          ? resolution.resolvedBy
          : "unknown";

    if (timestamp) {
      entries.push({
        timestamp,
        action: status === "ignored" ? "Ignored" : "Resolved",
        user: actor,
        details: typeof resolution.notes === "string" ? resolution.notes : undefined,
      });
    }
  }

  if (
    typeof resolution?.status === "string" &&
    !entries.some((entry) => entry.action === "Ignored" || entry.action === "Resolved")
  ) {
    const status = resolution.status.toLowerCase();
    const fallbackTimestamp = asDateString(input.acknowledgedAt);
    if (fallbackTimestamp) {
      entries.push({
        timestamp: fallbackTimestamp,
        action: status === "ignored" ? "Ignored" : "Resolved",
        user: input.acknowledgedBy || "unknown",
        details: typeof resolution.notes === "string" ? resolution.notes : undefined,
      });
    }
  }

  if (reopen) {
    const reopenedAt = asDateString(reopen.reopenedAt);
    if (reopenedAt) {
      entries.push({
        timestamp: reopenedAt,
        action: "Reopened",
        user: typeof reopen.reopenedBy === "string" ? reopen.reopenedBy : "unknown",
        details: typeof reopen.notes === "string" ? reopen.notes : undefined,
      });
    }
  }

  return entries.sort(
    (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
  );
}
