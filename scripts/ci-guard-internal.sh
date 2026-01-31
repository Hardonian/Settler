#!/bin/bash
set -euo pipefail

# CI Guard: Prevent internal/ directory and agent docs from being tracked
# This script fails the build if internal docs are accidentally added to git

echo "🔍 Checking for internal files in git tracking..."

# Check if any internal/ files are tracked
INTERNAL_TRACKED=$(git ls-files internal/ 2>/dev/null || true)
if [[ -n "$INTERNAL_TRACKED" ]]; then
    echo "❌ ERROR: Found tracked files in internal/ directory:"
    echo "$INTERNAL_TRACKED"
    echo ""
    echo "Internal files should not be tracked in git."
    echo "Run: git rm --cached <files> to remove them."
    exit 1
fi

# Check for completion reports in root
ROOT_COMPLETION=$(git ls-files | grep -E "^(COMPLETE_|FINAL_|GO_LIVE)" || true)
if [[ -n "$ROOT_COMPLETION$" ]]; then
    echo "❌ ERROR: Found completion reports in root that should be in internal/:"
    echo "$ROOT_COMPLETION$"
    echo ""
    echo "Move these files to internal/completion-reports/ and remove from git."
    exit 1
fi

# Check for agent docs in root
AGENT_DOCS=$(git ls-files | grep -E "^(AGENTS\.md|CLAUDE\.md)" || true)
if [[ -n "$AGENT_DOCS" ]]; then
    echo "❌ ERROR: Found agent docs in root:"
    echo "$AGENT_DOCS"
    echo ""
    echo "Move these files to internal/agent-notes/ and remove from git."
    exit 1
fi

# Check for .claude directory
CLAUDE_TRACKED=$(git ls-files .claude/ 2>/dev/null || true)
if [[ -n "$CLAUDE_TRACKED" ]]; then
    echo "❌ ERROR: Found tracked files in .claude/ directory:"
    echo "$CLAUDE_TRACKED"
    exit 1
fi

echo "✅ No internal files found in git tracking."
echo "✅ CI guard passed."
exit 0
