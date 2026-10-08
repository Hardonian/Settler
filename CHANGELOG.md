# Changelog

All notable changes to Settler are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🔒 Moat (Cryptographic Trust & Invariants)
- Consolidation of authenticated matching path onto `@settler/reconciliation-core` minor-unit engine (FCR-003).

### ⚡ Leverage (Developer Velocity & Multi-Rail Throughput)
- First-customer authenticated pilot verification across PostgreSQL/Supabase and Stripe live test-mode.

## [v1.6.0] - 2026-10-07

### 🔒 Moat (Cryptographic Trust & Invariants)

- `8848d89d4` fix: reconcile Prisma schema with Supabase Postgres (520 mapping bugs resolved, 0 missing tables/columns, 32 verified migration checksums) (Scott Hardie)
- `8d3054f2e` fix(db): advisor lint sweep — RLS consolidation, initplans, duplicate indexes, alert_history global scope (Scott Hardie)
- `376afad76` fix(security): wasmtime 49.0.1 -> 49.0.2 — clears 3 RustSec advisories in settler-kernel (Scott Hardie)
- `093204453` fix(security): clear dependency-audit debt (proxy-addr, source-map-js, vue) to green strict osv-scanner gate (Scott Hardie)
- `9ff9777db` fix(ci): osv acceptance parity + relocatable replay across POSIX and Windows (Scott Hardie)
- `d11ab22b4` docs: add Settler cognitive architecture documentation and formal specifications (Scott Hardie)
- `6ba142f35` feat: implement Gemini cognitive engine, WASM verification, and settlement kernel modules (Scott Hardie)

### ⚡ Leverage (Developer Velocity & Multi-Rail Throughput)

- `bdc42e30d` feat: add Supabase server client, Next.js configuration, and migration documentation (Scott Hardie)
- `b8a2017e7` feat: add command palette, security evidence files, and database hardening migrations (Scott Hardie)
- `0c155cd2b` feat: add QA registries, UI consistency audit spec, page builder route, and RealtimePosts component (Scott Hardie)
- `4f4a99a2b` feat: add UI consistency audit spec, public UI config API, and realtime workbench hook (Scott Hardie)
- `26cb36ef4` test: add automated UI consistency and functional integrity audit spec (Scott Hardie)
- `21d424f08` feat: add site pages, UI components, QA registries, and E2E tests (Scott Hardie)
- `docs/ENTERPRISE_READINESS.md` Enterprise readiness specification covering SOX 404, SOC 2 Type II, and 46 middleware layers
- `packages/api/src/middleware/__tests__/dlp.test.ts` Data Loss Prevention (DLP) unit tests with SSN, credit card, and AWS key redaction
- `packages/api/src/routes/v1/__tests__/billing.test.ts` Stripe billing route tests for checkout and customer portal

### 🛠️ Maintenance (Polish, Hygiene & Conformance)

- Synchronized monorepo package versions to 1.6.0 across all 26 workspace packages.
- Migrated pnpm overrides to `pnpm-workspace.yaml`, eliminating pnpm 10 deprecation warnings.
- Added version management automation (`pnpm run version:bump` and `pnpm run version:sync`) powered by native `node:fs` globSync.
- `95eaf0fd5` fix(ci): point dead secret refs at names that hold values (Scott Hardie)
- `d9aff3c79` ci: permanent drift/parity monitoring + honest verification gates (Scott Hardie)
- `387d37779` deps: bump minor-and-patch dependency group with 22 updates (Scott Hardie)

## [v1.5.0] - 2026-09-11

### 🔒 Moat (Cryptographic Trust & Invariants)

- `22daa97f2` feat: add bilateral reconciliation API endpoint with cryptographic Merkle root generation (Scott Hardie)
- `a1d9d4cbe` feat: implement enterprise SSO normalizer for SAML and OIDC assertions with tenant-bound security validation (Scott Hardie)
- `a8bbb5fab` feat: implement FedNow reconciliation adapter, Merkle discrepancy engine, and CLI authentication and mocking modules (Scott Hardie)
- `cac028999` feat: add replay evidence and ledger entry fixtures for demo-run-1 (Scott Hardie)
- `374b338f9` feat: implement real-time continuous T+0 streaming ledger engine for trial balance tracking (Scott Hardie)

