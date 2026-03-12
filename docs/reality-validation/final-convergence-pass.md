# Final Convergence Pass (Kernel + Enterprise Console + Static/Design)

Date: 2026-03-12
Scope: route/component/docs/styles/content convergence and verification truth pass.

## Outcome

Settler surfaces are converged around one product story:

- deterministic reconciliation runs,
- replay/evidence-backed investigation,
- tenant-safe operations and administration,
- enterprise controls surfaced as explicit gated capabilities,
- design system token usage centralized through canonical token files.

The capability source of truth remains `docs/reference/capability-surface.registry.json`, with generated convergence docs synced during this pass.

## Final Capability Matrix (authoritative summary)

| Capability                      | CLI                                                                  | Console/UI                                                                | API                                                       | Availability truth                                                     |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Reconciliation execution        | `pnpm demo:settler`, `pnpm simulate:settler`                         | `/app/runs`, `/app/reconciliation`                                        | `/api/v1/runs`, `/api/runs/create`                        | Non-demo runs require configured runtime/data sources                  |
| Run + Truth exploration         | `pnpm replay:run`                                                    | `/app/runs`, `/app/proofs`, `/proof-explorer`                             | `/api/v1/runs/:id`, `/api/v1/runs/:id/trust-explorer/*`   | Evidence/replay panes explicitly degrade when payloads are unavailable |
| Replay + policy simulation      | `pnpm replay:run`, `pnpm simulate:settler`                           | `/replay-lab`, Truth Explorer policy context                              | `/api/v1/runs/:id/replay`, `.../findPolicyImpact`         | Policy impact exists; standalone policy lab remains partial            |
| Operator status + alerts        | `pnpm doctor`, `pnpm suite-doctor:json`                              | `/app/capability-status`, `/status`, `/app/alerts`, `/operator/incidents` | `/api/status`, `/api/console/alerts`, `/api/admin/stream` | Degraded vs operational states are machine-visible                     |
| Tenant administration/isolation | `pnpm tenant:create`, `pnpm verify:tenant`, `pnpm test:cross-tenant` | `/app/settings`, `/admin/settings`                                        | Tenant-scoped `/api/*` families                           | Tenant checks and auth are mandatory for tenant routes                 |

Reference: generated convergence matrix in `docs/reference/surface-area-convergence.md`.

## Final Operations Map (build/run/operate)

| Layer                                    | Primary entrypoints                                                             | Operational purpose                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Kernel/runtime                           | `/api/v1/*`, `/api/status*`                                                     | run execution, health/readiness, deterministic runtime behaviors |
| Console/operator                         | `/app/*`, `/admin/*`, `/operator/*`, `/api/console/*`, `/api/admin/*`           | investigation, alert triage, tenant and ops control plane        |
| CLI/control scripts                      | `demo:settler`, `simulate:settler`, `replay:run`, `tenant:create`, `chaos:test` | reproducible local verification and operator workflows           |
| Trust/evidence                           | `/app/proofs`, `/proof-explorer`, `/replay-lab`                                 | replay verification and evidence inspection                      |
| Commercial/enterprise narrative surfaces | `/pricing`, `/enterprise`, `/trust`, `/security-and-audit`                      | plan differentiation, security posture, enterprise controls      |

## Enterprise/Page/Design Consistency Report

### Story consistency checks

1. **CLI + console + API parity:** synced through capability registry and generated surface docs.
2. **Enterprise visibility:** enterprise marketing routes and enterprise API families are present and documented; support is explicit rather than implied.
3. **No hard-500 user-route policy:** route verification completed without hard-500 on critical routes in this environment.
4. **Design token discipline:** canonical token source remains `design-system/css-tokens.css` with token governance documented in `design-system/TOKEN_SYSTEM.md`.
5. **Stitch alignment:** product-screen Stitch reconciliation remains documented and bounded to product UI scope (not conflated with marketing-site ownership).

### Drift resolved in this pass

- Regenerated and revalidated generated surface docs (`surface-area-convergence.md`, `route-classes.md`, `route-families.md`) from current source-of-truth inventories.
- Re-ran repository verification chain and captured warnings as environment/config limitations instead of proof claims.

## Exact Verification Report

Executed commands:

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run test`
- `pnpm run verify`
- `pnpm run verify:surface-docs`
- `pnpm run verify:capability-registry`

Result summary:

- Lint/typecheck/build/tests/verify: **pass**.
- Non-fatal warnings observed:
  - builder API key absent (static builder generation skipped),
  - environment-driven Supabase/OTLP warnings in tests,
  - `next start` standalone warning during route verification,
  - known lint warnings (no lint errors).

## Deferred Items (justified)

1. **Standalone policy lab surface:** capability marked partial in registry; existing policy impact is embedded in Truth Explorer.
2. **Alerting integrations:** capability marked partial pending configured downstream notification channels.
3. **Builder content generation in CI/dev without key:** currently explicit warning/degraded behavior, not silent success.

These are not regressions introduced by this pass; they remain explicit and machine-visible.
