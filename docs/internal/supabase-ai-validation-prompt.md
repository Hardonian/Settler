# Supabase AI Validation Prompt

**Purpose:** Comprehensive validation and verification of Supabase database schema, policies, and configuration  
**Target:** Supabase AI Assistant / Database Validation  
**Last Updated:** 2026-01-28  
**Classification:** Internal - Technical

---

## Context & Business Strategy

**Settler** is a reconciliation-as-a-service platform for modern businesses. We provide a multi-tenant SaaS platform that automates financial reconciliation across Stripe, Shopify, QuickBooks, and 50+ platforms.

### Key Business Requirements:
- **Multi-tenant architecture** with strict tenant isolation
- **Billing infrastructure** supporting subscriptions, usage tracking, and Stripe integration
- **Reconciliation engine** with jobs, results, templates, and audit trails
- **Console APIs** for receipts parsing and feature flags
- **Tenant site builder** with pages, branding, and A/B testing
- **Autonomous agents** for automated operations
- **90-day survival features** for data retention and recovery

### Current State:
- **62 migration files** in `/supabase/migrations/`
- **136+ tables** across multiple domains
- **37 Prisma models** that must have corresponding Supabase tables
- **110+ database functions**
- **50+ tables with RLS policies**

---

## Validation Task

You are tasked with **comprehensively validating** the Supabase database schema, ensuring:

1. ✅ **All schema tables exist** and match Prisma models
2. ✅ **All RLS policies are created** and properly configured
3. ✅ **All foreign key relationships** are correct
4. ✅ **All indexes** are present for performance
5. ✅ **All functions and triggers** are working
6. ✅ **Everything is connected** and ready for production
7. ✅ **Additions align** with current business strategy

---

## Phase 1: Schema Validation

### 1.1 Core Tables Verification

**Verify these core tables exist with correct structure:**

#### Multi-Tenant Foundation
- [ ] `tenants` - Must have: `id`, `slug`, `billing_account_id`, `primary_domain`, `custom_domain`, `name`, `is_active`, `metadata`
- [ ] `users` - Must have: `id`, `tenant_id`, `email`, relationship to `auth.users`
- [ ] `api_keys` - Must have: `id`, `user_id`, `tenant_id`, `key_prefix`, `key_hash`, `scopes`, `revoked_at`

#### Billing Infrastructure (9 tables)
- [ ] `billing_accounts` - Must have: `id`, `user_id`, `tenant_id`, `stripe_customer_id`, `stripe_account_id`, `email`, `status`, `currency`
- [ ] `subscriptions` - Must have: `id`, `billing_account_id`, `stripe_subscription_id`, `plan_id`, `status`, `current_period_start`, `current_period_end`, `trial_start`, `trial_end`
- [ ] `stripe_events` - Must have: `id`, `event_id` (unique), `type`, `status`, `received_at`, `processed_at`, `user_id`, `tenant_id`, `billing_account_id`, `raw_payload`
- [ ] `add_ons` - Must have: `id`, `integration_id` (unique), `name`, `category`, `base_price_monthly`, `usage_price_per_unit`, `is_active`, `is_standard`
- [ ] `add_on_purchases` - Must have: `id`, `billing_account_id`, `add_on_id`, `stripe_subscription_item_id`, `status`
- [ ] `usage_events` - Must have: `id`, `billing_account_id`, `event_type`, `integration_id`, `quantity`, `timestamp`, `aggregated`
- [ ] `usage_aggregate_daily` - Must have: `id`, `billing_account_id`, `date`, `event_type`, `total_quantity`, `event_count`
- [ ] `usage_counters` - Must have: `id`, `billing_account_id`, `service`, `period`, `period_start`, `count`, `limit`

