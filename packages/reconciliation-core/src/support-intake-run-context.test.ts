const resolveOperatorRunDetailForTenantsMock = jest.fn();

jest.mock("./operator-run-detail-resolve.js", () => ({
  resolveOperatorRunDetailForTenants: (...args: unknown[]) =>
    resolveOperatorRunDetailForTenantsMock(...args),
}));

import {
  buildSupportIntakeExceptionContext,
  buildSupportIntakeRunContext,
} from "./support-intake-run-context.js";

describe("support intake context", () => {
  beforeEach(() => {
    resolveOperatorRunDetailForTenantsMock.mockReset();
  });

  it("returns canonical run intelligence with explicit fallback semantics", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({
      kind: "ok",
      detail: {
        id: "run-1",
        runKind: "recon_job",
        status: "completed",
        compactProofSummary: {
          proofPackages: {
            total: 1,
            finalized: 1,
            bestCompletenessScore: 1,
            missingEvidenceCount: 0,
            latestCreatedAt: "2026-04-08T00:00:00.000Z",
            state: "ready",
            degradedEvidenceReasons: [],
          },
          recurrence: {
            exceptionsWithMemories: 0,
            repeatedResolutionReasons: [],
            state: "setup_required",
            topRecurringFamilies: [],
          },
          delta: {
            changedSincePreviousRun: "unchanged",
            summary: "Stable",
            state: "available",
            certainty: "high",
            reasonCodes: [],
            baseline: {
              priorResultId: null,
              priorResultStartedAt: null,
            },
            history: {
              lookbackWindow: 1,
              comparableWindowCount: 1,
              certainty: "high",
              trend: "stable",
              pattern: "stable_pattern",
              reasonCodes: [],
              summary: "Stable history",
            },
            deltas: {
              matched: 0,
              unmatched: 0,
              conflicts: 0,
              proofCompleteness: "unchanged",
              recurringFamilyConcentration: "stable",
            },
          },
          operatorSummary: {
            signal: "strong",
            pattern: "stable_pattern",
            changedSincePreviousRun: "unchanged",
            proofPosture: "unchanged",
            primaryReasonCodes: [],
            recurringFamilies: [],
            summary: "Stable",
            explainerCodes: ["signal_strong", "pattern_stable"],
          },
        },
        proofpackIndex: undefined,
      },
    });

    const context = await buildSupportIntakeRunContext({} as any, "tenant-a", "run-1");

    expect(context).toMatchObject({
      state: "ok",
      runId: "run-1",
      runKind: "recon_job",
      status: "completed",
    });
    expect(context.compactProofSummary.operatorSummary.signal).toBe("strong");
  });

  it("builds exception family context for tenant-scoped support intake", async () => {
    const prisma = {
      reconciliationMatch: {
        findFirst: jest.fn().mockResolvedValue({
          id: "exc-1",
          runId: "run-1",
          matchType: "unmatched",
          amountDiff: 10,
          dateDiff: 0,
          confidence: 0.92,
          targetTransactionId: "target-1",
          matchReason: "Amount mismatch against settlement",
          status: "resolved",
          reviewed: true,
          severity: "high",
        }),
      },
      exceptionArchetypeClassification: {
        findFirst: jest.fn().mockResolvedValue({
          archetypeId: "arch-1",
        }),
      },
      exceptionArchetype: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: "arch-1",
            code: "AMOUNT_MISMATCH",
            label: "Amount Mismatch",
            category: "amount",
          })
          .mockResolvedValueOnce({
            id: "arch-1",
            code: "AMOUNT_MISMATCH",
            label: "Amount Mismatch",
            category: "amount",
          }),
      },
      exceptionAdjudicationMemory: {
        findMany: jest.fn().mockResolvedValue([
          {
            exceptionId: "exc-2",
            resolution: "manual",
            resolutionReason: "manual review confirmed",
            resolutionCode: "MANUAL_REVIEW_CONFIRMED",
            outcome: "resolved",
            adjudicationType: "initial",
            confidence: 0.91,
            sourceTrustScore: 0.88,
            createdAt: "2026-04-01T00:00:00.000Z",
          },
          {
            exceptionId: "exc-3",
            resolution: "manual",
            resolutionReason: "manual review confirmed",
            resolutionCode: "MANUAL_REVIEW_CONFIRMED",
            outcome: "resolved",
            adjudicationType: "initial",
            confidence: 0.9,
            sourceTrustScore: 0.9,
            createdAt: "2026-04-02T00:00:00.000Z",
          },
        ]),
      },
    };

    const context = await buildSupportIntakeExceptionContext(prisma as any, "tenant-a", "exc-1");

    expect(context).toMatchObject({
      state: "ok",
      exceptionId: "exc-1",
      runId: "run-1",
      type: "amount_mismatch",
      status: "resolved",
      canonicalStatus: "resolved",
      severity: "high",
      familySummary: expect.objectContaining({
        familyCode: "AMOUNT_MISMATCH",
        familyLabel: "Amount Mismatch",
        supportingCaseCount: 2,
      }),
      operatorSummary: expect.objectContaining({
        familyLabel: "Amount Mismatch",
        familyState: "available",
      }),
    });
  });
});
