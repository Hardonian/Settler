import { Tenant } from '../entities/Tenant';
export interface ITenantRepository {
    findById(id: string): Promise<Tenant | null>;
    findBySlug(slug: string): Promise<Tenant | null>;
    findByCustomDomain(domain: string): Promise<Tenant | null>;
    findSubAccounts(parentTenantId: string): Promise<Tenant[]>;
    findParentTenant(tenantId: string): Promise<Tenant | null>;
    findAll(): Promise<Tenant[]>;
    save(tenant: Tenant): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=ITenantRepository.d.ts.map