-- Migration: console_complete_setup
-- Created: 2026-01-26 00:00:00 UTC
-- Description: Complete console setup - ensures all tables, functions, and RLS policies exist
-- This migration consolidates all console-related schema requirements

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTIONS (Create/Replace)
-- ============================================================================

-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get current tenant ID
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- RECEIPTS TABLES (Receipts API)
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipt_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  storage_location TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipt_uploads') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_uploads' AND column_name = 'api_key_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipt_uploads' AND indexname = 'idx_receipt_uploads_api_key_id') THEN
        EXECUTE 'CREATE INDEX idx_receipt_uploads_api_key_id ON receipt_uploads(api_key_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_uploads' AND column_name = 'billing_account_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipt_uploads' AND indexname = 'idx_receipt_uploads_billing_account_id') THEN
        EXECUTE 'CREATE INDEX idx_receipt_uploads_billing_account_id ON receipt_uploads(billing_account_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_uploads' AND column_name = 'status') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipt_uploads' AND indexname = 'idx_receipt_uploads_status') THEN
        EXECUTE 'CREATE INDEX idx_receipt_uploads_status ON receipt_uploads(status)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_uploads' AND column_name = 'created_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipt_uploads' AND indexname = 'idx_receipt_uploads_created_at') THEN
        EXECUTE 'CREATE INDEX idx_receipt_uploads_created_at ON receipt_uploads(created_at)';
      END IF;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID UNIQUE NOT NULL REFERENCES receipt_uploads(id) ON DELETE CASCADE,
  vendor VARCHAR(255),
  date TIMESTAMPTZ,
  currency VARCHAR(10),
  subtotal DECIMAL(15, 2),
  tax DECIMAL(15, 2),
  total DECIMAL(15, 2),
  payment_method VARCHAR(100),
  confidence_score DECIMAL(5, 4),
  raw_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'vendor') THEN
      ALTER TABLE receipts ADD COLUMN vendor VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'date') THEN
      ALTER TABLE receipts ADD COLUMN date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'currency') THEN
      ALTER TABLE receipts ADD COLUMN currency VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'subtotal') THEN
      ALTER TABLE receipts ADD COLUMN subtotal DECIMAL(15, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'tax') THEN
      ALTER TABLE receipts ADD COLUMN tax DECIMAL(15, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'total') THEN
      ALTER TABLE receipts ADD COLUMN total DECIMAL(15, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'payment_method') THEN
      ALTER TABLE receipts ADD COLUMN payment_method VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'confidence_score') THEN
      ALTER TABLE receipts ADD COLUMN confidence_score DECIMAL(5, 4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'raw_text') THEN
      ALTER TABLE receipts ADD COLUMN raw_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'metadata') THEN
      ALTER TABLE receipts ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

-- Create indexes conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'upload_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_upload_id') THEN
        EXECUTE 'CREATE INDEX idx_receipts_upload_id ON receipts(upload_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'vendor') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_vendor') THEN
        EXECUTE 'CREATE INDEX idx_receipts_vendor ON receipts(vendor)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'date') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_date') THEN
        EXECUTE 'CREATE INDEX idx_receipts_date ON receipts(date)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'created_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_created_at') THEN
        EXECUTE 'CREATE INDEX idx_receipts_created_at ON receipts(created_at)';
      END IF;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 3),
  unit_price DECIMAL(15, 2),
  line_total DECIMAL(15, 2),
  category VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipt_items') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_items' AND column_name = 'category') THEN
      ALTER TABLE receipt_items ADD COLUMN category VARCHAR(100);
    END IF;
  END IF;
END $$;

-- Create indexes conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipt_items') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_items' AND column_name = 'receipt_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipt_items' AND indexname = 'idx_receipt_items_receipt_id') THEN
        EXECUTE 'CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_items' AND column_name = 'category') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipt_items' AND indexname = 'idx_receipt_items_category') THEN
        EXECUTE 'CREATE INDEX idx_receipt_items_category ON receipt_items(category)';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- FEATURE FLAGS TABLES (Feature Flags API)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  project_id UUID,
  key VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'boolean',
  is_global BOOLEAN DEFAULT false,
  default_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(billing_account_id, project_id, key)
);


