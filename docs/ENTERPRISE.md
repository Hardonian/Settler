# Enterprise Features (Truth-Bounded)

This page is intentionally constrained to capabilities with executable verification paths.

## Identity

- **OIDC SSO (config-gated)** for Okta, Microsoft Entra ID, and Google Workspace.
- Verification: `pnpm run verify:enterprise-identity` (env key contract only). **Exit 0** = all three IdP env sets present; **exit 2** = degraded/partial; **exit 1** = `SETTLER_REQUIRE_OIDC_GA=true` failure. Not a substitute for IdP runtime smoke.
- Aggregate boundary check: `pnpm run verify:enterprise-posture`.
- **SAML is not GA in this repository path.** Do not present SAML as production-ready without an explicit runtime proof bundle.

## Lifecycle Provisioning

- **SCIM is not implemented** in application code; use `pnpm run verify:scim-posture` for the explicit boundary.
- Buyer-facing scope must remain: “manual provisioning + API key/OIDC access controls”.

## Tenant Security

- Tenant-scoped authorization and cross-tenant guardrails are verified via:
  - `pnpm run verify:tenant`
  - `pnpm run test:cross-tenant`

## Audit / Export

- Audit export is tenant scoped and should be validated with:
  - `pnpm run verify:security:evidence`
  - `pnpm run verify:observability-surface`

## Self-hosted Deployment

- Canonical packaging: `deploy/helm/settler` (web/api/workhorse, migration job, probes, documented upgrade/rollback).
- Packaging verification: `pnpm run verify:helm-packaging` (requires `helm` on PATH; **not** a live-cluster proof).

## Operator Scheduling

- Schedule API validates cron + timezone and emits explicit degraded reasons for invalid payloads.
