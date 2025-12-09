"use strict";
/**
 * Tenant-Aware Connection Pool
 * Manages database connections with tenant context for RLS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantPool = exports.TenantConnectionPool = void 0;
const pg_1 = require("pg");
const config_1 = require("../../config");
const TenantContext_1 = require("./TenantContext");
class TenantConnectionPool {
    pool;
    tenantPools = new Map();
    constructor() {
        this.pool = new pg_1.Pool({
            host: config_1.config.database.host,
            port: config_1.config.database.port,
            database: config_1.config.database.name,
            user: config_1.config.database.user,
            password: config_1.config.database.password,
            max: 20,
            min: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            statement_timeout: 30000,
            query_timeout: 30000,
        });
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }
    /**
     * Get a connection with tenant context set
     */
    async getConnection(tenantId) {
        const client = await this.pool.connect();
        await TenantContext_1.TenantContext.setTenantContext(client, tenantId);
        return client;
    }
    /**
     * Execute a query with tenant context
     */
    async query(tenantId, text, params) {
        const client = await this.getConnection(tenantId);
        try {
            const result = await client.query(text, params);
            return result.rows;
        }
        finally {
            await TenantContext_1.TenantContext.clearTenantContext(client);
            client.release();
        }
    }
    /**
     * Execute a transaction with tenant context
     */
    async transaction(tenantId, callback) {
        const client = await this.getConnection(tenantId);
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            await TenantContext_1.TenantContext.clearTenantContext(client);
            client.release();
        }
    }
    /**
     * Get a dedicated pool for a tenant (for schema-per-tenant)
     */
    getTenantPool(tenantSlug) {
        if (!this.tenantPools.has(tenantSlug)) {
            const pool = new pg_1.Pool({
                host: config_1.config.database.host,
                port: config_1.config.database.port,
                database: config_1.config.database.name,
                user: config_1.config.database.user,
                password: config_1.config.database.password,
                options: `-c search_path=tenant_${tenantSlug},public`,
                max: 10,
                min: 2,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
            this.tenantPools.set(tenantSlug, pool);
        }
        return this.tenantPools.get(tenantSlug);
    }
    /**
     * Close all connections
     */
    async close() {
        await this.pool.end();
        for (const pool of this.tenantPools.values()) {
            await pool.end();
        }
        this.tenantPools.clear();
    }
}
exports.TenantConnectionPool = TenantConnectionPool;
exports.tenantPool = new TenantConnectionPool();
//# sourceMappingURL=TenantConnectionPool.js.map