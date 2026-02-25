# Baseline Verification Report

Generated: 2026-02-25T07:12:26Z

## Environment

- pwd: /workspace/Settler
- git head: 079223a

## Dependency install

Scope: all 18 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│ │
│ Ignored build scripts: @playwright/browser-chromium, @prisma/engines, │
│ @sentry/cli, @sentry/profiling-node, bcrypt, better-sqlite3, esbuild, │
│ isolated-vm, msgpackr-extract, msw, prisma, protobufjs, sharp, │
│ unix-dgram, unrs-resolver. │
│ Run "pnpm approve-builds" to pick which dependencies should be allowed │
│ to run scripts. │
│ │
╰──────────────────────────────────────────────────────────────────────────────╯

. preinstall$ export SENTRY*SKIP_AUTO_INSTALL=1 || set SENTRY_SKIP_AUTO_INSTALL=1 || true
. preinstall: Done
. postinstall$ test -f scripts/vercel-prisma-postinstall.js && node scripts/vercel-prisma-postinstall.js || echo 'Skipping postinstall: script not found (expected in Vercel builds)'
. postinstall: 🔧 Running Prisma generate...
. postinstall: npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
. postinstall: npm warn Unknown env config "lockfile". This will stop working in the next major version of npm.
. postinstall: npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
. postinstall: npm warn Unknown env config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
. postinstall: npm warn Unknown env config "verify-deps-before-run". This will stop working in the next major version of npm.
. postinstall: npm warn Unknown env config "\_jsr-registry". This will stop working in the next major version of npm.
. postinstall: npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
. postinstall: npm warn config `--include=optional` to include them.
. postinstall: npm warn config
. postinstall: npm warn config Default value does install optional deps unless otherwise omitted.
. postinstall: npm warn Unknown project config "package-manager". This will stop working in the next major version of npm.
. postinstall: npm warn Unknown project config "lockfile". This will stop working in the next major version of npm.
. postinstall: npm warn Unknown project config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
. postinstall: npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
. postinstall: npm warn config `--include=optional` to include them.
. postinstall: npm warn config
. postinstall: npm warn config Default value does install optional deps unless otherwise omitted.
. postinstall: Loaded Prisma config from prisma.config.ts.
. postinstall: Prisma schema loaded from prisma/schema.prisma.
. postinstall: ✔ Generated Prisma Client (v7.3.0) to ./node_modules/.pnpm/@prisma+client@7.3.0_prisma@7.3.0*@types+react@18.3.27_better-sqlite3@12.6.2_react-dom@\_efc9348d8c027de17c7e00b84b73d1eb/node_modules/@prisma/client in 464ms
. postinstall: Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
. postinstall: ✅ Prisma generate completed successfully
. postinstall: Done
. prepare$ husky install 2>/dev/null || true
. prepare: husky - Git hooks installed
. prepare: Done
packages/web postinstall$ export SENTRY_SKIP_AUTO_INSTALL=1 || set SENTRY_SKIP_AUTO_INSTALL=1 || true
packages/web postinstall: Done
Done in 4.9s using pnpm v10.13.1

## pnpm lint

> settler-monorepo@1.0.0 lint /workspace/Settler
> turbo run lint

Attention:
Turborepo now collects completely anonymous telemetry regarding usage.
This information is used to shape the Turborepo roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://turborepo.dev/docs/telemetry

