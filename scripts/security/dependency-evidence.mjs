#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { evaluateDependencyEvidence } from "./dependency-evidence-lib.mjs";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "dependency-evidence", runId);
mkdirSync(outputDir, { recursive: true });
mkdirSync(path.join(repoRoot, "security"), { recursive: true });

const mode = process.env.SECURITY_DEPENDENCY_EVIDENCE_MODE || "standard";
const advisoryImportPath =
  process.env.DEPENDABOT_ALERTS_EXPORT_PATH || "security/dependabot-alerts.json";

function readJson(relPath) {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, relPath), "utf8"));
  } catch {
    return null;
  }
}

function readJsonCandidate(candidatePath) {
  try {
    const full = path.isAbsolute(candidatePath)
      ? candidatePath
      : path.join(repoRoot, candidatePath);
    return JSON.parse(readFileSync(full, "utf8"));
  } catch {
    return null;
  }
}

function resolveAdvisory() {
  const imported = readJsonCandidate(advisoryImportPath);
  if (Array.isArray(imported?.alerts)) {
    return {
      status: "complete",
      source: "dependabot_export_import",
      authenticated: true,
      advisoryCount: imported.alerts.length,
      reason: "Authenticated Dependabot export imported successfully.",
      provenance: {
        importPath: advisoryImportPath,
        generatedAt: imported.generatedAt || imported.exportedAt || null,
      },
      nextAction: null,
    };
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
  const repo = process.env.GITHUB_REPOSITORY || null;
  if (token && repo) {
    const cmd = `gh api repos/${repo}/dependabot/alerts --paginate -q '.'`;
    const result = spawnSync("bash", ["-lc", cmd], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, GH_TOKEN: token },
      timeout: 60_000,
    });

    if (result.status === 0) {
      try {
        const alerts = JSON.parse(result.stdout);
        if (Array.isArray(alerts)) {
          return {
            status: "complete",
            source: "github_dependabot_api",
            authenticated: true,
            advisoryCount: alerts.length,
            reason: "Authenticated advisory evidence pulled from GitHub API.",
            provenance: {
              repository: repo,
              fetchedAt: new Date().toISOString(),
              command: cmd,
            },
            nextAction: null,
          };
        }
      } catch {
        return {
          status: "failed",
          source: "github_dependabot_api",
          authenticated: true,
          advisoryCount: null,
          reason: "GitHub advisory API response was not valid JSON.",
          provenance: { repository: repo, command: cmd },
          nextAction: "Verify gh auth/token scopes and rerun advisory collection.",
        };
      }
    }

    return {
      status: "degraded",
      source: "github_dependabot_api",
      authenticated: true,
      advisoryCount: null,
      reason: (result.stderr || result.stdout || "GitHub advisory API call failed.")
        .trim()
        .slice(0, 280),
      provenance: { repository: repo, command: cmd, exitCode: result.status },
      nextAction: "Use DEPENDABOT_ALERTS_EXPORT_PATH with an authenticated export artifact.",
    };
  }

  return {
    status: token ? "partial" : "unauthenticated",
    source: "none",
    authenticated: Boolean(token),
    advisoryCount: null,
    reason: token
      ? "Token present but repository context missing for authenticated advisory pull."
      : "No authenticated advisory source configured.",
    provenance: { importPath: advisoryImportPath, repository: repo },
    nextAction:
      "Provide DEPENDABOT_ALERTS_EXPORT_PATH or set GITHUB_TOKEN/GH_TOKEN with GITHUB_REPOSITORY.",
  };
}

const audit = readJson("artifacts/security/dependency-audit-latest.json");
const advisory = resolveAdvisory();
const lockfiles = [
  {
    ecosystem: "npm",
    path: "pnpm-lock.yaml",
    present: existsSync(path.join(repoRoot, "pnpm-lock.yaml")),
  },
  {
    ecosystem: "npm",
    path: "package-lock.json",
    present: existsSync(path.join(repoRoot, "package-lock.json")),
  },
  { ecosystem: "npm", path: "yarn.lock", present: existsSync(path.join(repoRoot, "yarn.lock")) },
  {
    ecosystem: "cargo",
    path: "Cargo.lock",
    present: existsSync(path.join(repoRoot, "Cargo.lock")),
  },
];

const evaluation = evaluateDependencyEvidence({ mode, audit, advisory, lockfiles });

const artifact = {
  reportVersion: "2026-03-09.1",
  generatedAt: new Date().toISOString(),
  runId,
  status: evaluation.status,
  reason: evaluation.reason,
  evidenceCompleteness: evaluation.evidenceCompleteness,
  environmentConstraints: evaluation.environmentConstraints,
  nextOperatorAction: evaluation.nextActions,
  policy: { mode },
  ecosystems: evaluation.lockSummary.ecosystems,
  lockfiles: evaluation.lockfiles,
  localAudit: evaluation.localAudit,
  advisoryCompleteness: evaluation.advisory,
};

const outJson = path.join(outputDir, "dependency-evidence.json");
writeFileSync(outJson, JSON.stringify(artifact, null, 2));
writeFileSync(
  path.join(repoRoot, "security", "dependency-evidence.json"),
  JSON.stringify(artifact, null, 2)
);
writeFileSync(
  path.join(repoRoot, "artifacts", "security", "dependency-evidence-latest.json"),
  JSON.stringify(artifact, null, 2)
);

const md = [
  "# Dependency Evidence",
  `- status: ${artifact.status}`,
  `- evidenceCompleteness: ${artifact.evidenceCompleteness}`,
  `- mode: ${mode}`,
  `- ecosystems: ${artifact.ecosystems.join(", ") || "none"}`,
  `- localAuditOutcome: ${artifact.localAudit.outcome}`,
  `- advisoryStatus: ${artifact.advisoryCompleteness.status}`,
  "",
  "## Environment constraints",
  ...(artifact.environmentConstraints.length
    ? artifact.environmentConstraints.map((item) => `- ${item}`)
    : ["- none"]),
  "",
  "## Next operator action",
  ...(artifact.nextOperatorAction.length
    ? artifact.nextOperatorAction.map((item) => `- ${item}`)
    : ["- none"]),
].join("\n");

writeFileSync(path.join(outputDir, "dependency-evidence.md"), md);
writeFileSync(path.join(repoRoot, "security", "dependency-evidence.md"), md);

console.log(`Dependency evidence artifact: ${path.relative(repoRoot, outJson)}`);
console.log(`Dependency evidence status: ${artifact.status}`);

if (mode === "strict" && artifact.status !== "PASS") {
  process.exit(1);
}
