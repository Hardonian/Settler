#!/bin/bash
# Trigger migrations workflow immediately
# This script triggers the GitHub Actions workflow to apply migrations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Triggering Database Migrations Workflow${NC}"
echo ""

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not found${NC}"
    echo ""
    echo "Install GitHub CLI:"
    echo "  macOS: brew install gh"
    echo "  Linux: https://cli.github.com/"
    echo ""
    echo "Then authenticate:"
    echo "  gh auth login"
    echo ""
    echo "Alternative: Trigger via GitHub UI:"
    echo "  1. Go to Actions tab"
    echo "  2. Select 'Apply Database Migrations'"
    echo "  3. Click 'Run workflow'"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not authenticated${NC}"
    echo ""
    echo "Authenticate with:"
    echo "  gh auth login"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

echo -e "${YELLOW}📋 Current branch: $CURRENT_BRANCH${NC}"
echo ""

# Trigger workflow
echo -e "${YELLOW}🔌 Triggering workflow: apply-migrations.yml${NC}"
if gh workflow run apply-migrations.yml --ref "$CURRENT_BRANCH" 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Workflow triggered successfully!${NC}"
    echo ""
    echo "View workflow run:"
    echo "  gh run list --workflow=apply-migrations.yml"
    echo ""
    echo "Watch workflow:"
    echo "  gh run watch --workflow=apply-migrations.yml"
    echo ""
    echo "Or visit: https://github.com/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/actions"
else
    echo -e "${RED}❌ Failed to trigger workflow${NC}"
    exit 1
fi
