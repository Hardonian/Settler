export type DeltaVerificationState = "VERIFIED" | "DEGRADED" | "UNAVAILABLE";

export type DeltaIssueSeverity = "low" | "medium" | "high" | "critical";

export interface DeltaIssueInput {
  key: string;
  category: string;
  severity: DeltaIssueSeverity;
  status: "open" | "resolved" | "dismissed";
  summary: string;
  evidenceRefs: string[];
}

export interface DeltaRunInput {
  id: string;
  completedAt: string | null;
  issues: DeltaIssueInput[];
  totals?: {
    matched?: number;
    unmatched?: number;
    conflicts?: number;
  };
}

export interface StructuredIssueDelta {
  key: string;
  category: string;
  severity: DeltaIssueSeverity;
  summary: string;
  evidenceRefs: string[];
}

export interface RegressionDelta extends StructuredIssueDelta {
  previousSeverity: DeltaIssueSeverity;
  currentSeverity: DeltaIssueSeverity;
  previousStatus: DeltaIssueInput["status"];
  currentStatus: DeltaIssueInput["status"];
  reasonCodes: string[];
}

export interface StructuredRunDelta {
  state: DeltaVerificationState;
  currentRunId: string;
  previousRunId: string | null;
  summary: string;
  newIssues: StructuredIssueDelta[];
  resolvedIssues: StructuredIssueDelta[];
  regressions: RegressionDelta[];
  unchangedIssueCount: number;
  metricDelta: {
    matched: number | null;
    unmatched: number | null;
    conflicts: number | null;
  };
  reasonCodes: string[];
}

const SEVERITY_RANK: Record<DeltaIssueSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function stableIssue(input: DeltaIssueInput): StructuredIssueDelta {
  return {
    key: input.key,
    category: input.category,
    severity: input.severity,
    summary: input.summary,
    evidenceRefs: [...input.evidenceRefs].sort(),
  };
}

function compareIssue(a: StructuredIssueDelta, b: StructuredIssueDelta): number {
  return (
    a.category.localeCompare(b.category) ||
    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
    a.key.localeCompare(b.key)
  );
}

function metricDelta(
  current: DeltaRunInput["totals"] | undefined,
  previous: DeltaRunInput["totals"] | undefined,
  field: keyof NonNullable<DeltaRunInput["totals"]>
): number | null {
  const currentValue = current?.[field];
  const previousValue = previous?.[field];
  if (typeof currentValue !== "number" || typeof previousValue !== "number") {
    return null;
  }
  return currentValue - previousValue;
}

function hasStatusRegression(
  current: DeltaIssueInput["status"],
  previous: DeltaIssueInput["status"]
): boolean {
  return previous !== "open" && current === "open";
}

function buildSummary(input: {
  newCount: number;
  resolvedCount: number;
  regressionCount: number;
  reasonCodes: string[];
}): string {
  if (input.reasonCodes.includes("prior_run_missing")) {
    return "No prior comparable run is available; delta is unavailable until a baseline exists.";
  }

  if (input.newCount === 0 && input.resolvedCount === 0 && input.regressionCount === 0) {
    return "No issue-level changes detected between the current and previous run.";
  }

  return [
    `${input.newCount} new issue${input.newCount === 1 ? "" : "s"}`,
    `${input.resolvedCount} resolved issue${input.resolvedCount === 1 ? "" : "s"}`,
    `${input.regressionCount} regression${input.regressionCount === 1 ? "" : "s"}`,
  ].join("; ");
}

export function compareRunsForStructuredDelta(input: {
  current: DeltaRunInput;
  previous?: DeltaRunInput | null;
}): StructuredRunDelta {
  const { current, previous } = input;
  if (!previous) {
    return {
      state: "UNAVAILABLE",
      currentRunId: current.id,
      previousRunId: null,
      summary: buildSummary({
        newCount: 0,
        resolvedCount: 0,
        regressionCount: 0,
        reasonCodes: ["prior_run_missing"],
      }),
      newIssues: [],
      resolvedIssues: [],
      regressions: [],
      unchangedIssueCount: 0,
      metricDelta: { matched: null, unmatched: null, conflicts: null },
      reasonCodes: ["prior_run_missing"],
    };
  }

  const previousByKey = new Map(previous.issues.map((issue) => [issue.key, issue]));
  const currentByKey = new Map(current.issues.map((issue) => [issue.key, issue]));
  const newIssues: StructuredIssueDelta[] = [];
  const resolvedIssues: StructuredIssueDelta[] = [];
  const regressions: RegressionDelta[] = [];
  let unchangedIssueCount = 0;

  for (const currentIssue of current.issues) {
    const previousIssue = previousByKey.get(currentIssue.key);
    if (!previousIssue) {
      newIssues.push(stableIssue(currentIssue));
      continue;
    }

    const severityRegressed =
      SEVERITY_RANK[currentIssue.severity] > SEVERITY_RANK[previousIssue.severity];
    const statusRegressed = hasStatusRegression(currentIssue.status, previousIssue.status);

    if (severityRegressed || statusRegressed) {
      const reasonCodes = [
        ...(severityRegressed ? ["severity_regressed"] : []),
        ...(statusRegressed ? ["status_reopened"] : []),
      ];
      regressions.push({
        ...stableIssue(currentIssue),
        previousSeverity: previousIssue.severity,
        currentSeverity: currentIssue.severity,
        previousStatus: previousIssue.status,
        currentStatus: currentIssue.status,
        reasonCodes,
      });
      continue;
    }

    unchangedIssueCount += 1;
  }

  for (const previousIssue of previous.issues) {
    if (!currentByKey.has(previousIssue.key)) {
      resolvedIssues.push(stableIssue(previousIssue));
    }
  }

  const reasonCodes = [
    ...(newIssues.length > 0 ? ["new_issues_detected"] : []),
    ...(resolvedIssues.length > 0 ? ["issues_resolved"] : []),
    ...(regressions.length > 0 ? ["regressions_detected"] : []),
    ...(newIssues.length === 0 && resolvedIssues.length === 0 && regressions.length === 0
      ? ["zero_diff"]
      : []),
  ];

  return {
    state: "VERIFIED",
    currentRunId: current.id,
    previousRunId: previous.id,
    summary: buildSummary({
      newCount: newIssues.length,
      resolvedCount: resolvedIssues.length,
      regressionCount: regressions.length,
      reasonCodes,
    }),
    newIssues: newIssues.sort(compareIssue),
    resolvedIssues: resolvedIssues.sort(compareIssue),
    regressions: regressions.sort(compareIssue),
    unchangedIssueCount,
    metricDelta: {
      matched: metricDelta(current.totals, previous.totals, "matched"),
      unmatched: metricDelta(current.totals, previous.totals, "unmatched"),
      conflicts: metricDelta(current.totals, previous.totals, "conflicts"),
    },
    reasonCodes,
  };
}
