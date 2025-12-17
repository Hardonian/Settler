#!/bin/bash
# Script to wrap all CREATE INDEX statements in safe checks
# This ensures no duplicate indexes are created

# Find all CREATE INDEX statements and wrap them in conditional blocks
# This is a helper script - migrations should be updated manually for precision

echo "Checking for CREATE INDEX statements that need wrapping..."

grep -n "CREATE INDEX IF NOT EXISTS" supabase/migrations/*.sql | head -20
