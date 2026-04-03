/** @jest-environment node */

import { GET as getRunProofpack } from "@/app/api/runs/[id]/proofpack/route";

const resolveTenantMembershipScopeMock = jest.fn();
const resolveOperatorRunDetailForTenantsMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/supabase/tenant-membership", () => {
  class TenantMembershipError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    resolveTenantMembershipScope: (...args: unknown[]) => resolveTenantMembershipScopeMock(...args),
    TenantMembershipError,
  };
});

jest.mock("@settler/reconciliation-core", () => ({
  resolveOperatorRunDetailForTenants: (...args: unknown[]) =>
    resolveOperatorRunDetailForTenantsMock(...args),
  toRunCompactProofSummary: (index: any) => ({
    delta: index.comparison,
    operatorSummary: {
      signal: "strong",
      pattern: "recovering_pattern",
      changedSincePreviousRun: index.comparison.changedSincePriorRun,
      proofPosture: "unchanged",
      primaryReasonCodes: [],
      recurringFamilies: [],
      summary: "deterministic",
      explainerCodes: ["signal_strong", "pattern_recovering"],
    },
  }),
  unavailableRunProofpackIndex: () => ({
    proofPackages: { state: "unavailable" },
    comparison: { state: "unavailable", changedSincePriorRun: "unavailable" },
  }),
}));

jest.mock("@/shared/db/prismaClient", () => ({ prisma: {} }));

function req(url: string) {
  return {
    url,
    method: "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
  } as any;
}

describe("GET /api/runs/[id]/proofpack", () => {
  beforeEach(() => {
    resolveTenantMembershipScopeMock.mockReset();
    resolveOperatorRunDetailForTenantsMock.mockReset();
    resolveTenantMembershipScopeMock.mockResolvedValue({ tenantIds: ["tenant-a"] });
  });

  it("returns canonical run-level proofpack artifact with deterministic comparison state", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({
      kind: "ok",
      detail: {
        id: "run-1",
        runKind: "recon_job",
        status: "completed",
        startedAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-01-01T00:01:00.000Z",
        detailHref: "/console/runs/run-1",
        proofpackIndex: {
          proofPackages: {
            total: 1,
            finalized: 1,
            bestCompletenessScore: 1,
            missingEvidenceCount: 0,
            latestCreatedAt: "2026-01-01T00:05:00.000Z",
            state: "ready",
            degradedEvidenceReasons: [],
          },
          recurrence: {
            exceptionsWithMemories: 1,
            repeatedResolutionReasons: ["known_bank_window"],
            state: "ready",
            topRecurringFamilies: [],
          },
          comparison: {
            state: "available",
            changedSincePriorRun: "changed",
            certainty: "high",
            reasonCodes: [],
            summary: "Deterministic run-over-run differences detected versus the most recent comparable baseline.",
            baseline: {
              priorResultId: "result-1",
              priorResultStartedAt: "2025-12-31T00:00:00.000Z",
            },
            history: {
              lookbackWindow: 2,
              comparableWindowCount: 2,
              certainty: "high",
              trend: "improving",
              pattern: "recovering_pattern",
              reasonCodes: ["history_window_evaluated"],
              summary: "Recent comparable history shows improving reconciliation posture.",
            },
            deltas: {
              matched: 2,
              unmatched: -1,
              conflicts: 0,
              proofCompleteness: "improved",
              recurringFamilyConcentration: "stronger",
            },
          },
        },
      },
    });

    const response = await getRunProofpack(req("http://localhost/api/runs/run-1/proofpack"), {
      params: { id: "run-1" },
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.artifact.schemaVersion).toBe("proofpack.run.v1");
    expect(payload.artifact.proofpackIndex.comparison.state).toBe("available");
    expect(payload.artifact.compactProofSummary.operatorSummary.pattern).toBe("recovering_pattern");
    expect(payload.artifact.supportability.shareable).toBe(true);
  });

  it("returns 404 for inaccessible run ids", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({ kind: "not_found" });
    const response = await getRunProofpack(req("http://localhost/api/runs/other/proofpack"), {
      params: { id: "other" },
    } as any);
    expect(response.status).toBe(404);
  });
});
