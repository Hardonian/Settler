# Supabase Database Schema Audit Report

**Generated:** 2026-01-28  
**Total Migrations:** 62 files  
**Total Tables:** 136  
**Total Functions:** 110  
**Total Policies:** 50+ tables with RLS

## Executive Summary

All Prisma models (37) have corresponding SQL tables in Supabase migrations. The database schema is comprehensive but fragmented across 62 migration files. This report consolidates the schema and identifies any gaps.

## Prisma Model Coverage

✅ **All 37 Prisma models have SQL table equivalents:**
- BillingAccount → `billing_accounts`
- Subscription → `subscriptions`
- StripeEvent → `stripe_events`
- AddOn → `add_ons`
- AddOnPurchase → `add_on_purchases`
- UsageEvent → `usage_events`
- UsageAggregateDaily → `usage_aggregate_daily`
- UsageCounter → `usage_counters`
- ReconJob → `recon_jobs`
- ReconResult → `recon_results`
- ReconTemplate → `recon_templates`
- ReconAudit → `recon_audits`
- MappingTemplate → `mapping_templates`
- ValidationRule → `validation_rules`
- TransformRecipe → `transform_recipes`
- ContractVersion → `contract_versions`
- DriftEvent → `drift_events`
- WorkflowRun → `workflow_runs`
- ReceiptUpload → `receipt_uploads`
- Receipt → `receipts`
- ReceiptItem → `receipt_items`
- FeatureFlag → `feature_flags`
- FeatureFlagEnvironment → `feature_flag_environments`
- FeatureFlagOverride → `feature_flag_overrides`
- Tenant → `tenants`
- OnboardingProgress → `onboarding_progress`
- AuditLog → `audit_logs`
- TenantBranding → `tenant_branding`
- TenantNavigation → `tenant_navigation`
- TenantPage → `tenant_pages`
- TenantPageRevision → `tenant_page_revisions`
- Experiment → `experiments`
- ExperimentVariant → `experiment_variants`
- ExperimentMetricEvent → `experiment_metric_events`
- Webhook → `webhooks`
- WebhookDelivery → `webhook_deliveries`
- IdempotencyKey → `idempotency_keys`

## Supabase Built-in Tables

Supabase provides these by default (no migration needed):
- `auth.users` - User authentication (separate schema)
- `auth.sessions` - Session management
- `storage.*` - File storage buckets

**Note:** The `users` table in the `public` schema is a custom table, separate from `auth.users`.

## Additional Tables (Not in Prisma)

The database includes 98+ additional tables for operational features:

### Monitoring & Observability
- `alerts`, `alert_rules`, `alert_notifications`
- `health_checks`, `diagnostics`
- `error_logs`, `monitoring_metrics`
- `agent_runs`, `architecture_violations`

### Operational Features
- `api_keys`, `integration_credentials`
- `rate_limits`, `circuit_breakers`
- `security_events`, `blocked_ips`
- `revoked_tokens`

### CRM & Growth
- `leads`, `contacts`, `deals`
- `affiliates`, `referrals`
- `user_lifecycle`, `user_milestones`

### Support System
- `support_tickets`, `ticket_messages`
- `support_articles`, `support_categories`
- `canned_responses`, `escalation_rules`

### Advanced Features
- `edge_nodes`, `edge_jobs`, `edge_node_deployments`
- `ai_usage_events`, `ai_usage_quotas`
- `financial_ledger`, `account_balances`
- `experiments`, `experiment_variants`, `experiment_metric_events`

## Migration File Organization

Migrations are categorized by domain:

### Core (6 files)
- Initial schema, tenants, users, API keys
- Jobs, executions, matches, reports
- Webhooks, audit logs, security

### Billing (9 files)
- Billing accounts, subscriptions
- Add-ons, usage tracking
- Stripe integration

### Recon Core (3 files)
- Recon jobs, results, templates
- Mapping templates, validation rules
- Transform recipes, contract versions
- Drift detection, workflow runs

### Console (7 files)
- Receipts API (uploads, receipts, items)
- Feature Flags API
- Onboarding progress
- Console activity logging

### Tenant Builder (4 files)
- Tenant pages, branding, navigation
- Page revisions, experiments
- A/B testing

### Monitoring (6 files)
- Alerts, health checks
- Diagnostics, error logs
- Monitoring metrics

### Agents (5 files)
- Autonomous agents schema
- Agent runs, cron jobs
- Automated provisioning/offboarding

### Support (3 files)
- Support tickets, articles
- Email automation

### CRM (2 files)
- Leads, contacts, deals
- Lead scoring

### Other (21 files)
- Integration credentials
- Financial ledger
- Ecosystem schema
- Edge AI
- 90-day survival features

## Consolidation Strategy

**Recommended consolidated structure:**

1. **01-core-schema.sql** - Core tables (tenants, users, jobs, executions, etc.)
2. **02-billing-schema.sql** - Billing infrastructure
3. **03-recon-core-schema.sql** - Reconciliation engine
4. **04-console-schema.sql** - Receipts & Feature Flags APIs
5. **05-tenant-builder-schema.sql** - Multi-tenant site builder
6. **06-functions.sql** - All database functions
7. **07-rls-policies.sql** - All RLS policies
8. **08-indexes.sql** - Performance indexes (if separate)

## Missing Elements Check

### Required for Site Functionality

Based on codebase analysis, all required tables exist. However, verify:

1. **Tenant System Updates**
   - Ensure `tenants` table has `billing_account_id` column (from Prisma schema)
   - Ensure `tenants` table has `primary_domain` and `custom_domain` columns

2. **Billing Account Linkage**
   - Verify `billing_accounts` table has proper foreign key to `tenants`
   - Check `billing_accounts.user_id` references correct user table

3. **Stripe Events**
   - Ensure `stripe_events` table matches Prisma model exactly
   - Check for `event_id`, `type`, `status`, `received_at`, `processed_at` columns

4. **Webhook Deliveries**
   - Verify `webhook_deliveries` table structure matches Prisma model
   - Check for proper foreign key to `webhooks`

## Recommendations

1. **Consolidate migrations** into domain-specific files (see consolidation strategy above)
2. **Review RLS policies** to ensure all tables have proper tenant isolation
3. **Verify foreign keys** match Prisma schema relationships
4. **Check indexes** for performance-critical queries
5. **Document Supabase-specific features** (Edge Functions, Realtime subscriptions)

## Next Steps

1. Run consolidated SQL files against live database to verify no conflicts
2. Compare live database schema with migrations
3. Update Prisma schema if any discrepancies found
4. Document any Supabase-specific optimizations
