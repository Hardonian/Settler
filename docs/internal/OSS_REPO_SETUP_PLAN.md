# OSS Repository Setup Plan - End-to-End Implementation

**Date**: 2025-12-15  
**Status**: Implementation Plan  
**Goal**: Create and configure public OSS mirror repository for Settler

---

## Executive Summary

**Current State**:
- **Private Canonical Repo**: `shardie-github/Settler` (Vercel source of truth)
- **OSS Mirror Repo**: Not yet created (to be `shardie-github/settler-oss`)

**Target State**:
- **Private Canonical Repo**: `shardie-github/Settler` (private, Vercel deploys from here)
- **OSS Mirror Repo**: `shardie-github/settler-oss` (public, contains only OSS_PUBLIC content)

---

## Phase 1: Repository Naming & Structure

### Repository Naming Convention

**Recommended Name**: `settler-oss`

**Rationale**:
- Clear indication it's the OSS version
- Follows common convention (`project-oss`)
- Short and memorable
- GitHub URL: `https://github.com/shardie-github/settler-oss`

**Alternative Names Considered**:
- `settler-public` - Clear but less conventional
- `settler-sdk` - Too narrow (includes more than SDK)
- `settler-open-source` - Too long

### Repository Structure

The OSS repo will contain:
```
settler-oss/
├── packages/
│   ├── sdk/              # Node.js/TypeScript SDK
│   ├── sdk-python/       # Python SDK
│   ├── sdk-go/           # Go SDK
│   ├── sdk-ruby/         # Ruby SDK
│   ├── api-client/       # REST API client
│   ├── protocol/         # Protocol types
│   ├── react-settler/    # React components
│   └── cli/              # CLI tool
├── examples/             # Example code
├── docs/                 # Public documentation (if any)
├── README.md             # Public README (from README.public.md)
├── LICENSE               # MIT License
├── CONTRIBUTING.md       # Contribution guidelines
├── SECURITY.md           # Security policy
└── .gitignore           # Git ignore rules
```

---

## Phase 2: Repository Creation

### Step 1: Create GitHub Repository

**Method 1: GitHub CLI** (Recommended)
```bash
gh repo create shardie-github/settler-oss \
  --public \
  --description "Settler Open-Source SDKs and Tools - Official SDKs for Node.js, Python, Go, Ruby, React, and CLI" \
  --homepage "https://settler.dev" \
  --license "MIT" \
  --clone false
```

