# Production Parity

**Last Updated:** 2025-12-24  
**Purpose:** Document what "must match" between local/CI/Vercel

## Node Version Parity

### Requirement
- **Node.js**: `>=24.0.0` (as specified in `package.json` engines)

### Enforcement Points

1. **Local Development**
   - `.nvmrc` file specifies `24`
   - Boot-time check: `packages/web/src/lib/env/node-version-check.ts`
   - Call `requireNodeVersion()` at app startup

2. **CI (GitHub Actions)**
   - All workflows use `node-version: '24'` in `setup-node@v4`
   - `.nvmrc` file exists for consistency

3. **Vercel**
   - `vercel.json` specifies `"nodeVersion": "24.x"`
   - Project settings should also pin Node 24

### Verification

Run: `npm run qa:reality` - includes Node version check

## Environment Variables

### Required for Production
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY` (for billing)
- `STRIPE_WEBHOOK_SECRET` (for webhooks)

### Validation
- `packages/web/src/lib/env/validator.ts` - Validates Supabase env
- Console layout shows friendly error if env missing (no 500)

### Graceful Degradation
- Missing env → Show "temporarily unavailable" page
- Never return 500 for missing env in user routes
- Admin/internal routes can fail hard (expected)

## Build Parity

### Local Build
```bash
npm run build
```

### CI Build
- Same command: `npm run build`
- Verifies artifacts: `packages/web/.next`, `packages/api/dist`

### Vercel Build
- Uses `vercel.json` buildCommand: `npm run build`
- Should produce same artifacts

### Verification
- `npm run vercel:parity` - Compares local vs Vercel build

## Database Schema Parity

### Local
- Prisma schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`

### Production
- Supabase schema should match Prisma schema
- Migrations applied in order

### Verification
- `npm run verify:schema` - Introspects production schema
- `npm run verify:production-parity` - Full parity check

## Runtime Parity

### Local
- Node.js runtime (not Edge)
- Prisma binary engine

### Vercel
- `vercel.json` specifies `nodejs` runtime
- API routes use `export const runtime = 'nodejs'`

### Verification
- Check for Edge runtime usage (should be minimal)
- Verify Prisma works in Vercel environment

## One-Button Verification

Run: `npm run qa:reality`

This runs:
1. Typecheck + lint + tests
2. Build
3. Smoke tests (if env available)
4. Billing validation (if Stripe keys available)

## Known Gaps

1. **Node version boot check** - Not yet called at app startup (TODO)
2. **Stripe env validation** - Only webhook validates, user routes don't
3. **Schema drift detection** - Manual process, not automated

## Next Steps

1. Add `requireNodeVersion()` call in app startup
2. Add Stripe env validation to user routes (graceful degradation)
3. Automate schema drift detection in CI
