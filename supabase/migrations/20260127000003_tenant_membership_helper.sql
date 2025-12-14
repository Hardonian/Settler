-- Migration: tenant_membership_helper
-- Created: 2026-01-27
-- Description: Create helper function to check tenant membership

BEGIN;

-- ============================================================================
-- HELPER FUNCTION: is_tenant_member
-- ============================================================================

-- Function to check if current user is a member of a tenant
CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_member BOOLEAN := false;
BEGIN
  -- Get current user ID
  v_user_id := current_user_id();
  
  -- If no user ID, return false
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is member of tenant
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = p_tenant_id
      AND user_id = v_user_id
  ) INTO v_is_member;
  
  RETURN COALESCE(v_is_member, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_tenant_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_member(UUID) TO anon;

COMMIT;
