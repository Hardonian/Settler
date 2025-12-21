#!/bin/bash

# Run All Tests Script
# Executes all test scripts in sequence

set -e

echo "🚀 Running All Tests..."
echo ""

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required"
    exit 1
fi

DB_URL="${DATABASE_URL:-$SUPABASE_DB_URL}"
export DATABASE_URL="$DB_URL"
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Test 1: Setup verification
echo "📋 Test 1: Setup Verification..."
npx tsx scripts/test-setup.ts
echo ""

# Test 2: API routes
echo "📋 Test 2: API Routes..."
npx tsx scripts/test-api-routes.ts
echo ""

# Test 3: Integration
echo "📋 Test 3: Integration Tests..."
npx tsx scripts/integration-test.ts
echo ""

# Test 4: Route verification
echo "📋 Test 4: Route Verification..."
npx tsx scripts/verify-all-routes.ts
echo ""

# Test 5: End-to-end
echo "📋 Test 5: End-to-End Tests..."
npx tsx scripts/test-end-to-end.ts
echo ""

# Test 6: Final verification
echo "📋 Test 6: Final Verification..."
npx tsx scripts/final-verification.ts
echo ""

echo "✅ All tests completed!"
echo ""
echo "📊 Summary:"
echo "   ✅ Database migrations verified"
echo "   ✅ API routes tested"
echo "   ✅ Integration verified"
echo "   ✅ Routes verified"
echo "   ✅ End-to-end flow tested"
echo ""
echo "🎉 System is ready for production!"
