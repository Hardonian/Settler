# Settler Repo-OS Verification Matrix

Status: **CANONICAL**  
Last updated: 2026-03-29

This matrix defines the minimum verification bar for repo work. Choose the smallest profile that still proves the changed behavior.

## 1. Baseline verification (expected for most code changes)

| Goal                       | Command(s)                            | What it proves                                       | Limits                               |
| -------------------------- | ------------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| Workspace lint/type safety | `pnpm lint` + `pnpm typecheck`        | Static correctness and style gates across workspaces | Does not prove runtime behavior      |
| Build integrity            | `pnpm build`                          | Compile-time and bundle viability                    | Can miss tenant/runtime regressions  |
| Core test signal           | `pnpm test` (or scoped package tests) | Regression coverage for changed surfaces             | Coverage quality varies by subsystem |

## 2. Release-critical profile

| Profile           | Command            | Use when                                                                |
| ----------------- | ------------------ | ----------------------------------------------------------------------- |
| Fast release gate | `pnpm verify:fast` | Pre-push confidence for release-critical checks without full link crawl |
| Full release gate | `pnpm verify:full` | Pre-release, infra-sensitive changes, or launch-grade evidence          |

## 3. Truth/contract verification

Run when routes, docs, policy, or API contract semantics change:

- `pnpm verify:surface-docs`
- `pnpm verify:route-classes-doc`
- `pnpm verify:api-family-docs`
- `pnpm verify:routes`

### Enterprise / identity / self-hosted boundary scripts

| Command | Proves | Exit semantics |
| --- | --- | --- |
| `pnpm run verify:scim-posture` | SCIM is not implemented in app code (`not_applicable`) | **0** |
| `pnpm run verify:helm-packaging` | Helm lint + template for `deploy/helm/settler` | **0** pass, **1** if `helm` missing or lint/template fails |
| `pnpm run verify:enterprise-identity` | OIDC env key contract for three IdPs | **0** all configured, **2** degraded/partial, **1** strict failure |
| `pnpm run verify:enterprise-posture` | Runs the three above in sequence | **0** / **2** / **1** (worst child, with SCIM expected 0) |

## 4. Tenant and security verification

Run for any auth/tenant/security/data-path change:

- `pnpm run verify:tenant`
- `pnpm run test:cross-tenant`
- `pnpm run verify:security:fast` (or stricter profile as needed)
- `pnpm run verify:security:runtime` for runtime probe evidence when behavior changed

## 5. Determinism and reconciliation truth

Run for reconciliation/policy/outcome changes:

- `pnpm run verify:determinism`
- `pnpm run verify:replay`
- `pnpm run verify:policy`
- `pnpm run verify:reconciliation:strict` (when reconciliation-core behavior is touched)

## 6. Docs and repo hygiene

For Repo-OS/doc-heavy changes:

- `pnpm run verify:docs`
- `pnpm run verify:internal-links` (if links or doc topology changed)
- `pnpm run verify:root`

## 7. Evidence and release packaging

For launch/release readiness claims:

- `pnpm run security:evidence`
- `pnpm run verify:security:evidence`
- `pnpm run verify:release:artifacts`

## 8. Reporting requirements

Implementation reports must list:

1. exact commands run,
2. pass/fail/warning status,
3. why scoped command selection was sufficient,
4. residual risk where full verification was not run.
