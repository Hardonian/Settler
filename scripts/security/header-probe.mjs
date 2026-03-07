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
  allowDegraded: process.env.SECURITY_HEADER_PROBE_ALLOW_DEGRADED === "1",
};

const REQUIRED_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
  "x-request-id",
];

function loadRegistry() {
  return JSON.parse(readFileSync(path.join(repoRoot, "security", "route-registry.json"), "utf8"));
}

function classifyRoute(route) {
  if (route.kind !== "next-app-router") return "unprobeable-kind";
  if (!route.route.startsWith("/api")) return "unprobeable-non-api";
  if (route.route.includes("[")) return "unprobeable-dynamic";
  if (route.route.startsWith("/api/cron/") || route.route.startsWith("/api/stripe/"))
    return "limited-contract";
  return "probeable";
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.status < 500 || response.status === 404) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function maybeStartServer() {
  if (config.baseUrl) return { baseUrl: config.baseUrl, child: null, startupLogs: [] };
  const buildId = path.join(repoRoot, "packages", "web", ".next", "BUILD_ID");
  if (!existsSync(buildId))
    return { baseUrl: null, child: null, reason: "missing_build", startupLogs: [] };

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
    return { baseUrl: null, child: null, reason: "server_start_failed", startupLogs: logs };
  }
  return { baseUrl, child, startupLogs: logs };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
      resolve();
    }, 3_000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

function hasNonce(csp) {
  return /nonce-[A-Za-z0-9+/_-]+/i.test(csp || "");
}

async function probeUrl(baseUrl, route, expectation = "default") {
  const url = `${baseUrl}${route}`;
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  const csp = response.headers.get("content-security-policy") || "";
  const cacheControl = response.headers.get("cache-control") || "";
  const requestId = response.headers.get("x-request-id") || "";

  const failures = [];
  for (const header of REQUIRED_HEADERS) {
    if (!response.headers.get(header)) failures.push(`missing ${header} header`);
  }

  if (csp.includes("unsafe-inline")) failures.push("contains unsafe-inline");
  if (csp.includes("unsafe-eval")) failures.push("contains unsafe-eval");

  if ((response.status === 401 || response.status === 403) && !cacheControl.includes("no-store")) {
    failures.push("auth denial response missing cache-control no-store");
  }

  if (expectation === "denial" && ![401, 403].includes(response.status)) {
    failures.push(`expected denial status (401/403), got ${response.status}`);
  }

  if (expectation === "redirect" && (response.status < 300 || response.status >= 400)) {
    failures.push(`expected redirect status, got ${response.status}`);
  }

  if (expectation === "not-found" && response.status !== 404) {
    failures.push(`expected 404 status, got ${response.status}`);
  }

  return {
    route,
    status: failures.length ? "failed" : "passed",
    statusCode: response.status,
    cspPresent: Boolean(csp),
    noncePresent: hasNonce(csp),
    requestIdPresent: Boolean(requestId),
    cacheControl,
    expectation,
    failures,
    redirect: response.status >= 300 && response.status < 400,
  };
}

async function main() {
  const registry = loadRegistry();
  const routeClassification = registry.routes.map((route) => ({
    route: route.route,
    file: route.file,
    kind: route.kind,
    classification: classifyRoute(route),
  }));

  const targets = routeClassification.filter((route) => route.classification === "probeable");
  const server = await maybeStartServer();
  const checks = [];
  const degradedReasons = [];

  if (!server.baseUrl) {
    degradedReasons.push(server.reason || "missing_base_url");
  } else {
    for (const route of targets) {
      checks.push(await probeUrl(server.baseUrl, route.route));
    }

    const specialProbes = [
      ["/__definitely_not_a_real_route__", "not-found"],
      ["/api/v1/runs", "denial"],
      ["/admin", "redirect"],
    ];
    for (const [route, expectation] of specialProbes) {
      checks.push(await probeUrl(server.baseUrl, route, expectation));
    }
  }

  await stopServer(server.child);

  const failed = checks.filter((check) => check.status === "failed");
  const skippedByClassification = routeClassification.filter(
    (route) => route.classification !== "probeable"
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-07.3",
    runId,
    baseUrl: server.baseUrl,
    policy: { strict: config.strict, allowDegraded: config.allowDegraded },
    degraded: degradedReasons.length > 0,
    degradedReasons,
    startupLogs: server.startupLogs || [],
    coverage: {
      registryRoutes: registry.routes.length,
      probeableRoutes: targets.length,
      probedRoutes: checks.length,
      skippedByClassification: skippedByClassification.length,
      specialPathProbes: server.baseUrl ? 3 : 0,
    },
    classificationCounts: routeClassification.reduce((acc, item) => {
      acc[item.classification] = (acc[item.classification] || 0) + 1;
      return acc;
    }, {}),
    counts: {
      passed: checks.filter((check) => check.status === "passed").length,
      failed: failed.length,
      skipped: degradedReasons.length > 0 ? targets.length + 3 : 0,
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

  console.log(`Header probe artifact: ${path.relative(repoRoot, summaryPath)}`);
  console.log(
    `Header probe counts: passed=${summary.counts.passed} failed=${failed.length} skipped=${summary.counts.skipped}`
  );

  if (summary.degraded && !config.allowDegraded) {
    console.error(
      "Header probe could not prove header/CSP contract. Set SECURITY_HEADER_PROBE_ALLOW_DEGRADED=1 only when degraded results are explicitly acceptable."
    );
  }

  if (failed.length > 0) {
    console.error(`\n❌ Header probe: ${failed.length} check(s) failed.`);
    for (const check of failed) {
      console.error(`   route: ${check.route}`);
      for (const failure of check.failures) console.error(`     - ${failure}`);
    }
  } else if (summary.counts.passed === 0) {
    console.warn(
      "\n⚠️ Header probe completed with all checks skipped (missing build/baseUrl). Not a verification pass."
    );
  } else {
    console.log(`\n✅ Header probe passed (${summary.counts.passed} route(s) checked).`);
  }

  if (config.strict && (failed.length > 0 || summary.counts.skipped > 0)) process.exit(1);
  if (summary.degraded && !config.allowDegraded) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
