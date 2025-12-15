# OSS Repository - Next Steps & Verification

**Status**: Repository `shardie-github/settler-oss` created ✅  
**Content**: Ready to push (in `/workspace/.mirror-out`)  
**Next**: Push content manually, configure secrets, verify with new agent

---

## Step 1: Push Content to OSS Repo

Since the bot account can't push, you'll need to push manually:

```bash
cd /workspace/.mirror-out

# Set remote (if not already set)
git remote set-url origin https://github.com/shardie-github/settler-oss.git

# Push to main branch
git branch -M main
git push -u origin main

# Create and push release tag
git tag -a v0.1.0 -m "Initial OSS release"
git push origin v0.1.0
```

**Or use GitHub CLI** (if you've re-authenticated):

```bash
cd /workspace/.mirror-out
gh repo sync shardie-github/settler-oss --source . --branch main
```

---

## Step 2: Configure Private Repo Secrets

**Location**: `shardie-github/Settler` → Settings → Secrets and variables → Actions

### Add These Secrets:

1. **`PUBLIC_MIRROR_REPO_URL`**

   ```
   https://github.com/shardie-github/settler-oss.git
   ```

2. **`PUBLIC_MIRROR_GIT_USERNAME`**

   ```
   github-actions[bot]
   ```

   (Or your GitHub username if using a PAT)

3. **`PUBLIC_MIRROR_GIT_TOKEN`**
   - Create at: https://github.com/settings/tokens?type=beta
   - Fine-grained token
   - Repository: `shardie-github/settler-oss`
   - Permissions: `Contents: Read and write`

### Add This Variable:

- **`ENABLE_MIRROR_PUBLISHING`**: `true`

**Guide**: See `docs/internal/OSS_REPO_SECRETS_GUIDE.md`

---

## Step 3: Verify with New Agent

**Use this prompt with a new agent** (associated with `settler-oss` repo):

---

### 📋 Verification Prompt for New Agent

```
You are a QA Auditor + OSS Repository Maintainer working on the Settler open-source repository.

Repository: shardie-github/settler-oss (Public)
Parent Repository: shardie-github/Settler (Private - Vercel source of truth)

Mission:
Verify that the OSS repository is correctly configured and contains ONLY open-source content:
- No proprietary platform code (packages/web, packages/api)
- No internal documentation (docs/internal, strategic/)
- No secrets or credentials
- Only OSS_PUBLIC packages (SDKs, protocol, CLI, examples)
- Proper licensing and documentation

PHASE 1 - Repository Structure Verification
1) Verify repository is public:
   - Check repository settings
   - Confirm visibility is public
   - Verify description and topics are set

2) Check repository structure:
   - packages/sdk/ (Node.js SDK) ✅ Should exist
   - packages/sdk-python/ (Python SDK) ✅ Should exist
   - packages/sdk-go/ (Go SDK) ✅ Should exist
   - packages/sdk-ruby/ (Ruby SDK) ✅ Should exist
   - packages/protocol/ (Protocol types) ✅ Should exist
   - packages/react-settler/ (React components) ✅ Should exist
   - packages/cli/ (CLI tool) ✅ Should exist
   - examples/ (Example code) ✅ Should exist
   - README.md ✅ Should exist
   - LICENSE ✅ Should exist (MIT)

3) Verify forbidden content is NOT present:
   - packages/web/ ❌ Should NOT exist
   - packages/api/ ❌ Should NOT exist
   - packages/adapters/ ❌ Should NOT exist
   - packages/edge-ai-core/ ❌ Should NOT exist
   - packages/edge-node/ ❌ Should NOT exist
   - docs/internal/ ❌ Should NOT exist
   - internal/ ❌ Should NOT exist
   - strategic/ ❌ Should NOT exist
   - prisma/ ❌ Should NOT exist
   - supabase/ ❌ Should NOT exist
   - config/ ❌ Should NOT exist

PHASE 2 - Content Verification
1) Scan for secrets:
   - Search for API keys, tokens, credentials
   - Check for .env files
   - Verify no hardcoded secrets

2) Check for proprietary code:
   - Search for imports from @settler/web
   - Search for imports from @settler/api
   - Verify OSS packages don't import proprietary code

3) Verify documentation:
   - README.md is public-friendly
   - No internal business information
   - No investor/pricing/strategy docs

PHASE 3 - Repository Configuration
1) Check repository settings:
   - Issues enabled ✅
   - Discussions enabled (optional) ✅
   - Topics set correctly ✅
   - License: MIT ✅

2) Verify branch protection:
   - Main branch protected (if applicable)
   - Required reviews (if applicable)

PHASE 4 - Connection to Private Repo
1) Verify mirror publishing workflow exists:
   - Check if private repo has publish-mirror.yml workflow
   - Verify workflow references this OSS repo

2) Test mirror sync (if possible):
   - Verify workflow can push to this repo
   - Check workflow logs for successful syncs

PHASE 5 - Package Verification
1) Check each OSS package:
   - package.json has correct license (MIT)
   - package.json has correct name (@settler/sdk, etc.)
   - No dependencies on proprietary packages
   - README.md present and complete

2) Verify examples:
   - Examples are functional
   - No hardcoded secrets
   - Use environment variables correctly

OUTPUT FORMAT:
1) Executive Summary: PASS / PARTIAL / FAIL
2) Repository Structure Table (what exists, what doesn't)
3) Content Verification Results
4) Security Scan Results
5) Issues Found (if any)
6) Recommendations

Do not rush. Verify thoroughly. The goal is to ensure the OSS repo is clean and safe for public consumption.
```

**Full prompt**: See `docs/internal/OSS_REPO_VERIFICATION_PROMPT.md`

---

## Step 4: Test Workflow

After configuring secrets:

1. Go to: `shardie-github/Settler` → Actions → Publish Mirror
2. Click "Run workflow"
3. Enter tag: `v0.1.0-test`
4. Run workflow
5. Verify it completes successfully
6. Check `shardie-github/settler-oss` for updates

---

## Repository Association Summary

**Private Repo** (`shardie-github/Settler`):

- ✅ Full platform code
- ✅ Vercel deploys from here
- ✅ Workflow: `.github/workflows/publish-mirror.yml`
- ⏳ Secrets need configuration

**OSS Repo** (`shardie-github/settler-oss`):

- ✅ Created and public
- ⏳ Content needs to be pushed
- ✅ Will receive automated syncs

**Connection**:

- Workflow in private repo → Pushes to OSS repo
- Triggered by version tags or manual dispatch
- Classification ensures only OSS_PUBLIC content

---

## Quick Verification Commands

For the new agent to run:

```bash
# Check repo is public
gh repo view shardie-github/settler-oss --json isPrivate

# List packages
gh api repos/shardie-github/settler-oss/contents/packages --jq '.[].name'

# Verify no proprietary packages
gh api repos/shardie-github/settler-oss/contents/packages --jq '.[].name' | grep -E "(web|api)" || echo "✅ No proprietary packages"

# List all files
gh api repos/shardie-github/settler-oss/git/trees/main?recursive=1 --jq '.tree[].path' | head -20
```

---

## Documentation Reference

- **Verification Prompt**: `docs/internal/OSS_REPO_VERIFICATION_PROMPT.md`
- **Private Repo Config**: `docs/internal/PRIVATE_REPO_CONFIGURATION.md`
- **Secrets Guide**: `docs/internal/OSS_REPO_SECRETS_GUIDE.md`
- **Setup Complete**: `OSS_REPO_SETUP_COMPLETE.md`

---

## Checklist

- [x] OSS repository created
- [ ] Content pushed to OSS repo
- [ ] Release tag created
- [ ] Secrets configured in private repo
- [ ] Workflow tested
- [ ] Verified with new agent

---

**Next Action**: Push content manually, then use the verification prompt with a new agent! 🚀
