# Failure Surface Map

## Inventory

| Surface                               | Origin points                                     | Existing error shape              | Classification                                                          | Retry behavior                | Observability                             | Remediation possible             |
| ------------------------------------- | ------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------- | ----------------------------- | ----------------------------------------- | -------------------------------- |
| API handlers (`/api/control-plane/*`) | Request parsing, policy checks, runtime guards    | Problem+JSON and ad hoc objects   | Canonical `FailureClass` via `recordFailure`                            | Rule-based only               | Trace id + structured failure store       | Yes, if remediation rule permits |
| CLI commands (`settler failures *`)   | Control-plane API integration and command runtime | Structured failure records        | Canonical class from taxonomy                                           | Only idempotent actions       | Linked logs/receipts in failure record    | Operator-triggered remediation   |
| Workers / queue consumers             | Queue fence/idempotency violations, timeouts      | Runtime errors and queue states   | `QUEUE_ERROR`, `TIMEOUT_ERROR`                                          | Bounded by remediation policy | Trace/execution linkage                   | Auto-heal with idempotency proof |
| Webhook flows                         | Validation and authz boundaries                   | Problem+JSON + event logs         | `VALIDATION_ERROR`, `AUTHENTICATION_ERROR`, `POLICY_REJECTION`          | No blind retries              | Trace + tenant metadata                   | Quarantine malformed payloads    |
| Replay + proof systems                | Replay divergence, proof/hash mismatch            | Determinism and proof diagnostics | `REPLAY_DIVERGENCE`, `PROOF_VERIFICATION_ERROR`, `NONDETERMINISM_ERROR` | No auto retry                 | Replay bundle + proof links               | Operator-only in unsafe paths    |
| Storage interactions                  | Missing config, backend failures                  | Runtime errors from adapters      | `CONFIGURATION_ERROR`, `STORAGE_ERROR`                                  | Restricted                    | Linked execution receipt                  | Mostly operator guided           |
| Auth / tenancy checks                 | Authn/authz/tenant-guard failures                 | HTTP errors + guard exceptions    | `AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`, `TENANT_ISOLATION_ERROR` | Never auto retry              | Trace + tenant id required                | No auto-remediation              |
| External dependencies                 | Upstream outages, network instability             | Transport/provider errors         | `DEPENDENCY_ERROR`, `NETWORK_ERROR`, `RATE_LIMIT_ERROR`                 | Bounded retry with backoff    | Dependency attribution in machine details | Some classes safe for auto-heal  |

## Notes

- Canonical failure records are append-only and carry `trace_id`, `execution_id`, `tenant_id`, `failure_class`, hypothesis and remediation status.
- Clustering and recurrence analysis rely on deterministic signatures (class + component + operation + normalized error hash).
- Unsafe remediation classes downgrade to explicit operator guidance.
