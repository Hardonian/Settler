# Settler Product Overview (External)

Settler is a reconciliation-intelligence and exception/evidence operating system.

## Enterprise posture (truth-bounded)

- **OIDC SSO:** config-gated for Okta, Microsoft Entra ID, Google Workspace.
- **SCIM lifecycle provisioning:** not implemented in application code (directory sync is out of scope in this repository).
- **Self-hosted:** Helm chart packaging at `deploy/helm/settler` (lint/template verification when `helm` is available; cluster runtime is operator-owned).
- **Audit export / SIEM handoff:** available with tenant-scoped validation required per deployment.

## Verification references

- `pnpm run verify:enterprise-posture` (runs SCIM boundary + Helm packaging + OIDC env contract; see per-script exit semantics in script headers)
- `pnpm run verify:enterprise-identity` (OIDC env contract only: exit **0** = all three IdP env sets present, **2** = degraded/partial, **1** = strict mode failure)
- `pnpm run verify:scim-posture`
- `pnpm run verify:helm-packaging` (exit **1** if `helm` is missing or lint/template fails)
- `pnpm run verify:tenant`
- `pnpm run test:cross-tenant`
- `pnpm run verify:observability-surface`
- `pnpm run verify:adapters`
