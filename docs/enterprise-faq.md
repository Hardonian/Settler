# Enterprise FAQ

## What identity modes are production-real right now?

Settler currently supports **OIDC SSO in a configuration-gated posture** for Okta, Microsoft Entra ID, and Google Workspace. `pnpm run verify:enterprise-identity` checks **env key presence only** (not IdP runtime). Exit **0** means all three provider env contracts are present; exit **2** means degraded/partial; exit **1** when `SETTLER_REQUIRE_OIDC_GA=true` and the contract is incomplete. Do not treat exit **2** as operational SSO proof.

## Do you support SAML?

Not as a GA claim in this repository path. If a buyer requires SAML, treat it as staged unless a dedicated runtime proof artifact is attached.

## Do you support SCIM?

SCIM is **not implemented** in this repository’s application routes. Use `pnpm run verify:scim-posture` for the machine-readable boundary. Claims must stay bounded to manual provisioning and tenant-scoped auth controls.

## How is scheduler reliability surfaced?

Schedule APIs persist cron and timezone and return machine-visible capability when `SCHEDULER_ENABLED=false`. The console labels automatic execution as **conditional on a running scheduler worker** — defining a schedule is not proof of execution.

## Is self-hosted deployment real?

**Packaging:** Helm chart at `deploy/helm/settler` with migration job, probes, and documented upgrade/rollback. **CI/runtime proof:** `pnpm run verify:helm-packaging` lints and templates the chart when `helm` is installed; it does **not** prove a live cluster. Customer-managed clusters, ingress, TLS, and image pulls remain operator responsibilities.
