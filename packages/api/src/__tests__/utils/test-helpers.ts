/**
 * Test Helper Utilities
 * Common utilities for writing tests
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';

/**
 * Create a mock Express request
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<AuthRequest> {
  return {
    method: 'GET',
    path: '/',
    headers: {},
    query: {},
    params: {},
    body: {},
    ip: '127.0.0.1',
    ...overrides,
  };
}

/**
 * Create a mock Express response
 */
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create a mock Express next function
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Wait for async operations to complete
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create test user data
 */
export function createTestUser(overrides: Partial<{
  id: string;
  email: string;
  password: string;
  role: string;
}> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'test-password',
    role: 'developer',
    ...overrides,
  };
}

/**
 * Create test job data
 */
export function createTestJob(overrides: Partial<{
  id: string;
  userId: string;
  name: string;
  source: Record<string, unknown>;
  target: Record<string, unknown>;
  rules: Record<string, unknown>;
}> = {}) {
  return {
    id: 'test-job-id',
    userId: 'test-user-id',
    name: 'Test Job',
    source: { adapter: 'stripe', config: {} },
    target: { adapter: 'shopify', config: {} },
    rules: { matching: [] },
    ...overrides,
  };
}

/**
 * Assert error response format
 */
export function expectErrorResponse(res: Partial<Response>, statusCode: number, errorCode: string) {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: errorCode,
      message: expect.any(String),
    })
  );
}

/**
 * Assert success response format
 */
export function expectSuccessResponse(res: Partial<Response>, statusCode: number = 200) {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.anything(),
    })
  );
}
