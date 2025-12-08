/**
 * Migration Tests
 * Tests for database migrations
 */

import { query, initDatabase } from '../../db';
import { Pool } from 'pg';

describe('Database Migrations', () => {
  let testPool: Pool;

  beforeAll(async () => {
    // Use test database
    testPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'settler_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  });

  afterAll(async () => {
    await testPool.end();
  });

  beforeEach(async () => {
    // Clean up test data
    await testPool.query('TRUNCATE TABLE jobs, executions, matches, unmatched, reports CASCADE');
  });

  describe('Initial Schema Migration', () => {
    it('should create all required tables', async () => {
      await initDatabase();

      const tables = await testPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tableNames = tables.rows.map((r) => r.table_name);

      // Check core tables exist
      expect(tableNames).toContain('tenants');
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('jobs');
      expect(tableNames).toContain('executions');
      expect(tableNames).toContain('matches');
      expect(tableNames).toContain('unmatched');
      expect(tableNames).toContain('reports');
      expect(tableNames).toContain('webhooks');
      expect(tableNames).toContain('api_keys');
    });

    it('should create all required indexes', async () => {
      await initDatabase();

      const indexes = await testPool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY indexname
      `);

      const indexNames = indexes.rows.map((r) => r.indexname);

      // Check key indexes exist
      expect(indexNames.some((name) => name.includes('idx_jobs_user_id'))).toBe(true);
      expect(indexNames.some((name) => name.includes('idx_jobs_tenant_id'))).toBe(true);
      expect(indexNames.some((name) => name.includes('idx_executions_job_id'))).toBe(true);
      expect(indexNames.some((name) => name.includes('idx_users_email'))).toBe(true);
    });

    it('should create all required functions', async () => {
      await initDatabase();

      const functions = await testPool.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        ORDER BY routine_name
      `);

      const functionNames = functions.rows.map((r) => r.routine_name);

      // Check key functions exist
      expect(functionNames).toContain('current_tenant_id');
      expect(functionNames).toContain('check_tenant_quota');
      expect(functionNames).toContain('increment_tenant_quota_usage');
      expect(functionNames).toContain('is_ip_blocked');
    });

    it('should enable RLS on tenant-scoped tables', async () => {
      await initDatabase();

      const rlsTables = await testPool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
        ORDER BY tablename
      `);

      const tableNames = rlsTables.rows.map((r) => r.tablename);

      // Check RLS is enabled on key tables
      expect(tableNames).toContain('jobs');
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('executions');
      expect(tableNames).toContain('matches');
    });

    it('should create RLS policies', async () => {
      await initDatabase();

      const policies = await testPool.query(`
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
      `);

      const policyMap = new Map<string, string[]>();
      policies.rows.forEach((row) => {
        if (!policyMap.has(row.tablename)) {
          policyMap.set(row.tablename, []);
        }
        policyMap.get(row.tablename)!.push(row.policyname);
      });

      // Check RLS policies exist
      expect(policyMap.get('jobs')).toContain('tenant_isolation_jobs');
      expect(policyMap.get('users')).toContain('tenant_isolation_users');
      expect(policyMap.get('executions')).toContain('tenant_isolation_executions');
    });

    it('should be idempotent (safe to run multiple times)', async () => {
      // Run migration twice
      await initDatabase();
      await initDatabase();

      // Should not throw errors
      const tables = await testPool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);

      expect(parseInt(tables.rows[0].count, 10)).toBeGreaterThan(0);
    });
  });

  describe('Tenant ID Propagation', () => {
    it('should propagate tenant_id from user to job', async () => {
      await initDatabase();

      // Create tenant
      const tenantResult = await testPool.query(`
        INSERT INTO tenants (name, slug, tier)
        VALUES ('Test Tenant', 'test-tenant', 'free')
        RETURNING id
      `);
      const tenantId = tenantResult.rows[0].id;

      // Create user
      const userResult = await testPool.query(`
        INSERT INTO users (tenant_id, email, password_hash)
        VALUES ($1, 'test@example.com', 'hashed-password')
        RETURNING id
      `, [tenantId]);
      const userId = userResult.rows[0].id;

      // Create job (should auto-populate tenant_id)
      const jobResult = await testPool.query(`
        INSERT INTO jobs (user_id, name, source_adapter, source_config_encrypted, target_adapter, target_config_encrypted, rules)
        VALUES ($1, 'Test Job', 'shopify', 'encrypted', 'stripe', 'encrypted', '{}')
        RETURNING id, tenant_id
      `, [userId]);

      expect(jobResult.rows[0].tenant_id).toBe(tenantId);
    });
  });

  describe('Quota Functions', () => {
    it('should check tenant quota correctly', async () => {
      await initDatabase();

      // Create tenant with quotas
      const tenantResult = await testPool.query(`
        INSERT INTO tenants (name, slug, tier, quotas)
        VALUES ('Test Tenant', 'test-tenant', 'free', '{"monthlyReconciliations": 1000}'::jsonb)
        RETURNING id
      `);
      const tenantId = tenantResult.rows[0].id;

      // Check quota
      const result = await testPool.query(`
        SELECT check_tenant_quota($1, 'monthlyReconciliations', 1) as allowed
      `, [tenantId]);

      expect(result.rows[0].allowed).toBe(true);
    });
  });
});
