# GitHub Setup Checklist

**TL;DR**: Almost everything is automated! Only 2 optional things to configure.

## ✅ Fully Automated (No Action Needed)

These work automatically when you merge:

- ✅ **All CI Workflows** - Run automatically on PR/merge
- ✅ **Classification Checks** - Run automatically
- ✅ **Smoke Tests** - Run automatically
- ✅ **PR Comments** - Auto-generated
- ✅ **Branch Protection** - Can be set after first PR (optional)

## ⚙️ Optional Setup (Recommended but Not Required)

### 1. Branch Protection Rules (After First PR)

**Why**: Ensures required checks pass before merge

**When**: After your first PR (GitHub will show available checks)

**How**:
1. Go to: **GitHub → Settings → Branches**
2. Click **"Add rule"** for `main`
3. Enable **"Require status checks to pass before merging"**
4. Select these checks:
   - `ci / lint-and-typecheck`
   - `ci / test`
   - `ci / build`
   - `classify / classify`
   - `smoke / smoke`
5. Click **"Save"**

**Note**: This is **optional**. The checks will still run, but merge won't be blocked if you don't set this up.

### 2. Repository Variable: Kill Switch (Optional)

**Why**: Allows you to disable mirror publishing if needed

**When**: Anytime (only needed if you use mirror publishing)

**How**:
1. Go to: **GitHub → Settings → Secrets and variables → Actions**
2. Click **"Variables"** tab
3. Click **"New repository variable"**
4. Name: `ENABLE_MIRROR_PUBLISHING`
5. Value: `true`
6. Click **"Add variable"**

**Note**: This is **optional**. Mirror publishing only runs on version tags anyway.

### 3. Mirror Publishing Secrets (Only If Using Mirror Publishing)

**When**: Only if you want to publish to a public mirror repo

**Secrets Needed**:
- `PUBLIC_MIRROR_REPO_URL` - Public repository URL
- `PUBLIC_MIRROR_GIT_USERNAME` - Git username
- `PUBLIC_MIRROR_GIT_TOKEN` - Git token

**How**:
1. Go to: **GitHub → Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. Add each secret above

**Note**: This is **only needed if you want to use mirror publishing**. Otherwise, skip this.

## 🚀 What Works Without Any Setup

### On Every PR

- ✅ CI checks run automatically
- ✅ Classification check runs automatically
- ✅ Smoke tests run automatically
- ✅ PR comments are auto-generated
- ✅ All checks show in PR

### On Merge to Main

- ✅ All checks verified (if branch protection is set)
- ✅ Vercel auto-deploys (if connected)
- ✅ Smoke tests run against production
- ✅ Classification verified

## 📋 Quick Answer

**Do you need to create anything on GitHub?**

**Short Answer**: **NO** - Everything works automatically!

**Optional** (recommended but not required):
1. **Branch protection** - Set after first PR (takes 2 minutes)
2. **Kill switch variable** - Only if you want to disable mirror publishing (takes 1 minute)

**Only if using mirror publishing**:
3. **Mirror secrets** - Only if you want to publish to public mirror (takes 5 minutes)

## 🎯 Recommended Setup (5 Minutes Total)

### Step 1: Merge Your PR
Just merge! Everything runs automatically.

### Step 2: After First PR (Optional)
Set up branch protection (2 minutes):
- GitHub → Settings → Branches → Add rule for `main`
- Require the 5 checks listed above

### Step 3: Set Kill Switch (Optional)
Set repository variable (1 minute):
- GitHub → Settings → Secrets and variables → Actions → Variables
- Add: `ENABLE_MIRROR_PUBLISHING = true`

**That's it!** Everything else is automatic.

## ✅ Verification

After merging, verify:

1. **Check PR**: All checks should run automatically
2. **Check Actions Tab**: Workflows should appear
3. **Check PR Comments**: Auto-generated classification status

If everything runs automatically, you're good! No manual setup needed.

---

**Bottom Line**: **Just merge!** Everything works automatically. Branch protection is optional but recommended.