• turbo 2.8.0
• Packages in scope: @jobforge/adapter-settler, @jobforge/config, @jobforge/errors, @jobforge/fetch, @jobforge/sdk-ts, @jobforge/shared, @jobforge/typescript-config, @settler/adapters, @settler/api, @settler/cli, @settler/edge-ai-core, @settler/edge-node, @settler/protocol, @settler/react-settler, @settler/sdk, @settler/types, @settler/web
• Running lint in 17 packages
• Remote caching disabled
@settler/adapters:lint: cache miss, executing 3bae40409a7e1110
@settler/sdk:lint: cache miss, executing 2a2e7b9090ab058a
@settler/web:lint: cache miss, executing bbb5032b0157591e
@settler/api:lint: cache miss, executing cb8a6e2305b39e3c
@jobforge/errors:lint: cache miss, executing 6219fca2574e5291
@settler/cli:lint: cache miss, executing c7a1af71bebfed16
@jobforge/sdk-ts:lint: cache miss, executing 43383ef821e9c8de
@jobforge/shared:lint: cache miss, executing 19c5f688626d0948
@settler/edge-ai-core:lint: cache miss, executing 7a95eea93bbe039e
@settler/edge-node:lint: cache miss, executing 123fc492e6215a34
@settler/sdk:lint:
@settler/sdk:lint: > @settler/sdk@1.0.0 lint /workspace/Settler/packages/sdk
@settler/sdk:lint: > eslint src
@settler/sdk:lint:
@settler/web:lint:
@settler/web:lint: > @settler/web@1.0.0 lint /workspace/Settler/packages/web
@settler/web:lint: > eslint src
@settler/web:lint:
@jobforge/errors:lint:
@jobforge/errors:lint: > @jobforge/errors@0.1.0 lint /workspace/Settler/packages/jobforge-errors
@jobforge/errors:lint: > eslint "**/\*.ts"
@jobforge/errors:lint:
@jobforge/shared:lint:
@jobforge/shared:lint: > @jobforge/shared@0.1.0 lint /workspace/Settler/packages/jobforge-shared
@jobforge/shared:lint: > eslint src/
@jobforge/shared:lint:
@settler/edge-node:lint:
@settler/edge-node:lint: > @settler/edge-node@1.0.0 lint /workspace/Settler/packages/edge-node
@settler/edge-node:lint: > eslint src
@settler/edge-node:lint:
@settler/edge-ai-core:lint:
@settler/edge-ai-core:lint: > @settler/edge-ai-core@1.0.0 lint /workspace/Settler/packages/edge-ai-core
@settler/edge-ai-core:lint: > eslint src
@settler/edge-ai-core:lint:
@settler/adapters:lint:
@settler/adapters:lint: > @settler/adapters@1.0.0 lint /workspace/Settler/packages/adapters
@settler/adapters:lint: > eslint src
@settler/adapters:lint:
@settler/api:lint:
@settler/api:lint: > @settler/api@1.0.0 lint /workspace/Settler/packages/api
@settler/api:lint: > eslint src
@settler/api:lint:
@jobforge/sdk-ts:lint:
@jobforge/sdk-ts:lint: > @jobforge/sdk-ts@0.1.0 lint /workspace/Settler/packages/jobforge-sdk-ts
@jobforge/sdk-ts:lint: > eslint src/
@jobforge/sdk-ts:lint:
@settler/cli:lint:
@settler/cli:lint: > @settler/cli@1.0.0 lint /workspace/Settler/packages/cli
@settler/cli:lint: > eslint src
@settler/cli:lint:
@settler/sdk:lint:
@settler/sdk:lint: /workspace/Settler/packages/sdk/src/utils/middleware.ts
@settler/sdk:lint: 72:31 warning Unexpected console statement. Only these console methods are allowed: warn, error no-console
@settler/sdk:lint:
@settler/sdk:lint: ✖ 1 problem (0 errors, 1 warning)
@settler/sdk:lint:
@jobforge/fetch:lint: cache miss, executing 48a765038863b5ff
@jobforge/fetch:lint:
@jobforge/fetch:lint: > @jobforge/fetch@0.1.0 lint /workspace/Settler/packages/jobforge-fetch
@jobforge/fetch:lint: > eslint "**/\*.ts"
@jobforge/fetch:lint:
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/infrastructure/jobs/scheduler-service.ts
@settler/api:lint: 30:10 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/infrastructure/security/SSRFProtection.ts
@settler/api:lint: 66:14 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint: 72:12 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint: 94:12 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/jobs/email-scheduler.ts
@settler/api:lint: 12:10 warning '_calculateDaysRemaining' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/middleware/api-gateway-cache.ts
@settler/api:lint: 182:16 warning '\_pattern' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/routes/enterprise.ts
@settler/api:lint: 200:24 warning 'secret' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/routes/export-enhanced.ts
@settler/api:lint: 71:27 warning '\_includeUnmatched' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/routes/webhooks.ts
@settler/api:lint: 2:18 warning 'Request' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/services/determinism/execution-orchestrator.ts
@settler/api:lint: 16:10 warning 'createRunSnapshot' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint: 16:29 warning 'updateRunSnapshotStatus' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint: 16:54 warning 'RunSnapshot' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/services/determinism/idempotent-ingestion.ts
@settler/api:lint: 96:59 warning 'effective_date' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/services/determinism/replay-service.ts
@settler/api:lint: 227:33 warning 'snapshot' is defined but never used. Allowed unused args must match /^_/u @typescript-eslint/no-unused-vars
@settler/api:lint: 258:34 warning 'snapshot' is defined but never used. Allowed unused args must match /^_/u @typescript-eslint/no-unused-vars
@settler/api:lint: 416:3 warning 'runId' is defined but never used. Allowed unused args must match /^_/u @typescript-eslint/no-unused-vars
@settler/api:lint: 417:3 warning 'replayMatches' is defined but never used. Allowed unused args must match /^_/u @typescript-eslint/no-unused-vars
@settler/api:lint: 428:3 warning 'replayRunId' is defined but never used. Allowed unused args must match /^_/u @typescript-eslint/no-unused-vars
@settler/api:lint: 465:35 warning 'originalRunId' is defined but never used. Allowed unused args must match /^\_/u @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/services/determinism/verification-gates.ts
@settler/api:lint: 11:10 warning 'query' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/services/knowledge/decision-log.ts
@settler/api:lint: 228:14 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: /workspace/Settler/packages/api/src/services/reconciliation/automated-review.ts
@settler/api:lint: 453:12 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/api:lint:
@settler/api:lint: ✖ 22 problems (0 errors, 22 warnings)
@settler/api:lint:
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/data/import/route.ts
@settler/web:lint: 26:21 warning '\_id' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/enterprise/ip-allowlist/route.ts
@settler/web:lint: 67:24 warning '\_ipAddress' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/integrations/[integrationId]/versions/route.ts
@settler/web:lint: 15:28 warning '\_integrationId' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/jobs/[id]/exceptions/[exceptionId]/route.ts
@settler/web:lint: 120:22 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 130:18 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/jobs/[id]/exceptions/route.ts
@settler/web:lint: 166:22 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 176:18 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/jobs/[id]/progress/route.ts
@settler/web:lint: 96:20 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/jobs/bulk/route.ts
@settler/web:lint: 67:22 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 77:18 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/v1/recon/jobs/route.ts
@settler/web:lint: 38:16 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/api/vercel-example/route.ts
@settler/web:lint: 39:12 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/components/PositioningFeedbackForm.tsx
@settler/web:lint: 63:14 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/console/activity/page.tsx
@settler/web:lint: 58:14 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/console/inspector/page.tsx
@settler/web:lint: 62:14 warning 'error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/app/enterprise/page.tsx
@settler/web:lint: 201:15 warning 'Icon' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/components/RulesEditor.tsx
@settler/web:lint: 49:10 warning '\_selectedTemplate' is assigned a value but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/components/admin/ai-assist.tsx
@settler/web:lint: 10:10 warning 'useState' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/components/monitoring/PerformanceMonitor.tsx
@settler/web:lint: 32:18 warning '\_error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/components/stitch-import/ConnectionsPanel.tsx
@settler/web:lint: 20:3 warning 'X' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 26:56 warning 'SheetTrigger' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 95:5 warning Unexpected console statement. Only these console methods are allowed: warn, error no-console
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/components/stitch-import/PipelinesPanel.tsx
@settler/web:lint: 13:3 warning 'Database' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 14:3 warning 'Code' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 24:3 warning 'CheckCircle2' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 86:5 warning Unexpected console statement. Only these console methods are allowed: warn, error no-console
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/components/stitch-import/ResultsPanel.tsx
@settler/web:lint: 19:3 warning 'MoreVertical' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 20:3 warning 'X' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 21:3 warning 'FileText' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 77:5 warning Unexpected console statement. Only these console methods are allowed: warn, error no-console
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/components/stitch-import/ReviewQueuePanel.tsx
@settler/web:lint: 9:3 warning 'ChevronRight' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 10:3 warning 'MoreVertical' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 14:3 warning 'X' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 15:3 warning 'TrendingUp' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 16:3 warning 'Search' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 62:5 warning Unexpected console statement. Only these console methods are allowed: warn, error no-console
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/lib/ai/insights-generator.ts
@settler/web:lint: 55:18 warning '\_error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/lib/db/cache.ts
@settler/web:lint: 60:12 warning '\_error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 83:12 warning '\_error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint: 117:12 warning '\_error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/lib/observability/logger.ts
@settler/web:lint: 79:11 warning Unexpected console statement. Only these console methods are allowed: warn, error no-console
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/lib/reconciliation/**tests**/trust-envelope.test.ts
@settler/web:lint: 2:15 warning 'ReconciliationProofCapsule' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/lib/security/encryption.ts
@settler/web:lint: 101:12 warning '\_error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: /workspace/Settler/packages/web/src/lib/validation/component-validation.ts
@settler/web:lint: 58:12 warning '\_error' is defined but never used @typescript-eslint/no-unused-vars
@settler/web:lint:
@settler/web:lint: ✖ 44 problems (0 errors, 44 warnings)
@settler/web:lint:

Tasks: 11 successful, 11 total
Cached: 0 cached, 11 total
Time: 35.017s

Exit code: 0

## pnpm typecheck

> settler-monorepo@1.0.0 typecheck /workspace/Settler
> turbo run typecheck

• turbo 2.8.0
• Packages in scope: @jobforge/adapter-settler, @jobforge/config, @jobforge/errors, @jobforge/fetch, @jobforge/sdk-ts, @jobforge/shared, @jobforge/typescript-config, @settler/adapters, @settler/api, @settler/cli, @settler/edge-ai-core, @settler/edge-node, @settler/protocol, @settler/react-settler, @settler/sdk, @settler/types, @settler/web
• Running typecheck in 17 packages
• Remote caching disabled
@settler/adapters:typecheck: cache miss, executing 9dfd6cb98a65d9e6
@settler/types:typecheck: cache miss, executing a5fe1fa944e423a7
@settler/api:typecheck: cache miss, executing 135bf4a867d0e9d2
@settler/sdk:typecheck: cache miss, executing 31f72c942ded5029
@settler/edge-node:typecheck: cache miss, executing db37ce43f49e0113
@jobforge/shared:typecheck: cache miss, executing c4c3fb10e0072c37
@settler/web:typecheck: cache miss, executing 712d5607181d986b
@settler/protocol:typecheck: cache miss, executing ae7c097d97e058a2
@settler/react-settler:typecheck: cache miss, executing b99a675251607f6c
@settler/edge-ai-core:typecheck: cache miss, executing 9c38c66a66c82b9b
@settler/api:typecheck:
@settler/api:typecheck: > @settler/api@1.0.0 pretypecheck /workspace/Settler/packages/api
@settler/api:typecheck: > cd ../.. && npm run prisma:generate || npx prisma generate || echo 'Warning: Prisma generate may have failed'
@settler/api:typecheck:
@settler/edge-node:typecheck:
@settler/edge-node:typecheck: > @settler/edge-node@1.0.0 typecheck /workspace/Settler/packages/edge-node
@settler/edge-node:typecheck: > tsc --noEmit
@settler/edge-node:typecheck:
@settler/types:typecheck:
@settler/types:typecheck: > @settler/types@1.0.0 typecheck /workspace/Settler/packages/types
@settler/types:typecheck: > tsc --noEmit
@settler/types:typecheck:
@settler/protocol:typecheck:
@settler/protocol:typecheck: > @settler/protocol@0.1.0 typecheck /workspace/Settler/packages/protocol
@settler/protocol:typecheck: > tsc --noEmit
@settler/protocol:typecheck:
@settler/react-settler:typecheck:
@settler/react-settler:typecheck: > @settler/react-settler@0.1.0 typecheck /workspace/Settler/packages/react-settler
@settler/react-settler:typecheck: > tsc --noEmit
@settler/react-settler:typecheck:
@settler/adapters:typecheck:
@settler/adapters:typecheck: > @settler/adapters@1.0.0 typecheck /workspace/Settler/packages/adapters
@settler/adapters:typecheck: > tsc --noEmit
@settler/adapters:typecheck:
@settler/api:typecheck: npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
@settler/api:typecheck: npm warn Unknown env config "lockfile". This will stop working in the next major version of npm.
@settler/api:typecheck: npm warn Unknown env config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
@settler/api:typecheck: npm warn Unknown env config "verify-deps-before-run". This will stop working in the next major version of npm.
@settler/api:typecheck: npm warn Unknown env config "_jsr-registry". This will stop working in the next major version of npm.
@settler/api:typecheck: npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
@settler/api:typecheck: npm warn config `--include=optional` to include them.
@settler/api:typecheck: npm warn config
@settler/api:typecheck: npm warn config Default value does install optional deps unless otherwise omitted.
@settler/api:typecheck: npm warn Unknown project config "package-manager". This will stop working in the next major version of npm.
@settler/api:typecheck: npm warn Unknown project config "lockfile". This will stop working in the next major version of npm.
@settler/api:typecheck: npm warn Unknown project config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
@settler/api:typecheck: npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
@settler/api:typecheck: npm warn config `--include=optional` to include them.
@settler/api:typecheck: npm warn config
@settler/api:typecheck: npm warn config Default value does install optional deps unless otherwise omitted.
@settler/sdk:typecheck:
@settler/sdk:typecheck: > @settler/sdk@1.0.0 typecheck /workspace/Settler/packages/sdk
@settler/sdk:typecheck: > tsc --noEmit
@settler/sdk:typecheck:
@settler/edge-ai-core:typecheck:
@settler/edge-ai-core:typecheck: > @settler/edge-ai-core@1.0.0 typecheck /workspace/Settler/packages/edge-ai-core
@settler/edge-ai-core:typecheck: > tsc --noEmit
@settler/edge-ai-core:typecheck:
@settler/api:typecheck:
@settler/api:typecheck: > settler-monorepo@1.0.0 prisma:generate
@settler/api:typecheck: > cross-env PRISMA_CLIENT_ENGINE_TYPE=wasm PRISMA_ENGINES_MIRROR= prisma generate
@settler/api:typecheck:
@settler/web:typecheck:
@settler/web:typecheck: > @settler/web@1.0.0 typecheck /workspace/Settler/packages/web
@settler/web:typecheck: > tsc --noEmit
@settler/web:typecheck:
@jobforge/shared:typecheck:
@jobforge/shared:typecheck: > @jobforge/shared@0.1.0 typecheck /workspace/Settler/packages/jobforge-shared
@jobforge/shared:typecheck: > tsc --noEmit
@jobforge/shared:typecheck:
@settler/api:typecheck: Loaded Prisma config from prisma.config.ts.
@settler/api:typecheck:
@jobforge/sdk-ts:typecheck: cache miss, executing dc7c1d3135fae740
@settler/cli:typecheck: cache miss, executing c2437eb4af3d76b1
@jobforge/errors:typecheck: cache miss, executing 38238f94dd16fe7f
@jobforge/fetch:typecheck: cache miss, executing 51ec6558bc0e13b3
@settler/api:typecheck: Prisma schema loaded from prisma/schema.prisma.
@jobforge/sdk-ts:typecheck:
@jobforge/sdk-ts:typecheck: > @jobforge/sdk-ts@0.1.0 typecheck /workspace/Settler/packages/jobforge-sdk-ts
@jobforge/sdk-ts:typecheck: > tsc --noEmit
@jobforge/sdk-ts:typecheck:
@jobforge/errors:typecheck:
@jobforge/errors:typecheck: > @jobforge/errors@0.1.0 typecheck /workspace/Settler/packages/jobforge-errors
@jobforge/errors:typecheck: > tsc --noEmit
@jobforge/errors:typecheck:
@settler/cli:typecheck:
@settler/cli:typecheck: > @settler/cli@1.0.0 typecheck /workspace/Settler/packages/cli
@settler/cli:typecheck: > tsc --noEmit
@settler/cli:typecheck:
@jobforge/fetch:typecheck:
@jobforge/fetch:typecheck: > @jobforge/fetch@0.1.0 typecheck /workspace/Settler/packages/jobforge-fetch
@jobforge/fetch:typecheck: > tsc --noEmit
@jobforge/fetch:typecheck:
@settler/api:typecheck:
@settler/api:typecheck: ✔ Generated Prisma Client (v7.3.0) to ./node_modules/.pnpm/@prisma+client@7.3.0_prisma@7.3.0_@types+react@18.3.27_better-sqlite3@12.6.2_react-dom@\_efc9348d8c027de17c7e00b84b73d1eb/node_modules/@prisma/client in 2.90s
@settler/api:typecheck:
@settler/api:typecheck: Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
@settler/api:typecheck:
@settler/api:typecheck:
@settler/api:typecheck:
@settler/api:typecheck: > @settler/api@1.0.0 typecheck /workspace/Settler/packages/api
@settler/api:typecheck: > tsc --noEmit
@settler/api:typecheck:

