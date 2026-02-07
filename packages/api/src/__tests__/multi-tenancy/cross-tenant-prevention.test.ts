/**
 * Cross-Tenant Access Prevention Tests
 *
 * These tests prove that tenant isolation is enforced by attempting
 * cross-tenant access and verifying it fails.
 *
 * SECURITY INVARIANT: If these tests pass, tenant isolation is working.
 * If these tests fail, the isolation mechanism has been compromised.
 */

import { Pool } from "pg";
import { JobRepository } from "../../infrastructure/repositories/JobRepository";
import { TenantService } from "../../application/services/TenantService";
import { TenantRepository } from "../../infrastructure/repositories/TenantRepository";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { Tenant, TenantTier } from "../../domain/entities/Tenant";
import { User } from "../../domain/entities/User";
import { TenantContext } from "../../infrastructure/tenancy/TenantContext";
import { query, queryWithTenant } from "../../db";
import { hashPassword } from "../../infrastructure/security/password";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "true";
const describeCrossTenant = shouldRunDbTests ? describe : describe.skip;

describeCrossTenant("Cross-Tenant Access Prevention", () => {
  let tenantA: Tenant;
  let tenantB: Tenant;
  let userA: User;
  let userB: User;
  let jobRepository: JobRepository;
  let pool: Pool;
  let tenantAJobId: string;

  beforeAll(async () => {
    const tenantRepo = new TenantRepository();
    const userRepo = new UserRepository();
    const tenantService = new TenantService(tenantRepo, userRepo);
    jobRepository = new JobRepository();

    // Create two distinct tenants
    const { tenant: tA, owner: uA } = await tenantService.createTenant({
      name: "Tenant Alpha",
      slug: "tenant-alpha",
      ownerEmail: "alpha@example.com",
      ownerPasswordHash: await hashPassword("password123"),
      tier: TenantTier.STARTER,
    });

    const { tenant: tB, owner: uB } = await tenantService.createTenant({
      name: "Tenant Beta",
      slug: "tenant-beta",
      ownerEmail: "beta@example.com",
      ownerPasswordHash: await hashPassword("password123"),
      tier: TenantTier.STARTER,
    });

    tenantA = tA;
    tenantB = tB;
    userA = uA;
    userB = uB;

    pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME || "settler",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    });

    // Create a job in tenant A using raw SQL with tenant context
    const client = await pool.connect();
    try {
      await TenantContext.setTenantContext(client, tenantA.id);
      const result = await client.query(
        `INSERT INTO jobs (user_id, tenant_id, name, source_adapter, target_adapter, source_config_encrypted, target_config_encrypted, rules)
         VALUES ($1, $2, 'Alpha Job', 'stripe', 'shopify', 'enc1', 'enc2', '{}'::jsonb)
         RETURNING id`,
        [userA.id, tenantA.id]
      );
      tenantAJobId = result.rows[0].id;
    } finally {
      await TenantContext.clearTenantContext(client);
      client.release();
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("JobRepository Tenant Isolation", () => {
    it("should allow tenant A to access their own job", async () => {
      const job = await jobRepository.findById(tenantAJobId, tenantA.id, userA.id);
      expect(job).not.toBeNull();
      expect(job?.name).toBe("Alpha Job");
    });

    it("should prevent tenant B from accessing tenant A job via repository", async () => {
      // Attempt to access tenant A's job using tenant B's context
      // This should return null (not found) due to RLS filtering
      const job = await jobRepository.findById(tenantAJobId, tenantB.id, userB.id);
      expect(job).toBeNull();
    });

    it("should prevent tenant B from listing tenant A jobs", async () => {
      // First, create a job for tenant B
      const client = await pool.connect();
      try {
        await TenantContext.setTenantContext(client, tenantB.id);
        await client.query(
          `INSERT INTO jobs (user_id, tenant_id, name, source_adapter, target_adapter, source_config_encrypted, target_config_encrypted, rules)
           VALUES ($1, $2, 'Beta Job', 'stripe', 'shopify', 'enc1', 'enc2', '{}'::jsonb)`,
          [userB.id, tenantB.id]
        );
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }

      // Tenant B should only see their own job
      const { jobs, total } = await jobRepository.findByUserId(tenantB.id, userB.id, 1, 10);
      expect(total).toBe(1);
      expect(jobs[0]?.name).toBe("Beta Job");
      expect(jobs.some((j) => j.id === tenantAJobId)).toBe(false);
    });

    it("should require tenantId for all repository operations", async () => {
      // @ts-expect-error - Testing runtime enforcement
      await expect(jobRepository.findById(tenantAJobId, null, userA.id)).rejects.toThrow(
        /TENANT ISOLATION VIOLATION/
      );

      // @ts-expect-error - Testing runtime enforcement
      await expect(jobRepository.findById(tenantAJobId, undefined, userA.id)).rejects.toThrow(
        /TENANT ISOLATION VIOLATION/
      );

      // Invalid tenant ID should throw at query level
      await expect(
        jobRepository.findById(tenantAJobId, "invalid-tenant-id", userA.id)
      ).rejects.toThrow(/TENANT ISOLATION VIOLATION/);
    });
  });

  describe("Raw SQL Tenant Isolation", () => {
    it("should filter data by tenant context in raw queries", async () => {
      const client = await pool.connect();
      try {
        // Set context to tenant A
        await TenantContext.setTenantContext(client, tenantA.id);
        const resultA = await client.query("SELECT * FROM jobs");

        // All results should be from tenant A
        resultA.rows.forEach((row: { tenant_id: string }) => {
          expect(row.tenant_id).toBe(tenantA.id);
        });

        // Switch to tenant B context
        await TenantContext.clearTenantContext(client);
        await TenantContext.setTenantContext(client, tenantB.id);
        const resultB = await client.query("SELECT * FROM jobs");

        // All results should be from tenant B
        resultB.rows.forEach((row: { tenant_id: string }) => {
          expect(row.tenant_id).toBe(tenantB.id);
        });

        // Tenant A's job should NOT appear in tenant B's results
        const alphaJobInBeta = resultB.rows.find((row: { id: string }) => row.id === tenantAJobId);
        expect(alphaJobInBeta).toBeUndefined();
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }
    });

    it("should prevent direct cross-tenant access via SQL injection attempt", async () => {
      const client = await pool.connect();
      try {
        await TenantContext.setTenantContext(client, tenantA.id);

        // Attempt to bypass RLS with UNION or OR clauses
        const result = await client.query(
          `SELECT * FROM jobs WHERE tenant_id = $1 OR tenant_id = $2`,
          [tenantA.id, tenantB.id]
        );

        // RLS should still filter to only tenant A's data
        result.rows.forEach((row: { tenant_id: string }) => {
          expect(row.tenant_id).toBe(tenantA.id);
        });
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }
    });
  });

  describe("queryWithTenant Enforcement", () => {
    it("should reject queries without valid tenantId", async () => {
      await expect(
        // @ts-expect-error - Testing invalid tenantId
        queryWithTenant(null, "SELECT * FROM jobs")
      ).rejects.toThrow(/TENANT ISOLATION VIOLATION/);

      await expect(
        // @ts-expect-error - Testing invalid tenantId
        queryWithTenant(undefined, "SELECT * FROM jobs")
      ).rejects.toThrow(/TENANT ISOLATION VIOLATION/);

      await expect(queryWithTenant("not-a-uuid", "SELECT * FROM jobs")).rejects.toThrow(
        /TENANT ISOLATION VIOLATION/
      );
    });

    it("should properly scope queries with valid tenantId", async () => {
      // Query as tenant A
      const resultsA = await queryWithTenant(
        tenantA.id,
        "SELECT id, tenant_id FROM jobs WHERE id = $1",
        [tenantAJobId]
      );
      expect(resultsA.length).toBe(1);
      expect((resultsA[0] as { tenant_id: string }).tenant_id).toBe(tenantA.id);

      // Same query as tenant B should return empty
      const resultsB = await queryWithTenant(
        tenantB.id,
        "SELECT id, tenant_id FROM jobs WHERE id = $1",
        [tenantAJobId]
      );
      expect(resultsB.length).toBe(0);
    });
  });

  describe("Tenant Boundary Validation", () => {
    it("should enforce tenant isolation in UPDATE operations", async () => {
      const client = await pool.connect();
      try {
        // Try to update tenant A's job while in tenant B context
        await TenantContext.setTenantContext(client, tenantB.id);
        const updateResult = await client.query(
          `UPDATE jobs SET name = 'Hacked' WHERE id = $1 RETURNING *`,
          [tenantAJobId]
        );

        // No rows should be affected due to RLS
        expect(updateResult.rowCount).toBe(0);
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }

      // Verify job is unchanged
      const clientA = await pool.connect();
      try {
        await TenantContext.setTenantContext(clientA, tenantA.id);
        const checkResult = await clientA.query("SELECT name FROM jobs WHERE id = $1", [
          tenantAJobId,
        ]);
        expect(checkResult.rows[0].name).toBe("Alpha Job");
      } finally {
        await TenantContext.clearTenantContext(clientA);
        clientA.release();
      }
    });

    it("should enforce tenant isolation in DELETE operations", async () => {
      // Create a job to attempt to delete
      const client = await pool.connect();
      let targetJobId: string;
      try {
        await TenantContext.setTenantContext(client, tenantA.id);
        const result = await client.query(
          `INSERT INTO jobs (user_id, tenant_id, name, source_adapter, target_adapter, source_config_encrypted, target_config_encrypted, rules)
           VALUES ($1, $2, 'Deletable Job', 'stripe', 'shopify', 'enc1', 'enc2', '{}'::jsonb)
           RETURNING id`,
          [userA.id, tenantA.id]
        );
        targetJobId = result.rows[0].id;
      } finally {
        await TenantContext.clearTenantContext(client);
        client.release();
      }

      // Try to delete from tenant B context
      const clientB = await pool.connect();
      try {
        await TenantContext.setTenantContext(clientB, tenantB.id);
        const deleteResult = await clientB.query("DELETE FROM jobs WHERE id = $1 RETURNING *", [
          targetJobId,
        ]);

        // No rows should be deleted due to RLS
        expect(deleteResult.rowCount).toBe(0);
      } finally {
        await TenantContext.clearTenantContext(clientB);
        clientB.release();
      }

      // Verify job still exists in tenant A
      const clientA = await pool.connect();
      try {
        await TenantContext.setTenantContext(clientA, tenantA.id);
        const checkResult = await clientA.query("SELECT * FROM jobs WHERE id = $1", [targetJobId]);
        expect(checkResult.rows.length).toBe(1);
      } finally {
        await TenantContext.clearTenantContext(clientA);
        clientA.release();
      }
    });
  });

  describe("Audit and Observability", () => {
    it("should log unscoped query warnings in development", async () => {
      // This test verifies the deprecation warning is logged
      // In actual development, this would output to console
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      // Call unscoped query (deprecated)
      await query("SELECT 1");

      // In development mode, should log warning
      if (process.env.NODE_ENV === "development") {
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[SECURITY WARNING]"));
      }

      consoleSpy.mockRestore();
    });
  });
});
