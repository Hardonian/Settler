/**
 * Tenant Context Management
 * Manages tenant context for request isolation and RLS
 */
import { PoolClient } from 'pg';
export declare class TenantContext {
    private static readonly TENANT_ID_KEY;
    /**
     * Set tenant context for a database connection
     * This enables RLS policies to filter data by tenant
     */
    static setTenantContext(client: PoolClient, tenantId: string): Promise<void>;
    /**
     * Clear tenant context
     */
    static clearTenantContext(client: PoolClient): Promise<void>;
    /**
     * Execute a query with tenant context
     */
    static withTenantContext<T>(client: PoolClient, tenantId: string, callback: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=TenantContext.d.ts.map