-- Create index conditionally to avoid duplicates
-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'billing_account_id') THEN
      ALTER TABLE feature_flags ADD COLUMN billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'project_id') THEN
      ALTER TABLE feature_flags ADD COLUMN project_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'is_global') THEN
      ALTER TABLE feature_flags ADD COLUMN is_global BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'deleted_at') THEN
      ALTER TABLE feature_flags ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'billing_account_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flags' AND indexname = 'idx_feature_flags_billing_account_id') THEN
        EXECUTE 'CREATE INDEX idx_feature_flags_billing_account_id ON feature_flags(billing_account_id)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'project_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flags' AND indexname = 'idx_feature_flags_project_id') THEN
        EXECUTE 'CREATE INDEX idx_feature_flags_project_id ON feature_flags(project_id)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'key') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flags' AND indexname = 'idx_feature_flags_key') THEN
        EXECUTE 'CREATE INDEX idx_feature_flags_key ON feature_flags(key)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'is_global') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flags' AND indexname = 'idx_feature_flags_is_global') THEN
        EXECUTE 'CREATE INDEX idx_feature_flags_is_global ON feature_flags(is_global)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'deleted_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flags' AND indexname = 'idx_feature_flags_deleted_at') THEN
        EXECUTE 'CREATE INDEX idx_feature_flags_deleted_at ON feature_flags(deleted_at)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create table (columns added conditionally if table exists)
CREATE TABLE IF NOT EXISTS feature_flag_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  variant JSONB,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_environments') THEN
    -- Add flag_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_environments' AND column_name = 'flag_id') THEN
      ALTER TABLE feature_flag_environments ADD COLUMN flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE;
      -- Set NOT NULL after adding data
      UPDATE feature_flag_environments SET flag_id = (SELECT id FROM feature_flags LIMIT 1) WHERE flag_id IS NULL;
      ALTER TABLE feature_flag_environments ALTER COLUMN flag_id SET NOT NULL;
    END IF;
    -- Add environment if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_environments' AND column_name = 'environment') THEN
      ALTER TABLE feature_flag_environments ADD COLUMN environment VARCHAR(100);
      UPDATE feature_flag_environments SET environment = 'production' WHERE environment IS NULL;
      ALTER TABLE feature_flag_environments ALTER COLUMN environment SET NOT NULL;
    END IF;
    -- Add enabled if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_environments' AND column_name = 'enabled') THEN
      ALTER TABLE feature_flag_environments ADD COLUMN enabled BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- Add UNIQUE constraint conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_environments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_environments' AND column_name = 'flag_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_environments' AND column_name = 'environment') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feature_flag_environments_flag_id_environment_key'
        AND conrelid = 'feature_flag_environments'::regclass
      ) THEN
        ALTER TABLE feature_flag_environments ADD CONSTRAINT feature_flag_environments_flag_id_environment_key UNIQUE (flag_id, environment);
      END IF;
    END IF;
  END IF;
END $$;

-- Create indexes conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_environments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_environments' AND column_name = 'flag_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flag_environments' AND indexname = 'idx_feature_flag_environments_flag_id') THEN
        EXECUTE 'CREATE INDEX idx_feature_flag_environments_flag_id ON feature_flag_environments(flag_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_environments' AND column_name = 'environment') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flag_environments' AND indexname = 'idx_feature_flag_environments_environment') THEN
        EXECUTE 'CREATE INDEX idx_feature_flag_environments_environment ON feature_flag_environments(environment)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_environments' AND column_name = 'enabled') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flag_environments' AND indexname = 'idx_feature_flag_environments_enabled') THEN
        EXECUTE 'CREATE INDEX idx_feature_flag_environments_enabled ON feature_flag_environments(enabled)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create table (columns and constraints added conditionally if table exists)
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  target_key VARCHAR(255),
  target_type VARCHAR(50) DEFAULT 'user',
  value JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_overrides') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'flag_id') THEN
      ALTER TABLE feature_flag_overrides ADD COLUMN flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE;
      UPDATE feature_flag_overrides SET flag_id = (SELECT id FROM feature_flags LIMIT 1) WHERE flag_id IS NULL;
      ALTER TABLE feature_flag_overrides ALTER COLUMN flag_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'environment') THEN
      ALTER TABLE feature_flag_overrides ADD COLUMN environment VARCHAR(100);
      UPDATE feature_flag_overrides SET environment = 'production' WHERE environment IS NULL;
      ALTER TABLE feature_flag_overrides ALTER COLUMN environment SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'target_key') THEN
      ALTER TABLE feature_flag_overrides ADD COLUMN target_key VARCHAR(255);
      UPDATE feature_flag_overrides SET target_key = 'default' WHERE target_key IS NULL;
      ALTER TABLE feature_flag_overrides ALTER COLUMN target_key SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'value') THEN
      ALTER TABLE feature_flag_overrides ADD COLUMN value JSONB DEFAULT '{}'::jsonb;
      UPDATE feature_flag_overrides SET value = '{}'::jsonb WHERE value IS NULL;
      ALTER TABLE feature_flag_overrides ALTER COLUMN value SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'expires_at') THEN
      ALTER TABLE feature_flag_overrides ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- Add UNIQUE constraint conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_overrides') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'flag_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'environment')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'target_key')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'target_type') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feature_flag_overrides_flag_id_environment_target_key_target_type_key'
        AND conrelid = 'feature_flag_overrides'::regclass
      ) THEN
        ALTER TABLE feature_flag_overrides ADD CONSTRAINT feature_flag_overrides_flag_id_environment_target_key_target_type_key UNIQUE (flag_id, environment, target_key, target_type);
      END IF;
    END IF;
  END IF;
