import crypto from "node:crypto";
import { stableStringify } from "../scripts/reconciliation-control-plane.mjs";
import type { PolicyDefinition } from "./types";

export interface PolicyContext {
  tenantId: string;
  actorRole?: string;
  actorScopes?: string[];
  replayCalls: number;
}

export interface EnforcementPlan {
  policyId: string;
  policyVersion: string;
  policyHash: string;
  tenantId: string;
  evidenceLevel: PolicyDefinition["evidenceLevel"];
  replayRequired: boolean;
  identity: {
    requiredRole?: string;
    requiredScopes: string[];
  };
  budgets: {
    maxComputeUnits: number;
    maxMemoryUnits: number;
    maxCasIoUnits: number;
    maxReplayCalls: number;
  };
  metadata: {
    retentionDays?: number;
    allowDeterministicOverride: boolean;
  };
}

export function hashPolicy(policy: PolicyDefinition): string {
  return crypto.createHash("sha256").update(stableStringify(policy)).digest("hex");
}

export function compilePolicy(policy: PolicyDefinition, context: PolicyContext): EnforcementPlan {
  const actorScopes = [...(context.actorScopes ?? [])].sort();
  const requiredScopes = [...(policy.requiredScopes ?? [])].sort();

  if (policy.requiredRole && context.actorRole !== policy.requiredRole) {
    throw new Error(
      `Policy role violation: required=${policy.requiredRole} got=${context.actorRole ?? "none"}`
    );
  }

  for (const scope of requiredScopes) {
    if (!actorScopes.includes(scope)) {
      throw new Error(`Policy scope violation: missing=${scope}`);
    }
  }

  if (context.replayCalls > (policy.maxReplayCalls ?? Number.MAX_SAFE_INTEGER)) {
    throw new Error("Policy replay violation: replay call budget exceeded");
  }

  return {
    policyId: policy.id,
    policyVersion: policy.version,
    policyHash: hashPolicy(policy),
    tenantId: context.tenantId,
    evidenceLevel: policy.evidenceLevel,
    replayRequired: policy.replayRequired,
    identity: {
      requiredRole: policy.requiredRole,
      requiredScopes,
    },
    budgets: {
      maxComputeUnits: policy.maxComputeUnits ?? Number.MAX_SAFE_INTEGER,
      maxMemoryUnits: policy.maxMemoryUnits ?? Number.MAX_SAFE_INTEGER,
      maxCasIoUnits: policy.maxCasIoUnits ?? Number.MAX_SAFE_INTEGER,
      maxReplayCalls: policy.maxReplayCalls ?? Number.MAX_SAFE_INTEGER,
    },
    metadata: {
      retentionDays: policy.retentionDays,
      allowDeterministicOverride: policy.allowDeterministicOverride ?? false,
    },
  };
}
