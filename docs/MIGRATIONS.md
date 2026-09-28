# Database Migrations

Settler has two explicit migration lanes and one production owner.

| Lane         | Owns                                                             | Persistent ledger                      |
| ------------ | ---------------------------------------------------------------- | -------------------------------------- |
| Prisma       | Tables, columns, relations, and Prisma indexes                   | `_prisma_migrations`                   |
| Supabase SQL | RLS, policies, functions, extensions, and database-only features | `settler_internal.supabase_migrations` |

Only `.github/workflows/auto-migrate-on-main.yml` may mutate the production schema. API startup verifies connectivity and never runs migrations.

## Create a migration

For a Prisma schema change:

```bash
pnpm exec prisma migrate dev --name descriptive_name
```

For a Supabase SQL change:

```bash
pnpm run db:new descriptive_name
```

Then edit the generated root-level file under `supabase/migrations/` and run:

```bash
pnpm run db:verify:migrations
```

## Supabase SQL contract

- Filenames use `YYYYMMDDHHMMSS_lower_snake_case.sql` with a unique timestamp.
- Existing migration files are immutable. Fixes require a new migration.
- Do not add `BEGIN`, `COMMIT`, or `ROLLBACK`; deployment supplies one atomic transaction that also records the checksum.
- Do not use `psql` meta-commands or `CREATE INDEX CONCURRENTLY`.
- Destructive SQL requires `-- settler: allow-destructive <reason>` and explicit review.
- `SECURITY DEFINER` functions require a fixed `search_path` and revoked `PUBLIC` execution.
- Views require `security_invoker = true`.

Diagnostics live in `supabase/diagnostics/`; emergency rollback scripts live in `supabase/rollbacks/`. Neither directory is deployed automatically.

## Deployment and retries

On merge to `main`, the production workflow applies Prisma migrations first through the IPv4 session pooler, then Supabase SQL through the Management API. Deployments are serialized and cannot cancel an in-flight database change.

Supabase SQL is checksum-locked. A retry skips an already-recorded matching migration, while a changed checksum fails closed. Every run uploads a 90-day evidence artifact.

Use GitHub's native workflow rerun to retry a failed Supabase migration at the
same immutable commit. Manual dispatch is limited to pending Prisma migrations,
so it cannot select pre-ledger legacy SQL. Do not run ad-hoc production
migration scripts.
