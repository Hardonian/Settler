# Surface Area Convergence Matrix (CLI / UI / API / Capability Status)

Generated from `docs/reference/capability-surface.registry.json`. Edit the registry and regenerate docs.

## Capability Surface Matrix

| Capability | Real implementation evidence | CLI surface | UI surface | API surface | Docs surface | OSS vs Enterprise visibility | Availability / gating truth | Maturity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reconciliation execution | scripts/settler-demo-pipeline.ts<br/>scripts/simulate-settler.ts | pnpm demo:settler<br/>pnpm simulate:settler | /app/runs<br/>/app/reconciliation | /api/v1/runs<br/>/api/runs/create | README.md<br/>docs/DEMO.md | OSS core | Non-demo runs require configured runtime/data sources. | mature |
| Run Explorer | packages/web/src/app/app/runs/page.tsx<br/>packages/web/src/app/app/runs/[id]/page.tsx | pnpm replay:run | /app/runs<br/>/app/runs/[id]<br/>/admin/runs | /api/v1/runs/:id<br/>/api/admin/runs | docs/PRODUCT_CAPABILITIES_MATRIX.md | OSS + operator | Replay/evidence sections degrade gracefully when payloads are unavailable. | mature |
| Truth Explorer | packages/web/src/app/app/proofs/page.tsx<br/>packages/web/src/components/proof/ProofExplorer.tsx | pnpm replay:run | /app/proofs<br/>/app/proofs/[id]<br/>/proof-explorer | /api/v1/runs/:id/trust-explorer/* | docs/PRODUCT_CAPABILITIES_MATRIX.md | OSS + operator | Policy-impact analysis is embedded in Truth Explorer. | partial |
| Deterministic replay | packages/cli/src/tools/replay-runner.ts<br/>packages/web/src/app/console/replay/page.tsx<br/>packages/web/src/app/app/replay/page.tsx | pnpm replay:run | /console/replay (canonical)<br/>/app/replay (legacy redirect)<br/>/console/replay-lab (legacy redirect)<br/>/replay-lab (marketing)<br/>/app/runs/[id] | /api/v1/runs/:id/replay | docs/replay/README.md | OSS + operator | Requires prior run evidence for deterministic compare. | mature |
| Policy simulation | packages/web/src/components/proof/ProofExplorer.tsx<br/>scripts/simulate-settler.ts | pnpm simulate:settler | /app/policies<br/>Truth Explorer policy context | /api/v1/runs/:id/trust-explorer/findPolicyImpact | docs/reference/surface-area-convergence.md | OSS + operator | Standalone policy lab is not yet implemented. | partial |
| Synthetic reconciliation foundry | packages/cli/src/index.ts<br/>test-data/TEST_DATA_FOUNDRY.md | pnpm generate:test-data:smoke<br/>pnpm verify:test-data<br/>pnpm test:reconciliation:e2e | Docs/demo surfaced | CLI-first (no dedicated HTTP family) | test-data/TEST_DATA_FOUNDRY.md | OSS core | Deterministic by seed/profile. | mature |
| Operator telemetry and capability status | scripts/doctor.mjs<br/>packages/web/src/app/api/status/route.ts<br/>packages/web/src/app/app/capability-status/page.tsx | pnpm doctor<br/>pnpm suite-doctor:json | /app/capability-status<br/>/status<br/>/app/system-health | /api/status<br/>/api/status/health | docs/reference/surface-area-convergence.md | OSS + operator | Explicitly reports degraded vs operational status. | mature |
| Alerts and live operations | packages/web/src/components/console/AlertsView.tsx<br/>packages/web/src/components/console/LiveActivityFeed.tsx | pnpm verify:production-parity | /app/alerts<br/>/operator/incidents<br/>/admin/ops | /api/console/alerts<br/>/api/admin/stream | docs/observability.md | OSS + operator | Notification channel integrations require explicit configuration. | partial |
| Tenant administration and isolation | scripts/tenant-create.ts<br/>scripts/verify-tenant-coverage.ts<br/>scripts/security/cross-tenant-runner.mjs | pnpm tenant:create<br/>pnpm verify:tenant<br/>pnpm test:cross-tenant | /app/settings<br/>/admin/settings | Tenant-scoped /api/* families from route inventory | docs/ACCESS_CONTROLS.md<br/>docs/OSS_VS_ENTERPRISE.md | OSS + operator | Auth and tenant checks are mandatory for tenant-scoped routes. | mature |

## Canonical CLI Workflows (OSS-first)

- `pnpm doctor -- --skip-pipeline --first-run`
- `pnpm doctor -- --skip-pipeline`
- `pnpm demo:settler`
- `pnpm simulate:settler`
- `pnpm replay:run`
- `pnpm benchmark`
- `pnpm chaos:test`
- `pnpm tenant:create`

## Cross-Surface Workflows

### Run / investigate / replay
- Inspect /app/runs
- Open /app/runs/:id
- Use one-click Truth Explorer and Replay links
- Review /app/alerts for incidents

### Demo / dogfood
- pnpm demo:settler
- Open /app
- Inspect /app/runs and /app/proofs
- Replay in /console/replay (or /replay-lab for public marketing narrative)

## Terminology Normalization (canonical terms)

- **Run Explorer**
- **Truth Explorer**
- **Replay Lab**
- **Policy Simulation**
- **Live Alerts**
- **Tenant Administration**
- **Capability Status**
