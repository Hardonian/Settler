import { query, assertTenantScoped } from "../../db";
import { buildReconciliationExport } from "../../services/reconciliation/export-contract";
import { appendRunIntegrityEntry } from "../../services/reconciliation/integrity";

jest.mock("../../db", () => {
  const actual = jest.requireActual("../../db");
  return {
    ...actual,
    query: jest.fn(),
  };
});

const queryMock = query as jest.MockedFunction<typeof query>;

describe("RLS simulation attack tests", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("prevents access to another tenant's reconciliation", async () => {
    queryMock.mockResolvedValueOnce([]);

    const result = await buildReconciliationExport(
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222"
    );

    expect(result).toBeNull();
  });

  it("fails hard when export query returns cross-tenant run data", async () => {
    queryMock.mockResolvedValueOnce([
      {
        id: "run-1",
        tenant_id: "99999999-9999-4999-8999-999999999999",
        ingestion_id: null,
        status: "completed",
        source_count: 1,
        target_count: 1,
        matched_count: 1,
        unmatched_source_count: 0,
        unmatched_target_count: 0,
        confidence_avg: 1,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
    ]);

    await expect(
      buildReconciliationExport(
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222"
      )
    ).rejects.toThrow("TENANT ISOLATION VIOLATION");
  });

  it("fails hard on replay attempt across tenant boundary", async () => {
    queryMock.mockResolvedValueOnce([
      {
        id: "run-1",
        tenant_id: "99999999-9999-4999-8999-999999999999",
        ingestion_id: null,
        status: "completed",
        source_count: 1,
        target_count: 1,
        matched_count: 1,
        unmatched_source_count: 0,
        unmatched_target_count: 0,
        confidence_avg: 1,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
    ]);

    await expect(
      appendRunIntegrityEntry(
        "22222222-2222-4222-8222-222222222222",
        "11111111-1111-4111-8111-111111111111"
      )
    ).rejects.toThrow("TENANT ISOLATION VIOLATION");
  });

  it("fails hard on mixed-tenant batch injection query shape", () => {
    expect(() =>
      assertTenantScoped("SELECT * FROM reconciliation_matches WHERE run_id = ANY($1)")
    ).toThrow("TENANT ISOLATION VIOLATION");
  });
});
