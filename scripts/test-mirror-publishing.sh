#!/bin/bash
# Test Mirror Publishing End-to-End
# Verifies all aspects of mirror publishing workflow

set -e

echo "🧪 Testing Mirror Publishing E2E"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Function to check command
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# 1. Check we're in the right directory
echo "1️⃣ Checking repository root..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in repository root${NC}"
    exit 1
fi
check "Repository root found"

# 2. Run classification
echo ""
echo "2️⃣ Running classification..."
npm run classify:strict > /dev/null 2>&1
check "Classification passed"

# 3. Run mirror dry-run
echo ""
echo "3️⃣ Running mirror dry-run..."
npm run mirror:dryrun > /dev/null 2>&1
check "Mirror dry-run completed"

# 4. Verify mirror export
echo ""
echo "4️⃣ Verifying mirror export..."
npm run mirror:verify > /dev/null 2>&1
check "Mirror verification passed"

# 5. Check mirror content
echo ""
echo "5️⃣ Checking mirror content..."
cd .mirror-out

# Check required files
if [ ! -f "README.md" ]; then
    echo -e "${RED}❌ README.md missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ README.md present${NC}"
fi

if [ ! -f "LICENSE" ]; then
    echo -e "${RED}❌ LICENSE missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ LICENSE present${NC}"
fi

# Check for forbidden content
if [ -d "packages/web" ] || [ -d "packages/api" ]; then
    echo -e "${RED}❌ Proprietary packages found in mirror${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No proprietary packages in mirror${NC}"
fi

if [ -d "docs/internal" ] || [ -d "internal" ] || [ -d "strategic" ]; then
    echo -e "${RED}❌ Internal docs found in mirror${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No internal docs in mirror${NC}"
fi

# Check for OSS packages
if [ ! -d "packages/sdk" ]; then
    echo -e "${RED}❌ OSS SDK package missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ OSS SDK package present${NC}"
fi

if [ ! -d "examples" ]; then
    echo -e "${YELLOW}⚠️  Examples directory missing (optional)${NC}"
else
    echo -e "${GREEN}✅ Examples directory present${NC}"
fi

cd ..

# 6. Check manifest
echo ""
echo "6️⃣ Checking mirror manifest..."
if [ ! -f ".mirror-out/mirror-manifest.json" ]; then
    echo -e "${RED}❌ Mirror manifest missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    MANIFEST_FILES=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('.mirror-out/mirror-manifest.json')); console.log(d.files.length);")
    echo -e "${GREEN}✅ Mirror manifest present (${MANIFEST_FILES} files)${NC}"
fi

# 7. Test git operations (dry-run)
echo ""
echo "7️⃣ Testing git operations..."
cd .mirror-out
git init > /dev/null 2>&1
git remote add test-origin https://github.com/shardie-github/settler-oss.git > /dev/null 2>&1 || true
git add . > /dev/null 2>&1
git commit -m "test: E2E verification" > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  No changes to commit${NC}"
cd ..
check "Git operations successful"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Mirror publishing is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure GitHub secrets (see docs/internal/OSS_REPO_SECRETS_GUIDE.md)"
    echo "2. Create OSS repository (run scripts/setup-oss-repo.sh)"
    echo "3. Test workflow in GitHub Actions"
    exit 0
else
    echo -e "${RED}❌ Found ${ERRORS} error(s). Please fix before proceeding.${NC}"
    exit 1
fi
