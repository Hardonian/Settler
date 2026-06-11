# Changelog

All notable changes to Settler are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Support intake submission service with audit logging and runtime signal emission
- Standardized error factories and typed exception management routes
- Support intake system with reconciliation run and exception context embedding
- Reconciliation export integrity verification with hash comparison

### Security

- Bumped `defu` to `^6.1.5` to resolve prototype pollution vulnerability

### Infrastructure

- Pinned GitHub Actions to Node.js 24 to resolve upstream deprecation warnings
- Enabled type declaration emit (`declaration: true`) in `packages/api` tsconfig to unblock cross-package type resolution for `@settler/api/lib/email-lifecycle`

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
