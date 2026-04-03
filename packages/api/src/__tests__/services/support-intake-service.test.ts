import { submitSupportIntake } from "../../services/support/support-intake-service";

jest.mock("../../db", () => ({
  query: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../services/events/event-bus", () => ({
  eventBus: {
    emitEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {},
}));

jest.mock("@settler/reconciliation-core", () => ({
  resolveOperatorRunDetailForTenants: jest.fn(),
  toRunCompactProofSummary: jest.fn((value: unknown) => value),
  unavailableRunProofpackIndex: jest.fn((reasonCode: string) => ({
    comparison: { reasonCodes: [reasonCode] },
  })),
}));

const { query } = require("../../db");
const { eventBus } = require("../../services/events/event-bus");
const { resolveOperatorRunDetailForTenants } = require("@settler/reconciliation-core");

describe("support-intake-service run intelligence context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("embeds canonical run intelligence in audit/event payload when run_id is provided", async () => {
    resolveOperatorRunDetailForTenants.mockResolvedValue({
      kind: "ok",
      detail: {
        id: "run-1",
        runKind: "recon_job",
        status: "completed",
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
        run_id: "run-1",
      },
    });

    expect(query).toHaveBeenCalledTimes(1);
    const metadata = JSON.parse(query.mock.calls[0][1][4]);
    expect(metadata.run_context).toMatchObject({
      state: "resolved",
      runId: "run-1",
      runKind: "recon_job",
      status: "completed",
    });

    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      "support.issue.created",
      "tenant-1",
      expect.objectContaining({
        runId: "run-1",
        runIntelligence: expect.objectContaining({ state: "resolved", runId: "run-1" }),
      }),
      expect.any(Object)
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

    const metadata = JSON.parse(query.mock.calls[0][1][4]);
    expect(metadata.run_context).toMatchObject({
      state: "unavailable",
      reason: "not_found",
      runId: "missing-run",
    });
  });
});
