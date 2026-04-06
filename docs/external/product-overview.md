# Settler Product Overview (External)

Settler is a reconciliation-intelligence and exception/evidence operating system.

## Enterprise posture (truth-bounded)

- **OIDC SSO:** config-gated for Okta, Microsoft Entra ID, Google Workspace.
- **SCIM lifecycle provisioning:** staged (not GA).
- **Self-hosted:** Helm packaging provided (`deploy/helm/settler`) with explicit operator responsibilities.
- **Audit export / SIEM handoff:** available with tenant-scoped validation required per deployment.

## Verification references

- `pnpm run verify:enterprise-identity`
- `pnpm run verify:tenant`
- `pnpm run test:cross-tenant`
- `pnpm run verify:observability-surface`
- `pnpm run verify:adapters`
