# PHASE 7: Backup, Rollback, DR Playbooks

**Date**: 2025-01-28  
**Status**: ✅ Complete

## Overview

Comprehensive disaster recovery (DR) playbooks for backup, rollback, and recovery scenarios in the open-core architecture.

## Pre-Refactor Backup

### 1. Create Backup Tag

**Before starting refactor**:
```bash
git tag pre-open-core-split
git push origin pre-open-core-split
```

**Purpose**: Create a known-good point to rollback to.

### 2. Create Backup Branch

**Before starting refactor**:
```bash
git checkout -b backup/pre-open-core-split
git push origin backup/pre-open-core-split
```

**Purpose**: Preserve current state in a branch.

### 3. Document Current State

**Create**: `docs/internal/BACKUP_PRE_OPEN_CORE_STATE.md`

**Contents**:
- Git commit hash
- Vercel deployment URL
- Environment variables list
- Database schema version
- Current package versions

## Repository Migration (If Currently Public)

### Scenario: Current Repo is Public

**Risk**: Proprietary code already exposed in public repo history.

**Action Plan**:

1. **Create NEW private canonical repository**:
   ```bash
   # On GitHub: Create new private repo "settler-private"
   git remote add private <new-private-repo-url>
   git push private main
   ```

2. **Migrate Vercel connection**:
   - Go to Vercel dashboard
   - Update project settings
   - Change connected repository to private repo
   - Verify environment variables are copied

3. **Update CI/CD**:
   - Update GitHub Actions secrets
   - Update webhook URLs
   - Verify deployments work

4. **Handle current public repo**:
   - Option A: Archive current repo (read-only)
   - Option B: Delete current repo
   - Option C: Convert to public mirror (if clean)

## Vercel Rollback Procedures

### Rollback to Previous Deployment

**Method 1: Vercel Dashboard**
1. Go to Vercel project → Deployments
2. Find previous deployment
3. Click "..." → "Promote to Production"

**Method 2: Git Tag Rollback**
```bash
# Create rollback tag
git tag rollback-$(date +%Y%m%d-%H%M%S)
git push origin rollback-$(date +%Y%m%d-%H%M%S)

# In Vercel: Redeploy from tag
```

**Method 3: Revert Commit**
```bash
# Revert last commit
git revert HEAD
git push origin main

# Vercel will auto-deploy
```

### Rollback to Specific Tag

```bash
# Checkout tag
git checkout pre-open-core-split

# Create rollback branch
git checkout -b rollback/pre-open-core-split

# Push and deploy
git push origin rollback/pre-open-core-split
```

**Vercel**: Configure to deploy from `rollback/pre-open-core-split` branch.

## Mirror Rollback Procedures

### Rollback Public Mirror

**Scenario**: Wrong content published to public mirror.

**Method 1: Revert Commit**
```bash
cd .mirror-out
git log --oneline
git revert <commit-hash>
git push public main
```

**Method 2: Delete Tag**
```bash
cd .mirror-out
git tag -d v1.0.0
git push public :refs/tags/v1.0.0
```

**Method 3: Force Push Previous State**
```bash
cd .mirror-out
git reset --hard <previous-commit-hash>
git push public main --force
```

**⚠️ Warning**: Force push rewrites history. Use with caution.

### Rollback to Previous Tag

```bash
cd .mirror-out
git checkout v0.9.0
git checkout -b rollback/v0.9.0
git push public rollback/v0.9.0
```

## Database Rollback

### Prisma Migrations

**Rollback last migration**:
```bash
# Check migration status
pnpm prisma:migrate status

# Rollback (if supported by migration tool)
# Note: Prisma doesn't support automatic rollback
# Must create new migration to reverse changes
```

**Manual Rollback**:
1. Identify migration to rollback
2. Create reverse migration
3. Apply reverse migration

### Supabase Migrations

**Rollback**:
```bash
# List migrations
supabase migration list

# Rollback to specific migration
supabase migration repair <migration-name> --status reverted
```

## Kill Switch: Disable Mirror Publishing

