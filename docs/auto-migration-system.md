# Auto-Migration and Script Execution System

## Overview

This system automatically detects, runs, and archives migrations and scripts when they are added to a Pull Request. It ensures that:

1. **New migrations are automatically executed** when detected in PRs
2. **Scripts are automatically run** when added to the repository
3. **Completed items are archived** to keep the repo clean
4. **Execution is tracked** to prevent re-running completed items

## How It Works

### Detection

The system detects:
- **Prisma migrations**: Files in `prisma/migrations/*/migration.sql`
- **Supabase migrations**: Files in `supabase/migrations/*.sql`
- **Executable scripts**: Files in `scripts/*.{ts,js,sh}` (excluding validation/check scripts)

### Execution Flow

1. **On PR Push**: The GitHub Actions workflow triggers
2. **Detection**: New migrations/scripts are identified by comparing against the execution log
3. **Execution**: Items are run in order:
   - Prisma migrations first
   - Supabase migrations second
   - Scripts last
4. **Archiving**: Completed items are copied to `archive/` directories
5. **Tracking**: Execution log is updated with completed items
6. **Commit**: Archived files and execution log are committed back to the repo

## Files

### `.github/workflows/auto-run-migrations-on-pr.yml`

GitHub Actions workflow that:
- Triggers on PR open/sync
- Detects new migrations and scripts
- Runs them using production secrets
- Archives completed items
- Updates execution log
- Comments on PR with summary

### `scripts/auto-run-migrations.ts`

TypeScript script that can be run locally or in CI:
- Detects unexecuted migrations/scripts
- Runs them in the correct order
- Archives completed items
- Updates execution log

**Usage:**
```bash
# Check what would be run
tsx scripts/auto-run-migrations.ts --check-only

# Dry run (see what would happen)
tsx scripts/auto-run-migrations.ts --dry-run

# Actually run migrations/scripts
tsx scripts/auto-run-migrations.ts
```

### `.migration-execution-log.json`

JSON file tracking what has been executed:
```json
{
  "prisma_migrations": [
    {
      "path": "prisma/migrations/20250120000000_add_receipts_and_feature_flags/migration.sql",
      "archived_at": "2025-01-20T00:00:00",
      "archive_path": "archive/completed-migrations/prisma/20250120000000_add_receipts_and_feature_flags_2025-01-20T00-00-00",
      "executed_at": "2025-01-20T00:00:00Z"
    }
  ],
  "supabase_migrations": [...],
  "scripts": [...],
  "last_updated": "2025-01-20T00:00:00Z"
}
```

## Archive Structure

```
archive/
├── completed-migrations/
│   ├── prisma/
│   │   └── [migration-name]_[timestamp]/
│   └── supabase/
│       └── [migration-name]_[timestamp].sql
└── completed-scripts/
    └── [script-name]_[timestamp].[ext]
```

## Excluded Scripts

The following script patterns are excluded from auto-execution:
- `migration-guardian*`
- `validate-*`
- `check-*`
- `verify-*`
- `monitor-*`
- `maintainer-*`
- `test-*`
- `setup-*`
- `backup-*`
- `cleanup-*`

These are typically utility scripts that shouldn't be run automatically.

## Manual Execution

To manually run migrations/scripts:

```bash
# Run Prisma migrations
npm run prisma:migrate

# Run Supabase migrations
npm run db:migrate:auto

# Run the auto-run script locally
tsx scripts/auto-run-migrations.ts
```

## Requirements

- **GitHub Secrets** (for CI/CD):
  - `DATABASE_URL` - Database connection string
  - `SUPABASE_ACCESS_TOKEN` - Supabase API token
  - `SUPABASE_PROJECT_REF` - Supabase project reference

- **Local Environment**:
  - Node.js >= 24.0.0
  - npm >= 10.0.0
  - `DATABASE_URL` environment variable (for local runs)

## Workflow Permissions

The workflow requires:
- `contents: write` - To commit archived files
- `pull-requests: write` - To comment on PRs

## Troubleshooting

### Migrations not running

1. Check if they're already in the execution log
2. Verify file paths match expected patterns
3. Check GitHub Actions logs for detection output

### Scripts not executing

1. Ensure script is not in excluded patterns
2. Check file extension (.ts, .js, .sh)
3. Verify script has execute permissions

### Archive not updating

1. Check GitHub Actions has write permissions
2. Verify execution log is being updated
3. Check for merge conflicts in execution log

## Best Practices

1. **Migration Naming**: Use timestamp prefixes for migrations (e.g., `20250120000000_*`)
2. **Script Organization**: Keep executable scripts separate from utility scripts
3. **Testing**: Test migrations locally before pushing to PR
4. **Review**: Always review what will be executed before merging PRs
