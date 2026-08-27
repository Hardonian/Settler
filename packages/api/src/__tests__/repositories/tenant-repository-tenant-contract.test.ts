import { query } from "../../db";
import { TenantRepository } from "../../infrastructure/repositories/TenantRepository";
import { TenantStatus, TenantTier } from "../../domain/entities/Tenant";
import { assertTenantEntityId } from "../utils/tenant-contract-assertions";

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

jest.mock("../../utils/tenant-cache", () => ({
  getTenantCacheKey: jest.fn((kind: string, value: string) => `${kind}:${value}`),
  getCachedTenantProps: jest.fn(async () => undefined),
  setCachedTenantProps: jest.fn(async () => undefined),
}));

jest.mock("../../utils/cache-invalidation", () => ({
  invalidateTenantCache: jest.fn(async () => undefined),
}));

const queryMock = query as jest.MockedFunction<typeof query>;

const tenantRow = {
  id: "tenant-1",
  name: "Tenant One",
  slug: "tenant-one",
  tier: TenantTier.PRO,
  status: TenantStatus.ACTIVE,
  quotas: {
    rateLimitRpm: 1000,
    storageBytes: 1000000,
    concurrentJobs: 5,
    monthlyReconciliations: 1000,
    customDomains: 3,
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
};

describe("TenantRepository tenant contract", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("returns tenant entities with expected tenant id in tenant-scoped lookups", async () => {
    const repository = new TenantRepository();

    queryMock.mockResolvedValueOnce([tenantRow]);
    const byId = await repository.findById("tenant-1");
    expect(byId).not.toBeNull();
    assertTenantEntityId(byId as { id: string }, "tenant-1");

    queryMock.mockResolvedValueOnce([tenantRow]);
    const bySlug = await repository.findBySlug("tenant-one");
    expect(bySlug).not.toBeNull();
    assertTenantEntityId(bySlug as { id: string }, "tenant-1");

    queryMock.mockResolvedValueOnce([tenantRow]);
    const byDomain = await repository.findByCustomDomain("tenant.example.com");
    expect(byDomain).not.toBeNull();
    assertTenantEntityId(byDomain as { id: string }, "tenant-1");

    queryMock.mockResolvedValueOnce([tenantRow]);
    const children = await repository.findSubAccounts("tenant-1");
    expect(children).toHaveLength(1);
    assertTenantEntityId(children[0] as { id: string }, "tenant-1");
  });
});
