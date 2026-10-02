#!/usr/bin/env bash
# Verify Supabase migration files against the migration contract.
# Called by .husky/pre-commit when supabase/migrations/ files are staged.
# Usage: bash scripts/verify-migrations.sh [--all | <files...>]
set -Eeuo pipefail
cd "$(dirname "$0")/.."
exec node scripts/verify-migrations.mjs "$@"
