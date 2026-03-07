import { DEMO_DASHBOARD_DATA } from "@/lib/data/fixtures";
import type { DashboardData, DataMode } from "@/lib/data/models";

type RawExecution = {
  id: string;
  tenant_id: string;
  state: "queued" | "running" | "completed" | "failed";
  started_at: string;
  finished_at?: string;
  expected_hash: string;
  observed_hash: string;
};

export function resolveDataMode(hasLiveData: boolean, preferDemo: boolean): DataMode {
  if (hasLiveData) return "LIVE";
  if (preferDemo) return "DEMO";
  return "EMPTY";
}

export function adaptExecution(raw: RawExecution): DashboardData["executions"][number] {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    status: raw.state,
    startedAt: raw.started_at,
    finishedAt: raw.finished_at,
    deterministicReplayReady: raw.expected_hash === raw.observed_hash,
    expectedHash: raw.expected_hash,
    observedHash: raw.observed_hash,
  };
}

export function buildDashboardData(input: {
  mode: DataMode;
  liveExecutions?: RawExecution[];
}): DashboardData {
  if (input.mode === "EMPTY") {
    return {
      executions: [],
      reconciliations: [],
      proofReceipts: [],
      policyRules: [],
      auditEvents: [],
      systemHealth: {
        status: "degraded",
        replayDeterminismRate: 0,
        crossTenantViolationCount: 0,
        queueBacklog: 0,
      },
    };
  }

  if (input.mode === "LIVE") {
    return {
      ...DEMO_DASHBOARD_DATA,
      executions: (input.liveExecutions ?? []).map(adaptExecution),
    };
  }

  return DEMO_DASHBOARD_DATA;
}
