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
  if (route.route.startsWith("/api/cron/") || route.route.startsWith("/api/stripe/")) {
    return "limited-contract";
  }
  return "probeable";
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.status < 500 || response.status === 404) return true;
    } catch {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function maybeStartServer() {
  if (config.baseUrl) return { baseUrl: config.baseUrl, child: null, startupLogs: [] };

  const buildId = path.join(repoRoot, "packages", "web", ".next", "BUILD_ID");
  if (!existsSync(buildId)) {
    return { baseUrl: null, child: null, reason: "missing_build", startupLogs: [] };
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

async function probeRoute(baseUrl, route) {
  const url = `${baseUrl}${route.route}`;
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  const csp = response.headers.get("content-security-policy") || "";
  const cacheControl = response.headers.get("cache-control") || "";
  const requestId = response.headers.get("x-request-id") || "";

  const failures = [];
  for (const header of REQUIRED_HEADERS) {
    if (!response.headers.get(header)) {
      failures.push(`missing ${header} header`);
    }
  }

  if (csp.includes("unsafe-inline")) failures.push("contains unsafe-inline");
  if (csp.includes("unsafe-eval")) failures.push("contains unsafe-eval");
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
      checks.push(await probeRoute(server.baseUrl, route));
    }
  }

  await stopServer(server.child);

  const failed = checks.filter((check) => check.status === "failed");
  const skippedByClassification = routeClassification.filter(
    (route) => route.classification !== "probeable"
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-07.2",
    runId,
    baseUrl: server.baseUrl,
    policy: {
      strict: config.strict,
      allowDegraded: config.allowDegraded,
    },
    degraded: degradedReasons.length > 0,
    degradedReasons,
    startupLogs: server.startupLogs || [],
    coverage: {
      registryRoutes: registry.routes.length,
      probeableRoutes: targets.length,
      probedRoutes: checks.length,
      skippedByClassification: skippedByClassification.length,
    },
    classificationCounts: routeClassification.reduce((acc, item) => {
      acc[item.classification] = (acc[item.classification] || 0) + 1;
      return acc;
    }, {}),
    counts: {
      passed: checks.filter((check) => check.status === "passed").length,
      failed: failed.length,
      skipped: degradedReasons.length > 0 ? targets.length : 0,
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

  if (summary.degraded && !config.allowDegraded) {
    console.error(
      "Header probe could not prove header/CSP contract. Set SECURITY_HEADER_PROBE_ALLOW_DEGRADED=1 only when degraded results are explicitly acceptable."
    );
    process.exit(1);
  }

  if (config.strict && failed.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
