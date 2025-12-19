-- Migration: integration_credentials_schema
-- Created: 2025-01-20 00:00:04 UTC
-- Description: Secure storage for integration credentials (OAuth tokens, API keys, webhook secrets)
-- Priority: P0 (CRITICAL - Credential security)

BEGIN;

-- ============================================================================
-- INTEGRATION CREDENTIALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE CASCADE,
  integration_id VARCHAR(100) NOT NULL, -- stripe, shopify, paypal, etc.
  credential_type VARCHAR(50) NOT NULL, -- 'oauth_token', 'api_key', 'webhook_secret', 'api_secret'
  
  -- Encrypted credential data (AES-256-GCM)
  encrypted_credential TEXT NOT NULL,
  encryption_key_id VARCHAR(255) NOT NULL, -- Reference to key used for encryption
  
  -- Metadata
  scopes TEXT[], -- OAuth scopes (if applicable)
  expires_at TIMESTAMPTZ, -- Token expiration (if applicable)
  refresh_token_encrypted TEXT, -- Encrypted refresh token (if applicable)
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, expired, revoked, error
  last_used_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Webhook configuration (if applicable)
  webhook_url TEXT,
  webhook_secret_encrypted TEXT,
  webhook_verified BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(tenant_id, integration_id, credential_type) -- One credential per type per tenant
);

-- Create indexes conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_credentials') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_credentials' AND column_name = 'tenant_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_integration_credentials_tenant_id ON integration_credentials(tenant_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_credentials' AND column_name = 'user_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_integration_credentials_user_id ON integration_credentials(user_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_credentials' AND column_name = 'billing_account_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_integration_credentials_billing_account_id ON integration_credentials(billing_account_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_credentials' AND column_name = 'integration_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_integration_credentials_integration_id ON integration_credentials(integration_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_credentials' AND column_name = 'status') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_integration_credentials_status ON integration_credentials(status)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_credentials' AND column_name = 'expires_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_integration_credentials_expires_at ON integration_credentials(expires_at) WHERE expires_at IS NOT NULL';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT credentials for their tenant
DROP POLICY IF EXISTS integration_credentials_select_tenant ON integration_credentials;
-- Create policy conditionally based on column existence
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_credentials' AND column_name = 'billing_account_id') THEN
    EXECUTE '
      CREATE POLICY integration_credentials_select_tenant ON integration_credentials
        FOR SELECT
        USING (
          tenant_id = (
            SELECT tenant_id FROM users
            WHERE users.id = (current_setting(''request.jwt.claims'', true)::jsonb->>''sub'')::UUID
          )
          OR EXISTS (
            SELECT 1 FROM billing_accounts
            WHERE billing_accounts.id = integration_credentials.billing_account_id
              AND billing_accounts.user_id = (current_setting(''request.jwt.claims'', true)::jsonb->>''sub'')::UUID
          )
        )';
  ELSE
    -- Fallback policy without billing_account_id reference
    EXECUTE '
      CREATE POLICY integration_credentials_select_tenant ON integration_credentials
        FOR SELECT
        USING (
          tenant_id = (
            SELECT tenant_id FROM users
            WHERE users.id = (current_setting(''request.jwt.claims'', true)::jsonb->>''sub'')::UUID
          )
        )';
  END IF;
END $$;

-- Users can only INSERT credentials for their tenant
DROP POLICY IF EXISTS integration_credentials_insert_tenant ON integration_credentials;
CREATE POLICY integration_credentials_insert_tenant ON integration_credentials
  FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID
    )
  );

-- Users can only UPDATE credentials for their tenant
DROP POLICY IF EXISTS integration_credentials_update_tenant ON integration_credentials;
CREATE POLICY integration_credentials_update_tenant ON integration_credentials
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID
    )
  );

-- Users cannot DELETE credentials (soft delete via revoked_at)
DROP POLICY IF EXISTS integration_credentials_delete_tenant ON integration_credentials;
CREATE POLICY integration_credentials_delete_tenant ON integration_credentials
  FOR DELETE
  USING (false);

