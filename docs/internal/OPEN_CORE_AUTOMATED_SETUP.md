# Automated Open-Core Setup Guide

**Date**: 2025-01-28  
**Status**: ✅ Complete - Fully Automated

## Overview

The open-core architecture is now **fully automated**. When you merge to main in GitHub, all checks run automatically. No manual GitHub configuration needed!

## What Happens Automatically

### On Pull Request

1. ✅ **Classification Check** (`.github/workflows/classify.yml`)
   - Runs automatically on PR open/update
   - Scans all files and classifies them
   - Fails if SECRET_RISK detected
   - Fails if violations detected
   - Comments PR with results

2. ✅ **CI Checks** (`.github/workflows/ci.yml`)
   - Lint and typecheck
   - Tests with coverage
   - Build verification
   - Security scan

3. ✅ **Smoke Tests** (`.github/workflows/smoke.yml`)
   - Tests critical routes
   - Verifies no 500 errors
   - Runs on PR (if preview URL available)

4. ✅ **Pre-Merge Safety** (`.github/workflows/auto-merge.yml`)
   - Runs classification check
   - Comments PR with status
   - Blocks merge if violations

### On Merge to Main

1. ✅ **All CI checks run** (required before merge)
2. ✅ **Classification verified** (required before merge)
3. ✅ **Smoke tests run** (required before merge)
4. ✅ **Build succeeds** (required before merge)
5. ✅ **Vercel auto-deploys** (if connected)

### On Version Tag

1. ✅ **Mirror Publishing** (`.github/workflows/publish-mirror.yml`)
   - Runs classification check
   - Exports OSS_PUBLIC files
   - Verifies mirror export
   - Publishes to public mirror (if enabled)

## One-Time Setup (Automated Script)

Run this **once** to set up everything:

```bash
pnpm setup:open-core
```

**What it does**:
- ✅ Verifies classification tool works
- ✅ Creates backup tag (`pre-open-core-split`)
- ✅ Creates backup branch (`backup/pre-open-core-split`)
- ✅ Sets up repository variable (kill switch)
- ✅ Verifies all workflows exist
- ✅ Tests mirror dry-run

**Then push**:
```bash
git push origin pre-open-core-split
git push origin backup/pre-open-core-split
```

## Branch Protection (Optional - Can Be Automated)

Branch protection ensures required checks pass before merge. You can:

### Option 1: Automated (via GitHub CLI)

```bash
# Requires GitHub CLI and admin token
gh workflow run setup-branch-protection.yml \
  -f branch=main \
  -f github_token=$GITHUB_TOKEN
```

### Option 2: Manual (One-Time Setup)

1. Go to: GitHub → Settings → Branches
2. Click "Add rule" for `main`
3. Enable "Require status checks to pass before merging"
4. Add required checks:
   - `ci / lint-and-typecheck`
   - `ci / test`
   - `ci / build`
   - `classify / classify`
   - `smoke / smoke`
5. Save

**Note**: After first PR, GitHub will show available checks. You can then require them.

## Repository Variable (Kill Switch)

**Variable**: `ENABLE_MIRROR_PUBLISHING`

**Default**: `true` (mirror publishing enabled)

**To disable**: Set to `false` in GitHub → Settings → Secrets and variables → Actions → Variables

**Setup**: The `setup-open-core.sh` script sets this automatically if GitHub CLI is available.

## Workflow Status

All workflows are configured to run automatically:

| Workflow | Trigger | Required for Merge |
|----------|---------|-------------------|
| `ci.yml` | Push/PR | ✅ Yes |
| `classify.yml` | Push/PR | ✅ Yes |
| `smoke.yml` | Push/PR | ✅ Yes (main) |
| `auto-merge.yml` | PR | ⚠️ Info only |
| `publish-mirror.yml` | Tag | ❌ No |

## What You See in GitHub

### Pull Request View

1. **Checks Tab**: Shows all running checks
   - ✅ ci / lint-and-typecheck
   - ✅ ci / test
   - ✅ ci / build
   - ✅ classify / classify
   - ✅ smoke / smoke

2. **Comments**: Auto-generated classification status
   - Shows file counts
   - Shows violations (if any)
   - Indicates if safe to merge

3. **Merge Button**: 
   - Disabled until all checks pass
   - Shows which checks are pending/failed

### After Merge

1. ✅ All checks passed
2. ✅ Vercel auto-deploys (if connected)
3. ✅ Smoke tests run against production
4. ✅ Classification verified

## Verification Commands

### Before First Merge

```bash
# Run setup script
pnpm setup:open-core

# Push backup tag and branch
git push origin pre-open-core-split
git push origin backup/pre-open-core-split

# Verify everything works
pnpm classify:strict
pnpm build
pnpm test
```

### Test PR Flow

```bash
# Create test branch
git checkout -b test/open-core-verification

# Make a small change
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: verify open-core setup"

# Push and create PR
git push origin test/open-core-verification

# In GitHub: Create PR and verify checks run automatically
```

## Troubleshooting

### Checks Not Running

**Issue**: Workflows not triggering

**Fix**:
1. Check workflow files exist in `.github/workflows/`
2. Verify workflow syntax (no YAML errors)
3. Check GitHub Actions is enabled: Settings → Actions → General

### Classification Fails

**Issue**: Classification check fails

**Fix**:
1. Review `artifacts/classification-report.json`
2. Fix violations (move files, remove secrets, fix imports)
3. Re-run: `pnpm classify:strict`

### Merge Button Disabled

**Issue**: Can't merge even though checks pass

**Fix**:
1. Check branch protection rules
2. Verify required checks are enabled
3. Wait for all checks to complete (green checkmarks)

## Summary

✅ **Fully Automated**: All checks run automatically on PR/merge  
✅ **No Manual Setup**: Run `pnpm setup:open-core` once  
✅ **Self-Enforcing**: Branch protection ensures checks pass  
✅ **Transparent**: PR comments show classification status  
✅ **Safe**: Multiple layers of protection prevent leaks  

**When you merge to main, everything happens automatically!** 🚀

---

**Last Updated**: 2025-01-28