#### Reconciliation Core Engine (9 tables)
- [ ] `recon_jobs` - Must have: `id`, `tenant_id`, `user_id`, `name`, `source_adapter`, `target_adapter`, `status`, `template_id`, `mapping_template_id`, `transform_recipe_id`
- [ ] `recon_results` - Must have: `id`, `recon_job_id`, `tenant_id`, `status`, `started_at`, `completed_at`, `matched_count`, `unmatched_source_count`, `unmatched_target_count`
- [ ] `recon_templates` - Must have: `id`, `tenant_id`, `name`, `recon_strategy`, `matching_rules`, `validation_rules`, `is_public`, `is_system`
- [ ] `recon_audits` - Must have: `id`, `recon_job_id`, `recon_result_id`, `tenant_id`, `user_id`, `audit_type`, `action`, `created_at`
- [ ] `mapping_templates` - Must have: `id`, `tenant_id`, `name`, `source_schema`, `target_schema`, `field_mappings`, `is_public`
- [ ] `validation_rules` - Must have: `id`, `tenant_id`, `name`, `rule_type`, `rule_config`, `severity`, `is_active`
- [ ] `transform_recipes` - Must have: `id`, `tenant_id`, `name`, `recipe_type`, `input_schema`, `output_schema`, `transformation_steps`
- [ ] `contract_versions` - Must have: `id`, `tenant_id`, `contract_name`, `version`, `schema_definition`, `is_active`
- [ ] `drift_events` - Must have: `id`, `tenant_id`, `contract_version_id`, `drift_type`, `severity`, `acknowledged`
- [ ] `workflow_runs` - Must have: `id`, `tenant_id`, `workflow_id`, `status`, `started_at`, `completed_at`

#### Console APIs (6 tables)
- [ ] `receipt_uploads` - Must have: `id`, `api_key_id`, `billing_account_id`, `storage_location`, `status`, `error_message`
- [ ] `receipts` - Must have: `id`, `upload_id` (unique), `vendor`, `date`, `total`, `currency`, `confidence_score`
- [ ] `receipt_items` - Must have: `id`, `receipt_id`, `name`, `quantity`, `unit_price`, `line_total`
- [ ] `feature_flags` - Must have: `id`, `billing_account_id`, `project_id`, `key` (unique per account+project), `name`, `type`, `is_global`, `default_value`
- [ ] `feature_flag_environments` - Must have: `id`, `flag_id`, `environment`, `enabled`, `variant`
- [ ] `feature_flag_overrides` - Must have: `id`, `flag_id`, `environment`, `target_key`, `target_type`, `value`, `expires_at`

#### Tenant Site Builder (6 tables)
- [ ] `tenant_branding` - Must have: `id`, `tenant_id` (unique), `logo_url`, `primary_color`, `secondary_color`, `font_family_primary`
- [ ] `tenant_navigation` - Must have: `id`, `tenant_id` (unique), `nav_items`, `footer_items`
- [ ] `tenant_pages` - Must have: `id`, `tenant_id`, `slug` (unique per tenant), `page_type`, `blocks`, `seo_title`, `is_draft`
- [ ] `tenant_page_revisions` - Must have: `id`, `tenant_page_id`, `editor_user_id`, `snapshot`, `approved_by_user_id`, `approved_at`
- [ ] `experiments` - Must have: `id`, `tenant_id`, `target_page_id`, `name`, `slug`, `status`, `traffic_split`, `primary_metric`
- [ ] `experiment_variants` - Must have: `id`, `experiment_id`, `key`, `label`, `blocks_override`
- [ ] `experiment_metric_events` - Must have: `id`, `experiment_id`, `variant_key`, `tenant_id`, `event_type`, `session_id`, `user_id`

#### Webhooks & Idempotency (3 tables)
- [ ] `webhooks` - Must have: `id`, `user_id`, `tenant_id`, `url`, `events`, `secret`, `status`
- [ ] `webhook_deliveries` - Must have: `id`, `webhook_id`, `url`, `payload`, `status`, `status_code`, `attempts`, `next_retry_at`
- [ ] `idempotency_keys` - Must have: `id`, `key` (unique), `status`, `response`, `created_at`, `expires_at`

