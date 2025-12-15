/**
 * Integration Testing Helpers
 * 
 * Utilities for testing console routes end-to-end.
 */

import { NextRequest } from 'next/server';
import { createMockAuthContext } from './console-test-utils';

/**
 * Create authenticated request for testing
 */
export function createAuthenticatedRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body } = options;

  // Add auth headers
  const authHeaders = {
    ...headers,
    cookie: 'sb-access-token=test-token; sb-refresh-token=test-refresh',
  };

  const request = new NextRequest(url, {
    method,
    headers: new Headers(authHeaders),
  });

  return request;
}

/**
 * Assert API response structure
 */
export function assertApiResponse(
  response: Response,
  expectedStatus: number
): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`
    );
  }
}

/**
 * Assert response has data field
 */
export async function assertResponseData(response: Response): Promise<unknown> {
  const data = await response.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Response does not contain valid JSON');
  }
  return data;
}

/**
 * Assert response has error field
 */
export async function assertResponseError(response: Response): Promise<string> {
  const data = await response.json();
  if (!data.error || typeof data.error !== 'string') {
    throw new Error('Response does not contain error message');
  }
  return data.error;
}
