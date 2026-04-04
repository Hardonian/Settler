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
}));

const { prisma } = require("../../infrastructure/db/prisma");
const { eventBus } = require("../../services/events/event-bus");
const { buildSupportIntakeRunContext } = require("@settler/reconciliation-core");

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

    expect(prisma.$executeRaw).toHaveBeenCalled();

    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      "support.issue.created",
      "tenant-1",
      expect.objectContaining({
        runId: runUuid,
        runIntelligence: expect.objectContaining({ state: "ok", runId: runUuid }),
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

    const changes = prisma.auditLog.create.mock.calls[0][0].data.changes as Record<string, unknown>;
    expect(changes.run_context).toMatchObject({
      state: "unavailable",
      reason: "not_found",
      runId: "missing-run",
    });
  });
});
