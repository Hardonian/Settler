export type ExceptionResolution = "matched" | "manual" | "ignored" | "duplicate";
export type ExceptionWorkbenchAction = "resolve" | "ignore" | "reopen";

export interface ExceptionArchetypePrediction {
  code: string;
  label: string;
  category: string;
  confidence: number;
  severityDefault: "low" | "medium" | "high" | "critical";
  matchFeatures: Record<string, unknown>;
  typicalResolutionCode: string;
  resolutionTaxonomy: string[];
}

export interface NormalizedExceptionResolution {
  resolutionReason: string;
  resolutionCode: string;
  source:
    | "explicit_reason"
    | "reason_keyword"
    | "note_keyword"
    | "action_default"
    | "resolution_default";
}

export interface ExceptionFamilyMemory {
  exceptionId: string;
  resolution: string;
  resolutionReason: string | null;
  resolutionCode: string | null;
  outcome: string | null;
  adjudicationType: string | null;
  confidence: number | null;
  sourceTrustScore: number | null;
  createdAt: string | Date;
}

export interface ExceptionFamilySummary {
  state: "available" | "building" | "unavailable";
  familyCode: string | null;
  familyLabel: string | null;
  familyCategory: string | null;
  totalCases: number;
  totalAdjudications: number;
  supportingCaseCount: number;
  resolvedCaseCount: number;
  unresolvedCaseCount: number;
  reopenedCaseCount: number;
  reopenRate: number | null;
  recurrencePosture: "worsening" | "stable" | "improving" | "unavailable";
  dominantResolutionCode: string | null;
  dominantResolutionReason: string | null;
  dominantResolutionShare: number | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  avgConfidence: number | null;
  avgSourceTrustScore: number | null;
  reasonCodes: string[];
  summary: string;
  nextStep: string;
}

const DEFAULT_REASON_BY_RESOLUTION: Record<ExceptionResolution, string> = {
  matched: "manual match confirmed",
  manual: "manual review confirmed",
  ignored: "operator dismissed exception",
  duplicate: "duplicate record confirmed",
};

const DEFAULT_CODE_BY_RESOLUTION: Record<ExceptionResolution, string> = {
  matched: "MANUAL_MATCH_CONFIRMED",
  manual: "MANUAL_REVIEW_CONFIRMED",
  ignored: "OPERATOR_DISMISSED_EXCEPTION",
  duplicate: "DUPLICATE_RECORD_CONFIRMED",
};

const DISPLAY_REASON_BY_CODE: Record<string, string> = {
  MANUAL_MATCH_CONFIRMED: "manual match confirmed",
  MANUAL_REVIEW_CONFIRMED: "manual review confirmed",
  OPERATOR_DISMISSED_EXCEPTION: "operator dismissed exception",
  DUPLICATE_RECORD_CONFIRMED: "duplicate record confirmed",
  FALSE_POSITIVE_CONFIRMED: "false positive confirmed",
  TIMING_DIFFERENCE_ACCEPTED: "timing difference accepted",
  AMOUNT_VARIANCE_ACCEPTED: "amount variance accepted",
  CURRENCY_VARIANCE_ACCEPTED: "currency variance accepted",
  MISSING_COUNTERPART_CONFIRMED: "missing counterpart confirmed",
  REOPENED_FOR_INVESTIGATION: "reopened for investigation",
};

