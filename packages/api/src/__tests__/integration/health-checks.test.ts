/**
 * Integration Tests: Health Checks
 * Tests health check endpoints including Redis and Sentry checks
 */

import request from 'supertest';
import app from '../../index';

describe('Health Checks Integration', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'settler-api');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health with dependency checks', async () => {
      const response = await request(app).get('/health/detailed');

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('redis');
      expect(response.body.checks).toHaveProperty('sentry');
    });
  });

  describe('GET /health/live', () => {
    it('should always return OK if process is alive', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status based on dependencies', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
      expect(response.body).toHaveProperty('status');
      expect(['ready', 'not_ready']).toContain(response.body.status);
    });
  });
});
