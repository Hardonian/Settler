import { buildCrossRunIntelligenceSummary } from "./cross-run-intelligence.js";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function makeResult(
  overrides: Partial<{
    id: string;
    reconJobId: string;
    tenantId: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    matchedCount: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflictCount: number;
    confidenceAvg: number | null;
    sourceCount: number;
    targetCount: number;
  }> = {}
) {
  return {
    id: "result-1",
    reconJobId: "job-1",
    tenantId: "tenant-1",
    status: "completed",
    startedAt: new Date("2026-01-01T00:00:00Z"),
    completedAt: new Date("2026-01-01T00:01:00Z"),
    matchedCount: 100,
    unmatchedSourceCount: 5,
    unmatchedTargetCount: 3,
    conflictCount: 1,
    confidenceAvg: 0.97,
    sourceCount: 108,
    targetCount: 108,
    ...overrides,
  };
}

function makeAdjudication(
  overrides: Partial<{
    id: string;
    exceptionId: string;
    archetypeId: string | null;
    tenantId: string;
    resolution: string;
    resolutionReason: string | null;
    outcome: string | null;
    adjudicatorType: string;
    adjudicationType: string;
    durationMs: bigint | null;
    createdAt: Date;
    completedAt: Date | null;
  }> = {}
) {
  return {
    id: "mem-1",
    exceptionId: "exc-1",
    archetypeId: "arch-1",
    tenantId: "tenant-1",
    resolution: "matched",
    resolutionReason: "timing_drift",
    outcome: "resolved",
    adjudicatorType: "operator",
    adjudicationType: "initial",
    durationMs: BigInt(5000),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    completedAt: new Date("2026-01-01T00:00:05Z"),
    ...overrides,
  };
}

