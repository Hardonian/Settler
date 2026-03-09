export const FAILURE_CLASSES = [
  "VALIDATION_ERROR",
  "AUTHENTICATION_ERROR",
  "AUTHORIZATION_ERROR",
  "TENANT_ISOLATION_ERROR",
  "POLICY_REJECTION",
  "RATE_LIMIT_ERROR",
  "CONFIGURATION_ERROR",
  "DEPENDENCY_ERROR",
  "NETWORK_ERROR",
  "TIMEOUT_ERROR",
  "STORAGE_ERROR",
  "QUEUE_ERROR",
  "REPLAY_DIVERGENCE",
  "PROOF_VERIFICATION_ERROR",
  "NONDETERMINISM_ERROR",
  "INTERNAL_EXECUTION_ERROR",
  "OPERATOR_ACTION_REQUIRED",
] as const;

export type FailureClass = (typeof FAILURE_CLASSES)[number];
export type FailureSeverity = "low" | "medium" | "high" | "critical";

export interface FailureContext {
  traceId: string;
  executionId?: string;
  tenantId?: string;
  component: string;
  operation: string;
  routeOrCommand?: string;
  deploymentVersion?: string;
  policyVersion?: string;
  dependency?: string;
  timestamp?: string;
  error: string;
  machineDetails?: Record<string, unknown>;
  linkedLogs?: string[];
  linkedExecutionReceipt?: string;
  linkedReplayBundle?: string;
}

export interface RootCauseHypothesis {
  probableCause: string;
  confidence: number;
  evidence: string[];
}

export interface FailureRecord {
  failureId: string;
  failureClass: FailureClass;
  severity: FailureSeverity;
  traceId: string;
  executionId?: string;
  tenantId?: string;
  component: string;
  operation: string;
  timestamp: string;
  humanSummary: string;
  machineDetails: Record<string, unknown>;
  retryable: boolean;
  safeToAutoRemediate: boolean;
  rootCauseHypothesis: RootCauseHypothesis[];
  remediationStatus: "none" | "attempted" | "succeeded" | "blocked";
  signature: string;
  linkedLogs: string[];
  linkedExecutionReceipt?: string;
  linkedReplayBundle?: string;
  routeOrCommand?: string;
  deploymentVersion?: string;
  policyVersion?: string;
  dependency?: string;
  remediationAttempts: RemediationAttempt[];
}

export interface FailureCluster {
  clusterId: string;
  signature: string;
  component: string;
  dependency?: string;
  routeOrCommand?: string;
  deploymentVersion?: string;
  policyVersion?: string;
  firstSeen: string;
  lastSeen: string;
  occurrenceCount: number;
  affectedTenants: string[];
  affectedRoutesOrCommands: string[];
  recurrenceRate: number;
  blastRadiusEstimate: "single-tenant" | "multi-tenant" | "global";
}

export interface RemediationRule {
  id: string;
  forClass: FailureClass;
  description: string;
  maxAttempts: number;
  backoffMs: number;
  idempotentRequired: boolean;
  forbiddenScopes?: Array<"financial" | "tenant_boundary" | "policy_bypass" | "destructive">;
  action: string;
  guidance: string;
}

export interface RemediationAttempt {
  remediationId: string;
  triggeredBy: "auto" | "operator" | "policy";
  matchedRule: string;
  safetyChecksPassed: boolean;
  actionTaken: string;
  outcome: "succeeded" | "failed" | "blocked";
  timestamp: string;
  traceId: string;
  notes: string[];
}

export interface OperatorGuidance {
  failureId: string;
  whatFailed: string;
  likelyWhy: string;
  blastRadius: string;
  userFacingImpact: boolean;
  safeToRetry: boolean;
  recommendedNextSteps: string[];
  artifactLinks: string[];
}