const KEYWORD_RULES: Array<{ code: string; pattern: RegExp }> = [
  {
    code: "DUPLICATE_RECORD_CONFIRMED",
    pattern:
      /\bduplicate\b|\bduplicated\b|\btwice\b|\bdouble(?:\s|-)?count(?:ed)?\b|\breimport(?:ed)?\b/i,
  },
  {
    code: "TIMING_DIFFERENCE_ACCEPTED",
    pattern:
      /\btiming\b|\bdate drift\b|\bdate difference\b|\bsettlement window\b|\bsettlement delay\b|\bcutoff\b/i,
  },
  {
    code: "AMOUNT_VARIANCE_ACCEPTED",
    pattern: /\bamount\b|\bvariance\b|\bfee\b|\btax\b|\bround(?:ing)?\b/i,
  },
  {
    code: "CURRENCY_VARIANCE_ACCEPTED",
    pattern: /\bcurrency\b|\bfx\b|\bforeign exchange\b|\bexchange rate\b/i,
  },
  {
    code: "MISSING_COUNTERPART_CONFIRMED",
    pattern: /\bmissing\b|\bno counterpart\b|\bnot found\b|\bnot posted\b|\bpending capture\b/i,
  },
  {
    code: "FALSE_POSITIVE_CONFIRMED",
    pattern:
      /\bfalse positive(?:s)?\b|\bnot actionable\b|\bexpected gap\b|\bbenign\b|\bexpected\b/i,
  },
  {
    // cspell:ignore investigat escalat
    code: "REOPENED_FOR_INVESTIGATION",
    pattern: /\bre-?open(?:ed)?\b|\b[i]nvestigat(?:e|ion)\b|\bfollow(?:\s|-)?up\b|\b[e]scalat/i,
  },
];

function safeNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function humanizeResolutionCode(code: string): string {
  return DISPLAY_REASON_BY_CODE[code] ?? code.toLowerCase().replace(/_/g, " ");
}

function detectResolutionCode(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text)) {
      return rule.code;
    }
  }

  return null;
}

function toFamilyStep(args: {
  familyCategory: string | null;
  recurrencePosture: ExceptionFamilySummary["recurrencePosture"];
  dominantResolutionReason: string | null;
  supportingCaseCount: number;
}): string {
  if (args.supportingCaseCount === 0) {
    return "Capture a few explicit adjudications before treating this exception family as reusable operator memory.";
  }

  if (args.recurrencePosture === "worsening") {
    return "Review reopened or inconsistent cases before reusing the dominant resolution path for this family.";
  }

  if (args.familyCategory === "timing") {
    return "Check timing windows and settlement lag first, then confirm the dominant resolution against current evidence.";
  }

  if (args.familyCategory === "amount") {
    return "Compare amount deltas and fee components against the dominant resolution before closing the exception.";
  }

  if (args.familyCategory === "missing") {
    return "Verify source and target completeness before reusing the family’s dominant resolution path.";
  }

  if (args.dominantResolutionReason) {
    return `Use "${args.dominantResolutionReason}" as the starting hypothesis, then confirm it against attached evidence.`;
  }

  return "Use the recorded family history as a starting point, but confirm the current evidence before finalizing the decision.";
}

export function normalizeExceptionResolutionReason(args: {
  resolution: ExceptionResolution;
  explicitReason?: string | null;
  note?: string | null;
  action?: ExceptionWorkbenchAction | null;
}): NormalizedExceptionResolution {
  const explicitReason = args.explicitReason?.trim() || null;
  const note = args.note?.trim() || null;

  if (args.action === "reopen") {
    return {
      resolutionReason: explicitReason ?? humanizeResolutionCode("REOPENED_FOR_INVESTIGATION"),
      resolutionCode: "REOPENED_FOR_INVESTIGATION",
      source: explicitReason ? "explicit_reason" : "action_default",
    };
  }

  const explicitCode = detectResolutionCode(explicitReason);
  const noteCode = detectResolutionCode(note);
  const fallbackCode = DEFAULT_CODE_BY_RESOLUTION[args.resolution];
  const resolutionCode = explicitCode ?? noteCode ?? fallbackCode;

  return {
    resolutionReason:
      explicitReason ??
      humanizeResolutionCode(explicitCode ?? noteCode ?? fallbackCode) ??
      DEFAULT_REASON_BY_RESOLUTION[args.resolution],
    resolutionCode,
    source: explicitReason
      ? explicitCode
        ? "reason_keyword"
        : "explicit_reason"
      : noteCode
        ? "note_keyword"
        : args.action
          ? "action_default"
          : "resolution_default",
  };
}

