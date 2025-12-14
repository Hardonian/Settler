# Supabase AI Verification Prompt - Settler Platform

## Complete Database & Infrastructure Verification Request

Please verify the entire Settler platform Supabase setup including database schema, migrations, edge functions, RLS policies, indexes, security configurations, and all integrations. This is a comprehensive multi-tenant reconciliation platform with billing, receipts API, feature flags, webhooks, autonomous agents, and monitoring systems.

---

## 1. DATABASE SCHEMA VERIFICATION

### Core Tables & Relationships
Verify all tables exist with correct structure, constraints, indexes, and foreign keys:

**Multi-Tenancy Foundation:**
- `tenants` - Multi-tenant organization structure with quotas, config, tier, status
- `users` - User accounts linked to tenants with roles, email, password_hash
- `api_keys` - API key management with scopes, rate limits, IP whitelisting, revocation
- `tenant_quota_usage` - Real-time quota tracking (storage, concurrent jobs, monthly reconciliations)

**Billing Infrastructure:**
- `billing_accounts` - Stripe customer linkage, email, address, tax_id, currency, status
- `subscriptions` - Stripe subscription tracking with plan_id, plan_name, status, trial periods, cancellation
- `stripe_events` - Webhook event processing with eventId, type, status, rawPayload
- `add_ons` - Integration add-ons (tiktok-shop, wix-stores, ga4-deep-sync, paypal-payouts, whatsapp-telegram) with pricing
- `add_on_purchases` - Add-on subscriptions linked to billing accounts
- `usage_events` - Granular usage tracking (eventType, integrationId, quantity, unit, timestamp)
- `usage_aggregate_daily` - Daily aggregated usage for billing calculations
- `usage_counters` - Period-based counters (daily/monthly) for service limits (reconcile, receipts, featureFlags, playground)

**Reconciliation Core Engine:**
- `recon_jobs` - Job definitions with source/target adapters, encrypted configs, mapping templates, transform recipes, validation rules, cron schedules
- `recon_results` - Execution results with match/unmatch counts, amounts, confidence scores, duration, errors
- `recon_templates` - Reusable job templates with matching/validation/transform rules
- `recon_audits` - Audit trail for all reconciliation operations
- `mapping_templates` - Field mapping schemas between source and target systems
- `validation_rules` - Reusable validation rules with severity levels
- `transform_recipes` - Data transformation pipelines
- `contract_versions` - Schema contract versioning with breaking changes tracking
- `drift_events` - Schema drift detection and auto-repair tracking
- `workflow_runs` - Workflow execution tracking

**Receipts API:**
- `receipt_uploads` - Upload tracking with storage location, mime type, size, status
- `receipts` - Parsed receipt data (vendor, date, currency, totals, payment method, confidence score)
- `receipt_items` - Line items with quantity, unit price, line total, category

**Feature Flags API:**
- `feature_flags` - Flag definitions with type (boolean/string/number), defaultValue, isGlobal
- `feature_flag_environments` - Environment-specific flag states (production/staging/development)
- `feature_flag_overrides` - User/tenant/segment-specific overrides with expiration

**Multi-Tenant Site Builder:**
- `tenant_branding` - Logo, colors, fonts, border radius, favicon
- `tenant_navigation` - Nav items and footer items JSON structures
- `tenant_pages` - Page content with blocks JSON, SEO fields, draft status, schema version
- `tenant_page_revisions` - Version history with snapshots, approval workflow

**A/B Testing:**
- `experiments` - Experiment definitions with traffic split, primary metric, status, date ranges
- `experiment_variants` - Variant configurations with blocks overrides
- `experiment_metric_events` - Event tracking (view, click, conversion, custom)

**Webhooks:**
- `webhooks` - Webhook endpoints with events array, secret, status, URL
- `webhook_deliveries` - Delivery tracking with retry logic, status codes, error messages

