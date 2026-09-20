# Investor Overview

> Settler is an open-core financial reconciliation platform that automates settlement
> matching, fee verification, and audit-trail generation for businesses that move money
> across multiple payment rails.

## Market Opportunity

Every business that accepts payments through more than one processor (Stripe, PayPal,
Adyen, ACH, FedNow, card interchange networks) must reconcile settlements against
expected amounts. This process is manual, error-prone, and a regulatory liability.
Settler replaces spreadsheets and ad-hoc scripts with an automated, cryptographically
verifiable reconciliation pipeline.

## Product

- **Reconciliation engine** — multi-rail settlement matching with configurable tolerance
  thresholds (basis-point precision, zero floating-point arithmetic).
- **Proofpacks** — Merkle-root attestation bundles that cryptographically prove each
  reconciliation run's integrity. Independently verifiable by auditors.
- **Astra API** — programmatic access to ledger posting, dispute synthesis, threat
  detection, and resilience monitoring.
- **Console** — operator-facing dashboard for exceptions, alerts, usage analytics, and
  billing.
- **Enterprise tier** — SCIM provisioning, IP allowlisting, custom domains, dedicated
  support.

## Business Model

Open-core with three tiers:

| Tier       | Price       | Key Differentiator                 |
| ---------- | ----------- | ---------------------------------- |
| Free       | $0/mo       | Single-rail, community support     |
| Pro        | Usage-based | Multi-rail, proofpacks, API access |
| Enterprise | Custom      | SSO, SCIM, SLA, dedicated infra    |

Revenue is driven by transaction-volume-based metering on Pro and annual contracts on
Enterprise.

## Traction

- Production reconciliation runs across Stripe, PayPal, and ACH rails.
- Proofpack verification used in audit workflows.
- Self-hosted and SaaS deployment options.

## Technology Moat

1. **Zero floating-point arithmetic** — all monetary math uses integer cents and
   basis-point tolerances. Eliminates rounding drift.
2. **Cryptographic audit trail** — every reconciliation run produces a Merkle-root
   proof that is independently verifiable.
3. **Multi-tenant isolation** — enforced at the application, middleware, and database
   (PostgreSQL RLS) layers. Cross-tenant data access is structurally impossible.

## Team

Founded by operators with direct experience in payment reconciliation pain at scale.

## Use of Funds

- Engineering: expand rail adapter coverage (Adyen, FedNow, card interchange).
- Go-to-market: developer relations, documentation, and enterprise sales.
- Infrastructure: hardened multi-region deployment and SOC 2 readiness.

---

_For detailed product capabilities see [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md)._
_For operational procedures see [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md)._
