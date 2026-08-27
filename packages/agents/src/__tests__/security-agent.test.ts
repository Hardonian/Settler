import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { SecurityAgent } from "../security-agent";

function createTempRepo(): string {
  return mkdtempSync("/tmp/settler-agents-");
}

function ensureDir(root: string, relativePath: string): string {
  const dir = join(root, relativePath);
  mkdirSync(dir, { recursive: true });
  return dir;
}

test("secret scan ignores allowlisted docs but fails on inline source leaks", async (t) => {
  const repoRoot = createTempRepo();
  t.after(() => rmSync(repoRoot, { recursive: true, force: true }));

  ensureDir(repoRoot, "src");
  ensureDir(repoRoot, "docs");

  writeFileSync(
    join(repoRoot, "docs", "readme.md"),
    'token = "ghp_abcdefghijklmnopqrstuvwxyz1234"\n'
  );
  writeFileSync(
    join(repoRoot, "src", "leak.ts"),
    'export const stripeKey = "sk_live_' + '51AAAAAAAAAAAAAAAA1234";\n'
  );

  const report = await new SecurityAgent({ repoRoot }).scan("secrets");

  assert.equal(report.verdict, "failed");
  assert.equal(report.issues.length, 1);
  assert.equal(report.issues[0]?.file, "src/leak.ts");
  assert.equal(report.issues[0]?.severity, "critical");
});

test("dependency scan reports degraded evidence instead of silent success", async (t) => {
  const repoRoot = createTempRepo();
  t.after(() => rmSync(repoRoot, { recursive: true, force: true }));

  ensureDir(repoRoot, "artifacts/security");

  writeFileSync(
    join(repoRoot, "artifacts", "security", "dependency-evidence-latest.json"),
    JSON.stringify(
      {
        status: "PASS_WITH_DEGRADED_EVIDENCE",
        evidenceState: "DEGRADED",
        reason: "Authenticated advisory completeness is unavailable.",
        evidenceCompleteness: "partial",
        localAudit: {
          summary: { critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
          outcome: "passed",
        },
        advisoryCompleteness: {
          status: "unauthenticated",
        },
      },
      null,
      2
    )
  );

  const report = await new SecurityAgent(
    {
      repoRoot,
    },
    {
      runCommand: (command, args) => ({
        command,
        args,
        status: 0,
        stdout: "",
        stderr: "",
      }),
    }
  ).scan("vulnerabilities");

  assert.equal(report.verdict, "verified_degraded");
  assert.equal(report.checks[0]?.name, "vulnerabilities");
  assert.equal(report.checks[0]?.status, "degraded");
});

test("rls scan fails closed when tenant isolation command fails", async (t) => {
  const repoRoot = createTempRepo();
  t.after(() => rmSync(repoRoot, { recursive: true, force: true }));

  ensureDir(repoRoot, "artifacts/security");

  writeFileSync(
    join(repoRoot, "artifacts", "security", "rls-evidence-latest.json"),
    JSON.stringify(
      {
        status: "PASS",
        evidenceState: "VERIFIED",
        reason: "Live DB RLS policy and runtime allow/deny matrix were confirmed.",
        evidenceLevel: "runtime-confirmed",
        runtimeExecuted: true,
      },
      null,
      2
    )
  );

  writeFileSync(
    join(repoRoot, "artifacts", "security", "cross-tenant-results-latest.json"),
    JSON.stringify(
      {
        status: "failed",
        exitCode: 1,
      },
      null,
      2
    )
  );

  const report = await new SecurityAgent(
    { repoRoot },
    {
      runCommand: (command, args) => ({
        command,
        args,
        status: args.includes("test:cross-tenant") ? 1 : 0,
        stdout: "",
        stderr: args.includes("test:cross-tenant") ? "cross-tenant denied" : "",
      }),
    }
  ).scan("rls");

  assert.equal(report.verdict, "failed");
  assert.equal(report.checks[0]?.status, "failed");
  assert.equal(report.issues[0]?.type, "rls");
});