const CLASSIFIERS: Array<{
  failureClass: FailureClass;
  pattern: RegExp;
  severity: FailureSeverity;
  retryable: boolean;
  safeToAutoRemediate: boolean;
  summary: string;
}> = [
  {
    failureClass: "VALIDATION_ERROR",
    pattern: /invalid|validation|schema|malformed/i,
    severity: "medium",
    retryable: false,
    safeToAutoRemediate: true,
    summary: "Input failed contract validation.",
  },
  {
    failureClass: "AUTHENTICATION_ERROR",
    pattern: /401|unauthorized|token expired|auth/i,
    severity: "high",
    retryable: false,
    safeToAutoRemediate: false,
    summary: "Authentication failed for requested operation.",
  },
  {
    failureClass: "AUTHORIZATION_ERROR",
    pattern: /403|forbidden|permission denied/i,
    severity: "high",
    retryable: false,
    safeToAutoRemediate: false,
    summary: "Caller lacks required authorization.",
  },
  {
    failureClass: "TENANT_ISOLATION_ERROR",
    pattern: /cross-tenant|tenant mismatch|tenant isolation/i,
    severity: "critical",
    retryable: false,
    safeToAutoRemediate: false,
    summary: "Tenant isolation guard blocked execution.",
  },
  {
    failureClass: "POLICY_REJECTION",
    pattern: /policy reject|policy violation|blocked by policy/i,
    severity: "high",
    retryable: false,
    safeToAutoRemediate: false,
    summary: "Policy evaluation rejected requested action.",
  },
  {
    failureClass: "RATE_LIMIT_ERROR",
    pattern: /429|rate limit|too many requests/i,
    severity: "medium",
    retryable: true,
    safeToAutoRemediate: true,
    summary: "Rate limit threshold reached.",
  },
  {
    failureClass: "CONFIGURATION_ERROR",
    pattern: /missing env|config missing|misconfig|undefined env/i,
    severity: "critical",
    retryable: false,
    safeToAutoRemediate: false,
    summary: "Runtime configuration is incomplete or invalid.",
  },
  {
    failureClass: "DEPENDENCY_ERROR",
    pattern: /provider unavailable|dependency failed|upstream error|5\d\d/i,
    severity: "high",
    retryable: true,
    safeToAutoRemediate: true,
    summary: "External dependency failed.",
  },
  {
    failureClass: "NETWORK_ERROR",
    pattern: /econn|network|dns|socket/i,
    severity: "medium",
    retryable: true,
    safeToAutoRemediate: true,
    summary: "Network boundary failure detected.",
  },
  {
    failureClass: "TIMEOUT_ERROR",
    pattern: /timeout|timed out|deadline exceeded/i,
    severity: "high",
    retryable: true,
    safeToAutoRemediate: true,
    summary: "Operation exceeded timeout window.",
  },
  {
    failureClass: "STORAGE_ERROR",
    pattern: /storage|database|disk|s3|bucket/i,
    severity: "high",
    retryable: true,
    safeToAutoRemediate: false,
    summary: "Storage subsystem failed.",
  },
  {
    failureClass: "QUEUE_ERROR",
    pattern: /queue|job fence|idempotency key|dead letter/i,
    severity: "high",
    retryable: true,
    safeToAutoRemediate: true,
    summary: "Queue lifecycle or idempotency failure.",
  },
  {
    failureClass: "REPLAY_DIVERGENCE",
    pattern: /replay diverge|replay mismatch/i,
    severity: "high",
    retryable: false,
    safeToAutoRemediate: false,
    summary: "Replay execution diverged from original.",
  },
  {
    failureClass: "PROOF_VERIFICATION_ERROR",
    pattern: /proof verification|signature mismatch|hash chain/i,
    severity: "critical",
    retryable: false,
    safeToAutoRemediate: false,
    summary: "Proof verification failed.",
  },
  {
    failureClass: "NONDETERMINISM_ERROR",
    pattern: /nondeterminism|non-deterministic|race condition/i,
    severity: "high",
    retryable: false,
    safeToAutoRemediate: false,
    summary: "Determinism invariant violated.",
  },
];

const DEFAULT_CLASSIFIER = {
  failureClass: "INTERNAL_EXECUTION_ERROR" as const,
  severity: "high" as const,
  retryable: false,
  safeToAutoRemediate: false,
  summary: "Unhandled internal execution failure.",
};

