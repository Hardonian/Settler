# GitHub Secrets Setup for Migrations

Configure these as `production` environment secrets under **Settings → Environments → production**.

| Secret                  | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token for Management API SQL            |
| `SUPABASE_PROJECT_REF`  | Exact production project reference                               |
| `DATABASE_URL`          | Existing production URI, used only as a database password source |

The workflow never connects to the `DATABASE_URL` endpoint. It extracts the
password in memory and combines it with the linked session-pooler metadata in
`supabase/.temp/`. The derived URL is constrained to the linked project, a
`*.pooler.supabase.com` host, and port `5432`; it is never printed or persisted.

The workflow rejects unrelated credential sources and transaction-pooler port
`6543`. GitHub-hosted runners do not provide reliable IPv6 connectivity, and
Prisma migration sessions require session semantics.

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
- No duplicate pooler secret is required, eliminating password drift between connection strings.

The production environment should require reviewers. Never commit any token, database URI, or password.
