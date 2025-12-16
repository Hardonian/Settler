-- Migration: Tenant Context Helper Function
-- Created: 2026-01-30
-- Description: Helper function to set tenant context for RLS policies

BEGIN;

-- ============================================================================
-- TENANT CONTEXT HELPER FUNCTION
-- ============================================================================

-- Function to set tenant context (for RLS policies that use current_setting)
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
  -- Set session variable for RLS policies
  PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO authenticated;

COMMIT;
