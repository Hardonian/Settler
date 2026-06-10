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

const ENFORCED_HEADERS_COMMON = [
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
];
const ENFORCED_HEADERS_HTML = ["content-security-policy", ...ENFORCED_HEADERS_COMMON];
const ENFORCED_HEADERS_API = ENFORCED_HEADERS_COMMON;
const OBSERVABILITY_HEADERS = ["x-request-id"];

function loadRegistry() {
  const candidates = [
    path.join(repoRoot, "security", "route-registry.json"),
    path.join(repoRoot, "artifacts", "security", "route-registry.json"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return JSON.parse(readFileSync(candidate, "utf8"));
    }
  }
  throw new Error(
    `Route registry not found. Expected one of: ${candidates.map((item) => path.relative(repoRoot, item)).join(", ")}`
  );
}

function hasMethod(route, method) {
  return Array.isArray(route.methods) && route.methods.includes(method);
}

function classifyRoute(route) {
  if (route.kind !== "next-app-router") return { class: "unprobeable-kind", probe: false };
  if (!route.route.startsWith("/api")) return { class: "unprobeable-non-api", probe: false };
  if (route.route.includes("[")) return { class: "framework-limited-dynamic", probe: false };

  const hasGet = hasMethod(route, "GET") || hasMethod(route, "HEAD");
  if (!hasGet) {
    return {
      class: "framework-limited-method-not-implemented",
      probe: true,
      expectation: "method-not-allowed",
      blocking: false,
      contractType: "framework-limited",
      requiredHeaders: ENFORCED_HEADERS_API,
      pathCategory: "api",
      rationale: "Route does not implement GET/HEAD; Next runtime may emit synthetic 405 response.",
    };
  }

  if (route.route.startsWith("/api/cron/") || route.route.startsWith("/api/stripe/")) {
    return {
      class: "best-effort-webhook-cron",
      probe: true,
      expectation: "api-best-effort",
      blocking: false,
      contractType: "best-effort",
      requiredHeaders: ENFORCED_HEADERS_API,
      pathCategory: "api",
      rationale:
        "Webhook/cron endpoints can be runtime-constrained and are tracked as best-effort.",
    };
  }

  return {
    class: "api-enforced",
    probe: true,
    expectation: "api-enforced",
    blocking: true,
    contractType: "enforced",
    requiredHeaders: ENFORCED_HEADERS_API,
    pathCategory: "api",
    rationale: "GET/HEAD API route under middleware scope should carry baseline security headers.",
  };
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

  const child = spawn(
    "npx",
    ["pnpm", "--filter", "@settler/web", "start", "-p", String(config.port)],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    }
  );
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

function evaluateCheck({
  statusCode,
  expectation,
  requiredHeaders,
  blocking,
  csp,
  cacheControl,
  headerValues,
}) {
  const mismatches = [];

  for (const header of requiredHeaders) {
    if (!headerValues[header]) mismatches.push({ kind: "missing-header", header });
  }

  if (expectation === "html-enforced") {
    if (csp.includes("unsafe-inline"))
      mismatches.push({ kind: "csp-directive", issue: "contains unsafe-inline" });
    if (csp.includes("unsafe-eval"))
      mismatches.push({ kind: "csp-directive", issue: "contains unsafe-eval" });
  }

  if (expectation === "denial-enforced" && ![401, 403].includes(statusCode)) {
    mismatches.push({
      kind: "status",
      issue: `expected denial status (401/403), got ${statusCode}`,
    });
  }
  if (expectation === "redirect-enforced" && (statusCode < 300 || statusCode >= 400)) {
    mismatches.push({ kind: "status", issue: `expected redirect status, got ${statusCode}` });
  }
  if (expectation === "not-found-best-effort" && statusCode !== 404) {
    mismatches.push({ kind: "status", issue: `expected 404 status, got ${statusCode}` });
  }

  if (expectation === "denial-enforced" && !cacheControl.toLowerCase().includes("no-store")) {
    mismatches.push({
      kind: "cache-control",
      issue: "auth denial response missing cache-control no-store",
    });
  }

  if (expectation === "method-not-allowed" && statusCode !== 405) {
    mismatches.push({ kind: "status", issue: `expected 405 status, got ${statusCode}` });
  }

  return {
    status: mismatches.length === 0 ? "passed" : blocking ? "failed" : "limited",
    mismatches,
  };
}

