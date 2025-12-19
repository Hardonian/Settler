-- Migration: enterprise_multi_tenant_core
-- Created: 2025-12-19 00:16:46 UTC
-- Description: Core multi-tenant SaaS tables with proper tenant isolation
-- This migration creates: memberships, profiles, entitlements, usage_events

BEGIN;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- User profiles linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEMBERSHIPS TABLE
-- ============================================================================
-- Tenant membership with roles (replaces tenant_users for clearer naming)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes for memberships
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON memberships(tenant_id, user_id);

-- ============================================================================
-- ENTITLEMENTS TABLE
-- ============================================================================
-- Plan entitlements definition (what each plan includes)
CREATE TABLE IF NOT EXISTS entitlements (
  plan TEXT PRIMARY KEY,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default entitlements
INSERT INTO entitlements (plan, features, limits) VALUES
  ('free', 
   '{"api_keys": true, "receipts": true, "reconciliation": true, "feature_flags": false, "analytics": false, "webhooks": false}'::jsonb,
   '{"api_calls_per_month": 1000, "receipts_per_month": 100, "reconciliation_runs_per_month": 10}'::jsonb
  ),
  ('starter',
   '{"api_keys": true, "receipts": true, "reconciliation": true, "feature_flags": true, "analytics": true, "webhooks": true}'::jsonb,
   '{"api_calls_per_month": 10000, "receipts_per_month": 1000, "reconciliation_runs_per_month": 100}'::jsonb
  ),
  ('pro',
   '{"api_keys": true, "receipts": true, "reconciliation": true, "feature_flags": true, "analytics": true, "webhooks": true, "priority_support": true}'::jsonb,
   '{"api_calls_per_month": 100000, "receipts_per_month": 10000, "reconciliation_runs_per_month": 1000}'::jsonb
  ),
  ('enterprise',
   '{"api_keys": true, "receipts": true, "reconciliation": true, "feature_flags": true, "analytics": true, "webhooks": true, "priority_support": true, "sso": true, "custom_integrations": true}'::jsonb,
   '{"api_calls_per_month": -1, "receipts_per_month": -1, "reconciliation_runs_per_month": -1}'::jsonb
  )
ON CONFLICT (plan) DO UPDATE SET
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- ============================================================================
-- SUBSCRIPTIONS TABLE (Enhanced)
-- ============================================================================
-- Ensure subscriptions table has tenant_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    -- Add tenant_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'tenant_id') THEN
      ALTER TABLE subscriptions ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
    END IF;
    
    -- Add plan column if it doesn't exist (for entitlements lookup)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan') THEN
      ALTER TABLE subscriptions ADD COLUMN plan TEXT REFERENCES entitlements(plan);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- USAGE_EVENTS TABLE
-- ============================================================================
-- Track usage for quota enforcement
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  props JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for usage_events
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_id ON usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_name ON usage_events(event_name);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_event_created ON usage_events(tenant_id, event_name, created_at DESC);

-- ============================================================================
-- TENANTS TABLE ENHANCEMENTS
-- ============================================================================
-- Ensure tenants table has plan_hint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'plan_hint') THEN
      ALTER TABLE tenants ADD COLUMN plan_hint TEXT REFERENCES entitlements(plan);
    END IF;
  END IF;
END $$;

COMMIT;
