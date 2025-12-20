# Supabase AI Prompt: Complete Database Schema Creation

Use this prompt in Supabase AI Chat to create all missing database schema elements for the Settler platform.

---

## Prompt

```
Create a complete PostgreSQL database schema for Settler, a multi-tenant reconciliation platform. The schema must include:

### 1. EXTENSIONS
- uuid-ossp
- pgcrypto
- vector (for AI features)

### 2. CORE TABLES

#### Tenants (Multi-tenancy foundation)
- id (UUID, primary key)
- billing_account_id (UUID, unique, nullable, references billing_accounts)
- slug (VARCHAR, unique, required)
- primary_domain (VARCHAR, nullable)
- custom_domain (VARCHAR, nullable)
- name (VARCHAR, required)
- is_active (BOOLEAN, default true)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

#### Users (Custom users table - separate from auth.users)
- id (UUID, primary key)
- tenant_id (UUID, references tenants)
- email (VARCHAR, required, unique per tenant)
- password_hash (VARCHAR)
- name (VARCHAR)
- role (VARCHAR, default 'developer')
- data_residency_region (VARCHAR, default 'us')
- data_retention_days (INTEGER, default 365)
- deleted_at (TIMESTAMPTZ, nullable)
- created_at, updated_at (TIMESTAMPTZ)

#### API Keys
- id (UUID, primary key)
- user_id (UUID, references users)
- tenant_id (UUID, references tenants)
- key_prefix (VARCHAR, required)
- key_hash (VARCHAR, required)
- name (VARCHAR)
- scopes (TEXT[])
- rate_limit (INTEGER, default 1000)
- ip_whitelist (TEXT[])
- revoked_at (TIMESTAMPTZ, nullable)
- expires_at (TIMESTAMPTZ, nullable)
- last_used_at (TIMESTAMPTZ, nullable)
- created_at, updated_at (TIMESTAMPTZ)

### 3. BILLING TABLES

#### Billing Accounts
- id (UUID, primary key)
- user_id (UUID, required)
- tenant_id (UUID, references tenants, nullable)
- stripe_customer_id (VARCHAR, unique, nullable)
- stripe_account_id (VARCHAR, nullable)
- email (VARCHAR, required)
- name (VARCHAR, nullable)
- address (JSONB, nullable)
- tax_id (VARCHAR, nullable)
- currency (VARCHAR, default 'usd')
- status (VARCHAR, default 'active')
- metadata (JSONB, default {})
- created_at, updated_at, deleted_at (TIMESTAMPTZ)

#### Subscriptions
- id (UUID, primary key)
- billing_account_id (UUID, references billing_accounts, cascade delete)
- stripe_subscription_id (VARCHAR, unique, nullable)
- stripe_price_id (VARCHAR, nullable)
- plan_id (VARCHAR, required)
- plan_name (VARCHAR, required)
- status (VARCHAR, required)
- current_period_start, current_period_end (TIMESTAMPTZ, required)
- cancel_at_period_end (BOOLEAN, default false)
- cancelled_at (TIMESTAMPTZ, nullable)
- trial_start, trial_end (TIMESTAMPTZ, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

#### Add-Ons
- id (UUID, primary key)
- integration_id (VARCHAR, unique, required)
- name (VARCHAR, required)
- description (TEXT, nullable)
- category (VARCHAR, required)
- base_price_monthly (DECIMAL(10,2), required)
- usage_price_per_unit (DECIMAL(10,6), nullable)
- usage_unit (VARCHAR, nullable)
- stripe_product_id, stripe_price_id (VARCHAR, nullable)
- is_active (BOOLEAN, default true)
- is_standard (BOOLEAN, default false)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

#### Add-On Purchases
- id (UUID, primary key)
- billing_account_id (UUID, references billing_accounts, cascade delete)
- add_on_id (UUID, references add_ons, cascade delete)
- stripe_subscription_item_id (VARCHAR, unique, nullable)
- status (VARCHAR, default 'active')
- purchased_at (TIMESTAMPTZ, default now)
- cancelled_at (TIMESTAMPTZ, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

#### Usage Events
- id (UUID, primary key)
- billing_account_id (UUID, references billing_accounts, cascade delete)
- project_id (UUID, nullable)
- user_id (UUID, nullable)
- tenant_id (UUID, references tenants, nullable)
- event_type (VARCHAR, required)
- integration_id (VARCHAR, nullable)
- add_on_id (UUID, references add_ons, nullable)
- quantity (DECIMAL(15,6), required)
- unit (VARCHAR, nullable)
- metadata (JSONB, default {})
- timestamp (TIMESTAMPTZ, default now)
- aggregated (BOOLEAN, default false)

#### Usage Aggregate Daily
- id (UUID, primary key)
- billing_account_id (UUID, references billing_accounts, cascade delete)
- project_id (UUID, nullable)
- tenant_id (UUID, references tenants, nullable)
- date (DATE, required)
- event_type (VARCHAR, required)
- integration_id (VARCHAR, nullable)
- add_on_id (UUID, references add_ons, nullable)
- total_quantity (DECIMAL(15,6), required)
- event_count (INTEGER, default 0)
- estimated_cost (DECIMAL(10,2), nullable)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(billing_account_id, project_id, date, event_type, integration_id, add_on_id)

#### Usage Counters
- id (UUID, primary key)
- billing_account_id (UUID, references billing_accounts, cascade delete)
- service (VARCHAR, required) -- 'reconcile', 'receipts', 'featureFlags', 'playground'
- period (VARCHAR, required) -- 'daily', 'monthly'
- period_start (DATE, required)
- count (INTEGER, default 0)
- limit (INTEGER, default 0)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(billing_account_id, service, period, period_start)

#### Stripe Events
- id (UUID, primary key)
- event_id (VARCHAR, unique, required) -- Stripe event.id
- type (VARCHAR, required)
- status (VARCHAR, default 'received') -- received, processed, failed
- received_at (TIMESTAMPTZ, default now)
- processed_at (TIMESTAMPTZ, nullable)
- error (TEXT, nullable)
- user_id (UUID, nullable)
- tenant_id (UUID, nullable)
- billing_account_id (UUID, nullable)
- raw_payload (JSONB, nullable)
- created_at, updated_at (TIMESTAMPTZ)

### 4. RECON CORE TABLES

#### Recon Jobs
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, required)
- user_id (UUID, references users, cascade delete, required)
- name (VARCHAR, required)
- description (TEXT, nullable)
- template_id (UUID, references recon_templates, nullable)
- source_adapter (VARCHAR, required)
- source_config_encrypted (TEXT, required)
- target_adapter (VARCHAR, required)
- target_config_encrypted (TEXT, required)
- mapping_template_id (UUID, references mapping_templates, nullable)
- transform_recipe_id (UUID, references transform_recipes, nullable)
- validation_rules (JSONB, default [])
- recon_strategy (VARCHAR, default 'deterministic')
- schedule_cron (VARCHAR, nullable)
- schedule_timezone (VARCHAR, default 'UTC')
- status (VARCHAR, default 'active')
- version (INTEGER, default 1)
- metadata (JSONB, default {})
- created_at, updated_at, deleted_at (TIMESTAMPTZ)

#### Recon Results
- id (UUID, primary key)
- recon_job_id (UUID, references recon_jobs, cascade delete, required)
- tenant_id (UUID, references tenants, cascade delete, required)
- execution_id (UUID, references executions, nullable)
- status (VARCHAR, default 'running')
- started_at (TIMESTAMPTZ, default now)
- completed_at (TIMESTAMPTZ, nullable)
- source_count, target_count, matched_count (INTEGER, default 0)
- unmatched_source_count, unmatched_target_count (INTEGER, default 0)
- conflict_count (INTEGER, default 0)
- total_amount_source, total_amount_target (DECIMAL(15,2), nullable)
- total_amount_matched, total_amount_unmatched (DECIMAL(15,2), nullable)
- currency (VARCHAR, nullable)
- confidence_avg, confidence_min, confidence_max (DECIMAL(5,4), nullable)
- duration_ms (BIGINT, nullable)
- error_message, error_stack (TEXT, nullable)
- summary, metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

#### Recon Templates
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, nullable)
- name (VARCHAR, required)
- description (TEXT, nullable)
- category (VARCHAR, nullable)
- source_adapter_type, target_adapter_type (VARCHAR, nullable)
- recon_strategy (VARCHAR, default 'deterministic')
- matching_rules, validation_rules, transform_rules (JSONB, default [])
- is_public (BOOLEAN, default false)
- is_system (BOOLEAN, default false)
- usage_count (INTEGER, default 0)
- metadata (JSONB, default {})
- created_at, updated_at, deleted_at (TIMESTAMPTZ)

#### Recon Audits
- id (UUID, primary key)
- recon_job_id (UUID, references recon_jobs, cascade delete, nullable)
- recon_result_id (UUID, references recon_results, cascade delete, nullable)
- tenant_id (UUID, references tenants, cascade delete, required)
- user_id (UUID, references users, nullable)
- audit_type (VARCHAR, required)
- action (VARCHAR, required)
- entity_type (VARCHAR, nullable)
- entity_id (UUID, nullable)
- changes, before_state, after_state (JSONB, nullable)
- ip_address (VARCHAR, nullable)
- user_agent (TEXT, nullable)
- metadata (JSONB, default {})
- created_at (TIMESTAMPTZ, default now)

#### Mapping Templates
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, nullable)
- name (VARCHAR, required)
- description (TEXT, nullable)
- source_schema, target_schema (JSONB, required)
- field_mappings (JSONB, default {})
- transformation_rules, validation_rules (JSONB, default [])
- is_public, is_system (BOOLEAN, default false)
- usage_count (INTEGER, default 0)
- version (INTEGER, default 1)
- metadata (JSONB, default {})
- created_at, updated_at, deleted_at (TIMESTAMPTZ)

#### Validation Rules
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, nullable)
- name (VARCHAR, required)
- description (TEXT, nullable)
- rule_type (VARCHAR, required)
- rule_config (JSONB, required)
- severity (VARCHAR, default 'error')
- is_active, is_public, is_system (BOOLEAN, default true/false/false)
- usage_count (INTEGER, default 0)
- metadata (JSONB, default {})
- created_at, updated_at, deleted_at (TIMESTAMPTZ)

#### Transform Recipes
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, nullable)
- name (VARCHAR, required)
- description (TEXT, nullable)
- recipe_type (VARCHAR, required)
- input_schema, output_schema (JSONB, required)
- transformation_steps, validation_rules (JSONB, default [])
- is_public, is_system (BOOLEAN, default false)
- usage_count (INTEGER, default 0)
- version (INTEGER, default 1)
- metadata (JSONB, default {})
- created_at, updated_at, deleted_at (TIMESTAMPTZ)

#### Contract Versions
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, required)
- contract_name (VARCHAR, required)
- version (VARCHAR, required)
- schema_definition (JSONB, required)
- is_active (BOOLEAN, default true)
- is_deprecated (BOOLEAN, default false)
- deprecated_at (TIMESTAMPTZ, nullable)
- breaking_changes (JSONB, default [])
- migration_guide (TEXT, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(tenant_id, contract_name, version)

#### Drift Events
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, required)
- recon_job_id (UUID, references recon_jobs, nullable)
- contract_version_id (UUID, references contract_versions, nullable)
- drift_type (VARCHAR, required)
- severity (VARCHAR, default 'warning')
- field_path (VARCHAR, nullable)
- expected_value, actual_value (JSONB, nullable)
- drift_metrics (JSONB, default {})
- auto_repaired (BOOLEAN, default false)
- repair_action (JSONB, nullable)
- acknowledged (BOOLEAN, default false)
- acknowledged_by (UUID, references users, nullable)
- acknowledged_at (TIMESTAMPTZ, nullable)
- metadata (JSONB, default {})
- created_at (TIMESTAMPTZ, default now)

#### Workflow Runs
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, required)
- workflow_id (VARCHAR, required)
- workflow_name, workflow_version (VARCHAR, nullable)
- status (VARCHAR, default 'running')
- started_at (TIMESTAMPTZ, default now)
- completed_at (TIMESTAMPTZ, nullable)
- triggered_by (VARCHAR, nullable)
- trigger_event, execution_graph (JSONB, nullable)
- step_results (JSONB, default {})
- error_message, error_stack (TEXT, nullable)
- duration_ms (BIGINT, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

### 5. RECEIPTS API TABLES

#### Receipt Uploads
- id (UUID, primary key)
- api_key_id (UUID, references api_keys, nullable)
- billing_account_id (UUID, references billing_accounts, nullable)
- storage_location (TEXT, required)
- original_filename (VARCHAR, required)
- mime_type (VARCHAR, required)
- size_bytes (INTEGER, required)
- status (VARCHAR, default 'pending')
- error_message (TEXT, nullable)
- created_at, updated_at (TIMESTAMPTZ)

#### Receipts
- id (UUID, primary key)
- upload_id (UUID, unique, references receipt_uploads, cascade delete, required)
- vendor (VARCHAR, nullable)
- date (TIMESTAMPTZ, nullable)
- currency (VARCHAR, nullable)
- subtotal, tax, total (DECIMAL(15,2), nullable)
- payment_method (VARCHAR, nullable)
- confidence_score (DECIMAL(5,4), nullable)
- raw_text (TEXT, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

#### Receipt Items
- id (UUID, primary key)
- receipt_id (UUID, references receipts, cascade delete, required)
- name (VARCHAR, required)
- quantity (DECIMAL(10,3), nullable)
- unit_price, line_total (DECIMAL(15,2), nullable)
- category (VARCHAR, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

### 6. FEATURE FLAGS API TABLES

#### Feature Flags
- id (UUID, primary key)
- billing_account_id (UUID, references billing_accounts, nullable)
- project_id (UUID, nullable)
- key (VARCHAR, required)
- name (VARCHAR, required)
- description (TEXT, nullable)
- type (VARCHAR, default 'boolean')
- is_global (BOOLEAN, default false)
- default_value (JSONB, nullable)
- metadata (JSONB, default {})
- created_at, updated_at, deleted_at (TIMESTAMPTZ)
- UNIQUE(billing_account_id, project_id, key)

#### Feature Flag Environments
- id (UUID, primary key)
- flag_id (UUID, references feature_flags, cascade delete, required)
- environment (VARCHAR, required)
- enabled (BOOLEAN, default false)
- variant (JSONB, nullable)
- config (JSONB, default {})
- updated_at (TIMESTAMPTZ)
- updated_by (UUID, nullable)
- UNIQUE(flag_id, environment)

#### Feature Flag Overrides
- id (UUID, primary key)
- flag_id (UUID, references feature_flags, cascade delete, required)
- environment (VARCHAR, required)
- target_key (VARCHAR, required)
- target_type (VARCHAR, default 'user')
- value (JSONB, required)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)
- expires_at (TIMESTAMPTZ, nullable)
- UNIQUE(flag_id, environment, target_key, target_type)

### 7. MULTI-TENANT SITE BUILDER TABLES

#### Tenant Branding
- id (UUID, primary key)
- tenant_id (UUID, unique, references tenants, cascade delete, required)
- logo_url, favicon_url (VARCHAR, nullable)
- primary_color, secondary_color, accent_color (VARCHAR, default colors)
- background_color (VARCHAR, default 'white')
- borderRadius_scale (DECIMAL(3,2), nullable)
- font_family_primary, font_family_secondary (VARCHAR, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

#### Tenant Navigation
- id (UUID, primary key)
- tenant_id (UUID, unique, references tenants, cascade delete, required)
- nav_items, footer_items (JSONB, default [])
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

#### Tenant Pages
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, required)
- slug (VARCHAR, required)
- page_type (VARCHAR, required) -- 'marketing', 'docs', 'landing', 'custom'
- schema_version (VARCHAR, default '1.0')
- blocks (JSONB, default [])
- seo_title, seo_description, seo_image_url (VARCHAR, nullable)
- is_draft (BOOLEAN, default false)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(tenant_id, slug)

#### Tenant Page Revisions
- id (UUID, primary key)
- tenant_page_id (UUID, references tenant_pages, cascade delete, required)
- editor_user_id (UUID, nullable)
- snapshot (JSONB, required)
- comment (TEXT, nullable)
- approved_by_user_id (UUID, nullable)
- approved_at (TIMESTAMPTZ, nullable)
- created_at (TIMESTAMPTZ, default now)

#### Experiments
- id (UUID, primary key)
- tenant_id (UUID, references tenants, cascade delete, required)
- target_page_id (UUID, references tenant_pages, cascade delete, required)
- name (VARCHAR, required)
- slug (VARCHAR, required)
- status (VARCHAR, default 'draft') -- 'draft', 'running', 'paused', 'completed'
- traffic_split (JSONB, default {})
- primary_metric (VARCHAR, default 'click_through')
- starts_at, ends_at (TIMESTAMPTZ, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(tenant_id, slug)

#### Experiment Variants
- id (UUID, primary key)
- experiment_id (UUID, references experiments, cascade delete, required)
- key (VARCHAR, required)
- label (VARCHAR, required)
- blocks_override (JSONB, default {})
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(experiment_id, key)

#### Experiment Metric Events
- id (UUID, primary key)
- experiment_id (UUID, references experiments, cascade delete, required)
- variant_key (VARCHAR, required)
- tenant_id (UUID, references tenants, cascade delete, required)
- page_id (UUID, references tenant_pages, cascade delete, required)
- event_type (VARCHAR, required) -- 'view', 'click', 'conversion', 'custom'
- session_id (VARCHAR, nullable)
- user_id (UUID, nullable)
- meta (JSONB, default {})
- created_at (TIMESTAMPTZ, default now)

### 8. WEBHOOK TABLES

#### Webhooks
- id (UUID, primary key)
- user_id (UUID, references users, cascade delete, required)
- tenant_id (UUID, references tenants, cascade delete, nullable)
- url (TEXT, required)
- events (TEXT[], default [])
- secret (TEXT, required)
- status (VARCHAR, default 'active')
- metadata (JSONB, default {})
- created_at, updated_at, deleted_at (TIMESTAMPTZ)

#### Webhook Deliveries
- id (UUID, primary key)
- webhook_id (UUID, references webhooks, cascade delete, required)
- url (TEXT, required)
- payload (JSONB, required)
- status (VARCHAR, default 'pending')
- status_code (INTEGER, nullable)
- response_body (TEXT, nullable)
- attempts (INTEGER, default 1)
- next_retry_at (TIMESTAMPTZ, nullable)
- error_message (TEXT, nullable)
- metadata (JSONB, default {})
- created_at, updated_at (TIMESTAMPTZ)

### 9. AUDIT & IDEMPOTENCY TABLES

#### Audit Logs
- id (UUID, primary key)
- user_id (UUID, nullable)
- billing_account_id (UUID, nullable)
- tenant_id (UUID, references tenants, nullable)
- action (VARCHAR, required) -- 'create', 'update', 'delete', 'read'
- resource_type (VARCHAR, required)
- resource_id (UUID, nullable)
- changes (JSONB, nullable)
- ip_address (VARCHAR, nullable)
- user_agent (TEXT, nullable)
- metadata (JSONB, default {})
- created_at (TIMESTAMPTZ, default now)

#### Idempotency Keys
- id (UUID, primary key)
- key (VARCHAR, unique, required)
- status (VARCHAR, default 'pending') -- 'pending', 'completed', 'failed'
- response (JSONB, nullable)
- created_at (TIMESTAMPTZ, default now)
- completed_at (TIMESTAMPTZ, nullable)
- expires_at (TIMESTAMPTZ, required)

#### Onboarding Progress
- id (UUID, primary key)
- user_id (UUID, unique, required)
- current_step (VARCHAR, default 'welcome')
- completed_steps (TEXT[], default [])
- skipped_steps (TEXT[], default [])
- progress (INTEGER, default 0) -- 0-100
- metadata (JSONB, default {})
- completed_at (TIMESTAMPTZ, nullable)
- created_at, updated_at (TIMESTAMPTZ)

### 10. INDEXES

Create indexes on:
- All foreign keys
- All unique constraints
- Tenant isolation columns (tenant_id)
- Timestamp columns for sorting (created_at DESC, updated_at DESC)
- Status columns for filtering
- JSONB columns using GIN indexes where needed
- Composite indexes for common query patterns

### 11. ROW LEVEL SECURITY (RLS)

Enable RLS on all tables and create policies for:
- Tenant isolation (users can only access their tenant's data)
- User access (users can only access their own data where applicable)
- Public read access for public templates/flags where needed
- Service role full access for system operations

### 12. FUNCTIONS

Create helper functions:
- current_user_id() - Get user ID from JWT
- current_tenant_id() - Get tenant ID from context
- update_updated_at_column() - Trigger function for updated_at
- Tenant ID propagation triggers for related tables

### 13. TRIGGERS

- Auto-update updated_at columns
- Propagate tenant_id from parent tables to child tables
- Validate data integrity

Please generate the complete SQL migration file with all tables, indexes, RLS policies, functions, and triggers. Ensure all foreign key relationships are properly defined and that the schema supports multi-tenant isolation.
```

---

## Usage Instructions

1. Copy the prompt above
2. Open Supabase Dashboard → SQL Editor → AI Chat
3. Paste the prompt
4. Review generated SQL
5. Execute in your database
6. Verify all tables created correctly

## Verification Checklist

After running the generated SQL:

- [ ] All 37 Prisma models have corresponding tables
- [ ] All foreign keys are properly defined
- [ ] All indexes are created
- [ ] RLS is enabled on all tables
- [ ] Helper functions work correctly
- [ ] Triggers fire correctly
- [ ] No duplicate table names
- [ ] All required columns match Prisma schema
