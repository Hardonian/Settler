/**
 * Tenant Isolation Tests
 * Ensures complete data isolation between tenants
 */

import { Pool } from 'pg';
import { TenantService } from '../../application/services/TenantService';
import { TenantRepository } from '../../infrastructure/repositories/TenantRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { Tenant, TenantTier, TenantStatus } from '../../domain/entities/Tenant';
import { User, UserRole } from '../../domain/entities/User';
import { TenantContext } from '../../infrastructure/tenancy/TenantContext';
import { query } from '../../db';
import { hashPassword } from '../../infrastructure/security/password';

describe('Tenant Isolation', () => {
  let tenant1: Tenant;
  let tenant2: Tenant;
  let user1: User;
  let user2: User;
  let tenantService: TenantService;
  let pool: Pool;

  beforeAll(async () => {
    const tenantRepo = new TenantRepository();
    const userRepo = new UserRepository();
    tenantService = new TenantService(tenantRepo, userRepo);

    // Create two tenants
    const { tenant: t1, owner: u1 } = await tenantService.createTenant({
      name: 'Test Tenant 1',
      slug: 'test-tenant-1',
      ownerEmail: 'owner1@test.com',
      ownerPasswordHash: await hashPassword('password123'),
      tier: TenantTier.STARTER,
    });

    const { tenant: t2, owner: u2 } = await tenantService.createTenant({
      name: 'Test Tenant 2',
      slug: 'test-tenant-2',
      ownerEmail: 'owner2@test.com',
      ownerPasswordHash: await hashPassword('password123'),
      tier: TenantTier.STARTER,
    });

    tenant1 = t1;
    tenant2 = t2;
    user1 = u1;
    user2 = u2;

    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'settler',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Row Level Security', () => {
    it('should only return users from tenant 1 when tenant context is set', async () => {
      const client = await pool.connect();
      try {
        await TenantContext.setTenantContext(client, tenant1.id);

        const result = await client.query('SELECT * FROM users WHERE deleted_at IS NULL');
        const users = result.rows;

        expect(users.length).toBeGreaterThan(0);
        users.forEach((user) => {
          expect(user.tenant_id).toBe(tenant1.id);
        });

        // Should not see tenant 2's users
        const tenant2Users = users.filter((u) => u.tenant_id === tenant2.id);
        expect(tenant2Users.length).toBe(0);
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }
    });

    it('should only return jobs from tenant 1 when tenant context is set', async () => {
      const client = await pool.connect();
      try {
        // Create jobs for both tenants
        await query(
          `INSERT INTO jobs (id, user_id, tenant_id, name, source_adapter, target_adapter, source_config_encrypted, target_config_encrypted, rules)
           VALUES 
           (gen_random_uuid(), $1, $2, 'Job 1', 'stripe', 'shopify', 'encrypted1', 'encrypted2', '{}'::jsonb),
           (gen_random_uuid(), $3, $4, 'Job 2', 'stripe', 'shopify', 'encrypted1', 'encrypted2', '{}'::jsonb)`,
          [user1.id, tenant1.id, user2.id, tenant2.id]
        );

        await TenantContext.setTenantContext(client, tenant1.id);

        const result = await client.query('SELECT * FROM jobs WHERE deleted_at IS NULL');
        const jobs = result.rows;

        expect(jobs.length).toBeGreaterThan(0);
        jobs.forEach((job) => {
          expect(job.tenant_id).toBe(tenant1.id);
        });

        // Should not see tenant 2's jobs
        const tenant2Jobs = jobs.filter((j) => j.tenant_id === tenant2.id);
        expect(tenant2Jobs.length).toBe(0);
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }
    });
  });

  describe('Data Isolation', () => {
    it('should prevent cross-tenant data access', async () => {
      const client = await pool.connect();
      try {
        await TenantContext.setTenantContext(client, tenant1.id);

        // Try to access tenant 2's data directly (should be filtered by RLS)
        const result = await client.query(
          'SELECT * FROM users WHERE tenant_id = $1',
          [tenant2.id]
        );

        // RLS should prevent this
        expect(result.rows.length).toBe(0);
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }
    });

    it('should allow tenant 1 to create data without affecting tenant 2', async () => {
      const client = await pool.connect();
      try {
        await TenantContext.setTenantContext(client, tenant1.id);

        const jobId = crypto.randomUUID();
        await client.query(
          `INSERT INTO jobs (id, user_id, tenant_id, name, source_adapter, target_adapter, source_config_encrypted, target_config_encrypted, rules)
           VALUES ($1, $2, $3, 'Isolated Job', 'stripe', 'shopify', 'encrypted1', 'encrypted2', '{}'::jsonb)`,
          [jobId, user1.id, tenant1.id]
        );

        // Switch to tenant 2 context
        await TenantContext.clearTenantContext(client);
        await TenantContext.setTenantContext(client, tenant2.id);

        // Tenant 2 should not see tenant 1's job
        const result = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
        expect(result.rows.length).toBe(0);
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }
    });
  });

  describe('Schema Per Tenant', () => {
    it('should create separate schema for each tenant when enabled', async () => {
      if (process.env.ENABLE_SCHEMA_PER_TENANT !== 'true') {
        return; // Skip if schema-per-tenant is disabled
      }

      const client = await pool.connect();
      try {
        // Check if tenant schema exists
        const schemaResult = await client.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
          [`tenant_${tenant1.slug}`]
        );

        expect(schemaResult.rows.length).toBe(1);
      } finally {
        client.release();
      }
    });
  });
});