### ⚡ Leverage (Developer Velocity & Multi-Rail Throughput)

- `16d8ff867` feat: implement SEPA Instant pipeline, add reconciliation rate limiting tests, and initialize types package configuration (Scott Hardie)
- `374735a94` feat: implement Adyen and MT940 settlement adapters with deterministic parsing and RFC 6962 hashing. (Scott Hardie)

### 🛠️ Maintenance (Polish, Hygiene & Conformance)

- `1f24f19f7` feat: rebrand Astra to Sidereal across the platform and add navigation components (Scott Hardie)
- `d0cb18f69` feat: implement SEPA Instant messaging, Shopify consolidator, statement error recovery, and audit sampling modules (Scott Hardie)
- `cbf6447a3` feat: implement real-time transaction monitoring dashboard and auxiliary routing pages (Scott Hardie)
- `a368e9864` feat: implement core dashboard and onboarding wizard routes with supporting UI components (Scott Hardie)
- `d126f872d` feat: add CommandPalette component for keyboard-driven navigation (Scott Hardie)
- `f108ba9d6` feat: implement cross-border card scheme surcharge classifier and audit engine (Scott Hardie)
- `b88b1d666` feat: implement tamper-evident, hash-chained RBAC audit logging system (Scott Hardie)
- `b54956105` feat: implement data residency validation and autonomous FX hedging drift monitoring (Scott Hardie)
- `a8a8094f6` feat: implement SLA breach predictor and add testing suite to reconciliation-core (Scott Hardie)
- `f9cae8628` feat: implement autonomous interchange route recommender for cost-optimal payment rail selection (Scott Hardie)
- `768c3e183` feat: implement fuzzy string matching utility with Jaro-Winkler and Levenshtein algorithms for bank descriptor reconciliation (Scott Hardie)
- `7452bebca` test(reconciliation-core): verify Kuhn-Munkres bipartite matching optimal cost assignment (Scott Hardie)
- `d067261dc` feat: implement bipartite matching reconciliation core and initialize canonical type definitions (Scott Hardie)

## [1.0.0] — 2026-04-09

Initial production release of the Settler reconciliation platform.

### Core Engine

- Deterministic reconciliation matching with configurable tolerance rules (amount, date, field)
- Canonical run surface — every run is assigned a stable ID, outcomes are attributable and replayable
- Hash-linked proofpack generation for every reconciliation run
- Explicit degraded-state semantics — no silent failures or partial-success masking

### Operator Platform

- Operator console (Next.js App Router) with run history, exception review, and evidence export
- Live activity feed with exponential-backoff polling
- Exception intelligence with adjudication memory and context embedding
- Evidence artifact management and audit export

### Security & Multi-Tenancy

- Full multi-tenant architecture with Row-Level Security (RLS) enforced at the PostgreSQL layer
- Tenant isolation enforced at five independent layers: middleware, TypeScript interfaces, SQL guards, RLS, and entity-level checks
- Cross-tenant isolation verified by automated test matrix (`crossTenantMatrix`, `crossTenantIsolation`, `tenant-runtime-cross-tenant`)
- Webhook payload signature verification on all inbound webhooks
- OpenFGA attribute-based authorization with fail-closed posture

### Infrastructure

- PostgreSQL (Supabase) with Prisma ORM and structured migration system
- TigerBeetle integration for immutable double-entry ledger records
- Redis-backed job queue (BullMQ) with retry, SLA alerting, and exponential backoff
- GitHub Actions CI/CD with lint, typecheck, build, and full test suite
- Docker Compose for local TigerBeetle, PostgreSQL, and Redis

### Billing

- Subscription tier management (free, trial, commercial, enterprise)
- Tenant quota enforcement with usage tracking
- Trial lifecycle email automation (day 7 through expiry)

[Unreleased]: https://github.com/Hardonian/Settler/compare/v1.6.0...HEAD
[v1.6.0]: https://github.com/Hardonian/Settler/compare/v1.5.0...v1.6.0
[v1.5.0]: https://github.com/Hardonian/Settler/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/Hardonian/Settler/releases/tag/v1.0.0