**Method 2: GitHub Web UI**
1. Go to https://github.com/new
2. Repository name: `settler-oss`
3. Description: "Settler Open-Source SDKs and Tools"
4. Visibility: **Public** ✅
5. Initialize with: None (we'll push content separately)
6. Click "Create repository"

**Method 3: API** (for automation)
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{
    "name": "settler-oss",
    "description": "Settler Open-Source SDKs and Tools",
    "homepage": "https://settler.dev",
    "private": false,
    "has_issues": true,
    "has_projects": false,
    "has_wiki": false,
    "has_downloads": true,
    "license_template": "mit"
  }'
```

### Step 2: Configure Repository Settings

**Required Settings**:
- ✅ Public visibility
- ✅ Issues enabled (for community)
- ✅ Discussions enabled (optional, for Q&A)
- ✅ Wiki disabled (use docs/ instead)
- ✅ Allow merge commits
- ✅ Allow squash merging
- ✅ Allow rebase merging
- ✅ Auto-delete head branches: Enabled

**Branch Protection** (for `main` branch):
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Restrict pushes to matching branches

**Topics/Tags**:
- `settler`
- `reconciliation`
- `financial-api`
- `sdk`
- `typescript`
- `python`
- `go`
- `ruby`
- `react`
- `open-source`

---

## Phase 3: Secrets Configuration

### Required GitHub Secrets (Private Repo)

Add these secrets to `shardie-github/Settler` repository:

**Location**: Settings → Secrets and variables → Actions → New repository secret

1. **`PUBLIC_MIRROR_REPO_URL`**
   - Value: `https://github.com/shardie-github/settler-oss.git`
   - Purpose: Git remote URL for mirror repository

2. **`PUBLIC_MIRROR_GIT_USERNAME`**
   - Value: `github-actions[bot]` or a dedicated bot account
   - Purpose: Git username for authentication

3. **`PUBLIC_MIRROR_GIT_TOKEN`**
   - Value: Personal Access Token (PAT) or GitHub App token
   - Permissions needed:
     - `repo` (full control)
     - `workflow` (if using GitHub Actions)
   - Purpose: Authentication token for pushing to mirror

### Creating GitHub Token

**Option 1: Personal Access Token (PAT)**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Name: "Settler Mirror Publishing"
4. Expiration: No expiration (or set appropriate date)
5. Scopes: `repo` (full control)
6. Generate token
7. Copy token immediately (won't be shown again)
8. Add as `PUBLIC_MIRROR_GIT_TOKEN` secret

**Option 2: GitHub App** (Recommended for organizations)
1. Create GitHub App with `repo` permissions
2. Install app on both repositories
3. Use app token (more secure, better audit trail)

### Repository Variables

**Location**: Settings → Secrets and variables → Actions → Variables

1. **`ENABLE_MIRROR_PUBLISHING`**
   - Value: `true` (or `false` to disable)
   - Purpose: Kill switch for mirror publishing

---

## Phase 4: Initial OSS Repo Setup

### Step 1: Generate Initial Mirror Export

```bash
cd /workspace
npm run mirror:dryrun
```

### Step 2: Initialize OSS Repository

```bash
# Clone the new OSS repo (or create locally)
cd /tmp
git clone https://github.com/shardie-github/settler-oss.git
cd settler-oss

# Copy mirror export
cp -r /workspace/.mirror-out/* .

# Initial commit
git add .
git commit -m "chore: initial OSS mirror sync

- SDK packages (Node.js, Python, Go, Ruby)
- React components
- CLI tool
- Protocol types
- Examples
- Public documentation"

git branch -M main
git push -u origin main
```

### Step 3: Create Initial Release

```bash
# Tag initial release
git tag -a v0.1.0 -m "Initial OSS release"
git push origin v0.1.0
```

---

## Phase 5: Workflow Configuration

### Verify Workflow Configuration

The `publish-mirror.yml` workflow is already configured. Verify:

1. ✅ Trigger: Version tags (`v*.*.*`)
2. ✅ Manual dispatch available
3. ✅ Kill switch: `ENABLE_MIRROR_PUBLISHING` variable
4. ✅ Classification check runs
5. ✅ Mirror verification runs
6. ✅ Git push to mirror repo

### Test Workflow

**Test 1: Manual Dispatch**
```bash
# In GitHub UI:
# 1. Go to Actions → Publish Mirror
# 2. Click "Run workflow"
# 3. Enter tag: v0.1.0-test
# 4. Run workflow
# 5. Verify it completes successfully
```

**Test 2: Tag-Based Trigger**
```bash
# In private repo:
git tag v0.1.0-test
git push origin v0.1.0-test

# Verify workflow triggers and completes
```

---

## Phase 6: Documentation & Community Setup

### OSS Repository Files

1. **README.md** (from `README.public.md`)
   - ✅ Already exists and is ready

2. **LICENSE**
   - ✅ MIT License (already in mirror export)

3. **CONTRIBUTING.md**
   - ✅ Already exists

4. **SECURITY.md**
   - ✅ Already exists

5. **CODE_OF_CONDUCT.md** (Optional)
   - Create if needed for community

6. **.github/ISSUE_TEMPLATE/** (Recommended)
   - Bug report template
   - Feature request template
   - Question template

7. **.github/PULL_REQUEST_TEMPLATE.md** (Recommended)
   - PR template for contributions

### Community Guidelines

**Issues**:
- ✅ Enable issues in repo settings
- ✅ Set up issue templates
- ✅ Label system: `bug`, `feature`, `question`, `documentation`

**Discussions** (Optional):
- Enable GitHub Discussions for Q&A
- Categories: General, Q&A, Ideas, Show and Tell

---

## Phase 7: Verification & Testing

### Verification Checklist

**Repository Setup**:
- [ ] OSS repo created and public
- [ ] Repository description set
- [ ] Topics/tags added
- [ ] Branch protection configured
- [ ] Initial content pushed

**Secrets Configuration**:
- [ ] `PUBLIC_MIRROR_REPO_URL` set
- [ ] `PUBLIC_MIRROR_GIT_USERNAME` set
- [ ] `PUBLIC_MIRROR_GIT_TOKEN` set (and tested)
- [ ] `ENABLE_MIRROR_PUBLISHING` variable set

**Workflow Testing**:
- [ ] Manual dispatch test successful
- [ ] Tag-based trigger test successful
- [ ] Classification check passes
- [ ] Mirror verification passes
- [ ] Content pushed to OSS repo correctly

**Content Verification**:
- [ ] Only OSS_PUBLIC content in mirror
- [ ] No proprietary code leaked
- [ ] No internal docs leaked
- [ ] No secrets present
- [ ] README.md is correct
- [ ] LICENSE is present
- [ ] Examples work

### End-to-End Test Script

```bash
#!/bin/bash
# test-mirror-publishing.sh

set -e

echo "🧪 Testing Mirror Publishing E2E..."

# 1. Run classification
echo "1️⃣ Running classification..."
npm run classify:strict

# 2. Run mirror dry-run
echo "2️⃣ Running mirror dry-run..."
npm run mirror:dryrun

# 3. Verify mirror export
echo "3️⃣ Verifying mirror export..."
npm run mirror:verify

# 4. Check mirror content
echo "4️⃣ Checking mirror content..."
cd .mirror-out
if [ ! -f "README.md" ]; then
  echo "❌ README.md missing"
  exit 1
fi
if [ ! -f "LICENSE" ]; then
  echo "❌ LICENSE missing"
  exit 1
fi
if [ -d "packages/web" ] || [ -d "packages/api" ]; then
  echo "❌ Proprietary packages found in mirror"
  exit 1
fi
cd ..

# 5. Test git operations (dry-run)
echo "5️⃣ Testing git operations..."
cd .mirror-out
git init
git remote add test-origin https://github.com/shardie-github/settler-oss.git || true
git add .
git commit -m "test: E2E verification" || echo "No changes"
cd ..

echo "✅ E2E test complete!"
```

---

## Phase 8: Monitoring & Maintenance

### Monitoring Setup

**GitHub Actions Status**:
- Monitor workflow runs in private repo
- Set up notifications for failures
- Review logs regularly

**OSS Repo Activity**:
- Monitor issues and PRs
- Review community contributions
- Track downloads and stars

**Security Monitoring**:
- Enable Dependabot alerts
- Review security advisories
- Monitor for secret leaks

### Maintenance Tasks

**Regular Tasks**:
- Weekly: Review and merge mirror updates
- Monthly: Review OSS repo issues/PRs
- Quarterly: Update dependencies
- Annually: Review and update documentation

**Automated Tasks**:
- Mirror publishing (automatic on version tags)
- Dependency updates (Dependabot)
- Security scanning (GitHub Advanced Security)

---

## Phase 9: Rollout Strategy

### Rollout Plan

**Week 1: Setup**
- Day 1-2: Create OSS repo and configure settings
- Day 3-4: Set up secrets and test workflows
- Day 5: Initial content push and verification

**Week 2: Testing**
- Day 1-2: End-to-end testing
- Day 3-4: Fix any issues
- Day 5: Final verification

**Week 3: Launch**
- Day 1: Announce OSS repo (blog post, social media)
- Day 2-5: Monitor and respond to community

### Communication Plan

**Internal**:
- Notify team of OSS repo launch
- Share contribution guidelines
- Set up monitoring alerts

**External**:
- Blog post announcement
- Social media posts
- Update main website
- Update documentation

---

## Phase 10: Success Criteria

### Definition of Done

**Repository**:
- ✅ OSS repo created and public
- ✅ All settings configured correctly
- ✅ Initial content pushed

**Automation**:
- ✅ Workflow tested and working
- ✅ Secrets configured correctly
- ✅ Mirror publishing automated

**Content**:
- ✅ Only OSS_PUBLIC content in mirror
- ✅ No leaks detected
- ✅ Documentation complete

**Community**:
- ✅ README.md clear and helpful
- ✅ Contributing guidelines present
- ✅ Security policy present

---

## Appendix: Commands Reference

### Quick Setup Commands

```bash
# 1. Create repo (using GitHub CLI)
gh repo create shardie-github/settler-oss --public --description "Settler Open-Source SDKs"

# 2. Generate mirror export
npm run mirror:dryrun

# 3. Initialize OSS repo
cd .mirror-out
git init
git remote add origin https://github.com/shardie-github/settler-oss.git
git add .
git commit -m "chore: initial OSS mirror sync"
git branch -M main
git push -u origin main

# 4. Create initial release
git tag -a v0.1.0 -m "Initial OSS release"
git push origin v0.1.0
```

### Verification Commands

```bash
# Test classification
npm run classify:strict

# Test mirror export
npm run mirror:dryrun
npm run mirror:verify

# Check mirror content
cd .mirror-out
find . -type f | head -20
```

---

**Next Steps**: Execute Phase 1-3 to create and configure the OSS repository.
