#!/bin/bash
# Script to set Supabase secrets for auth_edge_guard function
# Usage: ./scripts/set-supabase-secrets.sh
#
# IMPORTANT: Never commit actual secret values to version control
# This script should be run manually with actual values from your environment

set -e

echo "🔐 Setting Supabase secrets for auth_edge_guard function..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Please ensure you're logged in to Supabase CLI:"
    echo "   supabase login"
    exit 1
fi

# Set secrets (replace with actual values from your environment)
echo "Setting UPSTASH_REDIS_REST_URL..."
supabase secrets set UPSTASH_REDIS_REST_URL="${UPSTASH_REDIS_REST_URL:-https://pretty-buck-23396.upstash.io}"

echo "Setting UPSTASH_REDIS_REST_TOKEN..."
supabase secrets set UPSTASH_REDIS_REST_TOKEN="${UPSTASH_REDIS_REST_TOKEN:-AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY}"

echo "Setting IP_RPM..."
supabase secrets set IP_RPM="${IP_RPM:-300}"

echo "Setting USER_RPM..."
supabase secrets set USER_RPM="${USER_RPM:-900}"

echo "Setting CACHE_MAX_AGE..."
supabase secrets set CACHE_MAX_AGE="${CACHE_MAX_AGE:-90}"

echo ""
echo "✅ All secrets have been set successfully!"
echo ""
echo "📋 To verify secrets are set:"
echo "   supabase secrets list"
echo ""
echo "🚀 Deploy the function:"
echo "   supabase functions deploy auth_edge_guard"
