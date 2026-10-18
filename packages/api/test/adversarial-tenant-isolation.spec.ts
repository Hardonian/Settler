import { prisma } from "../src/infrastructure/db/prisma";
import { ExceptionQueryService } from "../src/services/exceptions/exception-query-service";
import { ProofPackageOrchestrator } from "../src/services/intelligence/proof-package-orchestrator";

jest.mock("../src/infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

type FixtureException = {
  id: string;
  tenantId: string;
  sourceTransactionId: string;
  matchType: "unmatched";
  status: string;
  metadata: Record<string, unknown>;
  assignedTo: null;
  runId: string;
  sourceTransaction: { externalId: string };
};

describe("adversarial tenant isolation", () => {
  const tenantAlpha = "00000000-0000-4000-8000-0000000000a1";
  const tenantBeta = "00000000-0000-4000-8000-0000000000b2";
  const sharedProviderTransactionId = "processor_tx_identical_4242";

  const exceptions: FixtureException[] = [
    {
      id: "10000000-0000-4000-8000-0000000000a1",
      tenantId: tenantAlpha,
      sourceTransactionId: "20000000-0000-4000-8000-0000000000a1",
      matchType: "unmatched",
      status: "open",
      metadata: {},
      assignedTo: null,
      runId: "30000000-0000-4000-8000-0000000000a1",
      sourceTransaction: { externalId: sharedProviderTransactionId },
    },
    {
      id: "10000000-0000-4000-8000-0000000000b2",
      tenantId: tenantBeta,
      sourceTransactionId: "20000000-0000-4000-8000-0000000000b2",
      matchType: "unmatched",
      status: "open",
      metadata: {},
      assignedTo: null,
      runId: "30000000-0000-4000-8000-0000000000b2",
      sourceTransaction: { externalId: sharedProviderTransactionId },
    },
  ];

  const reconciliationMatch = prisma.reconciliationMatch as unknown as {
    findFirst: jest.Mock;
    updateMany: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    reconciliationMatch.findFirst.mockImplementation(
      async ({ where }: { where: { id: string; tenantId: string } }) =>
        exceptions.find(
          (exception) => exception.id === where.id && exception.tenantId === where.tenantId
        ) ?? null
    );
    reconciliationMatch.updateMany.mockImplementation(
      async ({
        where,
        data,
      }: {
        where: { id: string; tenantId: string };
        data: { status: string };
      }) => {
        const exception = exceptions.find(
          (candidate) => candidate.id === where.id && candidate.tenantId === where.tenantId
        );
        if (!exception) return { count: 0 };
        exception.status = data.status;
        return { count: 1 };
      }
    );
  });

  it("does not read the other tenant's exception when provider transaction IDs collide", async () => {
    const service = new ExceptionQueryService();

    await expect(service.getExceptionById(exceptions[0]!.id, tenantBeta)).rejects.toMatchObject({
      name: "NotFoundError",
    });

    const betaException = await service.getExceptionById(exceptions[1]!.id, tenantBeta);
    expect(betaException.sourceTransaction.externalId).toBe(sharedProviderTransactionId);
    expect(betaException.tenantId).toBe(tenantBeta);
  });

  it("does not adjudicate the other tenant's exception", async () => {
    const service = new ExceptionQueryService();
    const updated = await service.updateExceptionStatus(
      exceptions[0]!.id,
      tenantBeta,
      "resolved",
      "user_beta",
      "cross-tenant attempt",
      undefined,
      {}
    );

    expect(updated).toBe(0);
    expect(exceptions[0]!.status).toBe("open");
    expect(reconciliationMatch.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: exceptions[0]!.id, tenantId: tenantBeta }),
      })
    );
  });

  it("does not validate or expose another tenant's proofpack branch", async () => {
    const alphaProofId = "40000000-0000-4000-8000-0000000000a1";
    const proofPackage = {
      findFirst: jest.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
        where.id === alphaProofId && where.tenantId === tenantAlpha
          ? {
              id: alphaProofId,
              tenantId: tenantAlpha,
              summary: { smtProofBranches: ["alpha-only-branch"] },
              evidenceIds: [],
              narrative: "alpha proof",
              packageHash: "not-relevant-to-denied-lookup",
            }
          : null
      ),
    };
    const service = new ProofPackageOrchestrator({ proofPackage } as never);

    await expect(service.validateProofPackage(alphaProofId, tenantBeta)).resolves.toBe(false);
    expect(proofPackage.findFirst).toHaveBeenCalledWith({
      where: { id: alphaProofId, tenantId: tenantBeta },
    });
  });
});
