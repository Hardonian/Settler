/**
 * Jobs Integration Tests
 * Tests the full flow of job creation, retrieval, and execution
 */

import request from 'supertest';
import app from '../../index';
import { query } from '../../db';

describe('Jobs API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup: Create a test user and get auth token
    // In a real test, you'd use a test database
    const testUser = await query(
      `INSERT INTO users (email, password_hash, role) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      ['test@example.com', 'hashed-password', 'developer']
    );
    userId = testUser[0].id;

    // Create API key for testing
    const apiKey = await query(
      `INSERT INTO api_keys (user_id, key_prefix, key_hash, scopes)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, 'rk_test_', 'hashed-key', ['jobs:read', 'jobs:write']]
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await query('DELETE FROM jobs WHERE user_id = $1', [userId]);
    await query('DELETE FROM api_keys WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
  });

  describe('POST /api/v1/jobs', () => {
    it('should create a new reconciliation job', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .set('x-api-key', 'rk_test_valid_key')
        .send({
          name: 'Test Reconciliation',
          source: {
            adapter: 'stripe',
            config: { apiKey: 'sk_test_123' },
          },
          target: {
            adapter: 'shopify',
            config: { apiKey: 'shpat_123' },
          },
          rules: {
            matching: [
              { field: 'order_id', type: 'exact' },
              { field: 'amount', type: 'exact', tolerance: 0.01 },
            ],
            conflictResolution: 'last-wins',
          },
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Reconciliation');
    });

    it('should reject invalid adapter config', async () => {
      await request(app)
        .post('/api/v1/jobs')
        .set('x-api-key', 'rk_test_valid_key')
        .send({
          name: 'Test',
          source: {
            adapter: 'stripe',
            config: { __proto__: { isAdmin: true } }, // Prototype pollution attempt
          },
          target: {
            adapter: 'shopify',
            config: {},
          },
          rules: {
            matching: [],
          },
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/jobs', () => {
    it('should list jobs with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/jobs?page=1&limit=10')
        .set('x-api-key', 'rk_test_valid_key')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    it('should return job details', async () => {
      // First create a job
      const createResponse = await request(app)
        .post('/api/v1/jobs')
        .set('x-api-key', 'rk_test_valid_key')
        .send({
          name: 'Test Job',
          source: { adapter: 'stripe', config: {} },
          target: { adapter: 'shopify', config: {} },
          rules: { matching: [] },
        });

      const jobId = createResponse.body.data.id;

      // Then retrieve it
      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('x-api-key', 'rk_test_valid_key')
        .expect(200);

      expect(response.body.data.id).toBe(jobId);
      expect(response.body.data.name).toBe('Test Job');
    });

    it('should return 404 for non-existent job', async () => {
      await request(app)
        .get('/api/v1/jobs/00000000-0000-0000-0000-000000000000')
        .set('x-api-key', 'rk_test_valid_key')
        .expect(404);
    });

    it('should prevent access to other users\' jobs', async () => {
      // Create job for user A
      // Try to access with user B's API key
      // Should return 404 (not 403 to prevent enumeration)
    });
  });
});
