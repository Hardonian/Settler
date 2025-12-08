/**
 * Integration Tests: Repository Pattern
 * Tests repository implementations
 */

import { JobRepository } from '../../infrastructure/repositories/JobRepository';
import { query } from '../../db';

describe('Repository Pattern Integration', () => {
  let repository: JobRepository;
  let testUserId: string;

  beforeAll(async () => {
    repository = new JobRepository();

    // Create test user
    const users = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['test-repo@example.com', '$2b$10$test', 'developer']
    );
    testUserId = users[0]?.id || '';
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await query('DELETE FROM jobs WHERE user_id = $1', [testUserId]);
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('JobRepository', () => {
    it('should create a job', async () => {
      const job = await repository.create({
        userId: testUserId,
        name: 'Test Job',
        source: { adapter: 'stripe', config: {} },
        target: { adapter: 'shopify', config: {} },
        rules: { matching: [] },
        status: 'active',
      });

      expect(job).toHaveProperty('id');
      expect(job.name).toBe('Test Job');
      expect(job.userId).toBe(testUserId);
    });

    it('should find job by ID', async () => {
      const created = await repository.create({
        userId: testUserId,
        name: 'Find Test Job',
        source: { adapter: 'stripe', config: {} },
        target: { adapter: 'shopify', config: {} },
        rules: { matching: [] },
        status: 'active',
      });

      const found = await repository.findById(created.id, testUserId);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent job', async () => {
      const found = await repository.findById('00000000-0000-0000-0000-000000000000', testUserId);
      expect(found).toBeNull();
    });

    it('should list jobs for user', async () => {
      // Create multiple jobs
      await repository.create({
        userId: testUserId,
        name: 'Job 1',
        source: { adapter: 'stripe', config: {} },
        target: { adapter: 'shopify', config: {} },
        rules: { matching: [] },
        status: 'active',
      });

      const result = await repository.findByUserId(testUserId, 1, 10);
      expect(result.jobs.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should update job status with optimistic locking', async () => {
      const created = await repository.create({
        userId: testUserId,
        name: 'Update Test Job',
        source: { adapter: 'stripe', config: {} },
        target: { adapter: 'shopify', config: {} },
        rules: { matching: [] },
        status: 'active',
      });

      const updated = await repository.updateStatus(created.id, testUserId, 'running', created.version);
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('running');
    });

    it('should return null on version mismatch', async () => {
      const created = await repository.create({
        userId: testUserId,
        name: 'Version Test Job',
        source: { adapter: 'stripe', config: {} },
        target: { adapter: 'shopify', config: {} },
        rules: { matching: [] },
        status: 'active',
      });

      // Try with wrong version
      const updated = await repository.updateStatus(created.id, testUserId, 'running', 999);
      expect(updated).toBeNull();
    });

    it('should delete job', async () => {
      const created = await repository.create({
        userId: testUserId,
        name: 'Delete Test Job',
        source: { adapter: 'stripe', config: {} },
        target: { adapter: 'shopify', config: {} },
        rules: { matching: [] },
        status: 'active',
      });

      const deleted = await repository.delete(created.id, testUserId);
      expect(deleted).toBe(true);

      const found = await repository.findById(created.id, testUserId);
      expect(found).toBeNull();
    });
  });
});
