#!/bin/bash
# Staging Environment Validation Checks
# Validates staging environment before production deployment

set -e

echo "🔍 Staging Environment Validation"
echo "================================="

# Check environment variables
echo "Checking environment variables..."
required_vars=("DATABASE_URL" "SUPABASE_URL" "SUPABASE_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required variable: $var"
    exit 1
  fi
done
echo "✅ Environment variables OK"

# Check database connectivity
echo "Checking database connectivity..."
if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
  echo "✅ Database connection OK"
else
  echo "❌ Database connection failed"
  exit 1
fi

# Check API health
echo "Checking API health..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
  echo "✅ API health check OK"
else
  echo "❌ API health check failed"
  exit 1
fi

# Check migrations
echo "Checking migrations..."
if npm run db:migrate:status >/dev/null 2>&1; then
  echo "✅ Migrations OK"
else
  echo "❌ Migration check failed"
  exit 1
fi

# Check build
echo "Checking build..."
if npm run build >/dev/null 2>&1; then
  echo "✅ Build OK"
else
  echo "❌ Build failed"
  exit 1
fi

# Check tests
echo "Running tests..."
if npm test >/dev/null 2>&1; then
  echo "✅ Tests passed"
else
  echo "❌ Tests failed"
  exit 1
fi

echo ""
echo "✅ All validation checks passed!"
echo "Staging environment is ready for production deployment."