END $$;


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_overrides') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flag_overrides' AND indexname = 'idx_feature_flag_overrides_flag_id') THEN
      EXECUTE 'CREATE INDEX idx_feature_flag_overrides_flag_id ON feature_flag_overrides(flag_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_overrides') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flag_overrides' AND indexname = 'idx_feature_flag_overrides_environment') THEN
      EXECUTE 'CREATE INDEX idx_feature_flag_overrides_environment ON feature_flag_overrides(environment)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_overrides') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flag_overrides' AND indexname = 'idx_feature_flag_overrides_target_key') THEN
      EXECUTE 'CREATE INDEX idx_feature_flag_overrides_target_key ON feature_flag_overrides(target_key)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flag_overrides') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flag_overrides' AND column_name = 'expires_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'feature_flag_overrides' AND indexname = 'idx_feature_flag_overrides_expires_at') THEN
        EXECUTE 'CREATE INDEX idx_feature_flag_overrides_expires_at ON feature_flag_overrides(expires_at)';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- TENANT BRANDING & NAVIGATION TABLES (Site Builder)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#7c3aed',
  accent_color VARCHAR(7) DEFAULT '#06b6d4',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  borderRadius_scale DECIMAL(3, 2),
  font_family_primary VARCHAR(100),
  font_family_secondary VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_branding') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_branding' AND indexname = 'idx_tenant_branding_tenant_id') THEN
      EXECUTE 'CREATE INDEX idx_tenant_branding_tenant_id ON tenant_branding(tenant_id)';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tenant_navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nav_items JSONB DEFAULT '[]'::jsonb,
  footer_items JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_navigation') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_navigation' AND indexname = 'idx_tenant_navigation_tenant_id') THEN
      EXECUTE 'CREATE INDEX idx_tenant_navigation_tenant_id ON tenant_navigation(tenant_id)';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tenant_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  slug VARCHAR(255),
  schema_version VARCHAR(20) DEFAULT '1.0',
  blocks JSONB DEFAULT '[]'::jsonb,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_pages') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_pages' AND column_name = 'tenant_id') THEN
      ALTER TABLE tenant_pages ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
      UPDATE tenant_pages SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;
      ALTER TABLE tenant_pages ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_pages' AND column_name = 'slug') THEN
      ALTER TABLE tenant_pages ADD COLUMN slug VARCHAR(255);
      UPDATE tenant_pages SET slug = 'home' WHERE slug IS NULL;
      ALTER TABLE tenant_pages ALTER COLUMN slug SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_pages' AND column_name = 'page_type') THEN
      ALTER TABLE tenant_pages ADD COLUMN page_type VARCHAR(50);
      UPDATE tenant_pages SET page_type = 'page' WHERE page_type IS NULL;
      ALTER TABLE tenant_pages ALTER COLUMN page_type SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_pages' AND column_name = 'is_draft') THEN
      ALTER TABLE tenant_pages ADD COLUMN is_draft BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- Add UNIQUE constraint conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_pages') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_pages' AND column_name = 'tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_pages' AND column_name = 'slug') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenant_pages_tenant_id_slug_key'
        AND conrelid = 'tenant_pages'::regclass
      ) THEN
        ALTER TABLE tenant_pages ADD CONSTRAINT tenant_pages_tenant_id_slug_key UNIQUE (tenant_id, slug);
      END IF;
    END IF;
  END IF;
