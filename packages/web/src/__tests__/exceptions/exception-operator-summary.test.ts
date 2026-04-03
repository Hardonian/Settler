import { buildExceptionOperatorSummary } from "@/lib/server/exceptions/reconciliation-workbench";

describe("buildExceptionOperatorSummary", () => {
  it("marks resolved exceptions as ready when evidence and proof are complete", () => {
    const summary = buildExceptionOperatorSummary({
      status: "resolved",
      severity: "high",
      description: "Payout mismatch on settlement batch",
      suggestedActions: ["Export the finalized proof package."],
      adjudicationMemories: [
        {
          id: "memory-1",
          resolution: "resolved",
          resolutionReason: "duplicate payout imported twice",
          adjudicationType: "manual_review",
          adjudicatorId: "user-1",
          adjudicatorType: "human",
          outcome: "resolved",
          confidence: 0.97,
          sourceTrustScore: 0.96,
          operatorNotes: "Verified against bank statement.",
          systemNotes: null,
          evidenceIds: ["ev-1"],
          createdAt: "2026-04-01T10:00:00.000Z",
          completedAt: "2026-04-01T10:05:00.000Z",
          parentMemoryId: null,
        },
      ],
      evidenceSummary: {
        total: 2,
        degraded: 0,
        attested: 2,
        latestCapturedAt: "2026-04-01T10:03:00.000Z",
        items: [],
      },
      proofSummary: {
        total: 1,
        finalized: 1,
        latestCreatedAt: "2026-04-01T10:04:00.000Z",
        items: [
          {
            id: "proof-1",
            packageType: "exception_resolution",
            packageKey: "exception:123",
            status: "finalized",
            completenessScore: 100,
            missingEvidence: [],
            completenessFlags: [],
            evidenceIds: ["ev-1", "ev-2"],
            createdAt: "2026-04-01T10:04:00.000Z",
            finalizedAt: "2026-04-01T10:06:00.000Z",
          },
        ],
      },
    });

    expect(summary.evidenceState).toBe("ready");
    expect(summary.proofState).toBe("ready");
    expect(summary.memoryState).toBe("ready");
    expect(summary.bestCompletenessScore).toBe(100);
    expect(summary.whatHappened).toContain("resolved");
  });

  it("keeps unresolved exceptions in setup-required or degraded states when proof is missing", () => {
    const summary = buildExceptionOperatorSummary({
      status: "pending",
      severity: "medium",
      description: "Timing difference needs review",
      suggestedActions: ["Attach supporting evidence before resolving or ignoring the exception."],
      adjudicationMemories: [],
      evidenceSummary: {
        total: 1,
        degraded: 1,
        attested: 0,
        latestCapturedAt: "2026-04-01T10:03:00.000Z",
        items: [],
      },
      proofSummary: {
        total: 0,
        finalized: 0,
        latestCreatedAt: null,
        items: [],
      },
    });

    expect(summary.evidenceState).toBe("degraded");
    expect(summary.proofState).toBe("degraded");
    expect(summary.memoryState).toBe("setup_required");
    expect(summary.nextStep).toContain("Attach supporting evidence");
  });
});
