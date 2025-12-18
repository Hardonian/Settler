#!/bin/bash
# Script to run the consolidated migration when Supabase is available
# This script will be ready to use once Supabase local instance is running

set -e

echo "🚀 Running consolidated migration for missing tables..."

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Please start it first:"
    echo "   supabase start"
    exit 1
fi

# Get database URL from Supabase
DB_URL=$(supabase status --output json 2>/dev/null | grep -oP '"DB URL":\s*"\K[^"]+' || echo "")

if [ -z "$DB_URL" ]; then
    # Fallback: construct from Supabase defaults
    DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
fi

echo "📊 Database URL: ${DB_URL/:\/\/.*@/:\/\/***@}"
echo ""

# Run the migration
if command -v psql > /dev/null; then
    echo "✅ Using psql to run migration..."
    psql "$DB_URL" -f supabase/migrations/20260202000000_consolidated_missing_tables.sql
else
    echo "✅ Using Node.js to run migration..."
    node -e "
    const { Pool } = require('pg');
    const fs = require('fs');
    const sql = fs.readFileSync('supabase/migrations/20260202000000_consolidated_missing_tables.sql', 'utf8');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || '$DB_URL' });
    
    (async () => {
      try {
        await pool.query(sql);
        console.log('✅ Migration completed successfully!');
        process.exit(0);
      } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
      } finally {
        await pool.end();
      }
    })();
    "
fi

echo ""
echo "✅ Migration completed!"