END $$;


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_pages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_pages' AND indexname = 'idx_tenant_pages_tenant_id') THEN
      EXECUTE 'CREATE INDEX idx_tenant_pages_tenant_id ON tenant_pages(tenant_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_pages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_pages' AND indexname = 'idx_tenant_pages_slug') THEN
      EXECUTE 'CREATE INDEX idx_tenant_pages_slug ON tenant_pages(slug)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_pages') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_pages' AND column_name = 'page_type') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_pages' AND indexname = 'idx_tenant_pages_page_type') THEN
        EXECUTE 'CREATE INDEX idx_tenant_pages_page_type ON tenant_pages(page_type)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_pages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_pages' AND indexname = 'idx_tenant_pages_is_draft') THEN
      EXECUTE 'CREATE INDEX idx_tenant_pages_is_draft ON tenant_pages(is_draft)';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tenant_page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_page_id UUID NOT NULL REFERENCES tenant_pages(id) ON DELETE CASCADE,
  editor_user_id UUID,
  snapshot JSONB NOT NULL,
  comment TEXT,
  approved_by_user_id UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_page_revisions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_page_revisions' AND indexname = 'idx_tenant_page_revisions_tenant_page_id') THEN
      EXECUTE 'CREATE INDEX idx_tenant_page_revisions_tenant_page_id ON tenant_page_revisions(tenant_page_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_page_revisions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_page_revisions' AND indexname = 'idx_tenant_page_revisions_editor_user_id') THEN
      EXECUTE 'CREATE INDEX idx_tenant_page_revisions_editor_user_id ON tenant_page_revisions(editor_user_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_page_revisions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_page_revisions' AND indexname = 'idx_tenant_page_revisions_approved_by_user_id') THEN
      EXECUTE 'CREATE INDEX idx_tenant_page_revisions_approved_by_user_id ON tenant_page_revisions(approved_by_user_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_page_revisions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tenant_page_revisions' AND indexname = 'idx_tenant_page_revisions_created_at') THEN
      EXECUTE 'CREATE INDEX idx_tenant_page_revisions_created_at ON tenant_page_revisions(created_at DESC)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- EXPERIMENTS TABLES (A/B Testing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255),
  slug VARCHAR(255),
  traffic_split JSONB DEFAULT '{}'::jsonb,
  primary_metric VARCHAR(50) DEFAULT 'click_through',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'tenant_id') THEN
      ALTER TABLE experiments ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
      UPDATE experiments SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;
      ALTER TABLE experiments ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'target_page_id') THEN
      ALTER TABLE experiments ADD COLUMN target_page_id UUID REFERENCES tenant_pages(id) ON DELETE CASCADE;
      UPDATE experiments SET target_page_id = (SELECT id FROM tenant_pages LIMIT 1) WHERE target_page_id IS NULL;
      ALTER TABLE experiments ALTER COLUMN target_page_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'name') THEN
      ALTER TABLE experiments ADD COLUMN name VARCHAR(255);
      UPDATE experiments SET name = 'Experiment' WHERE name IS NULL;
      ALTER TABLE experiments ALTER COLUMN name SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'slug') THEN
      ALTER TABLE experiments ADD COLUMN slug VARCHAR(255);
      UPDATE experiments SET slug = 'experiment-' || id::text WHERE slug IS NULL;
      ALTER TABLE experiments ALTER COLUMN slug SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'starts_at') THEN
      ALTER TABLE experiments ADD COLUMN starts_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'ends_at') THEN
      ALTER TABLE experiments ADD COLUMN ends_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'status') THEN
      ALTER TABLE experiments ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
    END IF;
  END IF;
END $$;

-- Add UNIQUE constraint conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'slug') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'experiments_tenant_id_slug_key'
        AND conrelid = 'experiments'::regclass
      ) THEN
        ALTER TABLE experiments ADD CONSTRAINT experiments_tenant_id_slug_key UNIQUE (tenant_id, slug);
      END IF;
    END IF;
  END IF;
