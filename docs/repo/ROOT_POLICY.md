# Repository Root Policy

`pnpm run verify:root` enforces an explicit root allowlist from `config/root-policy.json`. The goal is to block accidental clutter while keeping intentional legacy/canonical root entries deterministic.

## Policy behavior

- **Allowed entries**: exact names listed in `config/root-policy.json`.
- **Blocked extensions**: archive/temp extensions (e.g. `.zip`, `.tmp`, `.bak`) fail immediately.
- **Local clutter patterns**: known local artifacts (e.g. logs, `playwright-report`, `coverage`) are called out separately with cleanup guidance.
- **Unknown entries**: fail with actionable output and instructions to relocate or explicitly allowlist.

## Root entry classification (current repository state)

| Entry                                    | Type                | Intended at root? | Allowed today? | Action      | Rationale                                                             |
| ---------------------------------------- | ------------------- | ----------------- | -------------- | ----------- | --------------------------------------------------------------------- |
| `.classifyignore`                        | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.cursorrules`                           | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.editorconfig`                          | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.env.connection`                        | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.env.example`                           | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.env.example.billing`                   | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.env.example.integrations`              | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.env.template`                          | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.eslintignore`                          | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.eslintrc.js`                           | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.gitattributes`                         | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.github`                                | core-dir (dir)      | Y                 | Y              | allowlisted | Canonical project root directory.                                     |
| `.gitignore`                             | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.gitleaks.toml`                         | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.husky`                                 | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `.lintstagedrc.js`                       | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.node-version`                          | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.npm-auditignore`                       | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.npmrc`                                 | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.nvmrc`                                 | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.prettierignore`                        | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.prettierrc`                            | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.release-checklist.md`                  | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `.turbo`                                 | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `.vercelignore`                          | config-file (file)  | Y                 | Y              | allowlisted | Tooling/environment config expected at root.                          |
| `_import`                                | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `agents`                                 | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `AGENTS.md`                              | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `ARCHITECTURE.md`                        | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `archive`                                | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `artifacts`                              | core-dir (dir)      | Y                 | Y              | allowlisted | Canonical project root directory.                                     |
| `benchmarks`                             | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `BUILDER_IO_SETUP.md`                    | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `Cargo.lock`                             | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `Cargo.toml`                             | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `CHANGELOG.md`                           | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `CODE_OF_CONDUCT.md`                     | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `CODEOWNERS`                             | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `config`                                 | core-dir (dir)      | Y                 | Y              | allowlisted | Canonical project root directory.                                     |
| `contracts`                              | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `CONTRIBUTING.md`                        | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `crates`                                 | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `DATA_PORTABILITY.md`                    | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `demo`                                   | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `DEPENDENCY_FIX_PLAN.md`                 | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `design`                                 | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `design-system`                          | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `docs`                                   | core-dir (dir)      | Y                 | Y              | allowlisted | Canonical project root directory.                                     |
| `domain-packs`                           | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `economic`                               | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `emails`                                 | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `enterprise`                             | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `eslint.config.js`                       | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `evidence`                               | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `examples`                               | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `execute_patch.py`                       | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `execute_sql.py`                         | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `fixtures`                               | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `FRONTEND_DESIGN_REVIEW.md`              | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `FRONTEND_IMPROVEMENTS.md`               | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `GO_LIVE.md`                             | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `GO_LIVE_COMPLETE.md`                    | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `GOVERNANCE.md`                          | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `grafana-dashboards`                     | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `HARDENING_SUMMARY.md`                   | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `HISTORICAL-PLANNING-ARCHIVE`            | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `INVESTOR-RELATIONS-PRIVATE`             | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `kits`                                   | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `launch`                                 | core-dir (dir)      | Y                 | Y              | allowlisted | Canonical project root directory.                                     |
| `launch/launch-checklist.md`             | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `LAUNCH_READY.md`                        | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `LAUNCHKIT.md`                           | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `legal`                                  | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `LEGAL`                                  | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `LICENSE`                                | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `marketing`                              | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `marketplace`                            | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `MERGE_SUMMARY.md`                       | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `MODEL_SPEC.md`                          | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `next.config.js`                         | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `node-compile-cache`                     | generated-dir (dir) | Y                 | Y              | allowlisted | Repository tracks generated/diagnostic outputs at root by convention. |
| `opencode.json`                          | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `ops`                                    | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `OPS_IMPLEMENTATION_SUMMARY.md`          | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `package.json`                           | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `packages`                               | core-dir (dir)      | Y                 | Y              | allowlisted | Canonical project root directory.                                     |
| `pdk`                                    | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `platform`                               | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `playwright.config.ts`                   | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `playwright.prod.config.ts`              | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `pnpm-lock.yaml`                         | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `pnpm-workspace.yaml`                    | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `policies`                               | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `pr-overlay`                             | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `prisma`                                 | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `prisma.config.ts`                       | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `PRIVACY.md`                             | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `PRODUCT_CLARITY_AUDIT.md`               | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `prompts`                                | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `qa`                                     | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `qa-artifacts`                           | generated-dir (dir) | Y                 | Y              | allowlisted | Repository tracks generated/diagnostic outputs at root by convention. |
| `README.md`                              | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `README_LAUNCH.md`                       | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `REALITY_MAP.md`                         | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `REALITY_MODE_SUMMARY.md`                | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `REALITY_SCORECARD.md`                   | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `recon_mismatch`                         | generated-dir (dir) | Y                 | Y              | allowlisted | Repository tracks generated/diagnostic outputs at root by convention. |
| `recon_output`                           | generated-dir (dir) | Y                 | Y              | allowlisted | Repository tracks generated/diagnostic outputs at root by convention. |
| `RELEASE.md`                             | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `RELEASE_NOTES.md`                       | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `RELEASE_PREP_SUMMARY.md`                | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `REPO_POLICY.md`                         | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `run_validation.py`                      | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `runner`                                 | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `SAFE_BREAKING_CHANGES_PLAN.md`          | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `scaffold-repro`                         | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `scripts`                                | core-dir (dir)      | Y                 | Y              | allowlisted | Canonical project root directory.                                     |
| `SECURITY.md`                            | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `SECURITY_INVARIANTS.md`                 | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `Settler.sln`                            | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `settler_stax_dataset_200_multiturn.csv` | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `SKILLS.md`                              | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `stitch_export`                          | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `strategic`                              | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `supabase`                               | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `SUPABASE_AI_PROMPT.sql`                 | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `SUPABASE_AI_REMEDIATION_PROMPT.sql`     | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `SUPABASE_BACKEND_VALIDATION_SUMMARY.md` | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `support`                                | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `SUPPORT.md`                             | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `templates`                              | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `tests`                                  | core-dir (dir)      | Y                 | Y              | allowlisted | Canonical project root directory.                                     |
| `tmp`                                    | generated-dir (dir) | Y                 | Y              | allowlisted | Repository tracks generated/diagnostic outputs at root by convention. |
| `tools`                                  | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `tsconfig.api-adapter.json`              | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `tsconfig.json`                          | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `tsconfig.temp-fix.json`                 | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `turbo.json`                             | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `ui`                                     | project-dir (dir)   | Y                 | Y              | allowlisted | Intentional top-level project area in monorepo layout.                |
| `UI_CONSISTENCY_REPORT.md`               | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `vercel.json`                            | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `verify_patch.py`                        | tooling-file (file) | Y                 | Y              | allowlisted | Build/tooling/runtime file required from root.                        |
| `WINDOWS_DEVELOPMENT.md`                 | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |
| `WINDOWS_SYMLINK_FIX.md`                 | docs-file (file)    | Y                 | Y              | allowlisted | Historical or canonical documentation retained at root.               |

## Contributor workflow

1. Run `pnpm run verify:root` before opening a PR.
2. If the check fails on **local clutter**, remove generated files or run your cleanup routine.
3. If the check fails on **unexpected root entries**, relocate them into canonical directories (preferred).
4. Only update `config/root-policy.json` when a new root entry is intentional and durable. Include rationale in the PR description.