**Integration Credentials:**
- `integration_credentials` - Encrypted credentials for Stripe, Shopify, TikTok, PayPal, etc. with encryption metadata

**CRM & Analytics:**
- `leads` - Lead tracking with source, status, score, metadata
- `lead_scores` - Scoring history and factors
- `financial_ledger` - Financial transaction ledger
- `analytics_events` - Event tracking for user behavior
- `onboarding_progress` - User onboarding state machine

**Monitoring & Alerting:**
- `health_checks` - System health check results
- `diagnostics` - Diagnostic data collection
- `alerts` - Alert definitions and states
- `error_logs` - Error logging with severity, context, stack traces
- `audit_logs` - Comprehensive audit trail for all operations

**Autonomous Agents:**
- `agent_jobs` - Agent job definitions and schedules
- `agent_executions` - Execution history and results
- `agent_cron_jobs` - Scheduled agent tasks

**Support System:**
- `support_tickets` - Customer support ticket tracking
- `support_interactions` - Interaction history

**User Lifecycle:**
- `user_lifecycle_events` - Lifecycle event tracking
- `email_automation` - Email automation triggers and states

**Shareable Artifacts:**
- `shareable_artifacts` - Shareable links for receipts, reconciliations, etc.

**Idempotency:**
- `idempotency_keys` - Request idempotency tracking with expiration

### Verify All Indexes
Check that all performance-critical indexes exist:
- Foreign key indexes on all relationship columns
- Composite indexes for common query patterns (tenant_id + status, billing_account_id + eventType + timestamp)
- Unique constraints on business keys (slug, email, stripe_customer_id, eventId)
- GIN indexes on JSONB columns used in queries
- Date range indexes for time-series queries
- Status/enum indexes for filtering

### Verify All Constraints
- Primary keys on all tables
- Foreign key constraints with proper CASCADE/SET NULL behavior
- Unique constraints on business keys
- Check constraints for enum values
- NOT NULL constraints on required fields
- Default values for status fields, timestamps, JSONB defaults

---

## 2. ROW LEVEL SECURITY (RLS) POLICIES VERIFICATION

Verify RLS is enabled and policies exist for all tables:

**Tenant Isolation:**
- All tables must enforce tenant isolation via `tenant_id` checks
- Users can only access data for their tenant
- Service role bypasses RLS for system operations

**Billing Security:**
- Users can only access their own billing accounts
- Billing account creation requires authentication
- Usage events are tenant-scoped
- Stripe events are accessible only to account owners

**Reconciliation Security:**
- Recon jobs are tenant-scoped
- Results are only accessible to job owners
- Templates respect isPublic/isSystem flags
- Audit logs are tenant-scoped

**API Key Security:**
- API keys are user-scoped
- Revoked keys cannot be used
- Expired keys are blocked

**Receipts API Security:**
- Receipts are scoped to billing account or API key
- Uploads require valid API key or billing account

**Feature Flags Security:**
- Flags are scoped to billing account or project
- Global flags are readable by all authenticated users
- Overrides are scoped to flag + environment

**Webhook Security:**
- Webhooks are tenant-scoped
- Secret verification for webhook deliveries
- Only webhook owners can view delivery history

**Integration Credentials Security:**
- Credentials are encrypted at rest
- Only tenant owners can access their credentials
- Decryption requires proper authentication

**Audit Log Security:**
- Audit logs are tenant-scoped
- Users can only view logs for their tenant
- System operations are logged with service role

**Multi-Tenant Site Builder Security:**
- Pages are tenant-scoped
- Only tenant admins can edit pages
- Public pages are readable by all
- Experiments are tenant-scoped

Verify that:
- RLS is enabled on ALL tables
- Policies use `auth.uid()` or `auth.jwt()` for user identification
- Tenant isolation is enforced consistently
- Service role can bypass RLS when needed
- Policies handle soft deletes (deleted_at IS NULL checks)

---

