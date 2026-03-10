# Getting Started

## Canonical onboarding path

```bash
pnpm install
cp .env.local.example .env.local
pnpm demo:settler
```

This path is optimized for first-time contributors and operators.

## Inputs and outputs

- **Inputs:** reconciliation feeds, connector payloads, rules, and policy configuration.
- **Outputs:** run results, mismatch queues, and evidence artifacts (`run.json`, `results.json`, `evidence.json`).

## Next docs

- Developer API + SDK: [`docs/api/README.md`](../api/README.md)
- Architecture overview: [`docs/architecture/README.md`](../architecture/README.md)
- Demo walkthrough: [`docs/demo/demo-walkthrough.md`](../demo/demo-walkthrough.md)
- Security and tenant boundaries: [`docs/security/README.md`](../security/README.md)
