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
    checks: [
      "/api/:path*",
      "addSecurityHeaders(response, { nonce })",
      "middleware.unexpected_error",
    ],
  },
  {
    file: "packages/web/src/middleware/security-headers.ts",
    checks: [
      "Content-Security-Policy",
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

function readRuntimeTenantCoverage() {
  try {
    const runtimeSummary = JSON.parse(
      readFileSync(
        path.join(repoRoot, "artifacts", "security", "runtime-smoke-latest.json"),
        "utf8"
      )
    );
    const negativeCheck = runtimeSummary?.checks?.find(
      (entry) => entry.name === "auth_tenant_boundary_negative"
    );

    if (!negativeCheck) {
      return {
        status: "not_executed",
        message:
          "Runtime security smoke artifact present, but tenant negative check was not found.",
      };
    }

    if (negativeCheck.status === "passed") {
      return {
        status: "pass",
        message: "Runtime tenant negative-path check passed in latest runtime smoke artifact.",
      };
    }

    return {
      status: negativeCheck.status,
      message: `Runtime tenant negative-path check status='${negativeCheck.status}'.`,
    };
  } catch {
    return {
      status: "not_executed",
      message:
        "Runtime tenant coverage not executed in this run context. Run `pnpm run verify:security:runtime` for fixture/runtime assurance.",
    };
  }
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
  const runtimeTenantCoverage = readRuntimeTenantCoverage();

  const staticFailures = staticResults.filter((item) => item.status !== "present");
  const tenantFailures = tenantResults.filter((item) => item.status !== "guardrail_present");
  const limiterFailures = limiterGuardrail.status === "missing_control" ? [limiterGuardrail] : [];

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: {
      static: "Control-presence verification (not dynamic attack simulation).",
      tenantGuardrails:
        "High-risk route structure checks for auth/tenant/rate-limit guardrails. Guardrail-presence only.",
      tenantRuntime:
        "Runtime/API cross-tenant negative-path coverage from latest runtime smoke or dedicated fixture tests.",
    },
    staticResults,
    tenantGuardrailPresence: tenantResults,
    tenantRuntimeCoverage: runtimeTenantCoverage,
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

  printSection("Tenant guardrail presence checks (static)");
  for (const result of tenantResults) {
    const statusIcon = result.status === "guardrail_present" ? "✅" : "❌";
    console.log(`${statusIcon} ${result.route} [${result.classification}]`);
    if (result.error) console.log(`   ${result.error}`);
    if (result.missingTokens.length) {
      for (const missing of result.missingTokens) {
        console.log(`   missing guardrail: ${missing}`);
      }
    }
    console.log(`   runtime follow-up target: ${result.manualValidation}`);
  }

  printSection("Tenant runtime coverage status");
  const runtimeIcon = runtimeTenantCoverage.status === "pass" ? "✅" : "⚠️";
  console.log(`${runtimeIcon} ${runtimeTenantCoverage.message}`);

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
    "\n✅ Security verification passed (static controls + tenant guardrail presence). Runtime coverage is reported separately and must be reviewed explicitly."
  );
}

main();
