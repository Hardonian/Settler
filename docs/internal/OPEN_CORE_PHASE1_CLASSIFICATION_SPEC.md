# PHASE 1: Target Architecture + Classification Rules

**Date**: 2025-01-28  
**Status**: ✅ Complete

## Target Architecture

### Private Canonical Repository Structure

```
settler-private/ (PRIVATE - Production Source of Truth)
├── packages/
│   ├── web/                    # Next.js marketing + console (PLATFORM_PROPRIETARY)
│   ├── api/                    # Internal API services (PLATFORM_PROPRIETARY)
│   ├── sdk/                    # TypeScript SDK (OSS_PUBLIC ✅)
│   ├── sdk-python/             # Python SDK (OSS_PUBLIC ✅)
│   ├── sdk-go/                 # Go SDK (OSS_PUBLIC ✅)
│   ├── sdk-ruby/               # Ruby SDK (OSS_PUBLIC ✅)
│   ├── api-client/              # REST API client (OSS_PUBLIC ✅) [NEW]
│   ├── protocol/               # Protocol types (OSS_PUBLIC ✅)
│   ├── react-settler/          # React components (OSS_PUBLIC ✅)
│   ├── cli/                    # CLI tool (OSS_PUBLIC ✅)
│   ├── adapters/               # Integration adapters (PLATFORM_PROPRIETARY)
│   ├── types/                  # Shared types (MIXED - classified per file)
│   ├── edge-ai-core/           # Edge AI (PLATFORM_PROPRIETARY)
│   └── edge-node/              # Edge runtime (PLATFORM_PROPRIETARY)
├── apps/                       # [OPTIONAL - if needed]
│   └── (none currently)
├── internal/                   # INTERNAL_BUSINESS (NEW)
│   ├── business/               # Business strategy, investor materials
│   │   ├── investor/
│   │   ├── strategy/
│   │   └── operations/
│   └── docs/                   # Internal documentation
├── proprietary/                # PLATFORM_PROPRIETARY (NEW - optional)
│   └── (platform-specific code if needed)
├── docs/
│   ├── public/                 # OSS_PUBLIC documentation (NEW)
│   │   ├── api-reference.md
│   │   ├── quickstart.md
│   │   ├── examples/
│   │   └── guides/
│   └── internal/               # INTERNAL_BUSINESS (moved from root)
│       └── (internal docs)
├── examples/                   # OSS_PUBLIC ✅
├── scripts/                    # MIXED - classified per file
│   ├── classify.ts             # Classification tool (PLATFORM_PROPRIETARY)
│   ├── mirror-*.ts             # Mirror tools (PLATFORM_PROPRIETARY)
│   └── smoke-test.ts           # Smoke tests (PLATFORM_PROPRIETARY)
├── tests/                      # MIXED - classified per file
├── prisma/                     # Database schema (PLATFORM_PROPRIETARY)
├── supabase/                   # Supabase functions/config (PLATFORM_PROPRIETARY)
├── config/                     # Configuration (PLATFORM_PROPRIETARY)
├── .github/
│   └── workflows/
│       ├── ci.yml              # Standard CI
│       ├── smoke.yml           # Smoke tests
│       ├── classify.yml        # Classification checks
│       └── publish-mirror.yml  # Mirror publishing
├── README.md                   # Internal dev guide
├── REPO_POLICY.md              # Open-core boundaries
├── CODEOWNERS                  # Protect proprietary/internal paths
└── LICENSE                     # Proprietary license (or remove)

```

### Public Mirror Repository Structure

```
settler-public/ (PUBLIC - OSS Only)
├── packages/
│   ├── sdk/                    # TypeScript SDK
│   ├── sdk-python/             # Python SDK
│   ├── sdk-go/                 # Go SDK
│   ├── sdk-ruby/               # Ruby SDK
│   ├── api-client/             # REST API client
│   ├── protocol/               # Protocol types
│   ├── react-settler/          # React components
│   └── cli/                    # CLI tool
├── docs/
│   └── public/                 # Public documentation only
│       ├── api-reference.md
│       ├── quickstart.md
│       ├── examples/
│       └── guides/
├── examples/                   # Example code
├── .github/
│   └── workflows/
│       └── ci.yml              # OSS-only CI
├── README.md                   # Public README (from README.public.md)
├── LICENSE                     # MIT or Apache 2.0
├── CONTRIBUTING.md             # OSS contribution guide
├── SECURITY.md                 # Security disclosure policy
└── CODE_OF_CONDUCT.md         # (optional)

```

