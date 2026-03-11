# Quick Fix: Increase GitHub CLI Permissions

**Problem**: Bot account cannot create repos in `shardie-github` organization  
**Solution**: Re-authenticate with account that has org access

---

## Fastest Solution (2 minutes)

### Step 1: Logout Current Session

```bash
gh auth logout
```

### Step 2: Login with Your Account

```bash
gh auth login
```

**Follow the prompts**:

1. **What account do you want to log into?** → `GitHub.com`
2. **What is your preferred protocol?** → `HTTPS`
3. **How would you like to authenticate?** → `Login with a web browser` (recommended)
   - Or: `Paste an authentication token` (if you have a token ready)

4. **If using web browser**:
   - Copy the code shown
   - Press Enter to open browser
   - Authorize GitHub CLI
   - Return to terminal

### Step 3: Verify Organization Access

```bash
# Check you can access the organization
gh api orgs/shardie-github --jq .login

# Should output: "shardie-github"
```

### Step 4: Test Repository Creation

```bash
# Try creating the repo
gh repo create shardie-github/settler-oss \
  --public \
  --description "Settler Open-Source SDKs and Tools - Official SDKs for Node.js, Python, Go, Ruby, React, and CLI" \
  --homepage "https://settler.dev" \
  --license "MIT" \
  --clone false
```

---

## If You Don't Have Organization Access

### Option A: Request Organization Membership

1. Ask an admin of `shardie-github` to:
   - Add you to the organization
   - Grant "Repository creation" permission

### Option B: Use Personal Access Token

1. **Create Token**:
   - Go to: https://github.com/settings/tokens?type=beta
   - Generate new token (fine-grained)
   - Grant access to `shardie-github` organization
   - Permissions: `Contents: Read and write`, `Administration: Read and write`

2. **Login with Token**:
   ```bash
   gh auth logout
   echo "YOUR_TOKEN_HERE" | gh auth login --with-token
   ```

---

## After Fixing Permissions

Once authenticated with proper permissions:

```bash
# Run automated setup
./scripts/setup-oss-repo.sh

# Or manually:
cd /workspace/.mirror-out
git remote set-url origin https://github.com/shardie-github/settler-oss.git
git branch -M main
git push -u origin main
```

---

## Verify It Worked

```bash
# Check authentication
gh auth status

# Should show your account (not cursor[bot])

# Check organization access
gh api orgs/shardie-github --jq .login

# Should output: "shardie-github"
```

---

**That's it!** Once you have proper permissions, the setup script will work automatically.
