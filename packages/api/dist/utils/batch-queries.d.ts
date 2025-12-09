/**
 * Batch Query Utilities
 * Prevents N+1 query patterns by batching database operations
 */
/**
 * Batch fetch users by IDs
 */
export declare function batchFetchUsers(userIds: string[]): Promise<Map<string, {
    id: string;
    email: string;
    plan_type: string;
}>>;
/**
 * Batch fetch jobs by IDs
 */
export declare function batchFetchJobs(jobIds: string[]): Promise<Map<string, {
    id: string;
    user_id: string;
    name: string;
}>>;
/**
 * Batch fetch tenants by IDs
 */
export declare function batchFetchTenants(tenantIds: string[]): Promise<Map<string, {
    id: string;
    name: string;
}>>;
/**
 * Batch insert with conflict handling
 */
export declare function batchInsert<T extends Record<string, unknown>>(table: string, records: T[], conflictColumns?: string[]): Promise<void>;
//# sourceMappingURL=batch-queries.d.ts.map