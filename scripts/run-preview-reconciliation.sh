#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-dry-run}"
DB_URL="${DATABASE_URL:-${DIRECT_URL:-${SUPABASE_DB_URL:-}}}"
PATCH_FILE="supabase/migrations/20260313000000_final_reconciliation_preview.sql"

if [[ -z "$DB_URL" ]]; then
  echo "❌ Missing DATABASE_URL, DIRECT_URL, or SUPABASE_DB_URL"
  exit 1
fi

if [[ ! -f "$PATCH_FILE" ]]; then
  echo "❌ Missing patch file: $PATCH_FILE"
  exit 1
fi

echo "🔎 Verifying target identity"
TARGET_INFO=$(psql "$DB_URL" -v ON_ERROR_STOP=1 -X -A -t -c "select current_database() || '|' || current_user || '|' || coalesce(inet_server_addr()::text,'local') || ':' || coalesce(inet_server_port()::text,'0');")
echo "Target: $TARGET_INFO"

if [[ "${ALLOW_PRODUCTION_RECONCILIATION:-false}" != "true" ]]; then
  if [[ "$DB_URL" =~ production|prod ]] || [[ "$TARGET_INFO" =~ production|prod ]]; then
    echo "❌ Production-looking target detected. Set ALLOW_PRODUCTION_RECONCILIATION=true to override deliberately."
    exit 1
  fi
fi

if [[ "$MODE" == "apply" ]]; then
  echo "🚀 Applying reconciliation SQL"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$PATCH_FILE"
  echo "✅ Reconciliation patch applied"
else
  echo "🧪 Dry-run transaction (ROLLBACK)"
  TMP_SQL=$(mktemp)
  {
    echo 'BEGIN;'
    cat "$PATCH_FILE"
    echo 'ROLLBACK;'
  } > "$TMP_SQL"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$TMP_SQL"
  rm -f "$TMP_SQL"
  echo "✅ Dry-run completed with rollback"
fi
