/**
 * E2E Test: Complete Reconciliation Flow
 * Tests the full reconciliation workflow from job creation to report retrieval
 */

import { test, expect } from '@playwright/test';
import { SettlerClient } from '@settler/sdk';

const API_KEY = process.env.E2E_API_KEY || 'test-api-key';
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Reconciliation Flow', () => {
  let client: SettlerClient;
  let jobId: string;

  test.beforeAll(() => {
    client = new SettlerClient({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
    });
  });

  test('should create a reconciliation job', async () => {
    const job = await client.jobs.create({
      name: 'E2E Test Job',
      source: {
        adapter: 'stripe',
        config: {
          api_key: 'sk_test_e2e',
        },
      },
      target: {
        adapter: 'shopify',
        config: {
          api_key: 'test_shopify_key',
          shop: 'test-shop',
        },
      },
      rules: {
        matching: [
          { field: 'order_id', type: 'exact' },
          { field: 'amount', type: 'exact', tolerance: 0.01 },
        ],
      },
    });

    expect(job.data).toBeDefined();
    expect(job.data.id).toBeDefined();
    jobId = job.data.id;
  });

  test('should retrieve created job', async () => {
    expect(jobId).toBeDefined();
    
    const job = await client.jobs.get(jobId);
    expect(job.data).toBeDefined();
    expect(job.data.id).toBe(jobId);
    expect(job.data.name).toBe('E2E Test Job');
  });

  test('should list jobs', async () => {
    const response = await client.jobs.list({ page: 1, limit: 10 });
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
    
    const testJob = response.data.find((j: any) => j.id === jobId);
    expect(testJob).toBeDefined();
  });

  test('should run reconciliation job', async () => {
    expect(jobId).toBeDefined();
    
    const execution = await client.jobs.run(jobId);
    expect(execution.data).toBeDefined();
    expect(execution.data.job_id).toBe(jobId);
  });

  test('should get reconciliation report', async () => {
    expect(jobId).toBeDefined();
    
    // Wait a bit for reconciliation to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const report = await client.reports.get(jobId);
    expect(report.data).toBeDefined();
    
    if (report.data.summary) {
      expect(report.data.summary).toHaveProperty('matched');
      expect(report.data.summary).toHaveProperty('unmatched');
    }
  });

  test('should get unmatched records', async () => {
    expect(jobId).toBeDefined();
    
    const unmatched = await client.reports.getUnmatched(jobId);
    expect(Array.isArray(unmatched.data)).toBe(true);
  });

  test('should create webhook', async () => {
    const webhook = await client.webhooks.create({
      url: 'https://webhook.site/test',
      events: ['reconciliation.completed', 'reconciliation.failed'],
    });

    expect(webhook.data).toBeDefined();
    expect(webhook.data.id).toBeDefined();
    expect(webhook.data.events).toContain('reconciliation.completed');
  });

  test('should list webhooks', async () => {
    const webhooks = await client.webhooks.list();
    expect(webhooks.data).toBeDefined();
    expect(Array.isArray(webhooks.data)).toBe(true);
  });

  test('should list adapters', async () => {
    const adapters = await client.adapters.list();
    expect(adapters.data).toBeDefined();
    expect(Array.isArray(adapters.data)).toBe(true);
    expect(adapters.data.length).toBeGreaterThan(0);
  });

  test('should delete job', async () => {
    expect(jobId).toBeDefined();
    
    await client.jobs.delete(jobId);
    
    // Verify deletion
    try {
      await client.jobs.get(jobId);
      throw new Error('Job should have been deleted');
    } catch (error: any) {
      expect(error.statusCode).toBe(404);
    }
  });
});

test.describe('Error Handling', () => {
  let client: SettlerClient;

  test.beforeAll(() => {
    client = new SettlerClient({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
    });
  });

  test('should handle invalid job ID', async () => {
    try {
      await client.jobs.get('invalid-id');
      throw new Error('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(404);
    }
  });

  test('should handle invalid job creation', async () => {
    try {
      await client.jobs.create({
        name: '',
        source: { adapter: 'invalid', config: {} },
        target: { adapter: 'invalid', config: {} },
        rules: { matching: [] },
      });
      throw new Error('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(422);
    }
  });

  test('should handle invalid API key', async () => {
    const invalidClient = new SettlerClient({
      apiKey: 'invalid-key',
      baseUrl: BASE_URL,
    });

    try {
      await invalidClient.jobs.list();
      throw new Error('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(401);
    }
  });
});

test.describe('Performance', () => {
  let client: SettlerClient;

  test.beforeAll(() => {
    client = new SettlerClient({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
    });
  });

  test('should respond to list jobs within 200ms', async () => {
    const start = Date.now();
    await client.jobs.list();
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  test('should cache reconciliation summary', async () => {
    // Create a job first
    const job = await client.jobs.create({
      name: 'Performance Test Job',
      source: { adapter: 'stripe', config: { api_key: 'test' } },
      target: { adapter: 'shopify', config: { api_key: 'test', shop: 'test' } },
      rules: { matching: [{ field: 'order_id', type: 'exact' }] },
    });

    // First request (cache miss)
    const start1 = Date.now();
    await fetch(`${BASE_URL}/api/v1/reconciliations/${job.data.id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const duration1 = Date.now() - start1;

    // Second request (cache hit)
    const start2 = Date.now();
    const response = await fetch(`${BASE_URL}/api/v1/reconciliations/${job.data.id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const duration2 = Date.now() - start2;

    expect(response.headers.get('X-Cache')).toBe('HIT');
    expect(duration2).toBeLessThan(duration1);
  });
});