END $$;


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiments') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiments' AND indexname = 'idx_experiments_tenant_id') THEN
      EXECUTE 'CREATE INDEX idx_experiments_tenant_id ON experiments(tenant_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'target_page_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiments' AND indexname = 'idx_experiments_target_page_id') THEN
        EXECUTE 'CREATE INDEX idx_experiments_target_page_id ON experiments(target_page_id)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'status') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiments' AND indexname = 'idx_experiments_status') THEN
        EXECUTE 'CREATE INDEX idx_experiments_status ON experiments(status)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'starts_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiments' AND indexname = 'idx_experiments_starts_at') THEN
        EXECUTE 'CREATE INDEX idx_experiments_starts_at ON experiments(starts_at)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'ends_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiments' AND indexname = 'idx_experiments_ends_at') THEN
        EXECUTE 'CREATE INDEX idx_experiments_ends_at ON experiments(ends_at)';
      END IF;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  blocks_override JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_id, key)
);


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_variants') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_variants' AND indexname = 'idx_experiment_variants_experiment_id') THEN
      EXECUTE 'CREATE INDEX idx_experiment_variants_experiment_id ON experiment_variants(experiment_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_variants') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_variants' AND indexname = 'idx_experiment_variants_key') THEN
      EXECUTE 'CREATE INDEX idx_experiment_variants_key ON experiment_variants(key)';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS experiment_metric_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_key VARCHAR(100) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES tenant_pages(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  session_id VARCHAR(255),
  user_id UUID,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_metric_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_metric_events' AND indexname = 'idx_experiment_metric_events_experiment_id') THEN
      EXECUTE 'CREATE INDEX idx_experiment_metric_events_experiment_id ON experiment_metric_events(experiment_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_metric_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_metric_events' AND indexname = 'idx_experiment_metric_events_variant_key') THEN
      EXECUTE 'CREATE INDEX idx_experiment_metric_events_variant_key ON experiment_metric_events(variant_key)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_metric_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_metric_events' AND indexname = 'idx_experiment_metric_events_tenant_id') THEN
      EXECUTE 'CREATE INDEX idx_experiment_metric_events_tenant_id ON experiment_metric_events(tenant_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_metric_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_metric_events' AND indexname = 'idx_experiment_metric_events_page_id') THEN
      EXECUTE 'CREATE INDEX idx_experiment_metric_events_page_id ON experiment_metric_events(page_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_metric_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_metric_events' AND indexname = 'idx_experiment_metric_events_event_type') THEN
      EXECUTE 'CREATE INDEX idx_experiment_metric_events_event_type ON experiment_metric_events(event_type)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_metric_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_metric_events' AND indexname = 'idx_experiment_metric_events_session_id') THEN
      EXECUTE 'CREATE INDEX idx_experiment_metric_events_session_id ON experiment_metric_events(session_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_metric_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_metric_events' AND indexname = 'idx_experiment_metric_events_user_id') THEN
      EXECUTE 'CREATE INDEX idx_experiment_metric_events_user_id ON experiment_metric_events(user_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experiment_metric_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'experiment_metric_events' AND indexname = 'idx_experiment_metric_events_created_at') THEN
      EXECUTE 'CREATE INDEX idx_experiment_metric_events_created_at ON experiment_metric_events(created_at)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- WEBHOOKS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT,
  events JSONB DEFAULT '[]'::jsonb,
  secret TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'user_id') THEN
      ALTER TABLE webhooks ADD COLUMN user_id UUID;
      UPDATE webhooks SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
      ALTER TABLE webhooks ALTER COLUMN user_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'tenant_id') THEN
      ALTER TABLE webhooks ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
      UPDATE webhooks SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;
      ALTER TABLE webhooks ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'url') THEN
      ALTER TABLE webhooks ADD COLUMN url TEXT;
      UPDATE webhooks SET url = 'https://example.com/webhook' WHERE url IS NULL;
      ALTER TABLE webhooks ALTER COLUMN url SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'secret') THEN
      ALTER TABLE webhooks ADD COLUMN secret TEXT;
      UPDATE webhooks SET secret = gen_random_uuid()::text WHERE secret IS NULL;
      ALTER TABLE webhooks ALTER COLUMN secret SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'status') THEN
      ALTER TABLE webhooks ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'deleted_at') THEN
      ALTER TABLE webhooks ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'webhooks' AND indexname = 'idx_webhooks_tenant_id') THEN
      EXECUTE 'CREATE INDEX idx_webhooks_tenant_id ON webhooks(tenant_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'webhooks' AND indexname = 'idx_webhooks_user_id') THEN
      EXECUTE 'CREATE INDEX idx_webhooks_user_id ON webhooks(user_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'status') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'webhooks' AND indexname = 'idx_webhooks_status') THEN
        EXECUTE 'CREATE INDEX idx_webhooks_status ON webhooks(status)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'webhooks' AND indexname = 'idx_webhooks_deleted_at') THEN
      EXECUTE 'CREATE INDEX idx_webhooks_deleted_at ON webhooks(deleted_at)';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  url TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  status_code INTEGER,
  response_body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'webhook_id') THEN
      ALTER TABLE webhook_deliveries ADD COLUMN webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE;
      UPDATE webhook_deliveries SET webhook_id = (SELECT id FROM webhooks LIMIT 1) WHERE webhook_id IS NULL;
      ALTER TABLE webhook_deliveries ALTER COLUMN webhook_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'url') THEN
      ALTER TABLE webhook_deliveries ADD COLUMN url TEXT;
      UPDATE webhook_deliveries SET url = 'https://example.com/webhook' WHERE url IS NULL;
      ALTER TABLE webhook_deliveries ALTER COLUMN url SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'payload') THEN
      ALTER TABLE webhook_deliveries ADD COLUMN payload JSONB DEFAULT '{}'::jsonb;
      UPDATE webhook_deliveries SET payload = '{}'::jsonb WHERE payload IS NULL;
      ALTER TABLE webhook_deliveries ALTER COLUMN payload SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'status') THEN
      ALTER TABLE webhook_deliveries ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'attempts') THEN
      ALTER TABLE webhook_deliveries ADD COLUMN attempts INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'next_retry_at') THEN
      ALTER TABLE webhook_deliveries ADD COLUMN next_retry_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'error_message') THEN
      ALTER TABLE webhook_deliveries ADD COLUMN error_message TEXT;
    END IF;
  END IF;