## 3. DATABASE FUNCTIONS & TRIGGERS VERIFICATION

Verify all PostgreSQL functions exist and work correctly:

**Billing Functions:**
- `create_billing_account(user_id, email, ...)` - Creates billing account and links to Stripe
- `create_subscription(billing_account_id, stripe_subscription_id, ...)` - Creates subscription record
- `update_subscription_status(stripe_subscription_id, status)` - Updates subscription status
- `log_usage_event(billing_account_id, event_type, quantity, ...)` - Logs usage event
- `aggregate_usage_daily()` - Aggregates daily usage (scheduled function)
- `get_usage_for_period(billing_account_id, start_date, end_date)` - Retrieves usage metrics
- `check_usage_limits(billing_account_id, service, period)` - Checks if usage exceeds limits
- `increment_usage_counter(billing_account_id, service, period)` - Increments usage counter
- `sync_usage_to_stripe(billing_account_id)` - Syncs usage to Stripe for metered billing

**Reconciliation Functions:**
- `create_recon_job(...)` - Creates reconciliation job
- `execute_recon_job(job_id)` - Executes reconciliation job
- `get_recon_results(job_id, filters)` - Retrieves reconciliation results
- `validate_recon_data(data, rules)` - Validates data against rules
- `transform_recon_data(data, recipe_id)` - Applies transformation recipe

**Tenant Functions:**
- `create_tenant(name, slug, ...)` - Creates new tenant
- `get_tenant_by_slug(slug)` - Retrieves tenant by slug
- `check_tenant_quota(tenant_id, resource_type)` - Checks quota availability
- `increment_tenant_quota(tenant_id, resource_type, amount)` - Increments quota usage
- `reset_tenant_quotas()` - Resets monthly quotas (scheduled)

**Utility Functions:**
- `generate_api_key()` - Generates secure API key
- `hash_api_key(key)` - Hashes API key for storage
- `verify_api_key(key_prefix, key_hash)` - Verifies API key
- `encrypt_credential(plaintext, tenant_id)` - Encrypts integration credentials
- `decrypt_credential(encrypted_data, tenant_id)` - Decrypts integration credentials
- `get_user_activity_metrics(user_id, start_date, end_date)` - User activity analytics

**Trigger Functions:**
- `update_updated_at()` - Updates updated_at timestamp on row changes
- `audit_log_trigger()` - Creates audit log entries on data changes
- `validate_tenant_quota()` - Validates quota before operations
- `auto_create_billing_account()` - Auto-creates billing account on user signup
- `auto_provision_trial()` - Auto-provisions trial subscription
- `track_onboarding_progress()` - Tracks onboarding step completion
- `send_onboarding_email()` - Triggers onboarding emails
- `log_console_activity()` - Logs console user actions

Verify that:
- All functions have proper error handling
- Functions use SECURITY DEFINER where appropriate
- Functions validate input parameters
- Functions return consistent JSON structures
- Trigger functions are efficient and don't cause performance issues
- Scheduled functions (cron jobs) are properly configured

---

## 4. EDGE FUNCTIONS VERIFICATION

Verify all Supabase Edge Functions exist and are properly configured:

**Integration Sync Functions:**
- `integration-sync-stripe` - Syncs Stripe data and logs usage events
- `integration-sync-shopify` - Syncs Shopify orders and payments
- `integration-sync-shopify-secure` - Secure Shopify sync with credential encryption
- `integration-sync-paypal` - Syncs PayPal transactions
- `integration-sync-tiktok` - Syncs TikTok Shop orders and ads

**Billing Functions:**
- `compute-bill` - Computes billing based on usage
- `sync-usage-to-stripe` - Syncs usage metrics to Stripe for metered billing
- `trigger-upgrade-alert` - Triggers upgrade alerts for usage limits

**Usage Tracking:**
- `log-usage` - Logs usage events
- `log-usage-secure` - Secure usage logging with validation

