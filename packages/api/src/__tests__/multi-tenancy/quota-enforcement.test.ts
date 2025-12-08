/**
 * Quota Enforcement Tests
 * Ensures quotas are properly enforced
 */

import { QuotaService } from '../../application/services/QuotaService';
import { TenantRepository } from '../../infrastructure/repositories/TenantRepository';
import { TenantService } from '../../application/services/TenantService';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { TenantTier } from '../../domain/entities/Tenant';
import { QuotaType, QuotaExceededError } from '../../application/services/QuotaService';
import { hashPassword } from '../../infrastructure/security/password';

describe('Quota Enforcement', () => {
  let tenantService: TenantService;
  let quotaService: QuotaService;
  let tenant: any;
  let user: any;

  beforeAll(async () => {
    const tenantRepo = new TenantRepository();
    const userRepo = new UserRepository();
    tenantService = new TenantService(tenantRepo, userRepo);
    quotaService = new QuotaService(tenantRepo);

    // Create a test tenant
    const result = await tenantService.createTenant({
      name: 'Quota Test Tenant',
      slug: 'quota-test',
      ownerEmail: 'quota@test.com',
      ownerPasswordHash: await hashPassword('password123'),
      tier: TenantTier.STARTER, // Starter tier has limited quotas
    });

    tenant = result.tenant;
    user = result.owner;
  });

  describe('Storage Quota', () => {
    it('should allow storage usage within quota', async () => {
      const { allowed } = await quotaService.checkQuota(
        tenant.id,
        QuotaType.STORAGE,
        100 * 1024 * 1024 // 100 MB
      );

      expect(allowed).toBe(true);
    });

    it('should reject storage usage exceeding quota', async () => {
      // Try to use more than the quota (Starter tier has 1 GB = 1073741824 bytes)
      const { allowed } = await quotaService.checkQuota(
        tenant.id,
        QuotaType.STORAGE,
        2 * 1024 * 1024 * 1024 // 2 GB
      );

      expect(allowed).toBe(false);
    });

    it('should throw QuotaExceededError when enforcing exceeded quota', async () => {
      await expect(
        quotaService.enforceQuota(
          tenant.id,
          QuotaType.STORAGE,
          2 * 1024 * 1024 * 1024 // 2 GB
        )
      ).rejects.toThrow(QuotaExceededError);
    });
  });

  describe('Concurrent Jobs Quota', () => {
    it('should allow jobs within concurrent limit', async () => {
      const { allowed } = await quotaService.checkQuota(
        tenant.id,
        QuotaType.CONCURRENT_JOBS,
        3 // Starter tier allows 5 concurrent jobs
      );

      expect(allowed).toBe(true);
    });

    it('should reject jobs exceeding concurrent limit', async () => {
      const { allowed } = await quotaService.checkQuota(
        tenant.id,
        QuotaType.CONCURRENT_JOBS,
        10 // More than the 5 allowed
      );

      expect(allowed).toBe(false);
    });
  });

  describe('Monthly Reconciliations Quota', () => {
    it('should track monthly reconciliation usage', async () => {
      // Increment usage
      await quotaService.incrementUsage(
        tenant.id,
        QuotaType.MONTHLY_RECONCILIATIONS,
        100
      );

      const usage = await quotaService.getUsage(tenant.id);
      expect(usage[QuotaType.MONTHLY_RECONCILIATIONS].current).toBeGreaterThanOrEqual(100);
    });

    it('should reject reconciliations exceeding monthly limit', async () => {
      // Starter tier has 10,000 monthly reconciliations
      // Try to use more
      const { allowed } = await quotaService.checkQuota(
        tenant.id,
        QuotaType.MONTHLY_RECONCILIATIONS,
        15000
      );

      expect(allowed).toBe(false);
    });
  });

  describe('Enterprise Bypass', () => {
    it('should bypass quotas for enterprise tenants', async () => {
      // Upgrade to enterprise
      await tenantService.upgradeTier(tenant.id, TenantTier.ENTERPRISE);

      const { allowed } = await quotaService.checkQuota(
        tenant.id,
        QuotaType.STORAGE,
        100 * 1024 * 1024 * 1024 * 1024 // 100 TB - way over any normal limit
      );

      expect(allowed).toBe(true);
    });
  });
});