function makeArchetype(
  overrides: Partial<{
    id: string;
    code: string;
    label: string;
    category: string;
    typicalResolution: string | null;
  }> = {}
) {
  return {
    id: "arch-1",
    code: "TIMING_DRIFT",
    label: "Timing Drift",
    category: "timing",
    typicalResolution: "approve_with_note",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────

describe("buildCrossRunIntelligenceSummary", () => {
  it("returns fully unavailable summary when tenantIds is empty", async () => {
    const prisma: any = { reconResult: { findMany: jest.fn() } };
    const result = await buildCrossRunIntelligenceSummary(prisma, []);

    expect(result.state).toBe("unavailable");
    expect(result.runTimeline.state).toBe("unavailable");
    expect(result.recurringFamilies.state).toBe("unavailable");
    expect(result.decisionMemory.state).toBe("unavailable");
    expect(result.runTimeline.reasonCodes).toContain("no_tenant_scope");
    // Prisma was never called
    expect(prisma.reconResult.findMany).not.toHaveBeenCalled();
  });

  it("returns building/insufficient when no runs exist", async () => {
    const prisma: any = {
      reconResult: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([]) },
      reconJob: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const result = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);

    expect(result.runTimeline.state).toBe("insufficient_history");
    expect(result.runTimeline.runs).toHaveLength(0);
    expect(result.runTimeline.reasonCodes).toContain("no_completed_runs");
    expect(result.recurringFamilies.state).toBe("building");
    expect(result.decisionMemory.state).toBe("empty");
  });

  it("computes correct match rate for each run entry", async () => {
    // matched=80, unmatchedSource=10, unmatchedTarget=10 → matchRate=80/100=0.8
    const result = makeResult({
      matchedCount: 80,
      unmatchedSourceCount: 10,
      unmatchedTargetCount: 10,
    });
    const prisma: any = {
      reconResult: { findMany: jest.fn().mockResolvedValue([result, result, result]) },
      reconJob: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "job-1", name: "Test Job", tenantId: "tenant-1" }]),
      },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);

    expect(summary.runTimeline.runs[0]!.matchRate).toBe(0.8);
    expect(summary.runTimeline.runs[0]!.unmatchedTotal).toBe(20);
    expect(summary.runTimeline.runs[0]!.jobName).toBe("Test Job");
  });

  it("computes stable overall trend when match rates are consistent", async () => {
    const results = Array.from({ length: 6 }, (_, i) =>
      makeResult({
        id: `r-${i}`,
        matchedCount: 95,
        unmatchedSourceCount: 5,
        unmatchedTargetCount: 0,
      })
    );
    const prisma: any = {
      reconResult: { findMany: jest.fn().mockResolvedValue(results) },
      reconJob: {
        findMany: jest.fn().mockResolvedValue([{ id: "job-1", name: "Job", tenantId: "tenant-1" }]),
      },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);
    expect(summary.runTimeline.overallTrend).toBe("stable");
  });

  it("computes improving trend when recent match rates are higher than older", async () => {
    // Older runs: 70% match; newer runs: 95% match
    const olderResults = Array.from({ length: 3 }, (_, i) =>
      makeResult({
        id: `old-${i}`,
        matchedCount: 70,
        unmatchedSourceCount: 30,
        unmatchedTargetCount: 0,
      })
    );
    const newerResults = Array.from({ length: 3 }, (_, i) =>
      makeResult({
        id: `new-${i}`,
        matchedCount: 95,
        unmatchedSourceCount: 5,
        unmatchedTargetCount: 0,
      })
    );
    // findMany returns newest first; newerResults appear at the start
    const prisma: any = {
      reconResult: { findMany: jest.fn().mockResolvedValue([...newerResults, ...olderResults]) },
      reconJob: {
        findMany: jest.fn().mockResolvedValue([{ id: "job-1", name: "Job", tenantId: "tenant-1" }]),
      },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);
    expect(summary.runTimeline.overallTrend).toBe("improving");
  });

  it("builds recurring families with score-based ranking", async () => {
    const adj1 = makeAdjudication({
      id: "m1",
      archetypeId: "arch-1",
      resolution: "matched",
      outcome: "resolved",
      resolutionReason: "timing",
    });
    const adj2 = makeAdjudication({
      id: "m2",
      archetypeId: "arch-1",
      resolution: "manual",
      outcome: "resolved",
      resolutionReason: "timing",
    });
    // arch-2: only 1 occurrence, unresolved
    const adj3 = makeAdjudication({
      id: "m3",
      archetypeId: "arch-2",
      resolution: "ignored",
      outcome: null,
      resolutionReason: "amount_mismatch",
    });

    const arch1 = makeArchetype({
      id: "arch-1",
      code: "TIMING_DRIFT",
      label: "Timing Drift",
      category: "timing",
    });
    const arch2 = makeArchetype({
      id: "arch-2",
      code: "AMOUNT_MISMATCH",
      label: "Amount Mismatch",
      category: "amount",
    });

    const prisma: any = {
      reconResult: { findMany: jest.fn().mockResolvedValue([]) },
      reconJob: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([adj1, adj2, adj3]) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([arch1, arch2]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);

    expect(summary.recurringFamilies.state).toBe("available");
    expect(summary.recurringFamilies.totalAdjudications).toBe(3);
    expect(summary.recurringFamilies.families.length).toBe(2);
    // arch-1 has 2 occurrences, both resolved — should rank first by score
    expect(summary.recurringFamilies.families[0]!.archetypeCode).toBe("TIMING_DRIFT");
    expect(summary.recurringFamilies.families[0]!.totalOccurrences).toBe(2);
    expect(summary.recurringFamilies.families[0]!.resolvedCount).toBe(2);
    expect(summary.recurringFamilies.families[0]!.trend).toBe("weakening");
    expect(summary.recurringFamilies.families[0]!.certainty).toBe("medium");
  });

  it("correctly classifies strengthening trend when unresolved exceeds resolved", async () => {
    const adjudications = [
      makeAdjudication({ id: "m1", resolution: "ignored", outcome: null }),
      makeAdjudication({ id: "m2", resolution: "ignored", outcome: null }),
      makeAdjudication({ id: "m3", resolution: "ignored", outcome: null }),
    ];

    const prisma: any = {
      reconResult: { findMany: jest.fn().mockResolvedValue([]) },
      reconJob: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue(adjudications) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([makeArchetype()]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);
    const family = summary.recurringFamilies.families[0]!;
    expect(family.unresolvedCount).toBeGreaterThan(0);
    expect(family.trend).toBe("strengthening");
    expect(family.certainty).toBe("high");
  });

  it("returns recent decisions in decision memory panel", async () => {
    const adjudications = Array.from({ length: 5 }, (_, i) =>
      makeAdjudication({ id: `mem-${i}`, exceptionId: `exc-${i}` })
    );
    const archetype = makeArchetype();

    const prisma: any = {
      reconResult: { findMany: jest.fn().mockResolvedValue([]) },
      reconJob: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue(adjudications) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([archetype]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);

    expect(summary.decisionMemory.state).toBe("available");
    expect(summary.decisionMemory.totalDecisions).toBe(5);
    expect(summary.decisionMemory.recentDecisions).toHaveLength(5);
    expect(summary.decisionMemory.recentDecisions[0]!.archetypeLabel).toBe("Timing Drift");
    expect(summary.decisionMemory.recentDecisions[0]!.resolution).toBe("matched");
    expect(summary.decisionMemory.recentDecisions[0]!.durationMs).toBe(5000);
  });

  it("handles run query failure gracefully — other panels still render", async () => {
    const prisma: any = {
      reconResult: {
        findMany: jest.fn().mockRejectedValue(new Error("DB connection lost")),
      },
      reconJob: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionAdjudicationMemory: {
        findMany: jest.fn().mockResolvedValue([makeAdjudication()]),
      },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([makeArchetype()]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);

    // Timeline failed — other panels should still work
    expect(summary.runTimeline.state).toBe("unavailable");
    expect(summary.runTimeline.reasonCodes).toContain("run_history_query_failed");
    // Families and memory should still be available
    expect(summary.recurringFamilies.state).toBe("available");
    expect(summary.decisionMemory.state).toBe("available");
    // Overall state: not fully unavailable since two panels have data
    expect(summary.state).toBe("available");
  });

  it("handles adjudication query failure gracefully", async () => {
    const prisma: any = {
      reconResult: {
        findMany: jest
          .fn()
          .mockResolvedValue([makeResult(), makeResult({ id: "r2" }), makeResult({ id: "r3" })]),
      },
      reconJob: {
        findMany: jest.fn().mockResolvedValue([{ id: "job-1", name: "J", tenantId: "tenant-1" }]),
      },
      exceptionAdjudicationMemory: {
        findMany: jest.fn().mockRejectedValue(new Error("Timeout")),
      },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);

    expect(summary.recurringFamilies.state).toBe("unavailable");
    expect(summary.recurringFamilies.reasonCodes).toContain("adjudication_history_query_failed");
    expect(summary.decisionMemory.state).toBe("unavailable");
    // Run rows exist, but without adjudication history cross-run intelligence is thin — not "fully available"
    expect(summary.runTimeline.state).toBe("insufficient_history");
    expect(summary.runTimeline.reasonCodes).toContain(
      "adjudication_history_unavailable_for_intelligence"
    );
  });

  it("returns timestamps as ISO strings, never raw Date objects", async () => {
    const prisma: any = {
      reconResult: {
        findMany: jest
          .fn()
          .mockResolvedValue([makeResult(), makeResult({ id: "r2" }), makeResult({ id: "r3" })]),
      },
      reconJob: {
        findMany: jest.fn().mockResolvedValue([{ id: "job-1", name: "J", tenantId: "tenant-1" }]),
      },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([makeAdjudication()]) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([makeArchetype()]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);

    const entry = summary.runTimeline.runs[0]!;
    expect(typeof entry.startedAt).toBe("string");
    expect(typeof entry.completedAt).toBe("string");
    const decision = summary.decisionMemory.recentDecisions[0]!;
    expect(typeof decision.createdAt).toBe("string");
  });

  it("generatedAt is always an ISO string", async () => {
    const prisma: any = {
      reconResult: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionAdjudicationMemory: { findMany: jest.fn().mockResolvedValue([]) },
      reconJob: { findMany: jest.fn().mockResolvedValue([]) },
      exceptionArchetype: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const summary = await buildCrossRunIntelligenceSummary(prisma, ["tenant-1"]);
    expect(() => new Date(summary.generatedAt)).not.toThrow();
    expect(new Date(summary.generatedAt).toISOString()).toBe(summary.generatedAt);
  });
});
