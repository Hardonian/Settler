# Enterprise Security Questionnaire – Bounded Answers

> This version only states capabilities that can be tied to executable verification surfaces in this repository snapshot.

## Authentication methods supported

- API key authentication (production)
- Session/JWT flows where configured in deployment
- OIDC SSO for Okta / Entra / Google Workspace in config-gated mode

Verification: `pnpm run verify:enterprise-identity` (env contract; exit **2** = degraded). Aggregate: `pnpm run verify:enterprise-posture`.

## SAML support

SAML is not asserted as GA in this repository path.

## SCIM lifecycle provisioning

Not implemented in application code. Boundary: `pnpm run verify:scim-posture`.

## Tenant isolation

Validated through:

- `pnpm run verify:tenant`
- `pnpm run test:cross-tenant`

## Audit exports / SIEM

Tenant-scoped export routes are available; downstream SIEM normalization is deployment-specific.

Verification:

- `pnpm run verify:security:evidence`
- `pnpm run verify:observability-surface`

## Self-hosted deployment

Canonical packaging is the Helm chart at `deploy/helm/settler`. Packaging check: `pnpm run verify:helm-packaging` (requires `helm`; not a live-cluster attestation).

Includes:

- API/Web/Workhorse workloads
- migration job sequencing
- health probes
- rollback/upgrade path guidance
