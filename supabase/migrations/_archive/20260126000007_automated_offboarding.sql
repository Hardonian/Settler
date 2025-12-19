-- Migration: Automated Offboarding
-- Created: 2026-01-26
-- Description: Automated cleanup when user deletes account

BEGIN;

-- Function to handle user account deletion and cleanup
CREATE OR REPLACE FUNCTION handle_user_offboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark user data for deletion (soft delete)
  -- In production, you might want to queue actual deletion for compliance reasons
  
  -- Update user profile
  UPDATE profiles
  SET deleted_at = NOW()
  WHERE id = OLD.id;
  
  -- Revoke all API keys
  UPDATE api_keys
  SET revoked = TRUE, revoked_at = NOW()
  WHERE user_id = OLD.id AND revoked = FALSE;
  
  -- Cancel active subscriptions
  UPDATE subscriptions
  SET status = 'canceled', canceled_at = NOW()
  WHERE billing_account_id IN (
    SELECT id FROM billing_accounts WHERE user_id = OLD.id
  )
  AND status = 'active';
  
  -- Log offboarding event
  INSERT INTO activity_log (user_id, activity_type, entity_type, entity_id, metadata)
  VALUES (
    OLD.id,
    'account_deleted',
    'user',
    OLD.id,
    jsonb_build_object(
      'deleted_at', NOW(),
      'offboarding_automated', TRUE
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user deletion (if users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    DROP TRIGGER IF EXISTS trigger_handle_user_offboarding ON users;
    EXECUTE 'CREATE TRIGGER trigger_handle_user_offboarding
      AFTER DELETE ON users
      FOR EACH ROW
      EXECUTE FUNCTION handle_user_offboarding()';
  END IF;
END $$;

-- Function to cleanup expired shareable artifacts
CREATE OR REPLACE FUNCTION cleanup_expired_artifacts()
RETURNS void AS $$
BEGIN
  DELETE FROM shareable_artifacts
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION handle_user_offboarding() IS 'Automatically handles user account deletion and cleanup';
COMMENT ON FUNCTION cleanup_expired_artifacts() IS 'Cleans up expired shareable artifacts';

COMMIT;
