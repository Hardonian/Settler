-- ============================================================================
-- SETTLER.DEV CANONICAL GOLDEN MIGRATION
-- ============================================================================
-- This is the canonical, idempotent schema definition for Settler.dev
-- Generated from production introspection: 2025-12-19T08:10:35.082Z
-- 
-- IMPORTANT: This migration is designed to be:
-- 1. Idempotent - safe to run multiple times (uses IF NOT EXISTS)
-- 2. Complete - defines the entire application schema
-- 3. Authoritative - this is the source of truth
-- 4. Lean - only includes application tables/functions, not Supabase system objects
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_segment') THEN
    CREATE TYPE public.customer_segment AS ENUM ('free_tier', 'trial', 'commercial', 'enterprise', 'churned');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_sequence_type') THEN
    CREATE TYPE public.email_sequence_type AS ENUM ('onboarding', 'upgrade_prompt', 'expansion', 'churn_save', 'trial_ending', 'payment_failed', 'activation_reminder');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_status') THEN
    CREATE TYPE public.export_status AS ENUM ('pending', 'running', 'succeeded', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_severity') THEN
    CREATE TYPE public.issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
    CREATE TYPE public.issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_event_type') THEN
    CREATE TYPE public.receipt_event_type AS ENUM ('receipt.created', 'receipt.processed', 'receipt.failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_upload_status') THEN
    CREATE TYPE public.receipt_upload_status AS ENUM ('pending', 'processing', 'processed', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_lifecycle_stage') THEN
    CREATE TYPE public.user_lifecycle_stage AS ENUM ('signup', 'activation', 'engaged', 'retention', 'expansion', 'at_risk', 'churned');
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_index_if_not_exists(
    p_index_name TEXT,
    p_table_name TEXT,
    p_index_definition TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = p_table_name 
        AND indexname = p_index_name
    ) THEN
        EXECUTE format('CREATE INDEX %I ON %I %s', p_index_name, p_table_name, p_index_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_policy_name TEXT,
    p_table_name TEXT,
    p_policy_definition TEXT
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
    EXECUTE format('CREATE POLICY %I ON %I %s', p_policy_name, p_table_name, p_policy_definition);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  IF v_tenant_id IS NULL THEN
    BEGIN
      v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLES IN SCHEMA: analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics.index_usage_snapshots (
  schemaname text NOT NULL,
  relname text NOT NULL,
  indexrelname text NOT NULL,
  idx_scan int8,
  idx_tup_read int8,
  idx_tup_fetch int8,
  relpages int8,
  indisunique bool,
  indisprimary bool,
  pg_size_bytes int8,
  captured_at timestamptz NOT NULL DEFAULT now(),
  id int8 NOT NULL,
  PRIMARY KEY (id)
);

-- ============================================================================
-- TABLES IN SCHEMA: app_private
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_private.audit_log (
  id int8 NOT NULL,
  at timestamptz DEFAULT now(),
  actor uuid,
  action text NOT NULL,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  row_pk text,
  details jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_private.memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_fkey' AND conrelid = 'app_private.memberships'::regclass
  ) THEN
    ALTER TABLE app_private.memberships ADD CONSTRAINT memberships_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_fkey' AND conrelid = 'app_private.memberships'::regclass
  ) THEN
    ALTER TABLE app_private.memberships ADD CONSTRAINT memberships_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_user_id_fkey' AND conrelid = 'app_private.memberships'::regclass
  ) THEN
    ALTER TABLE app_private.memberships ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_user_id_fkey' AND conrelid = 'app_private.memberships'::regclass
  ) THEN
    ALTER TABLE app_private.memberships ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_user_id_key' AND conrelid = 'app_private.memberships'::regclass
  ) THEN
    ALTER TABLE app_private.memberships ADD CONSTRAINT memberships_tenant_id_user_id_key UNIQUE (tenant_id, user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_user_id_key' AND conrelid = 'app_private.memberships'::regclass
  ) THEN
    ALTER TABLE app_private.memberships ADD CONSTRAINT memberships_tenant_id_user_id_key UNIQUE (tenant_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_memberships_status ON app_private.memberships USING btree (status);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON app_private.memberships USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON app_private.memberships USING btree (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON app_private.memberships USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS memberships_tenant_id_user_id_key ON app_private.memberships USING btree (tenant_id, user_id);

CREATE TABLE IF NOT EXISTS app_private.profiles_enterprise (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_enterprise_id_fkey' AND conrelid = 'app_private.profiles_enterprise'::regclass
  ) THEN
    ALTER TABLE app_private.profiles_enterprise ADD CONSTRAINT profiles_enterprise_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS app_private.usage_events_enterprise (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  event_name text NOT NULL,
  props jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_events_enterprise_tenant_id_fkey' AND conrelid = 'app_private.usage_events_enterprise'::regclass
  ) THEN
    ALTER TABLE app_private.usage_events_enterprise ADD CONSTRAINT usage_events_enterprise_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_events_enterprise_user_id_fkey' AND conrelid = 'app_private.usage_events_enterprise'::regclass
  ) THEN
    ALTER TABLE app_private.usage_events_enterprise ADD CONSTRAINT usage_events_enterprise_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_events_ent_created_at ON app_private.usage_events_enterprise USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_ent_event_name ON app_private.usage_events_enterprise USING btree (event_name);

CREATE INDEX IF NOT EXISTS idx_usage_events_ent_tenant_event_created ON app_private.usage_events_enterprise USING btree (tenant_id, event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_ent_tenant_id ON app_private.usage_events_enterprise USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_ent_user_id ON app_private.usage_events_enterprise USING btree (user_id);

-- ============================================================================
-- TABLES IN SCHEMA: auth
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
  instance_id uuid,
  id uuid NOT NULL,
  payload json,
  created_at timestamptz,
  ip_address varchar NOT NULL DEFAULT ''::character varying,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);

CREATE TABLE IF NOT EXISTS auth.flow_state (
  id uuid NOT NULL,
  user_id uuid,
  auth_code text NOT NULL,
  code_challenge_method code_challenge_method NOT NULL,
  code_challenge text NOT NULL,
  provider_type text NOT NULL,
  provider_access_token text,
  provider_refresh_token text,
  created_at timestamptz,
  updated_at timestamptz,
  authentication_method text NOT NULL,
  auth_code_issued_at timestamptz,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_code ON auth.flow_state USING btree (auth_code);

CREATE INDEX IF NOT EXISTS idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);

CREATE TABLE IF NOT EXISTS auth.identities (
  provider_id text NOT NULL,
  user_id uuid NOT NULL,
  identity_data jsonb NOT NULL,
  provider text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  email text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'identities_user_id_fkey' AND conrelid = 'auth.identities'::regclass
  ) THEN
    ALTER TABLE auth.identities ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'identities_provider_id_provider_unique' AND conrelid = 'auth.identities'::regclass
  ) THEN
    ALTER TABLE auth.identities ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS identities_email_idx ON auth.identities USING btree (email text_pattern_ops);

CREATE UNIQUE INDEX IF NOT EXISTS identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider);

CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities USING btree (user_id);

CREATE TABLE IF NOT EXISTS auth.instances (
  id uuid NOT NULL,
  uuid uuid,
  raw_base_config text,
  created_at timestamptz,
  updated_at timestamptz,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auth.mfa_amr_claims (
  session_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  authentication_method text NOT NULL,
  id uuid NOT NULL,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mfa_amr_claims_session_id_fkey' AND conrelid = 'auth.mfa_amr_claims'::regclass
  ) THEN
    ALTER TABLE auth.mfa_amr_claims ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS mfa_amr_claims_session_id_authentication_method_pkey ON auth.mfa_amr_claims USING btree (session_id, authentication_method);

CREATE TABLE IF NOT EXISTS auth.mfa_challenges (
  id uuid NOT NULL,
  factor_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  verified_at timestamptz,
  ip_address inet NOT NULL,
  otp_code text,
  web_authn_session_data jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mfa_challenges_auth_factor_id_fkey' AND conrelid = 'auth.mfa_challenges'::regclass
  ) THEN
    ALTER TABLE auth.mfa_challenges ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);

CREATE TABLE IF NOT EXISTS auth.mfa_factors (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  friendly_name text,
  factor_type factor_type NOT NULL,
  status factor_status NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  secret text,
  phone text,
  last_challenged_at timestamptz,
  web_authn_credential jsonb,
  web_authn_aaguid uuid,
  last_webauthn_challenge_data jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mfa_factors_user_id_fkey' AND conrelid = 'auth.mfa_factors'::regclass
  ) THEN
    ALTER TABLE auth.mfa_factors ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mfa_factors_last_challenged_at_key' AND conrelid = 'auth.mfa_factors'::regclass
  ) THEN
    ALTER TABLE auth.mfa_factors ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at);

CREATE UNIQUE INDEX IF NOT EXISTS mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);

CREATE INDEX IF NOT EXISTS mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);

CREATE TABLE IF NOT EXISTS auth.oauth_authorizations (
  id uuid NOT NULL,
  authorization_id text NOT NULL,
  client_id uuid NOT NULL,
  user_id uuid,
  redirect_uri text NOT NULL,
  scope text NOT NULL,
  state text,
  resource text,
  code_challenge text,
  code_challenge_method code_challenge_method,
  response_type oauth_response_type NOT NULL DEFAULT 'code'::auth.oauth_response_type,
  status oauth_authorization_status NOT NULL DEFAULT 'pending'::auth.oauth_authorization_status,
  authorization_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + '00:03:00'::interval),
  approved_at timestamptz,
  nonce text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_authorizations_client_id_fkey' AND conrelid = 'auth.oauth_authorizations'::regclass
  ) THEN
    ALTER TABLE auth.oauth_authorizations ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_authorizations_user_id_fkey' AND conrelid = 'auth.oauth_authorizations'::regclass
  ) THEN
    ALTER TABLE auth.oauth_authorizations ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_authorizations_authorization_code_key' AND conrelid = 'auth.oauth_authorizations'::regclass
  ) THEN
    ALTER TABLE auth.oauth_authorizations ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_authorizations_authorization_id_key' AND conrelid = 'auth.oauth_authorizations'::regclass
  ) THEN
    ALTER TABLE auth.oauth_authorizations ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_authorizations_authorization_code_key ON auth.oauth_authorizations USING btree (authorization_code);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_authorizations_authorization_id_key ON auth.oauth_authorizations USING btree (authorization_id);

CREATE TABLE IF NOT EXISTS auth.oauth_client_states (
  id uuid NOT NULL,
  provider_type text NOT NULL,
  code_verifier text,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);

CREATE TABLE IF NOT EXISTS auth.oauth_clients (
  id uuid NOT NULL,
  client_secret_hash text,
  registration_type oauth_registration_type NOT NULL,
  redirect_uris text NOT NULL,
  grant_types text NOT NULL,
  client_name text,
  client_uri text,
  logo_uri text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  client_type oauth_client_type NOT NULL DEFAULT 'confidential'::auth.oauth_client_type,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);

CREATE TABLE IF NOT EXISTS auth.oauth_consents (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  scopes text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_consents_client_id_fkey' AND conrelid = 'auth.oauth_consents'::regclass
  ) THEN
    ALTER TABLE auth.oauth_consents ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_consents_user_id_fkey' AND conrelid = 'auth.oauth_consents'::regclass
  ) THEN
    ALTER TABLE auth.oauth_consents ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_consents_user_client_unique' AND conrelid = 'auth.oauth_consents'::regclass
  ) THEN
    ALTER TABLE auth.oauth_consents ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);

CREATE INDEX IF NOT EXISTS oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_consents_user_client_unique ON auth.oauth_consents USING btree (user_id, client_id);

CREATE INDEX IF NOT EXISTS oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);

CREATE TABLE IF NOT EXISTS auth.one_time_tokens (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  token_type one_time_token_type NOT NULL,
  token_hash text NOT NULL,
  relates_to text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'one_time_tokens_user_id_fkey' AND conrelid = 'auth.one_time_tokens'::regclass
  ) THEN
    ALTER TABLE auth.one_time_tokens ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);

CREATE INDEX IF NOT EXISTS one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  instance_id uuid,
  id int8 NOT NULL,
  token varchar,
  user_id varchar,
  revoked bool,
  created_at timestamptz,
  updated_at timestamptz,
  parent varchar,
  session_id uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_session_id_fkey' AND conrelid = 'auth.refresh_tokens'::regclass
  ) THEN
    ALTER TABLE auth.refresh_tokens ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_token_unique' AND conrelid = 'auth.refresh_tokens'::regclass
  ) THEN
    ALTER TABLE auth.refresh_tokens ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);

CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);

CREATE INDEX IF NOT EXISTS refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);

CREATE INDEX IF NOT EXISTS refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);

CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token);

CREATE INDEX IF NOT EXISTS refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);

CREATE TABLE IF NOT EXISTS auth.saml_providers (
  id uuid NOT NULL,
  sso_provider_id uuid NOT NULL,
  entity_id text NOT NULL,
  metadata_xml text NOT NULL,
  metadata_url text,
  attribute_mapping jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  name_id_format text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saml_providers_sso_provider_id_fkey' AND conrelid = 'auth.saml_providers'::regclass
  ) THEN
    ALTER TABLE auth.saml_providers ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saml_providers_entity_id_key' AND conrelid = 'auth.saml_providers'::regclass
  ) THEN
    ALTER TABLE auth.saml_providers ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id);

CREATE INDEX IF NOT EXISTS saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);

CREATE TABLE IF NOT EXISTS auth.saml_relay_states (
  id uuid NOT NULL,
  sso_provider_id uuid NOT NULL,
  request_id text NOT NULL,
  for_email text,
  redirect_to text,
  created_at timestamptz,
  updated_at timestamptz,
  flow_state_id uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saml_relay_states_flow_state_id_fkey' AND conrelid = 'auth.saml_relay_states'::regclass
  ) THEN
    ALTER TABLE auth.saml_relay_states ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saml_relay_states_sso_provider_id_fkey' AND conrelid = 'auth.saml_relay_states'::regclass
  ) THEN
    ALTER TABLE auth.saml_relay_states ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);

CREATE INDEX IF NOT EXISTS saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);

CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  factor_id uuid,
  aal aal_level,
  not_after timestamptz,
  refreshed_at timestamp,
  user_agent text,
  ip inet,
  tag text,
  oauth_client_id uuid,
  refresh_token_hmac_key text,
  refresh_token_counter int8,
  scopes text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_oauth_client_id_fkey' AND conrelid = 'auth.sessions'::regclass
  ) THEN
    ALTER TABLE auth.sessions ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_fkey' AND conrelid = 'auth.sessions'::regclass
  ) THEN
    ALTER TABLE auth.sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);

CREATE INDEX IF NOT EXISTS sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions USING btree (user_id);

CREATE INDEX IF NOT EXISTS user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);

CREATE TABLE IF NOT EXISTS auth.sso_domains (
  id uuid NOT NULL,
  sso_provider_id uuid NOT NULL,
  domain text NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sso_domains_sso_provider_id_fkey' AND conrelid = 'auth.sso_domains'::regclass
  ) THEN
    ALTER TABLE auth.sso_domains ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));

CREATE INDEX IF NOT EXISTS sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);

CREATE TABLE IF NOT EXISTS auth.sso_providers (
  id uuid NOT NULL,
  resource_id text,
  created_at timestamptz,
  updated_at timestamptz,
  disabled bool,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));

CREATE INDEX IF NOT EXISTS sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);

CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid,
  id uuid NOT NULL,
  aud varchar,
  role varchar,
  email varchar,
  encrypted_password varchar,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token varchar,
  confirmation_sent_at timestamptz,
  recovery_token varchar,
  recovery_sent_at timestamptz,
  email_change_token_new varchar,
  email_change varchar,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin bool,
  created_at timestamptz,
  updated_at timestamptz,
  phone text DEFAULT NULL::character varying,
  phone_confirmed_at timestamptz,
  phone_change text DEFAULT ''::character varying,
  phone_change_token varchar DEFAULT ''::character varying,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz,
  email_change_token_current varchar DEFAULT ''::character varying,
  email_change_confirm_status int2 DEFAULT 0,
  banned_until timestamptz,
  reauthentication_token varchar DEFAULT ''::character varying,
  reauthentication_sent_at timestamptz,
  is_sso_user bool NOT NULL DEFAULT false,
  deleted_at timestamptz,
  is_anonymous bool NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_key' AND conrelid = 'auth.users'::regclass
  ) THEN
    ALTER TABLE auth.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);

CREATE UNIQUE INDEX IF NOT EXISTS email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);

CREATE UNIQUE INDEX IF NOT EXISTS email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);

CREATE UNIQUE INDEX IF NOT EXISTS reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);

CREATE UNIQUE INDEX IF NOT EXISTS recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);

CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));

CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users USING btree (instance_id);

CREATE INDEX IF NOT EXISTS users_is_anonymous_idx ON auth.users USING btree (is_anonymous);

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_key ON auth.users USING btree (phone);

-- ============================================================================
-- TABLES IN SCHEMA: cron
-- ============================================================================

CREATE TABLE IF NOT EXISTS cron.job (
  jobid int8 NOT NULL,
  schedule text NOT NULL,
  command text NOT NULL,
  nodename text NOT NULL DEFAULT 'localhost'::text,
  nodeport int4 NOT NULL DEFAULT inet_server_port(),
  database text NOT NULL DEFAULT current_database(),
  username text NOT NULL DEFAULT CURRENT_USER,
  active bool NOT NULL DEFAULT true,
  jobname text
);

CREATE UNIQUE INDEX IF NOT EXISTS jobname_username_uniq ON cron.job USING btree (jobname, username);

CREATE TABLE IF NOT EXISTS cron.job_run_details (
  jobid int8,
  runid int8 NOT NULL,
  job_pid int4,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz,
  PRIMARY KEY (runid)
);

-- ============================================================================
-- TABLES IN SCHEMA: net
-- ============================================================================

CREATE TABLE IF NOT EXISTS net._http_response (
  id int8,
  status_code int4,
  content_type text,
  headers jsonb,
  content text,
  timed_out bool,
  error_msg text,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS _http_response_created_idx ON net._http_response USING btree (created);

CREATE TABLE IF NOT EXISTS net.http_request_queue (
  id int8 NOT NULL,
  method text NOT NULL,
  url text NOT NULL,
  headers jsonb,
  body bytea,
  timeout_milliseconds int4 NOT NULL
);

-- ============================================================================
-- TABLES IN SCHEMA: public
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_balances (
  tenant_id uuid NOT NULL,
  account_type varchar NOT NULL,
  currency varchar NOT NULL DEFAULT 'USD'::character varying,
  balance_cents int8 NOT NULL DEFAULT 0,
  last_updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, account_type, currency)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_balances_tenant_id_fkey' AND conrelid = 'public.account_balances'::regclass
  ) THEN
    ALTER TABLE public.account_balances ADD CONSTRAINT account_balances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_account_balances_tenant_id ON public.account_balances USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.activation_checklist (
  user_id uuid NOT NULL,
  checklist_item varchar NOT NULL,
  completed bool NOT NULL DEFAULT false,
  completed_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, checklist_item)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activation_checklist_user_id_fkey' AND conrelid = 'public.activation_checklist'::regclass
  ) THEN
    ALTER TABLE public.activation_checklist ADD CONSTRAINT activation_checklist_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activation_checklist_created_at_desc ON public.activation_checklist USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activation_checklist_user_id ON public.activation_checklist USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  activity_type varchar NOT NULL,
  entity_type varchar,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_log_user_id_fkey' AND conrelid = 'public.activity_log'::regclass
  ) THEN
    ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log USING btree (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_metadata_gin ON public.activity_log USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_activity_log_type ON public.activity_log USING btree (activity_type);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON public.activity_log USING btree (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  entity_type varchar NOT NULL,
  entity_id uuid NOT NULL,
  action varchar NOT NULL,
  user_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_tenant_id_fkey' AND conrelid = 'public.activity_logs'::regclass
  ) THEN
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_user_id_fkey' AND conrelid = 'public.activity_logs'::regclass
  ) THEN
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_desc ON public.activity_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs USING btree (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_created ON public.activity_logs USING btree (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON public.activity_logs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.add_on_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  billing_account_id uuid NOT NULL,
  add_on_id uuid NOT NULL,
  stripe_subscription_item_id varchar,
  status varchar NOT NULL DEFAULT 'active'::character varying,
  purchased_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'add_on_purchases_add_on_id_fkey' AND conrelid = 'public.add_on_purchases'::regclass
  ) THEN
    ALTER TABLE public.add_on_purchases ADD CONSTRAINT add_on_purchases_add_on_id_fkey FOREIGN KEY (add_on_id) REFERENCES add_ons(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'add_on_purchases_billing_account_id_fkey' AND conrelid = 'public.add_on_purchases'::regclass
  ) THEN
    ALTER TABLE public.add_on_purchases ADD CONSTRAINT add_on_purchases_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'add_on_purchases_stripe_subscription_item_id_key' AND conrelid = 'public.add_on_purchases'::regclass
  ) THEN
    ALTER TABLE public.add_on_purchases ADD CONSTRAINT add_on_purchases_stripe_subscription_item_id_key UNIQUE (stripe_subscription_item_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS add_on_purchases_stripe_subscription_item_id_key ON public.add_on_purchases USING btree (stripe_subscription_item_id);

CREATE INDEX IF NOT EXISTS idx_add_on_purchases_add_on_id ON public.add_on_purchases USING btree (add_on_id);

CREATE INDEX IF NOT EXISTS idx_add_on_purchases_ba_id ON public.add_on_purchases USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_add_on_purchases_created_at_desc ON public.add_on_purchases USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_add_on_purchases_status ON public.add_on_purchases USING btree (status);

CREATE TABLE IF NOT EXISTS public.add_ons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  integration_id varchar NOT NULL,
  name varchar NOT NULL,
  description text,
  category varchar NOT NULL,
  base_price_monthly numeric NOT NULL,
  usage_price_per_unit numeric,
  usage_unit varchar,
  stripe_product_id varchar,
  stripe_price_id varchar,
  is_active bool DEFAULT true,
  is_standard bool DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'add_ons_integration_id_key' AND conrelid = 'public.add_ons'::regclass
  ) THEN
    ALTER TABLE public.add_ons ADD CONSTRAINT add_ons_integration_id_key UNIQUE (integration_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS add_ons_integration_id_key ON public.add_ons USING btree (integration_id);

CREATE INDEX IF NOT EXISTS idx_add_ons_created_at_desc ON public.add_ons USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_add_ons_integration_id ON public.add_ons USING btree (integration_id);

CREATE INDEX IF NOT EXISTS idx_add_ons_is_active ON public.add_ons USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_add_ons_is_standard ON public.add_ons USING btree (is_standard);

CREATE TABLE IF NOT EXISTS public.advisor_findings (
  id int8 NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  code text,
  message text,
  remediation_url text,
  raw jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.advisors_findings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  code text NOT NULL,
  severity text NOT NULL,
  title text NOT NULL,
  message text,
  remediation_url text,
  metadata jsonb,
  acknowledged bool NOT NULL DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  project_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_advisors_category_created ON public.advisors_findings USING btree (category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_advisors_code ON public.advisors_findings USING btree (code);

CREATE INDEX IF NOT EXISTS idx_advisors_findings_created_at_desc ON public.advisors_findings USING btree (created_at DESC);

CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL,
  user_id uuid NOT NULL,
  conversion_type varchar NOT NULL,
  revenue_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status varchar NOT NULL DEFAULT 'pending'::character varying,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_conversions_affiliate_id_fkey' AND conrelid = 'public.affiliate_conversions'::regclass
  ) THEN
    ALTER TABLE public.affiliate_conversions ADD CONSTRAINT affiliate_conversions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_conversions_user_id_fkey' AND conrelid = 'public.affiliate_conversions'::regclass
  ) THEN
    ALTER TABLE public.affiliate_conversions ADD CONSTRAINT affiliate_conversions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate ON public.affiliate_conversions USING btree (affiliate_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_created_at_desc ON public.affiliate_conversions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_user_id ON public.affiliate_conversions USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  affiliate_code varchar NOT NULL,
  partner_name varchar NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 10.0,
  status varchar NOT NULL DEFAULT 'active'::character varying,
  total_revenue numeric DEFAULT 0.0,
  total_payouts numeric DEFAULT 0.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliates_affiliate_code_key' AND conrelid = 'public.affiliates'::regclass
  ) THEN
    ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_affiliate_code_key UNIQUE (affiliate_code);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS affiliates_affiliate_code_key ON public.affiliates USING btree (affiliate_code);

CREATE INDEX IF NOT EXISTS idx_affiliates_created_at_desc ON public.affiliates USING btree (created_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_type varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'running'::character varying,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms int4,
  inputs jsonb DEFAULT '{}'::jsonb,
  outputs jsonb DEFAULT '{}'::jsonb,
  artifacts jsonb DEFAULT '[]'::jsonb,
  error_message text,
  error_stack text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_status ON public.agent_runs USING btree (agent_type, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_type ON public.agent_runs USING btree (agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at_desc ON public.agent_runs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON public.agent_runs USING btree (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs USING btree (status);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_runs_select_service_role_only ON public.agent_runs;
CREATE POLICY agent_runs_select_service_role_only ON public.agent_runs
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  analysis_type varchar NOT NULL,
  input_data jsonb,
  result jsonb NOT NULL,
  tokens_used int4 NOT NULL,
  confidence numeric,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_analyses_tenant_id_fkey' AND conrelid = 'public.ai_analyses'::regclass
  ) THEN
    ALTER TABLE public.ai_analyses ADD CONSTRAINT ai_analyses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON public.ai_analyses USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_by ON public.ai_analyses USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_result_gin ON public.ai_analyses USING gin (result);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_tenant_created ON public.ai_analyses USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_tenant_id ON public.ai_analyses USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON public.ai_analyses USING btree (analysis_type);

CREATE TABLE IF NOT EXISTS public.ai_analysis_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  period_start timestamptz NOT NULL,
  tokens_used int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_analysis_usage_tenant_id_fkey' AND conrelid = 'public.ai_analysis_usage'::regclass
  ) THEN
    ALTER TABLE public.ai_analysis_usage ADD CONSTRAINT ai_analysis_usage_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_analysis_usage_tenant_id_period_start_key' AND conrelid = 'public.ai_analysis_usage'::regclass
  ) THEN
    ALTER TABLE public.ai_analysis_usage ADD CONSTRAINT ai_analysis_usage_tenant_id_period_start_key UNIQUE (tenant_id, period_start);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ai_analysis_usage_tenant_id_period_start_key ON public.ai_analysis_usage USING btree (tenant_id, period_start);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_created_at_desc ON public.ai_analysis_usage USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_period_start ON public.ai_analysis_usage USING btree (period_start DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_tenant_id ON public.ai_analysis_usage USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_tenant_period ON public.ai_analysis_usage USING btree (tenant_id, period_start DESC);

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  billing_account_id uuid,
  event_type varchar NOT NULL,
  model_name varchar,
  prompt_tokens int4,
  completion_tokens int4,
  total_tokens int4,
  cost_usd numeric NOT NULL,
  cost_breakdown jsonb,
  latency_ms int4,
  success bool DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_events_billing_account_id_fkey' AND conrelid = 'public.ai_usage_events'::regclass
  ) THEN
    ALTER TABLE public.ai_usage_events ADD CONSTRAINT ai_usage_events_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_events_tenant_id_fkey' AND conrelid = 'public.ai_usage_events'::regclass
  ) THEN
    ALTER TABLE public.ai_usage_events ADD CONSTRAINT ai_usage_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_ba_id ON public.ai_usage_events USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_event_type ON public.ai_usage_events USING btree (event_type);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_tenant_id ON public.ai_usage_events USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_timestamp ON public.ai_usage_events USING btree ("timestamp" DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_delete ON public.ai_usage_events;
CREATE POLICY tenant_delete ON public.ai_usage_events
  FOR DELETE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  ;

DROP POLICY IF EXISTS tenant_insert ON public.ai_usage_events;
CREATE POLICY tenant_insert ON public.ai_usage_events
  FOR INSERT
  
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

DROP POLICY IF EXISTS tenant_select ON public.ai_usage_events;
CREATE POLICY tenant_select ON public.ai_usage_events
  FOR SELECT
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids)))))
  ;

DROP POLICY IF EXISTS tenant_update ON public.ai_usage_events;
CREATE POLICY tenant_update ON public.ai_usage_events
  FOR UPDATE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

CREATE TABLE IF NOT EXISTS public.ai_usage_quotas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  billing_account_id uuid,
  daily_request_limit int4 DEFAULT 1000,
  monthly_request_limit int4 DEFAULT 30000,
  daily_cost_limit_usd numeric DEFAULT 10.00,
  monthly_cost_limit_usd numeric DEFAULT 300.00,
  daily_requests int4 DEFAULT 0,
  monthly_requests int4 DEFAULT 0,
  daily_cost_usd numeric DEFAULT 0,
  monthly_cost_usd numeric DEFAULT 0,
  daily_reset_date date DEFAULT CURRENT_DATE,
  monthly_reset_date date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date,
  suspended bool DEFAULT false,
  suspended_reason text,
  suspended_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_quotas_billing_account_id_fkey' AND conrelid = 'public.ai_usage_quotas'::regclass
  ) THEN
    ALTER TABLE public.ai_usage_quotas ADD CONSTRAINT ai_usage_quotas_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_quotas_tenant_id_fkey' AND conrelid = 'public.ai_usage_quotas'::regclass
  ) THEN
    ALTER TABLE public.ai_usage_quotas ADD CONSTRAINT ai_usage_quotas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_quotas_tenant_id_billing_account_id_key' AND conrelid = 'public.ai_usage_quotas'::regclass
  ) THEN
    ALTER TABLE public.ai_usage_quotas ADD CONSTRAINT ai_usage_quotas_tenant_id_billing_account_id_key UNIQUE (tenant_id, billing_account_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_quotas_tenant_id_billing_account_id_key ON public.ai_usage_quotas USING btree (tenant_id, billing_account_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_ba_id ON public.ai_usage_quotas USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_created_at_desc ON public.ai_usage_quotas USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_suspended ON public.ai_usage_quotas USING btree (suspended) WHERE (suspended = true);

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_tenant_id ON public.ai_usage_quotas USING btree (tenant_id);

ALTER TABLE public.ai_usage_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_delete ON public.ai_usage_quotas;
CREATE POLICY tenant_delete ON public.ai_usage_quotas
  FOR DELETE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  ;

DROP POLICY IF EXISTS tenant_insert ON public.ai_usage_quotas;
CREATE POLICY tenant_insert ON public.ai_usage_quotas
  FOR INSERT
  
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

DROP POLICY IF EXISTS tenant_select ON public.ai_usage_quotas;
CREATE POLICY tenant_select ON public.ai_usage_quotas
  FOR SELECT
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids)))))
  ;

DROP POLICY IF EXISTS tenant_update ON public.ai_usage_quotas;
CREATE POLICY tenant_update ON public.ai_usage_quotas
  FOR UPDATE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

CREATE TABLE IF NOT EXISTS public.alert_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL,
  notification_type varchar NOT NULL,
  recipient text NOT NULL,
  status varchar DEFAULT 'pending'::character varying,
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alert_notifications_alert_id_fkey' AND conrelid = 'public.alert_notifications'::regclass
  ) THEN
    ALTER TABLE public.alert_notifications ADD CONSTRAINT alert_notifications_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON public.alert_notifications USING btree (alert_id);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at_desc ON public.alert_notifications USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_pending ON public.alert_notifications USING btree (status, created_at) WHERE ((status)::text = 'pending'::text);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON public.alert_notifications USING btree (status);

ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_notifications_read ON public.alert_notifications;
CREATE POLICY alert_notifications_read ON public.alert_notifications
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.alert_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_name varchar NOT NULL,
  alert_type varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'medium'::character varying,
  conditions jsonb NOT NULL,
  enabled bool DEFAULT true,
  notify_email bool DEFAULT true,
  notify_webhook bool DEFAULT false,
  notify_whatsapp bool DEFAULT false,
  notify_telegram bool DEFAULT false,
  email_recipients _text,
  webhook_url text,
  whatsapp_number text,
  telegram_chat_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alert_rules_rule_name_key' AND conrelid = 'public.alert_rules'::regclass
  ) THEN
    ALTER TABLE public.alert_rules ADD CONSTRAINT alert_rules_rule_name_key UNIQUE (rule_name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS alert_rules_rule_name_key ON public.alert_rules USING btree (rule_name);

CREATE INDEX IF NOT EXISTS idx_alert_rules_alert_type ON public.alert_rules USING btree (alert_type);

CREATE INDEX IF NOT EXISTS idx_alert_rules_created_at_desc ON public.alert_rules USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON public.alert_rules USING btree (enabled) WHERE (enabled = true);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_rules_read ON public.alert_rules;
CREATE POLICY alert_rules_read ON public.alert_rules
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  alert_type varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'medium'::character varying,
  title varchar NOT NULL,
  message text NOT NULL,
  tenant_id uuid,
  billing_account_id uuid,
  integration_id varchar,
  resource_type varchar,
  resource_id uuid,
  status varchar DEFAULT 'open'::character varying,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved bool NOT NULL DEFAULT false,
  check_type varchar NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alerts_billing_account_id_fkey' AND conrelid = 'public.alerts'::regclass
  ) THEN
    ALTER TABLE public.alerts ADD CONSTRAINT alerts_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alerts_tenant_id_fkey' AND conrelid = 'public.alerts'::regclass
  ) THEN
    ALTER TABLE public.alerts ADD CONSTRAINT alerts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON public.alerts USING btree (alert_type);

CREATE INDEX IF NOT EXISTS idx_alerts_ba_id ON public.alerts USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_alerts_check_type ON public.alerts USING btree (check_type);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_open_critical ON public.alerts USING btree (tenant_id, status, severity) WHERE (((status)::text = 'open'::text) AND ((severity)::text = 'critical'::text));

CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts USING btree (resolved);

CREATE INDEX IF NOT EXISTS idx_alerts_sent_at ON public.alerts USING btree (sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts USING btree (severity);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts USING btree (status);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant_id ON public.alerts USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.alerts USING btree (resolved_at) WHERE (resolved_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_alerts_unresolved_severity ON public.alerts USING btree (severity, created_at DESC) WHERE (resolved = false);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event varchar NOT NULL,
  properties jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_user_id_fkey' AND conrelid = 'public.analytics_events'::regclass
  ) THEN
    ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON public.analytics_events USING btree (event);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event ON public.analytics_events USING btree (user_id, event, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events USING btree (user_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_delete ON public.analytics_events;
CREATE POLICY user_delete ON public.analytics_events
  FOR DELETE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_insert ON public.analytics_events;
CREATE POLICY user_insert ON public.analytics_events
  FOR INSERT
  
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS user_select ON public.analytics_events;
CREATE POLICY user_select ON public.analytics_events
  FOR SELECT
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_update ON public.analytics_events;
CREATE POLICY user_update ON public.analytics_events
  FOR UPDATE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE TABLE IF NOT EXISTS public.anomaly_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  edge_node_id uuid,
  job_id uuid,
  execution_id uuid,
  anomaly_type varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'medium'::character varying,
  detected_at timestamptz NOT NULL DEFAULT now(),
  transaction_data jsonb,
  anomaly_score numeric,
  model_version_id uuid,
  is_resolved bool DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'anomaly_events_edge_node_id_fkey' AND conrelid = 'public.anomaly_events'::regclass
  ) THEN
    ALTER TABLE public.anomaly_events ADD CONSTRAINT anomaly_events_edge_node_id_fkey FOREIGN KEY (edge_node_id) REFERENCES edge_nodes(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'anomaly_events_execution_id_fkey' AND conrelid = 'public.anomaly_events'::regclass
  ) THEN
    ALTER TABLE public.anomaly_events ADD CONSTRAINT anomaly_events_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'anomaly_events_model_version_id_fkey' AND conrelid = 'public.anomaly_events'::regclass
  ) THEN
    ALTER TABLE public.anomaly_events ADD CONSTRAINT anomaly_events_model_version_id_fkey FOREIGN KEY (model_version_id) REFERENCES model_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'anomaly_events_resolved_by_fkey' AND conrelid = 'public.anomaly_events'::regclass
  ) THEN
    ALTER TABLE public.anomaly_events ADD CONSTRAINT anomaly_events_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'anomaly_events_tenant_id_fkey' AND conrelid = 'public.anomaly_events'::regclass
  ) THEN
    ALTER TABLE public.anomaly_events ADD CONSTRAINT anomaly_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_anomaly_events_created_at_desc ON public.anomaly_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_edge_node_id ON public.anomaly_events USING btree (edge_node_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_execution_id ON public.anomaly_events USING btree (execution_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_job_id ON public.anomaly_events USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_model_version_id ON public.anomaly_events USING btree (model_version_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_resolved ON public.anomaly_events USING btree (is_resolved);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_resolved_by ON public.anomaly_events USING btree (resolved_by);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_severity ON public.anomaly_events USING btree (severity);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_id ON public.anomaly_events USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_severity ON public.anomaly_events USING btree (tenant_id, severity, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_unresolved ON public.anomaly_events USING btree (tenant_id, detected_at DESC) WHERE (is_resolved = false);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_transaction_data_gin ON public.anomaly_events USING gin (transaction_data);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_type ON public.anomaly_events USING btree (anomaly_type);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  key_prefix varchar NOT NULL,
  key_hash varchar NOT NULL,
  name varchar,
  scopes _text DEFAULT ARRAY['jobs:read'::text, 'jobs:write'::text, 'reports:read'::text],
  rate_limit int4 DEFAULT 1000,
  ip_whitelist _text,
  revoked_at timestamptz,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active bool,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_tenant_id_fkey' AND conrelid = 'public.api_keys'::regclass
  ) THEN
    ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_user_id_fkey' AND conrelid = 'public.api_keys'::regclass
  ) THEN
    ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_api_keys_tenant' AND conrelid = 'public.api_keys'::regclass
  ) THEN
    ALTER TABLE public.api_keys ADD CONSTRAINT fk_api_keys_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_key_prefix_key' AND conrelid = 'public.api_keys'::regclass
  ) THEN
    ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_key_prefix_key UNIQUE (key_prefix);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_key_prefix_key ON public.api_keys USING btree (key_prefix);

CREATE INDEX IF NOT EXISTS idx_api_keys_activity ON public.api_keys USING btree (is_active, expires_at, last_used_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_created_at_desc ON public.api_keys USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_id_tenant ON public.api_keys USING btree (id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON public.api_keys USING btree (last_used_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys USING btree (key_prefix);

CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON public.api_keys USING btree (revoked_at) WHERE (revoked_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_api_keys_revoked_expires ON public.api_keys USING btree (revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_active ON public.api_keys USING btree (tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_created_at ON public.api_keys USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON public.api_keys USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_tenant ON public.api_keys USING btree (user_id, tenant_id);

CREATE TABLE IF NOT EXISTS public.architecture_violations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  violation_type varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'medium'::character varying,
  file_path text,
  component_name varchar,
  metric_name varchar,
  current_value numeric,
  threshold_value numeric,
  violation_description text NOT NULL,
  suggested_action text,
  status varchar DEFAULT 'open'::character varying,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_architecture_violations_created_at_desc ON public.architecture_violations USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_architecture_violations_open ON public.architecture_violations USING btree (status, severity) WHERE ((status)::text = 'open'::text);

CREATE INDEX IF NOT EXISTS idx_architecture_violations_severity ON public.architecture_violations USING btree (severity);

CREATE INDEX IF NOT EXISTS idx_architecture_violations_status ON public.architecture_violations USING btree (status);

CREATE INDEX IF NOT EXISTS idx_architecture_violations_type ON public.architecture_violations USING btree (violation_type);

ALTER TABLE public.architecture_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS architecture_violations_select_service_role_only ON public.architecture_violations;
CREATE POLICY architecture_violations_select_service_role_only ON public.architecture_violations
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  event varchar NOT NULL,
  user_id uuid,
  api_key_id uuid,
  ip varchar,
  user_agent text,
  method varchar,
  path varchar,
  status_code int4,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  row_sig bytea,
  billing_account_id uuid,
  integration_id varchar,
  action_type varchar,
  resource_type varchar,
  resource_id uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_api_key_id_fkey' AND conrelid = 'public.audit_logs'::regclass
  ) THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_billing_account_id_fkey' AND conrelid = 'public.audit_logs'::regclass
  ) THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_tenant_id_fkey' AND conrelid = 'public.audit_logs'::regclass
  ) THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey' AND conrelid = 'public.audit_logs'::regclass
  ) THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_logs_tenant' AND conrelid = 'public.audit_logs'::regclass
  ) THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS brin_audit_logs_timestamp ON public.audit_logs USING brin ("timestamp") WITH (autosummarize='on');

CREATE INDEX IF NOT EXISTS brin_audit_logs_ts ON public.audit_logs USING brin ("timestamp");

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs USING btree (action_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_api_key_id ON public.audit_logs USING btree (api_key_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ba_id ON public.audit_logs USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_integration_id ON public.audit_logs USING btree (integration_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON public.audit_logs USING gin (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs USING btree (resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_ts ON public.audit_logs USING btree (tenant_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.automated_decisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  decision_type varchar NOT NULL,
  decision_context jsonb NOT NULL,
  decision_outcome jsonb NOT NULL,
  reasoning text,
  automated_by varchar DEFAULT 'system'::character varying,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_decisions_created ON public.automated_decisions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decisions_type ON public.automated_decisions USING btree (decision_type);

ALTER TABLE public.automated_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automated_decisions_select_service_role_only ON public.automated_decisions;
CREATE POLICY automated_decisions_select_service_role_only ON public.automated_decisions
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.billing_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  stripe_customer_id varchar,
  stripe_account_id varchar,
  email varchar NOT NULL DEFAULT ''::character varying,
  address jsonb,
  tax_id varchar,
  currency varchar NOT NULL DEFAULT 'usd'::character varying,
  status varchar NOT NULL DEFAULT 'active'::character varying,
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_accounts_tenant_fkey' AND conrelid = 'public.billing_accounts'::regclass
  ) THEN
    ALTER TABLE public.billing_accounts ADD CONSTRAINT billing_accounts_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_billing_accounts_tenant' AND conrelid = 'public.billing_accounts'::regclass
  ) THEN
    ALTER TABLE public.billing_accounts ADD CONSTRAINT fk_billing_accounts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_accounts_stripe_customer_id_key' AND conrelid = 'public.billing_accounts'::regclass
  ) THEN
    ALTER TABLE public.billing_accounts ADD CONSTRAINT billing_accounts_stripe_customer_id_key UNIQUE (stripe_customer_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS billing_accounts_stripe_customer_id_key ON public.billing_accounts USING btree (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_created_at_desc ON public.billing_accounts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_deleted_at_null ON public.billing_accounts USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_status ON public.billing_accounts USING btree (status);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe_customer_id ON public.billing_accounts USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_tenant_created_at ON public.billing_accounts USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_tenant_id ON public.billing_accounts USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_user_id ON public.billing_accounts USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.billing_customers (
  user_id uuid NOT NULL,
  stripe_customer_id text NOT NULL,
  PRIMARY KEY (user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_customers_user_id_fkey' AND conrelid = 'public.billing_customers'::regclass
  ) THEN
    ALTER TABLE public.billing_customers ADD CONSTRAINT billing_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_customers_stripe_customer_id_key' AND conrelid = 'public.billing_customers'::regclass
  ) THEN
    ALTER TABLE public.billing_customers ADD CONSTRAINT billing_customers_stripe_customer_id_key UNIQUE (stripe_customer_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS billing_customers_stripe_customer_id_key ON public.billing_customers USING btree (stripe_customer_id);

CREATE TABLE IF NOT EXISTS public.billing_disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invoice_id varchar NOT NULL,
  disputed_amount numeric NOT NULL,
  reason varchar NOT NULL,
  description text NOT NULL,
  status varchar NOT NULL DEFAULT 'pending'::character varying,
  resolution_notes text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_disputes_resolved_by_fkey' AND conrelid = 'public.billing_disputes'::regclass
  ) THEN
    ALTER TABLE public.billing_disputes ADD CONSTRAINT billing_disputes_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_disputes_user_id_fkey' AND conrelid = 'public.billing_disputes'::regclass
  ) THEN
    ALTER TABLE public.billing_disputes ADD CONSTRAINT billing_disputes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_billing_disputes_created_at_desc ON public.billing_disputes USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_disputes_resolved_by ON public.billing_disputes USING btree (resolved_by);

CREATE INDEX IF NOT EXISTS idx_billing_disputes_status ON public.billing_disputes USING btree (status);

CREATE INDEX IF NOT EXISTS idx_billing_disputes_user_id ON public.billing_disputes USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.billing_reconciliation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  billing_account_id uuid NOT NULL,
  reconciliation_type varchar NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  expected_amount numeric,
  actual_amount numeric,
  discrepancy_amount numeric DEFAULT 0,
  status varchar DEFAULT 'pending'::character varying,
  stripe_invoice_id varchar,
  stripe_subscription_id varchar,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_reconciliation_log_billing_account_id_fkey' AND conrelid = 'public.billing_reconciliation_log'::regclass
  ) THEN
    ALTER TABLE public.billing_reconciliation_log ADD CONSTRAINT billing_reconciliation_log_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_billing_recon_billing_account ON public.billing_reconciliation_log USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_billing_recon_period ON public.billing_reconciliation_log USING btree (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_billing_recon_status ON public.billing_reconciliation_log USING btree (status);

CREATE INDEX IF NOT EXISTS idx_billing_reconciliation_log_created_at_desc ON public.billing_reconciliation_log USING btree (created_at DESC);

ALTER TABLE public.billing_reconciliation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_reconciliation_log_select_service_role_only ON public.billing_reconciliation_log;
CREATE POLICY billing_reconciliation_log_select_service_role_only ON public.billing_reconciliation_log
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id text NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_subscriptions_user_id_fkey' AND conrelid = 'public.billing_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.billing_subscriptions ADD CONSTRAINT billing_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user ON public.billing_subscriptions USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ip varchar NOT NULL,
  reason text NOT NULL,
  tenant_id uuid NOT NULL,
  blocked_at timestamptz DEFAULT now(),
  unblocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blocked_ips_tenant_id_fkey' AND conrelid = 'public.blocked_ips'::regclass
  ) THEN
    ALTER TABLE public.blocked_ips ADD CONSTRAINT blocked_ips_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_blocked_ips_tenant' AND conrelid = 'public.blocked_ips'::regclass
  ) THEN
    ALTER TABLE public.blocked_ips ADD CONSTRAINT fk_blocked_ips_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blocked_ips_created_at_desc ON public.blocked_ips USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_tenant_created_at ON public.blocked_ips USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_tenant_id ON public.blocked_ips USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_ips_unique_active ON public.blocked_ips USING btree (ip, tenant_id) WHERE (unblocked_at IS NULL);

CREATE TABLE IF NOT EXISTS public.canned_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title varchar NOT NULL,
  content text NOT NULL,
  category varchar,
  tags _text,
  usage_count int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON public.canned_responses USING btree (category);

CREATE INDEX IF NOT EXISTS idx_canned_responses_created_at_desc ON public.canned_responses USING btree (created_at DESC);

ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS canned_responses_read ON public.canned_responses;
CREATE POLICY canned_responses_read ON public.canned_responses
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.chat_message_embeddings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  message_id uuid NOT NULL,
  embedding vector,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_message_embeddings_message_id_fkey' AND conrelid = 'public.chat_message_embeddings'::regclass
  ) THEN
    ALTER TABLE public.chat_message_embeddings ADD CONSTRAINT chat_message_embeddings_message_id_fkey FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_message_embeddings_tenant_id_fkey' AND conrelid = 'public.chat_message_embeddings'::regclass
  ) THEN
    ALTER TABLE public.chat_message_embeddings ADD CONSTRAINT chat_message_embeddings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_message_embeddings_created_at_desc ON public.chat_message_embeddings USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_message_embeddings_message_id ON public.chat_message_embeddings USING btree (message_id);

CREATE INDEX IF NOT EXISTS idx_chat_message_embeddings_tenant_id ON public.chat_message_embeddings USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_chat_msg_embed_tenant ON public.chat_message_embeddings USING btree (tenant_id, created_at);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  thread_id uuid NOT NULL,
  author_id uuid,
  role text NOT NULL DEFAULT 'user'::text,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_author_id_fkey' AND conrelid = 'public.chat_messages'::regclass
  ) THEN
    ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_tenant_id_fkey' AND conrelid = 'public.chat_messages'::regclass
  ) THEN
    ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_thread_id_fkey' AND conrelid = 'public.chat_messages'::regclass
  ) THEN
    ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_author_id ON public.chat_messages USING btree (author_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at_desc ON public.chat_messages USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant ON public.chat_messages USING btree (tenant_id, thread_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_id ON public.chat_messages USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_thread_author ON public.chat_messages USING btree (tenant_id, thread_id, author_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages USING btree (thread_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_tenant_created ON public.chat_messages USING btree (thread_id, tenant_id, created_at);

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_threads_created_by_fkey' AND conrelid = 'public.chat_threads'::regclass
  ) THEN
    ALTER TABLE public.chat_threads ADD CONSTRAINT chat_threads_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_threads_tenant_id_fkey' AND conrelid = 'public.chat_threads'::regclass
  ) THEN
    ALTER TABLE public.chat_threads ADD CONSTRAINT chat_threads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_threads_created_at_desc ON public.chat_threads USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_threads_created_by ON public.chat_threads USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant_created_by ON public.chat_threads USING btree (tenant_id, created_by);

CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant_id ON public.chat_threads USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.chatbot_analytics (
  id text NOT NULL,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id text,
  user_id uuid,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS chatbot_analytics_session_id_idx ON public.chatbot_analytics USING btree (session_id);

CREATE INDEX IF NOT EXISTS chatbot_analytics_timestamp_idx ON public.chatbot_analytics USING btree ("timestamp");

CREATE INDEX IF NOT EXISTS chatbot_analytics_type_idx ON public.chatbot_analytics USING btree (type);

CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_created_at_desc ON public.chatbot_analytics USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_user_id ON public.chatbot_analytics USING btree (user_id);

ALTER TABLE public.chatbot_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_delete ON public.chatbot_analytics;
CREATE POLICY user_delete ON public.chatbot_analytics
  FOR DELETE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_insert ON public.chatbot_analytics;
CREATE POLICY user_insert ON public.chatbot_analytics
  FOR INSERT
  
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS user_select ON public.chatbot_analytics;
CREATE POLICY user_select ON public.chatbot_analytics
  FOR SELECT
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_update ON public.chatbot_analytics;
CREATE POLICY user_update ON public.chatbot_analytics
  FOR UPDATE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id text NOT NULL,
  conversation_id text NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  user_id uuid,
  session_id text,
  device_info jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_conversation_id ON public.chatbot_conversations USING btree (conversation_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_created_at_desc ON public.chatbot_conversations USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_timestamp ON public.chatbot_conversations USING btree ("timestamp");

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON public.chatbot_conversations USING btree (user_id);

ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_delete ON public.chatbot_conversations;
CREATE POLICY user_delete ON public.chatbot_conversations
  FOR DELETE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_insert ON public.chatbot_conversations;
CREATE POLICY user_insert ON public.chatbot_conversations
  FOR INSERT
  
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS user_select ON public.chatbot_conversations;
CREATE POLICY user_select ON public.chatbot_conversations
  FOR SELECT
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_update ON public.chatbot_conversations;
CREATE POLICY user_update ON public.chatbot_conversations
  FOR UPDATE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE TABLE IF NOT EXISTS public.circuit_breakers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_name varchar NOT NULL,
  status varchar DEFAULT 'closed'::character varying,
  failure_count int4 DEFAULT 0,
  success_count int4 DEFAULT 0,
  last_failure_at timestamptz,
  last_success_at timestamptz,
  opened_at timestamptz,
  threshold_failures int4 DEFAULT 5,
  threshold_successes int4 DEFAULT 2,
  timeout_seconds int4 DEFAULT 60,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'circuit_breakers_service_name_key' AND conrelid = 'public.circuit_breakers'::regclass
  ) THEN
    ALTER TABLE public.circuit_breakers ADD CONSTRAINT circuit_breakers_service_name_key UNIQUE (service_name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS circuit_breakers_service_name_key ON public.circuit_breakers USING btree (service_name);

CREATE INDEX IF NOT EXISTS idx_circuit_breakers_created_at_desc ON public.circuit_breakers USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_circuit_breakers_service ON public.circuit_breakers USING btree (service_name);

CREATE INDEX IF NOT EXISTS idx_circuit_breakers_status ON public.circuit_breakers USING btree (status);

ALTER TABLE public.circuit_breakers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS circuit_breakers_select_service_role_only ON public.circuit_breakers;
CREATE POLICY circuit_breakers_select_service_role_only ON public.circuit_breakers
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.cms_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.cms_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  path text NOT NULL,
  kind text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  alt text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cms_media_created_by_fkey' AND conrelid = 'public.cms_media'::regclass
  ) THEN
    ALTER TABLE public.cms_media ADD CONSTRAINT cms_media_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cms_media_tenant_id_fkey' AND conrelid = 'public.cms_media'::regclass
  ) THEN
    ALTER TABLE public.cms_media ADD CONSTRAINT cms_media_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_media_created_at ON public.cms_media USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cms_media_kind ON public.cms_media USING btree (kind);

CREATE INDEX IF NOT EXISTS idx_cms_media_path ON public.cms_media USING btree (path);

CREATE INDEX IF NOT EXISTS idx_cms_media_tenant_id ON public.cms_media USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_cms_media_tenant_kind_created ON public.cms_media USING btree (tenant_id, kind, created_at DESC);

CREATE TABLE IF NOT EXISTS public.cms_page_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  content_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  version_number int4 NOT NULL,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cms_page_versions_created_by_fkey' AND conrelid = 'public.cms_page_versions'::regclass
  ) THEN
    ALTER TABLE public.cms_page_versions ADD CONSTRAINT cms_page_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cms_page_versions_page_id_fkey' AND conrelid = 'public.cms_page_versions'::regclass
  ) THEN
    ALTER TABLE public.cms_page_versions ADD CONSTRAINT cms_page_versions_page_id_fkey FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_created_at ON public.cms_page_versions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_created_by ON public.cms_page_versions USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_page_id ON public.cms_page_versions USING btree (page_id);

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_page_id_created_at ON public.cms_page_versions USING btree (page_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_cms_page_versions_seq ON public.cms_page_versions USING btree (page_id, version_number);

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cms_pages_tenant_id_fkey' AND conrelid = 'public.cms_pages'::regclass
  ) THEN
    ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cms_pages_tenant_id_slug_key' AND conrelid = 'public.cms_pages'::regclass
  ) THEN
    ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_tenant_id_slug_key UNIQUE (tenant_id, slug);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS cms_pages_tenant_id_slug_key ON public.cms_pages USING btree (tenant_id, slug);

CREATE INDEX IF NOT EXISTS idx_cms_pages_published ON public.cms_pages USING btree (tenant_id, status, published_at DESC) WHERE (status = 'published'::text);

CREATE INDEX IF NOT EXISTS idx_cms_pages_published_at ON public.cms_pages USING btree (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_cms_pages_published_slug ON public.cms_pages USING btree (tenant_id, slug, published_at DESC) WHERE (status = 'published'::text);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages USING btree (slug);

CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages USING btree (status);

CREATE INDEX IF NOT EXISTS idx_cms_pages_tenant_id ON public.cms_pages USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_cms_pages_tenant_slug ON public.cms_pages USING btree (tenant_id, slug);

CREATE INDEX IF NOT EXISTS idx_cms_pages_tenant_status ON public.cms_pages USING btree (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_cms_pages_tenant_status_slug ON public.cms_pages USING btree (tenant_id, status, slug);

CREATE UNIQUE INDEX IF NOT EXISTS ux_cms_pages_published_one ON public.cms_pages USING btree (tenant_id, slug) WHERE (status = 'published'::text);

CREATE TABLE IF NOT EXISTS public.confidence_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_type varchar NOT NULL,
  source_id uuid,
  confidence_score numeric NOT NULL,
  threshold numeric DEFAULT 0.7,
  result_data jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  flagged_low_confidence bool DEFAULT false,
  user_notified bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_confidence_events_created_at_desc ON public.confidence_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_confidence_low ON public.confidence_events USING btree (flagged_low_confidence) WHERE (flagged_low_confidence = true);

CREATE INDEX IF NOT EXISTS idx_confidence_score ON public.confidence_events USING btree (confidence_score);

CREATE INDEX IF NOT EXISTS idx_confidence_source ON public.confidence_events USING btree (source_type, source_id);

ALTER TABLE public.confidence_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS confidence_events_read ON public.confidence_events;
CREATE POLICY confidence_events_read ON public.confidence_events
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.console_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  billing_account_id uuid,
  tenant_id uuid,
  activity_type varchar NOT NULL,
  action varchar NOT NULL,
  title varchar NOT NULL,
  description text,
  status varchar DEFAULT 'success'::character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  resource_id uuid,
  resource_type varchar,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'console_activities_billing_account_id_fkey' AND conrelid = 'public.console_activities'::regclass
  ) THEN
    ALTER TABLE public.console_activities ADD CONSTRAINT console_activities_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'console_activities_tenant_id_fkey' AND conrelid = 'public.console_activities'::regclass
  ) THEN
    ALTER TABLE public.console_activities ADD CONSTRAINT console_activities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_console_activities_ba_id ON public.console_activities USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_console_activities_billing_account_created_at ON public.console_activities USING btree (billing_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_console_activities_created_at_desc ON public.console_activities USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_console_activities_status ON public.console_activities USING btree (status);

CREATE INDEX IF NOT EXISTS idx_console_activities_tenant_id ON public.console_activities USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_console_activities_type ON public.console_activities USING btree (activity_type);

CREATE INDEX IF NOT EXISTS idx_console_activities_user_id ON public.console_activities USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  email varchar NOT NULL,
  first_name varchar,
  last_name varchar,
  company varchar,
  phone varchar,
  title varchar,
  lifecycle_stage varchar NOT NULL DEFAULT 'subscriber'::character varying,
  assigned_to uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_assigned_to_fkey' AND conrelid = 'public.contacts'::regclass
  ) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT contacts_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_tenant_id_fkey' AND conrelid = 'public.contacts'::regclass
  ) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT contacts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_tenant_id_email_key' AND conrelid = 'public.contacts'::regclass
  ) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT contacts_tenant_id_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS contacts_tenant_id_email_key ON public.contacts USING btree (tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts USING btree (assigned_to);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at_desc ON public.contacts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at_null ON public.contacts USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle_stage ON public.contacts USING btree (lifecycle_stage);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email ON public.contacts USING btree (tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON public.contacts USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_lifecycle ON public.contacts USING btree (tenant_id, lifecycle_stage);

CREATE TABLE IF NOT EXISTS public.contract_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contract_name varchar NOT NULL,
  version varchar NOT NULL,
  schema_definition jsonb NOT NULL,
  is_active bool DEFAULT true,
  is_deprecated bool DEFAULT false,
  deprecated_at timestamptz,
  breaking_changes jsonb DEFAULT '[]'::jsonb,
  migration_guide text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contract_versions_tenant_id_fkey' AND conrelid = 'public.contract_versions'::regclass
  ) THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contract_versions_tenant_id_contract_name_version_key' AND conrelid = 'public.contract_versions'::regclass
  ) THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_tenant_id_contract_name_version_key UNIQUE (tenant_id, contract_name, version);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS contract_versions_tenant_id_contract_name_version_key ON public.contract_versions USING btree (tenant_id, contract_name, version);

CREATE INDEX IF NOT EXISTS idx_contract_versions_active ON public.contract_versions USING btree (tenant_id, contract_name) WHERE (is_active = true);

CREATE INDEX IF NOT EXISTS idx_contract_versions_contract_name ON public.contract_versions USING btree (contract_name);

CREATE INDEX IF NOT EXISTS idx_contract_versions_created_at_desc ON public.contract_versions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contract_versions_schema_gin ON public.contract_versions USING gin (schema_definition);

CREATE INDEX IF NOT EXISTS idx_contract_versions_tenant_id ON public.contract_versions USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role varchar NOT NULL DEFAULT 'member'::character varying,
  joined_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_members_conversation_id_fkey' AND conrelid = 'public.conversation_members'::regclass
  ) THEN
    ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_members_tenant_id_fkey' AND conrelid = 'public.conversation_members'::regclass
  ) THEN
    ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_members_user_id_fkey' AND conrelid = 'public.conversation_members'::regclass
  ) THEN
    ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversation_members_tenant' AND conrelid = 'public.conversation_members'::regclass
  ) THEN
    ALTER TABLE public.conversation_members ADD CONSTRAINT fk_conversation_members_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversation_members_conv_user ON public.conversation_members USING btree (conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON public.conversation_members USING btree (conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_tenant_conv_user ON public.conversation_members USING btree (tenant_id, conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_tenant_id ON public.conversation_members USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_tenant_user ON public.conversation_members USING btree (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user_conv ON public.conversation_members USING btree (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON public.conversation_members USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.conversation_summaries (
  conversation_id uuid NOT NULL,
  last_summary text,
  last_ai_at timestamptz,
  tenant_id uuid NOT NULL,
  PRIMARY KEY (conversation_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_summaries_conversation_id_fkey' AND conrelid = 'public.conversation_summaries'::regclass
  ) THEN
    ALTER TABLE public.conversation_summaries ADD CONSTRAINT conversation_summaries_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_summaries_tenant_id_fkey' AND conrelid = 'public.conversation_summaries'::regclass
  ) THEN
    ALTER TABLE public.conversation_summaries ADD CONSTRAINT conversation_summaries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversation_summaries_tenant' AND conrelid = 'public.conversation_summaries'::regclass
  ) THEN
    ALTER TABLE public.conversation_summaries ADD CONSTRAINT fk_conversation_summaries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_conversation_id ON public.conversation_summaries USING btree (conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_tenant_id ON public.conversation_summaries USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title varchar,
  type varchar NOT NULL DEFAULT 'direct'::character varying,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  message_count int8 DEFAULT 0,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_created_by_fkey' AND conrelid = 'public.conversations'::regclass
  ) THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_tenant_id_fkey' AND conrelid = 'public.conversations'::regclass
  ) THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_tenant' AND conrelid = 'public.conversations'::regclass
  ) THEN
    ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_created_at_desc ON public.conversations USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_conversations_id_tenant ON public.conversations USING btree (id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_created ON public.conversations USING btree (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_created_at ON public.conversations USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_created_by ON public.conversations USING btree (tenant_id, created_by);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.cron_targets (
  id int8 NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cron_targets_name_key' AND conrelid = 'public.cron_targets'::regclass
  ) THEN
    ALTER TABLE public.cron_targets ADD CONSTRAINT cron_targets_name_key UNIQUE (name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS cron_targets_name_key ON public.cron_targets USING btree (name);

CREATE INDEX IF NOT EXISTS idx_cron_targets_created_at_desc ON public.cron_targets USING btree (created_at DESC);

CREATE TABLE IF NOT EXISTS public.customer_segments (
  user_id uuid NOT NULL,
  segment_type varchar NOT NULL,
  segment_name varchar NOT NULL,
  segment_metadata jsonb,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (user_id, segment_type, segment_name)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_segments_user_id_fkey' AND conrelid = 'public.customer_segments'::regclass
  ) THEN
    ALTER TABLE public.customer_segments ADD CONSTRAINT customer_segments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customer_segments_user_id ON public.customer_segments USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.data_export_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  export_id uuid NOT NULL,
  part_no int4 NOT NULL,
  record_count int4 NOT NULL DEFAULT 0,
  size_bytes int8,
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_export_items_export_id_fkey' AND conrelid = 'public.data_export_items'::regclass
  ) THEN
    ALTER TABLE public.data_export_items ADD CONSTRAINT data_export_items_export_id_fkey FOREIGN KEY (export_id) REFERENCES data_exports(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_data_export_items_created_at_desc ON public.data_export_items USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_export_items_export ON public.data_export_items USING btree (export_id);

CREATE INDEX IF NOT EXISTS idx_export_items_export ON public.data_export_items USING btree (export_id, part_no);

CREATE TABLE IF NOT EXISTS public.data_exports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  kind text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  storage_path text,
  status export_status NOT NULL DEFAULT 'pending'::export_status,
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_exports_created_by_fkey' AND conrelid = 'public.data_exports'::regclass
  ) THEN
    ALTER TABLE public.data_exports ADD CONSTRAINT data_exports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_exports_tenant_id_fkey' AND conrelid = 'public.data_exports'::regclass
  ) THEN
    ALTER TABLE public.data_exports ADD CONSTRAINT data_exports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_data_exports_created_at_desc ON public.data_exports USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_exports_created_by ON public.data_exports USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_data_exports_tenant ON public.data_exports USING btree (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_data_exports_tenant_id ON public.data_exports USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.dead_letters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid,
  workspace_id uuid NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL,
  error jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dead_letters_job_id_fkey' AND conrelid = 'public.dead_letters'::regclass
  ) THEN
    ALTER TABLE public.dead_letters ADD CONSTRAINT dead_letters_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dead_letters_created_at ON public.dead_letters USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dead_letters_type ON public.dead_letters USING btree (type);

CREATE INDEX IF NOT EXISTS idx_dead_letters_workspace_id ON public.dead_letters USING btree (workspace_id);

CREATE TABLE IF NOT EXISTS public.deals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  lead_id uuid,
  name varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'open'::character varying,
  stage varchar NOT NULL DEFAULT 'prospecting'::character varying,
  value_cents int8 NOT NULL DEFAULT 0,
  currency varchar DEFAULT 'USD'::character varying,
  probability int4 DEFAULT 0,
  close_date date,
  assigned_to uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deals_assigned_to_fkey' AND conrelid = 'public.deals'::regclass
  ) THEN
    ALTER TABLE public.deals ADD CONSTRAINT deals_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deals_lead_id_fkey' AND conrelid = 'public.deals'::regclass
  ) THEN
    ALTER TABLE public.deals ADD CONSTRAINT deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deals_tenant_id_fkey' AND conrelid = 'public.deals'::regclass
  ) THEN
    ALTER TABLE public.deals ADD CONSTRAINT deals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals USING btree (assigned_to);

CREATE INDEX IF NOT EXISTS idx_deals_close_date ON public.deals USING btree (tenant_id, close_date);

CREATE INDEX IF NOT EXISTS idx_deals_created_at_desc ON public.deals USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deals_deleted_at_null ON public.deals USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON public.deals USING btree (lead_id);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals USING btree (stage);

CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals USING btree (status);

CREATE INDEX IF NOT EXISTS idx_deals_tenant_assigned ON public.deals USING btree (tenant_id, assigned_to);

CREATE INDEX IF NOT EXISTS idx_deals_tenant_id ON public.deals USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_deals_tenant_status ON public.deals USING btree (tenant_id, status);

CREATE TABLE IF NOT EXISTS public.device_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  edge_node_id uuid,
  profile_name varchar NOT NULL,
  device_specs jsonb NOT NULL,
  benchmark_results jsonb,
  recommended_models _uuid,
  optimization_settings jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'device_profiles_edge_node_id_fkey' AND conrelid = 'public.device_profiles'::regclass
  ) THEN
    ALTER TABLE public.device_profiles ADD CONSTRAINT device_profiles_edge_node_id_fkey FOREIGN KEY (edge_node_id) REFERENCES edge_nodes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'device_profiles_tenant_id_fkey' AND conrelid = 'public.device_profiles'::regclass
  ) THEN
    ALTER TABLE public.device_profiles ADD CONSTRAINT device_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'device_profiles_edge_node_id_profile_name_key' AND conrelid = 'public.device_profiles'::regclass
  ) THEN
    ALTER TABLE public.device_profiles ADD CONSTRAINT device_profiles_edge_node_id_profile_name_key UNIQUE (edge_node_id, profile_name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS device_profiles_edge_node_id_profile_name_key ON public.device_profiles USING btree (edge_node_id, profile_name);

CREATE INDEX IF NOT EXISTS idx_device_profiles_benchmark_results_gin ON public.device_profiles USING gin (benchmark_results);

CREATE INDEX IF NOT EXISTS idx_device_profiles_created_at_desc ON public.device_profiles USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_device_profiles_device_specs_gin ON public.device_profiles USING gin (device_specs);

CREATE INDEX IF NOT EXISTS idx_device_profiles_edge_node_id ON public.device_profiles USING btree (edge_node_id);

CREATE INDEX IF NOT EXISTS idx_device_profiles_recommended_models_gin ON public.device_profiles USING gin (recommended_models);

CREATE INDEX IF NOT EXISTS idx_device_profiles_tenant_id ON public.device_profiles USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.diagnostics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  diagnostic_type varchar NOT NULL,
  results jsonb NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_created_at_desc ON public.diagnostics USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagnostics_timestamp ON public.diagnostics USING btree ("timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_diagnostics_type ON public.diagnostics USING btree (diagnostic_type);

CREATE TABLE IF NOT EXISTS public.drift_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  recon_job_id uuid,
  contract_version_id uuid,
  drift_type varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'warning'::character varying,
  field_path varchar,
  expected_value jsonb,
  actual_value jsonb,
  drift_metrics jsonb DEFAULT '{}'::jsonb,
  auto_repaired bool DEFAULT false,
  repair_action jsonb,
  acknowledged bool DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drift_events_acknowledged_by_fkey' AND conrelid = 'public.drift_events'::regclass
  ) THEN
    ALTER TABLE public.drift_events ADD CONSTRAINT drift_events_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drift_events_contract_version_id_fkey' AND conrelid = 'public.drift_events'::regclass
  ) THEN
    ALTER TABLE public.drift_events ADD CONSTRAINT drift_events_contract_version_id_fkey FOREIGN KEY (contract_version_id) REFERENCES contract_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drift_events_recon_job_id_fkey' AND conrelid = 'public.drift_events'::regclass
  ) THEN
    ALTER TABLE public.drift_events ADD CONSTRAINT drift_events_recon_job_id_fkey FOREIGN KEY (recon_job_id) REFERENCES recon_jobs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drift_events_tenant_id_fkey' AND conrelid = 'public.drift_events'::regclass
  ) THEN
    ALTER TABLE public.drift_events ADD CONSTRAINT drift_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_drift_events_acknowledged_by ON public.drift_events USING btree (acknowledged_by);

CREATE INDEX IF NOT EXISTS idx_drift_events_contract_version_id ON public.drift_events USING btree (contract_version_id);

CREATE INDEX IF NOT EXISTS idx_drift_events_created_at ON public.drift_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drift_events_drift_type ON public.drift_events USING btree (drift_type);

CREATE INDEX IF NOT EXISTS idx_drift_events_metadata_gin ON public.drift_events USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_drift_events_recon_job_id ON public.drift_events USING btree (recon_job_id);

CREATE INDEX IF NOT EXISTS idx_drift_events_severity ON public.drift_events USING btree (severity);

CREATE INDEX IF NOT EXISTS idx_drift_events_tenant_id ON public.drift_events USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_drift_events_unacknowledged ON public.drift_events USING btree (tenant_id, acknowledged) WHERE (acknowledged = false);

CREATE TABLE IF NOT EXISTS public.edge_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  edge_node_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  job_type varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'pending'::character varying,
  input_data jsonb,
  output_data jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms int8,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edge_jobs_edge_node_id_fkey' AND conrelid = 'public.edge_jobs'::regclass
  ) THEN
    ALTER TABLE public.edge_jobs ADD CONSTRAINT edge_jobs_edge_node_id_fkey FOREIGN KEY (edge_node_id) REFERENCES edge_nodes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edge_jobs_tenant_id_fkey' AND conrelid = 'public.edge_jobs'::regclass
  ) THEN
    ALTER TABLE public.edge_jobs ADD CONSTRAINT edge_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_edge_jobs_created_at_desc ON public.edge_jobs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_edge_node_id ON public.edge_jobs USING btree (edge_node_id);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_input_data_gin ON public.edge_jobs USING gin (input_data);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_node_status ON public.edge_jobs USING btree (edge_node_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_output_data_gin ON public.edge_jobs USING gin (output_data);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_status ON public.edge_jobs USING btree (status);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_tenant_id ON public.edge_jobs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_tenant_status ON public.edge_jobs USING btree (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_type ON public.edge_jobs USING btree (job_type);

CREATE TABLE IF NOT EXISTS public.edge_node_deployments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  edge_node_id uuid NOT NULL,
  model_version_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  status varchar NOT NULL DEFAULT 'pending'::character varying,
  deployed_at timestamptz,
  activated_at timestamptz,
  rollback_reason text,
  performance_metrics jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edge_node_deployments_edge_node_id_fkey' AND conrelid = 'public.edge_node_deployments'::regclass
  ) THEN
    ALTER TABLE public.edge_node_deployments ADD CONSTRAINT edge_node_deployments_edge_node_id_fkey FOREIGN KEY (edge_node_id) REFERENCES edge_nodes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edge_node_deployments_model_version_id_fkey' AND conrelid = 'public.edge_node_deployments'::regclass
  ) THEN
    ALTER TABLE public.edge_node_deployments ADD CONSTRAINT edge_node_deployments_model_version_id_fkey FOREIGN KEY (model_version_id) REFERENCES model_versions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edge_node_deployments_tenant_id_fkey' AND conrelid = 'public.edge_node_deployments'::regclass
  ) THEN
    ALTER TABLE public.edge_node_deployments ADD CONSTRAINT edge_node_deployments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edge_node_deployments_edge_node_id_model_version_id_key' AND conrelid = 'public.edge_node_deployments'::regclass
  ) THEN
    ALTER TABLE public.edge_node_deployments ADD CONSTRAINT edge_node_deployments_edge_node_id_model_version_id_key UNIQUE (edge_node_id, model_version_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS edge_node_deployments_edge_node_id_model_version_id_key ON public.edge_node_deployments USING btree (edge_node_id, model_version_id);

CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_created_at_desc ON public.edge_node_deployments USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_edge_node_id ON public.edge_node_deployments USING btree (edge_node_id);

CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_model_version_id ON public.edge_node_deployments USING btree (model_version_id);

CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_status ON public.edge_node_deployments USING btree (status);

CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_tenant_id ON public.edge_node_deployments USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_tenant_status ON public.edge_node_deployments USING btree (tenant_id, status, deployed_at DESC);

CREATE TABLE IF NOT EXISTS public.edge_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name varchar NOT NULL,
  node_key varchar NOT NULL,
  node_key_hash varchar NOT NULL,
  enrollment_key varchar,
  enrollment_key_hash varchar,
  status varchar NOT NULL DEFAULT 'pending'::character varying,
  device_type varchar,
  device_os varchar,
  device_arch varchar,
  capabilities jsonb DEFAULT '{"cpu": false, "gpu": false, "npu": false, "tpu": false, "wasm": false, "webgpu": false, "tensorrt": false, "executorch": false, "onnx_runtime": false}'::jsonb,
  location jsonb,
  last_heartbeat_at timestamptz,
  last_sync_at timestamptz,
  version varchar,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edge_nodes_tenant_id_fkey' AND conrelid = 'public.edge_nodes'::regclass
  ) THEN
    ALTER TABLE public.edge_nodes ADD CONSTRAINT edge_nodes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edge_nodes_node_key_key' AND conrelid = 'public.edge_nodes'::regclass
  ) THEN
    ALTER TABLE public.edge_nodes ADD CONSTRAINT edge_nodes_node_key_key UNIQUE (node_key);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS edge_nodes_node_key_key ON public.edge_nodes USING btree (node_key);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_active_tenant ON public.edge_nodes USING btree (tenant_id, last_heartbeat_at DESC) WHERE (((status)::text = 'active'::text) AND (deleted_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_edge_nodes_capabilities_gin ON public.edge_nodes USING gin (capabilities);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_created_at_desc ON public.edge_nodes USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_deleted ON public.edge_nodes USING btree (deleted_at);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_deleted_at_null ON public.edge_nodes USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_last_heartbeat ON public.edge_nodes USING btree (last_heartbeat_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_node_key_hash ON public.edge_nodes USING btree (node_key_hash);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_status ON public.edge_nodes USING btree (status);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_tenant_id ON public.edge_nodes USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_tenant_status ON public.edge_nodes USING btree (tenant_id, status);

CREATE TABLE IF NOT EXISTS public.email_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  email citext NOT NULL,
  role text NOT NULL DEFAULT 'viewer'::text,
  invited_by uuid,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_invites_invited_by_fkey' AND conrelid = 'public.email_invites'::regclass
  ) THEN
    ALTER TABLE public.email_invites ADD CONSTRAINT email_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_invites_tenant_id_fkey' AND conrelid = 'public.email_invites'::regclass
  ) THEN
    ALTER TABLE public.email_invites ADD CONSTRAINT email_invites_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_invites_tenant_id_email_key' AND conrelid = 'public.email_invites'::regclass
  ) THEN
    ALTER TABLE public.email_invites ADD CONSTRAINT email_invites_tenant_id_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_invites_token_key' AND conrelid = 'public.email_invites'::regclass
  ) THEN
    ALTER TABLE public.email_invites ADD CONSTRAINT email_invites_token_key UNIQUE (token);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS email_invites_tenant_id_email_key ON public.email_invites USING btree (tenant_id, email);

CREATE UNIQUE INDEX IF NOT EXISTS email_invites_token_key ON public.email_invites USING btree (token);

CREATE INDEX IF NOT EXISTS idx_email_invites_tenant_email ON public.email_invites USING btree (tenant_id, email);

CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sequence_id uuid,
  template_id uuid,
  email_address varchar NOT NULL,
  subject varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'pending'::character varying,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_sends_sequence_id_fkey' AND conrelid = 'public.email_sends'::regclass
  ) THEN
    ALTER TABLE public.email_sends ADD CONSTRAINT email_sends_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_sends_template_id_fkey' AND conrelid = 'public.email_sends'::regclass
  ) THEN
    ALTER TABLE public.email_sends ADD CONSTRAINT email_sends_template_id_fkey FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_sends_user_id_fkey' AND conrelid = 'public.email_sends'::regclass
  ) THEN
    ALTER TABLE public.email_sends ADD CONSTRAINT email_sends_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_sends_created_at ON public.email_sends USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_sends_sequence ON public.email_sends USING btree (sequence_id);

CREATE INDEX IF NOT EXISTS idx_email_sends_status ON public.email_sends USING btree (status);

CREATE INDEX IF NOT EXISTS idx_email_sends_template_id ON public.email_sends USING btree (template_id);

CREATE INDEX IF NOT EXISTS idx_email_sends_user_id ON public.email_sends USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_type email_sequence_type NOT NULL,
  name varchar NOT NULL,
  description text,
  trigger_event varchar NOT NULL,
  enabled bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_created_at_desc ON public.email_sequences USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_sequences_type ON public.email_sequences USING btree (sequence_type);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_id uuid,
  template_name varchar NOT NULL,
  subject varchar NOT NULL,
  body_html text NOT NULL,
  body_text text,
  delay_hours int4 NOT NULL DEFAULT 0,
  order_index int4 NOT NULL DEFAULT 0,
  enabled bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_templates_sequence_id_fkey' AND conrelid = 'public.email_templates'::regclass
  ) THEN
    ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_templates_created_at_desc ON public.email_templates USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_templates_sequence ON public.email_templates USING btree (sequence_id);

CREATE TABLE IF NOT EXISTS public.entitlements (
  plan text NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (plan)
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  error_type varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'error'::character varying,
  message text NOT NULL,
  stack_trace text,
  context jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  api_key_id uuid,
  request_id varchar,
  url text,
  method varchar,
  status_code int4,
  resolved bool DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'error_logs_api_key_id_fkey' AND conrelid = 'public.error_logs'::regclass
  ) THEN
    ALTER TABLE public.error_logs ADD CONSTRAINT error_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'error_logs_resolved_by_fkey' AND conrelid = 'public.error_logs'::regclass
  ) THEN
    ALTER TABLE public.error_logs ADD CONSTRAINT error_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'error_logs_tenant_id_fkey' AND conrelid = 'public.error_logs'::regclass
  ) THEN
    ALTER TABLE public.error_logs ADD CONSTRAINT error_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'error_logs_user_id_fkey' AND conrelid = 'public.error_logs'::regclass
  ) THEN
    ALTER TABLE public.error_logs ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_error_logs_api_key_id ON public.error_logs USING btree (api_key_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_context_gin ON public.error_logs USING gin (context);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at_desc ON public.error_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs USING btree (error_type);

CREATE INDEX IF NOT EXISTS idx_error_logs_request_id ON public.error_logs USING btree (request_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs USING btree (resolved);

CREATE INDEX IF NOT EXISTS idx_error_logs_resolved_by ON public.error_logs USING btree (resolved_by);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs USING btree (severity);

CREATE INDEX IF NOT EXISTS idx_error_logs_tenant_id ON public.error_logs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON public.error_logs USING btree (tenant_id, created_at DESC) WHERE (resolved = false);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.escalation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  rule_id uuid,
  from_user_id uuid,
  to_user_id uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escalation_history_from_user_id_fkey' AND conrelid = 'public.escalation_history'::regclass
  ) THEN
    ALTER TABLE public.escalation_history ADD CONSTRAINT escalation_history_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escalation_history_rule_id_fkey' AND conrelid = 'public.escalation_history'::regclass
  ) THEN
    ALTER TABLE public.escalation_history ADD CONSTRAINT escalation_history_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES escalation_rules(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escalation_history_ticket_id_fkey' AND conrelid = 'public.escalation_history'::regclass
  ) THEN
    ALTER TABLE public.escalation_history ADD CONSTRAINT escalation_history_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escalation_history_to_user_id_fkey' AND conrelid = 'public.escalation_history'::regclass
  ) THEN
    ALTER TABLE public.escalation_history ADD CONSTRAINT escalation_history_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_escalation_history_created_at_desc ON public.escalation_history USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escalation_history_from_user_id ON public.escalation_history USING btree (from_user_id);

CREATE INDEX IF NOT EXISTS idx_escalation_history_rule_id ON public.escalation_history USING btree (rule_id);

CREATE INDEX IF NOT EXISTS idx_escalation_history_ticket_id ON public.escalation_history USING btree (ticket_id);

CREATE INDEX IF NOT EXISTS idx_escalation_history_to_user_id ON public.escalation_history USING btree (to_user_id);

ALTER TABLE public.escalation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escalation_history_read ON public.escalation_history;
CREATE POLICY escalation_history_read ON public.escalation_history
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  trigger_condition jsonb NOT NULL,
  action varchar NOT NULL,
  target_user_id uuid,
  enabled bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escalation_rules_target_user_id_fkey' AND conrelid = 'public.escalation_rules'::regclass
  ) THEN
    ALTER TABLE public.escalation_rules ADD CONSTRAINT escalation_rules_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_escalation_rules_created_at_desc ON public.escalation_rules USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escalation_rules_target_user_id ON public.escalation_rules USING btree (target_user_id);

ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escalation_rules_read ON public.escalation_rules;
CREATE POLICY escalation_rules_read ON public.escalation_rules
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.event_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  source text NOT NULL,
  level text NOT NULL DEFAULT 'info'::text,
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_logs_tenant_id_fkey' AND conrelid = 'public.event_logs'::regclass
  ) THEN
    ALTER TABLE public.event_logs ADD CONSTRAINT event_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_logs_created_at_desc ON public.event_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_logs_tenant ON public.event_logs USING btree (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_event_logs_tenant_id ON public.event_logs USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  status varchar NOT NULL DEFAULT 'running'::character varying,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error text,
  summary jsonb,
  duration_ms int8,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'executions_tenant_id_fkey' AND conrelid = 'public.executions'::regclass
  ) THEN
    ALTER TABLE public.executions ADD CONSTRAINT executions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_executions_tenant' AND conrelid = 'public.executions'::regclass
  ) THEN
    ALTER TABLE public.executions ADD CONSTRAINT fk_executions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_executions_created_at_desc ON public.executions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_executions_job ON public.executions USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_executions_job_started ON public.executions USING btree (job_id, started_at);

CREATE INDEX IF NOT EXISTS idx_executions_job_started_desc ON public.executions USING btree (job_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_executions_tenant_created_at ON public.executions USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_executions_tenant_id ON public.executions USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_executions_tenant_job ON public.executions USING btree (tenant_id, job_id);

CREATE INDEX IF NOT EXISTS idx_executions_tenant_started_desc ON public.executions USING btree (tenant_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.experiment_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_assignments_experiment_id_fkey' AND conrelid = 'public.experiment_assignments'::regclass
  ) THEN
    ALTER TABLE public.experiment_assignments ADD CONSTRAINT experiment_assignments_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_assignments_tenant_id_fkey' AND conrelid = 'public.experiment_assignments'::regclass
  ) THEN
    ALTER TABLE public.experiment_assignments ADD CONSTRAINT experiment_assignments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_assignments_user_id_fkey' AND conrelid = 'public.experiment_assignments'::regclass
  ) THEN
    ALTER TABLE public.experiment_assignments ADD CONSTRAINT experiment_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_assignments_variant_id_fkey' AND conrelid = 'public.experiment_assignments'::regclass
  ) THEN
    ALTER TABLE public.experiment_assignments ADD CONSTRAINT experiment_assignments_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES experiment_variants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_experiment_assignments_tenant' AND conrelid = 'public.experiment_assignments'::regclass
  ) THEN
    ALTER TABLE public.experiment_assignments ADD CONSTRAINT fk_experiment_assignments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_assignments_experiment_id_user_id_key' AND conrelid = 'public.experiment_assignments'::regclass
  ) THEN
    ALTER TABLE public.experiment_assignments ADD CONSTRAINT experiment_assignments_experiment_id_user_id_key UNIQUE (experiment_id, user_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS experiment_assignments_experiment_id_user_id_key ON public.experiment_assignments USING btree (experiment_id, user_id);

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_tenant_id ON public.experiment_assignments USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user_id ON public.experiment_assignments USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_variant_id ON public.experiment_assignments USING btree (variant_id);

CREATE TABLE IF NOT EXISTS public.experiment_metric_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL,
  variant_key varchar NOT NULL,
  tenant_id uuid NOT NULL,
  page_id uuid NOT NULL,
  event_type varchar NOT NULL,
  session_id varchar,
  user_id uuid,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_metric_events_experiment_id_fkey' AND conrelid = 'public.experiment_metric_events'::regclass
  ) THEN
    ALTER TABLE public.experiment_metric_events ADD CONSTRAINT experiment_metric_events_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_metric_events_page_id_fkey' AND conrelid = 'public.experiment_metric_events'::regclass
  ) THEN
    ALTER TABLE public.experiment_metric_events ADD CONSTRAINT experiment_metric_events_page_id_fkey FOREIGN KEY (page_id) REFERENCES tenant_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_metric_events_tenant_id_fkey' AND conrelid = 'public.experiment_metric_events'::regclass
  ) THEN
    ALTER TABLE public.experiment_metric_events ADD CONSTRAINT experiment_metric_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_created_at ON public.experiment_metric_events USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_created_at_desc ON public.experiment_metric_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_event_type ON public.experiment_metric_events USING btree (event_type);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_experiment_id ON public.experiment_metric_events USING btree (experiment_id);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_page_id ON public.experiment_metric_events USING btree (page_id);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_session_id ON public.experiment_metric_events USING btree (session_id);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_tenant_id ON public.experiment_metric_events USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_user_id ON public.experiment_metric_events USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_variant_key ON public.experiment_metric_events USING btree (variant_key);

CREATE TABLE IF NOT EXISTS public.experiment_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL,
  key text NOT NULL,
  name text,
  weight numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_variants_experiment_id_fkey' AND conrelid = 'public.experiment_variants'::regclass
  ) THEN
    ALTER TABLE public.experiment_variants ADD CONSTRAINT experiment_variants_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_variants_tenant_id_fkey' AND conrelid = 'public.experiment_variants'::regclass
  ) THEN
    ALTER TABLE public.experiment_variants ADD CONSTRAINT experiment_variants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_experiment_variants_tenant' AND conrelid = 'public.experiment_variants'::regclass
  ) THEN
    ALTER TABLE public.experiment_variants ADD CONSTRAINT fk_experiment_variants_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_variants_experiment_id_key_key' AND conrelid = 'public.experiment_variants'::regclass
  ) THEN
    ALTER TABLE public.experiment_variants ADD CONSTRAINT experiment_variants_experiment_id_key_key UNIQUE (experiment_id, key);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS experiment_variants_experiment_id_key_key ON public.experiment_variants USING btree (experiment_id, key);

CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment_id ON public.experiment_variants USING btree (experiment_id);

CREATE INDEX IF NOT EXISTS idx_experiment_variants_key ON public.experiment_variants USING btree (key);

CREATE INDEX IF NOT EXISTS idx_experiment_variants_tenant_id ON public.experiment_variants USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.experiments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  key text NOT NULL,
  name text,
  status varchar DEFAULT 'active'::character varying,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  target_page_id uuid NOT NULL,
  slug varchar NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiments_target_page_id_fkey' AND conrelid = 'public.experiments'::regclass
  ) THEN
    ALTER TABLE public.experiments ADD CONSTRAINT experiments_target_page_id_fkey FOREIGN KEY (target_page_id) REFERENCES tenant_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiments_tenant_id_fkey' AND conrelid = 'public.experiments'::regclass
  ) THEN
    ALTER TABLE public.experiments ADD CONSTRAINT experiments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_experiments_tenant' AND conrelid = 'public.experiments'::regclass
  ) THEN
    ALTER TABLE public.experiments ADD CONSTRAINT fk_experiments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiments_tenant_id_key_key' AND conrelid = 'public.experiments'::regclass
  ) THEN
    ALTER TABLE public.experiments ADD CONSTRAINT experiments_tenant_id_key_key UNIQUE (tenant_id, key);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiments_tenant_id_slug_key' AND conrelid = 'public.experiments'::regclass
  ) THEN
    ALTER TABLE public.experiments ADD CONSTRAINT experiments_tenant_id_slug_key UNIQUE (tenant_id, slug);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS experiments_tenant_id_key_key ON public.experiments USING btree (tenant_id, key);

CREATE UNIQUE INDEX IF NOT EXISTS experiments_tenant_id_slug_key ON public.experiments USING btree (tenant_id, slug);

CREATE INDEX IF NOT EXISTS idx_experiments_ends_at ON public.experiments USING btree (ends_at);

CREATE INDEX IF NOT EXISTS idx_experiments_starts_at ON public.experiments USING btree (starts_at);

CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments USING btree (status);

CREATE INDEX IF NOT EXISTS idx_experiments_target_page_id ON public.experiments USING btree (target_page_id);

CREATE INDEX IF NOT EXISTS idx_experiments_tenant_id ON public.experiments USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.feature_flag_environments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flag_id uuid,
  enabled bool DEFAULT false,
  variant jsonb,
  config jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  environment varchar NOT NULL,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flag_environments_flag_id_fkey' AND conrelid = 'public.feature_flag_environments'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_environments ADD CONSTRAINT feature_flag_environments_flag_id_fkey FOREIGN KEY (flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flag_environments_flag_id_environment_key' AND conrelid = 'public.feature_flag_environments'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_environments ADD CONSTRAINT feature_flag_environments_flag_id_environment_key UNIQUE (flag_id, environment);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS feature_flag_environments_flag_id_environment_key ON public.feature_flag_environments USING btree (flag_id, environment);

CREATE INDEX IF NOT EXISTS idx_feature_flag_environments_enabled ON public.feature_flag_environments USING btree (enabled);

CREATE INDEX IF NOT EXISTS idx_feature_flag_environments_environment ON public.feature_flag_environments USING btree (environment);

CREATE INDEX IF NOT EXISTS idx_feature_flag_environments_flag_id ON public.feature_flag_environments USING btree (flag_id);

CREATE TABLE IF NOT EXISTS public.feature_flag_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  flag_key text NOT NULL,
  user_id uuid,
  variant text,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flag_events_tenant_id_fkey' AND conrelid = 'public.feature_flag_events'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_events ADD CONSTRAINT feature_flag_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flag_events_user_id_fkey' AND conrelid = 'public.feature_flag_events'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_events ADD CONSTRAINT feature_flag_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_feature_flag_events_tenant_id ON public.feature_flag_events USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_feature_flag_events_user_id ON public.feature_flag_events USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.feature_flag_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  flag_id uuid,
  enabled bool NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  environment varchar NOT NULL,
  target_key varchar NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flag_overrides_flag_id_fkey' AND conrelid = 'public.feature_flag_overrides'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_overrides ADD CONSTRAINT feature_flag_overrides_flag_id_fkey FOREIGN KEY (flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flag_overrides_tenant_id_fkey' AND conrelid = 'public.feature_flag_overrides'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_overrides ADD CONSTRAINT feature_flag_overrides_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flag_overrides_user_id_fkey' AND conrelid = 'public.feature_flag_overrides'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_overrides ADD CONSTRAINT feature_flag_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_feature_flag_overrides_tenant' AND conrelid = 'public.feature_flag_overrides'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_overrides ADD CONSTRAINT fk_feature_flag_overrides_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flag_overrides_tenant_id_user_id_flag_id_key' AND conrelid = 'public.feature_flag_overrides'::regclass
  ) THEN
    ALTER TABLE public.feature_flag_overrides ADD CONSTRAINT feature_flag_overrides_tenant_id_user_id_flag_id_key UNIQUE (tenant_id, user_id, flag_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS feature_flag_overrides_tenant_id_user_id_flag_id_key ON public.feature_flag_overrides USING btree (tenant_id, user_id, flag_id);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_created_at_desc ON public.feature_flag_overrides USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_environment ON public.feature_flag_overrides USING btree (environment);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_expires_at ON public.feature_flag_overrides USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_flag ON public.feature_flag_overrides USING btree (flag_id);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_target_key ON public.feature_flag_overrides USING btree (target_key);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_tenant_created_at ON public.feature_flag_overrides USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_tenant_id ON public.feature_flag_overrides USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_user_id ON public.feature_flag_overrides USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  key text NOT NULL,
  description text,
  enabled bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  billing_account_id uuid,
  project_id uuid,
  is_global bool DEFAULT false,
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flags_billing_account_id_fkey' AND conrelid = 'public.feature_flags'::regclass
  ) THEN
    ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flags_tenant_id_fkey' AND conrelid = 'public.feature_flags'::regclass
  ) THEN
    ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_feature_flags_tenant' AND conrelid = 'public.feature_flags'::regclass
  ) THEN
    ALTER TABLE public.feature_flags ADD CONSTRAINT fk_feature_flags_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flags_tenant_id_key_key' AND conrelid = 'public.feature_flags'::regclass
  ) THEN
    ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_tenant_id_key_key UNIQUE (tenant_id, key);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_tenant_id_key_key ON public.feature_flags USING btree (tenant_id, key);

CREATE INDEX IF NOT EXISTS idx_feature_flags_billing_account ON public.feature_flags USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_feature_flags_created_at_desc ON public.feature_flags USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted ON public.feature_flags USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted_at ON public.feature_flags USING btree (deleted_at);

CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted_at_null ON public.feature_flags USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_feature_flags_is_global ON public.feature_flags USING btree (is_global);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags USING btree (key);

CREATE INDEX IF NOT EXISTS idx_feature_flags_project_id ON public.feature_flags USING btree (project_id);

CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant_created_at ON public.feature_flags USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant_id ON public.feature_flags USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.financial_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  insight_type varchar NOT NULL,
  title varchar NOT NULL,
  description text NOT NULL,
  current_value numeric,
  projected_value numeric,
  threshold_value numeric,
  timeframe_start date,
  timeframe_end date,
  urgency varchar NOT NULL DEFAULT 'medium'::character varying,
  recommended_action text,
  status varchar DEFAULT 'active'::character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_financial_insights_active ON public.financial_insights USING btree (status, urgency) WHERE ((status)::text = 'active'::text);

CREATE INDEX IF NOT EXISTS idx_financial_insights_created_at_desc ON public.financial_insights USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_insights_status ON public.financial_insights USING btree (status);

CREATE INDEX IF NOT EXISTS idx_financial_insights_type ON public.financial_insights USING btree (insight_type);

CREATE INDEX IF NOT EXISTS idx_financial_insights_urgency ON public.financial_insights USING btree (urgency);

ALTER TABLE public.financial_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS financial_insights_read ON public.financial_insights;
CREATE POLICY financial_insights_read ON public.financial_insights
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  transaction_type varchar NOT NULL,
  entry_type varchar NOT NULL,
  amount_cents int8 NOT NULL,
  currency varchar NOT NULL DEFAULT 'USD'::character varying,
  account_type varchar NOT NULL,
  reference_type varchar,
  reference_id varchar,
  idempotency_key varchar NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_ledger_created_by_fkey' AND conrelid = 'public.financial_ledger'::regclass
  ) THEN
    ALTER TABLE public.financial_ledger ADD CONSTRAINT financial_ledger_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_ledger_tenant_id_fkey' AND conrelid = 'public.financial_ledger'::regclass
  ) THEN
    ALTER TABLE public.financial_ledger ADD CONSTRAINT financial_ledger_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_ledger_tenant_id_idempotency_key_key' AND conrelid = 'public.financial_ledger'::regclass
  ) THEN
    ALTER TABLE public.financial_ledger ADD CONSTRAINT financial_ledger_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS financial_ledger_tenant_id_idempotency_key_key ON public.financial_ledger USING btree (tenant_id, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_created_at_desc ON public.financial_ledger USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_created_by ON public.financial_ledger USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_tenant_id ON public.financial_ledger USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_ledger_account_type ON public.financial_ledger USING btree (account_type);

CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON public.financial_ledger USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entry_type ON public.financial_ledger USING btree (entry_type);

CREATE INDEX IF NOT EXISTS idx_ledger_idempotency ON public.financial_ledger USING btree (tenant_id, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_ledger_reference ON public.financial_ledger USING btree (reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_ledger_tenant_account ON public.financial_ledger USING btree (tenant_id, account_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_transaction_type ON public.financial_ledger USING btree (transaction_type);

CREATE TABLE IF NOT EXISTS public.fraud_signals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  billing_account_id uuid NOT NULL,
  signal_type varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'medium'::character varying,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved bool DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fraud_signals_billing_account_id_fkey' AND conrelid = 'public.fraud_signals'::regclass
  ) THEN
    ALTER TABLE public.fraud_signals ADD CONSTRAINT fraud_signals_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fraud_signals_ba_id ON public.fraud_signals USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_billing_account_created ON public.fraud_signals USING btree (billing_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_created_at_desc ON public.fraud_signals USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_resolved ON public.fraud_signals USING btree (resolved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_severity ON public.fraud_signals USING btree (severity);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_type ON public.fraud_signals USING btree (signal_type);

ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fraud_signals_read ON public.fraud_signals;
CREATE POLICY fraud_signals_read ON public.fraud_signals
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.growth_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_type varchar NOT NULL,
  title varchar NOT NULL,
  slug varchar NOT NULL,
  content text NOT NULL,
  source_data jsonb DEFAULT '{}'::jsonb,
  seo_title varchar,
  seo_description text,
  keywords _text,
  status varchar DEFAULT 'draft'::character varying,
  published_at timestamptz,
  views int4 DEFAULT 0,
  shares int4 DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'growth_content_slug_key' AND conrelid = 'public.growth_content'::regclass
  ) THEN
    ALTER TABLE public.growth_content ADD CONSTRAINT growth_content_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS growth_content_slug_key ON public.growth_content USING btree (slug);

CREATE INDEX IF NOT EXISTS idx_growth_content_created_at_desc ON public.growth_content USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_growth_content_published ON public.growth_content USING btree (published_at DESC) WHERE ((status)::text = 'published'::text);

CREATE INDEX IF NOT EXISTS idx_growth_content_slug ON public.growth_content USING btree (slug);

CREATE INDEX IF NOT EXISTS idx_growth_content_status ON public.growth_content USING btree (status);

CREATE INDEX IF NOT EXISTS idx_growth_content_type ON public.growth_content USING btree (content_type);

ALTER TABLE public.growth_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read ON public.growth_content;
CREATE POLICY anon_read ON public.growth_content
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.health_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  check_type varchar NOT NULL,
  overall_status varchar NOT NULL,
  results jsonb NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_health_checks_created_at_desc ON public.health_checks USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_checks_status ON public.health_checks USING btree (overall_status);

CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON public.health_checks USING btree ("timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_health_checks_type ON public.health_checks USING btree (check_type);

CREATE TABLE IF NOT EXISTS public.http_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  source text NOT NULL,
  method text NOT NULL,
  path text NOT NULL,
  status int4 NOT NULL,
  latency_ms int4,
  ip inet,
  user_agent text,
  request_headers jsonb,
  request_body_digest text,
  response_headers jsonb,
  response_body_digest text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'http_logs_tenant_id_fkey' AND conrelid = 'public.http_logs'::regclass
  ) THEN
    ALTER TABLE public.http_logs ADD CONSTRAINT http_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_http_logs_created_at_desc ON public.http_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_http_logs_tenant_id ON public.http_logs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_http_logs_tenant_time ON public.http_logs USING btree (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  key varchar NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status varchar DEFAULT 'pending'::character varying,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_idempotency_keys_tenant' AND conrelid = 'public.idempotency_keys'::regclass
  ) THEN
    ALTER TABLE public.idempotency_keys ADD CONSTRAINT fk_idempotency_keys_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idempotency_keys_tenant_id_fkey' AND conrelid = 'public.idempotency_keys'::regclass
  ) THEN
    ALTER TABLE public.idempotency_keys ADD CONSTRAINT idempotency_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idempotency_keys_user_id_fkey' AND conrelid = 'public.idempotency_keys'::regclass
  ) THEN
    ALTER TABLE public.idempotency_keys ADD CONSTRAINT idempotency_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_idempo_tenant_user ON public.idempotency_keys USING btree (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON public.idempotency_keys USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at_desc ON public.idempotency_keys USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON public.idempotency_keys USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys USING btree (key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status ON public.idempotency_keys USING btree (status);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_created_at ON public.idempotency_keys USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_id ON public.idempotency_keys USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_key ON public.idempotency_keys USING btree (tenant_id, key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON public.idempotency_keys USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_user_key ON public.idempotency_keys USING btree (user_id, key);

CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  adapter text NOT NULL,
  secret_ref uuid NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_credentials_created_by_fkey' AND conrelid = 'public.integration_credentials'::regclass
  ) THEN
    ALTER TABLE public.integration_credentials ADD CONSTRAINT integration_credentials_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_credentials_tenant_id_fkey' AND conrelid = 'public.integration_credentials'::regclass
  ) THEN
    ALTER TABLE public.integration_credentials ADD CONSTRAINT integration_credentials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_credentials_user_id_fkey' AND conrelid = 'public.integration_credentials'::regclass
  ) THEN
    ALTER TABLE public.integration_credentials ADD CONSTRAINT integration_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_credentials_tenant_id_adapter_key' AND conrelid = 'public.integration_credentials'::regclass
  ) THEN
    ALTER TABLE public.integration_credentials ADD CONSTRAINT integration_credentials_tenant_id_adapter_key UNIQUE (tenant_id, adapter);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_integration_credentials_created_at_desc ON public.integration_credentials USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_credentials_created_by ON public.integration_credentials USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_integration_credentials_tenant_created_at ON public.integration_credentials USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_credentials_tenant_id ON public.integration_credentials USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS integration_credentials_tenant_id_adapter_key ON public.integration_credentials USING btree (tenant_id, adapter);

CREATE TABLE IF NOT EXISTS public.integration_health (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  integration_id varchar NOT NULL,
  health_score int4 DEFAULT 100,
  status varchar DEFAULT 'healthy'::character varying,
  last_successful_sync timestamptz,
  last_failed_sync timestamptz,
  consecutive_failures int4 DEFAULT 0,
  error_message text,
  auto_disabled bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_health_tenant_id_fkey' AND conrelid = 'public.integration_health'::regclass
  ) THEN
    ALTER TABLE public.integration_health ADD CONSTRAINT integration_health_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_health_tenant_id_integration_id_key' AND conrelid = 'public.integration_health'::regclass
  ) THEN
    ALTER TABLE public.integration_health ADD CONSTRAINT integration_health_tenant_id_integration_id_key UNIQUE (tenant_id, integration_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_integration_health_auto_disabled ON public.integration_health USING btree (auto_disabled) WHERE (auto_disabled = true);

CREATE INDEX IF NOT EXISTS idx_integration_health_created_at_desc ON public.integration_health USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_health_integration_id ON public.integration_health USING btree (integration_id);

CREATE INDEX IF NOT EXISTS idx_integration_health_status ON public.integration_health USING btree (status);

CREATE INDEX IF NOT EXISTS idx_integration_health_tenant_id ON public.integration_health USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS integration_health_tenant_id_integration_id_key ON public.integration_health USING btree (tenant_id, integration_id);

ALTER TABLE public.integration_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_delete ON public.integration_health;
CREATE POLICY tenant_delete ON public.integration_health
  FOR DELETE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  ;

DROP POLICY IF EXISTS tenant_insert ON public.integration_health;
CREATE POLICY tenant_insert ON public.integration_health
  FOR INSERT
  
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

DROP POLICY IF EXISTS tenant_select ON public.integration_health;
CREATE POLICY tenant_select ON public.integration_health
  FOR SELECT
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids)))))
  ;

DROP POLICY IF EXISTS tenant_update ON public.integration_health;
CREATE POLICY tenant_update ON public.integration_health
  FOR UPDATE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

CREATE TABLE IF NOT EXISTS public.integration_quota_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  integration_id varchar NOT NULL,
  date date NOT NULL,
  api_calls int4 DEFAULT 0,
  webhook_events int4 DEFAULT 0,
  data_synced_mb numeric DEFAULT 0,
  cost_usd numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_quota_usage_tenant_id_fkey' AND conrelid = 'public.integration_quota_usage'::regclass
  ) THEN
    ALTER TABLE public.integration_quota_usage ADD CONSTRAINT integration_quota_usage_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_quota_usage_tenant_id_integration_id_date_key' AND conrelid = 'public.integration_quota_usage'::regclass
  ) THEN
    ALTER TABLE public.integration_quota_usage ADD CONSTRAINT integration_quota_usage_tenant_id_integration_id_date_key UNIQUE (tenant_id, integration_id, date);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_integration_quota_usage_created_at_desc ON public.integration_quota_usage USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_quota_usage_date ON public.integration_quota_usage USING btree (date);

CREATE INDEX IF NOT EXISTS idx_integration_quota_usage_integration_id ON public.integration_quota_usage USING btree (integration_id);

CREATE INDEX IF NOT EXISTS idx_integration_quota_usage_tenant_id ON public.integration_quota_usage USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS integration_quota_usage_tenant_id_integration_id_date_key ON public.integration_quota_usage USING btree (tenant_id, integration_id, date);

ALTER TABLE public.integration_quota_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_delete ON public.integration_quota_usage;
CREATE POLICY tenant_delete ON public.integration_quota_usage
  FOR DELETE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  ;

DROP POLICY IF EXISTS tenant_insert ON public.integration_quota_usage;
CREATE POLICY tenant_insert ON public.integration_quota_usage
  FOR INSERT
  
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

DROP POLICY IF EXISTS tenant_select ON public.integration_quota_usage;
CREATE POLICY tenant_select ON public.integration_quota_usage
  FOR SELECT
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids)))))
  ;

DROP POLICY IF EXISTS tenant_update ON public.integration_quota_usage;
CREATE POLICY tenant_update ON public.integration_quota_usage
  FOR UPDATE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

CREATE TABLE IF NOT EXISTS public.job_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  attempt_no int4 NOT NULL,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  ok bool,
  error jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_attempts_job_id_fkey' AND conrelid = 'public.job_attempts'::regclass
  ) THEN
    ALTER TABLE public.job_attempts ADD CONSTRAINT job_attempts_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_attempts_unique' AND conrelid = 'public.job_attempts'::regclass
  ) THEN
    ALTER TABLE public.job_attempts ADD CONSTRAINT job_attempts_unique UNIQUE (job_id, attempt_no);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_attempts_attempt_no ON public.job_attempts USING btree (job_id, attempt_no);

CREATE INDEX IF NOT EXISTS idx_job_attempts_job_id ON public.job_attempts USING btree (job_id);

CREATE UNIQUE INDEX IF NOT EXISTS job_attempts_unique ON public.job_attempts USING btree (job_id, attempt_no);

CREATE TABLE IF NOT EXISTS public.job_failure_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_type varchar NOT NULL,
  job_id uuid,
  error_message text NOT NULL,
  error_stack text,
  retry_count int4 DEFAULT 0,
  max_retries int4 DEFAULT 3,
  status varchar DEFAULT 'pending_retry'::character varying,
  last_attempt_at timestamptz DEFAULT now(),
  next_retry_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_job_failure_log_created_at_desc ON public.job_failure_log USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_failure_log_job_id ON public.job_failure_log USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_job_failure_log_job_type ON public.job_failure_log USING btree (job_type);

CREATE INDEX IF NOT EXISTS idx_job_failure_log_next_retry ON public.job_failure_log USING btree (next_retry_at) WHERE ((status)::text = ANY ((ARRAY['pending_retry'::character varying, 'retrying'::character varying])::text[]));

CREATE INDEX IF NOT EXISTS idx_job_failure_log_status ON public.job_failure_log USING btree (status);

ALTER TABLE public.job_failure_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_failure_log_select_service_role_only ON public.job_failure_log;
CREATE POLICY job_failure_log_select_service_role_only ON public.job_failure_log
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.job_rule_snapshots (
  execution_id uuid NOT NULL,
  job_id uuid NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (execution_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_rule_snapshots_execution_id_fkey' AND conrelid = 'public.job_rule_snapshots'::regclass
  ) THEN
    ALTER TABLE public.job_rule_snapshots ADD CONSTRAINT job_rule_snapshots_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES executions(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_rule_snapshots_execution_id ON public.job_rule_snapshots USING btree (execution_id);

CREATE INDEX IF NOT EXISTS idx_job_rule_snapshots_job ON public.job_rule_snapshots USING btree (job_id);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued'::text,
  idempotency_key text,
  run_id uuid,
  available_at timestamptz DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  attempts int4 DEFAULT 0,
  max_attempts int4 DEFAULT 8,
  last_error jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_run_id_fkey' AND conrelid = 'public.jobs'::regclass
  ) THEN
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_run_id_fkey FOREIGN KEY (run_id) REFERENCES recon_runs(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_available_at ON public.jobs USING btree (available_at) WHERE (status = 'queued'::text);

CREATE INDEX IF NOT EXISTS idx_jobs_idempotency_key ON public.jobs USING btree (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_jobs_run_id ON public.jobs USING btree (run_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs USING btree (status);

CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs USING btree (type);

CREATE INDEX IF NOT EXISTS idx_jobs_workspace_id ON public.jobs USING btree (workspace_id);

CREATE UNIQUE INDEX IF NOT EXISTS jobs_idempotency_unique_idx ON public.jobs USING btree (workspace_id, type, idempotency_key) WHERE (idempotency_key IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  email varchar NOT NULL,
  name varchar,
  company varchar,
  phone varchar,
  status varchar NOT NULL DEFAULT 'new'::character varying,
  lifecycle_stage varchar NOT NULL DEFAULT 'lead'::character varying,
  assigned_to uuid,
  source varchar,
  score int4 DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_assigned_to_fkey' AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_tenant_id_fkey' AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_tenant_id_email_key' AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_tenant_id_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads USING btree (assigned_to);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON public.leads USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_deleted_at_null ON public.leads USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_leads_lifecycle_stage ON public.leads USING btree (lifecycle_stage);

CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads USING btree (tenant_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads USING btree (status);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_assigned ON public.leads USING btree (tenant_id, assigned_to);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON public.leads USING btree (tenant_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS leads_tenant_id_email_key ON public.leads USING btree (tenant_id, email);

CREATE TABLE IF NOT EXISTS public.mapping_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name varchar NOT NULL,
  description text,
  source_schema jsonb NOT NULL,
  target_schema jsonb NOT NULL,
  field_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  transformation_rules jsonb DEFAULT '[]'::jsonb,
  validation_rules jsonb DEFAULT '[]'::jsonb,
  is_public bool DEFAULT false,
  is_system bool DEFAULT false,
  usage_count int4 DEFAULT 0,
  version int4 DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mapping_templates_tenant_id_fkey' AND conrelid = 'public.mapping_templates'::regclass
  ) THEN
    ALTER TABLE public.mapping_templates ADD CONSTRAINT mapping_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mapping_templates_created_at_desc ON public.mapping_templates USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mapping_templates_deleted_at_null ON public.mapping_templates USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_mapping_templates_field_mappings_gin ON public.mapping_templates USING gin (field_mappings);

CREATE INDEX IF NOT EXISTS idx_mapping_templates_public ON public.mapping_templates USING btree (is_public) WHERE ((is_public = true) AND (deleted_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_mapping_templates_source_schema_gin ON public.mapping_templates USING gin (source_schema);

CREATE INDEX IF NOT EXISTS idx_mapping_templates_target_schema_gin ON public.mapping_templates USING gin (target_schema);

CREATE INDEX IF NOT EXISTS idx_mapping_templates_tenant_id ON public.mapping_templates USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL,
  job_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  source_id varchar NOT NULL,
  target_id varchar NOT NULL,
  amount numeric,
  currency varchar,
  confidence numeric,
  matched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_matches_tenant' AND conrelid = 'public.matches'::regclass
  ) THEN
    ALTER TABLE public.matches ADD CONSTRAINT fk_matches_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_execution_id_fkey' AND conrelid = 'public.matches'::regclass
  ) THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_tenant_id_fkey' AND conrelid = 'public.matches'::regclass
  ) THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matches_created_at_desc ON public.matches USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_execution_id ON public.matches USING btree (execution_id);

CREATE INDEX IF NOT EXISTS idx_matches_job ON public.matches USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_matches_job_day ON public.matches USING btree (job_id, created_at);

CREATE INDEX IF NOT EXISTS idx_matches_tenant_created_at ON public.matches USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_tenant_id ON public.matches USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  invited_by uuid,
  invite_token text,
  invite_expires_at timestamptz,
  note text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_invited_by_fkey' AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_fkey' AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_fkey' AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_user_id_fkey' AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_user_id_fkey' AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_invite_token_key' AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_invite_token_key UNIQUE (invite_token);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_user_id_key' AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_tenant_id_user_id_key UNIQUE (tenant_id, user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_user_id_key' AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_tenant_id_user_id_key UNIQUE (tenant_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships USING btree (status);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON public.memberships USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON public.memberships USING btree (tenant_id, role);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON public.memberships USING btree (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_user_tenant ON public.memberships USING btree (user_id, tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS memberships_invite_token_key ON public.memberships USING btree (invite_token);

CREATE UNIQUE INDEX IF NOT EXISTS memberships_tenant_id_user_id_key ON public.memberships USING btree (tenant_id, user_id);

CREATE TABLE IF NOT EXISTS public.message_summaries (
  message_id uuid NOT NULL,
  short_summary text,
  support_intent text,
  sentiment text,
  priority text,
  extracted_entities jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL,
  PRIMARY KEY (message_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_message_summaries_tenant' AND conrelid = 'public.message_summaries'::regclass
  ) THEN
    ALTER TABLE public.message_summaries ADD CONSTRAINT fk_message_summaries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'message_summaries_message_id_fkey' AND conrelid = 'public.message_summaries'::regclass
  ) THEN
    ALTER TABLE public.message_summaries ADD CONSTRAINT message_summaries_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'message_summaries_tenant_id_fkey' AND conrelid = 'public.message_summaries'::regclass
  ) THEN
    ALTER TABLE public.message_summaries ADD CONSTRAINT message_summaries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_message_summaries_created_at_desc ON public.message_summaries USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_summaries_message ON public.message_summaries USING btree (message_id);

CREATE INDEX IF NOT EXISTS idx_message_summaries_tenant_created_at ON public.message_summaries USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_summaries_tenant_id ON public.message_summaries USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  author_id uuid,
  tenant_id uuid NOT NULL,
  thread_id uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_tenant' AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT fk_messages_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_author_id_fkey' AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_id_fkey' AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey' AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_tenant_id_fkey' AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS brin_messages_created_at ON public.messages USING brin (created_at) WITH (autosummarize='on');

CREATE INDEX IF NOT EXISTS idx_messages_author ON public.messages USING btree (author_id);

CREATE INDEX IF NOT EXISTS idx_messages_conv_sender ON public.messages USING btree (conversation_id, sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_conv_tenant_created ON public.messages USING btree (conversation_id, tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages USING btree (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages USING btree (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at_not_deleted ON public.messages USING btree (conversation_id, created_at DESC) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON public.messages USING btree (deleted_at);

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at_null ON public.messages USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_messages_metadata_gin ON public.messages USING gin (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages USING btree (sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_tenant_author ON public.messages USING btree (tenant_id, author_id);

CREATE INDEX IF NOT EXISTS idx_messages_tenant_conv_author ON public.messages USING btree (tenant_id, conversation_id, author_id);

CREATE INDEX IF NOT EXISTS idx_messages_tenant_conversation ON public.messages USING btree (tenant_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_tenant_created_at ON public.messages USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON public.messages USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages USING btree (thread_id);

CREATE INDEX IF NOT EXISTS idx_messages_thread_created_desc ON public.messages USING btree (thread_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.model_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  model_name varchar NOT NULL,
  version varchar NOT NULL,
  model_type varchar NOT NULL,
  format varchar NOT NULL,
  quantization varchar,
  file_path text NOT NULL,
  file_size_bytes int8,
  file_hash varchar,
  aias_job_id varchar,
  benchmark_results jsonb,
  device_targets _text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'model_versions_tenant_id_fkey' AND conrelid = 'public.model_versions'::regclass
  ) THEN
    ALTER TABLE public.model_versions ADD CONSTRAINT model_versions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'model_versions_model_name_version_key' AND conrelid = 'public.model_versions'::regclass
  ) THEN
    ALTER TABLE public.model_versions ADD CONSTRAINT model_versions_model_name_version_key UNIQUE (model_name, version);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_model_versions_active ON public.model_versions USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_model_versions_aias_job ON public.model_versions USING btree (aias_job_id);

CREATE INDEX IF NOT EXISTS idx_model_versions_created_at_desc ON public.model_versions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_versions_device_targets_gin ON public.model_versions USING gin (device_targets);

CREATE INDEX IF NOT EXISTS idx_model_versions_model_name ON public.model_versions USING btree (model_name);

CREATE INDEX IF NOT EXISTS idx_model_versions_tenant_active ON public.model_versions USING btree (tenant_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_versions_tenant_id ON public.model_versions USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_model_versions_type ON public.model_versions USING btree (model_type);

CREATE UNIQUE INDEX IF NOT EXISTS model_versions_model_name_version_key ON public.model_versions USING btree (model_name, version);

CREATE TABLE IF NOT EXISTS public.monitoring_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  metric_name varchar NOT NULL,
  metric_type varchar NOT NULL,
  tenant_id uuid,
  billing_account_id uuid,
  integration_id varchar,
  value numeric NOT NULL,
  unit varchar,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monitoring_metrics_billing_account_id_fkey' AND conrelid = 'public.monitoring_metrics'::regclass
  ) THEN
    ALTER TABLE public.monitoring_metrics ADD CONSTRAINT monitoring_metrics_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monitoring_metrics_tenant_id_fkey' AND conrelid = 'public.monitoring_metrics'::regclass
  ) THEN
    ALTER TABLE public.monitoring_metrics ADD CONSTRAINT monitoring_metrics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_ba_id ON public.monitoring_metrics USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_metric_name ON public.monitoring_metrics USING btree (metric_name);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_metric_tenant_time ON public.monitoring_metrics USING btree (metric_name, tenant_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_tenant_id ON public.monitoring_metrics USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp ON public.monitoring_metrics USING btree ("timestamp" DESC);

ALTER TABLE public.monitoring_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_delete ON public.monitoring_metrics;
CREATE POLICY tenant_delete ON public.monitoring_metrics
  FOR DELETE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  ;

DROP POLICY IF EXISTS tenant_insert ON public.monitoring_metrics;
CREATE POLICY tenant_insert ON public.monitoring_metrics
  FOR INSERT
  
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

DROP POLICY IF EXISTS tenant_select ON public.monitoring_metrics;
CREATE POLICY tenant_select ON public.monitoring_metrics
  FOR SELECT
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids)))))
  ;

DROP POLICY IF EXISTS tenant_update ON public.monitoring_metrics;
CREATE POLICY tenant_update ON public.monitoring_metrics
  FOR UPDATE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id text NOT NULL,
  email text NOT NULL,
  name text,
  source text,
  tags _text,
  resend_contact_id text,
  subscribed bool NOT NULL DEFAULT true,
  unsubscribed_at timestamp,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscriptions_email_key' AND conrelid = 'public.newsletter_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.newsletter_subscriptions ADD CONSTRAINT newsletter_subscriptions_email_key UNIQUE (email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_created_at_desc ON public.newsletter_subscriptions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_email_idx ON public.newsletter_subscriptions USING btree (email);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscriptions_email_key ON public.newsletter_subscriptions USING btree (email);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_subscribed_idx ON public.newsletter_subscriptions USING btree (subscribed);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read ON public.newsletter_subscriptions;
CREATE POLICY anon_read ON public.newsletter_subscriptions
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type varchar NOT NULL,
  title varchar NOT NULL,
  message text,
  entity_type varchar,
  entity_id uuid,
  read bool DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey' AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications USING btree (user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications USING btree (notification_type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  user_id uuid NOT NULL,
  step varchar NOT NULL,
  completed bool NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  current_step varchar NOT NULL DEFAULT 'welcome'::character varying,
  completed_steps _text NOT NULL DEFAULT '{}'::text[],
  skipped_steps _text NOT NULL DEFAULT '{}'::text[],
  progress int4 NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  PRIMARY KEY (user_id, step)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_progress_user_id_fkey' AND conrelid = 'public.onboarding_progress'::regclass
  ) THEN
    ALTER TABLE public.onboarding_progress ADD CONSTRAINT onboarding_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_completed ON public.onboarding_progress USING btree (user_id, completed);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_current_step ON public.onboarding_progress USING btree (current_step);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_progress ON public.onboarding_progress USING btree (progress);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_updated_at ON public.onboarding_progress USING btree (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON public.onboarding_progress USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.ops_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recommendation_id uuid,
  insight_id uuid,
  action_taken text NOT NULL,
  actor_type varchar NOT NULL,
  actor_id uuid,
  executed_at timestamptz NOT NULL DEFAULT now(),
  outcome_notes text,
  verification_status varchar DEFAULT 'pending'::character varying,
  verified_at timestamptz,
  verified_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_actions_actor_id_fkey' AND conrelid = 'public.ops_actions'::regclass
  ) THEN
    ALTER TABLE public.ops_actions ADD CONSTRAINT ops_actions_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_actions_insight_id_fkey' AND conrelid = 'public.ops_actions'::regclass
  ) THEN
    ALTER TABLE public.ops_actions ADD CONSTRAINT ops_actions_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES ops_insights(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_actions_recommendation_id_fkey' AND conrelid = 'public.ops_actions'::regclass
  ) THEN
    ALTER TABLE public.ops_actions ADD CONSTRAINT ops_actions_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES ops_recommendations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_actions_verified_by_fkey' AND conrelid = 'public.ops_actions'::regclass
  ) THEN
    ALTER TABLE public.ops_actions ADD CONSTRAINT ops_actions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ops_actions_actor_type ON public.ops_actions USING btree (actor_type);

CREATE INDEX IF NOT EXISTS idx_ops_actions_executed_at ON public.ops_actions USING btree (executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_actions_insight_id ON public.ops_actions USING btree (insight_id);

CREATE INDEX IF NOT EXISTS idx_ops_actions_recommendation_id ON public.ops_actions USING btree (recommendation_id);

CREATE INDEX IF NOT EXISTS idx_ops_actions_verification_status ON public.ops_actions USING btree (verification_status);

CREATE TABLE IF NOT EXISTS public.ops_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action varchar NOT NULL,
  resource_type varchar,
  resource_id uuid,
  user_id uuid,
  organization_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ops_audit_logs_action ON public.ops_audit_logs USING btree (action);

CREATE INDEX IF NOT EXISTS idx_ops_audit_logs_created_at ON public.ops_audit_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_audit_logs_user ON public.ops_audit_logs USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.ops_briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  summary_markdown text NOT NULL,
  summary_json jsonb,
  insights_count int4 DEFAULT 0,
  recommendations_count int4 DEFAULT 0,
  actions_count int4 DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_briefings_generated_by_fkey' AND conrelid = 'public.ops_briefings'::regclass
  ) THEN
    ALTER TABLE public.ops_briefings ADD CONSTRAINT ops_briefings_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ops_briefings_generated_at ON public.ops_briefings USING btree (generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_briefings_period_end ON public.ops_briefings USING btree (period_end DESC);

CREATE INDEX IF NOT EXISTS idx_ops_briefings_period_start ON public.ops_briefings USING btree (period_start DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ops_briefings_period_unique ON public.ops_briefings USING btree (period_start, period_end);

CREATE TABLE IF NOT EXISTS public.ops_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  error_type varchar NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  route varchar,
  user_id uuid,
  organization_id uuid,
  request_id varchar,
  user_agent text,
  severity varchar DEFAULT 'error'::character varying,
  resolved bool DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ops_errors_created_at ON public.ops_errors USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_errors_resolved ON public.ops_errors USING btree (resolved);

CREATE INDEX IF NOT EXISTS idx_ops_errors_route ON public.ops_errors USING btree (route);

CREATE INDEX IF NOT EXISTS idx_ops_errors_severity ON public.ops_errors USING btree (severity);

CREATE TABLE IF NOT EXISTS public.ops_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type varchar NOT NULL,
  title varchar NOT NULL,
  summary text NOT NULL,
  severity varchar NOT NULL DEFAULT 'info'::character varying,
  confidence numeric NOT NULL DEFAULT 0.5,
  time_window jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  related_entities jsonb DEFAULT '[]'::jsonb,
  analytics_pivot_id uuid,
  status varchar DEFAULT 'active'::character varying,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_insights_resolved_by_fkey' AND conrelid = 'public.ops_insights'::regclass
  ) THEN
    ALTER TABLE public.ops_insights ADD CONSTRAINT ops_insights_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ops_insights_active ON public.ops_insights USING btree (status, created_at DESC) WHERE ((status)::text = 'active'::text);

CREATE INDEX IF NOT EXISTS idx_ops_insights_confidence ON public.ops_insights USING btree (confidence DESC);

CREATE INDEX IF NOT EXISTS idx_ops_insights_created_at ON public.ops_insights USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_insights_evidence_gin ON public.ops_insights USING gin (evidence);

CREATE INDEX IF NOT EXISTS idx_ops_insights_expires_at ON public.ops_insights USING btree (expires_at) WHERE (expires_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_ops_insights_related_entities_gin ON public.ops_insights USING gin (related_entities);

CREATE INDEX IF NOT EXISTS idx_ops_insights_severity ON public.ops_insights USING btree (severity);

CREATE INDEX IF NOT EXISTS idx_ops_insights_status ON public.ops_insights USING btree (status);

CREATE INDEX IF NOT EXISTS idx_ops_insights_type ON public.ops_insights USING btree (type);

CREATE TABLE IF NOT EXISTS public.ops_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_type varchar NOT NULL,
  status varchar DEFAULT 'pending'::character varying,
  payload jsonb,
  result jsonb,
  error_message text,
  attempts int4 DEFAULT 0,
  max_attempts int4 DEFAULT 3,
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ops_jobs_job_type ON public.ops_jobs USING btree (job_type);

CREATE INDEX IF NOT EXISTS idx_ops_jobs_scheduled_at ON public.ops_jobs USING btree (scheduled_at);

CREATE INDEX IF NOT EXISTS idx_ops_jobs_status ON public.ops_jobs USING btree (status);

CREATE TABLE IF NOT EXISTS public.ops_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  insight_id uuid NOT NULL,
  action_type varchar NOT NULL,
  description text NOT NULL,
  risk_level varchar NOT NULL DEFAULT 'low'::character varying,
  expected_impact text,
  reversibility bool NOT NULL DEFAULT true,
  runbook_link text,
  status varchar DEFAULT 'suggested'::character varying,
  accepted_at timestamptz,
  accepted_by uuid,
  executed_at timestamptz,
  executed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_recommendations_accepted_by_fkey' AND conrelid = 'public.ops_recommendations'::regclass
  ) THEN
    ALTER TABLE public.ops_recommendations ADD CONSTRAINT ops_recommendations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_recommendations_executed_by_fkey' AND conrelid = 'public.ops_recommendations'::regclass
  ) THEN
    ALTER TABLE public.ops_recommendations ADD CONSTRAINT ops_recommendations_executed_by_fkey FOREIGN KEY (executed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_recommendations_insight_id_fkey' AND conrelid = 'public.ops_recommendations'::regclass
  ) THEN
    ALTER TABLE public.ops_recommendations ADD CONSTRAINT ops_recommendations_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES ops_insights(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ops_recommendations_action_type ON public.ops_recommendations USING btree (action_type);

CREATE INDEX IF NOT EXISTS idx_ops_recommendations_insight_id ON public.ops_recommendations USING btree (insight_id);

CREATE INDEX IF NOT EXISTS idx_ops_recommendations_risk_level ON public.ops_recommendations USING btree (risk_level);

CREATE INDEX IF NOT EXISTS idx_ops_recommendations_status ON public.ops_recommendations USING btree (status);

CREATE INDEX IF NOT EXISTS idx_ops_recommendations_suggested ON public.ops_recommendations USING btree (status, created_at DESC) WHERE ((status)::text = 'suggested'::text);

CREATE TABLE IF NOT EXISTS public.ops_support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number varchar NOT NULL,
  user_id uuid NOT NULL,
  organization_id uuid,
  subject varchar NOT NULL,
  description text NOT NULL,
  status varchar DEFAULT 'open'::character varying,
  priority varchar DEFAULT 'medium'::character varying,
  category varchar,
  triage_result jsonb,
  assigned_to uuid,
  resolved_at timestamptz,
  resolved_by uuid,
  context jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_support_tickets_ticket_number_key' AND conrelid = 'public.ops_support_tickets'::regclass
  ) THEN
    ALTER TABLE public.ops_support_tickets ADD CONSTRAINT ops_support_tickets_ticket_number_key UNIQUE (ticket_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_created_at ON public.ops_support_tickets USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_org ON public.ops_support_tickets USING btree (organization_id);

CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_status ON public.ops_support_tickets USING btree (status);

CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_user ON public.ops_support_tickets USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS ops_support_tickets_ticket_number_key ON public.ops_support_tickets USING btree (ticket_number);

CREATE TABLE IF NOT EXISTS public.ops_usage_aggregates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  organization_id uuid,
  user_id uuid,
  endpoint varchar,
  usage_count int4 DEFAULT 0,
  error_count int4 DEFAULT 0,
  avg_response_time_ms int4,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ops_usage_aggregates_date_organization_id_user_id_endpoint_key' AND conrelid = 'public.ops_usage_aggregates'::regclass
  ) THEN
    ALTER TABLE public.ops_usage_aggregates ADD CONSTRAINT ops_usage_aggregates_date_organization_id_user_id_endpoint_key UNIQUE (date, organization_id, user_id, endpoint);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ops_usage_aggregates_date ON public.ops_usage_aggregates USING btree (date DESC);

CREATE INDEX IF NOT EXISTS idx_ops_usage_aggregates_org ON public.ops_usage_aggregates USING btree (organization_id);

CREATE INDEX IF NOT EXISTS idx_ops_usage_aggregates_user ON public.ops_usage_aggregates USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS ops_usage_aggregates_date_organization_id_user_id_endpoint_key ON public.ops_usage_aggregates USING btree (date, organization_id, user_id, endpoint);

CREATE TABLE IF NOT EXISTS public.ops_webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  webhook_url text NOT NULL,
  event_type varchar NOT NULL,
  payload jsonb NOT NULL,
  status varchar DEFAULT 'pending'::character varying,
  response_status int4,
  response_body text,
  attempts int4 DEFAULT 0,
  max_attempts int4 DEFAULT 3,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ops_webhooks_created_at ON public.ops_webhooks USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_webhooks_event_type ON public.ops_webhooks USING btree (event_type);

CREATE INDEX IF NOT EXISTS idx_ops_webhooks_status ON public.ops_webhooks USING btree (status);

CREATE TABLE IF NOT EXISTS public.participants (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'user'::text,
  added_at timestamptz DEFAULT now(),
  tenant_id uuid NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_participants_tenant' AND conrelid = 'public.participants'::regclass
  ) THEN
    ALTER TABLE public.participants ADD CONSTRAINT fk_participants_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participants_conversation_id_fkey' AND conrelid = 'public.participants'::regclass
  ) THEN
    ALTER TABLE public.participants ADD CONSTRAINT participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participants_tenant_id_fkey' AND conrelid = 'public.participants'::regclass
  ) THEN
    ALTER TABLE public.participants ADD CONSTRAINT participants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participants_user_id_fkey' AND conrelid = 'public.participants'::regclass
  ) THEN
    ALTER TABLE public.participants ADD CONSTRAINT participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_participants_conv_user ON public.participants USING btree (conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_participants_conversation_id ON public.participants USING btree (conversation_id);

CREATE INDEX IF NOT EXISTS idx_participants_tenant_conv_user ON public.participants USING btree (tenant_id, conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_participants_tenant_id ON public.participants USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_participants_user_conversation ON public.participants USING btree (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.payment_recovery (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid,
  failure_type varchar NOT NULL,
  failure_count int4 NOT NULL DEFAULT 1,
  grace_period_ends_at timestamptz,
  recovery_attempts int4 NOT NULL DEFAULT 0,
  recovered_at timestamptz,
  status varchar NOT NULL DEFAULT 'active'::character varying,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_recovery_subscription_id_fkey' AND conrelid = 'public.payment_recovery'::regclass
  ) THEN
    ALTER TABLE public.payment_recovery ADD CONSTRAINT payment_recovery_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_recovery_user_id_fkey' AND conrelid = 'public.payment_recovery'::regclass
  ) THEN
    ALTER TABLE public.payment_recovery ADD CONSTRAINT payment_recovery_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_recovery_created_at_desc ON public.payment_recovery USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_recovery_status ON public.payment_recovery USING btree (status);

CREATE INDEX IF NOT EXISTS idx_payment_recovery_subscription_id ON public.payment_recovery USING btree (subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_recovery_user_id ON public.payment_recovery USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.pii_mapping_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  edge_node_id uuid,
  original_value_hash varchar NOT NULL,
  token varchar NOT NULL,
  pii_type varchar,
  encryption_key_id varchar,
  redacted_value text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pii_mapping_tokens_edge_node_id_fkey' AND conrelid = 'public.pii_mapping_tokens'::regclass
  ) THEN
    ALTER TABLE public.pii_mapping_tokens ADD CONSTRAINT pii_mapping_tokens_edge_node_id_fkey FOREIGN KEY (edge_node_id) REFERENCES edge_nodes(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pii_mapping_tokens_tenant_id_fkey' AND conrelid = 'public.pii_mapping_tokens'::regclass
  ) THEN
    ALTER TABLE public.pii_mapping_tokens ADD CONSTRAINT pii_mapping_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pii_mapping_tokens_tenant_id_original_value_hash_key' AND conrelid = 'public.pii_mapping_tokens'::regclass
  ) THEN
    ALTER TABLE public.pii_mapping_tokens ADD CONSTRAINT pii_mapping_tokens_tenant_id_original_value_hash_key UNIQUE (tenant_id, original_value_hash);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_created_at_desc ON public.pii_mapping_tokens USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_edge_node_id ON public.pii_mapping_tokens USING btree (edge_node_id);

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_expires ON public.pii_mapping_tokens USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_original_hash ON public.pii_mapping_tokens USING btree (original_value_hash);

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_pii_type ON public.pii_mapping_tokens USING btree (pii_type);

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_tenant_id ON public.pii_mapping_tokens USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_tenant_token ON public.pii_mapping_tokens USING btree (tenant_id, token);

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_token ON public.pii_mapping_tokens USING btree (token);

CREATE UNIQUE INDEX IF NOT EXISTS pii_mapping_tokens_tenant_id_original_value_hash_key ON public.pii_mapping_tokens USING btree (tenant_id, original_value_hash);

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  max_uploads_month int4,
  max_storage_mb int4,
  max_extractions_month int4,
  max_users int4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plans_slug_key' AND conrelid = 'public.plans'::regclass
  ) THEN
    ALTER TABLE public.plans ADD CONSTRAINT plans_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plans_created_at_desc ON public.plans USING btree (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS plans_slug_key ON public.plans USING btree (slug);

CREATE TABLE IF NOT EXISTS public.playground_usage (
  id text NOT NULL,
  feature text NOT NULL,
  action text NOT NULL,
  integration text,
  duration_ms int4,
  success bool,
  user_id uuid,
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_playground_usage_created_at_desc ON public.playground_usage USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_playground_usage_user_id ON public.playground_usage USING btree (user_id);

CREATE INDEX IF NOT EXISTS playground_usage_feature_idx ON public.playground_usage USING btree (feature);

CREATE INDEX IF NOT EXISTS playground_usage_timestamp_idx ON public.playground_usage USING btree ("timestamp");

ALTER TABLE public.playground_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_delete ON public.playground_usage;
CREATE POLICY user_delete ON public.playground_usage
  FOR DELETE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_insert ON public.playground_usage;
CREATE POLICY user_insert ON public.playground_usage
  FOR INSERT
  
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS user_select ON public.playground_usage;
CREATE POLICY user_select ON public.playground_usage
  FOR SELECT
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_update ON public.playground_usage;
CREATE POLICY user_update ON public.playground_usage
  FOR UPDATE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE TABLE IF NOT EXISTS public.positioning_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  five_word_vp varchar,
  target_persona_pain text,
  clarity_rating int4,
  feedback_text text,
  impact_score int4 DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'positioning_feedback_user_id_fkey' AND conrelid = 'public.positioning_feedback'::regclass
  ) THEN
    ALTER TABLE public.positioning_feedback ADD CONSTRAINT positioning_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_positioning_feedback_clarity_rating ON public.positioning_feedback USING btree (clarity_rating DESC);

CREATE INDEX IF NOT EXISTS idx_positioning_feedback_created_at ON public.positioning_feedback USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_positioning_feedback_impact_score ON public.positioning_feedback USING btree (impact_score DESC);

CREATE INDEX IF NOT EXISTS idx_positioning_feedback_user_id ON public.positioning_feedback USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title varchar NOT NULL,
  content text NOT NULL,
  post_type varchar DEFAULT 'post'::character varying,
  status varchar DEFAULT 'published'::character varying,
  views int4 DEFAULT 0,
  upvotes int4 DEFAULT 0,
  downvotes int4 DEFAULT 0,
  comments_count int4 DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_user_id_fkey' AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_engagement ON public.posts USING btree (((views + (upvotes * 2))) DESC);

CREATE INDEX IF NOT EXISTS idx_posts_metadata_gin ON public.posts USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts USING btree (status);

CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts USING btree (post_type);

CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON public.posts USING btree (upvotes DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_posts_views ON public.posts USING btree (views DESC);

CREATE TABLE IF NOT EXISTS public.preemptive_support_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  tenant_id uuid,
  trigger_type varchar NOT NULL,
  trigger_description text NOT NULL,
  action_type varchar NOT NULL,
  action_content text NOT NULL,
  shown_in varchar,
  shown_at timestamptz,
  user_interaction bool DEFAULT false,
  issue_resolved bool DEFAULT false,
  escalated_to_human bool DEFAULT false,
  confidence_score numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'preemptive_support_actions_tenant_id_fkey' AND conrelid = 'public.preemptive_support_actions'::regclass
  ) THEN
    ALTER TABLE public.preemptive_support_actions ADD CONSTRAINT preemptive_support_actions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'preemptive_support_actions_user_id_fkey' AND conrelid = 'public.preemptive_support_actions'::regclass
  ) THEN
    ALTER TABLE public.preemptive_support_actions ADD CONSTRAINT preemptive_support_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_preemptive_support_actions_created_at_desc ON public.preemptive_support_actions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_preemptive_support_actions_tenant_id ON public.preemptive_support_actions USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_preemptive_support_actions_user_id ON public.preemptive_support_actions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_preemptive_support_resolved ON public.preemptive_support_actions USING btree (issue_resolved);

CREATE INDEX IF NOT EXISTS idx_preemptive_support_trigger ON public.preemptive_support_actions USING btree (trigger_type);

ALTER TABLE public.preemptive_support_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_delete ON public.preemptive_support_actions;
CREATE POLICY tenant_delete ON public.preemptive_support_actions
  FOR DELETE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  ;

DROP POLICY IF EXISTS tenant_insert ON public.preemptive_support_actions;
CREATE POLICY tenant_insert ON public.preemptive_support_actions
  FOR INSERT
  
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

DROP POLICY IF EXISTS tenant_select ON public.preemptive_support_actions;
CREATE POLICY tenant_select ON public.preemptive_support_actions
  FOR SELECT
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids)))))
  ;

DROP POLICY IF EXISTS tenant_update ON public.preemptive_support_actions;
CREATE POLICY tenant_update ON public.preemptive_support_actions
  FOR UPDATE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

CREATE TABLE IF NOT EXISTS public.preview_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  page_id uuid NOT NULL,
  token text NOT NULL,
  can_view_unpublished bool NOT NULL DEFAULT true,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'preview_tokens_page_id_fkey' AND conrelid = 'public.preview_tokens'::regclass
  ) THEN
    ALTER TABLE public.preview_tokens ADD CONSTRAINT preview_tokens_page_id_fkey FOREIGN KEY (page_id) REFERENCES cms_pages(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'preview_tokens_tenant_id_fkey' AND conrelid = 'public.preview_tokens'::regclass
  ) THEN
    ALTER TABLE public.preview_tokens ADD CONSTRAINT preview_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'preview_tokens_token_key' AND conrelid = 'public.preview_tokens'::regclass
  ) THEN
    ALTER TABLE public.preview_tokens ADD CONSTRAINT preview_tokens_token_key UNIQUE (token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_preview_tokens_page ON public.preview_tokens USING btree (page_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_preview_tokens_token ON public.preview_tokens USING btree (token);

CREATE UNIQUE INDEX IF NOT EXISTS preview_tokens_token_key ON public.preview_tokens USING btree (token);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now(),
  plan_type varchar DEFAULT 'free'::character varying,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  pre_test_completed bool DEFAULT false,
  pre_test_answers jsonb DEFAULT '{}'::jsonb,
  industry varchar,
  company_name varchar,
  last_email_sent_at timestamptz,
  last_email_type varchar,
  email_preferences jsonb DEFAULT '{"low_activity": true, "monthly_summary": true, "lifecycle_emails": true}'::jsonb,
  user_id uuid NOT NULL,
  avatar_url text,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_fkey' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles USING btree (id);

CREATE INDEX IF NOT EXISTS idx_profiles_last_email ON public.profiles USING btree (last_email_sent_at, last_email_type);

CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles USING btree (plan_type);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end ON public.profiles USING btree (subscription_end_date) WHERE (subscription_end_date IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_profiles_trial_active ON public.profiles USING btree (trial_end_date) WHERE (((plan_type)::text = 'trial'::text) AND (trial_end_date IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON public.profiles USING btree (trial_end_date) WHERE (trial_end_date IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.project_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  project_type varchar NOT NULL,
  snapshot_name varchar,
  snapshot_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_snapshots_created_by_fkey' AND conrelid = 'public.project_snapshots'::regclass
  ) THEN
    ALTER TABLE public.project_snapshots ADD CONSTRAINT project_snapshots_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_snapshots_user_id_fkey' AND conrelid = 'public.project_snapshots'::regclass
  ) THEN
    ALTER TABLE public.project_snapshots ADD CONSTRAINT project_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_snapshots_created_at_desc ON public.project_snapshots USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_snapshots_created_by ON public.project_snapshots USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_project_snapshots_project ON public.project_snapshots USING btree (project_id, project_type);

CREATE INDEX IF NOT EXISTS idx_project_snapshots_user_id ON public.project_snapshots USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.public_content (
  slug text NOT NULL,
  body_md text NOT NULL,
  title text,
  description text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (slug)
);

CREATE INDEX IF NOT EXISTS idx_public_content_slug ON public.public_content USING btree (slug);

CREATE INDEX IF NOT EXISTS idx_public_content_updated_at ON public.public_content USING btree (updated_at DESC);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id int8 NOT NULL,
  tenant_id uuid NOT NULL,
  key text NOT NULL,
  max_per_minute int4 NOT NULL,
  max_per_day int4 NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rate_limits_tenant_id_key_key' AND conrelid = 'public.rate_limits'::regclass
  ) THEN
    ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_tenant_id_key_key UNIQUE (tenant_id, key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at_desc ON public.rate_limits USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_tenant_created_at ON public.rate_limits USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_tenant_id ON public.rate_limits USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_tenant_id_key_key ON public.rate_limits USING btree (tenant_id, key);

CREATE TABLE IF NOT EXISTS public.rate_usage (
  id int8 NOT NULL,
  tenant_id uuid NOT NULL,
  key text NOT NULL,
  ts_minute timestamptz NOT NULL,
  count_minute int4 NOT NULL DEFAULT 0,
  ts_day date NOT NULL,
  count_day int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rate_usage_tenant_id_key_ts_day_key' AND conrelid = 'public.rate_usage'::regclass
  ) THEN
    ALTER TABLE public.rate_usage ADD CONSTRAINT rate_usage_tenant_id_key_ts_day_key UNIQUE (tenant_id, key, ts_day);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rate_usage_tenant_id_key_ts_minute_key' AND conrelid = 'public.rate_usage'::regclass
  ) THEN
    ALTER TABLE public.rate_usage ADD CONSTRAINT rate_usage_tenant_id_key_ts_minute_key UNIQUE (tenant_id, key, ts_minute);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS brin_rate_usage_ts_day ON public.rate_usage USING brin (ts_day) WITH (autosummarize='on');

CREATE INDEX IF NOT EXISTS idx_rate_usage_created_at_desc ON public.rate_usage USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_usage_tenant_created_at ON public.rate_usage USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_usage_tenant_day ON public.rate_usage USING btree (tenant_id, ts_day DESC);

CREATE INDEX IF NOT EXISTS idx_rate_usage_tenant_id ON public.rate_usage USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_rate_usage_tenant_key ON public.rate_usage USING btree (tenant_id, key);

CREATE INDEX IF NOT EXISTS idx_rate_usage_tenant_key_time ON public.rate_usage USING btree (tenant_id, key, ts_minute, ts_day);

CREATE UNIQUE INDEX IF NOT EXISTS rate_usage_tenant_id_key_ts_day_key ON public.rate_usage USING btree (tenant_id, key, ts_day);

CREATE UNIQUE INDEX IF NOT EXISTS rate_usage_tenant_id_key_ts_minute_key ON public.rate_usage USING btree (tenant_id, key, ts_minute);

CREATE TABLE IF NOT EXISTS public.reality_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category varchar NOT NULL,
  event_name varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'info'::character varying,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_reality_events_category ON public.reality_events USING btree (category);

CREATE INDEX IF NOT EXISTS idx_reality_events_category_severity ON public.reality_events USING btree (category, severity);

CREATE INDEX IF NOT EXISTS idx_reality_events_created_at ON public.reality_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reality_events_event_name ON public.reality_events USING btree (event_name);

CREATE INDEX IF NOT EXISTS idx_reality_events_severity ON public.reality_events USING btree (severity);

CREATE TABLE IF NOT EXISTS public.reality_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category varchar NOT NULL,
  name varchar NOT NULL,
  value jsonb NOT NULL,
  status varchar NOT NULL DEFAULT 'assumed'::character varying,
  source varchar NOT NULL,
  last_updated timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reality_metrics_category_name_key' AND conrelid = 'public.reality_metrics'::regclass
  ) THEN
    ALTER TABLE public.reality_metrics ADD CONSTRAINT reality_metrics_category_name_key UNIQUE (category, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reality_metrics_category ON public.reality_metrics USING btree (category);

CREATE INDEX IF NOT EXISTS idx_reality_metrics_category_status ON public.reality_metrics USING btree (category, status);

CREATE INDEX IF NOT EXISTS idx_reality_metrics_last_updated ON public.reality_metrics USING btree (last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_reality_metrics_name ON public.reality_metrics USING btree (name);

CREATE INDEX IF NOT EXISTS idx_reality_metrics_status ON public.reality_metrics USING btree (status);

CREATE UNIQUE INDEX IF NOT EXISTS reality_metrics_category_name_key ON public.reality_metrics USING btree (category, name);

CREATE TABLE IF NOT EXISTS public.receipt_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  receipt_id uuid,
  event varchar NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  error text,
  retry_count int4 DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_audit_logs_receipt_id_fkey' AND conrelid = 'public.receipt_audit_logs'::regclass
  ) THEN
    ALTER TABLE public.receipt_audit_logs ADD CONSTRAINT receipt_audit_logs_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_audit_logs_created_at ON public.receipt_audit_logs USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_receipt_audit_logs_created_at_desc ON public.receipt_audit_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_audit_logs_created_by ON public.receipt_audit_logs USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_receipt_audit_logs_org_id ON public.receipt_audit_logs USING btree (org_id);

CREATE INDEX IF NOT EXISTS idx_receipt_audit_logs_receipt_id ON public.receipt_audit_logs USING btree (receipt_id);

CREATE TABLE IF NOT EXISTS public.receipt_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  source varchar,
  ocr_provider varchar,
  parser_version varchar,
  raw_text text,
  structured jsonb DEFAULT '{}'::jsonb,
  confidence numeric,
  status varchar DEFAULT 'processed'::character varying,
  error text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_conversions_receipt_id_fkey' AND conrelid = 'public.receipt_conversions'::regclass
  ) THEN
    ALTER TABLE public.receipt_conversions ADD CONSTRAINT receipt_conversions_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_conversions_created_at ON public.receipt_conversions USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_receipt_conversions_created_at_desc ON public.receipt_conversions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_conversions_created_by ON public.receipt_conversions USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_receipt_conversions_org_id ON public.receipt_conversions USING btree (org_id);

CREATE INDEX IF NOT EXISTS idx_receipt_conversions_receipt_id ON public.receipt_conversions USING btree (receipt_id);

CREATE TABLE IF NOT EXISTS public.receipt_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  api_key_id uuid,
  type receipt_event_type NOT NULL,
  receipt_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_events_api_key_id_fkey' AND conrelid = 'public.receipt_events'::regclass
  ) THEN
    ALTER TABLE public.receipt_events ADD CONSTRAINT receipt_events_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES api_keys(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_events_receipt_id_fkey' AND conrelid = 'public.receipt_events'::regclass
  ) THEN
    ALTER TABLE public.receipt_events ADD CONSTRAINT receipt_events_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES receipts(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_events_tenant_id_fkey' AND conrelid = 'public.receipt_events'::regclass
  ) THEN
    ALTER TABLE public.receipt_events ADD CONSTRAINT receipt_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_events_api_key_id ON public.receipt_events USING btree (api_key_id);

CREATE INDEX IF NOT EXISTS idx_receipt_events_created_at_desc ON public.receipt_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_events_keys ON public.receipt_events USING btree (tenant_id, receipt_id);

CREATE INDEX IF NOT EXISTS idx_receipt_events_receipt_id ON public.receipt_events USING btree (receipt_id);

CREATE INDEX IF NOT EXISTS idx_receipt_events_tenant_id ON public.receipt_events USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.receipt_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  description text,
  quantity numeric,
  unit_amount numeric,
  amount numeric,
  currency varchar,
  metadata jsonb DEFAULT '{}'::jsonb,
  org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  category varchar,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_receipt_items_tenant' AND conrelid = 'public.receipt_items'::regclass
  ) THEN
    ALTER TABLE public.receipt_items ADD CONSTRAINT fk_receipt_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_items_receipt_id_fkey' AND conrelid = 'public.receipt_items'::regclass
  ) THEN
    ALTER TABLE public.receipt_items ADD CONSTRAINT receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_items_tenant_id_fkey' AND conrelid = 'public.receipt_items'::regclass
  ) THEN
    ALTER TABLE public.receipt_items ADD CONSTRAINT receipt_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON public.receipt_items USING btree (category);

CREATE INDEX IF NOT EXISTS idx_receipt_items_created_at ON public.receipt_items USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_receipt_items_created_at_desc ON public.receipt_items USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_items_created_by ON public.receipt_items USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_receipt_items_org_id ON public.receipt_items USING btree (org_id);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON public.receipt_items USING btree (receipt_id);

CREATE INDEX IF NOT EXISTS idx_receipt_items_tenant_created_at ON public.receipt_items USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_items_tenant_id ON public.receipt_items USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_receipt_items_tenant_receipt ON public.receipt_items USING btree (tenant_id, receipt_id);

CREATE TABLE IF NOT EXISTS public.receipt_items_extracted (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL,
  name varchar NOT NULL,
  quantity numeric,
  unit_price numeric,
  line_total numeric,
  category varchar,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_items_extracted_receipt_id_fkey' AND conrelid = 'public.receipt_items_extracted'::regclass
  ) THEN
    ALTER TABLE public.receipt_items_extracted ADD CONSTRAINT receipt_items_extracted_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES receipts_extracted(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_items_extracted_category ON public.receipt_items_extracted USING btree (category);

CREATE INDEX IF NOT EXISTS idx_receipt_items_extracted_created_at_desc ON public.receipt_items_extracted USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_items_extracted_receipt ON public.receipt_items_extracted USING btree (receipt_id);

CREATE TABLE IF NOT EXISTS public.receipt_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  conversion_id uuid,
  rating numeric,
  feedback text,
  confidence numeric,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_ratings_conversion_id_fkey' AND conrelid = 'public.receipt_ratings'::regclass
  ) THEN
    ALTER TABLE public.receipt_ratings ADD CONSTRAINT receipt_ratings_conversion_id_fkey FOREIGN KEY (conversion_id) REFERENCES receipt_conversions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_ratings_receipt_id_fkey' AND conrelid = 'public.receipt_ratings'::regclass
  ) THEN
    ALTER TABLE public.receipt_ratings ADD CONSTRAINT receipt_ratings_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_ratings_conversion_id ON public.receipt_ratings USING btree (conversion_id);

CREATE INDEX IF NOT EXISTS idx_receipt_ratings_created_at ON public.receipt_ratings USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_receipt_ratings_created_at_desc ON public.receipt_ratings USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_ratings_created_by ON public.receipt_ratings USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_receipt_ratings_org_id ON public.receipt_ratings USING btree (org_id);

CREATE INDEX IF NOT EXISTS idx_receipt_ratings_receipt_id ON public.receipt_ratings USING btree (receipt_id);

CREATE TABLE IF NOT EXISTS public.receipt_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  api_key_id uuid,
  billing_account_id uuid,
  storage_location text NOT NULL,
  original_filename varchar NOT NULL,
  mime_type varchar NOT NULL,
  size_bytes int4 NOT NULL,
  status receipt_upload_status NOT NULL DEFAULT 'pending'::receipt_upload_status,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_uploads_api_key_id_fkey' AND conrelid = 'public.receipt_uploads'::regclass
  ) THEN
    ALTER TABLE public.receipt_uploads ADD CONSTRAINT receipt_uploads_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_uploads_billing_account_id_fkey' AND conrelid = 'public.receipt_uploads'::regclass
  ) THEN
    ALTER TABLE public.receipt_uploads ADD CONSTRAINT receipt_uploads_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_api_key_id ON public.receipt_uploads USING btree (api_key_id);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_ba_created_at ON public.receipt_uploads USING btree (billing_account_id, created_at);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_ba_id ON public.receipt_uploads USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_created_at ON public.receipt_uploads USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_created_at_desc ON public.receipt_uploads USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_fk ON public.receipt_uploads USING btree (api_key_id, billing_account_id);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_status ON public.receipt_uploads USING btree (status);

CREATE TABLE IF NOT EXISTS public.receipt_webhook_outbox (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  webhook_id uuid NOT NULL,
  event_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  attempts int4 NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_webhook_outbox_event_id_fkey' AND conrelid = 'public.receipt_webhook_outbox'::regclass
  ) THEN
    ALTER TABLE public.receipt_webhook_outbox ADD CONSTRAINT receipt_webhook_outbox_event_id_fkey FOREIGN KEY (event_id) REFERENCES receipt_events(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_webhook_outbox_tenant_id_fkey' AND conrelid = 'public.receipt_webhook_outbox'::regclass
  ) THEN
    ALTER TABLE public.receipt_webhook_outbox ADD CONSTRAINT receipt_webhook_outbox_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_webhook_outbox_webhook_id_fkey' AND conrelid = 'public.receipt_webhook_outbox'::regclass
  ) THEN
    ALTER TABLE public.receipt_webhook_outbox ADD CONSTRAINT receipt_webhook_outbox_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES receipt_webhooks(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_webhook_outbox_created_at_desc ON public.receipt_webhook_outbox USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_webhook_outbox_event_id ON public.receipt_webhook_outbox USING btree (event_id);

CREATE INDEX IF NOT EXISTS idx_receipt_webhook_outbox_keys ON public.receipt_webhook_outbox USING btree (tenant_id, webhook_id, event_id);

CREATE INDEX IF NOT EXISTS idx_receipt_webhook_outbox_status_next ON public.receipt_webhook_outbox USING btree (status, next_retry_at);

CREATE INDEX IF NOT EXISTS idx_receipt_webhook_outbox_tenant_id ON public.receipt_webhook_outbox USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_receipt_webhook_outbox_webhook_id ON public.receipt_webhook_outbox USING btree (webhook_id);

CREATE TABLE IF NOT EXISTS public.receipt_webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  events _text NOT NULL DEFAULT ARRAY['receipt.created'::text, 'receipt.processed'::text, 'receipt.failed'::text],
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_webhooks_tenant_id_fkey' AND conrelid = 'public.receipt_webhooks'::regclass
  ) THEN
    ALTER TABLE public.receipt_webhooks ADD CONSTRAINT receipt_webhooks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_webhooks_created_at_desc ON public.receipt_webhooks USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_webhooks_tenant_id ON public.receipt_webhooks USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_id uuid,
  external_id text,
  issued_at timestamptz DEFAULT now(),
  currency varchar,
  total_amount numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  upload_id uuid,
  vendor varchar,
  date timestamptz,
  subtotal numeric,
  tax numeric,
  total numeric,
  payment_method varchar,
  confidence_score numeric,
  raw_text text,
  source_id varchar,
  canonical_json jsonb NOT NULL,
  hash varchar NOT NULL,
  prev_hash varchar,
  evidence_refs jsonb DEFAULT '[]'::jsonb,
  summary text NOT NULL,
  why_it_matters text NOT NULL,
  next_steps text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_receipts_tenant' AND conrelid = 'public.receipts'::regclass
  ) THEN
    ALTER TABLE public.receipts ADD CONSTRAINT fk_receipts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipts_tenant_id_fkey' AND conrelid = 'public.receipts'::regclass
  ) THEN
    ALTER TABLE public.receipts ADD CONSTRAINT receipts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipts_upload_id_fkey' AND conrelid = 'public.receipts'::regclass
  ) THEN
    ALTER TABLE public.receipts ADD CONSTRAINT receipts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipts_canonical_json_gin ON public.receipts USING gin (canonical_json);

CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON public.receipts USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_receipts_created_at_desc ON public.receipts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipts_created_by ON public.receipts USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.receipts USING btree (date);

CREATE INDEX IF NOT EXISTS idx_receipts_evidence_refs_gin ON public.receipts USING gin (evidence_refs);

CREATE INDEX IF NOT EXISTS idx_receipts_hash ON public.receipts USING btree (hash);

CREATE INDEX IF NOT EXISTS idx_receipts_job_created_desc ON public.receipts USING btree (job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipts_job_id ON public.receipts USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_receipts_org_id ON public.receipts USING btree (org_id);

CREATE INDEX IF NOT EXISTS idx_receipts_prev_hash ON public.receipts USING btree (prev_hash);

CREATE INDEX IF NOT EXISTS idx_receipts_source_id ON public.receipts USING btree (source_id);

CREATE INDEX IF NOT EXISTS idx_receipts_tenant_created_at ON public.receipts USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipts_tenant_created_by ON public.receipts USING btree (tenant_id, created_by);

CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON public.receipts USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_receipts_tenant_job_upload ON public.receipts USING btree (tenant_id, job_id, upload_id);

CREATE INDEX IF NOT EXISTS idx_receipts_upload_created ON public.receipts USING btree (upload_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipts_upload_id ON public.receipts USING btree (upload_id);

CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON public.receipts USING btree (vendor);

CREATE UNIQUE INDEX IF NOT EXISTS ux_receipts_external_tenant ON public.receipts USING btree (tenant_id, external_id) WHERE (external_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.receipts_extracted (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL,
  vendor varchar,
  date timestamptz,
  currency varchar,
  subtotal numeric,
  tax numeric,
  total numeric,
  payment_method varchar,
  confidence_score numeric,
  raw_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL,
  embedding vector,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_receipts_extracted_tenant' AND conrelid = 'public.receipts_extracted'::regclass
  ) THEN
    ALTER TABLE public.receipts_extracted ADD CONSTRAINT fk_receipts_extracted_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipts_extracted_tenant_id_fkey' AND conrelid = 'public.receipts_extracted'::regclass
  ) THEN
    ALTER TABLE public.receipts_extracted ADD CONSTRAINT receipts_extracted_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipts_extracted_upload_id_fkey' AND conrelid = 'public.receipts_extracted'::regclass
  ) THEN
    ALTER TABLE public.receipts_extracted ADD CONSTRAINT receipts_extracted_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES receipt_uploads(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipts_extracted_upload_id_key' AND conrelid = 'public.receipts_extracted'::regclass
  ) THEN
    ALTER TABLE public.receipts_extracted ADD CONSTRAINT receipts_extracted_upload_id_key UNIQUE (upload_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS brin_receipts_extracted_created_at ON public.receipts_extracted USING brin (created_at) WITH (autosummarize='on');

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_created_at ON public.receipts_extracted USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_created_at_desc ON public.receipts_extracted USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_date ON public.receipts_extracted USING btree (date);

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_embedding_hnsw ON public.receipts_extracted USING hnsw (embedding vector_l2_ops);

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_id_tenant ON public.receipts_extracted USING btree (id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_tenant_created_at ON public.receipts_extracted USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_tenant_id ON public.receipts_extracted USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_upload ON public.receipts_extracted USING btree (upload_id);

CREATE INDEX IF NOT EXISTS idx_receipts_extracted_vendor ON public.receipts_extracted USING btree (vendor);

CREATE UNIQUE INDEX IF NOT EXISTS receipts_extracted_upload_id_key ON public.receipts_extracted USING btree (upload_id);

CREATE TABLE IF NOT EXISTS public.recon_audits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recon_job_id uuid,
  recon_result_id uuid,
  tenant_id uuid NOT NULL,
  user_id uuid,
  audit_type varchar NOT NULL,
  action varchar NOT NULL,
  entity_type varchar,
  entity_id uuid,
  changes jsonb,
  before_state jsonb,
  after_state jsonb,
  ip_address varchar,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_audits_recon_job_id_fkey' AND conrelid = 'public.recon_audits'::regclass
  ) THEN
    ALTER TABLE public.recon_audits ADD CONSTRAINT recon_audits_recon_job_id_fkey FOREIGN KEY (recon_job_id) REFERENCES recon_jobs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_audits_recon_result_id_fkey' AND conrelid = 'public.recon_audits'::regclass
  ) THEN
    ALTER TABLE public.recon_audits ADD CONSTRAINT recon_audits_recon_result_id_fkey FOREIGN KEY (recon_result_id) REFERENCES recon_results(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_audits_tenant_id_fkey' AND conrelid = 'public.recon_audits'::regclass
  ) THEN
    ALTER TABLE public.recon_audits ADD CONSTRAINT recon_audits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_audits_user_id_fkey' AND conrelid = 'public.recon_audits'::regclass
  ) THEN
    ALTER TABLE public.recon_audits ADD CONSTRAINT recon_audits_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recon_audits_audit_type ON public.recon_audits USING btree (audit_type);

CREATE INDEX IF NOT EXISTS idx_recon_audits_created_at ON public.recon_audits USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_audits_metadata_gin ON public.recon_audits USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_recon_audits_recon_job_id ON public.recon_audits USING btree (recon_job_id);

CREATE INDEX IF NOT EXISTS idx_recon_audits_recon_result_id ON public.recon_audits USING btree (recon_result_id);

CREATE INDEX IF NOT EXISTS idx_recon_audits_tenant_created ON public.recon_audits USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_audits_tenant_id ON public.recon_audits USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_recon_audits_user_id ON public.recon_audits USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.recon_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name varchar NOT NULL,
  description text,
  template_id uuid,
  source_adapter varchar NOT NULL,
  source_config_encrypted text NOT NULL,
  target_adapter varchar NOT NULL,
  target_config_encrypted text NOT NULL,
  mapping_template_id uuid,
  transform_recipe_id uuid,
  validation_rules jsonb DEFAULT '[]'::jsonb,
  recon_strategy varchar NOT NULL DEFAULT 'deterministic'::character varying,
  schedule_cron varchar,
  schedule_timezone varchar DEFAULT 'UTC'::character varying,
  status varchar NOT NULL DEFAULT 'active'::character varying,
  version int4 DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_recon_jobs_mapping_template_id' AND conrelid = 'public.recon_jobs'::regclass
  ) THEN
    ALTER TABLE public.recon_jobs ADD CONSTRAINT fk_recon_jobs_mapping_template_id FOREIGN KEY (mapping_template_id) REFERENCES mapping_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_recon_jobs_template_id' AND conrelid = 'public.recon_jobs'::regclass
  ) THEN
    ALTER TABLE public.recon_jobs ADD CONSTRAINT fk_recon_jobs_template_id FOREIGN KEY (template_id) REFERENCES recon_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_recon_jobs_transform_recipe_id' AND conrelid = 'public.recon_jobs'::regclass
  ) THEN
    ALTER TABLE public.recon_jobs ADD CONSTRAINT fk_recon_jobs_transform_recipe_id FOREIGN KEY (transform_recipe_id) REFERENCES transform_recipes(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_jobs_tenant_id_fkey' AND conrelid = 'public.recon_jobs'::regclass
  ) THEN
    ALTER TABLE public.recon_jobs ADD CONSTRAINT recon_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_jobs_user_id_fkey' AND conrelid = 'public.recon_jobs'::regclass
  ) THEN
    ALTER TABLE public.recon_jobs ADD CONSTRAINT recon_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recon_jobs_active ON public.recon_jobs USING btree (tenant_id) WHERE (((status)::text = 'active'::text) AND (deleted_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_recon_jobs_created_at_desc ON public.recon_jobs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_deleted_at_null ON public.recon_jobs USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_mapping_template_id ON public.recon_jobs USING btree (mapping_template_id);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_metadata_gin ON public.recon_jobs USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_schedule ON public.recon_jobs USING btree (tenant_id, schedule_cron) WHERE ((schedule_cron IS NOT NULL) AND ((status)::text = 'active'::text));

CREATE INDEX IF NOT EXISTS idx_recon_jobs_status ON public.recon_jobs USING btree (status);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_template_id ON public.recon_jobs USING btree (template_id);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_tenant_id ON public.recon_jobs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_tenant_user ON public.recon_jobs USING btree (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_transform_recipe_id ON public.recon_jobs USING btree (transform_recipe_id);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_user_id ON public.recon_jobs USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.recon_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recon_job_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  execution_id uuid,
  status varchar NOT NULL DEFAULT 'running'::character varying,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  source_count int4 DEFAULT 0,
  target_count int4 DEFAULT 0,
  matched_count int4 DEFAULT 0,
  unmatched_source_count int4 DEFAULT 0,
  unmatched_target_count int4 DEFAULT 0,
  conflict_count int4 DEFAULT 0,
  total_amount_source numeric,
  total_amount_target numeric,
  total_amount_matched numeric,
  total_amount_unmatched numeric,
  currency varchar,
  confidence_avg numeric,
  confidence_min numeric,
  confidence_max numeric,
  duration_ms int8,
  error_message text,
  error_stack text,
  summary jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_results_execution_id_fkey' AND conrelid = 'public.recon_results'::regclass
  ) THEN
    ALTER TABLE public.recon_results ADD CONSTRAINT recon_results_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_results_recon_job_id_fkey' AND conrelid = 'public.recon_results'::regclass
  ) THEN
    ALTER TABLE public.recon_results ADD CONSTRAINT recon_results_recon_job_id_fkey FOREIGN KEY (recon_job_id) REFERENCES recon_jobs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_results_tenant_id_fkey' AND conrelid = 'public.recon_results'::regclass
  ) THEN
    ALTER TABLE public.recon_results ADD CONSTRAINT recon_results_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recon_results_created_at_desc ON public.recon_results USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_results_execution_id ON public.recon_results USING btree (execution_id);

CREATE INDEX IF NOT EXISTS idx_recon_results_metadata_gin ON public.recon_results USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_recon_results_recon_job_id ON public.recon_results USING btree (recon_job_id);

CREATE INDEX IF NOT EXISTS idx_recon_results_started_at ON public.recon_results USING btree (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_results_status ON public.recon_results USING btree (status);

CREATE INDEX IF NOT EXISTS idx_recon_results_summary_gin ON public.recon_results USING gin (summary);

CREATE INDEX IF NOT EXISTS idx_recon_results_tenant_id ON public.recon_results USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_recon_results_tenant_job_started ON public.recon_results USING btree (tenant_id, recon_job_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.recon_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'created'::text,
  idempotency_key text,
  input_manifest jsonb DEFAULT '{}'::jsonb,
  result_summary jsonb DEFAULT '{}'::jsonb,
  error jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ingestion_id uuid,
  name text,
  source_count int4 DEFAULT 0,
  target_count int4 DEFAULT 0,
  matched_count int4 DEFAULT 0,
  unmatched_source_count int4 DEFAULT 0,
  unmatched_target_count int4 DEFAULT 0,
  confidence_avg numeric,
  error_message text,
  trace_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_runs_idempotency_unique' AND conrelid = 'public.recon_runs'::regclass
  ) THEN
    ALTER TABLE public.recon_runs ADD CONSTRAINT recon_runs_idempotency_unique UNIQUE (workspace_id, idempotency_key) DEFERRABLE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recon_runs_created_at ON public.recon_runs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_runs_created_by ON public.recon_runs USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_recon_runs_idempotency_key ON public.recon_runs USING btree (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_recon_runs_started_at ON public.recon_runs USING btree (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_runs_status ON public.recon_runs USING btree (status);

CREATE INDEX IF NOT EXISTS idx_recon_runs_workspace_id ON public.recon_runs USING btree (workspace_id);

CREATE UNIQUE INDEX IF NOT EXISTS recon_runs_idempotency_unique ON public.recon_runs USING btree (workspace_id, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS recon_runs_idempotency_unique_idx ON public.recon_runs USING btree (workspace_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.recon_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  version int4 NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_public bool DEFAULT false,
  is_system bool DEFAULT false,
  usage_count int4 DEFAULT 0,
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_templates_tenant_id_fkey' AND conrelid = 'public.recon_templates'::regclass
  ) THEN
    ALTER TABLE public.recon_templates ADD CONSTRAINT recon_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recon_templates_tenant_id_name_version_key' AND conrelid = 'public.recon_templates'::regclass
  ) THEN
    ALTER TABLE public.recon_templates ADD CONSTRAINT recon_templates_tenant_id_name_version_key UNIQUE (tenant_id, name, version);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recon_templates_created_at_desc ON public.recon_templates USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_templates_deleted_at_null ON public.recon_templates USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_recon_templates_public_simple ON public.recon_templates USING btree (is_public) WHERE (is_public = true);

CREATE INDEX IF NOT EXISTS idx_recon_templates_tenant_created_at ON public.recon_templates USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_templates_tenant_id ON public.recon_templates USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS recon_templates_tenant_id_name_version_key ON public.recon_templates USING btree (tenant_id, name, version);

CREATE TABLE IF NOT EXISTS public.recon_templates_full (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  template jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  embedding vector,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_recon_templates_embedding_hnsw ON public.recon_templates_full USING hnsw (embedding vector_l2_ops);

CREATE INDEX IF NOT EXISTS idx_recon_templates_full_created_at_desc ON public.recon_templates_full USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_templates_full_tenant_created_at ON public.recon_templates_full USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recon_templates_full_tenant_id ON public.recon_templates_full USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.reconciliation_candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_id uuid,
  execution_id uuid,
  edge_node_id uuid,
  source_id varchar NOT NULL,
  target_id varchar NOT NULL,
  confidence_score numeric NOT NULL,
  match_algorithm varchar,
  model_version_id uuid,
  score_matrix jsonb,
  features jsonb,
  is_accepted bool DEFAULT false,
  accepted_at timestamptz,
  accepted_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_candidates_accepted_by_fkey' AND conrelid = 'public.reconciliation_candidates'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_candidates ADD CONSTRAINT reconciliation_candidates_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_candidates_edge_node_id_fkey' AND conrelid = 'public.reconciliation_candidates'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_candidates ADD CONSTRAINT reconciliation_candidates_edge_node_id_fkey FOREIGN KEY (edge_node_id) REFERENCES edge_nodes(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_candidates_execution_id_fkey' AND conrelid = 'public.reconciliation_candidates'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_candidates ADD CONSTRAINT reconciliation_candidates_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_candidates_model_version_id_fkey' AND conrelid = 'public.reconciliation_candidates'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_candidates ADD CONSTRAINT reconciliation_candidates_model_version_id_fkey FOREIGN KEY (model_version_id) REFERENCES model_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_candidates_tenant_id_fkey' AND conrelid = 'public.reconciliation_candidates'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_candidates ADD CONSTRAINT reconciliation_candidates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_accepted ON public.reconciliation_candidates USING btree (is_accepted);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_accepted_by ON public.reconciliation_candidates USING btree (accepted_by);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_confidence ON public.reconciliation_candidates USING btree (confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_created_at_desc ON public.reconciliation_candidates USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_edge_node_id ON public.reconciliation_candidates USING btree (edge_node_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_execution_id ON public.reconciliation_candidates USING btree (execution_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_features_gin ON public.reconciliation_candidates USING gin (features);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_job_id ON public.reconciliation_candidates USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_model_version_id ON public.reconciliation_candidates USING btree (model_version_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_score_matrix_gin ON public.reconciliation_candidates USING gin (score_matrix);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_source_target ON public.reconciliation_candidates USING btree (source_id, target_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_tenant_confidence ON public.reconciliation_candidates USING btree (tenant_id, confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_tenant_id ON public.reconciliation_candidates USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.reconciliation_graph_edges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_node_id uuid NOT NULL,
  target_node_id uuid NOT NULL,
  edge_type varchar NOT NULL,
  confidence numeric NOT NULL DEFAULT 1.0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_reconciliation_graph_edges_tenant' AND conrelid = 'public.reconciliation_graph_edges'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_graph_edges ADD CONSTRAINT fk_reconciliation_graph_edges_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_graph_edges_source_node_id_fkey' AND conrelid = 'public.reconciliation_graph_edges'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_graph_edges ADD CONSTRAINT reconciliation_graph_edges_source_node_id_fkey FOREIGN KEY (source_node_id) REFERENCES reconciliation_graph_nodes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_graph_edges_target_node_id_fkey' AND conrelid = 'public.reconciliation_graph_edges'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_graph_edges ADD CONSTRAINT reconciliation_graph_edges_target_node_id_fkey FOREIGN KEY (target_node_id) REFERENCES reconciliation_graph_nodes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_graph_edges_tenant_id_fkey' AND conrelid = 'public.reconciliation_graph_edges'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_graph_edges ADD CONSTRAINT reconciliation_graph_edges_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_graph_edges_confidence ON public.reconciliation_graph_edges USING btree (confidence);

CREATE INDEX IF NOT EXISTS idx_graph_edges_metadata_gin ON public.reconciliation_graph_edges USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON public.reconciliation_graph_edges USING btree (source_node_id);

CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON public.reconciliation_graph_edges USING btree (edge_type);

CREATE INDEX IF NOT EXISTS idx_recon_edges_target ON public.reconciliation_graph_edges USING btree (target_node_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_graph_edges_created_at_desc ON public.reconciliation_graph_edges USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_graph_edges_tenant_created_at ON public.reconciliation_graph_edges USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_graph_edges_tenant_id ON public.reconciliation_graph_edges USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_rg_edges_source_target ON public.reconciliation_graph_edges USING btree (source_node_id, target_node_id);

CREATE TABLE IF NOT EXISTS public.reconciliation_graph_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  node_type varchar NOT NULL,
  source_id varchar,
  target_id varchar,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  amount numeric,
  currency varchar,
  timestamp timestamptz NOT NULL DEFAULT now(),
  confidence numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_reconciliation_graph_nodes_tenant' AND conrelid = 'public.reconciliation_graph_nodes'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_graph_nodes ADD CONSTRAINT fk_reconciliation_graph_nodes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reconciliation_graph_nodes_tenant_id_fkey' AND conrelid = 'public.reconciliation_graph_nodes'::regclass
  ) THEN
    ALTER TABLE public.reconciliation_graph_nodes ADD CONSTRAINT reconciliation_graph_nodes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_graph_nodes_data_gin ON public.reconciliation_graph_nodes USING gin (data);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_job_type ON public.reconciliation_graph_nodes USING btree (job_id, node_type);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_metadata_gin ON public.reconciliation_graph_nodes USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_source_id ON public.reconciliation_graph_nodes USING btree (source_id);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_target_id ON public.reconciliation_graph_nodes USING btree (target_id);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_timestamp ON public.reconciliation_graph_nodes USING btree ("timestamp");

CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON public.reconciliation_graph_nodes USING btree (node_type);

CREATE INDEX IF NOT EXISTS idx_reconciliation_graph_nodes_created_at_desc ON public.reconciliation_graph_nodes USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_graph_nodes_job_id ON public.reconciliation_graph_nodes USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_graph_nodes_tenant_created_at ON public.reconciliation_graph_nodes USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_graph_nodes_tenant_id ON public.reconciliation_graph_nodes USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid,
  referral_code varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'pending'::character varying,
  reward_amount numeric,
  reward_currency varchar DEFAULT 'USD'::character varying,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referred_user_id_fkey' AND conrelid = 'public.referrals'::regclass
  ) THEN
    ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referrer_user_id_fkey' AND conrelid = 'public.referrals'::regclass
  ) THEN
    ALTER TABLE public.referrals ADD CONSTRAINT referrals_referrer_user_id_fkey FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referral_code_key' AND conrelid = 'public.referrals'::regclass
  ) THEN
    ALTER TABLE public.referrals ADD CONSTRAINT referrals_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals USING btree (referral_code);

CREATE INDEX IF NOT EXISTS idx_referrals_created_at_desc ON public.referrals USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals USING btree (referred_user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals USING btree (referrer_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS referrals_referral_code_key ON public.referrals USING btree (referral_code);

CREATE TABLE IF NOT EXISTS public.release_safety_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  release_id varchar,
  check_type varchar NOT NULL,
  status varchar NOT NULL,
  checks jsonb DEFAULT '[]'::jsonb,
  blocks_deployment bool DEFAULT false,
  risk_summary text,
  risk_level varchar,
  recommend_rollback bool DEFAULT false,
  rollback_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_release_safety_blocks ON public.release_safety_checks USING btree (blocks_deployment) WHERE (blocks_deployment = true);

CREATE INDEX IF NOT EXISTS idx_release_safety_checks_created_at_desc ON public.release_safety_checks USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_release_safety_release ON public.release_safety_checks USING btree (release_id);

CREATE INDEX IF NOT EXISTS idx_release_safety_status ON public.release_safety_checks USING btree (status);

ALTER TABLE public.release_safety_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS release_safety_checks_select_service_role_only ON public.release_safety_checks;
CREATE POLICY release_safety_checks_select_service_role_only ON public.release_safety_checks
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  execution_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  date_range_start timestamptz,
  date_range_end timestamptz,
  summary jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_reports_tenant' AND conrelid = 'public.reports'::regclass
  ) THEN
    ALTER TABLE public.reports ADD CONSTRAINT fk_reports_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_execution_id_fkey' AND conrelid = 'public.reports'::regclass
  ) THEN
    ALTER TABLE public.reports ADD CONSTRAINT reports_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_tenant_id_fkey' AND conrelid = 'public.reports'::regclass
  ) THEN
    ALTER TABLE public.reports ADD CONSTRAINT reports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reports_created_at_desc ON public.reports USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_execution ON public.reports USING btree (execution_id);

CREATE INDEX IF NOT EXISTS idx_reports_job ON public.reports USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_reports_tenant_created_at ON public.reports USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_tenant_id ON public.reports USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.retention_policies (
  key text NOT NULL,
  days int4 NOT NULL,
  PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS public.revoked_tokens (
  jti varchar NOT NULL,
  revoked_at timestamptz DEFAULT now(),
  reason text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (jti)
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_created_at_desc ON public.revoked_tokens USING btree (created_at DESC);

CREATE TABLE IF NOT EXISTS public.run_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  run_id uuid NOT NULL,
  type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'run_events_run_id_fkey' AND conrelid = 'public.run_events'::regclass
  ) THEN
    ALTER TABLE public.run_events ADD CONSTRAINT run_events_run_id_fkey FOREIGN KEY (run_id) REFERENCES recon_runs(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_run_events_created_at ON public.run_events USING btree (workspace_id, run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_run_events_run_id ON public.run_events USING btree (run_id);

CREATE INDEX IF NOT EXISTS idx_run_events_type ON public.run_events USING btree (type);

CREATE INDEX IF NOT EXISTS idx_run_events_workspace_id ON public.run_events USING btree (workspace_id);

CREATE TABLE IF NOT EXISTS public.sdk_downloads (
  id text NOT NULL,
  package_name text NOT NULL,
  version text NOT NULL,
  package_manager text NOT NULL,
  user_id uuid,
  session_id text,
  user_agent text,
  referrer text,
  ip_address text,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_sdk_downloads_created_at_desc ON public.sdk_downloads USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sdk_downloads_user_id ON public.sdk_downloads USING btree (user_id);

CREATE INDEX IF NOT EXISTS sdk_downloads_package_name_idx ON public.sdk_downloads USING btree (package_name);

CREATE INDEX IF NOT EXISTS sdk_downloads_timestamp_idx ON public.sdk_downloads USING btree ("timestamp");

ALTER TABLE public.sdk_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_delete ON public.sdk_downloads;
CREATE POLICY user_delete ON public.sdk_downloads
  FOR DELETE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_insert ON public.sdk_downloads;
CREATE POLICY user_insert ON public.sdk_downloads
  FOR INSERT
  
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS user_select ON public.sdk_downloads;
CREATE POLICY user_select ON public.sdk_downloads
  FOR SELECT
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_update ON public.sdk_downloads;
CREATE POLICY user_update ON public.sdk_downloads
  FOR UPDATE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type varchar NOT NULL,
  severity varchar NOT NULL,
  tenant_id uuid NOT NULL,
  user_id uuid,
  api_key_id uuid,
  ip varchar,
  user_agent text,
  details jsonb,
  resolved bool DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_security_events_tenant' AND conrelid = 'public.security_events'::regclass
  ) THEN
    ALTER TABLE public.security_events ADD CONSTRAINT fk_security_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_events_api_key_id_fkey' AND conrelid = 'public.security_events'::regclass
  ) THEN
    ALTER TABLE public.security_events ADD CONSTRAINT security_events_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_events_resolved_by_fkey' AND conrelid = 'public.security_events'::regclass
  ) THEN
    ALTER TABLE public.security_events ADD CONSTRAINT security_events_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_events_tenant_id_fkey' AND conrelid = 'public.security_events'::regclass
  ) THEN
    ALTER TABLE public.security_events ADD CONSTRAINT security_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_events_user_id_fkey' AND conrelid = 'public.security_events'::regclass
  ) THEN
    ALTER TABLE public.security_events ADD CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_security_events_api_key_id ON public.security_events USING btree (api_key_id);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at_desc ON public.security_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_resolved_by ON public.security_events USING btree (resolved_by);

CREATE INDEX IF NOT EXISTS idx_security_events_tenant_created_at ON public.security_events USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_tenant_id ON public.security_events USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_security_events_tenant_resolved_created ON public.security_events USING btree (tenant_id, resolved, created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.service_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  integration_id uuid,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_events_integration_id_fkey' AND conrelid = 'public.service_events'::regclass
  ) THEN
    ALTER TABLE public.service_events ADD CONSTRAINT service_events_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES service_integrations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_events_tenant_id_fkey' AND conrelid = 'public.service_events'::regclass
  ) THEN
    ALTER TABLE public.service_events ADD CONSTRAINT service_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_events_integration_id ON public.service_events USING btree (integration_id);

CREATE INDEX IF NOT EXISTS idx_service_events_tenant ON public.service_events USING btree (tenant_id, received_at);

CREATE INDEX IF NOT EXISTS idx_service_events_tenant_id ON public.service_events USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.service_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_integrations_tenant_id_fkey' AND conrelid = 'public.service_integrations'::regclass
  ) THEN
    ALTER TABLE public.service_integrations ADD CONSTRAINT service_integrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_integrations_created_at_desc ON public.service_integrations USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_integrations_tenant ON public.service_integrations USING btree (tenant_id, type);

CREATE INDEX IF NOT EXISTS idx_service_integrations_tenant_id ON public.service_integrations USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.shareable_artifacts (
  id varchar NOT NULL,
  user_id uuid NOT NULL,
  artifact_type varchar NOT NULL,
  artifact_id uuid NOT NULL,
  public bool NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shareable_artifacts_user_id_fkey' AND conrelid = 'public.shareable_artifacts'::regclass
  ) THEN
    ALTER TABLE public.shareable_artifacts ADD CONSTRAINT shareable_artifacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shareable_artifacts_created_at_desc ON public.shareable_artifacts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shareable_artifacts_expires_at ON public.shareable_artifacts USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_shareable_artifacts_public ON public.shareable_artifacts USING btree (public) WHERE (public = true);

CREATE INDEX IF NOT EXISTS idx_shareable_artifacts_user_id ON public.shareable_artifacts USING btree (user_id);

ALTER TABLE public.shareable_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_delete ON public.shareable_artifacts;
CREATE POLICY user_delete ON public.shareable_artifacts
  FOR DELETE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_insert ON public.shareable_artifacts;
CREATE POLICY user_insert ON public.shareable_artifacts
  FOR INSERT
  
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS user_select ON public.shareable_artifacts;
CREATE POLICY user_select ON public.shareable_artifacts
  FOR SELECT
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_update ON public.shareable_artifacts;
CREATE POLICY user_update ON public.shareable_artifacts
  FOR UPDATE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE TABLE IF NOT EXISTS public.staleness_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_type varchar NOT NULL,
  content_id uuid,
  content_key varchar,
  last_updated timestamptz,
  staleness_threshold_days int4 DEFAULT 90,
  is_stale bool DEFAULT false,
  flagged_at timestamptz,
  auto_archived bool DEFAULT false,
  archived_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_staleness_checks_created_at_desc ON public.staleness_checks USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staleness_content ON public.staleness_checks USING btree (content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_staleness_stale ON public.staleness_checks USING btree (is_stale) WHERE (is_stale = true);

CREATE INDEX IF NOT EXISTS idx_staleness_updated ON public.staleness_checks USING btree (last_updated);

ALTER TABLE public.staleness_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staleness_checks_select_service_role_only ON public.staleness_checks;
CREATE POLICY staleness_checks_select_service_role_only ON public.staleness_checks
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.storage_references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  bucket_id text NOT NULL,
  object_path text NOT NULL,
  purpose text NOT NULL,
  size_bytes int8,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'storage_references_tenant_id_fkey' AND conrelid = 'public.storage_references'::regclass
  ) THEN
    ALTER TABLE public.storage_references ADD CONSTRAINT storage_references_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_storage_references_created_at_desc ON public.storage_references USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_storage_references_tenant_id ON public.storage_references USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.strategic_backlog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  priority int4 NOT NULL,
  title varchar NOT NULL,
  description text,
  category varchar,
  rationale text NOT NULL,
  driving_metrics jsonb DEFAULT '{}'::jsonb,
  estimated_impact varchar,
  estimated_effort varchar,
  status varchar DEFAULT 'proposed'::character varying,
  related_issue_url text,
  related_pr_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_strategic_backlog_category ON public.strategic_backlog USING btree (category);

CREATE INDEX IF NOT EXISTS idx_strategic_backlog_created_at_desc ON public.strategic_backlog USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_backlog_priority ON public.strategic_backlog USING btree (priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_backlog_status ON public.strategic_backlog USING btree (status);

ALTER TABLE public.strategic_backlog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS strategic_backlog_read ON public.strategic_backlog;
CREATE POLICY strategic_backlog_read ON public.strategic_backlog
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.stripe_customers (
  customer_id text NOT NULL,
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_stripe_customers_tenant' AND conrelid = 'public.stripe_customers'::regclass
  ) THEN
    ALTER TABLE public.stripe_customers ADD CONSTRAINT fk_stripe_customers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stripe_customers_created_at_desc ON public.stripe_customers USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_tenant_created_at ON public.stripe_customers USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_tenant_id ON public.stripe_customers USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.stripe_event_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stripe_event_id varchar NOT NULL,
  event_type varchar NOT NULL,
  processed bool DEFAULT false,
  processing_error text,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_event_log_stripe_event_id_key' AND conrelid = 'public.stripe_event_log'::regclass
  ) THEN
    ALTER TABLE public.stripe_event_log ADD CONSTRAINT stripe_event_log_stripe_event_id_key UNIQUE (stripe_event_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stripe_event_log_created_at ON public.stripe_event_log USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_stripe_event_log_created_at_desc ON public.stripe_event_log USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_event_log_event_type ON public.stripe_event_log USING btree (event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_event_log_processed ON public.stripe_event_log USING btree (processed);

CREATE INDEX IF NOT EXISTS idx_stripe_event_log_stripe_event_id ON public.stripe_event_log USING btree (stripe_event_id);

CREATE UNIQUE INDEX IF NOT EXISTS stripe_event_log_stripe_event_id_key ON public.stripe_event_log USING btree (stripe_event_id);

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  type text NOT NULL,
  api_version text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  received_at timestamptz NOT NULL DEFAULT now(),
  livemode bool DEFAULT false,
  event_id text,
  status text DEFAULT 'received'::text,
  user_id uuid,
  billing_account_id uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_stripe_events_tenant' AND conrelid = 'public.stripe_events'::regclass
  ) THEN
    ALTER TABLE public.stripe_events ADD CONSTRAINT fk_stripe_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_events_billing_account_id_fkey' AND conrelid = 'public.stripe_events'::regclass
  ) THEN
    ALTER TABLE public.stripe_events ADD CONSTRAINT stripe_events_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_events_tenant_id_fkey' AND conrelid = 'public.stripe_events'::regclass
  ) THEN
    ALTER TABLE public.stripe_events ADD CONSTRAINT stripe_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stripe_events_billing_account_id ON public.stripe_events USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_stripe_events_created_at_desc ON public.stripe_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events USING btree (event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_events_received_at ON public.stripe_events USING btree (received_at);

CREATE INDEX IF NOT EXISTS idx_stripe_events_status ON public.stripe_events USING btree (status);

CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant_created_at ON public.stripe_events USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant_id ON public.stripe_events USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant_type_received ON public.stripe_events USING btree (tenant_id, type, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events USING btree (type);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type_created ON public.stripe_events USING btree (type, created_at);

CREATE INDEX IF NOT EXISTS idx_stripe_events_user_id ON public.stripe_events USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS stripe_events_event_id_key ON public.stripe_events USING btree (event_id);

CREATE TABLE IF NOT EXISTS public.stripe_webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  delivery_id text,
  status_code int4,
  error text,
  payload jsonb,
  signature text,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_stripe_webhook_logs_tenant' AND conrelid = 'public.stripe_webhook_logs'::regclass
  ) THEN
    ALTER TABLE public.stripe_webhook_logs ADD CONSTRAINT fk_stripe_webhook_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_webhook_logs_tenant_id_fkey' AND conrelid = 'public.stripe_webhook_logs'::regclass
  ) THEN
    ALTER TABLE public.stripe_webhook_logs ADD CONSTRAINT stripe_webhook_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS brin_stripe_webhook_logs_received_at ON public.stripe_webhook_logs USING brin (received_at) WITH (autosummarize='on');

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_received ON public.stripe_webhook_logs USING btree (received_at);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_tenant_id ON public.stripe_webhook_logs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_tenant_received ON public.stripe_webhook_logs USING btree (tenant_id, received_at DESC);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  billing_account_id uuid NOT NULL,
  stripe_subscription_id varchar,
  stripe_price_id varchar,
  plan_id varchar NOT NULL,
  plan_name varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'active'::character varying,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end bool DEFAULT false,
  cancelled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tenant_id uuid,
  plan text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_billing_account_id_fkey' AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_plan_fkey' AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_fkey FOREIGN KEY (plan) REFERENCES entitlements(plan);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_tenant_id_fkey' AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_stripe_subscription_id_key' AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_account_id ON public.subscriptions USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at_desc ON public.subscriptions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions USING btree (current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions USING btree (plan);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions USING btree (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions USING btree (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_key ON public.subscriptions USING btree (stripe_subscription_id);

CREATE TABLE IF NOT EXISTS public.support_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  title varchar NOT NULL,
  slug varchar NOT NULL,
  content text NOT NULL,
  excerpt text,
  keywords _text,
  views int4 NOT NULL DEFAULT 0,
  helpful_count int4 NOT NULL DEFAULT 0,
  not_helpful_count int4 NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'draft'::character varying,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_articles_author_id_fkey' AND conrelid = 'public.support_articles'::regclass
  ) THEN
    ALTER TABLE public.support_articles ADD CONSTRAINT support_articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_articles_category_id_fkey' AND conrelid = 'public.support_articles'::regclass
  ) THEN
    ALTER TABLE public.support_articles ADD CONSTRAINT support_articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES support_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_articles_slug_key' AND conrelid = 'public.support_articles'::regclass
  ) THEN
    ALTER TABLE public.support_articles ADD CONSTRAINT support_articles_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_support_articles_author_id ON public.support_articles USING btree (author_id);

CREATE INDEX IF NOT EXISTS idx_support_articles_category ON public.support_articles USING btree (category_id);

CREATE INDEX IF NOT EXISTS idx_support_articles_created_at_desc ON public.support_articles USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_articles_slug ON public.support_articles USING btree (slug);

CREATE INDEX IF NOT EXISTS idx_support_articles_status ON public.support_articles USING btree (status);

CREATE UNIQUE INDEX IF NOT EXISTS support_articles_slug_key ON public.support_articles USING btree (slug);

CREATE TABLE IF NOT EXISTS public.support_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  slug varchar NOT NULL,
  description text,
  icon varchar,
  order_index int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_categories_slug_key' AND conrelid = 'public.support_categories'::regclass
  ) THEN
    ALTER TABLE public.support_categories ADD CONSTRAINT support_categories_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_support_categories_created_at_desc ON public.support_categories USING btree (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS support_categories_slug_key ON public.support_categories USING btree (slug);

ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read ON public.support_categories;
CREATE POLICY anon_read ON public.support_categories
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject varchar NOT NULL,
  description text NOT NULL,
  category varchar,
  severity issue_severity NOT NULL DEFAULT 'medium'::issue_severity,
  status issue_status NOT NULL DEFAULT 'open'::issue_status,
  assigned_to uuid,
  priority int4 NOT NULL DEFAULT 0,
  tags _text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_assigned_to_fkey' AND conrelid = 'public.support_tickets'::regclass
  ) THEN
    ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_user_id_fkey' AND conrelid = 'public.support_tickets'::regclass
  ) THEN
    ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets USING btree (assigned_to);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at_desc ON public.support_tickets USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_severity ON public.support_tickets USING btree (severity);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets USING btree (status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.system_state_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  snapshot_type varchar NOT NULL,
  snapshot_date date NOT NULL,
  system_metrics jsonb NOT NULL,
  critical_events jsonb DEFAULT '[]'::jsonb,
  alerts_summary jsonb DEFAULT '{}'::jsonb,
  billing_summary jsonb DEFAULT '{}'::jsonb,
  user_activity_summary jsonb DEFAULT '{}'::jsonb,
  agent_runs_summary jsonb DEFAULT '{}'::jsonb,
  health_summary jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_state_snapshots_snapshot_type_snapshot_date_key' AND conrelid = 'public.system_state_snapshots'::regclass
  ) THEN
    ALTER TABLE public.system_state_snapshots ADD CONSTRAINT system_state_snapshots_snapshot_type_snapshot_date_key UNIQUE (snapshot_type, snapshot_date);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_snapshots_date ON public.system_state_snapshots USING btree (snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_type_date ON public.system_state_snapshots USING btree (snapshot_type, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_system_state_snapshots_created_at_desc ON public.system_state_snapshots USING btree (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS system_state_snapshots_snapshot_type_snapshot_date_key ON public.system_state_snapshots USING btree (snapshot_type, snapshot_date);

ALTER TABLE public.system_state_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_state_snapshots_select_service_role_only ON public.system_state_snapshots;
CREATE POLICY system_state_snapshots_select_service_role_only ON public.system_state_snapshots
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.tenant_billing_accounts (
  tenant_id uuid NOT NULL,
  billing_account_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, billing_account_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_billing_accounts_tenant' AND conrelid = 'public.tenant_billing_accounts'::regclass
  ) THEN
    ALTER TABLE public.tenant_billing_accounts ADD CONSTRAINT fk_tenant_billing_accounts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_billing_accounts_billing_account_id_fkey' AND conrelid = 'public.tenant_billing_accounts'::regclass
  ) THEN
    ALTER TABLE public.tenant_billing_accounts ADD CONSTRAINT tenant_billing_accounts_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_billing_accounts_tenant_id_fkey' AND conrelid = 'public.tenant_billing_accounts'::regclass
  ) THEN
    ALTER TABLE public.tenant_billing_accounts ADD CONSTRAINT tenant_billing_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tba_billing_account ON public.tenant_billing_accounts USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_tenant_billing_accounts_created_at_desc ON public.tenant_billing_accounts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_billing_accounts_tenant_created_at ON public.tenant_billing_accounts USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_billing_accounts_tenant_id ON public.tenant_billing_accounts USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_branding (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid,
  colors jsonb DEFAULT '{}'::jsonb,
  typography jsonb DEFAULT '{}'::jsonb,
  logos jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_branding_tenant_id_fkey' AND conrelid = 'public.tenant_branding'::regclass
  ) THEN
    ALTER TABLE public.tenant_branding ADD CONSTRAINT tenant_branding_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_branding_tenant_id_key' AND conrelid = 'public.tenant_branding'::regclass
  ) THEN
    ALTER TABLE public.tenant_branding ADD CONSTRAINT tenant_branding_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant_id ON public.tenant_branding USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_branding_tenant_id_key ON public.tenant_branding USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_drafts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  page_id uuid,
  content jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_drafts_page_id_fkey' AND conrelid = 'public.tenant_drafts'::regclass
  ) THEN
    ALTER TABLE public.tenant_drafts ADD CONSTRAINT tenant_drafts_page_id_fkey FOREIGN KEY (page_id) REFERENCES tenant_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_drafts_created_at_desc ON public.tenant_drafts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_drafts_created_by ON public.tenant_drafts USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_tenant_drafts_page_id ON public.tenant_drafts USING btree (page_id);

CREATE TABLE IF NOT EXISTS public.tenant_feature_flags (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid,
  flag_key text NOT NULL,
  value jsonb NOT NULL,
  is_enabled bool DEFAULT true,
  overrides jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_feature_flags_tenant_id_fkey' AND conrelid = 'public.tenant_feature_flags'::regclass
  ) THEN
    ALTER TABLE public.tenant_feature_flags ADD CONSTRAINT tenant_feature_flags_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_feature_flags_tenant_id_flag_key_key' AND conrelid = 'public.tenant_feature_flags'::regclass
  ) THEN
    ALTER TABLE public.tenant_feature_flags ADD CONSTRAINT tenant_feature_flags_tenant_id_flag_key_key UNIQUE (tenant_id, flag_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_created_at_desc ON public.tenant_feature_flags USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_tenant_id ON public.tenant_feature_flags USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_feature_flags_tenant_id_flag_key_key ON public.tenant_feature_flags USING btree (tenant_id, flag_key);

CREATE TABLE IF NOT EXISTS public.tenant_media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid,
  url text NOT NULL,
  filename text NOT NULL,
  mime_type text,
  size_bytes int8,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_media_tenant_id_fkey' AND conrelid = 'public.tenant_media'::regclass
  ) THEN
    ALTER TABLE public.tenant_media ADD CONSTRAINT tenant_media_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_media_created_at_desc ON public.tenant_media USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_media_tenant_id ON public.tenant_media USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_default bool NOT NULL DEFAULT false,
  PRIMARY KEY (tenant_id, user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_memberships_tenant_id_fkey' AND conrelid = 'public.tenant_memberships'::regclass
  ) THEN
    ALTER TABLE public.tenant_memberships ADD CONSTRAINT tenant_memberships_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_memberships_user_id_fkey' AND conrelid = 'public.tenant_memberships'::regclass
  ) THEN
    ALTER TABLE public.tenant_memberships ADD CONSTRAINT tenant_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_created_at_desc ON public.tenant_memberships USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_created_at ON public.tenant_memberships USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_id ON public.tenant_memberships USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_role ON public.tenant_memberships USING btree (tenant_id, role);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_user ON public.tenant_memberships USING btree (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON public.tenant_memberships USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_created_at ON public.tenant_memberships USING btree (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_default ON public.tenant_memberships USING btree (user_id, is_default);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_tenant ON public.tenant_memberships USING btree (user_id, tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_memberships_user_default ON public.tenant_memberships USING btree (user_id) WHERE (is_default IS TRUE);

CREATE TABLE IF NOT EXISTS public.tenant_navigation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nav_items jsonb DEFAULT '[]'::jsonb,
  footer_items jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_navigation_tenant_id_fkey' AND conrelid = 'public.tenant_navigation'::regclass
  ) THEN
    ALTER TABLE public.tenant_navigation ADD CONSTRAINT tenant_navigation_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_navigation_tenant_id_key' AND conrelid = 'public.tenant_navigation'::regclass
  ) THEN
    ALTER TABLE public.tenant_navigation ADD CONSTRAINT tenant_navigation_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_navigation_created_at_desc ON public.tenant_navigation USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_navigation_tenant_id ON public.tenant_navigation USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_navigation_tenant_id_key ON public.tenant_navigation USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_page_blocks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  page_id uuid,
  type text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  order_index int4 NOT NULL,
  visible bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_page_blocks_page_id_fkey' AND conrelid = 'public.tenant_page_blocks'::regclass
  ) THEN
    ALTER TABLE public.tenant_page_blocks ADD CONSTRAINT tenant_page_blocks_page_id_fkey FOREIGN KEY (page_id) REFERENCES tenant_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_blocks_page_order ON public.tenant_page_blocks USING btree (page_id, order_index);

CREATE INDEX IF NOT EXISTS idx_tenant_page_blocks_created_at_desc ON public.tenant_page_blocks USING btree (created_at DESC);

CREATE TABLE IF NOT EXISTS public.tenant_page_revisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_page_id uuid NOT NULL,
  editor_user_id uuid,
  snapshot jsonb NOT NULL,
  comment text,
  approved_by_user_id uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_page_revisions_tenant_page_id_fkey' AND conrelid = 'public.tenant_page_revisions'::regclass
  ) THEN
    ALTER TABLE public.tenant_page_revisions ADD CONSTRAINT tenant_page_revisions_tenant_page_id_fkey FOREIGN KEY (tenant_page_id) REFERENCES tenant_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_approved_by_user_id ON public.tenant_page_revisions USING btree (approved_by_user_id);

CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_created_at ON public.tenant_page_revisions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_editor_user_id ON public.tenant_page_revisions USING btree (editor_user_id);

CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_tenant_page_id ON public.tenant_page_revisions USING btree (tenant_page_id);

CREATE TABLE IF NOT EXISTS public.tenant_pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'::text,
  is_home bool DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  page_type varchar NOT NULL,
  is_draft bool DEFAULT false,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_pages_tenant_id_fkey' AND conrelid = 'public.tenant_pages'::regclass
  ) THEN
    ALTER TABLE public.tenant_pages ADD CONSTRAINT tenant_pages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_pages_tenant_id_slug_key' AND conrelid = 'public.tenant_pages'::regclass
  ) THEN
    ALTER TABLE public.tenant_pages ADD CONSTRAINT tenant_pages_tenant_id_slug_key UNIQUE (tenant_id, slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_pages_created_at_desc ON public.tenant_pages USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_pages_is_draft ON public.tenant_pages USING btree (is_draft);

CREATE INDEX IF NOT EXISTS idx_tenant_pages_page_type ON public.tenant_pages USING btree (page_type);

CREATE INDEX IF NOT EXISTS idx_tenant_pages_slug ON public.tenant_pages USING btree (slug);

CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant_id ON public.tenant_pages USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant_slug ON public.tenant_pages USING btree (tenant_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_pages_tenant_id_slug_key ON public.tenant_pages USING btree (tenant_id, slug);

CREATE TABLE IF NOT EXISTS public.tenant_plans (
  tenant_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  max_uploads_month int4,
  max_storage_mb int4,
  max_extractions_month int4,
  max_users int4,
  billing_cycle_anchor date NOT NULL DEFAULT (date_trunc('month'::text, now()))::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_plans_tenant' AND conrelid = 'public.tenant_plans'::regclass
  ) THEN
    ALTER TABLE public.tenant_plans ADD CONSTRAINT fk_tenant_plans_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_plans_plan_id_fkey' AND conrelid = 'public.tenant_plans'::regclass
  ) THEN
    ALTER TABLE public.tenant_plans ADD CONSTRAINT tenant_plans_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_plans_tenant_id_fkey' AND conrelid = 'public.tenant_plans'::regclass
  ) THEN
    ALTER TABLE public.tenant_plans ADD CONSTRAINT tenant_plans_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_plans_created_at_desc ON public.tenant_plans USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_plans_plan_id ON public.tenant_plans USING btree (plan_id);

CREATE INDEX IF NOT EXISTS idx_tenant_plans_tenant_created_at ON public.tenant_plans USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_plans_tenant_id ON public.tenant_plans USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_quota_usage (
  tenant_id uuid NOT NULL,
  current_storage_bytes int8 DEFAULT 0,
  current_concurrent_jobs int4 DEFAULT 0,
  current_monthly_reconciliations int4 DEFAULT 0,
  last_reset_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_quota_usage_tenant' AND conrelid = 'public.tenant_quota_usage'::regclass
  ) THEN
    ALTER TABLE public.tenant_quota_usage ADD CONSTRAINT fk_tenant_quota_usage_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_quota_usage_tenant_id_fkey' AND conrelid = 'public.tenant_quota_usage'::regclass
  ) THEN
    ALTER TABLE public.tenant_quota_usage ADD CONSTRAINT tenant_quota_usage_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_quota_usage_tenant_id ON public.tenant_quota_usage USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  metric_type varchar NOT NULL,
  metric_value int8 NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_usage_tenant' AND conrelid = 'public.tenant_usage'::regclass
  ) THEN
    ALTER TABLE public.tenant_usage ADD CONSTRAINT fk_tenant_usage_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_usage_tenant_id_fkey' AND conrelid = 'public.tenant_usage'::regclass
  ) THEN
    ALTER TABLE public.tenant_usage ADD CONSTRAINT tenant_usage_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_usage_tenant_id_metric_type_period_start_key' AND conrelid = 'public.tenant_usage'::regclass
  ) THEN
    ALTER TABLE public.tenant_usage ADD CONSTRAINT tenant_usage_tenant_id_metric_type_period_start_key UNIQUE (tenant_id, metric_type, period_start);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_usage_created_at_desc ON public.tenant_usage USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON public.tenant_usage USING btree (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_created_at ON public.tenant_usage USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_id ON public.tenant_usage USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_period ON public.tenant_usage USING btree (tenant_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_type ON public.tenant_usage USING btree (metric_type);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_usage_tenant_id_metric_type_period_start_key ON public.tenant_usage USING btree (tenant_id, metric_type, period_start);

CREATE TABLE IF NOT EXISTS public.tenant_usage_monthly (
  tenant_id uuid NOT NULL,
  period_start date NOT NULL,
  uploads_count int4 NOT NULL DEFAULT 0,
  extractions_count int4 NOT NULL DEFAULT 0,
  storage_bytes int8 NOT NULL DEFAULT 0,
  users_count int4 NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, period_start)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_usage_monthly_tenant' AND conrelid = 'public.tenant_usage_monthly'::regclass
  ) THEN
    ALTER TABLE public.tenant_usage_monthly ADD CONSTRAINT fk_tenant_usage_monthly_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_usage_monthly_tenant_id_fkey' AND conrelid = 'public.tenant_usage_monthly'::regclass
  ) THEN
    ALTER TABLE public.tenant_usage_monthly ADD CONSTRAINT tenant_usage_monthly_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_usage_monthly_keys ON public.tenant_usage_monthly USING btree (tenant_id, period_start);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_monthly_tenant_id ON public.tenant_usage_monthly USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid,
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_users_tenant_id_fkey' AND conrelid = 'public.tenant_users'::regclass
  ) THEN
    ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_users_tenant_id_user_id_key' AND conrelid = 'public.tenant_users'::regclass
  ) THEN
    ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_tenant_id_user_id_key UNIQUE (tenant_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_users_created_at_desc ON public.tenant_users USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_tenant ON public.tenant_users USING btree (user_id, tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_users_tenant_id_user_id_key ON public.tenant_users USING btree (tenant_id, user_id);

CREATE TABLE IF NOT EXISTS public.tenant_versions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  page_id uuid,
  content jsonb NOT NULL,
  version_number int4 NOT NULL,
  published_by uuid,
  published_at timestamptz DEFAULT now(),
  change_summary text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_versions_page_id_fkey' AND conrelid = 'public.tenant_versions'::regclass
  ) THEN
    ALTER TABLE public.tenant_versions ADD CONSTRAINT tenant_versions_page_id_fkey FOREIGN KEY (page_id) REFERENCES tenant_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_versions_page_id ON public.tenant_versions USING btree (page_id);

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  slug varchar NOT NULL,
  parent_tenant_id uuid,
  tier varchar NOT NULL DEFAULT 'free'::character varying,
  status varchar NOT NULL DEFAULT 'active'::character varying,
  quotas jsonb NOT NULL DEFAULT '{"rateLimitRpm": 1000, "storageBytes": 1073741824, "customDomains": 0, "concurrentJobs": 5, "monthlyReconciliations": 1000}'::jsonb,
  config jsonb NOT NULL DEFAULT '{"maxRetries": 3, "webhookTimeout": 30000, "enableMLFeatures": false, "dataResidencyRegion": "us", "customDomainVerified": false, "enableAdvancedMatching": false}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  billing_account_id uuid,
  plan_hint text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_billing_account_id_fkey' AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_parent_tenant_id_fkey' AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_parent_tenant_id_fkey FOREIGN KEY (parent_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_plan_hint_fkey' AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_plan_hint_fkey FOREIGN KEY (plan_hint) REFERENCES entitlements(plan);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_slug_key' AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_ba_id ON public.tenants USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_tenants_created_at_desc ON public.tenants USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON public.tenants USING btree (deleted_at);

CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at_null ON public.tenants USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id ON public.tenants USING btree (parent_tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_key ON public.tenants USING btree (slug);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  user_id uuid,
  message text NOT NULL,
  is_internal bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_messages_ticket_id_fkey' AND conrelid = 'public.ticket_messages'::regclass
  ) THEN
    ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_messages_user_id_fkey' AND conrelid = 'public.ticket_messages'::regclass
  ) THEN
    ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at_desc ON public.ticket_messages USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages USING btree (ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_user_id ON public.ticket_messages USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.transform_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name varchar NOT NULL,
  description text,
  recipe_type varchar NOT NULL,
  input_schema jsonb NOT NULL,
  output_schema jsonb NOT NULL,
  transformation_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation_rules jsonb DEFAULT '[]'::jsonb,
  is_public bool DEFAULT false,
  is_system bool DEFAULT false,
  usage_count int4 DEFAULT 0,
  version int4 DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transform_recipes_tenant_id_fkey' AND conrelid = 'public.transform_recipes'::regclass
  ) THEN
    ALTER TABLE public.transform_recipes ADD CONSTRAINT transform_recipes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transform_recipes_created_at_desc ON public.transform_recipes USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transform_recipes_deleted_at_null ON public.transform_recipes USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_transform_recipes_input_schema_gin ON public.transform_recipes USING gin (input_schema);

CREATE INDEX IF NOT EXISTS idx_transform_recipes_output_schema_gin ON public.transform_recipes USING gin (output_schema);

CREATE INDEX IF NOT EXISTS idx_transform_recipes_public ON public.transform_recipes USING btree (is_public) WHERE ((is_public = true) AND (deleted_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_transform_recipes_recipe_type ON public.transform_recipes USING btree (recipe_type);

CREATE INDEX IF NOT EXISTS idx_transform_recipes_tenant_id ON public.transform_recipes USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_transform_recipes_transformation_steps_gin ON public.transform_recipes USING gin (transformation_steps);

CREATE TABLE IF NOT EXISTS public.unmatched (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL,
  job_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  source_id varchar,
  target_id varchar,
  amount numeric,
  currency varchar,
  reason text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_unmatched_tenant' AND conrelid = 'public.unmatched'::regclass
  ) THEN
    ALTER TABLE public.unmatched ADD CONSTRAINT fk_unmatched_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unmatched_execution_id_fkey' AND conrelid = 'public.unmatched'::regclass
  ) THEN
    ALTER TABLE public.unmatched ADD CONSTRAINT unmatched_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unmatched_tenant_id_fkey' AND conrelid = 'public.unmatched'::regclass
  ) THEN
    ALTER TABLE public.unmatched ADD CONSTRAINT unmatched_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unmatched_created_at_desc ON public.unmatched USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unmatched_execution_id ON public.unmatched USING btree (execution_id);

CREATE INDEX IF NOT EXISTS idx_unmatched_job ON public.unmatched USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_unmatched_job_day ON public.unmatched USING btree (job_id, created_at);

CREATE INDEX IF NOT EXISTS idx_unmatched_tenant_created_at ON public.unmatched USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unmatched_tenant_id ON public.unmatched USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  billing_account_id uuid,
  user_id uuid NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  content_type text,
  size_bytes int8,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uploads_billing_account_id_fkey' AND conrelid = 'public.uploads'::regclass
  ) THEN
    ALTER TABLE public.uploads ADD CONSTRAINT uploads_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uploads_tenant_id_fkey' AND conrelid = 'public.uploads'::regclass
  ) THEN
    ALTER TABLE public.uploads ADD CONSTRAINT uploads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_uploads_ba ON public.uploads USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON public.uploads USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_uploads_tenant_id ON public.uploads USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_uploads_tenant_user ON public.uploads USING btree (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_uploads_user ON public.uploads USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.usage_aggregate_daily (
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  billing_account_id uuid,
  integration_id uuid NOT NULL,
  add_on_id uuid NOT NULL,
  event_type text NOT NULL,
  date date NOT NULL,
  event_count int8 NOT NULL DEFAULT 0,
  total_quantity numeric NOT NULL DEFAULT 0,
  estimated_cost numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, project_id, date, event_type, integration_id, add_on_id)
);

CREATE INDEX IF NOT EXISTS idx_uad_tenant_date ON public.usage_aggregate_daily USING btree (tenant_id, date);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_ba_id ON public.usage_aggregate_daily USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_billing_account_date ON public.usage_aggregate_daily USING btree (billing_account_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_billing_account_event_type_date ON public.usage_aggregate_daily USING btree (billing_account_id, event_type, date DESC);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_created_at_desc ON public.usage_aggregate_daily USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_event_type ON public.usage_aggregate_daily USING btree (event_type);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_integration_id ON public.usage_aggregate_daily USING btree (integration_id);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_project_id ON public.usage_aggregate_daily USING btree (project_id);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_tenant_created_at ON public.usage_aggregate_daily USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_daily_tenant ON public.usage_aggregate_daily USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.usage_counters (
  tenant_id uuid NOT NULL,
  event_type text NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  count int8 NOT NULL DEFAULT 0,
  quantity numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, event_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_created_at_desc ON public.usage_counters USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_counters_tenant_created_at ON public.usage_counters USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_counters_tenant_id ON public.usage_counters USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_usage_counters_tenant_window ON public.usage_counters USING btree (tenant_id, window_start);

CREATE TABLE IF NOT EXISTS public.usage_event_idempotency (
  idempotency_key varchar NOT NULL,
  billing_account_id uuid NOT NULL,
  usage_event_id uuid NOT NULL,
  event_type varchar NOT NULL,
  quantity numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + '24:00:00'::interval),
  PRIMARY KEY (idempotency_key)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_event_idempotency_billing_account_id_fkey' AND conrelid = 'public.usage_event_idempotency'::regclass
  ) THEN
    ALTER TABLE public.usage_event_idempotency ADD CONSTRAINT usage_event_idempotency_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_event_idempotency_usage_event_id_fkey' AND conrelid = 'public.usage_event_idempotency'::regclass
  ) THEN
    ALTER TABLE public.usage_event_idempotency ADD CONSTRAINT usage_event_idempotency_usage_event_id_fkey FOREIGN KEY (usage_event_id) REFERENCES usage_events_billing(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_ba_id ON public.usage_event_idempotency USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_created_at_desc ON public.usage_event_idempotency USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_expires_at ON public.usage_event_idempotency USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_usage_event_id ON public.usage_event_idempotency USING btree (usage_event_id);

ALTER TABLE public.usage_event_idempotency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_event_idempotency_select_service_role_only ON public.usage_event_idempotency;
CREATE POLICY usage_event_idempotency_select_service_role_only ON public.usage_event_idempotency
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  event_name text NOT NULL,
  props jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_events_tenant_id_fkey' AND conrelid = 'public.usage_events'::regclass
  ) THEN
    ALTER TABLE public.usage_events ADD CONSTRAINT usage_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_events_user_id_fkey' AND conrelid = 'public.usage_events'::regclass
  ) THEN
    ALTER TABLE public.usage_events ADD CONSTRAINT usage_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON public.usage_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_event_name ON public.usage_events USING btree (event_name);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_event_created ON public.usage_events USING btree (tenant_id, event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.usage_events_billing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  project_id uuid,
  billing_account_id uuid,
  integration_id uuid,
  add_on_id uuid,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  quantity numeric NOT NULL DEFAULT 1,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS brin_usage_events_timestamp ON public.usage_events_billing USING brin ("timestamp") WITH (autosummarize='on');

CREATE INDEX IF NOT EXISTS idx_usage_events_account_timestamp ON public.usage_events_billing USING btree (billing_account_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_ba_id ON public.usage_events_billing USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account_event_timestamp ON public.usage_events_billing USING btree (billing_account_id, event_type, "timestamp");

CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account_event_type_timestamp ON public.usage_events_billing USING btree (billing_account_id, event_type, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_created_at_desc ON public.usage_events_billing USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_event_ts ON public.usage_events_billing USING btree (event_type, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON public.usage_events_billing USING btree (event_type);

CREATE INDEX IF NOT EXISTS idx_usage_events_integration_id ON public.usage_events_billing USING btree (integration_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_meta_gin ON public.usage_events_billing USING gin (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_usage_events_project_id ON public.usage_events_billing USING btree (project_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_created_at ON public.usage_events_billing USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_id ON public.usage_events_billing USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_ts ON public.usage_events_billing USING btree (tenant_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON public.usage_events_billing USING btree ("timestamp");

CREATE INDEX IF NOT EXISTS idx_usage_events_ts ON public.usage_events_billing USING btree ("timestamp" DESC);

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid,
  metric_type varchar NOT NULL,
  metric_value int4 NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_tracking_tenant_id_fkey' AND conrelid = 'public.usage_tracking'::regclass
  ) THEN
    ALTER TABLE public.usage_tracking ADD CONSTRAINT usage_tracking_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_tracking_user_id_fkey' AND conrelid = 'public.usage_tracking'::regclass
  ) THEN
    ALTER TABLE public.usage_tracking ADD CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_tracking_user_id_metric_type_period_start_key' AND conrelid = 'public.usage_tracking'::regclass
  ) THEN
    ALTER TABLE public.usage_tracking ADD CONSTRAINT usage_tracking_user_id_metric_type_period_start_key UNIQUE (user_id, metric_type, period_start);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at_desc ON public.usage_tracking USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON public.usage_tracking USING btree (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant_id ON public.usage_tracking USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_type ON public.usage_tracking USING btree (metric_type);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON public.usage_tracking USING btree (user_id, metric_type, period_start DESC);

CREATE UNIQUE INDEX IF NOT EXISTS usage_tracking_user_id_metric_type_period_start_key ON public.usage_tracking USING btree (user_id, metric_type, period_start);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_delete ON public.usage_tracking;
CREATE POLICY tenant_delete ON public.usage_tracking
  FOR DELETE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  ;

DROP POLICY IF EXISTS tenant_insert ON public.usage_tracking;
CREATE POLICY tenant_insert ON public.usage_tracking
  FOR INSERT
  
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

DROP POLICY IF EXISTS tenant_select ON public.usage_tracking;
CREATE POLICY tenant_select ON public.usage_tracking
  FOR SELECT
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids)))))
  ;

DROP POLICY IF EXISTS tenant_update ON public.usage_tracking;
CREATE POLICY tenant_update ON public.usage_tracking
  FOR UPDATE
  USING ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))))
  WITH CHECK ((tenant_id = ANY (ARRAY( SELECT get_user_tenant_ids() AS get_user_tenant_ids))));

CREATE TABLE IF NOT EXISTS public.user_artifacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_artifacts_user_id_fkey' AND conrelid = 'public.user_artifacts'::regclass
  ) THEN
    ALTER TABLE public.user_artifacts ADD CONSTRAINT user_artifacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_artifacts_created_at ON public.user_artifacts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_artifacts_data_gin ON public.user_artifacts USING gin (data);

CREATE INDEX IF NOT EXISTS idx_user_artifacts_kind ON public.user_artifacts USING btree (kind);

CREATE INDEX IF NOT EXISTS idx_user_artifacts_user_id ON public.user_artifacts USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.user_confusion_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  billing_account_id uuid,
  event_type varchar NOT NULL,
  severity varchar DEFAULT 'medium'::character varying,
  detected_at timestamptz DEFAULT now(),
  context jsonb DEFAULT '{}'::jsonb,
  auto_resolved bool DEFAULT false,
  resolved_at timestamptz,
  help_provided jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_confusion_events_billing_account_id_fkey' AND conrelid = 'public.user_confusion_events'::regclass
  ) THEN
    ALTER TABLE public.user_confusion_events ADD CONSTRAINT user_confusion_events_billing_account_id_fkey FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_confusion_events_user_id_fkey' AND conrelid = 'public.user_confusion_events'::regclass
  ) THEN
    ALTER TABLE public.user_confusion_events ADD CONSTRAINT user_confusion_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_confusion_events_ba_id ON public.user_confusion_events USING btree (billing_account_id);

CREATE INDEX IF NOT EXISTS idx_user_confusion_events_created_at_desc ON public.user_confusion_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_confusion_events_user_id ON public.user_confusion_events USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_confusion_type ON public.user_confusion_events USING btree (event_type);

CREATE INDEX IF NOT EXISTS idx_user_confusion_unresolved ON public.user_confusion_events USING btree (resolved_at) WHERE (resolved_at IS NULL);

ALTER TABLE public.user_confusion_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_delete ON public.user_confusion_events;
CREATE POLICY user_delete ON public.user_confusion_events
  FOR DELETE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_insert ON public.user_confusion_events;
CREATE POLICY user_insert ON public.user_confusion_events
  FOR INSERT
  
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS user_select ON public.user_confusion_events;
CREATE POLICY user_select ON public.user_confusion_events
  FOR SELECT
  USING ((( SELECT auth.uid() AS uid) = user_id))
  ;

DROP POLICY IF EXISTS user_update ON public.user_confusion_events;
CREATE POLICY user_update ON public.user_confusion_events
  FOR UPDATE
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE TABLE IF NOT EXISTS public.user_email_preferences (
  user_id uuid NOT NULL,
  marketing_emails bool NOT NULL DEFAULT true,
  product_updates bool NOT NULL DEFAULT true,
  onboarding_emails bool NOT NULL DEFAULT true,
  upgrade_prompts bool NOT NULL DEFAULT true,
  churn_save_emails bool NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_email_preferences_user_id_fkey' AND conrelid = 'public.user_email_preferences'::regclass
  ) THEN
    ALTER TABLE public.user_email_preferences ADD CONSTRAINT user_email_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_email_preferences_user_id ON public.user_email_preferences USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.user_intent_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  insight_type varchar NOT NULL,
  user_goal text NOT NULL,
  observed_behavior text NOT NULL,
  failure_pattern text,
  affected_user_count int4 DEFAULT 0,
  frequency_score numeric,
  severity_score numeric,
  evidence jsonb DEFAULT '[]'::jsonb,
  recommended_action text,
  feature_suggestion text,
  status varchar DEFAULT 'new'::character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_user_intent_insights_created_at_desc ON public.user_intent_insights USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_intent_insights_frequency ON public.user_intent_insights USING btree (frequency_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_intent_insights_severity ON public.user_intent_insights USING btree (severity_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_intent_insights_status ON public.user_intent_insights USING btree (status);

CREATE INDEX IF NOT EXISTS idx_user_intent_insights_type ON public.user_intent_insights USING btree (insight_type);

ALTER TABLE public.user_intent_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_intent_insights_read ON public.user_intent_insights;
CREATE POLICY user_intent_insights_read ON public.user_intent_insights
  FOR SELECT
  USING (true)
  ;

CREATE TABLE IF NOT EXISTS public.user_lifecycle (
  user_id uuid NOT NULL,
  current_stage user_lifecycle_stage NOT NULL DEFAULT 'signup'::user_lifecycle_stage,
  segment customer_segment NOT NULL DEFAULT 'free_tier'::customer_segment,
  activated_at timestamptz,
  first_successful_setup_at timestamptz,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  churn_risk_score numeric DEFAULT 0.0,
  churn_risk_reasons _text,
  expansion_opportunity_score numeric DEFAULT 0.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_lifecycle_user_id_fkey' AND conrelid = 'public.user_lifecycle'::regclass
  ) THEN
    ALTER TABLE public.user_lifecycle ADD CONSTRAINT user_lifecycle_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_churn_risk ON public.user_lifecycle USING btree (churn_risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_created_at_desc ON public.user_lifecycle USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_segment ON public.user_lifecycle USING btree (segment);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_stage ON public.user_lifecycle USING btree (current_stage);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_user_id ON public.user_lifecycle USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.user_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  milestone_type varchar NOT NULL,
  milestone_data jsonb,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_milestones_user_id_fkey' AND conrelid = 'public.user_milestones'::regclass
  ) THEN
    ALTER TABLE public.user_milestones ADD CONSTRAINT user_milestones_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_milestones_created_at_desc ON public.user_milestones USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_milestones_type ON public.user_milestones USING btree (milestone_type);

CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON public.user_milestones USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.user_organizations (
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  is_default bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_organizations_created_at_desc ON public.user_organizations USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_organizations_user_org ON public.user_organizations USING btree (user_id, org_id, is_default);

CREATE INDEX IF NOT EXISTS idx_user_orgs_org ON public.user_organizations USING btree (org_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_org_one_default ON public.user_organizations USING btree (user_id) WHERE (is_default = true);

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid NOT NULL,
  last_seen timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'online'::text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.user_tenants (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_tenants_tenant_id_fkey' AND conrelid = 'public.user_tenants'::regclass
  ) THEN
    ALTER TABLE public.user_tenants ADD CONSTRAINT user_tenants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_tenants_created_at_desc ON public.user_tenants USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON public.user_tenants USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_tenants_user_tenant ON public.user_tenants USING btree (user_id, tenant_id);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  email varchar NOT NULL,
  password_hash varchar NOT NULL,
  name varchar,
  role varchar DEFAULT 'developer'::character varying,
  data_residency_region varchar DEFAULT 'us'::character varying,
  data_retention_days int4 DEFAULT 365,
  deleted_at timestamptz,
  deletion_scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  auth_user_id uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_tenant' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_user_id_fkey' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_id_fkey' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_id_email_key' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users USING btree (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON public.users USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users USING btree (deleted_at);

CREATE INDEX IF NOT EXISTS idx_users_deleted_at_null ON public.users USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_users_tenant_created_at ON public.users USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users USING btree (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_id_email_key ON public.users USING btree (tenant_id, email);

CREATE TABLE IF NOT EXISTS public.validation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name varchar NOT NULL,
  description text,
  rule_type varchar NOT NULL,
  rule_config jsonb NOT NULL,
  severity varchar NOT NULL DEFAULT 'error'::character varying,
  is_active bool DEFAULT true,
  is_public bool DEFAULT false,
  is_system bool DEFAULT false,
  usage_count int4 DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'validation_rules_tenant_id_fkey' AND conrelid = 'public.validation_rules'::regclass
  ) THEN
    ALTER TABLE public.validation_rules ADD CONSTRAINT validation_rules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_validation_rules_active ON public.validation_rules USING btree (tenant_id) WHERE ((is_active = true) AND (deleted_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_validation_rules_created_at_desc ON public.validation_rules USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_validation_rules_deleted_at_null ON public.validation_rules USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_validation_rules_public ON public.validation_rules USING btree (is_public) WHERE ((is_public = true) AND (deleted_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_validation_rules_rule_config_gin ON public.validation_rules USING gin (rule_config);

CREATE INDEX IF NOT EXISTS idx_validation_rules_rule_type ON public.validation_rules USING btree (rule_type);

CREATE INDEX IF NOT EXISTS idx_validation_rules_tenant_id ON public.validation_rules USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.webhook_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  outbox_id uuid NOT NULL,
  attempt_no int4 NOT NULL,
  status_code int4,
  response_ms int4,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_attempts_outbox_id_fkey' AND conrelid = 'public.webhook_attempts'::regclass
  ) THEN
    ALTER TABLE public.webhook_attempts ADD CONSTRAINT webhook_attempts_outbox_id_fkey FOREIGN KEY (outbox_id) REFERENCES receipt_webhook_outbox(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_attempts_created_at_desc ON public.webhook_attempts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_attempts_outbox_attempt ON public.webhook_attempts USING btree (outbox_id, attempt_no);

CREATE TABLE IF NOT EXISTS public.webhook_configs (
  adapter varchar NOT NULL,
  secret varchar NOT NULL,
  signature_algorithm varchar DEFAULT 'hmac-sha256'::character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (adapter)
);

CREATE INDEX IF NOT EXISTS idx_webhook_configs_created_at_desc ON public.webhook_configs USING btree (created_at DESC);

CREATE TABLE IF NOT EXISTS public.webhook_dead_letters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  webhook_id uuid,
  original_delivery_id uuid,
  reason text,
  payload jsonb,
  headers jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_dead_letters_original_delivery_id_fkey' AND conrelid = 'public.webhook_dead_letters'::regclass
  ) THEN
    ALTER TABLE public.webhook_dead_letters ADD CONSTRAINT webhook_dead_letters_original_delivery_id_fkey FOREIGN KEY (original_delivery_id) REFERENCES webhook_deliveries(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_dead_letters_webhook_id_fkey' AND conrelid = 'public.webhook_dead_letters'::regclass
  ) THEN
    ALTER TABLE public.webhook_dead_letters ADD CONSTRAINT webhook_dead_letters_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wdl_webhook_id ON public.webhook_dead_letters USING btree (webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_dead_letters_created_at_desc ON public.webhook_dead_letters USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_dead_letters_keys ON public.webhook_dead_letters USING btree (webhook_id, original_delivery_id);

CREATE INDEX IF NOT EXISTS idx_webhook_dead_letters_original_delivery_id ON public.webhook_dead_letters USING btree (original_delivery_id);

CREATE INDEX IF NOT EXISTS idx_webhook_dead_letters_tenant_id ON public.webhook_dead_letters USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL,
  url varchar NOT NULL,
  payload jsonb NOT NULL,
  status varchar NOT NULL,
  status_code int4,
  response_body text,
  attempts int4 DEFAULT 0,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_webhook_deliveries_tenant' AND conrelid = 'public.webhook_deliveries'::regclass
  ) THEN
    ALTER TABLE public.webhook_deliveries ADD CONSTRAINT fk_webhook_deliveries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_deliveries_webhook_id_fkey' AND conrelid = 'public.webhook_deliveries'::regclass
  ) THEN
    ALTER TABLE public.webhook_deliveries ADD CONSTRAINT webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS brin_webhook_deliveries_created_at ON public.webhook_deliveries USING brin (created_at) WITH (autosummarize='on');

CREATE INDEX IF NOT EXISTS idx_wd_webhook_id ON public.webhook_deliveries USING btree (webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON public.webhook_deliveries USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at_desc ON public.webhook_deliveries USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_failed ON public.webhook_deliveries USING btree (status, created_at) WHERE ((status)::text = 'failed'::text);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON public.webhook_deliveries USING btree (next_retry_at) WHERE (next_retry_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry_at ON public.webhook_deliveries USING btree (next_retry_at);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_payload_gin ON public.webhook_deliveries USING gin (payload);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON public.webhook_deliveries USING btree (status, next_retry_at) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'retrying'::character varying])::text[]));

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending_retry ON public.webhook_deliveries USING btree (webhook_id, next_retry_at) WHERE (((status)::text = 'failed'::text) AND (next_retry_at IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries USING btree (status);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant_created_at ON public.webhook_deliveries USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant_id ON public.webhook_deliveries USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant_status_next_retry ON public.webhook_deliveries USING btree (tenant_id, status, next_retry_at);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant_webhook ON public.webhook_deliveries USING btree (tenant_id, webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_created_desc ON public.webhook_deliveries USING btree (webhook_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_day ON public.webhook_deliveries USING btree (webhook_id, created_at);

CREATE TABLE IF NOT EXISTS public.webhook_payloads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  adapter varchar NOT NULL,
  tenant_id uuid NOT NULL,
  payload jsonb NOT NULL,
  signature varchar,
  received_at timestamptz DEFAULT now(),
  processed bool DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_webhook_payloads_tenant' AND conrelid = 'public.webhook_payloads'::regclass
  ) THEN
    ALTER TABLE public.webhook_payloads ADD CONSTRAINT fk_webhook_payloads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_payloads_tenant_id_fkey' AND conrelid = 'public.webhook_payloads'::regclass
  ) THEN
    ALTER TABLE public.webhook_payloads ADD CONSTRAINT webhook_payloads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_payloads_created_at_desc ON public.webhook_payloads USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_payloads_processed_received ON public.webhook_payloads USING btree (processed, received_at);

CREATE INDEX IF NOT EXISTS idx_webhook_payloads_tenant_created_at ON public.webhook_payloads USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_payloads_tenant_id ON public.webhook_payloads USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  url varchar NOT NULL,
  secret varchar NOT NULL,
  status varchar DEFAULT 'active'::character varying,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  events jsonb DEFAULT '[]'::jsonb,
  deleted_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_webhooks_tenant' AND conrelid = 'public.webhooks'::regclass
  ) THEN
    ALTER TABLE public.webhooks ADD CONSTRAINT fk_webhooks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhooks_tenant_id_fkey' AND conrelid = 'public.webhooks'::regclass
  ) THEN
    ALTER TABLE public.webhooks ADD CONSTRAINT webhooks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhooks_user_id_fkey' AND conrelid = 'public.webhooks'::regclass
  ) THEN
    ALTER TABLE public.webhooks ADD CONSTRAINT webhooks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhooks_tenant_url_key' AND conrelid = 'public.webhooks'::regclass
  ) THEN
    ALTER TABLE public.webhooks ADD CONSTRAINT webhooks_tenant_url_key UNIQUE (tenant_id, url);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhooks_created_at_desc ON public.webhooks USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhooks_deleted_at ON public.webhooks USING btree (deleted_at);

CREATE INDEX IF NOT EXISTS idx_webhooks_deleted_at_null ON public.webhooks USING btree (created_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_webhooks_status ON public.webhooks USING btree (status);

CREATE INDEX IF NOT EXISTS idx_webhooks_status_active ON public.webhooks USING btree (status) WHERE ((status)::text = 'active'::text);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON public.webhooks USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_created_at ON public.webhooks USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON public.webhooks USING btree (tenant_id, id);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_status ON public.webhooks USING btree (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS webhooks_tenant_url_key ON public.webhooks USING btree (tenant_id, url);

CREATE TABLE IF NOT EXISTS public.weekly_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  summary jsonb NOT NULL,
  metrics_snapshot jsonb NOT NULL,
  events_summary jsonb DEFAULT '{}'::jsonb,
  delta_summary jsonb DEFAULT '{}'::jsonb,
  risks jsonb DEFAULT '[]'::jsonb,
  required_actions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_snapshots_week_start_key' AND conrelid = 'public.weekly_snapshots'::regclass
  ) THEN
    ALTER TABLE public.weekly_snapshots ADD CONSTRAINT weekly_snapshots_week_start_key UNIQUE (week_start);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_created_at ON public.weekly_snapshots USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_week_start ON public.weekly_snapshots USING btree (week_start DESC);

CREATE UNIQUE INDEX IF NOT EXISTS weekly_snapshots_week_start_key ON public.weekly_snapshots USING btree (week_start);

CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  workflow_id varchar NOT NULL,
  workflow_name varchar,
  workflow_version varchar,
  status varchar NOT NULL DEFAULT 'running'::character varying,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  triggered_by varchar,
  trigger_event jsonb,
  execution_graph jsonb,
  step_results jsonb DEFAULT '{}'::jsonb,
  error_message text,
  error_stack text,
  duration_ms int8,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workflow_runs_tenant_id_fkey' AND conrelid = 'public.workflow_runs'::regclass
  ) THEN
    ALTER TABLE public.workflow_runs ADD CONSTRAINT workflow_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at_desc ON public.workflow_runs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_metadata_gin ON public.workflow_runs USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON public.workflow_runs USING btree (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON public.workflow_runs USING btree (status);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_tenant_id ON public.workflow_runs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_tenant_workflow_started ON public.workflow_runs USING btree (tenant_id, workflow_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON public.workflow_runs USING btree (workflow_id);

-- ============================================================================
-- APPLICATION FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION net._await_response(request_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
declare
    rec net._http_response;
begin
    while rec is null loop
        select *
        into rec
        from net._http_response
        where id = request_id;

        if rec is null then
            -- Wait 50 ms before checking again
            perform pg_sleep(0.05);
        end if;
    end loop;

    return true;
end;
$function$;

CREATE OR REPLACE FUNCTION pgmq._belongs_to_pgmq(table_name text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    sql TEXT;
    result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_depend
    WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pgmq')
    AND objid = (
        SELECT oid
        FROM pg_class
        WHERE relname = table_name
    )
  ) INTO result;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public._column_exists(p_table text, p_column text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
  );
$function$;

CREATE OR REPLACE FUNCTION public._drop_policy_if_exists(in_schema text, in_table text, in_policy text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = in_schema AND p.tablename = in_table AND p.policyname = in_policy
  ) THEN
    EXECUTE format('DROP POLICY %I ON %I.%I', in_policy, in_schema, in_table);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION net._encode_url_with_params_array(url text, params_array text[])
 RETURNS text
 LANGUAGE c
 IMMUTABLE
AS 'pg_net', $function$_encode_url_with_params_array$function$;

CREATE OR REPLACE FUNCTION pgmq._ensure_pg_partman_installed()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NOT pgmq._extension_exists('pg_partman') THEN
    RAISE EXCEPTION 'pg_partman is required for partitioned queues';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq._extension_exists(extension_name text)
 RETURNS boolean
 LANGUAGE sql
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = extension_name
)
$function$;

CREATE OR REPLACE FUNCTION pgmq._get_partition_col(partition_interval text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  num INTEGER;
BEGIN
    BEGIN
        num := partition_interval::INTEGER;
        RETURN 'msg_id';
    EXCEPTION
        WHEN others THEN
            RETURN 'enqueued_at';
    END;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq._get_pg_partman_major_version()
 RETURNS integer
 LANGUAGE sql
AS $function$
  SELECT split_part(extversion, '.', 1)::INT
  FROM pg_extension
  WHERE extname = 'pg_partman'
$function$;

CREATE OR REPLACE FUNCTION pgmq._get_pg_partman_schema()
 RETURNS text
 LANGUAGE sql
AS $function$
  SELECT
    extnamespace::regnamespace::text
  FROM
    pg_extension
  WHERE
    extname = 'pg_partman';
$function$;

CREATE OR REPLACE FUNCTION net._http_collect_response(request_id bigint, async boolean DEFAULT true)
 RETURNS net.http_response_result
 LANGUAGE plpgsql
AS $function$
declare
    rec net._http_response;
    req_exists boolean;
begin

    if not async then
        perform net._await_response(request_id);
    end if;

    select *
    into rec
    from net._http_response
    where id = request_id;

    if rec is null or rec.error_msg is not null then
        -- The request is either still processing or the request_id provided does not exist

        -- TODO: request in progress is indistinguishable from request that doesn't exist

        -- No request matching request_id found
        return (
            'ERROR',
            coalesce(rec.error_msg, 'request matching request_id not found'),
            null
        )::net.http_response_result;

    end if;

    -- Return a valid, populated http_response_result
    return (
        'SUCCESS',
        'ok',
        (
            rec.status_code,
            rec.headers,
            rec.content
        )::net.http_response
    )::net.http_response_result;
end;
$function$;

CREATE OR REPLACE FUNCTION app_private._redact_email_safe(input text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT CASE WHEN input IS NULL OR input = '' THEN input
              ELSE regexp_replace(input, '(^.).*(@.*$)', '\1***\2') END;
$function$;

CREATE OR REPLACE FUNCTION public._table_exists(p_table text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  );
$function$;

CREATE OR REPLACE FUNCTION net._urlencode_string(string character varying)
 RETURNS text
 LANGUAGE c
 IMMUTABLE
AS 'pg_net', $function$_urlencode_string$function$;

CREATE OR REPLACE FUNCTION public.accept_email_invite(p_tenant_id uuid, p_token text)
 RETURNS memberships
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_email text;
  v_role text;
  v_row public.memberships;
BEGIN
  SELECT email::text, role
  INTO v_email, v_role
  FROM public.email_invites
  WHERE tenant_id = p_tenant_id AND token = p_token AND (expires_at IS NULL OR expires_at > now()) AND accepted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired invite';
  END IF;

  IF lower(v_email) <> lower((SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))) THEN
    RAISE EXCEPTION 'this invite is for a different email';
  END IF;

  INSERT INTO public.memberships (tenant_id, user_id, role, status)
  VALUES (p_tenant_id, (SELECT auth.uid()), v_role, 'active')
  ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        status = 'active',
        updated_at = now()
  RETURNING * INTO v_row;

  UPDATE public.email_invites
  SET accepted_at = now(), updated_at = now()
  WHERE tenant_id = p_tenant_id AND token = p_token;

  RETURN v_row;
END;$function$;

CREATE OR REPLACE FUNCTION public.accept_membership_invite(p_tenant_id uuid, p_token text)
 RETURNS memberships
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_row public.memberships;
BEGIN
  UPDATE public.memberships m
  SET status = 'active', invite_token = NULL, invite_expires_at = NULL, updated_at = NOW()
  WHERE m.tenant_id = p_tenant_id
    AND m.user_id = (SELECT auth.uid())
    AND m.invite_token = p_token
    AND (m.invite_expires_at IS NULL OR m.invite_expires_at > NOW())
  RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired invite';
  END IF;
  RETURN v_row;
END;$function$;

CREATE OR REPLACE FUNCTION public.accept_recommendation(p_recommendation_id uuid, p_accepted_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.ops_recommendations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = p_accepted_by,
    updated_at = NOW()
  WHERE id = p_recommendation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_recent_messages(p_limit integer DEFAULT 50)
 RETURNS SETOF messages
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.v_admin_recent_messages LIMIT GREATEST(p_limit, 1);
$function$;

CREATE OR REPLACE FUNCTION public.aggregate_daily_usage(p_start_date date DEFAULT (CURRENT_DATE - '1 day'::interval), p_end_date date DEFAULT (CURRENT_DATE - '1 day'::interval))
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_aggregated_count INTEGER := 0;
  v_record RECORD;
BEGIN
  -- Aggregate unaggregated events for the date range
  FOR v_record IN
    SELECT
      billing_account_id,
      project_id,
      tenant_id,
      DATE(timestamp) as event_date,
      event_type,
      integration_id,
      add_on_id,
      SUM(quantity) as total_quantity,
      COUNT(*) as event_count
    FROM usage_events
    WHERE DATE(timestamp) >= p_start_date
      AND DATE(timestamp) <= p_end_date
      AND aggregated = false
    GROUP BY
      billing_account_id,
      project_id,
      tenant_id,
      DATE(timestamp),
      event_type,
      integration_id,
      add_on_id
  LOOP
    -- Upsert into daily aggregates
    INSERT INTO usage_aggregate_daily (
      billing_account_id,
      project_id,
      tenant_id,
      date,
      event_type,
      integration_id,
      add_on_id,
      total_quantity,
      event_count
    ) VALUES (
      v_record.billing_account_id,
      v_record.project_id,
      v_record.tenant_id,
      v_record.event_date,
      v_record.event_type,
      v_record.integration_id,
      v_record.add_on_id,
      v_record.total_quantity,
      v_record.event_count
    )
    ON CONFLICT (billing_account_id, project_id, date, event_type, integration_id, add_on_id)
    DO UPDATE SET
      total_quantity = usage_aggregate_daily.total_quantity + v_record.total_quantity,
      event_count = usage_aggregate_daily.event_count + v_record.event_count,
      updated_at = NOW();

    -- Mark events as aggregated
    UPDATE usage_events
    SET aggregated = true
    WHERE billing_account_id = v_record.billing_account_id
      AND (project_id = v_record.project_id OR (project_id IS NULL AND v_record.project_id IS NULL))
      AND DATE(timestamp) = v_record.event_date
      AND event_type = v_record.event_type
      AND (integration_id = v_record.integration_id OR (integration_id IS NULL AND v_record.integration_id IS NULL))
      AND (add_on_id = v_record.add_on_id OR (add_on_id IS NULL AND v_record.add_on_id IS NULL))
      AND aggregated = false;

    v_aggregated_count := v_aggregated_count + 1;
  END LOOP;

  RETURN v_aggregated_count;
END;
$function$;

CREATE OR REPLACE FUNCTION cron.alter_job(job_id bigint, schedule text DEFAULT NULL::text, command text DEFAULT NULL::text, database text DEFAULT NULL::text, username text DEFAULT NULL::text, active boolean DEFAULT NULL::boolean)
 RETURNS void
 LANGUAGE c
AS '$libdir/pg_cron', $function$cron_alter_job$function$;

CREATE OR REPLACE FUNCTION public.api_create_receipt(p_tenant uuid, p_external_id text, p_currency text, p_total numeric, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'pg_temp', 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_receipt_id uuid;
BEGIN
  INSERT INTO public.receipts(id, tenant_id, external_id, currency, total_amount, metadata)
  VALUES (gen_random_uuid(), p_tenant, p_external_id, p_currency, p_total, COALESCE(p_metadata,'{}'::jsonb))
  RETURNING id INTO v_receipt_id;

  INSERT INTO public.receipt_events(tenant_id, type, receipt_id, payload)
  VALUES (p_tenant, 'receipt.created', v_receipt_id, jsonb_build_object('external_id', p_external_id));

  RETURN v_receipt_id;
END;$function$;

CREATE OR REPLACE FUNCTION app_private.api_keys_encrypt_secret()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF NEW.secret IS NOT NULL THEN
    NEW.secret_enc := app_private.encrypt_text(NEW.secret);
    NEW.secret := '***';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.api_keys_set_is_active()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.is_active := (NEW.revoked_at IS NULL AND (NEW.expires_at IS NULL OR NEW.expires_at > now()));
  RETURN NEW;
END;$function$;

CREATE OR REPLACE FUNCTION public.api_list_receipts(p_tenant uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS SETOF receipts
 LANGUAGE sql
 SET search_path TO 'pg_temp', 'public', 'auth', 'extensions'
AS $function$
  SELECT * FROM public.receipts r
  WHERE r.tenant_id = p_tenant
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

CREATE OR REPLACE FUNCTION public.api_record_receipt_processed(p_tenant uuid, p_receipt uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'pg_temp', 'public', 'auth', 'extensions'
AS $function$
  INSERT INTO public.receipt_events(tenant_id, type, receipt_id, payload)
  VALUES (p_tenant, 'receipt.processed', p_receipt, COALESCE(p_payload,'{}'::jsonb));
$function$;

CREATE OR REPLACE FUNCTION app_private.apply_org_rls_for_org(table_schema text, table_name text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  execute format('alter table %I.%I enable row level security', table_schema, table_name);
  perform 1 from pg_policies where schemaname=table_schema and tablename=table_name and policyname in ('Org read','Org write','Org update','Org delete');
  if found then
    execute format('drop policy if exists "Org read" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org write" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org update" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org delete" on %I.%I', table_schema, table_name);
  end if;
  execute format('grant select, insert, update, delete on %I.%I to authenticated', table_schema, table_name);
  execute format('create policy "Org read" on %I.%I for select to authenticated using (org_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org write" on %I.%I for insert to authenticated with check (org_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org update" on %I.%I for update to authenticated using (org_id in (select public.get_user_org_ids())) with check (org_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org delete" on %I.%I for delete to authenticated using (org_id in (select public.get_user_org_ids()))', table_schema, table_name);
end; $function$;

CREATE OR REPLACE FUNCTION app_private.apply_org_rls_for_tenant(table_schema text, table_name text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  execute format('alter table %I.%I enable row level security', table_schema, table_name);
  -- drop existing org policies if present
  perform 1 from pg_policies where schemaname=table_schema and tablename=table_name and policyname in ('Org read','Org write','Org update','Org delete');
  if found then
    execute format('drop policy if exists "Org read" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org write" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org update" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org delete" on %I.%I', table_schema, table_name);
  end if;
  -- grants
  execute format('grant select, insert, update, delete on %I.%I to authenticated', table_schema, table_name);
  -- create org-based policies using tenant_id
  execute format('create policy "Org read" on %I.%I for select to authenticated using (tenant_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org write" on %I.%I for insert to authenticated with check (tenant_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org update" on %I.%I for update to authenticated using (tenant_id in (select public.get_user_org_ids())) with check (tenant_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org delete" on %I.%I for delete to authenticated using (tenant_id in (select public.get_user_org_ids()))', table_schema, table_name);
end; $function$;

CREATE OR REPLACE FUNCTION pgmq.archive(queue_name text, msg_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    sql TEXT;
    result BIGINT;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
    atable TEXT := pgmq.format_table_name(queue_name, 'a');
BEGIN
    sql := FORMAT(
        $QUERY$
        WITH archived AS (
            DELETE FROM pgmq.%I
            WHERE msg_id = $1
            RETURNING msg_id, vt, read_ct, enqueued_at, message, headers
        )
        INSERT INTO pgmq.%I (msg_id, vt, read_ct, enqueued_at, message, headers)
        SELECT msg_id, vt, read_ct, enqueued_at, message, headers
        FROM archived
        RETURNING msg_id;
        $QUERY$,
        qtable, atable
    );
    EXECUTE sql USING msg_id INTO result;
    RETURN NOT (result IS NULL);
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq_public.archive(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return pgmq.archive( queue_name := queue_name, msg_id := message_id ); end; $function$;

CREATE OR REPLACE FUNCTION public.audit_billing_account_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current user from JWT (if available)
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Log the change
  PERFORM log_audit_event(
    p_tenant_id => v_tenant_id,
    p_user_id => v_user_id,
    p_event => CASE
      WHEN TG_OP = 'INSERT' THEN 'billing_account.created'
      WHEN TG_OP = 'UPDATE' THEN 'billing_account.updated'
      WHEN TG_OP = 'DELETE' THEN 'billing_account.deleted'
    END,
    p_action_type => LOWER(TG_OP),
    p_resource_type => 'billing_account',
    p_resource_id => COALESCE(NEW.id, OLD.id),
    p_billing_account_id => COALESCE(NEW.id, OLD.id),
    p_metadata => jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_stripe_customer_id', OLD.stripe_customer_id,
      'new_stripe_customer_id', NEW.stripe_customer_id
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_integration_credential_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  PERFORM log_audit_event(
    p_tenant_id => v_tenant_id,
    p_user_id => v_user_id,
    p_event => CASE
      WHEN TG_OP = 'INSERT' THEN 'integration_credential.created'
      WHEN TG_OP = 'UPDATE' THEN 'integration_credential.updated'
      WHEN TG_OP = 'DELETE' THEN 'integration_credential.deleted'
    END,
    p_action_type => LOWER(TG_OP),
    p_resource_type => 'integration_credential',
    p_resource_id => COALESCE(NEW.id, OLD.id),
    p_integration_id => COALESCE(NEW.integration_id, OLD.integration_id),
    p_metadata => jsonb_build_object(
      'integration_id', COALESCE(NEW.integration_id, OLD.integration_id),
      'credential_type', COALESCE(NEW.credential_type, OLD.credential_type),
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.audit_logs_sign_row()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.row_sig := app_private.compute_audit_row_sig(to_jsonb(NEW) - 'row_sig');
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION app_private.audit_logs_verify_row()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_expected bytea; BEGIN
  v_expected := app_private.compute_audit_row_sig(to_jsonb(NEW) - 'row_sig');
  IF NEW.row_sig IS DISTINCT FROM v_expected THEN RAISE EXCEPTION 'audit_logs row signature mismatch'; END IF; RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.audit_subscription_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  PERFORM log_audit_event(
    p_tenant_id => v_tenant_id,
    p_user_id => v_user_id,
    p_event => CASE
      WHEN TG_OP = 'INSERT' THEN 'subscription.created'
      WHEN TG_OP = 'UPDATE' THEN 'subscription.updated'
      WHEN TG_OP = 'DELETE' THEN 'subscription.deleted'
    END,
    p_action_type => LOWER(TG_OP),
    p_resource_type => 'subscription',
    p_resource_id => COALESCE(NEW.id, OLD.id),
    p_billing_account_id => COALESCE(NEW.billing_account_id, OLD.billing_account_id),
    p_metadata => jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_plan_id', OLD.plan_id,
      'new_plan_id', NEW.plan_id
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'app_private', 'public', 'pg_catalog'
AS $function$
BEGIN
  INSERT INTO public.audit_logs(tenant_id, event, user_id, metadata)
  VALUES (COALESCE(NEW.tenant_id, OLD.tenant_id), TG_OP || ' ' || TG_TABLE_NAME, (SELECT auth.uid()), to_jsonb(COALESCE(NEW, OLD)));
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_archive_stale_content()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_stale RECORD;
  v_result jsonb := '[]'::jsonb;
  v_archived_count INTEGER := 0;
BEGIN
  -- Archive content that's been stale for 2x the threshold
  FOR v_stale IN
    SELECT *
    FROM staleness_checks
    WHERE is_stale = true
      AND auto_archived = false
      AND last_updated < NOW() - (staleness_threshold_days * 2 || ' days')::interval
    LIMIT 50
  LOOP
    BEGIN
      -- Archive based on content type
      CASE v_stale.content_type
        WHEN 'feature_flag' THEN
          -- Soft delete feature flag
          UPDATE feature_flags
          SET deleted_at = NOW()
          WHERE id = v_stale.content_id;
        
        WHEN 'api_key' THEN
          -- Don't auto-revoke API keys (security risk)
          -- Just flag for review
          NULL;
        
        ELSE
          -- For other types, just mark as archived
          NULL;
      END CASE;
      
      -- Mark as archived
      UPDATE staleness_checks
      SET 
        auto_archived = true,
        archived_at = NOW()
      WHERE id = v_stale.id;
      
      v_archived_count := v_archived_count + 1;
      v_result := v_result || jsonb_build_object(
        'content_type', v_stale.content_type,
        'content_id', v_stale.content_id,
        'action', 'archived'
      );
      
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object(
        'content_type', v_stale.content_type,
        'content_id', v_stale.content_id,
        'action', 'error',
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'archived_count', v_archived_count,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_disable_failing_integrations()
 RETURNS TABLE(tenant_id uuid, integration_id character varying, disabled boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.auto_resolve_confusion(p_confusion_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_confusion RECORD;
  v_help_content JSONB;
BEGIN
  SELECT * INTO v_confusion
  FROM user_confusion_events
  WHERE id = p_confusion_id
    AND resolved_at IS NULL;
  
  IF v_confusion IS NULL THEN
    RETURN jsonb_build_object('error', 'Confusion event not found or already resolved');
  END IF;
  
  -- Generate help content based on event type
  CASE v_confusion.event_type
    WHEN 'error_repeated' THEN
      v_help_content := jsonb_build_object(
        'title', 'Having trouble?',
        'message', 'We noticed you encountered some errors. Here are some helpful resources:',
        'links', jsonb_build_array(
          jsonb_build_object('text', 'API Documentation', 'url', '/docs/api'),
          jsonb_build_object('text', 'Common Issues', 'url', '/docs/troubleshooting'),
          jsonb_build_object('text', 'Contact Support', 'url', '/support')
        ),
        'suggested_action', 'Check the error logs in your console for details'
      );
    
    WHEN 'abandoned_flow' THEN
      v_help_content := jsonb_build_object(
        'title', 'Need help creating an API key?',
        'message', 'Creating an API key is quick and easy. Here''s a guide:',
        'links', jsonb_build_array(
          jsonb_build_object('text', 'API Key Guide', 'url', '/docs/api-keys'),
          jsonb_build_object('text', 'Quick Start', 'url', '/docs/quick-start')
        ),
        'suggested_action', 'Follow our step-by-step guide'
      );
    
    ELSE
      v_help_content := jsonb_build_object(
        'title', 'How can we help?',
        'message', 'Check out our documentation or contact support.',
        'links', jsonb_build_array(
          jsonb_build_object('text', 'Documentation', 'url', '/docs'),
          jsonb_build_object('text', 'Support', 'url', '/support')
        )
      );
  END CASE;
  
  -- Update confusion event
  UPDATE user_confusion_events
  SET
    auto_resolved = true,
    resolved_at = NOW(),
    help_provided = v_help_content
  WHERE id = p_confusion_id;
  
  -- Create in-app notification (would integrate with notification system)
  -- For now, we'll log it to console_activities
  INSERT INTO console_activities (
    billing_account_id,
    action,
    details
  )
  SELECT 
    v_confusion.billing_account_id,
    'help_provided',
    jsonb_build_object(
      'confusion_event_id', p_confusion_id,
      'help_content', v_help_content
    )
  WHERE v_confusion.billing_account_id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'confusion_id', p_confusion_id,
    'help_provided', v_help_content
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.broadcast_message_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'room:' || COALESCE(NEW.room_id, OLD.room_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.broadcast_receipt_events_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'tenant:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text || ':receipt_events',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;$function$;

CREATE OR REPLACE FUNCTION public.broadcast_receipt_items_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'tenant:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text || ':receipt_items',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;$function$;

CREATE OR REPLACE FUNCTION public.broadcast_receipt_outbox_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'tenant:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text || ':receipt_webhook_outbox',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;$function$;

CREATE OR REPLACE FUNCTION public.broadcast_receipts_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'tenant:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text || ':receipts',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;$function$;

CREATE OR REPLACE FUNCTION public.broadcast_row_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare
  v_tenant_id uuid := coalesce(new.tenant_id, old.tenant_id);
  v_topic text;
begin
  if v_tenant_id is null then
    return coalesce(new, old);
  end if;
  v_topic := 'tenant:' || v_tenant_id::text || ':table:' || tg_table_name;
  perform realtime.broadcast_changes(
    v_topic,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.bump_message_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.conversations SET message_count = message_count + 1
    WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.conversations SET message_count = GREATEST(0, message_count - 1)
    WHERE id = OLD.conversation_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $function$;

CREATE OR REPLACE FUNCTION app_private.bump_rate_usage(p_tenant uuid, p_key text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_min timestamptz := date_trunc('minute', now());
        v_day date := current_date;
begin
  insert into public.rate_usage(tenant_id, key, ts_minute, count_minute, ts_day, count_day)
  values (p_tenant, p_key, v_min, 1, v_day, 1)
  on conflict (tenant_id, key, ts_minute)
  do update set count_minute = public.rate_usage.count_minute + 1;

  insert into public.rate_usage(tenant_id, key, ts_day, count_day, ts_minute, count_minute)
  values (p_tenant, p_key, v_day, 1, v_min, 1)
  on conflict (tenant_id, key, ts_day)
  do update set count_day = public.rate_usage.count_day + 1;
end $function$;

CREATE OR REPLACE FUNCTION app_private.bump_tenant_usage_receipt_uploads()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  insert into public.tenant_usage(tenant_id, created_at, metric, amount)
  values (new.tenant_id, now(), 'receipt_upload', 1);
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.calculate_account_balance(p_tenant_id uuid, p_account_type character varying, p_currency character varying DEFAULT 'USD'::character varying)
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_balance BIGINT;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN entry_type = 'credit' THEN amount_cents
      WHEN entry_type = 'debit' THEN -amount_cents
      ELSE 0
    END
  ), 0) INTO v_balance
  FROM financial_ledger
  WHERE tenant_id = p_tenant_id
    AND account_type = p_account_type
    AND currency = p_currency;
  
  RETURN v_balance;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_lead_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_score INTEGER := 0;
  v_lead RECORD;
  v_activity_count INTEGER;
  v_days_since_created INTEGER;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead
  FROM leads
  WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Base score from lifecycle stage
  CASE v_lead.lifecycle_stage
    WHEN 'customer' THEN v_score := v_score + 100;
    WHEN 'sql' THEN v_score := v_score + 75;
    WHEN 'mql' THEN v_score := v_score + 50;
    WHEN 'lead' THEN v_score := v_score + 25;
    WHEN 'subscriber' THEN v_score := v_score + 10;
    ELSE v_score := v_score + 5;
  END CASE;
  
  -- Score from status
  CASE v_lead.status
    WHEN 'qualified' THEN v_score := v_score + 30;
    WHEN 'contacted' THEN v_score := v_score + 20;
    WHEN 'engaged' THEN v_score := v_score + 15;
    WHEN 'new' THEN v_score := v_score + 5;
    ELSE v_score := v_score + 0;
  END CASE;
  
  -- Score from activity (number of activities)
  SELECT COUNT(*) INTO v_activity_count
  FROM activity_logs
  WHERE entity_type = 'lead'
    AND entity_id = p_lead_id;
  
  v_score := v_score + LEAST(v_activity_count * 5, 25); -- Max 25 points for activity
  
  -- Score from recency (newer leads get bonus)
  v_days_since_created := EXTRACT(DAY FROM NOW() - v_lead.created_at);
  IF v_days_since_created <= 7 THEN
    v_score := v_score + 15;
  ELSIF v_days_since_created <= 30 THEN
    v_score := v_score + 10;
  ELSIF v_days_since_created <= 90 THEN
    v_score := v_score + 5;
  END IF;
  
  -- Score from metadata (custom fields)
  IF v_lead.metadata ? 'company_size' THEN
    CASE v_lead.metadata->>'company_size'
      WHEN 'enterprise' THEN v_score := v_score + 20;
      WHEN 'large' THEN v_score := v_score + 15;
      WHEN 'medium' THEN v_score := v_score + 10;
      WHEN 'small' THEN v_score := v_score + 5;
    END CASE;
  END IF;
  
  -- Cap score at 200
  v_score := LEAST(v_score, 200);
  
  RETURN v_score;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_positioning_impact_score(p_feedback_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_score INTEGER := 0;
  v_feedback RECORD;
  v_user_profile RECORD;
BEGIN
  -- Get feedback data
  SELECT * INTO v_feedback
  FROM positioning_feedback
  WHERE id = p_feedback_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Base score from clarity rating (1-10 scale, multiply by 10)
  v_score := COALESCE(v_feedback.clarity_rating, 0) * 10;
  
  -- Bonus if 5-word VP is provided (max 20 points)
  IF v_feedback.five_word_vp IS NOT NULL AND LENGTH(TRIM(v_feedback.five_word_vp)) > 0 THEN
    v_score := v_score + 20;
  END IF;
  
  -- Bonus if target persona pain is provided (max 15 points)
  IF v_feedback.target_persona_pain IS NOT NULL AND LENGTH(TRIM(v_feedback.target_persona_pain)) > 50 THEN
    v_score := v_score + 15;
  END IF;
  
  -- Bonus if feedback text is detailed (max 15 points)
  IF v_feedback.feedback_text IS NOT NULL AND LENGTH(TRIM(v_feedback.feedback_text)) > 100 THEN
    v_score := v_score + 15;
  END IF;
  
  -- Get user profile for additional scoring
  IF v_feedback.user_id IS NOT NULL THEN
    SELECT * INTO v_user_profile
    FROM profiles
    WHERE id = v_feedback.user_id;
    
    -- Bonus for users with higher existing impact scores
    IF v_user_profile.impact_score > 50 THEN
      v_score := v_score + 10;
    ELSIF v_user_profile.impact_score > 20 THEN
      v_score := v_score + 5;
    END IF;
  END IF;
  
  -- Cap score at 100
  v_score := LEAST(v_score, 100);
  
  RETURN v_score;
END;
$function$;

CREATE OR REPLACE FUNCTION analytics.capture_index_usage()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'analytics', 'public'
AS $function$
BEGIN
  INSERT INTO analytics.index_usage_snapshots (
    schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch,
    relpages, indisunique, indisprimary, pg_size_bytes, captured_at
  )
  SELECT
    s.schemaname,
    s.relname,
    s.indexrelname,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch,
    c.relpages,
    i.indisunique,
    i.indisprimary,
    pg_relation_size(s.indexrelid) AS pg_size_bytes,
    now()
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON i.indexrelid = s.indexrelid
  JOIN pg_class c ON c.oid = s.indexrelid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_ai_quota(p_tenant_id uuid, p_billing_account_id uuid, p_estimated_cost_usd numeric DEFAULT 0.001)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_quota RECORD;
  v_result JSONB;
  v_daily_reset_needed BOOLEAN := false;
  v_monthly_reset_needed BOOLEAN := false;
BEGIN
  -- Get or create quota
  SELECT * INTO v_quota
  FROM ai_usage_quotas
  WHERE tenant_id = p_tenant_id
    AND billing_account_id = p_billing_account_id;

  -- Create quota if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO ai_usage_quotas (tenant_id, billing_account_id)
    VALUES (p_tenant_id, p_billing_account_id)
    RETURNING * INTO v_quota;
  END IF;

  -- Check if suspended
  IF v_quota.suspended THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'AI usage suspended: ' || COALESCE(v_quota.suspended_reason, 'Unknown reason')
    );
  END IF;

  -- Check daily reset
  IF v_quota.daily_reset_date < CURRENT_DATE THEN
    v_daily_reset_needed := true;
    UPDATE ai_usage_quotas
    SET daily_requests = 0,
        daily_cost_usd = 0,
        daily_reset_date = CURRENT_DATE
    WHERE id = v_quota.id
    RETURNING * INTO v_quota;
  END IF;

  -- Check monthly reset
  IF v_quota.monthly_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    v_monthly_reset_needed := true;
    UPDATE ai_usage_quotas
    SET monthly_requests = 0,
        monthly_cost_usd = 0,
        monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
    WHERE id = v_quota.id
    RETURNING * INTO v_quota;
  END IF;

  -- Check daily limits
  IF v_quota.daily_requests >= v_quota.daily_request_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Daily request limit exceeded',
      'limit', v_quota.daily_request_limit,
      'current', v_quota.daily_requests
    );
  END IF;

  IF v_quota.daily_cost_usd + p_estimated_cost_usd > v_quota.daily_cost_limit_usd THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Daily cost limit exceeded',
      'limit', v_quota.daily_cost_limit_usd,
      'current', v_quota.daily_cost_usd,
      'estimated', p_estimated_cost_usd
    );
  END IF;

  -- Check monthly limits
  IF v_quota.monthly_requests >= v_quota.monthly_request_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Monthly request limit exceeded',
      'limit', v_quota.monthly_request_limit,
      'current', v_quota.monthly_requests
    );
  END IF;

  IF v_quota.monthly_cost_usd + p_estimated_cost_usd > v_quota.monthly_cost_limit_usd THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Monthly cost limit exceeded',
      'limit', v_quota.monthly_cost_limit_usd,
      'current', v_quota.monthly_cost_usd,
      'estimated', p_estimated_cost_usd
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'daily_remaining_requests', v_quota.daily_request_limit - v_quota.daily_requests,
    'daily_remaining_cost', v_quota.daily_cost_limit_usd - v_quota.daily_cost_usd,
    'monthly_remaining_requests', v_quota.monthly_request_limit - v_quota.monthly_requests,
    'monthly_remaining_cost', v_quota.monthly_cost_limit_usd - v_quota.monthly_cost_usd
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_and_suspend_abusive_accounts()
 RETURNS TABLE(billing_account_id uuid, fraud_signal_count bigint, suspended boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_record RECORD;
BEGIN
  -- Find accounts with multiple high-severity fraud signals in last 24 hours
  FOR v_record IN
    SELECT
      fs.billing_account_id,
      COUNT(*) as signal_count,
      COUNT(*) FILTER (WHERE fs.severity IN ('high', 'critical')) as high_severity_count
    FROM fraud_signals fs
    WHERE fs.created_at >= NOW() - INTERVAL '24 hours'
      AND fs.resolved = false
    GROUP BY fs.billing_account_id
    HAVING COUNT(*) >= 3 OR COUNT(*) FILTER (WHERE fs.severity IN ('high', 'critical')) >= 2
  LOOP
    -- Suspend billing account
    UPDATE billing_accounts
    SET status = 'suspended',
        updated_at = NOW()
    WHERE id = v_record.billing_account_id
      AND status = 'active';

    -- Return result
    billing_account_id := v_record.billing_account_id;
    fraud_signal_count := v_record.signal_count;
    suspended := true;
    RETURN NEXT;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_circuit_breaker(p_service_name character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_breaker RECORD;
BEGIN
  SELECT * INTO v_breaker
  FROM circuit_breakers
  WHERE service_name = p_service_name;
  
  IF v_breaker IS NULL THEN
    RETURN true; -- No breaker exists, allow request
  END IF;
  
  -- If closed, allow
  IF v_breaker.status = 'closed' THEN
    RETURN true;
  END IF;
  
  -- If open, check timeout
  IF v_breaker.status = 'open' THEN
    IF v_breaker.opened_at IS NULL OR 
       NOW() - v_breaker.opened_at < INTERVAL '1 second' * v_breaker.timeout_seconds THEN
      RETURN false; -- Still in timeout period
    ELSE
      -- Timeout expired, move to half-open
      UPDATE circuit_breakers
      SET 
        status = 'half_open',
        success_count = 0,
        updated_at = NOW()
      WHERE id = v_breaker.id;
      RETURN true; -- Allow one request to test
    END IF;
  END IF;
  
  -- If half-open, allow (testing)
  IF v_breaker.status = 'half_open' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_critical_job_failures()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_critical_failures INTEGER;
  v_result jsonb;
BEGIN
  -- Count jobs that have failed after max retries in last 24 hours
  SELECT COUNT(*) INTO v_critical_failures
  FROM job_failure_log
  WHERE status = 'failed'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  IF v_critical_failures > 0 THEN
    -- Trigger alert
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'critical',
      'Critical Job Failures Detected',
      format('%s jobs have failed after max retries in the last 24 hours', v_critical_failures),
      'job_failure',
      jsonb_build_object(
        'failure_count', v_critical_failures,
        'check_time', NOW()
      )
    );
    
    v_result := jsonb_build_object(
      'alert_triggered', true,
      'failure_count', v_critical_failures
    );
  ELSE
    v_result := jsonb_build_object(
      'alert_triggered', false,
      'failure_count', 0
    );
  END IF;
  
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_data_freshness()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_freshness RECORD;
  v_result jsonb := '{}'::jsonb;
BEGIN
  -- Check health checks freshness (should run every 5 minutes)
  SELECT 
    MAX(timestamp) as last_check,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '10 minutes') as recent_checks
  INTO v_freshness
  FROM health_checks
  WHERE timestamp > NOW() - INTERVAL '1 hour';
  
  IF v_freshness.last_check IS NULL OR 
     v_freshness.last_check < NOW() - INTERVAL '10 minutes' THEN
    -- Health checks are stale
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'high',
      'Health Checks Stale',
      format('Last health check was %s minutes ago', 
        EXTRACT(EPOCH FROM (NOW() - COALESCE(v_freshness.last_check, NOW()))) / 60),
      'data_freshness',
      jsonb_build_object(
        'last_check', v_freshness.last_check,
        'recent_checks', v_freshness.recent_checks
      )
    );
    
    v_result := v_result || jsonb_build_object(
      'health_checks', jsonb_build_object(
        'stale', true,
        'last_check', v_freshness.last_check
      )
    );
  END IF;
  
  -- Check agent runs freshness
  SELECT 
    MAX(started_at) as last_run,
    COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '1 hour') as recent_runs
  INTO v_freshness
  FROM agent_runs
  WHERE started_at > NOW() - INTERVAL '24 hours';
  
  IF v_freshness.last_run IS NULL OR 
     v_freshness.last_run < NOW() - INTERVAL '2 hours' THEN
    v_result := v_result || jsonb_build_object(
      'agent_runs', jsonb_build_object(
        'stale', true,
        'last_run', v_freshness.last_run
      )
    );
  END IF;
  
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_degraded_mode()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_open_breakers INTEGER;
  v_degraded_services JSONB := '[]'::jsonb;
BEGIN
  -- Count open circuit breakers
  SELECT COUNT(*) INTO v_open_breakers
  FROM circuit_breakers
  WHERE status = 'open';
  
  -- Get list of degraded services
  SELECT jsonb_agg(jsonb_build_object(
    'service_name', service_name,
    'status', status,
    'opened_at', opened_at
  )) INTO v_degraded_services
  FROM circuit_breakers
  WHERE status IN ('open', 'half_open');
  
  -- If critical services are down, enable degraded mode
  IF v_open_breakers > 0 THEN
    -- Update system status (would be in a system_status table)
    -- For now, create alert
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'critical',
      'Degraded Mode Active',
      format('%s services are currently degraded', v_open_breakers),
      'degraded_mode',
      jsonb_build_object(
        'degraded_services', v_degraded_services,
        'open_breakers', v_open_breakers
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'degraded_mode', v_open_breakers > 0,
    'degraded_services', v_degraded_services,
    'open_breakers', v_open_breakers
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier character varying, p_identifier_type character varying, p_endpoint character varying DEFAULT NULL::character varying, p_limit_count integer DEFAULT 100, p_window_seconds integer DEFAULT 60)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_limit RECORD;
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Calculate window start
  v_window_start := date_trunc('second', NOW() - 
    (EXTRACT(EPOCH FROM NOW())::bigint % p_window_seconds || ' seconds')::interval);
  
  -- Get or create rate limit record
  SELECT * INTO v_limit
  FROM rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND (endpoint = p_endpoint OR (endpoint IS NULL AND p_endpoint IS NULL))
    AND window_start = v_window_start
  FOR UPDATE;
  
  IF v_limit IS NULL THEN
    -- Create new window
    INSERT INTO rate_limits (
      identifier,
      identifier_type,
      endpoint,
      request_count,
      window_start,
      window_seconds,
      limit_count
    ) VALUES (
      p_identifier,
      p_identifier_type,
      p_endpoint,
      1,
      v_window_start,
      p_window_seconds,
      p_limit_count
    );
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_limit_count - 1,
      'reset_at', v_window_start + (p_window_seconds || ' seconds')::interval
    );
  ELSE
    -- Increment count
    v_current_count := v_limit.request_count + 1;
    
    UPDATE rate_limits
    SET 
      request_count = v_current_count,
      blocked = v_current_count > v_limit.limit_count,
      updated_at = NOW()
    WHERE id = v_limit.id;
    
    IF v_current_count > v_limit.limit_count THEN
      -- Rate limit exceeded
      RETURN jsonb_build_object(
        'allowed', false,
        'remaining', 0,
        'reset_at', v_limit.window_start + (v_limit.window_seconds || ' seconds')::interval,
        'limit_exceeded', true
      );
    ELSE
      RETURN jsonb_build_object(
        'allowed', true,
        'remaining', v_limit.limit_count - v_current_count,
        'reset_at', v_limit.window_start + (v_limit.window_seconds || ' seconds')::interval
      );
    END IF;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit_alerts()
 RETURNS TABLE(alert_id uuid, tenant_id uuid, rate_limit_exceeded boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_record RECORD;
  v_alert_id UUID;
  v_rule RECORD;
BEGIN
  -- This function would be called periodically to check for rate limit violations
  -- For now, it's a placeholder - actual implementation would query rate limit logs
  
  -- Find matching alert rule
  SELECT * INTO v_rule
  FROM alert_rules
  WHERE alert_type = 'rate_limit_exceeded'
    AND enabled = true
  LIMIT 1;

  IF v_rule IS NULL THEN
    RETURN;
  END IF;

  -- TODO: Query actual rate limit violations from logs/metrics
  -- For now, return empty result
  
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_tenant_quota(p_tenant_id uuid, p_quota_type text, p_requested_value bigint DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_quota_limit BIGINT;
  v_current_usage BIGINT;
  v_quotas JSONB;
BEGIN
  SELECT quotas INTO v_quotas FROM tenants WHERE id = p_tenant_id AND deleted_at IS NULL;
  
  IF v_quotas IS NULL THEN
    RETURN false;
  END IF;
  
  CASE p_quota_type
    WHEN 'rateLimitRpm' THEN
      RETURN true;
    WHEN 'storageBytes' THEN
      v_quota_limit := (v_quotas->>'storageBytes')::BIGINT;
      SELECT COALESCE(current_storage_bytes, 0) INTO v_current_usage
      FROM tenant_quota_usage WHERE tenant_id = p_tenant_id;
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    WHEN 'concurrentJobs' THEN
      v_quota_limit := (v_quotas->>'concurrentJobs')::BIGINT;
      SELECT COALESCE(current_concurrent_jobs, 0) INTO v_current_usage
      FROM tenant_quota_usage WHERE tenant_id = p_tenant_id;
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    WHEN 'monthlyReconciliations' THEN
      v_quota_limit := (v_quotas->>'monthlyReconciliations')::BIGINT;
      SELECT COALESCE(SUM(metric_value), 0) INTO v_current_usage
      FROM tenant_usage
      WHERE tenant_id = p_tenant_id
        AND metric_type = 'reconciliation'
        AND period_start >= date_trunc('month', NOW());
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    ELSE
      RETURN false;
  END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_upgrade_requirement(p_billing_account_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_result JSONB;
  v_current_period_start DATE;
  v_current_period_end DATE;
  v_record RECORD;
  v_warnings JSONB := '[]'::jsonb;
  v_should_upgrade BOOLEAN := false;
BEGIN
  -- Get current billing period
  SELECT current_period_start, current_period_end
  INTO v_current_period_start, v_current_period_end
  FROM subscriptions
  WHERE billing_account_id = p_billing_account_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_period_start IS NULL THEN
    RETURN jsonb_build_object('error', 'No active subscription found');
  END IF;

  -- Check usage against plan limits
  FOR v_record IN
    SELECT
      event_type,
      SUM(total_quantity) as total_quantity,
      CASE event_type
        WHEN 'reconciliation_job' THEN 10000
        WHEN 'api_request' THEN 100000
        WHEN 'webhook_event' THEN 50000
        WHEN 'db_query' THEN 500000
        WHEN 'ai_request' THEN 1000
        ELSE NULL
      END as plan_limit
    FROM usage_aggregate_daily
    WHERE billing_account_id = p_billing_account_id
      AND date >= v_current_period_start
      AND date <= v_current_period_end
      AND add_on_id IS NULL
    GROUP BY event_type
  LOOP
    IF v_record.plan_limit IS NOT NULL AND v_record.total_quantity >= v_record.plan_limit * 0.8 THEN
      v_warnings := v_warnings || jsonb_build_object(
        'event_type', v_record.event_type,
        'current_usage', v_record.total_quantity,
        'plan_limit', v_record.plan_limit,
        'percentage_used', ROUND((v_record.total_quantity / v_record.plan_limit) * 100, 2),
        'threshold', '80%'
      );
      IF v_record.total_quantity >= v_record.plan_limit THEN
        v_should_upgrade := true;
      END IF;
    END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'billing_account_id', p_billing_account_id,
    'should_upgrade', v_should_upgrade,
    'warnings', v_warnings,
    'period_start', v_current_period_start,
    'period_end', v_current_period_end
  );

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION net.check_worker_is_up()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  if not exists (select pid from pg_stat_activity where backend_type ilike '%pg_net%') then
    raise exception using
      message = 'the pg_net background worker is not up'
    , detail  = 'the pg_net background worker is down due to an internal error and cannot process requests'
    , hint    = 'make sure that you didn''t modify any of pg_net internal tables';
  end if;
end
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_artifacts()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM shareable_artifacts
  WHERE expires_at < NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_revoked_tokens()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM revoked_tokens WHERE expires_at < NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_agent_runs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM agent_runs
  WHERE started_at < NOW() - INTERVAL '90 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_alerts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM alerts
  WHERE resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '30 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '365 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_console_activities()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM console_activities
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_diagnostics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM diagnostics
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_health_checks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM health_checks
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Log cleanup
  INSERT INTO audit_logs (
    action,
    resource_type,
    metadata
  ) VALUES (
    'cleanup',
    'health_checks',
    jsonb_build_object(
      'deleted_before', NOW() - INTERVAL '90 days',
      'cleanup_type', 'retention_policy'
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_stripe_events()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM stripe_events
  WHERE received_at < NOW() - INTERVAL '90 days'
    AND status IN ('processed', 'failed');
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_usage_events()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  -- First, ensure all events older than 30 days are aggregated
  -- (This should be handled by daily aggregation job, but ensure it here)
  
  -- Delete aggregated events older than 30 days
  DELETE FROM usage_events
  WHERE aggregated = true
    AND timestamp < NOW() - INTERVAL '30 days';
  
  -- Delete unaggregated events older than 7 days (shouldn't happen, but safety net)
  DELETE FROM usage_events
  WHERE aggregated = false
    AND timestamp < NOW() - INTERVAL '7 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_deliveries()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM webhook_deliveries
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('delivered', 'failed');
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_stale_presence(minutes_threshold integer)
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'public', 'pg_temp'
AS $function$
  DELETE FROM public.user_presence WHERE last_seen < now() - make_interval(mins => minutes_threshold);
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_webhook_deliveries(retention_days integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_count int; begin
  delete from public.webhook_deliveries d
  using public.webhooks w
  where d.webhook_id = w.id
    and d.created_at < now() - make_interval(days => retention_days);
  get diagnostics v_count = row_count;
  return v_count;
end $function$;

CREATE OR REPLACE FUNCTION public.cms_log_page_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO cms_audit(tenant_id, entity, entity_id, action, user_id, details)
    VALUES (NEW.tenant_id, 'page', NEW.id, 'insert', auth.uid(), jsonb_build_object('slug', NEW.slug));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO cms_audit(tenant_id, entity, entity_id, action, user_id, details)
    VALUES (NEW.tenant_id, 'page', NEW.id, 'update', auth.uid(), jsonb_build_object('changed', true));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO cms_audit(tenant_id, entity, entity_id, action, user_id, details)
    VALUES (OLD.tenant_id, 'page', OLD.id, 'delete', auth.uid(), '{}'::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$function$;

CREATE OR REPLACE FUNCTION public.cms_pages_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  topic text;
BEGIN
  topic := 'cms:page:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text || ':' || COALESCE(NEW.slug, OLD.slug);
  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cms_upsert_page(p_tenant_id uuid, p_slug text, p_title text, p_status text, p_content jsonb, p_created_by uuid, p_change_summary text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_page_id uuid;
  v_status text;
BEGIN
  IF p_tenant_id <> get_user_tenant() THEN
    RAISE EXCEPTION 'tenant mismatch';
  END IF;

  v_status := COALESCE(p_status, 'draft');

  INSERT INTO cms_pages (tenant_id, slug, title, status)
  VALUES (p_tenant_id, p_slug, p_title, v_status)
  ON CONFLICT (tenant_id, slug)
  DO UPDATE SET title = EXCLUDED.title,
                status = EXCLUDED.status,
                updated_at = NOW()
  RETURNING id INTO v_page_id;

  INSERT INTO cms_page_versions (page_id, content_json, created_by)
  VALUES (v_page_id, p_content, p_created_by);

  IF v_status = 'published' THEN
    UPDATE cms_pages SET published_at = NOW() WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.compute_audit_row_sig(p_row jsonb)
 RETURNS bytea
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN extensions.digest(p_row::text || coalesce(current_setting('app.hmac_key', true), ''), 'sha256');
END; $function$;

CREATE OR REPLACE FUNCTION public.compute_estimated_bill(p_billing_account_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_result JSONB;
  v_base_subscription_cost DECIMAL(10, 2) := 49.95;
  v_add_on_costs DECIMAL(10, 2) := 0;
  v_usage_costs DECIMAL(10, 2) := 0;
  v_total_cost DECIMAL(10, 2);
  v_record RECORD;
  v_add_on_record RECORD;
BEGIN
  -- Get active subscription
  SELECT plan_id, plan_name INTO v_record
  FROM subscriptions
  WHERE billing_account_id = p_billing_account_id
    AND status = 'active'
    AND current_period_start <= p_end_date
    AND current_period_end >= p_start_date
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate add-on costs
  FOR v_add_on_record IN
    SELECT
      ao.id,
      ao.base_price_monthly,
      ao.usage_price_per_unit,
      ao.usage_unit,
      COALESCE(SUM(uad.total_quantity), 0) as total_usage
    FROM add_on_purchases aop
    JOIN add_ons ao ON aop.add_on_id = ao.id
    LEFT JOIN usage_aggregate_daily uad ON uad.add_on_id = ao.id
      AND uad.billing_account_id = p_billing_account_id
      AND uad.date >= p_start_date
      AND uad.date <= p_end_date
    WHERE aop.billing_account_id = p_billing_account_id
      AND aop.status = 'active'
    GROUP BY ao.id, ao.base_price_monthly, ao.usage_price_per_unit, ao.usage_unit
  LOOP
    v_add_on_costs := v_add_on_costs + v_add_on_record.base_price_monthly;
    IF v_add_on_record.usage_price_per_unit IS NOT NULL THEN
      v_usage_costs := v_usage_costs + (v_add_on_record.total_usage * v_add_on_record.usage_price_per_unit);
    END IF;
  END LOOP;

  -- Calculate usage overage costs (for base plan limits)
  -- This is a simplified version - actual implementation would check plan limits
  FOR v_record IN
    SELECT
      event_type,
      SUM(total_quantity) as total_quantity
    FROM usage_aggregate_daily
    WHERE billing_account_id = p_billing_account_id
      AND date >= p_start_date
      AND date <= p_end_date
      AND add_on_id IS NULL
    GROUP BY event_type
  LOOP
    -- Apply overage pricing based on event type
    -- This is simplified - actual implementation would check plan limits first
    CASE v_record.event_type
      WHEN 'reconciliation_job' THEN
        IF v_record.total_quantity > 10000 THEN
          v_usage_costs := v_usage_costs + ((v_record.total_quantity - 10000) * 0.05);
        END IF;
      WHEN 'api_request' THEN
        IF v_record.total_quantity > 100000 THEN
          v_usage_costs := v_usage_costs + ((v_record.total_quantity - 100000) * 0.001);
        END IF;
      WHEN 'webhook_event' THEN
        IF v_record.total_quantity > 50000 THEN
          v_usage_costs := v_usage_costs + ((v_record.total_quantity - 50000) * 0.002);
        END IF;
      ELSE
        -- Default overage pricing
        NULL;
    END CASE;
  END LOOP;

  v_total_cost := v_base_subscription_cost + v_add_on_costs + v_usage_costs;

  -- Build result JSON
  v_result := jsonb_build_object(
    'billing_account_id', p_billing_account_id,
    'period_start', p_start_date,
    'period_end', p_end_date,
    'base_subscription_cost', v_base_subscription_cost,
    'add_on_costs', v_add_on_costs,
    'usage_costs', v_usage_costs,
    'total_cost', v_total_cost,
    'currency', 'usd'
  );

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.convert_archive_partitioned(table_name text, partition_interval text DEFAULT '10000'::text, retention_interval text DEFAULT '100000'::text, leading_partition integer DEFAULT 10)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  a_table_name TEXT := pgmq.format_table_name(table_name, 'a');
  a_table_name_old TEXT := pgmq.format_table_name(table_name, 'a') || '_old';
  qualified_a_table_name TEXT := format('pgmq.%I', a_table_name);
BEGIN

  PERFORM c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = a_table_name
    AND c.relkind = 'p';

  IF FOUND THEN
    RAISE NOTICE 'Table %s is already partitioned', a_table_name;
    RETURN;
  END IF;

  PERFORM c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = a_table_name
    AND c.relkind = 'r';

  IF NOT FOUND THEN
    RAISE NOTICE 'Table %s does not exists', a_table_name;
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE ' || qualified_a_table_name || ' RENAME TO ' || a_table_name_old;

  EXECUTE format( 'CREATE TABLE pgmq.%I (LIKE pgmq.%I including all) PARTITION BY RANGE (msg_id)', a_table_name, a_table_name_old );

  EXECUTE 'ALTER INDEX pgmq.archived_at_idx_' || table_name || ' RENAME TO archived_at_idx_' || table_name || '_old';
  EXECUTE 'CREATE INDEX archived_at_idx_'|| table_name || ' ON ' || qualified_a_table_name ||'(archived_at)';

  -- https://github.com/pgpartman/pg_partman/blob/master/doc/pg_partman.md
  -- p_parent_table - the existing parent table. MUST be schema qualified, even if in public schema.
  EXECUTE FORMAT(
    $QUERY$
    SELECT %I.create_parent(
      p_parent_table := %L,
      p_control := 'msg_id',
      p_interval := %L,
      p_type := case
        when pgmq._get_pg_partman_major_version() = 5 then 'range'
        else 'native'
      end
    )
    $QUERY$,
    pgmq._get_pg_partman_schema(),
    qualified_a_table_name,
    partition_interval
  );

  EXECUTE FORMAT(
    $QUERY$
    UPDATE %I.part_config
    SET
      retention = %L,
      retention_keep_table = false,
      retention_keep_index = false,
      infinite_time_partitions = true
    WHERE
      parent_table = %L;
    $QUERY$,
    pgmq._get_pg_partman_schema(),
    retention_interval,
    qualified_a_table_name
  );
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq."create"(queue_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM pgmq.create_non_partitioned(queue_name);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_alert_from_fraud_signal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_alert_id UUID;
  v_rule RECORD;
BEGIN
  -- Find matching alert rule
  SELECT * INTO v_rule
  FROM alert_rules
  WHERE alert_type = 'fraud_signal'
    AND enabled = true
    AND (conditions->>'usage_spike_percentage')::INTEGER <= (NEW.metadata->>'spike_percentage')::INTEGER
  ORDER BY (conditions->>'usage_spike_percentage')::INTEGER DESC
  LIMIT 1;

  IF v_rule IS NULL THEN
    RETURN NEW; -- No matching rule
  END IF;

  -- Create alert
  INSERT INTO alerts (
    alert_type,
    severity,
    title,
    message,
    tenant_id,
    billing_account_id,
    metadata
  ) VALUES (
    'fraud_signal',
    v_rule.severity,
    'Fraud Signal Detected',
    NEW.description,
    (SELECT tenant_id FROM billing_accounts WHERE id = NEW.billing_account_id),
    NEW.billing_account_id,
    jsonb_build_object(
      'fraud_signal_id', NEW.id,
      'signal_type', NEW.signal_type,
      'spike_percentage', NEW.metadata->>'spike_percentage'
    )
  )
  RETURNING id INTO v_alert_id;

  -- Send notifications
  IF v_rule.notify_email AND array_length(v_rule.email_recipients, 1) > 0 THEN
    INSERT INTO alert_notifications (alert_id, notification_type, recipient, status)
    SELECT v_alert_id, 'email', unnest(v_rule.email_recipients), 'pending';
  END IF;

  IF v_rule.notify_webhook AND v_rule.webhook_url IS NOT NULL THEN
    INSERT INTO alert_notifications (alert_id, notification_type, recipient, status, metadata)
    VALUES (v_alert_id, 'webhook', v_rule.webhook_url, 'pending', jsonb_build_object('url', v_rule.webhook_url));
  END IF;

  IF v_rule.notify_whatsapp AND v_rule.whatsapp_number IS NOT NULL THEN
    INSERT INTO alert_notifications (alert_id, notification_type, recipient, status)
    VALUES (v_alert_id, 'whatsapp', v_rule.whatsapp_number, 'pending');
  END IF;

  IF v_rule.notify_telegram AND v_rule.telegram_chat_id IS NOT NULL THEN
    INSERT INTO alert_notifications (alert_id, notification_type, recipient, status)
    VALUES (v_alert_id, 'telegram', v_rule.telegram_chat_id, 'pending');
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_email_invite(p_tenant_id uuid, p_email text, p_role text DEFAULT 'viewer'::text, p_expires_in_minutes integer DEFAULT 10080)
 RETURNS email_invites
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_token text := encode(gen_random_bytes(24), 'hex');
  v_row public.email_invites;
BEGIN
  IF NOT app_private.is_tenant_admin(p_tenant_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_role NOT IN ('owner','admin','editor','viewer') THEN
    RAISE EXCEPTION 'invalid role %', p_role;
  END IF;
  INSERT INTO public.email_invites (tenant_id, email, role, invited_by, token, expires_at)
  VALUES (p_tenant_id, lower(p_email), p_role, (SELECT auth.uid()), v_token, NOW() + make_interval(mins => p_expires_in_minutes))
  ON CONFLICT (tenant_id, email) DO UPDATE
    SET role = EXCLUDED.role,
        invited_by = (SELECT auth.uid()),
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        updated_at = now()
  RETURNING * INTO v_row;
  RETURN v_row;
END;$function$;

CREATE OR REPLACE FUNCTION public.create_index_if_not_exists(p_index_name text, p_table_name text, p_index_definition text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = p_table_name 
        AND indexname = p_index_name
    ) THEN
        EXECUTE format('CREATE INDEX %I ON %I %s', p_index_name, p_table_name, p_index_definition);
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_membership_invite(p_tenant_id uuid, p_user_id uuid, p_role text DEFAULT 'viewer'::text, p_expires_in_minutes integer DEFAULT 10080)
 RETURNS memberships
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_token text;
  v_row public.memberships;
BEGIN
  IF NOT app_private.is_tenant_admin(p_tenant_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_role NOT IN ('owner','admin','editor','viewer') THEN
    RAISE EXCEPTION 'invalid role %', p_role;
  END IF;
  v_token := encode(gen_random_bytes(24), 'hex');
  INSERT INTO public.memberships (tenant_id, user_id, role, status, invited_by, invite_token, invite_expires_at)
  VALUES (p_tenant_id, p_user_id, p_role, 'invited', (SELECT auth.uid()), v_token, NOW() + make_interval(mins => p_expires_in_minutes))
  ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        status = 'invited',
        invited_by = (SELECT auth.uid()),
        invite_token = EXCLUDED.invite_token,
        invite_expires_at = EXCLUDED.invite_expires_at,
        updated_at = NOW()
  RETURNING * INTO v_row;
  RETURN v_row;
END;$function$;

CREATE OR REPLACE FUNCTION pgmq.create_non_partitioned(queue_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  qtable TEXT := pgmq.format_table_name(queue_name, 'q');
  qtable_seq TEXT := qtable || '_msg_id_seq';
  atable TEXT := pgmq.format_table_name(queue_name, 'a');
BEGIN
  PERFORM pgmq.validate_queue_name(queue_name);

  EXECUTE FORMAT(
    $QUERY$
    CREATE TABLE IF NOT EXISTS pgmq.%I (
        msg_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        read_ct INT DEFAULT 0 NOT NULL,
        enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        vt TIMESTAMP WITH TIME ZONE NOT NULL,
        message JSONB,
        headers JSONB
    )
    $QUERY$,
    qtable
  );

  EXECUTE FORMAT(
    $QUERY$
    CREATE TABLE IF NOT EXISTS pgmq.%I (
      msg_id BIGINT PRIMARY KEY,
      read_ct INT DEFAULT 0 NOT NULL,
      enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      archived_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      vt TIMESTAMP WITH TIME ZONE NOT NULL,
      message JSONB,
      headers JSONB
    );
    $QUERY$,
    atable
  );

  IF pgmq._extension_exists('pgmq') THEN
      IF NOT pgmq._belongs_to_pgmq(qtable) THEN
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD TABLE pgmq.%I', qtable);
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD SEQUENCE pgmq.%I', qtable_seq);
      END IF;

      IF NOT pgmq._belongs_to_pgmq(atable) THEN
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD TABLE pgmq.%I', atable);
      END IF;
  END IF;

  EXECUTE FORMAT(
    $QUERY$
    CREATE INDEX IF NOT EXISTS %I ON pgmq.%I (vt ASC);
    $QUERY$,
    qtable || '_vt_idx', qtable
  );

  EXECUTE FORMAT(
    $QUERY$
    CREATE INDEX IF NOT EXISTS %I ON pgmq.%I (archived_at);
    $QUERY$,
    'archived_at_idx_' || queue_name, atable
  );

  EXECUTE FORMAT(
    $QUERY$
    INSERT INTO pgmq.meta (queue_name, is_partitioned, is_unlogged)
    VALUES (%L, false, false)
    ON CONFLICT
    DO NOTHING;
    $QUERY$,
    queue_name
  );
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.create_partitioned(queue_name text, partition_interval text DEFAULT '10000'::text, retention_interval text DEFAULT '100000'::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  partition_col TEXT;
  a_partition_col TEXT;
  qtable TEXT := pgmq.format_table_name(queue_name, 'q');
  qtable_seq TEXT := qtable || '_msg_id_seq';
  atable TEXT := pgmq.format_table_name(queue_name, 'a');
  fq_qtable TEXT := 'pgmq.' || qtable;
  fq_atable TEXT := 'pgmq.' || atable;
BEGIN
  PERFORM pgmq.validate_queue_name(queue_name);
  PERFORM pgmq._ensure_pg_partman_installed();
  SELECT pgmq._get_partition_col(partition_interval) INTO partition_col;

  EXECUTE FORMAT(
    $QUERY$
    CREATE TABLE IF NOT EXISTS pgmq.%I (
        msg_id BIGINT GENERATED ALWAYS AS IDENTITY,
        read_ct INT DEFAULT 0 NOT NULL,
        enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        vt TIMESTAMP WITH TIME ZONE NOT NULL,
        message JSONB,
        headers JSONB
    ) PARTITION BY RANGE (%I)
    $QUERY$,
    qtable, partition_col
  );

  IF pgmq._extension_exists('pgmq') THEN
      IF NOT pgmq._belongs_to_pgmq(qtable) THEN
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD TABLE pgmq.%I', qtable);
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD SEQUENCE pgmq.%I', qtable_seq);
      END IF;
  END IF;

  -- https://github.com/pgpartman/pg_partman/blob/master/doc/pg_partman.md
  -- p_parent_table - the existing parent table. MUST be schema qualified, even if in public schema.
  EXECUTE FORMAT(
    $QUERY$
    SELECT %I.create_parent(
      p_parent_table := %L,
      p_control := %L,
      p_interval := %L,
      p_type := case
        when pgmq._get_pg_partman_major_version() = 5 then 'range'
        else 'native'
      end
    )
    $QUERY$,
    pgmq._get_pg_partman_schema(),
    fq_qtable,
    partition_col,
    partition_interval
  );

  EXECUTE FORMAT(
    $QUERY$
    CREATE INDEX IF NOT EXISTS %I ON pgmq.%I (%I);
    $QUERY$,
    qtable || '_part_idx', qtable, partition_col
  );

  EXECUTE FORMAT(
    $QUERY$
    UPDATE %I.part_config
    SET
        retention = %L,
        retention_keep_table = false,
        retention_keep_index = true,
        automatic_maintenance = 'on'
    WHERE parent_table = %L;
    $QUERY$,
    pgmq._get_pg_partman_schema(),
    retention_interval,
    'pgmq.' || qtable
  );

  EXECUTE FORMAT(
    $QUERY$
    INSERT INTO pgmq.meta (queue_name, is_partitioned, is_unlogged)
    VALUES (%L, true, false)
    ON CONFLICT
    DO NOTHING;
    $QUERY$,
    queue_name
  );

  IF partition_col = 'enqueued_at' THEN
    a_partition_col := 'archived_at';
  ELSE
    a_partition_col := partition_col;
  END IF;

  EXECUTE FORMAT(
    $QUERY$
    CREATE TABLE IF NOT EXISTS pgmq.%I (
      msg_id BIGINT NOT NULL,
      read_ct INT DEFAULT 0 NOT NULL,
      enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      archived_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      vt TIMESTAMP WITH TIME ZONE NOT NULL,
      message JSONB,
      headers JSONB
    ) PARTITION BY RANGE (%I);
    $QUERY$,
    atable, a_partition_col
  );

  IF pgmq._extension_exists('pgmq') THEN
      IF NOT pgmq._belongs_to_pgmq(atable) THEN
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD TABLE pgmq.%I', atable);
      END IF;
  END IF;

  -- https://github.com/pgpartman/pg_partman/blob/master/doc/pg_partman.md
  -- p_parent_table - the existing parent table. MUST be schema qualified, even if in public schema.
  EXECUTE FORMAT(
    $QUERY$
    SELECT %I.create_parent(
      p_parent_table := %L,
      p_control := %L,
      p_interval := %L,
      p_type := case
        when pgmq._get_pg_partman_major_version() = 5 then 'range'
        else 'native'
      end
    )
    $QUERY$,
    pgmq._get_pg_partman_schema(),
    fq_atable,
    a_partition_col,
    partition_interval
  );

  EXECUTE FORMAT(
    $QUERY$
    UPDATE %I.part_config
    SET
        retention = %L,
        retention_keep_table = false,
        retention_keep_index = true,
        automatic_maintenance = 'on'
    WHERE parent_table = %L;
    $QUERY$,
    pgmq._get_pg_partman_schema(),
    retention_interval,
    'pgmq.' || atable
  );

  EXECUTE FORMAT(
    $QUERY$
    CREATE INDEX IF NOT EXISTS %I ON pgmq.%I (archived_at);
    $QUERY$,
    'archived_at_idx_' || queue_name, atable
  );

END;
$function$;

CREATE OR REPLACE FUNCTION public.create_policy_if_not_exists(p_policy_name text, p_table_name text, p_policy_definition text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
    -- Drop policy if exists to avoid duplicates
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
    -- Create the policy
    EXECUTE format('CREATE POLICY %I ON %I %s', p_policy_name, p_table_name, p_policy_definition);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_state_change_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.run_events (workspace_id, run_id, type, payload, created_by)
    VALUES (
      NEW.workspace_id,
      NEW.id,
      'state_change',
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status,
        'timestamp', now()
      ),
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_system_state_snapshot(p_snapshot_type character varying DEFAULT 'daily'::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_snapshot_id UUID;
  v_system_metrics JSONB;
  v_critical_events JSONB;
  v_alerts_summary JSONB;
  v_billing_summary JSONB;
  v_user_activity_summary JSONB;
  v_agent_runs_summary JSONB;
  v_health_summary JSONB;
BEGIN
  -- System metrics
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL),
    'active_billing_accounts', (SELECT COUNT(*) FROM billing_accounts WHERE status = 'active' AND deleted_at IS NULL),
    'active_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'total_api_keys', (SELECT COUNT(*) FROM api_keys WHERE revoked_at IS NULL),
    'total_receipts', (SELECT COUNT(*) FROM receipts),
    'total_feature_flags', (SELECT COUNT(*) FROM feature_flags WHERE deleted_at IS NULL)
  ) INTO v_system_metrics;
  
  -- Critical events (last 24 hours)
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'severity', severity,
    'title', title,
    'message', message,
    'created_at', created_at
  ) ORDER BY created_at DESC)
  INTO v_critical_events
  FROM alerts
  WHERE severity IN ('critical', 'high')
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Alerts summary
  SELECT jsonb_build_object(
    'critical', (SELECT COUNT(*) FROM alerts WHERE severity = 'critical' AND resolved_at IS NULL),
    'high', (SELECT COUNT(*) FROM alerts WHERE severity = 'high' AND resolved_at IS NULL),
    'medium', (SELECT COUNT(*) FROM alerts WHERE severity = 'medium' AND resolved_at IS NULL),
    'low', (SELECT COUNT(*) FROM alerts WHERE severity = 'low' AND resolved_at IS NULL),
    'total_unresolved', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL)
  ) INTO v_alerts_summary;
  
  -- Billing summary
  SELECT jsonb_build_object(
    'total_revenue_estimate', (
      SELECT COALESCE(SUM(estimated_cost), 0)
      FROM usage_aggregate_daily
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'active_trials', (
      SELECT COUNT(*)
      FROM subscriptions
      WHERE status = 'trialing'
    ),
    'past_due_subscriptions', (
      SELECT COUNT(*)
      FROM subscriptions
      WHERE status = 'past_due'
    ),
    'recent_payment_failures', (
      SELECT COUNT(*)
      FROM billing_reconciliation_log
      WHERE reconciliation_type = 'payment_failed'
        AND created_at > NOW() - INTERVAL '7 days'
    )
  ) INTO v_billing_summary;
  
  -- User activity summary
  SELECT jsonb_build_object(
    'new_users_24h', (
      SELECT COUNT(*)
      FROM users
      WHERE created_at > NOW() - INTERVAL '24 hours'
    ),
    'active_users_24h', (
      SELECT COUNT(DISTINCT user_id)
      FROM usage_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    ),
    'api_requests_24h', (
      SELECT COUNT(*)
      FROM usage_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
        AND event_type LIKE 'api_%'
    )
  ) INTO v_user_activity_summary;
  
  -- Agent runs summary
  SELECT jsonb_build_object(
    'total_runs_24h', (
      SELECT COUNT(*)
      FROM agent_runs
      WHERE started_at > NOW() - INTERVAL '24 hours'
    ),
    'failed_runs_24h', (
      SELECT COUNT(*)
      FROM agent_runs
      WHERE started_at > NOW() - INTERVAL '24 hours'
        AND status = 'failed'
    ),
    'avg_duration_ms', (
      SELECT AVG(duration_ms)
      FROM agent_runs
      WHERE started_at > NOW() - INTERVAL '24 hours'
        AND duration_ms IS NOT NULL
    )
  ) INTO v_agent_runs_summary;
  
  -- Health summary
  SELECT jsonb_build_object(
    'overall_status', (
      SELECT overall_status
      FROM health_checks
      ORDER BY timestamp DESC
      LIMIT 1
    ),
    'open_circuit_breakers', (
      SELECT COUNT(*)
      FROM circuit_breakers
      WHERE status = 'open'
    ),
    'degraded_services', (
      SELECT jsonb_agg(service_name)
      FROM circuit_breakers
      WHERE status IN ('open', 'half_open')
    )
  ) INTO v_health_summary;
  
  -- Insert snapshot
  INSERT INTO system_state_snapshots (
    snapshot_type,
    snapshot_date,
    system_metrics,
    critical_events,
    alerts_summary,
    billing_summary,
    user_activity_summary,
    agent_runs_summary,
    health_summary
  ) VALUES (
    p_snapshot_type,
    CURRENT_DATE,
    v_system_metrics,
    COALESCE(v_critical_events, '[]'::jsonb),
    v_alerts_summary,
    v_billing_summary,
    v_user_activity_summary,
    v_agent_runs_summary,
    v_health_summary
  ) RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.create_unlogged(queue_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  qtable TEXT := pgmq.format_table_name(queue_name, 'q');
  qtable_seq TEXT := qtable || '_msg_id_seq';
  atable TEXT := pgmq.format_table_name(queue_name, 'a');
BEGIN
  PERFORM pgmq.validate_queue_name(queue_name);
  EXECUTE FORMAT(
    $QUERY$
    CREATE UNLOGGED TABLE IF NOT EXISTS pgmq.%I (
        msg_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        read_ct INT DEFAULT 0 NOT NULL,
        enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        vt TIMESTAMP WITH TIME ZONE NOT NULL,
        message JSONB,
        headers JSONB
    )
    $QUERY$,
    qtable
  );

  EXECUTE FORMAT(
    $QUERY$
    CREATE TABLE IF NOT EXISTS pgmq.%I (
      msg_id BIGINT PRIMARY KEY,
      read_ct INT DEFAULT 0 NOT NULL,
      enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      archived_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      vt TIMESTAMP WITH TIME ZONE NOT NULL,
      message JSONB,
      headers JSONB
    );
    $QUERY$,
    atable
  );

  IF pgmq._extension_exists('pgmq') THEN
      IF NOT pgmq._belongs_to_pgmq(qtable) THEN
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD TABLE pgmq.%I', qtable);
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD SEQUENCE pgmq.%I', qtable_seq);
      END IF;

      IF NOT pgmq._belongs_to_pgmq(atable) THEN
          EXECUTE FORMAT('ALTER EXTENSION pgmq ADD TABLE pgmq.%I', atable);
      END IF;
  END IF;

  EXECUTE FORMAT(
    $QUERY$
    CREATE INDEX IF NOT EXISTS %I ON pgmq.%I (vt ASC);
    $QUERY$,
    qtable || '_vt_idx', qtable
  );

  EXECUTE FORMAT(
    $QUERY$
    CREATE INDEX IF NOT EXISTS %I ON pgmq.%I (archived_at);
    $QUERY$,
    'archived_at_idx_' || queue_name, atable
  );

  EXECUTE FORMAT(
    $QUERY$
    INSERT INTO pgmq.meta (queue_name, is_partitioned, is_unlogged)
    VALUES (%L, false, true)
    ON CONFLICT
    DO NOTHING;
    $QUERY$,
    queue_name
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_weekly_snapshot(week_start date)
 RETURNS TABLE(snapshot_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_exists uuid; v_metrics jsonb; v_summary jsonb; v_events jsonb; BEGIN
  -- Collect latest metrics snapshot as JSON array
  SELECT coalesce(jsonb_agg(m ORDER BY m.category, m.name), '[]'::jsonb)
    INTO v_metrics
  FROM (
    SELECT category, name, value, status, source, last_updated FROM public.reality_metrics
  ) m;

  -- Events summary for the week (Mon-Sun)
  SELECT jsonb_build_object(
    'total', count(*),
    'by_category', coalesce(jsonb_object_agg(category, cnt), '{}'::jsonb)
  ) INTO v_events
  FROM (
    SELECT category, count(*)::bigint AS cnt
    FROM public.reality_events
    WHERE created_at >= week_start::timestamptz AND created_at < (week_start + 7)::timestamptz
    GROUP BY 1
  ) s;

  -- High-level summary (can be extended later)
  SELECT jsonb_build_object(
    'generated_at', now(),
    'metric_count', (SELECT count(*) FROM public.reality_metrics),
    'event_count', (SELECT count(*) FROM public.reality_events WHERE created_at >= week_start::timestamptz AND created_at < (week_start + 7)::timestamptz)
  ) INTO v_summary;

  -- Upsert weekly snapshot
  INSERT INTO public.weekly_snapshots (week_start, summary, metrics_snapshot, events_summary, delta_summary, risks, required_actions)
  VALUES (week_start, v_summary, v_metrics, v_events, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb)
  ON CONFLICT (week_start)
  DO UPDATE SET summary = EXCLUDED.summary,
                metrics_snapshot = EXCLUDED.metrics_snapshot,
                events_summary = EXCLUDED.events_summary,
                created_at = public.weekly_snapshots.created_at
  RETURNING id INTO v_exists;

  RETURN QUERY SELECT v_exists;
END; $function$;

CREATE OR REPLACE FUNCTION public.current_auth_uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.current_billing_period_start(p_tenant uuid)
 RETURNS date
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT COALESCE(tp.billing_cycle_anchor, date_trunc('month', now())::date)
  FROM public.tenant_plans tp
  WHERE tp.tenant_id = p_tenant
$function$;

CREATE OR REPLACE FUNCTION app_private.current_org_id()
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT COALESCE((auth.jwt() ->> 'org_id')::uuid, NULL);
$function$;

CREATE OR REPLACE FUNCTION app_private.current_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'app_private', 'pg_catalog'
AS $function$
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION app_private.current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO 'app_private', 'pg_catalog'
AS $function$
  SELECT auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.current_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.current_user_org_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT ((auth.jwt() ->> 'org_id'))::uuid
  WHERE (auth.jwt() ->> 'org_id') IS NOT NULL;
$function$;

CREATE OR REPLACE FUNCTION public.current_user_tenant()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT get_user_tenant();
$function$;

CREATE OR REPLACE FUNCTION public.current_user_workspace_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT get_user_workspace_ids();
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_credential(p_encrypted text, p_encryption_key text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION app_private.decrypt_text(p bytea)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  select nullif(extensions.pgp_sym_decrypt(p, current_setting('app.encryption_key', true)), '');
$function$;

CREATE OR REPLACE FUNCTION pgmq.delete(queue_name text, msg_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    sql TEXT;
    result BIGINT;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
    sql := FORMAT(
        $QUERY$
        DELETE FROM pgmq.%I
        WHERE msg_id = $1
        RETURNING msg_id
        $QUERY$,
        qtable
    );
    EXECUTE sql USING msg_id INTO result;
    RETURN NOT (result IS NULL);
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq_public.delete(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return pgmq.delete( queue_name := queue_name, msg_id := message_id ); end; $function$;

CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Soft delete user
  UPDATE users
  SET deleted_at = NOW(),
      email = 'deleted_' || id::text || '@deleted.local',
      password_hash = ''
  WHERE id = p_user_id;

  -- Soft delete billing accounts
  UPDATE billing_accounts
  SET deleted_at = NOW(),
      status = 'cancelled'
  WHERE user_id = p_user_id;

  -- Revoke integration credentials
  UPDATE integration_credentials
  SET status = 'revoked',
      revoked_at = NOW()
  WHERE user_id = p_user_id;

  -- Log deletion
  PERFORM log_audit_event(
    p_user_id => p_user_id,
    p_event => 'user.data_deleted',
    p_action_type => 'delete',
    p_resource_type => 'user',
    p_resource_id => p_user_id,
    p_metadata => jsonb_build_object('gdpr_request', true)
  );

  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'deleted_at', NOW()
  );

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.detach_archive(queue_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  atable TEXT := pgmq.format_table_name(queue_name, 'a');
BEGIN
  IF pgmq._extension_exists('pgmq') THEN
    EXECUTE format('ALTER EXTENSION pgmq DROP TABLE pgmq.%I', atable);
  END IF;
END
$function$;

CREATE OR REPLACE FUNCTION public.detect_anomalies(p_tenant_id uuid, p_metric_name character varying, p_time_window_hours integer DEFAULT 24)
 RETURNS TABLE(anomaly_score numeric, detected_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_current_value DECIMAL(15, 6);
  v_avg_value DECIMAL(15, 6);
  v_std_dev DECIMAL(15, 6);
  v_anomaly_score DECIMAL(5, 4);
BEGIN
  -- Get current value (last hour)
  SELECT AVG(value) INTO v_current_value
  FROM monitoring_metrics
  WHERE metric_name = p_metric_name
    AND tenant_id = p_tenant_id
    AND timestamp >= NOW() - INTERVAL '1 hour';

  -- Get historical average and standard deviation
  SELECT
    AVG(value),
    STDDEV(value)
  INTO v_avg_value, v_std_dev
  FROM monitoring_metrics
  WHERE metric_name = p_metric_name
    AND tenant_id = p_tenant_id
    AND timestamp >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
    AND timestamp < NOW() - INTERVAL '1 hour';

  -- Calculate anomaly score (Z-score)
  IF v_std_dev > 0 THEN
    v_anomaly_score := ABS((v_current_value - v_avg_value) / v_std_dev);
  ELSE
    v_anomaly_score := 0;
  END IF;

  -- Return if anomaly detected (score > 2 = 2 standard deviations)
  IF v_anomaly_score > 2 THEN
    anomaly_score := v_anomaly_score;
    detected_at := NOW();
    RETURN NEXT;
  END IF;

  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_assumption_drift()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_drift RECORD;
  v_result jsonb := '[]'::jsonb;
  v_drift_count INTEGER := 0;
BEGIN
  -- Check for subscriptions with usage patterns that don't match plan
  FOR v_drift IN
    SELECT 
      s.id as subscription_id,
      s.plan_id,
      ba.id as billing_account_id,
      COUNT(ue.id) as usage_count,
      SUM(ue.quantity) as total_usage
    FROM subscriptions s
    JOIN billing_accounts ba ON ba.id = s.billing_account_id
    LEFT JOIN usage_events ue ON ue.billing_account_id = ba.id
      AND ue.timestamp > NOW() - INTERVAL '30 days'
    WHERE s.status = 'active'
    GROUP BY s.id, s.plan_id, ba.id
    HAVING 
      -- Free plan with high usage
      (s.plan_id = 'free' AND COUNT(ue.id) > 1000)
      OR
      -- Pro plan with no usage (might need downgrade)
      (s.plan_id = 'pro' AND COUNT(ue.id) = 0)
  LOOP
    v_drift_count := v_drift_count + 1;
    
    -- Create alert for assumption drift
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'medium',
      'Subscription Usage Pattern Drift',
      format('Subscription %s has usage pattern that may not match plan %s', 
        v_drift.subscription_id, v_drift.plan_id),
      'assumption_drift',
      jsonb_build_object(
        'subscription_id', v_drift.subscription_id,
        'plan_id', v_drift.plan_id,
        'usage_count', v_drift.usage_count,
        'total_usage', v_drift.total_usage
      )
    );
    
    v_result := v_result || jsonb_build_object(
      'subscription_id', v_drift.subscription_id,
      'drift_type', 'usage_pattern',
      'plan_id', v_drift.plan_id
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'drift_detections', v_drift_count,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_billing_discrepancies()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_discrepancy RECORD;
  v_result jsonb := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  -- Find unreconciled discrepancies from last 7 days
  FOR v_discrepancy IN
    SELECT *
    FROM billing_reconciliation_log
    WHERE status = 'discrepancy'
      AND period_start > NOW() - INTERVAL '7 days'
      AND ABS(discrepancy_amount) > 0.01
    ORDER BY ABS(discrepancy_amount) DESC
  LOOP
    v_count := v_count + 1;
    
    -- Create alert for significant discrepancies
    IF ABS(v_discrepancy.discrepancy_amount) > 10.00 THEN
      INSERT INTO alerts (
        severity,
        title,
        message,
        check_type,
        details
      ) VALUES (
        'high',
        'Billing Discrepancy Detected',
        format('Discrepancy of $%s detected for billing account %s', 
          v_discrepancy.discrepancy_amount, 
          v_discrepancy.billing_account_id),
        'billing_discrepancy',
        jsonb_build_object(
          'billing_account_id', v_discrepancy.billing_account_id,
          'discrepancy_amount', v_discrepancy.discrepancy_amount,
          'expected_amount', v_discrepancy.expected_amount,
          'actual_amount', v_discrepancy.actual_amount,
          'period_start', v_discrepancy.period_start,
          'period_end', v_discrepancy.period_end
        )
      );
      
      v_result := v_result || jsonb_build_object(
        'billing_account_id', v_discrepancy.billing_account_id,
        'discrepancy_amount', v_discrepancy.discrepancy_amount
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'discrepancies_found', v_count,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_low_confidence_results()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_low_confidence RECORD;
  v_result jsonb := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  -- Find low confidence results from last 24 hours that haven't been notified
  FOR v_low_confidence IN
    SELECT *
    FROM confidence_events
    WHERE flagged_low_confidence = true
      AND user_notified = false
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY confidence_score ASC, created_at DESC
    LIMIT 50
  LOOP
    v_count := v_count + 1;
    
    -- Create alert for very low confidence (< 0.5)
    IF v_low_confidence.confidence_score < 0.5 THEN
      INSERT INTO alerts (
        severity,
        title,
        message,
        check_type,
        details
      ) VALUES (
        'high',
        'Very Low Confidence Result Detected',
        format('%s result has very low confidence (%.2f%%)', 
          v_low_confidence.source_type,
          v_low_confidence.confidence_score * 100),
        'low_confidence',
        jsonb_build_object(
          'source_type', v_low_confidence.source_type,
          'source_id', v_low_confidence.source_id,
          'confidence_score', v_low_confidence.confidence_score,
          'threshold', v_low_confidence.threshold
        )
      );
    END IF;
    
    -- Mark as notified (in practice, would send notification to user)
    UPDATE confidence_events
    SET user_notified = true
    WHERE id = v_low_confidence.id;
    
    v_result := v_result || jsonb_build_object(
      'event_id', v_low_confidence.id,
      'source_type', v_low_confidence.source_type,
      'confidence_score', v_low_confidence.confidence_score
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'low_confidence_count', v_count,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_stale_content()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_content RECORD;
  v_result jsonb := '[]'::jsonb;
  v_stale_count INTEGER := 0;
  v_days_old INTEGER;
BEGIN
  -- Check feature flags (should be reviewed monthly)
  FOR v_content IN
    SELECT 
      id,
      'feature_flag' as content_type,
      updated_at as last_updated,
      30 as threshold_days
    FROM feature_flags
    WHERE deleted_at IS NULL
      AND updated_at < NOW() - INTERVAL '30 days'
  LOOP
    v_days_old := EXTRACT(EPOCH FROM (NOW() - v_content.last_updated)) / 86400;
    
    -- Check if already flagged
    IF NOT EXISTS (
      SELECT 1 FROM staleness_checks
      WHERE content_type = v_content.content_type
        AND content_id = v_content.id
        AND is_stale = true
    ) THEN
      INSERT INTO staleness_checks (
        content_type,
        content_id,
        last_updated,
        staleness_threshold_days,
        is_stale,
        flagged_at
      ) VALUES (
        v_content.content_type,
        v_content.id,
        v_content.last_updated,
        v_content.threshold_days,
        true,
        NOW()
      );
      
      v_stale_count := v_stale_count + 1;
      v_result := v_result || jsonb_build_object(
        'content_type', v_content.content_type,
        'content_id', v_content.id,
        'days_old', v_days_old
      );
    END IF;
  END LOOP;
  
  -- Check API keys (should be rotated periodically)
  FOR v_content IN
    SELECT 
      id,
      'api_key' as content_type,
      created_at as last_updated,
      180 as threshold_days -- 6 months
    FROM api_keys
    WHERE revoked_at IS NULL
      AND created_at < NOW() - INTERVAL '180 days'
  LOOP
    v_days_old := EXTRACT(EPOCH FROM (NOW() - v_content.last_updated)) / 86400;
    
    IF NOT EXISTS (
      SELECT 1 FROM staleness_checks
      WHERE content_type = v_content.content_type
        AND content_id = v_content.id
        AND is_stale = true
    ) THEN
      INSERT INTO staleness_checks (
        content_type,
        content_id,
        last_updated,
        staleness_threshold_days,
        is_stale,
        flagged_at
      ) VALUES (
        v_content.content_type,
        v_content.id,
        v_content.last_updated,
        v_content.threshold_days,
        true,
        NOW()
      );
      
      v_stale_count := v_stale_count + 1;
    END IF;
  END LOOP;
  
  -- Check subscriptions (should be reviewed if unchanged for 90 days)
  FOR v_content IN
    SELECT 
      id,
      'subscription' as content_type,
      updated_at as last_updated,
      90 as threshold_days
    FROM subscriptions
    WHERE status = 'active'
      AND updated_at < NOW() - INTERVAL '90 days'
  LOOP
    v_days_old := EXTRACT(EPOCH FROM (NOW() - v_content.last_updated)) / 86400;
    
    IF NOT EXISTS (
      SELECT 1 FROM staleness_checks
      WHERE content_type = v_content.content_type
        AND content_id = v_content.id
        AND is_stale = true
    ) THEN
      INSERT INTO staleness_checks (
        content_type,
        content_id,
        last_updated,
        staleness_threshold_days,
        is_stale,
        flagged_at
      ) VALUES (
        v_content.content_type,
        v_content.id,
        v_content.last_updated,
        v_content.threshold_days,
        true,
        NOW()
      );
      
      v_stale_count := v_stale_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'stale_items_found', v_stale_count,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_user_confusion()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_user RECORD;
  v_result jsonb := '[]'::jsonb;
  v_error_count INTEGER;
  v_recent_errors INTEGER;
BEGIN
  -- Detect users with repeated errors in last hour
  FOR v_user IN
    SELECT 
      user_id,
      COUNT(*) as error_count,
      MAX(created_at) as last_error
    FROM error_logs
    WHERE created_at > NOW() - INTERVAL '1 hour'
      AND severity IN ('error', 'critical')
    GROUP BY user_id
    HAVING COUNT(*) >= 3 -- 3+ errors in an hour suggests confusion
  LOOP
    -- Check if we've already detected this
    IF NOT EXISTS (
      SELECT 1 FROM user_confusion_events
      WHERE user_id = v_user.user_id
        AND event_type = 'error_repeated'
        AND detected_at > NOW() - INTERVAL '1 hour'
    ) THEN
      INSERT INTO user_confusion_events (
        user_id,
        event_type,
        severity,
        context
      ) VALUES (
        v_user.user_id,
        'error_repeated',
        CASE 
          WHEN v_user.error_count >= 10 THEN 'critical'
          WHEN v_user.error_count >= 5 THEN 'high'
          ELSE 'medium'
        END,
        jsonb_build_object(
          'error_count', v_user.error_count,
          'last_error', v_user.last_error
        )
      );
      
      v_result := v_result || jsonb_build_object(
        'user_id', v_user.user_id,
        'type', 'error_repeated',
        'count', v_user.error_count
      );
    END IF;
  END LOOP;
  
  -- Detect abandoned API key creation flows
  FOR v_user IN
    SELECT DISTINCT user_id
    FROM audit_logs
    WHERE action = 'api_key_creation_started'
      AND created_at > NOW() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM audit_logs al2
        WHERE al2.user_id = audit_logs.user_id
          AND al2.action = 'api_key_created'
          AND al2.created_at > audit_logs.created_at
      )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM user_confusion_events
      WHERE user_id = v_user.user_id
        AND event_type = 'abandoned_flow'
        AND detected_at > NOW() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO user_confusion_events (
        user_id,
        event_type,
        severity,
        context
      ) VALUES (
        v_user.user_id,
        'abandoned_flow',
        'medium',
        jsonb_build_object('flow', 'api_key_creation')
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'detections', jsonb_array_length(v_result),
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.drop_queue(queue_name text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
    qtable_seq TEXT := qtable || '_msg_id_seq';
    fq_qtable TEXT := 'pgmq.' || qtable;
    atable TEXT := pgmq.format_table_name(queue_name, 'a');
    fq_atable TEXT := 'pgmq.' || atable;
    partitioned BOOLEAN;
BEGIN
    EXECUTE FORMAT(
        $QUERY$
        SELECT is_partitioned FROM pgmq.meta WHERE queue_name = %L
        $QUERY$,
        queue_name
    ) INTO partitioned;

    -- NEW CONDITIONAL CHECK
    if exists (
        select 1
        from pg_class c
        join pg_depend d on c.oid = d.objid
        join pg_extension e on d.refobjid = e.oid
        where c.relname = qtable and e.extname = 'pgmq'
    ) then

        EXECUTE FORMAT(
            $QUERY$
            ALTER EXTENSION pgmq DROP TABLE pgmq.%I
            $QUERY$,
            qtable
        );

    end if;

    -- NEW CONDITIONAL CHECK
    if exists (
        select 1
        from pg_class c
        join pg_depend d on c.oid = d.objid
        join pg_extension e on d.refobjid = e.oid
        where c.relname = qtable_seq and e.extname = 'pgmq'
    ) then    
        EXECUTE FORMAT(
            $QUERY$
            ALTER EXTENSION pgmq DROP SEQUENCE pgmq.%I
            $QUERY$,
            qtable_seq
        );

    end if;

    -- NEW CONDITIONAL CHECK
    if exists (
        select 1
        from pg_class c
        join pg_depend d on c.oid = d.objid
        join pg_extension e on d.refobjid = e.oid
        where c.relname = atable and e.extname = 'pgmq'
    ) then

    EXECUTE FORMAT(
        $QUERY$
        ALTER EXTENSION pgmq DROP TABLE pgmq.%I
        $QUERY$,
        atable
    );

    end if;

    -- NO CHANGES PAST THIS POINT

    EXECUTE FORMAT(
        $QUERY$
        DROP TABLE IF EXISTS pgmq.%I
        $QUERY$,
        qtable
    );

    EXECUTE FORMAT(
        $QUERY$
        DROP TABLE IF EXISTS pgmq.%I
        $QUERY$,
        atable
    );

     IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'meta' and table_schema = 'pgmq'
     ) THEN
        EXECUTE FORMAT(
            $QUERY$
            DELETE FROM pgmq.meta WHERE queue_name = %L
            $QUERY$,
            queue_name
        );
     END IF;

     IF partitioned THEN
        EXECUTE FORMAT(
          $QUERY$
          DELETE FROM %I.part_config where parent_table in (%L, %L)
          $QUERY$,
          pgmq._get_pg_partman_schema(), fq_qtable, fq_atable
        );
     END IF;

    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_credential(p_credential text, p_encryption_key text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION app_private.encrypt_text(p text)
 RETURNS bytea
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select extensions.pgp_sym_encrypt(coalesce(p, ''), current_setting('app.encryption_key', true));
$function$;

CREATE OR REPLACE FUNCTION public.enforce_quota(p_tenant uuid, p_kind text)
 RETURNS void
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_period date;
  v_limit integer;
  v_used integer;
BEGIN
  IF p_kind NOT IN ('uploads','extractions','users','storage_mb') THEN
    RAISE EXCEPTION 'Unknown quota kind: %', p_kind USING ERRCODE = '22023';
  END IF;

  v_period := public.current_billing_period_start(p_tenant);
  v_limit := public.get_plan_limit(
    p_tenant,
    CASE p_kind WHEN 'uploads' THEN 'max_uploads_month'
                WHEN 'extractions' THEN 'max_extractions_month'
                WHEN 'users' THEN 'max_users'
                WHEN 'storage_mb' THEN 'max_storage_mb' END
  );

  IF v_limit IS NULL THEN RETURN; END IF;

  SELECT CASE p_kind
           WHEN 'uploads' THEN u.uploads_count
           WHEN 'extractions' THEN u.extractions_count
           WHEN 'users' THEN u.users_count
           WHEN 'storage_mb' THEN CEIL(u.storage_bytes / 1048576.0)::int
         END
  INTO v_used
  FROM public.tenant_usage_monthly u
  WHERE u.tenant_id = p_tenant AND u.period_start = v_period;

  v_used := COALESCE(v_used, 0);
  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'Quota exceeded for % (used %, limit %)', p_kind, v_used, v_limit USING ERRCODE = 'P0001';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_rate_limit(p_tenant uuid, p_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform 1; -- keep body minimal; preserves signature
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_single_default_org()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
begin
  if TG_OP in ('INSERT','UPDATE') and NEW.is_default is true then
    -- Clear other defaults for this user
    update public.user_organizations
      set is_default = false
      where user_id = NEW.user_id
        and org_id <> NEW.org_id
        and is_default = true;
  end if;
  return NEW;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_idempotency(_tenant uuid, _key text, _ttl_minutes integer DEFAULT 5)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  exists_active boolean;
BEGIN
  -- deny if an active key exists
  SELECT EXISTS (
    SELECT 1 FROM public.idempotency_keys
    WHERE tenant_id = _tenant AND key = _key AND (expires_at IS NULL OR expires_at > now())
  ) INTO exists_active;
  IF exists_active THEN
    RETURN false;
  END IF;

  -- insert or refresh
  INSERT INTO public.idempotency_keys(id, tenant_id, key, created_at, expires_at)
  VALUES (gen_random_uuid(), _tenant, _key, now(), now() + make_interval(mins => _ttl_minutes))
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_receipt_confidence()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_receipt RECORD;
  v_result jsonb := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  -- Find receipts without confidence scores or with NULL confidence
  FOR v_receipt IN
    SELECT id, confidence_score
    FROM receipts
    WHERE confidence_score IS NULL
      AND created_at > NOW() - INTERVAL '7 days'
    LIMIT 100
  LOOP
    v_count := v_count + 1;
    
    -- Set default low confidence if missing
    UPDATE receipts
    SET 
      confidence_score = 0.5, -- Default to medium-low confidence
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'confidence_missing', true,
        'confidence_set_at', NOW()
      )
    WHERE id = v_receipt.id;
    
    -- Log confidence event
    PERFORM log_confidence_event(
      'receipt_parse',
      v_receipt.id,
      0.5,
      0.7,
      '{}'::jsonb,
      jsonb_build_object('reason', 'missing_confidence_score')
    );
    
    v_result := v_result || jsonb_build_object(
      'receipt_id', v_receipt.id,
      'action', 'confidence_set'
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'receipts_updated', v_count,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_usage_synced_to_stripe()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_account RECORD;
  v_result jsonb := '[]'::jsonb;
  v_unsynced_count INTEGER;
BEGIN
  -- Find accounts with usage that hasn't been synced to Stripe in last 24 hours
  FOR v_account IN
    SELECT DISTINCT ba.id, ba.stripe_customer_id
    FROM billing_accounts ba
    JOIN subscriptions s ON s.billing_account_id = ba.id
    WHERE ba.status = 'active'
      AND s.status = 'active'
      AND ba.stripe_customer_id IS NOT NULL
      AND ba.deleted_at IS NULL
  LOOP
    -- Check if usage exists from yesterday that hasn't been synced
    SELECT COUNT(*) INTO v_unsynced_count
    FROM usage_aggregate_daily uad
    WHERE uad.billing_account_id = v_account.id
      AND uad.date = CURRENT_DATE - INTERVAL '1 day'
      AND NOT EXISTS (
        SELECT 1 FROM billing_reconciliation_log brl
        WHERE brl.billing_account_id = v_account.id
          AND brl.reconciliation_type = 'daily'
          AND brl.period_start::date = CURRENT_DATE - INTERVAL '1 day'
          AND brl.status = 'reconciled'
      );
    
    IF v_unsynced_count > 0 THEN
      -- Trigger sync (would call edge function in practice)
      v_result := v_result || jsonb_build_object(
        'billing_account_id', v_account.id,
        'unsynced_days', v_unsynced_count,
        'action', 'sync_required'
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'accounts_checked', jsonb_array_length(v_result),
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION analytics.exec_sql(q text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'analytics', 'pg_temp'
AS $function$
DECLARE
  stmt text := q;
  lowered text := lower(q);
  res jsonb;
BEGIN
  -- Block mutation statements
  IF lowered ~ '\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|refresh materialized view)\b' THEN
    RAISE EXCEPTION 'Mutation statements are not allowed';
  END IF;

  -- Allow only selects from analytics schema
  IF lowered NOT LIKE 'select % from analytics.%' AND lowered NOT LIKE 'with % select % from analytics.%' THEN
    RAISE EXCEPTION 'Only SELECTs from analytics schema are permitted';
  END IF;

  EXECUTE format('SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t', stmt) INTO res;
  RETURN res;
END;
$function$;

CREATE OR REPLACE FUNCTION public.execute_recommendation(p_recommendation_id uuid, p_executed_by uuid, p_action_taken text, p_outcome_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_action_id UUID;
  v_insight_id UUID;
BEGIN
  SELECT insight_id INTO v_insight_id FROM public.ops_recommendations WHERE id = p_recommendation_id;

  INSERT INTO public.ops_actions (
    recommendation_id, insight_id, action_taken, actor_type, actor_id, outcome_notes
  ) VALUES (
    p_recommendation_id, v_insight_id, p_action_taken, 'admin', p_executed_by, p_outcome_notes
  ) RETURNING id INTO v_action_id;

  UPDATE public.ops_recommendations
  SET status = 'executed', executed_at = NOW(), executed_by = p_executed_by, updated_at = NOW()
  WHERE id = p_recommendation_id;

  RETURN v_action_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.expire_insights()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.ops_insights
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND status = 'active';
END;
$function$;

CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_result JSONB;
  v_user_data JSONB;
  v_billing_data JSONB;
  v_usage_data JSONB;
  v_integration_data JSONB;
BEGIN
  -- Get user data
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'name', name,
    'role', role,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_user_data
  FROM users
  WHERE id = p_user_id;

  -- Get billing data
  SELECT jsonb_agg(
    jsonb_build_object(
      'billing_account', jsonb_build_object(
        'id', ba.id,
        'email', ba.email,
        'status', ba.status,
        'created_at', ba.created_at
      ),
      'subscriptions', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'plan_id', s.plan_id,
            'status', s.status,
            'current_period_start', s.current_period_start,
            'current_period_end', s.current_period_end
          )
        )
        FROM subscriptions s
        WHERE s.billing_account_id = ba.id
      )
    )
  ) INTO v_billing_data
  FROM billing_accounts ba
  WHERE ba.user_id = p_user_id;

  -- Get usage data (last 12 months)
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date,
      'event_type', event_type,
      'total_quantity', total_quantity,
      'event_count', event_count
    )
  ) INTO v_usage_data
  FROM usage_aggregate_daily
  WHERE billing_account_id IN (
    SELECT id FROM billing_accounts WHERE user_id = p_user_id
  )
  AND date >= CURRENT_DATE - INTERVAL '12 months';

  -- Get integration data
  SELECT jsonb_agg(
    jsonb_build_object(
      'integration_id', integration_id,
      'status', status,
      'created_at', created_at,
      'last_used_at', last_used_at
    )
  ) INTO v_integration_data
  FROM integration_credentials
  WHERE user_id = p_user_id;

  -- Build result
  v_result := jsonb_build_object(
    'user', v_user_data,
    'billing', v_billing_data,
    'usage', v_usage_data,
    'integrations', v_integration_data,
    'exported_at', NOW()
  );

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_advisors_acknowledge(p_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  UPDATE public.advisors_findings
  SET acknowledged = true,
      acknowledged_by = auth.uid(),
      acknowledged_at = now()
  WHERE id = p_id;
  RETURN FOUND;
END; $function$;

CREATE OR REPLACE FUNCTION public.fn_advisors_ingest(p_category text, p_payload jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_count int := 0;
  v_item jsonb;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'array' THEN
    RETURN 0;
  END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload) LOOP
    INSERT INTO public.advisors_findings(category, code, severity, title, message, remediation_url, metadata, project_id)
    VALUES (
      p_category,
      COALESCE((v_item->>'code'),'unknown'),
      COALESCE((v_item->>'severity'),'low'),
      COALESCE((v_item->>'title'),'Untitled'),
      v_item->>'message',
      v_item->>'remediation_url',
      v_item,
      v_item->>'project_id'
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END; $function$;

CREATE OR REPLACE FUNCTION public.fn_audit_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_row_id uuid;
  v_diff jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_row_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, gen_random_uuid());
    v_diff := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_row_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid);
    v_diff := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_row_id := COALESCE((to_jsonb(OLD)->>'id')::uuid, gen_random_uuid());
    v_diff := to_jsonb(OLD);
  END IF;
  INSERT INTO public.audit_logs(table_name, action, row_id, user_id, diff)
  VALUES (TG_TABLE_SCHEMA||'.'||TG_TABLE_NAME, TG_OP, v_row_id, auth.uid(), v_diff);
  RETURN COALESCE(NEW, OLD);
END; $function$;

CREATE OR REPLACE FUNCTION public.fn_call_advisors_collector(p_category text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_url text := current_setting('app.settings.url', true);
  v_key text := current_setting('app.settings.service_role_key', true);
  v_full text;
  v_resp jsonb;
BEGIN
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION 'Missing app.settings.url or app.settings.service_role_key GUCs';
  END IF;
  v_full := v_url || '/functions/v1/advisors-collector' || CASE WHEN p_category IS NOT NULL THEN '?category='||p_category ELSE '' END;

  SELECT content::jsonb INTO v_resp
  FROM extensions.http_post(
    v_full,
    '{}',
    format('{"Content-Type":"application/json","Authorization":"Bearer %s","apikey":"%s"}', v_key, v_key)
  );
  -- no-op
  PERFORM 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_has_integration_secret(p_tenant uuid, p_adapter text)
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.integration_credentials ic
    WHERE ic.tenant_id = p_tenant AND ic.adapter = p_adapter
  );
$function$;

CREATE OR REPLACE FUNCTION public.fn_snapshot_job_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.job_rule_snapshots(execution_id, job_id, rules)
  SELECT NEW.id, j.id, j.rules FROM public.jobs j WHERE j.id = NEW.job_id
  ON CONFLICT (execution_id) DO NOTHING;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.fn_store_integration_secret(p_tenant uuid, p_adapter text, p_secret text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_secret_id uuid;
BEGIN
  INSERT INTO vault.secrets(name, secret)
  VALUES (concat('integration:', p_tenant::text, ':', p_adapter), p_secret)
  RETURNING id INTO v_secret_id;

  INSERT INTO public.integration_credentials(tenant_id, adapter, secret_ref)
  VALUES (p_tenant, p_adapter, v_secret_id)
  ON CONFLICT (tenant_id, adapter) DO UPDATE SET secret_ref = EXCLUDED.secret_ref;

  RETURN v_secret_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.fn_usage_increment(p_tenant uuid, p_metric text, p_inc bigint)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  INSERT INTO public.tenant_usage(id, tenant_id, metric_type, metric_value, period_start, period_end)
  VALUES (gen_random_uuid(), p_tenant, p_metric, p_inc, now() AT TIME ZONE 'utc', now() AT TIME ZONE 'utc')
  ON CONFLICT DO NOTHING;
END; $function$;

CREATE OR REPLACE FUNCTION public.fn_usage_monthly_rollup(p_tenant uuid, p_month date)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Placeholder: ensure row exists
  INSERT INTO public.tenant_usage_monthly(tenant_id, period_start)
  VALUES (p_tenant, p_month)
  ON CONFLICT (tenant_id, period_start) DO NOTHING;
END; $function$;

CREATE OR REPLACE FUNCTION public.fn_use_idempotency_key(p_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  INSERT INTO public.idempotency_keys(key) VALUES (p_key);
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END; $function$;

CREATE OR REPLACE FUNCTION pgmq.format_table_name(queue_name text, prefix text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF queue_name ~ '\$|;|--|'''
    THEN
        RAISE EXCEPTION 'queue name contains invalid characters: $, ;, --, or \''';
    END IF;
    RETURN lower(prefix || '_' || queue_name);
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
  ticket_num VARCHAR(50);
BEGIN
  ticket_num := 'TICKET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_sequence')::text, 6, '0');
  RETURN ticket_num;
END;
$function$;

CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename text)
 RETURNS TABLE(username text, password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $function$;

CREATE OR REPLACE FUNCTION public.get_change_audit_summary(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_changes', (
      SELECT COUNT(*)
      FROM audit_logs
      WHERE created_at >= NOW() - (p_days || ' days')::interval
    ),
    'changes_by_type', (
      SELECT jsonb_object_agg(resource_type, count)
      FROM (
        SELECT resource_type, COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= NOW() - (p_days || ' days')::interval
        GROUP BY resource_type
      ) subq
    ),
    'changes_by_action', (
      SELECT jsonb_object_agg(action, count)
      FROM (
        SELECT action, COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= NOW() - (p_days || ' days')::interval
        GROUP BY action
      ) subq
    ),
    'automated_decisions', (
      SELECT COUNT(*)
      FROM automated_decisions
      WHERE created_at >= NOW() - (p_days || ' days')::interval
    ),
    'automated_decisions_by_type', (
      SELECT jsonb_object_agg(decision_type, count)
      FROM (
        SELECT decision_type, COUNT(*) as count
        FROM automated_decisions
        WHERE created_at >= NOW() - (p_days || ' days')::interval
        GROUP BY decision_type
      ) subq
    )
  ) INTO v_summary;
  
  RETURN v_summary;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_tenant()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  select (auth.jwt() ->> 'tenant_id')::uuid;
$function$;

CREATE OR REPLACE FUNCTION app_private.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE COST 10
 SET search_path TO 'app_private', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid;
  v_tenant uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is NULL. Ensure a valid JWT is set.' USING ERRCODE = '28000';
  END IF;

  SELECT tm.tenant_id
    INTO v_tenant
  FROM public.tenant_memberships AS tm
  WHERE tm.user_id = v_uid
    AND tm.is_default IS TRUE
  LIMIT 1;

  IF v_tenant IS NULL THEN
    -- Fallback to latest membership if no default flagged
    SELECT tm2.tenant_id
      INTO v_tenant
    FROM public.tenant_memberships AS tm2
    WHERE tm2.user_id = v_uid
    ORDER BY tm2.is_default DESC, tm2.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'No tenant membership found for user %', v_uid USING ERRCODE = '02000';
  END IF;

  RETURN v_tenant;
END
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  select auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_default_org(p_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  select org_id
  from public.user_organizations
  where user_id = p_user_id and is_default = true
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_health_check_summary(p_hours integer DEFAULT 24)
 RETURNS TABLE(check_name text, status text, last_check timestamp with time zone, failure_count integer, success_count integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH check_results AS (
    SELECT
      (result->>'check')::TEXT as check_name,
      (result->>'status')::TEXT as status,
      hc.timestamp
    FROM health_checks hc,
    LATERAL jsonb_array_elements(hc.results) as result
    WHERE hc.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
  )
  SELECT
    check_name,
    MAX(CASE WHEN status = 'unhealthy' THEN 'unhealthy'
             WHEN status = 'degraded' THEN 'degraded'
             ELSE 'healthy' END) as status,
    MAX(timestamp) as last_check,
    COUNT(*) FILTER (WHERE status = 'unhealthy') as failure_count,
    COUNT(*) FILTER (WHERE status = 'healthy') as success_count
  FROM check_results
  GROUP BY check_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_inactive_users(p_days_inactive integer DEFAULT 7)
 RETURNS TABLE(id uuid, user_id uuid, email character varying, name character varying, plan_type character varying, industry character varying, company_name character varying, last_activity_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.plan_type,
    p.industry,
    p.company_name,
    COALESCE(
      (SELECT MAX(al.created_at) FROM activity_log al WHERE al.user_id = p.id),
      p.created_at
    ) as last_activity_at
  FROM profiles p
  WHERE p.plan_type IN ('commercial', 'enterprise')
    AND COALESCE(
      (SELECT MAX(al.created_at) FROM activity_log al WHERE al.user_id = p.id),
      p.created_at
    ) < NOW() - (p_days_inactive || ' days')::INTERVAL
    AND (p.email_preferences->>'low_activity')::boolean IS NOT FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_jwt_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
  SELECT (auth.jwt() ->> 'tenant_id')::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.get_kpi_health_status()
 RETURNS TABLE(new_users_week bigint, actions_last_hour bigint, top_post_engagement bigint, all_cylinders_firing boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT count FROM kpi_new_users_week)::BIGINT as new_users_week,
    (SELECT count FROM kpi_actions_last_hour)::BIGINT as actions_last_hour,
    COALESCE((SELECT total_engagement FROM kpi_most_engaged_post_today)::BIGINT, 0) as top_post_engagement,
    CASE
      WHEN (SELECT count FROM kpi_new_users_week) > 50 
        AND (SELECT count FROM kpi_actions_last_hour) > 100
        AND COALESCE((SELECT total_engagement FROM kpi_most_engaged_post_today), 0) > 100
      THEN true
      ELSE false
    END as all_cylinders_firing;
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.get_member_tenant_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE
 SET search_path TO 'app_private', 'pg_catalog'
AS $function$
  SELECT COALESCE(
    (
      SELECT ARRAY(
        SELECT tm.tenant_id
        FROM public.tenant_memberships tm
        WHERE tm.user_id = (SELECT auth.uid())
      )
    ), ARRAY[]::uuid[]
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_paid_users_for_monthly_summary()
 RETURNS TABLE(id uuid, user_id uuid, email character varying, name character varying, plan_type character varying, industry character varying, company_name character varying)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.plan_type,
    p.industry,
    p.company_name
  FROM profiles p
  WHERE p.plan_type IN ('commercial', 'enterprise')
    AND (p.email_preferences->>'monthly_summary')::boolean IS NOT FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_plan_limit(p_tenant uuid, p_field text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_limit integer;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(tp.%1$I, p.%1$I)
     FROM public.tenant_plans tp JOIN public.plans p ON p.id = tp.plan_id
     WHERE tp.tenant_id = $1',
    p_field
  ) INTO v_limit USING p_tenant;
  RETURN v_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_re_entry_summary(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_summary JSONB;
  v_snapshots JSONB;
  v_timeline JSONB;
BEGIN
  -- Get latest snapshot
  SELECT row_to_json(s.*) INTO v_summary
  FROM system_state_snapshots s
  ORDER BY snapshot_date DESC, created_at DESC
  LIMIT 1;
  
  -- Get snapshot timeline
  SELECT jsonb_agg(jsonb_build_object(
    'date', snapshot_date,
    'type', snapshot_type,
    'metrics', system_metrics,
    'alerts', alerts_summary
  ) ORDER BY snapshot_date DESC)
  INTO v_snapshots
  FROM system_state_snapshots
  WHERE snapshot_date >= CURRENT_DATE - (p_days || ' days')::interval;
  
  -- Get critical events timeline
  SELECT jsonb_agg(jsonb_build_object(
    'date', created_at::date,
    'severity', severity,
    'title', title,
    'message', message
  ) ORDER BY created_at DESC)
  INTO v_timeline
  FROM alerts
  WHERE severity IN ('critical', 'high')
    AND created_at >= NOW() - (p_days || ' days')::interval;
  
  RETURN jsonb_build_object(
    'current_state', v_summary,
    'snapshot_timeline', COALESCE(v_snapshots, '[]'::jsonb),
    'critical_events_timeline', COALESCE(v_timeline, '[]'::jsonb),
    'summary_period_days', p_days,
    'generated_at', NOW()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_reality_metric(p_category character varying, p_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_value JSONB; BEGIN
  SELECT value INTO v_value FROM public.reality_metrics
  WHERE category = p_category AND name = p_name;
  RETURN v_value;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_recent_console_activities(p_billing_account_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, activity_type character varying, action character varying, title character varying, status character varying, metadata jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_table_size_monitoring()
 RETURNS TABLE(table_name text, row_count bigint, table_size text, last_vacuum timestamp without time zone, last_analyze timestamp without time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    schemaname||'.'||tablename::text as table_name,
    n_live_tup::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    last_vacuum,
    last_analyze
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_tenant_from_conversation(p_conversation uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  select c.tenant_id from public.conversations c where c.id = p_conversation;
$function$;

CREATE OR REPLACE FUNCTION public.get_tenant_from_job(p_job uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  select j.tenant_id from public.jobs j where j.id = p_job;
$function$;

CREATE OR REPLACE FUNCTION public.get_tenant_from_receipt(p_receipt uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  select r.tenant_id from public.receipts r where r.id = p_receipt;
$function$;

CREATE OR REPLACE FUNCTION public.get_token_tenant()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.get_trial_users_for_email(p_days_remaining integer)
 RETURNS TABLE(id uuid, user_id uuid, email character varying, name character varying, plan_type character varying, trial_start_date timestamp with time zone, trial_end_date timestamp with time zone, days_remaining integer, industry character varying, company_name character varying, last_email_type character varying, last_email_sent_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.plan_type,
    p.trial_start_date,
    p.trial_end_date,
    EXTRACT(DAY FROM (p.trial_end_date - NOW()))::INTEGER as days_remaining,
    p.industry,
    p.company_name,
    p.last_email_type,
    p.last_email_sent_at
  FROM profiles p
  WHERE p.plan_type = 'trial'
    AND p.trial_end_date IS NOT NULL
    AND p.trial_end_date > NOW()
    AND EXTRACT(DAY FROM (p.trial_end_date - NOW()))::INTEGER = p_days_remaining
    AND (
      -- Only send if we haven't sent this specific email type today
      p.last_email_type IS NULL 
      OR p.last_email_sent_at < NOW() - INTERVAL '1 day'
      OR p.last_email_type != ('trial_day' || p_days_remaining::text)
    )
    AND (p.email_preferences->>'lifecycle_emails')::boolean IS NOT FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_trials_expiring_soon(p_days_ahead integer DEFAULT 3)
 RETURNS TABLE(user_id uuid, email text, name text, trial_end_date timestamp with time zone, days_remaining integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.trial_end_date,
    EXTRACT(DAY FROM (p.trial_end_date - NOW()))::INTEGER as days_remaining
  FROM profiles p
  WHERE p.plan_type = 'trial'
    AND p.trial_end_date IS NOT NULL
    AND p.trial_end_date > NOW()
    AND EXTRACT(DAY FROM (p.trial_end_date - NOW()))::INTEGER <= p_days_ahead
    AND p.deleted_at IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_activity_metrics(user_id uuid)
 RETURNS TABLE(active_last_7_days boolean, active_days_last_30 integer, days_since_last_activity integer, total_jobs_created integer, has_upgraded boolean, using_premium_features boolean, explicitly_cancelled boolean, has_payment_issues boolean, usage_percentage numeric, integration_count integer, viewed_enterprise_features boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    -- Active in last 7 days
    EXISTS (
      SELECT 1 FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
      AND created_at > NOW() - INTERVAL '7 days'
    ) AS active_last_7_days,
    
    -- Active days in last 30
    COALESCE((
      SELECT COUNT(DISTINCT DATE(created_at))::INTEGER
      FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
      AND created_at > NOW() - INTERVAL '30 days'
    ), 0) AS active_days_last_30,
    
    -- Days since last activity
    COALESCE((
      SELECT EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER
      FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
    ), 999) AS days_since_last_activity,
    
    -- Total jobs created
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
    ), 0) AS total_jobs_created,
    
    -- Has upgraded
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = get_user_activity_metrics.user_id
      AND status = 'active'
      AND plan_type IN ('commercial', 'enterprise')
    ) AS has_upgraded,
    
    -- Using premium features (mock for now)
    FALSE AS using_premium_features,
    
    -- Explicitly cancelled
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = get_user_activity_metrics.user_id
      AND status = 'cancelled'
      AND cancelled_at IS NOT NULL
    ) AS explicitly_cancelled,
    
    -- Has payment issues
    EXISTS (
      SELECT 1 FROM payment_recovery
      WHERE payment_recovery.user_id = get_user_activity_metrics.user_id
      AND status = 'active'
    ) AS has_payment_issues,
    
    -- Usage percentage (mock calculation)
    50.0 AS usage_percentage,
    
    -- Integration count
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM integration_credentials
      WHERE integration_credentials.user_id = get_user_activity_metrics.user_id
      AND status = 'active'
    ), 0) AS integration_count,
    
    -- Viewed enterprise features (mock)
    FALSE AS viewed_enterprise_features;
END;
$function$;

-- Drop old app_private function if it exists
DROP FUNCTION IF EXISTS app_private.get_user_org_ids();

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
 RETURNS SETOF uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare col_exists boolean; begin
  select exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_organizations' and column_name='org_id') into col_exists;
  if col_exists then
    return query select org_id from public.user_organizations where user_id = (select auth.uid());
    return; end if;
  select exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_organizations' and column_name='organization_id') into col_exists;
  if col_exists then
    return query select organization_id from public.user_organizations where user_id = (select auth.uid());
    return; end if;
  select exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_organizations' and column_name='tenant_id') into col_exists;
  if col_exists then
    return query select tenant_id from public.user_organizations where user_id = (select auth.uid());
    return; end if;
  raise exception 'user_organizations must contain org_id/organization_id/tenant_id';
end; $function$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT (auth.jwt() ->> 'user_role')::text;
$function$;

CREATE OR REPLACE FUNCTION app_private.get_user_tenant()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT tenant_id
  FROM public.users
  WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  claim text := (auth.jwt() ->> 'tenant_id');
BEGIN
  IF claim IS NULL THEN
    RETURN NULL; -- deny by default when no tenant_id claim
  END IF;
  RETURN claim::uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.get_user_tenant_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'app_private', 'public', 'pg_catalog'
AS $function$
  SELECT tenant_id FROM app_private.memberships
  WHERE user_id = (SELECT auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$SELECT tm.tenant_id FROM public.tenant_memberships tm WHERE tm.user_id = (SELECT auth.uid());$function$;

CREATE OR REPLACE FUNCTION public.get_user_workspace_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT COALESCE(ARRAY_AGG(tenant_id)::uuid[], ARRAY[]::uuid[])
    FROM tenant_users
    WHERE user_id = auth.uid();
  $function$;

CREATE OR REPLACE FUNCTION public.handle_payment_failure(p_billing_account_id uuid, p_stripe_invoice_id character varying, p_failure_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_recon_id UUID;
  v_subscription RECORD;
BEGIN
  -- Get subscription details
  SELECT s.* INTO v_subscription
  FROM subscriptions s
  WHERE s.billing_account_id = p_billing_account_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  IF v_subscription IS NULL THEN
    RAISE EXCEPTION 'No active subscription found for billing account %', p_billing_account_id;
  END IF;
  
  -- Log payment failure
  INSERT INTO billing_reconciliation_log (
    billing_account_id,
    reconciliation_type,
    period_start,
    period_end,
    status,
    stripe_invoice_id,
    stripe_subscription_id,
    details
  ) VALUES (
    p_billing_account_id,
    'payment_failed',
    NOW() - INTERVAL '1 day',
    NOW(),
    'failed',
    p_stripe_invoice_id,
    v_subscription.stripe_subscription_id,
    jsonb_build_object(
      'failure_reason', p_failure_reason,
      'handled_at', NOW()
    )
  ) RETURNING id INTO v_recon_id;
  
  -- Update subscription status (Stripe webhook should handle this, but ensure it)
  UPDATE subscriptions
  SET status = 'past_due'
  WHERE id = v_subscription.id;
  
  -- Trigger alert
  INSERT INTO alerts (
    severity,
    title,
    message,
    check_type,
    details
  ) VALUES (
    'high',
    'Payment Failure Detected',
    format('Payment failed for billing account %s: %s', p_billing_account_id, p_failure_reason),
    'payment_failure',
    jsonb_build_object(
      'billing_account_id', p_billing_account_id,
      'stripe_invoice_id', p_stripe_invoice_id,
      'failure_reason', p_failure_reason
    )
  );
  
  RETURN v_recon_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_trial_expiration()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  -- Update expired trials to free tier
  UPDATE profiles
  SET plan_type = 'free',
      trial_end_date = NULL,
      updated_at = NOW()
  WHERE plan_type = 'trial'
    AND trial_end_date IS NOT NULL
    AND trial_end_date < NOW()
    AND (trial_end_date + INTERVAL '1 day') > NOW(); -- Only process once per day

  -- Log trial expirations
  INSERT INTO activity_log (user_id, activity_type, entity_type, entity_id, metadata)
  SELECT 
    id,
    'trial_expired',
    'profile',
    id,
    jsonb_build_object(
      'trial_start_date', trial_start_date,
      'trial_end_date', trial_end_date,
      'expired_at', NOW()
    )
  FROM profiles
  WHERE plan_type = 'free'
    AND trial_end_date IS NOT NULL
    AND updated_at > NOW() - INTERVAL '1 minute'; -- Only log recent expirations
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_offboarding()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.has_cms_write_role()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT (auth.jwt() ->> 'user_role') IN ('owner','admin','editor')
$function$;

CREATE OR REPLACE FUNCTION app_private.has_tenant_role(tenant uuid, role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'app_private', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    WHERE tm.tenant_id = tenant AND tm.user_id = auth.uid() AND tm.role = role
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(user_id uuid, tenant_id uuid, role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  -- Example body; replace with your actual logic.
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.user_id = user_id
      AND tm.tenant_id = tenant_id
      AND tm.role = role
  );
$function$;

CREATE OR REPLACE FUNCTION net.http_collect_response(request_id bigint, async boolean DEFAULT true)
 RETURNS net.http_response_result
 LANGUAGE plpgsql
AS $function$
begin
  raise notice 'The net.http_collect_response function is deprecated.';
  select net._http_collect_response(request_id, async);
end;
$function$;

CREATE OR REPLACE FUNCTION net.http_delete(url text, params jsonb DEFAULT '{}'::jsonb, headers jsonb DEFAULT '{}'::jsonb, timeout_milliseconds integer DEFAULT 5000, body jsonb DEFAULT NULL::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
declare
    request_id bigint;
    params_array text[];
begin
    select coalesce(array_agg(net._urlencode_string(key) || '=' || net._urlencode_string(value)), '{}')
    into params_array
    from jsonb_each_text(params);

    -- Add to the request queue
    insert into net.http_request_queue(method, url, headers, body, timeout_milliseconds)
    values (
        'DELETE',
        net._encode_url_with_params_array(url, params_array),
        headers,
        convert_to(body::text, 'UTF8'),
        timeout_milliseconds
    )
    returning id
    into request_id;

    perform net.wake();

    return request_id;
end
$function$;

CREATE OR REPLACE FUNCTION net.http_get(url text, params jsonb DEFAULT '{}'::jsonb, headers jsonb DEFAULT '{}'::jsonb, timeout_milliseconds integer DEFAULT 5000)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
declare
    request_id bigint;
    params_array text[];
begin
    select coalesce(array_agg(net._urlencode_string(key) || '=' || net._urlencode_string(value)), '{}')
    into params_array
    from jsonb_each_text(params);

    -- Add to the request queue
    insert into net.http_request_queue(method, url, headers, timeout_milliseconds)
    values (
        'GET',
        net._encode_url_with_params_array(url, params_array),
        headers,
        timeout_milliseconds
    )
    returning id
    into request_id;

    perform net.wake();

    return request_id;
end
$function$;

CREATE OR REPLACE FUNCTION net.http_post(url text, body jsonb DEFAULT '{}'::jsonb, params jsonb DEFAULT '{}'::jsonb, headers jsonb DEFAULT '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds integer DEFAULT 5000)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
declare
    request_id bigint;
    params_array text[];
    content_type text;
begin

    -- Exctract the content_type from headers
    select
        header_value into content_type
    from
        jsonb_each_text(coalesce(headers, '{}'::jsonb)) r(header_name, header_value)
    where
        lower(header_name) = 'content-type'
    limit
        1;

    -- If the user provided new headers and omitted the content type
    -- add it back in automatically
    if content_type is null then
        select headers || '{"Content-Type": "application/json"}'::jsonb into headers;
    end if;

    -- Confirm that the content-type is set as "application/json"
    if content_type <> 'application/json' then
        raise exception 'Content-Type header must be "application/json"';
    end if;

    select
        coalesce(array_agg(net._urlencode_string(key) || '=' || net._urlencode_string(value)), '{}')
    into
        params_array
    from
        jsonb_each_text(params);

    -- Add to the request queue
    insert into net.http_request_queue(method, url, headers, body, timeout_milliseconds)
    values (
        'POST',
        net._encode_url_with_params_array(url, params_array),
        headers,
        convert_to(body::text, 'UTF8'),
        timeout_milliseconds
    )
    returning id
    into request_id;

    perform net.wake();

    return request_id;
end
$function$;

CREATE OR REPLACE FUNCTION public.increment_tenant_quota_usage(p_tenant_id uuid, p_quota_type text, p_value bigint DEFAULT 1)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO tenant_quota_usage (tenant_id, current_storage_bytes, current_concurrent_jobs, updated_at)
  VALUES (p_tenant_id, 0, 0, NOW())
  ON CONFLICT (tenant_id) DO UPDATE SET
    current_storage_bytes = CASE
      WHEN p_quota_type = 'storageBytes' THEN tenant_quota_usage.current_storage_bytes + p_value
      ELSE tenant_quota_usage.current_storage_bytes
    END,
    current_concurrent_jobs = CASE
      WHEN p_quota_type = 'concurrentJobs' THEN tenant_quota_usage.current_concurrent_jobs + p_value
      ELSE tenant_quota_usage.current_concurrent_jobs
    END,
    updated_at = NOW();
    
  IF p_quota_type = 'reconciliation' THEN
    INSERT INTO tenant_usage (tenant_id, metric_type, metric_value, period_start, period_end)
    VALUES (
      p_tenant_id,
      'reconciliation',
      p_value,
      date_trunc('month', NOW()),
      date_trunc('month', NOW()) + INTERVAL '1 month'
    )
    ON CONFLICT (tenant_id, metric_type, period_start) DO UPDATE SET
      metric_value = tenant_usage.metric_value + p_value;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_tenant_usage(p_tenant_id uuid, p_metric_type text, p_delta bigint)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  INSERT INTO public.tenant_usage (id, tenant_id, metric_type, metric_value, period_start, period_end)
  VALUES (gen_random_uuid(), p_tenant_id, p_metric_type, p_delta, date_trunc('month', now()), (date_trunc('month', now()) + interval '1 month'))
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.tenant_usage
  SET metric_value = metric_value + p_delta
  WHERE tenant_id = p_tenant_id
    AND metric_type = p_metric_type
    AND period_start = date_trunc('month', now());
END $function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = get_token_tenant()
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.billing_accounts ba
    WHERE ba.user_id = user_id
    AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_user_id uuid, p_conversation_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members AS cm
    WHERE cm.user_id = p_user_id
      AND cm.conversation_id = p_conversation_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip character varying, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip = p_ip
      AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
      AND unblocked_at IS NULL
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_member_of_conversation(conv_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = conv_id
      AND cm.user_id = (SELECT auth.uid())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_metric_proven(p_category character varying, p_name character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_status VARCHAR; BEGIN
  SELECT status INTO v_status FROM public.reality_metrics
  WHERE category = p_category AND name = p_name;
  RETURN COALESCE(v_status = 'proven', false);
END; $function$;

CREATE OR REPLACE FUNCTION public.is_paid(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  v_is_paid BOOLEAN := false;
BEGIN
  -- Check if user has an active or trialing subscription
  SELECT EXISTS(
    SELECT 1
    FROM public.subscriptions s
    INNER JOIN public.billing_accounts ba ON s.billing_account_id = ba.id
    WHERE ba.user_id = p_user_id
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > NOW()
  ) INTO v_is_paid;
  RETURN v_is_paid;
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.is_tenant_admin(p_tenant uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'app_private', 'public', 'pg_catalog'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM app_private.memberships m
    WHERE m.user_id = (SELECT auth.uid()) AND m.tenant_id = p_tenant AND m.role IN ('owner','admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = (auth.jwt()->>'sub')::uuid
      AND ut.tenant_id = public.jwt_tenant_id()
      AND ut.role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION app_private.is_tenant_member(tenant uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'app_private', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    WHERE tm.tenant_id = tenant AND tm.user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_user_tenant_member(p_tenant uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  select exists (
    select 1 from public.user_organizations uo
    where uo.user_id = auth.uid() and uo.org_id = p_tenant
  );
$function$;

CREATE OR REPLACE FUNCTION cron.job_cache_invalidate()
 RETURNS trigger
 LANGUAGE c
AS '$libdir/pg_cron', $function$cron_job_cache_invalidate$function$;

CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$;

CREATE OR REPLACE FUNCTION public.jwt_custom_claims()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  with me as (
    select auth.uid() as uid
  ),
  default_org as (
    select uo.org_id
    from public.user_organizations uo
    join me on me.uid = uo.user_id
    where uo.is_default = true
    limit 1
  )
  select coalesce(
    jsonb_build_object(
      'org_id', (select org_id::text from default_org)
    ),
    '{}'::jsonb
  );
$function$;

CREATE OR REPLACE FUNCTION public.jwt_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT NULLIF(auth.jwt()->>'tenant_id','')::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.link_stripe_customer(p_tenant_id uuid, p_customer_id text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  insert into public.stripe_customers as sc (customer_id, tenant_id)
  values (p_customer_id, p_tenant_id)
  on conflict (customer_id)
  do update set tenant_id = excluded.tenant_id
  where sc.tenant_id is distinct from excluded.tenant_id;
end;
$function$;

CREATE OR REPLACE FUNCTION pgmq.list_queues()
 RETURNS SETOF pgmq.queue_record
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM pgmq.meta;
END
$function$;

CREATE OR REPLACE FUNCTION app_private.load_app_secrets()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
begin
  perform set_config('app.encryption_key', current_setting('APP_ENCRYPTION_KEY', true), false);
  perform set_config('app.hmac_key', current_setting('APP_HMAC_KEY', true), false);
end; $function$;

CREATE OR REPLACE FUNCTION public.log_audit_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_api_key_id uuid := nullif(auth.jwt() ->> 'api_key_id', '')::uuid;
  v_ip text := nullif(auth.jwt() ->> 'ip', '');
  v_user_agent text := nullif(auth.jwt() ->> 'user_agent', '');
  v_tenant_id uuid := coalesce(new.tenant_id, old.tenant_id, public.current_tenant_id());
  v_event text := tg_op;
  v_payload jsonb;
begin
  if tg_op = 'INSERT' then
    v_payload := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_payload := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
  else
    v_payload := to_jsonb(old);
  end if;

  insert into public.audit_logs (tenant_id, event, user_id, api_key_id, ip, user_agent, metadata, timestamp)
  values (
    v_tenant_id,
    tg_table_schema || '.' || tg_table_name || ':' || v_event,
    v_user_id,
    v_api_key_id,
    v_ip,
    v_user_agent,
    jsonb_build_object('row', v_payload),
    now()
  );

  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_event character varying, p_tenant_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid, p_api_key_id uuid DEFAULT NULL::uuid, p_action_type character varying DEFAULT NULL::character varying, p_resource_type character varying DEFAULT NULL::character varying, p_resource_id uuid DEFAULT NULL::uuid, p_billing_account_id uuid DEFAULT NULL::uuid, p_integration_id character varying DEFAULT NULL::character varying, p_ip character varying DEFAULT NULL::character varying, p_user_agent text DEFAULT NULL::text, p_method character varying DEFAULT NULL::character varying, p_path character varying DEFAULT NULL::character varying, p_status_code integer DEFAULT NULL::integer, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    api_key_id,
    event,
    action_type,
    resource_type,
    resource_id,
    billing_account_id,
    integration_id,
    ip,
    user_agent,
    method,
    path,
    status_code,
    metadata,
    timestamp
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_api_key_id,
    p_event,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_billing_account_id,
    p_integration_id,
    p_ip,
    p_user_agent,
    p_method,
    p_path,
    p_status_code,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_automated_decision(p_decision_type character varying, p_decision_context jsonb, p_decision_outcome jsonb, p_reasoning text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_decision_id UUID;
BEGIN
  INSERT INTO automated_decisions (
    decision_type,
    decision_context,
    decision_outcome,
    reasoning
  ) VALUES (
    p_decision_type,
    p_decision_context,
    p_decision_outcome,
    p_reasoning
  ) RETURNING id INTO v_decision_id;
  
  RETURN v_decision_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_confidence_event(p_source_type character varying, p_source_id uuid, p_confidence_score numeric, p_threshold numeric DEFAULT 0.7, p_result_data jsonb DEFAULT '{}'::jsonb, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_event_id UUID;
  v_is_low BOOLEAN;
BEGIN
  v_is_low := p_confidence_score < p_threshold;
  
  INSERT INTO confidence_events (
    source_type,
    source_id,
    confidence_score,
    threshold,
    result_data,
    metadata,
    flagged_low_confidence
  ) VALUES (
    p_source_type,
    p_source_id,
    p_confidence_score,
    p_threshold,
    p_result_data,
    p_metadata,
    v_is_low
  ) RETURNING id INTO v_event_id;
  
  -- If low confidence, flag for user notification
  IF v_is_low THEN
    -- Update source record to indicate low confidence
    -- This depends on source type - for receipts, update receipt table
    IF p_source_type = 'receipt_parse' THEN
      UPDATE receipts
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'low_confidence', true,
        'confidence_score', p_confidence_score,
        'confidence_event_id', v_event_id
      )
      WHERE id = p_source_id;
    END IF;
  END IF;
  
  RETURN v_event_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_console_activity(p_user_id uuid, p_billing_account_id uuid, p_activity_type character varying, p_action character varying, p_title character varying, p_description text DEFAULT NULL::text, p_status character varying DEFAULT 'success'::character varying, p_metadata jsonb DEFAULT '{}'::jsonb, p_resource_id uuid DEFAULT NULL::uuid, p_resource_type character varying DEFAULT NULL::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_error(p_tenant_id uuid, p_error_type character varying, p_severity character varying, p_message text, p_stack_trace text DEFAULT NULL::text, p_context jsonb DEFAULT '{}'::jsonb, p_user_id uuid DEFAULT NULL::uuid, p_api_key_id uuid DEFAULT NULL::uuid, p_request_id character varying DEFAULT NULL::character varying, p_url text DEFAULT NULL::text, p_method character varying DEFAULT NULL::character varying, p_status_code integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO error_logs (
    tenant_id,
    error_type,
    severity,
    message,
    stack_trace,
    context,
    user_id,
    api_key_id,
    request_id,
    url,
    method,
    status_code
  ) VALUES (
    p_tenant_id,
    p_error_type,
    p_severity,
    p_message,
    p_stack_trace,
    p_context,
    p_user_id,
    p_api_key_id,
    p_request_id,
    p_url,
    p_method,
    p_status_code
  ) RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_job_failure(p_job_type character varying, p_job_id uuid, p_error_message text, p_error_stack text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_failure_id UUID;
  v_existing_failure UUID;
  v_retry_count INTEGER;
  v_next_retry_at TIMESTAMPTZ;
BEGIN
  -- Check for existing failure for this job
  SELECT id, retry_count INTO v_existing_failure, v_retry_count
  FROM job_failure_log
  WHERE job_type = p_job_type
    AND job_id = p_job_id
    AND status IN ('pending_retry', 'retrying')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_existing_failure IS NOT NULL THEN
    -- Increment retry count
    v_retry_count := v_retry_count + 1;
    
    -- Calculate exponential backoff: 5min, 15min, 45min, 2h
    v_next_retry_at := NOW() + (
      CASE v_retry_count
        WHEN 1 THEN INTERVAL '5 minutes'
        WHEN 2 THEN INTERVAL '15 minutes'
        WHEN 3 THEN INTERVAL '45 minutes'
        WHEN 4 THEN INTERVAL '2 hours'
        ELSE INTERVAL '6 hours'
      END
    );
    
    -- Update existing failure
    UPDATE job_failure_log
    SET
      error_message = p_error_message,
      error_stack = p_error_stack,
      retry_count = v_retry_count,
      status = CASE 
        WHEN v_retry_count >= max_retries THEN 'failed'
        ELSE 'pending_retry'
      END,
      next_retry_at = v_next_retry_at,
      updated_at = NOW(),
      metadata = metadata || p_metadata
    WHERE id = v_existing_failure;
    
    RETURN v_existing_failure;
  ELSE
    -- Create new failure record
    v_next_retry_at := NOW() + INTERVAL '5 minutes';
    
    INSERT INTO job_failure_log (
      job_type,
      job_id,
      error_message,
      error_stack,
      retry_count,
      next_retry_at,
      metadata
    ) VALUES (
      p_job_type,
      p_job_id,
      p_error_message,
      p_error_stack,
      0,
      v_next_retry_at,
      p_metadata
    ) RETURNING id INTO v_failure_id;
    
    RETURN v_failure_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_usage_event(p_billing_account_id uuid, p_event_type character varying, p_quantity numeric DEFAULT 1, p_project_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid, p_tenant_id uuid DEFAULT NULL::uuid, p_integration_id character varying DEFAULT NULL::character varying, p_add_on_id uuid DEFAULT NULL::uuid, p_unit character varying DEFAULT NULL::character varying, p_metadata jsonb DEFAULT '{}'::jsonb, p_idempotency_key character varying DEFAULT NULL::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_event_id UUID;
  v_existing_event_id UUID;
  v_idempotency_key VARCHAR(255);
  v_previous_usage DECIMAL(15, 6);
  v_current_usage DECIMAL(15, 6);
  v_usage_spike_percentage DECIMAL(10, 2);
  v_fraud_signal_id UUID;
BEGIN
  -- Generate idempotency key if not provided
  IF p_idempotency_key IS NULL THEN
    v_idempotency_key := encode(gen_random_bytes(32), 'hex');
  ELSE
    v_idempotency_key := p_idempotency_key;
  END IF;

  -- Check for existing event with same idempotency key
  SELECT usage_event_id INTO v_existing_event_id
  FROM usage_event_idempotency
  WHERE idempotency_key = v_idempotency_key
    AND expires_at > NOW();

  IF v_existing_event_id IS NOT NULL THEN
    -- Return existing event ID (idempotent)
    RETURN v_existing_event_id;
  END IF;

  -- Validate billing account exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM billing_accounts
    WHERE id = p_billing_account_id
      AND status = 'active'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Billing account not found or inactive';
  END IF;

  -- Server-side validation: Check if integration is configured (if integration_id provided)
  IF p_integration_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM integration_credentials ic
      JOIN billing_accounts ba ON ba.tenant_id = ic.tenant_id
      WHERE ba.id = p_billing_account_id
        AND ic.adapter = p_integration_id
    ) THEN
      RAISE WARNING 'Usage logged for unconfigured integration: %', p_integration_id;
    END IF;
  END IF;

  -- Insert usage event
  INSERT INTO usage_events (
    billing_account_id,
    project_id,
    user_id,
    tenant_id,
    event_type,
    integration_id,
    add_on_id,
    quantity,
    unit,
    metadata,
    timestamp
  ) VALUES (
    p_billing_account_id,
    p_project_id,
    p_user_id,
    p_tenant_id,
    p_event_type,
    p_integration_id,
    p_add_on_id,
    p_quantity,
    p_unit,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_event_id;

  -- Store idempotency key
  INSERT INTO usage_event_idempotency (
    idempotency_key,
    billing_account_id,
    usage_event_id,
    event_type,
    quantity
  ) VALUES (
    v_idempotency_key,
    p_billing_account_id,
    v_event_id,
    p_event_type,
    p_quantity
  );

  -- Fraud detection: Check for usage spikes
  -- Compare last 24 hours vs previous 24 hours
  SELECT COALESCE(SUM(quantity), 0) INTO v_current_usage
  FROM usage_events
  WHERE billing_account_id = p_billing_account_id
    AND event_type = p_event_type
    AND timestamp >= NOW() - INTERVAL '24 hours';

  SELECT COALESCE(SUM(quantity), 0) INTO v_previous_usage
  FROM usage_events
  WHERE billing_account_id = p_billing_account_id
    AND event_type = p_event_type
    AND timestamp >= NOW() - INTERVAL '48 hours'
    AND timestamp < NOW() - INTERVAL '24 hours';

  -- Calculate spike percentage
  IF v_previous_usage > 0 THEN
    v_usage_spike_percentage := ((v_current_usage - v_previous_usage) / v_previous_usage) * 100;
  ELSE
    -- If no previous usage, any usage is 100% spike (but not suspicious if small)
    v_usage_spike_percentage := CASE WHEN v_current_usage > 1000 THEN 1000 ELSE 0 END;
  END IF;

  -- Flag suspicious usage spikes (>300% increase)
  IF v_usage_spike_percentage > 300 AND v_current_usage > 100 THEN
    INSERT INTO fraud_signals (
      billing_account_id,
      signal_type,
      severity,
      description,
      metadata
    ) VALUES (
      p_billing_account_id,
      'usage_spike',
      CASE
        WHEN v_usage_spike_percentage > 1000 THEN 'critical'
        WHEN v_usage_spike_percentage > 500 THEN 'high'
        ELSE 'medium'
      END,
      format('Usage spike detected: %s%% increase in %s events (current: %s, previous: %s)',
        ROUND(v_usage_spike_percentage, 2),
        p_event_type,
        v_current_usage,
        v_previous_usage
      ),
      jsonb_build_object(
        'event_type', p_event_type,
        'current_usage', v_current_usage,
        'previous_usage', v_previous_usage,
        'spike_percentage', v_usage_spike_percentage,
        'usage_event_id', v_event_id
      )
    )
    RETURNING id INTO v_fraud_signal_id;

    -- Log fraud signal for monitoring
    RAISE WARNING 'Fraud signal created: % (spike: %%)', 
      format('%s (spike: %s%%)', v_fraud_signal_id::text, ROUND(v_usage_spike_percentage, 2)::text);
  END IF;

  RETURN v_event_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_welcome_step_on_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO onboarding_progress (user_id, step, completed, updated_at)
  VALUES (NEW.id, 'welcome', TRUE, NOW())
  ON CONFLICT (user_id, step) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.member_tenant_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'app_private', 'pg_catalog'
AS $function$
  select tenant_id::uuid from user_tenants where user_id = (select auth.uid());
$function$;

CREATE OR REPLACE FUNCTION app_private.memberships_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'app_private', 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'tenant:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text,
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.messages_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
begin
  perform realtime.broadcast_changes(
    'conversation:' || coalesce(new.conversation_id, old.conversation_id)::text || ':messages',
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.messages_rate_limit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.enforce_rate_limit(new.tenant_id, 'messages');
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION pgmq.metrics(queue_name text)
 RETURNS pgmq.metrics_result
 LANGUAGE plpgsql
AS $function$
DECLARE
    result_row pgmq.metrics_result;
    query TEXT;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
    query := FORMAT(
        $QUERY$
        WITH q_summary AS (
            SELECT
                count(*) as queue_length,
                count(CASE WHEN vt <= NOW() THEN 1 END) as queue_visible_length,
                EXTRACT(epoch FROM (NOW() - max(enqueued_at)))::int as newest_msg_age_sec,
                EXTRACT(epoch FROM (NOW() - min(enqueued_at)))::int as oldest_msg_age_sec,
                NOW() as scrape_time
            FROM pgmq.%I
        ),
        all_metrics AS (
            SELECT CASE
                WHEN is_called THEN last_value ELSE 0
                END as total_messages
            FROM pgmq.%I
        )
        SELECT
            %L as queue_name,
            q_summary.queue_length,
            q_summary.newest_msg_age_sec,
            q_summary.oldest_msg_age_sec,
            all_metrics.total_messages,
            q_summary.scrape_time,
            q_summary.queue_visible_length
        FROM q_summary, all_metrics
        $QUERY$,
        qtable, qtable || '_msg_id_seq', queue_name
    );
    EXECUTE query INTO result_row;
    RETURN result_row;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.metrics_all()
 RETURNS SETOF pgmq.metrics_result
 LANGUAGE plpgsql
AS $function$
DECLARE
    row_name RECORD;
    result_row pgmq.metrics_result;
BEGIN
    FOR row_name IN SELECT queue_name FROM pgmq.meta LOOP
        result_row := pgmq.metrics(row_name.queue_name);
        RETURN NEXT result_row;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_impact_score_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.impact_score > 0 THEN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      NEW.user_id,
      'impact_score_update',
      'Impact Score Updated',
      'Your positioning feedback earned you ' || NEW.impact_score || ' impact points!',
      'positioning_feedback',
      NEW.id,
      jsonb_build_object('impact_score', NEW.impact_score)
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.pop(queue_name text)
 RETURNS SETOF pgmq.message_record
 LANGUAGE plpgsql
AS $function$
DECLARE
    sql TEXT;
    result pgmq.message_record;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
    sql := FORMAT(
        $QUERY$
        WITH cte AS
            (
                SELECT msg_id
                FROM pgmq.%I
                WHERE vt <= clock_timestamp()
                ORDER BY msg_id ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
        DELETE from pgmq.%I
        WHERE msg_id = (select msg_id from cte)
        RETURNING *;
        $QUERY$,
        qtable, qtable
    );
    RETURN QUERY EXECUTE sql;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq_public.pop(queue_name text)
 RETURNS SETOF pgmq.message_record
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return query select * from pgmq.pop( queue_name := queue_name ); end; $function$;

CREATE OR REPLACE FUNCTION public.preview_token_allows(page_id uuid, token text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.preview_tokens t
    JOIN public.cms_pages p ON p.id = t.page_id
    WHERE t.page_id = preview_token_allows.page_id
      AND t.token = preview_token_allows.token
      AND t.expires_at > now()
      AND t.can_view_unpublished = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.process_unresolved_confusion()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_confusion RECORD;
  v_result jsonb := '[]'::jsonb;
  v_processed INTEGER := 0;
BEGIN
  -- Process unresolved confusion events older than 5 minutes
  FOR v_confusion IN
    SELECT *
    FROM user_confusion_events
    WHERE resolved_at IS NULL
      AND detected_at < NOW() - INTERVAL '5 minutes'
    ORDER BY 
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      detected_at ASC
    LIMIT 20
  LOOP
    BEGIN
      PERFORM auto_resolve_confusion(v_confusion.id);
      v_processed := v_processed + 1;
      v_result := v_result || jsonb_build_object(
        'confusion_id', v_confusion.id,
        'status', 'resolved'
      );
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object(
        'confusion_id', v_confusion.id,
        'status', 'error',
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed', v_processed,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_webhook_outbox()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE r RECORD;
BEGIN
  FOR r IN 
    SELECT id FROM public.receipt_webhook_outbox 
    WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY created_at ASC
    LIMIT 50
  LOOP
    UPDATE public.receipt_webhook_outbox
      SET status = 'processing', attempts = attempts + 1, next_retry_at = now() + interval '1 minute'
      WHERE id = r.id;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_tenant_id_to_api_keys()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_tenant_id_to_executions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_tenant_id_to_idempotency_keys()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_tenant_id_to_jobs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_tenant_id_to_matches()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_tenant_id_to_reports()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_tenant_id_to_unmatched()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_tenant_id_to_webhooks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.provision_trial_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  trial_days INTEGER := 14;
  trial_start TIMESTAMPTZ := NOW();
  trial_end TIMESTAMPTZ := trial_start + (trial_days || ' days')::INTERVAL;
BEGIN
  -- Only provision trial if user doesn't already have a plan_type set
  -- This allows manual overrides if needed
  IF NEW.plan_type IS NULL OR NEW.plan_type = 'free' THEN
    NEW.plan_type := 'trial';
    NEW.trial_start_date := trial_start;
    NEW.trial_end_date := trial_end;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.purge_audit_logs()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  perform 1;
  delete from public.audit_logs al
  where al.timestamp < now() - interval '90 days';
end; $function$;

CREATE OR REPLACE FUNCTION analytics.purge_old_index_usage(p_keep_days integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'analytics', 'public', 'pg_temp'
AS $function$
DECLARE v_count int;
BEGIN
  DELETE FROM analytics.index_usage_snapshots
  WHERE captured_at < now() - make_interval(days => p_keep_days);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.purge_old_stripe_webhook_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_days int;
  v_deleted int;
begin
  select days into v_days from public.retention_policies where key = 'stripe_webhook_logs';
  if v_days is null then
    v_days := 30;
  end if;
  delete from public.stripe_webhook_logs
  where received_at < now() - make_interval(days => v_days);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

CREATE OR REPLACE FUNCTION pgmq.purge_queue(queue_name text)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
  deleted_count INTEGER;
  qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
  -- Get the row count before truncating
  EXECUTE format('SELECT count(*) FROM pgmq.%I', qtable) INTO deleted_count;

  -- Use TRUNCATE for better performance on large tables
  EXECUTE format('TRUNCATE TABLE pgmq.%I', qtable);

  -- Return the number of purged rows
  RETURN deleted_count;
END
$function$;

CREATE OR REPLACE FUNCTION app_private.purge_security_events()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  delete from public.security_events se
  where se.created_at < now() - interval '180 days';
end; $function$;

CREATE OR REPLACE FUNCTION app_private.purge_stripe_events()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  delete from public.stripe_events se
  where se.received_at < now() - interval '180 days';
end; $function$;

CREATE OR REPLACE FUNCTION app_private.purge_stripe_webhook_logs()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  delete from public.stripe_webhook_logs swl
  where swl.received_at < now() - interval '90 days';
end; $function$;

CREATE OR REPLACE FUNCTION app_private.purge_webhook_deliveries()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  delete from public.webhook_deliveries wd
  where wd.delivered_at is not null and wd.delivered_at < now() - interval '30 days';
end; $function$;

CREATE OR REPLACE FUNCTION app_private.purge_webhook_payloads()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  delete from public.webhook_payloads wp
  where wp.processed = true and wp.received_at < now() - interval '30 days';
end; $function$;

CREATE OR REPLACE FUNCTION public.quota_before_insert_extraction()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_tenant uuid;
BEGIN
  v_tenant := COALESCE(
    NEW.tenant_id,
    (SELECT ba.tenant_id
     FROM public.receipt_uploads ru
     JOIN public.billing_accounts ba ON ba.id = ru.billing_account_id
     WHERE ru.id = NEW.upload_id)
  );
  IF v_tenant IS NOT NULL THEN
    PERFORM public.enforce_quota(v_tenant, 'extractions');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.quota_before_insert_upload()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_tenant uuid;
BEGIN
  v_tenant := COALESCE(
    NEW.tenant_id,
    (SELECT ba.tenant_id FROM public.billing_accounts ba WHERE ba.id = NEW.billing_account_id)
  );
  IF v_tenant IS NOT NULL THEN
    PERFORM public.enforce_quota(v_tenant, 'uploads');
    PERFORM public.enforce_quota(v_tenant, 'storage_mb');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.re_extracted_set_tenant_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF NEW.upload_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT ba.tenant_id INTO NEW.tenant_id
  FROM public.receipt_uploads ru
  JOIN public.billing_accounts ba ON ba.id = ru.billing_account_id
  WHERE ru.id = NEW.upload_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.read(queue_name text, vt integer, qty integer, conditional jsonb DEFAULT '{}'::jsonb)
 RETURNS SETOF pgmq.message_record
 LANGUAGE plpgsql
AS $function$
DECLARE
    sql TEXT;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
    sql := FORMAT(
        $QUERY$
        WITH cte AS
        (
            SELECT msg_id
            FROM pgmq.%I
            WHERE vt <= clock_timestamp() AND CASE
                WHEN %L != '{}'::jsonb THEN (message @> %2$L)::integer
                ELSE 1
            END = 1
            ORDER BY msg_id ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
        )
        UPDATE pgmq.%I m
        SET
            vt = clock_timestamp() + %L,
            read_ct = read_ct + 1
        FROM cte
        WHERE m.msg_id = cte.msg_id
        RETURNING m.msg_id, m.read_ct, m.enqueued_at, m.vt, m.message, m.headers;
        $QUERY$,
        qtable, conditional, qtable, make_interval(secs => vt)
    );
    RETURN QUERY EXECUTE sql USING qty;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq_public.read(queue_name text, sleep_seconds integer, n integer)
 RETURNS SETOF pgmq.message_record
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return query select * from pgmq.read( queue_name := queue_name, vt := sleep_seconds, qty := n , conditional := '{}'::jsonb ); end; $function$;

CREATE OR REPLACE FUNCTION pgmq.read_with_poll(queue_name text, vt integer, qty integer, max_poll_seconds integer DEFAULT 5, poll_interval_ms integer DEFAULT 100, conditional jsonb DEFAULT '{}'::jsonb)
 RETURNS SETOF pgmq.message_record
 LANGUAGE plpgsql
AS $function$
DECLARE
    r pgmq.message_record;
    stop_at TIMESTAMP;
    sql TEXT;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
    stop_at := clock_timestamp() + make_interval(secs => max_poll_seconds);
    LOOP
      IF (SELECT clock_timestamp() >= stop_at) THEN
        RETURN;
      END IF;

      sql := FORMAT(
          $QUERY$
          WITH cte AS
          (
              SELECT msg_id
              FROM pgmq.%I
              WHERE vt <= clock_timestamp() AND CASE
                  WHEN %L != '{}'::jsonb THEN (message @> %2$L)::integer
                  ELSE 1
              END = 1
              ORDER BY msg_id ASC
              LIMIT $1
              FOR UPDATE SKIP LOCKED
          )
          UPDATE pgmq.%I m
          SET
              vt = clock_timestamp() + %L,
              read_ct = read_ct + 1
          FROM cte
          WHERE m.msg_id = cte.msg_id
          RETURNING m.msg_id, m.read_ct, m.enqueued_at, m.vt, m.message, m.headers;
          $QUERY$,
          qtable, conditional, qtable, make_interval(secs => vt)
      );

      FOR r IN
        EXECUTE sql USING qty
      LOOP
        RETURN NEXT r;
      END LOOP;
      IF FOUND THEN
        RETURN;
      ELSE
        PERFORM pg_sleep(poll_interval_ms::numeric / 1000);
      END IF;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.realtime_topic_conversation_id(topic text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select nullif(split_part(topic, ':', 2), '')::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.receipt_events_enqueue_webhooks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_temp', 'public', 'auth', 'extensions'
AS $function$
BEGIN
  INSERT INTO public.receipt_webhook_outbox (tenant_id, webhook_id, event_id, status)
  SELECT NEW.tenant_id, w.id, NEW.id, 'pending'
  FROM public.receipt_webhooks w
  WHERE w.tenant_id = NEW.tenant_id
    AND (w.events IS NULL OR array_length(w.events,1) IS NULL OR NEW.type::text = ANY(w.events));
  RETURN NEW;
END;$function$;

CREATE OR REPLACE FUNCTION public.receipts_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_temp', 'public', 'auth', 'extensions'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'tenant:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text || ':receipts',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;$function$;

CREATE OR REPLACE FUNCTION public.reconcile_daily_billing(p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_account RECORD;
  v_result jsonb := '[]'::jsonb;
  v_expected DECIMAL(15, 2);
  v_actual DECIMAL(15, 2);
  v_discrepancy DECIMAL(15, 2);
BEGIN
  -- For each active billing account, reconcile usage vs Stripe
  FOR v_account IN
    SELECT DISTINCT ba.id, ba.stripe_customer_id, s.stripe_subscription_id
    FROM billing_accounts ba
    JOIN subscriptions s ON s.billing_account_id = ba.id
    WHERE ba.status = 'active'
      AND s.status = 'active'
      AND ba.deleted_at IS NULL
  LOOP
    -- Calculate expected bill from usage
    SELECT COALESCE(SUM(estimated_cost), 0) INTO v_expected
    FROM usage_aggregate_daily
    WHERE billing_account_id = v_account.id
      AND date = p_date;
    
    -- Get actual Stripe invoice amount (would need Stripe API call in practice)
    -- For now, we'll flag if usage exists but no invoice
    v_actual := NULL;
    
    -- Check if reconciliation already exists
    IF NOT EXISTS (
      SELECT 1 FROM billing_reconciliation_log
      WHERE billing_account_id = v_account.id
        AND reconciliation_type = 'daily'
        AND period_start::date = p_date
    ) THEN
      v_discrepancy := COALESCE(v_expected, 0) - COALESCE(v_actual, 0);
      
      INSERT INTO billing_reconciliation_log (
        billing_account_id,
        reconciliation_type,
        period_start,
        period_end,
        expected_amount,
        actual_amount,
        discrepancy_amount,
        status,
        stripe_subscription_id,
        details
      ) VALUES (
        v_account.id,
        'daily',
        p_date::timestamptz,
        (p_date + INTERVAL '1 day')::timestamptz,
        v_expected,
        v_actual,
        v_discrepancy,
        CASE 
          WHEN v_discrepancy > 0.01 THEN 'discrepancy'
          WHEN v_expected > 0 AND v_actual IS NULL THEN 'pending'
          ELSE 'reconciled'
        END,
        v_account.stripe_subscription_id,
        jsonb_build_object(
          'usage_events', (
            SELECT COUNT(*) FROM usage_events
            WHERE billing_account_id = v_account.id
              AND timestamp::date = p_date
          )
        )
      );
      
      v_result := v_result || jsonb_build_object(
        'billing_account_id', v_account.id,
        'status', CASE 
          WHEN v_discrepancy > 0.01 THEN 'discrepancy'
          WHEN v_expected > 0 AND v_actual IS NULL THEN 'pending'
          ELSE 'reconciled'
        END,
        'discrepancy', v_discrepancy
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'date', p_date,
    'accounts_checked', jsonb_array_length(v_result),
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_ai_usage(p_tenant_id uuid, p_billing_account_id uuid, p_event_type character varying, p_model_name character varying, p_cost_usd numeric, p_prompt_tokens integer DEFAULT NULL::integer, p_completion_tokens integer DEFAULT NULL::integer, p_total_tokens integer DEFAULT NULL::integer, p_cost_breakdown jsonb DEFAULT NULL::jsonb, p_latency_ms integer DEFAULT NULL::integer, p_success boolean DEFAULT true, p_error_message text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_event_id UUID;
  v_quota RECORD;
BEGIN
  -- Record usage event
  INSERT INTO ai_usage_events (
    tenant_id,
    billing_account_id,
    event_type,
    model_name,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    cost_usd,
    cost_breakdown,
    latency_ms,
    success,
    error_message,
    metadata
  ) VALUES (
    p_tenant_id,
    p_billing_account_id,
    p_event_type,
    p_model_name,
    p_prompt_tokens,
    p_completion_tokens,
    p_total_tokens,
    p_cost_usd,
    p_cost_breakdown,
    p_latency_ms,
    p_success,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  -- Update quotas
  UPDATE ai_usage_quotas
  SET daily_requests = daily_requests + 1,
      monthly_requests = monthly_requests + 1,
      daily_cost_usd = daily_cost_usd + p_cost_usd,
      monthly_cost_usd = monthly_cost_usd + p_cost_usd,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND billing_account_id = p_billing_account_id;

  -- Check if quota exceeded (for alerting)
  SELECT * INTO v_quota
  FROM ai_usage_quotas
  WHERE tenant_id = p_tenant_id
    AND billing_account_id = p_billing_account_id;

  -- Auto-suspend if cost limit exceeded significantly
  IF v_quota.daily_cost_usd > v_quota.daily_cost_limit_usd * 1.5 THEN
    UPDATE ai_usage_quotas
    SET suspended = true,
        suspended_reason = 'Daily cost limit exceeded by 50%',
        suspended_at = NOW()
    WHERE id = v_quota.id;

    -- Create alert
    INSERT INTO alerts (
      alert_type,
      severity,
      title,
      message,
      tenant_id,
      billing_account_id,
      metadata
    ) VALUES (
      'cost_threshold',
      'critical',
      'AI Usage Suspended',
      format('AI usage suspended due to cost limit exceeded. Daily cost: $%s (limit: $%s)',
        v_quota.daily_cost_usd,
        v_quota.daily_cost_limit_usd
      ),
      p_tenant_id,
      p_billing_account_id,
      jsonb_build_object(
        'daily_cost', v_quota.daily_cost_usd,
        'daily_limit', v_quota.daily_cost_limit_usd,
        'ai_usage_quota_id', v_quota.id
      )
    );
  END IF;

  RETURN v_event_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_circuit_breaker_failure(p_service_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_breaker RECORD;
  v_new_status VARCHAR;
BEGIN
  -- Get or create circuit breaker
  SELECT * INTO v_breaker
  FROM circuit_breakers
  WHERE service_name = p_service_name
  FOR UPDATE;
  
  IF v_breaker IS NULL THEN
    INSERT INTO circuit_breakers (service_name, status, failure_count, last_failure_at)
    VALUES (p_service_name, 'closed', 1, NOW())
    RETURNING * INTO v_breaker;
  ELSE
    -- Update failure count
    UPDATE circuit_breakers
    SET 
      failure_count = failure_count + 1,
      last_failure_at = NOW(),
      updated_at = NOW()
    WHERE id = v_breaker.id
    RETURNING * INTO v_breaker;
  END IF;
  
  -- Check if should open circuit
  IF v_breaker.status = 'closed' AND v_breaker.failure_count >= v_breaker.threshold_failures THEN
    v_new_status := 'open';
    UPDATE circuit_breakers
    SET 
      status = 'open',
      opened_at = NOW(),
      updated_at = NOW()
    WHERE id = v_breaker.id;
    
    -- Create alert
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'critical',
      format('Circuit Breaker Opened: %s', p_service_name),
      format('Circuit breaker opened for %s after %s failures', 
        p_service_name, v_breaker.failure_count),
      'circuit_breaker',
      jsonb_build_object(
        'service_name', p_service_name,
        'failure_count', v_breaker.failure_count,
        'opened_at', NOW()
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'service_name', p_service_name,
    'status', COALESCE(v_new_status, v_breaker.status),
    'failure_count', v_breaker.failure_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_circuit_breaker_success(p_service_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_breaker RECORD;
  v_new_status VARCHAR;
BEGIN
  SELECT * INTO v_breaker
  FROM circuit_breakers
  WHERE service_name = p_service_name
  FOR UPDATE;
  
  IF v_breaker IS NULL THEN
    -- First success, create breaker in closed state
    INSERT INTO circuit_breakers (service_name, status, success_count, last_success_at)
    VALUES (p_service_name, 'closed', 1, NOW())
    RETURNING * INTO v_breaker;
  ELSE
    -- Update success count
    UPDATE circuit_breakers
    SET 
      success_count = success_count + 1,
      failure_count = 0, -- Reset failure count on success
      last_success_at = NOW(),
      updated_at = NOW()
    WHERE id = v_breaker.id
    RETURNING * INTO v_breaker;
    
    -- Check if should close circuit (half-open -> closed)
    IF v_breaker.status = 'half_open' AND v_breaker.success_count >= v_breaker.threshold_successes THEN
      v_new_status := 'closed';
      UPDATE circuit_breakers
      SET 
        status = 'closed',
        opened_at = NULL,
        updated_at = NOW()
      WHERE id = v_breaker.id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'service_name', p_service_name,
    'status', COALESCE(v_new_status, v_breaker.status),
    'success_count', v_breaker.success_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_ledger_entry(p_tenant_id uuid, p_transaction_type character varying, p_entry_type character varying, p_amount_cents bigint, p_currency character varying, p_account_type character varying, p_reference_type character varying, p_reference_id character varying, p_idempotency_key character varying, p_description text, p_metadata jsonb, p_created_by uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_entry_id UUID;
BEGIN
  -- Check for existing entry with same idempotency key
  SELECT id INTO v_entry_id
  FROM financial_ledger
  WHERE tenant_id = p_tenant_id
    AND idempotency_key = p_idempotency_key;
  
  IF v_entry_id IS NOT NULL THEN
    -- Idempotent: return existing entry ID
    RETURN v_entry_id;
  END IF;
  
  -- Insert new entry
  INSERT INTO financial_ledger (
    tenant_id,
    transaction_type,
    entry_type,
    amount_cents,
    currency,
    account_type,
    reference_type,
    reference_id,
    idempotency_key,
    description,
    metadata,
    created_by
  ) VALUES (
    p_tenant_id,
    p_transaction_type,
    p_entry_type,
    p_amount_cents,
    p_currency,
    p_account_type,
    p_reference_type,
    p_reference_id,
    p_idempotency_key,
    p_description,
    p_metadata,
    p_created_by
  ) RETURNING id INTO v_entry_id;
  
  -- Update account balance
  INSERT INTO account_balances (tenant_id, account_type, currency, balance_cents, last_updated_at)
  VALUES (
    p_tenant_id,
    p_account_type,
    p_currency,
    calculate_account_balance(p_tenant_id, p_account_type, p_currency),
    NOW()
  )
  ON CONFLICT (tenant_id, account_type, currency)
  DO UPDATE SET
    balance_cents = calculate_account_balance(p_tenant_id, p_account_type, p_currency),
    last_updated_at = NOW();
  
  RETURN v_entry_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_reality_event(p_category character varying, p_event_name character varying, p_severity character varying DEFAULT 'info'::character varying, p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_id UUID; BEGIN
  INSERT INTO public.reality_events (category, event_name, severity, meta)
  VALUES (p_category, p_event_name, p_severity, p_meta)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $function$;

CREATE OR REPLACE FUNCTION app_private.redact_email(p text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select case when p is null then null else regexp_replace(p, '(^.).*(@.*$)', '\1***\2') end;
$function$;

CREATE OR REPLACE FUNCTION app_private.redact_text(p text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select case when p is null then null else left(p, 3) || '***' end;
$function$;

CREATE OR REPLACE FUNCTION analytics.refresh_stats()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'analytics', 'public'
AS $function$
begin
  insert into analytics.index_usage_snapshots(
    schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch, relpages, indisunique, indisprimary, pg_size_bytes
  )
  select n.nspname, c.relname, i.relname,
         coalesce(s.idx_scan,0), coalesce(s.idx_tup_read,0), coalesce(s.idx_tup_fetch,0),
         coalesce(s.relpages,0), ix.indisunique, ix.indisprimary, pg_relation_size(i.oid)
  from pg_class c
  join pg_index ix on ix.indrelid = c.oid
  join pg_class i on i.oid = ix.indexrelid
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_stat_all_indexes s on s.indexrelid = i.oid
  where c.relkind = 'r';
end;
$function$;

CREATE OR REPLACE FUNCTION analytics.refresh_stats_if_admin()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'analytics', 'public'
AS $function$
begin
  if (select coalesce((auth.jwt() ->> 'role') = 'admin', false)) then
    perform analytics.refresh_stats();
  else
    raise exception 'forbidden';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_usage_materialized_views()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_usage_daily_costs;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_users_count(p_tenant uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE v_period date; v_count integer;
BEGIN
  v_period := public.current_billing_period_start(p_tenant);
  SELECT count(*) INTO v_count
  FROM public.user_profiles up
  WHERE up.tenant_id = p_tenant AND COALESCE(up.is_active, true);

  INSERT INTO public.tenant_usage_monthly AS u (tenant_id, period_start, users_count)
  VALUES (p_tenant, v_period, v_count)
  ON CONFLICT (tenant_id, period_start) DO UPDATE
  SET users_count = EXCLUDED.users_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_ai_quotas()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_reset_count INTEGER;
BEGIN
  UPDATE ai_usage_quotas
  SET daily_requests = 0,
      daily_cost_usd = 0,
      daily_reset_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE daily_reset_date < CURRENT_DATE;

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  RETURN v_reset_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_monthly_ai_quotas()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_reset_count INTEGER;
BEGIN
  UPDATE ai_usage_quotas
  SET monthly_requests = 0,
      monthly_cost_usd = 0,
      monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE,
      updated_at = NOW()
  WHERE monthly_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE;

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  RETURN v_reset_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_insight(p_insight_id uuid, p_resolved_by uuid, p_resolution_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.ops_insights
  SET 
    status = 'resolved',
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    resolution_notes = p_resolution_notes,
    updated_at = NOW()
  WHERE id = p_insight_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.retry_failed_jobs()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_job RECORD;
  v_result jsonb := '[]'::jsonb;
  v_success_count INTEGER := 0;
  v_failure_count INTEGER := 0;
BEGIN
  -- Get jobs ready for retry
  FOR v_job IN
    SELECT *
    FROM job_failure_log
    WHERE status = 'pending_retry'
      AND next_retry_at <= NOW()
      AND retry_count < max_retries
    ORDER BY next_retry_at ASC
    LIMIT 10 -- Process max 10 at a time
  LOOP
    BEGIN
      -- Mark as retrying
      UPDATE job_failure_log
      SET status = 'retrying', updated_at = NOW()
      WHERE id = v_job.id;
      
      -- Trigger retry based on job type
      -- This is a placeholder - actual retry logic depends on job type
      -- For now, we'll mark it as resolved and let the actual job handle retries
      
      -- For agent runs, we can trigger via edge function
      IF v_job.job_type LIKE 'agent_%' THEN
        -- The agent orchestrator will handle retries
        UPDATE job_failure_log
        SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
        WHERE id = v_job.id;
        
        v_success_count := v_success_count + 1;
        v_result := v_result || jsonb_build_object(
          'job_id', v_job.id,
          'status', 'retry_triggered',
          'job_type', v_job.job_type
        );
      ELSE
        -- For other job types, mark as resolved (they'll retry naturally)
        UPDATE job_failure_log
        SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
        WHERE id = v_job.id;
        
        v_success_count := v_success_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_failure_count := v_failure_count + 1;
      v_result := v_result || jsonb_build_object(
        'job_id', v_job.id,
        'status', 'retry_failed',
        'error', SQLERRM
      );
      
      -- Mark as failed if max retries exceeded
      UPDATE job_failure_log
      SET status = 'failed', updated_at = NOW()
      WHERE id = v_job.id AND retry_count >= max_retries;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed', v_success_count + v_failure_count,
    'success', v_success_count,
    'failed', v_failure_count,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_membership_invite(p_tenant_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF NOT app_private.is_tenant_admin(p_tenant_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.memberships m
  SET status = 'removed', invite_token = NULL, invite_expires_at = NULL, updated_at = NOW()
  WHERE m.tenant_id = p_tenant_id AND m.user_id = p_user_id;
END;$function$;

CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$;

CREATE OR REPLACE FUNCTION public.rollup_usage_5m()
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'public', 'pg_temp'
AS $function$
  INSERT INTO public.usage_aggregate_daily(tenant_id, project_id, billing_account_id, integration_id, add_on_id, event_type, date, event_count, total_quantity)
  SELECT tenant_id, COALESCE(project_id, gen_random_uuid()), billing_account_id, integration_id, add_on_id, event_type, CURRENT_DATE,
         COUNT(*), SUM(quantity)
  FROM public.usage_events
  WHERE timestamp >= now() - interval '10 minutes'
  GROUP BY 1,2,3,4,5,6;
$function$;

CREATE OR REPLACE FUNCTION public.room_members_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'room:' || COALESCE(NEW.conversation_id, OLD.conversation_id)::text || ':members',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.room_messages_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'room:' || COALESCE(NEW.conversation_id, OLD.conversation_id)::text || ':messages',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_data_retention_cleanup()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  result jsonb := '{}'::jsonb;
  start_time timestamp;
  end_time timestamp;
BEGIN
  start_time := clock_timestamp();
  
  -- Run all cleanup functions
  BEGIN
    PERFORM cleanup_old_health_checks();
    result := result || jsonb_build_object('health_checks', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('health_checks', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_diagnostics();
    result := result || jsonb_build_object('diagnostics', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('diagnostics', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_alerts();
    result := result || jsonb_build_object('alerts', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('alerts', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_agent_runs();
    result := result || jsonb_build_object('agent_runs', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('agent_runs', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_usage_events();
    result := result || jsonb_build_object('usage_events', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('usage_events', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_audit_logs();
    result := result || jsonb_build_object('audit_logs', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('audit_logs', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_console_activities();
    result := result || jsonb_build_object('console_activities', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('console_activities', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_webhook_deliveries();
    result := result || jsonb_build_object('webhook_deliveries', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('webhook_deliveries', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_stripe_events();
    result := result || jsonb_build_object('stripe_events', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('stripe_events', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_expired_idempotency_keys();
    result := result || jsonb_build_object('idempotency_keys', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('idempotency_keys', SQLERRM);
  END;
  
  end_time := clock_timestamp();
  
  result := result || jsonb_build_object(
    'started_at', start_time,
    'completed_at', end_time,
    'duration_ms', EXTRACT(EPOCH FROM (end_time - start_time)) * 1000
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_retention_cleanups()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  cutoff timestamptz;
  keep_days int;
begin
  select days into keep_days from public.retention_policies where key = 'stripe_webhook_logs';
  if keep_days is not null then
    cutoff := now() - (keep_days || ' days')::interval;
    delete from public.stripe_webhook_logs where received_at < cutoff;
  end if;

  select days into keep_days from public.retention_policies where key = 'stripe_events';
  if keep_days is not null then
    cutoff := now() - (keep_days || ' days')::interval;
    delete from public.stripe_events where received_at < cutoff;
  end if;

  select days into keep_days from public.retention_policies where key = 'webhook_payloads';
  if keep_days is not null then
    cutoff := now() - (keep_days || ' days')::interval;
    delete from public.webhook_payloads where received_at < cutoff;
  end if;

  select days into keep_days from public.retention_policies where key = 'webhook_deliveries';
  if keep_days is not null then
    cutoff := now() - (keep_days || ' days')::interval;
    delete from public.webhook_deliveries where created_at < cutoff;
  end if;

  select days into keep_days from public.retention_policies where key = 'idempotency_keys';
  if keep_days is not null then
    cutoff := now() - (keep_days || ' days')::interval;
    delete from public.idempotency_keys where coalesce(expires_at, created_at) < cutoff;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION cron.schedule(job_name text, schedule text, command text)
 RETURNS bigint
 LANGUAGE c
AS '$libdir/pg_cron', $function$cron_schedule_named$function$;

CREATE OR REPLACE FUNCTION cron.schedule_in_database(job_name text, schedule text, command text, database text, username text DEFAULT NULL::text, active boolean DEFAULT true)
 RETURNS bigint
 LANGUAGE c
AS '$libdir/pg_cron', $function$cron_schedule_named$function$;

CREATE OR REPLACE FUNCTION public.seed_default_org(p_user_id uuid)
 RETURNS TABLE(user_id uuid, org_id uuid, is_default boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
begin
  -- Ensure inputs
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  -- Insert a default org if none exists
  insert into public.user_organizations (user_id, org_id, is_default)
  select p_user_id, gen_random_uuid(), true
  where not exists (
    select 1 from public.user_organizations
    where user_id = p_user_id and is_default = true
  );

  -- Return the current default row
  return query
  select uo.user_id, uo.org_id, uo.is_default, uo.created_at
  from public.user_organizations uo
  where uo.user_id = p_user_id and uo.is_default = true
  order by uo.created_at desc
  limit 1;
end;
$function$;

CREATE OR REPLACE FUNCTION pgmq.send(queue_name text, msg jsonb, headers jsonb, delay timestamp with time zone)
 RETURNS SETOF bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
    sql TEXT;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
    sql := FORMAT(
            $QUERY$
        INSERT INTO pgmq.%I (vt, message, headers)
        VALUES ($2, $1, $3)
        RETURNING msg_id;
        $QUERY$,
            qtable
           );
    RETURN QUERY EXECUTE sql USING msg, delay, headers;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq_public.send(queue_name text, message jsonb, sleep_seconds integer DEFAULT 0)
 RETURNS SETOF bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return query select * from pgmq.send( queue_name := queue_name, msg := message, delay := sleep_seconds ); end; $function$;

CREATE OR REPLACE FUNCTION pgmq.send_batch(queue_name text, msgs jsonb[], headers jsonb[], delay timestamp with time zone)
 RETURNS SETOF bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
    sql TEXT;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
    sql := FORMAT(
            $QUERY$
        INSERT INTO pgmq.%I (vt, message, headers)
        SELECT $2, unnest($1), unnest(coalesce($3, ARRAY[]::jsonb[]))
        RETURNING msg_id;
        $QUERY$,
            qtable
           );
    RETURN QUERY EXECUTE sql USING msgs, delay, headers;
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq_public.send_batch(queue_name text, messages jsonb[], sleep_seconds integer DEFAULT 0)
 RETURNS SETOF bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return query select * from pgmq.send_batch( queue_name := queue_name, msgs := messages, delay := sleep_seconds ); end; $function$;

CREATE OR REPLACE FUNCTION public.send_pending_alert_notifications()
 RETURNS TABLE(notification_id uuid, alert_id uuid, notification_type character varying, recipient text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_notification RECORD;
BEGIN
  -- Get pending notifications
  FOR v_notification IN
    SELECT an.*, a.title, a.message, a.severity
    FROM alert_notifications an
    JOIN alerts a ON a.id = an.alert_id
    WHERE an.status = 'pending'
    ORDER BY a.severity DESC, an.created_at ASC
    LIMIT 100
  LOOP
    -- Mark as sent (actual sending would be done by Edge Function)
    UPDATE alert_notifications
    SET status = 'sent',
        sent_at = NOW()
    WHERE id = v_notification.id;

    notification_id := v_notification.id;
    alert_id := v_notification.alert_id;
    notification_type := v_notification.notification_type;
    recipient := v_notification.recipient;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_default_org(p_user_id uuid, p_org_id uuid)
 RETURNS TABLE(user_id uuid, org_id uuid, is_default boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
begin
  if p_user_id is null or p_org_id is null then
    raise exception 'p_user_id and p_org_id are required';
  end if;

  -- Ensure the (user_id, org_id) membership exists
  if not exists (
    select 1 from public.user_organizations uo
    where uo.user_id = p_user_id and uo.org_id = p_org_id
  ) then
    insert into public.user_organizations (user_id, org_id, is_default)
    values (p_user_id, p_org_id, false);
  end if;

  -- Set the requested org as default; trigger will clear others
  update public.user_organizations
  set is_default = true
  where user_id = p_user_id and org_id = p_org_id;

  -- Return the current default row for verification
  return query
  select uo.user_id, uo.org_id, uo.is_default, uo.created_at
  from public.user_organizations uo
  where uo.user_id = p_user_id and uo.is_default = true
  order by uo.created_at desc
  limit 1;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_presence_status(p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;
  update public.user_presence
  set status = p_status, last_seen = now()
  where user_id = auth.uid();
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_tenant_context(tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  -- Set session variable for RLS policies
  PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION app_private.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END$function$;

CREATE OR REPLACE FUNCTION pgmq.set_vt(queue_name text, msg_id bigint, vt integer)
 RETURNS SETOF pgmq.message_record
 LANGUAGE plpgsql
AS $function$
DECLARE
    sql TEXT;
    result pgmq.message_record;
    qtable TEXT := pgmq.format_table_name(queue_name, 'q');
BEGIN
    sql := FORMAT(
        $QUERY$
        UPDATE pgmq.%I
        SET vt = (clock_timestamp() + %L)
        WHERE msg_id = %L
        RETURNING *;
        $QUERY$,
        qtable, make_interval(secs => vt), msg_id
    );
    RETURN QUERY EXECUTE sql;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_webhook_deliveries_tenant()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.tenant_id is null then
    select tenant_id into new.tenant_id from public.webhooks where id = new.webhook_id;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.tg_presence_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.touch_presence(p_status text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;
  insert into public.user_presence as up (user_id, last_seen, status)
  values (auth.uid(), now(), coalesce(p_status, 'online'))
  on conflict (user_id) do update
    set last_seen = now(),
        status = coalesce(p_status, up.status);
end;
$function$;

CREATE OR REPLACE FUNCTION public.track_onboarding_step_auto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  step_name TEXT;
BEGIN
  -- Determine onboarding step based on table and action
  IF TG_TABLE_NAME = 'api_keys' AND TG_OP = 'INSERT' THEN
    step_name := 'first_api_key';
  ELSIF TG_TABLE_NAME = 'reconciliation_jobs' AND TG_OP = 'INSERT' THEN
    step_name := 'first_job';
  ELSIF TG_TABLE_NAME = 'reconciliation_jobs' AND TG_OP = 'UPDATE' AND NEW.status = 'completed' THEN
    step_name := 'first_reconciliation';
  ELSIF TG_TABLE_NAME = 'receipts' AND TG_OP = 'INSERT' THEN
    step_name := 'first_receipt';
  ELSE
    RETURN NEW; -- Unknown table/action, skip
  END IF;

  -- Track the step
  INSERT INTO onboarding_progress (user_id, step, completed, updated_at)
  VALUES (
    COALESCE(NEW.user_id, (NEW.metadata->>'user_id')::UUID),
    step_name,
    TRUE,
    NOW()
  )
  ON CONFLICT (user_id, step) DO UPDATE
  SET completed = TRUE, updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if onboarding tracking fails
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$;

CREATE OR REPLACE FUNCTION cron.unschedule(job_name text)
 RETURNS boolean
 LANGUAGE c
 STRICT
AS '$libdir/pg_cron', $function$cron_unschedule_named$function$;

CREATE OR REPLACE FUNCTION public.update_email_sent(p_user_id uuid, p_email_type character varying)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  UPDATE profiles
  SET 
    last_email_sent_at = NOW(),
    last_email_type = p_email_type,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_email_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lead_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.score := calculate_lead_score(NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_onboarding_progress_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_positioning_impact_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.impact_score := calculate_positioning_impact_score(NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_profile_impact_from_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE profiles
    SET impact_score = impact_score + NEW.impact_score,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_receipts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_support_article_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_usage_counters_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_lifecycle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_reality_metric(p_category character varying, p_name character varying, p_value jsonb, p_status character varying DEFAULT 'assumed'::character varying, p_source character varying DEFAULT 'manual'::character varying, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_id UUID; BEGIN
  INSERT INTO public.reality_metrics (category, name, value, status, source, metadata, last_updated)
  VALUES (p_category, p_name, p_value, p_status, p_source, p_metadata, NOW())
  ON CONFLICT (category, name)
  DO UPDATE SET value = EXCLUDED.value,
                status = EXCLUDED.status,
                source = EXCLUDED.source,
                metadata = EXCLUDED.metadata,
                last_updated = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.upsert_stripe_customer(p_customer_id text, p_tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  insert into public.stripe_customers as sc (customer_id, tenant_id)
  values (p_customer_id, p_tenant_id)
  on conflict (customer_id) do update set tenant_id = excluded.tenant_id;

  insert into public.audit_logs (tenant_id, event, user_id, api_key_id, metadata)
  values (p_tenant_id, 'stripe_customer_upsert', auth.uid(), null,
          jsonb_build_object('customer_id', p_customer_id));
end;
$function$;

CREATE OR REPLACE FUNCTION app_private.usage_events_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'app_private', 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'tenant:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text,
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.usage_on_extractions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE v_period date; v_tenant uuid;
BEGIN
  v_tenant := NEW.tenant_id;
  IF v_tenant IS NULL AND NEW.upload_id IS NOT NULL THEN
    SELECT ba.tenant_id INTO v_tenant
    FROM public.receipt_uploads ru
    JOIN public.billing_accounts ba ON ba.id = ru.billing_account_id
    WHERE ru.id = NEW.upload_id;
  END IF;
  IF v_tenant IS NULL THEN RETURN NEW; END IF;

  v_period := public.current_billing_period_start(v_tenant);
  INSERT INTO public.tenant_usage_monthly AS u (tenant_id, period_start, extractions_count)
  VALUES (v_tenant, v_period, 1)
  ON CONFLICT (tenant_id, period_start) DO UPDATE SET
    extractions_count = u.extractions_count + 1;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.usage_on_receipt_uploads()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE v_period date; v_tenant uuid;
BEGIN
  v_tenant := NEW.tenant_id;
  IF v_tenant IS NULL THEN
    SELECT ba.tenant_id INTO v_tenant
    FROM public.billing_accounts ba
    WHERE ba.id = NEW.billing_account_id;
  END IF;
  IF v_tenant IS NULL THEN RETURN NEW; END IF;

  v_period := public.current_billing_period_start(v_tenant);
  INSERT INTO public.tenant_usage_monthly AS u (tenant_id, period_start, uploads_count, storage_bytes)
  VALUES (v_tenant, v_period, 1, COALESCE(NEW.size_bytes,0))
  ON CONFLICT (tenant_id, period_start) DO UPDATE SET
    uploads_count = u.uploads_count + 1,
    storage_bytes = u.storage_bytes + COALESCE(EXCLUDED.storage_bytes,0);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_data_integrity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_issue RECORD;
  v_result jsonb := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  -- Check for receipts with impossible values
  FOR v_issue IN
    SELECT id, total, subtotal, tax
    FROM receipts
    WHERE total IS NOT NULL
      AND subtotal IS NOT NULL
      AND tax IS NOT NULL
      AND ABS(total - (subtotal + tax)) > 0.01 -- More than 1 cent discrepancy
      AND created_at > NOW() - INTERVAL '7 days'
  LOOP
    v_count := v_count + 1;
    
    -- Flag as potential data integrity issue
    UPDATE receipts
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'integrity_warning', true,
      'discrepancy', ABS(v_issue.total - (v_issue.subtotal + v_issue.tax)),
      'flagged_at', NOW()
    )
    WHERE id = v_issue.id;
    
    v_result := v_result || jsonb_build_object(
      'receipt_id', v_issue.id,
      'issue', 'total_mismatch',
      'discrepancy', ABS(v_issue.total - (v_issue.subtotal + v_issue.tax))
    );
  END LOOP;
  
  -- Check for reconciliation results with impossible confidence
  FOR v_issue IN
    SELECT id, confidence_avg
    FROM recon_results
    WHERE confidence_avg IS NOT NULL
      AND (confidence_avg < 0 OR confidence_avg > 1)
  LOOP
    v_count := v_count + 1;
    
    -- Fix invalid confidence
    UPDATE recon_results
    SET confidence_avg = GREATEST(0, LEAST(1, confidence_avg))
    WHERE id = v_issue.id;
    
    v_result := v_result || jsonb_build_object(
      'recon_result_id', v_issue.id,
      'issue', 'invalid_confidence',
      'original_confidence', v_issue.confidence_avg
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'issues_found', v_count,
    'results', v_result
  );
END;
$function$;

CREATE OR REPLACE FUNCTION pgmq.validate_queue_name(queue_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF length(queue_name) >= 48 THEN
    RAISE EXCEPTION 'queue name is too long, maximum length is 48 characters';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_usage_event_server_side(p_billing_account_id uuid, p_event_type character varying, p_integration_id character varying DEFAULT NULL::character varying, p_add_on_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_billing_account RECORD;
  v_subscription RECORD;
  v_add_on_purchase RECORD;
BEGIN
  -- Check billing account exists and is active
  SELECT * INTO v_billing_account
  FROM billing_accounts
  WHERE id = p_billing_account_id
    AND status = 'active'
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check active subscription exists
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE billing_account_id = p_billing_account_id
    AND status = 'active'
    AND current_period_end > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Allow if in trial period
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE billing_account_id = p_billing_account_id
      AND status = 'trialing'
      AND trial_end > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN false;
    END IF;
  END IF;

  -- If add-on is specified, check if it's purchased
  IF p_add_on_id IS NOT NULL THEN
    SELECT * INTO v_add_on_purchase
    FROM add_on_purchases
    WHERE billing_account_id = p_billing_account_id
      AND add_on_id = p_add_on_id
      AND status = 'active';

    IF NOT FOUND THEN
      -- Add-on not purchased, cannot log usage
      RETURN false;
    END IF;
  END IF;

  -- If integration is specified, validate it's configured
  IF p_integration_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM integration_credentials ic
      JOIN billing_accounts ba ON ba.tenant_id = ic.tenant_id
      WHERE ba.id = p_billing_account_id
        AND ic.adapter = p_integration_id
    ) THEN
      -- Integration not configured, cannot log usage
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION net.wait_until_running()
 RETURNS void
 LANGUAGE c
AS 'pg_net', $function$wait_until_running$function$;

CREATE OR REPLACE FUNCTION net.wake()
 RETURNS void
 LANGUAGE c
AS 'pg_net', $function$wake$function$;

CREATE OR REPLACE FUNCTION public.webhook_deliveries_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE topic text;
BEGIN
  topic := 'webhook:' || COALESCE(NEW.webhook_id, OLD.webhook_id)::text || ':deliveries';
  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION net.worker_restart()
 RETURNS boolean
 LANGUAGE c
AS 'pg_net', $function$worker_restart$function$;

-- ============================================================================
-- END OF CANONICAL GOLDEN MIGRATION
-- ============================================================================

COMMIT;
