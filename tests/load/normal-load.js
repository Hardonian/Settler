import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests < 500ms
    http_req_failed: ["rate<0.01"], // <1% errors
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

  // Test API endpoints
  const endpoints = [
    "/api/health",
    "/api/reconcile",
    "/api/integrations",
  ];

  for (const endpoint of endpoints) {
    const res = http.get(`${baseUrl}${endpoint}`);
    check(res, {
      "status is 200": (r) => r.status === 200,
      "response time < 500ms": (r) => r.timings.duration < 500,
    });
    sleep(1);
  }
}