#### Additional Tables (98+ tables)
Verify these operational tables exist:
- [ ] `onboarding_progress` - User onboarding tracking
- [ ] `audit_logs` - System audit trail
- [ ] `alerts` - Alert management
- [ ] `health_checks` - Health check results
- [ ] `diagnostics` - Diagnostic data
- [ ] `error_logs` - Error logging
- [ ] `integration_credentials` - Encrypted integration credentials
- [ ] `leads`, `contacts`, `deals` - CRM tables
- [ ] `financial_ledger`, `account_balances` - Financial tracking
- [ ] `edge_nodes`, `edge_jobs` - Edge AI infrastructure
- [ ] `agent_runs` - Autonomous agent execution
- [ ] `support_tickets`, `ticket_messages` - Support system
- [ ] All other tables from migrations

### 1.2 Foreign Key Relationships

**Verify all foreign keys are correctly defined:**

#### Billing Relationships
- [ ] `subscriptions.billing_account_id` → `billing_accounts.id` (CASCADE)
- [ ] `add_on_purchases.billing_account_id` → `billing_accounts.id` (CASCADE)
- [ ] `add_on_purchases.add_on_id` → `add_ons.id` (RESTRICT)
- [ ] `usage_events.billing_account_id` → `billing_accounts.id` (CASCADE)
- [ ] `usage_aggregate_daily.billing_account_id` → `billing_accounts.id` (CASCADE)
- [ ] `usage_counters.billing_account_id` → `billing_accounts.id` (CASCADE)
- [ ] `tenants.billing_account_id` → `billing_accounts.id` (SET NULL)

#### Recon Relationships
- [ ] `recon_jobs.tenant_id` → `tenants.id` (CASCADE)
- [ ] `recon_jobs.template_id` → `recon_templates.id` (SET NULL)
- [ ] `recon_jobs.mapping_template_id` → `mapping_templates.id` (SET NULL)
- [ ] `recon_jobs.transform_recipe_id` → `transform_recipes.id` (SET NULL)
- [ ] `recon_results.recon_job_id` → `recon_jobs.id` (CASCADE)
- [ ] `recon_audits.recon_job_id` → `recon_jobs.id` (CASCADE)
- [ ] `recon_audits.recon_result_id` → `recon_results.id` (CASCADE)
- [ ] `drift_events.contract_version_id` → `contract_versions.id` (SET NULL)

#### Console Relationships
- [ ] `receipts.upload_id` → `receipt_uploads.id` (CASCADE)
- [ ] `receipt_items.receipt_id` → `receipts.id` (CASCADE)
- [ ] `feature_flag_environments.flag_id` → `feature_flags.id` (CASCADE)
- [ ] `feature_flag_overrides.flag_id` → `feature_flags.id` (CASCADE)

#### Tenant Builder Relationships
- [ ] `tenant_branding.tenant_id` → `tenants.id` (CASCADE)
- [ ] `tenant_navigation.tenant_id` → `tenants.id` (CASCADE)
- [ ] `tenant_pages.tenant_id` → `tenants.id` (CASCADE)
- [ ] `tenant_page_revisions.tenant_page_id` → `tenant_pages.id` (CASCADE)
- [ ] `experiments.tenant_id` → `tenants.id` (CASCADE)
- [ ] `experiments.target_page_id` → `tenant_pages.id` (CASCADE)
- [ ] `experiment_variants.experiment_id` → `experiments.id` (CASCADE)
- [ ] `experiment_metric_events.experiment_id` → `experiments.id` (CASCADE)

#### Webhook Relationships
- [ ] `webhook_deliveries.webhook_id` → `webhooks.id` (CASCADE)

### 1.3 Indexes Verification

**Verify critical indexes exist for performance:**

#### Billing Indexes
- [ ] `billing_accounts`: `user_id`, `tenant_id`, `stripe_customer_id`, `status`
- [ ] `subscriptions`: `billing_account_id`, `stripe_subscription_id`, `status`, `current_period_end`
- [ ] `stripe_events`: `event_id`, `type`, `status`, `received_at`, `user_id`, `tenant_id`, `billing_account_id`
- [ ] `usage_events`: `billing_account_id`, `event_type`, `timestamp`, `aggregated`, composite `(billing_account_id, event_type, timestamp)`
- [ ] `usage_aggregate_daily`: `billing_account_id`, `date`, `event_type`, unique `(billing_account_id, project_id, date, event_type, integration_id, add_on_id)`
- [ ] `usage_counters`: unique `(billing_account_id, service, period, period_start)`, `(billing_account_id, service, period)`

