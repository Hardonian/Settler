# Launch Readiness Evidence Index

**Last reviewed:** 2026-09-21

**Status:** Conditional — core static gates pass; deployment-specific enterprise and runtime
evidence remains required before a production go-live claim.

This document is an evidence index, not a permanent declaration that every deployment is ready.
The latest executable results in `artifacts/verification/` are authoritative.

## Current Evidence

| Area                 | Evidence                              | Current result                                           |
| -------------------- | ------------------------------------- | -------------------------------------------------------- |
| Fast release gate    | `pnpm verify:fast`                    | Passed on 2026-09-21                                     |
| OSS marketing claims | `pnpm run verify:claims`              | Passed on 2026-09-21                                     |
| Launch artifacts     | `pnpm run verify:artifacts`           | 12 artifacts verified; fallback capture manifest         |
| SCIM posture         | `pnpm run verify:scim-posture`        | Not implemented; buyer and operator surfaces must say so |
| OIDC posture         | `pnpm run verify:enterprise-identity` | Config-gated; no local IdP contract was complete         |
| Helm packaging       | `pnpm run verify:helm-packaging`      | Not verified locally because Helm was unavailable        |

The most recent fast-gate artifact at review time is
`artifacts/verification/2026-09-21T16-45-10-523Z/summary.md`.

## Go-Live Gate

Before production launch, capture fresh evidence for:

1. `pnpm verify`
2. `pnpm run verify:security:fast`
3. `pnpm run verify:determinism`
4. `pnpm run verify:replay`
5. `pnpm run verify:routes`
6. Deployment health, authentication, billing webhook, and rollback smoke tests in the target
   environment

Any missing tool, credential, or target-environment check is a documented limitation—not a pass.
Investor, buyer, and launch materials must distinguish repository capability, configured
deployment capability, and demonstrated customer traction.

## Known Boundaries

- SCIM lifecycle provisioning is not shipped.
- OIDC contracts exist but require provider-specific configuration and runtime proof.
- Self-hosted packaging does not prove a successful cluster deployment.
- Fallback launch screenshots prove artifact completeness, not live application behavior.
- SOC 2 readiness work is not certification.

## Claim Policy

Use evidence-qualified language:

- Say **verified by the named gate** when the gate has a fresh passing artifact.
- Say **implemented, configuration-gated** when code exists but deployment proof does not.
- Say **planned** or **not shipped** when the runtime surface is absent.
- Do not translate repository features into customer traction without separate, confidential
  commercial evidence.
