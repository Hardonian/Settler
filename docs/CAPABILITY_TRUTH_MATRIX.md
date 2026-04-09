# Settler — Capability Truth Matrix

**Last reviewed:** April 2026
**Purpose:** Evidence-auditable record of what Settler claims, what is implemented, and what is not.
**Rule:** No surface may claim a capability at a maturity level higher than what this matrix states.

---

## Maturity Definitions

| Level           | Meaning                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| **Shipped**     | Implemented, tested, operator-accessible, and verified in production-like environments. |
| **Partial**     | Surface exists but has known gaps, degraded modes, or limited scope.                    |
| **Planned**     | Design exists or work is scheduled. Not implemented in application code.                |
| **Not claimed** | Explicitly out of scope. No work planned.                                               |

---

## Reconciliation Engine

| Capability                         | Maturity        | Console Surface                         | API Surface                        | Evidence                                                    |
| ---------------------------------- | --------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| Deterministic transaction matching | **Shipped**     | `/console/reconciliations`              | `/api/v1/runs`                     | Rules-as-code matching with field-level tolerance controls  |
| Run execution and history          | **Shipped**     | `/console/runs`, `/console/runs/:runId` | `/api/v1/runs`, `/api/v1/runs/:id` | Tenant-scoped run metadata, execution state, policy context |
| Matching rule configuration        | **Shipped**     | `/console/policies`                     | Policy API endpoints               | Versioned, tenant-scoped matching policies                  |
| Multi-source reconciliation        | **Partial**     | `/console/multi-source-reconciliation`  | Limited                            | Surface exists; cross-source correlation depth is limited   |
| Scheduled reconciliation           | **Shipped**     | `/console/schedules`                    | Schedule API                       | Tenant-scoped schedule creation and management              |
| Real-time streaming match          | **Not claimed** | —                                       | —                                  | Settler uses batch/scheduled reconciliation only            |

## Evidence and Audit

| Capability                        | Maturity    | Console Surface                           | API Surface                         | Evidence                                            |
| --------------------------------- | ----------- | ----------------------------------------- | ----------------------------------- | --------------------------------------------------- |
| Evidence manifest generation      | **Shipped** | `/console/proof-explorer`                 | `/api/v1/runs/:id/evidence`         | Hash-linked JSON manifests per run                  |
| Run replay with hash verification | **Shipped** | `/console/replay`                         | `/api/v1/runs/:id/replay`           | Deterministic re-execution with drift detection     |
| Truth/lineage explorer            | **Shipped** | `/console/proof-explorer`                 | `/api/v1/runs/:id/trust-explorer/*` | Artifact navigation through execution graph         |
| Audit log system                  | **Shipped** | `/console/audits`, `/console/audit-trail` | Audit log service                   | Tenant-scoped, immutable audit entries              |
| Policy impact simulation          | **Partial** | Truth Explorer panel                      | `/trust-explorer/findPolicyImpact`  | Embedded in truth explorer; not standalone          |
| Proofpack export                  | **Partial** | Proof explorer actions                    | API endpoints                       | Export flow exists; packaging automation is limited |

## Exception Operations

| Capability                    | Maturity    | Console Surface        | API Surface                 | Evidence                                                                              |
| ----------------------------- | ----------- | ---------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| Exception queue and triage    | **Shipped** | `/console/exceptions`  | Exception service endpoints | State machine: created → investigating → resolved/ignored                             |
| Operator decision audit trail | **Shipped** | Exception detail views | Audit log integration       | Every adjudication produces audit entry                                               |
| AI-assisted exception triage  | **Partial** | `/console/insights`    | AI provider integration     | Advisory only, requires provider configuration. Falls back to deterministic insights. |
| Alert-to-run automation       | **Partial** | `/console/alerts-view` | Alert infrastructure        | Surface visible; deep alert-to-run linking is limited                                 |

## Operator Console

