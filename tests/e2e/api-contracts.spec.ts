/**
 * API Contract Tests
 * 
 * Validates that API responses match expected schemas using Zod
 * Ensures backward compatibility and type safety
 */

import { test, expect } from '@playwright/test';
import { z } from 'zod';

// Shared Zod schemas for API responses
const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  trace_id: z.string().optional(),
  timestamp: z.string(),
  checks: z.record(z.object({
    status: z.enum(['ok', 'error']),
    message: z.string().optional(),
  })),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  trace_id: z.string().optional(),
  timestamp: z.string(),
  details: z.record(z.any()).optional(),
});

const MetricsResponseSchema = z.object({
  trace_id: z.string(),
  timestamp: z.string(),
  summary: z.object({
    total: z.number(),
    avg_duration_ms: z.number(),
    p95_duration_ms: z.number(),
    p99_duration_ms: z.number(),
    errors: z.number(),
    slow_requests: z.number(),
  }),
  recent_metrics: z.array(z.object({
    route: z.string(),
    method: z.string(),
    duration_ms: z.number(),
    status: z.number(),
    timestamp: z.string(),
    trace_id: z.string().optional(),
  })),
});

test.describe('API Contract Tests', () => {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  test('GET /api/health returns valid schema', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const parsed = HealthResponseSchema.parse(body);

    expect(parsed.status).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.checks).toBeDefined();
  });

  test('GET /api/health includes trace_id header', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/health`);
    const traceId = response.headers()['x-trace-id'];
    
    expect(traceId).toBeDefined();
    expect(typeof traceId).toBe('string');
    expect(traceId.length).toBeGreaterThan(0);
  });

  test('Error responses match schema', async ({ request }) => {
    // Try to access non-existent route
    const response = await request.get(`${baseURL}/api/nonexistent`, {
      failOnStatusCode: false,
    });

    const body = await response.json();
    
    // Should match error schema
    const parsed = ErrorResponseSchema.safeParse(body);
    expect(parsed.success).toBeTruthy();
  });

  test('Error responses include trace_id', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/nonexistent`, {
      failOnStatusCode: false,
    });

    const body = await response.json();
    const parsed = ErrorResponseSchema.safeParse(body);
    
    if (parsed.success) {
      expect(parsed.data.trace_id).toBeDefined();
    }
  });

  test('GET /api/metrics returns valid schema (if accessible)', async ({ request }) => {
    // Metrics endpoint may require auth, so we check gracefully
    const response = await request.get(`${baseURL}/api/metrics`, {
      failOnStatusCode: false,
    });

    if (response.ok()) {
      const body = await response.json();
      const parsed = MetricsResponseSchema.safeParse(body);
      expect(parsed.success).toBeTruthy();
    } else {
      // If unauthorized, that's fine - just verify it returns proper error
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('All API responses include trace_id header', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/api/status',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${baseURL}${endpoint}`, {
        failOnStatusCode: false,
      });

      const traceId = response.headers()['x-trace-id'];
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
    }
  });
});
