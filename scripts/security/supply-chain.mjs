#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "supply-chain", runId);
mkdirSync(outputDir, { recursive: true });
mkdirSync(path.join(repoRoot, "artifacts", "security"), { recursive: true });

function run(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      if (options.logOutput !== false) process.stdout.write(text);
      stdout += text;
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      if (options.logOutput !== false) process.stderr.write(text);
      stderr += text;
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

function parseAudit(raw) {
  const parsed = JSON.parse(raw);
  const vulnerabilities = parsed.metadata?.vulnerabilities || {};
  return {
    vulnerabilities,
    totals: {
      info: vulnerabilities.info || 0,
      low: vulnerabilities.low || 0,
      moderate: vulnerabilities.moderate || 0,
      high: vulnerabilities.high || 0,
      critical: vulnerabilities.critical || 0,
      total: vulnerabilities.total || 0,
    },
    raw: parsed,
  };
}

function collectPackages(tree, out = new Map()) {
  if (!tree || typeof tree !== "object") return out;
  const name = tree.name;
  const version = tree.version;
  if (name && version) {
    out.set(`${name}@${version}`, { name, version });
  }
  const deps = tree.dependencies || {};
  for (const dep of Object.values(deps)) {
    collectPackages(dep, out);
  }
  return out;
}

function buildCycloneDx(packages) {
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ vendor: "Settler", name: "scripts/security/supply-chain.mjs" }],
      component: { type: "application", name: "settler-monorepo" },
    },
    components: packages.map((pkg) => ({
      type: "library",
      name: pkg.name,
      version: pkg.version,
      purl: `pkg:npm/${encodeURIComponent(pkg.name)}@${pkg.version}`,
      "bom-ref": `${pkg.name}@${pkg.version}`,
    })),
  };
}

function buildSpdx(packages) {
  return {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: "settler-monorepo-sbom",
    documentNamespace: `https://settler.dev/sbom/${createHash("sha256").update(String(Date.now())).digest("hex")}`,
    creationInfo: {
      creators: ["Tool: scripts/security/supply-chain.mjs"],
      created: new Date().toISOString(),
    },
    packages: packages.map((pkg, index) => ({
      SPDXID: `SPDXRef-Package-${index + 1}`,
      name: pkg.name,
      versionInfo: pkg.version,
      downloadLocation: "NOASSERTION",
      filesAnalyzed: false,
      licenseConcluded: "NOASSERTION",
      licenseDeclared: "NOASSERTION",
      externalRefs: [
        {
          referenceCategory: "PACKAGE-MANAGER",
          referenceType: "purl",
          referenceLocator: `pkg:npm/${encodeURIComponent(pkg.name)}@${pkg.version}`,
        },
      ],
    })),
  };
}

async function main() {
  const severityThreshold = process.env.SECURITY_AUDIT_FAIL_LEVEL || "high";
  const allowAuditUnavailable = process.env.SECURITY_AUDIT_ALLOW_UNAVAILABLE === "1";
  const severityOrder = ["info", "low", "moderate", "high", "critical"];
  const thresholdIndex = severityOrder.indexOf(severityThreshold);
  if (thresholdIndex === -1)
    throw new Error(`Unsupported SECURITY_AUDIT_FAIL_LEVEL='${severityThreshold}'`);

  const auditRun = await run("pnpm", ["audit", "--json"]);
  const auditRaw = auditRun.stdout || auditRun.stderr;
  const auditPath = path.join(outputDir, "audit.json");
  writeFileSync(auditPath, auditRaw, "utf8");

  let auditSummary = null;
  let auditUnavailableReason = null;

  try {
    auditSummary = parseAudit(auditRaw);
  } catch {
    if (auditRaw.includes("ERR_PNPM_AUDIT_BAD_RESPONSE") || auditRaw.includes("403")) {
      auditUnavailableReason = "registry_audit_endpoint_forbidden";
    } else {
      throw new Error("Unable to parse pnpm audit output as JSON.");
    }
  }

  if (auditUnavailableReason && !allowAuditUnavailable) {
    throw new Error(
      `Dependency audit unavailable (${auditUnavailableReason}). Set SECURITY_AUDIT_ALLOW_UNAVAILABLE=1 to soft-skip.`
    );
  }

  const depTreeRun = await run("pnpm", ["list", "--json", "--depth", "99"], { logOutput: false });
  if (depTreeRun.code !== 0) throw new Error("pnpm list failed; cannot generate SBOM.");
  const listParsed = JSON.parse(depTreeRun.stdout);
  const packageMap = new Map();
  for (const root of listParsed) collectPackages(root, packageMap);
  const packages = [...packageMap.values()].sort((a, b) =>
    `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)
  );

  const sbomCyclonePath = path.join(outputDir, "sbom.cyclonedx.json");
  const sbomSpdxPath = path.join(outputDir, "sbom.spdx.json");
  writeFileSync(sbomCyclonePath, JSON.stringify(buildCycloneDx(packages), null, 2), "utf8");
  writeFileSync(sbomSpdxPath, JSON.stringify(buildSpdx(packages), null, 2), "utf8");

  let thresholdFailures = 0;
  const thresholdBreakdown = {};
  if (auditSummary?.totals) {
    for (const severity of severityOrder.slice(thresholdIndex)) {
      thresholdFailures += auditSummary.totals[severity] || 0;
      thresholdBreakdown[severity] = auditSummary.totals[severity] || 0;
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    runId,
    failLevel: severityThreshold,
    auditUnavailableReason,
    vulnerabilities: auditSummary?.totals || null,
    thresholdBreakdown,
    thresholdFailures,
    packageCount: packages.length,
    sbom: {
      cyclonedx: path.relative(repoRoot, sbomCyclonePath),
      spdx: path.relative(repoRoot, sbomSpdxPath),
    },
    limitations: [
      "Dependency scan covers known advisories resolvable via package registry audit endpoint.",
      "SBOM is generated from resolved package tree; registry metadata gaps may reduce precision.",
      "This does not replace code-level SAST, runtime DAST, or manual red-team testing.",
    ],
  };

  const summaryPath = path.join(outputDir, "summary.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  writeFileSync(
    path.join(repoRoot, "artifacts", "security", "supply-chain-latest.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  console.log(`Supply-chain report: ${path.relative(repoRoot, summaryPath)}`);

  if (!auditUnavailableReason && thresholdFailures > 0) {
    console.error(
      `Dependency vulnerabilities at/above '${severityThreshold}': ${thresholdFailures}.`
    );
    process.exit(1);
  }

  if (auditUnavailableReason) {
    console.warn(`⚠️ Dependency audit soft-skipped (${auditUnavailableReason}).`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
