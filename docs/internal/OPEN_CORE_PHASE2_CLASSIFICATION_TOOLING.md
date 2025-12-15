# PHASE 2: Classification Tooling Implementation

**Date**: 2025-01-28  
**Status**: ✅ Complete

## Overview

Implemented comprehensive classification tooling to scan the repository and classify files into four categories:
- **OSS_PUBLIC**: Safe to publish publicly
- **PLATFORM_PROPRIETARY**: Licensed platform code
- **INTERNAL_BUSINESS**: Business strategy/investor materials
- **SECRET_RISK**: Secrets or sensitive credentials

## Tools Implemented

### 1. Classification Tool (`scripts/classify.ts`)

**Purpose**: Scans the entire repository and classifies every file.

**Usage**:
```bash
pnpm classify              # Full classification with reports
pnpm classify --json        # JSON output only
pnpm classify --strict      # Exit with error on violations
```

**Outputs**:
- `artifacts/classification-report.json` - Machine-readable report
- `artifacts/classification-summary.md` - Human-readable summary

**Features**:
- Path-based classification (primary)
- Content-based classification (secondary)
- Import dependency analysis
- Secret pattern detection
- Business keyword detection
- Violation reporting

### 2. Mirror Verification Tool (`scripts/mirror-verify.ts`)

**Purpose**: Verifies that a mirror export contains ONLY OSS_PUBLIC content.

**Usage**:
```bash
pnpm mirror:verify
pnpm mirror:verify --path=./.mirror-out
```

**Checks**:
- All files must be in OSS_PUBLIC allowlist
- No files from denylist
- No secret patterns in content
- No business keywords in content

### 3. Mirror Dry-Run Tool (`scripts/mirror-dryrun.ts`)

**Purpose**: Exports allowlisted OSS_PUBLIC files to `./.mirror-out/` for verification.

**Usage**:
```bash
pnpm mirror:dryrun
```

**Features**:
- Exports only OSS_PUBLIC files
- Generates `mirror-manifest.json` with file hashes
- Automatically runs verification after export
- Transforms root files (README.public.md -> README.md)

### 4. Mirror Publish Tool (`scripts/mirror-publish.ts`)

**Purpose**: Publishes mirror export to public repository (manual steps for now).

**Usage**:
```bash
pnpm mirror:publish
pnpm mirror:publish --remote=public
```

**Note**: Currently outputs manual steps. Full automation requires GitHub Actions workflow.

## CI Integration

### Classification Check Workflow (`.github/workflows/classify.yml`)

**Triggers**:
- Push to main/develop
- Pull requests to main/develop

**Actions**:
1. Runs `pnpm classify:strict`
2. Uploads classification reports as artifacts
3. Fails if violations detected
4. Fails if SECRET_RISK files detected

### Smoke Tests Workflow (`.github/workflows/smoke.yml`)

**Triggers**:
- Push to main/develop
- Pull requests to main/develop
- Manual workflow dispatch

**Actions**:
1. Builds application
2. Runs smoke tests against deployment/preview
3. Tests critical routes (/, /pricing, /console, /api/health/console)

## Classification Rules

### Path-Based Rules (Primary)

**OSS_PUBLIC Paths**:
- `packages/sdk/**`
- `packages/sdk-python/**`
- `packages/sdk-go/**`
- `packages/sdk-ruby/**`
- `packages/api-client/**`
- `packages/protocol/**`
- `packages/react-settler/**`
- `packages/cli/**`
- `docs/public/**`
- `examples/**`

**PLATFORM_PROPRIETARY Paths**:
- `packages/web/**`
- `packages/api/**`
- `packages/adapters/**`
- `packages/edge-ai-core/**`
- `packages/edge-node/**`
- `prisma/**`
- `supabase/**`
- `config/**`
- `apps/**`
- `vercel.json`
- `turbo.json`

**INTERNAL_BUSINESS Paths**:
- `internal/**`
- `strategic/**`
- `docs/internal/**`
- `docs/investor/**`
- `docs/business/**`

**SECRET_RISK Paths**:
- `**/.env`
- `**/.env.local`
- `**/.env.*.local`
- `**/*secret*`
- `**/*key*`
- `**/*token*`
- `**/*credential*`
- `**/*password*`
- `**/secrets/**`
- `**/.secrets/**`

### Content-Based Rules (Secondary)

**INTERNAL_BUSINESS Keywords**:
- investor, pitch, financial, revenue, pricing strategy
- go-to-market, confidential, NDA, competitive, moat
- valuation, seed round, series [a-z], due diligence
- exit strategy, acquisition, IPO

**SECRET Patterns**:
- `SUPABASE_SERVICE_ROLE_KEY=sk_live_` or `sk_test_`
- `STRIPE_SECRET_KEY=sk_live_` or `sk_test_`
- `BEGIN PRIVATE KEY` (actual key material)
- JWT tokens: `eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`
- Long alphanumeric strings (potential API keys)

**PROPRIETARY License Markers**:
- `"private": true` in package.json
- `"license": "UNLICENSED"`
- Enterprise only, Commercial feature, License required
- Pro feature, Premium feature

### Dependency-Based Rules (Tertiary)

**OSS_PUBLIC packages must NOT import**:
- `@settler/web`
- `@settler/api`
- `internal/`
- `proprietary/`
- `prisma`
- `@prisma/client`

**Violation Handling**:
- If OSS_PUBLIC package imports proprietary/internal:
  - Reclassify package as PLATFORM_PROPRIETARY
  - OR refactor to remove dependency
  - CI fails on violation

## Invariants Enforced

1. ✅ **OSS_PUBLIC must NOT contain SECRET_RISK patterns**
   - CI fails immediately if detected

2. ✅ **OSS_PUBLIC packages must NOT import proprietary/internal**
   - CI fails if violation detected

3. ✅ **INTERNAL_BUSINESS must NEVER be exported to mirror**
   - Mirror verification fails if detected

4. ✅ **PLATFORM_PROPRIETARY must NEVER be exported to mirror**
   - Mirror verification fails if detected

5. ✅ **SECRET_RISK must NEVER be committed**
   - CI fails immediately if detected

6. ✅ **Public mirror must contain ONLY OSS_PUBLIC content**
   - Mirror export verifies every file is OSS_PUBLIC

## Example Output

### Classification Report (JSON)
```json
{
  "version": "1.0.0",
  "timestamp": "2025-01-28T12:00:00Z",
  "summary": {
    "total": 1000,
    "oss_public": 150,
    "platform_proprietary": 700,
    "internal_business": 100,
    "secret_risk": 0,
    "unclassified": 50
  },
  "files": [...],
  "violations": []
}
```

### Classification Summary (Markdown)
- Summary statistics
- Violations list
- Files by classification
- Recommendations

## Testing

To test the classification tooling:

```bash
# Run classification
pnpm classify

# Check reports
cat artifacts/classification-report.json
cat artifacts/classification-summary.md

# Run mirror dry-run
pnpm mirror:dryrun

# Verify mirror export
pnpm mirror:verify
```

## Next Steps

- **PHASE 3**: Refactor repository structure
- **PHASE 4**: Add CI gates to required checks
- **PHASE 5**: Implement mirror publish pipeline

---

**Implementation Complete**: 2025-01-28  
**Next Phase**: PHASE 3 - Safe Refactor into Open-Core Structure
