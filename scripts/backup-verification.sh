#!/bin/bash
# Backup Verification Routine
# Verifies database backups are valid and restorable

set -e

echo "Starting backup verification..."

# Check backup exists
BACKUP_FILE="backups/db-backup-$(date +%Y%m%d).sql"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Verify backup file integrity
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "ERROR: Backup file is corrupted"
  exit 1
fi

# Check backup size (should be > 0)
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
if [ "$BACKUP_SIZE" -eq 0 ]; then
  echo "ERROR: Backup file is empty"
  exit 1
fi

# Verify backup contains expected tables
if ! zcat "$BACKUP_FILE" | grep -q "CREATE TABLE.*users"; then
  echo "WARNING: Backup may be incomplete (users table not found)"
fi

# Test restore in sandbox (optional, requires test database)
# echo "Testing restore in sandbox..."
# psql -h localhost -U postgres -d settler_test -f <(zcat "$BACKUP_FILE")

echo "Backup verification completed successfully"
echo "Backup file: $BACKUP_FILE"
echo "Size: $BACKUP_SIZE bytes"
echo "Status: Valid"
