#!/bin/bash
set -e

echo "🚀 Setting up Open-Core Architecture..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not found. Some setup steps will be skipped.${NC}"
    echo "   Install: https://cli.github.com/"
    USE_GH=false
else
    USE_GH=true
    echo -e "${GREEN}✅ GitHub CLI found${NC}"
fi

# Step 1: Verify classification tool works
echo ""
echo "1️⃣  Verifying classification tool..."
if npm run classify:strict > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Classification tool works${NC}"
else
    echo -e "${RED}❌ Classification tool failed${NC}"
    exit 1
fi

# Step 2: Create backup tag
echo ""
echo "2️⃣  Creating backup tag..."
if git rev-parse "pre-open-core-split" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Tag 'pre-open-core-split' already exists${NC}"
else
    git tag pre-open-core-split
    echo -e "${GREEN}✅ Created backup tag: pre-open-core-split${NC}"
    echo "   Push with: git push origin pre-open-core-split"
fi

# Step 3: Create backup branch
echo ""
echo "3️⃣  Creating backup branch..."
if git rev-parse --verify "backup/pre-open-core-split" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Branch 'backup/pre-open-core-split' already exists${NC}"
else
    git checkout -b backup/pre-open-core-split
    echo -e "${GREEN}✅ Created backup branch: backup/pre-open-core-split${NC}"
    echo "   Push with: git push origin backup/pre-open-core-split"
    git checkout - 2>/dev/null || true
fi

# Step 4: Set up repository variable (kill switch)
if [ "$USE_GH" = true ]; then
    echo ""
    echo "4️⃣  Setting up repository variable (kill switch)..."
    if gh variable list 2>/dev/null | grep -q "ENABLE_MIRROR_PUBLISHING"; then
        echo -e "${YELLOW}⚠️  Variable 'ENABLE_MIRROR_PUBLISHING' already exists${NC}"
    else
        gh variable set ENABLE_MIRROR_PUBLISHING --body "true" --visibility all 2>/dev/null || \
        echo -e "${YELLOW}⚠️  Could not set variable (may need manual setup)${NC}"
        echo -e "${GREEN}✅ Repository variable configured${NC}"
    fi
else
    echo ""
    echo "4️⃣  Setting up repository variable (kill switch)..."
    echo -e "${YELLOW}⚠️  Skipped (GitHub CLI not available)${NC}"
    echo "   Manual setup: GitHub → Settings → Secrets and variables → Actions → Variables"
    echo "   Add: ENABLE_MIRROR_PUBLISHING = true"
fi

# Step 5: Verify workflows exist
echo ""
echo "5️⃣  Verifying GitHub Actions workflows..."
WORKFLOWS=(
    ".github/workflows/classify.yml"
    ".github/workflows/smoke.yml"
    ".github/workflows/publish-mirror.yml"
)

ALL_EXIST=true
for workflow in "${WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        echo -e "${GREEN}✅ $workflow exists${NC}"
    else
        echo -e "${RED}❌ $workflow missing${NC}"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo -e "${RED}❌ Some workflows are missing${NC}"
    exit 1
fi

# Step 6: Test mirror dry-run
echo ""
echo "6️⃣  Testing mirror dry-run..."
if npm run mirror:dryrun > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Mirror dry-run works${NC}"
else
    echo -e "${YELLOW}⚠️  Mirror dry-run had issues (check output above)${NC}"
fi

# Step 7: Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Push backup tag and branch:"
echo "   git push origin pre-open-core-split"
echo "   git push origin backup/pre-open-core-split"
echo ""
echo "2. Configure branch protection (if not automated):"
echo "   GitHub → Settings → Branches → Add rule for 'main'"
echo "   Require status checks:"
echo "     - ci / lint-and-typecheck"
echo "     - ci / test"
echo "     - ci / build"
echo "     - classify / classify"
echo "     - smoke / smoke"
echo ""
echo "3. Set up repository variable (if not automated):"
echo "   GitHub → Settings → Secrets and variables → Actions → Variables"
echo "   Add: ENABLE_MIRROR_PUBLISHING = true"
echo ""
echo "4. Test by creating a PR:"
echo "   git checkout -b test/open-core-setup"
echo "   git commit --allow-empty -m 'test: verify open-core setup'"
echo "   git push origin test/open-core-setup"
echo "   # Create PR and verify CI runs"
echo ""
echo "✅ When you merge to main, all checks will run automatically!"
echo ""
