/**
 * Tenant Service
 * Business logic for tenant management and onboarding
 */

import { Tenant, TenantTier, TenantStatus, TenantQuotas, TenantProps } from '../../domain/entities/Tenant';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole, UserProps } from '../../domain/entities/User';
import { query } from '../../db';
import { logInfo } from '../../utils/logger';

export class TenantService {
  constructor(
    private tenantRepo: ITenantRepository,
    private userRepo: IUserRepository
  ) {}

  /**
   * Create a new tenant with default owner user
   */
  async createTenant(data: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerPasswordHash: string;
    ownerName?: string;
    tier?: TenantTier;
    parentTenantId?: string;
  }): Promise<{ tenant: Tenant; owner: User }> {
    const tier = data.tier || TenantTier.FREE;
    const quotas = this.getDefaultQuotas(tier);

    const tenantProps: Omit<TenantProps, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      slug: data.slug,
      tier,
      status: TenantStatus.TRIAL,
      quotas,
      config: {
        customDomainVerified: false,
        dataResidencyRegion: 'us',
        enableAdvancedMatching: false,
        enableMLFeatures: false,
        webhookTimeout: 30000,
        maxRetries: 3,
      },
      metadata: {},
    };
    if (data.parentTenantId !== undefined) {
      tenantProps.parentTenantId = data.parentTenantId;
    }
    const tenant = Tenant.create(tenantProps);

    await this.tenantRepo.save(tenant);

    // Create tenant schema if using schema-per-tenant
    const { config } = require('../../config');
    if (config.features.enableSchemaPerTenant) {
      await query(`SELECT create_tenant_schema($1)`, [data.slug]);
    }

    // Create owner user
    const userProps: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId: tenant.id,
      email: data.ownerEmail,
      passwordHash: data.ownerPasswordHash,
      role: UserRole.OWNER,
      dataResidencyRegion: 'us',
      dataRetentionDays: 365,
    };
    if (data.ownerName !== undefined) {
      userProps.name = data.ownerName;
    }
    const owner = User.create(userProps);

    await this.userRepo.save(owner);

    // Initialize quota usage tracking
    await query(
      `INSERT INTO tenant_quota_usage (tenant_id, last_reset_at)
       VALUES ($1, NOW())
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.id]
    );

    logInfo('Tenant created', { tenantId: tenant.id, slug: data.slug });

    return { tenant, owner };
  }

  /**
   * Get default quotas based on tier
   */
  private getDefaultQuotas(tier: TenantTier): TenantQuotas {
    const quotas: Record<TenantTier, TenantQuotas> = {
      [TenantTier.FREE]: {
        rateLimitRpm: 100,
        storageBytes: 100 * 1024 * 1024, // 100 MB
        concurrentJobs: 1,
        monthlyReconciliations: 1000,
        customDomains: 0,
      },
      [TenantTier.STARTER]: {
        rateLimitRpm: 500,
        storageBytes: 1024 * 1024 * 1024, // 1 GB
        concurrentJobs: 5,
        monthlyReconciliations: 10000,
        customDomains: 0,
      },
      [TenantTier.GROWTH]: {
        rateLimitRpm: 2000,
        storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
        concurrentJobs: 20,
        monthlyReconciliations: 100000,
        customDomains: 1,
      },
      [TenantTier.SCALE]: {
        rateLimitRpm: 10000,
        storageBytes: 100 * 1024 * 1024 * 1024, // 100 GB
        concurrentJobs: 100,
        monthlyReconciliations: 1000000,
        customDomains: 5,
      },
      [TenantTier.ENTERPRISE]: {
        rateLimitRpm: 100000,
        storageBytes: 1024 * 1024 * 1024 * 1024, // 1 TB
        concurrentJobs: 1000,
        monthlyReconciliations: 10000000,
        customDomains: -1, // Unlimited
      },
    };

    return quotas[tier];
  }

  /**
   * Upgrade tenant tier
   */
  async upgradeTier(tenantId: string, newTier: TenantTier): Promise<Tenant> {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const newQuotas = this.getDefaultQuotas(newTier);
    tenant.updateTier(newTier);
    tenant.updateQuotas(newQuotas);

    await this.tenantRepo.save(tenant);
    logInfo('Tenant tier upgraded', { tenantId, newTier });

    return tenant;
  }

  /**
   * Verify custom domain
   */
  async verifyCustomDomain(tenantId: string, domain: string): Promise<void> {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // In production, this would verify DNS records
    // For now, we'll just mark it as verified
    tenant.setCustomDomain(domain, true);
    await this.tenantRepo.save(tenant);

    logInfo('Custom domain verified', { tenantId, domain });
  }

  /**
   * Create sub-account (child tenant)
   */
  async createSubAccount(
    parentTenantId: string,
    data: {
      name: string;
      slug: string;
      ownerEmail: string;
      ownerPasswordHash: string;
      ownerName?: string;
    }
  ): Promise<{ tenant: Tenant; owner: User }> {
    const parentTenant = await this.tenantRepo.findById(parentTenantId);
    if (!parentTenant) {
      throw new Error('Parent tenant not found');
    }

    if (!parentTenant.isEnterprise()) {
      throw new Error('Only enterprise tenants can create sub-accounts');
    }

    return this.createTenant({
      ...data,
      parentTenantId,
      tier: TenantTier.ENTERPRISE, // Sub-accounts inherit enterprise tier
    });
  }
}
