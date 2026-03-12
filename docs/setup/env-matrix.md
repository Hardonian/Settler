# Environment Configuration Matrix (Canonical)

> Back to platform truth index: [`docs/platform-index.md`](../platform-index.md)

This matrix is the single source of truth for runtime environment variables and secrets used by core platform operation.

## Security level legend

- `public`: safe for browser/client exposure.
- `internal`: non-secret operational configuration.
- `secret`: sensitive credential or cryptographic material.

## Core runtime matrix

| Name                            | Required for                   | Subsystem            | Description                                                 | Default behavior                                          | Security level |
| ------------------------------- | ------------------------------ | -------------------- | ----------------------------------------------------------- | --------------------------------------------------------- | -------------- |
| `NODE_ENV`                      | API/web runtime                | Runtime              | Runtime mode (`development`, `test`, `production`)          | Defaults to `development` in local paths                  | internal       |
| `PORT`                          | API/web runtime                | API/Web              | Service port binding                                        | Defaults to app-defined local port                        | internal       |
| `HOST`                          | API runtime                    | API                  | Bind host for server process                                | Defaults to `0.0.0.0`                                     | internal       |
| `DATABASE_URL`                  | API runtime, migrations        | Data plane           | Primary Postgres/Supabase connection                        | No safe production fallback                               | secret         |
| `DIRECT_URL`                    | Prisma/migrations              | Data plane           | Direct DB path for migrations/admin operations              | Optional                                                  | secret         |
| `SUPABASE_URL`                  | API server-side operations     | Supabase integration | Project URL used by server workflows                        | May fall back to `NEXT_PUBLIC_SUPABASE_URL` in some flows | internal       |
| `SUPABASE_ANON_KEY`             | API/web bootstrap              | Supabase integration | Anon key for client and low-privilege paths                 | May fall back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | public         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Privileged server operations   | Supabase integration | Service role key for admin/privileged actions               | No safe fallback                                          | secret         |
| `NEXT_PUBLIC_SUPABASE_URL`      | Web client runtime             | Web                  | Public Supabase URL for browser client                      | Required for web client bootstrap                         | public         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web client runtime             | Web                  | Public Supabase anon key for browser client                 | Required for web client bootstrap                         | public         |
| `JWT_SECRET`                    | Production auth                | Auth                 | Signing secret for access tokens                            | Validation rejects weak/default values in prod            | secret         |
| `JWT_REFRESH_SECRET`            | Refresh token hardening        | Auth                 | Refresh token signing secret                                | Falls back to `JWT_SECRET` if not supplied                | secret         |
| `ENCRYPTION_KEY`                | Production runtime             | Security             | Core encryption material (must meet expected length/format) | No safe fallback                                          | secret         |
| `ALLOWED_ORIGINS`               | Production API                 | Security             | Allowed CORS origins list                                   | Wildcard is possible but discouraged in prod              | internal       |
| `REDIS_URL`                     | Cache/rate limiting/perf paths | Runtime infra        | Redis connection URL                                        | Optional; some features degrade without Redis             | secret         |
| `UPSTASH_REDIS_REST_URL`        | Upstash-backed Redis           | Runtime infra        | Upstash REST endpoint                                       | Optional if using direct Redis URL                        | internal       |
| `UPSTASH_REDIS_REST_TOKEN`      | Upstash-backed Redis           | Runtime infra        | Upstash auth token                                          | Optional if using direct Redis token flow                 | secret         |
| `STRIPE_SECRET_KEY`             | Billing features               | Billing              | Stripe API key for billing operations                       | Billing paths disabled/degraded if absent                 | secret         |
| `STRIPE_WEBHOOK_SECRET`         | Billing webhook verification   | Billing              | Stripe webhook signature verification key                   | Webhook verification fails closed if absent               | secret         |
| `RESEND_API_KEY`                | Transactional email            | Communications       | Provider key for email delivery                             | Email sending disabled if absent                          | secret         |
| `SENTRY_DSN`                    | Error telemetry                | Observability        | Sentry DSN for runtime error capture                        | App remains operational without Sentry                    | internal       |
| `NEXT_PUBLIC_POSTHOG_KEY`       | Product telemetry              | Observability        | PostHog client key                                          | Telemetry disabled if absent                              | public         |
| `NEXT_PUBLIC_POSTHOG_HOST`      | Product telemetry              | Observability        | PostHog endpoint host                                       | Defaults to project-configured host if any                | public         |

## Kernel and deterministic execution controls

