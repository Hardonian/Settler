#!/bin/bash
# Trigger migration via GitHub Actions
# This script helps trigger the migration workflow

set -e

echo "🚀 Triggering Migration via GitHub Actions"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) not installed"
  echo ""
  echo "Please install it: https://cli.github.com/"
  echo ""
  echo "Or trigger manually:"
  echo "1. Go to: https://github.com/YOUR_REPO/actions/workflows/migrate-on-comment.yml"
  echo "2. Click 'Run workflow'"
  echo "3. Select branch and run"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "❌ Not authenticated with GitHub CLI"
  echo "Run: gh auth login"
  exit 1
fi

echo "✅ GitHub CLI ready"
echo ""
echo "Choose trigger method:"
echo "1) Workflow dispatch (manual trigger)"
echo "2) Comment on issue/PR"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
  1)
    echo ""
    echo "🔄 Triggering workflow dispatch..."
    gh workflow run migrate-on-comment.yml
    echo ""
    echo "✅ Workflow triggered!"
    echo "View run: gh run watch"
    ;;
  2)
    echo ""
    read -p "Enter issue/PR number: " issue_num
    if [ -z "$issue_num" ]; then
      echo "❌ Issue/PR number required"
      exit 1
    fi
    echo ""
    echo "💬 Commenting 'migrate' on issue #$issue_num..."
    gh issue comment "$issue_num" --body "migrate"
    echo ""
    echo "✅ Comment posted! Workflow should trigger automatically."
    echo "View run: gh run watch"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac
