# Enterprise Enablement Risks

## Current strengths

- Enterprise gates are explicit (`JOBFORGE_INTEGRATION_ENABLED`, `JOBFORGE_BUNDLE_EXECUTION_ENABLED`).
- Credential encryption requirements are documented.

## Remaining risks

### P0

- Baseline verification failures (typecheck + repo-integrity) undermine trust in enterprise rollout claims because CI confidence is already red.

### P1

- Managed-service-assisted vs self-serve assumptions were previously implicit.
- Operators can enable JobForge flags without staged rollout discipline unless runbook guidance is followed.

## Fixed in this pass

- Added explicit enablement tiers (OSS baseline / enterprise self-serve / managed-service assisted).
- Added security expectations emphasizing credential keying and staged rollout.
