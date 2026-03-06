export interface ControlPlanePolicy {
  id: string;
  type: "rate_limit" | "ip_allowlist" | "webhook_signing";
  enabled: boolean;
  config: Record<string, unknown>;
  updatedAt: string;
}

const initialPolicies: ControlPlanePolicy[] = [
  {
    id: "rate-limit-default",
    type: "rate_limit",
    enabled: true,
    config: { requestsPerMinute: 120 },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ip-allowlist-default",
    type: "ip_allowlist",
    enabled: false,
    config: { ips: [] },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "webhook-signing-default",
    type: "webhook_signing",
    enabled: true,
    config: { required: true },
    updatedAt: new Date().toISOString(),
  },
];

let policies = [...initialPolicies];

export function listPolicies(): ControlPlanePolicy[] {
  return policies;
}

export function updatePolicy(id: string, enabled: boolean): ControlPlanePolicy | null {
  const target = policies.find((policy) => policy.id === id);
  if (!target) {
    return null;
  }

  target.enabled = enabled;
  target.updatedAt = new Date().toISOString();
  return target;
}