END $$;


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'webhook_deliveries' AND indexname = 'idx_webhook_deliveries_webhook_id') THEN
      EXECUTE 'CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'status') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'webhook_deliveries' AND indexname = 'idx_webhook_deliveries_status') THEN
        EXECUTE 'CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'webhook_deliveries' AND indexname = 'idx_webhook_deliveries_next_retry_at') THEN
      EXECUTE 'CREATE INDEX idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'webhook_deliveries' AND indexname = 'idx_webhook_deliveries_created_at') THEN
      EXECUTE 'CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- IDEMPOTENCY KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255),
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idempotency_keys') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'idempotency_keys' AND column_name = 'key') THEN
      ALTER TABLE idempotency_keys ADD COLUMN key VARCHAR(255);
      UPDATE idempotency_keys SET key = gen_random_uuid()::text WHERE key IS NULL;
      ALTER TABLE idempotency_keys ALTER COLUMN key SET NOT NULL;
      -- Add UNIQUE constraint
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'idempotency_keys_key_key'
        AND conrelid = 'idempotency_keys'::regclass
      ) THEN
        ALTER TABLE idempotency_keys ADD CONSTRAINT idempotency_keys_key_key UNIQUE (key);
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'idempotency_keys' AND column_name = 'status') THEN
      ALTER TABLE idempotency_keys ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'idempotency_keys' AND column_name = 'expires_at') THEN
      ALTER TABLE idempotency_keys ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours');
      UPDATE idempotency_keys SET expires_at = NOW() + INTERVAL '24 hours' WHERE expires_at IS NULL;
      ALTER TABLE idempotency_keys ALTER COLUMN expires_at SET NOT NULL;
    END IF;
  END IF;
END $$;


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idempotency_keys') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'idempotency_keys' AND indexname = 'idx_idempotency_keys_key') THEN
      EXECUTE 'CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(key)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idempotency_keys') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'idempotency_keys' AND column_name = 'status') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'idempotency_keys' AND indexname = 'idx_idempotency_keys_status') THEN
        EXECUTE 'CREATE INDEX idx_idempotency_keys_status ON idempotency_keys(status)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idempotency_keys') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'idempotency_keys' AND indexname = 'idx_idempotency_keys_created_at') THEN
      EXECUTE 'CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idempotency_keys') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'idempotency_keys' AND indexname = 'idx_idempotency_keys_expires_at') THEN
      EXECUTE 'CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STRIPE EVENTS TABLE (if not exists from billing migration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255),
  type VARCHAR(100),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'event_id') THEN
      ALTER TABLE stripe_events ADD COLUMN event_id VARCHAR(255);
      UPDATE stripe_events SET event_id = gen_random_uuid()::text WHERE event_id IS NULL;
      ALTER TABLE stripe_events ALTER COLUMN event_id SET NOT NULL;
      -- Add UNIQUE constraint
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stripe_events_event_id_key'
        AND conrelid = 'stripe_events'::regclass
      ) THEN
        ALTER TABLE stripe_events ADD CONSTRAINT stripe_events_event_id_key UNIQUE (event_id);
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'type') THEN
      ALTER TABLE stripe_events ADD COLUMN type VARCHAR(100);
      UPDATE stripe_events SET type = 'unknown' WHERE type IS NULL;
      ALTER TABLE stripe_events ALTER COLUMN type SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'status') THEN
      ALTER TABLE stripe_events ADD COLUMN status VARCHAR(50) DEFAULT 'received';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'user_id') THEN
      ALTER TABLE stripe_events ADD COLUMN user_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'tenant_id') THEN
      ALTER TABLE stripe_events ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'billing_account_id') THEN
      ALTER TABLE stripe_events ADD COLUMN billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stripe_events' AND indexname = 'idx_stripe_events_event_id') THEN
      EXECUTE 'CREATE INDEX idx_stripe_events_event_id ON stripe_events(event_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stripe_events' AND indexname = 'idx_stripe_events_type') THEN
      EXECUTE 'CREATE INDEX idx_stripe_events_type ON stripe_events(type)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'status') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stripe_events' AND indexname = 'idx_stripe_events_status') THEN
        EXECUTE 'CREATE INDEX idx_stripe_events_status ON stripe_events(status)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stripe_events' AND indexname = 'idx_stripe_events_received_at') THEN
      EXECUTE 'CREATE INDEX idx_stripe_events_received_at ON stripe_events(received_at)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'user_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stripe_events' AND indexname = 'idx_stripe_events_user_id') THEN
        EXECUTE 'CREATE INDEX idx_stripe_events_user_id ON stripe_events(user_id)';
      END IF;
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stripe_events' AND indexname = 'idx_stripe_events_tenant_id') THEN
      EXECUTE 'CREATE INDEX idx_stripe_events_tenant_id ON stripe_events(tenant_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stripe_events' AND indexname = 'idx_stripe_events_billing_account_id') THEN
      EXECUTE 'CREATE INDEX idx_stripe_events_billing_account_id ON stripe_events(billing_account_id)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- CONSOLE ACTIVITIES TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS console_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'success',
  metadata JSONB DEFAULT '{}'::jsonb,
  resource_id UUID,
  resource_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'console_activities') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_user_id') THEN
      EXECUTE 'CREATE INDEX idx_console_activities_user_id ON console_activities(user_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'console_activities') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_billing_account_id') THEN
      EXECUTE 'CREATE INDEX idx_console_activities_billing_account_id ON console_activities(billing_account_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'console_activities') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_tenant_id') THEN
      EXECUTE 'CREATE INDEX idx_console_activities_tenant_id ON console_activities(tenant_id)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'console_activities') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_type') THEN
      EXECUTE 'CREATE INDEX idx_console_activities_type ON console_activities(activity_type)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'console_activities') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_status') THEN
      EXECUTE 'CREATE INDEX idx_console_activities_status ON console_activities(status)';
    END IF;
  END IF;
