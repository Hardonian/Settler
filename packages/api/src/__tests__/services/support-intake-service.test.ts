import { submitSupportIntake } from "../../services/support/support-intake-service";

jest.mock("../../services/events/event-bus", () => ({
  eventBus: {
    emitEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../services/ops-intelligence/runtime-events", () => ({
  emitOperatorRuntimeEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock("@settler/reconciliation-core", () => ({
  resolveOperatorRunDetailForTenants: jest.fn(),
  resolveRunCompactProofSummary: jest.fn((input: { compactProofSummary?: unknown }) => ({
    compactProofSummary: input.compactProofSummary ?? { operatorSummary: { signal: "unknown" } },
    fallbackReasonCode: null,
  })),
  toRunCompactProofSummary: jest.fn((value: unknown) => value),
  unavailableRunProofpackIndex: jest.fn((reasonCode: string) => ({
    comparison: { reasonCodes: [reasonCode] },
  })),
}));

const { prisma } = require("../../infrastructure/db/prisma");
const { eventBus } = require("../../services/events/event-bus");
const { emitOperatorRuntimeEvent } = require("../../services/ops-intelligence/runtime-events");
const { resolveOperatorRunDetailForTenants } = require("@settler/reconciliation-core");

const auditLogCreate = prisma.auditLog.create as jest.Mock;

describe("support-intake-service run intelligence context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("embeds canonical run intelligence in audit/event payload when run_id is provided", async () => {
    const runUuid = "11111111-1111-4111-8111-111111111111";

    resolveOperatorRunDetailForTenants.mockResolvedValue({
      kind: "ok",
      detail: {
        id: runUuid,
        runKind: "recon_job",
        status: "completed",
        compactProofSummary: { operatorSummary: { signal: "strong" } },
        proofpackIndex: {
          comparison: { reasonCodes: ["history_window_evaluated"] },
        },
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
      },
    });

    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const metadata = auditLogCreate.mock.calls[0][0].data.metadata as Record<string, unknown>;
    expect(metadata.run_context).toMatchObject({
      state: "ok",
      runId: runUuid,
      runKind: "recon_job",
      status: "completed",
      compactProofSummary: {
        operatorSummary: { signal: "strong" },
      },
    });

    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      "support.issue.created",
      "tenant-1",
      expect.objectContaining({
        runId: runUuid,
        runIntelligence: expect.objectContaining({ state: "ok", runId: runUuid }),
      }),
      expect.any(Object)
    );

    expect(emitOperatorRuntimeEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "support_intake_submitted",
        tenantId: "tenant-1",
        runId: runUuid,
        metadata: expect.objectContaining({ submission_id: expect.any(String) }),
      })
    );
  });

  it("records explicit unavailable semantics when run lookup fails", async () => {
    resolveOperatorRunDetailForTenants.mockResolvedValue({
      kind: "not_found",
    });

    await submitSupportIntake({
      userId: "user-1",
      tenantId: "tenant-1",
      path: "/api/v1/support/intake",
      body: {
        category: "run_failure",
        description: "This is a long enough support description for validation.",
        run_id: "missing-run",
      },
    });

    const metadata = auditLogCreate.mock.calls[0][0].data.metadata as Record<string, unknown>;
    expect(metadata.run_context).toMatchObject({
      state: "unavailable",
      reason: "not_found",
      runId: "missing-run",
    });
  });
});
