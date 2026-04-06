# Enterprise Features (Truth-Bounded)

This page is intentionally constrained to capabilities with executable verification paths.

## Identity

- **OIDC SSO (config-gated)** for Okta, Microsoft Entra ID, and Google Workspace.
- Verification command: `pnpm run verify:enterprise-identity`.
- **SAML is not GA in this repository path.** Do not present SAML as production-ready without an explicit runtime proof bundle.

## Lifecycle Provisioning

- **SCIM lifecycle is staged** in this pass and remains non-GA.
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

- Canonical packaging: `deploy/helm/settler`.
- Includes: web/api/workhorse, migration job, health probes, rollback/upgrade flow.

## Operator Scheduling

- Schedule API validates cron + timezone and emits explicit degraded reasons for invalid payloads.