## Classification Categories

### 1. OSS_PUBLIC
**Definition**: Content that is safe to publish publicly under an open-source license.

**Allowed in Public Mirror**: ✅ YES

**Examples**:
- SDK packages (`packages/sdk`, `packages/sdk-python`, etc.)
- API client libraries
- Protocol types
- Public documentation (`docs/public/`)
- Example code (`examples/`)
- Public-facing README, LICENSE, CONTRIBUTING.md

**Constraints**:
- Must NOT import from PLATFORM_PROPRIETARY or INTERNAL_BUSINESS
- Must NOT contain SECRET_RISK patterns
- Must NOT contain business strategy or investor materials

### 2. PLATFORM_PROPRIETARY
**Definition**: Licensed platform code, production services, and proprietary features.

**Allowed in Public Mirror**: ❌ NO

**Examples**:
- `packages/web` (Next.js marketing + console)
- `packages/api` (Internal API services)
- `packages/adapters` (Integration adapters)
- `packages/edge-ai-core`, `packages/edge-node`
- `prisma/` (Database schema)
- `supabase/` (Supabase functions/config)
- `config/` (Configuration files)
- Build scripts, deployment scripts
- Vercel configuration

**Constraints**:
- May import from OSS_PUBLIC packages
- Must NOT be exported to public mirror
- May contain business logic, but not business strategy docs

### 3. INTERNAL_BUSINESS
**Definition**: Business strategy, investor materials, operations, and commercial documents.

**Allowed in Public Mirror**: ❌ NO

**Examples**:
- `internal/business/` (Investor materials, strategy)
- `internal/docs/` (Internal documentation)
- `strategic/` (Strategic planning documents)
- `docs/internal/` (Internal documentation)
- Investor pitch decks
- Business model documents
- Revenue/pricing strategy
- Go-to-market plans
- Competitive analysis

**Constraints**:
- Must NEVER be exported to public mirror
- Must be in `internal/` directory or explicitly marked
- CI must fail if detected in public allowlist paths

### 4. SECRET_RISK
**Definition**: Files containing secrets, API keys, tokens, or sensitive credentials.

**Allowed in Public Mirror**: ❌ NO

**Examples**:
- Files containing actual secrets (not just patterns)
- `.env` files with real values
- Private keys
- Service account credentials

**Constraints**:
- CI must FAIL immediately if detected
- Must NEVER be committed to any repo (public or private)
- Classification tool must flag these as highest priority

## Classification Rules

### A. Path-Based Rules (Primary Classification)

#### OSS_PUBLIC Paths:
```
packages/sdk/**
packages/sdk-python/**
packages/sdk-go/**
packages/sdk-ruby/**
packages/api-client/**          # [NEW - to be created]
packages/protocol/**
packages/react-settler/**
packages/cli/**
docs/public/**
examples/**
```

#### PLATFORM_PROPRIETARY Paths:
```
packages/web/**
packages/api/**
packages/adapters/**
packages/edge-ai-core/**
packages/edge-node/**
prisma/**
supabase/**
config/**
apps/**                         # If exists
vercel.json
turbo.json
```

#### INTERNAL_BUSINESS Paths:
```
internal/**
strategic/**
docs/internal/**
docs/investor/**
docs/business/**
marketing/**                    # Needs per-file review
```

#### SECRET_RISK Paths (Denylist):
```
**/.env
**/.env.local
**/.env.*.local
**/*secret*
**/*key*
**/*token*
**/*credential*
**/*password*
**/secrets/**
**/.secrets/**
```