**Autonomous Agents:**
- `agent-orchestrator` - Orchestrates agent execution
- `autonomous-cfo-agent` - CFO agent for financial insights
- `architecture-sentinel-agent` - Architecture monitoring agent
- `release-gatekeeper-agent` - Release safety checks
- `strategic-governor-agent` - Strategic decision agent
- `organic-growth-agent` - Growth optimization agent
- `preemptive-support-agent` - Proactive support agent
- `user-intent-synthesizer-agent` - User intent analysis

**Monitoring & Alerting:**
- `automated-health-checks` - Performs system health checks
- `automated-diagnostics` - Runs diagnostic checks
- `automated-alerting` - Sends alerts based on conditions
- `send-alert-notifications` - Delivers alert notifications

**Email Automation:**
- `automated-onboarding-emails` - Sends onboarding email sequences
- `send-exec-summary` - Sends executive summaries

**Reporting:**
- `generate-founder-digest` - Generates founder digest reports
- `generate-monthly-export` - Generates monthly data exports

Verify that:
- All functions have proper CORS headers
- Functions authenticate requests (JWT tokens)
- Functions handle errors gracefully
- Functions log operations for debugging
- Functions use environment variables for configuration
- Functions have proper TypeScript types
- Functions validate input data
- Functions return consistent response formats

---

## 5. MIGRATION VERIFICATION

Verify all 53 migrations execute successfully in order:

**Initial Schema (20251128193735):**
- Core tables: tenants, users, api_keys, tenant_quota_usage
- Extensions: uuid-ossp, pgcrypto
- Initial indexes and constraints

**Billing Schema (20250120000000):**
- billing_accounts, subscriptions, add_ons, add_on_purchases
- Standard and premium add-on seed data
- Usage tracking tables

**Billing Functions (20250120000001):**
- All billing-related PostgreSQL functions
- Usage aggregation functions
- Stripe sync functions

**Billing RLS Policies (20250120000002):**
- RLS policies for all billing tables
- Tenant isolation policies
- User access policies

**Billing Security Enhancements (20250120000003):**
- Encryption functions
- Security constraints
- Audit logging

**Integration Credentials Schema (20250120000004):**
- integration_credentials table
- Encryption/decryption functions

**Audit Logging Enhancements (20250120000005):**
- audit_logs table enhancements
- Audit trigger functions

**Monitoring & Alerting System (20250120000006):**
- health_checks, diagnostics, alerts tables
- Alerting functions

**AI Safety Layer (20250120000007):**
- AI safety constraints
- Rate limiting

**Recon Core Foundation (20250120000008):**
- recon_jobs, recon_results, recon_templates
- recon_audits, mapping_templates, validation_rules
- transform_recipes, contract_versions, drift_events
- workflow_runs

**Stripe Events Table (20250121000000):**
- stripe_events table for webhook processing

**Tenant System (20250121000000):**
- Tenant branding, navigation, pages
- Tenant page revisions

**Reconciliation Graph Tables (20251128193816):**
- Graph relationships for reconciliation

**RLS Policies (20251128193816):**
- Comprehensive RLS policies for all tables

**Functions and Triggers (20251128193816):**
- All utility functions and triggers

**CRM Schema (20251129000000):**
- leads, lead_scores tables

**Financial Ledger (20251129000001):**
- financial_ledger table

**Error Logs (20251129000002):**
- error_logs table

**Lead Scoring (20251129000003):**
- Lead scoring functions

**Ecosystem Schema (20251130000000):**
- Ecosystem-related tables

**Seed Demo Data (20251130000001):**
- Development seed data

**KPI RPC Function (20251130000002):**
- KPI calculation functions

**Edge AI Schema (20251201000000):**
- Edge AI related tables

**Onboarding Progress (20260115000000):**
- onboarding_progress table

**Alerts Table (20260115000001):**
- Alerts table structure

**Analytics Events (20260115000002):**
- analytics_events table