const REMEDIATION_RULES: RemediationRule[] = [
  {
    id: "rule-rate-limit-backoff",
    forClass: "RATE_LIMIT_ERROR",
    description: "Retry idempotent operation after bounded backoff.",
    maxAttempts: 2,
    backoffMs: 1000,
    idempotentRequired: true,
    action: "reschedule-idempotent-operation",
    guidance: "Apply exponential backoff and reduce concurrency for affected route.",
  },
  {
    id: "rule-queue-fencing-retry",
    forClass: "QUEUE_ERROR",
    description: "Replay queue item only if idempotency key and fence token are present.",
    maxAttempts: 1,
    backoffMs: 0,
    idempotentRequired: true,
    action: "retry-queue-job-with-fence",
    guidance: "Verify idempotency metadata and retry one time under fence.",
  },
  {
    id: "rule-validation-quarantine",
    forClass: "VALIDATION_ERROR",
    description: "Quarantine malformed payload and avoid repeated execution.",
    maxAttempts: 1,
    backoffMs: 0,
    idempotentRequired: false,
    action: "quarantine-invalid-payload",
    guidance: "Route payload to quarantine queue and alert operator with contract diff.",
  },
  {
    id: "rule-timeout-reschedule",
    forClass: "TIMEOUT_ERROR",
    description: "Reschedule timed-out work if it has no commit evidence.",
    maxAttempts: 1,
    backoffMs: 500,
    idempotentRequired: true,
    action: "reschedule-uncommitted-work",
    guidance: "Re-run timed-out unit with lower concurrency and explicit timeout override.",
  },
];

const failureStore: FailureRecord[] = [];

function stableHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function makeSignature(context: FailureContext, failureClass: FailureClass): string {
  return `${failureClass}:${context.component}:${context.operation}:${context.routeOrCommand ?? "n/a"}:${stableHash(
    context.error.toLowerCase().replace(/\d+/g, "#")
  )}`;
}

export function classifyFailure(
  context: FailureContext
): Omit<
  FailureRecord,
  "failureId" | "timestamp" | "rootCauseHypothesis" | "remediationStatus" | "remediationAttempts"
> {
  const classifier =
    CLASSIFIERS.find((rule) => rule.pattern.test(context.error)) ?? DEFAULT_CLASSIFIER;
  return {
    failureClass: classifier.failureClass,
    severity: classifier.severity,
    traceId: context.traceId,
    executionId: context.executionId,
    tenantId: context.tenantId,
    component: context.component,
    operation: context.operation,
    humanSummary: classifier.summary,
    machineDetails: context.machineDetails ?? {},
    retryable: classifier.retryable,
    safeToAutoRemediate: classifier.safeToAutoRemediate,
    signature: makeSignature(context, classifier.failureClass),
    linkedLogs: context.linkedLogs ?? [],
    linkedExecutionReceipt: context.linkedExecutionReceipt,
    linkedReplayBundle: context.linkedReplayBundle,
    routeOrCommand: context.routeOrCommand,
    deploymentVersion: context.deploymentVersion,
    policyVersion: context.policyVersion,
    dependency: context.dependency,
  };
}

export function buildRootCauseHypotheses(failure: FailureRecord): RootCauseHypothesis[] {
  const hypotheses: RootCauseHypothesis[] = [];

  if (failure.failureClass === "CONFIGURATION_ERROR") {
    hypotheses.push({
      probableCause: "Missing or invalid environment configuration",
      confidence: 0.88,
      evidence: [
        "Failure classified as configuration error",
        "Error signature appears in startup pathways",
      ],
    });
  }

  const sameSignature = failureStore.filter((entry) => entry.signature === failure.signature);
  if (sameSignature.length >= 1) {
    hypotheses.push({
      probableCause: "Recurring execution defect for identical stack signature",
      confidence: Math.min(0.55 + sameSignature.length * 0.05, 0.93),
      evidence: [
        `${sameSignature.length} previous failures share the same signature`,
        `Component ${failure.component} / operation ${failure.operation} repeatedly failing`,
      ],
    });
  }

  if (failure.linkedReplayBundle && failure.failureClass === "REPLAY_DIVERGENCE") {
    hypotheses.push({
      probableCause: "Replay evidence diverges from original execution inputs",
      confidence: 0.82,
      evidence: ["Replay bundle attached", "Classification indicates deterministic divergence"],
    });
  }

  if (failure.failureClass === "DEPENDENCY_ERROR" || failure.failureClass === "NETWORK_ERROR") {
    hypotheses.push({
      probableCause: "Upstream dependency instability",
      confidence: 0.69,
      evidence: [
        "Failure class indicates boundary instability",
        `Dependency target: ${failure.dependency ?? "unspecified"}`,
      ],
    });
  }

  if (hypotheses.length === 0) {
    hypotheses.push({
      probableCause: "Insufficient evidence; operator investigation required",
      confidence: 0.35,
      evidence: ["No high-confidence signature correlation found"],
    });
  }

  return hypotheses.sort((a, b) => b.confidence - a.confidence);
}

