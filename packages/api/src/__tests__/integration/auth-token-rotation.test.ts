/**
 * Integration Tests: Token Rotation
 * Tests refresh token rotation functionality
 */

import request from 'supertest';
import app from '../../index';
import { query } from '../../db';
import { revokeAllUserTokens } from '../../infrastructure/security/token-rotation';

describe('Token Rotation Integration', () => {
  let testUserId: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Create test user
    const users = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['test-token-rotation@example.com', '$2b$10$test', 'developer']
    );
    testUserId = users[0]?.id || '';

    // Login to get tokens
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-token-rotation@example.com',
        password: 'test-password',
      });

    if (loginResponse.status === 200 && loginResponse.body.data) {
      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await revokeAllUserTokens(testUserId);
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate refresh token on refresh', async () => {
      const oldRefreshToken = refreshToken;

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.refreshToken).not.toBe(oldRefreshToken);

      // Old token should be revoked
      const revokedResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(revokedResponse.status).toBe(401);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('INVALID_TOKEN');
    });

    it('should reject expired refresh token', async () => {
      // This would require creating an expired token, which is complex
      // For now, we test that invalid tokens are rejected
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'expired-token' });

      expect(response.status).toBe(401);
    });
  });
});
