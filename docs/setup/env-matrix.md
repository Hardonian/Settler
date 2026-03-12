# Settler Environment and Secret Matrix (Go-Live Truth)

This matrix is the operator-facing source of truth for runtime configuration.
It is based on active code references in `packages/api`, `packages/web`, `packages/cli`, `packages/adapters`, and CI workflows.

## Legend

- **Required**: `yes`, `no`, or `conditional`
- **Scope**: `local`, `ci`, `staging`, `prod`, `enterprise`
- **Sensitivity**: `public`, `internal`, `secret`

## Core runtime (API/Web)

| Name                            | Required           | Scope                     | Subsystem             | Default / fallback if absent                                                        | Safe fallback    | Sensitivity | Example format                                      |
| ------------------------------- | ------------------ | ------------------------- | --------------------- | ----------------------------------------------------------------------------------- | ---------------- | ----------- | --------------------------------------------------- |
| `NODE_ENV`                      | no                 | local, ci, prod           | runtime               | defaults to `development` in API validation                                         | yes              | internal    | `production`                                        |
| `PORT`                          | no                 | local, prod               | api/web server        | defaults to `3000`                                                                  | yes              | internal    | `4000`                                              |
| `HOST`                          | no                 | local, prod               | api server            | defaults to `0.0.0.0`                                                               | yes              | internal    | `0.0.0.0`                                           |
| `DATABASE_URL`                  | conditional        | local, ci, prod           | database              | required by migration and DB scripts if Supabase URL fallback is unavailable        | partial          | secret      | `postgresql://user:pass@host:5432/db`               |
| `DIRECT_URL`                    | no                 | ci, prod                  | migrations            | optional direct DB path for Prisma/migration operations                             | yes              | secret      | `postgresql://...`                                  |
| `SUPABASE_URL`                  | conditional        | local, ci, prod           | auth/database         | used as primary Supabase URL; many scripts fallback from `NEXT_PUBLIC_SUPABASE_URL` | partial          | internal    | `https://project.supabase.co`                       |
| `SUPABASE_ANON_KEY`             | conditional        | local, ci, prod           | auth/client bootstrap | used by API/web and CI; web can also use `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | partial          | public      | `eyJ...`                                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | conditional        | ci, staging, prod         | server-side Supabase  | no safe fallback for privileged operations                                          | no               | secret      | `eyJ...`                                            |
| `NEXT_PUBLIC_SUPABASE_URL`      | yes (web)          | local, ci, prod           | web client            | web validator throws if missing unless alternate server-only flow                   | no               | public      | `https://project.supabase.co`                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes (web)          | local, ci, prod           | web client            | web validator throws if missing unless alternate server-only flow                   | no               | public      | `eyJ...`                                            |
| `JWT_SECRET`                    | yes (prod runtime) | prod                      | auth                  | API validation rejects insecure/default values in production                        | no               | secret      | `base64-or-random-32+`                              |
| `JWT_REFRESH_SECRET`            | no                 | prod                      | auth                  | falls back to `JWT_SECRET` in validated config                                      | yes              | secret      | `base64-or-random-32+`                              |
| `ENCRYPTION_KEY`                | yes (prod runtime) | prod                      | encryption            | API validation rejects non-32-char key in production                                | no               | secret      | `32-char-string`                                    |
| `ALLOWED_ORIGINS`               | conditional        | prod                      | api security          | defaults to `*`; API warns in production                                            | partial          | internal    | `https://app.example.com,https://admin.example.com` |
| `REDIS_URL`                     | conditional        | staging, prod             | cache/rate-limit      | local fallbacks (`REDIS_HOST`, etc.) exist; some workloads degrade without Redis    | partial          | secret      | `rediss://default:pass@host:6379`                   |
| `UPSTASH_REDIS_REST_URL`        | no                 | ci, prod                  | upstash rest          | if absent, code can use `REDIS_URL`/`REDIS_TOKEN`                                   | yes              | internal    | `https://<db>.upstash.io`                           |
| `UPSTASH_REDIS_REST_TOKEN`      | no                 | ci, prod                  | upstash rest          | if absent, code can use `REDIS_TOKEN`                                               | partial          | secret      | `AXXXXX`                                            |
| `STRIPE_SECRET_KEY`             | conditional        | staging, prod, enterprise | billing               | billing routes become non-operational without it                                    | no for billing   | secret      | `sk_live_...`                                       |
| `STRIPE_WEBHOOK_SECRET`         | conditional        | staging, prod             | billing webhooks      | webhook signature verification fails without it                                     | no for webhooks  | secret      | `whsec_...`                                         |
| `RESEND_API_KEY`                | conditional        | prod                      | email delivery        | email sending disabled/fails when absent                                            | yes for core app | secret      | `re_...`                                            |
| `SENTRY_DSN`                    | no                 | staging, prod             | observability         | error telemetry disabled when absent                                                | yes              | secret      | `https://...@sentry.io/...`                         |
| `NEXT_PUBLIC_SENTRY_DSN`        | no                 | prod                      | web observability     | client telemetry disabled when absent                                               | yes              | public      | `https://...@sentry.io/...`                         |