#### Recon Indexes
- [ ] `recon_jobs`: `tenant_id`, `user_id`, `status`, `template_id`
- [ ] `recon_results`: `recon_job_id`, `tenant_id`, `status`, `started_at DESC`
- [ ] `recon_audits`: `tenant_id`, `recon_job_id`, `recon_result_id`, `audit_type`, `created_at DESC`
- [ ] `contract_versions`: unique `(tenant_id, contract_name, version)`, `tenant_id`, `contract_name`, `is_active`
- [ ] `drift_events`: `tenant_id`, `recon_job_id`, `drift_type`, `severity`, `created_at DESC`, `acknowledged`

#### Console Indexes
- [ ] `receipt_uploads`: `api_key_id`, `billing_account_id`, `status`, `created_at`
- [ ] `receipts`: `upload_id`, `vendor`, `date`, `created_at`
- [ ] `feature_flags`: unique `(billing_account_id, project_id, key)`, `billing_account_id`, `project_id`, `key`, `is_global`
- [ ] `feature_flag_environments`: unique `(flag_id, environment)`, `flag_id`, `environment`, `enabled`
- [ ] `feature_flag_overrides`: unique `(flag_id, environment, target_key, target_type)`, `flag_id`, `expires_at`

#### Tenant Builder Indexes
- [ ] `tenant_pages`: unique `(tenant_id, slug)`, `tenant_id`, `slug`, `page_type`, `is_draft`
- [ ] `experiments`: unique `(tenant_id, slug)`, `tenant_id`, `target_page_id`, `status`, `starts_at`, `ends_at`

---

## Phase 2: Row-Level Security (RLS) Validation

### 2.1 RLS Enablement

**Verify RLS is enabled on all tenant-scoped tables:**

- [ ] `tenants` - RLS enabled
- [ ] `users` - RLS enabled
- [ ] `api_keys` - RLS enabled
- [ ] `billing_accounts` - RLS enabled
- [ ] `subscriptions` - RLS enabled
- [ ] `stripe_events` - RLS enabled
- [ ] `add_ons` - RLS enabled (if tenant-scoped) OR system-level access
- [ ] `add_on_purchases` - RLS enabled
- [ ] `usage_events` - RLS enabled
- [ ] `usage_aggregate_daily` - RLS enabled
- [ ] `usage_counters` - RLS enabled
- [ ] `recon_jobs` - RLS enabled
- [ ] `recon_results` - RLS enabled
- [ ] `recon_templates` - RLS enabled
- [ ] `recon_audits` - RLS enabled
- [ ] `mapping_templates` - RLS enabled
- [ ] `validation_rules` - RLS enabled
- [ ] `transform_recipes` - RLS enabled
- [ ] `contract_versions` - RLS enabled
- [ ] `drift_events` - RLS enabled
- [ ] `workflow_runs` - RLS enabled
- [ ] `receipt_uploads` - RLS enabled
- [ ] `receipts` - RLS enabled
- [ ] `receipt_items` - RLS enabled
- [ ] `feature_flags` - RLS enabled
- [ ] `feature_flag_environments` - RLS enabled
- [ ] `feature_flag_overrides` - RLS enabled
- [ ] `tenant_branding` - RLS enabled
- [ ] `tenant_navigation` - RLS enabled
- [ ] `tenant_pages` - RLS enabled
- [ ] `tenant_page_revisions` - RLS enabled
- [ ] `experiments` - RLS enabled
- [ ] `experiment_variants` - RLS enabled
- [ ] `experiment_metric_events` - RLS enabled
- [ ] `webhooks` - RLS enabled
- [ ] `webhook_deliveries` - RLS enabled
- [ ] `idempotency_keys` - RLS enabled (if tenant-scoped)
- [ ] `onboarding_progress` - RLS enabled
- [ ] `audit_logs` - RLS enabled
- [ ] All other tenant-scoped tables

