/**
 * k6 Load Test Script
 * Tests key API paths: creating reconciliations, listing results, querying summaries
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const reconciliationCreationRate = new Rate("reconciliation_creation_success");
const reconciliationListRate = new Rate("reconciliation_list_success");
const reconciliationSummaryRate = new Rate("reconciliation_summary_success");
const reconciliationCreationDuration = new Trend("reconciliation_creation_duration");
const reconciliationListDuration = new Trend("reconciliation_list_duration");
const reconciliationSummaryDuration = new Trend("reconciliation_summary_duration");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 users
    { duration: "1m", target: 50 }, // Ramp up to 50 users
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 200 }, // Ramp up to 200 users (10x scale)
    { duration: "5m", target: 200 }, // Stay at 200 users
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"], // 95th percentile < 200ms, 99th < 500ms
    http_req_failed: ["rate<0.01"], // Error rate < 1%
    reconciliation_creation_success: ["rate>0.95"], // 95% success rate
    reconciliation_list_success: ["rate>0.95"],
    reconciliation_summary_success: ["rate>0.95"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_KEY = __ENV.API_KEY || "test-api-key";

// Helper function to make authenticated requests
function authenticatedRequest(method, url, body = null) {
  const params = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    params.body = JSON.stringify(body);
  }

  return http.request(method, `${BASE_URL}${url}`, body ? JSON.stringify(body) : null, params);
}

export default function () {
  // Test 1: Create reconciliation job
  const createStartTime = Date.now();
  const createResponse = authenticatedRequest("POST", "/api/v1/jobs", {
    name: `Load Test Job ${__VU}-${__ITER}`,
    source: {
      adapter: "stripe",
      config: {
        api_key: "sk_test_load_test",
      },
    },
    target: {
      adapter: "shopify",
      config: {
        api_key: "test_shopify_key",
        shop: "test-shop",
      },
    },
    rules: {
      matching: [
        {
          field: "amount",
          type: "exact",
        },
      ],
    },
  });

  const createDuration = Date.now() - createStartTime;
  const createSuccess = check(createResponse, {
    "create job status is 201": (r) => r.status === 201,
    "create job has job ID": (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.id;
    },
  });

  reconciliationCreationRate.add(createSuccess);
  reconciliationCreationDuration.add(createDuration);

  if (!createSuccess) {
    console.error(`Failed to create job: ${createResponse.status} - ${createResponse.body}`);
  }

  sleep(1);

  // Test 2: List jobs
  const listStartTime = Date.now();
  const listResponse = authenticatedRequest("GET", "/api/v1/jobs?limit=50");

  const listDuration = Date.now() - listStartTime;
  const listSuccess = check(listResponse, {
    "list jobs status is 200": (r) => r.status === 200,
    "list jobs returns data": (r) => {
      const body = JSON.parse(r.body);
      return body.data && Array.isArray(body.data);
    },
  });

  reconciliationListRate.add(listSuccess);
  reconciliationListDuration.add(listDuration);

  sleep(1);

  // Test 3: Get job summary (if job was created)
  if (createSuccess) {
    const body = JSON.parse(createResponse.body);
    const jobId = body.data.id;

    const summaryStartTime = Date.now();
    const summaryResponse = authenticatedRequest("GET", `/api/v1/reconciliations/${jobId}/summary`);

    const summaryDuration = Date.now() - summaryStartTime;
    const summarySuccess = check(summaryResponse, {
      "summary status is 200": (r) => r.status === 200 || r.status === 404, // 404 is OK if no execution yet
      "summary returns data": (r) => {
        if (r.status === 404) return true;
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      },
    });

    reconciliationSummaryRate.add(summarySuccess);
    reconciliationSummaryDuration.add(summaryDuration);
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