## Feature, kernel, and operator controls

| Name                                | Required    | Scope                | Subsystem                 | Default / fallback if absent                                                   | Safe fallback         | Sensitivity | Example                               |
| ----------------------------------- | ----------- | -------------------- | ------------------------- | ------------------------------------------------------------------------------ | --------------------- | ----------- | ------------------------------------- |
| `SKIP_ENV_VALIDATION`               | no          | ci/build-only        | build safety              | disables env validation gate during build contexts                             | dangerous if overused | internal    | `true`                                |
| `JOBFORGE_INTEGRATION_ENABLED`      | no          | enterprise           | integration gating        | defaults to off (`0/false`)                                                    | yes                   | internal    | `1`                                   |
| `JOBFORGE_BUNDLE_EXECUTION_ENABLED` | no          | enterprise           | integration gating        | defaults to off (`0/false`)                                                    | yes                   | internal    | `1`                                   |
| `CREDENTIAL_ENCRYPTION_KEY`         | conditional | enterprise, prod     | adapter credential crypto | adapters try `SUPABASE_VAULT_KEY` fallback                                     | partial               | secret      | `hex-or-random-key`                   |
| `SUPABASE_VAULT_KEY`                | no          | enterprise           | adapter credential crypto | fallback source when `CREDENTIAL_ENCRYPTION_KEY` is absent                     | yes                   | secret      | `vault-secret`                        |
| `SETTLER_KERNEL_ENABLED`            | no          | local, staging, prod | kernel control            | disabled unless explicitly enabled                                             | yes                   | internal    | `1`                                   |
| `SETTLER_KERNEL_CANONICALIZE`       | no          | staging, prod        | kernel control            | canonicalization remains TS-only unless enabled                                | yes                   | internal    | `1`                                   |
| `SETTLER_KERNEL_EXECUTION_MODE`     | no          | staging, prod        | kernel control            | defaults to `primary`; accepts `disabled`, `compare_only`, `shadow`, `primary` | yes                   | internal    | `shadow`                              |
| `SETTLER_DISABLE_KERNEL`            | no          | rollback             | kernel kill switch        | immediate kernel disable and TS fallback                                       | yes                   | internal    | `1`                                   |
| `SETTLER_KERNEL_BIN`                | no          | staging, prod        | kernel binary             | if missing, CLI may use cargo fallback (non-prod) or TS fallback               | partial               | internal    | `/usr/local/bin/settler-kernel-cli`   |
| `SETTLER_KERNEL_ALLOW_CARGO`        | no          | local                | kernel fallback policy    | allows cargo-run fallback for missing binary                                   | yes                   | internal    | `1`                                   |
| `SETTLER_KERNEL_PRIMARY_ALLOWLIST`  | no          | staging, prod        | kernel routing            | empty allowlist prevents primary-kernel path for ops                           | yes                   | internal    | `canonicalize_hash,proof_bundle_hash` |
| `SETTLER_DISABLE_OPERATION`         | no          | rollback             | kernel routing            | disables specific kernel operations                                            | yes                   | internal    | `proof_bundle_hash`                   |
| `SETTLER_BASE_URL`                  | no          | local, prod          | CLI/API target            | defaults to `https://api.settler.io` in CLI commands                           | yes                   | internal    | `https://api.example.com`             |
| `SETTLER_API_KEY`                   | conditional | local, ci, prod      | CLI/operator auth         | required for most authenticated CLI commands                                   | no for auth flows     | secret      | `stlr_...`                            |

## CI / deployment-specific secrets

| Name                                                                    | Required      | Scope          | Subsystem                 | Notes                                                 |
| ----------------------------------------------------------------------- | ------------- | -------------- | ------------------------- | ----------------------------------------------------- |
| `TURBO_TOKEN`, `TURBO_TEAM`                                             | conditional   | ci             | build cache               | used across quality/deploy workflows for remote cache |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`                    | conditional   | ci/prod deploy | web deploy                | required by Vercel deploy jobs                        |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` | conditional   | ci deploy      | migrations/edge functions | required by Supabase CLI workflows                    |
| `PRODUCTION_URL`                                                        | conditional   | ci deploy      | post-deploy checks        | used by deployment health checks                      |
| `GITHUB_TOKEN`                                                          | yes (actions) | ci             | release automation        | used by release and automation workflows              |

## Drift findings (fixed in this pass)

- `.env.example.integrations` contained a large speculative keyset (Plaid/TrueLayer/NetSuite/etc.) that is not referenced by current runtime code. It has been reduced to keys currently read by adapters/CLI runtime.
- `.env.production.example` was missing; operators had no concise production-only template. Added in this pass.
- Setup guidance was fragmented across many docs; setup path is consolidated under `docs/setup/*`.