### 2.2 RLS Policy Verification

**Verify policies use correct tenant isolation pattern:**

#### Required Helper Function
- [ ] `current_tenant_id()` function exists and works correctly
  - Checks JWT claims for `tenant_id`
  - Falls back to session variable `app.current_tenant_id`
  - Returns UUID or NULL

#### Policy Patterns

**For tenant-scoped tables, verify policies follow this pattern:**
```sql
CREATE POLICY tenant_isolation_<table_name> ON <table_name>
  FOR ALL USING (tenant_id = current_tenant_id());
```

**Verify policies exist for:**
- [ ] All tables with `tenant_id` column use `current_tenant_id()` pattern
- [ ] Tables with `billing_account_id` have policies checking tenant via billing account
- [ ] Tables with `user_id` have policies checking tenant via user
- [ ] Service role can bypass RLS (automatic in Supabase)

#### Special Cases

**Verify these special policies:**
- [ ] `add_ons` - If public/system templates, allow SELECT for all tenants
- [ ] `recon_templates` - If `is_public = true`, allow SELECT for all tenants
- [ ] `mapping_templates` - If `is_public = true`, allow SELECT for all tenants
- [ ] `validation_rules` - If `is_public = true`, allow SELECT for all tenants
- [ ] `transform_recipes` - If `is_public = true`, allow SELECT for all tenants

### 2.3 RLS Testing Requirements

**Verify these scenarios work:**
- [ ] User can only access their tenant's data
- [ ] User cannot access other tenants' data
- [ ] Service role bypasses RLS correctly
- [ ] `current_tenant_id()` works in all contexts (JWT, session variable)
- [ ] Public templates are accessible across tenants
- [ ] Billing account policies correctly isolate by tenant

---

## Phase 3: Functions & Triggers Validation

### 3.1 Core Functions

**Verify these functions exist and work:**

- [ ] `current_tenant_id()` - Returns current tenant UUID from JWT or session
- [ ] `get_kpi_health_status()` - KPI query function
- [ ] `log_error()` - Error logging helper
- [ ] `calculate_account_balance()` - Financial ledger helper
- [ ] `get_user_activity_metrics()` - User activity tracking
- [ ] All other functions from migrations

### 3.2 Trigger Functions

**Verify triggers exist for:**
- [ ] `updated_at` timestamp updates (on all tables with `updated_at`)
- [ ] Audit logging (if implemented)
- [ ] Usage aggregation (if implemented)
- [ ] Webhook delivery retries (if implemented)

### 3.3 Recommended Additional Functions

**Verify or create these functions for performance:**

- [ ] `get_reconciliation_summary(p_job_id UUID)` - Batch query to avoid N+1
- [ ] `get_tenant_usage(p_tenant_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)` - Usage aggregation
- [ ] `get_billing_account_summary(p_billing_account_id UUID)` - Billing summary

---

## Phase 4: Data Integrity & Constraints

### 4.1 Unique Constraints

**Verify unique constraints exist:**
- [ ] `tenants.slug` - Unique
- [ ] `tenants.billing_account_id` - Unique (one-to-one relationship)
- [ ] `billing_accounts.stripe_customer_id` - Unique
- [ ] `subscriptions.stripe_subscription_id` - Unique
- [ ] `stripe_events.event_id` - Unique
- [ ] `add_ons.integration_id` - Unique
- [ ] `add_on_purchases.stripe_subscription_item_id` - Unique
- [ ] `feature_flags(billing_account_id, project_id, key)` - Unique
- [ ] `feature_flag_environments(flag_id, environment)` - Unique
- [ ] `feature_flag_overrides(flag_id, environment, target_key, target_type)` - Unique
- [ ] `tenant_pages(tenant_id, slug)` - Unique
- [ ] `experiments(tenant_id, slug)` - Unique
- [ ] `experiment_variants(experiment_id, key)` - Unique
- [ ] `contract_versions(tenant_id, contract_name, version)` - Unique
- [ ] `usage_aggregate_daily(billing_account_id, project_id, date, event_type, integration_id, add_on_id)` - Unique
- [ ] `usage_counters(billing_account_id, service, period, period_start)` - Unique
- [ ] `idempotency_keys.key` - Unique
- [ ] `receipts.upload_id` - Unique