| Name                               | Required for                      | Subsystem          | Description                                               | Default behavior                             | Security level |
| ---------------------------------- | --------------------------------- | ------------------ | --------------------------------------------------------- | -------------------------------------------- | -------------- |
| `SETTLER_KERNEL_ENABLED`           | Kernel path enablement            | Kernel integration | Enables kernel execution eligibility                      | Disabled unless explicitly enabled           | internal       |
| `SETTLER_KERNEL_CANONICALIZE`      | Kernel canonicalization operation | Kernel integration | Enables canonicalization op via kernel path               | TS path remains available                    | internal       |
| `SETTLER_KERNEL_EXECUTION_MODE`    | Kernel promotion/rollback         | Kernel integration | `disabled`, `compare_only`, `shadow`, `primary`           | Defaults to TS-safe behavior when unset      | internal       |
| `SETTLER_KERNEL_PRIMARY_ALLOWLIST` | Operation-level primary gating    | Kernel integration | Comma-separated operations allowed to run in primary mode | No operations promoted unless allowlisted    | internal       |
| `SETTLER_DISABLE_KERNEL`           | Emergency rollback                | Kernel integration | Hard kill switch for kernel use                           | Forces TS fallback                           | internal       |
| `SETTLER_DISABLE_OPERATION`        | Operation-specific rollback       | Kernel integration | Disables selected kernel operation(s)                     | Unset means no operation-specific disable    | internal       |
| `SETTLER_KERNEL_BIN`               | Kernel process execution          | Kernel integration | Path to kernel binary                                     | Resolution helper or fallback mode if absent | internal       |

## Enterprise and operations controls

| Name                                | Required for                     | Subsystem              | Description                                     | Default behavior                                | Security level |
| ----------------------------------- | -------------------------------- | ---------------------- | ----------------------------------------------- | ----------------------------------------------- | -------------- |
| `JOBFORGE_INTEGRATION_ENABLED`      | Enterprise connectors            | Enterprise integration | Enables JobForge integration pathways           | Off by default                                  | internal       |
| `JOBFORGE_BUNDLE_EXECUTION_ENABLED` | Enterprise bundle execution      | Enterprise integration | Enables bundle execution flow                   | Off by default                                  | internal       |
| `CREDENTIAL_ENCRYPTION_KEY`         | Enterprise credential protection | Enterprise integration | Encryption key for stored connector credentials | Required when enterprise connectors are enabled | secret         |
| `SUPABASE_VAULT_KEY`                | Enterprise credential protection | Enterprise integration | Alternate vault key for credential encryption   | Used when `CREDENTIAL_ENCRYPTION_KEY` not set   | secret         |
| `SAFE_MODE`                         | Incident containment             | Runtime safety         | Enables conservative behavior profile           | Off by default                                  | internal       |
| `ALERT_NOTIFIER_DRY_RUN`            | Alerting validation              | Operations             | Suppresses outbound alerts for safe testing     | Off by default                                  | internal       |
| `SLACK_ALERT_WEBHOOK_URL`           | Ops alerting channel             | Operations             | Slack webhook for alerts                        | Optional, alert channel disabled if absent      | secret         |
| `TEAMS_ALERT_WEBHOOK_URL`           | Ops alerting channel             | Operations             | Teams webhook for alerts                        | Optional, alert channel disabled if absent      | secret         |
| `TELEGRAM_BOT_TOKEN`                | Ops alerting channel             | Operations             | Telegram bot token                              | Optional, alert channel disabled if absent      | secret         |
| `TELEGRAM_CHAT_ID`                  | Ops alerting channel             | Operations             | Telegram destination chat ID                    | Optional, alert channel disabled if absent      | internal       |

## CI and deployment secrets

| Name                    | Required for                  | Subsystem            | Description                                   | Default behavior                            | Security level |
| ----------------------- | ----------------------------- | -------------------- | --------------------------------------------- | ------------------------------------------- | -------------- |
| `TURBO_TOKEN`           | Remote cache in CI            | Build infrastructure | Turbo cache authentication token              | CI builds work without remote cache, slower | secret         |
| `TURBO_TEAM`            | Remote cache in CI            | Build infrastructure | Turbo cache team identifier                   | Optional depending on cache setup           | internal       |
| `VERCEL_TOKEN`          | Web deployment pipeline       | Deployment           | Auth token for Vercel deploy API              | Required for Vercel automation              | secret         |
| `VERCEL_ORG_ID`         | Web deployment pipeline       | Deployment           | Vercel organization ID                        | Required for Vercel automation              | internal       |
| `VERCEL_PROJECT_ID`     | Web deployment pipeline       | Deployment           | Vercel project ID                             | Required for Vercel automation              | internal       |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI deploy workflows | Deployment           | Supabase access token for CI operations       | Required for automated Supabase workflows   | secret         |
| `SUPABASE_PROJECT_REF`  | Supabase CLI deploy workflows | Deployment           | Target Supabase project reference             | Required for automated Supabase workflows   | internal       |
| `SUPABASE_DB_PASSWORD`  | Supabase migrations           | Deployment           | Database password used by migration workflows | Required for migration automation           | secret         |
| `PRODUCTION_URL`        | Post-deploy verification      | Deployment           | Target URL for smoke checks                   | Optional unless post-deploy checks enabled  | internal       |
| `GITHUB_TOKEN`          | Release automation            | CI automation        | GitHub token for release automation tasks     | Required in GitHub Actions contexts         | secret         |

## Operator verification commands

Use these commands after populating required env keys:

- `pnpm run verify:setup`
- `pnpm run doctor -- --first-run`
- `pnpm run settler:doctor -- --first-run` (alias of `doctor`)
- `pnpm run kernel:health`