export function predictExceptionArchetype(args: {
  matchType: string;
  amountDiff?: number | null;
  dateDiff?: number | null;
  confidence?: number | null;
  hasTargetTransaction: boolean;
  matchReason?: string | null;
}): ExceptionArchetypePrediction {
  const amountDiff = safeNumber(args.amountDiff ?? null);
  const confidence = safeNumber(args.confidence ?? null) ?? 0;
  const normalizedMatchType = (args.matchType ?? "").trim().toLowerCase();
  const normalizedReason = (args.matchReason ?? "").trim().toLowerCase();
  const matchFeatures: Record<string, unknown> = {};

  if (normalizedMatchType === "duplicate" || /\bduplicate\b/.test(normalizedReason)) {
    matchFeatures.matchType = normalizedMatchType || "duplicate";
    return {
      code: "DUPLICATE",
      label: "Duplicate Transaction",
      category: "duplicate",
      confidence: 0.95,
      severityDefault: "medium",
      matchFeatures,
      typicalResolutionCode: "DUPLICATE_RECORD_CONFIRMED",
      resolutionTaxonomy: ["DUPLICATE_RECORD_CONFIRMED", "MANUAL_MATCH_CONFIRMED"],
    };
  }

  if (normalizedMatchType === "conflict") {
    matchFeatures.matchType = normalizedMatchType;
    return {
      code: "CONFLICT",
      label: "Conflicting Match",
      category: "classification",
      confidence: 0.9,
      severityDefault: "high",
      matchFeatures,
      typicalResolutionCode: "MANUAL_REVIEW_CONFIRMED",
      resolutionTaxonomy: ["MANUAL_REVIEW_CONFIRMED", "MANUAL_MATCH_CONFIRMED"],
    };
  }

  if (amountDiff !== null && amountDiff !== 0) {
    matchFeatures.amountDiff = amountDiff;
    return {
      code: "AMOUNT_MISMATCH",
      label: "Amount Mismatch",
      category: "amount",
      confidence: Math.abs(amountDiff) > 100 ? 0.95 : Math.abs(amountDiff) > 10 ? 0.85 : 0.7,
      severityDefault: Math.abs(amountDiff) > 100 ? "high" : "medium",
      matchFeatures,
      typicalResolutionCode: "AMOUNT_VARIANCE_ACCEPTED",
      resolutionTaxonomy: ["AMOUNT_VARIANCE_ACCEPTED", "MANUAL_REVIEW_CONFIRMED"],
    };
  }

  if (args.dateDiff != null && args.dateDiff !== 0) {
    matchFeatures.dateDiff = args.dateDiff;
    return {
      code: "DATE_DRIFT",
      label: "Date Drift",
      category: "timing",
      confidence: Math.abs(args.dateDiff) > 3 ? 0.9 : 0.75,
      severityDefault: Math.abs(args.dateDiff) > 3 ? "high" : "medium",
      matchFeatures,
      typicalResolutionCode: "TIMING_DIFFERENCE_ACCEPTED",
      resolutionTaxonomy: ["TIMING_DIFFERENCE_ACCEPTED", "MANUAL_REVIEW_CONFIRMED"],
    };
  }

  if (!args.hasTargetTransaction) {
    matchFeatures.targetTransaction = null;
    return {
      code: "MISSING_IN_TARGET",
      label: "Missing in Target",
      category: "missing",
      confidence: 0.9,
      severityDefault: "high",
      matchFeatures,
      typicalResolutionCode: "MISSING_COUNTERPART_CONFIRMED",
      resolutionTaxonomy: ["MISSING_COUNTERPART_CONFIRMED", "OPERATOR_DISMISSED_EXCEPTION"],
    };
  }

  if (normalizedMatchType.includes("source")) {
    matchFeatures.matchType = normalizedMatchType;
    return {
      code: "MISSING_IN_SOURCE",
      label: "Missing in Source",
      category: "missing",
      confidence: 0.85,
      severityDefault: "high",
      matchFeatures,
      typicalResolutionCode: "MISSING_COUNTERPART_CONFIRMED",
      resolutionTaxonomy: ["MISSING_COUNTERPART_CONFIRMED", "MANUAL_REVIEW_CONFIRMED"],
    };
  }

  if (confidence < 0.8) {
    matchFeatures.confidence = confidence;
    return {
      code: "LOW_CONFIDENCE",
      label: "Low Confidence Match",
      category: "classification",
      confidence: Math.max(0.5, 1 - confidence),
      severityDefault: "medium",
      matchFeatures,
      typicalResolutionCode: "MANUAL_REVIEW_CONFIRMED",
      resolutionTaxonomy: ["MANUAL_REVIEW_CONFIRMED", "MANUAL_MATCH_CONFIRMED"],
    };
  }

  return {
    code: "UNCLASSIFIED",
    label: "Unclassified Exception",
    category: "classification",
    confidence: 0.5,
    severityDefault: "medium",
    matchFeatures,
    typicalResolutionCode: "MANUAL_REVIEW_CONFIRMED",
    resolutionTaxonomy: ["MANUAL_REVIEW_CONFIRMED"],
  };
}