### 4.2 Check Constraints

**Verify check constraints:**
- [ ] `subscriptions.status` - Valid values: 'active', 'cancelled', 'past_due', 'trialing'
- [ ] `billing_accounts.status` - Valid values: 'active', 'suspended', 'cancelled'
- [ ] `billing_accounts.currency` - Valid currency codes
- [ ] `feature_flags.type` - Valid values: 'boolean', 'string', 'number'
- [ ] `experiments.status` - Valid values: 'draft', 'running', 'paused', 'completed'
- [ ] `recon_jobs.status` - Valid values
- [ ] `recon_results.status` - Valid values

### 4.3 Not Null Constraints

**Verify NOT NULL constraints:**
- [ ] All primary keys
- [ ] All foreign keys (unless explicitly nullable)
- [ ] Critical business fields (`name`, `email`, `status`, etc.)

---

## Phase 5: Supabase-Specific Features

### 5.1 Storage Buckets

**Verify storage buckets exist:**
- [ ] `exports` - For generated report exports (PDFs, CSVs)
- [ ] `uploads` - For user-uploaded files (CSV imports, receipts)
- [ ] `public-assets` - For public assets (logos, images)

**Verify storage policies:**
- [ ] RLS policies exist for `exports` bucket (tenant-scoped access)
- [ ] RLS policies exist for `uploads` bucket (tenant-scoped access)
- [ ] Public read access for `public-assets` bucket

### 5.2 Edge Functions

**Verify edge functions exist:**
- [ ] `webhook-retry` - Retry failed webhook deliveries
- [ ] `data-retention` - Cleanup old data
- [ ] `send-email` - Transactional emails
- [ ] `agent-monitor` - Agent monitoring
- [ ] `agent-orchestrator` - Agent orchestration
- [ ] `integration-sync-stripe` - Stripe sync
- [ ] `integration-sync-shopify` - Shopify sync
- [ ] `integration-sync-paypal` - PayPal sync
- [ ] `log-usage` - Usage logging
- [ ] All other edge functions from `/supabase/functions/`

### 5.3 Cron Jobs

**Verify cron jobs are configured:**
- [ ] Webhook retry processing (every 5 minutes)
- [ ] Data retention cleanup (daily at 2 AM UTC)
- [ ] Cache warming (hourly)
- [ ] Email digest (daily at 9 AM UTC)
- [ ] Agent cron jobs (as per agent schema)

### 5.4 Realtime Subscriptions

**Verify realtime is enabled for:**
- [ ] `recon_jobs` - For status updates
- [ ] `recon_results` - For progress updates
- [ ] `webhook_deliveries` - For delivery status
- [ ] `subscriptions` - For billing updates
- [ ] `alerts` - For alert notifications
- [ ] Other tables requiring live updates

---

## Phase 6: Alignment with Business Strategy

### 6.1 Multi-Tenant Architecture

**Verify multi-tenancy is properly implemented:**
- [ ] All tenant-scoped tables have `tenant_id` column
- [ ] RLS policies enforce tenant isolation
- [ ] `current_tenant_id()` function works correctly
- [ ] Tenant slug is unique and used for routing
- [ ] Tenant can have custom domain

### 6.2 Billing Infrastructure

**Verify billing supports business model:**
- [ ] Subscription tiers: Free, Starter ($29), Growth ($99), Scale ($299), Enterprise
- [ ] Usage tracking for reconciliations, API calls, etc.
- [ ] Stripe integration for payment processing
- [ ] Add-on purchases (TikTok, PayPal, etc.)
- [ ] Trial periods supported
- [ ] Usage counters for rate limiting

### 6.3 Reconciliation Engine

