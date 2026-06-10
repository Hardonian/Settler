import { runReconciliation } from "../../services/ingestion/reconciliation-matcher";

const queryMock = jest.fn();
const transactionMock = jest.fn();

jest.mock("../../db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
  queryWithTenant: (tenantId: string, ...args: unknown[]) => queryMock(...args),
  transaction: (fn: (client: { query: typeof queryMock }) => Promise<void>) => transactionMock(fn),
  transactionWithTenant: (
    tenantId: string,
    fn: (client: { query: typeof queryMock }) => Promise<void>
  ) => transactionMock(fn),
}));

jest.mock("../../utils/logger", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
}));

jest.mock("../../services/matching-rules-loader", () => ({
  getMatchingRulesForJob: jest.fn().mockResolvedValue({
    amountTolerance: 0.02,
    dateToleranceDays: 5,
    matchingRules: [],
    configVersion: "test-v1",
    configSource: "default" as const,
    tenantId: "tenant-1",
    jobId: "job-1",
  }),
}));

jest.mock("../../services/matching/ml-matching-engine", () => ({
  mlMatchingEngine: { predictMatch: jest.fn().mockResolvedValue(null) },
}));

jest.mock("../../services/matching/enhanced-cross-customer-intelligence", () => ({
  enhancedCrossCustomerIntelligence: { recordPattern: jest.fn() },
}));

jest.mock("../../services/reconciliation/integrity", () => ({
  appendRunIntegrityEntry: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../services/ops-intelligence/runtime-events", () => ({
  emitOperatorRuntimeEvent: jest.fn().mockResolvedValue(undefined),
}));

describe("runReconciliation ingestion guard", () => {
  const tenantId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const userId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const ingestionId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

  beforeEach(() => {
    jest.clearAllMocks();
    queryMock.mockReset();
    transactionMock.mockReset();
    transactionMock.mockImplementation(async (fn) => {
      const client = { query: queryMock };
      await fn(client as never);
    });
  });

  test("rejects invalid ingestion UUID before creating a run row", async () => {
    await expect(
      runReconciliation("not-a-uuid", tenantId, userId, undefined, undefined, {})
    ).rejects.toMatchObject({ errorCode: "VALIDATION_ERROR" });

    expect(queryMock).not.toHaveBeenCalled();
  });

  test("rejects missing ingestion with NOT_FOUND", async () => {
    queryMock.mockResolvedValueOnce([]);

    await expect(
      runReconciliation(ingestionId, tenantId, userId, undefined, undefined, {})
    ).rejects.toMatchObject({ errorCode: "NOT_FOUND" });

    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  test("rejects non-completed ingestion", async () => {
    queryMock.mockResolvedValueOnce([{ id: ingestionId, status: "processing" }]);

    await expect(
      runReconciliation(ingestionId, tenantId, userId, undefined, undefined, {})
    ).rejects.toMatchObject({ errorCode: "VALIDATION_ERROR" });

    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
