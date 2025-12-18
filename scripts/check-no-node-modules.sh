#!/bin/bash
# CI guard script that fails if node_modules appears in git-tracked files

set -e

echo "Checking for committed node_modules files..."

TRACKED_NODE_MODULES=$(git ls-files | grep -E "(^|/)node_modules(/|$)" || true)

if [ -n "$TRACKED_NODE_MODULES" ]; then
  echo "❌ Error: node_modules files are committed to git!"
  echo ""
  echo "Found the following tracked node_modules files:"
  echo "$TRACKED_NODE_MODULES" | head -20
  echo ""
  echo "To fix:"
  echo "  git rm -r --cached packages/*/node_modules"
  echo "  git commit -m 'Remove committed node_modules'"
  exit 1
fi

echo "✅ No node_modules files are tracked in git"
exit 0
