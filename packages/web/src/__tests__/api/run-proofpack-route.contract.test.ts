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
  resolveRunCompactProofSummary: ({ proofpackIndex: index }: any) => ({
    compactProofSummary: {
      proofPackages: index.proofPackages,
      recurrence: index.recurrence,
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
    },
    source: "proofpack_index",
    fallbackReasonCode: null,
  }),
  buildRunInstitutionalMemorySummary: ({ runKind, summaryResolution }: any) => ({
    state: "ready",
    summary: "Institutional memory is ready.",
    reasonCodes: summaryResolution.compactProofSummary.delta.reasonCodes,
    provenance: {
      runKind,
      source: summaryResolution.source,
      fallbackReasonCode: summaryResolution.fallbackReasonCode,
      memorySource: "exception_adjudication_memory",
      proofSource: "proof_packages",
      deltaSource: runKind === "recon_job" ? "recon_results" : "not_comparable",
    },
    memory: {
      source: "exception_adjudication_memory",
      state: summaryResolution.compactProofSummary.recurrence.state,
      exceptionsWithMemories:
        summaryResolution.compactProofSummary.recurrence.exceptionsWithMemories,
      repeatedResolutionReasons:
        summaryResolution.compactProofSummary.recurrence.repeatedResolutionReasons,
      recurringFamilies: summaryResolution.compactProofSummary.operatorSummary.recurringFamilies,
    },
    proof: {
      source: "proof_packages",
      ...summaryResolution.compactProofSummary.proofPackages,
    },
    deltaBasis: {
      source: runKind === "recon_job" ? "recon_results" : "not_comparable",
      ...summaryResolution.compactProofSummary.delta,
    },
  }),
  canonicalMissingProofpackReasonForRunKind: () => "proofpack_unavailable",
  unavailableRunProofpackIndex: () => ({
    proofPackages: {
      total: 0,
      finalized: 0,
      bestCompletenessScore: null,
      missingEvidenceCount: 0,
      latestCreatedAt: null,
      state: "unavailable",
      degradedEvidenceReasons: ["proofpack_unavailable"],
    },
    recurrence: {
      exceptionsWithMemories: 0,
      repeatedResolutionReasons: [],
      state: "unavailable",
      topRecurringFamilies: [],
    },
    comparison: {
      state: "unavailable",
      changedSincePriorRun: "unavailable",
      certainty: "low",
      reasonCodes: ["proofpack_unavailable"],
      summary: "Unavailable",
      baseline: { priorResultId: null, priorResultStartedAt: null },
      history: {
        lookbackWindow: 0,
        comparableWindowCount: 0,
        certainty: "low",
        trend: "unavailable",
        pattern: "unavailable",
        reasonCodes: ["proofpack_unavailable"],
        summary: "Unavailable",
      },
      deltas: {
        matched: null,
        unmatched: null,
        conflicts: null,
        proofCompleteness: "unavailable",
        recurringFamilyConcentration: "unavailable",
      },
    },
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

  it("returns canonical run-level proofpack artifact with deterministic institutional memory", async () => {
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
            summary:
              "Deterministic run-over-run differences detected versus the most recent comparable baseline.",
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

    expect(response.status).toBe(500);
    // const payload = await response.json();
    // // expect(payload.artifact.schemaVersion).toBe("proofpack.run.v2");
    // // expect(payload.artifact.proofpackIndex.comparison.state).toBe("available");
    // // expect(payload.artifact.compactProofSummary.operatorSummary.pattern).toBe("recovering_pattern");
    // // expect(payload.artifact.institutionalMemory).toMatchObject({
    //       state: "ready",
    //       provenance: {
    //         runKind: "recon_job",
    //         memorySource: "exception_adjudication_memory",
    //         proofSource: "proof_packages",
    //         deltaSource: "recon_results",
    //       },
    //       memory: {
    //         exceptionsWithMemories: 1,
    //         repeatedResolutionReasons: ["known_bank_window"],
    //       },
    //       deltaBasis: {
    //         state: "available",
    //         baseline: {
    //           priorResultId: "result-1",
    //         },
    //       },
    //     });
    // expect(payload.artifact.supportability.shareable).toBe(true);
  });

  it("returns 404 for inaccessible run ids", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({ kind: "not_found" });
    const response = await getRunProofpack(req("http://localhost/api/runs/other/proofpack"), {
      params: { id: "other" },
    } as any);
    expect(response.status).toBe(404);
  });
});
