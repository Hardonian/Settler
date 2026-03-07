#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { evaluateTenantGuardrails, evaluateCoverageGap } from "./security/tenant-guardrails.mjs";

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, "artifacts", "security");
mkdirSync(outputDir, { recursive: true });

const staticControlChecks = [
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
    file: "packages/web/middleware.ts",
    checks: ["/api/:path*", "addSecurityHeaders(response)", "middleware.unexpected_error"],
  },
  {
    file: "packages/web/src/middleware/security-headers.ts",
    checks: [
      "Content-Security-Policy-Report-Only",
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Permissions-Policy",
    ],
  },
  {
    file: "docs/launch/ARTIFACT_CAPTURE.md",
    checks: ["primary", "fallback", "manifest"],
  },
];

function runStaticChecks() {
  const results = [];
  for (const target of staticControlChecks) {
    try {
      const content = readFileSync(path.join(repoRoot, target.file), "utf8");
      const missing = target.checks.filter((token) => !content.includes(token));
      results.push({
        file: target.file,
        status: missing.length ? "missing_control" : "present",
        missing,
      });
    } catch (error) {
      results.push({
        file: target.file,
        status: "unreadable",
        missing: target.checks,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function evaluateRateLimiterProductionGuardrail() {
  const requireDistributed = process.env.REQUIRE_REDIS_RATE_LIMIT === "1";
  const isProductionMode =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const hasRedis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (!isProductionMode) {
    return {
      status: "skipped",
      message: "Production limiter enforcement check skipped (non-production environment).",
    };
  }

  if (hasRedis) {
    return {
      status: "present",
      message: "Distributed Redis limiter configuration detected for production.",
    };
  }

  if (requireDistributed) {
    return {
      status: "missing_control",
      message:
        "REQUIRE_REDIS_RATE_LIMIT=1 but UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. Production multi-instance rate limiting would drift.",
    };
  }

  return {
    status: "warning",
    message:
      "Production mode without Redis limiter configuration. Process-local fallback may drift across instances. Set REQUIRE_REDIS_RATE_LIMIT=1 to enforce.",
  };
}

function main() {
  const staticResults = runStaticChecks();
  const tenantResults = evaluateTenantGuardrails(repoRoot);
  const limiterGuardrail = evaluateRateLimiterProductionGuardrail();
  const coverageGap = evaluateCoverageGap(repoRoot);

  const staticFailures = staticResults.filter((item) => item.status !== "present");
  const tenantFailures = tenantResults.filter((item) => item.status !== "guardrail_present");
  const limiterFailures = limiterGuardrail.status === "missing_control" ? [limiterGuardrail] : [];

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: {
      static: "Control-presence verification (not dynamic attack simulation).",
      tenantGuardrails:
        "Token-presence checks on selected high-risk route files. This verifies expected code patterns exist, not that they are correctly implemented at runtime. Requires runtime/manual follow-up for full isolation proof.",
    },
    staticResults,
    tenantIsolation: tenantResults,
    tenantCoverageGap: coverageGap,
    limiterGuardrail,
    passed:
      staticFailures.length === 0 && tenantFailures.length === 0 && limiterFailures.length === 0,
  };

  const summaryPath = path.join(outputDir, "verify-security-summary.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

  printSection("Static/config verification");
  for (const result of staticResults) {
    if (result.status === "present") {
      console.log(`✅ ${result.file}`);
    } else {
      console.log(`❌ ${result.file}`);
      if (result.error) console.log(`   ${result.error}`);
      for (const token of result.missing) console.log(`   missing: ${token}`);
    }
  }

  printSection("Tenant-isolation guardrail checks");
  for (const result of tenantResults) {
    const statusIcon = result.status === "guardrail_present" ? "✅" : "❌";
    console.log(`${statusIcon} ${result.route} [${result.classification}]`);
    if (result.error) console.log(`   ${result.error}`);
    if (result.missingTokens.length) {
      for (const missing of result.missingTokens) {
        console.log(`   missing guardrail: ${missing}`);
      }
    }
    console.log(`   runtime follow-up required: ${result.manualValidation}`);
  }

  printSection("Tenant guardrail route coverage");
  console.log(`Total API routes discovered: ${coverageGap.totalRoutes}`);
  console.log(`Guardrail-checked routes: ${coverageGap.classifiedRoutes}`);
  console.log(`Exempt prefixes (admin/cron/docs/health/webhooks): ${coverageGap.exemptPrefixes}`);
  console.log(`Unclassified routes: ${coverageGap.unclassifiedRoutes.length}`);
  if (coverageGap.unclassifiedRoutes.length > 0) {
    console.log(
      "⚠️  The following routes are not covered by tenant guardrail checks or exempt prefixes."
    );
    console.log(
      "   This is informational — add high-risk routes to highRiskRouteRules in tenant-guardrails.mjs."
    );
    for (const route of coverageGap.unclassifiedRoutes.slice(0, 20)) {
      console.log(`   - ${route}`);
    }
    if (coverageGap.unclassifiedRoutes.length > 20) {
      console.log(`   ... and ${coverageGap.unclassifiedRoutes.length - 20} more`);
    }
  }

  printSection("Production limiter backend guardrail");
  const limiterIcon =
    limiterGuardrail.status === "present"
      ? "✅"
      : limiterGuardrail.status === "warning" || limiterGuardrail.status === "skipped"
        ? "⚠️"
        : "❌";
  console.log(`${limiterIcon} ${limiterGuardrail.message}`);

  console.log(`\nSecurity verification report: ${path.relative(repoRoot, summaryPath)}`);

  if (!summary.passed) {
    console.error("\n❌ Security verification failed with actionable guardrail diagnostics.");
    process.exit(1);
  }

  console.log(
    "\n✅ Security verification passed (static token-presence + tenant guardrail checks on selected routes)."
  );
  console.log(
    "   This does not prove runtime enforcement. See verify:security:runtime for live probing."
  );
}

main();
