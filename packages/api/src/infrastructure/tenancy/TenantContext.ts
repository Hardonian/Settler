/**
 * Tenant Context Management
 * Manages tenant context for request isolation and RLS
 */

import { PoolClient } from "pg";

export class TenantContext {
  private static readonly TENANT_ID_KEY = `"request.jwt.claim.tenant_id"`;

  /**
   * Set tenant context for a database connection
   * This enables RLS policies to filter data by tenant
   */
  static async setTenantContext(client: PoolClient, tenantId: string): Promise<void> {
    await client.query(`SELECT set_config($1, $2, true)`, [
      this.TENANT_ID_KEY.replace(/"/g, ""),
      tenantId,
    ]);
  }

  /**
   * Clear tenant context
   */
  static async clearTenantContext(client: PoolClient): Promise<void> {
    await client.query(`SELECT set_config($1, \'\', true)`, [this.TENANT_ID_KEY.replace(/"/g, "")]);
  }

  /**
   * Execute a query with tenant context
   */
  static async withTenantContext<T>(
    client: PoolClient,
    tenantId: string,
    callback: () => Promise<T>
  ): Promise<T> {
    await this.setTenantContext(client, tenantId);
    try {
      return await callback();
    } finally {
      await this.clearTenantContext(client);
    }
  }
}
