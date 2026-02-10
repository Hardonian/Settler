import { JobStatus, type ReconciliationRules } from "../../domain/entities/Job";
import type { DomainEvent } from "../../domain/events/DomainEvent";
import type {
  IJobRepository,
  Job as RepositoryJob,
} from "../../domain/repositories/IJobRepository";
import type { IEventBus } from "../../infrastructure/events/IEventBus";
import { JobService } from "../../application/services/JobService";

jest.mock("../../infrastructure/security/encryption", () => ({
  encrypt: jest.fn(async (value: string) => `enc:${value}`),
}));

const baseJob: RepositoryJob = {
  id: "job-1",
  userId: "user-1",
  tenantId: "tenant-1",
  name: "Test Job",
  source: { adapter: "stripe", configEncrypted: "enc-src" },
  target: { adapter: "shopify", configEncrypted: "enc-tgt" },
  rules: {
    matching: [{ field: "order_id", type: "exact" }],
    conflictResolution: "first-wins",
  },
  schedule: null,
  status: JobStatus.ACTIVE,
  version: 1,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

function createService() {
  const repository: jest.Mocked<IJobRepository> = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };

  const eventBus: jest.Mocked<IEventBus> = {
    publish: jest.fn<Promise<void>, [DomainEvent]>(async () => undefined),
    subscribe: jest.fn<void, [string, (event: DomainEvent) => Promise<void>]>(() => undefined),
  };

  const service = new JobService(repository, eventBus);
  return { service, repository, eventBus };
}

describe("JobService repository invocation order", () => {
  it("calls findById as (jobId, tenantId, userId) for getJob", async () => {
    const { service, repository } = createService();
    repository.findById.mockResolvedValue(baseJob);

    await service.getJob({ jobId: "job-1", tenantId: "tenant-1", userId: "user-1" });

    expect(repository.findById).toHaveBeenCalledWith("job-1", "tenant-1", "user-1");
  });

  it("calls findByUserId as (tenantId, userId, page, limit) for listJobs", async () => {
    const { service, repository } = createService();
    repository.findByUserId.mockResolvedValue({ jobs: [baseJob], total: 1 });

    await service.listJobs({ userId: "user-1", tenantId: "tenant-1", offset: 20, limit: 10 });

    expect(repository.findByUserId).toHaveBeenCalledWith("tenant-1", "user-1", 3, 10);
  });

  it("calls create as (tenantId, payload) and preserves tenantId on payload", async () => {
    const { service, repository, eventBus } = createService();
    repository.create.mockResolvedValue(baseJob);

    const rules: ReconciliationRules = {
      matching: [{ field: "order_id", type: "exact" }],
      conflictResolution: "first-wins",
    };

    await service.createJob({
      userId: "user-1",
      tenantId: "tenant-1",
      name: "New Job",
      sourceAdapter: "stripe",
      sourceConfig: { apiKey: "src" },
      targetAdapter: "shopify",
      targetConfig: { apiKey: "tgt" },
      rules,
    });

    expect(repository.create).toHaveBeenCalledTimes(1);
    const [tenantId, payload] = repository.create.mock.calls[0] ?? [];
    expect(tenantId).toBe("tenant-1");
    expect(payload).toEqual(expect.objectContaining({ tenantId: "tenant-1", userId: "user-1" }));
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it("calls findById/updateStatus/delete with tenantId before userId", async () => {
    const { service, repository } = createService();
    repository.findById.mockResolvedValue(baseJob);
    repository.updateStatus.mockResolvedValue(baseJob);
    repository.delete.mockResolvedValue(true);

    await service.updateJob("job-1", "user-1", "tenant-1", {
      rules: {
        matching: [{ field: "amount", type: "exact" }],
        conflictResolution: "manual-review",
      },
    });

    expect(repository.findById).toHaveBeenCalledWith("job-1", "tenant-1", "user-1");
    expect(repository.updateStatus).toHaveBeenCalledWith(
      "job-1",
      "tenant-1",
      "user-1",
      "active",
      2
    );

    await service.deleteJob("job-1", "user-1", "tenant-1");
    expect(repository.delete).toHaveBeenCalledWith("job-1", "tenant-1", "user-1");
  });
});
