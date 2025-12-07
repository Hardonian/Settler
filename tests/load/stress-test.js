import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 500 },
    { duration: "5m", target: 1000 }, // Stress level
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"], // Relaxed for stress test
    http_req_failed: ["rate<0.05"], // <5% errors acceptable under stress
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

  // Stress test critical endpoints
  const res = http.post(`${baseUrl}/api/reconcile`, JSON.stringify({
    source: "shopify",
    target: "stripe",
    dateRange: { start: "2026-01-01", end: "2026-01-31" },
  }), {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 200 or 429": (r) => r.status === 200 || r.status === 429, // Rate limit OK
    "response received": (r) => r.status > 0,
  });

  sleep(2);
}
