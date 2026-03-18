/**
 * Concurrency Protection
 *
 * Ensures only one sync runs per (tenant_id, connector_id) at a time
 */
export interface ConcurrencyLock {
    acquired: boolean;
    lockId?: string;
    error?: string;
}
/**
 * Acquire lock for sync (using PostgreSQL advisory locks)
 */
export declare function acquireSyncLock(tenantId: string, connectorId: string, supabaseUrl: string, supabaseServiceKey: string): Promise<ConcurrencyLock>;
/**
 * Release lock for sync
 */
export declare function releaseSyncLock(lockId: string, supabaseUrl: string, supabaseServiceKey: string): Promise<void>;
//# sourceMappingURL=concurrency-protection.d.ts.map