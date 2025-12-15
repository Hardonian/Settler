#!/bin/bash
# Setup OSS Repository Script
# Creates and configures the public OSS mirror repository

set -e

REPO_NAME="settler-oss"
ORG_NAME="shardie-github"
FULL_REPO_NAME="${ORG_NAME}/${REPO_NAME}"
REPO_URL="https://github.com/${FULL_REPO_NAME}"

echo "🚀 Setting up OSS Repository: ${FULL_REPO_NAME}"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Step 1: Check if repo already exists
echo "1️⃣ Checking if repository exists..."
if gh repo view "${FULL_REPO_NAME}" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Repository ${FULL_REPO_NAME} already exists${NC}"
    read -p "Do you want to continue with setup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "2️⃣ Creating repository..."
    gh repo create "${FULL_REPO_NAME}" \
        --public \
        --description "Settler Open-Source SDKs and Tools - Official SDKs for Node.js, Python, Go, Ruby, React, and CLI" \
        --homepage "https://settler.dev" \
        --license "MIT" \
        --clone false
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Repository created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create repository${NC}"
        exit 1
    fi
fi

# Step 3: Configure repository settings
echo ""
echo "3️⃣ Configuring repository settings..."

# Enable issues
gh api repos/${FULL_REPO_NAME} -X PATCH -f has_issues=true

# Enable discussions (optional)
gh api repos/${FULL_REPO_NAME} -X PATCH -f has_discussions=true

# Set topics
gh api repos/${FULL_REPO_NAME} -X PUT -f names='["settler","reconciliation","financial-api","sdk","typescript","python","go","ruby","react","open-source"]'

echo -e "${GREEN}✅ Repository settings configured${NC}"

# Step 4: Generate mirror export
echo ""
echo "4️⃣ Generating mirror export..."
cd "$(dirname "$0")/.."

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in repository root${NC}"
    exit 1
fi

# Run classification
echo "   Running classification..."
npm run classify:strict || {
    echo -e "${YELLOW}⚠️  Classification found issues, but continuing...${NC}"
}

# Run mirror dry-run
echo "   Running mirror dry-run..."
npm run mirror:dryrun || {
    echo -e "${RED}❌ Mirror dry-run failed${NC}"
    exit 1
}

# Verify mirror export
echo "   Verifying mirror export..."
npm run mirror:verify || {
    echo -e "${RED}❌ Mirror verification failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Mirror export generated${NC}"

# Step 5: Initialize OSS repository
echo ""
echo "5️⃣ Initializing OSS repository..."

MIRROR_DIR=".mirror-out"
TEMP_REPO_DIR="/tmp/${REPO_NAME}-setup"

# Clean up temp directory if it exists
rm -rf "${TEMP_REPO_DIR}"

# Clone the new repo
echo "   Cloning repository..."
gh repo clone "${FULL_REPO_NAME}" "${TEMP_REPO_DIR}"

# Copy mirror export
echo "   Copying mirror export..."
cp -r "${MIRROR_DIR}"/* "${TEMP_REPO_DIR}/"

# Initialize git
cd "${TEMP_REPO_DIR}"
git add .
git commit -m "chore: initial OSS mirror sync

- SDK packages (Node.js, Python, Go, Ruby)
- React components
- CLI tool
- Protocol types
- Examples
- Public documentation

This repository contains only open-source components.
For the full platform, visit https://settler.dev" || {
    echo -e "${YELLOW}⚠️  No changes to commit (repo may already be initialized)${NC}"
}

# Push to main branch
echo "   Pushing to repository..."
git branch -M main
git push -u origin main || {
    echo -e "${YELLOW}⚠️  Push failed (may need to force push or repo already has content)${NC}"
}

echo -e "${GREEN}✅ OSS repository initialized${NC}"

# Step 6: Create initial release
echo ""
echo "6️⃣ Creating initial release..."
read -p "Create initial release tag? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter version tag (e.g., v0.1.0): " VERSION_TAG
    if [ -n "$VERSION_TAG" ]; then
        git tag -a "${VERSION_TAG}" -m "Initial OSS release

This is the first release of Settler's open-source SDKs and tools."
        git push origin "${VERSION_TAG}"
        echo -e "${GREEN}✅ Release ${VERSION_TAG} created${NC}"
    fi
fi

# Step 7: Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ OSS Repository Setup Complete!${NC}"
echo ""
echo "Repository: ${REPO_URL}"
echo ""
echo "Next Steps:"
echo "1. Configure GitHub Secrets in private repo:"
echo "   - PUBLIC_MIRROR_REPO_URL: ${REPO_URL}.git"
echo "   - PUBLIC_MIRROR_GIT_USERNAME: github-actions[bot]"
echo "   - PUBLIC_MIRROR_GIT_TOKEN: <your-token>"
echo ""
echo "2. Set repository variable:"
echo "   - ENABLE_MIRROR_PUBLISHING: true"
echo ""
echo "3. Test mirror publishing workflow:"
echo "   - Go to Actions → Publish Mirror"
echo "   - Run workflow manually with a test tag"
echo ""
echo "4. Verify OSS repo content:"
echo "   - Visit ${REPO_URL}"
echo "   - Check that only OSS_PUBLIC content is present"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
