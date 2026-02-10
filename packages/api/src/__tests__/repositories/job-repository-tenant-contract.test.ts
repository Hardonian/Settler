import { JobRepository } from "../../infrastructure/repositories/JobRepository";
import type { Job as RepositoryJob } from "../../domain/repositories/IJobRepository";

import { queryWithTenant } from "../../db";

jest.mock("../../db", () => ({
  queryWithTenant: jest.fn(),
}));

const queryWithTenantMock = queryWithTenant as jest.MockedFunction<typeof queryWithTenant>;

function assertTenantContract(job: RepositoryJob): void {
  const typedJob: RepositoryJob = job;
  expect(typedJob.tenantId).toBeDefined();
  expect(typedJob.tenantId).toBe("tenant-1");
}

describe("JobRepository tenantId contract", () => {
  beforeEach(() => {
    queryWithTenantMock.mockReset();
  });

  it("returns tenantId on findById/findByUserId/create/updateStatus results", async () => {
    const repository = new JobRepository();

    queryWithTenantMock.mockResolvedValueOnce([
      {
        id: "job-1",
        user_id: "user-1",
        tenant_id: "tenant-1",
        name: "Job One",
        source: JSON.stringify({ adapter: "stripe" }),
        target: JSON.stringify({ adapter: "shopify" }),
        rules: JSON.stringify({ matching: [] }),
        schedule: null,
        status: "active",
        version: 1,
        created_at: new Date("2025-01-01T00:00:00.000Z"),
        updated_at: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]);

    const found = await repository.findById("job-1", "tenant-1", "user-1");
    expect(found).not.toBeNull();
    assertTenantContract(found as RepositoryJob);

    queryWithTenantMock.mockResolvedValueOnce([
      {
        id: "job-1",
        user_id: "user-1",
        tenant_id: "tenant-1",
        name: "Job One",
        source: JSON.stringify({ adapter: "stripe" }),
        target: JSON.stringify({ adapter: "shopify" }),
        rules: JSON.stringify({ matching: [] }),
        schedule: null,
        status: "active",
        version: 1,
        created_at: new Date("2025-01-01T00:00:00.000Z"),
        updated_at: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]);
    queryWithTenantMock.mockResolvedValueOnce([{ count: "1" }]);

    const listResult = await repository.findByUserId("tenant-1", "user-1", 1, 10);
    expect(listResult.jobs).toHaveLength(1);
    assertTenantContract(listResult.jobs[0] as RepositoryJob);

    queryWithTenantMock.mockResolvedValueOnce([
      {
        id: "job-1",
        user_id: "user-1",
        tenant_id: "tenant-1",
        name: "Job One",
        source: JSON.stringify({ adapter: "stripe" }),
        target: JSON.stringify({ adapter: "shopify" }),
        rules: JSON.stringify({ matching: [] }),
        schedule: null,
        status: "active",
        version: 1,
        created_at: new Date("2025-01-01T00:00:00.000Z"),
        updated_at: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]);

    const created = await repository.create("tenant-1", {
      userId: "user-1",
      tenantId: "tenant-1",
      name: "Job One",
      source: { adapter: "stripe" },
      target: { adapter: "shopify" },
      rules: { matching: [] },
      schedule: null,
      status: "active",
      version: 1,
    });
    assertTenantContract(created);

    queryWithTenantMock.mockResolvedValueOnce([
      {
        id: "job-1",
        user_id: "user-1",
        tenant_id: "tenant-1",
        name: "Job One",
        source: JSON.stringify({ adapter: "stripe" }),
        target: JSON.stringify({ adapter: "shopify" }),
        rules: JSON.stringify({ matching: [] }),
        schedule: null,
        status: "paused",
        version: 2,
        created_at: new Date("2025-01-01T00:00:00.000Z"),
        updated_at: new Date("2025-01-02T00:00:00.000Z"),
      },
    ]);

    const updated = await repository.updateStatus("job-1", "tenant-1", "user-1", "paused", 1);
    expect(updated).not.toBeNull();
    assertTenantContract(updated as RepositoryJob);
  });
});
