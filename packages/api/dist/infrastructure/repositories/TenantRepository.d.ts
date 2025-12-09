import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { Tenant } from '../../domain/entities/Tenant';
export declare class TenantRepository implements ITenantRepository {
    findById(id: string): Promise<Tenant | null>;
    findBySlug(slug: string): Promise<Tenant | null>;
    findByCustomDomain(domain: string): Promise<Tenant | null>;
    findSubAccounts(parentTenantId: string): Promise<Tenant[]>;
    findParentTenant(tenantId: string): Promise<Tenant | null>;
    findAll(): Promise<Tenant[]>;
    save(tenant: Tenant): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=TenantRepository.d.ts.map