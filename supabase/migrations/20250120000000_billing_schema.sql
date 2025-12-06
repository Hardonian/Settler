-- Migration: billing_schema
-- Created: 2025-01-20 00:00:00 UTC
-- Description: Billing infrastructure - accounts, subscriptions, add-ons, usage tracking

BEGIN;

-- ============================================================================
-- BILLING ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_account_id VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  address JSONB,
  tax_id VARCHAR(255),
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_user_id ON billing_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_tenant_id ON billing_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe_customer_id ON billing_accounts(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_status ON billing_accounts(status);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  plan_id VARCHAR(100) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_account_id ON subscriptions(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- ============================================================================
-- ADD-ONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  base_price_monthly DECIMAL(10, 2) NOT NULL,
  usage_price_per_unit DECIMAL(10, 6),
  usage_unit VARCHAR(50),
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_standard BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_ons_integration_id ON add_ons(integration_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_is_active ON add_ons(is_active);
CREATE INDEX IF NOT EXISTS idx_add_ons_is_standard ON add_ons(is_standard);

-- Insert standard add-ons (included in base plan)
INSERT INTO add_ons (integration_id, name, description, category, base_price_monthly, is_standard, is_active) VALUES
  ('stripe', 'Stripe', 'Payment processor reconciliation', 'integration', 0.00, true, true),
  ('shopify', 'Shopify', 'E-commerce order & payment sync', 'integration', 0.00, true, true),
  ('paypal', 'PayPal', 'Standard payment reconciliation', 'integration', 0.00, true, true),
  ('google-pay', 'Google Pay', 'Payment method reconciliation', 'integration', 0.00, true, true),
  ('meta-commerce', 'Meta Commerce + Meta Ads', 'Facebook/Instagram shop & ad spend reconciliation', 'integration', 0.00, true, true)
ON CONFLICT (integration_id) DO NOTHING;

-- Insert premium add-ons
INSERT INTO add_ons (integration_id, name, description, category, base_price_monthly, usage_price_per_unit, usage_unit, is_standard, is_active) VALUES
  ('tiktok-shop', 'TikTok Shop + TikTok Ads', 'TikTok Shop order reconciliation and TikTok Ads spend tracking', 'integration', 39.95, 0.02, 'order', false, true),
  ('wix-stores', 'Wix Stores', 'Wix Stores order reconciliation', 'integration', 19.95, 0.01, 'order', false, true),
  ('ga4-deep-sync', 'Google Analytics GA4 Deep Sync', 'GA4 event data reconciliation with revenue', 'integration', 29.95, 0.005, 'event', false, true),
  ('paypal-payouts', 'PayPal Payouts + Automation', 'PayPal Payouts API reconciliation and automation', 'integration', 49.95, 0.03, 'payout', false, true),
  ('whatsapp-telegram', 'WhatsApp Business + Telegram Messaging', 'WhatsApp Business API and Telegram Bot API integration', 'integration', 79.95, 0.001, 'message', false, true)
ON CONFLICT (integration_id) DO NOTHING;

-- ============================================================================
-- ADD-ON PURCHASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS add_on_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
  stripe_subscription_item_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_on_purchases_billing_account_id ON add_on_purchases(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_add_on_purchases_add_on_id ON add_on_purchases(add_on_id);
CREATE INDEX IF NOT EXISTS idx_add_on_purchases_status ON add_on_purchases(status);

-- ============================================================================
-- USAGE EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  project_id UUID,
  user_id UUID,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  integration_id VARCHAR(100),
  add_on_id UUID REFERENCES add_ons(id) ON DELETE SET NULL,
  quantity DECIMAL(15, 6) NOT NULL,
  unit VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  aggregated BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account_id ON usage_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_project_id ON usage_events(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_id ON usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_integration_id ON usage_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_events_aggregated ON usage_events(aggregated);
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account_event_timestamp ON usage_events(billing_account_id, event_type, timestamp);

-- ============================================================================
-- USAGE AGGREGATE DAILY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_aggregate_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  project_id UUID,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  integration_id VARCHAR(100),
  add_on_id UUID REFERENCES add_ons(id) ON DELETE SET NULL,
  total_quantity DECIMAL(15, 6) NOT NULL,
  event_count INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(billing_account_id, project_id, date, event_type, integration_id, add_on_id)
);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_billing_account_id ON usage_aggregate_daily(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_project_id ON usage_aggregate_daily(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_tenant_id ON usage_aggregate_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_date ON usage_aggregate_daily(date);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_event_type ON usage_aggregate_daily(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_integration_id ON usage_aggregate_daily(integration_id);

-- ============================================================================
-- STRIPE EVENT LOG TABLE (for webhook tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stripe_event_log_stripe_event_id ON stripe_event_log(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_event_log_event_type ON stripe_event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_event_log_processed ON stripe_event_log(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_event_log_created_at ON stripe_event_log(created_at);

COMMIT;
