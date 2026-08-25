# Settler — Architecture Decision Records (ADRs)

This document records the foundational architectural decisions made in Settler, including the context, rationale, and consequences of each decision.

---

## ADR 001: Rust Kernel for Content-Addressable Storage and Cryptographic Proofpacks

- **Status:** Accepted
- **Context:** Financial reconciliation audits require undeniable, immutable proof that a reconciliation run executed exactly against given inputs and rules without retroactive tampering.
- **Decision:** Implement core hashing, content-addressable storage (CAS), and cryptographic proofpack generation in a native Rust crate (`crates/settler-kernel`) with WebAssembly bindings (`crates/settler-verify-wasm`).
- **Consequences:**
  - **Pros:** Zero-allocation cryptographic performance, guaranteed cross-platform bitwise reproducibility, ability to compile verifier to WASM for offline in-browser verification.
  - **Cons:** Requires Rust toolchain in CI/CD pipeline and native build artifacts for production containers.

---

## ADR 002: TigerBeetle as Financial-Grade Immutable Ledger

- **Status:** Accepted
- **Context:** Traditional relational databases suffer from concurrency bottlenecks and lock contention when tracking high-throughput double-entry financial balance changes across multiple payment gateways.
- **Decision:** Use TigerBeetle for tracking transaction ledger balances, with PostgreSQL for relational projections and operational metadata.
- **Consequences:**
  - **Pros:** Sub-millisecond latency for hundreds of thousands of transfers per second; deterministic state-machine replication; strict double-entry balance constraints.
  - **Cons:** Optional dependency requiring local Docker or hosted cluster; system includes transparent PostgreSQL fallback path when TigerBeetle is disabled.

---

## ADR 003: Five-Layer Defense-in-Depth Tenant Isolation Model

- **Status:** Accepted
- **Context:** Regulated financial institutions cannot tolerate cross-tenant data leaks under any circumstance, including code bugs, missing WHERE clauses, or misconfigured API routes.
- **Decision:** Enforce multi-tenancy at 5 independent layers:
  1. Express tenant-resolution middleware (`req.tenantId`)
  2. TypeScript compile-time repository method constraints
  3. Parameterized SQL query guards (`AND tenant_id = $1`)
  4. PostgreSQL Row-Level Security (RLS) policies
  5. Entity-level pre-mutation assertions
- **Consequences:**
  - **Pros:** Zero single-point-of-failure for tenant isolation; even if developer omits a WHERE clause in application code, PostgreSQL RLS blocks cross-tenant reads.
  - **Cons:** Developers must adhere to tenant context conventions; local tests require tenant context harness.

---

## ADR 004: Express 5 Control Plane with Next.js 16 Console Separation

- **Status:** Accepted
- **Context:** The platform requires both high-frequency API ingestion/processing and a rich, responsive operator console for variance review, approval queues, and evidence export.
- **Decision:** Decouple the backend API control plane (`packages/api` via Express 5) from the web operator console (`packages/web` via Next.js 16 App Router).
- **Consequences:**
  - **Pros:** API services can scale horizontally independently of frontend web traffic; clean API contract versioning (`/api/v1/`, `/api/v2/`); Next.js console can be deployed to Vercel/Edge while API runs on dedicated compute.
  - **Cons:** Monorepo requires coordinated build scripts and contract typing across packages.

---

## ADR 005: Turnkey Adapter Normalization over Generic Webhook Ingestion

- **Status:** Accepted
- **Context:** Financial integrations (Stripe, QuickBooks, NetSuite, Plaid, PayPal) all express dates, fees, line items, and refunds in vastly different JSON formats.
- **Decision:** Build dedicated, verified adapter drivers (25+ connectors) in `packages/adapters` that normalize all incoming feeds into canonical transaction primitives with built-in rate-limiting, OAuth refresh, and signature verification.
- **Consequences:**
  - **Pros:** Customers do not need to write custom ETL pipelines; all reconciliation rules operate against standard schemas regardless of data origin.
  - **Cons:** Connectors must be maintained as third-party APIs update versions.