export function recordFailure(context: FailureContext): FailureRecord {
  const base = classifyFailure(context);
  const timestamp = context.timestamp ?? new Date().toISOString();
  const failureId = `failure_${stableHash(`${base.signature}:${timestamp}:${context.traceId}`)}`;

  const record: FailureRecord = {
    failureId,
    timestamp,
    ...base,
    rootCauseHypothesis: [],
    remediationStatus: "none",
    remediationAttempts: [],
  };

  record.rootCauseHypothesis = buildRootCauseHypotheses(record);
  failureStore.push(record);
  return record;
}

export function listFailures(tenantId?: string): FailureRecord[] {
  return failureStore
    .filter((failure) => !tenantId || failure.tenantId === tenantId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getFailure(failureId: string, tenantId?: string): FailureRecord | null {
  const failure = failureStore.find((entry) => entry.failureId === failureId);
  if (!failure) {
    return null;
  }
  if (tenantId && failure.tenantId && tenantId !== failure.tenantId) {
    return null;
  }
  return failure;
}

export function clusterFailures(tenantId?: string): FailureCluster[] {
  const rows = listFailures(tenantId);
  const grouped = new Map<string, FailureRecord[]>();

  for (const row of rows) {
    const key = [row.signature, row.deploymentVersion ?? "n/a", row.policyVersion ?? "n/a"].join(
      "|"
    );
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }

  return Array.from(grouped.entries()).map(([key, items]) => {
    const sorted = [...items].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const tenants = Array.from(
      new Set(items.map((item) => item.tenantId).filter(Boolean))
    ) as string[];
    const routes = Array.from(
      new Set(items.map((item) => item.routeOrCommand).filter(Boolean))
    ) as string[];

    return {
      clusterId: `cluster_${stableHash(key)}`,
      signature: first.signature,
      component: first.component,
      dependency: first.dependency,
      routeOrCommand: first.routeOrCommand,
      deploymentVersion: first.deploymentVersion,
      policyVersion: first.policyVersion,
      firstSeen: first.timestamp,
      lastSeen: last.timestamp,
      occurrenceCount: items.length,
      affectedTenants: tenants,
      affectedRoutesOrCommands: routes,
      recurrenceRate: Number((items.length / Math.max(1, routes.length || 1)).toFixed(2)),
      blastRadiusEstimate:
        tenants.length > 5 ? "global" : tenants.length > 1 ? "multi-tenant" : "single-tenant",
    };
  });
}

export function failureTrends(
  tenantId?: string
): Array<{ failureClass: FailureClass; count: number }> {
  const counts = new Map<FailureClass, number>();
  for (const row of listFailures(tenantId)) {
    counts.set(row.failureClass, (counts.get(row.failureClass) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([failureClass, count]) => ({ failureClass, count }))
    .sort((a, b) => b.count - a.count);
}

export function remediationCatalog(): RemediationRule[] {
  return REMEDIATION_RULES;
}

export function remediateFailure(
  failureId: string,
  options: {
    triggeredBy: "auto" | "operator" | "policy";
    tenantId?: string;
    idempotencyKeyPresent?: boolean;
  }
): RemediationAttempt | null {
  const failure = getFailure(failureId, options.tenantId);
  if (!failure) {
    return null;
  }

  const rule = REMEDIATION_RULES.find((candidate) => candidate.forClass === failure.failureClass);
  if (!rule) {
    const blocked = blockedAttempt(failure, "no-eligible-rule", options.triggeredBy);
    failure.remediationAttempts.push(blocked);
    failure.remediationStatus = "blocked";
    return blocked;
  }

  const attemptsForRule = failure.remediationAttempts.filter(
    (attempt) => attempt.matchedRule === rule.id
  );
  if (attemptsForRule.length >= rule.maxAttempts) {
    const blocked = blockedAttempt(failure, "max-attempts-exceeded", options.triggeredBy, rule.id);
    failure.remediationAttempts.push(blocked);
    failure.remediationStatus = "blocked";
    return blocked;
  }

  const safetyChecks: string[] = [];
  if (rule.idempotentRequired && !options.idempotencyKeyPresent) {
    safetyChecks.push("idempotency-key-missing");
  }
  if (!failure.safeToAutoRemediate && options.triggeredBy === "auto") {
    safetyChecks.push("failure-not-safe-for-auto-remediation");
  }

  if (safetyChecks.length > 0) {
    const blocked = blockedAttempt(failure, safetyChecks.join(","), options.triggeredBy, rule.id);
    failure.remediationAttempts.push(blocked);
    failure.remediationStatus = "blocked";
    return blocked;
  }

  const attempt: RemediationAttempt = {
    remediationId: `remediation_${stableHash(`${failure.failureId}:${rule.id}:${Date.now()}`)}`,
    triggeredBy: options.triggeredBy,
    matchedRule: rule.id,
    safetyChecksPassed: true,
    actionTaken: rule.action,
    outcome: "succeeded",
    timestamp: new Date().toISOString(),
    traceId: failure.traceId,
    notes: [rule.description, `Backoff policy: ${rule.backoffMs}ms`, rule.guidance],
  };

  failure.remediationAttempts.push(attempt);
  failure.remediationStatus = "succeeded";
  return attempt;
}

function blockedAttempt(
  failure: FailureRecord,
  reason: string,
  triggeredBy: "auto" | "operator" | "policy",
  rule = "none"
): RemediationAttempt {
  return {
    remediationId: `remediation_${stableHash(`${failure.failureId}:${reason}:${Date.now()}`)}`,
    triggeredBy,
    matchedRule: rule,
    safetyChecksPassed: false,
    actionTaken: "none",
    outcome: "blocked",
    timestamp: new Date().toISOString(),
    traceId: failure.traceId,
    notes: [reason],
  };
}

export function operatorGuidance(failure: FailureRecord): OperatorGuidance {
  const topHypothesis = failure.rootCauseHypothesis[0];
  return {
    failureId: failure.failureId,
    whatFailed: `${failure.component}.${failure.operation}`,
    likelyWhy: topHypothesis?.probableCause ?? "No hypothesis available",
    blastRadius:
      failure.tenantId != null
        ? `Tenant-scoped impact for tenant ${failure.tenantId}`
        : "Potentially cross-tenant; verify request path and policy boundaries",
    userFacingImpact: ["critical", "high"].includes(failure.severity),
    safeToRetry: failure.retryable,
    recommendedNextSteps: [
      `Inspect trace ${failure.traceId} in logs and execution receipts.`,
      ...failure.rootCauseHypothesis.flatMap((item) =>
        item.evidence.map((evidence) => `Validate evidence: ${evidence}`)
      ),
      "If remediation remains blocked, execute operator-approved runbook action.",
    ],
    artifactLinks: [
      ...failure.linkedLogs,
      ...(failure.linkedExecutionReceipt ? [failure.linkedExecutionReceipt] : []),
      ...(failure.linkedReplayBundle ? [failure.linkedReplayBundle] : []),
    ],
  };
}

export interface FailureDashboardMetrics {
  topRecurringFailures: Array<{ signature: string; count: number }>;
  classesOverTime: Array<{ failureClass: FailureClass; count: number }>;
  meanTimeToRemediationSeconds: number;
  autoRemediationSuccessRate: number;
  highestErrorBurdenComponents: Array<{ component: string; count: number }>;
}

export function computeFailureDashboardMetrics(tenantId?: string): FailureDashboardMetrics {
  const failures = listFailures(tenantId);
  const clusters = clusterFailures(tenantId)
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
    .slice(0, 5)
    .map((cluster) => ({ signature: cluster.signature, count: cluster.occurrenceCount }));

  const byComponent = new Map<string, number>();
  for (const row of failures) {
    byComponent.set(row.component, (byComponent.get(row.component) ?? 0) + 1);
  }

  const remediated = failures.filter((failure) => failure.remediationAttempts.length > 0);
  const mttrSamples = remediated
    .map((failure) => {
      const first = failure.remediationAttempts[0];
      if (!first) return null;
      return (new Date(first.timestamp).getTime() - new Date(failure.timestamp).getTime()) / 1000;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);

  const autoAttempts = failures.flatMap((failure) =>
    failure.remediationAttempts.filter((attempt) => attempt.triggeredBy === "auto")
  );
  const autoSuccesses = autoAttempts.filter((attempt) => attempt.outcome === "succeeded").length;

  return {
    topRecurringFailures: clusters,
    classesOverTime: failureTrends(tenantId),
    meanTimeToRemediationSeconds:
      mttrSamples.length > 0
        ? Number(
            (mttrSamples.reduce((sum, value) => sum + value, 0) / mttrSamples.length).toFixed(2)
          )
        : 0,
    autoRemediationSuccessRate:
      autoAttempts.length > 0 ? Number((autoSuccesses / autoAttempts.length).toFixed(2)) : 0,
    highestErrorBurdenComponents: Array.from(byComponent.entries())
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

export function resetFailureIntelligenceStore(): void {
  failureStore.splice(0, failureStore.length);
}

export interface ComputedInsight {
  id: string;
  title: string;
  severity: FailureSeverity;
  confidence: number;
  evidenceSummary: string;
  affectedScope: string;
  recommendedAction: string;
  manualTriggerAvailable: boolean;
  autoTriggerAvailable: boolean;
  autoTriggerBlockedReason?: string;
  deepLink: string;
}

export function computeControlPlaneInsights(): ComputedInsight[] {
  const insights: ComputedInsight[] = [];
  const missingProviderKey = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;
  const missingSupabase =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (missingProviderKey) {
    insights.push({
      id: "insight-provider-key-missing",
      title: "Provider key missing for intelligent remediation",
      severity: "high",
      confidence: 0.99,
      evidenceSummary: "No OPENAI_API_KEY or ANTHROPIC_API_KEY configured.",
      affectedScope: "workspace",
      recommendedAction: "Set provider credential and rerun diagnostics.",
      manualTriggerAvailable: true,
      autoTriggerAvailable: false,
      autoTriggerBlockedReason: "Credential provisioning requires operator approval.",
      deepLink: "/console/setup-check",
    });
  }

  if (missingSupabase) {
    insights.push({
      id: "insight-supabase-config-missing",
      title: "Supabase runtime configuration missing",
      severity: "critical",
      confidence: 0.98,
      evidenceSummary: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      affectedScope: "org",
      recommendedAction: "Set required runtime vars, redeploy, and run verification checks.",
      manualTriggerAvailable: true,
      autoTriggerAvailable: false,
      autoTriggerBlockedReason: "Environment mutation is operator-gated.",
      deepLink: "/console/diagnostics",
    });
  }

  if (insights.length === 0) {
    const metrics = computeFailureDashboardMetrics();
    insights.push({
      id: "insight-failure-trends",
      title: "Failure intelligence ready",
      severity: "low",
      confidence: 0.85,
      evidenceSummary: `Top recurring signatures tracked: ${metrics.topRecurringFailures.length}.`,
      affectedScope: "workspace",
      recommendedAction: "Review clusters and trends before enabling new remediation rules.",
      manualTriggerAvailable: true,
      autoTriggerAvailable: false,
      autoTriggerBlockedReason: "No high-confidence safe trigger pending.",
      deepLink: "/console/control-plane",
    });
  }

  return insights;
}
