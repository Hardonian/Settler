# GitHub CLI Permissions Guide - Organization Access

**Issue**: Bot account cannot create repositories in `shardie-github` organization  
**Solution**: Grant organization-level permissions to GitHub CLI

---

## Current Status

The GitHub CLI is authenticated as a bot account (`cursor[bot]`) which has limited permissions. To create repositories in an organization, you need:

1. **Organization-level access** (not just user-level)
2. **Repository creation permissions** in the organization
3. **Proper authentication method** (PAT with org scope or GitHub App)

---

## Solution Options

### Option 1: Re-authenticate with Personal Access Token (Recommended)

**Best for**: Personal accounts with organization access

**Steps**:

1. **Create Fine-Grained Personal Access Token**
   - Go to: https://github.com/settings/tokens?type=beta
   - Click "Generate new token"
   - Token name: "Settler OSS Repo Creation"
   - Expiration: Choose appropriate (90 days recommended)
   - Repository access: "Only select repositories" or "All repositories"
   - **Organization access**: Select `shardie-github`
     - Permissions needed:
       - **Repository permissions**:
         - Contents: Read and write
         - Metadata: Read-only
         - Administration: Read and write (for repo creation)
   - Click "Generate token"
   - **Copy token immediately** (won't be shown again)

2. **Re-authenticate GitHub CLI**
   ```bash
   # Logout current session
   gh auth logout
   
   # Login with token
   gh auth login --with-token < <(echo "YOUR_TOKEN_HERE")
   
   # Or interactive login (will prompt for token)
   gh auth login
   # Select: GitHub.com
   # Select: HTTPS
   # Select: Login with a web browser (or paste token)
   ```

3. **Verify Access**
   ```bash
   # Check authentication
   gh auth status
   
   # Test organization access
   gh api orgs/shardie-github --jq .login
   
   # Test repo creation (dry-run)
   gh repo create shardie-github/test-repo --public --clone false
   ```

---

### Option 2: Use GitHub App (Best for Organizations)

**Best for**: Organizations wanting better security and audit trails

**Steps**:

1. **Create GitHub App**
   - Go to: https://github.com/organizations/shardie-github/settings/apps
   - Click "New GitHub App"
   - Name: "Settler OSS Repo Manager"
   - Homepage URL: https://settler.dev
   - Webhook: Disable (unless needed)
   - Permissions:
     - **Repository permissions**:
       - Contents: Read and write
       - Metadata: Read-only
       - Administration: Read and write
   - Where can this GitHub App be installed: "Only on this account"
   - Click "Create GitHub App"

2. **Install GitHub App**
   - After creation, click "Install App"
   - Select: "Only select repositories" or "All repositories"
   - Click "Install"

3. **Generate App Token**
   ```bash
   # Get App ID and Installation ID from GitHub
   APP_ID="your-app-id"
   INSTALLATION_ID="your-installation-id"
   PRIVATE_KEY="path-to-private-key.pem"
   
   # Generate token (requires jq and openssl)
   gh api \
     -X POST \
     -H "Accept: application/vnd.github+json" \
     /app/installations/$INSTALLATION_ID/access_tokens \
     -f '{"permissions":{"contents":"write","metadata":"read","administration":"write"}}'
   ```

4. **Authenticate with App Token**
   ```bash
   gh auth login --with-token < <(echo "APP_TOKEN_HERE")
   ```

---

### Option 3: Grant Organization Permissions to Existing Token

**Best for**: If you already have a token but need org permissions

**Steps**:

1. **Check Current Token Permissions**
   ```bash
   gh api user --jq .login
   gh api user/installations --jq '.[].account.login'
   ```

2. **Update Token Permissions**
   - Go to: https://github.com/settings/tokens
   - Find your token (or create new one)
   - Edit token
   - **Enable organization access**: Select `shardie-github`
   - Grant permissions:
     - `repo` (full control)
     - `admin:org` (if needed for repo creation)
   - Save changes

3. **Re-authenticate**
   ```bash
   gh auth refresh
   # Or logout and login again
   ```

---

## Quick Fix: Re-authenticate with Higher Permissions

**Fastest solution** (if you have org access):

```bash
# 1. Logout current session
gh auth logout

# 2. Login with web browser (will use your account permissions)
gh auth login
# Follow prompts:
# - GitHub.com
# - HTTPS
# - Login with a web browser
# - Authorize in browser

# 3. Verify organization access
gh api orgs/shardie-github --jq .login

# 4. Test repo creation
gh repo create shardie-github/settler-oss \
  --public \
  --description "Settler Open-Source SDKs and Tools" \
  --clone false
```

---

## Required Permissions Checklist

To create repositories in an organization, you need:

- [ ] **Organization membership**: Member of `shardie-github`
- [ ] **Repository creation permission**: Granted by org admin
- [ ] **Token with org scope**: `repo` and `admin:org` (if needed)
- [ ] **GitHub CLI authenticated**: With token that has org access

---

## Verify Permissions

**Check current permissions**:
```bash
# Check authenticated user
gh api user --jq '{login,type}'

# Check organization access
gh api orgs/shardie-github --jq .login

# Check organization membership
gh api user/orgs --jq '.[].login'

# Test repository creation (dry-run)
gh repo create shardie-github/test-repo-check --public --clone false
# Then delete: gh repo delete shardie-github/test-repo-check
```

---

## Troubleshooting

### Issue: "Resource not accessible by integration"

**Cause**: Bot account doesn't have organization access

**Solution**: 
- Use a personal account with org membership
- Or create GitHub App with org installation

### Issue: "Must have admin rights to Repository"

**Cause**: Token doesn't have `admin:org` or repository creation permissions

**Solution**:
- Update token permissions
- Or request org admin to grant repository creation permission

### Issue: "Organization not found"

**Cause**: Not a member of the organization

**Solution**:
- Request organization membership
- Or use an account that's already a member

---

## Recommended Approach

**For this use case**:

1. **Use your personal GitHub account** (if you're an org member)
   ```bash
   gh auth logout
   gh auth login
   # Login with your personal account
   ```

2. **Or create a dedicated service account**
   - Create GitHub user account
   - Add to organization
   - Grant repository creation permission
   - Use that account's token

3. **Or use GitHub App** (most secure for CI/CD)
   - Create GitHub App
   - Install on organization
   - Use app tokens in workflows

---

## After Fixing Permissions

Once you have proper permissions:

```bash
# Run the setup script
./scripts/setup-oss-repo.sh

# Or manually create repo
gh repo create shardie-github/settler-oss \
  --public \
  --description "Settler Open-Source SDKs and Tools" \
  --homepage "https://settler.dev" \
  --license "MIT" \
  --clone false
```

---

**Next Steps**: Choose an option above and re-authenticate GitHub CLI with proper permissions.
