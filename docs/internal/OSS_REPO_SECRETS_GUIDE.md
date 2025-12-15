# OSS Repository Secrets Configuration Guide

**Purpose**: Configure GitHub secrets for automated mirror publishing

---

## Required Secrets

Add these secrets to the **private canonical repository** (`shardie-github/Settler`):

**Location**: Settings → Secrets and variables → Actions → New repository secret

### 1. PUBLIC_MIRROR_REPO_URL

**Value**: `https://github.com/shardie-github/settler-oss.git`

**Purpose**: Git remote URL for the public OSS mirror repository

**How to set**:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `PUBLIC_MIRROR_REPO_URL`
4. Value: `https://github.com/shardie-github/settler-oss.git`
5. Click "Add secret"

---

### 2. PUBLIC_MIRROR_GIT_USERNAME

**Value**: `github-actions[bot]` (or a dedicated bot account username)

**Purpose**: Git username for authentication when pushing to mirror

**How to set**:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `PUBLIC_MIRROR_GIT_USERNAME`
4. Value: `github-actions[bot]`
5. Click "Add secret"

**Note**: If using a dedicated bot account, use that account's username instead.

---

### 3. PUBLIC_MIRROR_GIT_TOKEN

**Value**: Personal Access Token (PAT) or GitHub App token

**Purpose**: Authentication token for pushing to the mirror repository

**Required Permissions**:
- `repo` (full control) - Required to push to repository

**How to create PAT**:

**Option A: Personal Access Token (Classic)**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Note: "Settler Mirror Publishing"
4. Expiration: Choose appropriate (or "No expiration" for long-term)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Copy the token immediately** (won't be shown again)
8. Add as secret `PUBLIC_MIRROR_GIT_TOKEN`

**Option B: Fine-Grained Personal Access Token** (Recommended)
1. Go to https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Token name: "Settler Mirror Publishing"
4. Expiration: Choose appropriate
5. Repository access: "Only select repositories"
   - Select: `shardie-github/settler-oss`
6. Permissions:
   - Repository permissions:
     - Contents: Read and write
     - Metadata: Read-only
     - Pull requests: Read-only (optional)
7. Click "Generate token"
8. Copy the token and add as secret

**Option C: GitHub App** (Best for organizations)
1. Go to organization Settings → Developer settings → GitHub Apps
2. Create new GitHub App
3. Name: "Settler Mirror Publisher"
4. Permissions:
   - Repository permissions:
     - Contents: Read and write
     - Metadata: Read-only
5. Install app on both repositories
6. Generate app token in workflow (more secure)

**How to set**:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `PUBLIC_MIRROR_GIT_TOKEN`
4. Value: `<paste-token-here>`
5. Click "Add secret"

---

## Repository Variables

### ENABLE_MIRROR_PUBLISHING

**Location**: Settings → Secrets and variables → Actions → Variables → New repository variable

**Value**: `true` (or `false` to disable)

**Purpose**: Kill switch for mirror publishing workflow

**How to set**:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "Variables" tab
3. Click "New repository variable"
4. Name: `ENABLE_MIRROR_PUBLISHING`
5. Value: `true`
6. Click "Add variable"

**Usage**: The workflow checks this variable before running:
```yaml
if: ${{ vars.ENABLE_MIRROR_PUBLISHING != 'false' }}
```

To disable mirror publishing temporarily, set value to `false`.

---

## Verification

### Test Secrets Configuration

**Method 1: Manual Workflow Test**
1. Go to Actions → Publish Mirror
2. Click "Run workflow"
3. Enter a test tag (e.g., `v0.1.0-test`)
4. Click "Run workflow"
5. Check workflow logs for authentication errors

**Method 2: Command Line Test**
```bash
# Test git authentication
git clone https://github.com/shardie-github/settler-oss.git /tmp/test-clone
cd /tmp/test-clone
echo "# Test" > test.md
git add test.md
git commit -m "test"
git push origin main
# If this works, authentication is configured correctly
```

**Method 3: API Test**
```bash
# Test token permissions
curl -H "Authorization: token $YOUR_TOKEN" \
     https://api.github.com/repos/shardie-github/settler-oss

# Should return repository info if token has correct permissions
```

---

## Troubleshooting

### Issue: Authentication Failed

**Error**: `remote: Invalid username or password`

**Solutions**:
1. Verify token has `repo` permissions
2. Check token hasn't expired
3. Ensure username matches token owner
4. For fine-grained tokens, verify repository access is granted

### Issue: Permission Denied

**Error**: `Permission denied (publickey)`

**Solutions**:
1. Use HTTPS URL (not SSH) for `PUBLIC_MIRROR_REPO_URL`
2. Verify token has write permissions
3. Check repository access settings

### Issue: Workflow Not Running

**Error**: Workflow doesn't trigger

**Solutions**:
1. Check `ENABLE_MIRROR_PUBLISHING` variable is set to `true`
2. Verify workflow file syntax
3. Check branch protection rules
4. Ensure secrets are set correctly

---

## Security Best Practices

1. **Use Fine-Grained Tokens**: More secure than classic PATs
2. **Set Expiration**: Don't use "No expiration" unless necessary
3. **Rotate Tokens**: Regularly rotate tokens (every 90 days)
4. **Limit Scope**: Only grant necessary permissions
5. **Monitor Usage**: Review token usage in GitHub audit log
6. **Use GitHub Apps**: For organizations, prefer GitHub Apps over PATs

---

## Quick Reference

| Secret Name | Value Example | Purpose |
|------------|--------------|---------|
| `PUBLIC_MIRROR_REPO_URL` | `https://github.com/shardie-github/settler-oss.git` | Mirror repo URL |
| `PUBLIC_MIRROR_GIT_USERNAME` | `github-actions[bot]` | Git username |
| `PUBLIC_MIRROR_GIT_TOKEN` | `ghp_xxxxxxxxxxxx` | Auth token |

| Variable Name | Value | Purpose |
|--------------|-------|---------|
| `ENABLE_MIRROR_PUBLISHING` | `true` | Kill switch |

---

**Next Steps**: After configuring secrets, test the mirror publishing workflow.
