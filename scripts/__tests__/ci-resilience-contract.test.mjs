import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const packageJson = JSON.parse(read("package.json"));
const criticalWorkflows = [
  ".github/workflows/ci.yml",
  ".github/workflows/e2e.yml",
  ".github/workflows/security.yml",
];
const workflowPaths = readdirSync(path.join(repoRoot, ".github/workflows"))
  .filter((name) => name.endsWith(".yml"))
  .map((name) => `.github/workflows/${name}`);

test("Linux workflows pin the runner image and avoid Node 20 cache actions", () => {
  for (const workflow of workflowPaths) {
    const source = read(workflow);
    assert.doesNotMatch(source, /runs-on:\s*ubuntu-latest/, workflow);
    assert.doesNotMatch(source, /actions\/cache@v4/, workflow);
  }
});

test("packageManager is the single pnpm version authority", () => {
  assert.equal(packageJson.packageManager, "pnpm@10.13.1");

  for (const workflow of criticalWorkflows) {
    const lines = read(workflow).split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].includes("uses: pnpm/action-setup@")) continue;
      const step = [];
      for (let next = index + 1; next < lines.length; next += 1) {
        if (/^\s{6}-\s/.test(lines[next])) break;
        step.push(lines[next]);
      }
      assert.doesNotMatch(step.join("\n"), /^\s+version:/m, workflow);
    }
  }
});

test("API and E2E suites remain split into four isolated shards", () => {
  const ci = read(".github/workflows/ci.yml");
  const e2e = read(".github/workflows/e2e.yml");

  for (let index = 1; index <= 4; index += 1) {
    const shard = new RegExp(`\\{ index: ${index}, total: 4 \\}`);
    assert.match(ci, shard, `missing API shard ${index}/4`);
    assert.match(e2e, shard, `missing E2E shard ${index}/4`);
  }

  assert.match(ci, /--shard=\$\{\{ matrix\.shard\.index \}\}\/\$\{\{ matrix\.shard\.total \}\}/);
  assert.match(e2e, /--shard=\$\{\{ matrix\.shard\.index \}\}\/\$\{\{ matrix\.shard\.total \}\}/);
  assert.match(e2e, /playwright test --project=ci-critical --shard=/);
  assert.match(read("playwright.config.ts"), /name:\s*"ci-critical"/);
});

test("the default E2E command runs only the owned critical contract", () => {
  const config = read("playwright.config.ts");
  assert.equal(packageJson.scripts["test:e2e"], "playwright test --project=ci-critical");
  assert.match(config, /name:\s*"ci-critical"/);
  assert.doesNotMatch(config, /name:\s*"chromium"/);
  assert.doesNotMatch(config, /name:\s*"firefox"/);

  for (const staleSpec of [
    "a11y.spec.ts",
    "api-contracts.spec.ts",
    "console-smoke.spec.ts",
    "onboarding-flow.spec.ts",
    "reality-gates.spec.ts",
    "reconciliation-flow.spec.ts",
    "smoke.spec.ts",
  ]) {
    assert.equal(
      existsSync(path.join(repoRoot, "tests/e2e", staleSpec)),
      false,
      `${staleSpec} must not be restored as a competing default gate`
    );
  }
});

test("generated and ignored output never enters the Git index", () => {
  const trackedIgnored = execFileSync("git", ["ls-files", "-ci", "--exclude-standard"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  assert.equal(trackedIgnored, "");
});

test("parity gate does not duplicate expensive build and API suites", () => {
  const command = packageJson.scripts["verify:ci:contracts"];
  assert.ok(command, "verify:ci:contracts must be registered");
  assert.doesNotMatch(command, /test:ci:verify|pnpm run build|pnpm run lint|pnpm run typecheck/);
});

test("security evidence jobs are bounded and use managed process trees", () => {
  const security = read(".github/workflows/security.yml");
  assert.match(security, /dependency-audit:[\s\S]*?timeout-minutes:\s*20/);
  assert.match(read("scripts/security/header-probe.mjs"), /spawnManagedProcess/);
  assert.match(read("scripts/security/runtime-smoke.mjs"), /spawnManagedProcess/);
  assert.match(read("scripts/verify-routes.mjs"), /spawnManagedProcess/);
});

test("Helm packaging discovers every required chart secret", () => {
  const verifier = read("scripts/verify-helm-packaging.mjs");

  assert.match(verifier, /readFileSync\(secretTemplatePath/);
  assert.match(verifier, /\.Values\\\.secrets\\\.\(\[A-Z0-9_\]\+\)/);
  assert.match(verifier, /requiredSecretKeys\.flatMap/);
  assert.match(verifier, /["']lint["'], chartDir, \.\.\.secretArgs/);
  assert.match(
    verifier,
    /["']template["'], ["']settler-packaging-smoke["'], chartDir, \.\.\.secretArgs/
  );
});

test("browser gates use production parity and bounded route probes", () => {
  const e2e = read(".github/workflows/e2e.yml");

  assert.match(read("playwright.config.ts"), /NODE_ENV:\s*process\.env\.CI\s*\?\s*"production"/);
  assert.match(read("scripts/marketing-cta-smoke.mjs"), /AbortSignal\.timeout\(10_000\)/);
  assert.match(e2e, /e2e:[\s\S]*?env:[\s\S]*?DATABASE_URL:[\s\S]*?INTERNAL_API_URL:/);
  assert.match(e2e, /visual-regression:[\s\S]*?env:[\s\S]*?DATABASE_URL:[\s\S]*?INTERNAL_API_URL:/);
  assert.doesNotMatch(
    read("tests/e2e/landing-home.visual.spec.ts"),
    /Institutional Strategic Value Proposition/
  );
});

test("database migrations have one serialized fail-closed production owner", () => {
  const workflow = read(".github/workflows/auto-migrate-on-main.yml");
  const guardian = read(".github/workflows/migration-guardian.yml");
  const database = read("packages/api/src/db/index.ts");

  assert.match(workflow, /uses: supabase\/setup-cli@v3[\s\S]*?version: 2\.118\.0/);
  assert.match(workflow, /group: settler-production-database-migrations/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /prisma-migrate-via-supabase-pooler\.mjs deploy/);
  assert.match(workflow, /supabase-migration-contract\.mjs deploy/);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are required/);
  assert.doesNotMatch(workflow, /^env:/m, "database credentials must not be job-wide");
  assert.match(
    workflow,
    /name: Apply Prisma migrations[\s\S]*?DATABASE_CREDENTIAL_SOURCE: \$\{\{ secrets\.DATABASE_URL \}\}/
  );
  assert.doesNotMatch(workflow, /^\s+psql\s|secrets\.DIRECT_URL/m);
  assert.doesNotMatch(workflow, /connection_ok=false|skipping migration/);

  assert.match(guardian, /supabase-migration-contract\.mjs validate/);
  assert.doesNotMatch(guardian, /secrets\.|prisma migrate deploy|environment: production/);
  assert.doesNotMatch(database, /import\("\.\/migrate"\)|readFileSync\(migrationPath/);
  assert.match(database, /export async function initDatabase[\s\S]*?SELECT 1/);

  for (const removedScript of [
    "db:migrate:auto",
    "db:migrate:all",
    "db:migrate:pending",
    "migration:guardian",
  ]) {
    assert.equal(
      packageJson.scripts[removedScript],
      undefined,
      `${removedScript} must stay removed`
    );
  }
});
