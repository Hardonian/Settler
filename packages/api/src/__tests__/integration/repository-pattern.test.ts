/**
 * Integration Tests: Repository Pattern
 * Tests repository implementations
 */

import { JobRepository } from "../../infrastructure/repositories/JobRepository";
import { query } from "../../db";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "true";
const describeRepositoryTests = shouldRunDbTests ? describe : describe.skip;

describeRepositoryTests("Repository Pattern Integration", () => {
  let repository: JobRepository;
  let testUserId: string;
  const testTenantId = "00000000-0000-0000-0000-000000000099";

  beforeAll(async () => {
    repository = new JobRepository();

    // Create test user with tenant
    const users = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, role, tenant_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ["test-repo@example.com", "$2b$10$test", "developer", testTenantId]
    );
    testUserId = users[0]?.id || "";
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await query("DELETE FROM jobs WHERE user_id = $1 AND tenant_id = $2", [
        testUserId,
        testTenantId,
      ]);
      await query("DELETE FROM users WHERE id = $1 AND tenant_id = $2", [testUserId, testTenantId]);
    }
  });

  describe("JobRepository", () => {
    it("should create a job", async () => {
      const job = await repository.create({
        userId: testUserId,
        tenantId: testTenantId,
        name: "Test Job",
        source: { adapter: "stripe", config: {} },
        target: { adapter: "shopify", config: {} },
        rules: { matching: [] },
        status: "active",
        version: 1,
      });

      expect(job).toHaveProperty("id");
      expect(job.name).toBe("Test Job");
      expect(job.userId).toBe(testUserId);
    });

    it("should find job by ID", async () => {
      const created = await repository.create({
        userId: testUserId,
        tenantId: testTenantId,
        name: "Find Test Job",
        source: { adapter: "stripe", config: {} },
        target: { adapter: "shopify", config: {} },
        rules: { matching: [] },
        status: "active",
        version: 1,
      });

      const found = await repository.findById(created.id, testUserId, testTenantId);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it("should return null for non-existent job", async () => {
      const found = await repository.findById(
        "00000000-0000-0000-0000-000000000000",
        testUserId,
        testTenantId
      );
      expect(found).toBeNull();
    });

    it("should list jobs for user", async () => {
      // Create multiple jobs
      await repository.create({
        userId: testUserId,
        tenantId: testTenantId,
        name: "Job 1",
        source: { adapter: "stripe", config: {} },
        target: { adapter: "shopify", config: {} },
        rules: { matching: [] },
        status: "active",
        version: 1,
      });

      const result = await repository.findByUserId(testUserId, testTenantId, 1, 10);
      expect(result.jobs.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should update job status with optimistic locking", async () => {
      const created = await repository.create({
        userId: testUserId,
        tenantId: testTenantId,
        name: "Update Test Job",
        source: { adapter: "stripe", config: {} },
        target: { adapter: "shopify", config: {} },
        rules: { matching: [] },
        status: "active",
        version: 1,
      });

      const updated = await repository.updateStatus(
        created.id,
        testUserId,
        testTenantId,
        "running",
        created.version
      );
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe("running");
    });

    it("should return null on version mismatch", async () => {
      const created = await repository.create({
        userId: testUserId,
        tenantId: testTenantId,
        name: "Version Test Job",
        source: { adapter: "stripe", config: {} },
        target: { adapter: "shopify", config: {} },
        rules: { matching: [] },
        status: "active",
        version: 1,
      });

      // Try with wrong version
      const updated = await repository.updateStatus(
        created.id,
        testUserId,
        testTenantId,
        "running",
        999
      );
      expect(updated).toBeNull();
    });

    it("should delete job", async () => {
      const created = await repository.create({
        userId: testUserId,
        tenantId: testTenantId,
        name: "Delete Test Job",
        source: { adapter: "stripe", config: {} },
        target: { adapter: "shopify", config: {} },
        rules: { matching: [] },
        status: "active",
        version: 1,
      });

      const deleted = await repository.delete(created.id, testUserId, testTenantId);
      expect(deleted).toBe(true);

      const found = await repository.findById(created.id, testUserId, testTenantId);
      expect(found).toBeNull();
    });
  });
});
