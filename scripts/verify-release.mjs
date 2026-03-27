#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const repoRoot = process.cwd();
const defaultRunId = new Date().toISOString().replace(/[:.]/g, "-");

const stageCatalog = {
  root: { label: "Root cleanliness", command: ["pnpm", ["run", "verify:root"]], timeoutMs: 60_000 },
  lint: { label: "Lint", command: ["pnpm", ["run", "lint"]], timeoutMs: 12 * 60_000 },
  typecheck: {
    label: "Typecheck",
    command: ["pnpm", ["run", "typecheck"]],
    timeoutMs: 12 * 60_000,
  },
  claims: {
    label: "Claims lint",
    command: ["pnpm", ["run", "verify:claims"]],
    timeoutMs: 3 * 60_000,
  },
  boundaries: {
    label: "Boundary enforcement",
    command: ["pnpm", ["run", "verify:boundaries"]],
    timeoutMs: 5 * 60_000,
  },
  routes: {
    label: "Route smoke",
    command: ["pnpm", ["run", "verify:routes"]],
    timeoutMs: 4 * 60_000,
  },
  linkIntegrity: {
    label: "Internal link integrity",
    command: ["pnpm", ["run", "qa:links"]],
    timeoutMs: 4 * 60_000,
  },
  security: {
    label: "Security controls",
    command: ["pnpm", ["run", "verify:security"]],
    timeoutMs: 3 * 60_000,
  },
  securityRuntime: {
    label: "Runtime security smoke",
    command: ["pnpm", ["run", "verify:security:runtime"]],
    timeoutMs: 8 * 60_000,
  },
  securityEvidence: {
    label: "Supply-chain security evidence",
    command: ["pnpm", ["run", "verify:security:evidence"]],
    timeoutMs: 2 * 60_000,
  },
  build: { label: "Build", command: ["pnpm", ["run", "build"]], timeoutMs: 20 * 60_000 },
  test: {
    label: "Core tests",
    command: ["pnpm", ["run", "test:ci:verify"]],
    timeoutMs: 25 * 60_000,
  },
  launchManifest: {
    label: "Launch static asset manifest",
    command: ["pnpm", ["run", "verify:launch-assets"]],
    timeoutMs: 2 * 60_000,
  },
  capture: {
    label: "Launch artifact capture",
    command: ["pnpm", ["run", "capture:launch"]],
    timeoutMs: 10 * 60_000,
  },
  artifacts: {
    label: "Launch artifact verification",
    command: ["pnpm", ["run", "verify:artifacts"]],
    timeoutMs: 2 * 60_000,
  },
};

const profiles = {
  /** Release-critical code health; excludes internal marketing/docs link crawl (see `fast-with-links`). */
  fast: ["root", "lint", "typecheck", "claims", "boundaries", "routes", "security"],
  /** Same as `fast` plus static internal link integrity (requires fresh `qa/route-registry.json` from `qa:routes`). */
  "fast-with-links": [
    "root",
    "lint",
    "typecheck",
    "claims",
    "boundaries",
    "routes",
    "linkIntegrity",
    "security",
  ],
  build: ["build"],
  test: ["test"],
  artifacts: ["launchManifest", "capture", "artifacts"],
  full: [
    "root",
    "lint",
    "typecheck",
    "claims",
    "boundaries",
    "routes",
    "linkIntegrity",
    "security",
    "build",
    "securityRuntime",
    "test",
    "launchManifest",
    "capture",
    "artifacts",
    "securityEvidence",
  ],
};

function assertNode24Toolchain() {
  const required = readFileSync(path.join(repoRoot, ".nvmrc"), "utf8").trim();
  const requiredMajor = Number(required.split(".")[0] ?? 24);
  const activeMajor = Number(process.versions.node.split(".")[0] ?? 0);
  if (activeMajor !== requiredMajor) {
    throw new Error(
      `verify-release requires Node ${required} (from .nvmrc); active runtime is ${process.version}. Run 'nvm use ${requiredMajor}'.`
    );
  }
}

function parseArgs(argv) {
  const profileArg = argv.find((value) => value.startsWith("--profile="));
  const stageArg = argv.find((value) => value.startsWith("--stage="));
  const outputArg = argv.find((value) => value.startsWith("--output-dir="));
  const runIdArg = argv.find((value) => value.startsWith("--run-id="));

  return {
    profile: profileArg ? profileArg.split("=")[1] : "fast",
    stage: stageArg ? stageArg.split("=")[1] : null,
    outputDir: outputArg ? outputArg.split("=")[1] : "artifacts/verification",
    runId: runIdArg ? runIdArg.split("=")[1] : defaultRunId,
  };
}

function resolveStages({ profile, stage }) {
  if (stage) {
    if (!stageCatalog[stage]) {
      throw new Error(
        `Unknown stage '${stage}'. Valid stages: ${Object.keys(stageCatalog).join(", ")}`
      );
    }
    return [stage];
  }

  const resolved = profiles[profile];
  if (!resolved) {
    throw new Error(
      `Unknown profile '${profile}'. Valid profiles: ${Object.keys(profiles).join(", ")}`
    );
  }
  return resolved;
}

