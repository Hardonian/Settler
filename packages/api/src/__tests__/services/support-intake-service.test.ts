import { submitSupportIntake } from "../../services/support/support-intake-service";

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "audit-1" }),
    },
    $executeRaw: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../services/events/event-bus", () => ({
  eventBus: {
    emitEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@settler/reconciliation-core", () => ({
  buildSupportIntakeRunContext: jest.fn(),
  buildSupportIntakeExceptionContext: jest.fn(),
}));

const { prisma } = require("../../infrastructure/db/prisma");
const { eventBus } = require("../../services/events/event-bus");
const {
  buildSupportIntakeRunContext,
  buildSupportIntakeExceptionContext,
} = require("@settler/reconciliation-core");

describe("support-intake-service run intelligence context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("embeds canonical run intelligence in audit/event payload when run_id is provided", async () => {
    const runUuid = "11111111-1111-4111-8111-111111111111";

    buildSupportIntakeRunContext.mockResolvedValue({
      state: "ok",
      runId: runUuid,
      runKind: "recon_job",
      status: "completed",
      compactProofSummary: {
        operatorSummary: { signal: "strong" },
      },
    });
    buildSupportIntakeExceptionContext.mockResolvedValue({
      state: "ok",
      exceptionId: "22222222-2222-4222-8222-222222222222",
      runId: runUuid,
      type: "amount_mismatch",
      matchType: "unmatched",
      status: "resolved",
      canonicalStatus: "resolved",
      severity: "high",
      familySummary: {
        state: "available",
        familyCode: "AMOUNT_MISMATCH",
        familyLabel: "Amount Mismatch",
        familyCategory: "amount",
        totalCases: 3,
        totalAdjudications: 2,
        supportingCaseCount: 2,
        resolvedCaseCount: 2,
        unresolvedCaseCount: 1,
        reopenedCaseCount: 0,
        reopenRate: 0,
        recurrencePosture: "stable",
        dominantResolutionCode: "MANUAL_REVIEW_CONFIRMED",
        dominantResolutionReason: "manual review confirmed",
        dominantResolutionShare: 1,
        firstSeenAt: "2026-01-01T00:00:00.000Z",
        lastSeenAt: "2026-01-02T00:00:00.000Z",
        avgConfidence: 0.91,
        avgSourceTrustScore: 0.89,
        reasonCodes: [],
        summary: "Amount Mismatch has appeared in 3 cases with 2 prior supporting cases.",
        nextStep: "Review the dominant resolution against the current evidence.",
      },
      operatorSummary: {
        familyLabel: "Amount Mismatch",
        familyState: "available",
        supportingCaseCount: 2,
        recurrencePosture: "stable",
        recurringResolutionReason: "manual review confirmed",
        nextStep: "Review the dominant resolution against the current evidence.",
      },
    });

    await submitSupportIntake({
      userId: "user-1",
      tenantId: "tenant-1",
      path: "/api/v1/support/intake",
      body: {
        category: "run_failure",
        description: "This is a long enough support description for validation.",
        run_id: runUuid,
        exception_id: "22222222-2222-4222-8222-222222222222",
      },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    const changes = prisma.auditLog.create.mock.calls[0][0].data.changes as Record<string, unknown>;
    expect(changes.run_context).toMatchObject({
      state: "ok",
      runId: runUuid,
      runKind: "recon_job",
      status: "completed",
      compactProofSummary: {
        operatorSummary: { signal: "strong" },
      },
    });
    expect(changes.exception_context).toMatchObject({
      state: "ok",
      exceptionId: "22222222-2222-4222-8222-222222222222",
      familySummary: expect.objectContaining({
        familyCode: "AMOUNT_MISMATCH",
        familyLabel: "Amount Mismatch",
      }),
    });

    expect(prisma.$executeRaw).toHaveBeenCalled();

    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      "support.issue.created",
      "tenant-1",
      expect.objectContaining({
        runId: runUuid,
        exceptionId: "22222222-2222-4222-8222-222222222222",
        runIntelligence: expect.objectContaining({ state: "ok", runId: runUuid }),
        exceptionIntelligence: expect.objectContaining({
          state: "ok",
          exceptionId: "22222222-2222-4222-8222-222222222222",
        }),
      }),
      expect.any(Object)
    );
  });

  it("records explicit unavailable semantics when run lookup fails", async () => {
    buildSupportIntakeRunContext.mockResolvedValue({
      state: "unavailable",
      reason: "not_found",
      runId: "missing-run",
    });
    buildSupportIntakeExceptionContext.mockResolvedValue({
      state: "unavailable",
      reason: "not_found",
      exceptionId: "33333333-3333-4333-8333-333333333333",
      runId: null,
      type: null,
      matchType: null,
      status: null,
      canonicalStatus: null,
      severity: null,
      familySummary: null,
      operatorSummary: null,
    });

    await submitSupportIntake({
      userId: "user-1",
      tenantId: "tenant-1",
      path: "/api/v1/support/intake",
      body: {
        category: "run_failure",
        description: "This is a long enough support description for validation.",
        run_id: "missing-run",
        exception_id: "33333333-3333-4333-8333-333333333333",
      },
    });

    const changes = prisma.auditLog.create.mock.calls[0][0].data.changes as Record<string, unknown>;
    expect(changes.run_context).toMatchObject({
      state: "unavailable",
      reason: "not_found",
      runId: "missing-run",
    });
    expect(changes.exception_context).toMatchObject({
      state: "unavailable",
      reason: "not_found",
      exceptionId: "33333333-3333-4333-8333-333333333333",
    });
  });
});
