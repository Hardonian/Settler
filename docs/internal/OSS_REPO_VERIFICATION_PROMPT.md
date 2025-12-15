# OSS Repository Verification Prompt for New Agent

**Repository**: `shardie-github/settler-oss` (Public OSS Mirror)  
**Purpose**: Verify OSS repository is correctly set up and contains only open-source content

---

## Agent Prompt

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
1) Verify mirror publishing workflow:
   - Check if private repo has publish-mirror.yml workflow
   - Verify secrets are configured
   - Check workflow can push to this repo

2) Test mirror sync:
   - Make a test change in private repo
   - Verify it syncs correctly (or doesn't if not OSS_PUBLIC)

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

---

## Quick Verification Commands

For the agent to run:

```bash
# 1. Check repository visibility
gh repo view shardie-github/settler-oss --json isPrivate

# 2. List repository contents
gh repo view shardie-github/settler-oss --json name,description,isPrivate,licenseInfo

# 3. Check for forbidden directories
gh api repos/shardie-github/settler-oss/contents/packages --jq '.[].name'

# 4. Verify no proprietary packages
gh api repos/shardie-github/settler-oss/contents/packages --jq '.[].name' | grep -E "(web|api|adapters)"

# 5. Check README
gh api repos/shardie-github/settler-oss/contents/README.md --jq '.content' | base64 -d

# 6. List all files (recursive)
gh api repos/shardie-github/settler-oss/git/trees/main?recursive=1 --jq '.tree[].path'
```

---

## Expected Results

**Should Exist**:
- ✅ packages/sdk/
- ✅ packages/sdk-python/
- ✅ packages/sdk-go/
- ✅ packages/sdk-ruby/
- ✅ packages/protocol/
- ✅ packages/react-settler/
- ✅ packages/cli/
- ✅ examples/
- ✅ README.md
- ✅ LICENSE
- ✅ CONTRIBUTING.md
- ✅ SECURITY.md

**Should NOT Exist**:
- ❌ packages/web/
- ❌ packages/api/
- ❌ packages/adapters/
- ❌ docs/internal/
- ❌ internal/
- ❌ strategic/
- ❌ prisma/
- ❌ supabase/
- ❌ config/

---

**Use this prompt with a new agent to verify the OSS repository setup.**
