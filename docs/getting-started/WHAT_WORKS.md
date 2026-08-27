# What Works

Settler is an enterprise reconciliation engine. The following features are fully functional out of the box in the `main` branch.

## 1. Multi-Tenant Infrastructure

- **Tenant Isolation**: Data is separated logically via `tenantId`.
- **Governed Environments**: `enforceFreezeState` guarantees zero mutation windows.
- **Doctor Check**: `pnpm run doctor` verifies the local environment end-to-end.

## 2. Ingestion & Normalization

- **CSV & Webhook Inputs**: Configurable ingestion pipelines for standard and custom formats.
- **Idempotency**: All ingestion endpoints use idempotency keys to ensure duplicate requests don't duplicate data.
- **Deterministic Models**: Normalization forces structured currencies, dates, and amounts.

## 3. The Reconciliation Engine

- **Decision Engine**: High-confidence matching algorithms for amounts and references.
- **Fuzzy Matching**: Configurable thresholds for acceptable date and amount drift.
- **Exception Intelligence**: Unmatched or fuzzy records are passed to the operator dashboard for human-in-the-loop review.

## 4. The Operator Dashboard

- **Demo Seed**: `pnpm demo:seed` generates 100+ realistic transaction scenarios including failures and exceptions.
- **Visibility**: Dedicated UI for manual remediation of exceptions.

## 5. Venture Invoice Nudger (Phase 1)

- **Decision Engine**: Identifies overdue invoices and determines contact actions based on tenant-specific policies.
- **Dry-run Mode**: Ability to test nudger policy execution safely without emitting side effects.
