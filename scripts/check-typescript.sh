#!/bin/bash
# TypeScript and Lint Check Script
# Checks all TypeScript files for errors

set -e

echo "🔍 Running TypeScript and Lint Checks..."
echo ""

ERRORS=0

# Check web package
echo "📦 Checking @settler/web package..."
cd packages/web
if [ -f "node_modules/.bin/tsc" ]; then
  node_modules/.bin/tsc --noEmit 2>&1 | tee /tmp/web-tsc-errors.txt || ERRORS=$((ERRORS + 1))
else
  echo "⚠️  TypeScript not found in web package, skipping..."
fi
cd ../..

# Check api package
echo "📦 Checking @settler/api package..."
cd packages/api
if [ -f "node_modules/.bin/tsc" ]; then
  node_modules/.bin/tsc --noEmit 2>&1 | tee /tmp/api-tsc-errors.txt || ERRORS=$((ERRORS + 1))
else
  echo "⚠️  TypeScript not found in api package, skipping..."
fi
cd ../..

# Check for lint errors
echo "🧹 Checking for lint errors..."
if command -v npm &> /dev/null; then
  npm run lint 2>&1 | tee /tmp/lint-errors.txt || ERRORS=$((ERRORS + 1))
else
  echo "⚠️  npm not found, skipping lint check..."
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ All checks passed!"
  exit 0
else
  echo "❌ Found $ERRORS error(s)"
  exit 1
fi
