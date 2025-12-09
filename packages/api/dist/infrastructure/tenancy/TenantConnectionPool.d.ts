/**
 * Tenant-Aware Connection Pool
 * Manages database connections with tenant context for RLS
 */
import { Pool, PoolClient } from 'pg';
export declare class TenantConnectionPool {
    private pool;
    private tenantPools;
    constructor();
    /**
     * Get a connection with tenant context set
     */
    getConnection(tenantId: string): Promise<PoolClient>;
    /**
     * Execute a query with tenant context
     */
    query<T = any>(tenantId: string, text: string, params?: any[]): Promise<T[]>;
    /**
     * Execute a transaction with tenant context
     */
    transaction<T>(tenantId: string, callback: (client: PoolClient) => Promise<T>): Promise<T>;
    /**
     * Get a dedicated pool for a tenant (for schema-per-tenant)
     */
    getTenantPool(tenantSlug: string): Pool;
    /**
     * Close all connections
     */
    close(): Promise<void>;
}
export declare const tenantPool: TenantConnectionPool;
//# sourceMappingURL=TenantConnectionPool.d.ts.map