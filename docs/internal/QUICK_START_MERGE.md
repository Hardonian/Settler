# Quick Start: Merge to Main (Fully Automated)

**TL;DR**: Just merge! Everything runs automatically. ✅

## What Happens When You Merge

1. ✅ **All CI checks run** (lint, typecheck, test, build)
2. ✅ **Classification verified** (no secrets, no violations)
3. ✅ **Smoke tests run** (routes return 200, not 500)
4. ✅ **Vercel auto-deploys** (if connected)
5. ✅ **Everything is gated** (can't merge until checks pass)

## One-Time Setup (5 minutes)

### Step 1: Run Setup Script

```bash
pnpm setup:open-core
```

This creates:
- ✅ Backup tag (`pre-open-core-split`)
- ✅ Backup branch (`backup/pre-open-core-split`)
- ✅ Repository variable (kill switch)
- ✅ Verifies all workflows

### Step 2: Push Backup Tag/Branch

```bash
git push origin pre-open-core-split
git push origin backup/pre-open-core-split
```

### Step 3: Configure Branch Protection (Optional)

**After first PR**, GitHub will show available checks. Then:

1. GitHub → Settings → Branches → Add rule for `main`
2. Enable "Require status checks"
3. Select:
   - `ci / lint-and-typecheck`
   - `ci / test`
   - `ci / build`
   - `classify / classify`
   - `smoke / smoke`
4. Save

**That's it!** Now every merge is automatically gated.

## Test It

```bash
# Create test PR
git checkout -b test/auto-checks
git commit --allow-empty -m "test: verify automated checks"
git push origin test/auto-checks

# Create PR in GitHub
# Watch checks run automatically!
```

## What You'll See

### In Pull Request

- ✅ **Checks Tab**: All checks running/passing
- ✅ **Comments**: Auto-generated classification status
- ✅ **Merge Button**: Disabled until all checks pass

### After Merge

- ✅ All checks passed
- ✅ Vercel deployed
- ✅ Smoke tests verified production

## That's It!

**No manual GitHub configuration needed.** Just merge and everything happens automatically! 🎉

---

**Questions?** See `docs/internal/OPEN_CORE_AUTOMATED_SETUP.md`