| Capability                | Maturity    | Console Surface                 | Evidence                                            |
| ------------------------- | ----------- | ------------------------------- | --------------------------------------------------- |
| Workbench overview        | **Shipped** | `/console`                      | Consolidated operator landing with backend health   |
| Control plane visibility  | **Shipped** | `/console/control-plane`        | Runtime dependency status, tenant context           |
| Diagnostics               | **Shipped** | `/console/diagnostics`          | Always available; reports missing runtime contracts |
| Backend health monitoring | **Shipped** | Backend health badge in sidebar | Probes API, database, and service connectivity      |
| Workflow orchestration    | **Planned** | `/console/workflows` (thin)     | Scaffolding only; limited operability               |

## Integration Layer

| Capability               | Maturity    | Evidence                                                         |
| ------------------------ | ----------- | ---------------------------------------------------------------- |
| Stripe adapter           | **Shipped** | Verified adapter implementation                                  |
| Shopify adapter          | **Shipped** | Verified adapter implementation                                  |
| QuickBooks adapter       | **Shipped** | Verified adapter implementation                                  |
| PayPal adapter           | **Shipped** | Verified adapter implementation                                  |
| Square adapter           | **Shipped** | Verified adapter implementation                                  |
| Xero adapter             | **Shipped** | Verified adapter implementation                                  |
| NetSuite adapter         | **Shipped** | Verified adapter implementation                                  |
| Custom adapter framework | **Shipped** | Adapter interface for custom integrations                        |
| Webhook delivery         | **Partial** | Configuration UI available; delivery state tracking via provider |
| API key management       | **Shipped** | `/console/api-keys` — tenant-scoped key lifecycle                |

## Security and Tenant Isolation

| Capability                      | Maturity        | Evidence                                            |
| ------------------------------- | --------------- | --------------------------------------------------- |
| Row-level security (RLS)        | **Shipped**     | PostgreSQL RLS policies on all tenant-scoped tables |
| API middleware tenant binding   | **Shipped**     | Every authenticated request scoped to tenant        |
| Ledger tenant partitioning      | **Shipped**     | TigerBeetle accounts partitioned by tenant          |
| Explicit degraded state notices | **Shipped**     | Route maturity registry drives disclosure           |
| Cross-tenant test suite         | **Shipped**     | `pnpm test:cross-tenant` verification               |
| SOC 2 Type II certification     | **Planned**     | In preparation. Not certified.                      |
| GDPR operational controls       | **Shipped**     | Privacy controls, DPA template, data deletion       |
| HIPAA compliance                | **Not claimed** | Not certified. Not planned.                         |
| FedRAMP compliance              | **Not claimed** | Not certified. Not planned.                         |
| Third-party security audit      | **Planned**     | No published audit results                          |

## Deployment

| Capability                          | Maturity    | Evidence                                                 |
| ----------------------------------- | ----------- | -------------------------------------------------------- |
| Managed hosting (Vercel + Supabase) | **Shipped** | Production deployment pipeline                           |
| Self-hosted Docker Compose          | **Shipped** | `enterprise/docker-compose.yml`                          |
| CLI tooling                         | **Shipped** | `packages/cli` — verification, foundry, operator tooling |
| Data export (CSV, JSON)             | **Shipped** | Export API + CLI                                         |
| Clean teardown/offboarding          | **Shipped** | `docs/getting-started/teardown.md`                       |

---

## How to Use This Matrix

1. **Before any external claim:** Check this matrix. If the capability is not listed as Shipped, do not claim it without qualification.
2. **Before any demo:** Walk through the "Operator Demo Flow" in `docs/PRODUCT_CAPABILITIES_MATRIX.md` using only Shipped routes.
3. **Before procurement responses:** Reference evidence paths listed here. Do not assert capabilities beyond documented maturity.
4. **When updating:** Run `pnpm run verify:claims` to check claim alignment (when available).
