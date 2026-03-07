export type DataMode = "LIVE" | "DEMO" | "EMPTY";

export interface Execution {
  id: string;
  tenantId: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  finishedAt?: string;
  deterministicReplayReady: boolean;
  expectedHash: string;
  observedHash: string;
}

export interface Reconciliation {
  id: string;
  tenantId: string;
  ledger: string;
  status: "matched" | "mismatch" | "pending-review";
  matchedCount: number;
  mismatchCount: number;
  deltaAmount: number;
  currency: string;
}

export interface ProofReceipt {
  id: string;
  executionId: string;
  hash: string;
  provenance: string[];
  verified: boolean;
}

export interface PolicyRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface AuditEvent {
  id: string;
  traceId: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  timestamp: string;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "critical";
  replayDeterminismRate: number;
  crossTenantViolationCount: number;
  queueBacklog: number;
}

export interface DashboardData {
  executions: Execution[];
  reconciliations: Reconciliation[];
  proofReceipts: ProofReceipt[];
  policyRules: PolicyRule[];
  auditEvents: AuditEvent[];
  systemHealth: SystemHealth;
}
