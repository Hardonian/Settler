# PHASE 6: Anti-Leak Tripwires + Business Doc Detection

**Date**: 2025-01-28  
**Status**: ✅ Complete

## Overview

Implemented hardened tripwires to prevent accidental leaks of proprietary code, business documents, and secrets to the public mirror.

## Tripwire Categories

### 1. Path-Based Denylist

**Purpose**: Prevent files from specific paths from being exported.

**Denylist Paths**:
```
internal/**
proprietary/**
strategic/**
docs/internal/**
docs/investor/**
docs/business/**
packages/web/**
packages/api/**
packages/adapters/**
packages/edge-ai-core/**
packages/edge-node/**
prisma/**
supabase/**
config/**
scripts/classify.ts
scripts/mirror-*.ts
.github/workflows/publish-mirror.yml
```

**Enforcement**:
- ✅ Classification tool checks paths
- ✅ Mirror verification checks paths
- ✅ CI fails if denylist violation detected

### 2. Filename Pattern Denylist

**Purpose**: Prevent files with sensitive names from being exported.

**Patterns**:
- `*investor*`
- `*pitch*`
- `*strategy*`
- `*financial*`
- `*roadmap*`
- `*moat*`
- `*valuation*`
- `*secret*`
- `*key*`
- `*token*`
- `*credential*`
- `*password*`

**Enforcement**:
- ✅ Classification tool checks filenames
- ✅ Mirror verification checks filenames
- ✅ CI fails if pattern match detected

### 3. Content-Based Detection

**Purpose**: Detect sensitive content even if file is in wrong location.

#### Business Keywords

**Keywords**:
- `investor`
- `pitch`
- `financial`
- `revenue`
- `pricing strategy`
- `go-to-market`
- `confidential`
- `NDA`
- `competitive`
- `moat`
- `valuation`
- `seed round`
- `series [a-z]`
- `due diligence`
- `exit strategy`
- `acquisition`
- `IPO`

**Action**: 
- Classify as INTERNAL_BUSINESS
- Fail CI if detected in OSS_PUBLIC paths
- Fail mirror verification if detected

#### Secret Patterns

**Patterns**:
- `SUPABASE_SERVICE_ROLE_KEY=sk_live_` or `sk_test_` (example pattern)
- `STRIPE_SECRET_KEY=sk_live_` or `sk_test_` (example pattern)
- `BEGIN PRIVATE KEY` (actual key material)
- `BEGIN RSA PRIVATE KEY`
- `BEGIN EC PRIVATE KEY`
- `-----BEGIN[\s\S]{100,}-----END` (private key blocks)
- JWT tokens: `eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`
- Long alphanumeric strings: `[a-zA-Z0-9]{64,}` (potential API keys)

**Action**:
- Classify as SECRET_RISK
- **CI FAILS IMMEDIATELY** if detected
- Never export to mirror

### 4. Import Dependency Checks

**Purpose**: Prevent OSS packages from importing proprietary code.

**Proprietary Import Patterns**:
- `from '@settler/web'`
- `from '@settler/api'`
- `from '../internal/...'`
- `from '../../proprietary/...'`
- `from 'prisma'` (if not in OSS context)
- `from '@prisma/client'`

**Action**:
- Reclassify package as PLATFORM_PROPRIETARY
- Fail CI if violation detected
- Fail mirror verification if violation detected

## Tripwire Implementation

### Classification Tool (`scripts/classify.ts`)

**Checks**:
1. ✅ Path-based denylist
2. ✅ Filename pattern denylist
3. ✅ Content-based keyword detection
4. ✅ Secret pattern detection
5. ✅ Import dependency analysis

**Output**: Classification report with violations

### Mirror Verification (`scripts/mirror-verify.ts`)

**Checks**:
1. ✅ All files in allowlist
2. ✅ No files from denylist
3. ✅ No secret patterns in content
4. ✅ No business keywords in content

**Output**: Verification report with errors

### CI Workflows