**Note**: Path-based rules take precedence. If a file matches a path rule, use that classification unless content-based rules override.

### B. Content-Based Rules (Secondary Classification)

#### INTERNAL_BUSINESS Content Patterns:
If file content contains any of these terms (case-insensitive):
- `investor`
- `pitch`
- `financial`
- `revenue`
- `pricing strategy`
- `go-to-market`
- `confidential`
- `NDA`
- `competitive`
- `moat`
- `valuation`
- `seed round`
- `series [a-z]`
- `due diligence`
- `exit strategy`
- `acquisition`
- `IPO`

**Action**: Classify as INTERNAL_BUSINESS (unless in `docs/public/` and explicitly safe)

#### SECRET_RISK Content Patterns:
If file content contains actual secret patterns (not just variable names):
- `SUPABASE_SERVICE_ROLE_KEY=sk_live_` or `sk_test_`
- `STRIPE_SECRET_KEY=sk_live_` or `sk_test_`
- `BEGIN PRIVATE KEY` (actual key material)
- `BEGIN RSA PRIVATE KEY`
- `BEGIN EC PRIVATE KEY`
- `-----BEGIN` (any private key format)
- API keys in format: `[a-zA-Z0-9]{32,}` (long alphanumeric strings)
- JWT tokens: `eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`

**Action**: Classify as SECRET_RISK, CI must FAIL

**Note**: Variable declarations like `process.env.STRIPE_SECRET_KEY` are OK. Actual secret values are NOT.

#### PLATFORM_PROPRIETARY Content Patterns:
If file contains:
- `"private": true` in package.json
- `"license": "UNLICENSED"` or proprietary license
- `Enterprise only`
- `Commercial feature`
- `License required`
- `Pro feature`
- `Premium feature`

**Action**: Classify as PLATFORM_PROPRIETARY (unless explicitly in OSS_PUBLIC path)

### C. Dependency-Based Rules (Tertiary Classification)

#### Import Analysis:
1. **OSS_PUBLIC packages must NOT import from**:
   - `packages/web`
   - `packages/api`
   - `packages/adapters`
   - `internal/`
   - `proprietary/`
   - `prisma/`
   - `supabase/`

2. **If OSS_PUBLIC package imports proprietary/internal**:
   - Reclassify package as PLATFORM_PROPRIETARY
   - OR refactor to remove dependency

3. **Import patterns to check**:
   - `import ... from '@settler/web'`
   - `import ... from '@settler/api'`
   - `import ... from '../internal/...'`
   - `import ... from '../../proprietary/...'`
   - `import ... from 'prisma'` (if not in OSS context)

**Action**: Classification tool must analyze imports and flag violations.

## Public Mirror Allowlist

### Explicit Allowlist (Whitelist Approach)

**Only these paths are allowed in public mirror**:

```
# Packages
packages/sdk/**
packages/sdk-python/**
packages/sdk-go/**
packages/sdk-ruby/**
packages/api-client/**
packages/protocol/**
packages/react-settler/**
packages/cli/**

# Documentation
docs/public/**

# Examples
examples/**

# Root files (transformed)
README.public.md -> README.md
LICENSE (if OSS)
CONTRIBUTING.md (OSS scope)
SECURITY.md
CODE_OF_CONDUCT.md (optional)
.gitignore (sanitized)
```

### Denylist (Safety Net)

**These paths are NEVER allowed**:
```
internal/**
proprietary/**
strategic/**
docs/internal/**
docs/investor/**
docs/business/**
packages/web/**
packages/api/**
packages/adapters/**
packages/edge-ai-core/**
packages/edge-node/**
prisma/**
supabase/**
config/**
scripts/classify.ts
scripts/mirror-*.ts
.github/workflows/publish-mirror.yml
```

## Classification Tool Output Format

### Machine-Readable: `artifacts/classification-report.json`

