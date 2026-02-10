import { query } from "../../db";
import { createAuditExport, getAuditExport, getAuditLogs } from "../../services/audit-trail";
import { assertTenantFirstSqlParam } from "../utils/tenant-contract-assertions";

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

const queryMock = query as jest.MockedFunction<typeof query>;

describe("audit-trail tenant safety", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("uses tenantId as first SQL parameter for read/export operations", async () => {
    queryMock
      .mockResolvedValueOnce([
        {
          id: 1,
          at: new Date("2025-01-01T00:00:00.000Z"),
          actor: "user-1",
          action: "view",
          schema_name: "public",
          table_name: "jobs",
          row_pk: "job-1",
          details: {},
          ip_address: "127.0.0.1",
          user_agent: "jest",
          compliance_tags: ["pci"],
        },
      ])
      .mockResolvedValueOnce([{ id: "export-1" }])
      .mockResolvedValueOnce([
        {
          id: "export-1",
          export_format: "csv",
          filters: {},
          file_path: null,
          expires_at: null,
          created_at: new Date("2025-01-01T00:00:00.000Z"),
        },
      ]);

    await getAuditLogs("tenant-1", { action: "view" }, { limit: 10, offset: 0 });
    await createAuditExport("tenant-1", "user-1", {}, "csv", 7);
    await getAuditExport("tenant-1", "export-1");

    const getLogsParams = queryMock.mock.calls[0]?.[1] as unknown[];
    assertTenantFirstSqlParam(getLogsParams, "tenant-1");

    const createExportParams = queryMock.mock.calls[1]?.[1] as unknown[];
    assertTenantFirstSqlParam(createExportParams, "tenant-1");

    const getExportParams = queryMock.mock.calls[2]?.[1] as unknown[];
    expect(getExportParams[0]).toBe("export-1");
    expect(getExportParams[1]).toBe("tenant-1");
  });
});