**Usage Tracking (20260115000003):**
- Usage tracking enhancements

**User Lifecycle Tracking (20260120000008):**
- user_lifecycle_events table

**Email Automation (20260120000009):**
- email_automation table

**Support System (20260120000010):**
- support_tickets, support_interactions

**Billing Disputes (20260120000011):**
- Billing dispute tracking

**Get User Activity Metrics (20260120000012):**
- User activity metrics function

**Webhook Models Update (20260120000013):**
- Webhook table enhancements

**Console RLS Fixes (20260125000000):**
- Console-specific RLS policy fixes

**Console Activity Logging (20260125000001):**
- Console activity logging

**Usage Counters (20260125000002):**
- usage_counters table

**Onboarding Audit (20260125000003):**
- Onboarding audit enhancements

**Console Complete Setup (20260126000000):**
- Complete console setup

**Automated Trial Provisioning (20260126000001):**
- Trial provisioning automation

**Automated Onboarding Triggers (20260126000002):**
- Onboarding trigger functions

**Health Checks Table (20260126000003):**
- health_checks table structure

**Diagnostics Table (20260126000004):**
- diagnostics table structure

**Alerts Table (20260126000005):**
- Alerts table updates

**Shareable Artifacts (20260126000006):**
- shareable_artifacts table

**Automated Offboarding (20260126000007):**
- Offboarding automation

**Autonomous Agents Schema (20260127000000):**
- agent_jobs, agent_executions tables

**Agent Cron Jobs (20260127000001):**
- Agent scheduling functions

**Missing RLS Policies (20260127000002):**
- Additional RLS policies

**Tenant Membership Helper (20260127000003):**
- Tenant membership utility functions

**Critical Indexes (20260127000004):**
- Performance-critical indexes

**Trial Subscription Fields (20250101000000):**
- Trial period fields on subscriptions

Verify that:
- All migrations execute without errors
- Migrations are idempotent (can be run multiple times)
- Migrations don't break existing data
- Foreign key constraints are created in correct order
- Indexes are created efficiently
- RLS policies don't block legitimate access
- Functions compile without errors
- Triggers don't cause infinite loops

---

## 6. SECURITY VERIFICATION

**Authentication & Authorization:**
- Supabase Auth is properly configured
- JWT tokens include tenant_id and user_id claims
- API keys are properly hashed (not stored in plaintext)
- Integration credentials are encrypted at rest
- Secrets are stored in environment variables, not in code

**Data Encryption:**
- Integration credentials use pgcrypto encryption
- API keys are hashed with bcrypt or similar
- Sensitive fields are encrypted (sourceConfigEncrypted, targetConfigEncrypted)
- Encryption keys are properly managed

**Access Control:**
- RLS policies enforce tenant isolation
- Users cannot access other tenants' data
- Service role is used only for system operations
- API keys respect scopes and rate limits
- Webhook secrets are properly validated

**Input Validation:**
- All user inputs are validated
- SQL injection prevention (parameterized queries)
- JSON schema validation for JSONB fields
- Enum validation for status fields
- Email format validation
- URL validation for webhooks

**Rate Limiting:**
- API rate limits are enforced per tenant
- Usage quotas are checked before operations
- Concurrent job limits are enforced
- Storage limits are checked

**Audit & Compliance:**
- All operations are logged in audit_logs
- User actions are tracked
- Data access is logged
- Compliance with data retention policies
- GDPR deletion support (soft deletes)

---

## 7. PERFORMANCE VERIFICATION

**Indexes:**
- All foreign keys have indexes
- Composite indexes for common query patterns
- GIN indexes on JSONB columns used in WHERE clauses
- Partial indexes for filtered queries (e.g., WHERE deleted_at IS NULL)
- Indexes on date columns for time-series queries

**Query Performance:**
- No N+1 query patterns
- Efficient joins with proper indexes
- Pagination implemented for large result sets
- Query timeouts configured
- Connection pooling enabled

