# Merge to Main - Fully Automated Guide

**TL;DR**: Just merge! Everything runs automatically. No manual GitHub setup needed. ✅

## What Happens When You Click "Merge" in GitHub

### Before Merge (Automatic Checks)

When you open a PR, these checks run **automatically**:

1. ✅ **CI Pipeline** (`.github/workflows/ci.yml`)
   - Lint and typecheck
   - Unit tests with coverage
   - Build verification
   - Security scan

2. ✅ **Classification Check** (`.github/workflows/classify.yml`)
   - Scans all files
   - Verifies no SECRET_RISK
   - Verifies no violations
   - Comments PR with results

3. ✅ **Smoke Tests** (`.github/workflows/smoke.yml`)
   - Tests critical routes
   - Verifies no 500 errors

4. ✅ **Pre-Merge Safety** (`.github/workflows/auto-merge.yml`)
   - Runs classification check
   - Comments PR with status
   - Shows file counts and violations

### Merge Button Behavior

- ✅ **Disabled** until all checks pass
- ✅ Shows which checks are pending/failed
- ✅ Shows which checks passed
- ✅ **Enabled** only when all required checks pass

### After Merge (Automatic Actions)

1. ✅ **All checks verified** (required before merge)
2. ✅ **Vercel auto-deploys** (if connected)
3. ✅ **Smoke tests run** against production
4. ✅ **Classification verified** (no leaks)

## One-Time Setup (5 Minutes)

### Step 1: Run Setup Script

```bash
pnpm setup:open-core
```

**What it does**:
- ✅ Creates backup tag (`pre-open-core-split`)
- ✅ Creates backup branch (`backup/pre-open-core-split`)
- ✅ Sets up repository variable (kill switch)
- ✅ Verifies all workflows exist
- ✅ Tests classification tool

### Step 2: Push Backup Tag/Branch

```bash
git push origin pre-open-core-split
git push origin backup/pre-open-core-split
```

### Step 3: Configure Branch Protection (After First PR)

**After your first PR**, GitHub will show available checks. Then:

1. Go to: **GitHub → Settings → Branches**
2. Click **"Add rule"** for `main`
3. Enable **"Require status checks to pass before merging"**
4. Select these checks:
   - ✅ `ci / lint-and-typecheck`
   - ✅ `ci / test`
   - ✅ `ci / build`
   - ✅ `classify / classify`
   - ✅ `smoke / smoke`
5. Click **"Save"**

**That's it!** Now every merge is automatically gated.

## What You'll See

### In Pull Request

**Checks Tab**:
```
✅ ci / lint-and-typecheck    Passed
✅ ci / test                  Passed
✅ ci / build                 Passed
✅ classify / classify         Passed
✅ smoke / smoke              Passed
```

**Comments** (Auto-generated):
```
## 🔍 Classification Check Results

- Total Files: 1000
- OSS_PUBLIC: 150 ✅
- PLATFORM_PROPRIETARY: 700
- INTERNAL_BUSINESS: 100
- SECRET_RISK: 0 ✅
- Violations: 0 ✅

✅ No violations detected. Safe to merge!
```

**Merge Button**:
- ❌ Disabled: "Required checks have not passed"
- ✅ Enabled: "All checks have passed"

### After Merge

- ✅ All checks passed
- ✅ Vercel deployed successfully
- ✅ Smoke tests verified production
- ✅ Classification verified (no leaks)

## Test It Now

```bash
# Create test PR
git checkout -b test/auto-checks
git commit --allow-empty -m "test: verify automated checks"
git push origin test/auto-checks

# In GitHub: Create PR
# Watch checks run automatically!
# Merge when all checks pass ✅
```

## No Manual Configuration Needed

✅ **Workflows**: Already configured  
✅ **Checks**: Run automatically  
✅ **Gating**: Enforced by branch protection  
✅ **Comments**: Auto-generated  
✅ **Deployment**: Automatic (Vercel)  

## Troubleshooting

### Checks Not Running?

1. Check workflow files exist: `.github/workflows/*.yml`
2. Verify GitHub Actions enabled: Settings → Actions → General
3. Check workflow syntax (no YAML errors)

### Merge Button Disabled?

1. Wait for all checks to complete
2. Check branch protection rules
3. Verify required checks are enabled

### Classification Fails?

1. Review PR comment for details
2. Check `artifacts/classification-report.json`
3. Fix violations (move files, remove secrets)
4. Push fix and checks re-run automatically

## Summary

**Everything is automated!** Just:

1. ✅ Run `pnpm setup:open-core` once
2. ✅ Push backup tag/branch
3. ✅ Configure branch protection (after first PR)
4. ✅ **Merge!** Everything else happens automatically 🚀

---

**Questions?** See `docs/internal/OPEN_CORE_AUTOMATED_SETUP.md`
