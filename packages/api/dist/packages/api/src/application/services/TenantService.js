"use strict";
/**
 * Tenant Service
 * Business logic for tenant management and onboarding
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const Tenant_1 = require("../../domain/entities/Tenant");
const User_1 = require("../../domain/entities/User");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
class TenantService {
    tenantRepo;
    userRepo;
    constructor(tenantRepo, userRepo) {
        this.tenantRepo = tenantRepo;
        this.userRepo = userRepo;
    }
    /**
     * Create a new tenant with default owner user
     */
    async createTenant(data) {
        const tier = data.tier || Tenant_1.TenantTier.FREE;
        const quotas = this.getDefaultQuotas(tier);
        const tenantProps = {
            name: data.name,
            slug: data.slug,
            tier,
            status: Tenant_1.TenantStatus.TRIAL,
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
        const tenant = Tenant_1.Tenant.create(tenantProps);
        await this.tenantRepo.save(tenant);
        // Create tenant schema if using schema-per-tenant
        const { config } = require('../../config');
        if (config.features.enableSchemaPerTenant) {
            await (0, db_1.query)(`SELECT create_tenant_schema($1)`, [data.slug]);
        }
        // Create owner user
        const userProps = {
            tenantId: tenant.id,
            email: data.ownerEmail,
            passwordHash: data.ownerPasswordHash,
            role: User_1.UserRole.OWNER,
            dataResidencyRegion: 'us',
            dataRetentionDays: 365,
        };
        if (data.ownerName !== undefined) {
            userProps.name = data.ownerName;
        }
        const owner = User_1.User.create(userProps);
        await this.userRepo.save(owner);
        // Initialize quota usage tracking
        await (0, db_1.query)(`INSERT INTO tenant_quota_usage (tenant_id, last_reset_at)
       VALUES ($1, NOW())
       ON CONFLICT (tenant_id) DO NOTHING`, [tenant.id]);
        (0, logger_1.logInfo)('Tenant created', { tenantId: tenant.id, slug: data.slug });
        return { tenant, owner };
    }
    /**
     * Get default quotas based on tier
     */
    getDefaultQuotas(tier) {
        const quotas = {
            [Tenant_1.TenantTier.FREE]: {
                rateLimitRpm: 100,
                storageBytes: 100 * 1024 * 1024, // 100 MB
                concurrentJobs: 1,
                monthlyReconciliations: 1000,
                customDomains: 0,
            },
            [Tenant_1.TenantTier.STARTER]: {
                rateLimitRpm: 500,
                storageBytes: 1024 * 1024 * 1024, // 1 GB
                concurrentJobs: 5,
                monthlyReconciliations: 10000,
                customDomains: 0,
            },
            [Tenant_1.TenantTier.GROWTH]: {
                rateLimitRpm: 2000,
                storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
                concurrentJobs: 20,
                monthlyReconciliations: 100000,
                customDomains: 1,
            },
            [Tenant_1.TenantTier.SCALE]: {
                rateLimitRpm: 10000,
                storageBytes: 100 * 1024 * 1024 * 1024, // 100 GB
                concurrentJobs: 100,
                monthlyReconciliations: 1000000,
                customDomains: 5,
            },
            [Tenant_1.TenantTier.ENTERPRISE]: {
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
    async upgradeTier(tenantId, newTier) {
        const tenant = await this.tenantRepo.findById(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        const newQuotas = this.getDefaultQuotas(newTier);
        tenant.updateTier(newTier);
        tenant.updateQuotas(newQuotas);
        await this.tenantRepo.save(tenant);
        (0, logger_1.logInfo)('Tenant tier upgraded', { tenantId, newTier });
        return tenant;
    }
    /**
     * Verify custom domain
     */
    async verifyCustomDomain(tenantId, domain) {
        const tenant = await this.tenantRepo.findById(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        // In production, this would verify DNS records
        // For now, we'll just mark it as verified
        tenant.setCustomDomain(domain, true);
        await this.tenantRepo.save(tenant);
        (0, logger_1.logInfo)('Custom domain verified', { tenantId, domain });
    }
    /**
     * Create sub-account (child tenant)
     */
    async createSubAccount(parentTenantId, data) {
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
            tier: Tenant_1.TenantTier.ENTERPRISE, // Sub-accounts inherit enterprise tier
        });
    }
}
exports.TenantService = TenantService;
//# sourceMappingURL=TenantService.js.map