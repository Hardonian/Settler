# Verification Command Truth Table

| Command                                                    | What it proves                                 | What it does **not** prove              | Current status                                                        |
| ---------------------------------------------------------- | ---------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                           | lockfile-consistent dependency graph install   | runtime correctness                     | pass                                                                  |
| `pnpm lint`                                                | lint policy compliance (warnings present)      | type/runtime correctness                | pass (warnings)                                                       |
| `pnpm typecheck`                                           | TS compile-level consistency                   | runtime behavior                        | **fail**                                                              |
| `pnpm build`                                               | repo build pipeline can compile outputs        | deploy env/service readiness            | mixed (web build pass, monorepo interrupted previously by stale lock) |
| `pnpm test`                                                | package test suites                            | full production traffic behavior        | running but noisy/long; not a rollout guarantee                       |
| `cargo fmt --check`                                        | rust formatting                                | behavior                                | pass                                                                  |
| `cargo clippy --all-targets --all-features -- -D warnings` | rust lint cleanliness                          | runtime integration correctness         | pass                                                                  |
| `cargo test --all`                                         | rust kernel test suite                         | TS/web integration correctness          | pass                                                                  |
| `pnpm run doctor -- --first-run`                           | local setup/env/config diagnostics             | cloud deployment readiness              | fail without env population and with repo typecheck failure           |
| `pnpm run kernel:health`                                   | kernel startup/operation readiness diagnostics | business-path correctness under traffic | pass                                                                  |
| `pnpm run check:production`                                | ordered repo quality gate checks               | secrets, DNS/TLS, rollout safety        | fail (`repo-integrity`)                                               |

## Command honesty adjustments made

- Reframed check:production output language to "production verification gate" (repo quality gate) instead of absolute deployment readiness.
- Added doctor/kernel diagnostics as optional explicit evidence steps in `check:production`.