**Classification Check** (`.github/workflows/classify.yml`):
- ✅ Runs on every PR
- ✅ Fails on SECRET_RISK detection
- ✅ Fails on violations
- ✅ Uploads reports as artifacts

**Mirror Publish** (`.github/workflows/publish-mirror.yml`):
- ✅ Runs classification before publish
- ✅ Runs mirror verification before publish
- ✅ Fails if any check fails

## Enforcement Levels

### Level 1: Prevention (Pre-Commit)

**Tool**: Classification tool (can be added to pre-commit hook)

**Checks**:
- Path-based rules
- Filename patterns
- Content keywords

**Action**: Warn developer, suggest fixes

### Level 2: CI Gates (Pre-Merge)

**Tool**: GitHub Actions workflows

**Checks**:
- Full classification scan
- Violation detection
- SECRET_RISK detection

**Action**: **BLOCK MERGE** if violations detected

### Level 3: Mirror Verification (Pre-Publish)

**Tool**: Mirror verification tool

**Checks**:
- Allowlist compliance
- Denylist compliance
- Content validation

**Action**: **BLOCK PUBLISH** if violations detected

## Example Violations

### Example 1: Business Doc in Wrong Location

**File**: `docs/public/investor-info.md`
**Content**: Contains "investor", "valuation", "seed round"

**Detection**:
- ✅ Path check: In `docs/public/` (OSS_PUBLIC path)
- ✅ Content check: Contains business keywords
- ✅ Action: Reclassify as INTERNAL_BUSINESS
- ✅ CI fails: "INTERNAL_BUSINESS file in OSS_PUBLIC path"

**Fix**: Move file to `docs/internal/business/`

### Example 2: Secret Leak

**File**: `.env.example`
**Content**: `STRIPE_SECRET_KEY=sk_live_EXAMPLE_PATTERN_DO_NOT_USE_REAL_SECRETS_HERE`

**Detection**:
- ✅ Content check: Contains actual secret pattern
- ✅ Action: Classify as SECRET_RISK
- ✅ CI fails: "SECRET_RISK file detected"

**Fix**: Remove actual secret, use placeholder

### Example 3: OSS Package Importing Proprietary

**File**: `packages/sdk/src/advanced.ts`
**Content**: `import { DatabaseService } from '@settler/api';`

**Detection**:
- ✅ Import check: OSS package imports proprietary
- ✅ Action: Reclassify as PLATFORM_PROPRIETARY
- ✅ CI fails: "OSS_PUBLIC package imports PLATFORM_PROPRIETARY"

**Fix**: Refactor to remove dependency or move to proprietary package

## Ambiguous File Detection

**Purpose**: Identify files that may be misclassified.

**Heuristics**:
- Files in `docs/` (not `docs/public/` or `docs/internal/`)
- Files in `scripts/` (mixed classification)
- Files in `tests/` (may contain proprietary test data)

**Action**: 
- Classification tool flags ambiguous files
- Requires manual review
- Forces relocation to appropriate directory

## Reporting

### Classification Report

**File**: `artifacts/classification-report.json`

**Contains**:
- File classifications
- Violations list
- Ambiguous files list

### Violation Summary

**File**: `artifacts/classification-summary.md`

**Contains**:
- Summary statistics
- Violations by severity
- Recommendations

## Best Practices

### For Developers

1. ✅ **Place business docs in `internal/` or `docs/internal/`**
2. ✅ **Never commit secrets** (use `.env.example` with placeholders)
3. ✅ **Keep OSS packages clean** (no proprietary imports)
4. ✅ **Review classification reports** before merging

### For Maintainers

1. ✅ **Review ambiguous files** flagged by classification tool
2. ✅ **Monitor CI violations** and fix root causes
3. ✅ **Update classification rules** as needed
4. ✅ **Document exceptions** if necessary

## Next Steps

- **PHASE 7**: Backup/rollback playbooks
- **PHASE 8**: Professional repo posture

---

**Implementation Complete**: 2025-01-28  
**Next Phase**: PHASE 7 - Backup, Rollback, DR Playbooks
