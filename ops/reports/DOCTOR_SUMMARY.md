# Ops Doctor Summary

**Generated:** 2026-06-10, 9:01:16 p.m.
**Total Duration:** 171.0s

---

## Summary

- ✅ **Passed:** 5
- ❌ **Failed:** 0
- ⚠️ **Warnings:** 2
- ⏭️ **Skipped:** 2

**Overall Status:** ⚠️ WARNINGS

---

## Check Results

### ✅ Lint

- **Status:** PASS
- **Message:** Check passed
- **Duration:** 8010ms

**Logs:**

```

> settler-monorepo@1.0.0 prelint
> pnpm run check:node


> settler-monorepo@1.0.0 check:node C:\Users\scott\GitHub\Settler
> node scripts/assert-node-version.mjs

✅ Node runtime OK (v24.15.0; required 24.12.0, >=24.0.0 <25.0.0)

> settler-monorepo@1.0.0 lint
> turbo run lint


   • Packages in scope: @jobforge/adapter-settler, @jobforge/errors, @jobforge/fetch, @jobforge/sdk-ts, @jobforge/shared, @jobforge/typescript-config, @requiem/hash, @settler/adapters, @settler/agents, @settler/api, @settler/cli, @settler/edge-ai-core, @settler/edge-node, @settler/logger, @settler/proofs, @settler/protocol, @settler/react-settler, @settler/reconciliation-core, @settler/sdk, @settler/sdk-csharp, @settler/sdk-java, @settler/sdk-js, @settler/support-intake, @settler/types, @settler/web
   • Running lint in 25 packages
   • Remote caching disabled

@jobforge/fetch:lint: cache hit, replaying logs 991add7c54f8769e
@settler/edge-ai-core:lint: cache hit, replaying logs f3857004e1d092ac
@jobforge/fetch:l
```

### ✅ Typecheck

- **Status:** PASS
- **Message:** Check passed
- **Duration:** 36471ms

**Logs:**

```

> settler-monorepo@1.0.0 pretypecheck
> pnpm run check:node


> settler-monorepo@1.0.0 check:node C:\Users\scott\GitHub\Settler
> node scripts/assert-node-version.mjs

✅ Node runtime OK (v24.15.0; required 24.12.0, >=24.0.0 <25.0.0)

> settler-monorepo@1.0.0 typecheck
> turbo run typecheck


   • Packages in scope: @jobforge/adapter-settler, @jobforge/errors, @jobforge/fetch, @jobforge/sdk-ts, @jobforge/shared, @jobforge/typescript-config, @requiem/hash, @settler/adapters, @settler/agents, @settler/api, @settler/cli, @settler/edge-ai-core, @settler/edge-node, @settler/logger, @settler/proofs, @settler/protocol, @settler/react-settler, @settler/reconciliation-core, @settler/sdk, @settler/sdk-csharp, @settler/sdk-java, @settler/sdk-js, @settler/support-intake, @settler/types, @settler/web
   • Running typecheck in 25 packages
   • Remote caching disabled

@settler/protocol:typecheck: cache hit, replaying logs 94a9635335166475
@settler/protocol:typecheck:
@settler/protocol:typecheck: >
```

### ✅ Route Registry

- **Status:** PASS
- **Message:** Route registry generated

### ⚠️ Dead Link Check

- **Status:** WARNING
- **Message:** Command failed: npm run qa:links
  npm warn Unknown env config "allowed-deprecated-versions". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
  npm warn Unknown env config "overrides". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
  npm warn Unknown env config "patched-dependencies". This will stop working in the next major version of npm. See `npm help npmrc` for supported config
- **Duration:** 1434ms

**Logs:**

```

> settler-monorepo@1.0.0 qa:links
> pnpm run qa:routes && tsx scripts/qa-extract-links.ts && tsx scripts/qa-check-dead-links.ts


> settler-monorepo@1.0.0 qa:routes C:\Users\scott\GitHub\Settler
> tsx scripts/qa-generate-route-registry.ts

🔍 Scanning app directory for routes...
✅ Found 276 page routes
✅ Route registry written to qa/route-registry.json and qa/route-registry.ts
   - 276 page routes
   - 515 total route files
🔍 Scanning codebase for internal links...
✅ Found 683 internal link references
   - 175 unique paths
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
npm warn Unknown env config "allowed-deprecated-versions". This will stop working in the next major version of npm. See `npm help npmrc` for supported config opti
```

### ⏭️ Health Endpoints

- **Status:** SKIP
- **Message:** Health endpoint check requires running server - skipped in CI

### ✅ Build

- **Status:** PASS
- **Message:** Build successful

---

## Next Steps

### ⚠️ Warnings

- **Dead Link Check:** Command failed: npm run qa:links
  npm warn Unknown env config "allowed-deprecated-versions". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
  npm warn Unknown env config "overrides". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
  npm warn Unknown env config "patched-dependencies". This will stop working in the next major version of npm. See `npm help npmrc` for supported config
- **SLA Violations:** SLA violations detected - check logs for details

---

_Generated by Ops Doctor - "One Command to Rule Them All"_
