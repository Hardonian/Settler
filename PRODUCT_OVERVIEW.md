# Settler — Platform Architecture

Settler is a reconciliation intelligence and audit operating system. It matches financial transactions across data sources with deterministic, replayable outcomes, adjudication-backed institutional memory, and auditor-verifiable evidence bundles.

This document describes the real, shipped architecture. Every capability listed here is backed by verifiable code. See [Intentional Boundaries](getting-started/INTENTIONAL_BOUNDARIES.md) for what is not yet in scope.

## Architecture Layers

### 1. Rust Kernel (`crates/`)

Delivers the deterministic primitives that underpin all reconciliation guarantees:

- **Content-addressable storage (CAS):** Every artifact — run outputs, evidence manifests, proofpack entries — is hashed and stored by content digest
- **Cryptographic proofpack generation:** Produces hash-linked, replayable evidence bundles that can be verified offline
- **Deterministic computation primitives:** All matching math is side-effect-free and reproducible

### 2. Reconciliation Core (`packages/reconciliation-core`)

The matching engine:

- Configurable tolerance rules (amount tolerances, date windows, field normalization)
- Canonical run surface — each run is assigned a stable ID and all outcomes are attributable to it
- Proofpack emission — serializes the full evidence manifest for each run
- Explicit degraded-state semantics — never presents a partial result as a successful one

### 3. TypeScript Control Plane (`packages/api`)

The API server (Express, TypeScript):

- All API routes (`/api/v1/`, `/api/v2/`) with request validation via Zod
- Multi-tenant middleware: resolves `tenantId` from JWT, API key, header, or subdomain before any route handler executes
- Job orchestration: BullMQ-backed job queue with retry, SLA alerting, and exponential backoff
- Event sourcing: append-only event store with tenant-scoped audit trails
- Billing enforcement: subscription tier checks with circuit-breaker degraded states
- OpenFGA authorization: attribute-based access control with fail-closed posture when unavailable

### 4. CLI Surface (`packages/cli`)

The primary interface for operators, automation, and local development:

- `foundry` — deterministic test-data generation and reconciliation verification
- `replay` — re-executes any past run from its evidence manifest
- `prove` — produces and verifies cryptographic proofpacks
- `first-run` — local environment validation without network or credentials

### 5. Operator Console (`packages/web`)

The Next.js App Router console:

- Run history, run detail, and exception review surfaces
- Live activity feed polling `/api/console/activities` with exponential backoff
- Evidence export — download proofpacks directly from the UI
- Tenant-scoped by design — every data fetch is scoped to the authenticated tenant

## Persistence

| Store                     | Role                                                                      |
| ------------------------- | ------------------------------------------------------------------------- |
| **TigerBeetle**           | Immutable double-entry ledger for all financial-grade transaction records |
| **PostgreSQL (Supabase)** | Projections, operational metadata, audit logs, tenant configuration       |
| **Redis**                 | Job queue backend (BullMQ), distributed cache, rate limiting              |

## Security Model

Tenant isolation is enforced at five independent layers:

1. **Middleware:** `tenantMiddleware` resolves `req.tenantId` before any route handler
2. **Repository layer:** Every method requires a mandatory `tenantId` parameter (TypeScript enforced)
3. **SQL queries:** Every tenant-scoped query includes `AND tenant_id = $N`
4. **Row-Level Security:** PostgreSQL RLS policies filter rows by `current_setting('app.current_tenant_id')`
5. **Entity layer:** Cross-tenant saves throw `Error('Tenant mismatch')` before touching the database

See [SECURITY_INVARIANTS.md](../SECURITY_INVARIANTS.md) for the full mechanical specification.

## Explicit Degraded States

Settler never silently degrades. When a dependency is unavailable:

- **OpenFGA unavailable:** Requests fail closed (403) rather than defaulting to permissive
- **Redis unavailable:** Warning logged, cache bypassed, core reconciliation continues
- **TigerBeetle disabled:** Feature flag gates ledger paths; reconciliation engine runs in standard mode
- **AI features absent:** Platform runs as a fully deterministic reconciliation system without any AI dependency