END $$;

-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'console_activities') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_billing_account_created_at') THEN
      EXECUTE 'CREATE INDEX idx_console_activities_billing_account_created_at ON console_activities(billing_account_id, created_at DESC)';
    END IF;
  END IF;
END $$;
-- Note: Cannot use NOW() in index predicate (not IMMUTABLE), so filter by created_at in queries
-- Index removed: idx_console_activities_recent

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Add missing billing_account_id column to tenants table if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'billing_account_id') THEN
      ALTER TABLE tenants ADD COLUMN billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE receipt_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_metric_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE console_activities ENABLE ROW LEVEL SECURITY;

-- Receipts RLS Policies
DROP POLICY IF EXISTS receipt_uploads_user_access ON receipt_uploads;
CREATE POLICY receipt_uploads_user_access ON receipt_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = receipt_uploads.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS receipts_user_access ON receipts;
CREATE POLICY receipts_user_access ON receipts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM receipt_uploads ru
      JOIN billing_accounts ba ON ba.id = ru.billing_account_id
      WHERE ru.id = receipts.upload_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS receipt_items_user_access ON receipt_items;
CREATE POLICY receipt_items_user_access ON receipt_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM receipts r
      JOIN receipt_uploads ru ON ru.id = r.upload_id
      JOIN billing_accounts ba ON ba.id = ru.billing_account_id
      WHERE r.id = receipt_items.receipt_id
        AND ba.user_id = current_user_id()
    )
  );

-- Feature Flags RLS Policies
DROP POLICY IF EXISTS feature_flags_user_access ON feature_flags;
CREATE POLICY feature_flags_user_access ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = feature_flags.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS feature_flag_environments_user_access ON feature_flag_environments;
CREATE POLICY feature_flag_environments_user_access ON feature_flag_environments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM feature_flags ff
      JOIN billing_accounts ba ON ba.id = ff.billing_account_id
      WHERE ff.id = feature_flag_environments.flag_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS feature_flag_overrides_user_access ON feature_flag_overrides;
CREATE POLICY feature_flag_overrides_user_access ON feature_flag_overrides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM feature_flags ff
      JOIN billing_accounts ba ON ba.id = ff.billing_account_id
      WHERE ff.id = feature_flag_overrides.flag_id
        AND ba.user_id = current_user_id()
    )
  );

-- Tenant Branding/Navigation/Pages RLS Policies
DROP POLICY IF EXISTS tenant_branding_user_access ON tenant_branding;
CREATE POLICY tenant_branding_user_access ON tenant_branding
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = tenant_branding.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS tenant_navigation_user_access ON tenant_navigation;
CREATE POLICY tenant_navigation_user_access ON tenant_navigation
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = tenant_navigation.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS tenant_pages_user_access ON tenant_pages;
CREATE POLICY tenant_pages_user_access ON tenant_pages
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = tenant_pages.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS tenant_page_revisions_user_access ON tenant_page_revisions;
CREATE POLICY tenant_page_revisions_user_access ON tenant_page_revisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_pages tp
      JOIN tenants t ON t.id = tp.tenant_id
      JOIN billing_accounts ba ON ba.id = t.billing_account_id
      WHERE tp.id = tenant_page_revisions.tenant_page_id
        AND ba.user_id = current_user_id()
    )
  );

