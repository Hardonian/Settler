# GitHub Secrets Setup for Migrations

Configure these as `production` environment secrets under **Settings → Environments → production**.

| Secret                  | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token for Management API SQL |
| `SUPABASE_PROJECT_REF`  | Exact production project reference                    |
| `SUPABASE_POOLER_URL`   | Session pooler URI used only by Prisma migrations     |

`SUPABASE_POOLER_URL` must be copied from **Supabase Dashboard → Connect → Session pooler**. It must use a `*.pooler.supabase.com` host, port `5432`, the `postgres.<project-ref>` user, a percent-encoded password, and `sslmode=require`.

The workflow rejects direct `db.<project-ref>.supabase.co` endpoints and transaction pooler port `6543`. GitHub-hosted runners do not provide reliable IPv6 connectivity, and Prisma migration sessions require session semantics.

Do not allowlist one GitHub Actions CIDR. Hosted-runner addresses are numerous and change. Supabase SQL travels through the Management API; Prisma uses the IPv4 session pooler.

## Safety model

- `migration-guardian.yml` is read-only and receives no database secrets.
- `auto-migrate-on-main.yml` is the only production migration owner.
- The production job is serialized with `cancel-in-progress: false`.
- Prisma records state in `_prisma_migrations`.
- Supabase SQL and its SHA-256 checksum are atomically recorded in `settler_internal.supabase_migrations`.
- Existing migration edits and deletes fail CI.
- Missing credentials, invalid endpoints, checksum drift, or SQL failures fail the run.
- Failure issues are updated in place instead of creating one issue per retry.
- Supabase retries use GitHub's native rerun at the same immutable commit; manual dispatch is Prisma-only.
- Supabase migration evidence is retained as a GitHub Actions artifact for 90 days.

The production environment should require reviewers. Never commit any token, database URI, or password.
