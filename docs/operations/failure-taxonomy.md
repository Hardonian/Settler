# Failure Taxonomy

Canonical classes implemented:

1. `VALIDATION_ERROR`
2. `AUTHENTICATION_ERROR`
3. `AUTHORIZATION_ERROR`
4. `TENANT_ISOLATION_ERROR`
5. `POLICY_REJECTION`
6. `RATE_LIMIT_ERROR`
7. `CONFIGURATION_ERROR`
8. `DEPENDENCY_ERROR`
9. `NETWORK_ERROR`
10. `TIMEOUT_ERROR`
11. `STORAGE_ERROR`
12. `QUEUE_ERROR`
13. `REPLAY_DIVERGENCE`
14. `PROOF_VERIFICATION_ERROR`
15. `NONDETERMINISM_ERROR`
16. `INTERNAL_EXECUTION_ERROR`
17. `OPERATOR_ACTION_REQUIRED`

## Required Record Fields

Every failure record includes:

- `failure_id`
- `failure_class`
- `severity`
- `trace_id`
- `execution_id` (when present)
- `tenant_id` (when present)
- `component`
- `operation`
- `timestamp`
- `human_summary`
- `machine_details`
- `retryable`
- `safe_to_auto_remediate`
- `root_cause_hypothesis`
- `remediation_status`

## Retry and Safety Principles

- Retryable does **not** imply auto-remediable.
- Auto-remediation requires positive safety predicates and an approved rule.
- Authz, tenant isolation, policy bypass, and proof-integrity failures remain operator-gated.
