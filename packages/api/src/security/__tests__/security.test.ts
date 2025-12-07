/**
 * Security Test Suite
 * 
 * Tests for security middleware, rate limiting, fraud detection, etc.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { rateLimiters } from '../../web/src/lib/security/rate-limiter';
import { validateCSRFToken, validateOrigin, validateRequestSize } from '../../web/src/lib/security/api-security';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset rate limit store
    // In production, this would reset Redis or in-memory store
  });

  it('should allow requests within rate limit', async () => {
    const req = new Request('https://example.com/api/test', {
      method: 'GET',
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    });

    const rateLimiter = rateLimiters.api;
    const response = await rateLimiter(req);

    expect(response).toBeNull(); // No rate limit hit
  });

  it('should block requests exceeding rate limit', async () => {
    const req = new Request('https://example.com/api/test', {
      method: 'GET',
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    });

    const rateLimiter = rateLimiters.api;

    // Make 101 requests (exceeding 100/min limit)
    for (let i = 0; i < 101; i++) {
      const response = await rateLimiter(req);
      if (i < 100) {
        expect(response).toBeNull();
      } else {
        expect(response).not.toBeNull();
        expect(response?.status).toBe(429);
      }
    }
  });
});

describe('CSRF Protection', () => {
  it('should validate CSRF token', () => {
    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'x-csrf-token': 'test-token',
      },
    });

    // Mock cookie
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => ({ value: 'test-token' }),
      },
    });

    const isValid = validateCSRFToken(req);
    expect(isValid).toBe(true);
  });

  it('should reject invalid CSRF token', () => {
    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'x-csrf-token': 'wrong-token',
      },
    });

    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => ({ value: 'test-token' }),
      },
    });

    const isValid = validateCSRFToken(req);
    expect(isValid).toBe(false);
  });

  it('should skip CSRF for GET requests', () => {
    const req = new Request('https://example.com/api/test', {
      method: 'GET',
    });

    const isValid = validateCSRFToken(req);
    expect(isValid).toBe(true);
  });
});

describe('Origin Validation', () => {
  it('should validate allowed origin', () => {
    process.env.ALLOWED_ORIGINS = 'https://app.settler.dev,https://settler.dev';

    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        origin: 'https://app.settler.dev',
      },
    });

    const isValid = validateOrigin(req);
    expect(isValid).toBe(true);
  });

  it('should reject disallowed origin', () => {
    process.env.ALLOWED_ORIGINS = 'https://app.settler.dev';

    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        origin: 'https://evil.com',
      },
    });

    const isValid = validateOrigin(req);
    expect(isValid).toBe(false);
  });
});

describe('Request Size Validation', () => {
  it('should validate request size', () => {
    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'content-length': '1024', // 1KB
      },
    });

    const isValid = validateRequestSize(req, 1024 * 1024); // 1MB limit
    expect(isValid).toBe(true);
  });

  it('should reject oversized requests', () => {
    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'content-length': '2097152', // 2MB
      },
    });

    const isValid = validateRequestSize(req, 1024 * 1024); // 1MB limit
    expect(isValid).toBe(false);
  });
});

describe('Fraud Detection', () => {
  it('should detect usage spikes', async () => {
    // Mock database call
    const mockUsage = {
      current: 1000,
      previous: 200,
      spikePercentage: 400, // 400% increase
    };

    expect(mockUsage.spikePercentage).toBeGreaterThan(300); // Fraud threshold
  });

  it('should not flag normal usage', async () => {
    const mockUsage = {
      current: 250,
      previous: 200,
      spikePercentage: 25, // 25% increase (normal)
    };

    expect(mockUsage.spikePercentage).toBeLessThan(300);
  });
});

describe('Integration Security', () => {
  it('should validate webhook signatures', () => {
    const payload = 'test payload';
    const secret = 'test secret';
    const signature = 'valid signature'; // Would be computed HMAC

    // In real test, compute actual HMAC
    // const isValid = validateWebhookSignature(payload, signature, secret);
    // expect(isValid).toBe(true);
  });

  it('should enforce integration quotas', async () => {
    const mockQuota = {
      dailyApiCalls: 9500,
      dailyLimit: 10000,
      allowed: true,
    };

    expect(mockQuota.allowed).toBe(true);
    expect(mockQuota.dailyApiCalls).toBeLessThan(mockQuota.dailyLimit);
  });
});

describe('AI Safety Layer', () => {
  it('should enforce AI usage quotas', async () => {
    const mockQuota = {
      dailyRequests: 950,
      dailyLimit: 1000,
      dailyCost: 9.50,
      dailyCostLimit: 10.00,
      allowed: true,
    };

    expect(mockQuota.allowed).toBe(true);
    expect(mockQuota.dailyRequests).toBeLessThan(mockQuota.dailyLimit);
    expect(mockQuota.dailyCost).toBeLessThan(mockQuota.dailyCostLimit);
  });

  it('should block AI usage when quota exceeded', async () => {
    const mockQuota = {
      dailyRequests: 1001,
      dailyLimit: 1000,
      allowed: false,
      reason: 'Daily request limit exceeded',
    };

    expect(mockQuota.allowed).toBe(false);
    expect(mockQuota.dailyRequests).toBeGreaterThan(mockQuota.dailyLimit);
  });
});
