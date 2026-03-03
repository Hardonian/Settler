import { demoStrictPolicy } from "./builtins/default";
import type { PolicyDefinition } from "./types";

const policies = new Map<string, PolicyDefinition>([[demoStrictPolicy.id, demoStrictPolicy]]);

export function getPolicy(policyId: string): PolicyDefinition {
  const policy = policies.get(policyId);
  if (!policy) {
    throw new Error(`Unknown policy: ${policyId}`);
  }
  return policy;
}

export function listPolicies(): PolicyDefinition[] {
  return [...policies.values()];
}
