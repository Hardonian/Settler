/**
 * Tenant-Aware Connection Pool
 * Manages database connections with tenant context for RLS
 */

import { Pool, PoolClient } from 'pg';
import { config } from '../../config';
import { TenantContext } from './TenantContext';

export class TenantConnectionPool {
  private pool: Pool;
  private tenantPools: Map<string, Pool> = new Map();

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
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
  async getConnection(tenantId: string): Promise<PoolClient> {
    const client = await this.pool.connect();
    await TenantContext.setTenantContext(client, tenantId);
    return client;
  }

  /**
   * Execute a query with tenant context
   */
  async query<T = any>(
    tenantId: string,
    text: string,
    params?: any[]
  ): Promise<T[]> {
    const client = await this.getConnection(tenantId);
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      await TenantContext.clearTenantContext(client);
      client.release();
    }
  }

  /**
   * Execute a transaction with tenant context
   */
  async transaction<T>(
    tenantId: string,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getConnection(tenantId);
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      await TenantContext.clearTenantContext(client);
      client.release();
    }
  }

  /**
   * Get a dedicated pool for a tenant (for schema-per-tenant)
   */
  getTenantPool(tenantSlug: string): Pool {
    if (!this.tenantPools.has(tenantSlug)) {
      const pool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
        options: `-c search_path=tenant_${tenantSlug},public`,
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      this.tenantPools.set(tenantSlug, pool);
    }
    return this.tenantPools.get(tenantSlug)!;
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
    for (const pool of this.tenantPools.values()) {
      await pool.end();
    }
    this.tenantPools.clear();
  }
}

export const tenantPool = new TenantConnectionPool();
