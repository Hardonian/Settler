# Private Repo Configuration - Linking to OSS Mirror

**Status**: OSS repo created - Configure private repo connection

---

## Step 1: Configure GitHub Secrets

**Location**: `shardie-github/Settler` → Settings → Secrets and variables → Actions

### Required Secrets

1. **`PUBLIC_MIRROR_REPO_URL`**
   - Value: `https://github.com/shardie-github/settler-oss.git`
   - Purpose: Git remote URL for mirror repository

2. **`PUBLIC_MIRROR_GIT_USERNAME`**
   - Value: `github-actions[bot]` (or your GitHub username)
   - Purpose: Git username for authentication

3. **`PUBLIC_MIRROR_GIT_TOKEN`**
   - Value: Personal Access Token with `repo` permissions
   - **How to create**:
     1. Go to: https://github.com/settings/tokens?type=beta
     2. Generate new token (fine-grained)
     3. Repository access: Select `shardie-github/settler-oss`
     4. Permissions: `Contents: Read and write`
     5. Generate and copy token
   - Purpose: Authentication token for pushing to mirror

### Required Variable

**Location**: `shardie-github/Settler` → Settings → Secrets and variables → Actions → Variables

- **`ENABLE_MIRROR_PUBLISHING`**
  - Value: `true`
  - Purpose: Kill switch for mirror publishing workflow

---

## Step 2: Verify Repository Connection

### Test Manual Workflow Dispatch

1. Go to: `shardie-github/Settler` → Actions → Publish Mirror
2. Click "Run workflow"
3. Enter tag: `v0.1.0-test`
4. Click "Run workflow"
5. Verify it completes successfully

### Expected Workflow Steps

1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Run classification (`classify:strict`)
4. ✅ Run mirror dry-run
5. ✅ Verify mirror export
6. ✅ Initialize git in `.mirror-out`
7. ✅ Push to OSS repo (`shardie-github/settler-oss`)

---

## Step 3: Repository Association

The repositories are now linked via:

1. **Workflow Configuration**: `.github/workflows/publish-mirror.yml`
   - References: `PUBLIC_MIRROR_REPO_URL` secret
   - Pushes to: `shardie-github/settler-oss`

2. **Automated Sync**: 
   - Triggered on version tags (`v*.*.*`)
   - Or manual dispatch
   - Automatically syncs OSS_PUBLIC content

3. **Documentation**:
   - Private repo: Contains full platform + internal docs
   - OSS repo: Contains only OSS_PUBLIC content
   - Both repos reference each other in READMEs

---

## Verification Checklist

- [ ] OSS repo created: `shardie-github/settler-oss`
- [ ] Initial content pushed to OSS repo
- [ ] Secrets configured in private repo
- [ ] Variable `ENABLE_MIRROR_PUBLISHING` set to `true`
- [ ] Workflow test successful
- [ ] Content verified in OSS repo (no proprietary code)

---

## Next Steps

1. **Configure secrets** (see above)
2. **Test workflow** (manual dispatch)
3. **Verify OSS repo** (check content)
4. **Set up monitoring** (watch workflow runs)

---

**Status**: Ready to configure secrets and test workflow.
