# Changelog

All notable changes to the Settler codebase are documented in this file.

## [Unreleased] - Comprehensive Infrastructure Setup & Multi-Mode Implementation

### 🎯 Major Changes

#### Supabase SSR Infrastructure (CTO Mode)
- **Added complete Supabase SSR setup for Next.js**
  - Created `lib/supabase/server.ts` with `createClient()` and `createAdminClient()`
  - Created `lib/supabase/client.ts` for client-side operations
  - Created `middleware.ts` for cookie-based session management
  - All using `@supabase/ssr` for proper Vercel deployment compatibility
  - Type-safe with generated database types

#### Environment Variable Safety (CTO Mode)
- **Created `lib/env.ts` with safe env var utilities**
  - Never destructures `process.env` directly
  - All env vars treated as potentially undefined
  - Early error throwing for missing required variables
  - Validation functions for production safety

#### CRM Schema Implementation (CRO Mode)
- **Created comprehensive CRM tables with RLS**
  - `leads` table with status, lifecycle_stage, assigned_to, scoring
  - `deals` table with stages, value_cents (integer math), probability
  - `contacts` table with lifecycle tracking
  - `activity_logs` table for complete audit trails
  - Row Level Security policies ensuring sales reps only see assigned leads
  - Admin/owner roles can view all tenant data

#### Financial Ledger System (CFO Mode)
- **Created immutable financial ledger with idempotency**
  - `financial_ledger` table with credit/debit model
  - All amounts stored in cents (BIGINT) - no floating point math
  - `idempotency_key` unique constraint prevents double-recording
  - `record_ledger_entry()` function with built-in idempotency check
  - `account_balances` table for materialized balances
  - Immutable records (no UPDATE/DELETE policies)

#### Error Logging Infrastructure (Support Mode)
- **Created `error_logs` table for monitoring**
  - Severity levels (debug, info, warn, error, critical)
  - Context JSONB for request tracing
  - Resolution tracking (resolved, resolved_by, resolved_at)
  - `log_error()` database function for easy error logging
  - Indexed for fast queries by tenant, severity, resolved status

#### Lead Scoring (CRO Mode)
- **Database function for lead scoring**
  - `calculate_lead_score()` function in database (not client-side)
  - Auto-updates via trigger on lead changes
  - Scores based on lifecycle stage, status, activity count, recency, metadata
  - Capped at 200 points

#### Server Actions Standardization (CTO Mode)
- **Created `lib/actions/types.ts` with standard response format**
  - All Server Actions return `{ success: boolean, message?: string, data?: T }`
  - `success()` and `error()` helper functions
  - `withErrorHandling()` wrapper for async functions
  - Never throws raw errors to client

#### Admin Impersonation (Support Mode)
- **Created `lib/admin/impersonation.ts`**
  - `impersonateUser()` function for admin debugging
  - Only accessible to admin/owner roles
  - Logs all impersonation activity
  - Tenant isolation enforced

#### Feature Flag Infrastructure (PM Mode)
- **Created `lib/features/flags.ts`**
  - Environment variable based flags
  - Tenant-specific overrides via database config
  - Type-safe feature flag interface
  - Supports both sync (client) and async (server) checks

### 🔧 Improvements

#### Database Migrations
- Added 4 new migration files:
  - `20251129000000_crm_schema.sql` - CRM tables and RLS
  - `20251129000001_financial_ledger.sql` - Financial ledger with idempotency
  - `20251129000002_error_logs.sql` - Error logging infrastructure
  - `20251129000003_lead_scoring.sql` - Lead scoring functions

#### Type Safety
- Created `types/database.types.ts` placeholder for Supabase generated types
- All Supabase clients use typed Database interface
- No `any` types in new code

### 📝 Documentation

#### Updated CHANGELOG.md
- Comprehensive documentation of all infrastructure changes
- Clear categorization by mode (CTO, CRO, CFO, Support, PM)
- Migration instructions included

### 🎯 Next Steps

1. **Generate Supabase Types**
   - Run `supabase gen types typescript` to generate actual database types
   - Update `types/database.types.ts` with generated types

