import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

test("build graph generates Prisma once and excludes framework-local caches", () => {
  const turbo = readJson("turbo.json");
  const build = turbo.tasks.build;
  const prisma = turbo.tasks["//#prisma:generate"];

  assert.ok(build.dependsOn.includes("//#prisma:generate"));
  assert.ok(build.dependsOn.includes("^build"));
  assert.ok(build.outputs.includes("!.next/cache/**"));
  assert.equal(prisma.cache, false);
  assert.deepEqual(prisma.inputs, [
    "prisma/schema.prisma",
    "prisma.config.ts",
    "scripts/prisma-generate.mjs",
    "package.json",
    "pnpm-lock.yaml",
  ]);
});

test("package prebuild hooks do not rebuild graph dependencies", () => {
  for (const packagePath of ["packages/api/package.json", "packages/web/package.json"]) {
    const prebuild = readJson(packagePath).scripts.prebuild;
    assert.match(prebuild, /assert-node-version/);
    assert.doesNotMatch(prebuild, /prisma:generate/);
    assert.doesNotMatch(prebuild, /pnpm --filter/);
  }
});

test("main CI exposes optional Turbo remote-cache credentials", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(workflow, /TURBO_TOKEN: \$\{\{ secrets\.TURBO_TOKEN \}\}/);
  assert.match(workflow, /TURBO_TEAM: \$\{\{ secrets\.TURBO_TEAM \}\}/);
});

test("browser verification boundary contains no Node built-ins", () => {
  const browserVerifier = readFileSync("packages/web/src/lib/verify.browser.ts", "utf8");
  const nodeVerifier = readFileSync("packages/web/src/lib/verify.node.ts", "utf8");
  const verifyPage = readFileSync("packages/web/src/app/verify/page.tsx", "utf8");

  assert.doesNotMatch(browserVerifier, /node:(?:fs|path|url|crypto)/);
  assert.doesNotMatch(browserVerifier, /from ["'](?:fs|path|url|crypto)["']/);
  assert.match(nodeVerifier, /node:fs/);
  assert.match(verifyPage, /@\/lib\/verify\.browser/);
});

test("cache diagnostics never print token material", () => {
  const checker = readFileSync("scripts/check-turbo-cache.mjs", "utf8");
  const legacyWrapper = readFileSync("scripts/setup-vercel-turbo-cache.sh", "utf8");

  assert.doesNotMatch(checker, /process\.env\.TURBO_TOKEN\.slice|substring\(/);
  assert.doesNotMatch(legacyWrapper, /TURBO_TOKEN:/);
});

test("build profiler launches pnpm without a Windows command-shell dependency", () => {
  const profiler = readFileSync("scripts/profile-build.mjs", "utf8");

  assert.match(profiler, /process\.env\.npm_execpath/);
  assert.match(profiler, /process\.execPath/);
  assert.doesNotMatch(profiler, /shell:\s*true/);
});
