# Ops Doctor Summary

**Generated:** 5/18/2026, 3:16:06 AM
**Total Duration:** 38.4s

---

## Summary

- ✅ **Passed:** 3
- ❌ **Failed:** 2
- ⚠️ **Warnings:** 2
- ⏭️ **Skipped:** 2

**Overall Status:** ❌ FAILED

---

## Check Results

### ✅ Lint

- **Status:** PASS
- **Message:** Check passed
- **Duration:** 1563ms

**Logs:**

```

> settler-monorepo@1.0.0 prelint
> pnpm run check:node


> settler-monorepo@1.0.0 check:node /app
> node scripts/assert-node-version.mjs

✅ Node runtime OK (v24.12.0; required 24.12.0, >=24.0.0 <25.0.0)

> settler-monorepo@1.0.0 lint
> turbo run lint


   • Packages in scope: @jobforge/adapter-settler, @jobforge/errors, @jobforge/fetch, @jobforge/sdk-ts, @jobforge/shared, @jobforge/typescript-config, @requiem/hash, @settler/adapters, @settler/agents, @settler/api, @settler/cli, @settler/edge-ai-core, @settler/edge-node, @settler/logger, @settler/proofs, @settler/protocol, @settler/react-settler, @settler/reconciliation-core, @settler/sdk, @settler/sdk-csharp, @settler/sdk-java, @settler/sdk-js, @settler/support-intake, @settler/types, @settler/web
   • Running lint in 25 packages
   • Remote caching disabled

@jobforge/errors:lint: cache hit, replaying logs dc44dfc3d713cb46
@jobforge/errors:lint:
@jobforge/errors:lint: > @jobforge/errors@0.1.0 lint /app/packages/jobforge-errors
@jobf
```

### ❌ Typecheck

- **Status:** FAIL
- **Message:** Command failed: npm run typecheck
  npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
  npm warn Unknown env config "lockfile". This will stop working in the next major version of npm.
  npm warn Unknown env config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
  npm warn Unknown project config "package-manager". This will stop working in the next major version of npm.
  npm warn Unknown project config "lockfile". Th
- **Duration:** 16404ms

**Logs:**

```

> settler-monorepo@1.0.0 pretypecheck
> pnpm run check:node


> settler-monorepo@1.0.0 check:node /app
> node scripts/assert-node-version.mjs

✅ Node runtime OK (v24.12.0; required 24.12.0, >=24.0.0 <25.0.0)

> settler-monorepo@1.0.0 typecheck
> turbo run typecheck


   • Packages in scope: @jobforge/adapter-settler, @jobforge/errors, @jobforge/fetch, @jobforge/sdk-ts, @jobforge/shared, @jobforge/typescript-config, @requiem/hash, @settler/adapters, @settler/agents, @settler/api, @settler/cli, @settler/edge-ai-core, @settler/edge-node, @settler/logger, @settler/proofs, @settler/protocol, @settler/react-settler, @settler/reconciliation-core, @settler/sdk, @settler/sdk-csharp, @settler/sdk-java, @settler/sdk-js, @settler/support-intake, @settler/types, @settler/web
   • Running typecheck in 25 packages
   • Remote caching disabled

@settler/sdk:typecheck: cache hit, replaying logs 1f833a055dc94c28
@settler/sdk:typecheck:
@settler/sdk:typecheck: > @settler/sdk@1.0.0 pretypecheck /app/pac
```

### ✅ Route Registry

- **Status:** PASS
- **Message:** Route registry generated

### ⚠️ Dead Link Check

- **Status:** WARNING
- **Message:** Command failed: npm run qa:links
  npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
  npm warn Unknown env config "lockfile". This will stop working in the next major version of npm.
  npm warn Unknown env config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
  npm warn Unknown project config "package-manager". This will stop working in the next major version of npm.
  npm warn Unknown project config "lockfile". Thi
- **Duration:** 3421ms

**Logs:**

```

> settler-monorepo@1.0.0 qa:links
> pnpm run qa:routes && tsx scripts/qa-extract-links.ts && tsx scripts/qa-check-dead-links.ts


> settler-monorepo@1.0.0 qa:routes /app
> tsx scripts/qa-generate-route-registry.ts

🔍 Scanning app directory for routes...
✅ Found 272 page routes
✅ Route registry written to qa/route-registry.json and qa/route-registry.ts
   - 272 page routes
   - 511 total route files
🔍 Scanning codebase for internal links...
✅ Found 674 internal link references
   - 172 unique paths
✅ Link registry written to qa/link-registry.json
🔍 Checking for dead links...

```

### ⚠️ SLA Violations

- **Status:** WARNING
- **Message:** SLA violations detected - check logs for details

### ✅ SOC2 Readiness

- **Status:** PASS
- **Message:** SOC2 checks passed

### ⏭️ DB Migration Status

- **Status:** SKIP
- **Message:** Could not check migration status

**Logs:**

```
Command failed: npm run prisma:status
npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
npm warn Unknown env config "lockfile". This will stop wor
```

### ⏭️ Health Endpoints

- **Status:** SKIP
- **Message:** Health endpoint check requires running server - skipped in CI

### ❌ Build

- **Status:** FAIL
- **Message:** Build failed

**Logs:**

```
Command failed: npm run build
npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
npm warn Unknown env config "lockfile". This will stop working in the next major version of npm.
npm warn Unknown env config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
npm warn Unknown project config "package-manager". This will stop working in the next major version of npm.
npm warn Unknown project config "lockfile". This w
```

---

## Next Steps

### ❌ Failed Checks

- **Typecheck:** Command failed: npm run typecheck
  npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
  npm warn Unknown env config "lockfile". This will stop working in the next major version of npm.
  npm warn Unknown env config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
  npm warn Unknown project config "package-manager". This will stop working in the next major version of npm.
  npm warn Unknown project config "lockfile". Th
- **Build:** Build failed

### ⚠️ Warnings

- **Dead Link Check:** Command failed: npm run qa:links
  npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
  npm warn Unknown env config "lockfile". This will stop working in the next major version of npm.
  npm warn Unknown env config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
  npm warn Unknown project config "package-manager". This will stop working in the next major version of npm.
  npm warn Unknown project config "lockfile". Thi
- **SLA Violations:** SLA violations detected - check logs for details

---

_Generated by Ops Doctor - "One Command to Rule Them All"_