**Function Performance:**
- Functions use efficient algorithms
- No unnecessary loops or recursive calls
- Proper use of indexes in function queries
- Functions are optimized for common use cases

**Storage:**
- JSONB columns are used efficiently
- Large text fields use appropriate data types
- Archive old data to prevent table bloat
- Vacuum and analyze jobs are scheduled

---

## 8. INTEGRATION VERIFICATION

**Stripe Integration:**
- Webhook endpoint receives Stripe events
- stripe_events table stores all events
- Subscription sync works correctly
- Usage-based billing syncs to Stripe
- Customer creation links properly

**Shopify Integration:**
- Order sync works correctly
- Payment reconciliation functions
- Webhook handling for Shopify events
- Credential encryption/decryption

**TikTok Integration:**
- TikTok Shop order sync
- TikTok Ads spend tracking
- Usage-based pricing calculation

**PayPal Integration:**
- PayPal transaction sync
- Payout reconciliation

**Email Integration:**
- Onboarding emails are sent
- Alert notifications work
- Executive summaries are delivered

**Webhook System:**
- Webhook delivery with retry logic
- HMAC signature verification
- Delivery status tracking
- Error handling and logging

---

## 9. MONITORING & ALERTING VERIFICATION

**Health Checks:**
- Health check functions execute successfully
- Health check results are stored
- Health check alerts are triggered on failures

**Diagnostics:**
- Diagnostic data is collected
- Diagnostic functions run on schedule
- Diagnostic results are accessible

**Alerts:**
- Alert definitions are stored correctly
- Alert conditions are evaluated
- Alert notifications are sent
- Alert states are tracked

**Error Logging:**
- Errors are logged with context
- Stack traces are captured
- Error severity is classified
- Error aggregation works

**Usage Tracking:**
- Usage events are logged correctly
- Daily aggregation runs successfully
- Usage counters are incremented
- Usage limits are enforced

---

## 10. AUTONOMOUS AGENTS VERIFICATION

**Agent Jobs:**
- Agent job definitions are stored
- Agent schedules are configured
- Agent executions are tracked
- Agent results are stored

**Agent Functions:**
- Agent orchestrator coordinates execution
- Individual agents execute successfully
- Agent errors are handled
- Agent logs are stored

**Cron Jobs:**
- Cron jobs are scheduled correctly
- Cron jobs execute on time
- Cron job failures are logged
- Cron job results are tracked

---

## 11. MULTI-TENANT SITE BUILDER VERIFICATION

**Tenant Branding:**
- Branding data is stored correctly
- Colors, fonts, logos are configurable
- Branding is applied to pages

**Tenant Navigation:**
- Navigation items are configurable
- Footer items are configurable
- Navigation structure is valid JSON

**Tenant Pages:**
- Pages are stored with blocks JSON
- SEO fields are stored correctly
- Draft/published states work
- Page revisions are tracked
- Page schema versioning works

**A/B Testing:**
- Experiments are created correctly
- Variants are configured
- Traffic splitting works
- Metric events are tracked
- Experiment results are calculated

---

## 12. DATA INTEGRITY VERIFICATION

**Foreign Key Constraints:**
- All foreign keys are properly defined
- CASCADE/SET NULL behavior is correct
- Orphaned records don't exist
- Referential integrity is maintained

**Unique Constraints:**
- Business keys are unique (slug, email, stripe_customer_id)
- Composite unique constraints work correctly
- Duplicate prevention is enforced

**Check Constraints:**
- Enum values are validated
- Range checks are enforced
- Format validations work

**Soft Deletes:**
- deleted_at columns are used consistently
- Soft-deleted records are excluded from queries
- Hard deletes are used only when appropriate

**Data Consistency:**
- No orphaned records
- No circular dependencies
- No invalid state transitions
- No data type mismatches

---

