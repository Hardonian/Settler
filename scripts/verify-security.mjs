#!/usr/bin/env node
import { readFileSync } from "node:fs";

const requiredFileChecks = [
  {
    file: "packages/web/src/lib/api/v1/recon/core.ts",
    checks: [
      "SETTLER_RATE_LIMITED",
      "SETTLER_AUTH_REQUIRED",
      "applyRateLimit",
      "setCachingHeaders",
      "checkConditionalGet",
      "strict-transport-security",
      "x-request-id",
    ],
  },
  {
    file: "packages/web/src/lib/security/rate-limiter.ts",
    checks: ["checkRateLimit", "X-RateLimit-Limit", "Retry-After"],
  },
  {
    file: "packages/web/src/lib/security/rate-limiter-redis.ts",
    checks: ["safeRedisOperation", "checkRedisRateLimit", "X-RateLimit-Remaining"],
  },
  {
    file: "packages/web/src/lib/security/headers.ts",
    checks: [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
    ],
  },
  {
    file: "packages/api/src/routes/webhooks.ts",
    checks: ["express-rate-limit", "createRawBodyMiddleware", "verifyWebhookSignature"],
  },
  {
    file: "docs/packages/api/OWASP_HARDENING.md",
    checks: ["OWASP Top 10", "rate limiting", "Broken Access Control"],
  },
];

const failures = [];

for (const check of requiredFileChecks) {
  let content = "";
  try {
    content = readFileSync(check.file, "utf8");
  } catch (error) {
    failures.push(
      `${check.file}: cannot read (${error instanceof Error ? error.message : String(error)})`
    );
    continue;
  }

  for (const token of check.checks) {
    if (!content.includes(token)) {
      failures.push(`${check.file}: missing token '${token}'`);
    }
  }
}

if (failures.length > 0) {
  console.error("❌ Security verification failed.");
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log(
  "✅ Security verification passed (OWASP controls, rate limiting, and caching hooks present)."
);
