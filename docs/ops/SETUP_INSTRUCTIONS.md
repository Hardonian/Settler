# Setup Instructions

**Last Updated:** 2025-01-27

## Prerequisites

1. **Node.js >= 24.0.0** (required by package.json)
2. **npm >= 10.0.0**
3. **Supabase CLI** (for database migrations)
4. **Git** (for repository access)

## Step 1: Database Migration

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux
npm install -g supabase

# Or use npx
npx supabase --version
```

### Run Migration

```bash
# Ensure you're connected to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Or apply specific migration
supabase migration up
```

**Migration File:** `supabase/migrations/20250127000000_create_ops_tables.sql`

**Creates:**

- `ops_errors` table
- `ops_jobs` table
- `ops_webhooks` table
- `ops_usage_aggregates` table
- `ops_support_tickets` table
- `ops_audit_logs` table
- RLS policies
- Indexes and triggers

## Step 2: Local Testing

### Install Dependencies

```bash
npm ci
```

### Run Integrity Checks

```bash
# Repository integrity
npm run repo-integrity

# Vercel parity check
npm run vercel:parity

# Full production check
npm run check:production
```

**Expected Output:**

- ✅ All integrity checks passed
- ✅ Vercel parity check passed
- ✅ Production check passed

## Step 3: Configure GitHub Branch Protection

### Manual Steps (GitHub UI)

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** or edit existing rule for `main` branch
4. Configure:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings**
   - Select required checks:
     - `repo-integrity`
     - `lint-and-typecheck`
     - `test`
     - `build`
     - `production-check`
     - `smoke-test`

### Via GitHub API (Alternative)

```bash
# Set GITHUB_TOKEN environment variable
export GITHUB_TOKEN=your_token_here

# Use GitHub CLI
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=repo-integrity \
  --field required_status_checks[contexts][]=lint-and-typecheck \
  --field required_status_checks[contexts][]=test \
  --field required_status_checks[contexts][]=build \
  --field required_status_checks[contexts][]=production-check \
  --field enforce_admins=true \
  --field restrictions=null
```

## Step 4: Verify Vercel Settings

### Check Current Configuration

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Verify:

**Build & Development Settings:**

- **Framework Preset:** Next.js
- **Root Directory:** (leave empty or set to repository root)
- **Build Command:** `cd packages/web && npm run build:vercel`
- **Output Directory:** `packages/web/.next`
- **Install Command:** `npm ci --prefer-offline --no-audit --omit=optional`

**Environment Variables:**

- Verify all required env vars are set
- Check `config/env.schema.ts` for required variables

### Verify vercel.json

The root `vercel.json` should match:

```json
{
  "buildCommand": "cd packages/web && npm run build:vercel",
  "installCommand": "npm ci --prefer-offline --no-audit --omit=optional",
  "framework": "nextjs",
  "outputDirectory": "packages/web/.next",
  "regions": ["iad1", "sfo1", "lhr1", "syd1"]
}
```

### Verify Webhook Runtime

1. Go to **Settings** → **Functions**
2. Verify `/api/stripe/webhook` uses:
   - **Runtime:** Node.js (not Edge)
   - **Max Duration:** 30s (or appropriate)

## Step 5: Test Ops Dashboard

### Access Dashboard

1. Ensure you're logged in as super admin
2. Navigate to `/console/ops`
3. Verify all tabs render:
   - Overview
   - Customers
   - Usage
   - Jobs
   - Webhooks
   - Errors
   - Billing
   - Exports
   - Runbooks

### Test Support Autopilot

1. Navigate to any page
2. Use "Report an Issue" component
3. Submit a test ticket
4. Verify ticket appears in `/console/support`
5. Verify auto-triage results

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] All integrity checks pass locally
- [ ] GitHub branch protection configured
- [ ] Vercel settings match `vercel.json`
- [ ] Ops dashboard accessible
- [ ] Support autopilot working
- [ ] CI runs all checks successfully

## Troubleshooting

### Migration Fails

**Error:** `supabase: command not found`
**Solution:** Install Supabase CLI (see Step 1)

**Error:** `relation already exists`
**Solution:** Migration already applied, safe to ignore

### Integrity Check Fails

**Error:** Missing package.json in non-JS packages
**Solution:** Already fixed in script - non-JS packages are skipped

**Error:** Script references missing file
**Solution:** Check script path and ensure file exists

### CI Fails

**Error:** Required check not found
**Solution:** Ensure GitHub Actions workflow is up to date

**Error:** Branch protection blocking merge
**Solution:** Verify all required checks are passing

### Vercel Build Fails

**Error:** Build command not found
**Solution:** Verify `vercel.json` matches Vercel dashboard settings

**Error:** Output directory not found
**Solution:** Ensure build completes successfully before deployment

## Next Steps

After completing setup:

1. ✅ Run all tests locally
2. ✅ Create a test PR
3. ✅ Verify CI passes
4. ✅ Merge to main
5. ✅ Verify Vercel deployment succeeds
6. ✅ Test ops dashboard in production

---

**Status:** Ready for setup
