export type EvidenceLevel = "none" | "standard" | "full";

export interface PolicyDefinition {
  id: string;
  version: string;
  requiredRole?: string;
  requiredScopes?: string[];
  evidenceLevel: EvidenceLevel;
  replayRequired: boolean;
  maxComputeUnits?: number;
  maxMemoryUnits?: number;
  maxCasIoUnits?: number;
  maxReplayCalls?: number;
  retentionDays?: number;
  allowDeterministicOverride?: boolean;
}

export function definePolicy(policy: PolicyDefinition): PolicyDefinition {
  return {
    ...policy,
    requiredScopes: [...(policy.requiredScopes ?? [])].sort(),
    allowDeterministicOverride: policy.allowDeterministicOverride ?? false,
  };
}