Tasks: 14 successful, 14 total
Cached: 0 cached, 14 total
Time: 1m22.877s

WARNING no output files found for task @settler/api#typecheck. Please check your `outputs` key in `turbo.json`
WARNING no output files found for task @settler/cli#typecheck. Please check your `outputs` key in `turbo.json`

Exit code: 0

## pnpm build

> settler-monorepo@1.0.0 build /workspace/Settler
> turbo run build --filter @settler/web...

• turbo 2.8.0
• Packages in scope: @jobforge/sdk-ts, @jobforge/shared, @jobforge/typescript-config, @settler/adapters, @settler/api, @settler/edge-ai-core, @settler/protocol, @settler/react-settler, @settler/sdk, @settler/types, @settler/web
• Running build in 11 packages
• Remote caching disabled
@settler/edge-ai-core:build: cache miss, executing 889a6ab7d8fa5378
@settler/types:build: cache miss, executing 3391060d441b3d26
@settler/sdk:build: cache miss, executing 6a5caea113fbc286
@settler/protocol:build: cache miss, executing e944ce77fbe40050
@jobforge/shared:build: cache miss, executing f37bc6c827718d1c
@jobforge/shared:build:
@jobforge/shared:build: > @jobforge/shared@0.1.0 build /workspace/Settler/packages/jobforge-shared
@jobforge/shared:build: > tsc
@jobforge/shared:build:
@settler/sdk:build:
@settler/sdk:build: > @settler/sdk@1.0.0 build /workspace/Settler/packages/sdk
@settler/sdk:build: > tsc
@settler/sdk:build:
@settler/edge-ai-core:build:
@settler/edge-ai-core:build: > @settler/edge-ai-core@1.0.0 prebuild /workspace/Settler/packages/edge-ai-core
@settler/edge-ai-core:build: > pnpm run typecheck
@settler/edge-ai-core:build:
@settler/protocol:build:
@settler/protocol:build: > @settler/protocol@0.1.0 build /workspace/Settler/packages/protocol
@settler/protocol:build: > tsc
@settler/protocol:build:
@settler/types:build:
@settler/types:build: > @settler/types@1.0.0 build /workspace/Settler/packages/types
@settler/types:build: > tsc
@settler/types:build:
@settler/edge-ai-core:build:
@settler/edge-ai-core:build: > @settler/edge-ai-core@1.0.0 typecheck /workspace/Settler/packages/edge-ai-core
@settler/edge-ai-core:build: > tsc --noEmit
@settler/edge-ai-core:build:
@settler/react-settler:build: cache miss, executing a232a487723f0a0a
@jobforge/sdk-ts:build: cache miss, executing a25749e3dfc69fce
@settler/edge-ai-core:build:
@settler/edge-ai-core:build: > @settler/edge-ai-core@1.0.0 build /workspace/Settler/packages/edge-ai-core
@settler/edge-ai-core:build: > tsc
@settler/edge-ai-core:build:
@jobforge/sdk-ts:build:
@jobforge/sdk-ts:build: > @jobforge/sdk-ts@0.1.0 build /workspace/Settler/packages/jobforge-sdk-ts
@jobforge/sdk-ts:build: > tsc
@jobforge/sdk-ts:build:
@settler/react-settler:build:
@settler/react-settler:build: > @settler/react-settler@0.1.0 build /workspace/Settler/packages/react-settler
@settler/react-settler:build: > tsc
@settler/react-settler:build:
@settler/adapters:build: cache miss, executing cf0289afeca6a084
@settler/adapters:build:
@settler/adapters:build: > @settler/adapters@1.0.0 build /workspace/Settler/packages/adapters
@settler/adapters:build: > tsc
@settler/adapters:build:
@settler/api:build: cache miss, executing 80694e19c8133e5a
@settler/api:build:
@settler/api:build: > @settler/api@1.0.0 prebuild /workspace/Settler/packages/api
@settler/api:build: > cd ../.. && npm run prisma:generate || npx prisma generate || echo 'Warning: Prisma generate may have failed'
@settler/api:build:
@settler/api:build: npm warn Unknown env config "package-manager". This will stop working in the next major version of npm.
@settler/api:build: npm warn Unknown env config "lockfile". This will stop working in the next major version of npm.
@settler/api:build: npm warn Unknown env config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
@settler/api:build: npm warn Unknown env config "verify-deps-before-run". This will stop working in the next major version of npm.
@settler/api:build: npm warn Unknown env config "_jsr-registry". This will stop working in the next major version of npm.
@settler/api:build: npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
@settler/api:build: npm warn config `--include=optional` to include them.
@settler/api:build: npm warn config
@settler/api:build: npm warn config Default value does install optional deps unless otherwise omitted.
@settler/api:build: npm warn Unknown project config "package-manager". This will stop working in the next major version of npm.
@settler/api:build: npm warn Unknown project config "lockfile". This will stop working in the next major version of npm.
@settler/api:build: npm warn Unknown project config "prefer-frozen-lockfile". This will stop working in the next major version of npm.
@settler/api:build: npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
@settler/api:build: npm warn config `--include=optional` to include them.
@settler/api:build: npm warn config
@settler/api:build: npm warn config Default value does install optional deps unless otherwise omitted.
@settler/api:build:
@settler/api:build: > settler-monorepo@1.0.0 prisma:generate
@settler/api:build: > cross-env PRISMA_CLIENT_ENGINE_TYPE=wasm PRISMA_ENGINES_MIRROR= prisma generate
@settler/api:build:
@settler/api:build: Loaded Prisma config from prisma.config.ts.
@settler/api:build:
@settler/api:build: Prisma schema loaded from prisma/schema.prisma.
@settler/api:build:
@settler/api:build: ✔ Generated Prisma Client (v7.3.0) to ./node_modules/.pnpm/@prisma+client@7.3.0_prisma@7.3.0_@types+react@18.3.27_better-sqlite3@12.6.2_react-dom@\_efc9348d8c027de17c7e00b84b73d1eb/node_modules/@prisma/client in 505ms
@settler/api:build:
@settler/api:build: Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
@settler/api:build:
@settler/api:build:
@settler/api:build:
@settler/api:build: > @settler/api@1.0.0 build /workspace/Settler/packages/api
@settler/api:build: > tsc --skipLibCheck --noEmit false
@settler/api:build:
@settler/web:build: cache miss, executing 07c1c11b776440b3
@settler/web:build:
@settler/web:build: > @settler/web@1.0.0 build /workspace/Settler/packages/web
@settler/web:build: > next build --webpack
@settler/web:build:
@settler/web:build: Attention: Next.js now collects completely anonymous telemetry regarding usage.
@settler/web:build: This information is used to shape Next.js' roadmap and prioritize features.
@settler/web:build: You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
@settler/web:build: https://nextjs.org/telemetry
@settler/web:build:
@settler/web:build: ▲ Next.js 16.1.6 (webpack)
@settler/web:build: - Experiments (use with caution):
@settler/web:build: ✓ optimizeCss
@settler/web:build: · optimizePackageImports
@settler/web:build:
@settler/web:build: Creating an optimized production build ...
@settler/web:build: Using tsconfig file: ./tsconfig.json
@settler/web:build:  ELIFECYCLE  Command failed.
 ELIFECYCLE  Command failed.
ERROR run failed: command exited (1)
