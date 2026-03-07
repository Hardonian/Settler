#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const repoRoot = process.cwd();
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "runtime-smoke", runId);
mkdirSync(outputDir, { recursive: true });

function parseArgs(argv) {
  const args = Object.fromEntries(
    argv
      .filter((item) => item.startsWith("--"))
      .map((item) => {
        const [k, v = "true"] = item.slice(2).split("=");
        return [k, v];
      })
  );

  return {
    baseUrl: args.baseUrl || process.env.SECURITY_SMOKE_BASE_URL || null,
    port: Number(args.port || process.env.SECURITY_SMOKE_PORT || 3015),
    startServer: args.startServer !== "false",
    requireHsts: args.requireHsts === "true" || process.env.SECURITY_SMOKE_REQUIRE_HSTS === "1",
    rateLimitAttempts: Number(
      args.rateLimitAttempts || process.env.SECURITY_SMOKE_RATE_ATTEMPTS || 130
    ),
  };
}

function toCheck(name, status, details = {}) {
  return { name, status, ...details };
}

async function waitForServer(url, timeoutMs = 45_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return true;
    } catch {
      // continue retrying
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function maybeStartServer(config, logs) {
  if (config.baseUrl || !config.startServer) {
    return { baseUrl: config.baseUrl, child: null, started: false };
  }

  const buildIdPath = path.join(repoRoot, "packages", "web", ".next", "BUILD_ID");
  if (!existsSync(buildIdPath)) {
    logs.push(
      "Local server start skipped: packages/web/.next/BUILD_ID missing. Run `pnpm run build` first or pass --baseUrl."
    );
    return { baseUrl: null, child: null, started: false, unavailableReason: "missing_build" };
  }

  const child = spawn("pnpm", ["--filter", "@settler/web", "start", "-p", String(config.port)], {
    cwd: repoRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => logs.push(`[server][stdout] ${chunk.toString().trimEnd()}`));
  child.stderr.on("data", (chunk) => logs.push(`[server][stderr] ${chunk.toString().trimEnd()}`));

  const baseUrl = `http://127.0.0.1:${config.port}`;
  const up = await waitForServer(`${baseUrl}/api/v1/health`);
  if (!up) {
    child.kill("SIGTERM");
    return { baseUrl, child, started: false, unavailableReason: "server_start_failed" };
  }

  return { baseUrl, child, started: true };
}

async function stopServer(child) {
  if (!child) return;
  if (child.exitCode !== null || child.killed) return;
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
      resolve();
    }, 5_000);

    const done = () => {
      clearTimeout(timer);
      resolve();
    };

    child.once("exit", done);
    child.once("close", done);
  });
}

function isJsonProblem(contentType) {
  return Boolean(contentType && contentType.includes("application/problem+json"));
}

async function runProbes(baseUrl, config) {
  const checks = [];

  const health = await fetch(`${baseUrl}/api/v1/health`);
  if (health.status === 404) {
    checks.push(
      toCheck("security_headers", "skipped", {
        reason: "route_not_present",
        route: "/api/v1/health",
      })
    );
  } else {
    const headers = health.headers;
    const headerChecks = [
      ["x-content-type-options", "nosniff"],
      ["x-frame-options", "DENY"],
      ["referrer-policy", "strict-origin-when-cross-origin"],
      ["permissions-policy", "camera=()"],
    ];

    const missing = headerChecks
      .map(([key, expectedPart]) => {
        const actual = headers.get(key);
        return !actual || !actual.includes(expectedPart)
          ? `${key} expected to include '${expectedPart}', actual='${actual || "missing"}'`
          : null;
      })
      .filter(Boolean);

    const cspRo = headers.get("content-security-policy-report-only");
    if (!cspRo || !cspRo.includes("default-src 'self'")) {
      missing.push(
        `content-security-policy-report-only expected default-src 'self', actual='${cspRo || "missing"}'`
      );
    }

    const hsts = headers.get("strict-transport-security");
    const isHttps = baseUrl.startsWith("https://");
    if ((isHttps || config.requireHsts) && !hsts) {
      missing.push("strict-transport-security required but missing");
    }

    checks.push(
      toCheck("security_headers", missing.length ? "failed" : "passed", {
        route: "/api/v1/health",
        statusCode: health.status,
        details: missing,
        note: !isHttps && !config.requireHsts ? "HSTS not required in local HTTP mode." : undefined,
      })
    );
  }

  const authResp = await fetch(`${baseUrl}/api/v1/runs`);
  if (authResp.status === 404) {
    checks.push(
      toCheck("auth_tenant_boundary_negative", "skipped", {
        reason: "route_not_present",
        route: "/api/v1/runs",
      })
    );
  } else {
    const contentType = authResp.headers.get("content-type");
    const passed = authResp.status === 401 && isJsonProblem(contentType);
    checks.push(
      toCheck("auth_tenant_boundary_negative", passed ? "passed" : "failed", {
        route: "/api/v1/runs",
        statusCode: authResp.status,
        contentType,
        expected: "401 + application/problem+json when unauthenticated",
      })
    );
  }

  const limiterRoute = "/api/v1/receipts";
  let first429 = null;
  let finalStatus = null;
  let retryAfter = null;
  for (let i = 1; i <= config.rateLimitAttempts; i += 1) {
    const resp = await fetch(`${baseUrl}${limiterRoute}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.42",
      },
      body: JSON.stringify({}),
    });

    finalStatus = resp.status;
    if (resp.status === 429) {
      first429 = i;
      retryAfter = resp.headers.get("retry-after");
      break;
    }
  }

  if (first429 === null) {
    checks.push(
      toCheck("rate_limit_behavior", "failed", {
        route: limiterRoute,
        details: [
          `No 429 observed after ${config.rateLimitAttempts} attempts`,
          `final_status=${finalStatus}`,
        ],
      })
    );
  } else {
    checks.push(
      toCheck("rate_limit_behavior", "passed", {
        route: limiterRoute,
        first429Attempt: first429,
        retryAfter,
      })
    );
  }

  return checks;
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const diagnostics = [];
  const server = await maybeStartServer(config, diagnostics);
  const checks = [];

  try {
    if (!server.baseUrl) {
      checks.push(
        toCheck("runtime_smoke_setup", "skipped", {
          reason: server.unavailableReason || "base_url_missing",
          details: "Set --baseUrl=<url> or build/start locally for runtime probing.",
        })
      );
    } else {
      checks.push(...(await runProbes(server.baseUrl, config)));
    }
  } finally {
    await stopServer(server.child);
  }

  const failed = checks.filter((item) => item.status === "failed");
  const skipped = checks.filter((item) => item.status === "skipped");
  const passed = checks.filter((item) => item.status === "passed");

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: server.baseUrl,
    checks,
    diagnostics,
    counts: { passed: passed.length, failed: failed.length, skipped: skipped.length },
  };

  const summaryPath = path.join(outputDir, "summary.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  writeFileSync(
    path.join(repoRoot, "artifacts", "security", "runtime-smoke-latest.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  console.log("Runtime security smoke summary:", path.relative(repoRoot, summaryPath));
  for (const check of checks) {
    const icon = check.status === "passed" ? "✅" : check.status === "skipped" ? "⚠️" : "❌";
    console.log(`${icon} ${check.name} (${check.status})`);
    if (check.reason) console.log(`   reason: ${check.reason}`);
    if (check.expected) console.log(`   expected: ${check.expected}`);
    if (Array.isArray(check.details)) {
      for (const detail of check.details) console.log(`   - ${detail}`);
    }
  }

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
