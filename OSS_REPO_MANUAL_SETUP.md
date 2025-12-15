# OSS Repository Manual Setup Guide

**Status**: Ready to execute manually  
**Reason**: Bot account cannot create repos in organization

---

## Quick Setup (5 Minutes)

### Step 1: Create Repository via GitHub Web UI

1. Go to: https://github.com/organizations/shardie-github/repositories/new
   - Or: https://github.com/new → Select organization: `shardie-github`

2. Fill in:
   - **Repository name**: `settler-oss`
   - **Description**: `Settler Open-Source SDKs and Tools - Official SDKs for Node.js, Python, Go, Ruby, React, and CLI`
   - **Visibility**: ✅ **Public**
   - **Initialize**: Leave unchecked (we'll push content)
   - **License**: MIT
   - **Add .gitignore**: None
   - **Add README**: Unchecked

3. Click **"Create repository"**

---

### Step 2: Configure Repository Settings

After creating, go to repository Settings:

**General Settings**:

- ✅ Enable Issues
- ✅ Enable Discussions (optional)
- ✅ Enable Wiki: Disabled (use docs/ instead)

**Topics** (Settings → Topics):
Add these topics:

- `settler`
- `reconciliation`
- `financial-api`
- `sdk`
- `typescript`
- `python`
- `go`
- `ruby`
- `react`
- `open-source`

---

### Step 3: Push Initial Content

**The mirror export is ready!** Run these commands:

```bash
cd /workspace/.mirror-out

# Set correct remote URL
git remote set-url origin https://github.com/shardie-github/settler-oss.git

# Rename branch to main
git branch -M main

# Push to repository
git push -u origin main
```

**Expected Output**:

```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Writing objects: 100% (X/X), done.
To https://github.com/shardie-github/settler-oss.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

### Step 4: Create Initial Release

```bash
cd /workspace/.mirror-out

# Create release tag
git tag -a v0.1.0 -m "Initial OSS release

This is the first release of Settler's open-source SDKs and tools."

# Push tag
git push origin v0.1.0
```

---

### Step 5: Verify Repository

1. Visit: https://github.com/shardie-github/settler-oss
2. Verify:
   - ✅ Repository is public
   - ✅ README.md is present
   - ✅ LICENSE is present
   - ✅ Packages are present (sdk, protocol, react-settler, etc.)
   - ✅ Examples are present
   - ✅ No proprietary code (no `packages/web` or `packages/api`)

---

## Next Steps: Configure Secrets

After repository is created, configure secrets in the **private repo** (`shardie-github/Settler`):

### Required Secrets

**Location**: `shardie-github/Settler` → Settings → Secrets and variables → Actions

1. **`PUBLIC_MIRROR_REPO_URL`**
   - Value: `https://github.com/shardie-github/settler-oss.git`

2. **`PUBLIC_MIRROR_GIT_USERNAME`**
   - Value: `github-actions[bot]` (or your GitHub username)

3. **`PUBLIC_MIRROR_GIT_TOKEN`**
   - Value: Personal Access Token with `repo` permissions
   - See: `docs/internal/OSS_REPO_SECRETS_GUIDE.md` for details

### Required Variable

**Location**: `shardie-github/Settler` → Settings → Secrets and variables → Actions → Variables

- **`ENABLE_MIRROR_PUBLISHING`**: `true`

---

## Test Workflow

After secrets are configured:

1. Go to: `shardie-github/Settler` → Actions → Publish Mirror
2. Click "Run workflow"
3. Enter tag: `v0.1.0-test`
4. Click "Run workflow"
5. Verify it completes successfully

---

## Current Status

✅ **Mirror export ready**: `/workspace/.mirror-out`  
✅ **Content verified**: 47 files, all OSS_PUBLIC  
✅ **Git initialized**: Ready to push  
✅ **Documentation**: Complete

**Ready to push!** Execute Step 3 above.

---

## Troubleshooting

### Issue: "Repository not found"

- Verify repository was created: https://github.com/shardie-github/settler-oss
- Check you have push access to the organization

### Issue: "Permission denied"

- Ensure you have write access to `shardie-github/settler-oss`
- Check your GitHub token has `repo` permissions

### Issue: "Remote origin already exists"

```bash
cd /workspace/.mirror-out
git remote remove origin
git remote add origin https://github.com/shardie-github/settler-oss.git
```

---

**All content is ready!** Just create the repo and push. 🚀
