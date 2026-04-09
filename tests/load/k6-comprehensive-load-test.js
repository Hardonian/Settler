/**
 * Comprehensive k6 Load Test Script
 * Tests all major API endpoints under various load scenarios
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Custom metrics
const jobCreationRate = new Rate("job_creation_success");
const jobListRate = new Rate("job_list_success");
const jobGetRate = new Rate("job_get_success");
const reportGetRate = new Rate("report_get_success");
const webhookCreationRate = new Rate("webhook_creation_success");

const jobCreationDuration = new Trend("job_creation_duration");
const jobListDuration = new Trend("job_list_duration");
const jobGetDuration = new Trend("job_get_duration");
const reportGetDuration = new Trend("report_get_duration");

const errorCounter = new Counter("errors_total");

// Test configuration
export const options = {
  stages: [
    // Warm-up phase
    { duration: "1m", target: 10 },
    // Ramp up to normal load
    { duration: "2m", target: 50 },
    // Stay at normal load
    { duration: "5m", target: 50 },
    // Spike test
    { duration: "1m", target: 200 },
    { duration: "2m", target: 200 },
    // Ramp down
    { duration: "2m", target: 50 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"],
    http_req_failed: ["rate<0.01"],
    job_creation_success: ["rate>0.95"],
    job_list_success: ["rate>0.95"],
    job_get_success: ["rate>0.95"],
    report_get_success: ["rate>0.95"],
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
    tags: { name: url },
  };

  if (body) {
    params.body = JSON.stringify(body);
  }

  return http.request(method, `${BASE_URL}${url}`, body ? JSON.stringify(body) : null, params);
}

// Test scenario: Create reconciliation job
function testCreateJob() {
  const startTime = Date.now();
  const jobName = `Load Test Job ${__VU}-${__ITER}-${Date.now()}`;

  const response = authenticatedRequest("POST", "/api/v1/jobs", {
    name: jobName,
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
        { field: "order_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
      ],
    },
  });

  const duration = Date.now() - startTime;
  const success = check(response, {
    "create job status is 201": (r) => r.status === 201,
    "create job has job ID": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.id;
      } catch {
        return false;
      }
    },
  });

  jobCreationRate.add(success);
  jobCreationDuration.add(duration);

  if (!success) {
    errorCounter.add(1);
    console.error(`Failed to create job: ${response.status} - ${response.body}`);
  }

  return success ? JSON.parse(response.body).data.id : null;
}

// Test scenario: List jobs
function testListJobs() {
  const startTime = Date.now();
  const response = authenticatedRequest("GET", "/api/v1/jobs?limit=50&page=1");

  const duration = Date.now() - startTime;
  const success = check(response, {
    "list jobs status is 200": (r) => r.status === 200,
    "list jobs returns data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  jobListRate.add(success);
  jobListDuration.add(duration);

  if (!success) {
    errorCounter.add(1);
  }

  return success;
}

// Test scenario: Get job by ID
function testGetJob(jobId) {
  if (!jobId) return false;

  const startTime = Date.now();
  const response = authenticatedRequest("GET", `/api/v1/jobs/${jobId}`);

  const duration = Date.now() - startTime;
  const success = check(response, {
    "get job status is 200": (r) => r.status === 200,
    "get job returns data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.id === jobId;
      } catch {
        return false;
      }
    },
  });

  jobGetRate.add(success);
  jobGetDuration.add(duration);

  if (!success) {
    errorCounter.add(1);
  }

  return success;
}

// Test scenario: Get reconciliation report
function testGetReport(jobId) {
  if (!jobId) return false;

  const startTime = Date.now();
  const response = authenticatedRequest("GET", `/api/v1/reports/${jobId}`);

  const duration = Date.now() - startTime;
  const success = check(response, {
    "get report status is 200 or 404": (r) => r.status === 200 || r.status === 404,
    "get report returns data": (r) => {
      if (r.status === 404) return true;
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch {
        return false;
      }
    },
  });

  reportGetRate.add(success);
  reportGetDuration.add(duration);

  if (!success) {
    errorCounter.add(1);
  }

  return success;
}

// Test scenario: Create webhook
function testCreateWebhook() {
  const startTime = Date.now();
  const webhookUrl = `https://webhook.site/${__VU}-${__ITER}-${Date.now()}`;

  const response = authenticatedRequest("POST", "/api/v1/webhooks", {
    url: webhookUrl,
    events: ["reconciliation.completed", "reconciliation.failed"],
  });

  const duration = Date.now() - startTime;
  const success = check(response, {
    "create webhook status is 201": (r) => r.status === 201,
    "create webhook has webhook ID": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.id;
      } catch {
        return false;
      }
    },
  });

  webhookCreationRate.add(success);

  if (!success) {
    errorCounter.add(1);
  }

  return success ? JSON.parse(response.body).data.id : null;
}

// Test scenario: List adapters
function testListAdapters() {
  const response = authenticatedRequest("GET", "/api/v1/adapters");

  const success = check(response, {
    "list adapters status is 200": (r) => r.status === 200,
    "list adapters returns data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    errorCounter.add(1);
  }

  return success;
}

// Main test function
export default function () {
  // Create a job (30% of requests)
  let jobId = null;
  if (Math.random() < 0.3) {
    jobId = testCreateJob();
    sleep(1);
  }

  // List jobs (40% of requests)
  if (Math.random() < 0.4) {
    testListJobs();
    sleep(0.5);
  }

  // Get job (20% of requests, if we have a job ID)
  if (jobId && Math.random() < 0.2) {
    testGetJob(jobId);
    sleep(0.5);
  }

  // Get report (10% of requests, if we have a job ID)
  if (jobId && Math.random() < 0.1) {
    testGetReport(jobId);
    sleep(0.5);
  }

  // Create webhook (5% of requests)
  if (Math.random() < 0.05) {
    testCreateWebhook();
    sleep(1);
  }

  // List adapters (5% of requests)
  if (Math.random() < 0.05) {
    testListAdapters();
    sleep(0.5);
  }

  sleep(1);
}

// Generate HTML report
export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
    "load-test-report.html": htmlReport(data),
  };
}
