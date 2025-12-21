#!/bin/bash

# Complete Setup Script
# Runs all migrations and configuration steps

set -e

echo "🚀 Starting complete setup..."

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required"
    echo "   Example: export DATABASE_URL='postgresql://user:pass@host:port/db?sslmode=require'"
    exit 1
fi

DB_URL="${DATABASE_URL:-$SUPABASE_DB_URL}"

# Step 1: Run migrations
echo ""
echo "📋 Step 1: Running database migrations..."
export DATABASE_URL="$DB_URL"
pnpm tsx scripts/run-migrations-remote.ts

# Step 2: Configure super admin (if USER_EMAIL or USER_ID provided)
if [ -n "$USER_EMAIL" ] || [ -n "$USER_ID" ]; then
    echo ""
    echo "📋 Step 2: Configuring super admin..."
    export DATABASE_URL="$DB_URL"
    if [ -n "$USER_EMAIL" ]; then
        export USER_EMAIL="$USER_EMAIL"
    fi
    if [ -n "$USER_ID" ]; then
        export USER_ID="$USER_ID"
    fi
    pnpm tsx scripts/configure-super-admin.ts
else
    echo ""
    echo "⏭️  Step 2: Skipping super admin configuration (USER_EMAIL or USER_ID not provided)"
    echo "   To configure later, run:"
    echo "   USER_EMAIL='admin@settler.dev' DATABASE_URL='$DB_URL' pnpm tsx scripts/configure-super-admin.ts"
fi

# Step 3: Test setup
echo ""
echo "📋 Step 3: Testing setup..."
export DATABASE_URL="$DB_URL"
pnpm tsx scripts/test-setup.ts

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Test API endpoints: curl http://localhost:3000/api/console/health"
echo "   2. View API logs: Navigate to /console/api-logs"
echo "   3. View tenant observability: Navigate to /console/admin/tenants (super admin only)"
