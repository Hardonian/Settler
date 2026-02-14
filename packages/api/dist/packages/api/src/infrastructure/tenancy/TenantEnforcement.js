"use strict";
/**
 * Tenant Enforcement Utilities
 *
 * CRITICAL SECURITY: These utilities enforce tenant isolation at compile-time and runtime.
 * Any data access MUST include a tenant scope. The unscoped query() function in db/index.ts
 * is DEPRECATED and should not be used for tenant data access.
 *
 * Enforcement points:
 * 1. Compile-time: TypeScript types require tenantId parameter
 * 2. Runtime: Assertions validate tenantId is present and valid UUID
 * 3. Database: RLS policies enforce tenant isolation at the database level
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEPRECATED_UNSCOPED_QUERY = exports.TenantScopedRepository = exports.TenantIsolationError = void 0;
exports.validateTenantId = validateTenantId;
exports.withTenantConnection = withTenantConnection;
exports.queryWithTenant = queryWithTenant;
exports.transactionWithTenant = transactionWithTenant;
exports.addTenantFilter = addTenantFilter;
exports.assertTenantOwnership = assertTenantOwnership;
const TenantContext_1 = require("./TenantContext");
const db_1 = require("../../db");
// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/**
 * Tenant scope validation error
 * Thrown when tenant isolation is violated
 */
class TenantIsolationError extends Error {
    resource;
    attemptedTenantId;
    constructor(message, resource, attemptedTenantId) {
        super(`[TENANT ISOLATION VIOLATION] ${message}`);
        this.resource = resource;
        this.attemptedTenantId = attemptedTenantId;
        this.name = "TenantIsolationError";
    }
}
exports.TenantIsolationError = TenantIsolationError;
/**
 * Validates that a tenantId is present and is a valid UUID
 * Throws TenantIsolationError if validation fails
 */
function validateTenantId(tenantId, context) {
    if (!tenantId) {
        throw new TenantIsolationError(`Tenant ID is required for ${context}. Unscoped queries are prohibited.`, context, tenantId ?? undefined);
    }
    if (!UUID_REGEX.test(tenantId)) {
        throw new TenantIsolationError(`Invalid tenant ID format for ${context}: ${tenantId}. Must be a valid UUID.`, context, tenantId);
    }
}
/**
 * Wraps a database client to enforce tenant context
 * All queries executed through this client will have RLS enforced
 */
async function withTenantConnection(tenantId, callback) {
    validateTenantId(tenantId, "withTenantConnection");
    const client = await db_1.pool.connect();
    try {
        await TenantContext_1.TenantContext.setTenantContext(client, tenantId);
        return await callback(client);
    }
    finally {
        await TenantContext_1.TenantContext.clearTenantContext(client);
        client.release();
    }
}
/**
 * Execute a query with mandatory tenant context
 * This is the REQUIRED way to query tenant-scoped data
 */
async function queryWithTenant(tenantId, text, params) {
    validateTenantId(tenantId, "queryWithTenant");
    return withTenantConnection(tenantId, async (client) => {
        const result = await client.query(text, params);
        return result.rows;
    });
}
/**
 * Execute a transaction with mandatory tenant context
 */
async function transactionWithTenant(tenantId, callback) {
    validateTenantId(tenantId, "transactionWithTenant");
    return withTenantConnection(tenantId, async (client) => {
        try {
            await client.query("BEGIN");
            const result = await callback(client);
            await client.query("COMMIT");
            return result;
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
    });
}
/**
 * Repository base class that enforces tenant scope
 * All tenant-scoped repositories should extend this
 */
class TenantScopedRepository {
    tenantId;
    constructor(tenantId) {
        this.tenantId = tenantId;
        validateTenantId(tenantId, this.constructor.name);
    }
    /**
     * Execute a query within this tenant's scope
     */
    async query(text, params) {
        return queryWithTenant(this.tenantId, text, params);
    }
    /**
     * Execute a transaction within this tenant's scope
     */
    async transaction(callback) {
        return transactionWithTenant(this.tenantId, callback);
    }
}
exports.TenantScopedRepository = TenantScopedRepository;
/**
 * Helper to add tenant_id filter to existing queries
 * Use this when you need to manually add tenant scope to a query
 */
function addTenantFilter(baseQuery, tenantId, paramIndex = 1) {
    validateTenantId(tenantId, "addTenantFilter");
    // Check if query already has WHERE clause
    const hasWhere = baseQuery.toLowerCase().includes("where");
    const conjunction = hasWhere ? "AND" : "WHERE";
    return {
        query: `${baseQuery} ${conjunction} tenant_id = $${paramIndex}`,
        params: [tenantId],
    };
}
/**
 * Runtime assertion that data belongs to the expected tenant
 * Use this after fetching data to verify isolation
 */
function assertTenantOwnership(data, expectedTenantId, resourceName) {
    if (!data)
        return;
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
        if (item.tenant_id && item.tenant_id !== expectedTenantId) {
            throw new TenantIsolationError(`Data ownership violation: ${resourceName} belongs to tenant ${item.tenant_id}, ` +
                `but access was attempted from tenant ${expectedTenantId}`, resourceName, expectedTenantId);
        }
    }
}
/**
 * DEPRECATED: Mark old patterns for migration
 * These will be removed once all code is migrated
 */
exports.DEPRECATED_UNSCOPED_QUERY = Symbol("DEPRECATED_UNSCOPED_QUERY");
//# sourceMappingURL=TenantEnforcement.js.map