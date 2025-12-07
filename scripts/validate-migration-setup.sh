#!/bin/bash
# Validate migration setup without running migrations
# Checks if everything is configured correctly

set -e

echo "🔍 Validating Migration Setup"
echo "=============================="
echo ""

ERRORS=0
WARNINGS=0

# Check workflow file exists
echo "1. Checking workflow file..."
if [ -f ".github/workflows/migrate-on-comment.yml" ]; then
  echo "   ✅ Workflow file exists"
else
  echo "   ❌ Workflow file missing"
  ERRORS=$((ERRORS + 1))
fi

# Check migration files
echo ""
echo "2. Checking migration files..."
MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" -type f 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -gt 0 ]; then
  echo "   ✅ Found $MIGRATION_COUNT migration files"
else
  echo "   ⚠️  No migration files found"
  WARNINGS=$((WARNINGS + 1))
fi

# Check archived migrations
echo ""
echo "3. Checking archived migrations..."
ARCHIVED_COUNT=$(find archive/deprecated_code/migrations -name "*.sql" -type f 2>/dev/null | wc -l)
if [ "$ARCHIVED_COUNT" -gt 0 ]; then
  echo "   ✅ Found $ARCHIVED_COUNT archived migration files"
else
  echo "   ⚠️  No archived migrations found"
  WARNINGS=$((WARNINGS + 1))
fi

# Check helper scripts
echo ""
echo "4. Checking helper scripts..."
SCRIPTS=(
  "scripts/apply-pending-migrations.sh"
  "scripts/check-migration-status.sh"
  "scripts/trigger-migration.sh"
)

for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ] && [ -x "$script" ]; then
    echo "   ✅ $script (executable)"
  elif [ -f "$script" ]; then
    echo "   ⚠️  $script (not executable)"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "   ❌ $script (missing)"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check documentation
echo ""
echo "5. Checking documentation..."
DOCS=(
  "docs/github-secrets-migration.md"
  "docs/migration-automation-setup.md"
  "MIGRATION_AUTOMATION_COMPLETE.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "   ✅ $doc"
  else
    echo "   ⚠️  $doc (missing)"
    WARNINGS=$((WARNINGS + 1))
  fi
done

# Check GitHub CLI availability
echo ""
echo "6. Checking GitHub CLI..."
if command -v gh &> /dev/null; then
  if gh auth status &> /dev/null; then
    echo "   ✅ GitHub CLI installed and authenticated"
  else
    echo "   ⚠️  GitHub CLI installed but not authenticated"
    echo "      Run: gh auth login"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "   ⚠️  GitHub CLI not installed (optional)"
  echo "      Install: https://cli.github.com/"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=============================="
echo "Validation Summary"
echo "=============================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All checks passed! Setup is complete."
  echo ""
  echo "Next steps:"
  echo "1. Add GitHub secrets (see docs/github-secrets-migration.md)"
  echo "2. Trigger migration: ./scripts/trigger-migration.sh"
  echo "   Or comment 'migrate' on any issue/PR"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Setup complete with warnings (see above)"
  exit 0
else
  echo "❌ Setup incomplete. Please fix errors above."
  exit 1
fi