## 13. CONFIGURATION VERIFICATION

**Supabase Config (config.toml):**
- Project ID and name are set
- API is enabled on correct port
- Database is configured (PostgreSQL 15)
- Connection pooling is enabled
- Auth is configured with JWT expiry
- Storage is enabled with size limits
- Realtime is enabled

**Environment Variables:**
- All required env vars are set
- Stripe keys are configured
- Email service is configured
- Encryption keys are set
- API keys are stored securely

**Seed Data:**
- Default tenant is created
- Standard add-ons are seeded
- Demo data is available for development
- Seed data doesn't conflict with production

---

## 14. TESTING VERIFICATION

**Test Coverage:**
- Critical paths are tested
- Edge cases are handled
- Error scenarios are tested
- Integration tests pass

**Test Data:**
- Test data is isolated
- Test cleanup works
- Test fixtures are available

---

## VERIFICATION CHECKLIST

Please verify and report on:

- [ ] All 53 migrations execute successfully
- [ ] All tables exist with correct schema
- [ ] All indexes are created and optimized
- [ ] All foreign key constraints are in place
- [ ] All unique constraints are enforced
- [ ] RLS is enabled on all tables
- [ ] RLS policies enforce tenant isolation
- [ ] All PostgreSQL functions exist and work
- [ ] All triggers are configured correctly
- [ ] All edge functions are deployed
- [ ] Edge functions authenticate properly
- [ ] Edge functions handle errors gracefully
- [ ] Stripe integration works end-to-end
- [ ] Shopify integration works end-to-end
- [ ] Usage tracking is accurate
- [ ] Billing calculations are correct
- [ ] Webhook delivery works with retries
- [ ] Health checks execute successfully
- [ ] Alerts are triggered correctly
- [ ] Audit logging captures all operations
- [ ] Encryption/decryption works for credentials
- [ ] API key authentication works
- [ ] Multi-tenant isolation is enforced
- [ ] Performance is acceptable (indexes used)
- [ ] No security vulnerabilities
- [ ] Data integrity is maintained
- [ ] Configuration is correct
- [ ] Seed data is available

---

## EXPECTED OUTPUT

Please provide a comprehensive report covering:
1. **Schema Verification**: List all tables, confirm structure matches Prisma schema
2. **Migration Status**: Confirm all migrations executed successfully
3. **RLS Policy Coverage**: List all tables with RLS enabled and policy count
4. **Function Status**: List all functions and their compilation status
5. **Edge Function Status**: List all edge functions and deployment status
6. **Index Coverage**: List all indexes and confirm they're being used
7. **Security Assessment**: Identify any security gaps or vulnerabilities
8. **Performance Analysis**: Identify any missing indexes or slow queries
9. **Integration Status**: Confirm all integrations are configured correctly
10. **Data Integrity**: Confirm no orphaned records or constraint violations
11. **Recommendations**: Suggest any improvements or optimizations

---

## CRITICAL VERIFICATION POINTS

**Must Verify:**
1. Tenant isolation is enforced everywhere (no data leakage possible)
2. All sensitive data is encrypted (credentials, API keys)
3. RLS policies prevent unauthorized access
4. Foreign keys maintain referential integrity
5. Indexes exist for all performance-critical queries
6. Migrations are idempotent and reversible
7. Edge functions authenticate all requests
8. Usage tracking is accurate for billing
9. Webhook delivery has retry logic
10. Audit logging captures all operations

**Performance Critical:**
- Usage aggregation queries use proper indexes
- Tenant-scoped queries filter efficiently
- JSONB queries use GIN indexes
- Date range queries are optimized
- Pagination works correctly

**Security Critical:**
- No SQL injection vulnerabilities
- No unauthorized data access possible
- Encryption keys are secure
- API keys are properly hashed
- Webhook secrets are validated

---

Please run this comprehensive verification and provide a detailed report on all aspects of the Settler platform Supabase setup.