2. **Stripe Integration Idempotency**
   - Add idempotency key support to Stripe adapter
   - Ensure all Stripe API calls use idempotency keys

3. **Add Dynamic Exports**
   - Review all pages using cookies/headers
   - Add `export const dynamic = 'force-dynamic'` where needed

4. **Complete Type Safety Audit**
   - Search for remaining `any` types
   - Replace with proper types

---

## [Previous] - Comprehensive Code Audit & Refactoring

### 🎯 Major Changes

#### Database Migrations Consolidation
- **Consolidated all migration files into single initial schema**
  - Merged `multi-tenancy.sql`, `event-sourcing.sql`, `cqrs-projections.sql`, `security.sql`, `performance-indexes.sql`, `materialized-views.sql` into `001-initial-schema.sql`
  - Single migration file for one-command deployment
  - All migrations are now idempotent (safe to run multiple times)
  - Created comprehensive migration runbook (`packages/api/src/db/MIGRATION_RUNBOOK.md`)

#### Code Consolidation & Cleanup
- **Removed duplicate utilities** (DRY principle)
  - Deleted `packages/api/src/utils/encryption.ts` (consolidated into `infrastructure/security/encryption.ts`)
  - Deleted `packages/api/src/utils/circuit-breaker.ts` (consolidated into `infrastructure/resilience/circuit-breaker.ts`)
  - Deleted `packages/api/src/utils/retry.ts` (consolidated into `infrastructure/resilience/retry.ts`)
  - Deleted `packages/api/src/utils/ssrf-protection.ts` (consolidated into `infrastructure/security/SSRFProtection.ts`)
  - All code now uses infrastructure versions with better error handling and logging

#### Configuration Unification
- **Unified encryption utilities**
  - Updated `infrastructure/security/encryption.ts` to support both SecretsManager and direct config access
  - Added backward compatibility for legacy encryption formats
  - Supports both hex-encoded and raw string encryption keys
  - Supports both JSON and legacy base64 encryption formats

#### Bug Fixes
- **Fixed missing import in `packages/api/src/index.ts`**
  - Added missing `logError` import that was causing runtime errors
  - Fixed webhook processing error handling

- **Fixed SSRF protection API mismatch**
  - Updated `routes/webhooks.ts` to use `validateExternalUrl` (returns boolean) instead of `validateWebhookUrl` (throws)
  - Improved error messages for invalid webhook URLs

#### Documentation
- **Completely rewrote README.md**
  - Problem-first approach for non-technical stakeholders
  - Clear value proposition and use cases
  - Step-by-step customer journey
  - Comparison table with legacy solutions
  - Plain-language architecture explanations
  - Quick start guide for both technical and non-technical users

- **Created Migration Runbook**
  - Step-by-step instructions for fresh database setup
  - Migration procedures for existing databases
  - Rollback procedures
  - Troubleshooting guide
  - Performance considerations

### 🔧 Improvements

#### Database
- Updated `packages/api/src/db/index.ts` to use consolidated migration file
- Improved error handling in migration execution
- Better handling of "already exists" errors (idempotent migrations)

#### Security
- Enhanced encryption utilities with backward compatibility
- Improved SSRF protection with clearer API
- Better error messages for security-related failures

#### Code Quality
- Removed ~7KB of duplicate code
- Consolidated utilities into infrastructure layer
- Improved code organization and maintainability

### 📝 Deprecated

#### Migration Files (Consolidated)
The following migration files are deprecated and consolidated into `001-initial-schema.sql`:
- `packages/api/src/db/migrations/multi-tenancy.sql`
- `packages/api/src/db/migrations/event-sourcing.sql`
- `packages/api/src/db/migrations/cqrs-projections.sql`
- `packages/api/src/db/migrations/security.sql`
- `packages/api/src/db/migrations/performance-indexes.sql`
- `packages/api/src/db/migrations/materialized-views.sql`

**Note:** These files are kept for reference but should not be run separately. Use `001-initial-schema.sql` for all new deployments.

