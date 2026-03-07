#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "header-probe", runId);
mkdirSync(outputDir, { recursive: true });

const config = {
  port: Number(process.env.SECURITY_HEADER_PROBE_PORT || 3016),
  baseUrl: process.env.SECURITY_HEADER_PROBE_BASE_URL || null,
  strict: process.env.SECURITY_HEADER_PROBE_STRICT === "1",
};

function loadRegistry() {
  return JSON.parse(readFileSync(path.join(repoRoot, "security", "route-registry.json"), "utf8"));
}

function isProbeable(route) {
  return (
    route.kind === "next-app-router" && route.route.startsWith("/api") && !route.route.includes("[")
  );
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500 || response.status === 404) return true;
    } catch {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function maybeStartServer() {
  if (config.baseUrl) return { baseUrl: config.baseUrl, child: null };

  const buildId = path.join(repoRoot, "packages", "web", ".next", "BUILD_ID");
  if (!existsSync(buildId)) {
    return { baseUrl: null, child: null, reason: "missing_build" };
  }

  const child = spawn("pnpm", ["--filter", "@settler/web", "start", "-p", String(config.port)], {
    cwd: repoRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString()));
  const baseUrl = `http://127.0.0.1:${config.port}`;
  const ready = await waitForServer(`${baseUrl}/api/v1/health`);
  if (!ready) {
    child.kill("SIGTERM");
    return { baseUrl: null, child: null, reason: "server_start_failed", logs };
  }

  return { baseUrl, child, logs };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
}

function hasNonce(csp) {
  return /nonce-[A-Za-z0-9+/_-]+/i.test(csp || "");
}

async function probeRoute(baseUrl, route) {
  const url = `${baseUrl}${route.route}`;
  const response = await fetch(url, { redirect: "manual" });
  const csp = response.headers.get("content-security-policy") || "";
  const cacheControl = response.headers.get("cache-control") || "";
  const requestId = response.headers.get("x-request-id") || "";

  const failures = [];
  if (!csp) failures.push("missing content-security-policy header");
  if (csp.includes("unsafe-inline")) failures.push("contains unsafe-inline");
  if (csp.includes("unsafe-eval")) failures.push("contains unsafe-eval");
  if (route.route.startsWith("/api") && !requestId) failures.push("missing x-request-id header");
  if ((response.status === 401 || response.status === 403) && !cacheControl.includes("no-store")) {
    failures.push("auth denial response missing cache-control no-store");
  }

  const expectedProtected =
    route.route.startsWith("/api/v1/runs") || route.route.startsWith("/api/exports");
  if (expectedProtected && ![401, 403, 404].includes(response.status)) {
    failures.push(`expected unauthenticated denial status, got ${response.status}`);
  }

  return {
    route: route.route,
    status: failures.length ? "failed" : "passed",
    method: "GET",
    statusCode: response.status,
    cspPresent: Boolean(csp),
    noncePresent: hasNonce(csp),
    requestIdPresent: Boolean(requestId),
    cacheControl,
    failures,
    redirect: response.status >= 300 && response.status < 400,
  };
}

async function main() {
  const registry = loadRegistry();
  const targets = registry.routes.filter(isProbeable);
  const server = await maybeStartServer();

  const checks = [];
  if (!server.baseUrl) {
    checks.push({ status: "skipped", reason: server.reason || "missing_base_url" });
  } else {
    for (const route of targets) {
      checks.push(await probeRoute(server.baseUrl, route));
    }
  }

  await stopServer(server.child);

  const failed = checks.filter((check) => check.status === "failed");
  const summary = {
    generatedAt: new Date().toISOString(),
    runId,
    baseUrl: server.baseUrl,
    totalRoutes: targets.length,
    counts: {
      passed: checks.filter((check) => check.status === "passed").length,
      failed: failed.length,
      skipped: checks.filter((check) => check.status === "skipped").length,
    },
    checks,
  };

  const summaryPath = path.join(outputDir, "header-probe.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  writeFileSync(
    path.join(repoRoot, "artifacts", "security", "header-probe-latest.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  const allSkipped = summary.counts.passed === 0 && failed.length === 0 && summary.counts.skipped > 0;

  console.log(`Header probe artifact: ${path.relative(repoRoot, summaryPath)}`);
  console.log(
    `Header probe counts: passed=${summary.counts.passed} failed=${failed.length} skipped=${summary.counts.skipped}`
  );

  if (allSkipped) {
    console.warn(
      "\n⚠️  Header probe completed with all checks SKIPPED (no build or --baseUrl available)."
    );
    console.warn(
      "   This does NOT constitute a header verification pass. The artifact records zero real results."
    );
    console.warn(
      "   Build the app first (`pnpm --filter @settler/web build`) or set SECURITY_HEADER_PROBE_BASE_URL."
    );
    console.warn(
      "   If drift detection compares this artifact against a baseline with real counts, it will flag drift."
    );
  } else if (failed.length > 0) {
    console.error(`\n❌ Header probe: ${failed.length} check(s) failed.`);
    for (const check of failed) {
      console.error(`   route: ${check.route || "unknown"}`);
      for (const f of check.failures || []) {
        console.error(`     - ${f}`);
      }
    }
  } else {
    console.log(`\n✅ Header probe passed (${summary.counts.passed} route(s) checked).`);
  }

  if (config.strict && (failed.length > 0 || summary.counts.skipped > 0)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