```json
{
  "version": "1.0.0",
  "timestamp": "2025-01-28T12:00:00Z",
  "summary": {
    "total": 1000,
    "oss_public": 150,
    "platform_proprietary": 700,
    "internal_business": 100,
    "secret_risk": 0,
    "unclassified": 50
  },
  "files": [
    {
      "path": "packages/sdk/src/index.ts",
      "classification": "OSS_PUBLIC",
      "reason": "path_match: packages/sdk/**",
      "imports": ["@settler/protocol"],
      "violations": []
    },
    {
      "path": "docs/internal/business/investor-pitch-deck.md",
      "classification": "INTERNAL_BUSINESS",
      "reason": "path_match: docs/internal/**",
      "content_flags": ["investor", "pitch"],
      "violations": []
    },
    {
      "path": "packages/sdk/src/client.ts",
      "classification": "PLATFORM_PROPRIETARY",
      "reason": "import_violation: imports from @settler/api",
      "imports": ["@settler/api"],
      "violations": ["OSS_PUBLIC package imports PLATFORM_PROPRIETARY"]
    }
  ],
  "violations": [
    {
      "type": "secret_detected",
      "file": ".env.local",
      "severity": "critical",
      "message": "Actual secret value detected"
    },
    {
      "type": "oss_imports_proprietary",
      "file": "packages/sdk/src/client.ts",
      "severity": "high",
      "message": "OSS_PUBLIC package imports from PLATFORM_PROPRIETARY"
    }
  ]
}
```

### Human-Readable: `artifacts/classification-summary.md`

Markdown summary with:
- Classification statistics
- Violations summary
- Files by category
- Recommendations

## Invariants (Must Always Hold)

1. **OSS_PUBLIC must NOT contain SECRET_RISK patterns**
   - If detected, CI fails immediately

2. **OSS_PUBLIC packages must NOT import proprietary/internal**
   - If detected, reclassify package or refactor

3. **INTERNAL_BUSINESS must NEVER be exported to mirror**
   - If detected in allowlist, CI fails

4. **PLATFORM_PROPRIETARY must NEVER be exported to mirror**
   - If detected in allowlist, CI fails

5. **SECRET_RISK must NEVER be committed**
   - If detected, CI fails immediately

6. **Public mirror must contain ONLY OSS_PUBLIC content**
   - Mirror export must verify every file is OSS_PUBLIC

## Examples

### Example 1: OSS SDK Package
**File**: `packages/sdk/src/client.ts`
```typescript
import { SettlerClient } from './client';
import { Protocol } from '@settler/protocol'; // ✅ OK - OSS import

export class SDK {
  // ...
}
```
**Classification**: OSS_PUBLIC ✅
**Reason**: Path match `packages/sdk/**`, imports only OSS packages

### Example 2: Platform Web App
**File**: `packages/web/src/app/console/page.tsx`
```typescript
import { getServerSession } from '@settler/api'; // ❌ Proprietary import
```
**Classification**: PLATFORM_PROPRIETARY ✅
**Reason**: Path match `packages/web/**`

### Example 3: Investor Document
**File**: `docs/internal/business/investor-pitch-deck.md`
```markdown
# Investor Pitch Deck
Seed Round: $2M
Valuation: $10M
```
**Classification**: INTERNAL_BUSINESS ✅
**Reason**: Path match `docs/internal/**`, content flags: "investor", "valuation"

### Example 4: Secret Leak (Should Never Happen)
**File**: `.env.local`
```
STRIPE_SECRET_KEY=sk_live_EXAMPLE_PATTERN_DO_NOT_USE_REAL_SECRETS_HERE
```
**Classification**: SECRET_RISK ❌
**Reason**: Actual secret value detected
**Action**: CI FAILS immediately

### Example 5: OSS Package Importing Proprietary (Violation)
**File**: `packages/sdk/src/advanced.ts`
```typescript
import { DatabaseService } from '@settler/api'; // ❌ VIOLATION
```
**Classification**: PLATFORM_PROPRIETARY (reclassified)
**Reason**: OSS_PUBLIC package imports PLATFORM_PROPRIETARY
**Action**: CI fails, must refactor

---

**Spec Complete**: 2025-01-28  
**Next Phase**: PHASE 2 - Implement Classification Tooling