### Repository Variable

**Variable**: `ENABLE_MIRROR_PUBLISHING`

**Set to `false`**:
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add repository variable: `ENABLE_MIRROR_PUBLISHING = false`
3. Mirror publishing workflow will skip

**Verify**:
- Check workflow logs: Should show "Skipped: ENABLE_MIRROR_PUBLISHING is false"

### Workflow-Level Kill Switch

**File**: `.github/workflows/publish-mirror.yml`

**Add condition**:
```yaml
if: ${{ vars.ENABLE_MIRROR_PUBLISHING != 'false' }}
```

**Status**: ✅ Already implemented

## Emergency Procedures

### Scenario 1: Secret Leaked to Public Mirror

**Immediate Actions**:
1. ✅ **Rotate all secrets** (API keys, tokens, credentials)
2. ✅ **Delete leaked commit** from public mirror
3. ✅ **Review git history** for other leaks
4. ✅ **Notify affected parties** (if customer data exposed)
5. ✅ **Enable kill switch** to prevent further publishes

**Commands**:
```bash
# Delete commit from public mirror
cd .mirror-out
git reset --hard <commit-before-leak>
git push public main --force

# Rotate secrets in Vercel
# Update all environment variables
```

### Scenario 2: Wrong Code Published to Public Mirror

**Immediate Actions**:
1. ✅ **Enable kill switch**
2. ✅ **Revert public mirror** to previous state
3. ✅ **Review classification rules**
4. ✅ **Fix source code** in private repo
5. ✅ **Re-run classification** to verify fix

**Commands**:
```bash
# Revert public mirror
cd .mirror-out
git revert HEAD
git push public main

# Or force push previous state
git reset --hard <previous-commit>
git push public main --force
```

### Scenario 3: Vercel Build Fails After Refactor

**Immediate Actions**:
1. ✅ **Rollback Vercel deployment** to previous version
2. ✅ **Revert git changes** in private repo
3. ✅ **Investigate build errors**
4. ✅ **Fix issues** in feature branch
5. ✅ **Re-deploy** after fixes

**Commands**:
```bash
# Revert git changes
git revert HEAD
git push origin main

# Or checkout previous tag
git checkout pre-open-core-split
git checkout -b hotfix/rollback
git push origin hotfix/rollback
```

## Recovery Checklist

### Post-Incident Recovery

- [ ] **Identify root cause**
- [ ] **Document incident** in `docs/internal/incidents/`
- [ ] **Fix root cause** in private repo
- [ ] **Verify fixes** with classification tool
- [ ] **Test deployments** (staging first)
- [ ] **Deploy to production**
- [ ] **Monitor** for 24-48 hours
- [ ] **Update playbooks** based on lessons learned

## Backup Strategy

### Git Backups

**Automatic**: GitHub provides git repository backups

**Manual**: 
```bash
# Create backup archive
git bundle create backup-$(date +%Y%m%d).bundle --all
```

### Database Backups

**Supabase**: Automatic daily backups (if enabled)

**Manual**:
```bash
# Export database
supabase db dump -f backup-$(date +%Y%m%d).sql
```

### Environment Variables Backup

**Export**:
```bash
# Export Vercel env vars (via Vercel CLI)
vercel env pull .env.backup
```

**Store**: Encrypted backup in secure location

## DR Testing

### Quarterly DR Drill

**Steps**:
1. Create test branch
2. Simulate failure scenario
3. Execute rollback procedures
4. Verify recovery
5. Document results

**Frequency**: Quarterly

## Documentation

### Incident Reports

**Location**: `docs/internal/incidents/`

**Format**: `YYYY-MM-DD-incident-name.md`

**Contents**:
- Incident description
- Root cause
- Resolution steps
- Prevention measures
- Lessons learned

## Next Steps

- **PHASE 8**: Professional repo posture
- **PHASE 9**: End-to-end verification

---

**Implementation Complete**: 2025-01-28  
**Next Phase**: PHASE 8 - Professional Repo Posture
