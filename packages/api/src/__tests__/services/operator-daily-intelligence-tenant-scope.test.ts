import {
  getBillingAnomalies,
  getErrorRateSummary,
  getFailedIngestions,
  getSlowEndpoints,
} from "../../services/operator-mode/daily-intelligence";
import { query } from "../../db";

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

describe("daily intelligence tenant scoping", () => {
  const queryMock = query as jest.MockedFunction<typeof query>;

  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue([] as never);
  });

  it("adds tenant predicate for error rate, slow endpoints, and failed ingestions", async () => {
    const tenantId = "11111111-1111-4111-8111-111111111111";

    await getErrorRateSummary(new Date("2026-03-01T00:00:00.000Z"), tenantId);
    await getSlowEndpoints(new Date("2026-03-01T00:00:00.000Z"), tenantId);
    await getFailedIngestions(new Date("2026-03-01T00:00:00.000Z"), tenantId);

    const [errorCall, slowCall, failedCall] = queryMock.mock.calls;

    expect(errorCall?.[0]).toContain("AND tenant_id = $3");
    expect(errorCall?.[1]).toEqual(expect.arrayContaining([tenantId]));

    expect(slowCall?.[0]).toContain("AND tenant_id = $3");
    expect(slowCall?.[1]).toEqual(expect.arrayContaining([tenantId]));

    expect(failedCall?.[0]).toContain("AND tenant_id = $3");
    expect(failedCall?.[1]).toEqual(expect.arrayContaining([tenantId]));
  });

  it("keeps billing anomaly aggregation tenant-partitioned", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";

    await getBillingAnomalies(new Date("2026-03-01T00:00:00.000Z"), tenantId);

    const [todayUsageCall, historicalCall] = queryMock.mock.calls;
    expect(todayUsageCall?.[0]).toContain("AND tenant_id = $2");
    expect(todayUsageCall?.[1]).toEqual(expect.arrayContaining([tenantId]));

    expect(historicalCall?.[0]).toContain("AND tenant_id = $3");
    expect(historicalCall?.[1]).toEqual(expect.arrayContaining([tenantId]));
  });
});
