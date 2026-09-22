import type { JevMode } from "./config";

export type JevTriageAction =
  "manual_review" | "auto_match_candidate" | "policy_adjustment" | "escalate";

export interface JevExceptionContext {
  /** Local correlation value. It is never sent to TypeSafe AI. */
  reference: string;
  matchType: string;
  reason?: string | null;
  severity?: string | null;
  ageHours: number;
  assigned: boolean;
  archetypeCodes: string[];
  historicalCaseCount: number;
  historicalResolutionRate?: number;
  deterministicAction: JevTriageAction;
  evidenceGap: boolean;
  recurrenceCount: number;
}

export interface JevDecisionEvidence {
  provider: "typesafe-jev";
  providerVersion: "system-one";
  mode: JevMode;
  model: string;
  requestId?: string;
  requestDigest: string;
  responseDigest: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface JevExceptionAssessment {
  reference: string;
  recommendedAction: JevTriageAction;
  actionConfidence: number;
  operationalRiskScore: number;
  operationalRiskConfidence: number;
  ambiguityProbability: number;
  urgentReviewProbability: number;
  confidenceThreshold: number;
  evidence: JevDecisionEvidence;
}

export type JevAssessmentStatus = "off" | "unavailable" | "partial" | "success";

export interface JevBatchAssessment {
  status: JevAssessmentStatus;
  mode: JevMode;
  assessments: JevExceptionAssessment[];
  reason?:
    | "disabled"
    | "missing_api_key"
    | "tenant_not_allowed"
    | "circuit_open"
    | "authentication"
    | "rate_limited"
    | "timeout"
    | "invalid_response"
    | "provider_unavailable";
}

export interface JevDecisionProvider {
  getStatus?(tenantId: string): {
    provider: "typesafe-jev";
    mode: JevMode;
    enabled: boolean;
    reason?: "disabled" | "missing_api_key" | "tenant_not_allowed" | "circuit_open";
  };
  assessExceptions(
    tenantId: string,
    exceptions: readonly JevExceptionContext[]
  ): Promise<JevBatchAssessment>;
}
