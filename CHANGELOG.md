# Changelog

All notable changes to Settler are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Architecture Decision Records (ADRs) covering Rust CAS, TigerBeetle, 5-layer isolation, and Express/Next.js decoupling (`docs/ARCHITECTURE_DECISION_RECORDS.md`)
- Comprehensive enterprise readiness specification covering SOX 404, SOC 2 Type II, GDPR, and 46 middleware layers (`docs/ENTERPRISE_READINESS.md`)
- Technical due diligence competitive analysis comparing Settler against legacy monoliths (`docs/COMPETITIVE_ANALYSIS.md`)
- Unit test suite for Data Loss Prevention (DLP) middleware with SSN, credit card, and AWS Access Key ID redaction (`packages/api/src/middleware/__tests__/dlp.test.ts`)
- Unit test suite for Stripe billing routes covering status, fallback checkout, and customer portal (`packages/api/src/routes/v1/__tests__/billing.test.ts`)
- Safe zero-crash frontmatter parser in `@settler/web` resolving legacy `gray-matter` / `js-yaml` 4 incompatibilities during Next.js SSG route collection
- Turnkey adapter ecosystem expansion documenting 25+ verified connector drivers across payments, accounting, e-commerce, banking, and ERP

### Fixed & Hardened

- Resolved root clutter by organizing operational scripts into `scripts/housekeeping/`
- Hardened `.gitignore` and `.lintstagedrc.js` to prevent build artifacts (`**/dist/**`) from ever entering the git index
- Consolidated `pnpm.overrides` into `pnpm-workspace.yaml` eliminating deprecated package.json warning outputs
- Enforced concurrency limiters on batch processor insertions in `@settler/adapters`
- Fixed Vercel deployment preflight with frozen lockfile validation
- Cleaned unused imports and variables across `@settler/api` and `@settler/web` achieving zero ESLint warnings monorepo-wide

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

[Unreleased]: https://github.com/Hardonian/Settler/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Hardonian/Settler/releases/tag/v1.0.0
