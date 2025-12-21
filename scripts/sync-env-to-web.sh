#!/bin/bash
# Sync root .env to packages/web/.env.local for Next.js
# This ensures all env vars are accessible to Next.js

echo "🔄 Syncing environment variables..."

# Start with DATABASE_URL from .env.connection (if exists)
if [ -f .env.connection ]; then
  echo "# Database connection (from .env.connection)" > packages/web/.env.local
  grep "DATABASE_URL" .env.connection >> packages/web/.env.local 2>/dev/null
  echo "" >> packages/web/.env.local
fi

# Add all vars from root .env
if [ -f .env ]; then
  echo "# Environment variables from root .env" >> packages/web/.env.local
  grep -E "^[A-Z_]+=" .env | grep -v "^DATABASE_URL" >> packages/web/.env.local
  echo "" >> packages/web/.env.local
fi

# Ensure NEXT_PUBLIC_* vars exist for client-side
if grep -q "^SUPABASE_URL=" packages/web/.env.local 2>/dev/null && ! grep -q "^NEXT_PUBLIC_SUPABASE_URL=" packages/web/.env.local; then
  SUPABASE_URL=$(grep "^SUPABASE_URL=" packages/web/.env.local | cut -d'=' -f2-)
  SUPABASE_ANON_KEY=$(grep "^SUPABASE_ANON_KEY=" packages/web/.env.local | cut -d'=' -f2-)
  echo "# Client-side Supabase (exposed to browser)" >> packages/web/.env.local
  echo "NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}" >> packages/web/.env.local
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >> packages/web/.env.local
fi

echo "✅ Environment variables synced to packages/web/.env.local"
echo "📊 Total vars: $(grep -E '^[A-Z_]+=' packages/web/.env.local | wc -l)"