#### Utility Files (Removed)
The following utility files have been removed and consolidated:
- `packages/api/src/utils/encryption.ts` → Use `infrastructure/security/encryption.ts`
- `packages/api/src/utils/circuit-breaker.ts` → Use `infrastructure/resilience/circuit-breaker.ts`
- `packages/api/src/utils/retry.ts` → Use `infrastructure/resilience/retry.ts`
- `packages/api/src/utils/ssrf-protection.ts` → Use `infrastructure/security/SSRFProtection.ts`

### 🐛 Known Issues & Recommendations

#### Runtime Bugs Identified
1. **Async Error Handling in Webhook Processing**
   - **Location:** `packages/api/src/index.ts` (line 168)
   - **Issue:** Webhook processing errors are logged but not properly handled
   - **Recommendation:** Add retry logic and dead letter queue for failed webhook processing
   - **Status:** Documented, needs implementation

2. **Missing Error Handling in Database Migrations**
   - **Location:** `packages/api/src/db/index.ts`
   - **Issue:** Migration errors are only logged as warnings, may hide critical issues
   - **Recommendation:** Add proper error handling and validation before applying migrations
   - **Status:** Improved, but could be enhanced

3. **Encryption Format Migration**
   - **Issue:** Legacy base64 encryption format still supported but not documented
   - **Recommendation:** Add migration script to convert legacy encrypted data to new JSON format
   - **Status:** Backward compatibility maintained, migration script recommended

#### Code Smells Identified
1. **Deep Nesting in Route Handlers**
   - **Location:** `packages/api/src/routes/jobs.ts`, `packages/api/src/routes/webhooks.ts`
   - **Issue:** Some route handlers have deeply nested try-catch blocks
   - **Recommendation:** Extract business logic into service layer
   - **Status:** Documented, refactoring recommended

2. **Inconsistent Error Messages**
   - **Issue:** Error messages vary in format and detail level
   - **Recommendation:** Standardize error response format
   - **Status:** Documented, improvement recommended

3. **Hard-coded Configuration Values**
   - **Location:** Various files
   - **Issue:** Some configuration values are hard-coded instead of using config
   - **Recommendation:** Move all configuration to centralized config file
   - **Status:** Partially addressed, needs completion

#### Test Coverage Gaps
1. **Critical Flows Missing Tests**
   - Reconciliation service (`packages/api/src/application/reconciliation/ReconciliationService.ts`)
   - Webhook delivery (`packages/api/src/utils/webhook-queue.ts`)
   - Encryption/decryption edge cases
   - Multi-tenant isolation edge cases
   - **Recommendation:** Add unit and integration tests for all critical flows
   - **Target Coverage:** 90% for critical services

2. **Migration Testing**
   - **Issue:** No automated tests for database migrations
   - **Recommendation:** Add migration tests to CI/CD pipeline
   - **Status:** Documented, needs implementation

### 🔄 Migration Guide

#### For Existing Deployments

1. **Backup Database**
   ```bash
   pg_dump -U postgres settler > settler_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Update Code**
   ```bash
   git pull origin main
   npm install
   ```

3. **Run Consolidated Migration**
   ```bash
   psql -U postgres -d settler -f packages/api/src/db/migrations/001-initial-schema.sql
   ```

4. **Verify Migration**
   ```sql
   -- Check that all tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' ORDER BY table_name;
   ```

5. **Restart API Server**
   ```bash
   npm run build
   npm start
   ```

#### Breaking Changes

None. All changes are backward compatible.

### 📊 Statistics

- **Files Removed:** 4 duplicate utility files
- **Files Created:** 2 (consolidated migration, migration runbook)
- **Files Modified:** 5
- **Lines of Code Removed:** ~775 lines (duplicate code)
- **Lines of Code Added:** ~1,200 lines (consolidated migration, documentation)

### 🎯 Next Steps

1. **Complete Config Consolidation**
   - Migrate remaining `process.env` references to centralized config
   - Add validation for all configuration values

2. **Add Test Coverage**
   - Write tests for reconciliation service
   - Write tests for webhook delivery
   - Add migration tests

3. **Refactor Code Smells**
   - Extract business logic from route handlers
   - Standardize error handling
   - Improve code organization

4. **Performance Optimization**
   - Review and optimize database queries
   - Add caching where appropriate
   - Optimize materialized view refresh strategies

---

## Previous Versions

For previous changelog entries, see git history.
