# Operations Guide

## Health and status checks

- `GET /health` — root platform health.
- `GET /health/live` — process liveness.
- `GET /health/ready` — dependency readiness.
- `GET /metrics` — scrape endpoint for metrics pipeline.

## Operator commands

- `settler doctor` — local env + runtime diagnostics.
- `settler bugreport` — redacted support bundle.
- `settler tenant-check` — tenant isolation integrity checks.
- `settler failures` — inspect structured failure records.

## Runbook entry points

- Replay divergence: [`../troubleshooting/replay-divergence.md`](../troubleshooting/replay-divergence.md)
- Proof verification failures: [`../troubleshooting/proof-verification-failures.md`](../troubleshooting/proof-verification-failures.md)
- API errors: [`../support/api-error-guide.md`](../support/api-error-guide.md)
- Local setup failures: [`../troubleshooting/local-setup.md`](../troubleshooting/local-setup.md)

## Escalation boundaries

- Use remediation/policy simulation first when available.
- Escalate when tenant boundary risk, persistent replay divergence, or failed integrity checks are detected.
