/**
 * 10x Peak Load Stress Test
 *
 * Simulates 10x the projected peak user load to validate scalability.
 *
 * Assumptions:
 * - Normal peak load: 100 concurrent users
 * - 10x peak load: 1000 concurrent users
 * - Test duration: 30 minutes
 * - Detailed metrics collection for latency, resource consumption, and cost analysis
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// ============================================================================
// Custom Metrics
// ============================================================================

// Success rates
const jobCreationSuccess = new Rate("job_creation_success");
const jobListSuccess = new Rate("job_list_success");
const jobGetSuccess = new Rate("job_get_success");
const reportGetSuccess = new Rate("report_get_success");
const webhookCreationSuccess = new Rate("webhook_creation_success");

// Latency metrics (p50, p95, p99)
const jobCreationLatency = new Trend("job_creation_latency_ms", true);
const jobListLatency = new Trend("job_list_latency_ms", true);
const jobGetLatency = new Trend("job_get_latency_ms", true);
const reportGetLatency = new Trend("report_get_latency_ms", true);
const apiLatency = new Trend("api_latency_ms", true);

// Resource consumption metrics
const requestsPerSecond = new Gauge("requests_per_second");
const activeUsers = new Gauge("active_users");
const errorRate = new Gauge("error_rate_percent");

// Cost metrics (estimated)
const estimatedCostPerRequest = new Counter("estimated_cost_usd");
const totalRequests = new Counter("total_requests");

// Error tracking
const errorCounter = new Counter("errors_total");
const errorByType = new Counter("errors_by_type");

// ============================================================================
// Test Configuration - 10x Peak Load
// ============================================================================

export const options = {
  stages: [
    // Phase 1: Warm-up (5% of peak)
    { duration: "2m", target: 50 },

    // Phase 2: Ramp to normal peak (100% of normal peak)
    { duration: "3m", target: 100 },
    { duration: "5m", target: 100 }, // Sustain normal peak

    // Phase 3: Ramp to 2x peak
    { duration: "2m", target: 200 },
    { duration: "3m", target: 200 },

    // Phase 4: Ramp to 5x peak
    { duration: "3m", target: 500 },
    { duration: "3m", target: 500 },

    // Phase 5: Ramp to 10x peak (STRESS TEST)
    { duration: "3m", target: 1000 },
    { duration: "5m", target: 1000 }, // Sustain 10x peak load

    // Phase 6: Gradual ramp down
    { duration: "2m", target: 500 },
    { duration: "2m", target: 200 },
    { duration: "2m", target: 100 },
    { duration: "1m", target: 0 },
  ],

  thresholds: {
    // Latency thresholds (must pass at 10x load)
    http_req_duration: [
      "p(50)<100", // 50% of requests < 100ms
      "p(95)<500", // 95% of requests < 500ms
      "p(99)<1000", // 99% of requests < 1s
      "max<5000", // No request > 5s
    ],

    // Error rate thresholds
    http_req_failed: ["rate<0.05"], // < 5% error rate

    // Success rate thresholds
    job_creation_success: ["rate>0.90"], // > 90% success
    job_list_success: ["rate>0.95"],
    job_get_success: ["rate>0.95"],
    report_get_success: ["rate>0.90"],

    // Resource thresholds
    errors_total: ["count<1000"], // < 1000 total errors
  },

  // Summary output
  summaryTrendStats: [
    "avg",
    "min",
    "med",
    "max",
    "p(50)",
    "p(90)",
    "p(95)",
    "p(99)",
    "p(99.9)",
    "p(99.99)",
  ],
};

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_KEY = __ENV.API_KEY || "test-api-key";
const COST_PER_1000_REQUESTS = parseFloat(__ENV.COST_PER_1K_REQUESTS || "0.01"); // $0.01 per 1K requests

// ============================================================================
// Helper Functions
// ============================================================================

function authenticatedRequest(method, url, body = null, tags = {}) {
  const params = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": `k6-load-test/${__VU}`,
    },
    tags: {
      name: url,
      method: method,
      ...tags,
    },
    timeout: "30s",
  };

  if (body) {
    params.body = JSON.stringify(body);
  }

  const startTime = Date.now();
  const response = http.request(
    method,
    `${BASE_URL}${url}`,
    body ? JSON.stringify(body) : null,
    params
  );
  const duration = Date.now() - startTime;

  // Track latency
  apiLatency.add(duration);

  // Track cost (estimated)
  estimatedCostPerRequest.add(COST_PER_1000_REQUESTS / 1000);
  totalRequests.add(1);

  return { response, duration };
}

// ============================================================================
// Test Scenarios
// ============================================================================

function testCreateJob() {
  return group("Create Job", () => {
    const jobName = `10x-Load-Test-${__VU}-${__ITER}-${Date.now()}`;

    const { response, duration } = authenticatedRequest("POST", "/api/v1/jobs", {
      name: jobName,
      source: {
        adapter: "stripe",
        config: {
          api_key: "sk_test_load_test_key",
        },
      },
      target: {
        adapter: "shopify",
        config: {
          api_key: "test_shopify_key",
          shop: `test-shop-${__VU}`,
        },
      },
      rules: {
        matching: [
          { field: "order_id", type: "exact" },
          { field: "amount", type: "exact", tolerance: 0.01 },
        ],
      },
    });

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
      "create job response time < 500ms": () => duration < 500,
    });

    jobCreationSuccess.add(success);
    jobCreationLatency.add(duration);

    if (!success) {
      errorCounter.add(1);
      errorByType.add(1, { type: "job_creation" });
    }

    return success ? JSON.parse(response.body).data.id : null;
  });
}

function testListJobs() {
  return group("List Jobs", () => {
    const page = Math.floor(Math.random() * 10) + 1;
    const { response, duration } = authenticatedRequest(
      "GET",
      `/api/v1/jobs?limit=50&page=${page}`
    );

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
      "list jobs response time < 200ms": () => duration < 200,
    });

    jobListSuccess.add(success);
    jobListLatency.add(duration);

    if (!success) {
      errorCounter.add(1);
      errorByType.add(1, { type: "job_list" });
    }

    return success;
  });
}

function testGetJob(jobId) {
  if (!jobId) return false;

  return group("Get Job", () => {
    const { response, duration } = authenticatedRequest("GET", `/api/v1/jobs/${jobId}`);

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
      "get job response time < 100ms": () => duration < 100,
    });

    jobGetSuccess.add(success);
    jobGetLatency.add(duration);

    if (!success) {
      errorCounter.add(1);
      errorByType.add(1, { type: "job_get" });
    }

    return success;
  });
}

function testGetReport(jobId) {
  if (!jobId) return false;

  return group("Get Report", () => {
    const { response, duration } = authenticatedRequest("GET", `/api/v1/reports/${jobId}`);

    const success = check(response, {
      "get report status is 200 or 404": (r) => r.status === 200 || r.status === 404,
      "get report response time < 300ms": () => duration < 300,
    });

    reportGetSuccess.add(success);
    reportGetLatency.add(duration);

    if (!success) {
      errorCounter.add(1);
      errorByType.add(1, { type: "report_get" });
    }

    return success;
  });
}

function testCreateWebhook() {
  return group("Create Webhook", () => {
    const webhookUrl = `https://webhook.site/${__VU}-${__ITER}-${Date.now()}`;
    const { response, duration } = authenticatedRequest("POST", "/api/v1/webhooks", {
      url: webhookUrl,
      events: ["reconciliation.completed", "reconciliation.failed"],
    });

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

    webhookCreationSuccess.add(success);

    if (!success) {
      errorCounter.add(1);
      errorByType.add(1, { type: "webhook_creation" });
    }

    return success;
  });
}

// ============================================================================
// Main Test Function
// ============================================================================

export default function () {
  // Track active users
  activeUsers.add(__VU);

  // Simulate realistic user behavior with weighted distribution
  const random = Math.random();
  let jobId = null;

  // 30% of requests: Create job
  if (random < 0.3) {
    jobId = testCreateJob();
    sleep(1);
  }
  // 40% of requests: List jobs
  else if (random < 0.7) {
    testListJobs();
    sleep(0.5);
  }
  // 15% of requests: Get job (if we have a job ID)
  else if (random < 0.85 && jobId) {
    testGetJob(jobId);
    sleep(0.5);
  }
  // 10% of requests: Get report (if we have a job ID)
  else if (random < 0.95 && jobId) {
    testGetReport(jobId);
    sleep(0.5);
  }
  // 5% of requests: Create webhook
  else {
    testCreateWebhook();
    sleep(1);
  }

  // Update metrics
  requestsPerSecond.add(1);

  sleep(0.5); // Think time between requests
}

// ============================================================================
// Teardown
// ============================================================================

export function teardown(data) {
  console.log("Test completed. Generating detailed report...");
}

// ============================================================================
// Summary Report
// ============================================================================

export function handleSummary(data) {
  const summary = {
    // Overall statistics
    totalRequests: data.metrics.http_reqs.values.count,
    totalErrors: data.metrics.errors_total.values.count,
    totalDuration: data.state.testRunDurationMs,

    // Latency statistics
    latency: {
      p50: data.metrics.http_req_duration.values["p(50)"],
      p95: data.metrics.http_req_duration.values["p(95)"],
      p99: data.metrics.http_req_duration.values["p(99)"],
      max: data.metrics.http_req_duration.values.max,
      avg: data.metrics.http_req_duration.values.avg,
    },

    // Success rates
    successRates: {
      jobCreation: data.metrics.job_creation_success.values.rate,
      jobList: data.metrics.job_list_success.values.rate,
      jobGet: data.metrics.job_get_success.values.rate,
      reportGet: data.metrics.report_get_success.values.rate,
    },

    // Resource consumption
    resources: {
      peakVUs: data.metrics.vus_max.values.max,
      avgVUs: data.metrics.vus.values.avg,
      requestsPerSecond: data.metrics.http_reqs.values.rate,
    },

    // Cost analysis
    cost: {
      estimatedTotalCost: data.metrics.estimated_cost_usd.values.count,
      costPer1000Requests: COST_PER_1000_REQUESTS,
      costPerUser:
        data.metrics.estimated_cost_usd.values.count / (data.metrics.vus_max.values.max || 1),
    },

    // Error analysis
    errors: {
      total: data.metrics.errors_total.values.count,
      rate: data.metrics.http_req_failed.values.rate,
      byType: data.metrics.errors_by_type.values,
    },

    // Thresholds
    thresholds: data.root_group.checks,
  };

  // Generate reports
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "load-test-report.html": htmlReport(data),
    "load-test-summary.json": JSON.stringify(summary, null, 2),
  };
}
