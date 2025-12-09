/**
 * Tenant Service
 * Business logic for tenant management and onboarding
 */
import { Tenant, TenantTier } from '../../domain/entities/Tenant';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
export declare class TenantService {
    private tenantRepo;
    private userRepo;
    constructor(tenantRepo: ITenantRepository, userRepo: IUserRepository);
    /**
     * Create a new tenant with default owner user
     */
    createTenant(data: {
        name: string;
        slug: string;
        ownerEmail: string;
        ownerPasswordHash: string;
        ownerName?: string;
        tier?: TenantTier;
        parentTenantId?: string;
    }): Promise<{
        tenant: Tenant;
        owner: User;
    }>;
    /**
     * Get default quotas based on tier
     */
    private getDefaultQuotas;
    /**
     * Upgrade tenant tier
     */
    upgradeTier(tenantId: string, newTier: TenantTier): Promise<Tenant>;
    /**
     * Verify custom domain
     */
    verifyCustomDomain(tenantId: string, domain: string): Promise<void>;
    /**
     * Create sub-account (child tenant)
     */
    createSubAccount(parentTenantId: string, data: {
        name: string;
        slug: string;
        ownerEmail: string;
        ownerPasswordHash: string;
        ownerName?: string;
    }): Promise<{
        tenant: Tenant;
        owner: User;
    }>;
}
//# sourceMappingURL=TenantService.d.ts.map