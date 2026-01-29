"use strict";
/**
 * Tenant Context Management
 * Manages tenant context for request isolation and RLS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContext = void 0;
class TenantContext {
    static TENANT_ID_KEY = 'app.current_tenant_id';
    /**
     * Set tenant context for a database connection
     * This enables RLS policies to filter data by tenant
     */
    static async setTenantContext(client, tenantId) {
        await client.query(`SET LOCAL ${this.TENANT_ID_KEY} = $1`, [tenantId]);
    }
    /**
     * Clear tenant context
     */
    static async clearTenantContext(client) {
        await client.query(`RESET ${this.TENANT_ID_KEY}`);
    }
    /**
     * Execute a query with tenant context
     */
    static async withTenantContext(client, tenantId, callback) {
        await this.setTenantContext(client, tenantId);
        try {
            return await callback();
        }
        finally {
            await this.clearTenantContext(client);
        }
    }
}
exports.TenantContext = TenantContext;
//# sourceMappingURL=TenantContext.js.map