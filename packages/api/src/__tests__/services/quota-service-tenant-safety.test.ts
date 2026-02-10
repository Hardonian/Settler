import { query } from "../../db";
import { QuotaService, QuotaType } from "../../application/services/QuotaService";
import type { ITenantRepository } from "../../domain/repositories/ITenantRepository";
import { Tenant, TenantStatus, TenantTier } from "../../domain/entities/Tenant";
import { assertTenantFirstSqlParam } from "../utils/tenant-contract-assertions";

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

const queryMock = query as jest.MockedFunction<typeof query>;

function makeTenant(): Tenant {
  return Tenant.fromPersistence({
    id: "tenant-1",
    name: "Tenant One",
    slug: "tenant-one",
    tier: TenantTier.GROWTH,
    status: TenantStatus.ACTIVE,
    quotas: {
      rateLimitRpm: 1000,
      storageBytes: 100000,
      concurrentJobs: 5,
      monthlyReconciliations: 100,
      customDomains: 2,
    },
    config: {
      customDomainVerified: false,
      dataResidencyRegion: "us",
      enableAdvancedMatching: true,
      enableMLFeatures: false,
      webhookTimeout: 5000,
      maxRetries: 3,
    },
    metadata: {},
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  });
}

describe("QuotaService tenant safety", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("passes tenantId as first SQL param in quota reads and increments", async () => {
    const tenantRepo: ITenantRepository = {
      findById: jest.fn(async () => makeTenant()),
      findBySlug: jest.fn(async () => null),
      findByCustomDomain: jest.fn(async () => null),
      findSubAccounts: jest.fn(async () => []),
      findParentTenant: jest.fn(async () => null),
      findAll: jest.fn(async () => []),
      save: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
    };

    queryMock.mockResolvedValueOnce([{ current_storage_bytes: 10 }]);
    queryMock.mockResolvedValueOnce([]);

    const service = new QuotaService(tenantRepo);

    await service.checkQuota("tenant-1", QuotaType.STORAGE, 1);
    await service.incrementUsage("tenant-1", QuotaType.STORAGE, 5);

    const checkQuotaParams = queryMock.mock.calls[0]?.[1] as unknown[];
    assertTenantFirstSqlParam(checkQuotaParams, "tenant-1");

    const incrementParams = queryMock.mock.calls[1]?.[1] as unknown[];
    assertTenantFirstSqlParam(incrementParams, "tenant-1");
  });
});