async function runStage(stageName, runDir) {
  const definition = stageCatalog[stageName];
  let [bin, args] = definition.command;
  if (process.platform === "win32" && bin === "pnpm") {
    // Some systems report pnpm.CMD while others report pnpm.cmd.
    // Also ensures we use shell resolution properly.
    bin = "pnpm.cmd";
  }
  const startedAt = Date.now();
  const logLines = [];

  console.log(`\n▶ [${stageName}] ${definition.label}`);

  const status = await new Promise((resolve) => {
    const child = spawn(bin, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, definition.timeoutMs);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      logLines.push(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      process.stderr.write(text);
      logLines.push(text);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, timedOut });
    });
  });

  const durationMs = Date.now() - startedAt;
  const logPath = path.join(runDir, `${stageName}.log`);
  writeFileSync(logPath, logLines.join(""), "utf8");

  return {
    stage: stageName,
    label: definition.label,
    status: status.code === 0 && !status.timedOut ? "passed" : "failed",
    exitCode: status.code,
    timedOut: status.timedOut,
    durationMs,
    timeoutMs: definition.timeoutMs,
    logPath: path.relative(repoRoot, logPath),
  };
}

function readJsonIfExists(relPath) {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, relPath), "utf8"));
  } catch {
    return null;
  }
}

function collectVerificationSignals() {
  const supplyChain = readJsonIfExists("artifacts/security/supply-chain-latest.json");
  const runtimeSmoke = readJsonIfExists("artifacts/security/runtime-smoke-latest.json");
  const staticSecurity = readJsonIfExists("artifacts/security/verify-security-summary.json");

  return {
    supplyChainAuditState: supplyChain?.audit?.state || "unknown",
    supplyChainUnavailableCategory: supplyChain?.audit?.unavailableCategory || null,
    tenantGuardrailStaticStatus:
      Array.isArray(staticSecurity?.tenantGuardrailPresence) &&
      staticSecurity.tenantGuardrailPresence.every((x) => x.status === "guardrail_present")
        ? "pass"
        : "incomplete",
    tenantRuntimeCoverageStatus:
      Array.isArray(runtimeSmoke?.checks) &&
      runtimeSmoke.checks.some(
        (x) => x.name === "auth_tenant_boundary_negative" && x.status === "passed"
      )
        ? "pass"
        : "incomplete",
  };
}

function emitSummary(args, results, runDir) {
  const completedAt = new Date().toISOString();
  const passed = results.every((item) => item.status === "passed");
  const signals = collectVerificationSignals();
  const summary = {
    profile: args.profile,
    stageFilter: args.stage,
    runId: args.runId,
    completedAt,
    passed,
    signals,
    results,
  };

  const summaryPath = path.join(runDir, "summary.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

  const lines = [
    "# Release verification summary",
    "",
    `- Run ID: ${args.runId}`,
    `- Profile: ${args.profile}`,
    `- Passed: ${passed ? "yes" : "no"}`,
    `- Completed at: ${completedAt}`,
    `- Supply-chain audit state: ${signals.supplyChainAuditState}`,
    `- Supply-chain unavailable category: ${signals.supplyChainUnavailableCategory || "n/a"}`,
    `- Tenant guardrail static status: ${signals.tenantGuardrailStaticStatus}`,
    `- Tenant runtime coverage status: ${signals.tenantRuntimeCoverageStatus}`,
    "",
    "| Stage | Status | Duration (s) | Timeout (s) | Log |",
    "|---|---|---:|---:|---|",
    ...results.map(
      (item) =>
        `| ${item.stage} | ${item.status}${item.timedOut ? " (timeout)" : ""} | ${(
          item.durationMs / 1000
        ).toFixed(1)} | ${(item.timeoutMs / 1000).toFixed(0)} | ${item.logPath} |`
    ),
    "",
  ];

  const markdownPath = path.join(runDir, "summary.md");
  writeFileSync(markdownPath, lines.join("\n"), "utf8");

  console.log(`\nVerification summary JSON: ${path.relative(repoRoot, summaryPath)}`);
  console.log(`Verification summary Markdown: ${path.relative(repoRoot, markdownPath)}`);

  return passed;
}

async function main() {
  assertNode24Toolchain();
  const args = parseArgs(process.argv.slice(2));
  const stages = resolveStages(args);

  const runDir = path.join(repoRoot, args.outputDir, args.runId);
  mkdirSync(runDir, { recursive: true });

  const results = [];
  for (const stageName of stages) {
    const result = await runStage(stageName, runDir);
    results.push(result);
    if (result.status !== "passed") {
      break;
    }
  }

  const passed = emitSummary(args, results, runDir);

  if (!passed) {
    console.error("\n❌ Release verification failed.");
    process.exit(1);
  }

  console.log("\n✅ Release verification passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
