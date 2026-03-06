export type FailureCategory =
  | "CONFIG_MISSING"
  | "API_KEY_MISSING"
  | "PROVIDER_UNAVAILABLE"
  | "MODEL_UNCONFIGURED"
  | "ORG_CONFIG_MISSING"
  | "WORKSPACE_CONFIG_MISSING"
  | "PROJECT_CONFIG_MISSING"
  | "PERMISSION_DENIED"
  | "TOOL_UNAVAILABLE"
  | "TOOL_SCHEMA_MISMATCH"
  | "TOOL_CALL_INVALID"
  | "NETWORK_TRANSIENT"
  | "AUTH_EXPIRED"
  | "REPLAY_ARTIFACT_MISSING"
  | "PATCH_APPLY_FAILED"
  | "REVIEW_MODEL_NOT_ENABLED"
  | "FIXER_MODEL_NOT_ENABLED"
  | "RATE_LIMITED"
  | "UNSUPPORTED_RUNTIME"
  | "REPO_BINDING_MISSING"
  | "POLICY_CONFLICT"
  | "RECONCILIATION_INPUT_INVALID"
  | "ADAPTER_MAPPING_INVALID"
  | "UNKNOWN_RECOVERABLE"
  | "UNKNOWN_FATAL";

export interface FailureDiagnosisInput {
  error: string;
  scope?: "org" | "workspace" | "project" | "run" | "route" | "provider";
  route?: string;
  provider?: string;
}

export interface FailureDiagnosis {
  category: FailureCategory;
  confidence: number;
  likelyCause: string;
  explanation: string;
  recommendedActions: string[];
  safeAutoRemediationEligible: boolean;
  escalationRequired: boolean;
  blockingDependency?: string;
}

interface Rule {
  category: FailureCategory;
  pattern: RegExp;
  likelyCause: string;
  explanation: string;
  recommendedActions: string[];
  safeAutoRemediationEligible: boolean;
  escalationRequired: boolean;
  blockingDependency?: string;
  confidence: number;
}

const RULES: Rule[] = [
  {
    category: "API_KEY_MISSING",
    pattern: /missing api key|api key.*missing|no api key/i,
    likelyCause: "Provider credentials are not configured for this scope.",
    explanation:
      "The requested provider call cannot execute without an API key or secret reference.",
    recommendedActions: [
      "Open provider settings for this workspace and add an API key.",
      "If org-level inheritance is allowed, enable inherited credentials for this workspace.",
      "Retry the action after validating provider readiness.",
    ],
    safeAutoRemediationEligible: false,
    escalationRequired: false,
    blockingDependency: "provider_credentials",
    confidence: 0.95,
  },
  {
    category: "RATE_LIMITED",
    pattern: /rate limit|too many requests|429/i,
    likelyCause: "Provider or route quota was exceeded.",
    explanation: "The system received a throttling signal and should back off before retrying.",
    recommendedActions: [
      "Retry with exponential backoff.",
      "Shift traffic to a fallback provider if policy permits.",
      "Reduce request concurrency for this workflow.",
    ],
    safeAutoRemediationEligible: true,
    escalationRequired: false,
    blockingDependency: "provider_quota",
    confidence: 0.92,
  },
  {
    category: "AUTH_EXPIRED",
    pattern: /token expired|session expired|unauthorized|401/i,
    likelyCause: "Authentication session or token is no longer valid.",
    explanation: "The action was rejected due to missing or expired authentication.",
    recommendedActions: [
      "Re-authenticate and refresh credentials.",
      "Re-run the failed action after session refresh.",
      "Validate workspace permissions if the issue persists.",
    ],
    safeAutoRemediationEligible: false,
    escalationRequired: false,
    blockingDependency: "auth_session",
    confidence: 0.9,
  },
  {
    category: "PERMISSION_DENIED",
    pattern: /permission denied|forbidden|403/i,
    likelyCause: "The caller lacks required capability for the target scope.",
    explanation:
      "The request reached the service but policy or role constraints blocked execution.",
    recommendedActions: [
      "Review org/workspace role bindings for this operator.",
      "Request elevated approval for privileged actions.",
      "Use a manual export path if automation remains blocked.",
    ],
    safeAutoRemediationEligible: false,
    escalationRequired: true,
    blockingDependency: "authorization_policy",
    confidence: 0.93,
  },
  {
    category: "REPLAY_ARTIFACT_MISSING",
    pattern: /artifact.*missing|missing artifact|replay.*not available/i,
    likelyCause: "Replay prerequisites were not captured for the original run.",
    explanation:
      "Deterministic replay cannot be guaranteed because one or more artifacts are unavailable.",
    recommendedActions: [
      "Run partial replay with explicit caveats.",
      "Enable artifact capture for future runs.",
      "Generate a proof pack to document missing evidence.",
    ],
    safeAutoRemediationEligible: false,
    escalationRequired: false,
    blockingDependency: "replay_artifacts",
    confidence: 0.89,
  },
  {
    category: "UNKNOWN_FATAL",
    pattern: /.*/,
    likelyCause: "Unhandled runtime failure requires operator review.",
    explanation: "The error did not match known recoverable signatures.",
    recommendedActions: [
      "Inspect route diagnostics and correlated logs.",
      "Create a remediation task with trace context.",
      "Run verification checks before retrying.",
    ],
    safeAutoRemediationEligible: false,
    escalationRequired: true,
    confidence: 0.4,
  },
];

