# OSS Mirror Setup - Complete Configuration

This document describes the complete setup for automatically syncing OSS artifacts to the public mirror repository.

## Overview

The OSS mirroring system automatically syncs open-source content from the private repository to the public mirror repository (`shardie-github/settler-oss`) whenever changes are committed.

## Configuration Components

### 1. OSS_PUBLIC Markers

All OSS directories are marked with `OSS_PUBLIC` marker files. These markers tell the sync workflow which directories contain open-source content.

**Marked Directories:**
- `packages/sdk/OSS_PUBLIC` - TypeScript SDK
- `packages/sdk-python/OSS_PUBLIC` - Python SDK
- `packages/sdk-go/OSS_PUBLIC` - Go SDK
- `packages/sdk-ruby/OSS_PUBLIC` - Ruby SDK
- `packages/protocol/OSS_PUBLIC` - Protocol types
- `packages/react-settler/OSS_PUBLIC` - React components
- `packages/cli/OSS_PUBLIC` - CLI tool
- `examples/OSS_PUBLIC` - Example code
- `docs/public/OSS_PUBLIC` - Public documentation

### 2. Root-Level OSS Files

These files are automatically synced to the mirror:
- `LICENSE` - MIT License
- `README.public.md` - Public README (renamed to `README.md` in mirror)
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY.md` - Security policy

### 3. GitHub Actions Workflow

**Workflow File:** `.github/workflows/auto-sync-oss.yml`

**Triggers:**
- Push to `main` or `master` branch
- Manual workflow dispatch (with optional force sync)

**Configuration:**
- **Secrets Required:**
  - `PUBLIC_MIRROR_REPO_URL` - URL of the public mirror repository
  - `PUBLIC_MIRROR_GIT_TOKEN` - PAT token for pushing to mirror
  - `PUBLIC_MIRROR_GIT_USERNAME` - Git username for commits

- **Variables:**
  - `ENABLE_AUTO_SYNC` - Set to `'true'` to enable auto-sync (default: `'true'`)

**How It Works:**
1. On push, the workflow checks for changed files
2. Runs `scripts/classify-oss.sh` to find all OSS_PUBLIC files
3. If OSS files changed (or force sync enabled), clones the mirror repo
4. Copies all OSS files to the mirror
5. Commits and pushes changes to the mirror

### 4. Classification Script

**Script:** `scripts/classify-oss.sh`

This script:
- Finds all directories containing `OSS_PUBLIC` markers
- Lists all files in those directories (excluding build artifacts, node_modules, etc.)
- Also checks explicit OSS directories as fallback

**Exclusions:**
- `.git/`, `.turbo/`, `node_modules/`, `dist/`, `build/` directories
- Files named `*.private`
- The `OSS_PUBLIC` marker files themselves

## Sync Process

### Automatic Sync (on push)

1. Developer commits changes to private repo
2. GitHub Actions workflow triggers on push to `main`
3. Workflow detects if any OSS files changed
4. If yes, syncs all OSS content to mirror repo
5. Creates commit in mirror: `chore: auto-sync OSS content from private repo`

### Manual Sync

Use GitHub Actions workflow dispatch:
1. Go to Actions → "Auto-Sync to OSS Repository"
2. Click "Run workflow"
3. Optionally enable "Force sync all OSS content"
4. Click "Run workflow"

### Force Sync

Force sync ignores change detection and syncs all OSS content regardless of what changed. Useful for:
- Initial setup
- Fixing sync issues
- Updating all OSS content at once

## Verification

### Test Classification Locally

```bash
# Run classification script
./scripts/classify-oss.sh | head -20

# Or use npm script
npm run classify
```

### Test Mirror Export

```bash
# Dry-run mirror export
npm run mirror:dryrun

# Verify mirror export
npm run mirror:verify
```

## Important Notes

### Paths Ignore

The workflow has `paths-ignore` configured:
- `**.md` - Markdown files don't trigger workflow (but are still synced)
- `.github/**` - Workflow changes don't trigger sync
- `docs/**` - Docs changes don't trigger workflow (but `docs/public/**` is synced)

**Note:** This only affects workflow triggers, not what gets synced. OSS files are always synced when the workflow runs.

### OSS_PUBLIC Markers

- Markers are **not** ignored by `.gitignore`
- Markers themselves are **not** synced to mirror (excluded by script)
- Each OSS directory should have exactly one `OSS_PUBLIC` marker file

### Adding New OSS Content

To add a new OSS package/directory:

1. Create the directory and add your OSS code
2. Create an `OSS_PUBLIC` marker file in that directory:
   ```bash
   echo "# OSS_PUBLIC Marker" > your-new-package/OSS_PUBLIC
   ```
3. Update `scripts/classify-oss.sh` if needed (for explicit directory fallback)
4. Update `scripts/classify.ts` OSS_PUBLIC_PATHS if needed
5. Commit and push - sync will happen automatically

### Troubleshooting

**Sync not happening:**
1. Check `ENABLE_AUTO_SYNC` variable is set to `'true'`
2. Verify secrets are configured correctly
3. Check workflow logs for errors
4. Ensure OSS_PUBLIC markers exist in directories

**Files not syncing:**
1. Verify file is in a directory with `OSS_PUBLIC` marker
2. Check file isn't excluded (node_modules, dist, etc.)
3. Run `./scripts/classify-oss.sh` to see if file is detected
4. Check workflow logs for classification output

**Sync failing:**
1. Verify PAT token has write access to mirror repo
2. Check mirror repo exists and is accessible
3. Verify git credentials are correct
4. Check for merge conflicts in mirror repo

## Related Scripts

- `npm run classify` - Classify all files in repo
- `npm run classify:strict` - Strict classification with violations
- `npm run mirror:dryrun` - Export mirror without pushing
- `npm run mirror:verify` - Verify mirror export
- `npm run mirror:publish` - Publish mirror (used by tag workflow)

## Related Workflows

- `.github/workflows/auto-sync-oss.yml` - Auto-sync on push
- `.github/workflows/publish-mirror.yml` - Publish on version tags

## Status

✅ **Setup Complete**
- All OSS directories marked with `OSS_PUBLIC`
- Classification script created and executable
- Workflow configured and ready
- Root OSS files present
- Secrets and variables configured (assumed complete per user)

The mirror will automatically sync on the next commit to `main` branch.