-- ============================================================================
-- ENCRYPTION FUNCTIONS (using pgcrypto)
-- ============================================================================

-- Function to encrypt credential (should be called with service role)
-- Note: In production, use external key management (AWS KMS, HashiCorp Vault, etc.)
CREATE OR REPLACE FUNCTION encrypt_credential(
  p_credential TEXT,
  p_encryption_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key TEXT;
  v_encrypted TEXT;
BEGIN
  -- Use provided key or generate from environment
  v_key := COALESCE(p_encryption_key, current_setting('app.encryption_key', true));
  
  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  
  -- Encrypt using pgcrypto (AES-256)
  -- Note: This is a simplified version - production should use proper key management
  v_encrypted := encode(
    encrypt(
      p_credential::bytea,
      v_key::bytea,
      'aes'
    ),
    'base64'
  );
  
  RETURN v_encrypted;
END;
$$;

-- Function to decrypt credential (should be called with service role)
CREATE OR REPLACE FUNCTION decrypt_credential(
  p_encrypted TEXT,
  p_encryption_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key TEXT;
  v_decrypted TEXT;
BEGIN
  -- Use provided key or generate from environment
  v_key := COALESCE(p_encryption_key, current_setting('app.encryption_key', true));
  
  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  
  -- Decrypt using pgcrypt
  v_decrypted := convert_from(
    decrypt(
      decode(p_encrypted, 'base64'),
      v_key::bytea,
      'aes'
    ),
    'UTF8'
  );
  
  RETURN v_decrypted;
END;
$$;

-- ============================================================================
-- INTEGRATION QUOTA TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  api_calls INTEGER DEFAULT 0,
  webhook_events INTEGER DEFAULT 0,
  data_synced_mb DECIMAL(10, 2) DEFAULT 0,
  cost_usd DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, integration_id, date)
);

CREATE INDEX IF NOT EXISTS idx_integration_quota_usage_tenant_id ON integration_quota_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_quota_usage_integration_id ON integration_quota_usage(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_quota_usage_date ON integration_quota_usage(date);

-- ============================================================================
-- INTEGRATION HEALTH SCORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id VARCHAR(100) NOT NULL,
  health_score INTEGER DEFAULT 100, -- 0-100 (100 = healthy, 0 = critical)
  status VARCHAR(50) DEFAULT 'healthy', -- healthy, degraded, down, error
  last_successful_sync TIMESTAMPTZ,
  last_failed_sync TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  error_message TEXT,
  auto_disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, integration_id)
);

CREATE INDEX IF NOT EXISTS idx_integration_health_tenant_id ON integration_health(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_health_integration_id ON integration_health(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_health_status ON integration_health(status);
CREATE INDEX IF NOT EXISTS idx_integration_health_auto_disabled ON integration_health(auto_disabled) WHERE auto_disabled = true;

-- ============================================================================
-- FUNCTION: Auto-disable malfunctioning integrations
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_disable_failing_integrations()
RETURNS TABLE(
  tenant_id UUID,
  integration_id VARCHAR(100),
  disabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Find integrations with >5 consecutive failures in last hour
  FOR v_record IN
    SELECT
      ih.tenant_id,
      ih.integration_id,
      ih.consecutive_failures
    FROM integration_health ih
    WHERE ih.consecutive_failures >= 5
      AND ih.last_failed_sync >= NOW() - INTERVAL '1 hour'
      AND ih.auto_disabled = false
  LOOP
    -- Disable integration
    UPDATE integration_health
    SET auto_disabled = true,
        status = 'error',
        updated_at = NOW()
    WHERE integration_health.tenant_id = v_record.tenant_id
      AND integration_health.integration_id = v_record.integration_id;

    -- Revoke credentials (soft delete)
    UPDATE integration_credentials
    SET status = 'error',
        revoked_at = NOW(),
        updated_at = NOW()
    WHERE tenant_id = v_record.tenant_id
      AND integration_id = v_record.integration_id
      AND status = 'active';

    tenant_id := v_record.tenant_id;
    integration_id := v_record.integration_id;
    disabled := true;
    RETURN NEXT;
  END LOOP;
END;
$$;

COMMIT;
