-- Migration: enterprise_rls_policies
-- Created: 2025-12-19 00:16:48 UTC
-- Description: RLS policies for tenant isolation - cannot be bypassed

BEGIN;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_media ENABLE ROW LEVEL SECURITY;

-- Ensure subscriptions has RLS enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current tenant_id from JWT claim or header
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Try to get from JWT claim first
  v_tenant_id := current_setting('request.jwt.claims', true)::jsonb->>'tenant_id';
  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id::UUID;
  END IF;
  
  -- Fallback: get from header (for server routes)
  v_tenant_id := current_setting('request.headers', true)::jsonb->>'x-tenant-id';
  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id::UUID;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is a member of a tenant
CREATE OR REPLACE FUNCTION is_member(p_tenant_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships
    WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user has a specific role in a tenant
CREATE OR REPLACE FUNCTION has_role(p_tenant_id UUID, p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships
    WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
      AND role = p_role
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if tenant has a paid subscription
CREATE OR REPLACE FUNCTION is_paid(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.tenant_id = p_tenant_id
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- MEMBERSHIPS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
CREATE POLICY "Users can view their own memberships" ON memberships
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all memberships in their tenant" ON memberships;
CREATE POLICY "Admins can view all memberships in their tenant" ON memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = memberships.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admins can manage memberships in their tenant" ON memberships;
CREATE POLICY "Admins can manage memberships in their tenant" ON memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = memberships.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- ============================================================================
-- ENTITLEMENTS RLS POLICIES
-- ============================================================================
-- Entitlements are read-only for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view entitlements" ON entitlements;
CREATE POLICY "Authenticated users can view entitlements" ON entitlements
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- SUBSCRIPTIONS RLS POLICIES
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    -- Admins can view subscriptions for their tenant
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view subscriptions for their tenant" ON subscriptions';
    EXECUTE 'CREATE POLICY "Admins can view subscriptions for their tenant" ON subscriptions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM memberships m
          WHERE m.tenant_id = subscriptions.tenant_id
            AND m.user_id = auth.uid()
            AND m.role IN (''owner'', ''admin'')
            AND m.status = ''active''
        )
      )';
    
    -- Service role can write (for webhooks)
    EXECUTE 'DROP POLICY IF EXISTS "Service role can write subscriptions" ON subscriptions';
    EXECUTE 'CREATE POLICY "Service role can write subscriptions" ON subscriptions
      FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- ============================================================================
-- USAGE_EVENTS RLS POLICIES
-- ============================================================================
-- Allow insert for authenticated users (rate limiting happens in app layer)
DROP POLICY IF EXISTS "Authenticated users can insert usage events" ON usage_events;
CREATE POLICY "Authenticated users can insert usage events" ON usage_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow anon insert (for public API endpoints with rate limiting)
DROP POLICY IF EXISTS "Anon can insert usage events" ON usage_events;
CREATE POLICY "Anon can insert usage events" ON usage_events
  FOR INSERT WITH CHECK (true);

-- Admins can view usage events for their tenant
DROP POLICY IF EXISTS "Admins can view usage events for their tenant" ON usage_events;
CREATE POLICY "Admins can view usage events for their tenant" ON usage_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = usage_events.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- Users can view their own usage events
DROP POLICY IF EXISTS "Users can view their own usage events" ON usage_events;
CREATE POLICY "Users can view their own usage events" ON usage_events
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- CMS_PAGES RLS POLICIES
-- ============================================================================
-- Members can view published pages
DROP POLICY IF EXISTS "Members can view published pages" ON cms_pages;
CREATE POLICY "Members can view published pages" ON cms_pages
  FOR SELECT USING (
    status = 'published' OR
    is_member(tenant_id, auth.uid())
  );

-- Editors and admins can manage pages
DROP POLICY IF EXISTS "Editors can manage pages" ON cms_pages;
CREATE POLICY "Editors can manage pages" ON cms_pages
  FOR ALL USING (
    has_role(tenant_id, auth.uid(), 'admin') OR
    has_role(tenant_id, auth.uid(), 'editor')
  );

-- ============================================================================
-- CMS_PAGE_VERSIONS RLS POLICIES
-- ============================================================================
-- Editors can view versions
DROP POLICY IF EXISTS "Editors can view page versions" ON cms_page_versions;
CREATE POLICY "Editors can view page versions" ON cms_page_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cms_pages p
      JOIN memberships m ON m.tenant_id = p.tenant_id
      WHERE p.id = cms_page_versions.page_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'editor')
        AND m.status = 'active'
    )
  );

-- Editors can create versions
DROP POLICY IF EXISTS "Editors can create page versions" ON cms_page_versions;
CREATE POLICY "Editors can create page versions" ON cms_page_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cms_pages p
      JOIN memberships m ON m.tenant_id = p.tenant_id
      WHERE p.id = cms_page_versions.page_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'editor')
        AND m.status = 'active'
    )
  );

-- ============================================================================
-- CMS_MEDIA RLS POLICIES
-- ============================================================================
-- Members can view media
DROP POLICY IF EXISTS "Members can view media" ON cms_media;
CREATE POLICY "Members can view media" ON cms_media
  FOR SELECT USING (is_member(tenant_id, auth.uid()));

-- Editors can manage media
DROP POLICY IF EXISTS "Editors can manage media" ON cms_media;
CREATE POLICY "Editors can manage media" ON cms_media
  FOR ALL USING (
    has_role(tenant_id, auth.uid(), 'admin') OR
    has_role(tenant_id, auth.uid(), 'editor')
  );

COMMIT;
