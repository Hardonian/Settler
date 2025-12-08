/**
 * Integration Tests: Route Validation
 * Validates that all routes are properly wired and accessible
 */

import request from 'supertest';
import app from '../../index';

describe('Route Validation Integration', () => {
  describe('Health endpoints', () => {
    it('should access /health', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should access /health/detailed', async () => {
      const response = await request(app).get('/health/detailed');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should access /health/live', async () => {
      const response = await request(app).get('/health/live');
      expect(response.status).toBe(200);
    });

    it('should access /health/ready', async () => {
      const response = await request(app).get('/health/ready');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('API documentation endpoints', () => {
    it('should access /api/v1/openapi.json', async () => {
      const response = await request(app).get('/api/v1/openapi.json');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('openapi');
    });

    it('should access /api/v1/docs (if enabled)', async () => {
      const response = await request(app).get('/api/v1/docs');
      // May return 200 (Swagger UI) or 404 (if disabled)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('CSRF token endpoint', () => {
    it('should access /api/csrf-token', async () => {
      const response = await request(app).get('/api/csrf-token');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('csrfToken');
    });
  });

  describe('Protected endpoints (require auth)', () => {
    it('should reject unauthenticated requests to /api/v1/jobs', async () => {
      const response = await request(app).get('/api/v1/jobs');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated requests to /api/v1/reports', async () => {
      const response = await request(app).get('/api/v1/reports');
      expect(response.status).toBe(401);
    });
  });

  describe('Public endpoints', () => {
    it('should access /metrics', async () => {
      const response = await request(app).get('/metrics');
      // May return 200 (metrics) or 404 (if disabled)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-route');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return proper error format', async () => {
      const response = await request(app).get('/api/v1/unknown-route');
      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.any(String),
      });
    });
  });
});
