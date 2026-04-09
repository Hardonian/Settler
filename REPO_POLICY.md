# Repository Policy: Open-Core Architecture

**Last Updated**: 2025-01-28

## Overview

This repository follows an **open-core** architecture where:

- **Private Canonical Repo**: Production source of truth for Vercel deployments
- **Public Mirror Repo**: Contains ONLY OSS SDK/API client + docs/examples

## Classification System

All files are classified into one of four categories:

### OSS_PUBLIC ✅

- Safe to publish publicly under open-source license
- Includes: SDK packages, API clients, public docs, examples
- **Allowed in public mirror**: YES

### PLATFORM_PROPRIETARY 🔒

- Licensed platform code, production services, proprietary features
- Includes: Web app, API services, adapters, database schema
- **Allowed in public mirror**: NO

### INTERNAL_BUSINESS 📊

- Business strategy, investor materials, operations, commercial documents
- Includes: Investor decks, strategy docs, business plans
- **Allowed in public mirror**: NO

### SECRET_RISK ⚠️

- Secrets, API keys, tokens, sensitive credentials
- **Allowed in public mirror**: NO
- **CI FAILS** if detected

## File Placement Rules

### OSS_PUBLIC Files

- `packages/sdk/**`
- `packages/sdk-python/**`
- `packages/sdk-go/**`
- `packages/sdk-ruby/**`
- `packages/api-client/**`
- `packages/protocol/**`
- `packages/react-settler/**`
- `packages/cli/**`
- `docs/public/**`
- `examples/**`

### PLATFORM_PROPRIETARY Files

- `packages/web/**`
- `packages/api/**`
- `packages/adapters/**`
- `packages/edge-ai-core/**`
- `packages/edge-node/**`
- `prisma/**`
- `supabase/**`
- `config/**`

### INTERNAL_BUSINESS Files

- `internal/**`
- `strategic/**`
- `docs/internal/**`
- `docs/investor/**`
- `docs/business/**`

## Development Guidelines

### For OSS Packages

1. ✅ **No proprietary imports**: OSS packages must NOT import from `@settler/web`, `@settler/api`, `internal/`, or `proprietary/`
2. ✅ **No secrets**: Never commit secrets or API keys
3. ✅ **Public docs only**: Documentation must be in `docs/public/`
4. ✅ **Clean dependencies**: Only depend on other OSS packages or external libraries

### For Platform Code

1. ✅ **Keep proprietary**: Platform code stays in private repo
2. ✅ **Use OSS packages**: Platform code can import from OSS packages
3. ✅ **Business docs**: Place business documents in `internal/` or `docs/internal/`

### For Business Documents

1. ✅ **Use internal directories**: Place in `internal/` or `docs/internal/`
2. ✅ **Never commit secrets**: Use environment variables
3. ✅ **Review before commit**: Check classification before committing

## CI/CD Requirements

### Required Checks (Must Pass)

1. ✅ **Lint & Typecheck**: Code quality checks
2. ✅ **Tests**: Unit tests with coverage threshold
3. ✅ **Build**: Application builds successfully
4. ✅ **Classification**: File classification check
5. ✅ **Smoke Tests**: Critical routes return 200, not 500

### Blocking Violations

- ❌ **SECRET_RISK detected**: CI fails immediately
- ❌ **OSS_PUBLIC imports proprietary**: CI fails
- ❌ **INTERNAL_BUSINESS in public paths**: CI fails
- ❌ **Smoke test failures**: CI fails

## Mirror Publishing

### Process

1. ✅ **Classification**: All files classified correctly
2. ✅ **Dry-run**: Export OSS_PUBLIC files to `.mirror-out/`
3. ✅ **Verification**: Verify export contains ONLY OSS_PUBLIC
4. ✅ **Publish**: Push to public mirror repository

### Kill Switch

**Repository Variable**: `ENABLE_MIRROR_PUBLISHING`

- Set to `false` to disable mirror publishing
- Prevents accidental publishes

## Enforcement

### Pre-Commit

- Classification tool can be added to pre-commit hook (optional)

### Pre-Merge

- GitHub Actions workflows enforce classification
- Required checks must pass before merge

### Pre-Publish

- Mirror verification ensures only OSS_PUBLIC content
- Classification check runs before publish

## Violations

### If You See a Violation

1. **Review classification report**: `artifacts/classification-report.json`
2. **Fix the issue**: Move files, remove secrets, fix imports
3. **Re-run classification**: `pnpm classify`
4. **Verify fix**: Check CI passes

### Common Violations

- **Business doc in wrong location**: Move to `internal/` or `docs/internal/`
- **OSS package importing proprietary**: Refactor to remove dependency
- **Secret in code**: Remove secret, use environment variable
- **File not classified**: Add to appropriate directory or update classification rules

## Questions?

- **Classification questions**: See `docs/internal/OPEN_CORE_PHASE1_CLASSIFICATION_SPEC.md`
- **Tooling questions**: See `docs/internal/OPEN_CORE_PHASE2_CLASSIFICATION_TOOLING.md`
- **Policy questions**: Open an issue or contact maintainers

---

**Policy Version**: 1.0.0  
**Effective Date**: 2025-01-28