**Verify reconciliation features:**
- [ ] Jobs can be created with source/target adapters
- [ ] Templates for common reconciliation patterns
- [ ] Mapping templates for field transformations
- [ ] Validation rules for data quality
- [ ] Transform recipes for data transformation
- [ ] Contract versioning for schema management
- [ ] Drift detection for schema changes
- [ ] Audit trail for all operations

### 6.4 Console APIs

**Verify free developer tools:**
- [ ] Receipts API with upload, parse, and storage
- [ ] Feature Flags API with environments and overrides
- [ ] Usage tracking for API calls
- [ ] Rate limiting per billing account

### 6.5 Tenant Site Builder

**Verify white-label capabilities:**
- [ ] Tenant branding (logo, colors, fonts)
- [ ] Custom navigation and pages
- [ ] Page revisions and approval workflow
- [ ] A/B testing with experiments
- [ ] SEO fields (title, description, image)

### 6.6 Autonomous Agents

**Verify agent infrastructure:**
- [ ] Agent runs tracking
- [ ] Agent cron jobs
- [ ] Agent monitoring and alerting
- [ ] Automated provisioning/offboarding

### 6.7 90-Day Survival Features

**Verify survival features:**
- [ ] Data retention policies (90 days)
- [ ] Job recovery mechanisms
- [ ] Billing protection
- [ ] Support automation
- [ ] Trust protection
- [ ] External shock handling
- [ ] Drift detection
- [ ] Re-entry readiness

---

## Phase 7: Production Readiness

### 7.1 Migration Safety

**Verify migrations are safe:**
- [ ] All migrations are idempotent (use `IF NOT EXISTS`, `CREATE OR REPLACE`)
- [ ] Migrations can run in any order (no dependencies on data)
- [ ] Rollback procedures documented
- [ ] Migration order is correct (dependencies resolved)

### 7.2 Performance

**Verify performance optimizations:**
- [ ] Indexes exist for common query patterns
- [ ] Composite indexes for multi-column queries
- [ ] Partial indexes for filtered queries (if applicable)
- [ ] Connection pooling configured
- [ ] Query timeouts set appropriately

### 7.3 Monitoring & Observability

**Verify monitoring tables exist:**
- [ ] `alerts` - Alert management
- [ ] `health_checks` - Health check results
- [ ] `diagnostics` - Diagnostic data
- [ ] `error_logs` - Error logging
- [ ] `monitoring_metrics` - Metrics storage
- [ ] `audit_logs` - Audit trail

### 7.4 Security

**Verify security measures:**
- [ ] RLS enabled on all tenant-scoped tables
- [ ] API keys are hashed (not stored in plain text)
- [ ] Integration credentials are encrypted
- [ ] Secrets are not hardcoded
- [ ] Service role key is secure
- [ ] JWT expiration configured

---

## Phase 8: Gap Analysis & Missing Elements

### 8.1 Compare with Prisma Schema

**For each Prisma model, verify:**
- [ ] Table exists in Supabase
- [ ] All columns match Prisma schema
- [ ] Data types match (UUID, String, DateTime, Decimal, Json, etc.)
- [ ] Default values match
- [ ] Relationships match (foreign keys)
- [ ] Indexes match

**Prisma Models to Verify (37 total):**
1. BillingAccount
2. Subscription
3. StripeEvent
4. AddOn
5. AddOnPurchase
6. UsageEvent
7. UsageAggregateDaily
8. UsageCounter
9. ReconJob
10. ReconResult
11. ReconTemplate
12. ReconAudit
13. MappingTemplate
14. ValidationRule
15. TransformRecipe
16. ContractVersion
17. DriftEvent
18. WorkflowRun
19. ReceiptUpload
20. Receipt
21. ReceiptItem
22. FeatureFlag
23. FeatureFlagEnvironment
24. FeatureFlagOverride
25. Tenant
26. OnboardingProgress
27. AuditLog
28. TenantBranding
29. TenantNavigation
30. TenantPage
31. TenantPageRevision
32. Experiment
33. ExperimentVariant
34. ExperimentMetricEvent
35. Webhook
36. WebhookDelivery
37. IdempotencyKey

### 8.2 Missing Tables Check