export function buildExceptionFamilySummary(args: {
  currentExceptionId: string;
  currentStatus: "open" | "in_progress" | "resolved" | "dismissed";
  familyCode: string | null;
  familyLabel: string | null;
  familyCategory: string | null;
  memories: ExceptionFamilyMemory[];
}): ExceptionFamilySummary {
  if (!args.familyCode && !args.familyLabel) {
    return {
      state: "unavailable",
      familyCode: null,
      familyLabel: null,
      familyCategory: null,
      totalCases: 0,
      totalAdjudications: 0,
      supportingCaseCount: 0,
      resolvedCaseCount: 0,
      unresolvedCaseCount: 0,
      reopenedCaseCount: 0,
      reopenRate: null,
      recurrencePosture: "unavailable",
      dominantResolutionCode: null,
      dominantResolutionReason: null,
      dominantResolutionShare: null,
      firstSeenAt: null,
      lastSeenAt: null,
      avgConfidence: null,
      avgSourceTrustScore: null,
      reasonCodes: ["family_not_classified"],
      summary: "This exception does not have a canonical family classification yet.",
      nextStep:
        "Capture an explicit operator decision so Settler can classify and accumulate family-level memory.",
    };
  }

  const memories = [...args.memories].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    // Tie breaker for determinism
    return right.exceptionId.localeCompare(left.exceptionId);
  });

  const latestByCase = new Map<string, ExceptionFamilyMemory>();
  const countByCase = new Map<string, number>();
  const resolutionCounts = new Map<string, number>();
  const confidenceValues: number[] = [];
  const sourceTrustValues: number[] = [];
  let firstSeenAt: string | null = null;
  let lastSeenAt: string | null = null;

  for (const memory of memories) {
    const createdAt = toIso(memory.createdAt);
    if (createdAt && (!firstSeenAt || createdAt < firstSeenAt)) {
      firstSeenAt = createdAt;
    }
    if (createdAt && (!lastSeenAt || createdAt > lastSeenAt)) {
      lastSeenAt = createdAt;
    }

    countByCase.set(memory.exceptionId, (countByCase.get(memory.exceptionId) ?? 0) + 1);

    if (!latestByCase.has(memory.exceptionId)) {
      latestByCase.set(memory.exceptionId, memory);
    }

    const normalized = normalizeExceptionResolutionReason({
      resolution:
        memory.resolution === "matched" ||
        memory.resolution === "manual" ||
        memory.resolution === "ignored" ||
        memory.resolution === "duplicate"
          ? memory.resolution
          : "manual",
      explicitReason: memory.resolutionReason,
    });
    const resolutionCode = memory.resolutionCode ?? normalized.resolutionCode;
    resolutionCounts.set(resolutionCode, (resolutionCounts.get(resolutionCode) ?? 0) + 1);

    const confidence = safeNumber(memory.confidence);
    if (confidence !== null) {
      confidenceValues.push(confidence);
    }

    const sourceTrustScore = safeNumber(memory.sourceTrustScore);
    if (sourceTrustScore !== null) {
      sourceTrustValues.push(sourceTrustScore);
    }
  }

  const currentCaseExists = latestByCase.has(args.currentExceptionId);
  const totalCases = latestByCase.size + (currentCaseExists ? 0 : 1);
  const supportingCaseCount = Math.max(totalCases - 1, 0);

  let resolvedCaseCount = 0;
  let unresolvedCaseCount = 0;
  let reopenedCaseCount = 0;

  for (const [exceptionId, latestMemory] of latestByCase.entries()) {
    const caseCount = countByCase.get(exceptionId) ?? 0;
    const latestOutcome = (latestMemory.outcome ?? "").toLowerCase();
    const latestAdjudicationType = (latestMemory.adjudicationType ?? "").toLowerCase();
    const resolvedLike =
      latestOutcome === "resolved" ||
      latestOutcome === "confirmed_dismissed" ||
      latestMemory.resolution === "matched" ||
      latestMemory.resolution === "manual" ||
      latestMemory.resolution === "ignored" ||
      latestMemory.resolution === "duplicate";

    if (resolvedLike) {
      resolvedCaseCount += 1;
    } else {
      unresolvedCaseCount += 1;
    }

    if (
      caseCount > 1 ||
      latestOutcome === "reopened" ||
      latestOutcome === "re_adjudicated" ||
      latestAdjudicationType.includes("re_adjudication")
    ) {
      reopenedCaseCount += 1;
    }
  }

  if (!currentCaseExists) {
    if (args.currentStatus === "open" || args.currentStatus === "in_progress") {
      unresolvedCaseCount += 1;
    } else {
      resolvedCaseCount += 1;
    }
  }

  const dominantEntry =
    [...resolutionCounts.entries()].sort((left, right) => {
      const countDiff = right[1] - left[1];
      if (countDiff !== 0) {
        return countDiff;
      }
      // Tie breaker for determinism using the resolution code
      return left[0].localeCompare(right[0]);
    })[0] ?? null;
  const dominantResolutionCode = dominantEntry?.[0] ?? null;
  const dominantResolutionReason = dominantResolutionCode
    ? humanizeResolutionCode(dominantResolutionCode)
    : null;
  const dominantResolutionShare =
    dominantEntry && memories.length > 0 ? dominantEntry[1] / memories.length : null;
  const reopenRate = totalCases > 0 ? reopenedCaseCount / totalCases : null;

  const state: ExceptionFamilySummary["state"] = supportingCaseCount > 0 ? "available" : "building";

  const recurrencePosture: ExceptionFamilySummary["recurrencePosture"] =
    state !== "available"
      ? "unavailable"
      : reopenRate !== null && reopenRate >= 0.25
        ? "worsening"
        : dominantResolutionShare !== null &&
            dominantResolutionShare >= 0.6 &&
            resolvedCaseCount >= unresolvedCaseCount
          ? "improving"
          : "stable";

  const avgConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : null;
  const avgSourceTrustScore =
    sourceTrustValues.length > 0
      ? sourceTrustValues.reduce((sum, value) => sum + value, 0) / sourceTrustValues.length
      : null;

  const reasonCodes: string[] = [];
  if (supportingCaseCount === 0) {
    reasonCodes.push("family_history_building");
  }
  if (reopenedCaseCount > 0) {
    reasonCodes.push("family_contains_reopened_cases");
  }
  if (dominantResolutionCode) {
    reasonCodes.push(`dominant_resolution:${dominantResolutionCode}`);
  }

  const familyLabel = args.familyLabel ?? args.familyCode ?? "Unclassified exception family";
  const summary =
    state === "available"
      ? `${familyLabel} has appeared in ${totalCases} cases with ${supportingCaseCount} prior supporting cases. Dominant resolution: ${dominantResolutionReason ?? "not established"}.`
      : `${familyLabel} is classified, but Settler is still building reusable family memory for this exception type.`;

  return {
    state,
    familyCode: args.familyCode,
    familyLabel,
    familyCategory: args.familyCategory,
    totalCases,
    totalAdjudications: memories.length,
    supportingCaseCount,
    resolvedCaseCount,
    unresolvedCaseCount,
    reopenedCaseCount,
    reopenRate,
    recurrencePosture,
    dominantResolutionCode,
    dominantResolutionReason,
    dominantResolutionShare,
    firstSeenAt,
    lastSeenAt,
    avgConfidence,
    avgSourceTrustScore,
    reasonCodes,
    summary,
    nextStep: toFamilyStep({
      familyCategory: args.familyCategory,
      recurrencePosture,
      dominantResolutionReason,
      supportingCaseCount,
    }),
  };
}
