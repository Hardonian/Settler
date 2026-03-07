import type { DashboardData } from "@/lib/data/models";

export const DEMO_DASHBOARD_DATA: DashboardData = {
  executions: [
    {
      id: "exec_01JQX45H2Y9T",
      tenantId: "tenant_alpha",
      status: "completed",
      startedAt: "2026-03-18T09:12:00.000Z",
      finishedAt: "2026-03-18T09:13:10.000Z",
      deterministicReplayReady: true,
      expectedHash: "sha256:0f4a2dce1f0a",
      observedHash: "sha256:0f4a2dce1f0a",
    },
  ],
  reconciliations: [
    {
      id: "rec_2026_03_18",
      tenantId: "tenant_alpha",
      ledger: "stripe_vs_bank",
      status: "mismatch",
      matchedCount: 1182,
      mismatchCount: 9,
      deltaAmount: 294.12,
      currency: "USD",
    },
  ],
  proofReceipts: [
    {
      id: "proof_01JQX45J3Z8P",
      executionId: "exec_01JQX45H2Y9T",
      hash: "sha256:7689f4ef2a6e",
      provenance: ["stripe:evt_1", "postgres:tx_4221", "policy:policy_chargeback_guard"],
      verified: true,
    },
  ],
  policyRules: [
    {
      id: "policy_chargeback_guard",
      name: "Chargeback risk gate",
      condition: "risk_score > 0.65",
      action: "hold_settlement",
      enabled: true,
    },
  ],
  auditEvents: [
    {
      id: "aud_9",
      traceId: "trace_4f91",
      entityType: "execution",
      entityId: "exec_01JQX45H2Y9T",
      action: "replay_verified",
      actor: "system",
      timestamp: "2026-03-18T09:13:12.000Z",
    },
  ],
  systemHealth: {
    status: "healthy",
    replayDeterminismRate: 0.998,
    crossTenantViolationCount: 0,
    queueBacklog: 4,
  },
};