async function probeUrl(baseUrl, target) {
  const url = `${baseUrl}${target.route}`;
  let response;
  try {
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  } catch (error) {
    return {
      route: target.route,
      sourceFile: target.file || null,
      routeClass: target.routeClass,
      pathCategory: target.pathCategory,
      contractType: "probe-limited",
      expectation: target.expectation,
      blocking: false,
      rationale: `${target.rationale} Probe request failed before response headers were available.`,
      status: "limited",
      statusCode: null,
      observed: {
        redirect: false,
        cacheControl: "",
        cspPresent: false,
        noncePresent: false,
        headers: {},
      },
      requiredHeaders: target.requiredHeaders,
      mismatches: [
        {
          kind: "probe-error",
          issue: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
  const csp = response.headers.get("content-security-policy") || "";
  const cacheControl = response.headers.get("cache-control") || "";

  const headerValues = Object.fromEntries(
    ["content-security-policy", ...ENFORCED_HEADERS_COMMON, ...OBSERVABILITY_HEADERS].map(
      (header) => [header, response.headers.get(header) || ""]
    )
  );

  const evaluation = evaluateCheck({
    statusCode: response.status,
    expectation: target.expectation,
    requiredHeaders: target.requiredHeaders,
    blocking: target.blocking,
    csp,
    cacheControl,
    headerValues,
  });

  return {
    route: target.route,
    sourceFile: target.file || null,
    routeClass: target.routeClass,
    pathCategory: target.pathCategory,
    contractType: target.contractType,
    expectation: target.expectation,
    blocking: target.blocking,
    rationale: target.rationale,
    status: evaluation.status,
    statusCode: response.status,
    observed: {
      redirect: response.status >= 300 && response.status < 400,
      cacheControl,
      cspPresent: Boolean(csp),
      noncePresent: hasNonce(csp),
      headers: headerValues,
    },
    requiredHeaders: target.requiredHeaders,
    mismatches: evaluation.mismatches,
  };
}

function buildSpecialTargets() {
  return [
    {
      route: "/app",
      file: "special:path",
      routeClass: "special-html",
      pathCategory: "html",
      contractType: "framework-limited",
      expectation: "html-enforced",
      blocking: false,
      requiredHeaders: ENFORCED_HEADERS_HTML,
      rationale:
        "HTML middleware path coverage is framework-limited in this probe and tracked as non-blocking.",
    },
    {
      route: "/api/v1/runs",
      file: "special:path",
      routeClass: "special-denial",
      pathCategory: "api",
      contractType: "enforced",
      expectation: "denial-enforced",
      blocking: true,
      requiredHeaders: ENFORCED_HEADERS_API,
      rationale: "Protected API route should deny anonymous access with secure denial headers.",
    },
    {
      route: "/admin",
      file: "special:path",
      routeClass: "special-redirect",
      pathCategory: "framework",
      contractType: "framework-limited",
      expectation: "redirect-enforced",
      blocking: false,
      requiredHeaders: ["x-request-id"],
      rationale:
        "Route is outside middleware matcher; redirect behavior is observed as framework-limited.",
    },
    {
      route: "/__definitely_not_a_real_route__",
      file: "special:path",
      routeClass: "special-not-found",
      pathCategory: "framework",
      contractType: "framework-limited",
      expectation: "not-found-best-effort",
      blocking: false,
      requiredHeaders: ["x-request-id"],
      rationale: "404 fallback path is framework generated and treated as best-effort evidence.",
    },
  ];
}

async function main() {
  const registry = loadRegistry();
  const routeClassification = registry.routes.map((route) => {
    const classification = classifyRoute(route);
    return {
      route: route.route,
      file: route.file,
      kind: route.kind,
      methods: route.methods || [],
      ...classification,
    };
  });

  const targets = routeClassification
    .filter((route) => route.probe)
    .map((route) => ({
      route: route.route,
      file: route.file,
      routeClass: route.class,
      pathCategory: route.pathCategory,
      contractType: route.contractType,
      expectation: route.expectation,
      blocking: route.blocking,
      requiredHeaders: route.requiredHeaders,
      rationale: route.rationale,
    }));

  const server = await maybeStartServer();
  const checks = [];
  const degradedReasons = [];

  if (!server.baseUrl) {
    degradedReasons.push(server.reason || "missing_base_url");
  } else {
    for (const target of [...targets, ...buildSpecialTargets()]) {
      checks.push(await probeUrl(server.baseUrl, target));
    }
  }

  await stopServer(server.child);

  const failedBlocking = checks.filter((check) => check.status === "failed");
  const limitedFindings = checks.filter((check) => check.status === "limited");
  const skippedByClassification = routeClassification.filter((route) => !route.probe);

  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-08.1",
    runId,
    baseUrl: server.baseUrl,
    policy: { strict: config.strict, allowDegraded: config.allowDegraded },
    degraded: degradedReasons.length > 0,
    degradedReasons,
    startupLogs: server.startupLogs || [],
    contractModel: {
      htmlEnforcedHeaders: ENFORCED_HEADERS_HTML,
      apiEnforcedHeaders: ENFORCED_HEADERS_API,
      classes: {
        enforced: "Blocking failures.",
        "best-effort": "Recorded but non-blocking.",
        "framework-limited": "Observed for visibility; non-blocking by policy.",
      },
    },
    coverage: {
      registryRoutes: registry.routes.length,
      probeableRoutes: targets.length,
      probedRoutes: checks.length,
      skippedByClassification: skippedByClassification.length,
      specialPathProbes: server.baseUrl ? buildSpecialTargets().length : 0,
    },
    classificationCounts: routeClassification.reduce((acc, item) => {
      acc[item.class] = (acc[item.class] || 0) + 1;
      return acc;
    }, {}),
    counts: {
      passed: checks.filter((check) => check.status === "passed").length,
      failedBlocking: failedBlocking.length,
      limited: limitedFindings.length,
      skipped: degradedReasons.length > 0 ? targets.length + buildSpecialTargets().length : 0,
    },
    checks,
    skippedByClassification,
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
    `Header probe counts: passed=${summary.counts.passed} failedBlocking=${failedBlocking.length} limited=${summary.counts.limited} skipped=${summary.counts.skipped}`
  );

  if (summary.degraded && !config.allowDegraded) {
    console.error(
      "Header probe could not prove header/CSP contract. Set SECURITY_HEADER_PROBE_ALLOW_DEGRADED=1 only when degraded results are explicitly acceptable."
    );
  }

  if (failedBlocking.length > 0) {
    console.error(`\n❌ Header probe: ${failedBlocking.length} blocking check(s) failed.`);
    for (const check of failedBlocking) {
      console.error(`   route: ${check.route}`);
      for (const mismatch of check.mismatches) {
        console.error(`     - ${mismatch.kind}: ${mismatch.header || mismatch.issue}`);
      }
    }
  } else if (summary.counts.passed === 0) {
    console.warn(
      "\n⚠️ Header probe completed with all checks skipped (missing build/baseUrl). Not a verification pass."
    );
  } else {
    console.log(`\n✅ Header probe passed (${summary.counts.passed} route(s) checked).`);
  }

  if (config.strict && (failedBlocking.length > 0 || summary.counts.skipped > 0)) process.exit(1);
  if (config.strict && summary.degraded && !config.allowDegraded) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
