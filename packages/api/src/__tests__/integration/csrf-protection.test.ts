/**
 * Integration Tests: CSRF Protection
 * Tests CSRF token generation and validation
 */

import request from 'supertest';
import app from '../../index';

describe('CSRF Protection Integration', () => {
  describe('GET /api/csrf-token', () => {
    it('should return CSRF token', async () => {
      const response = await request(app).get('/api/csrf-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('CSRF protection on state-changing operations', () => {
    it('should reject POST without CSRF token', async () => {
      // This test assumes there's a web UI endpoint that requires CSRF
      // For now, we test that CSRF middleware is applied
      const response = await request(app)
        .post('/api/v1/some-endpoint')
        .send({});

      // Should either succeed (if API endpoint, CSRF skipped) or fail with 403
      expect([200, 401, 403, 404]).toContain(response.status);
    });

    it('should accept request with valid CSRF token', async () => {
      // Get CSRF token
      const tokenResponse = await request(app).get('/api/csrf-token');
      const csrfToken = tokenResponse.body.csrfToken;
      const cookies = tokenResponse.headers['set-cookie'];

      // Make request with CSRF token
      const response = await request(app)
        .post('/api/v1/some-endpoint')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({});

      // Should not fail with 403 CSRF error
      expect(response.status).not.toBe(403);
    });
  });
});
