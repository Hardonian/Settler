# PHASE 5: Mirror Dry-Run + Publish Pipeline

**Date**: 2025-01-28  
**Status**: ✅ Complete

## Overview

Implemented automated mirror publishing pipeline that ensures only OSS_PUBLIC content is exported to the public repository.

## Mirror Pipeline Components

### 1. Mirror Dry-Run (`scripts/mirror-dryrun.ts`)

**Purpose**: Exports allowlisted OSS_PUBLIC files to `./.mirror-out/` for verification.

**Features**:
- ✅ Exports only OSS_PUBLIC files based on allowlist
- ✅ Generates `mirror-manifest.json` with file hashes
- ✅ Transforms root files (README.public.md -> README.md)
- ✅ Automatically runs verification after export
- ✅ Calculates total size and file count

**Usage**:
```bash
pnpm mirror:dryrun
```

**Output**:
- `./.mirror-out/` - Mirror export directory
- `./.mirror-out/mirror-manifest.json` - File manifest with hashes

### 2. Mirror Verification (`scripts/mirror-verify.ts`)

**Purpose**: Verifies that mirror export contains ONLY OSS_PUBLIC content.

**Checks**:
- ✅ All files must be in OSS_PUBLIC allowlist
- ✅ No files from denylist
- ✅ No secret patterns in content
- ✅ No business keywords in content

**Usage**:
```bash
pnpm mirror:verify
pnpm mirror:verify --path=./.mirror-out
```

**Exit Code**: 
- `0` if verification passes
- `1` if violations detected

### 3. Mirror Publish (`scripts/mirror-publish.ts`)

**Purpose**: Publishes mirror export to public repository.

**Current Status**: Outputs manual steps (full automation via GitHub Actions)

**Usage**:
```bash
pnpm mirror:publish
pnpm mirror:publish --remote=public
```

**Manual Steps** (until full automation):
1. `cd .mirror-out`
2. `git init`
3. `git add .`
4. `git commit -m "chore: sync OSS mirror"`
5. `git remote add public <public-repo-url>`
6. `git push public main --force`

### 4. GitHub Actions Workflow (`publish-mirror.yml`)

**Purpose**: Automated mirror publishing on version tags.

**Triggers**:
- Push tags matching `v*.*.*` (e.g., `v1.0.0`)
- Manual workflow dispatch with tag input

**Steps**:
1. ✅ Checkout code
2. ✅ Run classification (`pnpm classify:strict`)
3. ✅ Run mirror dry-run (`pnpm mirror:dryrun`)
4. ✅ Verify mirror export (`pnpm mirror:verify`)
5. ✅ Initialize mirror repository
6. ✅ Commit mirror export
7. ✅ Push to public mirror with tag

**Kill Switch**: 
- Repository variable `ENABLE_MIRROR_PUBLISHING`
- Set to `false` to disable mirror publishing

**Required Secrets**:
- `PUBLIC_MIRROR_REPO_URL` - Public repository URL
- `PUBLIC_MIRROR_GIT_USERNAME` - Git username for public repo
- `PUBLIC_MIRROR_GIT_TOKEN` - Git token for public repo

## Mirror Allowlist

### Packages (OSS_PUBLIC)
- `packages/sdk/**`
- `packages/sdk-python/**`
- `packages/sdk-go/**`
- `packages/sdk-ruby/**`
- `packages/api-client/**`
- `packages/protocol/**`
- `packages/react-settler/**`
- `packages/cli/**`

### Documentation
- `docs/public/**`

### Examples
- `examples/**`

### Root Files (Transformed)
- `README.public.md` → `README.md`
- `LICENSE` (if OSS)
- `CONTRIBUTING.md` (OSS scope)
- `SECURITY.md`
- `CODE_OF_CONDUCT.md` (optional)
- `.gitignore` (sanitized)

## Mirror Denylist

### Never Export
- `internal/**`
- `proprietary/**`
- `strategic/**`
- `docs/internal/**`
- `docs/investor/**`
- `docs/business/**`
- `packages/web/**`
- `packages/api/**`
- `packages/adapters/**`
- `packages/edge-ai-core/**`
- `packages/edge-node/**`
- `prisma/**`
- `supabase/**`
- `config/**`
- `scripts/classify.ts`
- `scripts/mirror-*.ts`
- `.github/workflows/publish-mirror.yml`

## Mirror Manifest Format

```json
{
  "version": "1.0.0",
  "timestamp": "2025-01-28T12:00:00Z",
  "files": [
    {
      "path": "packages/sdk/src/index.ts",
      "hash": "sha256:abc123...",
      "size": 1234
    }
  ],
  "totalSize": 1234567
}
```

## Publishing Workflow

### Automated Publishing (Recommended)

1. **Create version tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions triggers**:
   - Runs classification check
   - Runs mirror dry-run
   - Verifies mirror export
   - Publishes to public mirror

### Manual Publishing

1. **Run dry-run**:
   ```bash
   pnpm mirror:dryrun
   ```

2. **Verify export**:
   ```bash
   pnpm mirror:verify
   ```

3. **Review export**:
   ```bash
   ls -la .mirror-out/
   cat .mirror-out/mirror-manifest.json
   ```

4. **Publish manually**:
   ```bash
   cd .mirror-out
   git init
   git add .
   git commit -m "chore: sync OSS mirror"
   git remote add public <public-repo-url>
   git push public main --force
   ```

## Safety Guarantees

### Pre-Publish Checks

1. ✅ **Classification Check**: All files classified correctly
2. ✅ **No Violations**: No SECRET_RISK or import violations
3. ✅ **Allowlist Check**: All files in OSS_PUBLIC allowlist
4. ✅ **Denylist Check**: No files from denylist
5. ✅ **Content Check**: No secrets or business keywords

### Post-Publish Verification

1. ✅ **Manifest Generated**: File manifest with hashes
2. ✅ **Tag Created**: Version tag created in public repo
3. ✅ **Git History**: Clean git history in public repo

## Kill Switch

**Repository Variable**: `ENABLE_MIRROR_PUBLISHING`

**Values**:
- `true` (default) - Mirror publishing enabled
- `false` - Mirror publishing disabled

**Usage**: Set to `false` to temporarily disable mirror publishing without deleting workflow.

## Troubleshooting

### Mirror Export Fails

**Error**: Files not in allowlist
**Solution**: Review classification rules, update allowlist if needed

### Verification Fails

**Error**: Denylist violation or content violation
**Solution**: Fix source files, re-run dry-run

### Publish Fails

**Error**: Git push fails
**Solution**: Check secrets, verify public repo URL, check permissions

## Next Steps

- **PHASE 6**: Anti-leak tripwires
- **PHASE 7**: Backup/rollback playbooks

---

**Implementation Complete**: 2025-01-28  
**Next Phase**: PHASE 6 - Anti-Leak Tripwires
