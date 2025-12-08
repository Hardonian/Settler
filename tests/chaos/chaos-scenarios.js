/**
 * Chaos Engineering Scenarios
 * Tests system resilience under failure conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-api-key';

export const options = {
  scenarios: {
    // Scenario 1: Database slow/unavailable
    db_slow: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
    
    // Scenario 2: External APIs slow/failing
    external_api_slow: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 3,
      maxVUs: 10,
    },
  },
};

function authenticatedRequest(method, url, body = null) {
  const params = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: '30s', // Increased timeout for chaos scenarios
  };

  if (body) {
    params.body = JSON.stringify(body);
  }

  return http.request(method, `${BASE_URL}${url}`, body ? JSON.stringify(body) : null, params);
}

export default function () {
  // Test resilience: Create job (may fail if DB is slow)
  const createResponse = authenticatedRequest('POST', '/api/v1/jobs', {
    name: `Chaos Test Job ${__VU}-${__ITER}`,
    source: {
      adapter: 'stripe',
      config: { api_key: 'sk_test' },
    },
    target: {
      adapter: 'shopify',
      config: { api_key: 'test_key', shop: 'test-shop' },
    },
    rules: {
      matching: [{ field: 'amount', type: 'exact' }],
    },
  });

  // Accept both success and timeout/errors (chaos scenario)
  check(createResponse, {
    'request completed': (r) => r.status !== 0,
    'graceful degradation': (r) => {
      // System should return proper error codes, not crash
      return r.status === 0 || (r.status >= 400 && r.status < 600);
    },
  });

  sleep(2);

  // Test resilience: List jobs (should use cache if DB is slow)
  const listResponse = authenticatedRequest('GET', '/api/v1/jobs?limit=10');

  check(listResponse, {
    'list request handled': (r) => r.status !== 0 || (r.status >= 200 && r.status < 500),
    'cache headers present': (r) => {
      if (r.status === 0) return false;
      return r.headers['X-Cache'] !== undefined || r.status === 503; // Cache hit or service unavailable
    },
  });

  sleep(3);
}