**Verify these additional tables exist (from migrations):**
- [ ] All tables from `20250120000000_billing_schema.sql`
- [ ] All tables from `20251129000000_crm_schema.sql`
- [ ] All tables from `20251201000000_edge_ai_schema.sql`
- [ ] All tables from `20260127000000_autonomous_agents_schema.sql`
- [ ] All tables from `20251130000000_ecosystem_schema.sql`
- [ ] All tables from other migration files

### 8.3 Missing Policies Check

**Verify RLS policies exist for:**
- [ ] All tenant-scoped tables
- [ ] All user-scoped tables
- [ ] Public/system tables have appropriate policies
- [ ] Service role operations are documented

### 8.4 Missing Functions Check

**Verify functions exist for:**
- [ ] All functions referenced in migrations
- [ ] All functions referenced in application code
- [ ] Performance-critical batch queries

---

## Phase 9: Connection & Integration Validation

### 9.1 Application Connection

**Verify application can connect:**
- [ ] Supabase URL is configured
- [ ] Supabase anon key is configured
- [ ] Supabase service role key is configured (for admin operations)
- [ ] Connection pooling is configured
- [ ] SSL/TLS is enabled

### 9.2 Auth Integration

**Verify Supabase Auth integration:**
- [ ] `auth.users` table exists (Supabase built-in)
- [ ] `users` table links to `auth.users` (via `id` or `email`)
- [ ] JWT includes `tenant_id` claim (or can be looked up)
- [ ] Sign-up flow creates both `auth.users` and `users` records
- [ ] Session management works correctly

### 9.3 API Integration

**Verify API endpoints can access:**
- [ ] All tables via Supabase client
- [ ] RLS policies allow API access
- [ ] Service role can bypass RLS when needed
- [ ] Edge functions can access database

---

## Phase 10: Final Validation Checklist

### 10.1 Comprehensive Check

- [ ] **All 37 Prisma models** have corresponding Supabase tables
- [ ] **All 136+ tables** from migrations exist
- [ ] **All RLS policies** are created and working
- [ ] **All foreign keys** are correctly defined
- [ ] **All indexes** are present for performance
- [ ] **All functions** exist and work
- [ ] **All triggers** are configured
- [ ] **All constraints** (unique, check, not null) are defined
- [ ] **Storage buckets** are configured with policies
- [ ] **Edge functions** are deployed
- [ ] **Cron jobs** are scheduled
- [ ] **Realtime** is enabled for relevant tables
- [ ] **Everything is connected** and ready for production

### 10.2 Documentation

- [ ] Schema is documented
- [ ] RLS policies are documented
- [ ] Functions are documented
- [ ] Edge functions are documented
- [ ] Migration order is documented
- [ ] Rollback procedures are documented

### 10.3 Testing

- [ ] RLS policies are tested
- [ ] Foreign keys are tested
- [ ] Functions are tested
- [ ] Edge functions are tested
- [ ] Migrations are tested
- [ ] Performance is tested

---

## Expected Output

After running this validation, provide:

1. **Validation Report** with:
   - ✅ Passed checks
   - ❌ Failed checks
   - ⚠️ Warnings
   - 📝 Recommendations

2. **Missing Elements List**:
   - Tables that don't exist
   - Policies that are missing
   - Functions that are missing
   - Indexes that are missing
   - Constraints that are missing

3. **Fix Recommendations**:
   - SQL scripts to create missing tables
   - SQL scripts to create missing policies
   - SQL scripts to create missing indexes
   - Migration files for missing elements

4. **Alignment Report**:
   - How schema aligns with business strategy
   - Gaps in business requirements
   - Recommendations for improvements

---

## Usage Instructions

1. **Connect to Supabase** database (production or staging)
2. **Run validation queries** for each phase
3. **Compare results** with expected state
4. **Generate report** with findings
5. **Create migration files** for missing elements
6. **Test migrations** before applying to production

---

## Notes

- This validation should be run **before production deployment**
- Run validation on a **copy of production data** if possible
- **Document all findings** for future reference
- **Create migration files** for any missing elements
- **Test thoroughly** before applying to production

---

**End of Validation Prompt**
