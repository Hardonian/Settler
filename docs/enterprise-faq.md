# Enterprise FAQ

## What identity modes are production-real right now?

Settler currently supports **OIDC SSO in a configuration-gated posture** for Okta, Microsoft Entra ID, and Google Workspace. Use `pnpm run verify:enterprise-identity` before asserting readiness in any environment.

## Do you support SAML?

Not as a GA claim in this repository path. If a buyer requires SAML, treat it as staged unless a dedicated runtime proof artifact is attached.

## Do you support SCIM?

SCIM lifecycle provisioning remains staged in this pass. Claims must stay bounded to manual provisioning and tenant-scoped auth controls.

## How is scheduler reliability surfaced?

Schedule update APIs validate cron and timezone and return machine-visible degraded reasons on invalid requests.

## Is self-hosted deployment real?

Yes, via Helm chart at `deploy/helm/settler` with migration sequencing, health probes, and rollback guidance.