export function diagnoseFailure(input: FailureDiagnosisInput): FailureDiagnosis {
  const normalizedError = input.error.trim();
  const matched =
    RULES.find((rule) => rule.pattern.test(normalizedError)) ?? RULES[RULES.length - 1]!;

  return {
    category: matched.category,
    confidence: matched.confidence,
    likelyCause: matched.likelyCause,
    explanation: matched.explanation,
    recommendedActions: matched.recommendedActions,
    safeAutoRemediationEligible: matched.safeAutoRemediationEligible,
    escalationRequired: matched.escalationRequired,
    blockingDependency: matched.blockingDependency,
  };
}

export interface ComputedInsight {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
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
  const missingProviderKey = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;
  const missingSupabase =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const insights: ComputedInsight[] = [];

  if (missingProviderKey) {
    insights.push({
      id: "insight-provider-key-missing",
      title: "Provider key missing for review/fix actions",
      severity: "high",
      confidence: 0.99,
      evidenceSummary:
        "No OPENAI_API_KEY or ANTHROPIC_API_KEY is configured in runtime environment.",
      affectedScope: "workspace",
      recommendedAction: "Configure a provider key in settings and rerun readiness checks.",
      manualTriggerAvailable: true,
      autoTriggerAvailable: false,
      autoTriggerBlockedReason: "Auto-remediation cannot provision credentials automatically.",
      deepLink: "/console/setup-check",
    });
  }

  if (missingSupabase) {
    insights.push({
      id: "insight-supabase-config-missing",
      title: "Core workspace backend config is incomplete",
      severity: "critical",
      confidence: 0.98,
      evidenceSummary:
        "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing, which blocks tenant-backed workflows.",
      affectedScope: "org",
      recommendedAction: "Set missing Supabase variables and re-run system health verification.",
      manualTriggerAvailable: true,
      autoTriggerAvailable: false,
      autoTriggerBlockedReason: "Environment variables require operator action.",
      deepLink: "/console/diagnostics",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "insight-insufficient-failures",
      title: "Insufficient failure volume for high-confidence recommendations",
      severity: "low",
      confidence: 0.8,
      evidenceSummary:
        "No critical runtime readiness gaps were detected from available environment signals.",
      affectedScope: "workspace",
      recommendedAction:
        "Collect run failure telemetry to unlock deeper automated recommendations.",
      manualTriggerAvailable: true,
      autoTriggerAvailable: false,
      autoTriggerBlockedReason: "No recoverable high-confidence failure cluster available.",
      deepLink: "/console/control-plane",
    });
  }

  return insights;
}