-- Experiments RLS Policies
DROP POLICY IF EXISTS experiments_user_access ON experiments;
CREATE POLICY experiments_user_access ON experiments
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = experiments.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS experiment_variants_user_access ON experiment_variants;
CREATE POLICY experiment_variants_user_access ON experiment_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM experiments e
      JOIN tenants t ON t.id = e.tenant_id
      JOIN billing_accounts ba ON ba.id = t.billing_account_id
      WHERE e.id = experiment_variants.experiment_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS experiment_metric_events_user_access ON experiment_metric_events;
CREATE POLICY experiment_metric_events_user_access ON experiment_metric_events
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = experiment_metric_events.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

-- Webhooks RLS Policies
DROP POLICY IF EXISTS webhooks_user_access ON webhooks;
CREATE POLICY webhooks_user_access ON webhooks
  FOR ALL USING (
    user_id = current_user_id()
    OR (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
  );

DROP POLICY IF EXISTS webhook_deliveries_user_access ON webhook_deliveries;
CREATE POLICY webhook_deliveries_user_access ON webhook_deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_deliveries.webhook_id
        AND (
          w.user_id = current_user_id()
          OR (w.tenant_id IS NOT NULL AND w.tenant_id = current_tenant_id())
        )
    )
  );

-- Idempotency Keys RLS Policies (public read for idempotency checks)
DROP POLICY IF EXISTS idempotency_keys_user_access ON idempotency_keys;
CREATE POLICY idempotency_keys_user_access ON idempotency_keys
  FOR ALL USING (true); -- Idempotency keys are public for API key auth

-- Stripe Events RLS Policies
DROP POLICY IF EXISTS stripe_events_user_access ON stripe_events;
CREATE POLICY stripe_events_user_access ON stripe_events
  FOR ALL USING (
    user_id = current_user_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = stripe_events.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

-- Console Activities RLS Policies
DROP POLICY IF EXISTS console_activities_user_access ON console_activities;
CREATE POLICY console_activities_user_access ON console_activities
  FOR SELECT USING (
    user_id = current_user_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = console_activities.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS console_activities_user_insert ON console_activities;
CREATE POLICY console_activities_user_insert ON console_activities
  FOR INSERT WITH CHECK (
    user_id = current_user_id()
  );

-- ============================================================================
-- CONSOLE ACTIVITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_console_activity(
  p_user_id UUID,
  p_billing_account_id UUID,
  p_activity_type VARCHAR,
  p_action VARCHAR,
  p_title VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_resource_id UUID DEFAULT NULL,
  p_resource_type VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from billing account
  SELECT tenant_id INTO v_tenant_id
  FROM billing_accounts
  WHERE id = p_billing_account_id;
  
  -- Insert activity
  INSERT INTO console_activities (
    user_id,
    billing_account_id,
    tenant_id,
    activity_type,
    action,
    title,
    description,
    status,
    metadata,
    resource_id,
    resource_type
  ) VALUES (
    p_user_id,
    p_billing_account_id,
    v_tenant_id,
    p_activity_type,
    p_action,
    p_title,
    p_description,
    p_status,
    p_metadata,
    p_resource_id,
    p_resource_type
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_recent_console_activities(
  p_billing_account_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  activity_type VARCHAR,
  action VARCHAR,
  title VARCHAR,
  status VARCHAR,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.activity_type,
    ca.action,
    ca.title,
    ca.status,
    ca.metadata,
    ca.created_at
  FROM console_activities ca
  WHERE ca.billing_account_id = p_billing_account_id
    AND ca.user_id = current_user_id()
  ORDER BY ca.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENSURE API_KEYS TABLE HAS PROPER RLS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_keys') THEN
    ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS api_keys_user_access ON api_keys;
    CREATE POLICY api_keys_user_access ON api_keys
      FOR ALL USING (
        user_id = current_user_id()
        OR (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
      );
  END IF;
END $$;

-- ============================================================================
-- ENSURE BILLING_ACCOUNTS TABLE HAS PROPER RLS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'billing_accounts') THEN
    ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS billing_accounts_user_access ON billing_accounts;
    CREATE POLICY billing_accounts_user_access ON billing_accounts
      FOR ALL USING (
        user_id = current_user_id()
        OR (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
      );
  END IF;
END $$;

-- ============================================================================
-- ENSURE USAGE_EVENTS TABLE HAS PROPER RLS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_events') THEN
    ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS usage_events_billing_account_access ON usage_events;
    CREATE POLICY usage_events_billing_account_access ON usage_events
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM billing_accounts ba
          WHERE ba.id = usage_events.billing_account_id
            AND (
              ba.user_id = current_user_id()
              OR (ba.tenant_id IS NOT NULL AND ba.tenant_id = current_tenant_id())
            )
        )
      );
  END IF;
END $$;

COMMIT;
